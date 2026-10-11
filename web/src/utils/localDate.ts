/** 2桁にそろえる（例：3 → "03"） */
const pad = (value: number): string => String(value).padStart(2, "0");

/** 手元の時刻での日付を YYYY-MM-DD で返す（例：2026-10-11） */
export const toLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** 手元の時刻での日時を、時差付きの ISO 8601 で返す（例：2026-10-11T19:00:00+09:00） */
export const toLocalDateTime = (date: Date): string => {
  // getTimezoneOffset は日本なら -540（分）。符号を反対にすると +09:00 になる
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const offset = `${sign}${pad(Math.floor(Math.abs(offsetMinutes) / 60))}:${pad(Math.abs(offsetMinutes) % 60)}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

  return `${toLocalDate(date)}T${time}${offset}`;
};
