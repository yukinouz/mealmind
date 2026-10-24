import { describe, expect, it } from "vitest";
import { isCurrentSettingsItem, SETTINGS_ITEMS } from "./settingsMenu";

/** そのパスで選択中になる項目の名前 */
const currentLabels = (pathname: string): string[] =>
  SETTINGS_ITEMS.filter(({ href }) =>
    isCurrentSettingsItem(pathname, href),
  ).map(({ label }) => label);

describe("isCurrentSettingsItem", () => {
  it("/settings では、チャンネルだけを選択中にする", () => {
    expect(currentLabels("/settings")).toEqual(["チャンネル"]);
  });

  it("各ページでは、そのページの項目だけを選択中にする", () => {
    expect(currentLabels("/settings/channels")).toEqual(["チャンネル"]);
    expect(currentLabels("/settings/meals")).toEqual(["食事とジャンル"]);
  });

  it("設定の外では、どれも選択中にしない", () => {
    expect(currentLabels("/recipes")).toEqual([]);
  });
});
