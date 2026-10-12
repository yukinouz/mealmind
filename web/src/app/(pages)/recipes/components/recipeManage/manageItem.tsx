"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { RecipeCardLayout } from "@/app/(pages)/components/recipeCard/recipeCard";
import { truncate } from "@/utils/truncate";
import styles from "./_styles/_recipeManage.module.scss";
import { type ManageMode, useRecipeManage } from "./recipeManage";

interface ManageItemProps {
  recipeId: string;
  title: string;
  layout: RecipeCardLayout;
  // サーバーで作ったレシピカード
  children: ReactNode;
}

const ICONS: Record<ManageMode, string> = {
  hide: "/images/icon/icon-delete.svg",
  restore: "/images/icon/icon-restore.svg",
};

/**
 * 一覧の1件。整理中は、カードの下（リストでは行の右）に「削除」か「一覧に戻す」と、予定にしたら「取り消す」を出す
 * 予定にしたレシピは、カードを薄くして見分けられるようにする
 */
const ManageItem = ({ recipeId, title, layout, children }: ManageItemProps) => {
  const { mode, texts, isManaging, pendingIds, isSaving, togglePending } =
    useRecipeManage();
  const isPending = pendingIds.includes(recipeId);
  const shortTitle = truncate(title);

  return (
    <div className={styles[layout]}>
      <div className={styles.content} data-pending={isPending}>
        {children}
      </div>
      {isManaging && (
        <div className={styles.actions} data-mode={mode}>
          {isPending && (
            <span className={styles.pendingLabel}>{texts.pending}</span>
          )}
          {/* 押してもフォーカスが外れないよう、予定にするボタンと取り消すボタンは同じボタンの中身だけを替える */}
          <button
            className={isPending ? styles.cancel : styles[mode]}
            type="button"
            disabled={isSaving}
            aria-label={
              isPending ? texts.cancel(shortTitle) : texts.toPending(shortTitle)
            }
            onClick={() => togglePending(recipeId)}
          >
            {isPending ? (
              "取り消す"
            ) : (
              <>
                <Image src={ICONS[mode]} alt="" width={18} height={18} />
                {texts.action}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export { ManageItem };
