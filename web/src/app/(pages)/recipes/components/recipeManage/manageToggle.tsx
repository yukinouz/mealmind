"use client";

import Image from "next/image";
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
      {/* 整理中は地がメインカラーになるので、白いアイコンに替える */}
      <Image
        src={
          isManaging
            ? "/images/icon/icon-manage-white.svg"
            : "/images/icon/icon-manage.svg"
        }
        alt=""
        width={18}
        height={18}
      />
      レシピを整理する
    </button>
  );
};

export { ManageToggle };
