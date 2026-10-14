import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fillIngredients,
  findUnfilled,
  hideRecipes,
  type NewRecipe,
  readRecipes,
  recordMake,
  recordReject,
  restoreRecipes,
  updateFavorite,
} from "./recipes";

// 日時を固定する。日本時間の 2026-10-14 19:00
const NOW = new Date("2026-10-14T10:00:00Z");
const NOW_TEXT = "2026-10-14T19:00:00+09:00";

let tmpDir: string;

/** 一時ディレクトリにある JSON ファイルを読む */
const readJson = async (name: string) =>
  JSON.parse(await readFile(path.join(tmpDir, name), "utf8"));

/** 一時ディレクトリに JSON ファイルを書く */
const writeJson = (name: string, data: unknown) =>
  writeFile(path.join(tmpDir, name), JSON.stringify(data), "utf8");

/** recipes.json を、指定したレシピで用意する */
const givenRecipes = (recipes: unknown[]) =>
  writeJson("recipes.json", { schemaVersion: 1, recipes });

/** excluded.json を、指定したレシピで用意する */
const givenExcluded = (excluded: unknown[]) =>
  writeJson("excluded.json", { schemaVersion: 1, excluded });

/** 画面から記録するレシピ */
const newRecipe = (id: string): NewRecipe => ({
  id,
  title: `料理${id}`,
  url: `https://www.youtube.com/watch?v=${id}`,
  sourceId: "chef-a",
  channel: "シェフA",
  meal: "dinner",
});

/** recipes.json に記録済みのレシピ。材料など一覧で使わない項目も持つ */
const savedRecipe = (id: string, overrides: object = {}) => ({
  id,
  title: `料理${id}`,
  url: `https://www.youtube.com/watch?v=${id}`,
  sourceId: "chef-a",
  channel: "シェフA",
  meals: ["dinner"],
  registeredAt: "2026-10-01T19:00:00+09:00",
  chosenDates: ["2026-10-01"],
  isFavorite: false,
  ingredients: [{ name: "鯖", amount: "2切れ" }],
  mainIngredients: ["鯖"],
  cuisine: "washoku",
  ...overrides,
});

beforeEach(async () => {
  // テストごとに空の一時ディレクトリを作り、recipes.ts にそこを使わせる
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "mealmind-"));
  vi.stubEnv("MEALMIND_DATA_DIR", tmpDir);
  // ファイルの読み書きは本物のまま、日時だけを固定する
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  await rm(tmpDir, { recursive: true, force: true });
});

describe("readRecipes", () => {
  it("ファイルがまだなければ空の一覧を返す", async () => {
    expect(await readRecipes()).toEqual([]);
  });
});

describe("recordMake", () => {
  it("新しいレシピは、材料とメイン食材を持たずに追加する", async () => {
    await recordMake(newRecipe("a"));

    const { recipes } = await readJson("recipes.json");
    expect(recipes).toEqual([
      {
        id: "a",
        title: "料理a",
        url: "https://www.youtube.com/watch?v=a",
        sourceId: "chef-a",
        channel: "シェフA",
        meals: ["dinner"],
        registeredAt: NOW_TEXT,
        chosenDates: ["2026-10-14"],
        isFavorite: false,
      },
    ]);
  });

  it("同じ URL があれば、今日の日付と食事を足し、ほかの項目は残す", async () => {
    await givenRecipes([savedRecipe("a")]);

    await recordMake({ ...newRecipe("a"), meal: "lunch" });

    const { recipes } = await readJson("recipes.json");
    expect(recipes).toEqual([
      savedRecipe("a", {
        meals: ["dinner", "lunch"],
        chosenDates: ["2026-10-01", "2026-10-14"],
      }),
    ]);
  });

  it("同じ日・同じ食事を2回記録しても重ならない", async () => {
    await recordMake(newRecipe("a"));
    await recordMake(newRecipe("a"));

    const { recipes } = await readJson("recipes.json");
    expect(recipes[0].chosenDates).toEqual(["2026-10-14"]);
    expect(recipes[0].meals).toEqual(["dinner"]);
  });

  it("同時に呼んでも、どちらの記録も消えない", async () => {
    await Promise.all([
      recordMake(newRecipe("a")),
      recordMake(newRecipe("b")),
      recordMake(newRecipe("c")),
    ]);

    const { recipes } = await readJson("recipes.json");
    expect(recipes.map((recipe: { id: string }) => recipe.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("jq と同じ形（2スペース・末尾に改行）で書き、一時ファイルを残さない", async () => {
    await recordMake(newRecipe("a"));

    const text = await readFile(path.join(tmpDir, "recipes.json"), "utf8");
    expect(text).toBe(`${JSON.stringify(JSON.parse(text), null, 2)}\n`);
    await expect(
      readFile(path.join(tmpDir, "recipes.json.tmp")),
    ).rejects.toThrow();
  });
});

describe("recordReject", () => {
  it("excluded.json に「作らない」として追加する", async () => {
    await recordReject(newRecipe("a"));

    const { excluded } = await readJson("excluded.json");
    expect(excluded).toEqual([
      {
        id: "a",
        title: "料理a",
        url: "https://www.youtube.com/watch?v=a",
        sourceId: "chef-a",
        channel: "シェフA",
        meals: ["dinner"],
        chosenDates: [],
        isFavorite: false,
        excludedAt: NOW_TEXT,
        reason: "rejected",
      },
    ]);
  });

  it("同じ URL がすでにあれば何もしない", async () => {
    await recordReject(newRecipe("a"));
    await recordReject({ ...newRecipe("a"), meal: "lunch" });

    const { excluded } = await readJson("excluded.json");
    expect(excluded).toHaveLength(1);
    expect(excluded[0].meals).toEqual(["dinner"]);
  });
});

describe("updateFavorite", () => {
  it("指定したレシピの isFavorite だけを書き換える", async () => {
    await givenRecipes([savedRecipe("a"), savedRecipe("b")]);

    await updateFavorite("b", true);

    const { recipes } = await readJson("recipes.json");
    expect(recipes).toEqual([
      savedRecipe("a"),
      savedRecipe("b", { isFavorite: true }),
    ]);
  });

  it("見つからなければファイルを書き換えない", async () => {
    await givenRecipes([savedRecipe("a")]);
    const before = await readFile(path.join(tmpDir, "recipes.json"), "utf8");

    await updateFavorite("x", true);

    const after = await readFile(path.join(tmpDir, "recipes.json"), "utf8");
    expect(after).toBe(before);
  });
});

describe("hideRecipes", () => {
  it("情報を持ったまま excluded.json へ移す", async () => {
    await givenRecipes([savedRecipe("a"), savedRecipe("b")]);

    await hideRecipes(["a"]);

    const { recipes } = await readJson("recipes.json");
    const { excluded } = await readJson("excluded.json");
    expect(recipes).toEqual([savedRecipe("b")]);
    expect(excluded).toEqual([
      { ...savedRecipe("a"), excludedAt: NOW_TEXT, reason: "hidden" },
    ]);
  });

  it("excluded.json に同じ URL があれば、移すほうで置き換える", async () => {
    await givenRecipes([savedRecipe("a")]);
    await givenExcluded([
      {
        id: "a",
        url: "https://www.youtube.com/watch?v=a",
        excludedAt: "2026-09-01T19:00:00+09:00",
        reason: "rejected",
      },
    ]);

    await hideRecipes(["a"]);

    const { excluded } = await readJson("excluded.json");
    expect(excluded).toEqual([
      { ...savedRecipe("a"), excludedAt: NOW_TEXT, reason: "hidden" },
    ]);
  });

  it("見つからない id は無視する", async () => {
    await givenRecipes([savedRecipe("a")]);

    await hideRecipes(["x"]);

    const { recipes } = await readJson("recipes.json");
    expect(recipes).toEqual([savedRecipe("a")]);
  });
});

describe("restoreRecipes", () => {
  it("excluded.json から recipes.json へ戻し、外した理由と日時を消す", async () => {
    await givenExcluded([
      { ...savedRecipe("a"), excludedAt: NOW_TEXT, reason: "hidden" },
    ]);

    await restoreRecipes(["a"]);

    const { recipes } = await readJson("recipes.json");
    const { excluded } = await readJson("excluded.json");
    expect(recipes).toEqual([savedRecipe("a")]);
    expect(excluded).toEqual([]);
  });

  it("「作らない」で外したものは、戻した日時を追加日にする", async () => {
    await recordReject(newRecipe("a"));

    await restoreRecipes(["a"]);

    const { recipes } = await readJson("recipes.json");
    expect(recipes[0].registeredAt).toBe(NOW_TEXT);
    expect(recipes[0]).not.toHaveProperty("reason");
  });

  it("recipes.json に同じ URL があれば、そちらを残して excluded.json から消すだけにする", async () => {
    await givenRecipes([savedRecipe("a", { isFavorite: true })]);
    await givenExcluded([
      { ...savedRecipe("a"), excludedAt: NOW_TEXT, reason: "hidden" },
    ]);

    await restoreRecipes(["a"]);

    const { recipes } = await readJson("recipes.json");
    const { excluded } = await readJson("excluded.json");
    expect(recipes).toEqual([savedRecipe("a", { isFavorite: true })]);
    expect(excluded).toEqual([]);
  });

  it("隠してから戻すと、元の情報がすべて戻る", async () => {
    await givenRecipes([savedRecipe("a", { isFavorite: true })]);

    await hideRecipes(["a"]);
    await restoreRecipes(["a"]);

    const { recipes } = await readJson("recipes.json");
    expect(recipes).toEqual([savedRecipe("a", { isFavorite: true })]);
  });
});

describe("findUnfilled / fillIngredients", () => {
  it("メイン食材か料理の系統がない YouTube のレシピだけを探す", async () => {
    await givenRecipes([
      savedRecipe("a"),
      savedRecipe("b", { mainIngredients: undefined }),
      savedRecipe("c", { cuisine: "french" }),
      savedRecipe("d", {
        mainIngredients: undefined,
        url: "https://example.com/d",
      }),
    ]);

    const unfilled = await findUnfilled("recipes");

    expect(unfilled.map((recipe) => recipe.id)).toEqual(["b", "c"]);
  });

  it("まだない項目だけを書き込み、すでにある材料は書き換えない", async () => {
    await givenRecipes([
      savedRecipe("b", {
        ingredients: undefined,
        mainIngredients: undefined,
        cuisine: undefined,
      }),
      savedRecipe("c", { cuisine: undefined }),
    ]);
    const result = {
      ingredients: [{ name: "豚肉", amount: "200g" }],
      mainIngredients: ["豚肉"],
      cuisine: "chuka" as const,
    };

    await fillIngredients("recipes", [
      { id: "b", ...result },
      { id: "c", ...result },
    ]);

    const { recipes } = await readJson("recipes.json");
    expect(recipes[0]).toMatchObject(result);
    expect(recipes[1]).toEqual(savedRecipe("c", { cuisine: "chuka" }));
  });
});
