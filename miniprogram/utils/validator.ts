// 表单校验：返回字段级错误，供页面展示

import type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateTodoInput,
  UpdateTodoInput,
} from '../types';
import { isFiniteNumber } from './money';
import { parseDate } from './date';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function buildResult(errors: Record<string, string>): ValidationResult {
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateProject(
  input: CreateProjectInput | UpdateProjectInput,
): ValidationResult {
  const errors: Record<string, string> = {};
  if (!input.name || !String(input.name).trim()) {
    errors.name = '请输入项目名称';
  }
  if (input.area === undefined || !isFiniteNumber(input.area) || input.area <= 0) {
    errors.area = '建筑面积需大于 0';
  }
  if (!input.startDate) {
    errors.startDate = '请选择开工日期';
  }
  if (
    input.totalBudget === undefined ||
    !isFiniteNumber(input.totalBudget) ||
    input.totalBudget < 0
  ) {
    errors.totalBudget = '预算不能为负数';
  }
  if (input.plannedEndDate && input.startDate) {
    const start = parseDate(input.startDate);
    const end = parseDate(input.plannedEndDate);
    if (start && end && end.getTime() < start.getTime()) {
      errors.plannedEndDate = '完工日期不能早于开工日期';
    }
  }
  return buildResult(errors);
}

export function validateExpense(
  input: CreateExpenseInput | UpdateExpenseInput,
): ValidationResult {
  const errors: Record<string, string> = {};
  if (!input.name || !String(input.name).trim()) {
    errors.name = '请输入支出名称';
  }
  if (!input.categoryId) {
    errors.categoryId = '请选择预算分类';
  }
  if (input.amount === undefined || !isFiniteNumber(input.amount) || input.amount <= 0) {
    errors.amount = '金额需大于 0';
  }
  if (!input.expenseDate) {
    errors.expenseDate = '请选择支出日期';
  }
  return buildResult(errors);
}

export function validateTodo(input: CreateTodoInput | UpdateTodoInput): ValidationResult {
  const errors: Record<string, string> = {};
  if (!input.title || !String(input.title).trim()) {
    errors.title = '请输入待办内容';
  }
  return buildResult(errors);
}
