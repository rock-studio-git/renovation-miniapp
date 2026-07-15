import { projectStore } from '../../../stores/project-store';
import { budgetStore } from '../../../stores/budget-store';
import { getBudgetRiskInfo } from '../../../utils/budget-calculator';
import { DECORATION_TYPE_LABELS, labelOf } from '../../../utils/labels';
import type { Project } from '../../../types/project';

interface ProjectItem extends Project {
  decorationTypeLabel: string;
  progressPercent: number;
  budgetUsage: number;
  riskLevel: string;
  riskText: string;
  isCurrent: boolean;
}

Page({
  data: {
    projects: [] as ProjectItem[],
    showDeleteDialog: false,
    pendingDeleteId: '',
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const currentId = projectStore.getCurrentProjectId();
    const items: ProjectItem[] = projectStore.getAll().map((p) => {
      const progress = projectStore.getProgress(p.id);
      const summary = budgetStore.getSummary(p.id, p.totalBudget);
      const risk = getBudgetRiskInfo(summary);
      return {
        ...p,
        decorationTypeLabel: labelOf(DECORATION_TYPE_LABELS, p.decorationType, '暂不确定'),
        progressPercent: progress.percent,
        budgetUsage: summary.usageRate,
        riskLevel: summary.riskLevel,
        riskText: risk.title,
        isCurrent: p.id === currentId,
      };
    });
    this.setData({ projects: items });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/project/create/create' });
  },

  goDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/project/detail/detail?id=${id}` });
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
    projectStore.remove(id);
    this.setData({ showDeleteDialog: false, pendingDeleteId: '' });
    wx.showToast({ title: '已删除', icon: 'success' });
    this.refresh();
  },
});
