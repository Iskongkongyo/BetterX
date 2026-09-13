import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { compactI18nEntries } from '../scripts/strip-comments.mjs';

const source = await readFile(new URL('../src/00-bootstrap-i18n.part.js', import.meta.url), 'utf8');
const release = await readFile(new URL('../更好的X（BetterX）v3.4.0.js', import.meta.url), 'utf8');
const opening = 'const UI_TEXT_ENTRIES = [';
const boundary = 'function readUiLanguageOverride';
const extractEntries = (text) => {
  const start = text.indexOf(opening);
  const end = text.lastIndexOf('];', text.indexOf(boundary, start)) + 2;
  assert.ok(start >= 0 && end > start, '找不到翻译表');
  return text.slice(start, end);
};
const sourceBlock = extractEntries(source);
const builtBlock = extractEntries(release);

assert.ok(sourceBlock.split(/\r?\n/).length > 200, '源码翻译表应继续保留可读排版');
assert.doesNotMatch(builtBlock, /[\r\n]/, '发布物中的翻译表应压缩为一行');
assert.equal(builtBlock, extractEntries(compactI18nEntries(source)));
const evaluateEntries = (block) => vm.runInNewContext(`(() => { ${block}; return UI_TEXT_ENTRIES; })()`);
assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateEntries(builtBlock))),
  JSON.parse(JSON.stringify(evaluateEntries(sourceBlock))),
  '压缩前后的四语言翻译数据必须逐项一致'
);

console.log('Build compacts i18n data while preserving every translation entry.');
