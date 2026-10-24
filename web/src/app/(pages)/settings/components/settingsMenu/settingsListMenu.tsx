import Link from "next/link";
import { SETTINGS_ITEMS } from "@/utils/settingsMenu";
import styles from "./_styles/_settingsMenu.module.scss";

/** スマホ幅の /settings に出す設定のメニュー。項目ごとに説明を添える */
const SettingsListMenu = () => {
  return (
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
};

export { SettingsListMenu };
