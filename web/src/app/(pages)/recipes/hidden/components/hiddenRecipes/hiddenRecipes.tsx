import Link from "next/link";
import { RecipeCard } from "@/app/(pages)/components/recipeCard/recipeCard";
import { findUnfilled, readHiddenRecipes } from "@/lib/recipes";
import { HIDDEN_RECIPES_PATH } from "@/utils/hiddenFilter";
import { countPages, slicePage } from "@/utils/pagination";
import {
  DEFAULT_FILTER,
  type RecipeFilter as Filter,
  filterRecipes,
  type RecipeOrder,
  sortByDateTime,
  toRecipeQuery,
} from "@/utils/recipeFilter";
import { IngredientsFiller } from "../../../components/ingredientsFiller/ingredientsFiller";
import { Pagination } from "../../../components/pagination/pagination";
import { HiddenControls } from "../hiddenControls/hiddenControls";
import styles from "./_styles/_hiddenRecipes.module.scss";

interface HiddenRecipesProps {
  filter: Filter;
}

interface NoMatchProps {
  order: RecipeOrder;
}

/** 検索に合うレシピがないときのお知らせ。「検索を解除」は、並び順だけを残した URL へ移る */
const NoMatch = ({ order }: NoMatchProps) => {
  const query = toRecipeQuery({ ...DEFAULT_FILTER, order });
  return (
    <div className={styles.message}>
      <p>条件に合うレシピが見つかりませんでした。</p>
      <Link
        className={styles.clear}
        href={
          query === "" ? HIDDEN_RECIPES_PATH : `${HIDDEN_RECIPES_PATH}?${query}`
        }
        scroll={false}
      >
        検索を解除
      </Link>
    </div>
  );
};

/**
 * 非表示レシピのページの中身。説明・並び順と検索の行・カード（1ページ9件）とページ送り
 * 「作らない」を選んだものと一覧から削除したものは、画面では区別しない
 */
const HiddenRecipes = async ({ filter }: HiddenRecipesProps) => {
  const [allRecipes, unfilled] = await Promise.all([
    readHiddenRecipes(),
    // excluded.json に埋めるものがあるときだけ、Claude を呼ぶ（ADR-0010）
    findUnfilled("excluded"),
  ]);

  // 並び順の既定は、非表示にした日が新しい順
  const recipes = sortByDateTime(
    filterRecipes(allRecipes, filter),
    filter.order,
    (recipe) => recipe.excludedAt,
  );
  // 範囲外のページ（?page=99 など）も、0件と同じお知らせにする
  const pageRecipes = slicePage(recipes, filter.page);
  return (
    <>
      {unfilled.length > 0 && <IngredientsFiller target="excluded" />}
      <p>
        提案で「作らない」を選んだレシピと、一覧から削除したレシピです。ここにあるレシピは提案されません。
      </p>
      <HiddenControls filter={filter} />
      {allRecipes.length === 0 && (
        <p className={styles.message}>非表示レシピはありません。</p>
      )}
      {allRecipes.length > 0 && pageRecipes.length === 0 && (
        <NoMatch order={filter.order} />
      )}
      {pageRecipes.length > 0 && (
        <>
          <ul className={styles.list}>
            {pageRecipes.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} />
              </li>
            ))}
          </ul>
          <Pagination
            filter={filter}
            totalPages={countPages(recipes.length)}
            basePath={HIDDEN_RECIPES_PATH}
          />
        </>
      )}
    </>
  );
};

export { HiddenRecipes };
