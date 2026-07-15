// 唯一 ID 生成：小程序环境无 crypto.randomUUID 保证，使用时间戳 + 随机数兜底

let counter = 0;

export function generateId(prefix = 'id'): string {
  counter = (counter + 1) % 100000;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  const seq = counter.toString(36);
  return `${prefix}_${time}${seq}${rand}`;
}
