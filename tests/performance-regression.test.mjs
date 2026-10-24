import assert from 'node:assert/strict';
import { loadUserscript, createMemoryDb } from './helpers/userscript-harness.mjs';

const measured = {};

{
  let regexConstructions = 0;
  function CountedRegExp(...args) { regexConstructions++; return new RegExp(...args); }
  const context = loadUserscript('filterPosts, keywordRuleMatches, keywordRuleCache', '', { RegExp: CountedRegExp });
  const api = context.__test;
  const rules = Array.from({ length: 10 }, (_, index) => `/absent_${index}/`);
  api.state.settings.excludeKeywords = rules;
  const posts = Array.from({ length: 5000 }, (_, index) => ({ id: String(index + 1), text: 'ordinary post' }));
  regexConstructions = 0;
  assert.equal(api.filterPosts(posts).length, posts.length);
  const coldCompilations = regexConstructions;
  assert.ok(coldCompilations <= 40, 'A filter pass must compile per rule, not per post');
  regexConstructions = 0;
  assert.equal(api.filterPosts(posts).length, posts.length);
  assert.equal(regexConstructions, 0, 'Unchanged rules must reuse compiled regexes');
  api.state.settings.excludeKeywords = ['/ordinary/'];
  assert.equal(api.filterPosts(posts).length, 0, 'Editing the rule list must change filtering immediately');
  api.state.settings.excludeKeywords = ['ORDINARY'];
  assert.equal(api.filterPosts(posts).length, 0, 'Plain words must remain case-insensitive');
  api.state.settings.excludeKeywords = ['/((a+))+$/'];
  assert.equal(api.filterPosts([{ id: 'x', text: 'a'.repeat(32) + '!' }]).length, 1, 'Unsafe cached rules must never execute');
  api.state.settings.excludeKeywords = rules;
  regexConstructions = 0;
  api.filterPosts(posts);
  assert.equal(regexConstructions, 0, 'Returning to previously used rules should reuse their compiled forms');
  for (const pattern of ['/cat|dog/', '/^hello$/', '/文/', 'literal']) {
    const text = pattern === 'literal' ? 'a LITERAL match' : 'hello cat 文';
    const source = pattern.startsWith('/') ? pattern.slice(1, -1) : null;
    const expected = source === null ? text.toLowerCase().includes(pattern) : new RegExp(source, 'i').test(text);
    for (let index = 0; index < 3; index++) assert.equal(api.keywordRuleMatches(pattern, text, text.toLowerCase()), expected);
  }
  for (let index = 0; index < 500; index++) api.keywordRuleMatches(`unique_${index}`, '', '');
  assert.ok(api.keywordRuleCache.size <= 200, 'Old edited rules must not cause unbounded cache growth');
  measured.regex = { records: 5000, rules: 10, coldConstructions: coldCompilations, warmConstructions: 0 };
}

{
  const calls = { badge: 0, vault: 0, settings: 0, notifications: 0, downloads: 0 };
  const context = loadUserscript('refreshUI, applySettingsSnapshot, followedHandles, notificationSubscriptions', `
    refreshBadge = () => globalThis.calls.badge++;
    refreshVaultUI = () => globalThis.calls.vault++;
    refreshSettingsUI = () => globalThis.calls.settings++;
    renderNotificationSubscriptions = () => globalThis.calls.notifications++;
    scheduleDownloadUiRefresh = () => globalThis.calls.downloads++;
  `, { calls });
  const api = context.__test;
  api.state.panelEl = {};
  api.state.panelOpen = true;
  api.state.panelView = 'settings';
  api.refreshUI();
  assert.equal(calls.settings, 1);
  assert.equal(calls.vault, 0);
  assert.equal(calls.notifications, 0);
  api.state.panelView = 'notifications';
  api.refreshUI();
  assert.equal(calls.notifications, 1);
  assert.equal(calls.vault, 0);
  assert.equal(calls.settings, 1);
  api.state.panelView = 'vault';
  api.refreshUI();
  assert.equal(calls.vault, 1);
  api.state.panelOpen = false;
  api.refreshUI();
  assert.equal(calls.badge, 4);
  assert.equal(calls.vault + calls.settings + calls.notifications, 3, 'Closed panels must not refresh any page');
  api.followedHandles.add('alice');
  api.notificationSubscriptions.set('alice', { id: '99', username: 'alice', enabled: true });
  const before = { ...calls };
  api.applySettingsSnapshot({ ...api.state.settings });
  assert.deepEqual(calls, before, 'An unchanged settings snapshot must not refresh UI or download tasks');
  assert.ok(api.followedHandles.has('alice'), 'An unchanged passive snapshot must preserve pending runtime relationships');
  assert.ok(api.notificationSubscriptions.has('alice'));
  api.applySettingsSnapshot({ ...api.state.settings }, { force: true });
  assert.equal(api.followedHandles.size, 0, 'Explicit backup restoration must still replace runtime relationships');
  assert.equal(api.notificationSubscriptions.size, 0);
  measured.views = { hiddenPageRefreshes: 0, unchangedSnapshotRefreshes: 0 };

  const guard = loadUserscript('renderNotificationSubscriptions').__test;
  guard.state.panelEl = { querySelector: () => { throw new Error('Hidden notification UI was queried'); } };
  guard.state.notificationListEl = {};
  guard.state.panelOpen = true;
  guard.state.panelView = 'settings';
  guard.renderNotificationSubscriptions();
  guard.state.panelOpen = false;
  guard.state.panelView = 'notifications';
  guard.renderNotificationSubscriptions();
}

{
  const context = loadUserscript('getPostById, getPostIndexById, rebuildPostIndex, upsertPost, dbPutPost, dbPatchPost, deletePost, enforceMaxPosts, markPostsRead', `
    const originalRebuildPostIndex = rebuildPostIndex;
    rebuildPostIndex = () => {globalThis.indexBuilds++; return originalRebuildPostIndex();};
  `, { indexBuilds: 0 });
  const api = context.__test;
  const { db } = createMemoryDb();
  api.state.dbPromise = Promise.resolve(db);
  api.state.settings.maxPosts = 5000;
  const posts = Array.from({ length: 5000 }, (_, index) => ({ id: String(index + 1), text: 'post' }));
  api.state.posts = posts;
  api.rebuildPostIndex();
  context.indexBuilds = 0;
  let scans = 0;
  posts.findIndex = () => { scans++; throw new Error('ID lookup scanned the posts array'); };
  for (let index = 0; index < 100; index++) assert.equal(api.getPostById('missing'), undefined);
  assert.equal(api.getPostById(1), posts[0]);
  assert.equal(context.indexBuilds, 0, 'Negative lookups must not rebuild a valid index');
  assert.equal(scans, 0);
  api.state.posts = [...posts].reverse();
  for (let index = 0; index < 100; index++) assert.equal(api.getPostById('missing'), undefined);
  assert.equal(context.indexBuilds, 1, 'Replacing the posts array should rebuild once');
  assert.equal(api.getPostIndexById('1'), 4999);
  api.state.postIndexById.set('1', 99999);
  assert.equal(api.getPostIndexById('1'), 4999, 'An inconsistent existing position should recover safely');

  api.state.posts = [];
  context.indexBuilds = 0;
  for (let index = 0; index < 100; index++) api.upsertPost({ id: String(10000 + index), text: 'new post' });
  await api.state.dbWriteQueue;
  assert.ok(context.indexBuilds <= 1, 'Appending posts should update the index without rebuilding for every post');
  assert.equal(api.getPostIndexById('10099'), 99);
  await api.dbPutPost({ id: '20000', text: 'another-tab record' });
  await api.dbPatchPost('20000', { note: 'patched' });
  assert.equal(api.getPostById('20000').note, 'patched', 'An incoming database record must be indexed immediately');
  api.deletePost('10000');
  await api.state.dbWriteQueue;
  assert.equal(api.getPostById('10000'), undefined);
  api.state.settings.maxPosts = 50;
  await api.enforceMaxPosts();
  assert.equal(api.state.posts.length, 50);
  api.markPostsRead(api.state.posts.slice(0, 2).map(post => post.id));
  await api.state.dbWriteQueue;
  for (let index = 0; index < api.state.posts.length; index++) assert.equal(api.getPostIndexById(api.state.posts[index].id), index);
  measured.index = { missingLookups: 100, fullArrayScans: scans, rebuildsForArrayReplacement: 1 };
}

console.log(JSON.stringify(measured));
console.log('Performance regressions cache filtering rules, refresh only the selected page, and keep negative ID lookups constant-time.');
