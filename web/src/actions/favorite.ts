"use server";

import { refresh } from "next/cache";
import { updateFavorite } from "@/lib/recipes";

// ハートのボタンから呼ばれ、お気に入りを書き換えて一覧を読み直す
// レシピが見つからない（別の場所で消された）ときも、読み直して今の状態を見せる
export const setFavoriteAction = async (
  id: string,
  isFavorite: boolean,
): Promise<void> => {
  await updateFavorite(id, isFavorite);
  refresh();
};
