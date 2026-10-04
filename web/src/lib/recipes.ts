import { readFile } from "node:fs/promises";
import path from "node:path";

// npm run dev は web/ で実行するので、リポジトリ直下は1つ上になる
const RECIPES_PATH = path.resolve(process.cwd(), "..", "data", "recipes.json");

const YOUTUBE_WATCH_URL = "https://www.youtube.com/watch";

export type Meal = "lunch" | "dinner";

// data/recipes.json の1件の形（一覧で使う項目だけ）
export type Recipe = {
  id: string;
  title: string;
  url: string;
  sourceId: string;
  channel: string;
  meals: Meal[];
  isFavorite: boolean;
};

// 「作る」と決めたレシピをすべて読む。ファイルがまだないときは空の一覧を返す
export const readRecipes = async (): Promise<Recipe[]> => {
  const json = await readFile(RECIPES_PATH, "utf8").catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (json === null) return [];

  return (JSON.parse(json) as { recipes: Recipe[] }).recipes;
};

// YouTube は id が動画 ID なので画像の URL を組み立てる。それ以外は画像なし（null）
export const thumbnailUrlOf = (recipe: Recipe): string | null => {
  if (!recipe.url.startsWith(YOUTUBE_WATCH_URL)) return null;

  return `https://i.ytimg.com/vi/${recipe.id}/mqdefault.jpg`;
};
