#!/bin/bash
# Claude Code の PostToolUse フック: web/ 配下の編集ファイルを整形する（SCSS は Prettier、それ以外は Biome）

# 標準入力の JSON から編集されたファイルのパスを取り出す
file_path=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')

web_dir="$CLAUDE_PROJECT_DIR/web"

# パスが無い、または web/ 配下でなければ何もしない
[ -z "$file_path" ] && exit 0
case "$file_path" in
  "$web_dir"/*) ;;
  *) exit 0 ;;
esac

# web/ の設定を使うため web/ で実行する
cd "$web_dir" || exit 0

# Biome は SCSS に対応していないため Prettier で整形する
if [[ "$file_path" == *.scss ]]; then
  ./node_modules/.bin/prettier --write --log-level warn "$file_path"
  exit
fi

./node_modules/.bin/biome format --write --no-errors-on-unmatched "$file_path"
