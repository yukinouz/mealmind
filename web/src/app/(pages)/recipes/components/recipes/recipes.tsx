import { connection } from "next/server";
import { LinkButton } from "@/app/(pages)/components/linkButton/linkButton";
import { RecipeCard } from "@/app/(pages)/components/recipeCard/recipeCard";
import { findUnfilled, readRecipes, sortByNewest } from "@/lib/recipes";
import { IngredientsFiller } from "../ingredientsFiller/ingredientsFiller";
import styles from "./_styles/_recipes.module.scss";

const Recipes = async () => {
  // 開くたびに recipes.json を読み直す（build 時に中身を固定しない）
  await connection();
  // デフォルトは追加が新しい順
  const recipes = sortByNewest(await readRecipes());
  // recipes.json に埋めるものがあるときだけ、Claude を呼ぶ（excluded.json は非表示のレシピのページで埋める）
  const hasUnfilled = (await findUnfilled("recipes")).length > 0;
  return (
    <>
      {hasUnfilled && <IngredientsFiller target="recipes" />}
      {recipes.length === 0 ? (
        <p>まだ登録されたレシピがありません。</p>
      ) : (
        <ul className={styles.list}>
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} isFavorite={recipe.isFavorite} />
            </li>
          ))}
        </ul>
      )}
      <div className={styles.buttonWrapper}>
        <LinkButton href="/" text="トップへ戻る" />
      </div>
    </>
  );
};

export { Recipes };
