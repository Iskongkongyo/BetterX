const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', '更好的X（BetterX）v3.1.2.js');
let source = fs.readFileSync(scriptPath, 'utf8');
const startupPattern = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;
assert.match(source, startupPattern, '找不到脚本启动标记');
assert.match(source, /<option value="posts">帖子<\/option>[\s\S]*?<option value="all">全部<\/option>[\s\S]*?<option value="highlights">亮点<\/option>[\s\S]*?<option value="video">视频<\/option>[\s\S]*?<option value="photo">图片<\/option>/,
  '主页默认查看选择器缺少帖子、全部、亮点、视频或图片');
assert.match(source, /<label class="BetterX-field inline"><input type="checkbox" id="BetterX-profile-post-sort-enabled" \/> 用户主页帖子排序方式<\/label>[\s\S]*?<option value="recent">最近<\/option>[\s\S]*?<option value="popular">热门<\/option>/,
  '常用功能缺少用户主页排序开关或选择器');
assert.match(source, /if \(shouldBypassProfileNavigationRedirect\(\)\) return;\r?\n\s+const profileTarget = getProfileTargetFromClickTarget\(target\);/,
  '账号切换放行标记必须在解析 HoverCard UserCell 前生效');
assert.match(source, /state\.posts\.push\(created\);\r?\n\s+maybeShowPostLimitWarning\(\);/,
  '新增帖子后应检查是否接近最大条数');
assert.match(source, /data-dialog-choice="tertiary" hidden/,
  '通用对话框应提供第三操作按钮');
assert.match(source, /tertiaryText: '不再提示'[\s\S]*?postLimitWarningDisabled: true/,
  '容量提醒弹窗应提供持久关闭提醒的操作');
assert.match(source, /id="BetterX-advanced-settings"[\s\S]*?<summary>高级设置<\/summary>/,
  '高级设置区域应提供可跳转定位点');

source = source.replace(startupPattern, `
  globalThis.__betterxTest = {
    state,
    DEFAULT_SETTINGS,
    sanitizeSettings,
    getPostLimitWarningThreshold,
    getConfiguredProfileDefaultView,
    getConfiguredProfilePostSort,
    getPreferredProfileViewUrl,
    getProfileTargetFromClickTarget,
    armProfileNavigationBypassGuard,
    redirectBareProfileToPreferredView,
  };
`);

const sessionValues = new Map();
let replacedUrl = '';
const context = {
  console,
  navigator: { userAgent: '', language: 'zh-CN', languages: ['zh-CN'] },
  location: {
    origin: 'https://x.com',
    href: 'https://x.com/home',
    pathname: '/home',
    search: '',
    replace() {},
    assign() {},
  },
  history: {
    state: null,
    replaceState(_state, _title, url) { replacedUrl = String(url); },
    pushState() {},
  },
  sessionStorage: {
    getItem(key) { return sessionValues.has(key) ? sessionValues.get(key) : null; },
    setItem(key, value) { sessionValues.set(key, String(value)); },
    removeItem(key) { sessionValues.delete(key); },
  },
  document: {
    body: null,
    cookie: '',
    readyState: 'loading',
    documentElement: { lang: 'zh-CN' },
  },
  URL,
  URLSearchParams,
  setTimeout,
  clearTimeout,
  GM_getValue: (_key, fallback) => fallback,
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: scriptPath });

const api = context.__betterxTest;
api.state.settingsLoaded = true;
assert.equal(api.DEFAULT_SETTINGS.settingsRevision, 31);
const configure = (view, sort, defaultViewEnabled = true, sortEnabled = true) => {
  api.state.settings = {
    ...api.DEFAULT_SETTINGS,
    profileDefaultViewEnabled: defaultViewEnabled,
    profileDefaultView: view,
    profilePostSortEnabled: sortEnabled,
    profilePostSort: sort,
  };
};

configure('posts', 'recent');
assert.equal(api.getConfiguredProfilePostSort(), 'recent');
assert.equal(api.getPreferredProfileViewUrl('https://x.com/Luckin030'), '',
  '默认“帖子 + 最近”不应改写主页链接');

configure('posts', 'popular');
let target = new URL(api.getPreferredProfileViewUrl('https://x.com/Luckin030'));
assert.equal(target.pathname, '/Luckin030');
assert.equal(target.search, '?sort=popular');

configure('all', 'popular');
target = new URL(api.getPreferredProfileViewUrl('https://x.com/Luckin030'));
assert.equal(target.pathname, '/Luckin030/all');
assert.equal(target.search, '?sort=popular');

configure('all', 'recent');
target = new URL(api.getPreferredProfileViewUrl('https://x.com/Luckin030?ref=profile&sort=popular'));
assert.equal(target.pathname, '/Luckin030/all');
assert.equal(target.searchParams.get('ref'), 'profile');
assert.equal(target.searchParams.has('sort'), false, '最近模式应移除脚本生成目标中的热门参数');

configure('video', 'popular');
assert.equal(api.getConfiguredProfileDefaultView(), 'video');
target = new URL(api.getPreferredProfileViewUrl('https://x.com/wwyyy232351'));
assert.equal(target.pathname, '/wwyyy232351/media');
assert.equal(target.search, '', '视频页不应叠加热门排序参数');

configure('photo', 'popular');
assert.equal(api.getConfiguredProfileDefaultView(), 'photo');
target = new URL(api.getPreferredProfileViewUrl('https://x.com/wwyyy232351'));
assert.equal(target.pathname, '/wwyyy232351/media');
assert.equal(target.search, '?filter=photo', '图片页应使用 filter=photo 且不叠加热门排序参数');

configure('all', 'popular');
assert.equal(api.getPreferredProfileViewUrl('https://x.com/Luckin030/status/123'), '',
  '帖子详情链接不应被当成用户主页');
assert.equal(api.getPreferredProfileViewUrl('https://example.com/Luckin030'), '',
  '站外链接不应被改写');

const accountSwitcherTarget = {
  closest(selector) {
    return selector.includes('[role="menu"]') ? { role: 'menu' } : null;
  },
};
assert.equal(api.getProfileTargetFromClickTarget(accountSwitcherTarget), null,
  '账号切换菜单内的用户链接必须交还给 X 处理');

configure('all', 'recent');
context.location.href = 'https://x.com/SecondAccount';
context.location.pathname = '/SecondAccount';
context.location.search = '';
sessionValues.clear();
replacedUrl = '';
api.armProfileNavigationBypassGuard();
assert.equal(api.redirectBareProfileToPreferredView(), false,
  '账号切换期间的中间主页导航不应被改写为“全部”');
assert.equal(replacedUrl, '', '账号切换放行标记应跨导航阻止主页改写');

assert.equal(api.sanitizeSettings({ profilePostSort: 'popular' }).profilePostSort, 'popular');
assert.equal(api.sanitizeSettings({ profilePostSort: 'invalid' }).profilePostSort, 'recent');
assert.equal(api.sanitizeSettings({}).profilePostSort, 'recent');
assert.equal(api.sanitizeSettings({ profilePostSortEnabled: false }).profilePostSortEnabled, false);
assert.equal(api.sanitizeSettings({}).profilePostSortEnabled, true);
assert.equal(api.sanitizeSettings({ profileDefaultView: 'video' }).profileDefaultView, 'video');
assert.equal(api.sanitizeSettings({ profileDefaultView: 'photo' }).profileDefaultView, 'photo');
assert.equal(api.sanitizeSettings({ profileDefaultView: 'invalid' }).profileDefaultView, 'posts');
assert.equal(api.getPostLimitWarningThreshold(1000), 900);
assert.equal(api.getPostLimitWarningThreshold(50), 45);
assert.equal(api.sanitizeSettings({ postLimitWarningDisabled: true }).postLimitWarningDisabled, true);
assert.equal(api.sanitizeSettings({}).postLimitWarningDisabled, false);

configure('posts', 'popular', true, false);
assert.equal(api.getConfiguredProfilePostSort(), 'recent', '关闭排序开关后应按“最近”处理');
assert.equal(api.getPreferredProfileViewUrl('https://x.com/Luckin030'), '',
  '关闭排序开关后不应添加热门参数');

configure('posts', 'popular');
context.location.href = 'https://x.com/Luckin030';
context.location.pathname = '/Luckin030';
context.location.search = '';
sessionValues.clear();
replacedUrl = '';
assert.equal(api.redirectBareProfileToPreferredView(), true,
  '直接进入纯用户主页时也应应用热门排序');
assert.equal(new URL(replacedUrl).pathname, '/Luckin030');
assert.equal(new URL(replacedUrl).search, '?sort=popular');

console.log('BetterX v3.1.2 profile sort tests passed');
