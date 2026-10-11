"use client";

import { startTransition, useState } from "react";
import { type Decision, setDecisionAction } from "@/actions/decision";
import type { PickState } from "@/actions/pick-recipe";
import { Inner } from "@/app/(pages)/components/inner/inner";
import { RecipeCard } from "@/app/(pages)/components/recipeCard/recipeCard";
import { Section } from "@/app/(pages)/components/section/section";
import type { PickedRecipe } from "@/lib/pick-recipe";
import type { NewRecipe } from "@/lib/recipes";
import styles from "./_styles/_suggestedRecipes.module.scss";

const CHOICES: { value: Decision; label: string }[] = [
  { value: "make", label: "作る" },
  { value: "reject", label: "作らない" },
  { value: "skip", label: "スキップ" },
];

// カードが順番に出てくるときの、1枚ごとの遅れ
const ENTER_DELAY_MS = 70;

interface ChoiceButtonsProps {
  title: string;
  decision: Decision | undefined;
  onChange: (decision: Decision | undefined) => void;
}

interface SuggestedRecipesProps {
  state: PickState;
}

/**
 * 作る・作らない・スキップの選択。同じものをもう一度押すと取り消す
 * 作る・作らないは押したときに記録する（スキップは記録しない）
 */
const ChoiceButtons = ({ title, decision, onChange }: ChoiceButtonsProps) => {
  return (
    <fieldset className={styles.choices} aria-label={`${title} をどうするか`}>
      {CHOICES.map((choice) => (
        <button
          className={styles.choice}
          type="button"
          key={choice.value}
          data-choice={choice.value}
          aria-pressed={decision === choice.value}
          onClick={() =>
            onChange(decision === choice.value ? undefined : choice.value)
          }
        >
          {choice.label}
        </button>
      ))}
    </fieldset>
  );
};

/** 該当なしやエラーなど、カードの代わりに出すお知らせ */
const Notice = ({
  children,
  isAlert = false,
}: {
  children: React.ReactNode;
  isAlert?: boolean;
}) => {
  return (
    <p className={styles.notice} role={isAlert ? "alert" : "status"}>
      {children}
    </p>
  );
};

/** 抽選の結果の中身。まだ抽選していないときは何も出さない */
const SuggestedContent = ({ state }: SuggestedRecipesProps) => {
  // レシピごとに、どれを選んだかを覚える（キーは動画 ID）
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [hasSaveError, setHasSaveError] = useState(false);

  if (state.type === "idle") return null;
  if (state.type === "error") return <Notice isAlert>{state.message}</Notice>;
  if (state.type === "none") {
    return (
      <Notice>
        条件に合うレシピがありませんでした。キーワードを変えてみてください。
      </Notice>
    );
  }

  /** 画面で覚えている選択を書き換える。取り消したときは消す */
  const showDecision = (id: string, decision: Decision | undefined) => {
    setDecisions(({ [id]: _removed, ...rest }) =>
      decision === undefined ? rest : { ...rest, [id]: decision },
    );
  };

  /** 先に画面の選択を変えてから記録し、記録できなかったときは元の選択に戻す */
  const changeDecision = (recipe: PickedRecipe, next: Decision | undefined) => {
    const previous = decisions[recipe.videoId];
    showDecision(recipe.videoId, next);
    setHasSaveError(false);

    startTransition(async () => {
      const result = await setDecisionAction({
        recipe: toNewRecipe(recipe),
        previous,
        next,
      });
      if (result.type === "saved") return;

      showDecision(recipe.videoId, previous);
      setHasSaveError(true);
    });
  };

  return (
    <>
      <h2 className={styles.heading}>提案したレシピ</h2>
      {hasSaveError && (
        <Notice isAlert>記録できませんでした。もう一度押してください。</Notice>
      )}
      <ul className={styles.list}>
        {/* key を動画ごとに変えるので、別の動画が選ばれるたびに出てくる動きがやり直される */}
        {state.recipes.map((recipe, index) => (
          <li
            className={styles.item}
            key={recipe.videoId}
            // 1枚ずつ少し遅らせて、順番に出てくるようにする
            style={{ animationDelay: `${index * ENTER_DELAY_MS}ms` }}
          >
            <RecipeCard
              recipe={{
                id: recipe.videoId,
                title: recipe.title,
                url: recipe.url,
                channel: recipe.channelName,
                meals: [recipe.meal],
              }}
            />
            <ChoiceButtons
              title={recipe.title}
              decision={decisions[recipe.videoId]}
              onChange={(decision) => changeDecision(recipe, decision)}
            />
          </li>
        ))}
      </ul>
    </>
  );
};

/** 抽選の結果を、記録に使う形に直す */
const toNewRecipe = (recipe: PickedRecipe): NewRecipe => ({
  id: recipe.videoId,
  title: recipe.title,
  url: recipe.url,
  sourceId: recipe.sourceId,
  channel: recipe.channelName,
  meal: recipe.meal,
});

/** トップの「提案したレシピ」。上のセクションとの間は、上のセクションの余白だけにする */
export const SuggestedRecipes = ({ state }: SuggestedRecipesProps) => {
  if (state.type === "idle") return null;

  return (
    <Section bottom>
      <Inner>
        <SuggestedContent state={state} />
      </Inner>
    </Section>
  );
};
