import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/features/adult-spam.part.js', import.meta.url), 'utf8');
const start = source.indexOf('  const ADULT_SPAM_STRONG_TERMS');
const end = source.indexOf('  function getAdultSpamInput');
assert.ok(start >= 0 && end > start, '无法读取内容净化规则模块');

const block = source.slice(start, end);
const api = vm.runInNewContext(`(() => {
  let adultSpamRulesVersion = 0;
  const state = { settings: { adultSpamKeywords: ['Ａ B!', 'Porn'] } };
${block}
  return {
    originals: {
      strong: ADULT_SPAM_STRONG_TERMS,
      sensitive: ADULT_SPAM_SENSITIVE_TERMS,
      botBait: ADULT_SPAM_BOT_BAIT_TERMS,
      suggestive: ADULT_SPAM_SUGGESTIVE_TERMS,
      marketing: ADULT_SPAM_MARKETING_TERMS,
      contact: ADULT_SPAM_CONTACT_TERMS,
      exemptions: ADULT_SPAM_CONTEXT_EXEMPTIONS,
    },
    compiled: COMPILED_ADULT_SPAM_TERMS,
    compactAdultSpamText,
    countCompiledTerms,
    getCompiledAdultSpamCustomRules,
    updateCustomRules(rules) {
      state.settings.adultSpamKeywords = rules;
      adultSpamRulesVersion++;
    },
  };
})()`, { filename: 'adult-spam.part.js' });

for (const [group, originals] of Object.entries(api.originals)) {
  const expected = Array.from(originals, api.compactAdultSpamText);
  assert.deepEqual(Array.from(api.compiled[group]), expected, `${group} 预编译结果不一致`);
  for (const term of expected) {
    const haystack = `prefix${term}suffix`;
    const oldCount = Array.from(originals)
      .map(api.compactAdultSpamText)
      .filter((candidate) => candidate && haystack.includes(candidate)).length;
    assert.equal(api.countCompiledTerms(haystack, api.compiled[group]), oldCount);
  }
}

const firstCustom = api.getCompiledAdultSpamCustomRules();
assert.equal(firstCustom[0].normalized, 'a b!');
assert.equal(firstCustom[0].compact, 'ab');
assert.strictEqual(api.getCompiledAdultSpamCustomRules(), firstCustom, '同版本应复用缓存');
api.updateCustomRules(['新 词']);
const secondCustom = api.getCompiledAdultSpamCustomRules();
assert.notStrictEqual(secondCustom, firstCustom, '规则版本变更后应重新编译');
assert.equal(secondCustom[0].compact, '新词');

console.log('Adult-spam compiled-rule behavior is equivalent.');
