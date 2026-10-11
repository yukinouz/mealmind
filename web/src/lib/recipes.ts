import { readFile, rename, writeFile } from "node:fs/promises";
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
  mainIngredients?: string[];
  isFavorite: boolean;
  registeredAt: string;
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

// 指定したレシピの isFavorite を書き換える。見つからないときは何もしない
export const updateFavorite = async (
  id: string,
  isFavorite: boolean,
): Promise<void> => {
  // 一覧で使わない項目（材料など）も消さないよう、型で絞らずにそのまま読み書きする
  const json = await readFile(RECIPES_PATH, "utf8");
  const data = JSON.parse(json) as { recipes: Record<string, unknown>[] };
  const hasRecipe = data.recipes.some((recipe) => recipe.id === id);
  if (!hasRecipe) return;

  const recipes = data.recipes.map((recipe) =>
    recipe.id === id ? { ...recipe, isFavorite } : recipe,
  );
  await writeJsonSafely(RECIPES_PATH, { ...data, recipes });
};

// 追加した日時（registeredAt）が新しい順に並べた、新しい配列を返す
// 時差の表記が違っても正しく比べられるよう、日時に変換してから比べる
export const sortByNewest = (recipes: Recipe[]): Recipe[] =>
  recipes.toSorted(
    (a, b) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt),
  );

// YouTube は id が動画 ID なので画像の URL を組み立てる。それ以外は画像なし（null）
export const thumbnailUrlOf = (recipe: Recipe): string | null => {
  if (!recipe.url.startsWith(YOUTUBE_WATCH_URL)) return null;

  return `https://i.ytimg.com/vi/${recipe.id}/mqdefault.jpg`;
};

// 書き込みの途中で壊れないよう、一時ファイルに書いてから置き換える（suggest スキルと同じ方法）
// 整形は jq の出力（2スペース・末尾に改行）に合わせる
const writeJsonSafely = async (filePath: string, data: unknown) => {
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmpPath, filePath);
};
