"use server";

import { refresh } from "next/cache";
import { hideRecipes } from "@/lib/recipes";
import { isIdList } from "@/utils/idList";

export type HideResult = { type: "saved" } | { type: "error" };

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
