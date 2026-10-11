"use server";

import {
  type Meal,
  type NewRecipe,
  recordMake,
  recordReject,
  undoMake,
  undoReject,
} from "@/lib/recipes";

export type Decision = "make" | "reject" | "skip";

export type DecisionResult = { type: "saved" } | { type: "error" };

export interface DecisionInput {
  recipe: NewRecipe;
  previous: Decision | undefined;
  next: Decision | undefined;
}

const MEALS: readonly string[] = ["dinner", "lunch"] satisfies Meal[];
const DECISIONS: readonly string[] = [
  "make",
  "reject",
  "skip",
] satisfies Decision[];
const YOUTUBE_WATCH_URL = "https://www.youtube.com/watch?v=";

/** 空でない文字列か */
const isFilledString = (value: unknown): value is string =>
  typeof value === "string" && value !== "";

/** サーバーアクションは画面の外からも呼べるので、届いたレシピの形を確かめる */
const isNewRecipe = (value: unknown): value is NewRecipe => {
  if (typeof value !== "object" || value === null) return false;

  const recipe = value as Record<string, unknown>;
  return (
    isFilledString(recipe.id) &&
    isFilledString(recipe.title) &&
    isFilledString(recipe.sourceId) &&
    isFilledString(recipe.channel) &&
    recipe.url === `${YOUTUBE_WATCH_URL}${recipe.id}` &&
    typeof recipe.meal === "string" &&
    MEALS.includes(recipe.meal)
  );
};

/** 選択なし（undefined）か、正しい選択か */
const isDecisionOrNone = (value: unknown): value is Decision | undefined =>
  value === undefined ||
  (typeof value === "string" && DECISIONS.includes(value));

/** 前の選択の記録を取り消す。スキップは記録していないので何もしない */
const undo = async (decision: Decision | undefined, url: string) => {
  if (decision === "make") await undoMake(url);
  if (decision === "reject") await undoReject(url);
};

/** 新しい選択を記録する。スキップは記録しない */
const record = async (decision: Decision | undefined, recipe: NewRecipe) => {
  if (decision === "make") await recordMake(recipe);
  if (decision === "reject") await recordReject(recipe);
};

/** 提案したレシピの「作る / 作らない / スキップ」から呼ばれ、前の選択を取り消してから新しい選択を記録する */
export const setDecisionAction = async ({
  recipe,
  previous,
  next,
}: DecisionInput): Promise<DecisionResult> => {
  if (!isNewRecipe(recipe)) return { type: "error" };
  if (!isDecisionOrNone(previous) || !isDecisionOrNone(next)) {
    return { type: "error" };
  }

  // 余計な項目まで記録しないよう、確かめた項目だけで作り直す
  const { id, title, url, sourceId, channel, meal } = recipe;
  const checked: NewRecipe = { id, title, url, sourceId, channel, meal };

  try {
    await undo(previous, checked.url);
    await record(next, checked);
    return { type: "saved" };
  } catch {
    return { type: "error" };
  }
};
