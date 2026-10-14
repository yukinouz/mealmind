import { describe, expect, it } from "vitest";
import { thumbnailUrlOf } from "./thumbnailUrl";

describe("thumbnailUrlOf", () => {
  it("YouTube の動画なら、id からサムネイルの URL を組み立てる", () => {
    expect(
      thumbnailUrlOf({
        id: "abc123",
        url: "https://www.youtube.com/watch?v=abc123",
      }),
    ).toBe("https://i.ytimg.com/vi/abc123/mqdefault.jpg");
  });

  it("YouTube 以外なら null", () => {
    expect(
      thumbnailUrlOf({ id: "xyz", url: "https://example.com/recipe/xyz" }),
    ).toBeNull();
  });
});
