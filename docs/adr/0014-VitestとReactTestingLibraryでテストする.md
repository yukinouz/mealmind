# 0014. Vitest と React Testing Library でテストする

- 日付: 2026-10-14
- 状態: 採用

## 背景

`web/` には自動テストがなく、絞り込みやページ送りの計算、個人データの読み書きを変えたときに、壊れたことに気づく手段がありませんでした。

## 決定

- 単体テストは Vitest で書きます。画面部品（Client Components）のテストには React Testing Library を加えます
- テストは、対象のファイルと同じディレクトリに `*.test.ts(x)` で置きます
- テストから `data/personal/` を読み書きしないよう、`src/lib/recipes.ts` はデータの場所を環境変数 `MEALMIND_DATA_DIR` で変えられるようにします

## 理由

- 部品とスタイルを同じフォルダに置いているので、テストも隣に置くとそろいます。App Router では決まった名前のファイルだけがページになるため、`app/` に置いても公開されません
- `process.cwd()` を差し替える方法は、読み込む順番に気をつける必要があり、意図も読み取りにくいため、環境変数にしました

## 影響

- `recipes.ts` は、ファイルの場所を使うたびに組み立てます

## 検討した他の案

- **`tests/` にまとめる**：`src/` と同じフォルダ構成を保ち続ける必要があり、ファイルを移動するとずれやすいため見送りました

## 備考

- async な Server Components は Vitest と React Testing Library では描画できないため、今後 E2E テスト（Playwright）を検討します
