import { describe, expect, it } from "vitest";
import {
  clampWeight,
  isTotalWeightValid,
  toSourceId,
  totalWeightMessage,
  videosNote,
} from "./channelSettings";

describe("toSourceId", () => {
  it("ハンドルから @ を外し、英小文字にする", () => {
    expect(toSourceId("@Ryuji825", [])).toBe("ryuji825");
  });

  it("英数字とハイフン以外はハイフンにする", () => {
    expect(toSourceId("@daily_chinese", [])).toBe("daily-chinese");
    expect(toSourceId("@a.b__c", [])).toBe("a-b-c");
  });

  it("何も残らないとき（日本語だけのハンドルなど）は channel にする", () => {
    expect(toSourceId("@だれウマ料理研究家", [])).toBe("channel");
    expect(toSourceId(null, [])).toBe("channel");
  });

  it("すでにある id と重なったら、末尾に数字を付ける", () => {
    expect(toSourceId("@kuma", ["kuma"])).toBe("kuma2");
    expect(toSourceId("@kuma", ["kuma", "kuma2"])).toBe("kuma3");
  });
});

describe("isTotalWeightValid", () => {
  it("合計がちょうど100のときだけ保存できる", () => {
    expect(isTotalWeightValid([60, 40])).toBe(true);
    expect(isTotalWeightValid([60, 30])).toBe(false);
    expect(isTotalWeightValid([60, 50])).toBe(false);
  });

  it("チャンネルが1つもないときは保存できる", () => {
    expect(isTotalWeightValid([])).toBe(true);
  });
});

describe("totalWeightMessage", () => {
  it("合計に応じて、ちょうど・足りない・多すぎるを伝える", () => {
    expect(totalWeightMessage(100)).toBe("ちょうど 100% です");
    expect(totalWeightMessage(90)).toBe("あと 10% 足りません");
    expect(totalWeightMessage(130)).toBe("30% 多すぎます");
  });
});

describe("clampWeight", () => {
  it("0〜100 の整数にする。数でなければ 0", () => {
    expect(clampWeight("33.6")).toBe(34);
    expect(clampWeight("150")).toBe(100);
    expect(clampWeight("-5")).toBe(0);
    expect(clampWeight("abc")).toBe(0);
  });
});

describe("videosNote", () => {
  it("件数と、日本時間での取得日を出す", () => {
    expect(videosNote(1240, "2026-10-19T16:30:00Z")).toBe("1240件(2026/10/20)");
  });
});
