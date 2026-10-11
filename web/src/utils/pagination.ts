/** 1ページに出すレシピの数 */
export const RECIPES_PER_PAGE = 9;

// 真ん中のページにいるとき、先頭と末尾に出すページの数
const EDGE_PAGES = 2;
// 全部でこのページ数以下なら、「…」を使わずに全部の番号を出す
const MAX_SHOW_ALL = 8;

/** 全部で何ページあるか。0件でも1ページと数える */
export const countPages = (count: number): number =>
  Math.max(1, Math.ceil(count / RECIPES_PER_PAGE));

/** そのページに出す分だけを切り出す。範囲外のページなら空 */
export const slicePage = <T>(items: T[], page: number): T[] =>
  items.slice((page - 1) * RECIPES_PER_PAGE, page * RECIPES_PER_PAGE);

/** from から to までの番号 */
const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

/**
 * ページ送りに並べる番号。null は「…」
 * - 全部で MAX_SHOW_ALL ページ以下：全部の番号
 * - 最初の3ページ：1 2 3 … 12
 * - 最後の3ページ：1 … 10 11 12
 * - それ以外：先頭と末尾の EDGE_PAGES ページと、3ページ分の窓（例：1 2 … 5 6 7 … 11 12）
 *   窓はいまのページを真ん中にするが、4〜(最後-3) からはみ出さないようにずらす（4ページ目は 4 5 6）
 */
export const pageItems = (
  current: number,
  total: number,
): (number | null)[] => {
  if (total <= MAX_SHOW_ALL) return range(1, total);
  if (current <= 3) return [...range(1, 3), null, total];
  if (current > total - 3) return [1, null, ...range(total - 2, total)];

  const center = Math.min(Math.max(current, 5), total - 4);
  return [
    ...range(1, EDGE_PAGES),
    null,
    ...range(center - 1, center + 1),
    null,
    ...range(total - EDGE_PAGES + 1, total),
  ];
};
