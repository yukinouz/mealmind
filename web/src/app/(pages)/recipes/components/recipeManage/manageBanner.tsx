"use client";

import Link from "next/link";
import { HIDDEN_RECIPES_PATH } from "@/utils/hiddenFilter";
import styles from "./_styles/_recipeManage.module.scss";
import { useRecipeManage } from "./recipeManage";

/** 整理中だけ出すお知らせ。予定の件数と、確定する「完了」のボタン。レシピ一覧では非表示レシピのページへのリンクも出す */
const ManageBanner = () => {
  const { mode, texts, isManaging, pendingIds, isSaving, hasError, finish } =
    useRecipeManage();
  if (!isManaging) return null;

  return (
    <div className={styles.bannerArea}>
      <div className={styles.banner}>
        <p className={styles.bannerText} aria-live="polite">
          {texts.banner(pendingIds.length)}
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
          {texts.error}
        </p>
      )}
      {mode === "hide" && (
        <Link className={styles.hiddenLink} href={HIDDEN_RECIPES_PATH}>
          非表示中のレシピ
        </Link>
      )}
    </div>
  );
};

export { ManageBanner };
