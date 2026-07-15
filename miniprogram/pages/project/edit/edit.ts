import { projectStore } from '../../../stores/project-store';
import { validateProject } from '../../../utils/validator';
import { HOUSE_TYPE_LABELS, DECORATION_TYPE_LABELS } from '../../../utils/labels';
import type { HouseType, DecorationType, UpdateProjectInput } from '../../../types/project';

const HOUSE_TYPES = Object.keys(HOUSE_TYPE_LABELS);
const DECORATION_TYPES = Object.keys(DECORATION_TYPE_LABELS);

Page({
  data: {
    id: '',
    name: '',
    houseTypeIndex: 0,
    decorationTypeIndex: 3,
    area: '',
    address: '',
    startDate: '',
    plannedEndDate: '',
    totalBudget: '',
    houseTypeOptions: HOUSE_TYPES.map((k) => HOUSE_TYPE_LABELS[k]),
    decorationTypeOptions: DECORATION_TYPES.map((k) => DECORATION_TYPE_LABELS[k]),
    errors: {} as Record<string, string>,
  },

  onLoad(options: Record<string, string>) {
    const project = projectStore.getById(options.id || '');
    if (!project) {
      wx.showToast({ title: '项目不存在', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.setData({
      id: project.id,
      name: project.name,
      houseTypeIndex: Math.max(0, HOUSE_TYPES.indexOf(project.houseType)),
      decorationTypeIndex: Math.max(0, DECORATION_TYPES.indexOf(project.decorationType)),
      area: String(project.area),
      address: project.address || '',
      startDate: project.startDate,
      plannedEndDate: project.plannedEndDate || '',
      totalBudget: String(project.totalBudget),
    });
  },

  onNameInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ name: e.detail.value });
  },
  onAreaInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ area: e.detail.value });
  },
  onAddressInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ address: e.detail.value });
  },
  onBudgetInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ totalBudget: e.detail.value });
  },
  onHouseChange(e: WechatMiniprogram.CustomEvent<{ value: number | string }>) {
    this.setData({ houseTypeIndex: Number(e.detail.value) });
  },
  onDecorationChange(e: WechatMiniprogram.CustomEvent<{ value: number | string }>) {
    this.setData({ decorationTypeIndex: Number(e.detail.value) });
  },
  onStartChange(e: WechatMiniprogram.CustomEvent<{ value: number | string }>) {
    this.setData({ startDate: String(e.detail.value) });
  },
  onEndChange(e: WechatMiniprogram.CustomEvent<{ value: number | string }>) {
    this.setData({ plannedEndDate: String(e.detail.value) });
  },

  onSubmit() {
    const input: UpdateProjectInput = {
      name: this.data.name,
      houseType: HOUSE_TYPES[this.data.houseTypeIndex] as HouseType,
      decorationType: DECORATION_TYPES[this.data.decorationTypeIndex] as DecorationType,
      area: Number(this.data.area) || 0,
      address: this.data.address || undefined,
      startDate: this.data.startDate,
      plannedEndDate: this.data.plannedEndDate || undefined,
      totalBudget: Number(this.data.totalBudget) || 0,
    };
    const result = validateProject(input);
    if (!result.valid) {
      this.setData({ errors: result.errors });
      wx.showToast({ title: '请检查表单填写', icon: 'none' });
      return;
    }
    projectStore.update(this.data.id, input);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 500);
  },
});
