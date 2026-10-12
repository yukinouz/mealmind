import { readFile } from "node:fs/promises";
import path from "node:path";

// npm run dev は web/ で実行するので、リポジトリ直下は1つ上になる
const SOURCES_PATH = path.resolve(
  process.cwd(),
  "..",
  "data",
  "personal",
  "sources.json",
);

/** 絞り込みのボタンに出すチャンネル */
export interface Channel {
  id: string;
  label: string;
}

// data/personal/sources.json の1件の形（ここで使う項目だけ）
interface SourceEntry {
  id: string;
  name: string;
  shortName?: string;
}

/** 提案元を、ボタンに出す名前（shortName。なければ name）と一緒に読む。ファイルがないときは空 */
export const readChannels = async (): Promise<Channel[]> => {
  const json = await readFile(SOURCES_PATH, "utf8").catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (json === null) return [];

  const { sources } = JSON.parse(json) as { sources: SourceEntry[] };
  return sources.map((source) => ({
    id: source.id,
    label: source.shortName ?? source.name,
  }));
};
