import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const scriptPath = new URL('../更好的X（BetterX）v3.4.0.js', import.meta.url);
const originalSource = await readFile(scriptPath, 'utf8');
const startupPattern = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;
assert.match(originalSource, startupPattern, '找不到脚本启动标记');

assert.match(originalSource, /panel\.innerHTML = uiHtml`/, '静态面板应在生成 HTML 时直接翻译');
assert.doesNotMatch(originalSource, /function installUiLocalization/, '不应再扫描完整的初始 UI');
assert.doesNotMatch(originalSource, /uiLocalizationObserver/, '应删除整棵 UI 的国际化观察器状态');
assert.doesNotMatch(originalSource, /function localizeRenderedUi/, '普通动态 UI 不应保留后处理扫描入口');
assert.match(originalSource, /localizeBetterXTree\(state\.downloadNamePreviewEl\)/,
  '未改造的下载命名预览应保留局部翻译');
assert.match(originalSource, /observe\(downloadRoot, \{[\s\S]*?childList: true,[\s\S]*?characterData: true/,
  '未改造的下载弹层应保留局部翻译兼容层');

function load(locale) {
  const source = originalSource.replace(startupPattern, `
  globalThis.__betterxI18nTest = {
    UI_LANGUAGE,
    UI_TEXT_ENTRIES,
    uiText,
    uiHtml,
    localizeBetterXTree,
  };
`);
  const context = {
    console,
    navigator: { userAgent: '', language: locale, languages: [locale] },
    location: { origin: 'https://x.com', href: 'https://x.com/home', pathname: '/home', search: '' },
    document: { body: null, cookie: '', documentElement: { lang: locale } },
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    GM_getValue: (_key, fallback) => fallback,
  };
  context.globalThis = context;
  context.window = context;
  vm.runInNewContext(source, context, { filename: scriptPath.pathname });
  return context.__betterxI18nTest;
}

const english = load('en-US');
assert.equal(english.UI_LANGUAGE, 'en');
assert.ok(Array.from(english.UI_TEXT_ENTRIES).every((entry) => entry.length === 4 && entry.every(Boolean)));
assert.equal(english.uiText('总数 3 · 未读 2'), 'Total 3 · Unread 2');
assert.equal(
  english.uiHtml(['下载功能 ', ''], '<span>用户写的下载功能</span>'),
  'Downloads <span>用户写的下载功能</span>',
  '模板插值中的用户内容不得被翻译'
);
assert.equal(
  english.uiText('普通文字可直接输入；正则表达式请写成 <code>/表达式/</code>，例如 <code>/猫|狗/</code>。两种写法可以混用。'),
  'Enter plain text directly. Write regex as <code>/expression/</code>, for example <code>/cat|dog/</code>. Both forms can be mixed.',
  '带代码样式的设置说明也应完整翻译'
);

const uiNode = {
  nodeType: 3,
  nodeValue: '当前筛选条件下没有帖子。可以刷新页面、切换 X 标签页，或把筛选改回“全部”。',
  parentElement: { closest: () => null },
};
english.localizeBetterXTree(uiNode);
assert.equal(uiNode.nodeValue, 'No posts match the current filters. Refresh the page, switch X tabs, or reset the filter to All.');

const userContent = {
  nodeType: 3,
  nodeValue: '下载功能',
  parentElement: { closest: () => ({ className: 'BetterX-text' }) },
};
english.localizeBetterXTree(userContent);
assert.equal(userContent.nodeValue, '下载功能', '用户正文不得被界面国际化改写');

console.log('Explicit i18n rendering works without a whole-tree DOM observer.');
