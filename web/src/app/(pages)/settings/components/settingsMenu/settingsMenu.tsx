"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isCurrentSettingsItem,
  SETTINGS_ITEMS,
  SETTINGS_PATH,
} from "@/utils/settingsMenu";
import styles from "./_styles/_settingsMenu.module.scss";

/** 設定の左のメニュー。いまのページの項目に aria-current="page" を付ける */
const SettingsMenu = () => {
  const pathname = usePathname();

  return (
    // スマホ幅の /settings はリストのメニューを出すので、左のメニューは隠す
    <nav
      className={clsx(styles.side, pathname === SETTINGS_PATH && styles.pcOnly)}
      aria-label="設定メニュー"
    >
      <ul className={styles.sideList}>
        {SETTINGS_ITEMS.map(({ href, label }) => {
          const isCurrent = isCurrentSettingsItem(pathname, href);
          return (
            <li key={href}>
              {/* 選択中の項目は、いまのページへのリンクにする。/settings で「チャンネル」を押しても、別のページへ移って編集中の値が消えないようにするため */}
              <Link
                className={styles.sideLink}
                href={isCurrent ? pathname : href}
                aria-current={isCurrent ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export { SettingsMenu };
