import { describe, it, expect } from 'vitest';
import {
  calculateBudgetSummary,
  calculateCategorySummary,
  getBudgetRiskInfo,
  isCategoryBudgetOverflow,
  type BudgetSummary,
} from '../miniprogram/utils/budget-calculator';
import type { Expense, BudgetCategory } from '../miniprogram/types/budget';

function makeExpense(over: Partial<Expense> & { amount: number; paymentStatus: 'paid' | 'unpaid' }): Expense {
  return {
    id: 'e1',
    projectId: 'p1',
    categoryId: 'c1',
    name: '支出',
    expenseDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('calculateBudgetSummary - 基础统计', () => {
  it('paid/unpaid 分别累计，occupied = paid + unpaid', () => {
    const expenses = [
      makeExpense({ amount: 30000, paymentStatus: 'paid' }),
      makeExpense({ amount: 20000, paymentStatus: 'unpaid' }),
    ];
    const s = calculateBudgetSummary(100000, expenses);
    expect(s.paidExpense).toBe(30000);
    expect(s.unpaidCommitment).toBe(20000);
    expect(s.budgetOccupied).toBe(50000);
    expect(s.remaining).toBe(70000);
  });

  it('超支金额 = max(paid - total, 0)', () => {
    const s = calculateBudgetSummary(100000, [makeExpense({ amount: 110000, paymentStatus: 'paid' })]);
    expect(s.overspent).toBe(10000);
    expect(s.remaining).toBe(-10000);
  });

  it('无支出时全部归零', () => {
    const s = calculateBudgetSummary(100000, []);
    expect(s.paidExpense).toBe(0);
    expect(s.usageRate).toBe(0);
    expect(s.riskLevel).toBe('normal');
  });

  it('totalBudget 为 0 或负数时 usageRate 为 0（避免除零）', () => {
    const s = calculateBudgetSummary(0, [makeExpense({ amount: 5000, paymentStatus: 'paid' })]);
    expect(s.usageRate).toBe(0);
    expect(s.riskLevel).toBe('normal');
  });

  it('忽略非法金额（NaN/Infinity）', () => {
    const bad = makeExpense({ amount: NaN as unknown as number, paymentStatus: 'paid' });
    const s = calculateBudgetSummary(100000, [bad]);
    expect(s.paidExpense).toBe(0);
  });
});

describe('calculateBudgetSummary - 风险阈值矩阵（80% / 100% 边界）', () => {
  const cases: Array<{ paid: number; total: number; rate: number; level: BudgetSummary['riskLevel'] }> = [
    { paid: 0, total: 100000, rate: 0, level: 'normal' },
    { paid: 79000, total: 100000, rate: 79, level: 'normal' },
    { paid: 80000, total: 100000, rate: 80, level: 'warning' }, // 恰好 80% → 预警
    { paid: 95000, total: 100000, rate: 95, level: 'warning' },
    { paid: 100000, total: 100000, rate: 100, level: 'overspent' }, // 恰好 100% → 超支
    { paid: 110000, total: 100000, rate: 110, level: 'overspent' },
  ];

  cases.forEach((c) => {
    it(`paid=${c.paid} total=${c.total} → usageRate=${c.rate}% riskLevel=${c.level}`, () => {
      const s = calculateBudgetSummary(c.total, [makeExpense({ amount: c.paid, paymentStatus: 'paid' })]);
      expect(s.usageRate).toBe(c.rate);
      expect(s.riskLevel).toBe(c.level);
    });
  });

  it('occupied 超过 total 但 paid 未超 → commitmentExceeded=true', () => {
    const expenses = [
      makeExpense({ amount: 90000, paymentStatus: 'paid' }),
      makeExpense({ amount: 20000, paymentStatus: 'unpaid' }),
    ];
    const s = calculateBudgetSummary(100000, expenses);
    expect(s.budgetOccupied).toBe(110000);
    expect(s.commitmentExceeded).toBe(true);
  });
});

describe('getBudgetRiskInfo - 风险文案矩阵', () => {
  it('paid=8万/total=10万 → 预算接近上限', () => {
    const s = calculateBudgetSummary(100000, [makeExpense({ amount: 80000, paymentStatus: 'paid' })]);
    expect(getBudgetRiskInfo(s)).toMatchObject({ level: 'warning', title: '预算接近上限' });
  });
  it('paid=10万/total=10万 → 预算已超支', () => {
    const s = calculateBudgetSummary(100000, [makeExpense({ amount: 100000, paymentStatus: 'paid' })]);
    expect(getBudgetRiskInfo(s)).toMatchObject({ level: 'overspent', title: '预算已超支' });
  });
  it('paid=11万/total=10万 → 预算已超支', () => {
    const s = calculateBudgetSummary(100000, [makeExpense({ amount: 110000, paymentStatus: 'paid' })]);
    expect(getBudgetRiskInfo(s)).toMatchObject({ level: 'overspent', title: '预算已超支' });
  });
  it('paid=9万 + 未付2万 / total=10万 → 已确认支出可能导致超支', () => {
    const expenses = [
      makeExpense({ amount: 90000, paymentStatus: 'paid' }),
      makeExpense({ amount: 20000, paymentStatus: 'unpaid' }),
    ];
    const s = calculateBudgetSummary(100000, expenses);
    expect(getBudgetRiskInfo(s)).toMatchObject({ level: 'warning', title: '已确认支出可能导致超支' });
  });
});

describe('calculateCategorySummary - 分类级矩阵', () => {
  const cat: BudgetCategory = { id: 'c1', projectId: 'p1', name: '主材', budgetAmount: 100000, sortOrder: 0 };

  it('分类使用率 85% → warning', () => {
    const expenses = [makeExpense({ amount: 85000, paymentStatus: 'paid', categoryId: 'c1' })];
    const s = calculateCategorySummary(cat, expenses);
    expect(s.usageRate).toBe(85);
    expect(s.riskLevel).toBe('warning');
  });
  it('分类使用率 105% → overspent', () => {
    const expenses = [makeExpense({ amount: 105000, paymentStatus: 'paid', categoryId: 'c1' })];
    const s = calculateCategorySummary(cat, expenses);
    expect(s.usageRate).toBe(105);
    expect(s.riskLevel).toBe('overspent');
  });
  it('只统计该分类下的支出', () => {
    const expenses = [
      makeExpense({ amount: 50000, paymentStatus: 'paid', categoryId: 'c1' }),
      makeExpense({ amount: 99999, paymentStatus: 'paid', categoryId: 'other' }),
    ];
    const s = calculateCategorySummary(cat, expenses);
    expect(s.paidExpense).toBe(50000);
  });
});

describe('isCategoryBudgetOverflow - 分类预算合计超过总预算', () => {
  const cats: BudgetCategory[] = [
    { id: 'c1', projectId: 'p1', name: 'A', budgetAmount: 60000, sortOrder: 0 },
    { id: 'c2', projectId: 'p1', name: 'B', budgetAmount: 50000, sortOrder: 1 },
  ];
  it('合计 11万 > 10万 → true', () => {
    expect(isCategoryBudgetOverflow(cats, 100000)).toBe(true);
  });
  it('合计 11万 = 11万总预算 → false', () => {
    expect(isCategoryBudgetOverflow(cats, 110000)).toBe(false);
  });
});
