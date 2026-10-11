import { fillMissingIngredients } from "@/lib/fill-ingredients";
import type { FillTarget } from "@/lib/recipes";

const TARGETS: readonly string[] = [
  "recipes",
  "excluded",
] satisfies FillTarget[];

/** 届いた値が、埋めるファイルの指定として正しいか */
const isFillTarget = (value: unknown): value is FillTarget =>
  typeof value === "string" && TARGETS.includes(value);

/**
 * ページから呼ばれ、指定したファイルで材料・メイン食材・料理の系統がまだないレシピを埋める（ADR-0010・ADR-0011）
 * サーバーアクションは1つずつ順番に送られ、ハートの記録を待たせてしまうので Route Handler にする
 */
export const POST = async (request: Request): Promise<Response> => {
  // Claude を動かすので、ほかのサイトから呼ばれたときは断る
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    target?: unknown;
  } | null;
  if (!isFillTarget(body?.target)) {
    return Response.json({ error: "bad target" }, { status: 400 });
  }

  try {
    const filledCount = await fillMissingIngredients(body.target);
    return Response.json({ filledCount });
  } catch (error) {
    console.error("材料とメイン食材を埋められませんでした", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
};
