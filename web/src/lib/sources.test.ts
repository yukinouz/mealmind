import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type ChannelSetting,
  readChannelSettings,
  readChannels,
  writeChannelSettings,
} from "./sources";

let tmpDir: string;

/** 一時ディレクトリの中の、個人データとキャッシュの場所 */
const personalDir = () => path.join(tmpDir, "personal");
const cacheDir = () => path.join(tmpDir, "cache");

// sources.json の1件。画面で扱わない項目（type・isEnabled）も持たせる
const RYUJI = {
  id: "ryuji",
  type: "youtube",
  name: "料理研究家リュウジのバズレシピ",
  shortName: "リュウジ",
  handle: "@ryuji825",
  channelId: "UCW01sMEVYQdhcvkrhbxdBpw",
  weight: 60,
  isEnabled: true,
};

const KUMA = {
  id: "kuma",
  type: "youtube",
  name: "くまの限界食堂",
  handle: "@genkaiguma",
  channelId: "UCw2lRr9C-KTpoNlYK-oH93g",
  weight: 40,
  isEnabled: false,
};

/** sources.json を置く */
const writeSources = (sources: object[]) =>
  writeFile(
    path.join(personalDir(), "sources.json"),
    JSON.stringify({ schemaVersion: 1, sources }),
  );

/** sources.json を読む */
const readSourcesJson = async () =>
  JSON.parse(await readFile(path.join(personalDir(), "sources.json"), "utf8"));

/** 動画一覧のキャッシュを置く */
const writeCache = (id: string, count: number) =>
  writeFile(
    path.join(cacheDir(), `videos-${id}.json`),
    JSON.stringify({
      schemaVersion: 1,
      sourceId: id,
      fetchedAt: "2026-10-20T01:00:00Z",
      videos: Array.from({ length: count }, (_, i) => ({ videoId: `v${i}` })),
    }),
  );

/** 画面で編集する形の1件 */
const setting = (overrides: Partial<ChannelSetting> = {}): ChannelSetting => ({
  id: "ryuji",
  name: RYUJI.name,
  shortName: "リュウジ",
  handle: "@ryuji825",
  channelId: RYUJI.channelId,
  weight: 60,
  ...overrides,
});

beforeEach(async () => {
  // テストごとに空の一時ディレクトリを作り、sources.ts にそこを使わせる
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "mealmind-"));
  await mkdir(personalDir());
  await mkdir(cacheDir());
  vi.stubEnv("MEALMIND_DATA_DIR", personalDir());
  vi.stubEnv("MEALMIND_CACHE_DIR", cacheDir());
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(tmpDir, { recursive: true, force: true });
});

describe("readChannels", () => {
  it("ボタンに出す名前は shortName、なければ name", async () => {
    await writeSources([RYUJI, KUMA]);

    expect(await readChannels()).toEqual([
      { id: "ryuji", label: "リュウジ" },
      { id: "kuma", label: "くまの限界食堂" },
    ]);
  });

  it("ファイルがなければ空", async () => {
    expect(await readChannels()).toEqual([]);
  });
});

describe("readChannelSettings", () => {
  it("動画一覧のキャッシュの件数と取得日時を添える。キャッシュがなければ null", async () => {
    await writeSources([RYUJI, KUMA]);
    await writeCache("ryuji", 3);

    const channels = await readChannelSettings();

    expect(channels[0]).toEqual({
      ...setting(),
      videos: { count: 3, fetchedAt: "2026-10-20T01:00:00Z" },
    });
    expect(channels[1]).toMatchObject({
      id: "kuma",
      shortName: "くまの限界食堂",
      videos: null,
    });
  });

  it("キャッシュが壊れていても、null として読む", async () => {
    await writeSources([RYUJI]);
    await writeFile(path.join(cacheDir(), "videos-ryuji.json"), "{壊れた");

    expect((await readChannelSettings())[0].videos).toBeNull();
  });
});

describe("writeChannelSettings", () => {
  it("表示名と割合を書き換え、画面で扱わない項目は残す", async () => {
    await writeSources([RYUJI, KUMA]);

    await writeChannelSettings([
      setting({ shortName: "リュウジさん", weight: 70 }),
      setting({
        id: "kuma",
        name: KUMA.name,
        shortName: "くま",
        handle: KUMA.handle,
        channelId: KUMA.channelId,
        weight: 30,
      }),
    ]);

    const { schemaVersion, sources } = await readSourcesJson();
    expect(schemaVersion).toBe(1);
    expect(sources).toEqual([
      { ...RYUJI, shortName: "リュウジさん", weight: 70 },
      { ...KUMA, shortName: "くま", weight: 30 },
    ]);
  });

  it("追加したチャンネルは type・isEnabled を付けて書き、id を返す", async () => {
    await writeSources([RYUJI]);

    const diff = await writeChannelSettings([
      setting({ weight: 50 }),
      setting({
        id: "daily-chinese",
        name: "Daily Chinese",
        shortName: "中華",
        handle: "@daily_chinese",
        channelId: "UCabc",
        weight: 50,
      }),
    ]);

    expect(diff).toEqual({ addedIds: ["daily-chinese"], removedIds: [] });
    expect((await readSourcesJson()).sources[1]).toEqual({
      id: "daily-chinese",
      type: "youtube",
      isEnabled: true,
      name: "Daily Chinese",
      shortName: "中華",
      handle: "@daily_chinese",
      channelId: "UCabc",
      weight: 50,
    });
  });

  it("削除したチャンネルは sources.json から外し、動画一覧のキャッシュも消す", async () => {
    await writeSources([RYUJI, KUMA]);
    await writeCache("ryuji", 1);
    await writeCache("kuma", 1);

    const diff = await writeChannelSettings([setting({ weight: 100 })]);

    expect(diff).toEqual({ addedIds: [], removedIds: ["kuma"] });
    expect(
      (await readSourcesJson()).sources.map(
        (source: { id: string }) => source.id,
      ),
    ).toEqual(["ryuji"]);
    expect((await readChannelSettings())[0].videos).not.toBeNull();
    await expect(
      readFile(path.join(cacheDir(), "videos-kuma.json")),
    ).rejects.toThrow();
  });

  it("ハンドルがないチャンネルは handle を書かない", async () => {
    await writeSources([]);

    await writeChannelSettings([
      setting({ id: "channel", handle: null, weight: 100 }),
    ]);

    expect((await readSourcesJson()).sources[0]).not.toHaveProperty("handle");
  });
});
