import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readMealsData,
  readPreferenceLists,
  writeMealsData,
  writePreferenceLists,
} from "./preferences";

let tmpDir: string;

/** preferences.json の場所 */
const preferencesPath = () => path.join(tmpDir, "preferences.json");

/** preferences.json を読む */
const readPreferencesJson = async () =>
  JSON.parse(await readFile(preferencesPath(), "utf8"));

// いまの preferences.json と同じ形
const PREFERENCES = {
  schemaVersion: 1,
  avoidIngredients: ["レバー"],
  avoidSeasonings: [],
  pantryIngredients: ["にんにく"],
  avoidTitleKeywords: ["ケーキ"],
  meals: { lunch: { onlyGenres: ["麺類"] } },
  genres: { 麺類: ["パスタ"] },
};

beforeEach(async () => {
  // テストごとに空の一時ディレクトリを作り、preferences.ts にそこを使わせる
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "mealmind-"));
  vi.stubEnv("MEALMIND_DATA_DIR", tmpDir);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(tmpDir, { recursive: true, force: true });
});

describe("readPreferenceLists", () => {
  it("ファイルがなければ、どれも空", async () => {
    expect(await readPreferenceLists()).toEqual({
      avoidIngredients: [],
      avoidSeasonings: [],
      pantryIngredients: [],
      avoidTitleKeywords: [],
    });
  });
});

describe("writePreferenceLists", () => {
  it("4つの項目を書き、genres・meals はそのまま残す", async () => {
    await writeFile(preferencesPath(), JSON.stringify(PREFERENCES));

    await writePreferenceLists({
      avoidIngredients: ["レバー", "パクチー"],
      avoidSeasonings: ["カルダモン"],
      pantryIngredients: [],
      avoidTitleKeywords: ["ケーキ"],
    });

    expect(await readPreferencesJson()).toEqual({
      ...PREFERENCES,
      avoidIngredients: ["レバー", "パクチー"],
      avoidSeasonings: ["カルダモン"],
      pantryIngredients: [],
    });
  });
});

describe("readMealsData / writeMealsData", () => {
  it("genres・meals を読み書きし、ほかの項目は残す", async () => {
    await writeFile(preferencesPath(), JSON.stringify(PREFERENCES));
    expect(await readMealsData()).toEqual({
      genres: PREFERENCES.genres,
      meals: PREFERENCES.meals,
    });

    await writeMealsData({
      genres: { めん: ["パスタ"] },
      meals: { lunch: { onlyGenres: ["めん"] } },
    });

    expect(await readPreferencesJson()).toEqual({
      ...PREFERENCES,
      genres: { めん: ["パスタ"] },
      meals: { lunch: { onlyGenres: ["めん"] } },
    });
  });

  it("ファイルがなければ空", async () => {
    expect(await readMealsData()).toEqual({ genres: {}, meals: {} });
  });
});
