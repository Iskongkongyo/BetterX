import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadUserscript } from './helpers/userscript-harness.mjs';

function createSession(path = '/home', navigationType = 'navigate') {
  const location = new URL(path, 'https://x.com');
  const windowListeners = new Map();
  const documentListeners = new Map();
  const storage = new Map();
  const history = {
    state: null,
    pushState(state, _title, rawUrl) {
      this.state = state;
      location.href = new URL(rawUrl, location.href).href;
    },
    replaceState(state, _title, rawUrl) {
      this.state = state;
      location.href = new URL(rawUrl, location.href).href;
    },
  };
  const context = loadUserscript(
    'redirectBareProfileToPreferredView, installProfileDefaultViewLinkRewrite, installNavigationListener',
    'now = () => globalThis.clock; refreshAuthorLinks = () => {}; installNetworkHooks = () => {};',
    {
      clock: 1000,
      location,
      history,
      performance: { getEntriesByType: () => [{ type: navigationType }] },
      sessionStorage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      },
      document: {
        readyState: 'loading',
        documentElement: { lang: 'zh-CN' },
        addEventListener: (type, fn) => documentListeners.set(type, fn),
      },
      addEventListener: (type, fn) => windowListeners.set(type, fn),
    },
  );
  const api = context.__test;
  api.state.settingsLoaded = true;
  Object.assign(api.state.settings, { profileDefaultView: 'photo', profilePostSort: 'recent' });
  return {
    api,
    location,
    history,
    push: (url) => history.pushState(null, '', url),
    replace: (url) => history.replaceState(null, '', url),
    elapse: (ms) => { context.clock += ms; },
    traverse(url) {
      location.href = new URL(url, location.href).href;
      windowListeners.get('popstate')({ isTrusted: true });
    },
    click(url, role = '') {
      const link = new URL(url, location.href);
      link.getAttribute = (name) => name === 'role' ? role : null;
      link.hasAttribute = () => false;
      link.closest = () => null;
      const event = {
        target: { closest: (selector) => selector === 'a[href]' ? link : null },
        button: 0,
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        stopImmediatePropagation() {},
      };
      documentListeners.get('click')(event);
      if (!event.defaultPrevented) history.pushState(null, '', link.href);
      return event.defaultPrevented;
    },
    current() { return location.pathname + location.search; },
  };
}

test('closing a profile post keeps the chosen Posts tab after the old guard would expire', () => {
  const session = createSession();
  session.api.installNavigationListener();
  session.api.installProfileDefaultViewLinkRewrite();
  session.push('/Alice');
  assert.equal(session.current(), '/Alice/media?filter=photo');
  session.click('/Alice', 'tab');
  assert.equal(session.current(), '/Alice');
  session.push('/Alice/status/123/photo/1');
  session.elapse(60000);
  session.replace('/Alice');
  assert.equal(session.current(), '/Alice');
});

test('browser back and forward preserve the saved profile tab and its query', () => {
  const session = createSession('/Alice/media?filter=photo');
  session.api.installNavigationListener();
  session.api.installProfileDefaultViewLinkRewrite();
  session.click('/Alice?sort=recent', 'tab');
  session.push('/another/status/321');
  session.elapse(60000);
  session.traverse('/Alice?sort=recent');
  assert.equal(session.current(), '/Alice?sort=recent');
  session.traverse('/Alice/media?filter=photo');
  assert.equal(session.current(), '/Alice/media?filter=photo');
  session.push('/home');
  session.traverse('/Alice?sort=recent');
  assert.equal(session.current(), '/Alice?sort=recent');
});

test('a profile can return from a post by another author in the same visit', () => {
  const session = createSession('/Alice/with_replies');
  session.api.installNavigationListener();
  session.push('/another/status/321');
  session.replace('/alice');
  assert.equal(session.current(), '/alice');
});

test('same-profile links stay in the visit and a fresh entry still applies the defaults', () => {
  const session = createSession();
  session.api.installNavigationListener();
  session.api.installProfileDefaultViewLinkRewrite();
  session.push('/Alice');
  assert.equal(session.current(), '/Alice/media?filter=photo');
  assert.equal(session.click('/alice'), false);
  assert.equal(session.current(), '/alice');
  session.push('/home');
  session.push('/Alice');
  assert.equal(session.current(), '/Alice/media?filter=photo');
  assert.equal(session.click('/Bob'), true);
  assert.equal(session.current(), '/Bob/media?filter=photo');
});

test('a standalone detail does not count as an existing author profile visit', () => {
  const session = createSession('/Alice/status/123');
  session.api.installNavigationListener();
  session.api.installProfileDefaultViewLinkRewrite();
  assert.equal(session.click('/Alice'), true);
  assert.equal(session.current(), '/Alice/media?filter=photo');
});

test('startup applies defaults to a new entry and preserves reloads and history loads', () => {
  const direct = createSession('/Alice?ref=direct');
  assert.equal(direct.api.redirectBareProfileToPreferredView(), true);
  assert.equal(direct.current(), '/Alice/media?ref=direct&filter=photo');
  for (const navigationType of ['reload', 'back_forward']) {
    const restored = createSession('/Alice?sort=recent', navigationType);
    assert.equal(restored.api.redirectBareProfileToPreferredView(), false);
    assert.equal(restored.current(), '/Alice?sort=recent');
  }
});

test('boot does not apply startup defaults after the user has already navigated', () => {
  const session = createSession();
  session.api.installNavigationListener({ deferRefresh: true });
  session.push('/Alice/media?filter=photo');
  session.push('/Alice');
  assert.equal(session.api.redirectBareProfileToPreferredView(), false);
  assert.equal(session.current(), '/Alice');
});

test('new visits still apply the saved sort and same-profile sort changes survive a detail', () => {
  const session = createSession();
  Object.assign(session.api.state.settings, { profileDefaultView: 'posts', profilePostSort: 'popular' });
  session.api.installNavigationListener();
  const state = { key: 'profile-entry' };
  session.history.pushState(state, '', '/Alice');
  assert.equal(session.current(), '/Alice?sort=popular');
  assert.equal(session.history.state, state);
  session.replace('/Alice?sort=recent');
  session.push('/Alice/status/123');
  session.replace('/Alice?sort=recent');
  assert.equal(session.current(), '/Alice?sort=recent');
});
