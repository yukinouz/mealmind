#!/usr/bin/env bash
# YouTube チャンネルの URL かハンドルから、チャンネル ID・名前・ハンドルを調べて JSON で出力する。
#
# 使い方: scripts/lookup-channel.sh <URL またはハンドル>
#   例:   scripts/lookup-channel.sh @ryuji825
#         scripts/lookup-channel.sh https://www.youtube.com/@ryuji825
#         scripts/lookup-channel.sh https://www.youtube.com/channel/UCW01sMEVYQdhcvkrhbxdBpw
#
# 出力:
#   見つかったとき  {"type":"found","channelId":"UC...","name":"...","handle":"@..."}
#   見つからないとき {"type":"none"}
#
# - APIキーは環境変数 YOUTUBE_API_KEY から読む。未設定なら .env から読み込む
# - APIキーは URL ではなくヘッダーで渡し、画面には一切出さない
# - 使う API は channels.list（1回あたり1単位）
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
readonly ROOT_DIR
readonly CHANNELS_API_URL="https://www.googleapis.com/youtube/v3/channels"

# エラーを表示して終了する
fail() {
  echo "エラー: $1" >&2
  exit 1
}

# 見つからなかったことを出力して終了する
not_found() {
  echo '{"type":"none"}'
  exit 0
}

query="${1:-}"
[[ -z "$query" ]] && fail "URL かハンドルを指定してください（例: $0 @ryuji825）"

# URL の %E3%81%A0 のような書き方を、元の文字に戻す（日本語のハンドルのため）
url_decode() {
  local encoded="${1//+/ }"
  printf '%b' "${encoded//%/\\x}"
}

# 入力から「チャンネル ID」か「ハンドル」を取り出す
query="$(url_decode "$query")"
channel_id=""
handle=""
if [[ "$query" =~ /channel/(UC[A-Za-z0-9_-]+) ]]; then
  channel_id="${BASH_REMATCH[1]}"
elif [[ "$query" =~ (@[^/?#[:space:]]+) ]]; then
  handle="${BASH_REMATCH[1]}"
else
  not_found
fi

# APIキーを準備する（環境変数を優先し、なければ .env を読み込む）
if [[ -z "${YOUTUBE_API_KEY:-}" && -f "$ROOT_DIR/.env" ]]; then
  set -a
  . "$ROOT_DIR/.env"
  set +a
fi
[[ -z "${YOUTUBE_API_KEY:-}" ]] && fail "YOUTUBE_API_KEY が設定されていません"

params=(--data-urlencode "part=snippet")
if [[ -n "$channel_id" ]]; then
  params+=(--data-urlencode "id=$channel_id")
else
  params+=(--data-urlencode "forHandle=$handle")
fi

response="$(curl -sS -G "$CHANNELS_API_URL" -H "X-Goog-Api-Key: $YOUTUBE_API_KEY" "${params[@]}")" \
  || fail "通信に失敗しました"

api_error="$(jq -r '.error.message // empty' <<<"$response")"
[[ -n "$api_error" ]] && fail "API エラー: $api_error"

# 見つからないときは items がない
[[ "$(jq '.items // [] | length' <<<"$response")" == "0" ]] && not_found

# customUrl（ハンドル）がないチャンネルもあるので、そのときは入力したハンドルを使う（なければ null）
jq -c --arg handle "$handle" '.items[0] | {
  type: "found",
  channelId: .id,
  name: .snippet.title,
  handle: (.snippet.customUrl // (if $handle == "" then null else $handle end))
}' <<<"$response"
