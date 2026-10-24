import { clampInteger } from "./clampInteger";
import { toLocalDate } from "./localDate";

/** 割合の合計。データも画面も、この値にそろえる */
export const TOTAL_WEIGHT = 100;

/** ハンドルから id に使える文字（英数字とハイフン。レシピ一覧の URL の絞り込みと同じ）が残らないときの id */
const ID_FALLBACK = "channel";

/**
 * 追加したチャンネルの id を、ハンドルから作る。@ を外し、英小文字・数字・ハイフンだけにする
 * 使えない文字（_ や日本語など）はハイフンにし、何も残らなければ channel にする
 * すでにある id と重なったら、末尾に 2, 3, ... を付ける
 */
export const toSourceId = (
  handle: string | null,
  existingIds: readonly string[],
): string => {
  const base =
    (handle ?? "")
      .replace(/^@/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || ID_FALLBACK;
  if (!existingIds.includes(base)) return base;

  let suffix = 2;
  while (existingIds.includes(`${base}${suffix}`)) suffix += 1;
  return `${base}${suffix}`;
};

/** 割合の合計 */
export const totalWeight = (weights: readonly number[]): number =>
  weights.reduce((sum, weight) => sum + weight, 0);

/** 保存できる割合か。チャンネルが1つもないときは、合計を問わない */
export const isTotalWeightValid = (weights: readonly number[]): boolean =>
  weights.length === 0 || totalWeight(weights) === TOTAL_WEIGHT;

/** 合計の下に出す説明 */
export const totalWeightMessage = (total: number): string => {
  if (total === TOTAL_WEIGHT) return "ちょうど 100% です";
  if (total < TOTAL_WEIGHT) return `あと ${TOTAL_WEIGHT - total}% 足りません`;
  return `${total - TOTAL_WEIGHT}% 多すぎます`;
};

/** 入力された割合を、0〜100 の整数にする。数でなければ 0 */
export const clampWeight = (value: string): number =>
  clampInteger(value, TOTAL_WEIGHT);

/** 動画一覧の件数と取得日（例：1240件(2026/10/20)）。日付は手元の時刻で数える */
export const videosNote = (count: number, fetchedAt: string): string =>
  `${count}件(${toLocalDate(new Date(fetchedAt)).replaceAll("-", "/")})`;
