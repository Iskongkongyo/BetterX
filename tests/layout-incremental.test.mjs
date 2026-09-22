import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const layoutSource = await readFile(new URL('../src/features/ads-layout.part.js', import.meta.url), 'utf8');
const observerSource = await readFile(new URL('../src/core/observers-lifecycle.part.js', import.meta.url), 'utf8');
const start = layoutSource.indexOf('  function getLayoutScopeElements');
const end = layoutSource.indexOf('  function applyLayoutDomCleanup');
assert.ok(start >= 0 && end > start, '找不到布局增量范围函数');
const block = layoutSource.slice(start, end);
const api = vm.runInNewContext(`(() => {
  const document = {};
  const LAYOUT_STRUCTURE_SELECTOR = 'main, header[role="banner"], [data-testid="primaryColumn"]';
${block}
  return { getLayoutScopeElements, layoutRootAffectsStructure };
})()`);

const descendant = { id: 'descendant' };
const ancestor = { id: 'ancestor' };
const root = {
  querySelectorAll: () => [descendant],
  querySelector: () => null,
  matches: () => false,
  closest: () => ancestor,
};
assert.deepEqual(
  Array.from(api.getLayoutScopeElements(root, '.target'), (item) => item.id).sort(),
  ['ancestor', 'descendant'],
  '增量范围应覆盖匹配祖先与后代'
);
assert.equal(api.layoutRootAffectsStructure(root), false);
assert.equal(api.layoutRootAffectsStructure({
  matches: () => true,
  querySelector: () => null,
}), true, '主结构节点应要求完整刷新');
assert.equal(api.layoutRootAffectsStructure({
  matches: () => false,
  querySelector: () => descendant,
}), true, '包含主结构的新增子树应要求完整刷新');

const clearStart = layoutSource.indexOf('  function clearLayoutClasses');
const clearEnd = layoutSource.indexOf('  function clearLayoutDomClasses');
assert.ok(clearStart >= 0 && clearEnd > clearStart, '找不到布局 class 清理函数');
const clearCapture = { selector: '', removed: [] };
const clearLayoutClasses = vm.runInNewContext(`(() => {
  const document = {
    querySelectorAll(selector) {
      clearCapture.selector = selector;
      return [{ classList: { remove(...classes) { clearCapture.removed.push(...classes); } } }];
    },
  };
${layoutSource.slice(clearStart, clearEnd)}
  return clearLayoutClasses;
})()`, { clearCapture });
clearLayoutClasses(['one', 'two']);
assert.equal(clearCapture.selector, '.one, .two');
assert.deepEqual(Array.from(clearCapture.removed), ['one', 'two']);

assert.doesNotMatch(layoutSource, /for \(const label of LAYOUT_SUBSCRIBE_LABELS\)/,
  '订阅标签不应逐个扫描 DOM');
assert.match(layoutSource, /getLayoutScopeElements\(root, '\[aria-label\]'\)/,
  'aria-label 元素应在一次范围查询中分类');
assert.match(layoutSource, /if \(style\.textContent !== css\) style\.textContent = css/,
  '相同布局 CSS 不应重复写入');

assert.match(observerSource, /applyLayoutDomCleanup\(root\)/,
  '普通新增节点应执行增量布局清理');
assert.match(observerSource, /if \(layoutNeedsFullRefresh\) throttledLayoutRefresh\(\)/,
  '仅结构替换应请求完整布局刷新');
assert.doesNotMatch(observerSource, /if \(state\.settings\.layoutEnabled\) throttledLayoutRefresh\(\)/,
  '普通新增节点不应再触发完整页面布局扫描');

assert.match(layoutSource, /const NFL_SCORES_SELECTOR = '\[data-testid="nfl_scores_sidebar"\]'/,
  'NFL 过滤应使用 X 提供的稳定 data-testid');
assert.match(layoutSource, /const container = marker\.parentElement/,
  'NFL 过滤应隐藏包含球队和赛程内容的完整父卡片');
assert.match(observerSource, /if \(state\.settings\.hideNfl\) sweepNflEntries\(node\)/,
  '动态加入的 NFL 卡片应被增量过滤');
assert.match(layoutSource, /classList\.remove\('BetterX-nfl-hidden'\)/,
  '关闭 NFL 过滤后应恢复原卡片');

const nflStart = layoutSource.indexOf('  const NFL_SCORES_SELECTOR');
const nflEnd = layoutSource.indexOf('  // ── 界面简化与宽屏', nflStart);
assert.ok(nflStart >= 0 && nflEnd > nflStart, '找不到 NFL 过滤实现');
const nflClasses = new Set();
const nflCard = {
  matches: () => false,
  classList: {
    add(className) { nflClasses.add(className); },
    remove(className) { nflClasses.delete(className); },
  },
};
const nflMarker = {
  parentElement: nflCard,
  matches: (selector) => selector === '[data-testid="nfl_scores_sidebar"]',
  closest: () => null,
};
const nflDocument = {
  querySelectorAll(selector) {
    if (selector === '[data-testid="nfl_scores_sidebar"]') return [nflMarker];
    if (selector === '.BetterX-nfl-hidden') return nflClasses.has('BetterX-nfl-hidden') ? [nflCard] : [];
    return [];
  },
};
const nflState = { settings: { hideNfl: true } };
const nflApi = vm.runInNewContext(`(() => {
${layoutSource.slice(nflStart, nflEnd)}
  return { applyNflHiding };
})()`, { document: nflDocument, state: nflState });
nflApi.applyNflHiding();
assert.ok(nflClasses.has('BetterX-nfl-hidden'), '开启时应隐藏完整 NFL 卡片');
nflState.settings.hideNfl = false;
nflApi.applyNflHiding();
assert.ok(!nflClasses.has('BetterX-nfl-hidden'), '关闭时应恢复 NFL 卡片');

console.log('Layout cleanup is incremental while structural replacements retain full refreshes.');
