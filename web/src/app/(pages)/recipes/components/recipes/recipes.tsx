import Link from "next/link";
import { RecipeCard } from "@/app/(pages)/components/recipeCard/recipeCard";
import { findUnfilled, readRecipes } from "@/lib/recipes";
import { readChannels } from "@/lib/sources";
import {
  DEFAULT_FILTER,
  type RecipeFilter as Filter,
  filterRecipes,
  type RecipeOrder,
  sortRecipes,
  toRecipeQuery,
} from "@/utils/recipeFilter";
import { IngredientsFiller } from "../ingredientsFiller/ingredientsFiller";
import { RecipeFilter } from "../recipeFilter/recipeFilter";
import styles from "./_styles/_recipes.module.scss";

interface RecipesProps {
  filter: Filter;
}

interface NoMatchProps {
  order: RecipeOrder;
}

/** 絞り込んだ結果が0件のときのお知らせ。「条件をすべて解除」は、並び順だけを残した URL へ移る */
const NoMatch = ({ order }: NoMatchProps) => {
  const query = toRecipeQuery({ ...DEFAULT_FILTER, order });
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

/** レシピ一覧の中身。絞り込み欄と、条件に合うレシピのカード */
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
  return (
    <>
      {unfilled.length > 0 && <IngredientsFiller target="recipes" />}
      <RecipeFilter filter={filter} channels={channels} />
      {recipes.length === 0 ? (
        <NoMatch order={filter.order} />
      ) : (
        <ul className={styles.list}>
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} isFavorite={recipe.isFavorite} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export { Recipes };
