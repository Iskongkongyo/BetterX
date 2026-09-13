const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', '更好的X（BetterX）v3.4.0.js');
let source = fs.readFileSync(scriptPath, 'utf8');

assert.match(source, /@version\s+3\.4\.0/);
assert.match(source, /new URL\('\/search', location\.origin\)/, '通知时间线应使用 X 仍支持的原生搜索路由');
assert.match(source, /searchParams\.set\('f', 'live'\)/, '聚合时间线应选择 X 的“最新”结果');
assert.match(source, /<iframe class="BetterX-nt-native-frame"/, '通知时间线应由同源 iframe 承载');
assert.doesNotMatch(source, /<iframe[^>]+sandbox=/, '不可用 sandbox 隔离掉 X 原生登录态或交互');
assert.match(source, /header\[role="banner"\].*sidebarColumn/s, 'iframe 内应隐藏左右栏');
assert.match(source, /\[data-testid="primaryColumn"\][\s\S]*width: 100% !important/, 'iframe 中间栏应填满');

const activateSource = source.match(/  function activateNotificationTimeline\(\) \{[\s\S]*?\n  \}\n\n  function openNotificationTimelineFromPanel/)?.[0] || '';
assert.match(activateSource, /refreshNotificationTimelineFrame/, '打开通知页签时应刷新原生 iframe');
assert.doesNotMatch(activateSource, /loadNotificationTimeline|renderNotificationTimeline|captureNativeNotificationActionTemplate/, '新通知页签不应再进入旧自绘帖子/手写操作链路');

const startupPattern = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;
assert.match(source, startupPattern, '找不到脚本启动标记');
source = source.replace(startupPattern, `
  globalThis.__betterxNativeFrameTest = {
    notificationSubscriptions,
    buildNotificationTimelineFrameGroups,
    notificationTimelineFrameUrl,
  };
`);

const context = {
  console,
  navigator: { userAgent: '' },
  location: {
    origin: 'https://x.com',
    href: 'https://x.com/home',
    pathname: '/home',
    search: '',
  },
  document: { cookie: 'twid=u%3D123456789012345678' },
  URL,
  URLSearchParams,
  setTimeout,
  clearTimeout,
};
context.globalThis = context;
context.window = context;
vm.runInNewContext(source, context, { filename: scriptPath });

const api = context.__betterxNativeFrameTest;
assert.ok(api, '测试导出应存在');
for (let index = 0; index < 41; index++) {
  const username = `user_${String(index).padStart(2, '0')}`;
  api.notificationSubscriptions.set(username, { username, enabled: index !== 40 });
}
const groups = api.buildNotificationTimelineFrameGroups();
assert.equal(groups.length, 3, '40 位启用用户应按每组最多 18 位自动分组');
assert.deepEqual(Array.from(groups, (group) => group.length), [18, 18, 4]);
assert.ok(groups.flat().every((handle) => handle !== 'user_40'), '已关闭的订阅不得进入查询');
assert.ok(groups.every((group) => group.map((handle) => `from:${handle}`).join(' OR ').length <= 430));

const frameUrl = new URL(api.notificationTimelineFrameUrl(['alice', 'bob']));
assert.equal(frameUrl.origin, 'https://x.com');
assert.equal(frameUrl.pathname, '/search');
assert.equal(frameUrl.searchParams.get('q'), 'from:alice OR from:bob');
assert.equal(frameUrl.searchParams.get('f'), 'live');
assert.equal(frameUrl.searchParams.get('src'), 'typed_query');

console.log('BetterX v3.4.0 native iframe tests passed');
