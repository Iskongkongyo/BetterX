import assert from 'node:assert/strict';
import { loadUserscript, createMemoryDb } from './helpers/userscript-harness.mjs';

class Article {
  constructor(id, text) {
    this.id = id;
    this.text = text;
    this.dataset = {};
    const classes = new Set();
    this.classList = { contains: key => classes.has(key), add: key => classes.add(key), remove: key => classes.delete(key) };
  }
  querySelector() { return null; }
  querySelectorAll(selector) { return selector === '[data-testid="tweetText"]' ? [{ innerText: this.text }] : []; }
}

{
  const context = loadUserscript('captureArticle, getAdultSpamInput', `
    extractAuthor = () => ({displayName:'Author',username:'@author',timeLabel:''});
    getStatusLink = article => 'https://x.com/author/status/' + article.id;
    getCurrentSourceInfo = () => ({type:'for_you',label:'For You'});
    detectMedia = () => ({hasImage:false,hasVideo:false,thumbs:[]});
    extractAvatar = () => '';
  `, { HTMLElement: Article });
  const api = context.__test;
  const { db, records } = createMemoryDb();
  api.state.dbPromise = Promise.resolve(db);
  Object.assign(api.state.settings, { hideAds: false, hideAdultSpam: true });
  const article = new Article('123', 'a'.repeat(120000));
  const input = api.getAdultSpamInput(article);
  assert.equal(input.text.length, 2500, 'Spam scoring must keep its bounded input');
  assert.equal(input.fullText.length, 100000, 'Capture must retain the full allowed post text');
  api.captureArticle(article);
  await api.state.dbWriteQueue;
  assert.equal(records.posts.get('123').text.length, 100000);
  article.text = 'a short loading placeholder';
  api.state.visibleMap.clear();
  api.captureArticle(article);
  await api.state.dbWriteQueue;
  assert.equal(records.posts.get('123').text.length, 100000, 'Revisiting a partial DOM must not shorten a saved long post');
  Object.assign(api.state.settings, { hideAdultSpam: false, adultSpamKeywords: ['never_present'] });
  api.captureArticle(new Article('124', 'a'.repeat(10000)));
  await api.state.dbWriteQueue;
  assert.equal(records.posts.get('124').text.length, 10000, 'Custom rules alone must not truncate saved text');
  api.captureArticle(new Article('124', 'a'.repeat(12000)));
  await api.state.dbWriteQueue;
  assert.equal(records.posts.get('124').text.length, 12000, 'Changes beyond the scoring prefix must still update the saved post');
}

{
  const api = loadUserscript('isSafeRegexSource, sanitizeSettings').__test;
  const unsafe = [
    '(a+)+$', '((a+))+$', '(?:(?:a+))+$', '((a|aa))+$',
    'a*(?:a*)b', '(?:a*)(?:a*)b', 'a*(?:b|a*)c', 'a*A*A*b',
    String.raw`a*\0141*a*b`, String.raw`a*\cA*a*b`,
  ];
  for (const inner of ['a+', 'a*', 'a?', 'a{1,3}', 'a|aa']) {
    for (let depth = 1; depth <= 5; depth++) unsafe.push('(?:'.repeat(depth) + inner + ')'.repeat(depth) + '+$');
  }
  for (const pattern of unsafe) assert.equal(api.isSafeRegexSource(pattern), false, `Unsafe expression accepted: ${pattern}`);
  const safe = ['cat|dog', '^cat$', 'a+b+c+', '[a-f]+[g-z]+', '^[a-z0-9_]{1,15}$', '(?:cat)+$', '(?=cat)cat', String.raw`^https?://[^/]+/`];
  for (const pattern of safe) assert.equal(api.isSafeRegexSource(pattern), true, `Safe expression rejected: ${pattern}`);
  const settings = api.sanitizeSettings({
    ...api.DEFAULT_SETTINGS, keywords: ['/((a+))+$/', 'cat'],
    excludeKeywords: ['/(?:(?:a|aa))+$/', 'dog'], downloadNameRegex: '((a+))+$',
  });
  assert.deepEqual(Array.from(settings.keywords), ['cat']);
  assert.deepEqual(Array.from(settings.excludeKeywords), ['dog']);
  assert.equal(settings.downloadNameRegex, '', 'Previously persisted unsafe rules must be removed on load');
}

{
  let settingsPrompts = 0;
  const alerts = [];
  const errors = [];
  const context = loadUserscript('partitionPostExport, buildPostExportBlob, importPosts', '', {
    console: { ...console, error: (...args) => errors.push(args) },
    alert: message => alerts.push(message), confirm: () => { settingsPrompts++; return true; },
  });
  const api = context.__test;
  const { db, records } = createMemoryDb();
  api.state.dbPromise = Promise.resolve(db);
  const metadata = { type: 'x-post-vault-backup', version: '1.2.0', settings: { ...api.DEFAULT_SETTINGS, theme: 'dark' } };
  const posts = Array.from({ length: 1000 }, (_, i) => ({ id: String(i + 1), text: '文'.repeat(10000), note: 'memo', firstCapturedAt: i + 1, lastCapturedAt: i + 1 }));
  const groups = api.partitionPostExport(posts, metadata);
  assert.equal(groups.length, 2, 'The formerly un-restorable 30 MB backup must be split');
  const files = groups.map((group, index) => api.buildPostExportBlob(group, metadata, { index: index + 1, total: groups.length }));
  for (const file of files) assert.ok(file.size <= 25 * 1024 * 1024, 'Every volume must satisfy the importer byte limit');
  assert.equal(await api.importPosts(files), true);
  assert.equal(settingsPrompts, 1, 'Multi-volume restore must ask about settings once');
  assert.equal(records.posts.size, 1000);
  assert.equal(records.posts.get('1000').text, posts[999].text);
  assert.equal(records.posts.get('1').note, 'memo');
  assert.equal((await api.state.dbWriteQueue), undefined);
  assert.equal(records.settings.get('settings').value.theme, 'dark');
  assert.equal(api.state.importInProgress, false);
  assert.match(alerts.at(-1), /新增 1000 条/);

  const small = api.partitionPostExport(posts.slice(0, 3).map(post => ({ ...post, text: '😀文'.repeat(10) })), null, 256, 2);
  for (const group of small) assert.ok(api.buildPostExportBlob(group, null).size <= 256);
  assert.equal(small.flat().length, 3);
  assert.equal(JSON.parse(await api.buildPostExportBlob([{ id: '1' }], {}).text()).posts[0].id, '1');
  const countLimited = api.partitionPostExport(Array.from({ length: 20001 }, (_, i) => ({ id: String(i + 1) })), null);
  assert.deepEqual(Array.from(countLimited, group => group.length), [20000, 1]);
  assert.throws(() => api.partitionPostExport([{ id: '1', text: '文'.repeat(100) }], null, 100), /EXPORT_RECORD_TOO_LARGE/);

  // A malformed later volume must not report complete success or discard already committed volumes.
  const legacy = new Blob([JSON.stringify([{ id: '1001', text: 'legacy array', favorite: true }])]);
  const malformed = new Blob(['{"posts":']);
  assert.equal(await api.importPosts([legacy, malformed]), false);
  assert.equal(records.posts.get('1001').text, 'legacy array');
  assert.match(alerts.at(-1), /此前已导入的分卷会保留/);
  assert.equal(errors.length, 1, 'Malformed-volume failure must be recorded');
  assert.equal(api.state.importInProgress, false);
  assert.equal(await api.importPosts(legacy), true, 'A failed operation must allow retry and legacy single-file imports');
  assert.equal(records.posts.get('1001').favorite, true);
}

console.log('Critical regressions preserve long posts, reject nested regex bypasses, and round-trip bounded JSON backup volumes.');
