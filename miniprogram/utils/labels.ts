// 枚举值 → 中文标签映射（供各页面展示）

export const HOUSE_TYPE_LABELS: Record<string, string> = {
  new: '新房',
  old: '旧房',
};

export const DECORATION_TYPE_LABELS: Record<string, string> = {
  half: '半包',
  full: '全包',
  clear: '清包',
  unknown: '暂不确定',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: '已付款',
  unpaid: '未付款',
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export const STAGE_STATUS_LABELS: Record<string, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
};

export function labelOf(map: Record<string, string>, key: string, fallback = ''): string {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : fallback;
}
