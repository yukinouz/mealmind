import Image from "next/image";
import Link from "next/link";
import { Inner } from "@/app/(pages)/components/inner/inner";
import { Gnav } from "../gnav/gnav";
import styles from "./_styles/_header.module.scss";

/** サイト共通のヘッダー。左にロゴ（トップへのリンク）、右にメニューを置く。 */
const Header = () => {
  return (
    <header className={styles.header}>
      <Inner variant="header">
        <div className={styles.items}>
          <Link className={styles.logo} href="/">
            <Image
              src="/images/logo/logo.svg"
              alt="MealMind"
              width={157}
              height={36}
              preload
            />
          </Link>
          <Gnav />
        </div>
      </Inner>
    </header>
  );
};

export { Header };
