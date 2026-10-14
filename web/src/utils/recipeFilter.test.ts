import { describe, expect, it } from "vitest";
import {
  clearGroups,
  DEFAULT_FILTER,
  filterRecipes,
  hasAnyFilter,
  MAX_QUERY_LENGTH,
  parseRecipeFilter,
  type RecipeFilter,
  sortRecipes,
  toggleValue,
  toRecipeQuery,
} from "./recipeFilter";

/** テスト用のレシピ。指定しない項目は無難な値にする */
const recipeOf = (
  overrides: Partial<Parameters<typeof filterRecipes>[0][number]> & {
    id: string;
  },
) => ({
  meals: ["dinner" as const],
  cuisine: "washoku" as const,
  sourceId: "chef-a",
  isFavorite: false,
  title: "料理",
  channel: "シェフA",
  mainIngredients: [] as string[],
  ...overrides,
});

/** 既定の条件に一部だけ上書きした条件 */
const filterOf = (overrides: Partial<RecipeFilter>): RecipeFilter => ({
  ...DEFAULT_FILTER,
  ...overrides,
});

describe("parseRecipeFilter", () => {
  it("何もなければ既定の条件になる", () => {
    expect(parseRecipeFilter({})).toEqual(DEFAULT_FILTER);
  });

  it("カンマ区切りの値を配列に分け、重なりを除く", () => {
    const filter = parseRecipeFilter({
      meal: "lunch,dinner,lunch",
      cuisine: ["washoku", "chuka"],
      channel: "chef-a,chef-b",
    });
    expect(filter.meals).toEqual(["lunch", "dinner"]);
    expect(filter.cuisines).toEqual(["washoku", "chuka"]);
    expect(filter.channels).toEqual(["chef-a", "chef-b"]);
  });

  it("知らない値や使えない文字を含む値は捨てる", () => {
    const filter = parseRecipeFilter({
      meal: "breakfast,dinner",
      cuisine: "french",
      channel: "chef-a,<script>",
      order: "random",
      view: "grid",
    });
    expect(filter.meals).toEqual(["dinner"]);
    expect(filter.cuisines).toEqual([]);
    expect(filter.channels).toEqual(["chef-a"]);
    expect(filter.order).toBe("newest");
    expect(filter.view).toBe("card");
  });

  it("fav・order・view を読む", () => {
    const filter = parseRecipeFilter({
      fav: "1",
      order: "oldest",
      view: "list",
    });
    expect(filter.isFavoriteOnly).toBe(true);
    expect(filter.order).toBe("oldest");
    expect(filter.view).toBe("list");
  });

  it("検索の言葉は前後の空白を除き、上限の長さで切る", () => {
    expect(parseRecipeFilter({ q: "  鯖  " }).query).toBe("鯖");
    expect(
      parseRecipeFilter({ q: "あ".repeat(MAX_QUERY_LENGTH + 10) }).query,
    ).toHaveLength(MAX_QUERY_LENGTH);
  });

  it("ページは1以上の整数だけを受け付け、それ以外は1にする", () => {
    expect(parseRecipeFilter({ page: "3" }).page).toBe(3);
    expect(parseRecipeFilter({ page: "0" }).page).toBe(1);
    expect(parseRecipeFilter({ page: "-2" }).page).toBe(1);
    expect(parseRecipeFilter({ page: "1.5" }).page).toBe(1);
    expect(parseRecipeFilter({ page: "abc" }).page).toBe(1);
  });
});

describe("toRecipeQuery", () => {
  it("既定の条件なら空文字", () => {
    expect(toRecipeQuery(DEFAULT_FILTER)).toBe("");
  });

  it("既定と違う項目だけを書く", () => {
    const query = toRecipeQuery(
      filterOf({
        meals: ["lunch", "dinner"],
        isFavoriteOnly: true,
        order: "oldest",
        page: 2,
      }),
    );
    expect(query).toBe("meal=lunch,dinner&fav=1&order=oldest&page=2");
  });

  it("検索の言葉は URL で使える形に変える", () => {
    expect(toRecipeQuery(filterOf({ query: "鯖 味噌" }))).toBe(
      `q=${encodeURIComponent("鯖 味噌")}`,
    );
  });

  it("書き出した値を読み直すと同じ条件になる", () => {
    const filter = filterOf({
      meals: ["lunch"],
      cuisines: ["chuka", "yoshoku"],
      channels: ["chef-a"],
      view: "list",
      query: "鶏むね",
      page: 4,
    });
    const params = Object.fromEntries(
      new URLSearchParams(toRecipeQuery(filter)),
    );
    expect(parseRecipeFilter(params)).toEqual(filter);
  });
});

describe("clearGroups / hasAnyFilter", () => {
  it("絞り込み欄の条件だけを外し、ほかは残す", () => {
    const filter = filterOf({
      meals: ["lunch"],
      cuisines: ["washoku"],
      channels: ["chef-a"],
      isFavoriteOnly: true,
      order: "oldest",
    });
    const cleared = clearGroups(filter);
    expect(hasAnyFilter(filter)).toBe(true);
    expect(hasAnyFilter(cleared)).toBe(false);
    expect(cleared.isFavoriteOnly).toBe(true);
    expect(cleared.order).toBe("oldest");
  });

  it("♡のみや検索だけなら、絞り込み欄は選んでいないと数える", () => {
    expect(hasAnyFilter(filterOf({ isFavoriteOnly: true, query: "鯖" }))).toBe(
      false,
    );
  });
});

describe("toggleValue", () => {
  it("なければ足し、あれば外す", () => {
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
  });

  it("元の配列は変えない", () => {
    const list = ["a"];
    toggleValue(list, "b");
    expect(list).toEqual(["a"]);
  });
});

describe("filterRecipes", () => {
  const recipes = [
    recipeOf({
      id: "1",
      title: "鯖の味噌煮",
      meals: ["dinner"],
      cuisine: "washoku",
      mainIngredients: ["鯖"],
      isFavorite: true,
    }),
    recipeOf({
      id: "2",
      title: "麻婆豆腐",
      meals: ["lunch", "dinner"],
      cuisine: "chuka",
      sourceId: "chef-b",
      channel: "シェフB",
      mainIngredients: ["豆腐", "豚ひき肉"],
    }),
    recipeOf({
      id: "3",
      title: "ＰＡＳＴＡ",
      meals: ["lunch"],
      cuisine: undefined,
    }),
  ];
  /** 条件で絞り込んだレシピの id */
  const idsOf = (filter: RecipeFilter) =>
    filterRecipes(recipes, filter).map((recipe) => recipe.id);

  it("条件がなければすべて残す", () => {
    expect(idsOf(DEFAULT_FILTER)).toEqual(["1", "2", "3"]);
  });

  it("同じ項目の中はどれか1つに合えばよい", () => {
    expect(idsOf(filterOf({ meals: ["lunch"] }))).toEqual(["2", "3"]);
    expect(idsOf(filterOf({ cuisines: ["washoku", "chuka"] }))).toEqual([
      "1",
      "2",
    ]);
  });

  it("項目どうしはすべてに合う必要がある", () => {
    expect(
      idsOf(filterOf({ meals: ["dinner"], channels: ["chef-b"] })),
    ).toEqual(["2"]);
  });

  it("ジャンルを選ぶと、ジャンルがまだないレシピは出さない", () => {
    expect(idsOf(filterOf({ cuisines: ["other"] }))).toEqual([]);
  });

  it("♡のみなら、お気に入りだけを残す", () => {
    expect(idsOf(filterOf({ isFavoriteOnly: true }))).toEqual(["1"]);
  });

  it("検索の言葉は料理名・チャンネル名・メイン食材から探し、すべてを含むものだけ残す", () => {
    expect(idsOf(filterOf({ query: "豆腐" }))).toEqual(["2"]);
    expect(idsOf(filterOf({ query: "シェフB" }))).toEqual(["2"]);
    expect(idsOf(filterOf({ query: "#鯖　味噌" }))).toEqual(["1"]);
    expect(idsOf(filterOf({ query: "鯖 豆腐" }))).toEqual([]);
  });

  it("全角・半角と大文字・小文字の違いは無視する", () => {
    expect(idsOf(filterOf({ query: "pasta" }))).toEqual(["3"]);
  });
});

describe("sortRecipes", () => {
  const recipes = [
    { id: "a", registeredAt: "2026-10-01T10:00:00+09:00" },
    { id: "b", registeredAt: "2026-10-03T10:00:00+09:00" },
    // 時差の表記が違っても、日時として比べる（日本時間の 2026-10-02T09:00）
    { id: "c", registeredAt: "2026-10-02T00:00:00Z" },
  ];
  /** 並べ替えたレシピの id */
  const idsOf = (order: "newest" | "oldest") =>
    sortRecipes(recipes, order).map((recipe) => recipe.id);

  it("新しい順と古い順に並べる", () => {
    expect(idsOf("newest")).toEqual(["b", "c", "a"]);
    expect(idsOf("oldest")).toEqual(["a", "c", "b"]);
  });

  it("読めない日時はいちばん古いものとして扱う", () => {
    const sorted = sortRecipes(
      [...recipes, { id: "x", registeredAt: "不明" }],
      "newest",
    );
    expect(sorted.at(-1)?.id).toBe("x");
  });

  it("元の配列は変えない", () => {
    sortRecipes(recipes, "newest");
    expect(recipes.map((recipe) => recipe.id)).toEqual(["a", "b", "c"]);
  });
});
