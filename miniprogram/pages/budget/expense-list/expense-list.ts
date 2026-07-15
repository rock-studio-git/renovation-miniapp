import { projectStore } from '../../../stores/project-store';
import { budgetStore } from '../../../stores/budget-store';
import { PAYMENT_STATUS_LABELS, labelOf } from '../../../utils/labels';
import type { PaymentStatus } from '../../../types/budget';

interface ExpenseItem {
  id: string;
  name: string;
  categoryName: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  paymentTheme: string;
  expenseDate: string;
}

interface IData {
  hasProject: boolean;
  expenses: ExpenseItem[];
  showDeleteDialog: boolean;
  pendingDeleteId: string;
}

interface IMethods {
  onShow(): void;
  refresh(): void;
  goCreate(): void;
  goDetail(e: WechatMiniprogram.TouchEvent): void;
  onDelete(e: WechatMiniprogram.TouchEvent): void;
  onCancelDelete(): void;
  onConfirmDelete(): void;
}

Page<IData, IMethods>({
  data: {
    hasProject: false,
    expenses: [],
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
    const list = budgetStore.getExpenses(current.id);
    const expenses: ExpenseItem[] = list.map((e) => {
      const cat = budgetStore.getCategoryById(e.categoryId);
      const status: PaymentStatus = e.paymentStatus;
      return {
        id: e.id,
        name: e.name,
        categoryName: cat ? cat.name : '未分类',
        amount: e.amount,
        paymentStatus: status,
        paymentStatusLabel: labelOf(PAYMENT_STATUS_LABELS, status),
        paymentTheme: status === 'paid' ? 'success' : 'warning',
        expenseDate: e.expenseDate,
      };
    });
    this.setData({ hasProject: true, expenses });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/budget/expense-create/expense-create' });
  },

  goDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/budget/expense-edit/expense-edit?id=${id}` });
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
    budgetStore.removeExpense(id);
    this.setData({ showDeleteDialog: false, pendingDeleteId: '' });
    wx.showToast({ title: '已删除', icon: 'success' });
    this.refresh();
  },
});
