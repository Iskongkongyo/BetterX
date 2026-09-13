import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/ui/tag-editors.part.js', import.meta.url), 'utf8');
const helperMatch = source.match(/  function commitPlainTagInput\([\s\S]*?\n  }\n\n  function commitAdultSpamKeywordInput/);
assert.ok(helperMatch, '找不到通用标签提交函数');
const helperSource = helperMatch[0].replace(/\n\n  function commitAdultSpamKeywordInput$/, '');

const harness = vm.runInNewContext(`(() => {
  const state = { settings: {} };
  const commits = [];
  const toasts = [];
  const uniqueStrings = (items) => [...new Set(items)];
  const setSettingsPartial = (patch) => {
    commits.push(patch);
    Object.assign(state.settings, patch);
  };
  const showToast = (message) => toasts.push(message);
${helperSource}
  return { state, commits, toasts, commitPlainTagInput };
})()`);

const parseCsv = (raw) => raw.split(',').map((item) => item.trim()).filter(Boolean);
harness.state.settings.tags = ['one'];
const input = { value: 'one,two,three' };
assert.equal(harness.commitPlainTagInput({
  input,
  settingKey: 'tags',
  parse: parseCsv,
  maxItems: 2,
  limitMessage: 'limit',
}), true);
assert.equal(input.value, '', '提交后必须清空输入框');
assert.deepEqual(Array.from(harness.state.settings.tags), ['one', 'two']);
assert.deepEqual(Array.from(harness.toasts), ['limit']);

const commitCount = harness.commits.length;
assert.equal(harness.commitPlainTagInput({
  input: { value: 'one' },
  settingKey: 'tags',
  parse: parseCsv,
  maxItems: 2,
}), false, '没有新增标签时不应重复写设置');
assert.equal(harness.commits.length, commitCount);

assert.equal(harness.commitPlainTagInput({
  input: { value: 'one' },
  settingKey: 'tags',
  parse: parseCsv,
  maxItems: 2,
  alwaysCommit: true,
}), true, '白名单原有的重复提交语义应保留');

assert.match(source, /settingKey: 'adultSpamKeywords'[\s\S]*?maxItems: 50/);
assert.match(source, /settingKey: 'adultSpamWhitelist'[\s\S]*?maxItems: 100[\s\S]*?alwaysCommit: true/);

const bindMatch = source.match(/  function bindTagCommitInput\([\s\S]*?\n  }\n\n  function installHorizontalFilterScroller/);
assert.ok(bindMatch, '找不到标签输入事件绑定器');
const bindSource = bindMatch[0].replace(/\n\n  function installHorizontalFilterScroller$/, '');
const bindTagCommitInput = vm.runInNewContext(`(() => {
${bindSource}
  return bindTagCommitInput;
})()`);
const listeners = new Map();
const boundInput = { addEventListener(type, listener) { listeners.set(type, listener); } };
let submitted = 0;
bindTagCommitInput(boundInput, () => { submitted++; });
let prevented = false;
listeners.get('keydown')({ key: 'Enter', isComposing: true, preventDefault() { prevented = true; } });
assert.equal(submitted, 0, '输入法组合期间不能提交');
listeners.get('keydown')({ key: 'Enter', isComposing: false, preventDefault() { prevented = true; } });
assert.equal(prevented, true);
assert.equal(submitted, 1, '回车应提交一次');
listeners.get('blur')();
assert.equal(submitted, 2, '失焦应提交一次');

console.log('Generic tag editor preserves limits, deduplication and commit semantics.');
