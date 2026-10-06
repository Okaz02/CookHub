import type { IngredientImage } from "./types";

// 材料画像の取得と背景透過。
//
// 取得元は優先順に次のとおり。キーが設定されていないものは自動でスキップする。
//   1. Google Custom Search（EXPO_PUBLIC_GOOGLE_CSE_KEY / EXPO_PUBLIC_GOOGLE_CSE_CX）
//      imgColorType=trans で「背景が透過済みの画像」だけを検索する。
//   2. Wikipedia（日本語版）の記事画像。キー不要。背景は透過されていない。
//   3. 絵文字。オフラインでも必ず使える。
//
// 背景透過は remove.bg（EXPO_PUBLIC_REMOVE_BG_API_KEY）が設定されている場合のみ行う。
// 透過できない画像は表示側で丸く切り抜いて「シール」風に見せる。
//
// 注意: EXPO_PUBLIC_ の値はアプリに埋め込まれるため、本番ではバックエンド経由で呼ぶこと。

const GOOGLE_CSE_KEY = process.env.EXPO_PUBLIC_GOOGLE_CSE_KEY;
const GOOGLE_CSE_CX = process.env.EXPO_PUBLIC_GOOGLE_CSE_CX;
const REMOVE_BG_API_KEY = process.env.EXPO_PUBLIC_REMOVE_BG_API_KEY;

const REQUEST_TIMEOUT_MS = 8000;

export function isBackgroundRemovalAvailable() {
  return Boolean(REMOVE_BG_API_KEY);
}

export function isGoogleSearchAvailable() {
  return Boolean(GOOGLE_CSE_KEY && GOOGLE_CSE_CX);
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function searchGoogle(name: string): Promise<IngredientImage[]> {
  if (!GOOGLE_CSE_KEY || !GOOGLE_CSE_CX) return [];
  const params = new URLSearchParams({
    key: GOOGLE_CSE_KEY,
    cx: GOOGLE_CSE_CX,
    q: `${name} 食材`,
    searchType: "image",
    imgColorType: "trans",
    fileType: "png",
    safe: "active",
    num: "6",
  });
  const response = await fetchWithTimeout(`https://www.googleapis.com/customsearch/v1?${params}`);
  if (!response.ok) return [];
  const body = (await response.json()) as { items?: { link: string; image?: { thumbnailLink?: string } }[] };
  return (body.items ?? []).map((item) => ({ uri: item.link, transparent: true, source: "google" as const }));
}

async function searchWikipedia(name: string): Promise<IngredientImage[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "256",
    redirects: "1",
    titles: name,
  });
  const response = await fetchWithTimeout(`https://ja.wikipedia.org/w/api.php?${params}`);
  if (!response.ok) return [];
  const body = (await response.json()) as {
    query?: { pages?: Record<string, { thumbnail?: { source: string } }> };
  };
  return Object.values(body.query?.pages ?? {})
    .map((page) => page.thumbnail?.source)
    .filter((uri): uri is string => Boolean(uri))
    .map((uri) => ({ uri, transparent: false, source: "wikipedia" as const }));
}

// よく使う材料の絵文字。部分一致で探す。
const EMOJI_TABLE: [string[], string][] = [
  [["玉ねぎ", "玉葱", "たまねぎ", "タマネギ", "オニオン"], "🧅"],
  [["にんじん", "人参", "ニンジン"], "🥕"],
  [["じゃがいも", "ジャガイモ", "馬鈴薯", "ポテト"], "🥔"],
  [["さつまいも", "サツマイモ"], "🍠"],
  [["トマト"], "🍅"],
  [["きゅうり", "キュウリ", "胡瓜"], "🥒"],
  [["なす", "ナス", "茄子"], "🍆"],
  [["ブロッコリー"], "🥦"],
  [["キャベツ", "レタス", "白菜", "ほうれん草", "小松菜", "青菜"], "🥬"],
  [["とうもろこし", "コーン"], "🌽"],
  [["にんにく", "ニンニク", "大蒜"], "🧄"],
  [["しょうが", "生姜", "ショウガ"], "🫚"],
  [["ピーマン", "パプリカ", "唐辛子"], "🫑"],
  [["きのこ", "しいたけ", "椎茸", "しめじ", "えのき", "マッシュルーム"], "🍄"],
  [["豆", "大豆", "枝豆"], "🫘"],
  [["卵", "たまご", "玉子"], "🥚"],
  [["鶏", "チキン", "とり肉", "鳥肉"], "🍗"],
  [["豚", "牛", "肉", "ベーコン", "ハム", "ひき肉"], "🥩"],
  [["えび", "海老", "エビ"], "🦐"],
  [["いか", "イカ"], "🦑"],
  [["魚", "鮭", "さけ", "さば", "鯖", "あじ", "たら", "鱈"], "🐟"],
  [["米", "ご飯", "ごはん"], "🍚"],
  [["パン"], "🍞"],
  [["麺", "うどん", "そば", "パスタ", "スパゲッティ", "ラーメン"], "🍝"],
  [["チーズ"], "🧀"],
  [["バター"], "🧈"],
  [["牛乳", "ミルク"], "🥛"],
  [["塩", "砂糖", "胡椒", "こしょう", "コショウ"], "🧂"],
  [["油", "オイル", "醤油", "しょうゆ", "みりん", "酒", "酢", "ソース"], "🫙"],
  [["レモン"], "🍋"],
  [["りんご", "リンゴ", "林檎"], "🍎"],
  [["バナナ"], "🍌"],
  [["いちご", "イチゴ", "苺"], "🍓"],
  [["アボカド"], "🥑"],
  [["豆腐"], "⬜"],
];

export function findIngredientEmoji(name: string): string {
  const normalized = name.trim();
  for (const [keywords, emoji] of EMOJI_TABLE) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return emoji;
  }
  return "🥣";
}

export function emojiImage(name: string): IngredientImage {
  return { emoji: findIngredientEmoji(name), transparent: true, source: "emoji" };
}

// 材料名から画像の候補を返す。透過済みの候補が先頭に来るように並べる。
export async function searchIngredientImages(name: string): Promise<IngredientImage[]> {
  const trimmed = name.trim();
  if (!trimmed) return [];
  const results = await Promise.allSettled([searchGoogle(trimmed), searchWikipedia(trimmed)]);
  const found = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const unique = found.filter((image, index) => found.findIndex((other) => other.uri === image.uri) === index);
  return [...unique.filter((image) => image.transparent), ...unique.filter((image) => !image.transparent), emojiImage(trimmed)];
}

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    output += BASE64_CHARS[a >> 2];
    output += BASE64_CHARS[((a & 3) << 4) | ((b ?? 0) >> 4)];
    output += b === undefined ? "=" : BASE64_CHARS[((b & 15) << 2) | ((c ?? 0) >> 6)];
    output += c === undefined ? "=" : BASE64_CHARS[c & 63];
  }
  return output;
}

// remove.bg で背景を透過する。失敗したら null を返し、呼び出し側は元の画像を使い続ける。
export async function removeBackground(image: IngredientImage): Promise<IngredientImage | null> {
  if (!REMOVE_BG_API_KEY || !image.uri || image.transparent) return null;
  const form = new FormData();
  form.append("image_url", image.uri);
  form.append("size", "preview");
  form.append("format", "png");
  try {
    const response = await fetchWithTimeout("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": REMOVE_BG_API_KEY },
      body: form,
    });
    if (!response.ok) return null;
    const base64 = arrayBufferToBase64(await response.arrayBuffer());
    return { uri: `data:image/png;base64,${base64}`, transparent: true, source: "removebg" };
  } catch {
    return null;
  }
}
