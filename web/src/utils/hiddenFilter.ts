import {
  DEFAULT_FILTER,
  parseRecipeFilter,
  type RecipeFilter,
  type SearchParams,
} from "@/utils/recipeFilter";

/** 非表示レシピのページのパス */
export const HIDDEN_RECIPES_PATH = "/recipes/hidden";

/**
 * 非表示レシピのページの条件を URL から読む。使うのは並び順・検索・ページだけで、ほかは既定のままにする
 * レシピ一覧と同じ形にそろえるので、ページ送りや URL の組み立てをそのまま使える
 */
export const parseHiddenFilter = (params: SearchParams): RecipeFilter => {
  const { order, query, page } = parseRecipeFilter(params);
  return { ...DEFAULT_FILTER, order, query, page };
};
