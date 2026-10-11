"use server";

import { type PickedRecipe, pickRecipes } from "@/lib/pick-recipe";
import type { Meal } from "@/lib/recipes";

export type PickState =
  | { type: "idle" }
  | { type: "picked"; recipes: PickedRecipe[] }
  | { type: "none" }
  | { type: "error"; message: string };

export interface PickInput {
  keyword: string;
  meal: Meal;
}

const MEALS: readonly string[] = ["dinner", "lunch"] satisfies Meal[];

/** サーバーアクションは画面の外からも呼べるので、届いた値が正しい食事か確かめる */
const isMeal = (value: unknown): value is Meal =>
  typeof value === "string" && MEALS.includes(value);

/** 入力を空白（全角も含む）で区切る。「-」で始まる言葉はスクリプトのオプションと間違われるので外す */
const toKeywords = (keyword: unknown): string[] => {
  if (typeof keyword !== "string") return [];

  return keyword
    .split(/\s+/)
    .filter((word) => word !== "" && !word.startsWith("-"));
};

/** 画面のボタンから呼ばれ、抽選結果を返す */
export const pickRecipeAction = async (
  _previousState: PickState,
  { keyword, meal }: PickInput,
): Promise<PickState> => {
  if (!isMeal(meal)) {
    return { type: "error", message: "食事の指定が正しくありません" };
  }

  try {
    const recipes = await pickRecipes({ keywords: toKeywords(keyword), meal });
    if (recipes.length === 0) return { type: "none" };

    return { type: "picked", recipes };
  } catch (error) {
    // スクリプトのエラーメッセージ（標準エラー出力）があれば、それを表示する
    const stderr = (error as { stderr?: string }).stderr?.trim();
    return { type: "error", message: stderr || "抽選に失敗しました" };
  }
};
