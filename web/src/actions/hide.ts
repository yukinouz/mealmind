"use server";

import { refresh } from "next/cache";
import { hideRecipes } from "@/lib/recipes";

export type HideResult = { type: "saved" } | { type: "error" };

// 一度に外せる件数の上限。画面の外から大きすぎる値が送られてきたときに断る
const MAX_IDS = 1000;

/** サーバーアクションは画面の外からも呼べるので、届いた値が空でない文字列の配列かを確かめる */
const isIdList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= MAX_IDS &&
  value.every((id) => typeof id === "string" && id !== "");

/** 「レシピを整理する」の「完了」から呼ばれ、削除予定のレシピを excluded.json へ移して一覧を読み直す */
export const hideRecipesAction = async (ids: string[]): Promise<HideResult> => {
  if (!isIdList(ids)) return { type: "error" };

  try {
    await hideRecipes(ids);
    refresh();
    return { type: "saved" };
  } catch {
    return { type: "error" };
  }
};
