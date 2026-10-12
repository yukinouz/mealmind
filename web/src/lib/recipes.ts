import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { type Cuisine, isCuisine } from "@/utils/cuisine";
import { toLocalDate, toLocalDateTime } from "@/utils/localDate";

// npm run dev は web/ で実行するので、リポジトリ直下は1つ上になる
// 個人データは mealmind-data リポジトリにあり、data/personal はそこへのリンク
const DATA_DIR = path.resolve(process.cwd(), "..", "data", "personal");
const RECIPES_PATH = path.join(DATA_DIR, "recipes.json");
const EXCLUDED_PATH = path.join(DATA_DIR, "excluded.json");

export type Meal = "lunch" | "dinner";

// data/personal/recipes.json の1件の形（一覧で使う項目だけ）
export type Recipe = {
  id: string;
  title: string;
  url: string;
  sourceId: string;
  channel: string;
  meals: Meal[];
  mainIngredients?: string[];
  cuisine?: Cuisine;
  isFavorite: boolean;
  registeredAt: string;
};

/** 外した理由。rejected は提案で「作らない」を選んだもの、hidden はレシピ一覧から削除したもの */
export type ExcludedReason = "rejected" | "hidden";

/** data/personal/excluded.json の1件の形（非表示レシピのページで使う項目だけ）。「作らない」で外したものは registeredAt を持たない */
export interface HiddenRecipe extends Omit<Recipe, "registeredAt"> {
  registeredAt?: string;
  excludedAt: string;
  reason: ExcludedReason;
}

/** 画面から記録するレシピ。材料とメイン食材は、あとでレシピを見せるページを開いたときに埋める（ADR-0010） */
export interface NewRecipe {
  id: string;
  title: string;
  url: string;
  sourceId: string;
  channel: string;
  meal: Meal;
}

/** 材料・メイン食材・料理の系統を埋めるファイル。recipes はレシピ一覧、excluded は非表示のレシピのページで埋める */
export type FillTarget = "recipes" | "excluded";

/** 材料・メイン食材・料理の系統のどれかがまだないレシピ（埋めるために使う項目だけ） */
export interface UnfilledRecipe {
  id: string;
  title: string;
  sourceId: string;
}

/** Claude が決めた、1件分の材料・メイン食材・料理の系統 */
export interface FilledIngredients {
  id: string;
  ingredients: { name: string; amount: string }[];
  mainIngredients: string[];
  cuisine: Cuisine;
}

// 一覧で使わない項目（材料など）も消さないよう、型で絞らずにそのまま読み書きする
type JsonRecord = Record<string, unknown>;

interface RecipesFile {
  schemaVersion: number;
  recipes: JsonRecord[];
}

interface ExcludedFile {
  schemaVersion: number;
  excluded: JsonRecord[];
}

/** 「作る」と決めたレシピをすべて読む。ファイルがまだないときは空の一覧を返す */
export const readRecipes = async (): Promise<Recipe[]> => {
  const data = await readRecipesFile();
  return data.recipes as Recipe[];
};

/** 提案されないレシピ（excluded.json）をすべて読む。ファイルがまだないときは空の一覧を返す */
export const readHiddenRecipes = async (): Promise<HiddenRecipe[]> => {
  const data = await readExcludedFile();
  return data.excluded as unknown as HiddenRecipe[];
};

/** 指定したレシピの isFavorite を書き換える。見つからないときは何もしない */
export const updateFavorite = (id: string, isFavorite: boolean) =>
  inOrder(async () => {
    const data = await readRecipesFile();
    const hasRecipe = data.recipes.some((recipe) => recipe.id === id);
    if (!hasRecipe) return;

    const recipes = data.recipes.map((recipe) =>
      recipe.id === id ? { ...recipe, isFavorite } : recipe,
    );
    await writeJsonSafely(RECIPES_PATH, { ...data, recipes });
  });

/**
 * 「作る」を記録する。同じ URL があれば、今日の日付と今回の食事を足す
 * なければ、材料とメイン食材の項目を持たずに追加する
 */
export const recordMake = (recipe: NewRecipe) =>
  inOrder(async () => {
    const now = new Date();
    const today = toLocalDate(now);
    const data = await readRecipesFile();
    const existing = data.recipes.find((item) => item.url === recipe.url);

    if (existing === undefined) {
      const { meal, ...rest } = recipe;
      const added = {
        ...rest,
        meals: [meal],
        registeredAt: toLocalDateTime(now),
        chosenDates: [today],
        isFavorite: false,
      };
      await writeJsonSafely(RECIPES_PATH, {
        ...data,
        recipes: [...data.recipes, added],
      });
      return;
    }

    const updated = {
      ...existing,
      chosenDates: addOnce(existing.chosenDates as string[], today),
      meals: addOnce(existing.meals as Meal[], recipe.meal),
    };
    const recipes = data.recipes.map((item) =>
      item === existing ? updated : item,
    );
    await writeJsonSafely(RECIPES_PATH, { ...data, recipes });
  });

/** 「作らない」を記録する。同じ URL がすでにあれば何もしない */
export const recordReject = (recipe: NewRecipe) =>
  inOrder(async () => {
    const data = await readExcludedFile();
    const hasRecipe = data.excluded.some((item) => item.url === recipe.url);
    if (hasRecipe) return;

    const { meal, ...rest } = recipe;
    const added = {
      ...rest,
      meals: [meal],
      chosenDates: [],
      isFavorite: false,
      excludedAt: toLocalDateTime(new Date()),
      reason: "rejected",
    };
    await writeJsonSafely(EXCLUDED_PATH, {
      ...data,
      excluded: [...data.excluded, added],
    });
  });

/**
 * 指定したレシピを、情報を持ったまま excluded.json から recipes.json へ戻す（ADR-0008）
 * 「作らない」で外したものも「作る」レシピとして戻す。追加日（registeredAt）がなければ戻した日時にする
 * recipes.json に同じ URL があれば、そちらを残して excluded.json から消すだけにする。見つからない id は無視する
 */
export const restoreRecipes = (ids: string[]) =>
  inOrder(async () => {
    const idSet = new Set(ids);
    const excludedData = await readExcludedFile();
    const isRestored = (item: JsonRecord) => idSet.has(item.id as string);
    const targets = excludedData.excluded.filter(isRestored);
    if (targets.length === 0) return;

    const data = await readRecipesFile();
    const recipeUrls = new Set(data.recipes.map((item) => item.url));
    const registeredAt = toLocalDateTime(new Date());
    // excluded.json の中に同じ URL が重なっていても、1件だけ移す
    const moved: JsonRecord[] = targets
      .filter((item) => {
        if (recipeUrls.has(item.url)) return false;
        recipeUrls.add(item.url);
        return true;
      })
      .map(({ excludedAt: _excludedAt, reason: _reason, ...item }) => ({
        registeredAt,
        chosenDates: [],
        isFavorite: false,
        ...item,
      }));

    // 途中で止まっても消えないよう、先に移し先へ書いてから元を消す
    await writeJsonSafely(RECIPES_PATH, {
      ...data,
      recipes: [...data.recipes, ...moved],
    });
    await writeJsonSafely(EXCLUDED_PATH, {
      ...excludedData,
      excluded: excludedData.excluded.filter((item) => !isRestored(item)),
    });
  });

/**
 * 指定したレシピを、情報を持ったまま recipes.json から excluded.json へ移す（ADR-0008）
 * excluded.json に同じ URL があれば、移すほうで置き換える。見つからない id は無視する
 */
export const hideRecipes = (ids: string[]) =>
  inOrder(async () => {
    const idSet = new Set(ids);
    const data = await readRecipesFile();
    const isHidden = (item: JsonRecord) => idSet.has(item.id as string);
    const excludedAt = toLocalDateTime(new Date());
    const moved: JsonRecord[] = data.recipes
      .filter(isHidden)
      .map((item) => ({ ...item, excludedAt, reason: "hidden" }));
    if (moved.length === 0) return;

    const excludedData = await readExcludedFile();
    const movedUrls = new Set(moved.map((item) => item.url));
    const excluded = [
      ...excludedData.excluded.filter((item) => !movedUrls.has(item.url)),
      ...moved,
    ];
    // 途中で止まっても消えないよう、先に移し先へ書いてから元を消す
    await writeJsonSafely(EXCLUDED_PATH, { ...excludedData, excluded });
    await writeJsonSafely(RECIPES_PATH, {
      ...data,
      recipes: data.recipes.filter((item) => !isHidden(item)),
    });
  });

/**
 * 指定したファイルから、メイン食材か料理の系統がまだない YouTube のレシピを探す
 * 画面から記録したレシピは、材料・メイン食材・料理の系統の項目を持たない（ADR-0010・ADR-0011）
 */
export const findUnfilled = async (
  target: FillTarget,
): Promise<UnfilledRecipe[]> => {
  const entries = await readEntries(target);

  return entries.filter(isUnfilled).map((item) => ({
    id: item.id as string,
    title: item.title as string,
    sourceId: item.sourceId as string,
  }));
};

/** recipes.json に記録したメイン食材の名前を、重ならないように集める */
export const readMainIngredientNames = async (): Promise<string[]> => {
  const data = await readRecipesFile();
  const names = data.recipes.flatMap(
    (item) => (item.mainIngredients as string[] | undefined) ?? [],
  );
  return [...new Set(names)];
};

/** 指定したファイルに、まだない項目だけを書き込む。すでにある材料・メイン食材・料理の系統は書き換えない */
export const fillIngredients = (
  target: FillTarget,
  filled: FilledIngredients[],
) =>
  inOrder(async () => {
    const byId = new Map(filled.map((item) => [item.id, item]));
    /** まだない項目だけに、Claude の結果を足す */
    const fill = (item: JsonRecord): JsonRecord => {
      const result = byId.get(item.id as string);
      if (result === undefined || !isUnfilled(item)) return item;

      // 材料とメイン食材はスキルが記録したものを残し、料理の系統だけを足すこともある
      const ingredients =
        item.mainIngredients === undefined
          ? {
              ingredients: result.ingredients,
              mainIngredients: result.mainIngredients,
            }
          : {};
      const cuisine = isCuisine(item.cuisine)
        ? {}
        : { cuisine: result.cuisine };
      return { ...item, ...ingredients, ...cuisine };
    };

    if (target === "recipes") {
      const data = await readRecipesFile();
      await writeJsonSafely(RECIPES_PATH, {
        ...data,
        recipes: data.recipes.map(fill),
      });
      return;
    }

    const data = await readExcludedFile();
    await writeJsonSafely(EXCLUDED_PATH, {
      ...data,
      excluded: data.excluded.map(fill),
    });
  });

/**
 * メイン食材か料理の系統がまだない YouTube のレシピか
 * 料理の系統は、正しくない値が入っているときも埋め直す
 */
const isUnfilled = (item: JsonRecord): boolean =>
  (item.mainIngredients === undefined || !isCuisine(item.cuisine)) &&
  typeof item.url === "string" &&
  item.url.startsWith("https://www.youtube.com/watch?v=");

/** 一覧になければ足した、新しい配列を返す */
const addOnce = <T>(list: T[], value: T): T[] =>
  list.includes(value) ? list : [...list, value];

/** JSON ファイルを読む。ファイルがまだないときは empty を返す */
const readJson = async <T>(filePath: string, empty: T): Promise<T> => {
  const json = await readFile(filePath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (json === null) return empty;

  return JSON.parse(json) as T;
};

/** recipes.json を読む */
const readRecipesFile = () =>
  readJson<RecipesFile>(RECIPES_PATH, { schemaVersion: 1, recipes: [] });

/** excluded.json を読む */
const readExcludedFile = () =>
  readJson<ExcludedFile>(EXCLUDED_PATH, { schemaVersion: 1, excluded: [] });

/** 指定したファイルの、レシピの一覧だけを読む */
const readEntries = async (target: FillTarget): Promise<JsonRecord[]> =>
  target === "recipes"
    ? (await readRecipesFile()).recipes
    : (await readExcludedFile()).excluded;

// 書き込みの順番待ち。読んでから書くまでの間に別の書き込みが割り込むと、片方の変更が消えるため
let queue: Promise<unknown> = Promise.resolve();

/** 書き込みを1つずつ順番に実行する。前の書き込みが失敗しても、次は実行する */
const inOrder = <T>(task: () => Promise<T>): Promise<T> => {
  const result = queue.then(task);
  queue = result.catch(() => undefined);
  return result;
};

/**
 * 書き込みの途中で壊れないよう、一時ファイルに書いてから置き換える（suggest スキルと同じ方法）
 * 整形は jq の出力（2スペース・末尾に改行）に合わせる
 */
const writeJsonSafely = async (filePath: string, data: unknown) => {
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmpPath, filePath);
};
