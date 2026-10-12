#!/usr/bin/env bash
# 個人データ（data/personal → mealmind-data リポジトリ）を GitHub と同期する。npm run dev の前に実行される
#
# 1. 手元の変更があればコミットする
# 2. GitHub の変更を取り込む（ほかの端末での変更）
# 3. GitHub に送る
#
# 失敗しても Web の起動は止めないよう、警告を出して終了コード 0 で終わる
set -uo pipefail

readonly ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
readonly PERSONAL_DIR="$ROOT_DIR/data/personal"

warn() {
  echo "警告: 個人データを同期できませんでした（$1）" >&2
  exit 0
}

[[ -d "$PERSONAL_DIR/.git" ]] || warn "data/personal が mealmind-data のリポジトリではありません"

git_personal() {
  git -C "$PERSONAL_DIR" "$@"
}

if [[ -n "$(git_personal status --porcelain)" ]]; then
  git_personal add -A
  git_personal commit --quiet -m "chore: 自動保存 $(date '+%Y-%m-%d %H:%M')" || warn "コミットに失敗"
fi

if ! git_personal pull --rebase --quiet; then
  # 取り込みの途中で止まった（同じレシピを別の端末でも変えていたときなど）なら、元の状態に戻しておく
  if [[ -d "$PERSONAL_DIR/.git/rebase-merge" || -d "$PERSONAL_DIR/.git/rebase-apply" ]]; then
    git_personal rebase --abort
    warn "GitHub の変更と競合しました。data/personal で git pull --rebase を実行して直してください"
  fi
  warn "GitHub から取り込めませんでした。ネットにつながっているか確認してください"
fi

git_personal push --quiet || warn "GitHub に送れませんでした。次の起動時にもう一度送ります"
echo "個人データを GitHub と同期しました"
