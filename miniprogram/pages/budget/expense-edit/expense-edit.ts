import { projectStore } from '../../../stores/project-store';
import { budgetStore } from '../../../stores/budget-store';
import { validateExpense } from '../../../utils/validator';
import type { PaymentStatus, UpdateExpenseInput } from '../../../types/budget';

interface CategoryOption {
  id: string;
  name: string;
}

interface StageOption {
  id: string;
  name: string;
}

interface IData {
  id: string;
  hasProject: boolean;
  projectId: string;
  categoryOptions: CategoryOption[];
  categoryNames: string[];
  categoryIndex: number;
  selectedCategoryId: string;
  stageOptions: StageOption[];
  stageNames: string[];
  stageIndex: number;
  selectedStageId: string;
  name: string;
  amount: string;
  date: string;
  paymentStatus: PaymentStatus;
  payee: string;
  note: string;
  errors: Record<string, string>;
  showDeleteDialog: boolean;
}

interface IMethods {
  onLoad(options: Record<string, string>): void;
  onName(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onAmount(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onPayee(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onNote(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onCategoryChange(e: WechatMiniprogram.CustomEvent<{ value: number }>): void;
  onStageChange(e: WechatMiniprogram.CustomEvent<{ value: number }>): void;
  onDateChange(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onPaymentChange(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onSubmit(): void;
  onDelete(): void;
  onCancelDelete(): void;
  onConfirmDelete(): void;
}

Page<IData, IMethods>({
  data: {
    id: '',
    hasProject: false,
    projectId: '',
    categoryOptions: [],
    categoryNames: [],
    categoryIndex: 0,
    selectedCategoryId: '',
    stageOptions: [],
    stageNames: [],
    stageIndex: 0,
    selectedStageId: '',
    name: '',
    amount: '',
    date: '',
    paymentStatus: 'paid',
    payee: '',
    note: '',
    errors: {},
    showDeleteDialog: false,
  },

  onLoad(options: Record<string, string>) {
    const id = options.id;
    if (!id) {
      wx.showToast({ title: '缺少支出信息', icon: 'none' });
      wx.navigateBack();
      return;
    }
    const expense = budgetStore.getExpenseById(id);
    if (!expense) {
      wx.showToast({ title: '支出不存在', icon: 'none' });
      wx.navigateBack();
      return;
    }
    const projectId = expense.projectId;
    const categories = budgetStore.getCategories(projectId);
    const stages = projectStore.getStages(projectId);
    const catIndex = categories.findIndex((c) => c.id === expense.categoryId);
    const stageIndex = expense.stageId
      ? stages.findIndex((s) => s.id === expense.stageId)
      : -1;
    this.setData({
      id,
      projectId,
      hasProject: true,
      categoryOptions: categories.map((c) => ({ id: c.id, name: c.name })),
      categoryNames: categories.map((c) => c.name),
      categoryIndex: catIndex < 0 ? 0 : catIndex,
      selectedCategoryId: expense.categoryId,
      stageOptions: stages.map((s) => ({ id: s.id, name: s.name })),
      stageNames: ['不关联阶段', ...stages.map((s) => s.name)],
      stageIndex: stageIndex < 0 ? 0 : stageIndex + 1,
      selectedStageId: expense.stageId ?? '',
      name: expense.name,
      amount: String(expense.amount),
      date: expense.expenseDate,
      paymentStatus: expense.paymentStatus,
      payee: expense.payee ?? '',
      note: expense.note ?? '',
      errors: {},
    });
  },

  onName(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ name: e.detail.value });
  },

  onAmount(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ amount: e.detail.value });
  },

  onPayee(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ payee: e.detail.value });
  },

  onNote(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ note: e.detail.value });
  },

  onCategoryChange(e: WechatMiniprogram.CustomEvent<{ value: number }>) {
    const idx = e.detail.value;
    const opt = this.data.categoryOptions[idx];
    this.setData({ categoryIndex: idx, selectedCategoryId: opt ? opt.id : '' });
  },

  onStageChange(e: WechatMiniprogram.CustomEvent<{ value: number }>) {
    const idx = e.detail.value;
    const selectedStageId = idx === 0 ? '' : (this.data.stageOptions[idx - 1]?.id ?? '');
    this.setData({ stageIndex: idx, selectedStageId });
  },

  onDateChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ date: String(e.detail.value) });
  },

  onPaymentChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const v = e.detail.value;
    this.setData({ paymentStatus: v === 'unpaid' ? 'unpaid' : 'paid' });
  },

  onSubmit() {
    const amountNum = Number(this.data.amount);
    const input: UpdateExpenseInput = {
      categoryId: this.data.selectedCategoryId,
      stageId: this.data.selectedStageId || undefined,
      name: this.data.name,
      amount: amountNum,
      expenseDate: this.data.date,
      paymentStatus: this.data.paymentStatus,
      payee: this.data.payee || undefined,
      note: this.data.note || undefined,
    };
    const result = validateExpense(input);
    if (!result.valid) {
      this.setData({ errors: result.errors });
      const firstError =
        result.errors.name ||
        result.errors.categoryId ||
        result.errors.amount ||
        result.errors.expenseDate ||
        '请完善表单';
      wx.showToast({ title: firstError, icon: 'none' });
      return;
    }
    budgetStore.updateExpense(this.data.id, input);
    wx.showToast({ title: '已保存', icon: 'success' });
    wx.navigateBack();
  },

  onDelete() {
    this.setData({ showDeleteDialog: true });
  },

  onCancelDelete() {
    this.setData({ showDeleteDialog: false });
  },

  onConfirmDelete() {
    budgetStore.removeExpense(this.data.id);
    this.setData({ showDeleteDialog: false });
    wx.showToast({ title: '已删除', icon: 'success' });
    wx.navigateBack();
  },
});
