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
const release = await readFile(new URL('../更好的X（BetterX）v3.8.0.js', import.meta.url), 'utf8');
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
assert.doesNotMatch(builtHtml, /BetterX-markread|点帖子空白处算已读/,
  '高级设置不再提供点击帖子空白处算已读的开关');
assert.match(builtHtml, /id="BetterX-post-limit-warning" \/> 帖子上限提示/,
  '其他功能应使用帖子上限提示名称');
assert.match(builtHtml, /data-resize-edge="left"[\s\S]*data-resize-edge="right"/,
  'PC 面板应提供左右两侧的宽度拖动边缘');
assert.match(builtHtml, /在新打开的窗口里建议勾选上“显示可能含有敏感内容的媒体内容”/,
  '取消年龄限制说明应提示用户检查 X 的敏感内容设置');
const downloadHistoryIndex = builtHtml.indexOf('id="BetterX-track-downloaded-posts"');
const downloadAdvancedIndex = builtHtml.indexOf('id="BetterX-download-advanced"');
const saveDownloadNamingIndex = builtHtml.indexOf('data-action="save-download-naming"');
const mediaDownloadIndex = builtHtml.indexOf('id="BetterX-mediadl"');
const gifFormatIndex = builtHtml.indexOf('id="BetterX-gif-download-format"');
const gifFormatEnabledIndex = builtHtml.indexOf('id="BetterX-gif-download-format-enabled"');
const downloadZipIndex = builtHtml.indexOf('id="BetterX-dlzip"');
assert.ok(mediaDownloadIndex < gifFormatEnabledIndex && gifFormatEnabledIndex < gifFormatIndex && gifFormatIndex < downloadZipIndex,
  'GIF 格式开关与选择应位于一键下载开关下方、ZIP 设置上方');
assert.match(builtHtml, /id="BetterX-gif-download-format-enabled" \/> GIF内容下载格式/,
  'GIF 内容下载格式应带独立勾选框');
assert.match(builtHtml, /id="BetterX-gif-download-format" aria-label="GIF内容下载格式"/,
  'GIF 格式选择应使用新名称');
assert.match(builtHtml, /id="BetterX-gif-download-format"[\s\S]*?<option value="mp4">MP4<\/option>[\s\S]*?<option value="gif">GIF<\/option>/,
  'GIF 格式选择应提供 MP4 和 GIF 两项，并将 MP4 放在默认位置');
const stylesSource = await readFile(new URL('../src/ui/styles.part.js', import.meta.url), 'utf8');
assert.match(stylesSource, /\.BetterX-profile-default-view-row, \.BetterX-gif-format-row \{ flex-wrap: nowrap; justify-content: space-between; \}/,
  'GIF 格式选择应与用户主页默认页签使用相同的横向布局');
assert.ok(downloadHistoryIndex < downloadAdvancedIndex, '下载记录开关应位于下载高级设置折叠区外');
assert.ok(downloadAdvancedIndex < saveDownloadNamingIndex, '自定义命名设置应位于下载高级设置折叠区内');
assert.match(
  builtHtml,
  /id="BetterX-advanced-settings"[\s\S]*?<div class="BetterX-adv-body"> <div class="BetterX-adv-label">以下页面中的帖子不会保存到 BetterX：<\/div> <div class="BetterX-chip-row" id="BetterX-skip-sources"><\/div> <div class="BetterX-row">/,
  '页面排除标签应位于总高级设置的最上方'
);

console.log('Build compacts the main panel template while preserving interpolation and source formatting.');
