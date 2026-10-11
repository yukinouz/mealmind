"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { FillTarget } from "@/lib/recipes";

const FILL_URL = "/api/fill-ingredients";

interface IngredientsFillerProps {
  target: FillTarget;
}

/**
 * 一覧を出したあとに、指定したファイルで材料とメイン食材がまだないレシピを裏で埋める（ADR-0010）
 * 埋まったら一覧を読み直して、食材タグを出す。見た目は持たない
 */
export const IngredientsFiller = ({ target }: IngredientsFillerProps) => {
  const router = useRouter();

  useEffect(() => {
    // ページを離れたら、結果を待たずに読み直しをやめる
    let isActive = true;

    const fill = async () => {
      const response = await fetch(FILL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      if (!response.ok) return;

      const { filledCount } = (await response.json()) as {
        filledCount: number;
      };
      if (isActive && filledCount > 0) router.refresh();
    };
    // 埋められなくても一覧はそのまま使えるので、エラーは画面に出さない
    fill().catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [router, target]);

  return null;
};
