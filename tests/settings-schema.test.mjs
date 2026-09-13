import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const scriptPath = new URL('../更好的X（BetterX）v3.4.0.js', import.meta.url);
let source = await readFile(scriptPath, 'utf8');
const startupPattern = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;
assert.match(source, startupPattern, '找不到脚本启动标记');
source = source.replace(startupPattern, `
  globalThis.__betterxSettingsSchemaTest = {
    DEFAULT_SETTINGS,
    SETTINGS_SCHEMA,
    SETTINGS_EFFECT_ORDER,
    SETTINGS_EFFECT_HANDLERS,
    state,
    sanitizeSettings,
    bindSettingsControls,
    syncSettingsControls,
    syncInactiveInput,
    syncControlProperties,
    readIntegerSetting,
    SETTING_REMOVE_ACTIONS,
    PANEL_ACTION_HANDLERS,
    PANEL_ELEMENT_IDS,
    SOURCE_SORT_RANK,
    SOURCE_EXACT_LABELS,
    getAvailableSources,
    localizeSourceLabel,
  };
`);

const context = {
  console,
  navigator: { userAgent: '', language: 'zh-CN', languages: ['zh-CN'] },
  location: { origin: 'https://x.com', href: 'https://x.com/home', pathname: '/home', search: '' },
  document: { body: null, cookie: '', documentElement: { lang: 'zh-CN' }, activeElement: null },
  URL,
  URLSearchParams,
  setTimeout,
  clearTimeout,
  GM_getValue: (_key, fallback) => fallback,
};
context.globalThis = context;
context.window = context;
vm.runInNewContext(source, context, { filename: scriptPath.pathname });

const api = context.__betterxSettingsSchemaTest;
assert.ok(api, '未导出设置 Schema 测试接口');
assert.deepEqual(
  Object.keys(api.SETTINGS_SCHEMA).sort(),
  Object.keys(api.DEFAULT_SETTINGS).sort(),
  '每个默认设置都必须进入 Schema'
);
for (const [key, definition] of Object.entries(api.SETTINGS_SCHEMA)) {
  assert.deepEqual(definition.default, api.DEFAULT_SETTINGS[key], `${key} 的 Schema 默认值不一致`);
  assert.ok(Array.isArray(definition.validate) && definition.validate.length, `${key} 缺少 Schema 校验器`);
  for (const effect of definition.effects || []) {
    assert.ok(api.SETTINGS_EFFECT_ORDER.includes(effect), `${key} 引用了未排序的副作用 ${effect}`);
    assert.equal(typeof api.SETTINGS_EFFECT_HANDLERS[effect], 'function');
  }
}

const defaultsAfterSanitize = JSON.parse(JSON.stringify(api.sanitizeSettings({})));
assert.deepEqual(defaultsAfterSanitize, JSON.parse(JSON.stringify(api.DEFAULT_SETTINGS)));
const sanitized = JSON.parse(JSON.stringify(api.sanitizeSettings({
  keywordMode: 'invalid',
  maxPosts: 99999,
  downloadConcurrency: 0,
  markReadOnClick: 'false',
  sourceFilter: '',
  knownFollowedHandles: ['@Alice', 'alice', '@bad-handle'],
  notificationSubscriptionsSyncedAt: '123.9',
  downloadedPostIds: ['123', '123', 'bad'],
  badgePos: { left: 12, bottom: 34 },
  hideAppBadgeOnDesktop: true,
  useMobileBadgeHandle: true,
  mobileBadgeHandleTop: 12.6,
  profileDefaultView: 'invalid',
})));
assert.equal(sanitized.keywordMode, api.DEFAULT_SETTINGS.keywordMode);
assert.equal(sanitized.maxPosts, 5000);
assert.equal(sanitized.downloadConcurrency, 1);
assert.equal(sanitized.markReadOnClick, api.DEFAULT_SETTINGS.markReadOnClick);
assert.equal(sanitized.sourceFilter, api.DEFAULT_SETTINGS.sourceFilter);
assert.deepEqual(sanitized.knownFollowedHandles, ['alice']);
assert.equal(sanitized.notificationSubscriptionsSyncedAt, 123);
assert.deepEqual(sanitized.downloadedPostIds, ['123']);
assert.deepEqual(sanitized.badgePos, { left: 12, bottom: 34 });
assert.equal(sanitized.hideAppBadge, true);
assert.equal(sanitized.useMobileBadgeHandle, false);
assert.equal(sanitized.mobileBadgeHandleTop, 13);
assert.equal(sanitized.profileDefaultView, api.DEFAULT_SETTINGS.profileDefaultView);

const controls = new Map();
const panel = {
  querySelector(selector) {
    if (!controls.has(selector)) {
      controls.set(selector, {
        value: '',
        checked: false,
        listeners: new Map(),
        addEventListener(type, listener) { this.listeners.set(type, listener); },
      });
    }
    return controls.get(selector);
  },
};
api.bindSettingsControls(panel);
const boundDefinitions = Object.values(api.SETTINGS_SCHEMA).filter((definition) => definition.control);
assert.equal(controls.size, boundDefinitions.length, '每个声明式控件应只绑定一次');
assert.ok([...controls.values()].every((control) => control.listeners.has('change')));

api.state.settings = {
  ...api.DEFAULT_SETTINGS,
  theme: 'dark',
  hideAds: false,
  profileDefaultView: 'video',
};
api.syncSettingsControls();
assert.equal(controls.get('#BetterX-theme').value, 'dark');
assert.equal(controls.get('#BetterX-hideads').checked, false);
assert.equal(controls.get('#BetterX-profile-default-view').value, 'video');

assert.equal(api.readIntegerSetting({ value: '99999' }, 'maxPosts'), 5000);
assert.equal(api.readIntegerSetting({ value: '7' }, 'flashMs', 1000), 7000);
assert.equal(api.readIntegerSetting(null, 'downloadConcurrency', 1, 2), 2);
const inactiveInput = { value: '' };
api.syncInactiveInput(inactiveInput, 42);
assert.equal(inactiveInput.value, '42');
context.document.activeElement = inactiveInput;
api.syncInactiveInput(inactiveInput, 99);
assert.equal(inactiveInput.value, '42', '正在编辑的输入不应被 UI 刷新覆盖');

const propertyControl = {};
api.syncControlProperties([[propertyControl, 'checked', true], [null, 'disabled', true]]);
assert.equal(propertyControl.checked, true);
const panelIds = Array.from(Object.values(api.PANEL_ELEMENT_IDS));
assert.equal(new Set(panelIds).size, panelIds.length, '面板引用 ID 不应重复');
for (const id of panelIds) assert.match(source, new RegExp(`id=["']BetterX-${id}["']`));

assert.equal(api.localizeSourceLabel('Home'), '主页');
assert.equal(api.localizeSourceLabel('Thread @alice'), '帖子详情 @alice');
api.state.posts = [
  { sourceLabel: 'Profile @alice' }, { sourceLabel: 'Home' }, { sourceLabel: 'Other' },
  { sourceLabel: 'Search' }, { sourceLabel: 'Bookmarks' }, { sourceLabel: 'For You' },
];
assert.deepEqual(Array.from(api.getAvailableSources()), [
  'Search', 'Bookmarks', 'Home', 'For You', 'Other', 'Profile @alice',
]);
assert.equal(api.SOURCE_SORT_RANK.size, 4);
assert.equal(api.SOURCE_EXACT_LABELS.Notifications, '通知');

assert.equal(api.SETTINGS_SCHEMA.mediaDownload.control, undefined, '下载控件仍应使用原专用逻辑');
assert.equal(api.SETTINGS_SCHEMA.downloadZip.control, undefined, '下载 UI 不应纳入本次通用绑定');

const mappedActions = [
  'set-panel-view', 'sync-notification-users', 'search-notification-users',
  'toggle-notification-pin', 'toggle-notification-user', 'forget-notification-user',
  'menu-toggle', 'close', 'refresh', 'switch-language', 'export', 'backup', 'import',
  'clear-non-fav', 'set-filter', 'toggle-skip', 'save-keywords', 'save-exclude',
  'save-adultspam-keywords', 'save-adultspam-whitelist', 'load-more', 'toggle-expand',
  'save-note', 'cancel-note', 'open', 'pin', 'fav', 'delete',
];
for (const action of mappedActions) {
  assert.equal(typeof api.PANEL_ACTION_HANDLERS[action], 'function', `${action} 未进入通用动作表`);
}
assert.deepEqual(
  Object.keys(api.SETTING_REMOVE_ACTIONS).sort(),
  ['remove-adultspam-keyword', 'remove-adultspam-whitelist', 'remove-exclude-keyword', 'remove-keyword']
);
for (const action of ['download-cancel', 'download-retry', 'insert-download-name-token', 'save-download-naming']) {
  assert.equal(api.PANEL_ACTION_HANDLERS[action], undefined, `${action} 必须继续留在下载专用逻辑`);
}

console.log('Settings schema bindings and metadata are consistent.');
