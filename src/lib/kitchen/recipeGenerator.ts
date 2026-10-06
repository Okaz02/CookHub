import type { Ingredient, Step } from "../api-recipe";
import { getCutStyle, getHeatLevel } from "./constants";
import type { KitchenSnapshot } from "./reducer";
import type { CookEvent, CutResult, HeatLevel, KitchenTool } from "./types";

// 文をつなげるための「連用形（〜し、）」と「終止形（〜する。）」の組。
type Clause = { te: string; end: string };

export function describeCut(cut: CutResult): Clause {
  if (cut.style === "width") {
    const width = formatNumber(cut.widthCm ?? 1);
    return { te: `${width}cm幅に切り`, end: `${width}cm幅に切る` };
  }
  const style = getCutStyle(cut.style);
  return { te: style.phraseTe, end: style.phrase };
}

export function getCutLabel(cut: CutResult): string {
  if (cut.style === "width") return `${formatNumber(cut.widthCm ?? 1)}cm幅`;
  return getCutStyle(cut.style).label;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
}

// 「千切りにする」→「千切りにした」、「1cm幅に切る」→「1cm幅に切った」
function toPast(phrase: string) {
  if (phrase.endsWith("する")) return `${phrase.slice(0, -2)}した`;
  if (phrase.endsWith("切る")) return `${phrase.slice(0, -2)}切った`;
  return phrase;
}

function joinNames(names: string[]) {
  return names.join("、");
}

function joinClauses(clauses: Clause[]): string {
  if (clauses.length === 0) return "";
  const head = clauses.slice(0, -1).map((clause) => clause.te);
  return [...head, clauses[clauses.length - 1].end].join("、") + "。";
}

function heatPhrase(level: HeatLevel, minutes: number) {
  return `${getHeatLevel(level).label}で${formatNumber(minutes)}分`;
}

// イベントがどの器具に関するものか（同じ器具の操作は1つの手順にまとめる）。
function eventToolId(event: CookEvent): string | null {
  switch (event.type) {
    case "placeOnBurner":
    case "addWater":
    case "addIngredient":
    case "heat":
    case "turnOff":
    case "toolAction":
      return event.toolId;
    default:
      return null;
  }
}

type Lookup = {
  ingredientName: (id: string) => string;
  tool: (id: string) => KitchenTool | undefined;
};

function toolLabel(tool: KitchenTool | undefined) {
  return tool?.name ?? "器具";
}

// 手順の生成ルール
//   - 連続した「切る」は1つの手順にまとめる（「玉ねぎは千切りにし、にんじんは乱切りにする。」）
//   - 同じ器具への操作（水を入れる・材料を入れる・加熱）は加熱が終わるまで1つの手順にまとめる
//   - 器具を使った動作（炒める・混ぜるなど）はそれぞれ1つの手順にする
export function generateSteps(snapshot: KitchenSnapshot): Step[] {
  const lookup: Lookup = {
    ingredientName: (id) => snapshot.ingredients.find((item) => item.id === id)?.name ?? "材料",
    tool: (id) => snapshot.tools.find((tool) => tool.id === id),
  };

  const bodies: string[] = [];
  let pending: Clause[] = [];
  let pendingKind: "cut" | "tool" | null = null;
  let pendingToolId: string | null = null;
  // 器具ごとに、手順文の中でまだ名前を出していないかどうか。
  let mentionedTool = false;

  const flush = () => {
    if (pending.length > 0) bodies.push(joinClauses(pending));
    pending = [];
    pendingKind = null;
    pendingToolId = null;
    mentionedTool = false;
  };

  const events = snapshot.events;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];

    if (event.type === "moveToBoard") continue;

    if (event.type === "cut") {
      if (pendingKind !== "cut") flush();
      pendingKind = "cut";
      const clause = describeCut(event.cut);
      const name = lookup.ingredientName(event.ingredientId);
      pending.push({ te: `${name}は${clause.te}`, end: `${name}は${clause.end}` });
      continue;
    }

    const toolId = eventToolId(event);
    if (pendingKind !== "tool" || pendingToolId !== toolId) {
      flush();
      pendingKind = "tool";
      pendingToolId = toolId;
    }
    const tool = toolId ? lookup.tool(toolId) : undefined;
    const prefix = mentionedTool ? "" : toolLabel(tool);

    switch (event.type) {
      case "placeOnBurner":
        // コンロに置いただけでは手順にしない（加熱のときに「火にかける」で表現する）。
        break;
      case "addWater":
      {
        const lead = prefix ? `${prefix}に` : "さらに";
        pending.push({
          te: `${lead}水${formatNumber(event.ml)}mlを入れ`,
          end: `${lead}水${formatNumber(event.ml)}mlを入れる`,
        });
      }
        mentionedTool = true;
        break;
      case "addIngredient": {
        // 同じ器具に続けて材料を入れた場合はまとめる。
        const names = [lookup.ingredientName(event.ingredientId)];
        while (index + 1 < events.length) {
          const next = events[index + 1];
          if (next.type !== "addIngredient" || next.toolId !== event.toolId) break;
          names.push(lookup.ingredientName(next.ingredientId));
          index += 1;
        }
        const lead = event.intoBoiling ? "沸騰したら" : prefix ? `${prefix}に` : "";
        pending.push({
          te: `${lead}${joinNames(names)}を入れ`,
          end: `${lead}${joinNames(names)}を入れる`,
        });
        mentionedTool = true;
        break;
      }
      case "heat": {
        const heat = heatPhrase(event.level, event.minutes);
        const fire = prefix ? `${prefix}を火にかけ、` : "";
        if (event.withWater && event.boiled && event.ingredientIds.length === 0) {
          pending.push({ te: `${fire}${heat}加熱して沸騰させ`, end: `${fire}${heat}加熱して沸騰させる` });
        } else if (event.withWater) {
          pending.push({ te: `${fire}${heat}煮`, end: `${fire}${heat}煮る` });
        } else {
          pending.push({ te: `${fire}${heat}加熱し`, end: `${fire}${heat}加熱する` });
        }
        // 加熱の直後に火を止めた場合は同じ手順にまとめる（「〜煮、火を止める。」）。
        const next = events[index + 1];
        if (next?.type === "turnOff" && next.toolId === event.toolId) {
          pending.push({ te: "火を止め", end: "火を止める" });
          index += 1;
        }
        flush();
        break;
      }
      case "turnOff":
        pending.push({ te: "火を止め", end: "火を止める" });
        flush();
        break;
      case "toolAction": {
        const names = event.ingredientIds.map(lookup.ingredientName);
        const target = names.length > 0 ? `${joinNames(names)}を` : "";
        const heat = event.level && event.minutes ? `${heatPhrase(event.level, event.minutes)}` : "";
        const sentence = `${toolLabel(tool)}で${target}${heat}${event.action}`;
        pending.push({ te: sentence, end: sentence });
        flush();
        break;
      }
    }
  }
  flush();

  return bodies.map((body) => ({ body, image_url: null }));
}

export function generateIngredients(snapshot: KitchenSnapshot): Ingredient[] {
  return snapshot.ingredients.map(({ name, amount, unit }) => ({ name, amount, unit }));
}

// 材料にフォーカスしたときに表示する「この材料に何をしたか」の一覧。
export type IngredientHistoryEntry = {
  id: string;
  icon: string;
  text: string;
};

export function getIngredientHistory(snapshot: KitchenSnapshot, ingredientId: string): IngredientHistoryEntry[] {
  const toolName = (id: string) => toolLabel(snapshot.tools.find((tool) => tool.id === id));
  const entries: IngredientHistoryEntry[] = [];
  for (const event of snapshot.events) {
    switch (event.type) {
      case "moveToBoard":
        if (event.ingredientId === ingredientId) {
          entries.push({ id: event.id, icon: "pan-tool", text: "まな板に置いた" });
        }
        break;
      case "cut":
        if (event.ingredientId === ingredientId) {
          entries.push({ id: event.id, icon: "content-cut", text: toPast(describeCut(event.cut).end) });
        }
        break;
      case "addIngredient":
        if (event.ingredientId === ingredientId) {
          entries.push({
            id: event.id,
            icon: "input",
            text: `${toolName(event.toolId)}に入れた${event.intoBoiling ? "（沸騰したお湯）" : ""}`,
          });
        }
        break;
      case "heat":
        if (event.ingredientIds.includes(ingredientId)) {
          entries.push({
            id: event.id,
            icon: "local-fire-department",
            text: `${toolName(event.toolId)}で${heatPhrase(event.level, event.minutes)}${event.withWater ? "煮た" : "加熱した"}`,
          });
        }
        break;
      case "toolAction":
        if (event.ingredientIds.includes(ingredientId)) {
          const heat = event.level && event.minutes ? `（${heatPhrase(event.level, event.minutes)}）` : "";
          entries.push({
            id: event.id,
            icon: "build",
            text: `${toolName(event.toolId)}で「${event.action}」${heat}`,
          });
        }
        break;
      default:
        break;
    }
  }
  return entries;
}
