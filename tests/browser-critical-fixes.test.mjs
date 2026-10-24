import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { instrumentUserscript } from './helpers/userscript-harness.mjs';

const candidates = [process.env.BETTERX_BROWSER_PATH, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
let executable;
for (const candidate of candidates) { try { await access(candidate); executable = candidate; break; } catch {} }
assert.ok(executable, 'Set BETTERX_BROWSER_PATH to a Chromium/Chrome/Edge executable to run browser regressions');
const script = instrumentUserscript(`
  createUI, installStyles, togglePanel, refreshUI, dispatchPanelAction, rebuildPostIndex,
  openDb, dbPutPost, dbGetAllPosts, dbDeleteMany, scheduleCrossTabReload, flushCrossTabReload,
  captureArticle, getAdultSpamInput, backupAll, importPosts, closeBetterXDialog,
  startObserver, isSafeRegexSource, keywordRuleMatches,
  setPanelView, applySettingsSnapshot, renderNotificationSubscriptions, notificationSubscriptions,
  setSettingsPartial, applyAdultSpamFiltering,
  watchViewWork: callback => {
    const card = renderPostItem, filter = filterPosts, settings = refreshSettingsUI;
    renderPostItem = post => {callback('cards'); return card(post);};
    filterPosts = posts => {callback('filters'); return filter(posts);};
    refreshSettingsUI = () => {callback('settings'); return settings();};
  },
  watchCapture: callback => {const original = captureArticle; captureArticle = article => {callback(article); return original(article);};}
`, 'download = (filename, blob) => globalThis.__downloads.push({filename, blob});');
const fixture = await readFile(new URL('./fixtures/critical-fixes.browser.js', import.meta.url), 'utf8');
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>BetterX critical regressions</title>
<script>
window.__downloads=[];window.__confirmCount=0;window.__alerts=[];window.__browserErrors=[];
window.GM_getValue=(_key,fallback)=>fallback;window.GM_setValue=()=>{};window.GM_registerMenuCommand=()=>{};window.GM_info={script:{},scriptHandler:'Regression'};
window.alert=message=>__alerts.push(message);window.confirm=()=>{__confirmCount++;return true;};
addEventListener('error',event=>__browserErrors.push(String(event.error||event.message)));addEventListener('unhandledrejection',event=>__browserErrors.push(String(event.reason)));
</script><script src="/userscript.js"></script><body><main role="main"><div data-testid="primaryColumn"></div></main><pre id="results">RUNNING</pre><script src="/fixture.js"></script></body></html>`;
const server = createServer((req, res) => {
  const body = req.url === '/userscript.js' ? script : req.url === '/fixture.js' ? fixture : html;
  res.setHeader('content-type', req.url?.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'text/html; charset=utf-8');
  res.end(body);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const profile = await mkdtemp(join(tmpdir(), 'betterx-critical-browser-'));
const browser = spawn(executable, ['--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; } catch {}
    await sleep(100);
  }
  assert.ok(port, 'Browser debugging endpoint did not start');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`, { headers: { connection: 'close' } })).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const result = JSON.parse(event.data);
    const request = pending.get(result.id);
    if (!request) return;
    pending.delete(result.id);
    clearTimeout(request.timer);
    result.error ? request.reject(new Error(JSON.stringify(result.error))) : request.resolve(result.result);
  };
  socket.onclose = () => {
    for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error('Browser disconnected')); }
    pending.clear();
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Browser command timed out: ${method}`)); }, 20000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  let results;
  for (let attempt = 0; attempt < 125; attempt++) {
    const response = await send('Runtime.evaluate', { expression: 'window.__browserResults', returnByValue: true });
    results = response.result?.value;
    if (results) break;
    await sleep(200);
  }
  assert.ok(results, 'Browser regressions did not finish');
  console.log(JSON.stringify(results, null, 2));
  assert.equal(results.length, 7);
  assert.ok(results.every(result => result.passed), 'One or more browser regressions failed');
  const errors = await send('Runtime.evaluate', { expression: 'window.__browserErrors', returnByValue: true });
  assert.deepEqual(errors.result.value, [], 'Browser emitted unexpected errors');
  console.log('Browser regressions passed with real DOM, focus/selection, multi-volume restore and IndexedDB.');
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ id: -1, method: 'Browser.close' }));
  await Promise.race([once(browser, 'exit'), sleep(2000)]);
  socket?.close();
  if (browser.exitCode === null) browser.kill();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
