import assert from 'node:assert/strict';
import { loadUserscript,createMemoryDb } from './helpers/userscript-harness.mjs';

const entry=(id,username,enabled=true)=>({id,username,enabled,displayName:username,updatedAt:1});
const flush=async()=>{for(let index=0;index<20;index++)await Promise.resolve();};
function harness(options={}){
  const memory=options.memory||createMemoryDb(),writes=[],calls=[];
  const context=loadUserscript(`ensureNotificationAccount, restoreNotificationAccounts, flushNotificationAccountPersistence,
    rememberNotificationSubscription, toggleNotificationSubscriptionPinned, removeRememberedNotificationSubscription,
    notificationSubscriptions, notificationMutationGuards, sanitizeNotificationAccountProfile,
    scheduleNotificationSubscriptionsPersist, syncNotificationSubscriptions, updateNotificationSubscription,
    enqueueNetworkHarvestObject, drainNetworkHarvestQueue, notificationActionMatchesAccount,
    sanitizeSettings, applySettingsSnapshot`,`
    getCurrentViewerId=()=>globalThis.viewer;openDb=async()=>globalThis.memoryDb;
    renderNotificationSubscriptions=()=>{};refreshUI=()=>{};scheduleDownloadUiRefresh=()=>{};
    rememberFollowingRelation=()=>false;showToast=()=>{};
    requestXSessionJson=async(...args)=>globalThis.transport(...args);
    state.settings.notificationAccounts=globalThis.profiles;
    state.settingsLoaded=globalThis.settingsLoaded;
    if(globalThis.beforeSave){const save=dbPutNotificationAccount;dbPutNotificationAccount=async(...args)=>{await globalThis.beforeSave(...args);return save(...args);};}
  `,{
    viewer:options.viewer||'123',profiles:options.profiles||{},memoryDb:memory.db,
    settingsLoaded:options.loaded!==false,beforeSave:options.beforeSave,
    console:{...console,error:()=>{}},GM_setValue:(key,value)=>writes.push([key,structuredClone(value)]),
    transport:async(...args)=>{calls.push(args);return options.read?options.read(...args):{};},
  });
  const api=context.__test;api.ensureNotificationAccount();
  return {api,context,memory,writes,calls};
}
async function settleWrites(api){
  for(let index=0;index<20;index++){
    const queue=api.state.dbWriteQueue;await queue;await flush();
    if(queue===api.state.dbWriteQueue)return;
  }
  assert.fail('Notification writes did not settle');
}
{
  const test=harness(),{api,context,memory}=test;
  api.rememberNotificationSubscription(entry('9','same'),true);api.toggleNotificationSubscriptionPinned('same');
  api.state.notificationSyncedAt=10;
  context.viewer='456';api.ensureNotificationAccount();assert.equal(api.notificationSubscriptions.size,0);
  assert.equal(api.state.notificationSyncedAt,0);
  api.rememberNotificationSubscription(entry('9','same',false),false,{trackDisabled:true});
  api.state.notificationSyncedAt=20;api.scheduleNotificationSubscriptionsPersist();
  api.flushNotificationAccountPersistence(api.ensureNotificationAccount().session);await api.state.dbWriteQueue;
  const accounts=memory.records.settings.get('settings').value.notificationAccounts;
  assert.equal(accounts['123'].subscriptions[0].enabled,true);assert.equal(accounts['123'].subscriptions[0].pinned,true);
  assert.equal(accounts['456'].subscriptions[0].enabled,false);assert.equal(accounts['456'].subscriptions[0].pinned,undefined);
  context.viewer='123';api.ensureNotificationAccount();assert.equal(api.state.notificationSyncedAt,10);
  assert.equal(api.notificationSubscriptions.get('same').enabled,true);assert.equal(api.notificationSubscriptions.get('same').pinned,true);
  context.viewer='456';api.ensureNotificationAccount();assert.equal(api.state.notificationSyncedAt,20);
  assert.equal(api.notificationSubscriptions.get('same').enabled,false);
  context.viewer='';api.ensureNotificationAccount();assert.equal(api.notificationSubscriptions.size,0);
  assert.equal(api.rememberNotificationSubscription(entry('88','anonymous'),true),false);
}
{
  const test=harness();test.api.state.settings.notificationSubscriptions=[entry('1','legacy')];
  test.api.restoreNotificationAccounts(true);
  assert.equal(test.api.notificationSubscriptions.size,0,'Unowned legacy lists must not be guessed to belong to the current account');
  assert.equal(test.api.state.settings.notificationSubscriptions.length,1,'Legacy records must remain available to backups');
}
{
  let resolveA,resolveB;
  const test=harness({read:async path=>new Promise(resolve=>{if(new URL(path,'https://x.com').searchParams.get('user_id')==='123')resolveA=resolve;else resolveB=resolve;})});
  const pendingA=test.api.syncNotificationSubscriptions();await flush();
  test.context.viewer='456';test.api.ensureNotificationAccount();
  const pendingB=test.api.syncNotificationSubscriptions();await flush();
  resolveA({users:[{id_str:'9',screen_name:'froma',notifications:true}],next_cursor_str:'0'});await pendingA;
  assert.equal(test.api.notificationSubscriptions.size,0);assert.equal(test.api.state.notificationSyncInProgress,true,'A stale finally must not unlock the new account sync');
  resolveB({users:[{id_str:'10',screen_name:'fromb',notifications:true}],next_cursor_str:'0'});await pendingB;
  assert.equal(test.api.notificationSubscriptions.has('fromb'),true);assert.equal(test.api.notificationSubscriptions.has('froma'),false);
}
{
  let finishA,finishB;let calls=0;
  const profiles={'123':{subscriptions:[entry('9','same')],syncedAt:1},'456':{subscriptions:[entry('9','same')],syncedAt:2}};
  const test=harness({profiles,read:()=>new Promise(resolve=>{if(++calls===1)finishA=resolve;else finishB=resolve;})});
  const a=test.api.updateNotificationSubscription('same',false);await flush();
  test.context.viewer='456';test.api.ensureNotificationAccount();
  const b=test.api.updateNotificationSubscription('same',false);await flush();
  finishA({});await a;
  assert.equal(test.api.notificationSubscriptions.get('same').enabled,true);assert.equal(test.api.state.notificationMutationUsers.has('9'),true);
  finishB({});await b;assert.equal(test.api.notificationSubscriptions.get('same').enabled,false);
}
{
  const test=harness();const token=test.api.ensureNotificationAccount();
  test.api.enqueueNetworkHarvestObject({id_str:'9',screen_name:'latea',notifications:true},token);
  test.context.viewer='456';test.api.ensureNotificationAccount();
  test.api.drainNetworkHarvestQueue({timeRemaining:()=>100});
  assert.equal(test.api.notificationSubscriptions.size,0,'Queued user data from A must not be harvested into B');
}
{
  const memory=createMemoryDb();memory.records.settings.set('settings',{key:'settings',value:{theme:'light',notificationAccounts:{}}});
  const a=harness({viewer:'123',memory}),b=harness({viewer:'456',memory});
  a.api.rememberNotificationSubscription(entry('1','usera'),true);b.api.rememberNotificationSubscription(entry('2','userb'),true);
  a.api.flushNotificationAccountPersistence(a.api.ensureNotificationAccount().session);
  b.api.flushNotificationAccountPersistence(b.api.ensureNotificationAccount().session);
  await Promise.all([a.api.state.dbWriteQueue,b.api.state.dbWriteQueue]);
  const saved=memory.records.settings.get('settings').value;
  assert.equal(saved.theme,'light');assert.equal(saved.notificationAccounts['123'].subscriptions[0].username,'usera');
  assert.equal(saved.notificationAccounts['456'].subscriptions[0].username,'userb','Separate tabs must atomically merge different account buckets');
  a.api.applySettingsSnapshot(saved);a.context.viewer='456';a.api.ensureNotificationAccount();
  assert.equal(a.api.notificationSubscriptions.has('userb'),true,'Reloaded settings must refresh an account cache');
}
{
  const test=harness({profiles:{'123':{subscriptions:[entry('1','aaa')],syncedAt:5},'456':{subscriptions:[entry('2','bbb')],syncedAt:6}}});
  const sanitized=test.api.sanitizeSettings({...test.api.state.settings,notificationAccounts:{
    ...test.api.state.settings.notificationAccounts,bad:{subscriptions:[entry('3','bad')]},'789':{subscriptions:[entry('4','valid'),{id:'bad',username:'bad'}]},
  }});
  assert.equal(Object.keys(sanitized.notificationAccounts).length,3);assert.equal(sanitized.notificationAccounts['789'].subscriptions.length,1);
  test.context.viewer='456';
  assert.equal(test.api.notificationActionMatchesAccount({getAttribute:()=>'123'}),false,'A button from the old account must not mutate the new account');
  assert.equal(test.api.notificationSubscriptions.has('bbb'),true);
}
{
  const profiles={'123':{subscriptions:[entry('1','alice'),entry('2','bob')],syncedAt:1}};
  const memory=createMemoryDb(),a=harness({profiles,memory}),b=harness({profiles,memory});
  memory.records.settings.set('settings',{key:'settings',value:structuredClone(a.api.state.settings)});
  a.api.toggleNotificationSubscriptionPinned('alice');b.api.toggleNotificationSubscriptionPinned('bob');
  a.api.flushNotificationAccountPersistence(a.api.ensureNotificationAccount().session);await settleWrites(a.api);
  b.api.applySettingsSnapshot(structuredClone(memory.records.settings.get('settings').value));await settleWrites(b.api);
  const saved=memory.records.settings.get('settings').value.notificationAccounts['123'];
  assert.ok(saved.subscriptions.every(item=>item.pinned),'Dirty tabs must merge independent pins even after settings-reload');
}
{
  const profiles={'123':{subscriptions:[entry('1','alice')],syncedAt:1}};
  const memory=createMemoryDb(),a=harness({profiles,memory}),b=harness({profiles,memory});
  memory.records.settings.set('settings',{key:'settings',value:structuredClone(a.api.state.settings)});
  a.api.toggleNotificationSubscriptionPinned('alice');await b.api.updateNotificationSubscription('alice',false);
  a.api.state.notificationSyncedAt=30;a.api.scheduleNotificationSubscriptionsPersist();
  b.api.state.notificationSyncedAt=20;b.api.scheduleNotificationSubscriptionsPersist();
  a.api.flushNotificationAccountPersistence(a.api.ensureNotificationAccount().session);await settleWrites(a.api);
  b.api.flushNotificationAccountPersistence(b.api.ensureNotificationAccount().session);await settleWrites(b.api);
  const saved=memory.records.settings.get('settings').value.notificationAccounts['123'];
  assert.equal(saved.subscriptions[0].enabled,false);assert.equal(saved.subscriptions[0].pinned,true,
    'A bell change must not overwrite a different tab pin on the same user');
  assert.equal(saved.syncedAt,30,'An older sync timestamp must not replace a newer one');
}
{
  const profiles={'123':{subscriptions:[entry('1','forgotten',false),entry('2','kept')],syncedAt:1}};
  const memory=createMemoryDb(),a=harness({profiles,memory}),b=harness({profiles,memory});
  memory.records.settings.set('settings',{key:'settings',value:structuredClone(a.api.state.settings)});
  a.api.removeRememberedNotificationSubscription('forgotten');
  b.api.rememberNotificationSubscription({...entry('1','forgotten',false),displayName:'Updated stale metadata'},false,{trackDisabled:true});
  b.api.toggleNotificationSubscriptionPinned('kept');
  a.api.flushNotificationAccountPersistence(a.api.ensureNotificationAccount().session);await settleWrites(a.api);
  b.api.flushNotificationAccountPersistence(b.api.ensureNotificationAccount().session);await settleWrites(b.api);
  const saved=memory.records.settings.get('settings').value.notificationAccounts['123'].subscriptions;
  assert.equal(saved.length,1,'Stale metadata and pins must not resurrect an explicitly removed record');
  assert.equal(saved[0].id,'2');assert.equal(saved[0].pinned,true);
}
{
  let release,blocked=true;
  const test=harness({profiles:{'123':{subscriptions:[entry('1','alice')],syncedAt:1}},
    beforeSave:()=>blocked?new Promise(resolve=>{release=resolve;}):undefined});
  test.memory.records.settings.set('settings',{key:'settings',value:structuredClone(test.api.state.settings)});
  test.api.toggleNotificationSubscriptionPinned('alice');
  test.api.flushNotificationAccountPersistence(test.api.ensureNotificationAccount().session);await flush();
  test.api.toggleNotificationSubscriptionPinned('alice');
  test.api.flushNotificationAccountPersistence(test.api.ensureNotificationAccount().session);
  blocked=false;release();await settleWrites(test.api);
  assert.equal(test.memory.records.settings.get('settings').value.notificationAccounts['123'].subscriptions[0].pinned,false,
    'An undo while an earlier save is in flight must survive its acknowledgement');
  assert.equal(test.api.notificationSubscriptions.get('alice').pinned,false);
}
{
  const test=harness({loaded:false});
  test.api.rememberNotificationSubscription(entry('1','newname'),true);
  test.api.state.settings=test.api.sanitizeSettings({...test.api.state.settings,notificationAccounts:{
    '123':{subscriptions:[{...entry('1','oldname'),pinned:true}],syncedAt:40},
  }});
  test.api.state.settingsLoaded=true;test.api.restoreNotificationAccounts();await settleWrites(test.api);
  assert.equal(test.api.notificationSubscriptions.size,1);
  assert.equal(test.api.notificationSubscriptions.get('newname').pinned,true,'Early profile discovery must preserve the loaded local pin');
  assert.equal(test.api.state.notificationSyncedAt,40);
}
{
  const test=harness({profiles:{'123':{subscriptions:[
    {...entry('1','oldname'),pinned:true},{...entry('1','newname'),updatedAt:2},
  ],syncedAt:1}}});
  assert.equal(test.api.notificationSubscriptions.size,1,'Existing renamed duplicates must migrate by stable ID');
  assert.equal(test.api.notificationSubscriptions.get('newname').pinned,true);
  test.api.rememberNotificationSubscription({...entry('2','newname'),updatedAt:3},true);
  assert.equal(test.api.notificationSubscriptions.size,1);
  assert.equal(test.api.notificationSubscriptions.get('newname').id,'2');
  assert.equal(test.api.notificationSubscriptions.get('newname').pinned,undefined,'A reused username must not inherit another ID pin');
  assert.equal(test.api.notificationActionMatchesAccount({getAttribute:key=>({
    'data-notification-viewer':'123','data-notification-id':'1','data-username':'newname',
  })[key]||null}),false,'Old controls must reject reassigned usernames within the same account');
}
const history=()=>Array.from({length:2000},(_,index)=>({
  ...entry(String(10000+index),'history'+index,false),updatedAt:index+1,...(index===0?{pinned:true}:{}),
}));
{
  const test=harness({profiles:{'123':{subscriptions:history(),syncedAt:1}}});
  test.memory.records.settings.set('settings',{key:'settings',value:structuredClone(test.api.state.settings)});
  test.api.rememberNotificationSubscription(entry('99999','newactive'),true);
  assert.equal(test.api.notificationSubscriptions.size,2000);
  assert.equal(test.api.notificationSubscriptions.get('newactive').enabled,true);
  assert.equal(test.api.notificationSubscriptions.get('history0').pinned,true,'Pinned history should take priority over unpinned history');
  assert.equal(test.api.notificationSubscriptions.has('history1'),false,'The oldest unpinned disabled record should be evicted');
  assert.equal(test.api.notificationSubscriptions.has('history1999'),true);
  assert.ok(!test.api.ensureNotificationAccount().session.pending.some(change=>change.remove),
    'Retention must not be persisted as explicit deletion operations');
  test.api.flushNotificationAccountPersistence(test.api.ensureNotificationAccount().session);await settleWrites(test.api);
  const saved=test.memory.records.settings.get('settings').value;
  const fresh=harness({profiles:saved.notificationAccounts});
  assert.equal(fresh.api.notificationSubscriptions.size,2000);
  assert.equal(fresh.api.notificationSubscriptions.get('newactive').enabled,true,'A new active subscription must survive save and fresh load');
  assert.equal(fresh.api.notificationSubscriptions.get('history0').pinned,true);
}
{
  const active=Array.from({length:2005},(_,index)=>entry(String(30000+index),'active'+index));
  const test=harness({profiles:{'123':{subscriptions:[...history().slice(0,3),...active],syncedAt:1}}});
  assert.equal(test.api.notificationSubscriptions.size,2005,'Enabled users must not be silently truncated above the normal capacity');
  assert.ok([...test.api.notificationSubscriptions.values()].every(item=>item.enabled));
  test.api.state.notificationSyncedAt=2;test.api.scheduleNotificationSubscriptionsPersist();
  test.api.flushNotificationAccountPersistence(test.api.ensureNotificationAccount().session);await settleWrites(test.api);
  const saved=test.memory.records.settings.get('settings').value.notificationAccounts['123'];
  assert.equal(saved.subscriptions.length,2005);
  assert.ok(saved.subscriptions.some(item=>item.username==='active2004'));
}
{
  const profiles={'123':{subscriptions:history(),syncedAt:1}},memory=createMemoryDb();
  const a=harness({profiles,memory}),b=harness({profiles,memory});
  memory.records.settings.set('settings',{key:'settings',value:structuredClone(a.api.state.settings)});
  a.api.rememberNotificationSubscription(entry('99999','newactive'),true);
  assert.equal(a.api.notificationSubscriptions.has('history1'),false);
  await b.api.updateNotificationSubscription('history1',true);
  b.api.flushNotificationAccountPersistence(b.api.ensureNotificationAccount().session);await settleWrites(b.api);
  a.api.flushNotificationAccountPersistence(a.api.ensureNotificationAccount().session);await settleWrites(a.api);
  const saved=memory.records.settings.get('settings').value.notificationAccounts['123'].subscriptions;
  assert.equal(saved.length,2000);
  assert.ok(saved.some(item=>item.username==='history1'&&item.enabled),'Local eviction must not delete a user reopened in another tab');
  assert.ok(saved.some(item=>item.username==='newactive'&&item.enabled));
}
{
  const profiles={'123':{subscriptions:history(),syncedAt:1}},memory=createMemoryDb();
  const a=harness({profiles,memory}),b=harness({profiles,memory});
  memory.records.settings.set('settings',{key:'settings',value:structuredClone(a.api.state.settings)});
  a.api.rememberNotificationSubscription(entry('99999','newactive'),true);
  a.api.flushNotificationAccountPersistence(a.api.ensureNotificationAccount().session);await settleWrites(a.api);
  assert.ok(!memory.records.settings.get('settings').value.notificationAccounts['123'].subscriptions.some(item=>item.username==='history1'));
  await b.api.updateNotificationSubscription('history1',true);
  b.api.flushNotificationAccountPersistence(b.api.ensureNotificationAccount().session);await settleWrites(b.api);
  const saved=memory.records.settings.get('settings').value.notificationAccounts['123'].subscriptions;
  assert.ok(saved.some(item=>item.username==='history1'&&item.enabled),'Explicit re-enabling must restore an evicted history record');
  assert.ok(saved.some(item=>item.username==='newactive'&&item.enabled));
}
console.log('Notification accounts preserve enabled subscriptions beyond history capacity and merge field changes, explicit deletion, retention and in-flight undo safely.');
