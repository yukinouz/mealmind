# mealmind web

mealmind を、ローカルで動かす Web アプリです。

## 必要なもの

- Node.js 24

## 使い方

```sh
npm install     # 初回だけ。必要なライブラリを入れる
npm run dev     # 開発用サーバーを起動する
```

起動したら http://localhost:3000 を開きます。

| ページ     | 内容                                                        |
| ---------- | ----------------------------------------------------------- |
| `/`        | レシピを1件選んで表示する                                   |
| `/recipes` | 「作る」と決めたレシピ（`data/recipes.json`）を一覧表示する |

## 開発用のコマンド

| コマンド         | 内容                                           |
| ---------------- | ---------------------------------------------- |
| `npm run lint`   | Biome と Prettier で書き方と整形をチェックする |
| `npm run format` | Biome と Prettier で整形する                   |
| `npm run build`  | 本番用にビルドする                             |

## デザイン

画面デザインは Claude のキャンバス「[MealMind 画面デザイン](https://claude.ai/artifact/TXXVw7GYMMacmmEEDJninW)」にあります（非公開）。色・余白などはデザインデータを正とする。

| デザイン（アートボード） | コード                                                   |
| ------------------------ | -------------------------------------------------------- |
| トップ                   | `src/app/(pages)/page.tsx`                               |
| レシピ一覧               | `src/app/(pages)/recipes/page.tsx`                       |
| 部品：レシピカード       | `src/app/(pages)/recipes/components/recipes/recipes.tsx` |
| ボタンの色候補           | `src/app/(pages)/components/linkButton/`                 |
| デザインルール（色など） | `src/_styles/_variables.scss`                            |
| ヘッダー                 | `src/app/(pages)/components/header/`・`gnav/`            |
| 部品：ロゴ               | `public/images/logo/logo.svg`                            |
| favicon                  | 未実装                                                   |

## 構成

- Next.js（App Router）＋ TypeScript
- コードのチェックと整形は Biome と Prettier
