const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', '更好的X（BetterX）v3.2.2.js');
let source = fs.readFileSync(scriptPath, 'utf8');
assert.doesNotMatch(source, /33\.333%/, '不应强制把主页页签压成三等分');
assert.doesNotMatch(source, /NOTIFICATION_TIMELINE_PATH|location\.assign\(target\.href\)/, '通知订阅不应再跳转到内部路由');
assert.match(source, /NOTIFICATION_TIMELINE_ENDPOINT\s*=\s*'\/i\/api\/2\/notifications\/device_follow\.json'/);
for (const action of ['reply', 'repost', 'like', 'save', 'share', 'download']) {
  assert.match(source, new RegExp(`data-nt-post-action=["']\\$\\{action\\}["']|renderNotificationAction\\('${action}'`), `缺少 ${action} 操作`);
}
assert.match(source, /<video[^>]+controls[^>]+playsinline/, '通知时间线应支持原位播放视频');

const startupPattern = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;
assert.match(source, startupPattern, '找不到脚本启动标记');
source = source.replace(startupPattern, `
  globalThis.__betterxNotificationTest = {
    DEFAULT_SETTINGS,
    state,
    notificationSubscriptions,
    sanitizeSettings,
    harvestNotificationRelationship,
    parseNotificationTimelinePayload,
    renderNotificationPostText,
    openNotificationIntent,
    findNotificationTimelineCursor,
    findNotificationTimelineTweetIds,
    getCurrentSourceInfo,
  };
`);

let openedUrl = '';
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
  open(url) { openedUrl = url; return null; },
};
context.globalThis = context;
context.window = context;
vm.runInNewContext(source, context, { filename: scriptPath });

const api = context.__betterxNotificationTest;
assert.ok(api, '测试导出应存在');
assert.equal(api.DEFAULT_SETTINGS.settingsRevision, 28);

api.harvestNotificationRelationship({
  rest_id: '222222',
  core: { screen_name: 'SubscribedUser', name: '订阅用户' },
  notifications_settings: { notifications_enabled: true },
});
assert.equal(api.notificationSubscriptions.get('subscribeduser').enabled, true);

// 普通关注列表中的 false 可能来自不完整/裁剪响应，不得减少本地订阅。
api.harvestNotificationRelationship({
  id_str: '222222',
  screen_name: 'SubscribedUser',
  notifications: false,
});
assert.equal(api.notificationSubscriptions.get('subscribeduser').enabled, true);

// 用户资料中的明确状态以及铃铛修改响应仍可安全地关闭订阅。
api.harvestNotificationRelationship({
  rest_id: '222222',
  core: { screen_name: 'SubscribedUser' },
  notifications_settings: { notifications_enabled: false },
});
assert.equal(api.notificationSubscriptions.get('subscribeduser').enabled, false);
api.harvestNotificationRelationship({
  relationship: {
    source: { notifications_enabled: false },
    target: { id_str: '333333', screen_name: 'BellToggle' },
  },
});
assert.equal(api.notificationSubscriptions.get('belltoggle').enabled, false);

const payload = {
  globalObjects: {
    tweets: {
      100: { id_str: '100', user_id_str: '1', retweeted_status_id_str: '90' },
      90: {
        id_str: '90', user_id_str: '9', full_text: '#测试 看这里 https://t.co/example https://t.co/media', created_at: 'Thu Sep 03 12:00:00 +0000 2026',
        favorite_count: 12, retweet_count: 3, reply_count: 2,
        ext_views: { count: '599' },
        entities: {
          hashtags: [{ text: '测试', indices: [0, 3] }],
          urls: [{ url: 'https://t.co/example', expanded_url: 'https://example.com/page', display_url: 'example.com/page', indices: [8, 28] }],
          media: [{ url: 'https://t.co/media', indices: [29, 47] }],
        },
        extended_entities: { media: [{ type: 'photo', url: 'https://t.co/media', indices: [29, 47], media_url_https: 'https://pbs.twimg.com/media/test.jpg' }] },
      },
      200: { id_str: '200', user_id_str: '2', full_text: '第二条帖子', favorite_count: 5 },
    },
    users: {
      1: { id_str: '1', screen_name: 'Reposter', name: '转发者' },
      9: { id_str: '9', screen_name: 'Original', name: '原作者', profile_image_url_https: 'https://pbs.twimg.com/profile_images/original.jpg' },
      2: { id_str: '2', screen_name: 'Second', name: '第二位' },
    },
  },
  timeline: {
    instructions: [{
      addEntries: {
        entries: [
          { entryId: 'tweet-100', content: { item: { content: { tweet: { id: '100' } } } } },
          { entryId: 'tweet-200', content: { item: { content: { tweet: { id: '200' } } } } },
          { entryId: 'cursor-bottom-0', content: { operation: { cursor: { cursorType: 'Bottom', value: 'NEXT-CURSOR' } } } },
        ],
      },
    }],
  },
};

const parsed = api.parseNotificationTimelinePayload(payload);
assert.equal(parsed.cursor, 'NEXT-CURSOR');
assert.deepEqual(Array.from(parsed.posts, (post) => post.id), ['90', '200']);
assert.equal(parsed.posts[0].username, 'Original');
assert.equal(parsed.posts[0].repostedBy, '转发者');
assert.equal(parsed.posts[0].hasImage, true);
assert.equal(parsed.posts[0].mediaThumbs.length, 1);
assert.equal(parsed.posts[0].viewCount, 599);
assert.equal(parsed.posts[0].mediaItems[0].type, 'photo');
const linkedText = api.renderNotificationPostText(parsed.posts[0]);
assert.match(linkedText, /search\?q=%23%E6%B5%8B%E8%AF%95/);
assert.match(linkedText, /https:\/\/example\.com\/page/);
assert.doesNotMatch(linkedText, /t\.co\/media/);

api.openNotificationIntent('/intent/tweet', '90');
assert.equal(new URL(openedUrl).searchParams.get('in_reply_to'), '90');
api.openNotificationIntent('/intent/retweet', '90');
assert.equal(new URL(openedUrl).searchParams.get('tweet_id'), '90');
assert.equal(new URL(openedUrl).searchParams.has('in_reply_to'), false);

api.state.notificationTimelineActive = true;
assert.equal(api.getCurrentSourceInfo().type, 'notification_subscriptions');

console.log('BetterX v3.2.2 notification UI tests passed');
