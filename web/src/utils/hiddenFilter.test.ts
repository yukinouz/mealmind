import { describe, expect, it } from "vitest";
import { parseHiddenFilter } from "./hiddenFilter";
import { DEFAULT_FILTER } from "./recipeFilter";

describe("parseHiddenFilter", () => {
  it("並び順・検索・ページだけを読み、ほかは既定のままにする", () => {
    const filter = parseHiddenFilter({
      order: "oldest",
      q: "鯖",
      page: "2",
      meal: "lunch",
      cuisine: "washoku",
      channel: "chef-a",
      fav: "1",
      view: "list",
    });
    expect(filter).toEqual({
      ...DEFAULT_FILTER,
      order: "oldest",
      query: "鯖",
      page: 2,
    });
  });
});
