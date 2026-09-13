import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/features/adult-spam.part.js', import.meta.url), 'utf8');
const start = source.indexOf('  function setAdultSpamHidden');
const end = source.indexOf('  function sweepAdultSpam');
assert.ok(start >= 0 && end > start, '找不到内容净化隐藏状态逻辑');
const block = source.slice(start, end);
let documentScans = 0;
const api = vm.runInNewContext(`(() => {
  const adultSpamHiddenArticles = new Set();
  const adultSpamSessionHiddenIds = new Set();
  const adultSpamScannedIds = new Set();
  const followedHandles = new Set();
  let adultSpamSessionHiddenIdsCapped = false;
  let adultSpamScannedIdsCapped = false;
  const state = { adultSpamCountEl: { textContent: '' } };
  const document = { querySelectorAll() { documentScans++; return []; } };
  const uiText = (value) => value;
  const debugLog = () => {};
${block}
  return { state, adultSpamHiddenArticles, setAdultSpamHidden, updateAdultSpamCount, unhideAdultSpam };
})()`, { documentScans });

function article() {
  const classes = new Set();
  return {
    isConnected: true,
    dataset: {},
    classList: {
      add(value) { classes.add(value); },
      remove(value) { classes.delete(value); },
      contains(value) { return classes.has(value); },
    },
  };
}

const first = article();
assert.deepEqual(
  JSON.parse(JSON.stringify(api.setAdultSpamHidden(first, { hidden: true, score: 8, reasons: ['测试'] }))),
  { hidden: true, changed: true }
);
api.updateAdultSpamCount();
assert.match(api.state.adultSpamCountEl.textContent, /^当前隐藏 1 ·/);
assert.equal(api.adultSpamHiddenArticles.size, 1);

assert.equal(api.setAdultSpamHidden(first, { hidden: true, score: 8, reasons: ['测试'] }).changed, false);
api.unhideAdultSpam();
assert.equal(first.classList.contains('BetterX-adult-spam-hidden'), false);
assert.match(api.state.adultSpamCountEl.textContent, /^当前隐藏 0 ·/);

const detached = article();
api.setAdultSpamHidden(detached, { hidden: true, score: 8, reasons: ['测试'] });
detached.isConnected = false;
api.updateAdultSpamCount();
assert.equal(detached.classList.contains('BetterX-adult-spam-hidden'), false, '脱离 DOM 的节点应解除标记并释放引用');
assert.equal(api.adultSpamHiddenArticles.size, 0);

console.log('Adult-spam hidden count uses tracked nodes without a document-wide scan.');
