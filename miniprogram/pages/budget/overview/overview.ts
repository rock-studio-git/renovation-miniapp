import { projectStore } from '../../../stores/project-store';
import { budgetStore } from '../../../stores/budget-store';
import {
  getBudgetRiskInfo,
  type BudgetSummary,
  type CategorySummary,
  type RiskLevel,
} from '../../../utils/budget-calculator';

interface CategoryItem {
  categoryId: string;
  name: string;
  budgetAmount: number;
  usedAmount: number;
  usageRate: number;
  riskLevel: RiskLevel;
  riskText: string;
  progressColor: string;
}

function riskTextOf(level: RiskLevel): string {
  if (level === 'overspent') return '超支';
  if (level === 'warning') return '接近上限';
  return '健康';
}

function progressColorOf(level: RiskLevel): string {
  if (level === 'overspent') return '#ee0a24';
  if (level === 'warning') return '#ff976a';
  return '#07c160';
}

interface IData {
  hasProject: boolean;
  currentProjectName: string;
  totalBudget: number;
  paidExpense: number;
  remaining: number;
  usageRate: number;
  progressColor: string;
  riskLevel: RiskLevel;
  riskTitle: string;
  commitmentExceeded: boolean;
  isOverflow: boolean;
  categories: CategoryItem[];
  projectNames: string[];
  projectIndex: number;
}

interface IMethods {
  onShow(): void;
  refresh(): void;
  onProjectChange(e: WechatMiniprogram.CustomEvent<{ value: number }>): void;
  goCategoryList(): void;
  goExpenseList(): void;
  goCreateProject(): void;
}

Page<IData, IMethods>({
  data: {
    hasProject: false,
    currentProjectName: '',
    totalBudget: 0,
    paidExpense: 0,
    remaining: 0,
    usageRate: 0,
    progressColor: '#07c160',
    riskLevel: 'normal',
    riskTitle: '预算健康',
    commitmentExceeded: false,
    isOverflow: false,
    categories: [],
    projectNames: [],
    projectIndex: 0,
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const current = projectStore.getCurrentProject();
    if (!current) {
      this.setData({
        hasProject: false,
        projectNames: projectStore.getAll().map((p) => p.name),
      });
      return;
    }
    const projectId = current.id;
    const summary: BudgetSummary = budgetStore.getSummary(projectId, current.totalBudget);
    const risk = getBudgetRiskInfo(summary);
    const rawCategories: CategorySummary[] = budgetStore.getCategorySummaries(projectId);
    const categories: CategoryItem[] = rawCategories.map((c) => ({
      categoryId: c.categoryId,
      name: c.name,
      budgetAmount: c.budgetAmount,
      usedAmount: c.usedAmount,
      usageRate: c.usageRate,
      riskLevel: c.riskLevel,
      riskText: riskTextOf(c.riskLevel),
      progressColor: progressColorOf(c.riskLevel),
    }));
    const projects = projectStore.getAll();
    const projectIndex = projects.findIndex((p) => p.id === projectId);
    this.setData({
      hasProject: true,
      currentProjectName: current.name,
      totalBudget: summary.totalBudget,
      paidExpense: summary.paidExpense,
      remaining: summary.remaining,
      usageRate: summary.usageRate,
      progressColor: progressColorOf(summary.riskLevel),
      riskLevel: summary.riskLevel,
      riskTitle: risk.title,
      commitmentExceeded: summary.commitmentExceeded,
      isOverflow: budgetStore.isOverflow(projectId, current.totalBudget),
      categories,
      projectNames: projects.map((p) => p.name),
      projectIndex: projectIndex < 0 ? 0 : projectIndex,
    });
  },

  onProjectChange(e: WechatMiniprogram.CustomEvent<{ value: number }>) {
    const index = e.detail.value;
    const projects = projectStore.getAll();
    const proj = projects[index];
    if (proj) {
      projectStore.setCurrentProject(proj.id);
      this.refresh();
    }
  },

  goCategoryList() {
    wx.navigateTo({ url: '/pages/budget/category-list/category-list' });
  },

  goExpenseList() {
    wx.navigateTo({ url: '/pages/budget/expense-list/expense-list' });
  },

  goCreateProject() {
    wx.switchTab({ url: '/pages/project/list/list' });
  },
});
