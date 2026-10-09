import type { CustomToolDefinition, CutStyleId, HeatLevel, ToolAppearance } from "./types";

export type CutStyle = {
  id: CutStyleId;
  label: string;
  // 手順文で使う「〜にする」の部分（終止形 / 連用形）。
  phrase: string;
  phraseTe: string;
  // 切ったあとの見た目
  pieces: "strips" | "slices" | "chunks" | "mince" | "wedges";
};

export const CUT_STYLES: CutStyle[] = [
  { id: "sengiri", label: "千切り", phrase: "千切りにする", phraseTe: "千切りにし", pieces: "strips" },
  { id: "rangiri", label: "乱切り", phrase: "乱切りにする", phraseTe: "乱切りにし", pieces: "chunks" },
  { id: "mijin", label: "みじん切り", phrase: "みじん切りにする", phraseTe: "みじん切りにし", pieces: "mince" },
  { id: "wagiri", label: "輪切り", phrase: "輪切りにする", phraseTe: "輪切りにし", pieces: "slices" },
  { id: "hangetsu", label: "半月切り", phrase: "半月切りにする", phraseTe: "半月切りにし", pieces: "slices" },
  { id: "icho", label: "いちょう切り", phrase: "いちょう切りにする", phraseTe: "いちょう切りにし", pieces: "slices" },
  { id: "kushigata", label: "くし形切り", phrase: "くし形に切る", phraseTe: "くし形に切り", pieces: "wedges" },
  { id: "kakugiri", label: "角切り", phrase: "角切りにする", phraseTe: "角切りにし", pieces: "chunks" },
];

export const WIDTH_CUT_PRESETS_CM = [0.5, 1, 2, 3];

export function getCutStyle(id: CutStyleId): CutStyle {
  const found = CUT_STYLES.find((style) => style.id === id);
  if (found) return found;
  // "width" は幅によって文言が変わるので、ここでは汎用の値を返す。
  return { id, label: "◯cmずつ切る", phrase: "切る", phraseTe: "切り", pieces: "slices" };
}

export const HEAT_LEVELS: { id: HeatLevel; label: string; color: string }[] = [
  { id: "low", label: "弱火", color: "#4f7cff" },
  { id: "mediumLow", label: "弱めの中火", color: "#7a6cff" },
  { id: "medium", label: "中火", color: "#ff8a3d" },
  { id: "high", label: "強火", color: "#ff3d2e" },
];

export function getHeatLevel(id: HeatLevel) {
  return HEAT_LEVELS.find((level) => level.id === id) ?? HEAT_LEVELS[2];
}

// 火を使う動作。器具の動作のうちこれらはコンロの加熱シートで選び、それ以外は器具の動作シートで選ぶ。
// te は手順文をつなぐときの形（「中火で3分炒め、」）、past は材料の履歴に出す形
export const HEAT_ACTIONS: { verb: string; te: string; past: string }[] = [
  { verb: "炒める", te: "炒め", past: "炒めた" },
  { verb: "焼く", te: "焼き", past: "焼いた" },
  { verb: "茹でる", te: "茹で", past: "茹でた" },
  { verb: "煮る", te: "煮て", past: "煮た" },
  { verb: "蒸す", te: "蒸し", past: "蒸した" },
  { verb: "揚げる", te: "揚げ", past: "揚げた" },
];

export function isHeatAction(verb: string) {
  return HEAT_ACTIONS.some((item) => item.verb === verb);
}

export const HEAT_MINUTE_PRESETS = [1, 3, 5, 10, 15];
export const WATER_PRESETS_ML = [300, 500, 1000, 1500, 2000];

export const INITIAL_BURNER_COUNT = 2;
// コンロは＋ボタンでここまで増やせる（3口以上は2段に並べる）
export const MAX_BURNER_COUNT = 6;

// 器具追加シートの選択肢
export const TOOL_ACTION_PRESETS = [
  "炒める",
  "焼く",
  "混ぜる",
  "和える",
  "茹でる",
  "煮る",
  "蒸す",
  "揚げる",
  "皮をむく",
  "すりおろす",
  "潰す",
  "撹拌する",
  "漬ける",
  "冷やす",
];

export const TOOL_COLORS = ["#3a3a3a", "#9e9e9e", "#c0392b", "#e6a23c", "#5E6B5E", "#4a78b5", "#A67B73", "#f2efe8"];

export const TOOL_ICONS = [
  "soup-kitchen",
  "blender",
  "kitchen",
  "microwave",
  "outdoor-grill",
  "whatshot",
  "egg",
  "rice-bowl",
  "ramen-dining",
  "set-meal",
  "coffee-maker",
  "local-drink",
  "cake",
  "icecream",
  "restaurant",
  "build",
] as const;

export const TOOL_SHAPES: { id: ToolAppearance["shape"]; label: string }[] = [
  { id: "circle", label: "丸" },
  { id: "square", label: "四角" },
  { id: "rect", label: "細長" },
];

// よくある器具のひな形。名前を選ぶと動作や見た目がまとめて入る。
export const TOOL_TEMPLATES: Omit<CustomToolDefinition, "id">[] = [
  {
    name: "フライパン",
    actions: ["炒める", "焼く"],
    appearance: { shape: "circle", color: "#3a3a3a", icon: "outdoor-grill" },
    container: true,
    heatable: true,
  },
  {
    name: "ボウル",
    actions: ["混ぜる", "和える", "漬ける"],
    appearance: { shape: "circle", color: "#f2efe8", icon: "rice-bowl" },
    container: true,
    heatable: false,
  },
  {
    name: "ピーラー",
    actions: ["皮をむく"],
    appearance: { shape: "rect", color: "#e6a23c", icon: "build" },
    container: false,
    heatable: false,
  },
  {
    name: "おろし金",
    actions: ["すりおろす"],
    appearance: { shape: "rect", color: "#9e9e9e", icon: "build" },
    container: false,
    heatable: false,
  },
  {
    name: "ミキサー",
    actions: ["撹拌する"],
    appearance: { shape: "square", color: "#4a78b5", icon: "blender" },
    container: true,
    heatable: false,
  },
  {
    name: "蒸し器",
    actions: ["蒸す"],
    appearance: { shape: "circle", color: "#A67B73", icon: "soup-kitchen" },
    container: true,
    heatable: true,
  },
];
