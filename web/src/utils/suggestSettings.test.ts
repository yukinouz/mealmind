import { describe, expect, it } from "vitest";
import { clampInteger } from "./clampInteger";
import {
  fromSuggestForm,
  isValidSuggestForm,
  toSuggestForm,
} from "./suggestSettings";

describe("toSuggestForm / fromSuggestForm", () => {
  it("重みを % にして見せ、保存するときは重みに戻す", () => {
    const values = {
      chosenRecipeWeight: 0.2,
      favoriteRecipeWeight: 0.5,
      resuggestAfterDays: 14,
    };

    const form = toSuggestForm(values);

    expect(form).toEqual({ chosen: 20, favorite: 50, days: 14 });
    expect(fromSuggestForm(form)).toEqual(values);
  });

  it("% にするときは整数に丸める", () => {
    expect(
      toSuggestForm({
        chosenRecipeWeight: 0.075,
        favoriteRecipeWeight: 0.07,
        resuggestAfterDays: 0,
      }),
    ).toEqual({ chosen: 8, favorite: 7, days: 0 });
  });

  it("1桁の % も、きりのよい重みに戻る", () => {
    expect(fromSuggestForm({ chosen: 7, favorite: 0, days: 365 })).toEqual({
      chosenRecipeWeight: 0.07,
      favoriteRecipeWeight: 0,
      resuggestAfterDays: 365,
    });
  });
});

describe("isValidSuggestForm", () => {
  it("出やすさは 0〜100、日数は 0〜365 の整数だけ", () => {
    expect(isValidSuggestForm({ chosen: 0, favorite: 100, days: 365 })).toBe(
      true,
    );
    expect(isValidSuggestForm({ chosen: 101, favorite: 50, days: 14 })).toBe(
      false,
    );
    expect(isValidSuggestForm({ chosen: 20, favorite: 50, days: 366 })).toBe(
      false,
    );
    expect(isValidSuggestForm({ chosen: 2.5, favorite: 50, days: 14 })).toBe(
      false,
    );
    expect(isValidSuggestForm({ chosen: 20, favorite: 50 })).toBe(false);
    expect(isValidSuggestForm(null)).toBe(false);
  });
});

describe("clampInteger", () => {
  it("0〜max の整数にする。数でなければ 0", () => {
    expect(clampInteger("33.6", 100)).toBe(34);
    expect(clampInteger("400", 365)).toBe(365);
    expect(clampInteger("-5", 100)).toBe(0);
    expect(clampInteger("abc", 100)).toBe(0);
  });
});
