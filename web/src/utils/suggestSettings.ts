/** 画面で編集する提案のしかた。出やすさは %（0.2 → 20）、日数はそのまま */
export interface SuggestForm {
  chosen: number;
  favorite: number;
  days: number;
}

// settings.json の形（lib/settings.ts の SuggestSettings と同じ）
interface SuggestValues {
  chosenRecipeWeight: number;
  favoriteRecipeWeight: number;
  resuggestAfterDays: number;
}

/** 入力できる範囲。出やすさは 0〜100%、日数は 0〜365日 */
export const SUGGEST_LIMITS: Record<keyof SuggestForm, { max: number }> = {
  chosen: { max: 100 },
  favorite: { max: 100 },
  days: { max: 365 },
};

/** 0.2 のような重みを、20 のような % にする */
export const toPercent = (weight: number): number => Math.round(weight * 100);

/** 20 のような % を、0.2 のような重みにする */
export const fromPercent = (percent: number): number => percent / 100;

/** settings.json の値を、画面で編集する形にする */
export const toSuggestForm = (values: SuggestValues): SuggestForm => ({
  chosen: toPercent(values.chosenRecipeWeight),
  favorite: toPercent(values.favoriteRecipeWeight),
  days: values.resuggestAfterDays,
});

/** 画面で編集した値を、settings.json の形にする */
export const fromSuggestForm = (form: SuggestForm): SuggestValues => ({
  chosenRecipeWeight: fromPercent(form.chosen),
  favoriteRecipeWeight: fromPercent(form.favorite),
  resuggestAfterDays: form.days,
});

/** 保存できる値か。どれも範囲の中の整数 */
export const isValidSuggestForm = (value: unknown): value is SuggestForm => {
  if (typeof value !== "object" || value === null) return false;

  const form = value as Record<string, unknown>;
  return (Object.keys(SUGGEST_LIMITS) as (keyof SuggestForm)[]).every(
    (key) =>
      Number.isInteger(form[key]) &&
      (form[key] as number) >= 0 &&
      (form[key] as number) <= SUGGEST_LIMITS[key].max,
  );
};
