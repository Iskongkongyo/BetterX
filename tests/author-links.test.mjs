import assert from 'node:assert/strict';
import { loadUserscript } from './helpers/userscript-harness.mjs';

const links=[{href:'https://www.pixiv.net/users/123',label:'pixiv.net/users/123'}];
const flush=async()=>{for(let index=0;index<16;index++)await Promise.resolve();};
function harness(){
  const stored=new Map(),timers=new Map();let nextTimer=0;
  const context=loadUserscript(`loadAuthorProfileLinks, refreshAuthorLinks, resetAuthorLinksView,
    startAuthorLinksRequest, getView:()=>authorLinksView`, `
    now=()=>globalThis.clock;
    requestAuthorProfileLinks=async name=>{globalThis.requests++;return globalThis.transport(name);};
  `,{
    clock:100000,requests:0,transport:async()=>links,
    GM_getValue:(key,fallback)=>stored.get(key)??fallback,
    GM_setValue:(key,value)=>stored.set(key,value),
    setTimeout:(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,at:context.clock+delay});return id;},
    clearTimeout:id=>timers.delete(id),
  });
  context.__test.state.settings.authorLinksEnabled=true;
  context.location.pathname='/author/status/123';
  const advance=async ms=>{
    const end=context.clock+ms;
    while(true){
      const due=[...timers].sort((a,b)=>a[1].at-b[1].at).find(([,timer])=>timer.at<=end);
      if(!due)break;
      const [id,timer]=due;timers.delete(id);context.clock=timer.at;timer.fn();await flush();
    }
    context.clock=end;await flush();
  };
  return {context,api:context.__test,stored,timers,advance};
}

{
  const {context,api,stored}=harness();
  const pending=Array.from({length:10},()=>api.loadAuthorProfileLinks('Author'));
  await Promise.all(pending);assert.equal(context.requests,1);
  await api.loadAuthorProfileLinks('author');assert.equal(context.requests,1);
  assert.equal(stored.get('betterx_author_links:author').expiresAt,context.clock+7*24*60*60*1000);
  context.clock+=7*24*60*60*1000;
  await api.loadAuthorProfileLinks('author');assert.equal(context.requests,2);
}
{
  const {context,api,stored}=harness();context.transport=async()=>[];
  for(let index=0;index<3;index++)assert.equal((await api.loadAuthorProfileLinks('author')).length,0);
  assert.equal(context.requests,1,'Empty profiles must be cached across post visits');
  assert.equal(stored.get('betterx_author_links:author').expiresAt,context.clock+60*60*1000);
  context.clock+=60*60*1000;
  await api.loadAuthorProfileLinks('author');assert.equal(context.requests,2,'Expired empty profiles must refresh');
}
{
  const {context,api,timers,advance,stored}=harness();
  context.transport=async()=>{throw new Error('temporary failure');};
  api.refreshAuthorLinks();await flush();
  assert.equal(api.getView().status,'error');assert.equal(context.requests,1);
  assert.equal(stored.size,0,'Failures must not become cached empty profiles');
  for(let index=0;index<20;index++)api.refreshAuthorLinks();await flush();
  assert.equal(context.requests,1,'DOM changes must not bypass retry backoff');
  await advance(999);assert.equal(context.requests,1);
  await advance(1);assert.equal(context.requests,2);
  await advance(3999);assert.equal(context.requests,2);
  await advance(1);assert.equal(context.requests,3);
  assert.equal(timers.size,0,'Automatic retries must stop after three total attempts');
  context.transport=async()=>links;
  api.getView().attempts=0;api.startAuthorLinksRequest(api.getView());await flush();
  assert.equal(context.requests,4);assert.equal(api.getView().status,'ready');
}
{
  const {context,api,timers,advance}=harness();
  context.transport=async()=>{throw new Error('offline');};
  api.refreshAuthorLinks();await flush();assert.equal(timers.size,1);
  context.location.pathname='/home';api.refreshAuthorLinks();
  assert.equal(api.getView(),null);assert.equal(timers.size,0);
  await advance(10000);assert.equal(context.requests,1,'Leaving details must cancel scheduled retries');
  context.location.pathname='/author/status/124';api.refreshAuthorLinks();await flush();
  assert.equal(timers.size,1);
  api.state.settings.authorLinksEnabled=false;api.refreshAuthorLinks();
  assert.equal(timers.size,0);await advance(10000);assert.equal(context.requests,2);
}
{
  const {context,api}=harness();let complete;
  context.transport=()=>new Promise(resolve=>{complete=resolve;});
  api.refreshAuthorLinks();await flush();
  context.location.pathname='/home';api.refreshAuthorLinks();
  complete(links);await flush();assert.equal(api.getView(),null,'Late responses must not revive an inactive view');
}
{
  const profile={profile_bio:{entities:{description:{urls:[
    {expanded_url:links[0].href,display_url:links[0].label},
    {expanded_url:'javascript:alert(1)'},
  ]}}},legacy:{entities:{url:{urls:[{expanded_url:links[0].href},{expanded_url:'https://example.org/'}]}}}};
  const payload={data:{user:{result:profile}}};
  const context=loadUserscript('requestAuthorProfileLinks','requestXSessionJson=async()=>globalThis.payload;',{payload});
  const result=await context.__test.requestAuthorProfileLinks('author');
  assert.deepEqual(Array.from(result,link=>link.href),[links[0].href,'https://example.org/']);
  payload.data.user.result={legacy:{entities:{url:{urls:[{expanded_url:'https://legacy.example/'}]}}}};
  assert.equal((await context.__test.requestAuthorProfileLinks('author'))[0].href,'https://legacy.example/');
  context.payload={errors:[{message:'rate limited'}]};
  await assert.rejects(context.__test.requestAuthorProfileLinks('author'),/no readable author profile/);
}
console.log('Author links cache empty results, bound retries, recover on demand and ignore obsolete responses; profile parsers validate and deduplicate links.');
