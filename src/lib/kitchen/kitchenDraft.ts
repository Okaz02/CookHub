import type { Ingredient, Step } from "../api-recipe";
import type { CustomToolDefinition } from "./types";

// キッチンで作ったレシピを編集画面へ受け渡すための一時置き場。
// URL パラメータに載せるには大きすぎるので、メモリ上で1回だけ受け渡す。
export type KitchenDraft = {
  ingredients: Ingredient[];
  steps: Step[];
};

let pendingDraft: KitchenDraft | null = null;

export function setKitchenDraft(draft: KitchenDraft) {
  pendingDraft = draft;
}

export function takeKitchenDraft(): KitchenDraft | null {
  const draft = pendingDraft;
  pendingDraft = null;
  return draft;
}

// ユーザーが追加した器具は、アプリを開いている間は次のキッチンでも使えるようにする。
let customToolDefinitions: CustomToolDefinition[] = [];

export function getSavedCustomTools() {
  return customToolDefinitions;
}

export function saveCustomTool(definition: CustomToolDefinition) {
  customToolDefinitions = [
    ...customToolDefinitions.filter((item) => item.name !== definition.name),
    definition,
  ];
}
