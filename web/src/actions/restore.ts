"use server";

import { refresh } from "next/cache";
import { restoreRecipes } from "@/lib/recipes";
import { isIdList } from "@/utils/idList";

export type RestoreResult = { type: "saved" } | { type: "error" };

/** 非表示レシピのページの「完了」から呼ばれ、戻す予定のレシピを recipes.json へ移して一覧を読み直す */
export const restoreRecipesAction = async (
  ids: string[],
): Promise<RestoreResult> => {
  if (!isIdList(ids)) return { type: "error" };

  try {
    await restoreRecipes(ids);
    refresh();
    return { type: "saved" };
  } catch {
    return { type: "error" };
  }
};
