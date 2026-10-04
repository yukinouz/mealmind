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

| ページ     | 内容                                                         |
| ---------- | ------------------------------------------------------------ |
| `/`        | レシピを1件選んで表示する                                    |
| `/recipes` | 「作る」と決めたレシピ（`data/recipes.json`）を一覧表示する |

## 開発用のコマンド

| コマンド         | 内容                               |
| ---------------- | ---------------------------------- |
| `npm run lint`   | Biome で書き方と整形をチェックする |
| `npm run format` | Biome で整形する                   |
| `npm run build`  | 本番用にビルドする                 |

## 構成

- Next.js（App Router）＋ TypeScript
- コードのチェックと整形は Biome
