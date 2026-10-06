import { BURNER_COUNT } from "./constants";

// 上から見たキッチンの配置。すべてキャンバス左上を原点とした座標で表す。
//
//   ┌──────────── 棚 ────────────┐
//   │ 材料 材料 材料 …            │
//   ├──── まな板 ────┬─ 調理台 ──┤
//   │                │ 包丁 水    │
//   │                │ 鍋  …     │
//   ├──────────── コンロ ─────────┤
//   │     ( 1 )          ( 2 )    │
//   └─────────────────────────────┘

export type Rect = { x: number; y: number; w: number; h: number };
export type Circle = { cx: number; cy: number; r: number };
export type Point = { x: number; y: number };

export const INGREDIENT_SIZE = 56;

const PAD = 12;
const GAP = 10;
const LABEL = 24;
const CELL_GAP = 8;
const RACK_COLUMNS = 2;
const STOVE_HEIGHT = 210;

export type KitchenLayout = {
  width: number;
  height: number;
  shelf: Rect;
  board: Rect;
  rack: Rect;
  stove: Rect;
  burners: Circle[];
  rackCell: number;
  shelfSlot: (index: number) => Rect;
  boardSlot: (index: number) => Rect;
  rackSlot: (index: number) => Rect;
  burnerToolRect: (index: number) => Rect;
};

function gridSlot(area: Rect, columns: number, size: number, index: number): Rect {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: area.x + CELL_GAP + column * (size + CELL_GAP),
    y: area.y + LABEL + row * (size + CELL_GAP),
    w: size,
    h: size,
  };
}

function columnsFor(width: number, size: number) {
  return Math.max(1, Math.floor((width - CELL_GAP) / (size + CELL_GAP)));
}

export function computeLayout(
  width: number,
  counts: { shelf: number; board: number; rack: number }
): KitchenLayout {
  const innerWidth = width - PAD * 2;

  const shelfColumns = columnsFor(innerWidth, INGREDIENT_SIZE);
  const shelfRows = Math.max(1, Math.ceil(counts.shelf / shelfColumns));
  const shelf: Rect = {
    x: PAD,
    y: PAD,
    w: innerWidth,
    h: LABEL + shelfRows * (INGREDIENT_SIZE + CELL_GAP) + CELL_GAP,
  };

  const boardWidth = Math.floor((innerWidth - GAP) * 0.6);
  const rackWidth = innerWidth - GAP - boardWidth;
  const rackCell = Math.floor((rackWidth - CELL_GAP * (RACK_COLUMNS + 1)) / RACK_COLUMNS);
  const boardColumns = columnsFor(boardWidth, INGREDIENT_SIZE);
  const boardRows = Math.max(2, Math.ceil(counts.board / boardColumns));
  const rackRows = Math.max(2, Math.ceil(counts.rack / RACK_COLUMNS));
  const middleTop = shelf.y + shelf.h + GAP;
  const middleHeight = Math.max(
    LABEL + boardRows * (INGREDIENT_SIZE + CELL_GAP) + CELL_GAP,
    LABEL + rackRows * (rackCell + CELL_GAP) + CELL_GAP
  );
  const board: Rect = { x: PAD, y: middleTop, w: boardWidth, h: middleHeight };
  const rack: Rect = { x: PAD + boardWidth + GAP, y: middleTop, w: rackWidth, h: middleHeight };

  const stove: Rect = { x: PAD, y: middleTop + middleHeight + GAP, w: innerWidth, h: STOVE_HEIGHT };
  const burnerRadius = Math.min(stove.w / (BURNER_COUNT * 2) - 14, (stove.h - LABEL - 40) / 2);
  const burners: Circle[] = Array.from({ length: BURNER_COUNT }, (_, index) => ({
    cx: stove.x + (stove.w / BURNER_COUNT) * (index + 0.5),
    cy: stove.y + LABEL + burnerRadius + 4,
    r: burnerRadius,
  }));

  return {
    width,
    height: stove.y + stove.h + PAD,
    shelf,
    board,
    rack,
    stove,
    burners,
    rackCell,
    shelfSlot: (index) => gridSlot(shelf, shelfColumns, INGREDIENT_SIZE, index),
    boardSlot: (index) => gridSlot(board, boardColumns, INGREDIENT_SIZE, index),
    rackSlot: (index) => gridSlot(rack, RACK_COLUMNS, rackCell, index),
    burnerToolRect: (index) => {
      const burner = burners[index];
      const size = burner.r * 1.9;
      return { x: burner.cx - size / 2, y: burner.cy - size / 2, w: size, h: size };
    },
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
