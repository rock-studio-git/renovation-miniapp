Component({
  options: { addGlobalClass: true },
  properties: {
    level: { type: String, value: 'normal' }, // normal | warning | overspent
    text: { type: String, value: '' },
  },
});
