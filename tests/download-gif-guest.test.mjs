import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/download/download.part.js', import.meta.url), 'utf8');

const gifStart = source.indexOf('  const GIF_CONVERSION_MAX_DIMENSION');
const gifEnd = source.indexOf('  function saveBlob', gifStart);
assert.ok(gifStart >= 0 && gifEnd > gifStart, '找不到 GIF 编码实现');
const gifApi = vm.runInNewContext(`(() => {
${source.slice(gifStart, gifEnd)}
  return { createAnimatedGifEncoder };
})()`, { Blob, Map, Math, TextEncoder, Uint8Array });

const width = 30;
const height = 20;
const expectedPixels = Uint8Array.from({ length: width * height }, (_, index) => (
  (index * 73 + Math.floor(index / width) * 19) & 0xFF
));
const encoder = gifApi.createAnimatedGifEncoder(width, height);
encoder.addFrame(expectedPixels, 10);
const gifBlob = encoder.finish();
const gif = new Uint8Array(await gifBlob.arrayBuffer());
assert.equal(new TextDecoder().decode(gif.subarray(0, 6)), 'GIF89a');
assert.equal(gifBlob.type, 'image/gif');
assert.equal(gif[gif.length - 1], 0x3B, 'GIF 应以 trailer 结束');

const imageDescriptorOffset = 6 + 7 + 768 + 19 + 8;
assert.equal(gif[imageDescriptorOffset], 0x2C, '首帧应包含图像描述符');
const minCodeSize = gif[imageDescriptorOffset + 10];
let blockOffset = imageDescriptorOffset + 11;
const compressed = [];
while (gif[blockOffset]) {
  const size = gif[blockOffset++];
  compressed.push(...gif.subarray(blockOffset, blockOffset + size));
  blockOffset += size;
}

function decodeGifLzw(data, minimumCodeSize) {
  const clearCode = 1 << minimumCodeSize;
  const endCode = clearCode + 1;
  let codeSize = minimumCodeSize + 1;
  let nextCode = endCode + 1;
  let bitOffset = 0;
  let previous = null;
  let dictionary = [];
  const output = [];
  const reset = () => {
    dictionary = Array.from({ length: clearCode }, (_, index) => [index]);
    dictionary[clearCode] = [];
    dictionary[endCode] = [];
    codeSize = minimumCodeSize + 1;
    nextCode = endCode + 1;
    previous = null;
  };
  const readCode = () => {
    let code = 0;
    for (let bit = 0; bit < codeSize; bit++) {
      const absolute = bitOffset + bit;
      code |= ((data[absolute >> 3] >> (absolute & 7)) & 1) << bit;
    }
    bitOffset += codeSize;
    return code;
  };
  reset();
  while (bitOffset + codeSize <= data.length * 8) {
    const code = readCode();
    if (code === clearCode) { reset(); continue; }
    if (code === endCode) break;
    let entry = dictionary[code];
    if (!entry && code === nextCode && previous) entry = [...previous, previous[0]];
    assert.ok(entry, `无效 GIF LZW 码：${code}`);
    output.push(...entry);
    if (previous && nextCode < 4096) {
      dictionary[nextCode++] = [...previous, entry[0]];
      if (nextCode === (1 << codeSize) && codeSize < 12) codeSize++;
    }
    previous = entry;
  }
  return Uint8Array.from(output);
}

assert.deepEqual(
  Array.from(decodeGifLzw(Uint8Array.from(compressed), minCodeSize).subarray(0, expectedPixels.length)),
  Array.from(expectedPixels),
  'GIF LZW 数据应能无损还原索引帧'
);

const placementStart = source.indexOf('  function findTopLevelArticleElement');
const placementEnd = source.indexOf('  function injectDownloadButtons', placementStart);
assert.ok(placementStart >= 0 && placementEnd > placementStart, '找不到未登录操作栏定位实现');
const placementApi = vm.runInNewContext(`(() => {
${source.slice(placementStart, placementEnd)}
  return { findGuestDownloadActionPlacement, placeDownloadControls };
})()`);

const article = {};
const row = {
  inserted: null,
  insertCount: 0,
  insertBefore(controls, before) {
    this.inserted = { controls, before };
    this.insertCount++;
    controls.parentElement = this;
    controls.nextSibling = before;
  },
};
const makeAction = () => ({ parentElement: row, closest: () => article });
const reply = makeAction();
const repost = makeAction();
const like = makeAction();
const trailing = { parentElement: row };
const share = { parentElement: trailing, closest: () => article };
const selectorMap = new Map([
  ['[data-engagement-action="reply"]', [reply]],
  ['[data-engagement-action="retweet"]', [repost]],
  ['[data-engagement-action="like"]', [like]],
  ['[data-engagement-action="share"]', [share]],
  ['[role="group"]', []],
]);
article.querySelectorAll = (selector) => selectorMap.get(selector) || [];
article.appendChild = () => assert.fail('未登录帖子不应退回右上角悬浮定位');
article.style = {};
const controlClasses = new Set();
const controls = {
  parentElement: null,
  classList: {
    add: (...names) => names.forEach((name) => controlClasses.add(name)),
    remove: (...names) => names.forEach((name) => controlClasses.delete(name)),
  },
};
placementApi.placeDownloadControls(article, controls);
assert.equal(row.inserted?.controls, controls);
assert.equal(row.inserted?.before, trailing);
assert.ok(controlClasses.has('guest-actions'));
assert.ok(controlClasses.has('in-group'), '未登录按钮应复用登录态操作栏样式');
assert.ok(!controlClasses.has('floating'));
placementApi.placeDownloadControls(article, controls);
assert.equal(row.insertCount, 1, '重复扫描时不应重新插入按钮，以免悬停闪烁或点击丢失');

const buttonRenderStart = source.indexOf('  function renderDownloadButtonContent');
const buttonRenderEnd = source.indexOf('  function renderDownloadTaskPopover', buttonRenderStart);
assert.ok(buttonRenderStart >= 0 && buttonRenderEnd > buttonRenderStart, '找不到下载按钮内容渲染函数');
const renderDownloadButtonContent = vm.runInNewContext(`(() => {
${source.slice(buttonRenderStart, buttonRenderEnd)}
  return renderDownloadButtonContent;
})()`);
let replacementCount = 0;
let currentContent;
const button = {
  dataset: {},
  set innerHTML(value) { replacementCount++; currentContent = { html: value }; },
  set textContent(value) { replacementCount++; currentContent = { text: value }; },
};
renderDownloadButtonContent(button, '⬇', true);
const downloadedIcon = currentContent;
for (let i = 0; i < 100; i++) renderDownloadButtonContent(button, '⬇', true);
assert.equal(currentContent, downloadedIcon, '反复刷新时不应替换已下载图标，否则鼠标点击可能丢失');
assert.equal(replacementCount, 1);
renderDownloadButtonContent(button, '下载', false);
const progressText = currentContent;
renderDownloadButtonContent(button, '下载', false);
assert.equal(currentContent, progressText, '下载进度文字未变时也不应重建内容');
renderDownloadButtonContent(button, '完成', false);
assert.equal(replacementCount, 3, '显示状态改变时仍应更新按钮内容');

const clickStart = source.indexOf('  async function handleDownloadClick');
const clickEnd = source.indexOf('  function isDownloadExcludedArticle', clickStart);
assert.ok(clickStart >= 0 && clickEnd > clickStart, '找不到下载按钮点击处理函数');
let finishLookup;
let confirmationCount = 0;
let lookupCount = 0;
let startedCount = 0;
const clickContext = {
  pendingDownloadStarts: new Set(), downloadJobs: new Map(),
  isActiveDownloadJob: () => false, isDownloadedPostRecorded: () => true,
  uiConfirm: () => { confirmationCount++; return true; },
  collectDownloadItems: () => [{ url: 'https://video.twimg.com/example.mp4', ext: 'mp4' }],
  needsOnDemandVideoLookup: () => true,
  requestTweetDetailMedia: () => { lookupCount++; return new Promise((resolve) => { finishLookup = resolve; }); },
  scheduleDownloadUiRefresh: () => {}, showToast: () => {},
  startDownloadJob: () => { startedCount++; },
  extractText: () => '', debugLog: () => {},
};
const handleDownloadClick = vm.runInNewContext(`(${source.slice(clickStart, clickEnd).trim()})`, clickContext);
const downloadArticle = { querySelector: () => null };
const firstClick = handleDownloadClick(downloadArticle, {}, '123');
await handleDownloadClick(downloadArticle, {}, '123');
assert.equal(confirmationCount, 1, '媒体地址查询中再次点击不应重复弹出重下确认');
assert.equal(lookupCount, 1, '重复点击不应发起第二次媒体地址查询');
finishLookup(true);
await firstClick;
assert.equal(startedCount, 1, '首次点击完成媒体查询后应自动启动下载');
assert.equal(clickContext.pendingDownloadStarts.size, 0, '查询完成后应清理等待状态');

assert.match(source, /gifDownloadFormat === 'gif'/,
  'GIF 下载格式应由设置选择');
assert.match(source, /ext: convertGifs \? 'gif' : 'mp4'/,
  'GIF 下载项应支持 MP4 与 GIF 扩展名');
assert.match(source, /if \(item\.convertToGif\)/,
  '只有选择 GIF 时才应进入转码流程');
assert.match(source, /blob = await convertMp4BlobToGif\(blob/,
  '选择 GIF 后，MP4 字节必须经过真实转码');

const collectStart = source.indexOf('  function collectDownloadItems');
const collectEnd = source.indexOf('  function articleMayContainVideo', collectStart);
assert.ok(collectStart >= 0 && collectEnd > collectStart, '找不到媒体下载项收集函数');
const collectContext = {
  state: { settings: { gifDownloadFormatEnabled: true, gifDownloadFormat: 'gif' } },
  collectMedia: () => ({ photos: [], gifs: ['https://video.twimg.com/animated.mp4'], videos: [] }),
  cardRegistry: new Map(), getRegistryEntry: () => null,
};
const collectDownloadItems = vm.runInNewContext(`(${source.slice(collectStart, collectEnd).trim()})`, collectContext);
const gifItem = collectDownloadItems({}, '123')[0];
assert.equal(gifItem.ext, 'gif');
assert.equal(gifItem.convertToGif, true);
collectContext.state.settings.gifDownloadFormatEnabled = false;
const mp4Item = collectDownloadItems({}, '123')[0];
assert.equal(mp4Item.ext, 'mp4', '关闭格式开关时 GIF 内容仍应以原始 MP4 下载');
assert.equal(mp4Item.convertToGif, false);

console.log('Guest controls and download buttons remain stable; GIF format switch preserves MP4 fallback.');
