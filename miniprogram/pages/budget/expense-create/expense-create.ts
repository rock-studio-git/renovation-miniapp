import { projectStore } from '../../../stores/project-store';
import { budgetStore } from '../../../stores/budget-store';
import { validateExpense } from '../../../utils/validator';
import type { CreateExpenseInput, PaymentStatus } from '../../../types/budget';

interface CategoryOption {
  id: string;
  name: string;
}

interface StageOption {
  id: string;
  name: string;
}

interface IData {
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
}

interface IMethods {
  onLoad(): void;
  onName(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onAmount(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onPayee(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onNote(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onCategoryChange(e: WechatMiniprogram.CustomEvent<{ value: number }>): void;
  onStageChange(e: WechatMiniprogram.CustomEvent<{ value: number }>): void;
  onDateChange(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onPaymentChange(e: WechatMiniprogram.CustomEvent<{ value: string }>): void;
  onSubmit(): void;
}

function todayStr(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

Page<IData, IMethods>({
  data: {
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
  },

  onLoad() {
    const projectId = projectStore.getCurrentProjectId();
    if (!projectId) {
      wx.showToast({ title: '请先创建项目', icon: 'none' });
      wx.navigateBack();
      return;
    }
    const categories = budgetStore.getCategories(projectId);
    const stages = projectStore.getStages(projectId);
    const categoryOptions: CategoryOption[] = categories.map((c) => ({ id: c.id, name: c.name }));
    const stageOptions: StageOption[] = stages.map((s) => ({ id: s.id, name: s.name }));
    this.setData({
      hasProject: true,
      projectId,
      categoryOptions,
      categoryNames: categoryOptions.map((c) => c.name),
      categoryIndex: 0,
      selectedCategoryId: categoryOptions.length > 0 ? categoryOptions[0].id : '',
      stageOptions,
      stageNames: ['不关联阶段', ...stageOptions.map((s) => s.name)],
      stageIndex: 0,
      selectedStageId: '',
      date: todayStr(),
      paymentStatus: 'paid',
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
    const input: CreateExpenseInput = {
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
    budgetStore.createExpense(this.data.projectId, input);
    wx.showToast({ title: '已添加', icon: 'success' });
    wx.navigateBack();
  },
});
