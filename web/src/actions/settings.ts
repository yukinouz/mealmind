"use server";

import {
  type FoundChannel,
  fetchVideos,
  lookupChannel,
} from "@/lib/channelScripts";
import {
  PREFERENCE_KEYS,
  type PreferenceLists,
  readMealsData,
  writeMealsData,
  writePreferenceLists,
} from "@/lib/preferences";
import { writeSuggestSettings } from "@/lib/settings";
import {
  type ChannelWithVideos,
  readChannelSettings,
  writeChannelSettings,
} from "@/lib/sources";
import { isValidChannelSettings } from "@/utils/channelSettings";
import {
  fromMealsForm,
  type GenreForm,
  MEALS,
  type MealForm,
  type MealsForm,
  mealsInvalidReason,
} from "@/utils/mealSettings";
import { fromSuggestForm, isValidSuggestForm } from "@/utils/suggestSettings";

export type SaveResult = { type: "saved" } | { type: "error" };

export type LookupResult =
  | { type: "found"; channel: FoundChannel }
  | { type: "error"; message: string };

/** 保存・更新の結果。failedIds は動画一覧を取得できなかったチャンネル */
export type VideosResult =
  | { type: "done"; channels: ChannelWithVideos[]; failedIds: string[] }
  | { type: "error" };

// 入力欄の長さの上限。URL かハンドルなので、これより長いものは探さない
const MAX_QUERY_LENGTH = 200;
/** 空でない文字列か */
const isFilledString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

/** 言葉の一覧か。空の言葉と、重なった言葉は入れない */
const isWordList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every(isFilledString) &&
  new Set(value).size === value.length;

/** 好みのページから届いた値か。4つの項目がどれも言葉の一覧 */
const isPreferenceLists = (value: unknown): value is PreferenceLists => {
  if (typeof value !== "object" || value === null) return false;

  const lists = value as Record<string, unknown>;
  return PREFERENCE_KEYS.every((key) => isWordList(lists[key]));
};

const GENRE_MODES: readonly string[] = ["all", "only", "except"];

/** 食事とジャンルのページから届いたジャンルか */
const isGenreForm = (value: unknown): value is GenreForm => {
  if (typeof value !== "object" || value === null) return false;

  const genre = value as Record<string, unknown>;
  return (
    isFilledString(genre.key) &&
    typeof genre.name === "string" &&
    isWordList(genre.keywords)
  );
};

/** 食事とジャンルのページから届いた、食事ごとの条件か */
const isMealForm = (value: unknown): value is MealForm => {
  if (typeof value !== "object" || value === null) return false;

  const meal = value as Record<string, unknown>;
  return (
    MEALS.some(({ id }) => id === meal.id) &&
    typeof meal.mode === "string" &&
    GENRE_MODES.includes(meal.mode) &&
    Array.isArray(meal.genreKeys) &&
    meal.genreKeys.every((key) => typeof key === "string") &&
    isWordList(meal.keywords)
  );
};

/** 食事とジャンルのページから届いた値か。夕食・昼食がそろい、保存できない理由がない */
const isMealsForm = (value: unknown): value is MealsForm => {
  if (typeof value !== "object" || value === null) return false;

  const form = value as Record<string, unknown>;
  return (
    Array.isArray(form.genres) &&
    form.genres.every(isGenreForm) &&
    Array.isArray(form.meals) &&
    form.meals.every(isMealForm) &&
    MEALS.every(({ id }) =>
      (form.meals as MealForm[]).some((meal) => meal.id === id),
    ) &&
    mealsInvalidReason(value as MealsForm) === null
  );
};

/** 動画一覧を取り直し、取得できなかった id を返す。まとめて動かして待ち時間を短くする */
const fetchAll = async (ids: string[]): Promise<string[]> => {
  const results = await Promise.all(
    ids.map(async (id) => ({ id, isFetched: await fetchVideos(id) })),
  );
  return results.filter(({ isFetched }) => !isFetched).map(({ id }) => id);
};

/**
 * 「探す」から呼ばれ、URL かハンドルからチャンネルを探す
 * 見つからないときと、登録済み（保存済みか、画面で追加予定）のときは、画面に出す文言を返す
 */
export const lookupChannelAction = async (
  query: unknown,
  pendingChannelIds: unknown,
): Promise<LookupResult> => {
  if (!isFilledString(query) || query.length > MAX_QUERY_LENGTH) {
    return { type: "error", message: "URL かハンドルを入力してください" };
  }

  try {
    const found = await lookupChannel(query.trim());
    if (found === null) {
      return {
        type: "error",
        message:
          "チャンネルが見つかりませんでした。URL かハンドルを確かめてください",
      };
    }

    const saved = await readChannelSettings();
    const registeredIds = [
      ...saved.map((channel) => channel.channelId),
      ...(Array.isArray(pendingChannelIds) ? pendingChannelIds : []),
    ];
    if (registeredIds.includes(found.channelId)) {
      return {
        type: "error",
        message:
          "このチャンネルは登録済みです（一覧から外したチャンネルを追加し直すときは、先に保存してください）",
      };
    }
    return { type: "found", channel: found };
  } catch {
    return {
      type: "error",
      message:
        "チャンネルを探せませんでした。時間をおいてもう一度お試しください",
    };
  }
};

/**
 * 「保存する」から呼ばれ、sources.json を書き換える。追加したチャンネルだけ動画一覧を取得する
 * 書き込みは成功して、取得だけ失敗することもある（failedIds）
 */
export const saveChannelsAction = async (
  channels: unknown,
): Promise<VideosResult> => {
  if (!isValidChannelSettings(channels)) return { type: "error" };

  // 余計な項目まで書かないよう、確かめた項目だけで作り直す
  const checked = channels.map(
    ({ id, name, shortName, handle, channelId, weight }) => ({
      id,
      name: name.trim(),
      shortName: shortName.trim(),
      handle,
      channelId,
      weight,
    }),
  );

  try {
    const { addedIds } = await writeChannelSettings(checked);
    const failedIds = await fetchAll(addedIds);
    return { type: "done", channels: await readChannelSettings(), failedIds };
  } catch {
    return { type: "error" };
  }
};

/** 「更新」「すべて更新」から呼ばれ、登録済みのチャンネルの動画一覧を取り直す。「保存する」とは別に、すぐ実行する */
export const updateVideosAction = async (
  ids: unknown,
): Promise<VideosResult> => {
  if (!Array.isArray(ids) || ids.length === 0) return { type: "error" };

  try {
    const savedIds = (await readChannelSettings()).map((channel) => channel.id);
    if (!ids.every((id) => savedIds.includes(id))) return { type: "error" };

    const failedIds = await fetchAll([...new Set(ids as string[])]);
    return { type: "done", channels: await readChannelSettings(), failedIds };
  } catch {
    return { type: "error" };
  }
};

/** 提案のしかたの「保存する」から呼ばれ、settings.json に書く。画面の % は重みに戻す */
export const saveSuggestSettingsAction = async (
  form: unknown,
): Promise<SaveResult> => {
  if (!isValidSuggestForm(form)) return { type: "error" };

  const { chosen, favorite, days } = form;
  try {
    await writeSuggestSettings(fromSuggestForm({ chosen, favorite, days }));
    return { type: "saved" };
  } catch {
    return { type: "error" };
  }
};

/** 好みの「保存する」から呼ばれ、preferences.json の4つの項目を書く。genres・meals はそのまま残す */
export const savePreferencesAction = async (
  lists: unknown,
): Promise<SaveResult> => {
  if (!isPreferenceLists(lists)) return { type: "error" };

  // 余計な項目まで書かないよう、確かめた項目だけで作り直す
  const checked = Object.fromEntries(
    PREFERENCE_KEYS.map((key) => [key, lists[key].map((word) => word.trim())]),
  ) as unknown as PreferenceLists;
  try {
    await writePreferenceLists(checked);
    return { type: "saved" };
  } catch {
    return { type: "error" };
  }
};

/**
 * 食事とジャンルの「保存する」から呼ばれ、preferences.json の genres と meals を書く
 * ジャンル名を変えたときは、meals の参照も一緒に書き換える。ほかの項目は残す
 */
export const saveMealsAction = async (form: unknown): Promise<SaveResult> => {
  if (!isMealsForm(form)) return { type: "error" };

  try {
    const { meals } = await readMealsData();
    await writeMealsData(fromMealsForm(form, meals));
    return { type: "saved" };
  } catch {
    return { type: "error" };
  }
};
