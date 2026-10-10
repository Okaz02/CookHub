import type { Ingredient, Step } from "../api-recipe";
import { getCutStyle, getHeatLevel, HEAT_ACTIONS } from "./constants";
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

// 材料を別の材料に重ねたときの言い方。a が重ねた材料（塩など）、b が重ねられた材料（肉など）
//   ni   … 「b に a を振る」     wo-ni … 「b を a に漬ける」
//   wo-de … 「b を a で和える」  ni-de … 「b に a で衣をつける」
const APPLY_PHRASES: Record<string, { te: string; pattern: "ni" | "wo-ni" | "wo-de" | "ni-de" }> = {
  振る: { te: "振り", pattern: "ni" },
  まぶす: { te: "まぶし", pattern: "ni" },
  揉み込む: { te: "揉み込み", pattern: "ni" },
  かける: { te: "かけ", pattern: "ni" },
  回しかける: { te: "回しかけ", pattern: "ni" },
  塗る: { te: "塗り", pattern: "ni" },
  のせる: { te: "のせ", pattern: "ni" },
  散らす: { te: "散らし", pattern: "ni" },
  添える: { te: "添え", pattern: "ni" },
  ふりかける: { te: "ふりかけ", pattern: "ni" },
  からめる: { te: "からめ", pattern: "ni" },
  しぼる: { te: "しぼり", pattern: "ni" },
  加える: { te: "加え", pattern: "ni" },
  漬ける: { te: "漬け", pattern: "wo-ni" },
  くぐらせる: { te: "くぐらせ", pattern: "wo-ni" },
  和える: { te: "和え", pattern: "wo-de" },
  衣をつける: { te: "衣をつけ", pattern: "ni-de" },
};

// withTarget が false のときは b を省く（同じ材料に続けて行うとき「豚肉に塩を振り、こしょうを振る」）
function applyClause(a: string, b: string, verb: string, withTarget: boolean): Clause {
  const phrase = APPLY_PHRASES[verb] ?? { te: verb, pattern: "ni" as const };
  const build = (form: string) => {
    switch (phrase.pattern) {
      case "ni":
        return `${withTarget ? `${b}に` : ""}${a}を${form}`;
      case "wo-ni":
        return `${withTarget ? `${b}を` : ""}${a}に${form}`;
      case "wo-de":
        return `${withTarget ? `${b}を` : ""}${a}で${form}`;
      case "ni-de":
        return `${withTarget ? `${b}に` : ""}${a}で${form}`;
    }
  };
  return { te: build(phrase.te), end: build(verb) };
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
    case "crackEgg":
    case "takeOut":
    case "heat":
    case "turnOff":
    case "drain":
    case "putLid":
    case "removeLid":
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
//   - 連続した「洗う」は1つの手順にまとめる（「玉ねぎ、にんじんを水で洗う。」）
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
  let pendingKind: "wash" | "cut" | "apply" | "tool" | null = null;
  let pendingToolId: string | null = null;
  // 材料を重ねる動作は、同じ材料に続けて行ったものを1つの手順にまとめる
  let pendingTargetId: string | null = null;
  // 器具ごとに、手順文の中でまだ名前を出していないかどうか。
  let mentionedTool = false;

  const flush = () => {
    if (pending.length > 0) bodies.push(joinClauses(pending));
    pending = [];
    pendingKind = null;
    pendingToolId = null;
    pendingTargetId = null;
    mentionedTool = false;
  };

  const events = snapshot.events;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];

    if (event.type === "moveToBoard") continue;

    if (event.type === "wash") {
      flush();
      const names = [lookup.ingredientName(event.ingredientId)];
      while (index + 1 < events.length) {
        const next = events[index + 1];
        if (next.type !== "wash") break;
        names.push(lookup.ingredientName(next.ingredientId));
        index += 1;
      }
      pendingKind = "wash";
      pending.push({ te: `${joinNames(names)}を水で洗い`, end: `${joinNames(names)}を水で洗う` });
      continue;
    }

    if (event.type === "applyIngredient") {
      const sameTarget = pendingKind === "apply" && pendingTargetId === event.targetId;
      if (!sameTarget) {
        flush();
        pendingKind = "apply";
        pendingTargetId = event.targetId;
      }
      pending.push(
        applyClause(
          lookup.ingredientName(event.ingredientId),
          lookup.ingredientName(event.targetId),
          event.action,
          !sameTarget
        )
      );
      continue;
    }

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
      case "crackEgg": {
        const lead = prefix ? `${prefix}に` : "";
        const name = lookup.ingredientName(event.ingredientId);
        pending.push({ te: `${lead}${name}を割り入れ`, end: `${lead}${name}を割り入れる` });
        mentionedTool = true;
        break;
      }
      case "takeOut": {
        // 同じ器具から続けて取り出した場合はまとめる。
        const names = [lookup.ingredientName(event.ingredientId)];
        while (index + 1 < events.length) {
          const next = events[index + 1];
          if (next.type !== "takeOut" || next.toolId !== event.toolId) break;
          names.push(lookup.ingredientName(next.ingredientId));
          index += 1;
        }
        const lead = prefix ? `${prefix}から` : "";
        pending.push({ te: `${lead}${joinNames(names)}を取り出し`, end: `${lead}${joinNames(names)}を取り出す` });
        mentionedTool = true;
        break;
      }
      case "heat": {
        const heat = heatPhrase(event.level, event.minutes);
        const fire = prefix ? `${prefix}を火にかけ、` : "";
        const heatAction = HEAT_ACTIONS.find((item) => item.verb === event.action);
        if (heatAction) {
          pending.push({ te: `${fire}${heat}${heatAction.te}`, end: `${fire}${heat}${heatAction.verb}` });
        } else if (event.withWater && event.boiled && event.ingredientIds.length === 0) {
          pending.push({ te: `${fire}${heat}加熱して沸騰させ`, end: `${fire}${heat}加熱して沸騰させる` });
        } else if (event.withWater) {
          pending.push({ te: `${fire}${heat}煮て`, end: `${fire}${heat}煮る` });
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
      case "drain": {
        const clause = event.withIngredients
          ? { te: "湯を切り", end: "湯を切る" }
          : { te: "水を捨て", end: "水を捨てる" };
        const lead = prefix ? `${prefix}の` : "";
        pending.push({ te: `${lead}${clause.te}`, end: `${lead}${clause.end}` });
        mentionedTool = true;
        break;
      }
      case "putLid": {
        const lead = prefix ? `${prefix}に` : "";
        pending.push({ te: `${lead}蓋をし`, end: `${lead}蓋をする` });
        mentionedTool = true;
        break;
      }
      case "removeLid": {
        const lead = prefix ? `${prefix}の` : "";
        pending.push({ te: `${lead}蓋を取り`, end: `${lead}蓋を取る` });
        mentionedTool = true;
        break;
      }
      case "toolAction": {
        const names = event.ingredientIds.map(lookup.ingredientName);
        const target = names.length > 0 ? `${joinNames(names)}を` : "";
        const count = event.count ? `${event.count}回` : "";
        const sentence = `${toolLabel(tool)}で${target}${count}${event.action}`;
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

// 選んだ動作が無ければ水の有無で決める
function heatHistoryVerb(event: Extract<CookEvent, { type: "heat" }>) {
  const heatAction = HEAT_ACTIONS.find((item) => item.verb === event.action);
  if (heatAction) return heatAction.past;
  return event.withWater ? "煮た" : "加熱した";
}

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
      case "wash":
        if (event.ingredientId === ingredientId) {
          entries.push({ id: event.id, icon: "water-drop", text: "水で洗った" });
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
      case "applyIngredient":
        if (event.targetId === ingredientId) {
          const name = snapshot.ingredients.find((item) => item.id === event.ingredientId)?.name ?? "材料";
          entries.push({ id: event.id, icon: "add-circle-outline", text: `${name}を${event.action}` });
        } else if (event.ingredientId === ingredientId) {
          const name = snapshot.ingredients.find((item) => item.id === event.targetId)?.name ?? "材料";
          entries.push({ id: event.id, icon: "add-circle-outline", text: `${name}に使った（${event.action}）` });
        }
        break;
      case "crackEgg":
        if (event.ingredientId === ingredientId) {
          entries.push({ id: event.id, icon: "egg", text: `${toolName(event.toolId)}に割り入れた` });
        }
        break;
      case "takeOut":
        if (event.ingredientId === ingredientId) {
          entries.push({ id: event.id, icon: "output", text: `${toolName(event.toolId)}から取り出した` });
        }
        break;
      case "heat":
        if (event.ingredientIds.includes(ingredientId)) {
          entries.push({
            id: event.id,
            icon: "local-fire-department",
            text: `${toolName(event.toolId)}で${heatPhrase(event.level, event.minutes)}${heatHistoryVerb(event)}`,
          });
        }
        break;
      case "toolAction":
        if (event.ingredientIds.includes(ingredientId)) {
          const count = event.count ? `（${event.count}回）` : "";
          entries.push({ id: event.id, icon: "build", text: `${toolName(event.toolId)}で「${event.action}」${count}` });
        }
        break;
      default:
        break;
    }
  }
  return entries;
}
