import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const scriptPath = new URL('../更好的X（BetterX）v3.9.0.js', import.meta.url);
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
    migrateSettingsDefaults,
    sanitizeImportedPost,
    getCurrentSourceInfo,
    filterPosts,
    buildSkipSourcesHtml,
    upsertPost,
    renderPostItem,
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
assert.equal(api.DEFAULT_SETTINGS.flashMs, 3000);
assert.equal(api.DEFAULT_SETTINGS.downloadTimeout, 360000);
assert.deepEqual(Array.from(api.DEFAULT_SETTINGS.skipSources), ['thread']);
const migratedDefaults = api.sanitizeSettings(api.migrateSettingsDefaults({
  settingsRevision: 38, flashMs: 8000, downloadTimeout: 360000, skipSources: [],
}));
assert.equal(migratedDefaults.flashMs, 3000);
assert.equal(migratedDefaults.downloadTimeout, 360000);
assert.deepEqual(Array.from(migratedDefaults.skipSources), ['thread']);
const migratedCustom = api.sanitizeSettings(api.migrateSettingsDefaults({
  settingsRevision: 38, flashMs: 5000, downloadTimeout: 120000, skipSources: ['likes'],
}));
assert.equal(migratedCustom.flashMs, 5000);
assert.equal(migratedCustom.downloadTimeout, 120000);
assert.deepEqual(Array.from(migratedCustom.skipSources), ['likes']);
assert.deepEqual(Array.from(api.sanitizeSettings(api.migrateSettingsDefaults({
  settingsRevision: api.DEFAULT_SETTINGS.settingsRevision, skipSources: [],
})).skipSources), [], '升级后手动关闭帖子详情排除时应保留选择');
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
  gifDownloadFormat: 'invalid',
})));
assert.equal(sanitized.keywordMode, api.DEFAULT_SETTINGS.keywordMode);
assert.equal(sanitized.maxPosts, 5000);
assert.equal(sanitized.downloadConcurrency, 1);
assert.ok(!Object.hasOwn(sanitized, 'markReadOnClick'), '点击帖子空白处算已读不再是可关闭设置');
assert.equal(api.DEFAULT_SETTINGS.panelWidth, 520);
assert.equal(api.sanitizeSettings({ panelWidth: 100 }).panelWidth, 420);
assert.equal(api.sanitizeSettings({ panelWidth: 5000 }).panelWidth, 1200);
assert.equal(sanitized.sourceFilter, api.DEFAULT_SETTINGS.sourceFilter);
assert.deepEqual(sanitized.knownFollowedHandles, ['alice']);
assert.equal(sanitized.notificationSubscriptionsSyncedAt, 123);
assert.deepEqual(sanitized.downloadedPostIds, ['123']);
assert.deepEqual(sanitized.badgePos, { left: 12, bottom: 34 });
assert.equal(sanitized.hideAppBadge, true);
assert.equal(sanitized.useMobileBadgeHandle, false);
assert.equal(sanitized.mobileBadgeHandleTop, 13);
assert.equal(sanitized.profileDefaultView, api.DEFAULT_SETTINGS.profileDefaultView);
assert.equal(sanitized.gifDownloadFormat, 'mp4');
assert.equal(sanitized.gifDownloadFormatEnabled, true);
assert.equal(api.sanitizeSettings({ gifDownloadFormatEnabled: false }).gifDownloadFormatEnabled, false);

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
  hideNfl: false,
  profileDefaultView: 'video',
  gifDownloadFormatEnabled: false,
  gifDownloadFormat: 'gif',
};
api.syncSettingsControls();
assert.equal(controls.get('#BetterX-theme').value, 'dark');
assert.equal(controls.get('#BetterX-hideads').checked, false);
assert.equal(controls.get('#BetterX-hide-nfl').checked, false);
assert.equal(controls.get('#BetterX-profile-default-view').value, 'video');
assert.equal(controls.get('#BetterX-gif-download-format-enabled').checked, false);
assert.equal(controls.get('#BetterX-gif-download-format').value, 'gif');

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

assert.equal(api.localizeSourceLabel('Likes'), '喜欢');
assert.equal(api.localizeSourceLabel('Thread @alice'), '帖子详情 @alice');
api.state.posts = [
  { sourceLabel: 'Profile @alice' }, { sourceLabel: 'Home' }, { sourceLabel: 'Other' },
  { sourceLabel: 'Search' }, { sourceLabel: 'Bookmarks' }, { sourceLabel: 'For You' },
  { sourceLabel: 'Following' },
  { sourceLabel: '/compose/post' }, { sourceLabel: '/i/history' }, { sourceLabel: '/i/history/likes' },
  { sourceLabel: '/i/premium_sign_up' }, { sourceLabel: 'Unknown' },
];
assert.deepEqual(Array.from(api.getAvailableSources()), [
  'Search', 'Bookmarks', 'Likes', 'For You', 'Following', 'Profile @alice',
]);
assert.equal(api.SOURCE_SORT_RANK.size, 5);
assert.equal(api.SOURCE_EXACT_LABELS.Notifications, '通知');

for (const [sourceFilter, expected] of [
  ['Home', 'all'], ['主页', 'all'], ['/compose/post', 'all'],
  ['/i/history', 'Bookmarks'], ['/i/history/likes', 'Likes'],
  ['/i/premium_sign_up', 'all'], ['Unknown', 'all'], ['Other', 'all'],
]) assert.equal(api.sanitizeSettings({ sourceFilter }).sourceFilter, expected);

for (const [path, type, label] of [
  ['/i/history', 'bookmarks', 'Bookmarks'], ['/i/history/', 'bookmarks', 'Bookmarks'],
  ['/i/history/likes', 'likes', 'Likes'], ['/i/history/likes/', 'likes', 'Likes'],
  ['/i/bookmarks', 'page', ''], ['/compose/post', 'compose', ''],
  ['/i/lists/123456789', 'list', 'List'], ['/i/lists', 'page', ''],
  ['/i/history/likes-extra', 'page', ''], ['/i/premium_sign_up', 'page', ''],
  ['/settings/unknown', 'page', ''],
]) {
  context.location.pathname = path;
  assert.equal(api.getCurrentSourceInfo().type, type, path);
  assert.equal(api.getCurrentSourceInfo().label, label, path);
}
context.location.pathname = '/home';
let activeTab = '';
context.document.querySelectorAll = () => [
  { innerText: '正在关注', closest: () => ({ id: 'BetterX-root' }) },
  { innerText: activeTab, closest: () => null },
];
for (const tab of ['Following', '正在关注', '正在關注', '關注中', 'フォロー中']) {
  activeTab = tab;
  assert.equal(api.getCurrentSourceInfo().label, 'Following', tab);
}
for (const tab of ['For you', '为你推荐', '為你推薦', 'おすすめ']) {
  activeTab = tab;
  assert.equal(api.getCurrentSourceInfo().label, 'For You', tab);
}
activeTab = '';
assert.equal(api.getCurrentSourceInfo().label, '', '未加载的页签不能生成主页来源');

const skipSources = api.sanitizeSettings({ skipSources: ['bookmarks', 'notifications', 'likes', 'list'] }).skipSources;
assert.deepEqual(Array.from(skipSources), ['bookmarks', 'likes', 'list'], '旧通知页排除设置应移除，喜欢页应可保存设置');
api.state.settings.skipSources = [...api.DEFAULT_SETTINGS.skipSources];
assert.match(api.buildSkipSourcesHtml(), /BetterX-chip active[^>]*data-skip="thread"[^>]*>帖子详情</,
  '帖子详情按钮默认应点亮');
api.state.settings.skipSources = ['likes'];
const skipHtml = api.buildSkipSourcesHtml();
assert.match(skipHtml, /BetterX-chip active[^>]*data-skip="likes"[^>]*>喜欢页</);
assert.match(skipHtml, /data-skip="bookmarks"[^>]*>书签页</);
assert.doesNotMatch(skipHtml, /data-skip="notifications"|通知页/);
api.state.settings.skipSources = [];

const legacyPost = { id: '123', text: '保留正文', favorite: true, note: '保留备注' };
const migratedLikes = api.sanitizeImportedPost({
  ...legacyPost, sourceLabel: 'Bookmarks', capturedPath: '/i/history/likes?test=1',
  sourceHistory: ['Home', '/compose/post', '/i/history/likes'],
});
assert.equal(migratedLikes.sourceLabel, 'Likes');
assert.equal(migratedLikes.sourceType, 'likes');
assert.deepEqual(Array.from(migratedLikes.sourceHistory), ['Likes']);
assert.equal(migratedLikes.text, legacyPost.text);
assert.equal(migratedLikes.note, legacyPost.note);
assert.equal(migratedLikes.favorite, true);
api.state.settings.sourceFilter = 'Likes';
assert.equal(api.filterPosts([migratedLikes]).length, 1, '喜欢来源应能筛出迁移后的记录');
api.state.settings.sourceFilter = 'all';
assert.equal(api.sanitizeImportedPost({ ...legacyPost, sourceLabel: '/i/history' }).sourceLabel, 'Bookmarks');
assert.equal(api.sanitizeImportedPost({ ...legacyPost, sourceLabel: 'Home' }).sourceLabel, '');
assert.equal(api.sanitizeImportedPost({
  ...legacyPost, sourceLabel: '/compose/post', sourceHistory: ['Following', '/compose/post'],
}).sourceLabel, 'Following', '移除发帖来源时应恢复之前的有效来源');
const unknownPost = api.sanitizeImportedPost({
  ...legacyPost, sourceType: 'page', sourceLabel: '/i/premium_sign_up',
  capturedPath: '/i/premium_sign_up', sourceHistory: ['Search', '/i/premium_sign_up'],
});
assert.equal(unknownPost.sourceLabel, '', '未知路径只能归入全部来源，不能回退成历史来源');
assert.deepEqual(Array.from(unknownPost.sourceHistory), ['Search'], '已知历史来源应保留，未知路径应移除');
assert.equal(unknownPost.text, legacyPost.text);
assert.match(api.renderPostItem(unknownPost), /当前来源: 全部来源/, '未知路径帖子应显示当前来源为全部来源');

api.state.posts = [{ ...legacyPost, sourceLabel: 'Search', sourceType: 'search' }];
api.state.dbWriteQueue = new Promise(() => {});
api.upsertPost({ ...api.state.posts[0], sourceLabel: '', sourceType: 'page', capturedPath: '/i/premium_sign_up' },
  { countCapture: false });
assert.equal(api.state.posts[0].sourceLabel, '', '未知页面再次抓取时也应清除旧的当前来源');
assert.equal(api.state.posts[0].favorite, true);
assert.equal(api.state.posts[0].note, legacyPost.note);
assert.deepEqual(Array.from(api.getAvailableSources()), [], '未知页面不能生成独立来源选项');
assert.equal(api.filterPosts(api.state.posts).length, 1, '未知来源帖子仍应出现在全部来源中');
api.state.settings.sourceFilter = 'Search';
assert.equal(api.filterPosts(api.state.posts).length, 0, '未知来源帖子不应混入已知来源筛选');
api.state.settings.sourceFilter = 'all';

assert.equal(api.SETTINGS_SCHEMA.mediaDownload.control, undefined, '下载控件仍应使用原专用逻辑');
assert.equal(api.SETTINGS_SCHEMA.downloadZip.control, undefined, '下载 UI 不应纳入本次通用绑定');
assert.match(source, /settingKey === 'bypassAgeRestriction'[\s\S]*navigateToSensitiveContentSettings\(\)/,
  '仅在用户手动开启取消年龄限制时跳转到设置页');
assert.match(source, /location\.assign\(SENSITIVE_CONTENT_SETTINGS_URL\)/,
  '敏感内容设置应在当前标签页打开');
assert.match(source, /sessionStorage\.setItem\(SENSITIVE_CONTENT_NOTICE_SESSION_KEY, '1'\)/,
  '设置提示应传递到目标页面后再显示');

const mappedActions = [
  'set-panel-view', 'sync-notification-users', 'search-notification-users',
  'toggle-notification-pin', 'toggle-notification-user', 'forget-notification-user',
  'menu-toggle', 'close', 'refresh', 'switch-language', 'export', 'backup', 'import',
  'clear-non-fav', 'set-filter', 'toggle-skip', 'save-keywords', 'save-exclude',
  'save-adultspam-keywords', 'save-adultspam-whitelist', 'load-more', 'toggle-expand',
  'save-note', 'cancel-note', 'open', 'pin', 'fav', 'delete', 'mark-all-read',
  'preview-image', 'save-layout', 'edit-note', 'copy',
];
for (const action of mappedActions) {
  assert.equal(typeof api.PANEL_ACTION_HANDLERS[action], 'function', `${action} 未进入通用动作表`);
}
assert.deepEqual(
  Object.keys(api.SETTING_REMOVE_ACTIONS).sort(),
  ['remove-adultspam-keyword', 'remove-adultspam-whitelist', 'remove-exclude-keyword', 'remove-keyword']
);
assert.match(source, /applySettingsSnapshot\(importedSettings,\s*\{ preserveFirefoxCompatibility: true \}\)/,
  '备份设置必须通过统一副作用入口恢复');
assert.match(source, /followedHandles\.clear\(\)/, '恢复设置时不能保留备份外的旧关注账号');
assert.match(source, /notificationSubscriptions\.clear\(\)/, '恢复设置时必须重建通知订阅运行时状态');
for (const action of ['download-cancel', 'download-retry', 'insert-download-name-token', 'save-download-naming']) {
  assert.equal(api.PANEL_ACTION_HANDLERS[action], undefined, `${action} 必须继续留在下载专用逻辑`);
}

console.log('Settings schema bindings and metadata are consistent.');
