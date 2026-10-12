// 一度に扱える件数の上限。画面の外から大きすぎる値が送られてきたときに断る
const MAX_IDS = 1000;

/** サーバーアクションは画面の外からも呼べるので、届いた値が空でない文字列の配列かを確かめる */
export const isIdList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= MAX_IDS &&
  value.every((id) => typeof id === "string" && id !== "");
