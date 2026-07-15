// 预算与支出相关类型定义（对齐 PRD 第 10 节数据模型）

/** 付款状态 */
export type PaymentStatus = 'paid' | 'unpaid';

/** 预算分类 */
export interface BudgetCategory {
  id: string;
  projectId: string;
  name: string;
  /** 分类预算金额（元） */
  budgetAmount: number;
  sortOrder: number;
}

/** 支出记录 */
export interface Expense {
  id: string;
  projectId: string;
  categoryId: string;
  stageId?: string;
  name: string;
  /** 支出金额（元） */
  amount: number;
  /** 支出日期 ISO date */
  expenseDate: string;
  paymentStatus: PaymentStatus;
  payee?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** 创建分类输入 */
export interface CreateCategoryInput {
  name: string;
  budgetAmount: number;
}

/** 更新分类输入 */
export interface UpdateCategoryInput {
  name?: string;
  budgetAmount?: number;
}

/** 创建支出输入 */
export interface CreateExpenseInput {
  categoryId: string;
  stageId?: string;
  name: string;
  amount: number;
  expenseDate: string;
  paymentStatus: PaymentStatus;
  payee?: string;
  note?: string;
}

/** 更新支出输入 */
export interface UpdateExpenseInput {
  categoryId?: string;
  stageId?: string;
  name?: string;
  amount?: number;
  expenseDate?: string;
  paymentStatus?: PaymentStatus;
  payee?: string;
  note?: string;
}
