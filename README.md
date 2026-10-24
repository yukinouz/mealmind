# mealmind

事前に登録した YouTube チャンネルから、レシピを提案してもらう個人開発の Web アプリです。ローカルで動かします。Claude Code のスキル（`/suggest`）から、対話で使うこともできます。

## できること

- 使いたい食材や料理名と食事（夜ごはん・昼ごはん）を指定すると、レシピ動画を最大5件提案する
- 提案ごとに「作る / 作らない / スキップ」を選んで記録する
- 「作る」と決めたレシピを一覧で見る。食事・ジャンル・チャンネル・お気に入りで絞り込み、検索できる
- レシピの材料・メイン食材（最大3つ）・料理の系統を、概要欄から書き出す
- 一覧から外したレシピや「作らない」を選んだレシピを、あとから作るレシピに戻す
- 設定画面で、提案元のチャンネル（追加・削除・割合）、提案のしかた、好み、食事ごとのジャンルを変える

各ページの詳しい説明は [web/README.md](web/README.md) にあります。

## 必要なもの

- macOS（標準の `bash`、`jq`、`awk`、`od` を使います。追加のインストールは不要です）
- Node.js 24
- Claude Code（`claude` コマンドにログイン済み。材料などの書き出しとスキルに使う）
- YouTube Data API v3 の API キー

## セットアップ

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作り、**YouTube Data API v3** を有効にする
2. 「認証情報」で API キーを作る
   - アプリケーションの制限：**なし**
   - API の制限：**YouTube Data API v3 のみ**
3. `.env.example` をコピーして `.env` を作り、キーを設定する

   ```sh
   cp .env.example .env
   # .env を開いて YOUTUBE_API_KEY= の後にキーを書く
   ```

4. 個人データを置く非公開リポジトリ（`mealmind-data`）を `mealmind` と同じ階層に用意し、`data/personal` からリンクする

   ```sh
   git clone <mealmind-data の URL> ../mealmind-data   # 初めてなら空のリポジトリを作って clone する
   ln -s ../../mealmind-data data/personal
   ```

5. 初めてなら、記入例をコピーして提案元（チャンネル）と好み・抽選の設定をする

   ```sh
   cp data/sources.example.json data/personal/sources.json
   cp data/preferences.example.json data/personal/preferences.json   # 好みを設定しないなら不要
   cp data/settings.example.json data/personal/settings.json         # 既定値のままなら不要
   ```

6. 動画一覧を取得する（後述）
7. Web アプリに必要なライブラリを入れる

   ```sh
   cd web && npm install
   ```

API の利用は無料です。1日あたりの上限（10,000単位）があり、全チャンネルの一覧と動画の長さの取得で約280単位を使います。

## 使い方

### Web アプリで使う

```sh
cd web
npm run dev     # 個人データを同期してから起動する
```

http://localhost:3000 を開きます。

### Claude Code のスキルで使う

Claude Code で `/suggest` と入力するか、「今日何作ろう」「鶏ももで何か作りたい」のように話しかけます。Web アプリと同じデータを読み書きします。

Web アプリとの違いは次のとおりです。

- レシピを1件ずつ対話で提案する（Web は最大5件をまとめて表示する）
- 「作る / 作らない」を選んだときに、材料とメイン食材をその場で記録する（Web はレシピを見せるページを開いたときに埋める）
- 「今回はスキップ」は、その会話の中だけ有効
- お気に入りの切り替えと、レシピの整理（削除・戻す）は Web アプリだけでできる

提案の流れは [.claude/skills/suggest/SKILL.md](.claude/skills/suggest/SKILL.md) にあります。

### 動画一覧を取得する

```sh
scripts/fetch-videos.sh ryuji   # sources.json の id を指定する
```

`data/cache/videos-<id>.json` に保存されます。新しい動画を反映したいときに、もう一度実行してください（目安は週1回）。設定画面のチャンネルのページの「更新」「すべて更新」からも実行できます。

## データファイル

個人データは `data/personal/`（`mealmind-data` リポジトリへのリンク）に、それ以外は `data/` にあります。

| ファイル                    | 内容                                                                     | git                    |
| --------------------------- | ------------------------------------------------------------------------ | ---------------------- |
| `personal/sources.json`     | 提案元の YouTube チャンネルと重み・画面に出す短い名前（`shortName`）     | `mealmind-data` に記録 |
| `personal/settings.json`    | 抽選の設定（「作る」を選んだレシピ・お気に入りの重み、再提案しない日数） | `mealmind-data` に記録 |
| `personal/preferences.json` | 使わない食材・使わない調味料・常備している食材・食事ごとのジャンル       | `mealmind-data` に記録 |
| `personal/preferences.md`   | 好みの自由なメモ                                                         | `mealmind-data` に記録 |
| `personal/recipes.json`     | 「作る」と決めたレシピ                                                   | `mealmind-data` に記録 |
| `personal/excluded.json`    | 提案されないレシピ（「作らない」と決めたもの・作るレシピから外したもの） | `mealmind-data` に記録 |
| `cache/`                    | 動画一覧のキャッシュ（再取得できる）                                     | 記録しない             |

`excluded.json` の1件は `recipes.json` と同じ項目を持ち、外した日時 `excludedAt` と理由 `reason`（`rejected`：提案で「作らない」を選んだ / `hidden`：作るレシピから外した）を加えます。作るレシピに戻せるようにするためです。

`sources.json`・`preferences.json`・`settings.json` には、記入例の `data/*.example.json` があります（記録する）。`sources.json` 以外の個人データのファイルは、なければ空として扱われます（`settings.json` は既定値）。

`mealmind-data` は、`npm run dev`（`web/`）の直前に `scripts/sync-personal-data.sh` が GitHub と同期します（変更をコミット → 取り込み → 送信）。失敗しても警告だけで、Web は起動します。

### 書き方の決まり

データを長く使い続けられるよう、次の形にそろえます。

- 決まった形のデータは JSON、自由なメモは Markdown にする
- すべての JSON に `"schemaVersion": 1` を入れる（形を変えたときに古いデータと見分けるため）
- レシピは URL で見分ける。YouTube は `https://www.youtube.com/watch?v=<動画ID>` の形にそろえる
- 日付は `2026-10-03`、日時は ISO 8601（例：`2026-10-03T19:00:00+09:00`）
- 真偽値の項目名は `isFavorite` のように `is` で始める

### 重みの考え方

- **チャンネル**：`sources.json` の `weight` の比率で選ばれます。データも設定画面も、合計を100にそろえます（設定画面では `weight` をそのまま % として見せます）
- **動画**：まだ「作る」を選んでいない動画 `1`、選んだことがある動画 `0.2`、お気に入り `0.5`（どちらも `settings.json` で変えられる既定値）
- 最近（既定は14日以内）「作る」を選んだ動画、「作らない」とした動画、使わない食材・調味料を含む動画は選ばれません
- 食事ごとのジャンルの条件に合わない動画も選ばれません（下記）
- 3分以下の動画（ショート動画）と、概要欄に分量の表記（`大さじ`、`200g` など）が3つ未満の動画は、レシピ動画ではないとみなして選ばれません

### 使わない食材の登録について

キーワードと除外は、文字列がそのまま含まれるかで判定します。表記の揺れがありそうなものは、両方とも登録してください。

```json
"avoidIngredients": ["にんにく", "ニンニク"]
```

### 常備している食材の登録について

`pantryIngredients` に登録した食材は、レシピのメイン食材に入りません。メイン食材は、買い物で用意が必要な食材の目安にもなるためです。

```json
"pantryIngredients": ["にんにく", "しょうが", "小ねぎ"]
```

- 常備していても、メイン食材として出てきてほしいものは、あえて登録しません（例：長ねぎを常備していても、買い忘れると致命的なので敢えて外すなど）
- メイン食材は Claude が判断して選ぶので、表記の揺れ（生姜 / しょうが）は片方だけ登録すれば足ります
- 登録を変えても、すでに記録したレシピのメイン食材は変わりません

### ジャンルの登録について

ジャンルごとに言葉を登録し、食事ごとに「そのジャンルだけ」か「そのジャンルを外す」かを決めます。判定はタイトルだけで行います。概要欄の宣伝文やハッシュタグで、関係ない動画まで外れるのを防ぐためです。

```json
"avoidTitleKeywords": ["ケーキ", "プリン"],
"genres": {
  "麺類": ["パスタ", "麺", "そば"],
  "パン": ["食パン", "トースト"]
},
"meals": {
  "lunch":  { "onlyGenres":  ["麺類", "パン"] },
  "dinner": { "avoidGenres": ["麺類", "パン"], "avoidTitleKeywords": [] }
}
```

- `genres` のキーはジャンルの名前です。`meals` からはこの名前で指定します
- `onlyGenres`：そのジャンルの言葉をどれか含む動画だけが候補になります
- `avoidGenres` と食事ごとの `avoidTitleKeywords`：その食事のときだけ外します。一番外側の `avoidTitleKeywords` はいつでも外します
- 食事は `--meal` で選び、省略すると `dinner` です
- 「パン」のように短い言葉は「フライパン」などにも一致するので、「食パン」「トースト」のように具体的に書きます

## 抽選のスクリプト

Web アプリとスキルは、どちらも `scripts/pick-recipe.sh` でレシピを選びます。単体でも実行できます。

```sh
scripts/pick-recipe.sh                  # キーワードなし
scripts/pick-recipe.sh 鯖 味噌          # すべてのキーワードを含む動画から選ぶ
scripts/pick-recipe.sh --meal lunch     # 昼ごはんとして選ぶ（省略時は夜ごはん）
scripts/pick-recipe.sh 鶏むね --skip <動画IDまたはURL>   # スキップした動画を除く
scripts/pick-recipe.sh 豚バラ --count 5           # 重ならないように最大5件選ぶ（Web アプリが使う）
```

結果は JSON で出力され、`type` は次のどれかです。

| type      | 意味                                    |
| --------- | --------------------------------------- |
| `youtube` | 候補の動画（タイトル・URL・概要欄など） |
| `none`    | 条件に合う候補がない                    |

`--count` を付けたときは、`youtube` の結果の配列を出力します。候補が足りなければ件数が減り、1件もなければ空の配列（`[]`）です。

## 依存の更新

npm パッケージ・GitHub Actions・Node.js（`.node-version`）の更新は、Renovate が PR を作ります。設定は [renovate.json](renovate.json) にあります。パッチ更新の PR は、CI が通れば自動でマージされます（セキュリティの修正は除く）。それ以外の PR は手でマージします。

- 公開から3日たったバージョンだけを取り込みます（セキュリティの修正は待たずに PR になります）
- `@types/node` のメジャー更新は、Dependency Dashboard（Renovate が作る Issue）でチェックを入れると PR になります。Node.js の LTS への PR が来たら、合わせて上げます

## ディレクトリ構成

```
.
├── .claude/hooks/    # Claude Code のフック（自動整形）
├── .claude/skills/   # Claude Code のスキル
├── data/             # 設定と記録（上記）
├── docs/adr/         # 設計上の決定の記録
├── prompts/          # スキルと Web が Claude に渡す決まり（材料とメイン食材の書き方）
├── scripts/          # 動画一覧の取得・チャンネルの検索・レシピの抽選・個人データの同期
└── web/              # ローカルで動かす Web アプリ
```

## ライセンス

[MIT](LICENSE)
