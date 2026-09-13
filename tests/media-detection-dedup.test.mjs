import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/core/utilities-filtering.part.js', import.meta.url), 'utf8');
assert.equal((source.match(/const MEDIA_ASSET_RE\s*=/g) || []).length, 1);
assert.equal((source.match(/MEDIA_ASSET_RE\.test\(src\)/g) || []).length, 2);
assert.equal(
  (source.match(/pbs\\\.twimg\\\.com\\\/\(\?:media\|ext_tw_video_thumb/g) || []).length,
  1,
  '媒体资源模式只能初始化一次'
);

const start = source.indexOf('  const VIDEO_CONTAINER_SELECTORS');
const end = source.indexOf('  function extractAvatar');
assert.ok(start >= 0 && end > start, '找不到媒体识别逻辑');
const api = vm.runInNewContext(`(() => {
  const mediaRegistry = new Map();
  const cardRegistry = new Map();
  const getRegistryEntry = (registry, key) => registry.get(key);
  const uniqueStrings = (values) => [...new Set(values)];
${source.slice(start, end)}
  return { mediaRegistry, cardRegistry, detectMedia };
})()`, { filename: 'utilities-filtering.part.js' });

const element = (attributes) => ({
  getAttribute: (name) => attributes[name] || '',
  closest: () => null,
  parentElement: null,
});
const createArticle = () => {
  const queries = [];
  const videos = [element({ poster: 'https://pbs.twimg.com/video-poster.jpg' })];
  const images = [element({ src: 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/a.jpg' })];
  return {
    queries,
    querySelectorAll(selector) { queries.push(selector); return selector === 'video' ? videos : images; },
    querySelector() { return null; },
  };
};

api.mediaRegistry.set('1', { photos: [], videos: ['video.mp4'], gifs: [] });
api.cardRegistry.set('1', { photos: ['ignored.jpg'], videos: [], gifs: [] });
const primaryArticle = createArticle();
assert.deepEqual(JSON.parse(JSON.stringify(api.detectMedia(primaryArticle, '1'))), {
  hasImage: false,
  hasVideo: true,
  thumbs: ['https://pbs.twimg.com/video-poster.jpg', 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/a.jpg'],
});
assert.deepEqual(primaryArticle.queries, ['video', 'img[src]'], '主媒体仓库仍应优先并读取 video poster');

api.cardRegistry.set('2', { photos: [], videos: ['card-video.mp4'], gifs: [] });
const cardArticle = createArticle();
assert.equal(api.detectMedia(cardArticle, '2').hasVideo, true);
assert.deepEqual(cardArticle.queries, ['img[src]'], '卡片媒体分支不应新增 video poster 扫描');

console.log('Media detection shares its registered-media path and compiled asset pattern.');
