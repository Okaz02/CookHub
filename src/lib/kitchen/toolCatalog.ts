import type { ImageRequireSource } from "react-native";

// キッチンに最初から置いてある器具の一覧。器具を足すときはここに1項目足すだけでよい。
//
//   kind     器具の動き方
//              knife  … 材料の上へドラッグすると切る
//              water  … 器へドラッグすると水を入れる
//              pot    … 材料をドラッグすると中に入れる（ヒントの「鍋」はこれ）
//              vessel … 材料をドラッグすると中に入れる。actions のうち火を使う動作（炒める など）は
//                       コンロの加熱シートで、それ以外（混ぜる など）は器具をタップして選ぶ
//              lid    … acceptsLid の器具にかぶせる
//   body     画像のうち器（材料や水が入る部分）の範囲。画像の幅・高さに対する割合
//            （取っ手を除いた部分。省略すると画像全体）
//   heatable コンロに乗せられるか

type Body = { x: number; y: number; w: number; h: number };

type CatalogEntry = {
  name: string;
  kind: "knife" | "water" | "pot" | "vessel" | "lid";
  image: ImageRequireSource;
  body?: Body;
  round?: boolean;
  actions?: string[];
  heatable?: boolean;
  acceptsLid?: boolean;
};

export const TOOL_CATALOG = {
  knife: { name: "包丁", kind: "knife", image: require("./images/knife.png") },
  breadKnife: { name: "パン切り包丁", kind: "knife", image: require("./images/bread-knife.png") },
  water: { name: "水", kind: "water", image: require("./images/glass.png") },
  pot: {
    name: "鍋",
    kind: "pot",
    image: require("./images/small-pot.png"),
    body: { x: 0, y: 0.46, w: 1, h: 0.54 },
    round: true,
    heatable: true,
  },
  fryingPan: {
    name: "フライパン",
    kind: "vessel",
    image: require("./images/frying-pan.png"),
    body: { x: 0, y: 0.41, w: 1, h: 0.59 },
    round: true,
    actions: ["炒める", "焼く"],
    heatable: true,
    acceptsLid: true,
  },
  tamagoyakiPan: {
    name: "卵焼き器",
    kind: "vessel",
    image: require("./images/tamagoyaki-pan.png"),
    body: { x: 0, y: 0.47, w: 1, h: 0.53 },
    actions: ["焼く", "巻く"],
    heatable: true,
  },
  bowl: {
    name: "ボウル",
    kind: "vessel",
    image: require("./images/bowl.png"),
    body: { x: 0.084, y: 0, w: 0.832, h: 1 },
    round: true,
    actions: ["混ぜる", "和える", "漬ける"],
  },
  lid: { name: "蓋", kind: "lid", image: require("./images/lid.png"), round: true },
} satisfies Record<string, CatalogEntry>;

export type ToolCatalogId = keyof typeof TOOL_CATALOG;

const WHOLE: Body = { x: 0, y: 0, w: 1, h: 1 };

export function getCatalogEntry(id: ToolCatalogId): CatalogEntry & { body: Body } {
  const entry: CatalogEntry = TOOL_CATALOG[id];
  return { ...entry, body: entry.body ?? WHOLE };
}
