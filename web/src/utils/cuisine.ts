/** 料理の系統。画面では「ジャンル」と表示する（ADR-0011） */
export const CUISINES = ["washoku", "yoshoku", "chuka", "other"] as const;

export type Cuisine = (typeof CUISINES)[number];

/** 料理の系統として正しい値か */
export const isCuisine = (value: unknown): value is Cuisine =>
  typeof value === "string" && (CUISINES as readonly string[]).includes(value);
