import { connection } from "next/server";
import { LinkButton } from "@/app/(pages)/components/linkButton/linkButton";
import { readRecipes, sortByNewest } from "@/lib/recipes";
import { RecipeCard } from "../recipeCard/recipeCard";
import styles from "./_styles/_recipes.module.scss";

const Recipes = async () => {
  // 開くたびに recipes.json を読み直す（build 時に中身を固定しない）
  await connection();
  // デフォルトは追加が新しい順
  const recipes = sortByNewest(await readRecipes());
  return (
    <>
      {recipes.length === 0 ? (
        <p>まだ登録されたレシピがありません。</p>
      ) : (
        <ul className={styles.list}>
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} />
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
