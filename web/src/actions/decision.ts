"use server";

import {
  type Meal,
  type NewRecipe,
  recordMake,
  recordReject,
} from "@/lib/recipes";

export type Decision = "make" | "reject" | "skip";

export type DecisionResult = { type: "saved" } | { type: "error" };

export interface DecisionInput {
  recipe: NewRecipe;
  decision: Decision;
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

/** 正しい選択か */
const isDecision = (value: unknown): value is Decision =>
  typeof value === "string" && DECISIONS.includes(value);

/** 選択を記録する。スキップは記録しない */
const record = async (decision: Decision, recipe: NewRecipe) => {
  if (decision === "make") await recordMake(recipe);
  if (decision === "reject") await recordReject(recipe);
};

/** 提案したレシピの「作る / 作らない」から呼ばれ、選択を記録する。選んだカードは画面から消えるので、取り消しはない */
export const setDecisionAction = async ({
  recipe,
  decision,
}: DecisionInput): Promise<DecisionResult> => {
  if (!isNewRecipe(recipe) || !isDecision(decision)) return { type: "error" };

  // 余計な項目まで記録しないよう、確かめた項目だけで作り直す
  const { id, title, url, sourceId, channel, meal } = recipe;
  const checked: NewRecipe = { id, title, url, sourceId, channel, meal };

  try {
    await record(decision, checked);
    return { type: "saved" };
  } catch {
    return { type: "error" };
  }
};
