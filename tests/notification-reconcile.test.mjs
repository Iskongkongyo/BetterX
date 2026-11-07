import assert from 'node:assert/strict';
import { loadUserscript } from './helpers/userscript-harness.mjs';

const item=index=>({id:String(910000+index),username:'diff'+index,displayName:'Diff '+index,enabled:true,updatedAt:1,pinned:index===0});
const flush=async()=>{for(let index=0;index<20;index++)await Promise.resolve();};
function harness(transport=async()=>({})){
  const calls=[],timers=new Map(),delays=[];let timerId=0,active=0,maxActive=0;
  const context=loadUserscript(`getNotificationSyncDifferences, runNotificationDifferenceCleanup, notificationSubscriptions,
    updateNotificationSubscription, beginNotificationMutationGuard, requestXSessionJson, makeXSessionRequestError`, `
    getCurrentViewerId=()=>globalThis.viewer;renderNotificationSubscriptions=()=>{};
    rememberFollowingRelation=()=>false;showToast=()=>{};
    requestXSessionJson=async(...args)=>globalThis.transport(...args);
  `,{
    viewer:'123',console:{...console,error:()=>{}},
    setTimeout:(fn,delay)=>{const id=++timerId;if(delay===1500){timers.set(id,fn);delays.push(delay);}return id;},
    clearTimeout:id=>timers.delete(id),
    transport:async(...args)=>{calls.push(args);active++;maxActive=Math.max(maxActive,active);
      try{return await transport(...args);}finally{active--;}}
  });
  const api=context.__test;
  const advance=async()=>{const next=timers.entries().next().value;if(next){timers.delete(next[0]);next[1]();}await flush();};
  const finish=async promise=>{await flush();for(let count=0;count<20&&timers.size;count++)await advance();return promise;};
  return {api,context,calls,timers,delays,advance,finish,maxActive:()=>maxActive};
}
{
  const {api}=harness();const old=new Map();
  for(let index=0;index<6;index++){const value=item(index);old.set(value.username,{...value});api.notificationSubscriptions.set(value.username,{...value});}
  api.notificationSubscriptions.get('diff2').enabled=false;
  api.notificationSubscriptions.get('diff3').updatedAt=2;
  api.beginNotificationMutationGuard('diff4',true);
  const collected=new Map([['renamed',{...item(1),username:'renamed'}],['new',item(99)]]);
  api.notificationSubscriptions.set('diff5',{...item(5),id:'12345'});
  assert.deepEqual(Array.from(api.getNotificationSyncDifferences(collected),value=>value.username),['diff0','diff3','diff4','diff5'],
    'Metadata changes and operation guards must not hide currently enabled users from the difference list');
  api.notificationSubscriptions.set('late', {...item(88),username:'late'});
  assert.ok(api.getNotificationSyncDifferences(collected).some(value=>value.username==='late'),'Users learned during sync must also be listed if absent from the result');
}
{
  const test=harness();const items=[item(0),item(1),item(2)];items.forEach(value=>test.api.notificationSubscriptions.set(value.username,{...value}));
  const pending=test.api.runNotificationDifferenceCleanup(items,'123');await flush();
  assert.equal(test.calls.length,1,'Only one request may run before the spacing timer');
  assert.equal(test.api.state.notificationCleanupInProgress,true);
  await test.api.updateNotificationSubscription('diff2',false);assert.equal(test.calls.length,1,'Manual updates must not add concurrency during cleanup');
  const result=await test.finish(pending);
  assert.equal(result.closed,3);assert.equal(test.maxActive(),1);assert.deepEqual(test.delays,[1500,1500]);
  assert.ok(test.calls.every(([,opts])=>opts.method==='POST'&&new URLSearchParams(opts.body).get('device')==='false'));
  assert.ok(items.every(value=>!test.api.notificationSubscriptions.get(value.username).enabled));
  assert.equal(test.api.notificationSubscriptions.get('diff0').pinned,true);
  assert.equal(test.api.state.notificationCleanupInProgress,false);
}
{
  let test;test=harness(async()=>{const code=test.calls.length===1?50:63,status=code===50?404:403;throw test.api.makeXSessionRequestError(status,{errors:[{code}]});});
  const items=[item(0),item(1)];items.forEach(value=>test.api.notificationSubscriptions.set(value.username,{...value}));
  const result=await test.finish(test.api.runNotificationDifferenceCleanup(items,'123'));
  assert.equal(result.localOnly,2);assert.equal(result.closed,0);assert.equal(result.reason,'done');
  assert.ok(items.every(value=>!test.api.notificationSubscriptions.get(value.username).enabled));
}
for(const [status,code,reason]of [[429,88,'rateLimited'],[200,88,'rateLimited'],[404,34,'failed'],[403,326,'failed']]){
  let test;test=harness(async()=>{throw test.api.makeXSessionRequestError(status,{errors:[{code}]});});
  const items=[item(0),item(1)];items.forEach(value=>test.api.notificationSubscriptions.set(value.username,{...value}));
  const result=await test.api.runNotificationDifferenceCleanup(items,'123');
  assert.equal(result.reason,reason);assert.equal(test.calls.length,1);assert.equal(test.timers.size,0);
  assert.ok(items.every(value=>test.api.notificationSubscriptions.get(value.username).enabled),'An error must leave targets enabled unless X explicitly confirms target unavailability');
}
{
  const test=harness(),controller=new AbortController(),items=[item(0),item(1)];items.forEach(value=>test.api.notificationSubscriptions.set(value.username,{...value}));
  const pending=test.api.runNotificationDifferenceCleanup(items,'123',{signal:controller.signal});await flush();
  assert.equal(test.calls.length,1);assert.equal(test.timers.size,1);
  controller.abort();const result=await pending;
  assert.equal(result.reason,'cancelled');assert.equal(test.calls.length,1);assert.equal(test.timers.size,0);
  assert.equal(test.api.notificationSubscriptions.get('diff1').enabled,true);
}
{
  let complete;const test=harness(()=>new Promise(resolve=>{complete=resolve;}));
  const controller=new AbortController(),items=[item(0),item(1)];items.forEach(value=>test.api.notificationSubscriptions.set(value.username,{...value}));
  const pending=test.api.runNotificationDifferenceCleanup(items,'123',{signal:controller.signal});await flush();
  controller.abort();complete({});const result=await pending;
  assert.equal(result.closed,1,'Cancelling must still record a request already accepted by X');assert.equal(test.calls.length,1);
  assert.equal(test.api.notificationSubscriptions.get('diff1').enabled,true);
}
{
  const test=harness();test.api.notificationSubscriptions.set('diff0',item(0));test.context.viewer='456';
  const result=await test.api.runNotificationDifferenceCleanup([item(0)],'123');
  assert.equal(result.reason,'accountChanged');assert.equal(test.calls.length,0);
  test.context.viewer='123';test.api.notificationSubscriptions.get('diff0').id='99';
  const skipped=await test.api.runNotificationDifferenceCleanup([item(0)],'123');assert.equal(skipped.skipped,1);assert.equal(test.calls.length,0);
  test.api.notificationSubscriptions.set('diff0',{...item(0),updatedAt:item(0).updatedAt+1});
  const changed=await test.api.runNotificationDifferenceCleanup([item(0)],'123');assert.equal(changed.skipped,1);assert.equal(test.calls.length,0,'Changes after confirmation must be protected at cleanup time');
}
{
  const context=loadUserscript('requestXSessionJson','',{
    fetch:async()=>({ok:false,status:404,json:async()=>({errors:[{code:50}]})}),
  });
  await assert.rejects(context.__test.requestXSessionJson('/i/api/1.1/friendships/update.json'),error=>error.status===404&&error.codes[0]===50);
  context.fetch=async()=>({ok:true,status:200,json:async()=>({errors:[{code:88}]})});
  await assert.rejects(context.__test.requestXSessionJson('/i/api/1.1/friendships/update.json'),error=>error.status===200&&error.codes[0]===88);
}
console.log('Notification differences compare stable identities; confirmed cleanup is serial, paced, cancellable, rate-limit aware and preserves unresolved users.');
