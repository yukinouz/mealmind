"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./_styles/_settingsMenu.module.scss";

/** 設定のトップ。PC 幅ではチャンネルのページ、スマホ幅ではメニューだけのページになる */
export const SETTINGS_PATH = "/settings";

/** 設定のページの一覧。desc はスマホ幅のメニューに出す説明 */
export const SETTINGS_ITEMS: SettingsItem[] = [
  {
    href: "/settings/channels",
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

interface SettingsItem {
  href: string;
  label: string;
  desc: string;
}

interface SettingsMenuProps {
  // side は左のメニュー、list はスマホ幅の /settings に出すリスト
  variant?: "side" | "list";
}

/** スマホ幅の /settings に出すリスト。項目ごとに説明を添える */
const ListMenu = () => (
  <nav aria-label="設定メニュー">
    <ul className={styles.list}>
      {SETTINGS_ITEMS.map(({ href, label, desc }) => (
        <li className={styles.listItem} key={href}>
          <Link className={styles.listLink} href={href}>
            <span className={styles.listText}>
              <b className={styles.listLabel}>{label}</b>
              <span className={styles.listDesc}>{desc}</span>
            </span>
            <svg
              className={styles.listArrow}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

/** 左のメニュー。いまのページの項目に aria-current="page" を付ける */
const SideMenu = () => {
  const pathname = usePathname();

  return (
    // スマホ幅の /settings はリストのメニューを出すので、左のメニューは隠す
    <nav
      className={clsx(styles.side, pathname === SETTINGS_PATH && styles.pcOnly)}
      aria-label="設定メニュー"
    >
      <ul className={styles.sideList}>
        {SETTINGS_ITEMS.map(({ href, label }) => (
          <li key={href}>
            <Link
              className={styles.sideLink}
              href={href}
              aria-current={isCurrentItem(pathname, href) ? "page" : undefined}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

/** いまのページの項目か。/settings は PC 幅でチャンネルのページを出すので、チャンネルを選択中にする */
const isCurrentItem = (pathname: string, href: string): boolean =>
  pathname === href ||
  (pathname === SETTINGS_PATH && href === SETTINGS_ITEMS[0].href);

/** 設定のメニュー。左のメニュー（side）と、スマホ幅の /settings に出すリスト（list）がある */
const SettingsMenu = ({ variant = "side" }: SettingsMenuProps) =>
  variant === "list" ? <ListMenu /> : <SideMenu />;

export { SettingsMenu };
