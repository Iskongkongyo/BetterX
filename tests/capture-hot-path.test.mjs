import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/posts/capture.part.js', import.meta.url), 'utf8');
const start = source.indexOf('  function captureArticle');
const end = source.indexOf('  function expandPostShowMore');
assert.ok(start >= 0 && end > start, '找不到帖子抓取逻辑');

const api = vm.runInNewContext(`(() => {
  class HTMLElement {}
  const article = new HTMLElement();
  const state = {
    settings: { hideAds: false, skipSources: [] },
    visibleMap: new Map(),
  };
  let statusLinkReads = 0;
  let authorReads = 0;
  let textReads = 0;
  let savedPost = null;
  const adultSpamFilteringEnabled = () => true;
  const evaluateAndApplyAdultSpam = (_article, outcome) => {
    statusLinkReads++;
    Object.assign(outcome, {
      input: { author: { displayName: 'Cached', username: '@cached', timeLabel: 'now' }, text: 'cached text' },
      url: 'https://x.com/cached/status/123',
      id: '123',
    });
    return false;
  };
  const getStatusLink = () => { statusLinkReads++; return 'https://x.com/cached/status/123'; };
  const extractStatusIdFromUrl = () => '123';
  const observeArticleView = () => {};
  const getCurrentSourceInfo = () => ({ type: 'home', label: 'Home' });
  const extractAuthor = () => { authorReads++; return {}; };
  const extractText = () => { textReads++; return ''; };
  const detectMedia = () => ({ hasImage: false, hasVideo: false, thumbs: [] });
  const extractAvatar = () => '';
  const upsertPost = (post) => { savedPost = post; };
  const now = () => 1;
  const location = { pathname: '/home', search: '' };
  const isAdArticle = () => false;
  const hideAdElement = () => {};
  const getPostById = () => null;
${source.slice(start, end)}
  captureArticle(article);
  return { statusLinkReads, authorReads, textReads, savedPost };
})()`, { filename: 'capture.part.js' });

assert.equal(api.statusLinkReads, 1, '每次抓取只应查询一次状态链接');
assert.equal(api.authorReads, 0, '应复用内容净化已经提取的作者');
assert.equal(api.textReads, 0, '应复用内容净化已经提取的正文');
assert.equal(api.savedPost.displayName, 'Cached');
assert.equal(api.savedPost.text, 'cached text');

console.log('Post capture reuses adult-spam parsing and reads the status link once.');
