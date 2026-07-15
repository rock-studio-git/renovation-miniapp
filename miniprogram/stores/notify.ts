// 数据变更通知：变更后广播，首页等订阅者刷新

import type { IAppOption, DataChangeScope } from '../types/app-types';

export function notifyDataChange(scope: DataChangeScope = 'all'): void {
  try {
    const app = getApp<IAppOption>();
    if (app && typeof app.emitDataChange === 'function') {
      app.emitDataChange(scope);
    }
  } catch {
    // 应用尚未就绪时静默忽略
  }
}
