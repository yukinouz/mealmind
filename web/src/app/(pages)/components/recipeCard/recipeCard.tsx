import { setFavoriteAction } from "@/actions/favorite";
import type { Meal, Recipe } from "@/lib/recipes";
import { thumbnailUrlOf } from "@/utils/thumbnailUrl";
import { truncate } from "@/utils/truncate";
import { RecipeThumbnail } from "../recipeThumbnail/recipeThumbnail";
import cardStyles from "./_styles/_recipeCard.module.scss";
import listStyles from "./_styles/_recipeCardList.module.scss";

const MEAL_LABELS: Record<Meal, string> = {
  lunch: "昼食",
  dinner: "夕食",
};

/** 見た目の種類。card はカード、list は一覧の1行 */
export type RecipeCardLayout = "card" | "list";

interface RecipeCardProps {
  recipe: Pick<
    Recipe,
    "id" | "title" | "url" | "channel" | "meals" | "mainIngredients"
  >;
  // 渡さないときはハートを出さない（まだ記録していない、提案したレシピなど）
  isFavorite?: boolean;
  // 渡さないときはカード
  layout?: RecipeCardLayout;
}

interface FavoriteButtonProps {
  recipeId: string;
  isFavorite: boolean;
  styles: CardStyles;
}

// カードとリストで、同じ名前の class を持つ CSS を差し替えて使う
type CardStyles = typeof cardStyles;

const STYLES: Record<RecipeCardLayout, CardStyles> = {
  card: cardStyles,
  list: listStyles,
};

const FavoriteIcon = () => {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.9 3.8 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.9 1.3-1.8 2.8-2.9 4.8-2.9 3.4 0 5.5 3.4 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z" />
    </svg>
  );
};

// お気に入りを切り替えるハートのボタン。押すと今と逆の状態をサーバーに送る
const FavoriteButton = ({
  recipeId,
  isFavorite,
  styles,
}: FavoriteButtonProps) => {
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

/**
 * レシピ1件分のカード。ハートでお気に入りを切り替えられる（メイン食材は表示だけ）
 * layout が list のときは、同じ中身を一覧の1行の見た目で出す
 */
const RecipeCard = ({
  recipe,
  isFavorite,
  layout = "card",
}: RecipeCardProps) => {
  const mainIngredients = recipe.mainIngredients ?? [];
  const styles = STYLES[layout];

  return (
    <article className={styles.card}>
      <div className={styles.thumbnail}>
        {/* 画像はリンクにしない（クリックはタイトルのリンクが受け取る） */}
        <div className={styles.image}>
          <RecipeThumbnail src={thumbnailUrlOf(recipe)} />
        </div>
        {isFavorite !== undefined && (
          <FavoriteButton
            recipeId={recipe.id}
            isFavorite={isFavorite}
            styles={styles}
          />
        )}
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
