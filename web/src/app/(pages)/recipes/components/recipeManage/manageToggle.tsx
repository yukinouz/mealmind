"use client";

import styles from "./_styles/_recipeManage.module.scss";
import { useRecipeManage } from "./recipeManage";

/** 「レシピを整理する」のボタン。整理中は押された見た目になり、もう一度押すと整理をやめる */
const ManageToggle = () => {
  const { isManaging, isSaving, toggleManage } = useRecipeManage();
  return (
    <button
      className={styles.toggle}
      type="button"
      aria-pressed={isManaging}
      disabled={isSaving}
      onClick={toggleManage}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16M4 12h11M4 18h6" />
      </svg>
      レシピを整理する
    </button>
  );
};

export { ManageToggle };
