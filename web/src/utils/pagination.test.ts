import { describe, expect, it } from "vitest";
import {
  countPages,
  pageItems,
  RECIPES_PER_PAGE,
  slicePage,
} from "./pagination";

describe("countPages", () => {
  it("0件でも1ページと数える", () => {
    expect(countPages(0)).toBe(1);
  });

  it("1ページ分ちょうどなら1、1件でもはみ出せば次のページになる", () => {
    expect(countPages(RECIPES_PER_PAGE)).toBe(1);
    expect(countPages(RECIPES_PER_PAGE + 1)).toBe(2);
  });
});

describe("slicePage", () => {
  // 1 から 20 までの番号を並べた一覧
  const items = Array.from({ length: 20 }, (_, index) => index + 1);

  it("そのページの分だけを切り出す", () => {
    expect(slicePage(items, 1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(slicePage(items, 3)).toEqual([19, 20]);
  });

  it("範囲外のページなら空", () => {
    expect(slicePage(items, 4)).toEqual([]);
  });
});

describe("pageItems", () => {
  it("8ページ以下なら全部の番号を出す", () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(5, 8)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("最初の3ページにいるときは、先頭3つと最後を出す", () => {
    expect(pageItems(1, 12)).toEqual([1, 2, 3, null, 12]);
    expect(pageItems(3, 12)).toEqual([1, 2, 3, null, 12]);
  });

  it("最後の3ページにいるときは、最初と末尾3つを出す", () => {
    expect(pageItems(10, 12)).toEqual([1, null, 10, 11, 12]);
    expect(pageItems(12, 12)).toEqual([1, null, 10, 11, 12]);
  });

  it("真ん中にいるときは、いまのページを中心にした3ページ分の窓を出す", () => {
    expect(pageItems(6, 12)).toEqual([1, 2, null, 5, 6, 7, null, 11, 12]);
  });

  it("窓が端の番号と重ならないようにずらす", () => {
    expect(pageItems(4, 12)).toEqual([1, 2, null, 4, 5, 6, null, 11, 12]);
    expect(pageItems(9, 12)).toEqual([1, 2, null, 7, 8, 9, null, 11, 12]);
  });
});
