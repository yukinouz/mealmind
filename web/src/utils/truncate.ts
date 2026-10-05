const DEFAULT_MAX_TITLE_LENGTH = 32;

/**
 * 文字列が maxLength 文字を超えたら、先頭 maxLength 文字に "..." を付けて返す
 * @param text 対象の文字列
 * @param maxLength 最大文字数（省略時は DEFAULT_MAX_TITLE_LENGTH）
 * @returns 切り詰めた文字列。maxLength 文字以下ならそのまま返す
 */
export const truncate = (
  text: string,
  maxLength: number = DEFAULT_MAX_TITLE_LENGTH,
): string => {
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  return `${chars.slice(0, maxLength).join("")}...`;
};
