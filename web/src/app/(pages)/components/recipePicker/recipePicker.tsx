"use client";

import Image from "next/image";
import { startTransition, useActionState, useState } from "react";
import { type PickState, pickRecipeAction } from "@/actions/pick-recipe";
import { Inner } from "@/app/(pages)/components/inner/inner";
import { Section } from "@/app/(pages)/components/section/section";
import type { Meal } from "@/lib/recipes";
import styles from "./_styles/_recipePicker.module.scss";

const INITIAL_STATE: PickState = { type: "idle" };

const MEAL_OPTIONS: { value: Meal; label: string }[] = [
  { value: "dinner", label: "夕食" },
  { value: "lunch", label: "昼食" },
];

interface MealToggleProps {
  meal: Meal;
  onChange: (meal: Meal) => void;
}

/**
 * 夕食・昼食の切り替え。data-meal で、白い背景を選んだ側へすべらせる
 * 押すたびに作り直されないよう、RecipePicker の外で定義する（中で定義すると、すべる動きが出ない）
 */
const MealToggle = ({ meal, onChange }: MealToggleProps) => {
  return (
    <fieldset className={styles.mealSwitch} aria-label="食事" data-meal={meal}>
      <span className={styles.thumb} aria-hidden="true" />
      {MEAL_OPTIONS.map((option) => (
        <button
          className={styles.mealButton}
          type="button"
          key={option.value}
          aria-pressed={meal === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
};

/** 抽選の結果を表示する */
const PickResult = ({ state }: { state: PickState }) => {
  if (state.type === "idle") return null;
  if (state.type === "error") return <p role="alert">{state.message}</p>;
  if (state.type === "none") return <p>条件に合うレシピがありませんでした。</p>;
  if (state.type === "kurashiru") {
    return (
      <p>
        クラシルが選ばれました（画面からの検索はまだできません）。
        <a href={state.siteUrl} target="_blank" rel="noopener noreferrer">
          {state.channelName}
        </a>
      </p>
    );
  }

  return (
    <article>
      <h2>
        <a href={state.url} target="_blank" rel="noopener noreferrer">
          {state.title}
        </a>
      </h2>
      <p>{state.channelName}</p>
    </article>
  );
};

/** トップの見出しと、キーワード・食事を指定してレシピを選ぶフォーム */
export const RecipePicker = () => {
  const [keyword, setKeyword] = useState("");
  const [meal, setMeal] = useState<Meal>("dinner");
  const [state, pickAction, isPending] = useActionState(
    pickRecipeAction,
    INITIAL_STATE,
  );

  /** ブラウザの送信（ページの読み込み直し）を止め、入力を残したまま抽選する */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => pickAction({ keyword, meal }));
  };

  return (
    <Section top bottom>
      <Inner variant="hero">
        <div className={styles.hero}>
          <hgroup className={styles.hgroup}>
            <h1 className={styles.title}>今日、何作ろう？</h1>
            <p className={styles.lead}>
              登録したYouTubeチャンネルとレシピサイトから、レシピを提案します
            </p>
          </hgroup>
          <search className={styles.search}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.searchBox}>
                <Image
                  src="/images/icons/search.svg"
                  alt=""
                  width={20}
                  height={20}
                />
                <input
                  className={styles.input}
                  id="keyword"
                  type="text"
                  aria-label="使いたい食材や料理名"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="例：豚バラ キャベツ"
                  autoComplete="off"
                />
              </div>
              <p className={styles.text}>※入れなくても選べます</p>
              <MealToggle meal={meal} onChange={setMeal} />
              <button
                className={styles.submit}
                type="submit"
                disabled={isPending}
              >
                {isPending ? "選んでいます…" : "レシピを選ぶ"}
              </button>
            </form>
          </search>
        </div>
      </Inner>
      <Inner>
        <PickResult state={state} />
      </Inner>
    </Section>
  );
};
