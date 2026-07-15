import { projectStore } from '../../../stores/project-store';
import { todoStore } from '../../../stores/todo-store';
import { TODO_GROUP_ORDER, type TodoGroupKey, type TodoGroups } from '../../../utils/todo-sorter';
import { PRIORITY_LABELS, labelOf } from '../../../utils/labels';
import { formatDueLabel } from '../../../utils/date';
import type { Todo, TodoPriority } from '../../../types/todo';

type TagTheme = 'danger' | 'warning' | 'default';

interface TodoItem {
  id: string;
  title: string;
  dueDate?: string;
  priority: TodoPriority;
  status: 'pending' | 'completed';
  note?: string;
  priorityLabel: string;
  priorityTheme: TagTheme;
  dueLabel: string;
  dueOverdue: boolean;
  completed: boolean;
}

interface TodoGroupView {
  key: TodoGroupKey;
  title: string;
  items: TodoItem[];
}

function priorityTheme(p: TodoPriority): TagTheme {
  if (p === 'high') return 'danger';
  if (p === 'medium') return 'warning';
  return 'default';
}

function toItem(t: Todo): TodoItem {
  const dueLabel = formatDueLabel(t.dueDate);
  return {
    id: t.id,
    title: t.title,
    dueDate: t.dueDate,
    priority: t.priority,
    status: t.status,
    note: t.note,
    priorityLabel: labelOf(PRIORITY_LABELS, t.priority, '中'),
    priorityTheme: priorityTheme(t.priority),
    dueLabel,
    dueOverdue: dueLabel.startsWith('逾期'),
    completed: t.status === 'completed',
  };
}

Page({
  data: {
    hasProject: false,
    groups: [] as TodoGroupView[],
    showDeleteDialog: false,
    pendingDeleteId: '',
    emptyAll: true,
  },

  onShow() {
    todoStore.init();
    projectStore.init();
    this.refresh();
  },

  refresh() {
    const projectId = projectStore.getCurrentProjectId();
    if (!projectId) {
      this.setData({ hasProject: false, groups: [], emptyAll: true });
      return;
    }
    const groupsRaw: TodoGroups = todoStore.getGroups(projectId);
    const stats = todoStore.getStats(projectId);
    const groups: TodoGroupView[] = TODO_GROUP_ORDER.map((g) => ({
      key: g.key,
      title: g.title,
      items: groupsRaw[g.key].map(toItem),
    })).filter((g) => g.items.length > 0);
    this.setData({
      hasProject: true,
      groups,
      emptyAll: stats.pending === 0 && stats.completed === 0,
    });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/todo/create/create' });
  },

  goProject() {
    wx.switchTab({ url: '/pages/project/list/list' });
  },

  onItemTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/todo/edit/edit?id=${id}` });
  },

  onToggle(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    todoStore.toggleStatus(id);
    this.refresh();
  },

  onDelete(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    this.setData({ showDeleteDialog: true, pendingDeleteId: id });
  },

  onCancelDelete() {
    this.setData({ showDeleteDialog: false, pendingDeleteId: '' });
  },

  onConfirmDelete() {
    const id = this.data.pendingDeleteId;
    if (!id) return;
    todoStore.remove(id);
    this.setData({ showDeleteDialog: false, pendingDeleteId: '' });
    wx.showToast({ title: '已删除', icon: 'success' });
    this.refresh();
  },
});
