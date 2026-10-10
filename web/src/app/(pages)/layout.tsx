import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";

import "@/_styles/_reset.scss";
import "@/_styles/_base.scss";
import { Header } from "./components/header/header";

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

// ページで description を決めなかったときは、この説明文が引き継がれる
const DEFAULT_DESCRIPTION =
  "毎週の献立づくりに、疲れていませんか？MealMind は、お気に入りの料理動画やレシピサイトからレシピを提案し、献立を決める手間を軽くします。";

export const metadata: Metadata = {
  title: {
    // トップのタイトル。下の階層のページは「ページ名 | MealMind」になる
    default: "MealMind | 献立、おまかせ。レシピ提案アプリ",
    template: "%s | MealMind",
  },
  description: DEFAULT_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={notoSansJP.className}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
