import { Inner } from "@/app/(pages)/components/inner/inner";
import { PageHeader } from "@/app/(pages)/components/pageHeader/pageHeader";
import { Section } from "@/app/(pages)/components/section/section";
import styles from "./_styles/_layout.module.scss";
import { SettingsMenu } from "./components/settingsMenu/settingsMenu";

/** 設定のレイアウト。見出し「設定」と左のメニューを置き、右に各ページを出す（ページの間はリンクで移る） */
export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <main>
      <Section top bottom>
        <Inner>
          <PageHeader title="設定" />
          <div className={styles.body}>
            <SettingsMenu />
            <div className={styles.content}>{children}</div>
          </div>
        </Inner>
      </Section>
    </main>
  );
}
