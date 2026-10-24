/** 食事ごとの、提案するジャンルの選び方。all は条件なし、only は onlyGenres、except は avoidGenres */
export type GenreMode = "all" | "only" | "except";

/** 食事の名前（preferences.json の meals のキー） */
export type MealId = "dinner" | "lunch";

/** 画面で編集するジャンル。key は画面の中で見分けるための値（名前は変えられるので） */
export interface GenreForm {
  key: string;
  name: string;
  keywords: string[];
}

/** 画面で編集する、食事ごとの条件 */
export interface MealForm {
  id: MealId;
  mode: GenreMode;
  // 選んだジャンルの key。「すべてのジャンル」にしても、選んだものは画面の中では覚えておく
  genreKeys: string[];
  // この食事で提案しないタイトルの言葉
  keywords: string[];
}

/** 食事とジャンルのページで編集する値 */
export interface MealsForm {
  genres: GenreForm[];
  meals: MealForm[];
}

/** preferences.json の meals の1件（ここで扱う項目だけ。ほかの項目はそのまま残す） */
export interface MealEntry extends Record<string, unknown> {
  onlyGenres?: string[];
  avoidGenres?: string[];
  avoidTitleKeywords?: string[];
}

/** preferences.json の genres と meals */
export interface MealsData {
  genres: Record<string, string[]>;
  meals: Record<string, MealEntry>;
}

/** 画面に出す食事の順と名前 */
export const MEALS: { id: MealId; label: string }[] = [
  { id: "dinner", label: "夕食" },
  { id: "lunch", label: "昼食" },
];

/** 画面の key を作る。ジャンルの並び順で決める */
export const genreKeyOf = (index: number): string => `genre-${index}`;

/** 条件の書き方から、選び方を決める */
const modeOf = (entry: MealEntry): GenreMode => {
  if (entry.onlyGenres !== undefined) return "only";
  if (entry.avoidGenres !== undefined) return "except";
  return "all";
};

/** preferences.json の genres と meals を、画面で編集する形にする */
export const toMealsForm = ({ genres, meals }: MealsData): MealsForm => {
  const genreForms = Object.entries(genres).map(([name, keywords], index) => ({
    key: genreKeyOf(index),
    name,
    keywords,
  }));
  const keyByName = new Map(genreForms.map(({ key, name }) => [name, key]));

  return {
    genres: genreForms,
    meals: MEALS.map(({ id }) => {
      const entry = meals[id] ?? {};
      const mode = modeOf(entry);
      const names =
        (mode === "only" ? entry.onlyGenres : entry.avoidGenres) ?? [];
      return {
        id,
        mode,
        // genres にないジャンルの名前は、どれにも当たらないので落とす
        genreKeys: names.flatMap((name) => keyByName.get(name) ?? []),
        keywords: entry.avoidTitleKeywords ?? [],
      };
    }),
  };
};

/** 1つの食事の条件を、meals の1件にする。ほかの項目と、もともとあった avoidTitleKeywords の空の配列は残す */
const toMealEntry = (
  meal: MealForm,
  genreNameByKey: Map<string, string>,
  saved: MealEntry,
): MealEntry => {
  const { onlyGenres, avoidGenres, avoidTitleKeywords, ...rest } = saved;
  const names = meal.genreKeys.flatMap((key) => genreNameByKey.get(key) ?? []);
  return {
    ...rest,
    ...(meal.mode === "only" ? { onlyGenres: names } : {}),
    ...(meal.mode === "except" ? { avoidGenres: names } : {}),
    ...(meal.keywords.length > 0 || avoidTitleKeywords !== undefined
      ? { avoidTitleKeywords: meal.keywords }
      : {}),
  };
};

/**
 * 画面で編集した値を、preferences.json の genres と meals にする
 * ジャンル名を変えたときは、meals の参照も新しい名前になる（key で結んでいるため）
 * 削除したジャンルは、meals の条件からも外れる
 */
export const fromMealsForm = (
  form: MealsForm,
  savedMeals: Record<string, MealEntry>,
): MealsData => {
  const genreNameByKey = new Map(
    form.genres.map(({ key, name }) => [key, name.trim()]),
  );
  return {
    genres: Object.fromEntries(
      form.genres.map(({ name, keywords }) => [name.trim(), keywords]),
    ),
    meals: {
      ...savedMeals,
      ...Object.fromEntries(
        form.meals.map((meal) => [
          meal.id,
          toMealEntry(meal, genreNameByKey, savedMeals[meal.id] ?? {}),
        ]),
      ),
    },
  };
};

/** ジャンルを削除する。食事の条件からも外す */
export const removeGenre = (form: MealsForm, key: string): MealsForm => ({
  genres: form.genres.filter((genre) => genre.key !== key),
  meals: form.meals.map((meal) => ({
    ...meal,
    genreKeys: meal.genreKeys.filter((genreKey) => genreKey !== key),
  })),
});

/** 保存できない理由。保存できるなら null */
export const mealsInvalidReason = (form: MealsForm): string | null => {
  const names = form.genres.map(({ name }) => name.trim());
  if (names.some((name) => name === "")) {
    return "名前が空のジャンルがあります";
  }
  if (new Set(names).size !== names.length) {
    return "名前が重なっているジャンルがあります";
  }
  const label = MEALS.find(({ id }) =>
    form.meals.some(
      (meal) =>
        meal.id === id && meal.mode === "only" && meal.genreKeys.length === 0,
    ),
  )?.label;
  if (label !== undefined) {
    return `${label}の「選んだジャンルだけ」で、ジャンルを1つ以上選んでください`;
  }
  return null;
};
