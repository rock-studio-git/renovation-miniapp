// 待办排序与分组引擎（纯函数，无副作用，便于单元测试）
// 对齐 PRD 7.3.3 排序与分组规则

import type { Todo, TodoPriority } from '../types/todo';
import { parseDate, startOfDay, isToday, isWithinThisWeek, isOverdueDate } from './date';

const PRIORITY_WEIGHT: Record<TodoPriority, number> = { high: 3, medium: 2, low: 1 };

export type TodoGroupKey = 'overdue' | 'today' | 'this_week' | 'future' | 'no_date' | 'completed';

export interface TodoGroups {
  overdue: Todo[];
  today: Todo[];
  this_week: Todo[];
  future: Todo[];
  no_date: Todo[];
  completed: Todo[];
}

/** 分组展示顺序（对齐 PRD 7.3.3） */
export const TODO_GROUP_ORDER: { key: TodoGroupKey; title: string }[] = [
  { key: 'today', title: '今日待办' },
  { key: 'this_week', title: '本周待办' },
  { key: 'future', title: '未来待办' },
  { key: 'overdue', title: '已逾期待办' },
  { key: 'no_date', title: '无日期待办' },
  { key: 'completed', title: '已完成待办' },
];

/**
 * 是否逾期（未完成且截止日期早于今天）
 */
export function isOverdue(todo: Todo, now: Date = new Date()): boolean {
  if (todo.status === 'completed') return false;
  const d = parseDate(todo.dueDate);
  return d !== null && isOverdueDate(d, now);
}

function comparePending(a: Todo, b: Todo, now: Date): number {
  // 规则2：已逾期优先
  const ao = isOverdue(a, now);
  const bo = isOverdue(b, now);
  if (ao !== bo) return ao ? -1 : 1;

  const ad = parseDate(a.dueDate);
  const bd = parseDate(b.dueDate);
  // 规则3：截止日期升序；无日期排最后
  if (ad && bd) {
    const diff = startOfDay(ad).getTime() - startOfDay(bd).getTime();
    if (diff !== 0) return diff;
  } else if (ad && !bd) {
    return -1;
  } else if (!ad && bd) {
    return 1;
  }
  // 规则4：同日期按优先级 高>中>低
  const pw = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  if (pw !== 0) return pw;
  // 兜底：创建时间升序
  if (a.createdAt < b.createdAt) return -1;
  if (a.createdAt > b.createdAt) return 1;
  return 0;
}

/**
 * 排序：未完成 > 已完成；未完成内 逾期优先 → 日期升序 → 优先级降序
 */
export function sortTodos(todos: Todo[], now: Date = new Date()): Todo[] {
  const pending = todos
    .filter((t) => t.status === 'pending')
    .slice()
    .sort((a, b) => comparePending(a, b, now));

  const completed = todos
    .filter((t) => t.status === 'completed')
    .slice()
    .sort((a, b) => {
      const at = a.completedAt || a.updatedAt || a.createdAt;
      const bt = b.completedAt || b.updatedAt || b.createdAt;
      if (at > bt) return -1;
      if (at < bt) return 1;
      return 0;
    });

  return [...pending, ...completed];
}

function sortGroup(list: Todo[], now: Date): Todo[] {
  return list.slice().sort((a, b) => comparePending(a, b, now));
}

/**
 * 分组：今日 / 本周 / 未来 / 逾期 / 无日期 / 已完成
 */
export function groupTodos(todos: Todo[], now: Date = new Date()): TodoGroups {
  const groups: TodoGroups = {
    overdue: [],
    today: [],
    this_week: [],
    future: [],
    no_date: [],
    completed: [],
  };

  for (const t of todos) {
    if (t.status === 'completed') {
      groups.completed.push(t);
      continue;
    }
    const d = parseDate(t.dueDate);
    if (!d) {
      groups.no_date.push(t);
      continue;
    }
    if (isOverdueDate(d, now)) {
      groups.overdue.push(t);
    } else if (isToday(d, now)) {
      groups.today.push(t);
    } else if (isWithinThisWeek(d, now)) {
      groups.this_week.push(t);
    } else {
      groups.future.push(t);
    }
  }

  // 组内保持排序
  groups.overdue = sortGroup(groups.overdue, now);
  groups.today = sortGroup(groups.today, now);
  groups.this_week = sortGroup(groups.this_week, now);
  groups.future = sortGroup(groups.future, now);
  groups.no_date = sortGroup(groups.no_date, now);
  groups.completed = groups.completed.slice().sort((a, b) => {
    const at = a.completedAt || a.updatedAt || a.createdAt;
    const bt = b.completedAt || b.updatedAt || b.createdAt;
    if (at > bt) return -1;
    if (at < bt) return 1;
    return 0;
  });

  return groups;
}
