import assert from 'node:assert/strict';
import { loadUserscript } from './helpers/userscript-harness.mjs';

const user=(index,enabled=false)=>({id_str:String(100000+index),screen_name:'notify'+index,name:'Notify '+index,notifications:enabled});
function harness(read){
  const requests=[],messages=[],metrics={renders:0,schedules:0,captures:0};
  const context=loadUserscript(`syncNotificationSubscriptions, notificationSubscriptions, harvestNotificationRelationship,
    getNotificationEnabledState, notificationUserFromRest, beginNotificationMutationGuard, rememberNotificationSubscription,
    updateNotificationSubscription, notificationMutationGuards, ensureNotificationAccount,
    enqueueNetworkHarvestObject, drainNetworkHarvestQueue, installNetworkHooks`,`
    getCurrentViewerId=()=>'123';requestXSessionJson=async(...args)=>globalThis.read(...args);
    renderNotificationSubscriptions=()=>{globalThis.metrics.renders++;};rememberFollowingRelation=()=>false;showToast=text=>globalThis.messages.push(text);
    const schedule=scheduleNotificationSubscriptionsPersist;
    scheduleNotificationSubscriptionsPersist=(...args)=>{globalThis.metrics.schedules++;return schedule(...args);};
    const capture=cacheNotificationAccount;
    cacheNotificationAccount=(...args)=>{globalThis.metrics.captures++;return capture(...args);};
    now=()=>globalThis.testClock ?? Date.now();
  `,{read:async(...args)=>{requests.push(args);return read(...args);},messages,metrics,console:{...console,error:()=>{}}});
  return {api:context.__test,context,requests,messages,metrics};
}
{
  let newestEnabled=false;
  const full=Array.from({length:260},(_,index)=>user(index,index<55));
  const mutual=Array.from({length:139},(_,index)=>user(index,index<9));
  const {api,requests,messages}=harness(async path=>{
    const url=new URL(path,'https://x.com');
    if(url.pathname==='/i/api/1.1/friends/following/list.json')return {users:mutual,next_cursor_str:'0'};
    assert.equal(url.pathname,'/i/api/1.1/friends/list.json','Sync must use complete following, not followers-you-follow');
    assert.equal(url.searchParams.get('user_id'),'123');assert.equal(url.searchParams.get('count'),'200');
    if(url.searchParams.get('cursor')==='-1'){
      full[60].notifications=newestEnabled;
      return {users:full.slice(0,200),next_cursor_str:'1234'};
    }
    assert.equal(url.searchParams.get('cursor'),'1234');return {users:full.slice(200),next_cursor_str:'0'};
  });
  await api.syncNotificationSubscriptions();assert.equal(api.notificationSubscriptions.size,55);assert.equal(requests.length,2);
  assert.match(messages.at(-1),/本次识别 55 个/);
  api.notificationSubscriptions.get('notify0').pinned=true;
  newestEnabled=true;await api.syncNotificationSubscriptions();
  assert.equal(api.notificationSubscriptions.size,56,'A newly subscribed account must appear on the next sync');
  assert.equal(api.notificationSubscriptions.get('notify0').pinned,true,'Sync must preserve local pins');
  assert.ok(requests.every(([,options])=>options.cache==='no-store'));
  assert.equal(api.state.notificationSyncInProgress,false);
}
{
  const items=[user(0,true),
    {rest_id:'100001',core:{screen_name:'notify1',name:'New profile'},notifications_settings:{notifications_enabled:true}},
    {rest_id:'100002',legacy:{screen_name:'notify2',notifications:true}},
    {rest_id:'100003',legacy:{screen_name:'notify3',notifications_settings:{notifications_enabled:true}}},
  ];
  const {api}=harness(async()=>({users:items,next_cursor:0}));
  await api.syncNotificationSubscriptions();assert.equal(api.notificationSubscriptions.size,4);
  const active=[...api.notificationSubscriptions.keys()];api.notificationSubscriptions.clear();
  items.forEach(item=>api.harvestNotificationRelationship(item));
  assert.deepEqual([...api.notificationSubscriptions.keys()],active,'Active sync and passive parsing must share notification fields and identities');
  api.harvestNotificationRelationship(user(0,false));
  assert.equal(api.notificationSubscriptions.get('notify0').enabled,true,'An ordinary REST false must not erase local subscriptions');
  api.harvestNotificationRelationship({rest_id:'100000',core:{screen_name:'notify0'},notifications_settings:{notifications_enabled:false}});
  assert.equal(api.notificationSubscriptions.get('notify0').enabled,false,'Explicit profile states must still update the subscription');
}
for(const invalid of [null,{errors:[{code:88}]},{users:{},next_cursor_str:'0'},
  {users:[],errors:[{code:88}],next_cursor_str:'0'},{users:[]},{users:[],next_cursor_str:''},
  {users:[],next_cursor:9007199254740992}]){
  const {api,messages}=harness(async()=>invalid);
  api.rememberNotificationSubscription({id:'55',username:'kept'},true);
  api.state.notificationSyncedAt=123;
  await api.syncNotificationSubscriptions();
  assert.match(messages.at(-1),/^⚠️ 同步失败/,'Malformed/error JSON must not be reported as a successful empty sync');
  assert.equal(api.state.notificationSyncedAt,123);
  assert.equal(api.notificationSubscriptions.get('kept').enabled,true);
  assert.equal(api.state.notificationSyncInProgress,false);
}
{
  const {api,requests,messages}=harness(async()=>({users:[user(0,true)],next_cursor_str:'-1'}));
  await api.syncNotificationSubscriptions();assert.equal(requests.length,1);assert.match(messages.at(-1),/分页没有前进/);
  assert.equal(api.notificationSubscriptions.size,0,'Incomplete sync must not commit its collected snapshot');
}
{
  let finish;
  const {api,requests}=harness(()=>new Promise(resolve=>{finish=resolve;}));
  api.rememberNotificationSubscription({id:'100000',username:'notify0'},true);
  const pending=api.syncNotificationSubscriptions();await api.syncNotificationSubscriptions();assert.equal(requests.length,1);
  api.beginNotificationMutationGuard('notify0',false);
  api.rememberNotificationSubscription({id:'100000',username:'notify0'},false,{authoritative:true});
  finish({users:[user(0,true)],next_cursor_str:'0'});await pending;
  assert.equal(api.notificationSubscriptions.get('notify0').enabled,false,'A stale sync must not re-enable a bell just switched off');
}
{
  const seen=[];
  const context=loadUserscript('requestXSessionJson','',{
    fetch:async(url,options)=>{seen.push({url,options});return {ok:true,json:async()=>({users:[]})};},
  });
  await context.__test.requestXSessionJson('/i/api/1.1/friends/list.json',{cache:'no-store'});
  assert.equal(seen[0].options.cache,'no-store');assert.equal(seen[0].options.credentials,'include');
}
{
  let finish;
  const test=harness(async path=>{
    if(!path.includes('/friends/list.json'))return {};
    if(new URL(path,'https://x.com').searchParams.get('cursor')==='-1'){
      return {users:[user(0,true)],next_cursor_str:'100'};
    }
    return new Promise(resolve=>{finish=resolve;});
  });
  test.context.testClock=10000;test.api.rememberNotificationSubscription({id:'100000',username:'notify0'},true);
  const pending=test.api.syncNotificationSubscriptions();
  for(let index=0;index<20;index++)await Promise.resolve();
  test.context.testClock=11000;await test.api.updateNotificationSubscription('notify0',false);
  test.context.testClock=17000;finish({users:[],next_cursor_str:'0'});await pending;
  assert.equal(test.api.notificationSubscriptions.get('notify0').enabled,false,
    'Collected first-page states must not overwrite a later successful bell operation after its five-second guard expires');
}
{
  const test=harness(async()=>({})),{api}=test;
  api.rememberNotificationSubscription({id:'100000',username:'notify0'},true);
  const token=api.ensureNotificationAccount();
  api.enqueueNetworkHarvestObject(user(0,true),token);
  await api.updateNotificationSubscription('notify0',false);
  api.notificationMutationGuards.get('100000').expiresAt=0;
  api.drainNetworkHarvestQueue({timeRemaining:()=>100});
  assert.equal(api.notificationSubscriptions.get('notify0').enabled,false,'Queued passive data must carry its original state revision');
  api.enqueueNetworkHarvestObject(user(0,true),token);api.drainNetworkHarvestQueue({timeRemaining:()=>100});
  assert.equal(api.notificationSubscriptions.get('notify0').enabled,true,'A fresh read after the operation must still learn native bell changes');
}
for(const kind of ['fetch','xhr']){
  const test=harness(async()=>({})),{api,context}=test;
  api.rememberNotificationSubscription({id:'100000',username:'notify0'},true);
  let finish;
  if(kind==='fetch'){
    context.fetch=()=>new Promise(resolve=>{finish=()=>resolve({
      url:'https://x.com/i/api/test',headers:{get:()=>null},clone:()=>({text:async()=>JSON.stringify(user(0,true))}),
    });});
    api.installNetworkHooks();context.fetch('/i/api/test');
  }else{
    class XHR{
      constructor(){this.listeners=[];this.responseType='';this.responseText=JSON.stringify(user(0,true));}
      open(){}send(){}addEventListener(type,callback){if(type==='load')this.listeners.push(callback);}
      getResponseHeader(){return null;}
    }
    context.XMLHttpRequest=XHR;api.installNetworkHooks();const request=new XHR();
    request.open('GET','https://x.com/i/api/test');request.send();finish=()=>request.listeners.forEach(callback=>callback());
  }
  await api.updateNotificationSubscription('notify0',false);
  api.notificationMutationGuards.get('100000').expiresAt=0;finish();
  for(let index=0;index<20;index++)await Promise.resolve();
  api.drainNetworkHarvestQueue({timeRemaining:()=>100});
  assert.equal(api.notificationSubscriptions.get('notify0').enabled,false,`${kind} must snapshot revisions when requests start, not when responses arrive`);
}
{
  const test=harness(async path=>path.includes('/friends/list.json')
    ?{users:[{id_str:'9',screen_name:'newname',notifications:true}],next_cursor_str:'0'}:{});
  test.api.rememberNotificationSubscription({id:'9',username:'oldname'},true);
  test.api.notificationSubscriptions.get('oldname').pinned=true;
  await test.api.syncNotificationSubscriptions();
  assert.equal(test.api.notificationSubscriptions.size,1,'Sync must merge renamed users by ID');
  assert.equal(test.api.notificationSubscriptions.has('oldname'),false);
  assert.equal(test.api.notificationSubscriptions.get('newname').pinned,true);
  await test.api.updateNotificationSubscription('newname',false);
  assert.equal(test.api.notificationSubscriptions.get('newname').enabled,false);
  const mutation=test.requests.find(([path])=>path.includes('/friendships/update.json'));
  assert.equal(new URLSearchParams(mutation[1].body).get('id'),'9','Renamed users must keep their stable API target');
}
const batching=[];
for(const count of [55,2000]){
  const users=Array.from({length:count},(_,index)=>user(index,true));
  const test=harness(async path=>{
    const cursor=new URL(path,'https://x.com').searchParams.get('cursor');
    const offset=cursor==='-1'?0:Number(cursor);
    return {users:users.slice(offset,offset+200),next_cursor_str:offset+200<count?String(offset+200):'0'};
  });
  await test.api.syncNotificationSubscriptions();
  assert.equal(test.api.notificationSubscriptions.size,count);
  assert.deepEqual(test.metrics,{renders:2,schedules:1,captures:1},'Sync must capture and schedule once, with only start/completion list renders');
  batching.push({subscriptions:count,...test.metrics});
}
{
  const test=harness(async()=>({}));
  const users=Array.from({length:55},(_,index)=>user(index,true));
  test.api.enqueueNetworkHarvestObject(users);test.api.drainNetworkHarvestQueue({timeRemaining:()=>100});
  assert.equal(test.api.notificationSubscriptions.size,55);
  assert.deepEqual(test.metrics,{renders:1,schedules:1,captures:1},'Passive network slices must also batch their notification side effects');
  test.api.enqueueNetworkHarvestObject(users);test.api.drainNetworkHarvestQueue({timeRemaining:()=>100});
  assert.deepEqual(test.metrics,{renders:1,schedules:1,captures:1},'Unchanged network data must not trigger another save or render');
}
console.log(JSON.stringify({notificationBatching:batching}));
console.log('Notification sync batches merging and side effects while preserving pagination, newer bell operations, passive request revisions and renamed identities.');
