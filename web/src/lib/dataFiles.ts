import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * 個人データを置くディレクトリ。MEALMIND_DATA_DIR が空でなければそこを使う（テストや画面の確認で、一時ディレクトリに向けるため）
 * なければ data/personal。npm run dev は web/ で実行するので、リポジトリ直下は1つ上になる
 * 個人データは mealmind-data リポジトリにあり、data/personal はそこへのリンク
 * 環境変数の変更に追いつけるよう、使うたびに組み立てる
 */
export const dataDir = (): string =>
  process.env.MEALMIND_DATA_DIR ||
  path.resolve(process.cwd(), "..", "data", "personal");

/** 動画一覧のキャッシュを置くディレクトリ。MEALMIND_CACHE_DIR が空でなければそこを使う。なければ data/cache */
export const cacheDir = (): string =>
  process.env.MEALMIND_CACHE_DIR ||
  path.resolve(process.cwd(), "..", "data", "cache");

/** scripts/ の中のスクリプトの場所 */
export const scriptPath = (name: string): string =>
  path.resolve(process.cwd(), "..", "scripts", name);

/** JSON を読む。ファイルがないときは empty を返す */
export const readJson = async <T>(filePath: string, empty: T): Promise<T> => {
  const json = await readFile(filePath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (json === null) return empty;

  return JSON.parse(json) as T;
};

/**
 * 書き込みの途中で壊れないよう、一時ファイルに書いてから置き換える（suggest スキルと同じ方法）
 * 整形は jq の出力（2スペース・末尾に改行）に合わせる
 */
export const writeJsonSafely = async (filePath: string, data: unknown) => {
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmpPath, filePath);
};

// 書き込みの順番待ち。読んでから書くまでの間に別の書き込みが割り込むと、片方の変更が消えるため
let queue: Promise<unknown> = Promise.resolve();

/** 書き込みを1つずつ順番に実行する。前の書き込みが失敗しても、次は実行する */
export const inOrder = <T>(task: () => Promise<T>): Promise<T> => {
  const result = queue.then(task);
  queue = result.catch(() => undefined);
  return result;
};
