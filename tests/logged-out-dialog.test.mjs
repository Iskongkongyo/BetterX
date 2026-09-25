import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const featureSource = await readFile(new URL('../src/features/media-age-dialogs.part.js', import.meta.url), 'utf8');
const observerSource = await readFile(new URL('../src/core/observers-lifecycle.part.js', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('../src/main.part.js', import.meta.url), 'utf8');
const start = featureSource.indexOf('  const LOGGED_OUT_POST_DIALOG_SELECTOR');
const end = featureSource.indexOf('  let xvToastTimer', start);
assert.ok(start >= 0 && end > start, '找不到未登录看帖弹窗处理逻辑');

let clickCount = 0;
let dialogState = 'open';
const dismissButton = {
  disabled: false,
  getAttribute: () => null,
  click() {
    clickCount++;
    // 第一次模拟 React 尚未水合；第二次才真正关闭并解除页面滚动锁。
    if (clickCount >= 2) {
      dialogState = 'closed';
      dialog.isConnected = false;
    }
  },
};
const panel = {};
const dialog = {
  isConnected: true,
  getAttribute: (name) => name === 'data-state' ? dialogState : null,
  matches: (selector) => selector.includes('app-store-obstruction'),
  closest: () => null,
  querySelectorAll: () => [],
  querySelector(selector) {
    if (selector === '[data-interaction="app-store-obstruction-panel"]') return panel;
    if (selector === 'button[data-slot="xds-button"][aria-label="Dismiss"]') return dismissButton;
    return null;
  },
};
const root = {
  matches: () => false,
  closest: () => null,
  querySelectorAll(selector) {
    return selector.includes('app-store-obstruction') ? [dialog] : [];
  },
};
const api = vm.runInNewContext(`(() => {
${featureSource.slice(start, end)}
  return { dismissLoggedOutPostObstructions };
})()`, { console, setTimeout, clearTimeout });

assert.equal(api.dismissLoggedOutPostObstructions(root), 1);
assert.equal(clickCount, 1, '应模拟点击专用弹窗的关闭按钮');
assert.equal(api.dismissLoggedOutPostObstructions(root), 0);
assert.equal(clickCount, 1, '重试计时器存在时不应并发点击');
await new Promise((resolve) => setTimeout(resolve, 500));
assert.equal(clickCount, 2, 'React 尚未水合时应自动重试关闭按钮');
assert.equal(dialogState, 'closed');

const unrelatedDialog = {
  ...dialog,
  querySelector: () => null,
};
const unrelatedRoot = { ...root, querySelectorAll: () => [unrelatedDialog] };
assert.equal(api.dismissLoggedOutPostObstructions(unrelatedRoot), 0, '不应关闭缺少专用内容层的其他弹窗');

assert.match(observerSource, /dismissLoggedOutPostObstructions\(node\)/,
  '动态出现的未登录看帖弹窗应立即处理');
assert.match(mainSource, /startObserver\(\);[\s\S]*dismissLoggedOutPostObstructions\(document\)/,
  '启动时已经存在的未登录看帖弹窗也应处理');
assert.match(await readFile(new URL('../src/00-bootstrap-i18n.part.js', import.meta.url), 'utf8'),
  /@match\s+https:\/\/m\.x\.com\/\*/,
  '移动端未登录页面也应进入脚本匹配范围');

console.log('Logged-out post obstruction retries after hydration without affecting unrelated dialogs.');
