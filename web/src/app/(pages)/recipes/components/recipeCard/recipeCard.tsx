import { type Meal, type Recipe, thumbnailUrlOf } from "@/lib/recipes";
import { truncate } from "@/utils/truncate";
import { RecipeThumbnail } from "../../recipe-thumbnail";
import styles from "./_styles/_recipeCard.module.scss";

const MEAL_LABELS: Record<Meal, string> = {
  lunch: "昼食",
  dinner: "夕食",
};

interface RecipeCardProps {
  recipe: Recipe;
}

const FavoriteIcon = () => {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.9 3.8 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.9 1.3-1.8 2.8-2.9 4.8-2.9 3.4 0 5.5 3.4 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z" />
    </svg>
  );
};

// レシピ1件分のカード。お気に入りとメイン食材は表示だけ（操作はまだできない）
const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const mainIngredients = recipe.mainIngredients ?? [];

  return (
    <article className={styles.card}>
      <div className={styles.thumbnail}>
        {/* 画像はリンクにしない（クリックはタイトルのリンクが受け取る） */}
        <div className={styles.image}>
          <RecipeThumbnail src={thumbnailUrlOf(recipe)} />
        </div>
        <span className={styles.favorite} role="img" aria-label="お気に入り">
          <FavoriteIcon />
        </span>
      </div>
      <div className={styles.item}>
        <div className={styles.meta}>
          {recipe.meals.map((meal) => (
            <span className={`${styles.meal} ${styles[meal]}`} key={meal}>
              {MEAL_LABELS[meal]}
            </span>
          ))}
          <span>{recipe.channel}</span>
        </div>
        <h3 className={styles.recipeTitle}>
          {/* CSS でリンクの当たり判定をカード全体に広げる */}
          <a
            className={styles.link}
            href={recipe.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {truncate(recipe.title)}
          </a>
        </h3>
        {mainIngredients.length > 0 && (
          <ul className={styles.tags} aria-label="メイン食材">
            {mainIngredients.map((ingredient) => (
              <li className={styles.tag} key={ingredient}>
                #{ingredient}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
};

export { RecipeCard };
