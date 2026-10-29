import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
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
  openDb, dbPutPost, dbGetAllPosts, dbDeleteMany, dbGetSetting, scheduleCrossTabReload, flushCrossTabReload,
  captureArticle, getAdultSpamInput, backupAll, importPosts, closeBetterXDialog,
  startObserver, isSafeRegexSource, keywordRuleMatches,
  setPanelView, applySettingsSnapshot, renderNotificationSubscriptions, notificationSubscriptions,
  setSettingsPartial, applyAdultSpamFiltering,
  repositionBadge, refreshDownloadUi, toggleDownloadPopover, downloadJobs,
  registerMedia, injectDownloadButtons, handleDownloadClick, closeDownloadMediaPicker,
  pendingDownloadSelections, pendingDownloadStarts,
  mockDownloadTransport: overrides => {
    const fetch = fetchBlobWithRetry, save = saveBlob, lookup = requestTweetDetailMedia;
    if (overrides.fetch) fetchBlobWithRetry = overrides.fetch;
    if (overrides.save) saveBlob = overrides.save;
    if (overrides.lookup) requestTweetDetailMedia = overrides.lookup;
    return () => {fetchBlobWithRetry=fetch;saveBlob=save;requestTweetDetailMedia=lookup;};
  },
  watchViewWork: callback => {
    const card = renderPostItem, filter = filterPosts, settings = refreshSettingsUI;
    renderPostItem = post => {callback('cards'); return card(post);};
    filterPosts = posts => {callback('filters'); return filter(posts);};
    refreshSettingsUI = () => {callback('settings'); return settings();};
  },
  watchCapture: callback => {const original = captureArticle; captureArticle = article => {callback(article); return original(article);};}
`, 'download = (filename, blob) => globalThis.__downloads.push({filename, blob});');
const fixture = await readFile(new URL('./fixtures/critical-fixes.browser.js', import.meta.url), 'utf8');
const downloadFixture = await readFile(new URL('./fixtures/download-selection.browser.js', import.meta.url), 'utf8');
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>BetterX critical regressions</title>
<style>body{margin:0}#results{white-space:pre-wrap;overflow-wrap:anywhere}</style>
<script>
window.__downloads=[];window.__confirmCount=0;window.__alerts=[];window.__browserErrors=[];
window.GM_getValue=(_key,fallback)=>fallback;window.GM_setValue=()=>{};window.GM_registerMenuCommand=()=>{};window.GM_info={script:{},scriptHandler:'Regression'};
window.alert=message=>__alerts.push(message);window.confirm=()=>{__confirmCount++;return true;};
addEventListener('error',event=>__browserErrors.push(String(event.error||event.message)));addEventListener('unhandledrejection',event=>__browserErrors.push(String(event.reason)));
</script><script src="/userscript.js"></script><body><main role="main"><div data-testid="primaryColumn"></div></main><pre id="results">RUNNING</pre><script src="/download-fixture.js"></script><script src="/fixture.js"></script></body></html>`;
const server = createServer((req, res) => {
  const body = req.url === '/userscript.js' ? script : req.url === '/fixture.js' ? fixture : req.url === '/download-fixture.js' ? downloadFixture : html;
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
  const transportErrors = [];
  socket.onmessage = event => {
    const result = JSON.parse(event.data);
    if (result.method === 'Fetch.requestPaused') {
      const {requestId,resourceType,request} = result.params;
      // Serve deterministic preview images without contacting X or its CDN.
      const hue = [...request.url].reduce((sum,char)=>sum+char.charCodeAt(0),0)%360;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="hsl(${hue},45%,32%)"/><circle cx="155" cy="75" r="36" fill="hsl(${hue},65%,75%)"/><path d="M0 240 90 100 200 240" fill="hsl(${hue},55%,55%)"/></svg>`;
      const response = resourceType === 'Image'
        ? send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'image/svg+xml'}],body:Buffer.from(svg).toString('base64')})
        : send('Fetch.failRequest',{requestId,errorReason:'Aborted'});
      response.catch(error=>transportErrors.push(String(error)));
      return;
    }
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
  await send('Fetch.enable',{patterns:[{urlPattern:'https://*'}]});
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  let results;
  for (let attempt = 0; attempt < 200; attempt++) {
    const response = await send('Runtime.evaluate', { expression: 'window.__browserResults', returnByValue: true });
    results = response.result?.value;
    if (results) break;
    await sleep(200);
  }
  assert.ok(results, 'Browser regressions did not finish');
  for (const mobile of [false,true]) {
    const name = mobile ? 'native mobile touch hold, responsive picker and short tap' : 'native desktop mouse hold and selected ZIP download';
    try {
      await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1100,height:mobile?844:800,deviceScaleFactor:1,mobile});
      await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:1});
      await send('Emulation.setPageScaleFactor',{pageScaleFactor:1});
      const setup = await send('Runtime.evaluate',{expression:`window.__prepareNativeDownloadTest(${mobile})`,returnByValue:true});
      assert.ok(!setup.exceptionDetails,JSON.stringify(setup.exceptionDetails));
      const {x,y} = setup.result.value;
      if (mobile) await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      else {
        await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
        await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
      }
      await sleep(600);
      const opened = await send('Runtime.evaluate',{expression:'!!document.querySelector("#BetterX-media-picker")',returnByValue:true});
      assert.equal(opened.result.value,true,'The native hold did not open the picker');
      const viewport = await send('Runtime.evaluate',{expression:'({width:visualViewport.width,scale:visualViewport.scale,layout:document.documentElement.clientWidth})',returnByValue:true});
      if(mobile)assert.ok(Math.abs(viewport.result.value.width-390)<1 && viewport.result.value.scale===1,JSON.stringify(viewport.result.value));
      if (mobile) await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      else await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',buttons:0,clickCount:1});
      await sleep(80);
      const stable = await send('Runtime.evaluate',{expression:'({open:!!document.querySelector("#BetterX-media-picker"),requests:__nativeDownload.requests.length,events:__nativeDownload.events})',returnByValue:true});
      assert.ok(stable.result.value.open && stable.result.value.requests===0,`Releasing the native hold closed the picker or started a download: ${JSON.stringify(stable.result.value)}`);
      if (process.env.BETTERX_SCREENSHOT_DIR) {
        await mkdir(process.env.BETTERX_SCREENSHOT_DIR,{recursive:true});
        const shot=await send('Page.captureScreenshot',{format:'png'});
        await writeFile(join(process.env.BETTERX_SCREENSHOT_DIR,`media-picker-${mobile?'mobile':'desktop'}.png`),Buffer.from(shot.data,'base64'));
      }
      if (mobile) {
        const layout = await send('Runtime.evaluate',{expression:'__nativeDownload.checkMobileLayout()',returnByValue:true});
        assert.equal(layout.result.value,true,'The mobile dialog does not fit within the visible viewport');
        const cancelPoint = await send('Runtime.evaluate',{expression:'__nativeDownload.targetPoint("[data-media-cancel]")',returnByValue:true});
        await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[cancelPoint.result.value]});
        await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        const cancelled = await send('Runtime.evaluate',{expression:'!document.querySelector("#BetterX-media-picker") && __nativeDownload.requests.length===0',returnByValue:true});
        assert.equal(cancelled.result.value,true,'A native touch on Cancel was blocked');
        await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
        await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      } else {
        for (const selector of ['.BetterX-media-picker-item:nth-child(1) .BetterX-media-picker-thumb','.BetterX-media-picker-item:nth-child(3) input','[data-media-confirm]']) {
          const point = await send('Runtime.evaluate',{expression:`__nativeDownload.targetPoint(${JSON.stringify(selector)})`,returnByValue:true});
          await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point.result.value});
          await send('Input.dispatchMouseEvent',{type:'mousePressed',...point.result.value,button:'left',buttons:1,clickCount:1});
          await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point.result.value,button:'left',buttons:0,clickCount:1});
        }
      }
      const completed = await send('Runtime.evaluate',{expression:`__nativeDownload.verify(${mobile?4:2})`,awaitPromise:true,returnByValue:true});
      assert.ok(!completed.exceptionDetails,JSON.stringify(completed.exceptionDetails));
      assert.equal(completed.result.value,true,'The native download did not match the selected media');
      results.push({name,passed:true,viewport:viewport.result.value});
    } catch(error) {results.push({name,passed:false,error:String(error.stack||error)});}
    finally {await send('Runtime.evaluate',{expression:'window.__nativeDownload?.cleanup()'});}
  }
  console.log(JSON.stringify(results, null, 2));
  assert.equal(results.length, 14);
  assert.ok(results.every(result => result.passed), 'One or more browser regressions failed');
  const errors = await send('Runtime.evaluate', { expression: 'window.__browserErrors', returnByValue: true });
  assert.deepEqual(errors.result.value, [], 'Browser emitted unexpected errors');
  assert.deepEqual(transportErrors, [], 'The isolated image transport failed');
  console.log('Browser regressions passed with real DOM, focus/selection, multi-volume restore and IndexedDB.');
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ id: -1, method: 'Browser.close' }));
  await Promise.race([once(browser, 'exit'), sleep(2000)]);
  socket?.close();
  if (browser.exitCode === null) browser.kill();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
