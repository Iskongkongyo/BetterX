import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadUserscript } from './helpers/userscript-harness.mjs';

const api = loadUserscript(
  'isAdLabelText, hideAdElement, stripPromotedFromTimelinePayload',
  '',
  { NodeFilter: { SHOW_TEXT: 4 } },
).__test;

// X 新版时间线/趋势位的真实标签写法。
const promotedLabels = [
  '广告', '廣告', '已推广', '已推廣', '推广', '推廣', '赞助', '贊助', '赞助内容',
  'Ad', 'Ads', 'Promoted', 'Sponsored',
  '来自 apple.com 的广告', '來自 apple.com 的廣告',
  'Ad from acme.com', 'Promoted by Webull HK', 'Sponsored by Acme',
  '推广人 Webull HK', '推廣人 Webull HK', '广告主 Acme', '赞助人 Acme',
  'Acme の広告', 'Acme による広告', 'Acme のプロモーション',
  'Acme 의 광고', 'Acme의 프로모션',
  'Anzeige von Acme', 'Publicidad de Acme', 'Patrocinado por Acme',
];
for (const label of promotedLabels) {
  assert.equal(api.isAdLabelText(label), true, `推广标签未被识别：${label}`);
}

// 普通文案、正文里提到广告、页脚“广告信息”等不能被当作推广标签。
const organicLabels = [
  '', '广告信息', '广告位招租', '我的广告设计', '已推广活动',
  'Promoted post', 'Sponsored content', 'Advertisement', 'Ads manager',
  '来自 apple.com 的广告位', 'Product Ad review', 'Anzeige meiner Meinung',
];
for (const label of organicLabels) {
  assert.equal(api.isAdLabelText(label), false, `普通文案被误判为推广标签：${label}`);
}

{
  const context = loadUserscript('isAdArticle', '', { NodeFilter: { SHOW_TEXT: 4 } });
  const parentClosest = (value) => ({ closest: () => value });
  const article = { querySelector: () => null, closest: () => null };
  const walkerWith = (parent) => () => {
    let visited = false;
    return { nextNode: () => (visited ? null : (visited = true, { nodeValue: '来自 acme.com 的广告', parentElement: parent })) };
  };
  context.document.createTreeWalker = walkerWith(parentClosest(null));
  assert.equal(context.__test.isAdArticle(article), true, '正文之外的推广标签应被识别');
  context.document.createTreeWalker = walkerWith(parentClosest({}));
  assert.equal(context.__test.isAdArticle(article), false, '正文 / 作者链接中的“广告”字样不应判为推广');
}

{
  const classes = [];
  const row = { classList: { add: (name) => classes.push(name) } };
  const article = {
    closest: (selector) => (selector === 'li' ? row : null),
    classList: { add: (name) => classes.push(`article:${name}`) },
  };
  api.hideAdElement(article);
  assert.deepEqual(classes, ['BetterX-ad-collapsed'], '新版虚拟列表应折叠 li，避免改变虚拟列表测量');
}

{
  const classes = [];
  const cell = { classList: { add: (name) => classes.push(name) } };
  const article = {
    closest: (selector) => (selector === '[data-testid="cellInnerDiv"]' ? cell : null),
    classList: { add: (name) => classes.push(`article:${name}`) },
  };
  api.hideAdElement(article);
  assert.deepEqual(classes, ['BetterX-ad-hidden'], '旧版时间线应隐藏 cellInnerDiv');
}

const fixture = JSON.parse(await readFile(new URL('./fixtures/promoted-timeline.json', import.meta.url), 'utf8'));
const payload = structuredClone(fixture);
assert.equal(api.stripPromotedFromTimelinePayload(payload), true, '包含推广入口的响应应被改写');
assert.equal(api.stripPromotedFromTimelinePayload(payload), false, '重复过滤应保持幂等');

const homeEntries = payload.data.home_timeline.home_timeline_urt.instructions[1].entries;
assert.deepEqual(
  homeEntries.map((entry) => entry.content.__typename === 'TimelineTimelineCursor' ? entry.content.cursorType : entry.content.content.tweet_results.result.rest_id),
  ['Top', '111', 'Bottom'],
  '首页时间线应保留普通帖和游标，只移除推广帖',
);

const searchInstructions = payload.data.search_by_raw_query.search_timeline.timeline.instructions;
assert.equal(searchInstructions.length, 1, '指向推广内容的 TimelineReplaceEntry 应整条移除');
assert.equal(searchInstructions[0].entries.length, 0, '搜索时间线中的推广帖应被移除');

const exploreEntries = payload.data.explore_sidebar.timeline.instructions[0].entries;
assert.equal(exploreEntries.length, 1, '仅含推广趋势的模块应整条移除');
assert.deepEqual(
  exploreEntries[0].content.items.map((item) => item.item.content.name),
  ['Organic trend'],
  '趋势模块应只移除推广趋势，保留普通趋势',
);

assert.equal(JSON.stringify(payload).includes('promoted_metadata'), false, '过滤后不应残留任何 promoted_metadata');

const clean = { data: { home_timeline: { home_timeline_urt: { instructions: [{ entries: [{ content: { content: { __typename: 'TimelineTweet' } } }] }] } } } };
assert.equal(api.stripPromotedFromTimelinePayload(clean), false, '没有推广入口时不应改写响应');

console.log('Ads: label detection covers new X formats; payload filter removes promoted tweets and trends.');
