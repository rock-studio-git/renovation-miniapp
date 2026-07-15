// 应用级共享类型（模块导出，供 app.ts 与各 Store 显式 import）
// 不使用全局 ambient 声明，避免 .d.ts 收录问题

export type DataChangeScope = 'project' | 'budget' | 'todo' | 'all';

export interface IAppOption {
  globalData: {
    /** 当前选中的项目 ID（null 表示尚未创建/选择项目） */
    currentProjectId: string | null;
    /** 应用版本号 */
    version: string;
  };
  /** 数据变更广播，用于跨页面（尤其是首页）联动刷新 */
  emitDataChange: (scope?: DataChangeScope) => void;
  /** 订阅数据变更 */
  onDataChange: (callback: (scope?: DataChangeScope) => void) => void;
}
