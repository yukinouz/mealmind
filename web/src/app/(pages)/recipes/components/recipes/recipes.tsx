import Link from "next/link";
import { RecipeCard } from "@/app/(pages)/components/recipeCard/recipeCard";
import { findUnfilled, readRecipes } from "@/lib/recipes";
import { readChannels } from "@/lib/sources";
import { countPages, slicePage } from "@/utils/pagination";
import {
  DEFAULT_FILTER,
  type RecipeFilter as Filter,
  filterRecipes,
  type RecipeOrder,
  type RecipeView,
  sortRecipes,
  toRecipeQuery,
} from "@/utils/recipeFilter";
import { IngredientsFiller } from "../ingredientsFiller/ingredientsFiller";
import { Pagination } from "../pagination/pagination";
import { RecipeFilter } from "../recipeFilter/recipeFilter";
import { ManageBanner } from "../recipeManage/manageBanner";
import { ManageItem } from "../recipeManage/manageItem";
import styles from "./_styles/_recipes.module.scss";

interface RecipesProps {
  filter: Filter;
}

interface NoMatchProps {
  order: RecipeOrder;
  view: RecipeView;
}

/** 絞り込んだ結果が0件のときのお知らせ。「条件をすべて解除」は、並び順と表示形式だけを残した URL へ移る */
const NoMatch = ({ order, view }: NoMatchProps) => {
  const query = toRecipeQuery({ ...DEFAULT_FILTER, order, view });
  return (
    <div className={styles.noMatch}>
      <p>条件に合うレシピが見つかりませんでした。</p>
      <Link
        className={styles.clearAll}
        href={query === "" ? "/recipes" : `/recipes?${query}`}
        scroll={false}
      >
        条件をすべて解除
      </Link>
    </div>
  );
};

/** レシピ一覧の中身。絞り込み欄と、条件に合うレシピのカード（1ページ9件）とページ送り。「レシピを整理する」で一覧から削除できる */
const Recipes = async ({ filter: requestedFilter }: RecipesProps) => {
  const [allRecipes, channels, unfilled] = await Promise.all([
    readRecipes(),
    readChannels(),
    // recipes.json に埋めるものがあるときだけ、Claude を呼ぶ（excluded.json は非表示のレシピのページで埋める）
    findUnfilled("recipes"),
  ]);
  if (allRecipes.length === 0) return <p>まだ登録されたレシピがありません。</p>;

  // URL にある sources.json にないチャンネルは捨てる。残すと、どのボタンも選ばれていない見た目になる
  const channelIds = new Set(channels.map((channel) => channel.id));
  const filter = {
    ...requestedFilter,
    channels: requestedFilter.channels.filter((id) => channelIds.has(id)),
  };

  // 並び順の既定は、追加が新しい順
  const recipes = sortRecipes(filterRecipes(allRecipes, filter), filter.order);
  // 範囲外のページ（?page=99 など）も、0件と同じお知らせにする
  const pageRecipes = slicePage(recipes, filter.page);
  return (
    <>
      {unfilled.length > 0 && <IngredientsFiller target="recipes" />}
      <RecipeFilter filter={filter} channels={channels} />
      <ManageBanner />
      {pageRecipes.length === 0 ? (
        <NoMatch order={filter.order} view={filter.view} />
      ) : (
        <>
          <ul className={filter.view === "list" ? styles.rows : styles.list}>
            {pageRecipes.map((recipe) => (
              <li key={recipe.id}>
                <ManageItem
                  recipeId={recipe.id}
                  title={recipe.title}
                  layout={filter.view}
                >
                  <RecipeCard
                    recipe={recipe}
                    isFavorite={recipe.isFavorite}
                    layout={filter.view}
                  />
                </ManageItem>
              </li>
            ))}
          </ul>
          <Pagination filter={filter} totalPages={countPages(recipes.length)} />
        </>
      )}
    </>
  );
};

export { Recipes };
