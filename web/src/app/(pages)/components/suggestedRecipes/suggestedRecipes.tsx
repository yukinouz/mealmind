"use client";

import { useState } from "react";
import type { PickState } from "@/actions/pick-recipe";
import { Inner } from "@/app/(pages)/components/inner/inner";
import { RecipeCard } from "@/app/(pages)/components/recipeCard/recipeCard";
import { Section } from "@/app/(pages)/components/section/section";
import styles from "./_styles/_suggestedRecipes.module.scss";

type Decision = "make" | "reject" | "skip";

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
 * 今は画面を開いている間だけ覚えておき、まだ記録はしない
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

  if (state.type === "idle") return null;
  if (state.type === "error") return <Notice isAlert>{state.message}</Notice>;
  if (state.type === "none") {
    return (
      <Notice>
        条件に合うレシピがありませんでした。キーワードを変えてみてください。
      </Notice>
    );
  }

  /** 選んだものを記録し、取り消したときは消す */
  const changeDecision = (id: string, decision: Decision | undefined) => {
    setDecisions(({ [id]: _removed, ...rest }) =>
      decision === undefined ? rest : { ...rest, [id]: decision },
    );
  };

  return (
    <>
      <h2 className={styles.heading}>提案したレシピ</h2>
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
              onChange={(decision) => changeDecision(recipe.videoId, decision)}
            />
          </li>
        ))}
      </ul>
    </>
  );
};

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
