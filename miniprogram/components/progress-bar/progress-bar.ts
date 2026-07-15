Component({
  options: { addGlobalClass: true },
  properties: {
    percent: { type: Number, value: 0 },
    color: { type: String, value: '#07c160' },
    trackColor: { type: String, value: '#ebedf0' },
    height: { type: Number, value: 12 },
  },
  data: { width: '0%' },
  observers: {
    percent(value: number) {
      const v = Math.max(0, Math.min(100, value || 0));
      this.setData({ width: v + '%' });
    },
  },
});
