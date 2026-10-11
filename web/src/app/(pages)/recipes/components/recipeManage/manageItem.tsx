"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { RecipeCardLayout } from "@/app/(pages)/components/recipeCard/recipeCard";
import { truncate } from "@/utils/truncate";
import styles from "./_styles/_recipeManage.module.scss";
import { useRecipeManage } from "./recipeManage";

interface ManageItemProps {
  recipeId: string;
  title: string;
  layout: RecipeCardLayout;
  // サーバーで作ったレシピカード
  children: ReactNode;
}

/**
 * 一覧の1件。整理中は、カードの下（リストでは行の右）に「削除」か「取り消す」を出す
 * 削除予定のレシピは、カードを薄くして見分けられるようにする
 */
const ManageItem = ({ recipeId, title, layout, children }: ManageItemProps) => {
  const { isManaging, pendingIds, isSaving, togglePending } = useRecipeManage();
  const isPending = pendingIds.includes(recipeId);
  const shortTitle = truncate(title);

  return (
    <div className={styles[layout]}>
      <div className={styles.content} data-pending={isPending}>
        {children}
      </div>
      {isManaging && (
        <div className={styles.actions}>
          {isPending && <span className={styles.pendingLabel}>削除予定</span>}
          {/* 押してもフォーカスが外れないよう、削除と取り消しは同じボタンの中身だけを替える */}
          <button
            className={isPending ? styles.cancel : styles.delete}
            type="button"
            disabled={isSaving}
            aria-label={
              isPending
                ? `「${shortTitle}」の削除を取り消す`
                : `「${shortTitle}」を削除予定にする`
            }
            onClick={() => togglePending(recipeId)}
          >
            {isPending ? (
              "取り消す"
            ) : (
              <>
                <Image
                  src="/images/icon/icon-delete.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                削除
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export { ManageItem };
