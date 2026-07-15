// 待办 Store：待办 的 CRUD、排序与分组
// 排序/分组复用纯函数 todo-sorter

import type { Todo, TodoStatus, CreateTodoInput, UpdateTodoInput } from '../types/todo';
import { generateId } from '../utils/id';
import { nowISO } from '../utils/date';
import { loadArray, saveArray } from './storage';
import { notifyDataChange } from './notify';
import { sortTodos, groupTodos, isOverdue, type TodoGroups } from '../utils/todo-sorter';

export interface TodoStats {
  pending: number;
  completed: number;
  overdue: number;
}

class TodoStore {
  private todos: Todo[] = [];
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.todos = loadArray<Todo>('todos');
    this.initialized = true;
  }

  private persist(): void {
    saveArray('todos', this.todos);
  }

  getTodos(projectId: string): Todo[] {
    return this.todos.filter((t) => t.projectId === projectId);
  }

  getById(id: string): Todo | undefined {
    return this.todos.find((t) => t.id === id);
  }

  create(projectId: string, input: CreateTodoInput): Todo {
    const now = nowISO();
    const todo: Todo = {
      id: generateId('t'),
      projectId,
      stageId: input.stageId,
      title: input.title.trim(),
      dueDate: input.dueDate,
      priority: input.priority,
      status: 'pending',
      note: input.note,
      createdAt: now,
      updatedAt: now,
    };
    this.todos.push(todo);
    this.persist();
    notifyDataChange('todo');
    return todo;
  }

  update(id: string, input: UpdateTodoInput): Todo {
    const todo = this.getById(id);
    if (!todo) throw new Error('待办不存在');
    if (input.stageId !== undefined) todo.stageId = input.stageId;
    if (input.title !== undefined) todo.title = input.title.trim();
    if (input.dueDate !== undefined) todo.dueDate = input.dueDate;
    if (input.priority !== undefined) todo.priority = input.priority;
    if (input.note !== undefined) todo.note = input.note;
    if (input.status !== undefined) this.applyStatus(todo, input.status);
    todo.updatedAt = nowISO();
    this.persist();
    notifyDataChange('todo');
    return todo;
  }

  /** 切换完成状态 */
  toggleStatus(id: string): Todo {
    const todo = this.getById(id);
    if (!todo) throw new Error('待办不存在');
    const next: TodoStatus = todo.status === 'pending' ? 'completed' : 'pending';
    this.applyStatus(todo, next);
    todo.updatedAt = nowISO();
    this.persist();
    notifyDataChange('todo');
    return todo;
  }

  private applyStatus(todo: Todo, status: TodoStatus): void {
    todo.status = status;
    if (status === 'completed') {
      todo.completedAt = todo.completedAt || nowISO();
    } else {
      todo.completedAt = undefined;
    }
  }

  remove(id: string): void {
    this.todos = this.todos.filter((t) => t.id !== id);
    this.persist();
    notifyDataChange('todo');
  }

  /** 排序后的待办（默认升序，今日/逾期优先） */
  getSorted(projectId: string, now?: Date): Todo[] {
    return sortTodos(this.getTodos(projectId), now);
  }

  /** 分组后的待办 */
  getGroups(projectId: string, now?: Date): TodoGroups {
    return groupTodos(this.getTodos(projectId), now);
  }

  getStats(projectId: string): TodoStats {
    const todos = this.getTodos(projectId);
    const pending = todos.filter((t) => t.status === 'pending');
    return {
      pending: pending.length,
      completed: todos.length - pending.length,
      overdue: pending.filter((t) => isOverdue(t)).length,
    };
  }

  /** 级联删除 */
  removeByProject(projectId: string): void {
    this.todos = this.todos.filter((t) => t.projectId !== projectId);
    this.persist();
  }
}

export const todoStore = new TodoStore();
