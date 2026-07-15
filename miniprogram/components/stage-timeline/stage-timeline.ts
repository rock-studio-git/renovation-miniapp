import type { Stage } from '../../types/project';

Component({
  options: { addGlobalClass: true },
  properties: {
    stages: { type: Array, value: [] as Stage[] },
    selectable: { type: Boolean, value: false },
  },
  methods: {
    onTap(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.selectable) return;
      const id = e.currentTarget.dataset.id as string;
      this.triggerEvent('select', { id });
    },
  },
});
