import { describe, expect, it } from "vitest";
import {
  fromMealsForm,
  type MealsData,
  type MealsForm,
  mealsInvalidReason,
  removeGenre,
  toMealsForm,
} from "./mealSettings";

// いまの preferences.json と同じ形
const DATA: MealsData = {
  genres: {
    麺類: ["パスタ", "麺"],
    ご飯もの: ["チャーハン"],
    パン: ["食パン"],
  },
  meals: {
    dinner: {
      avoidGenres: ["麺類", "ご飯もの", "パン"],
      avoidTitleKeywords: [],
    },
    lunch: { onlyGenres: ["麺類", "パン"] },
  },
};

describe("toMealsForm", () => {
  it("onlyGenres は「選んだジャンルだけ」、avoidGenres は「選んだジャンル以外」にする", () => {
    const form = toMealsForm(DATA);

    expect(form.genres).toEqual([
      { key: "genre-0", name: "麺類", keywords: ["パスタ", "麺"] },
      { key: "genre-1", name: "ご飯もの", keywords: ["チャーハン"] },
      { key: "genre-2", name: "パン", keywords: ["食パン"] },
    ]);
    expect(form.meals).toEqual([
      {
        id: "dinner",
        mode: "except",
        genreKeys: ["genre-0", "genre-1", "genre-2"],
        keywords: [],
      },
      {
        id: "lunch",
        mode: "only",
        genreKeys: ["genre-0", "genre-2"],
        keywords: [],
      },
    ]);
  });

  it("どちらもなければ「すべてのジャンル」。meals がなくても夕食・昼食を出す", () => {
    const form = toMealsForm({ genres: {}, meals: {} });

    expect(form.meals.map(({ id, mode }) => [id, mode])).toEqual([
      ["dinner", "all"],
      ["lunch", "all"],
    ]);
  });
});

describe("fromMealsForm", () => {
  it("行きと帰りで、元のデータに戻る", () => {
    expect(fromMealsForm(toMealsForm(DATA), DATA.meals)).toEqual(DATA);
  });

  it("「すべてのジャンル」は onlyGenres も avoidGenres も書かない", () => {
    const form = toMealsForm(DATA);
    form.meals[1].mode = "all";

    expect(fromMealsForm(form, DATA.meals).meals.lunch).toEqual({});
  });

  it("「選んだジャンル以外」に変えると、onlyGenres を消して avoidGenres を書く", () => {
    const form = toMealsForm(DATA);
    form.meals[1].mode = "except";

    expect(fromMealsForm(form, DATA.meals).meals.lunch).toEqual({
      avoidGenres: ["麺類", "パン"],
    });
  });

  it("ジャンル名を変えると、meals の参照も新しい名前になる", () => {
    const form = toMealsForm(DATA);
    form.genres[0].name = " めん ";

    const data = fromMealsForm(form, DATA.meals);

    expect(Object.keys(data.genres)).toEqual(["めん", "ご飯もの", "パン"]);
    expect(data.meals.lunch.onlyGenres).toEqual(["めん", "パン"]);
    expect(data.meals.dinner.avoidGenres).toEqual(["めん", "ご飯もの", "パン"]);
  });

  it("食事ごとの言葉を書く。meals のほかの項目は残す", () => {
    const form = toMealsForm(DATA);
    form.meals[1].keywords = ["鍋"];

    const data = fromMealsForm(form, {
      ...DATA.meals,
      lunch: { ...DATA.meals.lunch, memo: "残す" },
      brunch: { onlyGenres: [] },
    });

    expect(data.meals.lunch).toEqual({
      memo: "残す",
      onlyGenres: ["麺類", "パン"],
      avoidTitleKeywords: ["鍋"],
    });
    expect(data.meals.brunch).toEqual({ onlyGenres: [] });
  });
});

describe("fromMealsForm（画面で扱わない値）", () => {
  it("夕食・昼食以外の食事からは、消したジャンルの参照を外す", () => {
    const form = removeGenre(toMealsForm(DATA), "genre-0");

    const data = fromMealsForm(form, {
      ...DATA.meals,
      brunch: { onlyGenres: ["麺類", "パン"], memo: "残す" },
    });

    expect(data.meals.brunch).toEqual({ onlyGenres: ["パン"], memo: "残す" });
  });

  it("onlyGenres と avoidGenres の両方があるときは、avoidGenres も残す", () => {
    const meals = {
      ...DATA.meals,
      lunch: { onlyGenres: ["麺類"], avoidGenres: ["パン"] },
    };
    const form = toMealsForm({ genres: DATA.genres, meals });

    expect(form.meals[1].mode).toBe("only");
    expect(fromMealsForm(form, meals).meals.lunch).toEqual({
      onlyGenres: ["麺類"],
      avoidGenres: ["パン"],
    });
  });
});

describe("removeGenre", () => {
  it("ジャンルを消すと、食事の条件からも外す", () => {
    const form = removeGenre(toMealsForm(DATA), "genre-0");

    expect(form.genres.map(({ name }) => name)).toEqual(["ご飯もの", "パン"]);
    expect(form.meals[1].genreKeys).toEqual(["genre-2"]);
    expect(fromMealsForm(form, DATA.meals).meals.lunch.onlyGenres).toEqual([
      "パン",
    ]);
  });
});

describe("mealsInvalidReason", () => {
  /** 名前を変えたジャンルの一覧で作ったフォーム */
  const withNames = (names: string[]): MealsForm => ({
    genres: names.map((name, index) => ({
      key: `genre-${index}`,
      name,
      keywords: [],
    })),
    meals: [],
  });

  it("名前が空・重なりのあるジャンルは保存できない", () => {
    expect(mealsInvalidReason(withNames(["麺類", " "]))).toBe(
      "名前が空のジャンルがあります",
    );
    expect(mealsInvalidReason(withNames(["麺類", "麺類 "]))).toBe(
      "名前が重なっているジャンルがあります",
    );
    expect(mealsInvalidReason(withNames(["麺類", "パン"]))).toBeNull();
  });

  it("「選んだジャンルだけ」でジャンルを選んでいない食事があれば保存できない", () => {
    const form = toMealsForm(DATA);
    form.meals[1].genreKeys = [];

    expect(mealsInvalidReason(form)).toBe(
      "昼食の「選んだジャンルだけ」で、見分ける言葉があるジャンルを1つ以上選んでください",
    );
  });

  it("選んだジャンルに見分ける言葉が1つもないときも保存できない", () => {
    const form = toMealsForm(DATA);
    form.genres.push({ key: "new-1", name: "スープ", keywords: [] });
    form.meals[1].genreKeys = ["new-1"];

    expect(mealsInvalidReason(form)).toMatch(/^昼食の/);
  });

  it("いまないジャンルの key は数えない", () => {
    const form = toMealsForm(DATA);
    form.meals[1].genreKeys = ["genre-99"];

    expect(mealsInvalidReason(form)).toMatch(/^昼食の/);
  });
});
