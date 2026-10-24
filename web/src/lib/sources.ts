import { unlink } from "node:fs/promises";
import path from "node:path";
import {
  cacheDir,
  dataDir,
  inOrder,
  readJson,
  writeJsonSafely,
} from "./dataFiles";

/** 絞り込みのボタンに出すチャンネル */
export interface Channel {
  id: string;
  label: string;
}

/** 動画一覧のキャッシュから分かること。件数と取得した日時 */
export interface VideoCache {
  count: number;
  fetchedAt: string;
}

/** 設定の画面で編集するチャンネル。shortName はボタンなどに出す短い名前 */
export interface ChannelSetting {
  id: string;
  name: string;
  shortName: string;
  handle: string | null;
  channelId: string;
  weight: number;
}

/** 設定の画面に出すチャンネル。動画一覧をまだ取得していない（取得に失敗した）ときは videos が null */
export interface ChannelWithVideos extends ChannelSetting {
  videos: VideoCache | null;
}

/** 書き込んだ結果。追加・削除したチャンネルの id */
export interface ChannelsDiff {
  addedIds: string[];
  removedIds: string[];
}

// 一部の項目（isEnabled など）を画面で扱わなくても消さないよう、型で絞らずにそのまま読み書きする
type JsonRecord = Record<string, unknown>;

interface SourcesFile {
  schemaVersion: number;
  sources: JsonRecord[];
}

// data/personal/sources.json の1件の形（ここで使う項目だけ）
interface SourceEntry {
  id: string;
  name: string;
  shortName?: string;
  handle?: string;
  channelId: string;
  weight: number;
}

// data/cache/videos-<id>.json の形（ここで使う項目だけ）
interface VideosFile {
  fetchedAt: string;
  videos: unknown[];
}

/** sources.json の場所。環境変数の変更に追いつけるよう、使うたびに組み立てる */
const sourcesPath = (): string => path.join(dataDir(), "sources.json");

/** 動画一覧のキャッシュの場所 */
const videosPath = (id: string): string =>
  path.join(cacheDir(), `videos-${id}.json`);

/** 動画一覧のキャッシュを消す。もうないときは何もしない */
const removeVideoCache = async (id: string) => {
  await unlink(videosPath(id)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
};

/** sources.json を読む。ファイルがないときは空 */
const readSourcesFile = () =>
  readJson<SourcesFile>(sourcesPath(), { schemaVersion: 1, sources: [] });

/** sources.json の1件を、画面で編集する形にする */
const toChannelSetting = (entry: JsonRecord): ChannelSetting => {
  const source = entry as unknown as SourceEntry;
  return {
    id: source.id,
    name: source.name,
    shortName: source.shortName ?? source.name,
    handle: source.handle ?? null,
    channelId: source.channelId,
    weight: source.weight,
  };
};

/** 画面で編集したチャンネルを、sources.json の1件にする。画面で扱わない項目は、元の値を残す */
const toSourceEntry = (
  channel: ChannelSetting,
  saved: JsonRecord | undefined,
): JsonRecord => ({
  ...(saved ?? { id: channel.id, type: "youtube", isEnabled: true }),
  name: channel.name,
  shortName: channel.shortName,
  ...(channel.handle === null ? {} : { handle: channel.handle }),
  channelId: channel.channelId,
  weight: channel.weight,
});

/** 動画一覧のキャッシュの件数と取得日時を読む。ないとき・読めないときは null */
export const readVideoCache = async (
  id: string,
): Promise<VideoCache | null> => {
  const file = await readJson<VideosFile | null>(videosPath(id), null).catch(
    () => null,
  );
  if (file === null || !Array.isArray(file.videos)) return null;
  return { count: file.videos.length, fetchedAt: file.fetchedAt };
};

/** 提案元を、ボタンに出す名前（shortName。なければ name）と一緒に読む。ファイルがないときは空 */
export const readChannels = async (): Promise<Channel[]> => {
  const { sources } = await readSourcesFile();
  return sources.map(toChannelSetting).map((channel) => ({
    id: channel.id,
    label: channel.shortName,
  }));
};

/** 設定の画面に出すチャンネルを、動画一覧のキャッシュの件数・取得日時と一緒に読む */
export const readChannelSettings = async (): Promise<ChannelWithVideos[]> => {
  const { sources } = await readSourcesFile();
  return Promise.all(
    sources.map(toChannelSetting).map(async (channel) => ({
      ...channel,
      videos: await readVideoCache(channel.id),
    })),
  );
};

/**
 * 画面で編集したチャンネルの一覧で、sources.json を書き換える。並びも画面と同じにする
 * 一覧にないチャンネルは削除し、その動画一覧のキャッシュも消す（記録済みのレシピは残す）
 */
export const writeChannelSettings = (
  channels: ChannelSetting[],
): Promise<ChannelsDiff> =>
  inOrder(async () => {
    const data = await readSourcesFile();
    const savedById = new Map(
      data.sources.map((entry) => [String(entry.id), entry]),
    );
    const nextIds = new Set(channels.map((channel) => channel.id));

    const sources = channels.map((channel) =>
      toSourceEntry(channel, savedById.get(channel.id)),
    );
    await writeJsonSafely(sourcesPath(), { ...data, sources });

    const addedIds = channels
      .map((channel) => channel.id)
      .filter((id) => !savedById.has(id));
    const removedIds = [...savedById.keys()].filter((id) => !nextIds.has(id));
    await Promise.all(removedIds.map(removeVideoCache));
    return { addedIds, removedIds };
  });
