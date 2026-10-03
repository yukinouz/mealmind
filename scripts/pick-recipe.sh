#!/usr/bin/env bash
# 提案するレシピを1件だけ抽選して JSON で出力する。
#
# 使い方: scripts/pick-recipe.sh [キーワード ...] [--skip 動画IDまたはURL ...]
#   例:   scripts/pick-recipe.sh
#         scripts/pick-recipe.sh 鯖 味噌
#         scripts/pick-recipe.sh 鶏むね --skip abc123 --skip def456
#
# - キーワードが複数あるときは、すべてを含む動画だけが候補になる
# - --skip はこの会話でスキップした動画（何度でも指定できる）
#
# 出力（type で分岐する）:
#   youtube   … 候補の動画（タイトル・URL・概要欄など）
#   kurashiru … クラシルが選ばれた（サイトでの検索は呼び出し側が行う）
#   none      … 条件に合う候補がない
set -euo pipefail

readonly ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
readonly DATA_DIR="$ROOT_DIR/data"
readonly CACHE_DIR="$DATA_DIR/cache"

# 引数をキーワードとスキップ対象に分ける
keywords=()
skips=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip)
      [[ $# -lt 2 ]] && { echo "エラー: --skip の後に動画IDかURLを指定してください" >&2; exit 1; }
      skips+=("$2")
      shift 2
      ;;
    *)
      keywords+=("$1")
      shift
      ;;
  esac
done

# 文字列の配列を JSON 配列に変換する（空でも動くように bash 3.2 向けの書き方をしている）
to_json_array() {
  if [[ $# -eq 0 ]]; then
    echo '[]'
  else
    printf '%s\n' "$@" | jq -R . | jq -s .
  fi
}

# データファイルを読む。ファイルがなければ既定値を返す
read_json() {
  if [[ -f "$1" ]]; then cat "$1"; else echo "$2"; fi
}

# 抽選用の乱数（0以上1未満）をまとめて作る。jq には乱数を作る機能がないため
seed="$(od -An -N4 -tu4 /dev/urandom | tr -d ' ')"
randoms="$(awk -v seed="$seed" 'BEGIN { srand(seed); printf "["; for (i = 0; i < 100; i++) printf "%s%f", (i ? "," : ""), rand(); print "]" }')"

shopt -s nullglob
cache_files=("$CACHE_DIR"/videos-*.json)
shopt -u nullglob

jq -n \
  --argjson sources "$(read_json "$DATA_DIR/sources.json" '{"sources":[]}')" \
  --argjson settings "$(read_json "$DATA_DIR/settings.json" '{}')" \
  --argjson prefs "$(read_json "$DATA_DIR/preferences.json" '{}')" \
  --argjson recipes "$(read_json "$DATA_DIR/recipes.json" '{"recipes":[]}')" \
  --argjson excluded "$(read_json "$DATA_DIR/excluded.json" '{"excluded":[]}')" \
  --argjson keywords "$(to_json_array ${keywords[@]+"${keywords[@]}"})" \
  --argjson skips "$(to_json_array ${skips[@]+"${skips[@]}"})" \
  --argjson randoms "$randoms" \
  '
  # 分量を表す言葉。概要欄に3つ以上あればレシピ動画とみなす
  def amount_pattern:
    "大さじ|小さじ|適量|少々|ひとつまみ|[0-9０-９./]+\\s*(g|ｇ|ml|ｍｌ|cc|ｃｃ|個|本|枚|片|かけ|パック|株|束|合)";

  # ショート動画は最長3分。長尺動画の切り抜きなので候補から外す
  def short_max_seconds: 180;

  def video_url: "https://www.youtube.com/watch?v=" + .;

  # 重み .w に従って1件選ぶ（$r は 0以上1未満の乱数）
  def pick_weighted($items; $r):
    ($items | map(.w) | add) as $total
    | reduce $items[] as $item ({acc: 0, chosen: null};
        if .chosen != null then .
        else .acc += $item.w | if .acc > $r * $total then .chosen = $item else . end
        end)
    | .chosen // $items[-1];

  ($settings.chosenRecipeWeight // 0.2) as $chosenWeight
  | ($settings.favoriteRecipeWeight // 0.5) as $favoriteWeight
  | ((now - ($settings.resuggestAfterDays // 14) * 86400) | strflocaltime("%Y-%m-%d")) as $recentSince
  | (($prefs.avoidIngredients // []) + ($prefs.avoidSeasonings // [])) as $avoids
  | ($recipes.recipes | map({key: .url, value: .}) | from_entries) as $recipeByUrl
  | ($excluded.excluded | map({key: .url, value: true}) | from_entries) as $isExcluded
  | ($skips | map(if startswith("http") then . else video_url end)) as $skipUrls
  | ([inputs] | map({key: .sourceId, value: .videos}) | from_entries) as $videosBySource

  # チャンネル内の候補を、動画ごとの重み付きで返す
  | def candidates($source):
      ($videosBySource[$source.id] // [])
      | map(
          (.title + "\n" + .description) as $text
          | (.videoId | video_url) as $url
          | $recipeByUrl[$url] as $recipe
          | select(([.description | scan(amount_pattern)] | length) >= 3)
          | select((.durationSeconds // (short_max_seconds + 1)) > short_max_seconds)
          | select(all($keywords[]; . as $k | $text | contains($k)))
          | select(any($avoids[]; . as $a | $text | contains($a)) | not)
          | select($isExcluded[$url] | not)
          | select($skipUrls | index($url) | not)
          | select($recipe == null or ([$recipe.chosenDates[]? | select(. >= $recentSince)] | length) == 0)
          | . + {
              url: $url,
              status: (if $recipe == null then "new" elif $recipe.isFavorite then "favorite" else "chosen" end),
              w: (if $recipe == null then 1 elif $recipe.isFavorite then $favoriteWeight else $chosenWeight end)
            }
        )
      | map(select(.w > 0));

    # チャンネルを抽選し、候補がなければそのチャンネルを外して抽選し直す
    def try_sources($remaining; $i):
      if ($remaining | length) == 0 then {type: "none"}
      else
        pick_weighted($remaining; $randoms[$i]) as $source
        | if $source.type == "kurashiru" then
            {type: "kurashiru", sourceId: $source.id, channelName: $source.name, siteUrl: $source.url, keywords: $keywords}
          else
            candidates($source) as $cands
            | if ($cands | length) == 0 then try_sources($remaining - [$source]; $i + 2)
              else
                pick_weighted($cands; $randoms[$i + 1]) as $video
                | {
                    type: "youtube",
                    sourceId: $source.id,
                    channelName: $source.name,
                    title: $video.title,
                    url: $video.url,
                    videoId: $video.videoId,
                    publishedAt: $video.publishedAt,
                    status: $video.status,
                    candidateCount: ($cands | length),
                    description: $video.description
                  }
              end
          end
      end;

    try_sources($sources.sources | map(select(.isEnabled != false) | . + {w: .weight}); 0)
  ' ${cache_files[@]+"${cache_files[@]}"} </dev/null
