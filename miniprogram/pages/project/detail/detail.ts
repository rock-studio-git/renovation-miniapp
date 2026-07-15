import { projectStore } from '../../../stores/project-store';
import { budgetStore } from '../../../stores/budget-store';
import { todoStore } from '../../../stores/todo-store';
import { getBudgetRiskInfo, type BudgetSummary } from '../../../utils/budget-calculator';
import { HOUSE_TYPE_LABELS, DECORATION_TYPE_LABELS, labelOf } from '../../../utils/labels';
import type { Project, Stage } from '../../../types/project';

interface BudgetRisk {
  level: string;
  title: string;
  desc: string;
}

Page({
  data: {
    id: '',
    project: null as Project | null,
    houseTypeLabel: '',
    decorationTypeLabel: '',
    startDateLabel: '',
    endDateLabel: '',
    stages: [] as Stage[],
    progress: { completed: 0, total: 0, percent: 0 },
    budget: null as BudgetSummary | null,
    budgetRisk: { level: 'normal', title: '', desc: '' } as BudgetRisk,
    todoStats: { pending: 0, completed: 0, overdue: 0 },
    isCurrent: false,
    showDeleteDialog: false,
  },

  onLoad(options: Record<string, string>) {
    this.setData({ id: options.id || '' });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const id = this.data.id;
    const project = projectStore.getById(id);
    if (!project) {
      wx.showToast({ title: '项目不存在', icon: 'none' });
      wx.navigateBack();
      return;
    }
    const stages = projectStore.getStages(id);
    const progress = projectStore.getProgress(id);
    const summary = budgetStore.getSummary(id, project.totalBudget);
    const risk = getBudgetRiskInfo(summary);
    const todoStats = todoStore.getStats(id);
    this.setData({
      project,
      houseTypeLabel: labelOf(HOUSE_TYPE_LABELS, project.houseType, '新房'),
      decorationTypeLabel: labelOf(DECORATION_TYPE_LABELS, project.decorationType, '暂不确定'),
      startDateLabel: project.startDate || '—',
      endDateLabel: project.plannedEndDate || '—',
      stages,
      progress,
      budget: summary,
      budgetRisk: risk,
      todoStats,
      isCurrent: projectStore.getCurrentProjectId() === id,
    });
  },

  onSelectStage(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
    const id = e.detail.id;
    projectStore.setStageStatus(id, 'in_progress');
    this.refresh();
  },

  goEdit() {
    wx.navigateTo({ url: `/pages/project/edit/edit?id=${this.data.id}` });
  },

  goBudget() {
    projectStore.setCurrentProject(this.data.id);
    wx.switchTab({ url: '/pages/budget/overview/overview' });
  },

  goTodo() {
    projectStore.setCurrentProject(this.data.id);
    wx.switchTab({ url: '/pages/todo/list/list' });
  },

  setCurrent() {
    projectStore.setCurrentProject(this.data.id);
    this.refresh();
    wx.showToast({ title: '已设为当前项目', icon: 'success' });
  },

  onDelete() {
    this.setData({ showDeleteDialog: true });
  },
  onCancelDelete() {
    this.setData({ showDeleteDialog: false });
  },
  onConfirmDelete() {
    projectStore.remove(this.data.id);
    this.setData({ showDeleteDialog: false });
    wx.showToast({ title: '已删除', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 500);
  },
});
