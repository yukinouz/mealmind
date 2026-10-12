"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./_styles/_gnav.module.scss";

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "トップ" },
  { href: "/recipes", label: "レシピ一覧" },
];

interface NavItem {
  href: string;
  label: string;
}

/** いまのページがその項目か。下の階層（/recipes/hidden など）にいるときも、親の項目を選択中にする */
const isCurrent = (pathname: string, href: string): boolean =>
  pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

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
              aria-current={isCurrent(pathname, href) ? "page" : undefined}
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
