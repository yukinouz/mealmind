import type { Meal, Recipe } from "@/lib/recipes";
import { type Cuisine, isCuisine } from "@/utils/cuisine";

/** 並び順。追加日が新しい順か古い順 */
export type RecipeOrder = "newest" | "oldest";

/** 一覧の表示形式。カードを並べるか、1行ずつのリストにするか */
export type RecipeView = "card" | "list";

/** レシピ一覧の絞り込みの条件。meals・cuisines・channels は、空なら「すべて」 */
export interface RecipeFilter {
  meals: Meal[];
  cuisines: Cuisine[];
  channels: string[];
  isFavoriteOnly: boolean;
  order: RecipeOrder;
  view: RecipeView;
  // 検索の言葉。空白で区切った言葉をすべて含むレシピだけを出す
  query: string;
  // 何ページ目か。1から数える
  page: number;
}

/** ページが受け取る URL の検索パラメータ */
export type SearchParams = Record<string, string | string[] | undefined>;

/** 条件がないとき。すべてのレシピを、追加日が新しい順にカードで出す */
export const DEFAULT_FILTER: RecipeFilter = {
  meals: [],
  cuisines: [],
  channels: [],
  isFavoriteOnly: false,
  order: "newest",
  view: "card",
  query: "",
  page: 1,
};

const MEALS: readonly string[] = ["lunch", "dinner"] satisfies Meal[];
// 検索の言葉の長さの上限。URL から来るので、長すぎる値は切る
export const MAX_QUERY_LENGTH = 100;
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

/** ページ番号を読む。1以上の整数でなければ1ページ目にする */
const parsePage = (value: string | string[] | undefined): number => {
  const page = Number([value ?? ""].flat()[0]);
  return Number.isInteger(page) && page >= 1 ? page : 1;
};

/** URL の検索パラメータから条件を読む。知らない値は捨てる */
export const parseRecipeFilter = (params: SearchParams): RecipeFilter => ({
  meals: unique(splitValues(params.meal).filter(isMeal)),
  cuisines: unique(splitValues(params.cuisine).filter(isCuisine)),
  channels: unique(splitValues(params.channel).filter(isChannelId)),
  isFavoriteOnly: params.fav === "1",
  order: params.order === "oldest" ? "oldest" : "newest",
  view: params.view === "list" ? "list" : "card",
  query: ([params.q ?? ""].flat()[0] ?? "").trim().slice(0, MAX_QUERY_LENGTH),
  page: parsePage(params.page),
});

/** 条件を URL の検索パラメータ（? の後ろ）にする。既定と同じ項目は書かず、条件がなければ空文字 */
export const toRecipeQuery = (filter: RecipeFilter): string =>
  [
    ["meal", filter.meals.join(",")],
    ["cuisine", filter.cuisines.join(",")],
    ["channel", filter.channels.join(",")],
    ["fav", filter.isFavoriteOnly ? "1" : ""],
    ["order", filter.order === "oldest" ? "oldest" : ""],
    ["view", filter.view === "list" ? "list" : ""],
    // 検索の言葉だけは自由な文字なので、URL で使える形に変える
    ["q", encodeURIComponent(filter.query.trim())],
    ["page", filter.page > 1 ? String(filter.page) : ""],
  ]
    .filter(([, value]) => value !== "")
    // ほかの値は英数字と「-」だけなので、カンマを残したまま読みやすい形にする
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

/** 絞り込み欄（食事・ジャンル・チャンネル）の条件を外した、新しい条件を返す。♡のみ・並び順・表示形式は残す */
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

/** 比べるために、全角・半角と大文字・小文字の違いをなくす */
const normalize = (text: string): string =>
  text.normalize("NFKC").toLowerCase();

/** 検索の言葉を、空白（全角も含む）で区切る。食材タグの「#」は外す */
const toSearchWords = (query: string): string[] =>
  normalize(query)
    .split(/\s+/)
    .map((word) => word.replace(/^#/, ""))
    .filter((word) => word !== "");

/** 料理名・メイン食材・チャンネル名に、言葉がすべて含まれるか */
const matchesWords = (
  recipe: Pick<Recipe, "title" | "channel" | "mainIngredients">,
  words: string[],
): boolean => {
  const target = normalize(
    [recipe.title, recipe.channel, ...(recipe.mainIngredients ?? [])].join(" "),
  );
  return words.every((word) => target.includes(word));
};

/** 選んだものが空（すべて）か、値のどれかが選んだものに含まれるか */
const matchesAny = <T>(selected: T[], values: T[]): boolean =>
  selected.length === 0 || values.some((value) => selected.includes(value));

/**
 * 条件に合うレシピだけを残す。同じ項目の中はどれか1つに合えばよく、項目どうしはすべてに合う必要がある
 * 料理の系統がまだないレシピは、ジャンルを選んだときには出さない。並び順はここでは変えない
 */
export const filterRecipes = <
  T extends Pick<
    Recipe,
    | "meals"
    | "cuisine"
    | "sourceId"
    | "isFavorite"
    | "title"
    | "channel"
    | "mainIngredients"
  >,
>(
  recipes: T[],
  filter: RecipeFilter,
): T[] => {
  const words = toSearchWords(filter.query);
  return recipes.filter(
    (recipe) =>
      matchesAny(filter.meals, recipe.meals) &&
      matchesAny(filter.cuisines, recipe.cuisine ? [recipe.cuisine] : []) &&
      matchesAny(filter.channels, [recipe.sourceId]) &&
      (!filter.isFavoriteOnly || recipe.isFavorite) &&
      matchesWords(recipe, words),
  );
};

/** 日時を数値にする。読めない日時は 0（いちばん古い）として扱い、並び順が定まるようにする */
const toTime = (dateTime: string): number => Date.parse(dateTime) || 0;

/** dateTimeOf で取り出した日時で並べた、新しい配列を返す */
// 時差の表記が違っても正しく比べられるよう、日時に変換してから比べる
export const sortByDateTime = <T>(
  items: T[],
  order: RecipeOrder,
  dateTimeOf: (item: T) => string,
): T[] => {
  const direction = order === "newest" ? -1 : 1;
  return items.toSorted(
    (a, b) => direction * (toTime(dateTimeOf(a)) - toTime(dateTimeOf(b))),
  );
};

/** 追加した日時（registeredAt）で並べた、新しい配列を返す */
export const sortRecipes = <T extends Pick<Recipe, "registeredAt">>(
  recipes: T[],
  order: RecipeOrder,
): T[] => sortByDateTime(recipes, order, (recipe) => recipe.registeredAt);
