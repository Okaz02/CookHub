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
//              utensil … 中に入れられない道具（ピーラー・泡立て器など）。材料の上へドラッグすると actions から動作を選ぶ
//   body     画像のうち器（材料や水が入る部分）の範囲。画像の幅・高さに対する割合
//            （取っ手を除いた部分。省略すると画像全体）
//   heatable コンロに乗せられるか

type Body = { x: number; y: number; w: number; h: number };

type CatalogEntry = {
  name: string;
  kind: "knife" | "water" | "pot" | "vessel" | "lid" | "utensil";
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

  // ここから下は、自由に使える写真（Wikimedia Commons など）の背景を消したもの。出典は assets/tools/CREDITS.md
  largePot: {
    name: "両手鍋",
    kind: "vessel",
    image: require("./images/large-pot.png"),
    body: { x: 0.12, y: 0.2, w: 0.76, h: 0.8 },
    round: true,
    actions: ["煮る", "茹でる"],
    heatable: true,
  },
  wok: {
    name: "中華鍋",
    kind: "vessel",
    image: require("./images/wok.png"),
    body: { x: 0.32, y: 0, w: 0.68, h: 0.8 },
    round: true,
    actions: ["炒める", "揚げる"],
    heatable: true,
  },
  donabe: {
    name: "土鍋",
    kind: "vessel",
    image: require("./images/donabe.png"),
    body: { x: 0.05, y: 0.25, w: 0.9, h: 0.75 },
    round: true,
    actions: ["煮る", "炊く"],
    heatable: true,
  },
  riceCooker: {
    name: "炊飯器",
    kind: "vessel",
    image: require("./images/rice-cooker.png"),
    body: { x: 0.08, y: 0, w: 0.78, h: 0.55 },
    round: true,
    actions: ["炊く"],
  },
  steamer: {
    name: "蒸し器",
    kind: "vessel",
    image: require("./images/steamer.png"),
    round: true,
    actions: ["蒸す"],
    heatable: true,
  },
  kettle: {
    name: "やかん",
    kind: "vessel",
    image: require("./images/kettle.png"),
    body: { x: 0.2, y: 0.35, w: 0.75, h: 0.65 },
    actions: [],
    heatable: true,
  },
  colander: {
    name: "ザル",
    kind: "vessel",
    image: require("./images/colander.png"),
    round: true,
    actions: ["水気を切る", "洗う"],
  },
  measuringCup: {
    name: "計量カップ",
    kind: "vessel",
    image: require("./images/measuring-cup.png"),
    body: { x: 0.03, y: 0, w: 0.75, h: 1 },
    actions: ["量る"],
  },
  vat: {
    name: "バット",
    kind: "vessel",
    image: require("./images/vat.png"),
    actions: ["並べる", "衣をつける", "漬ける"],
  },
  blender: {
    name: "ミキサー",
    kind: "vessel",
    image: require("./images/blender.png"),
    body: { x: 0.05, y: 0, w: 0.55, h: 0.55 },
    actions: ["撹拌する"],
  },
  peeler: { name: "ピーラー", kind: "utensil", image: require("./images/peeler.png"), actions: ["皮をむく"] },
  grater: { name: "おろし金", kind: "utensil", image: require("./images/grater.png"), actions: ["すりおろす"] },
  ladle: { name: "おたま", kind: "utensil", image: require("./images/ladle.png"), actions: ["すくう", "混ぜる"] },
  turner: { name: "フライ返し", kind: "utensil", image: require("./images/turner.png"), actions: ["返す"] },
  tongs: { name: "トング", kind: "utensil", image: require("./images/tongs.png"), actions: ["つかむ", "返す"] },
  measuringSpoons: {
    name: "計量スプーン",
    kind: "utensil",
    image: require("./images/measuring-spoons.png"),
    actions: ["量る"],
  },
  kitchenScissors: {
    name: "キッチンバサミ",
    kind: "utensil",
    image: require("./images/kitchen-scissors.png"),
    actions: ["切る"],
  },
  woodenSpatula: {
    name: "木べら",
    kind: "utensil",
    image: require("./images/wooden-spatula.png"),
    actions: ["混ぜる"],
  },
  rollingPin: { name: "麺棒", kind: "utensil", image: require("./images/rolling-pin.png"), actions: ["のばす", "たたく"] },
} satisfies Record<string, CatalogEntry>;

export type ToolCatalogId = keyof typeof TOOL_CATALOG;

const WHOLE: Body = { x: 0, y: 0, w: 1, h: 1 };

export function getCatalogEntry(id: ToolCatalogId): CatalogEntry & { body: Body } {
  const entry: CatalogEntry = TOOL_CATALOG[id];
  return { ...entry, body: entry.body ?? WHOLE };
}
