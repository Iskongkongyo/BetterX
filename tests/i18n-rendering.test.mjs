import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const scriptPath = new URL('../更好的X（BetterX）v3.9.0.js', import.meta.url);
const originalSource = await readFile(scriptPath, 'utf8');
const panelSource = await readFile(new URL('../src/ui/panel.part.js', import.meta.url), 'utf8');
const panelTemplateStart = panelSource.indexOf('panel.innerHTML = ') + 'panel.innerHTML = '.length;
const panelTemplateEnd = panelSource.indexOf('const fileInput', panelTemplateStart);
const panelTemplate = panelSource.slice(panelTemplateStart, panelTemplateEnd).trim().replace(/;$/, '');
const startupPattern = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;
assert.match(originalSource, startupPattern, '找不到脚本启动标记');

assert.match(originalSource, /panel\.innerHTML = uiHtml`/, '静态面板应在生成 HTML 时直接翻译');
assert.doesNotMatch(originalSource, /function installUiLocalization/, '不应再扫描完整的初始 UI');
assert.doesNotMatch(originalSource, /uiLocalizationObserver/, '应删除整棵 UI 的国际化观察器状态');
assert.doesNotMatch(originalSource, /function localizeRenderedUi/, '普通动态 UI 不应保留后处理扫描入口');
assert.doesNotMatch(originalSource, /localizeBetterXTree\(state\.downloadNamePreviewEl\)/,
  '下载命名预览应只翻译界面文案，保留用户自定义文件名');
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
    state,
    DEFAULT_SETTINGS,
    DOWNLOAD_NAME_TOKENS,
    localizeDownloadNameToken,
    localizeDownloadNameTemplate,
    normalizeDownloadNameTemplate,
    renderDownloadNameTemplate,
    downloadTemplateIncludesIndex,
    getDownloadItemFilename,
    updateDownloadNamingPreview,
    updateDownloadAdvancedHeader,
    insertDownloadNameToken,
    renderPanelHtml: () => (${panelTemplate}),
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
assert.equal(
  english.uiText('如果您没有勾选的话，麻烦您勾选上“显示可能含有敏感内容的媒体内容”，大部分成人内容会自动显示'),
  'If it is not already enabled, please enable “Display media that may contain sensitive content”. Most adult content will then appear automatically.'
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

for (const [locale, prefix, userName, indexToken] of [
  ['zh-CN', '命名效果预览：', '示例用户', '{序号}'],
  ['zh-TW', '命名效果預覽：', '範例使用者', '{序號}'],
  ['ja-JP', 'ファイル名プレビュー：', 'サンプルユーザー', '{連番}'],
  ['en-US', 'Filename preview: ', 'Sample user', '{index}'],
]) {
  const api = load(locale);
  const html = api.renderPanelHtml();
  const canonical = '{用户ID}_{帖子ID}';
  const localized = api.localizeDownloadNameTemplate(canonical);
  assert.ok(html.includes(`placeholder="${localized}"`), `${locale} 的模板输入提示应本地化`);
  assert.equal(api.normalizeDownloadNameTemplate(localized), canonical);
  const values = Object.fromEntries(Array.from(api.DOWNLOAD_NAME_TOKENS, ({ key }) => [key, `value-${key}`]));
  for (const { token, key } of api.DOWNLOAD_NAME_TOKENS) {
    const translated = api.localizeDownloadNameToken(token, key);
    assert.ok(html.includes(`data-token="${translated}">${translated}</button>`), `${locale} 的变量按钮应本地化`);
    assert.equal(english.renderDownloadNameTemplate(translated, values), values[key], '其他语言保存的模板也应能正确展开');
  }
  assert.equal(api.downloadTemplateIncludesIndex(indexToken), true);
  const job = {
    username: 'example', statusId: '123', items: [{}, {}],
    fileNameTemplate: api.localizeDownloadNameTemplate('{用户ID}_{序号}'),
  };
  assert.equal(api.getDownloadItemFilename(job, { index: 1, ext: 'jpg', mediaType: 'image' }), 'example_2.jpg',
    '本地化的序号变量不能造成重复追加序号');

  if (locale !== 'zh-CN') {
    assert.ok(!html.includes('点击变量会插入到当前正在编辑的模板中'));
    assert.ok(!html.includes('正则会在变量展开后'));
  }
  assert.ok(html.includes(`<code>${indexToken}</code>`));
  api.state.downloadFileNameTemplateEl = {
    value: api.localizeDownloadNameTemplate('下载功能_{用户名}'),
    selectionStart: 0, selectionEnd: 0, focus() {},
  };
  api.state.downloadZipNameTemplateEl = { value: localized };
  api.state.downloadNamePreviewEl = { textContent: '' };
  api.updateDownloadNamingPreview();
  assert.ok(api.state.downloadNamePreviewEl.textContent.startsWith(prefix));
  assert.ok(api.state.downloadNamePreviewEl.textContent.includes(`下载功能_${userName}.jpg`),
    '预览应翻译示例用户，但保留自定义文件名里的中文');
  api.insertDownloadNameToken(indexToken);
  assert.ok(api.state.downloadFileNameTemplateEl.value.startsWith(indexToken));
  assert.ok(api.state.downloadNamePreviewEl.textContent.startsWith(prefix), '插入变量后预览不能恢复中文标题');

  api.state.settings.downloadFileNameTemplate = localized;
  api.state.settings.downloadZipNameTemplate = localized;
  api.state.downloadAdvancedStateEl = { hidden: false, textContent: '' };
  api.updateDownloadAdvancedHeader();
  assert.equal(api.state.downloadAdvancedStateEl.hidden, true, '默认模板的本地化别名不能误判为自定义模板');
}
const englishPanel = english.renderPanelHtml();
assert.ok(englishPanel.includes('placeholder="Example: [\\s_]+"'));
assert.ok(englishPanel.includes('placeholder="Example: _; supports $1"'));
assert.ok(englishPanel.includes('Capture replacements such as <code>$1</code> are supported'));

console.log('Explicit i18n rendering works without a whole-tree DOM observer.');
