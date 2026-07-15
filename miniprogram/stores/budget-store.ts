// 预算 Store：预算分类 + 支出 的 CRUD 与统计计算
// 分类下有支出时不允许删除；统计复用纯函数 budget-calculator

import type {
  BudgetCategory,
  Expense,
  PaymentStatus,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateExpenseInput,
  UpdateExpenseInput,
} from '../types/budget';
import { generateId } from '../utils/id';
import { nowISO } from '../utils/date';
import { DEFAULT_CATEGORY_NAMES } from '../utils/constants';
import { loadArray, saveArray } from './storage';
import { notifyDataChange } from './notify';
import {
  calculateBudgetSummary,
  calculateCategorySummary,
  isCategoryBudgetOverflow,
  type BudgetSummary,
  type CategorySummary,
} from '../utils/budget-calculator';

class BudgetStore {
  private categories: BudgetCategory[] = [];
  private expenses: Expense[] = [];
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.categories = loadArray<BudgetCategory>('budgetCategories');
    this.expenses = loadArray<Expense>('expenses');
    this.initialized = true;
  }

  private persist(): void {
    saveArray('budgetCategories', this.categories);
    saveArray('expenses', this.expenses);
  }

  // ---- 分类 ----

  /** 创建项目时批量生成 13 个默认分类（预算默认为 0，由用户后续分配） */
  createDefaultCategories(projectId: string): void {
    const existing = this.categories.filter((c) => c.projectId === projectId);
    if (existing.length > 0) return;
    const created: BudgetCategory[] = DEFAULT_CATEGORY_NAMES.map((name, idx) => ({
      id: generateId('c'),
      projectId,
      name,
      budgetAmount: 0,
      sortOrder: idx,
    }));
    this.categories.push(...created);
    this.persist();
  }

  getCategories(projectId: string): BudgetCategory[] {
    return this.categories
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getCategoryById(id: string): BudgetCategory | undefined {
    return this.categories.find((c) => c.id === id);
  }

  createCategory(projectId: string, input: CreateCategoryInput): BudgetCategory {
    const maxSort = this.categories
      .filter((c) => c.projectId === projectId)
      .reduce((m, c) => Math.max(m, c.sortOrder), -1);
    const category: BudgetCategory = {
      id: generateId('c'),
      projectId,
      name: input.name.trim(),
      budgetAmount: input.budgetAmount,
      sortOrder: maxSort + 1,
    };
    this.categories.push(category);
    this.persist();
    notifyDataChange('budget');
    return category;
  }

  updateCategory(id: string, input: UpdateCategoryInput): BudgetCategory {
    const category = this.getCategoryById(id);
    if (!category) throw new Error('分类不存在');
    if (input.name !== undefined) category.name = input.name.trim();
    if (input.budgetAmount !== undefined) category.budgetAmount = input.budgetAmount;
    this.persist();
    notifyDataChange('budget');
    return category;
  }

  /** 分类下存在支出时禁止删除 */
  canRemoveCategory(id: string): boolean {
    return !this.expenses.some((e) => e.categoryId === id);
  }

  removeCategory(id: string): { ok: boolean; reason?: string } {
    if (!this.canRemoveCategory(id)) {
      return { ok: false, reason: '该分类下存在支出，无法删除' };
    }
    this.categories = this.categories.filter((c) => c.id !== id);
    this.persist();
    notifyDataChange('budget');
    return { ok: true };
  }

  // ---- 支出 ----

  getExpenses(projectId: string): Expense[] {
    return this.expenses
      .filter((e) => e.projectId === projectId)
      .sort((a, b) => {
        if (a.expenseDate !== b.expenseDate) return a.expenseDate < b.expenseDate ? 1 : -1;
        return a.createdAt < b.createdAt ? 1 : -1;
      });
  }

  getExpenseById(id: string): Expense | undefined {
    return this.expenses.find((e) => e.id === id);
  }

  createExpense(projectId: string, input: CreateExpenseInput): Expense {
    const now = nowISO();
    const expense: Expense = {
      id: generateId('e'),
      projectId,
      categoryId: input.categoryId,
      stageId: input.stageId,
      name: input.name.trim(),
      amount: input.amount,
      expenseDate: input.expenseDate,
      paymentStatus: input.paymentStatus,
      payee: input.payee,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    };
    this.expenses.push(expense);
    this.persist();
    notifyDataChange('budget');
    return expense;
  }

  updateExpense(id: string, input: UpdateExpenseInput): Expense {
    const expense = this.getExpenseById(id);
    if (!expense) throw new Error('支出不存在');
    if (input.categoryId !== undefined) expense.categoryId = input.categoryId;
    if (input.stageId !== undefined) expense.stageId = input.stageId;
    if (input.name !== undefined) expense.name = input.name.trim();
    if (input.amount !== undefined) expense.amount = input.amount;
    if (input.expenseDate !== undefined) expense.expenseDate = input.expenseDate;
    if (input.paymentStatus !== undefined) expense.paymentStatus = input.paymentStatus;
    if (input.payee !== undefined) expense.payee = input.payee;
    if (input.note !== undefined) expense.note = input.note;
    expense.updatedAt = nowISO();
    this.persist();
    notifyDataChange('budget');
    return expense;
  }

  removeExpense(id: string): void {
    this.expenses = this.expenses.filter((e) => e.id !== id);
    this.persist();
    notifyDataChange('budget');
  }

  // ---- 统计 ----

  /** 项目级预算汇总（已付款使用率为风险依据） */
  getSummary(projectId: string, totalBudget: number): BudgetSummary {
    const expenses = this.getExpenses(projectId);
    return calculateBudgetSummary(totalBudget, expenses);
  }

  /** 各分类预算汇总列表（与分类顺序一致） */
  getCategorySummaries(projectId: string): CategorySummary[] {
    const categories = this.getCategories(projectId);
    const expenses = this.getExpenses(projectId);
    return categories.map((c) => calculateCategorySummary(c, expenses));
  }

  /** 分类预算合计是否超过总预算 */
  isOverflow(projectId: string, totalBudget: number): boolean {
    const categories = this.getCategories(projectId);
    return isCategoryBudgetOverflow(categories, totalBudget);
  }

  /** 级联删除：删除项目时清理其分类与支出 */
  removeByProject(projectId: string): void {
    this.categories = this.categories.filter((c) => c.projectId !== projectId);
    this.expenses = this.expenses.filter((e) => e.projectId !== projectId);
    this.persist();
  }
}

export const budgetStore = new BudgetStore();
