import { formatMoney } from '../../utils/money';

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: Number, value: 0 },
    symbol: { type: Boolean, value: true },
    size: { type: String, value: 'md' }, // sm | md | lg
    color: { type: String, value: '' },
    bold: { type: Boolean, value: true },
  },
  data: { display: '¥0.00' },
  observers: {
    'value,symbol'(value: number, symbol: boolean) {
      this.setData({ display: formatMoney(value, symbol) });
    },
  },
  lifetimes: {
    attached() {
      this.setData({ display: formatMoney(this.data.value, this.data.symbol) });
    },
  },
});
