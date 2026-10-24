/** 設定のトップ。PC 幅ではチャンネルのページ、スマホ幅ではメニューだけのページになる */
export const SETTINGS_PATH = "/settings";

/** PC 幅の /settings で出すページ（チャンネル）。メニューではこの項目を選択中にする */
export const SETTINGS_TOP_ITEM_HREF = "/settings/channels";

/** 設定のページ。desc はスマホ幅のメニューに出す説明 */
export interface SettingsItem {
  href: string;
  label: string;
  desc: string;
}

/** 設定のページの一覧（メニューに並べる順） */
export const SETTINGS_ITEMS: SettingsItem[] = [
  {
    href: SETTINGS_TOP_ITEM_HREF,
    label: "チャンネル",
    desc: "提案に使うチャンネルと割合",
  },
  {
    href: "/settings/suggest",
    label: "提案のしかた",
    desc: "作ったレシピの出やすさ・もう一度提案するまでの日数",
  },
  {
    href: "/settings/preferences",
    label: "好み",
    desc: "使わない食材・常備している食材など",
  },
  {
    href: "/settings/meals",
    label: "食事とジャンル",
    desc: "昼食・夕食ごとに提案するジャンル",
  },
];

/** いまのページの項目か。/settings は PC 幅でチャンネルのページを出すので、チャンネルを選択中にする */
export const isCurrentSettingsItem = (
  pathname: string,
  href: string,
): boolean =>
  pathname === href ||
  (pathname === SETTINGS_PATH && href === SETTINGS_TOP_ITEM_HREF);
