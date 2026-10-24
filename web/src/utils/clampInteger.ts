/** 入力された値を、0〜max の整数にする。数でなければ 0 */
export const clampInteger = (value: string, max: number): number => {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return 0;
  return Math.min(max, Math.max(0, number));
};
