import type { Rect } from "../../lib/kitchen/layout";
import { getCatalogEntry, type ToolCatalogId } from "../../lib/kitchen/toolCatalog";
import type { KitchenTool } from "../../lib/kitchen/types";
import { getImageSize } from "../imageSize";

// 幅 boxWidth・高さ boxHeight の枠の中に、器具の画像と器の位置を決める（枠の左上が原点）。
//   contain: 画像全体を枠に収める（器具置き場や調理台に置いてあるとき）
//   body: 器の部分を枠いっぱいにして、取っ手は枠の外にはみ出させる（コンロやシンクの上）
export function placeToolImage(
  id: ToolCatalogId,
  boxWidth: number,
  boxHeight: number,
  mode: "contain" | "body"
) {
  const { image: source, body: bodyRatio } = getCatalogEntry(id);
  const imageSize = getImageSize(source);
  const fitWidth = boxWidth * 0.92;
  const fitHeight = boxHeight * 0.92;
  const scale =
    mode === "contain"
      ? Math.min(fitWidth / imageSize.width, fitHeight / imageSize.height)
      : Math.min(fitWidth, fitHeight) / Math.max(bodyRatio.w * imageSize.width, bodyRatio.h * imageSize.height);
  const width = imageSize.width * scale;
  const height = imageSize.height * scale;
  const bodyCenterX = (bodyRatio.x + bodyRatio.w / 2) * width;
  const bodyCenterY = (bodyRatio.y + bodyRatio.h / 2) * height;
  const image: Rect =
    mode === "contain"
      ? { x: (boxWidth - width) / 2, y: (boxHeight - height) / 2, w: width, h: height }
      : { x: boxWidth / 2 - bodyCenterX, y: boxHeight / 2 - bodyCenterY, w: width, h: height };
  const body: Rect = {
    x: image.x + bodyRatio.x * width,
    y: image.y + bodyRatio.y * height,
    w: bodyRatio.w * width,
    h: bodyRatio.h * height,
  };
  return { image, body };
}

export function toolImageMode(tool: KitchenTool) {
  // コンロやシンクの上では器の部分を枠いっぱいにする
  return tool.location.area === "burner" || tool.location.area === "sink" ? "body" : "contain";
}

// 器具の器の部分がキャンバス上のどこにあるか（蓋をかぶせる位置に使う）
export function toolBodyRect(tool: KitchenTool, rect: Rect): Rect {
  if (!tool.catalogId) return rect;
  const { body } = placeToolImage(tool.catalogId, rect.w, rect.h, toolImageMode(tool));
  return { x: rect.x + body.x, y: rect.y + body.y, w: body.w, h: body.h };
}

// 器具の中の材料の最小の大きさ。これより小さくすると何かわからないので、数が多いときは重ねて並べる
const MIN_CONTENT_SIZE = 32;
const CONTENT_OVERLAP = 1.4;

// 器具の中の材料の位置。器の内側に、真ん中に寄せてできるだけ大きく並べる（body と同じ座標系）
export function contentSlots(body: Rect, count: number): Rect[] {
  const inset = Math.min(body.w, body.h) * 0.08;
  const inner = { x: body.x + inset, y: body.y + inset, w: body.w - inset * 2, h: body.h - inset * 2 };
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / columns));
  // 少し重なってもよいので、きっちり並べたときより大きめにする（器の内側よりは大きくしない）
  const fitted = Math.min(inner.w / columns, inner.h / rows) * CONTENT_OVERLAP;
  const size = Math.max(MIN_CONTENT_SIZE, Math.min(inner.w, inner.h, fitted));
  // 器に収まらないときは間隔を詰めて重ねる
  const stepX = columns > 1 ? Math.min(size, Math.max(0, inner.w - size) / (columns - 1)) : 0;
  const stepY = rows > 1 ? Math.min(size, Math.max(0, inner.h - size) / (rows - 1)) : 0;
  const blockH = size + stepY * (rows - 1);
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const inRow = row === rows - 1 ? count - row * columns : columns;
    const rowW = size + stepX * (inRow - 1);
    return {
      x: inner.x + (inner.w - rowW) / 2 + (index % columns) * stepX,
      y: inner.y + (inner.h - blockH) / 2 + row * stepY,
      w: size,
      h: size,
    };
  });
}
