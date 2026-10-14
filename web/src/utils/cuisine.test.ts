import { describe, expect, it } from "vitest";
import { CUISINES, isCuisine } from "./cuisine";

describe("isCuisine", () => {
  it("決められた料理の系統なら true", () => {
    for (const cuisine of CUISINES) {
      expect(isCuisine(cuisine)).toBe(true);
    }
  });

  it("知らない文字列や文字列以外なら false", () => {
    expect(isCuisine("french")).toBe(false);
    expect(isCuisine(undefined)).toBe(false);
    expect(isCuisine(1)).toBe(false);
  });
});
