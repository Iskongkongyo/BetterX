import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { compactAdultSpamRules } from '../scripts/strip-comments.mjs';

const source = await readFile(new URL('../src/features/adult-spam.part.js', import.meta.url), 'utf8');
const release = await readFile(new URL('../更好的X（BetterX）v3.4.0.js', import.meta.url), 'utf8');
const opening = 'const ADULT_SPAM_STRONG_TERMS = [';
const boundary = 'function normalizeAdultSpamText';
const extractRules = (text) => {
  const start = text.indexOf(opening);
  const end = text.indexOf(boundary, start);
  assert.ok(start >= 0 && end > start, '找不到内容净化内置规则');
  return text.slice(start, end).trim();
};
const sourceBlock = extractRules(source);
const builtBlock = extractRules(release);

assert.ok(sourceBlock.split(/\r?\n/).length > 70, '源码规则表应继续保留分类排版');
assert.doesNotMatch(builtBlock, /[\r\n]/, '发布物中的内置规则应压缩为一行');
assert.equal(builtBlock, extractRules(compactAdultSpamRules(source)));
const inspect = (block) => vm.runInNewContext(`(() => {
  ${block}
  return {
    lengths: [ADULT_SPAM_STRONG_TERMS, ADULT_SPAM_SENSITIVE_TERMS,
      ADULT_SPAM_BOT_BAIT_TERMS, ADULT_SPAM_SUGGESTIVE_TERMS,
      ADULT_SPAM_MARKETING_TERMS, ADULT_SPAM_CONTACT_TERMS,
      ADULT_SPAM_CONTEXT_EXEMPTIONS].map((items) => items.length),
    regexes: [ADULT_SPAM_NAME_RE, ADULT_SPAM_EXACT_AMBIGUOUS_RE,
      ...ADULT_SPAM_AMBIGUOUS_RES, ...ADULT_SPAM_BOT_HANDLE_RES,
      ...ADULT_SPAM_TEMPLATE_RES, ...ADULT_SPAM_COMBO_RES,
      ADULT_SPAM_REPOST_CONTEXT_RE].map((value) => [value.source, value.flags]),
  };
})()`);
assert.deepEqual(
  JSON.parse(JSON.stringify(inspect(builtBlock))),
  JSON.parse(JSON.stringify(inspect(sourceBlock))),
  '压缩前后的词表长度与正则必须完全一致'
);

console.log('Build compacts adult-spam rules while preserving every term and regular expression.');
