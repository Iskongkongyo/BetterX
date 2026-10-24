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
      weak: ADULT_SPAM_WEAK_TERMS,
      strong: ADULT_SPAM_STRONG_TERMS,
      sensitive: ADULT_SPAM_SENSITIVE_TERMS,
      botBait: ADULT_SPAM_BOT_BAIT_TERMS,
      suggestive: ADULT_SPAM_SUGGESTIVE_TERMS,
      marketing: ADULT_SPAM_MARKETING_TERMS,
      contact: ADULT_SPAM_CONTACT_TERMS,
      exemptions: ADULT_SPAM_CONTEXT_EXEMPTIONS,
    },
    compiled: COMPILED_ADULT_SPAM_TERMS,
    weakKeys: ADULT_SPAM_WEAK_KEYS,
    compileAdultSpamTerms,
    compactAdultSpamText,
    normalizeAdultSpamText,
    countCompiledTerms,
    getCompiledAdultSpamCustomRules,
    updateCustomRules(rules) {
      state.settings.adultSpamKeywords = rules;
      adultSpamRulesVersion++;
    },
  };
})()`, { filename: 'adult-spam.part.js' });

const keyFor = raw => api.compactAdultSpamText(raw) || api.normalizeAdultSpamText(raw);
const count = (text, terms) => {
  const normalized = api.normalizeAdultSpamText(text);
  return api.countCompiledTerms(normalized, api.compactAdultSpamText(normalized), terms);
};
const expectedGroups = new Map();
const claimed = new Set();
for (const group of ['strong','suggestive','sensitive','botBait','marketing','contact','weak','exemptions']) {
  const originals = api.originals[group];
  const eligible = Array.from(originals).filter(raw => !['strong','sensitive'].includes(group) || !api.weakKeys.has(keyFor(raw)));
  const expected = [...new Set(eligible.map(keyFor).filter(Boolean))].filter(key => {
    if (group === 'exemptions') return true;
    if (claimed.has(key)) return false;
    claimed.add(key);
    return true;
  });
  expectedGroups.set(group, expected);
}
for (const [group, originals] of Object.entries(api.originals)) {
  const eligible = Array.from(originals);
  const expected = expectedGroups.get(group);
  assert.deepEqual(Array.from(api.compiled[group], term => term.key), expected, `${group}: normalized terms must be unique`);
  for (const term of api.compiled[group]) {
    const raw = eligible.find(raw => keyFor(raw) === term.key);
    assert.equal(count(`prefix ${raw} suffix`, [term]), 1, `${group}: ${raw} should match once`);
  }
}
const allScoringKeys = Object.entries(api.compiled).filter(([group]) => group !== 'exemptions').flatMap(([,terms]) => Array.from(terms, term => term.key));
assert.equal(allScoringKeys.length, new Set(allScoringKeys).size, 'The same normalized word must not score in several categories');

for (const aliases of [['ts','TS','ＴＳ'],['ntr','NTR'],['Chudai','chudai'],['射出来','射出来']]) {
  const compiled = api.compileAdultSpamTerms(aliases);
  assert.equal(compiled.length, 1);
  assert.equal(count(aliases.join(' '), compiled), 1, 'Repeated spellings and appearances must not duplicate the term score');
}
const punctuatedAliases = api.compileAdultSpamTerms(['a b!', 'a.b', 'ab']);
assert.equal(punctuatedAliases.length, 1, 'Compaction-equivalent spellings should be one logical term');
for (const text of ['a b!', 'a.b', 'ab']) assert.equal(count(text, punctuatedAliases), 1, 'Every retained spelling must remain matchable');
const emojis = api.compileAdultSpamTerms(['👉','👆','','   ']);
assert.equal(emojis.length, 2, 'Terms with empty compact forms must retain their normalized form');
assert.equal(count('👉', emojis), 1);
for (const text of ['hosts','events','central','do not stop until','9.1x','9-1x','Python 3.9.1']) {
  assert.equal(count(text, api.compileAdultSpamTerms(['ts','ntr','91'], false)), 0, `Word boundaries must survive: ${text}`);
}
assert.equal(count('p.o.r.n', api.compiled.strong), 1, 'Explicit longer Latin words may retain punctuation-obfuscation detection');
assert.equal(count('p or n', api.compiled.strong), 0, 'Ordinary spaces must not join separate words into a Latin term');

const firstCustom = api.getCompiledAdultSpamCustomRules();
assert.equal(firstCustom[0].normalized, 'a b!');
assert.equal(firstCustom[0].compact, 'ab');
assert.strictEqual(api.getCompiledAdultSpamCustomRules(), firstCustom, '同版本应复用缓存');
api.updateCustomRules(['新 词']);
const secondCustom = api.getCompiledAdultSpamCustomRules();
assert.notStrictEqual(secondCustom, firstCustom, '规则版本变更后应重新编译');
assert.equal(secondCustom[0].compact, '新词');

console.log('Adult-spam compilation deduplicates normalized terms, retains aliases and respects Latin/numeric boundaries.');
