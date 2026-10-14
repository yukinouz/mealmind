import { describe, expect, it } from "vitest";
import { isIdList } from "./idList";

describe("isIdList", () => {
  it("空でない文字列の配列なら true", () => {
    expect(isIdList(["abc", "def"])).toBe(true);
    expect(isIdList([])).toBe(true);
  });

  it("配列でない・空文字や文字列以外を含むなら false", () => {
    expect(isIdList("abc")).toBe(false);
    expect(isIdList(["abc", ""])).toBe(false);
    expect(isIdList(["abc", 1])).toBe(false);
  });

  it("1000件までは受け付け、それを超えたら false", () => {
    expect(isIdList(Array(1000).fill("id"))).toBe(true);
    expect(isIdList(Array(1001).fill("id"))).toBe(false);
  });
});
