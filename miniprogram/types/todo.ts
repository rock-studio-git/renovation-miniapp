// 待办相关类型定义（对齐 PRD 第 10 节数据模型）

/** 待办优先级 */
export type TodoPriority = 'high' | 'medium' | 'low';

/** 待办状态 */
export type TodoStatus = 'pending' | 'completed';

/** 待办事项 */
export interface Todo {
  id: string;
  projectId: string;
  stageId?: string;
  title: string;
  /** 截止日期 ISO date，可选 */
  dueDate?: string;
  priority: TodoPriority;
  status: TodoStatus;
  note?: string;
  /** 完成时间 ISO datetime */
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 创建待办输入 */
export interface CreateTodoInput {
  stageId?: string;
  title: string;
  dueDate?: string;
  priority: TodoPriority;
  note?: string;
}

/** 更新待办输入 */
export interface UpdateTodoInput {
  stageId?: string;
  title?: string;
  dueDate?: string;
  priority?: TodoPriority;
  status?: TodoStatus;
  note?: string;
}
