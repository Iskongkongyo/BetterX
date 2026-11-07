import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadUserscript } from './helpers/userscript-harness.mjs';

for (const path of [
  '../src/main.part.js',
  '../更好的X（BetterX）v4.3.0.js',
]) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const bootStart = source.indexOf('async function boot()');
  const bootEnd = source.indexOf('function waitForPageReady()', bootStart);
  const boot = source.slice(bootStart, bootEnd);
  const createUiAt = boot.indexOf('createUI();');
  const appearanceAt = boot.indexOf('restoreStartupAppearance();');
  const shortcutAt = boot.indexOf("document.addEventListener('keydown', handleKeydown, true);");
  const databaseAt = boot.indexOf('await openDb();');
  assert.ok(createUiAt >= 0 && shortcutAt > createUiAt, `${path} 未在 UI 创建后绑定快捷键`);
  assert.ok(appearanceAt >= 0 && appearanceAt < createUiAt, `${path} 应在创建 UI 前恢复已选外观`);
  assert.ok(databaseAt > shortcutAt, `${path} 的 Alt+X 不应等待数据库初始化`);
  assert.equal(
    boot.match(/document\.addEventListener\('keydown', handleKeydown, true\);/g)?.length,
    1,
    `${path} 快捷键只能绑定一次`
  );
  assert.match(boot, /try \{ installStyles\(\); \} catch/, `${path} 样式注入失败不应阻止 UI 创建`);
}

const storageSource = await readFile(new URL('../src/core/storage-posts.part.js', import.meta.url), 'utf8');
assert.match(storageSource, /request\.onblocked\s*=/, 'IndexedDB upgrade blocking must be handled');
assert.match(storageSource, /db\.onversionchange\s*=/, 'old tabs must release IndexedDB connections on upgrade');
assert.match(storageSource, /DB_OPEN_BLOCKED/, 'blocked database startup must leave the pending state');
assert.match(storageSource, /new BroadcastChannel\(CROSS_TAB_CHANNEL_NAME\)/, 'cross-tab changes must be synchronized');

for(const envelope of [false,true]){
  const mirrored={useMobileBadgeOnDesktop:true,useMobileBadgeHandle:true,mobileBadgeHandleTop:178,
    badgePos:{left:800,right:24,bottom:90},theme:'light',panelWidth:720,mediaDownload:false,authorLinksEnabled:true};
  const writes=[];
  const context=loadUserscript('boot, restoreStartupAppearance, loadStateFromDb',`
    globalThis.started=[];
    installPageScrollActivityTracking=()=>{};installStyles=()=>{};installPostScreenshotMenu=()=>{};
    createUI=()=>globalThis.started.push({settings:{...state.settings},loaded:state.settingsLoaded});
    applyTheme=()=>{};openDb=()=>new Promise(()=>{});
  `,{
    GM_getValue:(key,fallback)=>key==='betterx_settings_mirror_v1'?(envelope?{version:1,settings:mirrored}:mirrored):fallback,
    GM_setValue:(key,value)=>writes.push([key,value]),
    document:{body:null,cookie:'',documentElement:{lang:'zh-CN'},querySelectorAll:()=>[],addEventListener:()=>{}},
  });
  const api=context.__test;
  api.boot();
  assert.equal(context.started.length,1,'Blocked IndexedDB must not delay UI creation');
  const first=context.started[0];
  for(const key of ['useMobileBadgeOnDesktop','useMobileBadgeHandle','mobileBadgeHandleTop','theme','panelWidth']){
    assert.equal(first.settings[key],mirrored[key],`First UI creation must use the saved ${key}`);
  }
  assert.equal(first.settings.badgePos.right,24);
  assert.equal(first.loaded,false,'Appearance hydration must not mark the full settings as loaded');
  assert.equal(first.settings.mediaDownload,true,'Unrelated settings must wait for their normal load');
  assert.equal(first.settings.authorLinksEnabled,false);
  assert.equal(writes.length,0,'Appearance preview must not persist defaults over saved settings');
}
for(const mirrored of [null,[],{useMobileBadgeOnDesktop:false,useMobileBadgeHandle:false},
  {useMobileBadgeOnDesktop:'true',mobileBadgeHandleTop:'200',theme:'bad',badgePos:{left:NaN,bottom:20}},
  {hideAppBadgeOnDesktop:true,useMobileBadgeHandle:true}]){
  const context=loadUserscript('restoreStartupAppearance','',{
    GM_getValue:(key,fallback)=>key==='betterx_settings_mirror_v1'?mirrored:fallback,
  });
  const api=context.__test;api.restoreStartupAppearance();
  assert.equal(api.state.settings.useMobileBadgeOnDesktop,false,'False and malformed choices must retain safe defaults');
  assert.equal(api.state.settings.useMobileBadgeHandle,false);
  if(mirrored?.hideAppBadgeOnDesktop)assert.equal(api.state.settings.hideAppBadge,true,'Legacy hidden-badge preference must still apply');
}
{
  const mirrored={useMobileBadgeOnDesktop:true,useMobileBadgeHandle:true,theme:'light'};
  const saved={settingsRevision:39,useMobileBadgeOnDesktop:false,useMobileBadgeHandle:false,theme:'dark',mediaDownload:false};
  const writes=[];
  const context=loadUserscript('restoreStartupAppearance, loadStateFromDb',`
    dbGetSetting=async()=>globalThis.saved;dbGetAllPosts=async()=>[];
  `,{
    saved,
    GM_getValue:(key,fallback)=>key==='betterx_settings_mirror_v1'?{settings:mirrored}:fallback,
    GM_setValue:(key,value)=>writes.push([key,value]),
  });
  const api=context.__test;api.restoreStartupAppearance();
  assert.equal(api.state.settings.useMobileBadgeOnDesktop,true);
  await api.loadStateFromDb();
  assert.equal(api.state.settings.useMobileBadgeOnDesktop,false,'IndexedDB must remain authoritative after appearance preview');
  assert.equal(api.state.settings.useMobileBadgeHandle,false);
  assert.equal(api.state.settings.mediaDownload,false);
  assert.equal(api.state.settings.theme,'dark');assert.equal(api.state.settingsLoaded,true);
  assert.equal(writes.at(-1)[1].settings.useMobileBadgeOnDesktop,false);
}

console.log('Startup restores saved badge appearance before UI creation without delaying Alt+X or overwriting database settings.');
