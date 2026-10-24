"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./_styles/_gnav.module.scss";

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "トップ" },
  { href: "/recipes", label: "レシピ一覧" },
  { href: "/settings", label: "設定" },
];

interface NavItem {
  href: string;
  label: string;
}

/**
 * 項目の aria-current。その項目のページなら page、下の階層（/recipes/hidden など）にいるなら true（親の項目を選択中にする）
 * 下の階層で page にすると、読み上げで別のページにいるように伝わってしまう
 */
const currentOf = (
  pathname: string,
  href: string,
): "page" | true | undefined => {
  if (pathname === href) return "page";
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return undefined;
};

const Gnav = () => {
  const pathname = usePathname();

  return (
    <nav aria-label="メインメニュー">
      <ul className={styles.list}>
        {NAV_ITEMS.map(({ href, label }) => (
          <li key={href}>
            <Link
              className={styles.link}
              href={href}
              aria-current={currentOf(pathname, href)}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export { Gnav };
