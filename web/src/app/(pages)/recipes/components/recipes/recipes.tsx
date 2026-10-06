import { connection } from "next/server";
import { LinkButton } from "@/app/(pages)/components/linkButton/linkButton";
import { type Meal, readRecipes, thumbnailUrlOf } from "@/lib/recipes";
import { truncate } from "@/utils/truncate";
import { RecipeThumbnail } from "../../recipe-thumbnail";
import styles from "./_styles/_recipes.module.scss";

const MEAL_LABELS: Record<Meal, string> = {
  lunch: "昼食",
  dinner: "夕食",
};

const Recipes = async () => {
  // 開くたびに recipes.json を読み直す（build 時に中身を固定しない）
  await connection();
  const recipes = await readRecipes();
  return (
    <>
      {recipes.length === 0 ? (
        <p>まだ登録されたレシピがありません。</p>
      ) : (
        <div className={styles.list}>
          {recipes.map((recipe) => (
            <div className={styles.listItem} key={recipe.id}>
              <a
                className={styles.link}
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className={styles.thumbnail}>
                  <RecipeThumbnail src={thumbnailUrlOf(recipe)} />
                </div>
                <p className={styles.title}>{truncate(recipe.title)}</p>
              </a>
              <ul className={styles.metaList}>
                <li className={styles.meta}>
                  {recipe.meals.map((meal) => MEAL_LABELS[meal]).join("・")}
                </li>
                <li className={styles.meta}>{recipe.channel}</li>
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className={styles.buttonWrapper}>
        <LinkButton href="/" text="トップへ戻る" />
      </div>
    </>
  );
};

export { Recipes };
