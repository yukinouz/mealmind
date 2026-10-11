import type { Recipe } from "@/lib/recipes";

const YOUTUBE_WATCH_URL = "https://www.youtube.com/watch";

/** YouTube は id が動画 ID なので画像の URL を組み立てる。それ以外は画像なし（null） */
export const thumbnailUrlOf = (
  recipe: Pick<Recipe, "id" | "url">,
): string | null => {
  if (!recipe.url.startsWith(YOUTUBE_WATCH_URL)) return null;

  return `https://i.ytimg.com/vi/${recipe.id}/mqdefault.jpg`;
};
