// 底层 Storage 封装：统一前缀、错误处理、序列化

const PREFIX = 'rm_';

export const STORAGE_KEYS = {
  projects: 'projects',
  stages: 'stages',
  categories: 'budgetCategories',
  expenses: 'expenses',
  todos: 'todos',
  settings: 'appSettings',
} as const;

function withPrefix(key: string): string {
  return PREFIX + key;
}

/** 读取数组（损坏或不存在返回空数组） */
export function loadArray<T>(key: string): T[] {
  try {
    const value = wx.getStorageSync(withPrefix(key));
    if (Array.isArray(value)) return value as T[];
    return [];
  } catch (e) {
    console.error('[storage] loadArray failed', key, e);
    return [];
  }
}

/** 写入数组 */
export function saveArray<T>(key: string, value: T[]): void {
  try {
    wx.setStorageSync(withPrefix(key), value);
  } catch (e) {
    console.error('[storage] saveArray failed', key, e);
  }
}

/** 读取对象（带兜底） */
export function loadObject<T>(key: string, fallback: T): T {
  try {
    const value = wx.getStorageSync(withPrefix(key));
    return (value === undefined || value === null ? fallback : (value as T));
  } catch {
    return fallback;
  }
}

/** 写入对象 */
export function saveObject<T>(key: string, value: T): void {
  try {
    wx.setStorageSync(withPrefix(key), value);
  } catch (e) {
    console.error('[storage] saveObject failed', key, e);
  }
}
