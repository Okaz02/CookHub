import { INITIAL_BURNER_COUNT, isHeatAction, MAX_BURNER_COUNT } from "./constants";
import { getCatalogEntry, TOOL_CATALOG, type ToolCatalogId } from "./toolCatalog";
import type {
  CookEvent,
  CustomToolDefinition,
  CutResult,
  HeatLevel,
  IngredientImage,
  KitchenIngredient,
  KitchenTool,
} from "./types";

export type KitchenSnapshot = {
  ingredients: KitchenIngredient[];
  tools: KitchenTool[];
  events: CookEvent[];
  burnerCount: number;
};

export type KitchenState = {
  present: KitchenSnapshot;
  past: KitchenSnapshot[];
};

export type IngredientSeed = {
  name: string;
  amount: string;
  unit: string;
  image: IngredientImage | null;
};

export type KitchenAction =
  | { type: "moveIngredient"; ingredientId: string; to: "shelf" | "board" }
  | { type: "cut"; ingredientId: string; cut: CutResult }
  | { type: "placeOnBurner"; toolId: string; burner: number }
  // 器具を器具置き場か調理台に置く（コンロやシンクから下ろす・蓋を外すときも）
  | { type: "putDownTool"; toolId: string; to: "rack" | "counter" }
  | { type: "placeInSink"; toolId: string }
  | { type: "addWater"; toolId: string; ml: number }
  | { type: "addIngredientToTool"; toolId: string; ingredientId: string }
  | { type: "heat"; toolId: string; level: HeatLevel; minutes: number; action?: string }
  | { type: "turnOff"; toolId: string }
  | { type: "addBurner" }
  | { type: "wash"; ingredientId: string }
  | { type: "drain"; toolId: string }
  | { type: "putLid"; lidId: string; toolId: string }
  | {
      type: "toolAction";
      toolId: string;
      ingredientId?: string;
      action: string;
      putInside: boolean;
    }
  | { type: "addCustomTool"; definition: CustomToolDefinition }
  | { type: "undo" };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const HISTORY_LIMIT = 50;

let idSeed = 0;
export function createId(prefix: string) {
  idSeed += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeed}`;
}

export function createBaseTools(): KitchenTool[] {
  return (Object.keys(TOOL_CATALOG) as ToolCatalogId[]).map((id) => {
    const entry = getCatalogEntry(id);
    const tool = {
      id,
      catalogId: id,
      name: entry.name,
      location: { area: "rack" } as const,
      waterMl: 0,
      heat: null,
      boiling: false,
    };
    if (entry.kind !== "vessel" && entry.kind !== "utensil") return { ...tool, kind: entry.kind };
    // 器と道具は、ユーザーが追加する器具と同じ仕組み（definition の動作）で扱う
    return {
      ...tool,
      kind: "custom",
      definition: {
        id,
        name: entry.name,
        actions: entry.actions ?? [],
        // 写真で描くので見た目の設定は使わない
        appearance: { shape: "circle", color: "#3a3a3a", icon: "outdoor-grill" },
        container: entry.kind === "vessel",
        heatable: Boolean(entry.heatable),
      },
    };
  });
}

export function customToolFromDefinition(definition: CustomToolDefinition): KitchenTool {
  return {
    id: createId("tool"),
    kind: "custom",
    name: definition.name,
    definition,
    location: { area: "rack" },
    waterMl: 0,
    heat: null,
    boiling: false,
  };
}

export function createInitialState(
  seeds: IngredientSeed[],
  customTools: CustomToolDefinition[] = []
): KitchenState {
  return {
    past: [],
    present: {
      ingredients: seeds.map((seed) => ({
        ...seed,
        id: createId("ing"),
        location: { area: "shelf" },
        cut: null,
      })),
      tools: [...createBaseTools(), ...customTools.map(customToolFromDefinition)],
      events: [],
      burnerCount: INITIAL_BURNER_COUNT,
    },
  };
}

// 材料を入れられる器具か（鍋は常に入れられる）。
export function isContainer(tool: KitchenTool) {
  return tool.kind === "pot" || (tool.kind === "custom" && Boolean(tool.definition?.container));
}

// 器具の動作のうち、コンロの火で行うもの（加熱シートで選ぶ）
export function heatActionsOf(tool: KitchenTool) {
  return (tool.definition?.actions ?? []).filter(isHeatAction);
}

// 器具の動作のうち、火を使わないもの（器具の動作シートで選ぶ）
export function handActionsOf(tool: KitchenTool) {
  return (tool.definition?.actions ?? []).filter((action) => !isHeatAction(action));
}

// コンロに乗せられる器具か。
export function isHeatable(tool: KitchenTool) {
  return tool.kind === "pot" || (tool.kind === "custom" && Boolean(tool.definition?.heatable));
}

// 蓋をかぶせられる器具か
export function acceptsLid(tool: KitchenTool) {
  return tool.catalogId ? Boolean(getCatalogEntry(tool.catalogId).acceptsLid) : false;
}

// その器具にかぶせてある蓋
export function lidOn(snapshot: KitchenSnapshot, toolId: string) {
  return snapshot.tools.find((tool) => tool.location.area === "onTool" && tool.location.toolId === toolId);
}

// シンクに置いてある器具
export function toolInSink(snapshot: KitchenSnapshot) {
  return snapshot.tools.find((tool) => tool.location.area === "sink");
}

export function ingredientsInTool(snapshot: KitchenSnapshot, toolId: string) {
  return snapshot.ingredients.filter(
    (item) => item.location.area === "tool" && item.location.toolId === toolId
  );
}

export function toolOnBurner(snapshot: KitchenSnapshot, burner: number) {
  return snapshot.tools.find((tool) => tool.location.area === "burner" && tool.location.index === burner);
}

function updateTool(snapshot: KitchenSnapshot, toolId: string, patch: Partial<KitchenTool>): KitchenTool[] {
  return snapshot.tools.map((tool) => (tool.id === toolId ? { ...tool, ...patch } : tool));
}

function withEvent(snapshot: KitchenSnapshot, event: DistributiveOmit<CookEvent, "id">): CookEvent[] {
  return [...snapshot.events, { ...event, id: createId("ev") } as CookEvent];
}

function apply(snapshot: KitchenSnapshot, action: Exclude<KitchenAction, { type: "undo" }>): KitchenSnapshot | null {
  switch (action.type) {
    case "moveIngredient": {
      const ingredient = snapshot.ingredients.find((item) => item.id === action.ingredientId);
      if (!ingredient || ingredient.location.area === action.to) return null;
      if (ingredient.location.area === "tool") {
        // 器具から出した材料はまな板に置く（調理した材料は棚には戻さない）
        if (action.to !== "board") return null;
        return {
          ...snapshot,
          ingredients: snapshot.ingredients.map((item) =>
            item.id === ingredient.id ? { ...item, location: { area: "board" } } : item
          ),
          events: withEvent(snapshot, {
            type: "takeOut",
            toolId: ingredient.location.toolId,
            ingredientId: ingredient.id,
          }),
        };
      }
      return {
        ...snapshot,
        ingredients: snapshot.ingredients.map((item) =>
          item.id === action.ingredientId ? { ...item, location: { area: action.to } } : item
        ),
        events:
          action.to === "board"
            ? withEvent(snapshot, { type: "moveToBoard", ingredientId: action.ingredientId })
            : snapshot.events,
      };
    }
    case "cut": {
      return {
        ...snapshot,
        ingredients: snapshot.ingredients.map((item) =>
          item.id === action.ingredientId ? { ...item, cut: action.cut } : item
        ),
        events: withEvent(snapshot, { type: "cut", ingredientId: action.ingredientId, cut: action.cut }),
      };
    }
    case "placeOnBurner": {
      const tool = snapshot.tools.find((item) => item.id === action.toolId);
      if (!tool || !isHeatable(tool)) return null;
      const occupant = toolOnBurner(snapshot, action.burner);
      if (occupant && occupant.id !== tool.id) return null;
      if (tool.location.area === "burner" && tool.location.index === action.burner) return null;
      return {
        ...snapshot,
        tools: updateTool(snapshot, tool.id, { location: { area: "burner", index: action.burner } }),
        events: withEvent(snapshot, { type: "placeOnBurner", toolId: tool.id, burner: action.burner }),
      };
    }
    case "putDownTool": {
      const tool = snapshot.tools.find((item) => item.id === action.toolId);
      if (!tool || tool.location.area === action.to) return null;
      const location = { area: action.to } as const;
      // かぶせてあった蓋を外す
      if (tool.location.area === "onTool") {
        return {
          ...snapshot,
          tools: updateTool(snapshot, tool.id, { location }),
          events: withEvent(snapshot, { type: "removeLid", toolId: tool.location.toolId, lidId: tool.id }),
        };
      }
      // 火がついたまま下ろした場合は火を止めたことにする。
      const events = tool.heat ? withEvent(snapshot, { type: "turnOff", toolId: tool.id }) : snapshot.events;
      return {
        ...snapshot,
        tools: updateTool(snapshot, tool.id, { location, heat: null, boiling: false }),
        events,
      };
    }
    case "addWater": {
      const tool = snapshot.tools.find((item) => item.id === action.toolId);
      if (!tool || !isContainer(tool) || action.ml <= 0) return null;
      return {
        ...snapshot,
        // 沸騰中に水を足すと一度沸騰が止まる。
        tools: updateTool(snapshot, tool.id, { waterMl: tool.waterMl + action.ml, boiling: false }),
        events: withEvent(snapshot, { type: "addWater", toolId: tool.id, ml: action.ml }),
      };
    }
    case "addIngredientToTool": {
      const tool = snapshot.tools.find((item) => item.id === action.toolId);
      const ingredient = snapshot.ingredients.find((item) => item.id === action.ingredientId);
      if (!tool || !ingredient || !isContainer(tool)) return null;
      if (ingredient.location.area === "tool" && ingredient.location.toolId === tool.id) return null;
      return {
        ...snapshot,
        ingredients: snapshot.ingredients.map((item) =>
          item.id === ingredient.id ? { ...item, location: { area: "tool", toolId: tool.id } } : item
        ),
        events: withEvent(snapshot, {
          type: "addIngredient",
          toolId: tool.id,
          ingredientId: ingredient.id,
          intoBoiling: tool.boiling,
        }),
      };
    }
    case "heat": {
      const tool = snapshot.tools.find((item) => item.id === action.toolId);
      if (!tool || tool.location.area !== "burner" || action.minutes <= 0) return null;
      const withWater = tool.waterMl > 0;
      const contents = ingredientsInTool(snapshot, tool.id).map((item) => item.id);
      return {
        ...snapshot,
        tools: updateTool(snapshot, tool.id, {
          heat: { level: action.level, minutes: action.minutes },
          boiling: withWater,
        }),
        events: withEvent(snapshot, {
          type: "heat",
          toolId: tool.id,
          level: action.level,
          minutes: action.minutes,
          action: action.action,
          ingredientIds: contents,
          withWater,
          // 加熱前から沸騰していた場合は「沸騰させる」ではなく「煮る」扱い。
          boiled: withWater && !tool.boiling,
        }),
      };
    }
    case "turnOff": {
      const tool = snapshot.tools.find((item) => item.id === action.toolId);
      if (!tool || !tool.heat) return null;
      return {
        ...snapshot,
        tools: updateTool(snapshot, tool.id, { heat: null, boiling: false }),
        events: withEvent(snapshot, { type: "turnOff", toolId: tool.id }),
      };
    }
    case "placeInSink": {
      const tool = snapshot.tools.find((item) => item.id === action.toolId);
      // 火にかけたままは運べない。シンクには1つだけ置ける
      if (!tool || !isContainer(tool) || tool.heat || toolInSink(snapshot)) return null;
      return { ...snapshot, tools: updateTool(snapshot, tool.id, { location: { area: "sink" }, boiling: false }) };
    }
    case "addBurner": {
      if (snapshot.burnerCount >= MAX_BURNER_COUNT) return null;
      return { ...snapshot, burnerCount: snapshot.burnerCount + 1 };
    }
    case "wash": {
      const ingredient = snapshot.ingredients.find((item) => item.id === action.ingredientId);
      if (!ingredient || ingredient.location.area === "tool") return null;
      return { ...snapshot, events: withEvent(snapshot, { type: "wash", ingredientId: ingredient.id }) };
    }
    case "drain": {
      const tool = snapshot.tools.find((item) => item.id === action.toolId);
      if (!tool || tool.waterMl === 0) return null;
      return {
        ...snapshot,
        tools: updateTool(snapshot, tool.id, { waterMl: 0, boiling: false }),
        events: withEvent(snapshot, {
          type: "drain",
          toolId: tool.id,
          withIngredients: ingredientsInTool(snapshot, tool.id).length > 0,
        }),
      };
    }
    case "putLid": {
      const lid = snapshot.tools.find((item) => item.id === action.lidId);
      const tool = snapshot.tools.find((item) => item.id === action.toolId);
      if (!lid || !tool || lid.kind !== "lid" || !acceptsLid(tool)) return null;
      if (lidOn(snapshot, tool.id)) return null;
      return {
        ...snapshot,
        tools: updateTool(snapshot, lid.id, { location: { area: "onTool", toolId: tool.id } }),
        events: withEvent(snapshot, { type: "putLid", toolId: tool.id, lidId: lid.id }),
      };
    }
    case "toolAction": {
      const tool = snapshot.tools.find((item) => item.id === action.toolId);
      if (!tool) return null;
      const container = isContainer(tool);
      let ingredients = snapshot.ingredients;
      if (action.ingredientId && action.putInside && container) {
        ingredients = ingredients.map((item) =>
          item.id === action.ingredientId ? { ...item, location: { area: "tool", toolId: tool.id } } : item
        );
      }
      // 器具の中で動作したときは中身すべてが対象、外で使ったときはその材料だけが対象。
      const targetIds =
        container && (action.putInside || !action.ingredientId)
          ? ingredients
              .filter((item) => item.location.area === "tool" && item.location.toolId === tool.id)
              .map((item) => item.id)
          : action.ingredientId
            ? [action.ingredientId]
            : [];
      return {
        ...snapshot,
        ingredients,
        events: withEvent(snapshot, {
          type: "toolAction",
          toolId: tool.id,
          ingredientIds: targetIds,
          action: action.action,
        }),
      };
    }
    case "addCustomTool": {
      return { ...snapshot, tools: [...snapshot.tools, customToolFromDefinition(action.definition)] };
    }
  }
}

export function kitchenReducer(state: KitchenState, action: KitchenAction): KitchenState {
  if (action.type === "undo") {
    const previous = state.past[state.past.length - 1];
    if (!previous) return state;
    return { present: previous, past: state.past.slice(0, -1) };
  }
  const next = apply(state.present, action);
  if (!next) return state;
  return { present: next, past: [...state.past, state.present].slice(-HISTORY_LIMIT) };
}
