import assert from 'node:assert/strict';
import vm from 'node:vm';
import { loadUserscript, instrumentUserscript } from './helpers/userscript-harness.mjs';

const png=Uint8Array.from([137,80,78,71,13,10,26,10]);
let requestOptions,aborts=0;
const context=loadUserscript('screenshotRequestBytes,screenshotImageType,screenshotAssetUrl,screenshotScale,screenshotLocalReference', '', {
  GM_xmlhttpRequest:options=>{requestOptions=options;return{abort(){aborts++;options.onabort();}};},
});
const api=context.__test;
let controller=new AbortController();
let pending=api.screenshotRequestBytes('https://pbs.twimg.com/media/color?format=png&name=small',controller.signal);
assert.equal(requestOptions.responseType,'arraybuffer');
assert.equal(requestOptions.anonymous,true);
// Cross-realm ArrayBuffer must remain bytes, not be rejected by instanceof.
const foreign=vm.runInNewContext('new Uint8Array([137,80,78,71,13,10,26,10]).buffer');
requestOptions.onload({status:200,response:foreign,responseHeaders:'content-type: application/octet-stream'});
assert.deepEqual([...((await pending).bytes)],[...png]);
assert.equal(api.screenshotImageType(png,'application/octet-stream'),'image/png');
assert.equal(api.screenshotImageType(new TextEncoder().encode('\uFEFF<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"></svg>'),''),'image/svg+xml');
assert.equal(api.screenshotImageType(new TextEncoder().encode('<html>not an image</html>'),'text/html'),'');
assert.equal(api.screenshotImageType(new TextEncoder().encode('GIF89a'),'image/jpeg'),'image/gif');
for(const status of [0,403,503]){
  pending=api.screenshotRequestBytes('https://pbs.twimg.com/a.png',new AbortController().signal);
  requestOptions.onload({status,response:foreign,responseHeaders:''});
  await assert.rejects(pending,new RegExp(`HTTP ${status}`));
}
pending=api.screenshotRequestBytes('https://pbs.twimg.com/a.png',new AbortController().signal);
requestOptions.onload({status:200,response:foreign,finalUrl:'https://example.invalid/a.png',responseHeaders:''});
await assert.rejects(pending,/redirect/);
controller=new AbortController();pending=api.screenshotRequestBytes('https://pbs.twimg.com/a.png',controller.signal);
controller.abort();await assert.rejects(pending,/cancelled/);assert.equal(aborts,1);
pending=api.screenshotRequestBytes('https://pbs.twimg.com/a.png',new AbortController().signal);
requestOptions.onprogress({loaded:13*1024*1024});await assert.rejects(pending,/size limit/);assert.equal(aborts,2);
pending=api.screenshotRequestBytes('https://pbs.twimg.com/a.png',new AbortController().signal);
requestOptions.ontimeout();await assert.rejects(pending,/timed out/);

for(const url of ['https://pbs.twimg.com/avatar.jpg','https://abs-0.twimg.com/emoji.svg','data:image/png;base64,eA=='])assert.equal(api.screenshotAssetUrl(url),url);
for(const url of ['','javascript:alert(1)','https://pbs.twimg.com.example.invalid/a.png','https://example.invalid/a.png'])assert.equal(api.screenshotAssetUrl(url),'');
assert.equal(api.screenshotLocalReference('https://x.com/home#icon'),'#icon');
assert.equal(api.screenshotLocalReference('https://x.com/other#icon'),'');
for(const [width,height] of [[600,400],[1200,20000],[100,100000],[100000,100]]){
  const scale=api.screenshotScale(width,height);
  assert.ok(width*scale<=16384&&height*scale<=16384);
  assert.ok(width*height*scale*scale<=16*1024*1024+0.1);
}

// Some managers expose GM APIs as lexical bindings, not globalThis properties.
const sandbox={console,URL,URLSearchParams,Blob,TextEncoder,TextDecoder,AbortController,queueMicrotask,
  navigator:{language:'zh-CN',languages:['zh-CN'],userAgent:''},location:{origin:'https://x.com',href:'https://x.com/home',pathname:'/home',search:''},
  document:{body:null,cookie:'',documentElement:{lang:'zh-CN'},querySelectorAll:()=>[]},setTimeout:()=>1,clearTimeout(){},
  GM_getValue:(_key,fallback)=>fallback,
  requestStub:options=>{queueMicrotask(()=>options.onload({status:200,response:foreign,responseHeaders:'content-type: image/png'}));return{abort(){}};},
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.runInNewContext('const GM_xmlhttpRequest=globalThis.requestStub;\n'+instrumentUserscript('screenshotRequestBytes'),sandbox);
assert.equal(sandbox.GM_xmlhttpRequest,undefined);
assert.deepEqual([...(await sandbox.__test.screenshotRequestBytes('https://pbs.twimg.com/lexical.png',new AbortController().signal)).bytes],[...png]);

console.log('Screenshot transport handles lexical GM APIs, cross-realm bytes, MIME sniffing, redirects, cancellation and bounded output.');
