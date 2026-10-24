import path from "node:path";
import type { MealsData } from "@/utils/mealSettings";
import { dataDir, inOrder, readJson, writeJsonSafely } from "./dataFiles";

/** 好みのページで編集する、言葉の一覧 */
export interface PreferenceLists {
  avoidIngredients: string[];
  avoidSeasonings: string[];
  pantryIngredients: string[];
  avoidTitleKeywords: string[];
}

/** 好みのページで編集する項目の名前 */
export const PREFERENCE_KEYS: (keyof PreferenceLists)[] = [
  "avoidIngredients",
  "avoidSeasonings",
  "pantryIngredients",
  "avoidTitleKeywords",
];

// 画面で扱わない項目（genres・meals など）も消さないよう、型で絞らずにそのまま読み書きする
interface PreferencesFile extends Record<string, unknown> {
  schemaVersion: number;
}

/** preferences.json の場所。環境変数の変更に追いつけるよう、使うたびに組み立てる */
const preferencesPath = (): string => path.join(dataDir(), "preferences.json");

/** preferences.json を読む。ファイルがないときは schemaVersion だけ */
export const readPreferencesFile = () =>
  readJson<PreferencesFile>(preferencesPath(), { schemaVersion: 1 });

/** 文字列の一覧として読む。なければ空 */
const stringsOf = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

/** オブジェクトとして読む。手で編集して形が崩れていたら空 */
const recordOf = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/** 項目があれば文字列の一覧として読む。なければ項目ごと書かない */
const listOf = (key: string, value: unknown) =>
  value === undefined ? {} : { [key]: stringsOf(value) };

/** 好みのページで編集する言葉の一覧を読む。ファイルや項目がないときは空 */
export const readPreferenceLists = async (): Promise<PreferenceLists> => {
  const file = await readPreferencesFile();
  return {
    avoidIngredients: stringsOf(file.avoidIngredients),
    avoidSeasonings: stringsOf(file.avoidSeasonings),
    pantryIngredients: stringsOf(file.pantryIngredients),
    avoidTitleKeywords: stringsOf(file.avoidTitleKeywords),
  };
};

/**
 * preferences.json の一部の項目を書き換える。ほかの項目（genres・meals など）は、そのまま残して書き戻す
 * 読んでから書くまでの間に別の書き込みが割り込まないよう、順番待ちに並ぶ
 */
export const updatePreferencesFile = (patch: Record<string, unknown>) =>
  inOrder(async () => {
    const file = await readPreferencesFile();
    await writeJsonSafely(preferencesPath(), { ...file, ...patch });
  });

/** 好みのページで編集した言葉の一覧を書く */
export const writePreferenceLists = (lists: PreferenceLists) =>
  updatePreferencesFile({ ...lists });

/** 食事とジャンルのページで編集する genres と meals を読む。ないときは空 */
export const readMealsData = async (): Promise<MealsData> => {
  const file = await readPreferencesFile();
  return {
    genres: Object.fromEntries(
      Object.entries(recordOf(file.genres)).map(([name, keywords]) => [
        name,
        stringsOf(keywords),
      ]),
    ),
    meals: Object.fromEntries(
      Object.entries(recordOf(file.meals)).map(([id, entry]) => {
        const meal = recordOf(entry);
        return [
          id,
          {
            ...meal,
            ...listOf("onlyGenres", meal.onlyGenres),
            ...listOf("avoidGenres", meal.avoidGenres),
            ...listOf("avoidTitleKeywords", meal.avoidTitleKeywords),
          },
        ];
      }),
    ),
  };
};

/** genres と meals を書く。ほかの項目（使わない食材など）は残す */
export const writeMealsData = ({ genres, meals }: MealsData) =>
  updatePreferencesFile({ genres, meals });
