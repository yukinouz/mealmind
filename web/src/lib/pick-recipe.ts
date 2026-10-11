import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { Meal } from "@/lib/recipes";

const execFileAsync = promisify(execFile);

// npm run dev は web/ で実行するので、リポジトリ直下は1つ上になる
const SCRIPT_PATH = path.resolve(
  process.cwd(),
  "..",
  "scripts",
  "pick-recipe.sh",
);

// 画面に一度に出すレシピの数
const PICK_COUNT = 5;

// scripts/pick-recipe.sh --count が出力する配列の1件の形（YouTube だけ）
export interface PickedRecipe {
  type: "youtube";
  meal: Meal;
  sourceId: string;
  channelName: string;
  title: string;
  url: string;
  videoId: string;
  publishedAt: string;
  status: "new" | "chosen" | "favorite";
  candidateCount: number;
  description: string;
}

export interface PickOptions {
  keywords: string[];
  meal: Meal;
}

/**
 * キーワードと食事を指定して、重ならないように最大 PICK_COUNT 件を抽選する
 * 候補がなければ空の配列を返す。スクリプトが失敗したときは例外を投げる
 * シェルを通さずに引数として渡すので、キーワードに記号があってもコマンドとして実行されない
 */
export const pickRecipes = async ({
  keywords,
  meal,
}: PickOptions): Promise<PickedRecipe[]> => {
  const { stdout } = await execFileAsync(SCRIPT_PATH, [
    ...keywords,
    "--meal",
    meal,
    "--count",
    String(PICK_COUNT),
  ]);
  return JSON.parse(stdout) as PickedRecipe[];
};
