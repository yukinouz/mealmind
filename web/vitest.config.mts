import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json の「@/*」の別名を読めるようにする
  resolve: { tsconfigPaths: true },
  test: {
    // 単体テストは対象のファイルと同じディレクトリに置く
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    // 日時の結果が実行する PC の時差に左右されないよう、日本時間にそろえる
    env: { TZ: "Asia/Tokyo" },
  },
});
