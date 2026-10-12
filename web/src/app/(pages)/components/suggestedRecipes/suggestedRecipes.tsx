"use client";

import { startTransition, useRef, useState } from "react";
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
  // 選んだもの。選ぶとカードが消えていくので、その間はどれも押せない
  chosen: Decision | undefined;
  onChoose: (decision: Decision) => void;
}

interface SuggestedRecipesProps {
  state: PickState;
}

/**
 * 作る・作らない・スキップの選択。選ぶとカードが消え、取り消しはできない
 * 作る・作らないは押したときに記録する（スキップは記録しない）
 */
const ChoiceButtons = ({ title, chosen, onChoose }: ChoiceButtonsProps) => {
  return (
    <fieldset
      className={styles.choices}
      aria-label={`${title} をどうするか`}
      disabled={chosen !== undefined}
    >
      {CHOICES.map((choice) => (
        <button
          className={styles.choice}
          type="button"
          key={choice.value}
          data-choice={choice.value}
          data-chosen={chosen === choice.value || undefined}
          onClick={() => onChoose(choice.value)}
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
  // 選んで消えていく途中のカードと、選んだもの（キーは動画 ID）
  const [leaving, setLeaving] = useState<Record<string, Decision>>({});
  // 消え終わって、画面から取り除いたカードの動画 ID
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [hasSaveError, setHasSaveError] = useState(false);
  // 抽選し直したら、選んだカードの記録を空に戻す（スキップした動画がまた選ばれることがあるため）
  const [shownState, setShownState] = useState(state);
  const headingRef = useRef<HTMLHeadingElement>(null);

  if (state !== shownState) {
    setShownState(state);
    setLeaving({});
    setRemovedIds([]);
    setHasSaveError(false);
  }

  if (state.type === "idle") return null;
  if (state.type === "error") return <Notice isAlert>{state.message}</Notice>;
  if (state.type === "none") {
    return (
      <Notice>
        条件に合うレシピがありませんでした。キーワードを変えてみてください。
      </Notice>
    );
  }

  /** 記録できなかったカードを、消える前の状態に戻す */
  const restoreCard = (id: string) => {
    setLeaving(({ [id]: _removed, ...rest }) => rest);
    setRemovedIds((ids) => ids.filter((removedId) => removedId !== id));
    setHasSaveError(true);
  };

  /** 先にカードを消し始めてから記録し、記録できなかったときはカードを戻す */
  const choose = (recipe: PickedRecipe, decision: Decision) => {
    setLeaving((current) => ({ ...current, [recipe.videoId]: decision }));
    setHasSaveError(false);
    // 押したボタンは押せなくなって選択が外れるので、見出しへ移しておく
    headingRef.current?.focus();
    if (decision === "skip") return;

    startTransition(async () => {
      const result = await setDecisionAction({
        recipe: toNewRecipe(recipe),
        decision,
      });
      if (result.type === "error") restoreCard(recipe.videoId);
    });
  };

  /** 消える動きが終わったカードを取り除く。出てくる動きの終わりや、中の部品の動きでは何もしない */
  const removeCard = (
    id: string,
    event: React.AnimationEvent<HTMLLIElement>,
  ) => {
    if (event.target !== event.currentTarget || !(id in leaving)) return;

    setRemovedIds((ids) => [...ids, id]);
  };

  const shownRecipes = state.recipes.filter(
    (recipe) => !removedIds.includes(recipe.videoId),
  );

  return (
    <>
      <h2 className={styles.heading} ref={headingRef} tabIndex={-1}>
        提案したレシピ
      </h2>
      {hasSaveError && (
        <Notice isAlert>記録できませんでした。もう一度押してください。</Notice>
      )}
      {shownRecipes.length === 0 && (
        <Notice>
          提案したレシピをすべて選びました。「レシピを選ぶ」を押すと、次のレシピを提案します。
        </Notice>
      )}
      <ul className={styles.list}>
        {/* key を動画ごとに変えるので、別の動画が選ばれるたびに出てくる動きがやり直される */}
        {shownRecipes.map((recipe) => {
          const isLeaving = recipe.videoId in leaving;
          // 1枚ずつ少し遅らせて、順番に出てくるようにする。消えるときは遅らせない
          // 前のカードが消えても遅れが変わらないよう、抽選結果の中での順番を使う
          const enterDelay = state.recipes.indexOf(recipe) * ENTER_DELAY_MS;
          return (
            <li
              className={styles.item}
              key={recipe.videoId}
              data-leaving={isLeaving || undefined}
              style={
                isLeaving ? undefined : { animationDelay: `${enterDelay}ms` }
              }
              onAnimationEnd={(event) => removeCard(recipe.videoId, event)}
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
                chosen={leaving[recipe.videoId]}
                onChoose={(decision) => choose(recipe, decision)}
              />
            </li>
          );
        })}
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
