import { projectStore } from '../../stores/project-store';
import { budgetStore } from '../../stores/budget-store';
import { todoStore } from '../../stores/todo-store';
import {
  getBudgetRiskInfo,
  type BudgetSummary,
} from '../../utils/budget-calculator';
import { isOverdue } from '../../utils/todo-sorter';
import { formatDueLabel } from '../../utils/date';
import {
  HOUSE_TYPE_LABELS,
  DECORATION_TYPE_LABELS,
  PRIORITY_LABELS,
  labelOf,
} from '../../utils/labels';
import type { IAppOption } from '../../types/app-types';
import type { Project } from '../../types/project';

interface HomeTodo {
  id: string;
  title: string;
  dueLabel: string;
  overdue: boolean;
  priority: string;
  priorityLabel: string;
}

interface HomeRisk {
  level: 'normal' | 'warning' | 'overspent';
  text: string;
}

interface BudgetVM {
  totalBudget: number;
  paidExpense: number;
  remaining: number;
  usageRate: number;
  riskLevel: string;
  riskText: string;
  barColor: string;
}

Page({
  data: {
    hasProject: false,
    projectName: '',
    areaLabel: '',
    metaLabel: '',
    progressPercent: 0,
    stageText: '',
    budget: null as BudgetVM | null,
    todos: [] as HomeTodo[],
    risks: [] as HomeRisk[],
    hasRisk: false,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    if (app && typeof app.onDataChange === 'function') {
      app.onDataChange(() => this.refresh());
    }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const project = projectStore.getCurrentProject();
    if (!project) {
      this.setData({ hasProject: false });
      return;
    }

    const progress = projectStore.getProgress(project.id);
    const stages = projectStore.getStages(project.id);
    const currentStage = stages.find((s) => s.id === project.currentStageId);
    const stageText = currentStage ? currentStage.name : stages[0]?.name || '未设置';

    const summary: BudgetSummary = budgetStore.getSummary(project.id, project.totalBudget);
    const risk = getBudgetRiskInfo(summary);
    const barColor =
      summary.riskLevel === 'overspent'
        ? '#ee0a24'
        : summary.riskLevel === 'warning'
          ? '#ff976a'
          : '#07c160';

    const budget: BudgetVM = {
      totalBudget: summary.totalBudget,
      paidExpense: summary.paidExpense,
      remaining: summary.remaining,
      usageRate: summary.usageRate,
      riskLevel: summary.riskLevel,
      riskText: risk.title,
      barColor,
    };

    const sorted = todoStore.getSorted(project.id);
    const todos: HomeTodo[] = sorted.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      dueLabel: formatDueLabel(t.dueDate),
      overdue: isOverdue(t),
      priority: t.priority,
      priorityLabel: labelOf(PRIORITY_LABELS, t.priority, '中'),
    }));

    // 风险聚合
    const risks: HomeRisk[] = [];
    if (summary.riskLevel !== 'normal') {
      risks.push({ level: summary.riskLevel, text: risk.title });
    }
    if (summary.commitmentExceeded) {
      risks.push({ level: 'warning', text: '已确认支出可能导致超支' });
    }
    if (budgetStore.isOverflow(project.id, project.totalBudget)) {
      risks.push({ level: 'warning', text: '分类预算合计超过总预算' });
    }
    const todoStats = todoStore.getStats(project.id);
    if (todoStats.overdue > 0) {
      risks.push({ level: 'warning', text: `${todoStats.overdue} 项待办已逾期` });
    }

    this.setData({
      hasProject: true,
      projectName: project.name,
      areaLabel: `${project.area}㎡`,
      metaLabel: `${labelOf(HOUSE_TYPE_LABELS, project.houseType, '新房')} · ${labelOf(
        DECORATION_TYPE_LABELS,
        project.decorationType,
        '暂不确定',
      )}`,
      progressPercent: progress.percent,
      stageText,
      budget,
      todos,
      risks,
      hasRisk: risks.length > 0,
    });
  },

  goCreateProject() {
    wx.navigateTo({ url: '/pages/project/create/create' });
  },
  goProject() {
    wx.switchTab({ url: '/pages/project/list/list' });
  },
  goBudget() {
    wx.switchTab({ url: '/pages/budget/overview/overview' });
  },
  goTodo() {
    wx.switchTab({ url: '/pages/todo/list/list' });
  },
  goDetail() {
    const project = projectStore.getCurrentProject();
    if (project) {
      wx.navigateTo({ url: `/pages/project/detail/detail?id=${project.id}` });
    }
  },
});
