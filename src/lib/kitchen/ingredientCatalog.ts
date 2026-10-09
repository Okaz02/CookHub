import type { ImageRequireSource } from "react-native";
import { emojiImage } from "./imageSearch";
import { INGREDIENT_PHOTOS } from "./ingredientPhotos";
import type { IngredientImage } from "./types";

// 材料の入力欄で候補に出す材料の一覧。材料を足すときはここに1項目足す。
// 写真は ingredientPhotos.ts（assets/ingredients から作る）にあれば使い、無ければ絵文字になる。
//
//   aliases  ひらがな・別の書き方・大まかな呼び方（「豚肉」など）。どれかに入力が含まれると候補に出る

export type IngredientCategory =
  | "meat"
  | "seafood"
  | "vegetable"
  | "mushroom"
  | "fruit"
  | "eggDairySoy"
  | "processed"
  | "dried"
  | "staple"
  | "noodle"
  | "roux"
  | "seasoning"
  | "spice";

// 分類名そのもの（「肉」「野菜」など）を入力すると、その分類の材料をすべて候補に出す
export const CATEGORY_NAMES: Record<IngredientCategory, string[]> = {
  meat: ["肉", "にく", "肉類"],
  seafood: ["魚介", "ぎょかい", "魚", "さかな", "海鮮", "かいせん", "海藻", "かいそう"],
  vegetable: ["野菜", "やさい"],
  mushroom: ["きのこ", "茸"],
  fruit: ["果物", "くだもの", "フルーツ"],
  eggDairySoy: ["卵", "たまご", "乳製品", "にゅうせいひん", "大豆製品", "だいずせいひん"],
  processed: ["加工品", "かこうひん", "漬物", "つけもの", "缶詰", "かんづめ", "練り物", "ねりもの"],
  dried: ["乾物", "かんぶつ", "豆", "まめ", "ナッツ"],
  staple: ["主食", "しゅしょく", "粉", "こな"],
  noodle: ["麺", "めん"],
  roux: ["ルー", "るー"],
  seasoning: ["調味料", "ちょうみりょう"],
  spice: ["スパイス", "香辛料", "こうしんりょう", "ハーブ"],
};

export type CatalogIngredient = {
  id: string;
  name: string;
  aliases: string[];
  category: IngredientCategory;
  // 背景を消した写真（消せなかったものは transparent: false）
  photo?: { source: ImageRequireSource; transparent: boolean };
};

type Entry = [id: string, name: string, aliases: string[]];

const ENTRIES: Record<IngredientCategory, Entry[]> = {
  meat: [
    ["pork-belly", "豚バラ肉", ["ぶたばら", "豚肉", "ぶたにく", "豚バラ", "バラ肉"]],
    ["pork-komagire", "豚こま切れ肉", ["ぶたこま", "豚肉", "ぶたにく", "豚こま", "こま切れ"]],
    ["pork-loin", "豚ロース", ["ぶたろーす", "豚肉", "ぶたにく", "ロース", "とんかつ用"]],
    ["ground-pork", "豚ひき肉", ["ぶたひきにく", "豚肉", "ぶたにく", "ひき肉", "挽肉", "ミンチ"]],
    ["chicken-thigh", "鶏もも肉", ["とりももにく", "鶏肉", "とりにく", "鳥肉", "チキン", "もも肉"]],
    ["chicken-breast", "鶏むね肉", ["とりむねにく", "鶏肉", "とりにく", "鳥肉", "チキン", "胸肉"]],
    ["chicken-tender", "ささみ", ["ささ身", "鶏肉", "とりにく", "鳥肉", "チキン"]],
    ["chicken-wings", "手羽先", ["てばさき", "手羽", "鶏肉", "とりにく", "チキン"]],
    ["ground-chicken", "鶏ひき肉", ["とりひきにく", "鶏肉", "とりにく", "ひき肉", "挽肉", "ミンチ"]],
    ["beef-slices", "牛こま切れ肉", ["ぎゅうこま", "牛肉", "ぎゅうにく", "牛こま", "ビーフ", "こま切れ"]],
    ["ground-beef", "合いびき肉", ["あいびきにく", "合挽き肉", "ひき肉", "挽肉", "ミンチ", "牛肉", "ぎゅうにく"]],
    ["bacon", "ベーコン", ["べーこん"]],
    ["ham", "ハム", ["はむ"]],
    ["sausage", "ウインナー", ["ういんなー", "ソーセージ", "ウィンナー"]],
    ["beef-steak", "牛ステーキ肉", ["ぎゅうすてーき", "牛肉", "ぎゅうにく", "ステーキ", "ビーフ"]],
    ["lamb", "ラム肉", ["らむにく", "羊肉", "ラム", "マトン"]],
    ["liver", "レバー", ["ればー", "鶏レバー", "豚レバー", "肝"]],
  ],
  seafood: [
    ["salmon", "鮭", ["さけ", "しゃけ", "サーモン", "シャケ"]],
    ["mackerel", "さば", ["鯖", "サバ"]],
    ["horse-mackerel", "あじ", ["鯵", "アジ"]],
    ["yellowtail", "ぶり", ["鰤", "ブリ"]],
    ["tuna", "まぐろ", ["鮪", "マグロ", "刺身"]],
    ["cod", "たら", ["鱈", "タラ"]],
    ["shrimp", "えび", ["海老", "エビ", "むきえび"]],
    ["squid", "いか", ["烏賊", "イカ"]],
    ["clams", "あさり", ["浅蜊", "アサリ", "貝"]],
    ["canned-tuna", "ツナ缶", ["つな", "ツナ", "シーチキン"]],
    ["shirasu", "しらす", ["シラス", "ちりめんじゃこ"]],
    ["wakame", "わかめ", ["若布", "ワカメ"]],
    ["kombu", "昆布", ["こんぶ", "コンブ"]],
    ["katsuobushi", "かつお節", ["かつおぶし", "鰹節", "削り節", "おかか"]],
    ["nori", "のり", ["海苔", "ノリ", "焼きのり"]],
    ["scallops", "ほたて", ["帆立", "ホタテ", "貝"]],
    ["oysters", "牡蠣", ["かき", "カキ", "貝"]],
    ["octopus", "たこ", ["蛸", "タコ"]],
    ["sardine", "いわし", ["鰯", "イワシ"]],
    ["saury", "さんま", ["秋刀魚", "サンマ"]],
    ["sea-bream", "鯛", ["たい", "タイ"]],
  ],
  vegetable: [
    ["onion", "玉ねぎ", ["たまねぎ", "タマネギ", "玉葱", "オニオン"]],
    ["carrot", "にんじん", ["人参", "ニンジン", "キャロット"]],
    ["potato", "じゃがいも", ["ジャガイモ", "馬鈴薯", "ポテト"]],
    ["cabbage", "キャベツ", ["きゃべつ"]],
    ["napa-cabbage", "白菜", ["はくさい", "ハクサイ"]],
    ["lettuce", "レタス", ["れたす"]],
    ["tomato", "トマト", ["とまと", "ミニトマト"]],
    ["cucumber", "きゅうり", ["胡瓜", "キュウリ"]],
    ["eggplant", "なす", ["茄子", "ナス"]],
    ["green-pepper", "ピーマン", ["ぴーまん"]],
    ["paprika", "パプリカ", ["ぱぷりか"]],
    ["broccoli", "ブロッコリー", ["ぶろっこりー"]],
    ["spinach", "ほうれん草", ["ほうれんそう", "ホウレンソウ"]],
    ["komatsuna", "小松菜", ["こまつな", "コマツナ"]],
    ["daikon", "大根", ["だいこん", "ダイコン"]],
    ["burdock", "ごぼう", ["牛蒡", "ゴボウ"]],
    ["lotus-root", "れんこん", ["蓮根", "レンコン"]],
    ["pumpkin", "かぼちゃ", ["南瓜", "カボチャ"]],
    ["sweet-potato", "さつまいも", ["薩摩芋", "サツマイモ"]],
    ["bean-sprouts", "もやし", ["モヤシ"]],
    ["leek", "長ねぎ", ["ながねぎ", "ねぎ", "葱", "ネギ", "白ねぎ"]],
    ["green-onion", "青ねぎ", ["あおねぎ", "ねぎ", "葱", "ネギ", "万能ねぎ", "小ねぎ"]],
    ["chinese-chives", "にら", ["韮", "ニラ"]],
    ["asparagus", "アスパラガス", ["あすぱらがす", "アスパラ"]],
    ["okra", "オクラ", ["おくら"]],
    ["celery", "セロリ", ["せろり"]],
    ["corn", "とうもろこし", ["トウモロコシ", "コーン"]],
    ["edamame", "枝豆", ["えだまめ", "エダマメ"]],
    ["green-beans", "さやいんげん", ["いんげん", "インゲン"]],
    ["zucchini", "ズッキーニ", ["ずっきーに"]],
    ["ginger", "生姜", ["しょうが", "ショウガ", "ジンジャー"]],
    ["garlic", "にんにく", ["大蒜", "ニンニク", "ガーリック"]],
    ["shiso", "大葉", ["おおば", "しそ", "紫蘇", "シソ"]],
    ["taro", "里芋", ["さといも", "サトイモ"]],
    ["mizuna", "水菜", ["みずな", "ミズナ"]],
    ["bok-choy", "チンゲン菜", ["ちんげんさい", "青梗菜"]],
    ["turnip", "かぶ", ["蕪", "カブ"]],
    ["nagaimo", "長芋", ["ながいも", "山芋", "やまいも", "とろろ"]],
    ["myoga", "みょうが", ["茗荷", "ミョウガ"]],
    ["bitter-melon", "ゴーヤ", ["ごーや", "にがうり", "苦瓜"]],
    ["cauliflower", "カリフラワー", ["かりふらわー"]],
    ["bamboo-shoot", "たけのこ", ["筍", "タケノコ"]],
    ["radish-sprouts", "かいわれ大根", ["かいわれ", "カイワレ"]],
    ["snow-peas", "さやえんどう", ["絹さや", "きぬさや"]],
    ["green-peas", "グリーンピース", ["ぐりーんぴーす", "えんどう豆"]],
    ["mitsuba", "三つ葉", ["みつば", "ミツバ"]],
    ["shishito", "ししとう", ["獅子唐", "シシトウ"]],
  ],
  mushroom: [
    ["shiitake", "しいたけ", ["椎茸", "シイタケ"]],
    ["shimeji", "しめじ", ["シメジ"]],
    ["enoki", "えのき", ["えのきだけ", "エノキ"]],
    ["maitake", "まいたけ", ["舞茸", "マイタケ"]],
    ["eryngii", "エリンギ", ["えりんぎ"]],
    ["mushroom", "マッシュルーム", ["まっしゅるーむ"]],
  ],
  fruit: [
    ["apple", "りんご", ["林檎", "リンゴ", "アップル"]],
    ["banana", "バナナ", ["ばなな"]],
    ["lemon", "レモン", ["れもん", "檸檬"]],
    ["strawberry", "いちご", ["苺", "イチゴ"]],
    ["orange", "オレンジ", ["おれんじ"]],
    ["mikan", "みかん", ["蜜柑", "ミカン"]],
    ["grape", "ぶどう", ["葡萄", "ブドウ"]],
    ["kiwi", "キウイ", ["きうい", "キウイフルーツ"]],
    ["peach", "もも", ["桃", "モモ", "ピーチ"]],
    ["pineapple", "パイナップル", ["ぱいなっぷる", "パイン"]],
    ["avocado", "アボカド", ["あぼかど"]],
    ["blueberry", "ブルーベリー", ["ぶるーべりー"]],
  ],
  eggDairySoy: [
    ["egg", "卵", ["たまご", "玉子", "タマゴ", "鶏卵"]],
    ["milk", "牛乳", ["ぎゅうにゅう", "ミルク"]],
    ["butter", "バター", ["ばたー"]],
    ["cheese", "チーズ", ["ちーず", "ピザ用チーズ", "とろけるチーズ"]],
    ["fresh-cream", "生クリーム", ["なまくりーむ", "クリーム"]],
    ["yogurt", "ヨーグルト", ["よーぐると"]],
    ["tofu", "豆腐", ["とうふ", "トウフ", "絹ごし", "木綿"]],
    ["aburaage", "油揚げ", ["あぶらあげ", "油あげ"]],
    ["atsuage", "厚揚げ", ["あつあげ"]],
    ["natto", "納豆", ["なっとう", "ナットウ"]],
    ["konnyaku", "こんにゃく", ["蒟蒻", "コンニャク"]],
    ["cream-cheese", "クリームチーズ", ["くりーむちーず", "チーズ"]],
    ["parmesan", "粉チーズ", ["こなちーず", "パルメザン", "チーズ"]],
    ["soy-milk", "豆乳", ["とうにゅう"]],
  ],
  processed: [
    ["chikuwa", "ちくわ", ["竹輪", "チクワ", "練り物"]],
    ["kamaboko", "かまぼこ", ["蒲鉾", "カマボコ", "練り物"]],
    ["kanikama", "カニカマ", ["かにかま", "かに風味かまぼこ"]],
    ["mentaiko", "明太子", ["めんたいこ", "たらこ"]],
    ["kimchi", "キムチ", ["きむち"]],
    ["umeboshi", "梅干し", ["うめぼし", "梅"]],
    ["beni-shoga", "紅しょうが", ["べにしょうが", "紅生姜"]],
    ["canned-tomato", "トマト缶", ["とまとかん", "カットトマト", "ホールトマト"]],
    ["coconut-milk", "ココナッツミルク", ["ここなっつみるく"]],
    ["mochi", "餅", ["もち", "切り餅", "おもち"]],
  ],
  dried: [
    ["soybeans", "大豆", ["だいず", "ダイズ", "豆"]],
    ["chickpeas", "ひよこ豆", ["ひよこまめ", "ガルバンゾー", "豆"]],
    ["azuki", "小豆", ["あずき", "アズキ", "豆"]],
    ["peanuts", "ピーナッツ", ["ぴーなっつ", "落花生", "ナッツ"]],
    ["almonds", "アーモンド", ["あーもんど", "ナッツ"]],
    ["walnuts", "くるみ", ["胡桃", "クルミ", "ナッツ"]],
    ["hijiki", "ひじき", ["鹿尾菜", "ヒジキ"]],
    ["dried-shiitake", "干ししいたけ", ["ほししいたけ", "干し椎茸", "しいたけ"]],
    ["kiriboshi-daikon", "切り干し大根", ["きりぼしだいこん", "切干大根"]],
    ["harusame", "春雨", ["はるさめ", "ハルサメ"]],
    ["raisins", "レーズン", ["れーずん", "干しぶどう"]],
  ],
  staple: [
    ["rice", "米", ["こめ", "お米", "ごはん", "ご飯", "白米"]],
    ["bread", "食パン", ["しょくぱん", "パン"]],
    ["flour", "小麦粉", ["こむぎこ", "薄力粉", "強力粉"]],
    ["potato-starch", "片栗粉", ["かたくりこ"]],
    ["panko", "パン粉", ["ぱんこ"]],
    ["gyoza-wrappers", "餃子の皮", ["ぎょうざのかわ", "ギョーザの皮"]],
    ["oatmeal", "オートミール", ["おーとみーる", "オーツ麦"]],
  ],
  noodle: [
    ["udon", "うどん", ["饂飩", "ウドン"]],
    ["soba", "そば", ["蕎麦", "ソバ"]],
    ["somen", "そうめん", ["素麺", "ソーメン"]],
    ["ramen-noodles", "中華麺", ["ちゅうかめん", "ラーメン", "らーめん"]],
    ["spaghetti", "スパゲッティ", ["すぱげってぃ", "パスタ", "ぱすた"]],
    ["yakisoba-noodles", "焼きそば麺", ["やきそば", "焼きそば"]],
    ["macaroni", "マカロニ", ["まかろに", "パスタ"]],
    ["penne", "ペンネ", ["ぺんね", "パスタ"]],
    ["rice-noodles", "ビーフン", ["びーふん", "米粉麺", "フォー"]],
  ],
  roux: [
    ["curry-roux", "カレールー", ["かれー", "カレー"]],
    ["stew-roux", "シチュールー", ["しちゅー", "シチュー", "クリームシチュー"]],
    ["hayashi-roux", "ハヤシライスルー", ["はやしらいす", "ハヤシ"]],
  ],
  seasoning: [
    ["soy-sauce", "醤油", ["しょうゆ", "しょう油", "ショウユ"]],
    ["salt", "塩", ["しお"]],
    ["sugar", "砂糖", ["さとう", "シュガー"]],
    ["vinegar", "酢", ["す", "お酢", "米酢"]],
    ["mirin", "みりん", ["味醂", "ミリン", "本みりん"]],
    ["cooking-sake", "料理酒", ["りょうりしゅ", "酒", "さけ", "日本酒"]],
    ["miso", "味噌", ["みそ", "ミソ"]],
    ["salad-oil", "サラダ油", ["さらだあぶら", "油", "あぶら", "サラダオイル"]],
    ["sesame-oil", "ごま油", ["ごまあぶら", "胡麻油", "油", "あぶら"]],
    ["olive-oil", "オリーブオイル", ["おりーぶおいる", "オリーブ油", "油", "あぶら"]],
    ["ketchup", "ケチャップ", ["けちゃっぷ", "トマトケチャップ"]],
    ["mayonnaise", "マヨネーズ", ["まよねーず", "マヨ"]],
    ["worcestershire-sauce", "ウスターソース", ["うすたーそーす", "ソース", "中濃ソース", "とんかつソース"]],
    ["oyster-sauce", "オイスターソース", ["おいすたーそーす", "ソース"]],
    ["mentsuyu", "めんつゆ", ["麺つゆ", "つゆ"]],
    ["ponzu", "ポン酢", ["ぽんず", "ポンズ"]],
    ["dashi-powder", "顆粒だし", ["かりゅうだし", "だし", "出汁", "ほんだし", "和風だし"]],
    ["consomme", "コンソメ", ["こんそめ", "ブイヨン"]],
    ["chicken-bouillon", "鶏がらスープの素", ["とりがらすーぷのもと", "鶏ガラ", "鶏がら", "中華だし"]],
    ["doubanjiang", "豆板醤", ["とうばんじゃん", "トウバンジャン"]],
    ["karashi", "からし", ["辛子", "カラシ", "練りからし", "マスタード"]],
    ["wasabi", "わさび", ["山葵", "ワサビ"]],
    ["garlic-paste", "おろしにんにく", ["にんにくチューブ", "にんにく", "ニンニク"]],
    ["ginger-paste", "おろし生姜", ["しょうがチューブ", "生姜", "しょうが"]],
    ["white-sesame", "白ごま", ["しろごま", "ごま", "胡麻", "いりごま"]],
    ["shichimi", "七味唐辛子", ["しちみ", "七味", "唐辛子", "とうがらし"]],
    ["black-pepper", "黒こしょう", ["くろこしょう", "こしょう", "胡椒", "コショウ", "ブラックペッパー"]],
    ["honey", "はちみつ", ["蜂蜜", "ハチミツ"]],
    ["yakiniku-sauce", "焼肉のたれ", ["やきにくのたれ", "たれ", "タレ"]],
    ["gochujang", "コチュジャン", ["こちゅじゃん"]],
    ["grain-mustard", "粒マスタード", ["つぶますたーど", "マスタード"]],
    ["fish-sauce", "ナンプラー", ["なんぷらー", "魚醤", "ヌクマム"]],
    ["tianmianjiang", "甜麺醤", ["てんめんじゃん", "テンメンジャン"]],
    ["red-wine", "赤ワイン", ["あかわいん", "ワイン"]],
    ["white-wine", "白ワイン", ["しろわいん", "ワイン"]],
    ["brown-sugar", "三温糖", ["さんおんとう", "黒糖", "きび砂糖", "砂糖"]],
  ],
  spice: [
    ["basil", "バジル", ["ばじる"]],
    ["parsley", "パセリ", ["ぱせり"]],
    ["cilantro", "パクチー", ["ぱくちー", "コリアンダー", "香菜"]],
    ["rosemary", "ローズマリー", ["ろーずまりー"]],
    ["cinnamon", "シナモン", ["しなもん", "肉桂"]],
    ["curry-powder", "カレー粉", ["かれーこ", "カレーパウダー"]],
    ["red-chili", "唐辛子", ["とうがらし", "鷹の爪", "たかのつめ", "赤唐辛子"]],
    ["sansho", "山椒", ["さんしょう", "サンショウ"]],
    ["cumin", "クミン", ["くみん"]],
    ["nutmeg", "ナツメグ", ["なつめぐ"]],
  ],
};

export const INGREDIENT_CATALOG: CatalogIngredient[] = (Object.keys(ENTRIES) as IngredientCategory[]).flatMap(
  (category) =>
    ENTRIES[category].map(([id, name, aliases]) => ({ id, name, aliases, category, photo: INGREDIENT_PHOTOS[id] }))
);

// 比べる前に表記をそろえる（全角・半角、カタカナ→ひらがな、空白）
export function normalizeIngredientName(text: string) {
  return text
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .toLowerCase();
}

const NORMALIZED = INGREDIENT_CATALOG.map((item) => ({
  item,
  names: [item.name, ...item.aliases].map(normalizeIngredientName),
}));

// 入力に近い材料を返す。名前の完全一致 → 分類名（「肉」なら肉すべて）→ 前方一致 → 部分一致の順に並べる
export function suggestIngredients(query: string, limit = 24): CatalogIngredient[] {
  const q = normalizeIngredientName(query);
  if (!q) return [];
  const categories = (Object.keys(CATEGORY_NAMES) as IngredientCategory[]).filter((category) =>
    CATEGORY_NAMES[category].some((name) => normalizeIngredientName(name) === q)
  );
  const scored = NORMALIZED.map(({ item, names }) => {
    let score = Infinity;
    if (names.some((name) => name === q)) score = 0;
    else if (categories.includes(item.category)) score = 1;
    else if (names.some((name) => name.startsWith(q))) score = 2;
    else if (names.some((name) => name.includes(q))) score = 3;
    return { item, score };
  }).filter(({ score }) => score !== Infinity);
  // 分類名で探したときは、その分類をすべて出す
  const max = categories.length > 0 ? Math.max(limit, scored.filter(({ score }) => score <= 1).length) : limit;
  // 同じ点数なら一覧の順（分類ごと）のまま
  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, max)
    .map(({ item }) => item);
}

// 卵かどうか（器に入れるとき「割り入れる」を選べるようにする）
export function isEgg(name: string) {
  const q = normalizeIngredientName(name);
  const egg = INGREDIENT_CATALOG.find((item) => item.id === "egg");
  return Boolean(egg && [egg.name, ...egg.aliases].some((alias) => normalizeIngredientName(alias) === q));
}

// 候補の材料の画像。写真が無ければ絵文字
export function catalogImage(item: CatalogIngredient): IngredientImage {
  // 背景を消せなかった写真は、表示側で丸く切り抜く（transparent: false）
  return item.photo
    ? { asset: item.photo.source, transparent: item.photo.transparent, source: "catalog" }
    : emojiImage(item.name);
}

// 名前がぴったり一致する材料（入力し終えたときに、写真を自動で付けるのに使う）
export function findCatalogIngredient(name: string): CatalogIngredient | undefined {
  const q = normalizeIngredientName(name);
  if (!q) return undefined;
  return NORMALIZED.find(({ item }) => normalizeIngredientName(item.name) === q)?.item;
}
