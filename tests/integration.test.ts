import { describe, it, expect, beforeAll } from 'vitest';

// 用内存 Map 模拟微信本地存储，验证 Store 层端到端行为
class MemStorage {
  private map = new Map<string, unknown>();
  get(k: string): unknown {
    return this.map.has(k) ? this.map.get(k) : '';
  }
  set(k: string, v: unknown): void {
    this.map.set(k, v);
  }
  remove(k: string): void {
    this.map.delete(k);
  }
}

const mem = new MemStorage();

beforeAll(() => {
  (globalThis as { wx?: unknown }).wx = {
    getStorageSync: (k: string) => mem.get(k),
    setStorageSync: (k: string, v: unknown) => mem.set(k, v),
    removeStorageSync: (k: string) => mem.remove(k),
  };
});

// 必须在设置 wx mock 之后以动态方式引入，确保模块求值时 wx 已就绪
// 这里直接静态引入也可：store 模块求值时不会访问 wx，仅在方法内访问
import { projectStore } from '../miniprogram/stores/project-store';
import { budgetStore } from '../miniprogram/stores/budget-store';
import { todoStore } from '../miniprogram/stores/todo-store';

describe('集成：项目 → 预算 → 待办 全流程', () => {
  const project = projectStore.create({
    name: '温馨家',
    houseType: 'new',
    decorationType: 'full',
    area: 89,
    startDate: '2026-01-01',
    totalBudget: 200000,
  });

  it('创建项目自动生成 9 个阶段 + 13 个预算分类', () => {
    expect(projectStore.getStages(project.id)).toHaveLength(9);
    expect(budgetStore.getCategories(project.id)).toHaveLength(13);
  });

  it('首个阶段自动设为进行中，且全局仅一个进行中', () => {
    const stages = projectStore.getStages(project.id);
    const inProgress = stages.filter((s) => s.status === 'in_progress');
    expect(inProgress).toHaveLength(1);
    expect(stages[0].status).toBe('in_progress');
  });

  it('切换进行中阶段时，同一项目仅保留一个进行中', () => {
    const stages = projectStore.getStages(project.id);
    projectStore.setStageStatus(stages[3].id, 'in_progress');
    const inProgress = projectStore.getStages(project.id).filter((s) => s.status === 'in_progress');
    expect(inProgress).toHaveLength(1);
    expect(inProgress[0].id).toBe(stages[3].id);
  });

  it('记录支出后预算汇总反映已付款', () => {
    const cat = budgetStore.getCategories(project.id)[0];
    budgetStore.createExpense(project.id, {
      categoryId: cat.id,
      name: '设计费',
      amount: 30000,
      expenseDate: '2026-01-05',
      paymentStatus: 'paid',
    });
    budgetStore.createExpense(project.id, {
      categoryId: cat.id,
      name: '定金',
      amount: 20000,
      expenseDate: '2026-01-06',
      paymentStatus: 'unpaid',
    });
    const summary = budgetStore.getSummary(project.id, project.totalBudget);
    expect(summary.paidExpense).toBe(30000);
    expect(summary.unpaidCommitment).toBe(20000);
    expect(summary.budgetOccupied).toBe(50000);
    expect(summary.usageRate).toBe(15); // 30000 / 200000 * 100
  });

  it('待办创建与分组', () => {
    todoStore.create(project.id, {
      title: '确认水电点位',
      dueDate: '2026-03-01',
      priority: 'high',
    });
    todoStore.create(project.id, {
      title: '选购瓷砖',
      priority: 'medium',
    });
    const groups = todoStore.getGroups(project.id);
    const total = groups.today.length + groups.this_week.length + groups.future.length +
      groups.overdue.length + groups.no_date.length + groups.completed.length;
    expect(total).toBe(2);
    expect(todoStore.getStats(project.id).pending).toBe(2);
  });

  it('分类下有支出时禁止删除分类', () => {
    const cat = budgetStore.getCategories(project.id)[0];
    expect(budgetStore.canRemoveCategory(cat.id)).toBe(false);
    const res = budgetStore.removeCategory(cat.id);
    expect(res.ok).toBe(false);
  });

  it('删除项目级联清除阶段/分类/支出/待办', () => {
    const pid = project.id;
    projectStore.remove(pid);
    expect(projectStore.getById(pid)).toBeUndefined();
    expect(projectStore.getStages(pid)).toHaveLength(0);
    expect(budgetStore.getCategories(pid)).toHaveLength(0);
    expect(budgetStore.getExpenses(pid)).toHaveLength(0);
    expect(todoStore.getTodos(pid)).toHaveLength(0);
  });
});
