"use server";

import { type PickedRecipe, pickRecipe } from "@/lib/pick-recipe";

export type PickState =
  | { type: "idle" }
  | PickedRecipe
  | { type: "error"; message: string };

// 画面のボタンから呼ばれ、抽選結果を返す
export const pickRecipeAction = async (): Promise<PickState> => {
  try {
    return await pickRecipe();
  } catch (error) {
    // スクリプトのエラーメッセージ（標準エラー出力）があれば、それを表示する
    const stderr = (error as { stderr?: string }).stderr?.trim();
    return { type: "error", message: stderr || "抽選に失敗しました" };
  }
};
