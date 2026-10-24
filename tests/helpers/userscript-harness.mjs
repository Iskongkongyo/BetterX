import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

export const source = await readFile(new URL('../../更好的X（BetterX）v4.0.0.js', import.meta.url), 'utf8');
const startup = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;

export function instrumentUserscript(exports, setup = '') {
  assert.match(source, startup, 'Cannot find the userscript startup boundary');
  return source.replace(startup, `${setup}\nglobalThis.__test = {state, DEFAULT_SETTINGS, ${exports}};`);
}

export function loadUserscript(exports, setup = '', additions = {}) {
  const context = {
    console, URL, URLSearchParams, Blob, TextEncoder, TextDecoder, AbortController,
    navigator: { userAgent: '', language: 'zh-CN', languages: ['zh-CN'] },
    location: { origin: 'https://x.com', href: 'https://x.com/home', pathname: '/home', search: '' },
    document: { body: null, cookie: '', documentElement: { lang: 'zh-CN' }, querySelectorAll: () => [] },
    setTimeout: () => 1, clearTimeout: () => {}, queueMicrotask,
    GM_getValue: (_key, fallback) => fallback,
    ...additions,
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(instrumentUserscript(exports, setup), context, { filename: 'BetterX-regression.js' });
  return context;
}

export function createMemoryDb() {
  const records = { posts: new Map(), settings: new Map() };
  const db = {
    transaction(name, mode) {
      const tx = { objectStore() {
        const data = records[name];
        return {
          get(key) {
            const req = {};
            queueMicrotask(() => { req.result = data.get(key); req.onsuccess?.(); });
            return req;
          },
          getAll() {
            const req = {};
            queueMicrotask(() => { req.result = [...data.values()]; req.onsuccess?.(); });
            return req;
          },
          put(value) { data.set(value.id ?? value.key, structuredClone(value)); },
          delete(key) { data.delete(key); },
        };
      } };
      if (mode === 'readwrite') queueMicrotask(() => queueMicrotask(() => tx.oncomplete?.()));
      return tx;
    },
  };
  return { db, records };
}
