import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const scriptPath = new URL('../更好的X（BetterX）v3.8.0.js', import.meta.url);
let source = await readFile(scriptPath, 'utf8');
const startupPattern = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;
assert.match(source, startupPattern, '找不到脚本启动标记');
source = source.replace(startupPattern, `
  globalThis.__betterxStorageTest = {
    state, DEFAULT_SETTINGS, dbGetAllPosts, dbPutPost, dbPutPosts, dbDeletePost, dbDeleteMany,
    dbGetSetting, dbPutSetting, dbPatchPost, dbMergeSettings, persistSettings, queuePostPut,
    markClicked, toggleFavorite, togglePin, markFlashLost, updatePostNote,
  };
`);

const context = {
  console,
  navigator: { userAgent: '', language: 'zh-CN', languages: ['zh-CN'] },
  location: { origin: 'https://x.com', href: 'https://x.com/home', pathname: '/home', search: '' },
  document: { body: null, cookie: '', documentElement: { lang: 'zh-CN' } },
  URL,
  URLSearchParams,
  setTimeout,
  clearTimeout,
  queueMicrotask,
  GM_getValue: (_key, fallback) => fallback,
};
context.globalThis = context;
context.window = context;
vm.runInNewContext(source, context, { filename: scriptPath.pathname });

const api = context.__betterxStorageTest;
const records = {
  posts: new Map(),
  settings: new Map(),
};
const fakeDb = {
  transaction(storeName, mode) {
    const tx = {
      objectStore() {
        const data = records[storeName];
        return {
          getAll() {
            const request = { result: [...data.values()] };
            queueMicrotask(() => request.onsuccess?.());
            return request;
          },
          get(key) {
            const request = { result: data.get(key) };
            queueMicrotask(() => request.onsuccess?.());
            return request;
          },
          put(value) { data.set(value.id ?? value.key, value); },
          delete(key) { data.delete(key); },
        };
      },
    };
    if (mode === 'readwrite') queueMicrotask(() => tx.oncomplete?.());
    return tx;
  },
};
api.state.dbPromise = Promise.resolve(fakeDb);

await api.dbPutPost({ id: '1', text: 'one' });
await api.dbPutPosts([{ id: '2', text: 'two' }, { id: '3', text: 'three' }]);
assert.deepEqual(
  JSON.parse(JSON.stringify(await api.dbGetAllPosts())),
  [{ id: '1', text: 'one' }, { id: '2', text: 'two' }, { id: '3', text: 'three' }]
);
await api.dbDeletePost('1');
await api.dbDeleteMany(['2']);
assert.deepEqual(JSON.parse(JSON.stringify(await api.dbGetAllPosts())), [{ id: '3', text: 'three' }]);

await api.dbPutSetting('settings', { theme: 'dark' });
assert.deepEqual(JSON.parse(JSON.stringify(await api.dbGetSetting('settings'))), { theme: 'dark' });

await api.queuePostPut({ id: '4', text: 'queued' });
assert.equal(records.posts.get('4').text, 'queued');

records.posts.set('5', {
  id: '5', text: 'old', favorite: true, pinned: true, clicked: true,
  flashLost: false, note: 'remote note', lastViewedAt: 20,
});
await api.dbPutPost({
  id: '5', text: 'new', favorite: false, pinned: false, clicked: false,
  flashLost: true, note: '', lastViewedAt: 10,
}, { preserveUserState: true });
assert.deepEqual(
  JSON.parse(JSON.stringify(records.posts.get('5'))),
  {
    id: '5', text: 'new', favorite: true, pinned: true, clicked: true,
    flashLost: true, note: 'remote note', firstViewedAt: 0, lastViewedAt: 20, lastClickedAt: 0,
  },
  'background capture must preserve newer user-controlled state from another tab'
);
await api.dbPatchPost('5', { text: 'patched' });
assert.equal(records.posts.get('5').favorite, true);
assert.equal(records.posts.get('5').note, 'remote note');
assert.equal(records.posts.get('5').text, 'patched');

await api.dbPutSetting('settings', { ...api.DEFAULT_SETTINGS, theme: 'dark', hideAds: true });
api.state.settings = { ...api.DEFAULT_SETTINGS, theme: 'light', hideAds: false };
await api.persistSettings(['hideAds']);
const mergedSettings = await api.dbGetSetting('settings');
assert.equal(mergedSettings.theme, 'dark', 'partial setting writes must retain other-tab fields');
assert.equal(mergedSettings.hideAds, false);

api.state.posts = [
  { id: '10', clicked: false, favorite: false, pinned: false, flashLost: false, note: '' },
  { id: '11', clicked: false, favorite: false, pinned: false, flashLost: false, note: '' },
];
api.markClicked('10');
api.toggleFavorite('10');
api.togglePin('10');
api.updatePostNote('10', 'memo');
api.markFlashLost('11');
await api.state.dbWriteQueue;
assert.deepEqual(
  JSON.parse(JSON.stringify(api.state.posts)),
  [
    { id: '10', clicked: true, favorite: true, pinned: true, flashLost: false, note: 'memo', lastClickedAt: api.state.posts[0].lastClickedAt },
    { id: '11', clicked: false, favorite: false, pinned: false, flashLost: true, note: '', flashLostAt: api.state.posts[1].flashLostAt },
  ]
);
assert.equal(records.posts.get('10').note, 'memo');
assert.equal(records.posts.get('11').flashLost, true);

console.log('Shared IndexedDB helpers preserve read, write, batch and queued operations.');
