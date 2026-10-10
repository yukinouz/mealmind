---
name: suggest
description: "登録した YouTube 料理チャンネルとクラシルから、今日作るレシピを1件ずつ提案する。ユーザーが「レシピを提案して」「今日何作ろう」「◯◯を使った料理」などと言ったときに使う。"
---

# レシピ提案

レシピを1件ずつ提案し、ユーザーの返事に応じて記録します。会話は日本語で行います。

ユーザーへの質問は文章で行い、ダイアログ（AskUserQuestion）は使いません。ダイアログはリンクにならずコピーもできないうえ、直前の文章を隠すためです。

## 1. キーワードを聞く

使いたい食材や料理名を、文章で聞きます。ユーザーの最初の発言にすでに含まれていれば、聞かずに2へ進みます。

```
使いたい食材や料理名はありますか？（空白で区切ると複数指定できます。0 でおまかせ）
```

- 返事は空白で区切ってキーワードにします。「0」か「おまかせ」ならキーワードなしで抽選します
- 複数のキーワードは、すべてを含むレシピだけが候補になります
- 食事は夜ごはん（`dinner`）として扱います。ユーザーが「昼ごはん」などと言ったときだけ、`data/preferences.json` の `meals` から該当する食事を使います（質問は増やしません）
- 表記の揺れ（例：鯖 / サバ）で候補がないときは、別の表記で試してよいか提案します

## 2. 1件抽選する

```sh
scripts/pick-recipe.sh [キーワード ...] [--meal 食事] [--skip 動画IDまたはURL ...]
```

- `--meal` は夜ごはんなら省略し、それ以外のときに渡します

- `--skip` には、この会話で「今回はスキップ」された動画をすべて渡します
- 出力 JSON の `type` で分岐します

| type | 対応 |
|---|---|
| `youtube` | 3へ進む |
| `kurashiru` | 「クラシルの場合」へ進む |
| `none` | 候補がないことを伝え、キーワードを変えるか聞く |

### クラシルの場合

1. WebFetch で検索結果を取得し、レシピを数件（タイトルと `/recipes/<id>` の URL）得る
   - キーワードあり：`https://www.kurashiru.com/search?query=<キーワード>`
   - キーワードなし：出力の `onlyTitleKeywords` から乱数で1つ選んで検索する（例：「チャーハン」）。どちらもないときはスクリプトがクラシルを選ばない
2. 次のレシピを除き、残りから乱数で1件選ぶ（例：`echo $(( $(od -An -N2 -tu2 /dev/urandom) % <件数> + 1 ))`）
   - `data/excluded.json` にある URL、この会話でスキップした URL
   - タイトルに、出力の `avoidTitleKeywords` のどれかを含むもの
   - `onlyTitleKeywords` が空でないときは、タイトルにそのどれも含まないもの
   - `data/recipes.json` で、`data/settings.json` の `resuggestAfterDays` 日以内に「作る」を選んだもの
3. レシピページを WebFetch で開き、材料を取得する
4. 材料に `avoidIngredients` / `avoidSeasonings` が含まれていたら、別のレシピを選ぶ
5. 候補が残らなければ、`pick-recipe.sh` をもう一度実行する

## 3. 提案する

次の形で1件だけ示します。

```
【<チャンネル名>】[<タイトル>](<URL>)
（以前に「作る」を選んだことあり / お気に入り のときはその旨）

材料
- <材料名>：<分量>

1. これを作る　2. これは作らない　3. 今回はスキップ
```

- YouTube の材料は、出力の `description` から書き出します。分量はそのまま写し、推測で補いません
- 材料が複数の料理に分かれているときは、見出しごとにまとめます

- タイトルは URL へのリンクにします
- 最後の3択に、番号か言葉で返事をもらいます

## 4. 返事に応じて記録する

| 返事 | 対応 |
|---|---|
| これを作る | `data/recipes.json` に記録して終了 |
| これは作らない | `data/excluded.json` に記録し、2へ戻る |
| 今回はスキップ | 記録せず、`--skip` に加えて2へ戻る |

- ファイルがなければ、`{"schemaVersion": 1, "recipes": []}`（または `"excluded": []`）として作ります
- 日付は `YYYY-MM-DD`、日時は ISO 8601（例：`2026-10-03T19:00:00+09:00`）で書きます
- 書き込みは jq で一時ファイルに出力してから置き換え、JSON が壊れないようにします

### recipes.json

同じ `url` がすでにあれば、`chosenDates`（「作る」を選んだ日）に今日の日付を足し、`meals` になければ今回の食事を足します。なければ次を追加します。

```json
{
  "id": "<YouTube は動画ID、クラシルは /recipes/ の後ろのID>",
  "title": "<タイトル>",
  "url": "<URL>",
  "sourceId": "<sources.json の id>",
  "channel": "<チャンネル名>",
  "ingredients": [{ "name": "鶏むね肉", "amount": "200g" }],
  "mainIngredients": ["鶏むね肉"],
  "meals": ["<今回の食事。dinner / lunch など>"],
  "registeredAt": "<日時>",
  "chosenDates": ["<今日の日付>"],
  "isFavorite": false
}
```

- `mainIngredients`：料理の中心になる食材を最大3つ。材料の並び順ではなく、料理名と作り方から選ぶ
  - 入れない：調味料・油・水・だし・仕上げやお好みのもの・付け合わせの別の料理の材料・ご飯・`data/preferences.json` の `pantryIngredients`（常備している食材）
  - 薬味は、常備していなければ少しだけ使うときも入れる
  - 3つを超えるときは、料理の中心になる食材（肉・魚・主な野菜・麺など）を先に選び、薬味を後にする
  - 麺（うどん・中華麺・パスタなど）とパンは入れる
  - 名前は部位まで分け、切り方・銘柄・注記は外す（例：豚バラ薄切り肉 → 豚バラ、冷凍うどん → うどん）
  - `recipes.json` にすでにある名前と同じ食材なら、その名前を使う

### excluded.json

`recipes.json` と同じ項目に、`excludedAt` と `reason` を足して記録します。あとで「作るレシピ」に戻せるようにするためです。

```json
{
  "id": "<YouTube は動画ID、クラシルは /recipes/ の後ろのID>",
  "title": "<タイトル>",
  "url": "<URL>",
  "sourceId": "<sources.json の id>",
  "channel": "<チャンネル名>",
  "ingredients": [{ "name": "鶏むね肉", "amount": "200g" }],
  "mainIngredients": ["鶏むね肉"],
  "meals": ["<今回の食事>"],
  "chosenDates": [],
  "isFavorite": false,
  "excludedAt": "<日時>",
  "reason": "rejected"
}
```

- `ingredients`・`mainIngredients` は、提案のときに示した材料から、`recipes.json` と同じ決まりで書きます
- `reason`：`rejected`（提案で「作らない」を選んだ）か `hidden`（作るレシピから外した）。このスキルが書くのは `rejected` だけです

## 注意

- `.env` は読みません。API キーが必要な処理はスクリプトに任せます
- 動画一覧が古いと感じたら、`scripts/fetch-videos.sh <id>` での更新を提案します（実行はユーザーの了承を得てから）
