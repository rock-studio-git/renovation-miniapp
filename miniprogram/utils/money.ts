// 金额工具：统一人民币元，保留两位小数，千分位

/** 判断是否为有限数字（排除 NaN / Infinity / 非数字） */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** 保留两位小数（四舍五入，规避浮点误差） */
export function round2(value: number): number {
  const n = isFiniteNumber(value) ? value : 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** 保留一位小数 */
export function round1(value: number): number {
  const n = isFiniteNumber(value) ? value : 0;
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

/**
 * 格式化为人民币显示字符串，如 ¥12,345.67
 * @param amount 金额（元）
 * @param withSymbol 是否带 ¥ 符号，默认 true
 */
export function formatMoney(amount: number, withSymbol = true): string {
  const n = round2(amount);
  const fixed = Math.abs(n).toFixed(2);
  const [intPart, dec] = fixed.split('.');
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = n < 0 ? '-' : '';
  return `${sign}${withSymbol ? '¥' : ''}${withSep}.${dec}`;
}

/**
 * 格式化为「万」为单位，用于大金额概览展示
 * 例如 123456.7 -> "12.35万"
 */
export function formatWan(amount: number): string {
  const n = isFiniteNumber(amount) ? amount : 0;
  return `${round2(n / 10000).toFixed(2)}万`;
}
