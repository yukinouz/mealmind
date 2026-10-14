import { describe, expect, it } from "vitest";
import { truncate } from "./truncate";

describe("truncate", () => {
  it("上限以下ならそのまま返す", () => {
    expect(truncate("鯖の味噌煮", 5)).toBe("鯖の味噌煮");
  });

  it("上限を超えたら先頭だけ残して ... を付ける", () => {
    expect(truncate("鯖の味噌煮定食", 5)).toBe("鯖の味噌煮...");
  });

  it("絵文字のような2文字分のコードも1文字として数える", () => {
    expect(truncate("🍣🍣🍣", 2)).toBe("🍣🍣...");
  });

  it("上限を省略すると32文字で切る", () => {
    const text = "あ".repeat(33);
    expect(truncate(text)).toBe(`${"あ".repeat(32)}...`);
  });
});
