import type { ImageRequireSource } from "react-native";
import type { ToolCatalogId } from "./toolCatalog";

// キッチンエディターで扱うデータの型。
// 画面上の操作はすべて CookEvent として記録し、そこからレシピの手順文を生成する。

// catalog はアプリに入れてある材料の写真（ingredientCatalog）
export type ImageSource = "catalog" | "google" | "wikimedia" | "wikipedia" | "removebg" | "emoji";

export type IngredientImage = {
  // emoji の場合は uri の代わりに emoji を使って描画する。catalog の場合は asset を使う。
  uri?: string;
  asset?: ImageRequireSource;
  emoji?: string;
  // 背景が透過済み（または透過の可能性が高い）かどうか。false の場合は丸く切り抜いて表示する。
  transparent: boolean;
  source: ImageSource;
};

export type IngredientLocation =
  | { area: "shelf" }
  | { area: "board" }
  | { area: "tool"; toolId: string };

export type CutStyleId =
  | "sengiri"
  | "rangiri"
  | "mijin"
  | "wagiri"
  | "hangetsu"
  | "icho"
  | "kushigata"
  | "kakugiri"
  | "width";

export type CutResult = {
  style: CutStyleId;
  // style が "width" のときだけ使う（「◯cmずつ切る」）。
  widthCm?: number;
};

export type KitchenIngredient = {
  id: string;
  name: string;
  amount: string;
  unit: string;
  image: IngredientImage | null;
  location: IngredientLocation;
  cut: CutResult | null;
};

export type HeatLevel = "low" | "mediumLow" | "medium" | "high";

export type ToolShape = "circle" | "square" | "rect";

export type ToolAppearance = {
  shape: ToolShape;
  color: string;
  // MaterialIcons のアイコン名
  icon: string;
};

// ユーザーが自分で追加する器具の定義。ベースにない器具はすべてこれで表現する。
export type CustomToolDefinition = {
  id: string;
  name: string;
  // 「炒める」「混ぜる」のような、その器具でできる動作（終止形）。
  actions: string[];
  appearance: ToolAppearance;
  // 材料を中に入れられるか（ボウル・フライパンなど）。
  container: boolean;
  // コンロに乗せて加熱できるか。
  heatable: boolean;
};

export type ToolKind = "knife" | "water" | "pot" | "lid" | "custom";

export type ToolLocation =
  // 器具置き場（上の段）
  | { area: "rack" }
  // 調理台（器具を置いて作業する場所）
  | { area: "counter" }
  | { area: "burner"; index: number }
  // シンクの蛇口の下に置いているとき（1つまで）
  | { area: "sink" }
  // 蓋をフライパンなどにかぶせているとき
  | { area: "onTool"; toolId: string };

export type ActiveHeat = {
  level: HeatLevel;
  minutes: number;
};

export type KitchenTool = {
  id: string;
  kind: ToolKind;
  name: string;
  location: ToolLocation;
  definition?: CustomToolDefinition;
  // 最初から置いてある器具（toolCatalog）なら、その項目。写真で描く。
  // ユーザーが追加した器具には無く、図形で描く。
  catalogId?: ToolCatalogId;
  // 中に入っている水の量（ml）。
  waterMl: number;
  // コンロの火がついているときの火加減。
  heat: ActiveHeat | null;
  boiling: boolean;
};

type EventBase = { id: string };

export type CookEvent = EventBase &
  (
    | { type: "moveToBoard"; ingredientId: string }
    | { type: "cut"; ingredientId: string; cut: CutResult }
    | { type: "placeOnBurner"; toolId: string; burner: number }
    | { type: "addWater"; toolId: string; ml: number }
    | { type: "addIngredient"; toolId: string; ingredientId: string; intoBoiling: boolean }
    // 器具の中の材料をまな板に取り出す
    | { type: "takeOut"; toolId: string; ingredientId: string }
    | {
        type: "heat";
        toolId: string;
        level: HeatLevel;
        minutes: number;
        // 加熱シートで選んだ動作（「炒める」など）。無ければ水の有無から「煮る」「加熱する」にする
        action?: string;
        // 加熱した時点で中に入っていた材料
        ingredientIds: string[];
        withWater: boolean;
        boiled: boolean;
      }
    | { type: "turnOff"; toolId: string }
    | { type: "wash"; ingredientId: string }
    // 器具の水（お湯）をシンクに捨てる。材料が入っていれば「湯を切る」扱い
    | { type: "drain"; toolId: string; withIngredients: boolean }
    // toolId は蓋をかぶせた（外した）器具
    | { type: "putLid"; toolId: string; lidId: string }
    | { type: "removeLid"; toolId: string; lidId: string }
    | {
        type: "toolAction";
        toolId: string;
        ingredientIds: string[];
        action: string;
      }
  );

export type CookEventType = CookEvent["type"];
