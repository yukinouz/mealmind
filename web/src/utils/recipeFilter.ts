import type { Meal, Recipe } from "@/lib/recipes";
import { type Cuisine, isCuisine } from "@/utils/cuisine";

/** 並び順。追加日が新しい順か古い順 */
export type RecipeOrder = "newest" | "oldest";

/** レシピ一覧の絞り込みの条件。meals・cuisines・channels は、空なら「すべて」 */
export interface RecipeFilter {
  meals: Meal[];
  cuisines: Cuisine[];
  channels: string[];
  isFavoriteOnly: boolean;
  order: RecipeOrder;
}

/** ページが受け取る URL の検索パラメータ */
export type SearchParams = Record<string, string | string[] | undefined>;

/** 条件がないとき。すべてのレシピを、追加日が新しい順に出す */
export const DEFAULT_FILTER: RecipeFilter = {
  meals: [],
  cuisines: [],
  channels: [],
  isFavoriteOnly: false,
  order: "newest",
};

const MEALS: readonly string[] = ["lunch", "dinner"] satisfies Meal[];
// チャンネルの id は sources.json の id。URL から来るので、使える文字を絞る
const CHANNEL_ID_PATTERN = /^[a-z0-9-]+$/i;

/** 食事として正しい値か */
const isMeal = (value: string): value is Meal => MEALS.includes(value);

/** チャンネルの id として使える値か */
const isChannelId = (value: string): boolean => CHANNEL_ID_PATTERN.test(value);

/** 重なりを除いた、新しい配列を返す */
const unique = <T>(list: T[]): T[] => [...new Set(list)];

/** 「lunch,dinner」のようにカンマでつないだ値を、配列に分ける */
const splitValues = (value: string | string[] | undefined): string[] =>
  [value ?? []]
    .flat()
    .flatMap((part) => part.split(","))
    .filter((part) => part !== "");

/** URL の検索パラメータから条件を読む。知らない値は捨てる */
export const parseRecipeFilter = (params: SearchParams): RecipeFilter => ({
  meals: unique(splitValues(params.meal).filter(isMeal)),
  cuisines: unique(splitValues(params.cuisine).filter(isCuisine)),
  channels: unique(splitValues(params.channel).filter(isChannelId)),
  isFavoriteOnly: params.fav === "1",
  order: params.order === "oldest" ? "oldest" : "newest",
});

/** 条件を URL の検索パラメータ（? の後ろ）にする。既定と同じ項目は書かず、条件がなければ空文字 */
export const toRecipeQuery = (filter: RecipeFilter): string =>
  [
    ["meal", filter.meals.join(",")],
    ["cuisine", filter.cuisines.join(",")],
    ["channel", filter.channels.join(",")],
    ["fav", filter.isFavoriteOnly ? "1" : ""],
    ["order", filter.order === "oldest" ? "oldest" : ""],
  ]
    .filter(([, value]) => value !== "")
    // 値は英数字と「-」だけなので、カンマを残したまま読みやすい形にする
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

/** 絞り込み欄（食事・ジャンル・チャンネル）の条件を外した、新しい条件を返す。♡のみと並び順は残す */
export const clearGroups = (filter: RecipeFilter): RecipeFilter => ({
  ...filter,
  meals: [],
  cuisines: [],
  channels: [],
});

/** 絞り込み欄（食事・ジャンル・チャンネル）で、何か1つでも選んでいるか */
export const hasAnyFilter = (filter: RecipeFilter): boolean =>
  filter.meals.length > 0 ||
  filter.cuisines.length > 0 ||
  filter.channels.length > 0;

/** 一覧にあれば外し、なければ足した、新しい配列を返す */
export const toggleValue = <T>(list: T[], value: T): T[] =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

/** 選んだものが空（すべて）か、値のどれかが選んだものに含まれるか */
const matchesAny = <T>(selected: T[], values: T[]): boolean =>
  selected.length === 0 || values.some((value) => selected.includes(value));

/**
 * 条件に合うレシピだけを残す。同じ項目の中はどれか1つに合えばよく、項目どうしはすべてに合う必要がある
 * 料理の系統がまだないレシピは、ジャンルを選んだときには出さない。並び順はここでは変えない
 */
export const filterRecipes = <
  T extends Pick<Recipe, "meals" | "cuisine" | "sourceId" | "isFavorite">,
>(
  recipes: T[],
  filter: RecipeFilter,
): T[] =>
  recipes.filter(
    (recipe) =>
      matchesAny(filter.meals, recipe.meals) &&
      matchesAny(filter.cuisines, recipe.cuisine ? [recipe.cuisine] : []) &&
      matchesAny(filter.channels, [recipe.sourceId]) &&
      (!filter.isFavoriteOnly || recipe.isFavorite),
  );

/** 追加した日時（registeredAt）で並べた、新しい配列を返す */
// 時差の表記が違っても正しく比べられるよう、日時に変換してから比べる
export const sortRecipes = <T extends Pick<Recipe, "registeredAt">>(
  recipes: T[],
  order: RecipeOrder,
): T[] => {
  const direction = order === "newest" ? -1 : 1;
  return recipes.toSorted(
    (a, b) =>
      direction * (Date.parse(a.registeredAt) - Date.parse(b.registeredAt)),
  );
};
