const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', '更好的X（BetterX）v3.1.2.js');
const originalSource = fs.readFileSync(scriptPath, 'utf8');
const startupPattern = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;
assert.match(originalSource, startupPattern, '找不到脚本启动标记');
assert.match(originalSource, /data-action="mark-all-read"[^>]*>全部已读<\/button>\s*<button[^>]*data-action="switch-language"[^>]*>切换语言<\/button>/,
  '语言按钮应紧跟在“全部已读”后面');

for (const locale of ['zh-CN', 'zh-TW', 'ja', 'en']) {
  assert.match(originalSource, new RegExp(`^// @name:${locale.replace('-', '\\-')}\\s+\\S`, 'm'));
  assert.match(originalSource, new RegExp(`^// @description:${locale.replace('-', '\\-')}\\s+\\S`, 'm'));
}

function load(locale, override = '') {
  const source = originalSource.replace(startupPattern, `
  globalThis.__betterxTest = {
    UI_LANGUAGE,
    UI_TEXT_ENTRIES,
    uiText,
    shouldSkipUiLocalization,
  };
`);
  const context = {
    console,
    navigator: { userAgent: '', language: locale, languages: [locale] },
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
    GM_getValue: (key, fallback) => key === 'betterx_ui_language_v1' ? override : fallback,
    document: {
      body: null,
      cookie: '',
      documentElement: { lang: locale },
    },
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: scriptPath });
  return context.__betterxTest;
}

const simplified = load('zh-CN');
assert.equal(simplified.UI_LANGUAGE, 'zh-CN');
assert.equal(simplified.uiText('总数 3 · 未读 2'), '总数 3 · 未读 2');
assert.ok(simplified.UI_TEXT_ENTRIES.every((entry) => entry.length === 4 && entry.every(Boolean)));

const traditional = load('zh-Hant');
assert.equal(traditional.UI_LANGUAGE, 'zh-TW');
assert.equal(traditional.uiText('总数 3 · 未读 2'), '總數 3 · 未讀 2');
assert.equal(traditional.uiText('下载功能'), '下載功能');

const japanese = load('ja-JP');
assert.equal(japanese.UI_LANGUAGE, 'ja');
assert.equal(japanese.uiText('总数 3 · 未读 2'), '合計 3 · 未読 2');
assert.equal(japanese.uiText('下载功能'), 'ダウンロード');
assert.equal(japanese.uiText('开启“兼容 Firefox”？'), 'Firefox 互換モードを有効にしますか？');

const english = load('en-US');
assert.equal(english.UI_LANGUAGE, 'en');
assert.equal(english.uiText('总数 3 · 未读 2'), 'Total 3 · Unread 2');
assert.equal(english.uiText('下载功能'), 'Downloads');
assert.equal(english.uiText('当前筛选条件下没有帖子。可以刷新页面、切换 X 标签页，或把筛选改回“全部”。'),
  'No posts match the current filters. Refresh the page, switch X tabs, or reset the filter to All.');
assert.equal(english.uiText('确定要把当前列表的 3 条未读帖子全部标为已读吗？'),
  'Mark all 3 unread posts in the current list as read?');

const overridden = load('ja-JP', 'en');
assert.equal(overridden.UI_LANGUAGE, 'en', '手动语言选择应优先于页面语言');

assert.equal(english.shouldSkipUiLocalization({
  nodeType: 3,
  parentElement: { closest: () => ({ className: 'BetterX-text' }) },
}), true, '帖子正文应跳过界面翻译');
assert.equal(english.shouldSkipUiLocalization({
  nodeType: 3,
  parentElement: { closest: () => null },
}), false, '普通界面文案应允许翻译');

console.log('BetterX v3.1.2 i18n tests passed');
