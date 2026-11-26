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
  'Anzeige von Acme', 'Publicidad de Acme', 'Patrocinado por Acme', 'Sponsorisé', 'Sponsorisé par Acme', 'Реклама',
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
  const walkerWith = (label, parent) => () => {
    const nodes = [{ nodeValue: label, parentElement: parent }];
    return { nextNode: () => nodes.shift() };
  };
  for (const label of promotedLabels) {
    context.document.createTreeWalker = walkerWith(label, parentClosest(null));
    assert.equal(context.__test.isAdArticle(article), true, `页面推广标签未被识别：${label}`);
    context.document.createTreeWalker = walkerWith(label, parentClosest({}));
    assert.equal(context.__test.isAdArticle(article), false, `正文或链接中的标签被误判：${label}`);
  }
  for (const label of organicLabels) {
    context.document.createTreeWalker = walkerWith(label, parentClosest(null));
    assert.equal(context.__test.isAdArticle(article), false, `页面普通文案被误判：${label}`);
  }
}

{
  const classes = [];
  const row = { classList: { add: (name) => classes.push(name) } };
  const article = {
    closest: (selector) => (selector === 'li[data-index]' ? row : null),
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

{
  const empty = { entryId: 'module-1', content: { items: [] } };
  const ad = { content: { content: { promoted_metadata: {} } } };
  const append = { type: 'TimelineAddToModule', moduleEntryId: empty.entryId, moduleItems: [{ item: { content: { name: 'Organic' } } }] };
  const timeline = { instructions: [{ entries: [empty, ad] }, append] };
  assert.equal(api.stripPromotedFromTimelinePayload(timeline), true);
  assert.deepEqual(timeline.instructions, [{ entries: [empty] }, append], '后续追加内容需要原本为空的模块');
  assert.equal(api.stripPromotedFromTimelinePayload(timeline), false);
}

{
  const context = loadUserscript('maybeStripPromotedAdsFromFetchResponse, MAX_NETWORK_RESPONSE_BYTES', '', { Headers, Response });
  const { state, maybeStripPromotedAdsFromFetchResponse: filter, MAX_NETWORK_RESPONSE_BYTES: limit } = context.__test;
  state.settings.hideAds = true;
  const base = '/i/api/graphql/hash/';
  const home = base + 'HomeTimeline';
  const json = JSON.stringify(fixture);
  const responseFor = (body, headers = {}) => new Response(body, { headers: { 'content-type': 'application/json', ...headers } });
  const checkUnread = async (url, headers) => {
    const original = responseFor(json, headers);
    let clones = 0;
    original.clone = () => { clones++; throw new Error('Unexpected clone'); };
    assert.equal(await filter(original, url, context), original);
    assert.equal(clones, 0, `响应不应被复制：${url}`);
  };
  await checkUnread(base + 'UserByScreenName?ref=HomeTimeline');
  await checkUnread('https://example.org' + home);
  await checkUnread(home, { 'content-length': String(limit + 1) });
  await checkUnread(home, { 'content-type': 'text/event-stream' });
  state.settings.hideAds = false;
  await checkUnread(home);
  state.settings.hideAds = true;

  const expected = structuredClone(payload);
  for (const operation of ['HomeTimeline', 'SearchTimeline', 'ExploreSidebar', 'TweetDetail']) {
    const original = responseFor(json, { 'content-length': String(Buffer.byteLength(json)) });
    const filtered = await filter(original, base + operation + '?variables=1', context);
    assert.notEqual(filtered, original);
    assert.equal(filtered.headers.has('content-length'), false);
    assert.deepEqual(await filtered.json(), expected);
  }

  const organicItem = { item: { itemContent: { __typename: 'TimelineTweet', tweetDisplayType: 'Tweet' } } };
  const adItem = { item: { itemContent: { __typename: 'TimelineTweet', promotedMetadata: {} } } };
  const namedModule = (entryId, items) => ({ entryId, content: { entryType: 'TimelineTimelineModule', items } });
  const cursor = { entryId: 'cursor-bottom', content: { cursorType: 'Bottom', value: 'next-page' } };
  const instructions = [
    { type: 'TimelineAddEntries', entries: [
      { entryId: 'tweet-1', content: { itemContent: organicItem.item.itemContent } },
      { entryId: 'promoted-2', content: { itemContent: adItem.item.itemContent } },
      namedModule('mixed', [adItem, organicItem]),
      namedModule('append-now', [adItem]),
      namedModule('append-later', [adItem]),
      cursor,
    ] },
    { type: 'TimelineAddToModule', moduleEntryId: 'append-now', moduleItems: [adItem, organicItem] },
    { type: 'TimelineReplaceEntry', entry: namedModule('replacement', [organicItem, adItem]) },
    { type: 'TimelinePinEntry', entry: { content: { itemContent: adItem.item.itemContent } } },
  ];
  const modern = { data: { home: { home_timeline_urt: { instructions } } } };
  const filtered = await filter(responseFor(JSON.stringify(modern)), home, context);
  assert.deepEqual((await filtered.json()).data.home.home_timeline_urt.instructions, [
    { type: 'TimelineAddEntries', entries: [
      instructions[0].entries[0],
      namedModule('mixed', [organicItem]),
      namedModule('append-now', []),
      namedModule('append-later', []),
      cursor,
    ] },
    { type: 'TimelineAddToModule', moduleEntryId: 'append-now', moduleItems: [organicItem] },
    { type: 'TimelineReplaceEntry', entry: namedModule('replacement', [organicItem]) },
  ]);

  let completeBody;
  const pendingBody = new ReadableStream({ start(controller) { completeBody = controller; } });
  const switchedOff = responseFor(pendingBody);
  const pendingFilter = filter(switchedOff, home, context);
  state.settings.hideAds = false;
  completeBody.enqueue(new TextEncoder().encode(json));
  completeBody.close();
  assert.equal(await pendingFilter, switchedOff, '关闭开关后应交还仍在读取的原始响应');
  assert.equal(await switchedOff.text(), json);
  state.settings.hideAds = true;

  const paddedJson = json + ' '.repeat(limit - Buffer.byteLength(json));
  const bytes = new TextEncoder().encode(paddedJson);
  let writer;
  const stream = new ReadableStream({ start(controller) {
    writer = controller;
    controller.enqueue(bytes);
    controller.enqueue(Uint8Array.of(32));
  } });
  const oversized = responseFor(stream);
  // 还未收到 EOF 时就应交还原响应，页面仍能读取最后一块。
  assert.equal(await filter(oversized, home, context), oversized);
  writer.close();
  assert.equal((await oversized.arrayBuffer()).byteLength, limit + 1);

  for (const body of ['{"promoted_metadata":', '{"data":{}}']) {
    const original = responseFor(body);
    assert.equal(await filter(original, home, context), original);
    assert.equal(await original.text(), body);
  }
}

console.log('Ads: label detection covers new X formats; payload filter removes promoted tweets and trends.');
