import os from "node:os";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // JSX を読めるようにする
  plugins: [react()],
  // tsconfig.json の「@/*」の別名を読めるようにする
  resolve: { tsconfigPaths: true },
  test: {
    env: {
      // 日時の結果が実行する PC の時差に左右されないよう、日本時間にそろえる
      TZ: "Asia/Tokyo",
      // vi.stubEnv を忘れたテストが data/personal/ に触れないよう、初期値を存在しない場所にしておく
      MEALMIND_DATA_DIR: path.join(os.tmpdir(), "mealmind-test-unset"),
    },
    // 単体テストは対象のファイルと同じディレクトリに置く。画面部品のテスト（.tsx）だけブラウザの代わりの jsdom で動かす
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          include: ["src/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
