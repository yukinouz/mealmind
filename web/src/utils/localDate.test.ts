import { describe, expect, it } from "vitest";
import { toLocalDate, toLocalDateTime } from "./localDate";

// vitest.config.mts で TZ を Asia/Tokyo にしているので、日本時間で確かめる
describe("toLocalDate", () => {
  it("手元の時刻での日付を YYYY-MM-DD で返す", () => {
    expect(toLocalDate(new Date(2026, 0, 5, 12))).toBe("2026-01-05");
  });

  it("UTC ではまだ前日でも、日本時間の日付を返す", () => {
    // UTC の 10/10 16:00 は、日本時間の 10/11 1:00
    expect(toLocalDate(new Date("2026-10-10T16:00:00Z"))).toBe("2026-10-11");
  });
});

describe("toLocalDateTime", () => {
  it("時差付きの ISO 8601 で返す", () => {
    expect(toLocalDateTime(new Date("2026-10-11T10:05:09Z"))).toBe(
      "2026-10-11T19:05:09+09:00",
    );
  });
});
