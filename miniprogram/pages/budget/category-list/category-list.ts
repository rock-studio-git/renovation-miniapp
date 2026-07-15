import { projectStore } from '../../../stores/project-store';
import { budgetStore } from '../../../stores/budget-store';
import { isFiniteNumber } from '../../../utils/money';
import type { CategorySummary, RiskLevel } from '../../../utils/budget-calculator';

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
  categories: CategoryItem[];
  showAddForm: boolean;
  addName: string;
  addBudget: string;
  editingId: string;
  editName: string;
  editBudget: string;
  showDeleteDialog: boolean;
  pendingDeleteId: string;
}

interface IMethods {
  onShow(): void;
  refresh(): void;
  goCreateProject(): void;
  toggleAdd(): void;
  cancelAdd(): void;
  onAddName(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onAddBudget(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  saveAdd(): void;
  onEdit(e: WechatMiniprogram.TouchEvent): void;
  cancelEdit(): void;
  onEditName(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onEditBudget(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  saveEdit(): void;
  onDelete(e: WechatMiniprogram.TouchEvent): void;
  onCancelDelete(): void;
  onConfirmDelete(): void;
}

Page<IData, IMethods>({
  data: {
    hasProject: false,
    categories: [],
    showAddForm: false,
    addName: '',
    addBudget: '',
    editingId: '',
    editName: '',
    editBudget: '',
    showDeleteDialog: false,
    pendingDeleteId: '',
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const current = projectStore.getCurrentProject();
    if (!current) {
      this.setData({ hasProject: false });
      return;
    }
    const raw: CategorySummary[] = budgetStore.getCategorySummaries(current.id);
    const categories: CategoryItem[] = raw.map((c) => ({
      categoryId: c.categoryId,
      name: c.name,
      budgetAmount: c.budgetAmount,
      usedAmount: c.usedAmount,
      usageRate: c.usageRate,
      riskLevel: c.riskLevel,
      riskText: riskTextOf(c.riskLevel),
      progressColor: progressColorOf(c.riskLevel),
    }));
    this.setData({ hasProject: true, categories });
  },

  goCreateProject() {
    wx.switchTab({ url: '/pages/project/list/list' });
  },

  toggleAdd() {
    this.setData({ showAddForm: !this.data.showAddForm, addName: '', addBudget: '' });
  },

  cancelAdd() {
    this.setData({ showAddForm: false, addName: '', addBudget: '' });
  },

  onAddName(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ addName: e.detail.value });
  },

  onAddBudget(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ addBudget: e.detail.value });
  },

  saveAdd() {
    const current = projectStore.getCurrentProject();
    if (!current) {
      wx.showToast({ title: '请先创建项目', icon: 'none' });
      return;
    }
    const name = this.data.addName.trim();
    const budget = Number(this.data.addBudget);
    if (!name) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' });
      return;
    }
    if (!isFiniteNumber(budget) || budget < 0) {
      wx.showToast({ title: '预算金额无效', icon: 'none' });
      return;
    }
    budgetStore.createCategory(current.id, { name, budgetAmount: budget });
    this.setData({ showAddForm: false, addName: '', addBudget: '' });
    this.refresh();
  },

  onEdit(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const cat = this.data.categories.find((c) => c.categoryId === id);
    if (!cat) return;
    this.setData({
      editingId: id,
      editName: cat.name,
      editBudget: String(cat.budgetAmount),
    });
  },

  cancelEdit() {
    this.setData({ editingId: '', editName: '', editBudget: '' });
  },

  onEditName(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ editName: e.detail.value });
  },

  onEditBudget(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ editBudget: e.detail.value });
  },

  saveEdit() {
    const id = this.data.editingId;
    if (!id) return;
    const name = this.data.editName.trim();
    const budget = Number(this.data.editBudget);
    if (!name) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' });
      return;
    }
    if (!isFiniteNumber(budget) || budget < 0) {
      wx.showToast({ title: '预算金额无效', icon: 'none' });
      return;
    }
    budgetStore.updateCategory(id, { name, budgetAmount: budget });
    this.setData({ editingId: '', editName: '', editBudget: '' });
    this.refresh();
  },

  onDelete(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!budgetStore.canRemoveCategory(id)) {
      wx.showToast({ title: '该分类下存在支出，无法删除', icon: 'none' });
      return;
    }
    this.setData({ showDeleteDialog: true, pendingDeleteId: id });
  },

  onCancelDelete() {
    this.setData({ showDeleteDialog: false, pendingDeleteId: '' });
  },

  onConfirmDelete() {
    const id = this.data.pendingDeleteId;
    if (!id) return;
    if (!budgetStore.canRemoveCategory(id)) {
      wx.showToast({ title: '该分类下存在支出，无法删除', icon: 'none' });
      this.setData({ showDeleteDialog: false, pendingDeleteId: '' });
      return;
    }
    budgetStore.removeCategory(id);
    this.setData({ showDeleteDialog: false, pendingDeleteId: '' });
    wx.showToast({ title: '已删除', icon: 'success' });
    this.refresh();
  },
});
