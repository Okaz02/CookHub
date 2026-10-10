// 上から見たキッチンの配置。すべてキャンバス左上を原点とした座標で表す。
//
//   ┌─ 棚（材料）─┬─ 器具置き場 ─┐  1行ずつ。横にスクロール
//   ├──── 調理台 ─────┬ まな板 ┤  器具を置いて作業する。右側だけまな板（縦にスクロール）
//   │ 器具 器具 …       │ 材料    │  ← 画面の残りの高さをすべて使う
//   ├──── コンロ ────┬ シンク ┤
//   │  ( 1 )    ( 2 )  │(排水溝)│  コンロは3口以上なら2段（上の段に多め）
//   └─────────────────┴────────┘

export type Rect = { x: number; y: number; w: number; h: number };
export type Circle = { cx: number; cy: number; r: number };
export type Point = { x: number; y: number };

// 材料と器具は小さくすると見づらいので縮めない。入りきらない分は中をスクロールする
const ITEM_SIZE = 56;
// 器具の枠は縦長にする（フライパンなど取っ手が長い器具を、取っ手まで含めて大きく見せるため）
const TOOL_CELL_WIDTH = 72;
const TOOL_CELL_HEIGHT = 112;
// 画面が低いときは、調理台の高さを守るためにコンロとシンクを縮める（倍率 1 のときのバーナーの半径）
const MAX_BURNER_RADIUS = 73;
const MIN_BURNER_RADIUS = 18;
const MIN_SCALE = 0.4;

const PAD = 12;
const GAP = 10;
const LABEL = 24;
const CELL_GAP = 8;
// 材料・器具の名前は絵の下にはみ出して出すので、その分の高さを各段に足す（無いとスクロールする枠で切れる）
const NAME_SPACE = 14;
// 調理台のうちまな板が占める割合（右側）
const BOARD_SHARE = 0.45;
// まな板は手前（下）に持ち手の穴があるので、材料はその上に並べる
const BOARD_HANDLE = 42;
// 下の段のうちコンロが占める割合（残りがシンク）
const STOVE_SHARE = 0.68;
const KNOB_WIDTH = 92;
// シンクの下に並べるボタン（水を入れる・水を捨てる）の分
const SINK_BUTTON_SPACE = 64;
// バーナーの下に出す「火をつける」ボタンの分
const KNOB_SPACE = 40;

export type ScrollArea = {
  // スクロールする部分（キャンバス座標）
  view: Rect;
  contentWidth: number;
  contentHeight: number;
  // 中身の左上を原点にした、index 番目の位置
  slot: (index: number) => Rect;
};

export type KitchenLayout = {
  width: number;
  height: number;
  shelf: Rect;
  rack: Rect;
  counter: Rect;
  board: Rect;
  sink: Rect;
  stove: Rect;
  burners: Circle[];
  // 「火をつける」ボタンの幅。バーナーが詰まっているときは狭くする
  knobWidth: number;
  // 棚・器具置き場は横に、調理台（まな板を除いた部分）・まな板は縦にスクロールする
  shelfView: ScrollArea;
  rackView: ScrollArea;
  counterView: ScrollArea;
  boardView: ScrollArea;
  burnerToolRect: (index: number) => Rect;
  // シンクに置いた器具の位置（下にボタンを出すので上に寄せる）
  sinkToolRect: Rect;
};

function columnsFor(width: number, size: number) {
  return Math.max(1, Math.floor((width - CELL_GAP) / (size + CELL_GAP)));
}

// view をスクロールする部分にして、幅 w・高さ h の枠を columns 列の格子に並べる
function gridScrollArea(view: Rect, columns: number, w: number, h: number, count: number): ScrollArea {
  const rows = Math.max(1, Math.ceil(count / columns));
  return {
    view,
    contentWidth: CELL_GAP + columns * (w + CELL_GAP),
    contentHeight: rows * (h + CELL_GAP + NAME_SPACE) + CELL_GAP,
    slot: (index) => ({
      x: CELL_GAP + (index % columns) * (w + CELL_GAP),
      y: CELL_GAP + Math.floor(index / columns) * (h + CELL_GAP + NAME_SPACE),
      w,
      h,
    }),
  };
}

// 1行だけで横にスクロールする。枠は縦の真ん中に置く
function rowScrollArea(area: Rect, w: number, h: number, count: number): ScrollArea {
  const rowHeight = h + CELL_GAP * 2 + NAME_SPACE;
  const top = LABEL + (area.h - LABEL - rowHeight) / 2;
  return gridScrollArea(
    { x: area.x, y: area.y + top, w: area.w, h: rowHeight },
    Math.max(1, count),
    w,
    h,
    count
  );
}

type Counts = { shelf: number; rack: number; counter: number; board: number; burners: number };

// 幅 width・高さ height の画面をちょうど埋めるように配置する。
// 上の段とコンロ・シンクの高さを決め、残りを調理台にする（中身が多ければその中でスクロール）。
// 調理台が器具1段分より低くなるときは、そうならないところまでコンロとシンクを縮める
export function computeLayout(width: number, height: number, counts: Counts): KitchenLayout {
  for (let scale = 1; scale > MIN_SCALE; scale -= 0.05) {
    const layout = layoutAt(width, height, counts, scale);
    if (layout) return layout;
  }
  // コンロとシンクを最小にしても足りない画面では、調理台を最低の高さにして全体をスクロールする
  return layoutAt(width, height, counts, MIN_SCALE, true)!;
}

function layoutAt(
  width: number,
  height: number,
  counts: Counts,
  scale: number,
  allowOverflow = false
): KitchenLayout | null {
  const innerWidth = width - PAD * 2;

  // 2口までは1段、3口以上は上の段に多め（切り上げ）で2段に並べる
  const burnerRows =
    counts.burners <= 2
      ? [counts.burners]
      : [Math.ceil(counts.burners / 2), counts.burners - Math.ceil(counts.burners / 2)];
  const perRow = burnerRows[0];
  const stoveWidth = Math.floor((innerWidth - GAP) * STOVE_SHARE);
  // 小さすぎると鍋を落とせないので、最低限の大きさは残す
  const burnerRadius = Math.max(MIN_BURNER_RADIUS, Math.min(stoveWidth / (perRow * 2) - 14, MAX_BURNER_RADIUS) * scale);
  const rowHeight = burnerRadius * 2 + KNOB_SPACE;
  const bottomHeight = LABEL + 4 + burnerRows.length * rowHeight + 4;

  // 上の段：左が棚、右が器具置き場。高さは器具の枠に合わせる
  const topHeight = LABEL + TOOL_CELL_HEIGHT + CELL_GAP * 2 + NAME_SPACE;
  const shelfWidth = Math.floor((innerWidth - GAP) / 2);
  const shelf: Rect = { x: PAD, y: PAD, w: shelfWidth, h: topHeight };
  const rack: Rect = { x: PAD + shelfWidth + GAP, y: PAD, w: innerWidth - GAP - shelfWidth, h: topHeight };

  // 調理台：残りの高さをすべて使う。右側だけまな板
  const counterTop = shelf.y + shelf.h + GAP;
  // 作業する場所なので、最低でも器具の枠が1段まるごと見える高さにする
  const minCounter = LABEL + TOOL_CELL_HEIGHT + CELL_GAP * 2 + NAME_SPACE;
  const restHeight = height - PAD - bottomHeight - GAP - counterTop;
  if (restHeight < minCounter && !allowOverflow) return null;
  const counter: Rect = { x: PAD, y: counterTop, w: innerWidth, h: Math.max(minCounter, restHeight) };
  const boardWidth = Math.floor(counter.w * BOARD_SHARE);
  const board: Rect = {
    x: counter.x + counter.w - CELL_GAP - boardWidth,
    y: counter.y + CELL_GAP,
    w: boardWidth,
    h: counter.h - CELL_GAP * 2,
  };
  const workArea: Rect = {
    x: counter.x,
    y: counter.y + LABEL,
    w: board.x - counter.x - CELL_GAP,
    h: counter.h - LABEL,
  };
  const boardItems: Rect = { x: board.x, y: board.y, w: board.w, h: board.h - BOARD_HANDLE };
  const counterColumns = columnsFor(workArea.w, TOOL_CELL_WIDTH);
  const counterCell = Math.floor((workArea.w - CELL_GAP * (counterColumns + 1)) / counterColumns);

  const bottomTop = counter.y + counter.h + GAP;
  const stove: Rect = { x: PAD, y: bottomTop, w: stoveWidth, h: bottomHeight };
  const sink: Rect = { x: PAD + stoveWidth + GAP, y: bottomTop, w: innerWidth - GAP - stoveWidth, h: bottomHeight };

  // 各段の中は左右に等間隔（両端も同じ間隔）
  const burners: Circle[] = burnerRows.flatMap((count, row) => {
    const gap = (stove.w - count * burnerRadius * 2) / (count + 1);
    return Array.from({ length: count }, (_, index) => ({
      cx: stove.x + gap * (index + 1) + burnerRadius * (index * 2 + 1),
      cy: stove.y + LABEL + 4 + row * rowHeight + burnerRadius,
      r: burnerRadius,
    }));
  });

  return {
    width,
    height: stove.y + stove.h + PAD,
    shelf,
    rack,
    counter,
    board,
    sink,
    stove,
    burners,
    knobWidth: Math.min(KNOB_WIDTH, stove.w / perRow - 6),
    shelfView: rowScrollArea(shelf, ITEM_SIZE, ITEM_SIZE, counts.shelf),
    rackView: rowScrollArea(rack, TOOL_CELL_WIDTH, TOOL_CELL_HEIGHT, counts.rack),
    counterView: gridScrollArea(workArea, counterColumns, counterCell, TOOL_CELL_HEIGHT, counts.counter),
    boardView: gridScrollArea(
      boardItems,
      columnsFor(boardItems.w, ITEM_SIZE),
      ITEM_SIZE,
      ITEM_SIZE,
      counts.board
    ),
    burnerToolRect: (index) => {
      const burner = burners[index];
      const size = burner.r * 1.9;
      return { x: burner.cx - size / 2, y: burner.cy - size / 2, w: size, h: size };
    },
    sinkToolRect: (() => {
      // シンクが縮んでも器具が消えないよう、最低限の大きさは残す
      const size = Math.max(32, Math.min(sink.w * 0.8, sink.h - SINK_BUTTON_SPACE - 8));
      return { x: sink.x + sink.w / 2 - size / 2, y: sink.y + 8, w: size, h: size };
    })(),
  };
}

export function pointInRect(point: Point, rect: Rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

export function pointInCircle(point: Point, circle: Circle) {
  return Math.hypot(point.x - circle.cx, point.y - circle.cy) <= circle.r;
}

export function rectCenter(rect: Rect): Point {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}
