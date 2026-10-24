import assert from 'node:assert/strict';
import { loadUserscript } from './helpers/userscript-harness.mjs';

const api = loadUserscript(`
  scoreAdultSpam,normalizeAdultSpamText,compactAdultSpamText,COMPILED_ADULT_SPAM_TERMS,
  countCompiledTerms,followedHandles,
  setCustomRules: rules => {state.settings.adultSpamKeywords=rules;adultSpamRulesVersion++;}
`).__test;
Object.assign(api.state.settings, {
  hideAdultSpam:true,adultSpamCustomRulesEnabled:false,adultSpamSkipFollowing:false,
  adultSpamKeywords:[],adultSpamWhitelist:[],
});
const input = (text, overrides = {}) => ({
  text,displayName:'Neutral author',username:'normaluser',rawUsername:'normaluser',
  repostContext:'',isRepost:false,reposterUsername:'',externalLinkCount:0,mentionCount:0,
  hasMedia:false,isFollowingTimeline:false,...overrides,
});
const score = (text, overrides) => api.scoreAdultSpam(input(text,overrides));
const modes = ['balanced','conservative'];
const benign = [
  'hosts','central','events','do not stop until',
  '从原定的 9-10 月推迟到 11 月 19 日。','9.1x','9-1x','Python 3.9.1','version 6.9',
  'ＴＳ','ＮＴＲ','TS','NTR','91','69','3p','4i','学习 TS 语言和 NTR 缩写',
  '项目主页更新了','妈妈做了晚饭','欢迎联系我讨论代码','今天免费开放报名','吃瓜看球',
  '线下交流会安排在同城举行','儿子今天玩得很开心','Sao Paulo travel guide','https://t.cn/example',
  '👉 @helper','👆 操作步骤','手冲咖啡','糖心鸡蛋','子宫肌瘤科普','皮炎护理方法',
  '外围市场消息','猫咪发情了该怎么办','50度灰','spa','doi','全套','处女','骚','逼',
  '这个方案满足我对性能的要求','快看项目主页','项目主页有资源','同城可约线下桌游',
  '成人英语课程，免费领取资料，详情看主页','ESSEX videos','p or n',
];
const zeroScore = ['hosts','central','events','do not stop until','9.1x','9-1x','Python 3.9.1','version 6.9'];
const auxiliaryOnly = 'TS NTR 91 69 免费领取，主页有资源 👉 @helper 🔞💦';
const promotionalMetadata = {
  hasMedia:true,externalLinkCount:2,mentionCount:1,
  displayName:'Middlesex Events',username:'abcdef123456',rawUsername:'abcdef123456',
};
const positive = [
  ['成人视频资源，私信领取',{}],
  ['同城约炮，私聊联系',{}],
  ['福利视频资源合集，私信领取',{hasMedia:true}],
  ['黑丝玉足，私信联系',{}],
  ['nudes in bio',{}],['porn videos',{}],['sex video',{}],['sex videos',{}],
  ['p.o.r.n videos',{}],['约 炮 私聊',{}],['裸.聊 私信',{}],
  ['可瑟瑟',{}],['推特第一骚',{}],
  ['私信订阅',{displayName:'OnlyFans creator',hasMedia:true}],
];
let decisions = 0;
for (const mode of modes) {
  api.state.settings.adultSpamLevel = mode;
  for (const text of benign) {
    const result = score(text);
    assert.equal(result.hidden,false,`${mode}: benign text was hidden: ${text}; ${JSON.stringify(result)}`);
    decisions++;
    assert.equal(score(text,promotionalMetadata).hidden,false,`${mode}: adding a photo, links or a generated handle hid benign text: ${text}`);
    decisions++;
  }
  for (const text of zeroScore) assert.equal(score(text).score,0,`${mode}: a substring or punctuation join still scored: ${text}`);
  const decorated = score(auxiliaryOnly,promotionalMetadata);
  assert.ok(decorated.score >= 9,'The metadata case must exercise evidence qualification rather than just a low score');
  assert.equal(decorated.hidden,false,`${mode}: auxiliary words plus metadata must not establish adult context`);
  for (const name of ['Middlesex','Essex','Sussex']) {
    assert.equal(score('项目主页有资源',{...promotionalMetadata,displayName:name}).hidden,false,`${mode}: normal place/name falsely matched sex`);
  }
  for (const [text,overrides] of positive) {
    const result = score(text,overrides);
    assert.equal(result.hidden,true,`${mode}: explicit adult promotion escaped detection: ${text}; ${JSON.stringify(result)}`);
    assert.ok(result.score < 99,'Built-in rules should use contextual scoring instead of the former direct-block shortcut');
    decisions++;
  }
}

const count = (text,terms) => {
  const normalized=api.normalizeAdultSpamText(text);
  return api.countCompiledTerms(normalized,api.compactAdultSpamText(normalized),terms);
};
assert.equal(count('ts TS ＴＳ',api.COMPILED_ADULT_SPAM_TERMS.weak),1);
assert.equal(count('ntr NTR',api.COMPILED_ADULT_SPAM_TERMS.weak),1);
assert.equal(count('射出来 射出来',api.COMPILED_ADULT_SPAM_TERMS.sensitive),1);
assert.equal(count('Chudai chudai',api.COMPILED_ADULT_SPAM_TERMS.strong),1);
assert.equal(count('戴套',api.COMPILED_ADULT_SPAM_TERMS.strong),0);
assert.equal(count('戴套',api.COMPILED_ADULT_SPAM_TERMS.sensitive),0);
assert.equal(count('主页',api.COMPILED_ADULT_SPAM_TERMS.contact),1);
assert.equal(count('主页',api.COMPILED_ADULT_SPAM_TERMS.weak),0);
assert.equal(count('可瑟瑟',api.COMPILED_ADULT_SPAM_TERMS.suggestive),1);
assert.equal(count('可瑟瑟',api.COMPILED_ADULT_SPAM_TERMS.sensitive),0);

api.state.settings.adultSpamLevel='balanced';
assert.equal(score('福利视频合集，私信获取').hidden,true);
api.state.settings.adultSpamLevel='conservative';
assert.equal(score('福利视频合集，私信获取').hidden,false,'The existing mode thresholds must continue to differ');

// Whitelists and explicit user rules retain their preexisting precedence and semantics.
api.state.settings.adultSpamCustomRulesEnabled=true;
api.setCustomRules(['ts']);
assert.equal(score('hosts').score,99,'A user-chosen substring block must remain explicit');
api.setCustomRules(['👉']);
assert.equal(score('👉 操作步骤').hidden,true,'Custom symbol-only rules must not be discarded during compaction');
api.state.settings.adultSpamWhitelist=['normaluser'];
assert.equal(score('👉 成人视频资源').hidden,false,'The account allowlist must take precedence over custom rules');
api.state.settings.adultSpamWhitelist=[];
api.state.settings.adultSpamCustomRulesEnabled=false;
api.state.settings.adultSpamSkipFollowing=true;
api.followedHandles.add('normaluser');
assert.equal(score('成人视频资源，私信领取').hidden,false);
api.followedHandles.clear();
assert.equal(score('成人视频资源，私信领取',{isFollowingTimeline:true}).hidden,false);
api.state.settings.adultSpamSkipFollowingReposts=true;
assert.equal(score('成人视频资源，私信领取',{isFollowingTimeline:true,isRepost:true,reposterUsername:'friend'}).hidden,false);
api.state.settings.adultSpamSkipFollowing=false;
assert.equal(score('成人视频资源，私信领取').hidden,true);
api.state.settings.hideAdultSpam=false;
assert.equal(score('成人视频资源，私信领取').hidden,false,'Disabling built-in filtering must still disable it');
api.state.settings.adultSpamCustomRulesEnabled=true;
api.setCustomRules(['资源']);
assert.equal(score('普通资源').hidden,true,'Explicit custom rules must still work with built-in filtering off');

console.log(JSON.stringify({modes:modes.length,benignExamples:benign.length,positiveExamples:positive.length,pairedDecisions:decisions,auxiliaryMetadataHidden:false}));
console.log('Adult-spam false-positive regressions cover reported text, contextual evidence, real promotion and user override precedence.');
