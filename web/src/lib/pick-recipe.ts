import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// npm run dev は web/ で実行するので、リポジトリ直下は1つ上になる
const SCRIPT_PATH = path.resolve(
  process.cwd(),
  "..",
  "scripts",
  "pick-recipe.sh",
);

// scripts/pick-recipe.sh が出力する JSON の形（type で分岐する）
export type PickedRecipe =
  | {
      type: "youtube";
      meal: string;
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
  | {
      type: "kurashiru";
      sourceId: string;
      channelName: string;
      siteUrl: string;
      keywords: string[];
      meal: string;
    }
  | { type: "none" };

// レシピを1件抽選する。スクリプトが失敗したときは例外を投げる
export const pickRecipe = async (): Promise<PickedRecipe> => {
  const { stdout } = await execFileAsync(SCRIPT_PATH);
  return JSON.parse(stdout) as PickedRecipe;
};
