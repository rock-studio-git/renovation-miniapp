import { projectStore } from '../../../stores/project-store';
import { todoStore } from '../../../stores/todo-store';
import { validateTodo } from '../../../utils/validator';
import type { CreateTodoInput, TodoPriority, UpdateTodoInput } from '../../../types/todo';
import type { Stage } from '../../../types/project';

const PRIORITIES: { label: string; value: TodoPriority }[] = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

Page({
  data: {
    id: '',
    projectId: '',
    title: '',
    stageOptions: ['不指定阶段'] as string[],
    stageIds: [] as string[],
    stageIndex: 0,
    dueDate: '',
    priorityOptions: PRIORITIES,
    priority: 'medium' as TodoPriority,
    note: '',
    completed: false,
    toggleLabel: '标记完成',
    showDeleteDialog: false,
    errors: {} as Record<string, string>,
  },

  onLoad(options: Record<string, string | undefined>) {
    todoStore.init();
    projectStore.init();
    const id = options.id ?? '';
    const todo = todoStore.getById(id);
    if (!todo) {
      wx.showToast({ title: '待办不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const projectId = todo.projectId;
    const stages: Stage[] = projectStore.getStages(projectId);
    const stageOptions = ['不指定阶段', ...stages.map((s) => s.name)];
    const stageIds = stages.map((s) => s.id);
    const matched = todo.stageId ? stageIds.indexOf(todo.stageId) : -1;
    this.setData({
      id,
      projectId,
      title: todo.title,
      stageOptions,
      stageIds,
      stageIndex: matched >= 0 ? matched + 1 : 0,
      dueDate: todo.dueDate ?? '',
      priority: todo.priority,
      note: todo.note ?? '',
      completed: todo.status === 'completed',
      toggleLabel: todo.status === 'completed' ? '标记为待办' : '标记完成',
    });
  },

  onTitleInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ title: e.detail.value });
  },

  onNoteInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ note: e.detail.value });
  },

  onStageChange(e: WechatMiniprogram.CustomEvent<{ value: number | string }>) {
    this.setData({ stageIndex: Number(e.detail.value) });
  },

  onDueChange(e: WechatMiniprogram.CustomEvent<{ value: number | string }>) {
    this.setData({ dueDate: String(e.detail.value) });
  },

  onPriorityChange(e: WechatMiniprogram.CustomEvent<{ value: TodoPriority }>) {
    this.setData({ priority: e.detail.value });
  },

  buildInput(): UpdateTodoInput {
    return {
      title: this.data.title,
      priority: this.data.priority,
      stageId: this.data.stageIndex === 0 ? undefined : this.data.stageIds[this.data.stageIndex - 1],
      dueDate: this.data.dueDate || undefined,
      note: this.data.note || undefined,
    };
  },

  onSave() {
    const input = this.buildInput();
    const result = validateTodo(input as CreateTodoInput);
    if (!result.valid) {
      this.setData({ errors: result.errors });
      wx.showToast({ title: result.errors.title || '请检查表单', icon: 'none' });
      return;
    }
    todoStore.update(this.data.id, input);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },

  onToggle() {
    if (!this.data.id) return;
    const updated = todoStore.toggleStatus(this.data.id);
    this.setData({
      completed: updated.status === 'completed',
      toggleLabel: updated.status === 'completed' ? '标记为待办' : '标记完成',
    });
  },

  onDelete() {
    this.setData({ showDeleteDialog: true });
  },

  onCancelDelete() {
    this.setData({ showDeleteDialog: false });
  },

  onConfirmDelete() {
    if (!this.data.id) return;
    todoStore.remove(this.data.id);
    this.setData({ showDeleteDialog: false });
    wx.showToast({ title: '已删除', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },
});
