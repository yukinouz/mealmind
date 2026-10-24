import path from "node:path";
import { dataDir, inOrder, readJson, writeJsonSafely } from "./dataFiles";

/** 抽選の設定（data/personal/settings.json）。重みは「まだ作っていないレシピ」を 1 としたときの出やすさ */
export interface SuggestSettings {
  chosenRecipeWeight: number;
  favoriteRecipeWeight: number;
  resuggestAfterDays: number;
}

// ファイルや項目がないときの値。scripts/pick-recipe.sh の既定値と同じ
const DEFAULT_SETTINGS: SuggestSettings = {
  chosenRecipeWeight: 0.2,
  favoriteRecipeWeight: 0.5,
  resuggestAfterDays: 14,
};

// 知らない項目も消さないよう、型で絞らずにそのまま読み書きする
interface SettingsFile extends Record<string, unknown> {
  schemaVersion: number;
}

/** settings.json の場所。環境変数の変更に追いつけるよう、使うたびに組み立てる */
const settingsPath = (): string => path.join(dataDir(), "settings.json");

/** settings.json を読む。ファイルがないときは schemaVersion だけ */
const readSettingsFile = () =>
  readJson<SettingsFile>(settingsPath(), { schemaVersion: 1 });

/** 数の項目を読む。なければ既定値 */
const numberOr = (value: unknown, fallback: number): number =>
  typeof value === "number" ? value : fallback;

/** 抽選の設定を読む。ファイルや項目がないときは既定値 */
export const readSuggestSettings = async (): Promise<SuggestSettings> => {
  const file = await readSettingsFile();
  return {
    chosenRecipeWeight: numberOr(
      file.chosenRecipeWeight,
      DEFAULT_SETTINGS.chosenRecipeWeight,
    ),
    favoriteRecipeWeight: numberOr(
      file.favoriteRecipeWeight,
      DEFAULT_SETTINGS.favoriteRecipeWeight,
    ),
    resuggestAfterDays: numberOr(
      file.resuggestAfterDays,
      DEFAULT_SETTINGS.resuggestAfterDays,
    ),
  };
};

/** 抽選の設定を書く。ほかの項目は残す */
export const writeSuggestSettings = (settings: SuggestSettings) =>
  inOrder(async () => {
    const file = await readSettingsFile();
    await writeJsonSafely(settingsPath(), { ...file, ...settings });
  });
