import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  type FilledIngredients,
  type FillTarget,
  fillIngredients,
  findUnfilled,
  readMainIngredientNames,
  type UnfilledRecipe,
} from "@/lib/recipes";
import { CUISINES, isCuisine } from "@/utils/cuisine";

const execFileAsync = promisify(execFile);

// npm run dev は web/ で実行するので、リポジトリ直下は1つ上になる
const ROOT_DIR = path.resolve(process.cwd(), "..");
const RULES_PATH = path.join(ROOT_DIR, "prompts", "record-ingredients.md");
const PREFERENCES_PATH = path.join(
  ROOT_DIR,
  "data",
  "personal",
  "preferences.json",
);
const CACHE_DIR = path.join(ROOT_DIR, "data", "cache");

// 試したときは1件で約7秒。件数が多いときのために余裕を持たせる
const TIMEOUT_MS = 3 * 60 * 1000;
const MAX_MAIN_INGREDIENTS = 3;
// 1回の claude -p に渡す件数。多すぎると時間切れになるので分けて送る（17件で約70秒）
const BATCH_SIZE = 10;

// Claude に返させる JSON の形
const OUTPUT_SCHEMA = {
  type: "object",
  required: ["recipes"],
  properties: {
    recipes: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "ingredients", "mainIngredients", "cuisine"],
        properties: {
          id: { type: "string" },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              required: ["name", "amount"],
              properties: {
                name: { type: "string" },
                amount: { type: "string" },
              },
            },
          },
          mainIngredients: {
            type: "array",
            maxItems: MAX_MAIN_INGREDIENTS,
            items: { type: "string" },
          },
          cuisine: { type: "string", enum: CUISINES },
        },
      },
    },
  },
};

interface VideoWithDescription extends UnfilledRecipe {
  description: string;
}

interface CachedVideo {
  videoId: string;
  description: string;
}

// 同時に2回開かれても、同じファイルのために Claude を2回動かさないようにする
const running = new Map<FillTarget, Promise<number>>();

/** 文字列か */
const isString = (value: unknown): value is string => typeof value === "string";

/** Claude が返した1件が、決めた形どおりか */
const isFilledIngredients = (value: unknown): value is FilledIngredients => {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;
  return (
    isString(item.id) &&
    Array.isArray(item.ingredients) &&
    item.ingredients.every(
      (ingredient) =>
        isString(ingredient?.name) && isString(ingredient?.amount),
    ) &&
    Array.isArray(item.mainIngredients) &&
    item.mainIngredients.length <= MAX_MAIN_INGREDIENTS &&
    item.mainIngredients.every(isString) &&
    isCuisine(item.cuisine)
  );
};

/** 動画一覧の保存ファイルから、レシピの説明文を探す。見つからない動画は外す */
const withDescriptions = async (
  recipes: UnfilledRecipe[],
): Promise<VideoWithDescription[]> => {
  const sourceIds = [...new Set(recipes.map((recipe) => recipe.sourceId))];
  const descriptions = new Map<string, string>();

  for (const sourceId of sourceIds) {
    // sourceId はファイル名になるので、ほかの場所を指さない文字だけを許す
    if (!/^[a-z0-9-]+$/i.test(sourceId)) continue;

    const json = await readFile(
      path.join(CACHE_DIR, `videos-${sourceId}.json`),
      "utf8",
    ).catch(() => null);
    if (json === null) continue;

    const { videos } = JSON.parse(json) as { videos: CachedVideo[] };
    for (const video of videos)
      descriptions.set(video.videoId, video.description);
  }

  return recipes.flatMap((recipe) => {
    const description = descriptions.get(recipe.id);
    return description === undefined ? [] : [{ ...recipe, description }];
  });
};

/** Claude に渡す文章を組み立てる。決まりは suggest スキルと同じファイルを使う */
const buildPrompt = async (videos: VideoWithDescription[]): Promise<string> => {
  const [rules, preferences, knownNames] = await Promise.all([
    readFile(RULES_PATH, "utf8"),
    readFile(PREFERENCES_PATH, "utf8").then(
      (json) => JSON.parse(json) as { pantryIngredients?: string[] },
    ),
    readMainIngredientNames(),
  ]);
  const videoSections = videos.map((video) =>
    [
      `### ${video.id}`,
      `- タイトル: ${video.title}`,
      "- 説明文:",
      video.description,
    ].join("\n"),
  );

  return [
    "次の決まりに従って、それぞれの動画の説明文から ingredients・mainIngredients・cuisine を書き出し、動画の id ごとに返してください。",
    rules,
    "## 常備している食材",
    JSON.stringify(preferences.pantryIngredients ?? []),
    "## すでに記録したメイン食材の名前",
    JSON.stringify(knownNames),
    "## 動画",
    ...videoSections,
  ].join("\n\n");
};

/** claude -p を実行し、決めた形の JSON を受け取る。ツールは使わせない（ADR-0010） */
const askClaude = async (prompt: string): Promise<FilledIngredients[]> => {
  const execution = execFileAsync(
    "claude",
    [
      "-p",
      "--tools",
      "",
      "--no-session-persistence",
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(OUTPUT_SCHEMA),
    ],
    // プロジェクトの CLAUDE.md などを読ませないよう、一時フォルダで動かす
    { cwd: tmpdir(), timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
  );
  // 説明文は長いので、引数ではなく標準入力で渡す
  execution.child.stdin?.end(prompt);

  const { stdout } = await execution;
  const output = JSON.parse(stdout) as {
    is_error?: boolean;
    structured_output?: { recipes?: unknown[] };
  };
  if (output.is_error) throw new Error("Claude がエラーを返しました");

  return (output.structured_output?.recipes ?? []).filter(isFilledIngredients);
};

/** 一覧を size 件ずつに分ける */
const chunk = <T>(list: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, index) =>
    list.slice(index * size, (index + 1) * size),
  );

/** 1まとまりを Claude に決めてもらって書き込む。埋めた件数を返す */
const fillBatch = async (
  target: FillTarget,
  videos: VideoWithDescription[],
): Promise<number> => {
  const results = await askClaude(await buildPrompt(videos));
  // 頼んでいない id が返ってきても書かない
  const ids = new Set(videos.map((video) => video.id));
  const filled = results.filter((result) => ids.has(result.id));
  await fillIngredients(target, filled);
  return filled.length;
};

/**
 * 埋まっていないレシピを探し、BATCH_SIZE 件ずつ順番に埋める。埋めた件数を返す
 * まとまりごとに書き込むので、途中で失敗しても、それまでの分は残る
 */
const fillOnce = async (target: FillTarget): Promise<number> => {
  const videos = await withDescriptions(await findUnfilled(target));
  let filledCount = 0;
  for (const batch of chunk(videos, BATCH_SIZE)) {
    filledCount += await fillBatch(target, batch);
  }
  return filledCount;
};

/** 指定したファイルで、材料・メイン食材・料理の系統がまだないレシピを埋める。実行中なら、その結果を待つ */
export const fillMissingIngredients = (target: FillTarget): Promise<number> => {
  const current = running.get(target);
  if (current !== undefined) return current;

  const next = fillOnce(target).finally(() => running.delete(target));
  running.set(target, next);
  return next;
};
