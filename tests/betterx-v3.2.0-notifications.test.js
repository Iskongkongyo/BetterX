const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', '更好的X（BetterX）v3.2.0.js');
let source = fs.readFileSync(scriptPath, 'utf8');
const startupPattern = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;
assert.match(source, startupPattern, '找不到脚本启动标记');
source = source.replace(startupPattern, `
  globalThis.__betterxNotificationTest = {
    DEFAULT_SETTINGS,
    state,
    notificationSubscriptions,
    sanitizeSettings,
    sanitizeNotificationSubscription,
    rememberNotificationSubscription,
    harvestNotificationRelationship,
    getCurrentViewerId,
    getCurrentSourceInfo,
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

const api = context.__betterxNotificationTest;
assert.ok(api, '测试导出应存在');
assert.equal(api.DEFAULT_SETTINGS.settingsRevision, 27);
assert.equal(api.DEFAULT_SETTINGS.notificationTimelineEnabled, true);
assert.equal(api.getCurrentViewerId(), '123456789012345678');

const sanitized = api.sanitizeSettings({
  notificationTimelineEnabled: false,
  notificationSubscriptions: [
    { id: '111111', username: '@Example', displayName: '示例', enabled: true, updatedAt: 100 },
    { id: '111111', username: 'example', displayName: '重复', enabled: false, updatedAt: 200 },
    { id: 'not-an-id', username: 'invalid', enabled: true },
  ],
});
assert.equal(sanitized.notificationTimelineEnabled, false);
assert.equal(sanitized.notificationSubscriptions.length, 1);
assert.equal(sanitized.notificationSubscriptions[0].username, 'Example');
assert.equal(sanitized.notificationSubscriptions[0].enabled, true);

api.harvestNotificationRelationship({
  rest_id: '222222',
  core: { screen_name: 'SubscribedUser', name: '订阅用户' },
  avatar: { image_url: 'https://pbs.twimg.com/profile_images/example.jpg' },
  notifications_settings: { notifications_enabled: true },
});
let item = api.notificationSubscriptions.get('subscribeduser');
assert.ok(item);
assert.equal(item.id, '222222');
assert.equal(item.enabled, true);

api.harvestNotificationRelationship({
  id_str: '222222',
  screen_name: 'SubscribedUser',
  name: '订阅用户',
  notifications: false,
});
item = api.notificationSubscriptions.get('subscribeduser');
assert.equal(item.enabled, false);

api.harvestNotificationRelationship({
  id_str: '333333',
  screen_name: 'OrdinaryFollow',
  notifications: false,
});
assert.equal(api.notificationSubscriptions.has('ordinaryfollow'), false);

api.harvestNotificationRelationship({
  relationship: {
    source: { notifications_enabled: true },
    target: {
      id_str: '444444',
      screen_name: 'BellToggle',
      name: '原生铃铛操作',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/native.jpg',
    },
  },
});
assert.equal(api.notificationSubscriptions.get('belltoggle').enabled, true);

context.location.pathname = '/i/timeline';
assert.equal(api.getCurrentSourceInfo().type, 'notification_subscriptions');

console.log('BetterX v3.2.0 notification tests passed');
