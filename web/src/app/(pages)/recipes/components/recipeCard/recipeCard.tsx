import { setFavoriteAction } from "@/actions/favorite";
import { type Meal, type Recipe, thumbnailUrlOf } from "@/lib/recipes";
import { truncate } from "@/utils/truncate";
import { RecipeThumbnail } from "../recipeThumbnail/recipeThumbnail";
import styles from "./_styles/_recipeCard.module.scss";

const MEAL_LABELS: Record<Meal, string> = {
  lunch: "昼食",
  dinner: "夕食",
};

interface RecipeCardProps {
  recipe: Recipe;
}

interface FavoriteButtonProps {
  recipeId: string;
  isFavorite: boolean;
}

const FavoriteIcon = () => {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.9 3.8 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.9 1.3-1.8 2.8-2.9 4.8-2.9 3.4 0 5.5 3.4 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z" />
    </svg>
  );
};

// お気に入りを切り替えるハートのボタン。押すと今と逆の状態をサーバーに送る
const FavoriteButton = ({ recipeId, isFavorite }: FavoriteButtonProps) => {
  return (
    <form action={setFavoriteAction.bind(null, recipeId, !isFavorite)}>
      <button
        type="submit"
        className={styles.favorite}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "お気に入りから外す" : "お気に入りに追加"}
      >
        <FavoriteIcon />
      </button>
    </form>
  );
};

// レシピ1件分のカード。ハートでお気に入りを切り替えられる（メイン食材は表示だけ）
const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const mainIngredients = recipe.mainIngredients ?? [];

  return (
    <article className={styles.card}>
      <div className={styles.thumbnail}>
        {/* 画像はリンクにしない（クリックはタイトルのリンクが受け取る） */}
        <div className={styles.image}>
          <RecipeThumbnail src={thumbnailUrlOf(recipe)} />
        </div>
        <FavoriteButton recipeId={recipe.id} isFavorite={recipe.isFavorite} />
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
