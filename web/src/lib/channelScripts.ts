import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { scriptPath } from "./dataFiles";

const execFileAsync = promisify(execFile);

// 動画一覧の取得にかける時間の上限。動画の多いチャンネルでも数十秒で終わるので、余裕を持たせる
const FETCH_TIMEOUT_MS = 5 * 60 * 1000;
// チャンネルを探すのにかける時間の上限（API を1回呼ぶだけ）
const LOOKUP_TIMEOUT_MS = 30 * 1000;

/** URL やハンドルから見つかったチャンネル。ハンドルがないチャンネルもある */
export interface FoundChannel {
  channelId: string;
  name: string;
  handle: string | null;
}

// scripts/lookup-channel.sh の出力の形
type LookupOutput = ({ type: "found" } & FoundChannel) | { type: "none" };

/**
 * scripts/lookup-channel.sh で、URL かハンドルからチャンネルを探す。見つからないときは null
 * API キーはスクリプトの中で .env から読む（ADR-0004）。通信や API のエラーのときは例外を投げる
 * シェルを通さずに引数として渡すので、入力に記号があってもコマンドとして実行されない
 */
export const lookupChannel = async (
  query: string,
): Promise<FoundChannel | null> => {
  const { stdout } = await execFileAsync(
    scriptPath("lookup-channel.sh"),
    [query],
    { timeout: LOOKUP_TIMEOUT_MS },
  );
  const output = JSON.parse(stdout) as LookupOutput;
  if (output.type === "none") return null;

  const { channelId, name, handle } = output;
  return { channelId, name, handle };
};

/**
 * scripts/fetch-videos.sh で、チャンネルの動画一覧を取り直す。取得できたかを返す
 * 失敗の理由（スクリプトのエラー文。API キーは含まない）は、開発サーバーのログに出す
 */
export const fetchVideos = async (id: string): Promise<boolean> => {
  try {
    await execFileAsync(scriptPath("fetch-videos.sh"), [id], {
      timeout: FETCH_TIMEOUT_MS,
    });
    return true;
  } catch (error) {
    const reason = (error as { stderr?: string }).stderr?.trim() || error;
    console.error(`動画一覧を取得できませんでした（${id}）:`, reason);
    return false;
  }
};
