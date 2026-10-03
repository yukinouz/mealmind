#!/usr/bin/env bash
# YouTube チャンネルの動画一覧を取得して data/cache/videos-<sourceId>.json に保存する。
#
# 使い方: scripts/fetch-videos.sh <sourceId>
#   例:   scripts/fetch-videos.sh ryuji
#
# - sourceId は data/sources.json の id（type が youtube のもの）
# - APIキーは環境変数 YOUTUBE_API_KEY から読む。未設定なら .env から読み込む
# - APIキーは URL ではなくヘッダーで渡し、画面には一切出さない
# - ショート動画を見分けるため、動画ごとの長さ（秒）も取得する
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
readonly ROOT_DIR
readonly SOURCES_FILE="$ROOT_DIR/data/sources.json"
readonly CACHE_DIR="$ROOT_DIR/data/cache"
readonly PLAYLIST_API_URL="https://www.googleapis.com/youtube/v3/playlistItems"
readonly VIDEOS_API_URL="https://www.googleapis.com/youtube/v3/videos"

# エラーを表示して終了する
fail() {
  echo "エラー: $1" >&2
  exit 1
}

source_id="${1:-}"
[[ -z "$source_id" ]] && fail "sourceId を指定してください（例: $0 ryuji）"

# APIキーを準備する（環境変数を優先し、なければ .env を読み込む）
if [[ -z "${YOUTUBE_API_KEY:-}" && -f "$ROOT_DIR/.env" ]]; then
  set -a
  . "$ROOT_DIR/.env"
  set +a
fi
[[ -z "${YOUTUBE_API_KEY:-}" ]] && fail "YOUTUBE_API_KEY が設定されていません"

# sources.json からチャンネルIDを探す
channel_id="$(jq -r --arg id "$source_id" \
  '.sources[] | select(.id == $id and .type == "youtube") | .channelId' "$SOURCES_FILE")"
[[ -z "$channel_id" ]] && fail "YouTube の提案元 '$source_id' が data/sources.json に見つかりません"

# API を呼び出して結果をファイルに保存する。エラーなら終了する
# 使い方: call_api <URL> <保存先> <説明> [curl の引数 ...]
call_api() {
  local url="$1" out_file="$2" label="$3"
  shift 3
  curl -sS -G "$url" -H "X-Goog-Api-Key: $YOUTUBE_API_KEY" "$@" >"$out_file" \
    || fail "通信に失敗しました（${label}）"

  local api_error
  api_error="$(jq -r '.error.message // empty' "$out_file")"
  [[ -n "$api_error" ]] && fail "API エラー（${label}）: $api_error"
  return 0
}

# アップロード動画一覧のIDは、チャンネルIDの先頭 UC を UU に置き換えたもの
readonly playlist_id="UU${channel_id#UC}"

# 取得途中のページは一時フォルダに置き、終了時に片付ける
tmp_dir="$(mktemp -d)"
trap 'rm -r "$tmp_dir"' EXIT

page_token=""
page_count=0
while :; do
  page_count=$((page_count + 1))
  page_file="$tmp_dir/page-$(printf '%04d' "$page_count").json"

  params=(--data-urlencode "part=snippet" --data-urlencode "maxResults=50" --data-urlencode "playlistId=$playlist_id")
  [[ -n "$page_token" ]] && params+=(--data-urlencode "pageToken=$page_token")

  call_api "$PLAYLIST_API_URL" "$page_file" "動画一覧 ${page_count}ページ目" "${params[@]}"

  page_token="$(jq -r '.nextPageToken // empty' "$page_file")"
  [[ -z "$page_token" ]] && break
done

# 動画の長さを、50本ずつまとめて取得する
detail_count=0
while IFS= read -r ids; do
  detail_count=$((detail_count + 1))
  call_api "$VIDEOS_API_URL" "$tmp_dir/detail-$(printf '%04d' "$detail_count").json" "動画の長さ ${detail_count}回目" \
    --data-urlencode "part=contentDetails" --data-urlencode "id=$ids"
done < <(jq -rs '[.[].items[].snippet.resourceId.videoId] | _nwise(50) | join(",")' "$tmp_dir"/page-*.json)

# 全ページをまとめ、非公開・削除済みの動画を除いて保存する
mkdir -p "$CACHE_DIR"
output_file="$CACHE_DIR/videos-$source_id.json"
jq -n \
  --slurpfile pages <(cat "$tmp_dir"/page-*.json) \
  --slurpfile details <(cat "$tmp_dir"/detail-*.json) \
  --arg sourceId "$source_id" \
  --arg channelId "$channel_id" \
  --arg fetchedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '
  # ISO 8601 の長さ（例: PT1H2M3S）を秒に変換する
  def to_seconds:
    capture("^P(?:(?<d>[0-9]+)D)?T?(?:(?<h>[0-9]+)H)?(?:(?<m>[0-9]+)M)?(?:(?<s>[0-9]+)S)?$")
    | ((.d // "0" | tonumber) * 86400) + ((.h // "0" | tonumber) * 3600)
      + ((.m // "0" | tonumber) * 60) + (.s // "0" | tonumber);

  ([$details[].items[] | {key: .id, value: (.contentDetails.duration | to_seconds)}] | from_entries) as $secondsById
  | {
    schemaVersion: 1,
    sourceId: $sourceId,
    channelId: $channelId,
    fetchedAt: $fetchedAt,
    videos: [
      $pages[].items[].snippet
      | select(.title != "Private video" and .title != "Deleted video")
      | {
          videoId: .resourceId.videoId,
          title: .title,
          publishedAt: .publishedAt,
          durationSeconds: $secondsById[.resourceId.videoId],
          description: .description
        }
    ]
  }' >"$output_file.tmp"
mv "$output_file.tmp" "$output_file"

video_count="$(jq '.videos | length' "$output_file")"
echo "保存しました: ${output_file#"$ROOT_DIR"/}（${video_count}本、API $((page_count + detail_count))回）"
