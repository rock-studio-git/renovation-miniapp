import { describe, it, expect } from 'vitest';
import { sortTodos, groupTodos, isOverdue, TODO_GROUP_ORDER } from '../miniprogram/utils/todo-sorter';
import type { Todo, TodoPriority } from '../miniprogram/types/todo';

// 固定基准时间：2026-01-15（周四）12:00 本地
const NOW = new Date(2026, 0, 15, 12, 0, 0);

let seq = 0;
function todo(over: Partial<Todo> & { title: string; id: string }): Todo {
  seq += 1;
  return {
    projectId: 'p1',
    priority: 'medium' as TodoPriority,
    status: 'pending',
    createdAt: `2026-01-01T00:00:0${seq}.000Z`,
    updatedAt: '',
    ...over,
  };
}

describe('isOverdue', () => {
  it('截止日期早于今天 → 逾期', () => {
    expect(isOverdue(todo({ id: '1', title: 'a', dueDate: '2026-01-10' }), NOW)).toBe(true);
  });
  it('截止日期等于今天 → 不逾期', () => {
    expect(isOverdue(todo({ id: '2', title: 'a', dueDate: '2026-01-15' }), NOW)).toBe(false);
  });
  it('已完成待办永不逾期', () => {
    expect(
      isOverdue(todo({ id: '3', title: 'a', dueDate: '2026-01-01', status: 'completed' }), NOW),
    ).toBe(false);
  });
  it('无日期 → 不逾期', () => {
    expect(isOverdue(todo({ id: '4', title: 'a' }), NOW)).toBe(false);
  });
});

describe('groupTodos - 分组规则', () => {
  const todos: Todo[] = [
    todo({ id: 't', title: '今天', dueDate: '2026-01-15' }),
    todo({ id: 'o', title: '逾期', dueDate: '2026-01-10' }),
    todo({ id: 'w', title: '本周', dueDate: '2026-01-17' }), // 周六，本周内
    todo({ id: 'f', title: '未来', dueDate: '2026-01-25' }),
    todo({ id: 'n', title: '无日期' }),
    todo({ id: 'c', title: '已完成', status: 'completed' }),
  ];
  const g = groupTodos(todos, NOW);

  it('各待办落入正确分组', () => {
    expect(g.today.map((t) => t.id)).toContain('t');
    expect(g.overdue.map((t) => t.id)).toContain('o');
    expect(g.this_week.map((t) => t.id)).toContain('w');
    expect(g.future.map((t) => t.id)).toContain('f');
    expect(g.no_date.map((t) => t.id)).toContain('n');
    expect(g.completed.map((t) => t.id)).toContain('c');
  });

  it('分组 key 与展示顺序一致（PRD 7.3.3）', () => {
    expect(TODO_GROUP_ORDER.map((x) => x.key)).toEqual([
      'today',
      'this_week',
      'future',
      'overdue',
      'no_date',
      'completed',
    ]);
  });

  it('已完成不进入未完成分组', () => {
    expect(g.today.concat(g.overdue, g.this_week, g.future, g.no_date).map((t) => t.id)).not.toContain('c');
  });
});

describe('sortTodos - 排序规则', () => {
  it('未完成优先于已完成', () => {
    const todos = [
      todo({ id: 'done', title: 'a', status: 'completed' }),
      todo({ id: 'pend', title: 'b' }),
    ];
    const sorted = sortTodos(todos, NOW);
    expect(sorted[0].id).toBe('pend');
    expect(sorted[1].id).toBe('done');
  });

  it('未完成内：逾期优先', () => {
    const todos = [
      todo({ id: 'normal', title: 'a', dueDate: '2026-01-20' }),
      todo({ id: 'late', title: 'b', dueDate: '2026-01-10' }),
    ];
    const sorted = sortTodos(todos, NOW);
    expect(sorted[0].id).toBe('late');
  });

  it('同状态同日期：优先级 高>中>低', () => {
    const todos = [
      todo({ id: 'low', title: 'a', dueDate: '2026-01-20', priority: 'low' }),
      todo({ id: 'high', title: 'b', dueDate: '2026-01-20', priority: 'high' }),
      todo({ id: 'mid', title: 'c', dueDate: '2026-01-20', priority: 'medium' }),
    ];
    const sorted = sortTodos(todos, NOW);
    expect(sorted.map((t) => t.id)).toEqual(['high', 'mid', 'low']);
  });

  it('截止日期升序', () => {
    const todos = [
      todo({ id: 'later', title: 'a', dueDate: '2026-01-25' }),
      todo({ id: 'earlier', title: 'b', dueDate: '2026-01-17' }),
    ];
    const sorted = sortTodos(todos, NOW);
    expect(sorted[0].id).toBe('earlier');
  });

  it('无日期排在所有有日期之后', () => {
    const todos = [
      todo({ id: 'nodate', title: 'a' }),
      todo({ id: 'dated', title: 'b', dueDate: '2026-01-17' }),
    ];
    const sorted = sortTodos(todos, NOW);
    expect(sorted[0].id).toBe('dated');
  });
});
