import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json の「@/*」の別名を読めるようにする
  resolve: { tsconfigPaths: true },
  test: {
    // 単体テストは対象のファイルと同じディレクトリに置く
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    env: {
      // 日時の結果が実行する PC の時差に左右されないよう、日本時間にそろえる
      TZ: "Asia/Tokyo",
      // vi.stubEnv を忘れたテストが data/personal/ に触れないよう、初期値を存在しない場所にしておく
      MEALMIND_DATA_DIR: path.join(os.tmpdir(), "mealmind-test-unset"),
    },
  },
});
