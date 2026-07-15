/// <reference types="miniprogram-api-typings" />

import type { IAppOption, DataChangeScope } from './types/app-types';
import { projectStore } from './stores/project-store';
import { budgetStore } from './stores/budget-store';
import { todoStore } from './stores/todo-store';

App<IAppOption>({
  globalData: {
    currentProjectId: null,
    version: '1.0.0',
  },

  onLaunch() {
    // 启动时从本地 Storage 恢复当前项目选择
    const saved = wx.getStorageSync('currentProjectId');
    if (typeof saved === 'string' && saved.length > 0) {
      this.globalData.currentProjectId = saved;
    }
    // 初始化各 Store（从 Storage 载入数据）
    projectStore.init();
    budgetStore.init();
    todoStore.init();
  },

  // ---- 轻量全局事件总线：数据变更后通知订阅者刷新 ----
  emitDataChange(scope: DataChangeScope = 'all') {
    const subs = (this as unknown as { _dataChangeSubs?: Array<(s?: DataChangeScope) => void> })
      ._dataChangeSubs;
    if (!subs) return;
    subs.forEach((cb) => {
      try {
        cb(scope);
      } catch (e) {
        console.error('[onDataChange] callback error', e);
      }
    });
  },

  onDataChange(callback: (scope?: DataChangeScope) => void) {
    const app = this as unknown as {
      _dataChangeSubs?: Array<(s?: DataChangeScope) => void>;
    };
    if (!app._dataChangeSubs) app._dataChangeSubs = [];
    app._dataChangeSubs.push(callback);
  },
});
