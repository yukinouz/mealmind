"use client";

import { useActionState } from "react";
import { type PickState, pickRecipeAction } from "./actions";

const INITIAL_STATE: PickState = { type: "idle" };

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

export const RecipePicker = () => {
  const [state, formAction, isPending] = useActionState(
    pickRecipeAction,
    INITIAL_STATE,
  );

  return (
    <section>
      <form action={formAction}>
        <button type="submit" disabled={isPending}>
          {isPending ? "選んでいます…" : "レシピを選ぶ"}
        </button>
      </form>
      <PickResult state={state} />
    </section>
  );
};
