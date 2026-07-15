// 预算计算引擎（纯函数，无副作用，便于单元测试）
// 对齐 PRD 7.2 预算规则与测试矩阵（80% 预警 / 100% 超支边界）

import type { Expense, BudgetCategory } from '../types/budget';
import { isFiniteNumber, round1, round2 } from './money';

/** 预算风险等级 */
export type RiskLevel = 'normal' | 'warning' | 'overspent';

/** 项目级预算汇总 */
export interface BudgetSummary {
  /** 总预算（元） */
  totalBudget: number;
  /** 已付款支出合计 */
  paidExpense: number;
  /** 未付款占用（已确认未付） */
  unpaidCommitment: number;
  /** 预算占用 = 已付 + 未付 */
  budgetOccupied: number;
  /** 剩余预算 = 总预算 - 已付款 */
  remaining: number;
  /** 超支金额 = max(已付款 - 总预算, 0) */
  overspent: number;
  /** 使用率 = 已付款 / 总预算 × 100（保留 1 位小数） */
  usageRate: number;
  /** 风险等级 */
  riskLevel: RiskLevel;
  /** 占用是否已超过总预算（已确认 + 已付 > 总预算） */
  commitmentExceeded: boolean;
}

/** 分类级预算汇总 */
export interface CategorySummary {
  categoryId: string;
  name: string;
  budgetAmount: number;
  paidExpense: number;
  unpaidCommitment: number;
  /** 已占用 = 已付 + 未付 */
  usedAmount: number;
  /** 剩余（按已付）= 分类预算 - 已付 */
  remaining: number;
  /** 使用率 = 已付 / 分类预算 × 100 */
  usageRate: number;
  /** 占用率 = 已占用 / 分类预算 × 100 */
  occupiedRate: number;
  riskLevel: RiskLevel;
  /** 占用是否超过分类预算 */
  commitmentExceeded: boolean;
}

/** 风险文案 */
export interface BudgetRiskInfo {
  level: RiskLevel;
  title: string;
  desc: string;
}

const WARNING_THRESHOLD = 80;
const OVERSPEST_THRESHOLD = 100;

function sumBy(expenses: Expense[], predicate: (e: Expense) => boolean): number {
  let sum = 0;
  for (const e of expenses) {
    const amount = isFiniteNumber(e.amount) ? e.amount : 0;
    if (predicate(e)) sum += amount;
  }
  return round2(sum);
}

function resolveRiskLevel(usageRate: number): RiskLevel {
  if (usageRate >= OVERSPEST_THRESHOLD) return 'overspent';
  if (usageRate >= WARNING_THRESHOLD) return 'warning';
  return 'normal';
}

/**
 * 计算项目级预算汇总
 * @param totalBudget 总预算（元）
 * @param expenses 该项目下所有支出
 */
export function calculateBudgetSummary(totalBudget: number, expenses: Expense[]): BudgetSummary {
  const safeTotal = isFiniteNumber(totalBudget) && totalBudget > 0 ? totalBudget : 0;
  const paid = sumBy(expenses, (e) => e.paymentStatus === 'paid');
  const unpaid = sumBy(expenses, (e) => e.paymentStatus === 'unpaid');
  const occupied = round2(paid + unpaid);
  const usageRate = safeTotal > 0 ? round1((paid / safeTotal) * 100) : 0;
  return {
    totalBudget: safeTotal,
    paidExpense: paid,
    unpaidCommitment: unpaid,
    budgetOccupied: occupied,
    remaining: round2(safeTotal - paid),
    overspent: round2(Math.max(paid - safeTotal, 0)),
    usageRate,
    riskLevel: resolveRiskLevel(usageRate),
    commitmentExceeded: safeTotal > 0 && occupied > safeTotal,
  };
}

/**
 * 计算单个分类的预算汇总
 * @param category 预算分类
 * @param expenses 该项目下所有支出（函数内部按 categoryId 过滤）
 */
export function calculateCategorySummary(
  category: BudgetCategory,
  expenses: Expense[],
): CategorySummary {
  const safeBudget = isFiniteNumber(category.budgetAmount) && category.budgetAmount > 0
    ? category.budgetAmount
    : 0;
  const list = expenses.filter((e) => e.categoryId === category.id);
  const paid = sumBy(list, (e) => e.paymentStatus === 'paid');
  const unpaid = sumBy(list, (e) => e.paymentStatus === 'unpaid');
  const used = round2(paid + unpaid);
  const usageRate = safeBudget > 0 ? round1((paid / safeBudget) * 100) : 0;
  const occupiedRate = safeBudget > 0 ? round1((used / safeBudget) * 100) : 0;
  return {
    categoryId: category.id,
    name: category.name,
    budgetAmount: safeBudget,
    paidExpense: paid,
    unpaidCommitment: unpaid,
    usedAmount: used,
    remaining: round2(safeBudget - paid),
    usageRate,
    occupiedRate,
    riskLevel: resolveRiskLevel(usageRate),
    commitmentExceeded: safeBudget > 0 && used > safeBudget,
  };
}

/**
 * 将汇总转换为风险文案（对齐测试矩阵）
 */
export function getBudgetRiskInfo(summary: BudgetSummary): BudgetRiskInfo {
  if (summary.riskLevel === 'overspent') {
    return { level: 'overspent', title: '预算已超支', desc: `已使用 ${summary.usageRate}%` };
  }
  if (summary.commitmentExceeded) {
    return {
      level: 'warning',
      title: '已确认支出可能导致超支',
      desc: `占用 ${round1((summary.budgetOccupied / (summary.totalBudget || 1)) * 100)}%`,
    };
  }
  if (summary.riskLevel === 'warning') {
    return { level: 'warning', title: '预算接近上限', desc: `已使用 ${summary.usageRate}%` };
  }
  return { level: 'normal', title: '预算健康', desc: `已使用 ${summary.usageRate}%` };
}

/**
 * 判断所有分类预算合计是否超过总预算（分类预算超过总预算）
 */
export function isCategoryBudgetOverflow(
  categories: BudgetCategory[],
  totalBudget: number,
): boolean {
  const sum = categories.reduce(
    (acc, c) => acc + (isFiniteNumber(c.budgetAmount) ? c.budgetAmount : 0),
    0,
  );
  return sum > (isFiniteNumber(totalBudget) ? totalBudget : 0);
}
