// 日期工具：所有日期以本地时区处理，避免 UTC 偏移问题

/** 将 "YYYY-MM-DD" 解析为本地零点的 Date；非法返回 null */
export function parseDate(value: string | undefined | null): Date | null {
  if (!value || typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

/** 取当天零点 */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** 是否为同一天 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 是否为今天（基于 now，默认当前时间） */
export function isToday(date: Date, now: Date = new Date()): boolean {
  return isSameDay(date, startOfDay(now));
}

/** 返回 `now` 所在周的周一零点（周一为一周起点） */
export function startOfWeek(now: Date = new Date()): Date {
  const day = startOfDay(now).getDay(); // 0=周日,1=周一...
  const offset = day === 0 ? -6 : 1 - day; // 周日视为上周，需回退6天
  return addDays(startOfDay(now), offset);
}

/** 返回 `now` 所在周的周日 23:59:59（周一为起点） */
export function endOfWeek(now: Date = new Date()): Date {
  const monday = startOfWeek(now);
  const sunday = addDays(monday, 6);
  return new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59, 999);
}

/** 是否在本周内（含今天，周一~周日） */
export function isWithinThisWeek(date: Date, now: Date = new Date()): boolean {
  const start = startOfWeek(now);
  const end = endOfWeek(now);
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

/** 加减天数 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** 是否为逾期（截止日期早于今天零点，且未完成由调用方判断） */
export function isOverdueDate(date: Date, now: Date = new Date()): boolean {
  return startOfDay(date).getTime() < startOfDay(now).getTime();
}

/** Date -> "YYYY-MM-DD" */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

/** 当前时间 ISO 字符串（用于 createdAt / updatedAt） */
export function nowISO(): string {
  return new Date().toISOString();
}

/** 友好展示：今天 / 明天 / 昨天 / MM月DD日 */
export function formatDueLabel(value: string | undefined, now: Date = new Date()): string {
  const date = parseDate(value);
  if (!date) return '无日期';
  if (isToday(date, now)) return '今天';
  const diff = Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / (24 * 3600 * 1000),
  );
  if (diff === 1) return '明天';
  if (diff === -1) return '昨天';
  if (diff < -1) return `逾期${-diff}天`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/** 标准日期展示 YYYY-MM-DD */
export function formatDate(value: string | undefined): string {
  const date = parseDate(value);
  return date ? toISODate(date) : '';
}
