import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/ui/panel-state.part.js', import.meta.url), 'utf8');
const start = source.indexOf('  function updatePanelPlacement()');
const end = source.indexOf('  function getMobileBadgeHandleTop', start);
assert.ok(start >= 0 && end > start, '找不到面板定位与调整宽度逻辑');

const handles = ['left', 'right'].map((edge) => ({
  edge,
  listeners: new Map(),
  getAttribute: () => edge,
  addEventListener(type, listener) { this.listeners.set(type, listener); },
  setPointerCapture() {}, releasePointerCapture() {},
  emit(type, clientX) {
    this.listeners.get(type)({
      type, clientX, pointerId: 1, button: 0,
      preventDefault() {}, stopPropagation() {},
    });
  },
}));
const panel = {
  style: { width: '', left: '', right: '', top: '', bottom: '' },
  querySelectorAll: () => handles,
  getBoundingClientRect() {
    const left = Number.parseFloat(this.style.left) || 0;
    const width = Number.parseFloat(this.style.width) || 520;
    return { left, right: left + width, width };
  },
};
let mobile = false;
const writes = [];
const state = {
  panelEl: panel, badgeEl: { getBoundingClientRect: () => ({ left: 720, right: 760 }) },
  rootEl: { classList: { contains: () => mobile, toggle() {}, remove() {} } },
  settings: { panelWidth: 520 }, panelOpen: true,
};
const api = vm.runInNewContext(`(() => {
${source.slice(start, end)}
  return { updatePanelPlacement, makePanelResizable };
})()`, {
  state, window: { innerWidth: 1000 }, DEFAULT_SETTINGS: { panelWidth: 520 },
  clampInt: (value, min, max, fallback) => Math.min(max, Math.max(min, Number(value) || fallback)),
  isMobileBadgeViewport: () => mobile,
  queueSettingsPersist: (keys) => writes.push(keys),
});

api.updatePanelPlacement();
assert.equal(panel.style.width, '520px');
assert.equal(panel.style.left, '240px');
api.makePanelResizable();
handles[1].emit('pointerdown', 760);
handles[1].emit('pointermove', 1260);
handles[1].emit('pointerup', 1260);
assert.equal(state.settings.panelWidth, 748, '向右拉伸应受视口右边界限制');
assert.equal(writes.length, 1, '松开后应保存新宽度');

api.updatePanelPlacement();
handles[0].emit('pointerdown', 12);
handles[0].emit('pointermove', 512);
handles[0].emit('pointerup', 512);
assert.equal(state.settings.panelWidth, 420, '向内收缩不能低于 420px');
assert.equal(panel.style.left, '340px', '拖动左边缘时右边缘应保持原位');
assert.equal(writes.length, 2);

mobile = true;
api.updatePanelPlacement();
assert.equal(panel.style.width, '', '移动端应恢复原有自适应宽度');
handles[1].emit('pointerdown', 760);
handles[1].emit('pointermove', 900);
handles[1].emit('pointerup', 900);
assert.equal(writes.length, 2, '移动端不应触发拖动保存');

console.log('Desktop panel resizes within viewport and persists width; mobile layout stays fluid.');
