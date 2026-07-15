import { projectStore } from '../../../stores/project-store';
import { todoStore } from '../../../stores/todo-store';
import { validateTodo } from '../../../utils/validator';
import type { CreateTodoInput, TodoPriority } from '../../../types/todo';
import type { Stage } from '../../../types/project';

const PRIORITIES: { label: string; value: TodoPriority }[] = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

Page({
  data: {
    projectId: '',
    title: '',
    stageOptions: ['不指定阶段'] as string[],
    stageIds: [] as string[],
    stageIndex: 0,
    dueDate: '',
    priorityOptions: PRIORITIES,
    priority: 'medium' as TodoPriority,
    note: '',
    errors: {} as Record<string, string>,
  },

  onLoad() {
    todoStore.init();
    projectStore.init();
    const projectId = projectStore.getCurrentProjectId();
    if (!projectId) {
      wx.showToast({ title: '请先创建项目', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const stages: Stage[] = projectStore.getStages(projectId);
    const stageOptions = ['不指定阶段', ...stages.map((s) => s.name)];
    const stageIds = stages.map((s) => s.id);
    this.setData({ projectId, stageOptions, stageIds });
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

  onSubmit() {
    const input: CreateTodoInput = {
      title: this.data.title,
      priority: this.data.priority,
      stageId: this.data.stageIndex === 0 ? undefined : this.data.stageIds[this.data.stageIndex - 1],
      dueDate: this.data.dueDate || undefined,
      note: this.data.note || undefined,
    };
    const result = validateTodo(input);
    if (!result.valid) {
      this.setData({ errors: result.errors });
      wx.showToast({ title: result.errors.title || '请检查表单', icon: 'none' });
      return;
    }
    todoStore.create(this.data.projectId, input);
    wx.showToast({ title: '创建成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },
});
