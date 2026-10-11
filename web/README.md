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

| ページ     | 内容                                                                                                                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`        | 使いたい食材や料理名と、食事（夕食・昼食）を指定して、YouTube のレシピを最大5件選んでカードで表示する。「作る」は `data/recipes.json`、「作らない」は `data/excluded.json` に記録する（材料とメイン食材はまだ書かない） |
| `/recipes` | 「作る」と決めたレシピ（`data/recipes.json`）を、追加が新しい順に一覧表示する。ハートでお気に入りを切り替える                                                                                                           |

## 開発用のコマンド

| コマンド         | 内容                                           |
| ---------------- | ---------------------------------------------- |
| `npm run lint`   | Biome と Prettier で書き方と整形をチェックする |
| `npm run format` | Biome と Prettier で整形する                   |
| `npm run build`  | 本番用にビルドする                             |

## デザイン

画面デザインは Claude のキャンバス「[MealMind 画面デザイン](https://claude.ai/artifact/TXXVw7GYMMacmmEEDJninW)」にあります（非公開）。色・余白などはデザインデータを正とする。

| デザイン（アートボード） | コード                                                 |
| ------------------------ | ------------------------------------------------------ |
| トップ                   | `src/app/(pages)/page.tsx`・`components/recipePicker/` |
| レシピ一覧               | `src/app/(pages)/recipes/page.tsx`                     |
| 部品：レシピカード       | `src/app/(pages)/components/recipeCard/`               |
| ボタンの色候補           | `src/app/(pages)/components/linkButton/`               |
| デザインルール（色など） | `src/_styles/_variables.scss`                          |
| ヘッダー                 | `src/app/(pages)/components/header/`・`gnav/`          |
| 部品：ロゴ               | `public/images/logo/logo.svg`                          |
| 部品：favicon            | `src/app/favicon.ico`・`icon.svg`・`apple-icon.png`    |

## 構成

- Next.js（App Router）＋ TypeScript
- コードのチェックと整形は Biome と Prettier

| フォルダ       | 役割                                                       |
| -------------- | ---------------------------------------------------------- |
| `src/app/`     | ページと部品                                               |
| `src/actions/` | 画面から呼ぶサーバーアクション（中では `src/lib/` を呼ぶ） |
| `src/lib/`     | データの読み書きやスクリプトの実行など、サーバー側の処理   |
| `src/utils/`   | 副作用のない小さな道具                                     |
