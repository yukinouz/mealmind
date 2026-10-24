import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readSuggestSettings, writeSuggestSettings } from "./settings";

let tmpDir: string;

/** settings.json の場所 */
const settingsPath = () => path.join(tmpDir, "settings.json");

beforeEach(async () => {
  // テストごとに空の一時ディレクトリを作り、settings.ts にそこを使わせる
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "mealmind-"));
  vi.stubEnv("MEALMIND_DATA_DIR", tmpDir);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(tmpDir, { recursive: true, force: true });
});

describe("readSuggestSettings", () => {
  it("ファイルがなければ既定値（抽選スクリプトと同じ）", async () => {
    expect(await readSuggestSettings()).toEqual({
      chosenRecipeWeight: 0.2,
      favoriteRecipeWeight: 0.5,
      resuggestAfterDays: 14,
    });
  });

  it("ない項目だけ既定値にする。0 は 0 のまま読む", async () => {
    await writeFile(
      settingsPath(),
      JSON.stringify({ schemaVersion: 1, chosenRecipeWeight: 0 }),
    );

    expect(await readSuggestSettings()).toEqual({
      chosenRecipeWeight: 0,
      favoriteRecipeWeight: 0.5,
      resuggestAfterDays: 14,
    });
  });
});

describe("writeSuggestSettings", () => {
  it("3つの項目を書き、知らない項目は残す", async () => {
    await writeFile(
      settingsPath(),
      JSON.stringify({ schemaVersion: 1, memo: "残す", resuggestAfterDays: 3 }),
    );

    await writeSuggestSettings({
      chosenRecipeWeight: 0.3,
      favoriteRecipeWeight: 0.07,
      resuggestAfterDays: 30,
    });

    expect(JSON.parse(await readFile(settingsPath(), "utf8"))).toEqual({
      schemaVersion: 1,
      memo: "残す",
      chosenRecipeWeight: 0.3,
      favoriteRecipeWeight: 0.07,
      resuggestAfterDays: 30,
    });
  });

  it("ファイルがなければ schemaVersion を付けて作る", async () => {
    await writeSuggestSettings({
      chosenRecipeWeight: 0.2,
      favoriteRecipeWeight: 0.5,
      resuggestAfterDays: 14,
    });

    expect(JSON.parse(await readFile(settingsPath(), "utf8"))).toMatchObject({
      schemaVersion: 1,
    });
  });
});
