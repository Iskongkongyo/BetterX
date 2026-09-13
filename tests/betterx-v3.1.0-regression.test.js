const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', '更好的X（BetterX）v3.1.0.js');
let source = fs.readFileSync(scriptPath, 'utf8');
assert.doesNotMatch(
  source,
  /NOTIFICATION_TIMELINE|device_follow|notificationTimeline|open-notification-timeline|BetterX-home-notification-tab/,
  '3.1.0 只应管理通知订阅，不应包含通知订阅帖子时间线',
);
assert.match(source, /data-view="notifications">通知<\/button>/, '缺少通知管理页签');
assert.match(source, /data-action="sync-notification-users"/, '缺少通知订阅同步入口');
const startupPattern = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;
assert.match(source, startupPattern, '找不到脚本启动标记');
source = source.replace(startupPattern, `
  globalThis.__betterxTest = {
    isSafeRegexSource,
    isSafeKeywordRule,
    sanitizeSettings,
    setAdultSpamHidden,
    extractMediaFromTweetDetail,
    collectMedia,
    sanitizeNotificationSubscription,
    harvestNotificationRelationship,
    notificationSubscriptions,
    getCurrentViewerId,
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
  URL,
  URLSearchParams,
  setTimeout,
  clearTimeout,
  document: { body: null, cookie: 'twid=u%3D123456789012345678' },
};
context.globalThis = context;
context.window = context;
vm.runInNewContext(source, context, { filename: scriptPath });

const {
  isSafeRegexSource,
  isSafeKeywordRule,
  sanitizeSettings,
  setAdultSpamHidden,
  extractMediaFromTweetDetail,
  collectMedia,
  sanitizeNotificationSubscription,
  harvestNotificationRelationship,
  notificationSubscriptions,
  getCurrentViewerId,
} = context.__betterxTest;

assert.equal(isSafeRegexSource('猫|狗'), true);
assert.equal(isSafeRegexSource('foo.*bar'), true);
assert.equal(isSafeRegexSource('\\d+\\s+\\w+'), true);
assert.equal(isSafeRegexSource('[A-Za-z]+[0-9]+'), true);
assert.equal(isSafeRegexSource('[a-z]+[d-f]+'), false);
assert.equal(isSafeRegexSource('(a+)+'), false);
assert.equal(isSafeRegexSource('(a|aa)+'), false);
assert.equal(isSafeRegexSource('a*a*b'), false);
assert.equal(isSafeRegexSource('a*a*a*a*a*a*a*a*b'), false);
assert.equal(isSafeRegexSource('a*b*a*b'), false);
assert.equal(isSafeRegexSource('a*a{1}a*b'), false);
assert.equal(isSafeRegexSource('a?a?a?b'), false);
assert.equal(isSafeRegexSource('.*\\w+'), false);
assert.equal(isSafeRegexSource('a{1001}'), false);
assert.equal(isSafeKeywordRule('普通文字 a*a*'), true);
assert.equal(isSafeKeywordRule('/a*a*b/'), false);

const sanitized = sanitizeSettings({
  keywords: ['普通文字', '/猫|狗/', '/a*a*b/'],
  excludeKeywords: ['/.*\\w+/', '广告'],
});
assert.deepEqual(Array.from(sanitized.keywords), ['普通文字', '/猫|狗/']);
assert.deepEqual(Array.from(sanitized.excludeKeywords), ['广告']);

const hiddenClasses = new Set();
const fakeArticle = {
  classList: {
    contains: (value) => hiddenClasses.has(value),
    add: (value) => hiddenClasses.add(value),
    remove: (value) => hiddenClasses.delete(value),
  },
  dataset: {},
};
let applied = setAdultSpamHidden(fakeArticle, { hidden: true, score: 9, reasons: ['测试'] });
assert.equal(applied.hidden, true);
assert.equal(applied.changed, true);
applied = setAdultSpamHidden(fakeArticle, { hidden: true, score: 9, reasons: ['测试'] });
assert.equal(applied.hidden, true);
assert.equal(applied.changed, false);
applied = setAdultSpamHidden(fakeArticle, { hidden: false, score: 0, reasons: [] });
assert.equal(applied.hidden, false);
assert.equal(applied.changed, true);

const nestedVideo = {
  type: 'video',
  media_url_https: 'https://pbs.twimg.com/amplify_video_thumb/2093917435867148288/img/example.jpg',
  video_info: {
    variants: [
      { content_type: 'video/mp4', bitrate: 256000, url: 'https://video.twimg.com/amplify_video/low.mp4' },
      { content_type: 'video/mp4', bitrate: 2176000, url: 'https://video.twimg.com/amplify_video/high.mp4' },
    ],
  },
};
const nestedGif = {
  type: 'animated_gif',
  media_url_https: 'https://pbs.twimg.com/tweet_video_thumb/GIFPOSTER.jpg',
  video_info: {
    variants: [
      { content_type: 'video/mp4', url: 'https://video.twimg.com/tweet_video/GIFPOSTER.mp4' },
    ],
  },
};
const nestedPayload = {
  data: {
    tweetResult: {
      result: {
        rest_id: '1000000000000000001',
        legacy: { id_str: '1000000000000000001' },
        quoted_status_result: {
          result: {
            rest_id: '1000000000000000002',
            legacy: {
              id_str: '1000000000000000002',
              extended_entities: { media: [nestedVideo, nestedGif] },
            },
          },
        },
      },
    },
  },
};
assert.equal(extractMediaFromTweetDetail(nestedPayload, '1000000000000000001'), true);

const videoElement = {
  getAttribute: (name) => name === 'poster'
    ? 'https://pbs.twimg.com/amplify_video_thumb/2093917435867148288/img/example.jpg?format=jpg&name=small'
    : '',
};
const gifElement = {
  getAttribute: (name) => name === 'poster'
    ? 'https://pbs.twimg.com/tweet_video_thumb/GIFPOSTER.jpg'
    : '',
};
const nestedArticle = {
  querySelectorAll: (selector) => {
    if (selector === 'video[poster]') return [videoElement, gifElement];
    if (selector.includes('img[src*="/amplify_video_thumb/"]')) return [videoElement, gifElement];
    return [];
  },
};
const nestedMedia = collectMedia(nestedArticle, '1000000000000000001');
assert.deepEqual(Array.from(nestedMedia.videos), ['https://video.twimg.com/amplify_video/high.mp4']);
assert.deepEqual(Array.from(nestedMedia.gifs), ['https://video.twimg.com/tweet_video/GIFPOSTER.mp4']);

assert.equal(sanitizeNotificationSubscription({ id: 'bad', username: 'valid_name' }), null);
assert.equal(sanitizeNotificationSubscription({ id: '123', username: 'bad-name' }), null);
const notificationSettings = sanitizeSettings({
  notificationSubscriptions: [
    { id: '123', username: 'Valid_Name', enabled: true, avatarUrl: 'https://pbs.twimg.com/a.jpg' },
    { id: '456', username: 'valid_name', enabled: false },
    { id: 'bad', username: 'ignored' },
  ],
  notificationSubscriptionsSyncedAt: Number.MAX_SAFE_INTEGER + 100,
});
assert.equal(notificationSettings.notificationSubscriptions.length, 1);
assert.equal(notificationSettings.notificationSubscriptions[0].username, 'Valid_Name');
assert.equal(notificationSettings.notificationSubscriptionsSyncedAt, Number.MAX_SAFE_INTEGER);
assert.equal(getCurrentViewerId(), '123456789012345678');

harvestNotificationRelationship({
  rest_id: '987654321',
  core: { screen_name: 'SubscribedUser', name: '订阅用户' },
  notifications_settings: { notifications_enabled: true },
});
assert.equal(notificationSubscriptions.get('subscribeduser').enabled, true);

// 普通关注列表中的 false 可能来自裁剪响应，不能覆盖已经确认的订阅。
harvestNotificationRelationship({
  id_str: '987654321',
  screen_name: 'SubscribedUser',
  notifications: false,
});
assert.equal(notificationSubscriptions.get('subscribeduser').enabled, true);

// 用户资料返回的明确关闭状态可以更新本地管理记录。
harvestNotificationRelationship({
  rest_id: '987654321',
  core: { screen_name: 'SubscribedUser', name: '订阅用户' },
  notifications_settings: { notifications_enabled: false },
});
assert.equal(notificationSubscriptions.get('subscribeduser').enabled, false);

console.log('BetterX v3.1.0 regression tests passed');
