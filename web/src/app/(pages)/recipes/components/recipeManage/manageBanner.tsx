"use client";

import styles from "./_styles/_recipeManage.module.scss";
import { useRecipeManage } from "./recipeManage";

/** 整理中だけ出すお知らせ。削除予定の件数と、確定する「完了」のボタン */
const ManageBanner = () => {
  const { isManaging, pendingIds, isSaving, hasError, finish } =
    useRecipeManage();
  if (!isManaging) return null;

  return (
    <div className={styles.bannerArea}>
      <div className={styles.banner}>
        <p className={styles.bannerText} aria-live="polite">
          整理中：削除予定 {pendingIds.length}
          件。「完了」を押すと確定し、削除したレシピは今後提案されなくなります
        </p>
        <button
          className={styles.finish}
          type="button"
          disabled={isSaving}
          onClick={finish}
        >
          完了
        </button>
      </div>
      {hasError && (
        <p className={styles.error} role="alert">
          削除できませんでした。もう一度「完了」を押してください。
        </p>
      )}
    </div>
  );
};

export { ManageBanner };
