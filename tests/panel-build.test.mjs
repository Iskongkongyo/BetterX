import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compactMarkupWhitespace, compactPanelTemplate } from '../scripts/strip-comments.mjs';

const fixture = [
  '',
  '  <div title="keep  two spaces">',
  '    标签文本',
  '  </div>',
  '',
].join('\n');
assert.equal(
  compactMarkupWhitespace(fixture),
  '<div title="keep  two spaces"> 标签文本 </div>'
);

const panelSource = await readFile(new URL('../src/ui/panel.part.js', import.meta.url), 'utf8');
const release = await readFile(new URL('../更好的X（BetterX）v3.6.0.js', import.meta.url), 'utf8');
const compactedSource = compactPanelTemplate(panelSource);
const opening = 'panel.innerHTML = uiHtml`';
const boundary = 'const fileInput';
const extractPanelHtml = (source) => {
  const start = source.indexOf(opening) + opening.length;
  const end = source.lastIndexOf('`;', source.indexOf(boundary, start));
  return source.slice(start, end);
};
const builtHtml = extractPanelHtml(release);

assert.ok(extractPanelHtml(panelSource).split(/\r?\n/).length > 250, '源码面板模板应继续保留可读排版');
assert.equal(builtHtml, extractPanelHtml(compactedSource));
assert.doesNotMatch(builtHtml, /[\r\n]/, '发布物中的主面板模板应压缩为一行');
assert.match(builtHtml, /APP_ICON_URL \? `<img/);
assert.match(builtHtml, /DOWNLOAD_NAME_TOKENS\.map/);
assert.match(builtHtml, /<section class="BetterX-view BetterX-settings-view"/);
assert.match(builtHtml, /id="BetterX-download-advanced"/);
assert.match(builtHtml, /id="BetterX-hide-nfl"[\s\S]*id="BetterX-hideads"/,
  '关闭 NFL 开关应位于关闭广告上方');
const downloadHistoryIndex = builtHtml.indexOf('id="BetterX-track-downloaded-posts"');
const downloadAdvancedIndex = builtHtml.indexOf('id="BetterX-download-advanced"');
const saveDownloadNamingIndex = builtHtml.indexOf('data-action="save-download-naming"');
assert.ok(downloadHistoryIndex < downloadAdvancedIndex, '下载记录开关应位于下载高级设置折叠区外');
assert.ok(downloadAdvancedIndex < saveDownloadNamingIndex, '自定义命名设置应位于下载高级设置折叠区内');
assert.match(
  builtHtml,
  /id="BetterX-advanced-settings"[\s\S]*?<div class="BetterX-adv-body"> <div class="BetterX-adv-label">以下页面中的帖子不会保存到 BetterX：<\/div> <div class="BetterX-chip-row" id="BetterX-skip-sources"><\/div> <div class="BetterX-row">/,
  '页面排除标签应位于总高级设置的最上方'
);

console.log('Build compacts the main panel template while preserving interpolation and source formatting.');
