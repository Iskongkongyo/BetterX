(() => {
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const user=(name,enabled=true)=>({id:'990001',username:'shared',displayName:name,enabled,updatedAt:1});
  const setViewer=id=>{document.cookie=id?`twid=u%3D${id};path=/`:'twid=;Max-Age=0;path=/';window.dispatchEvent(new Event('focus'));};
  const settle=async local=>{
    for(let index=0;index<20;index++){
      const queue=local.state.dbWriteQueue;await queue;await Promise.resolve();
      if(queue===local.state.dbWriteQueue)return;
    }
    throw new Error('Account persistence did not settle');
  };
  window.__runNotificationAccountTests=async(api,check)=>{
    await check('notification UI switches account-owned lists, pins and timestamps and rejects stale controls',async()=>{
      const saved=structuredClone(api.state.settings),savedCookie=document.cookie.split(';').map(item=>item.trim()).find(item=>item.startsWith('twid='));
      const originalFetch=window.fetch;let posts=0;
      window.fetch=async(url,options)=>{
        if(new URL(url,location.origin).pathname.endsWith('/friendships/update.json')){posts++;return Response.json({});}
        return originalFetch(url,options);
      };
      try{
        api.installNotificationAccountTracking();setViewer('91001');
        api.state.settings.notificationSubscriptions=[{...user('Unowned legacy'),username:'legacy'}];
        api.setPanelView('notifications');api.togglePanel(true);
        assert(api.state.notificationListEl.textContent.includes('旧版通知记录未记录所属账号'),'Legacy records must be retained without being assigned to the current account');
        api.rememberNotificationSubscription(user('Account A'),true);api.toggleNotificationSubscriptionPinned('shared');
        api.state.notificationSyncedAt=111;api.scheduleNotificationSubscriptionsPersist();api.renderNotificationSubscriptions();
        const stale=api.state.notificationListEl.querySelector('[data-action="toggle-notification-user"]');
        assert(api.state.notificationListEl.textContent.includes('Account A'),'The A list is missing');
        setViewer('91002');await sleep(20);
        assert(api.notificationSubscriptions.size===0&&!api.state.notificationListEl.textContent.includes('Account A'),'Switching X accounts must hide A records');
        api.rememberNotificationSubscription(user('Account B'),true);api.state.notificationSyncedAt=222;api.scheduleNotificationSubscriptionsPersist();
        api.dispatchPanelAction('toggle-notification-user',stale);await sleep(20);
        assert(posts===0&&api.notificationSubscriptions.get('shared').enabled,'A stale A control must not mutate B');
        api.state.notificationListEl.querySelector('[data-action="toggle-notification-user"]').click();await sleep(40);
        assert(posts===1&&!api.notificationSubscriptions.get('shared').enabled,'The current B control should update only B');
        setViewer('91001');await sleep(20);
        assert(api.notificationSubscriptions.get('shared').enabled&&api.notificationSubscriptions.get('shared').pinned&&api.state.notificationSyncedAt===111,'Returning to A must restore its enabled state, pin and sync timestamp');
        setViewer('91002');await sleep(20);
        assert(!api.notificationSubscriptions.get('shared').enabled&&!api.notificationSubscriptions.get('shared').pinned&&api.state.notificationSyncedAt===222,'B should retain its independent state');
        setViewer('');await sleep(20);
        assert(api.notificationSubscriptions.size===0&&api.state.notificationListEl.textContent.includes('登录 X 后'),'Logout must not expose the previous list');
        return {sameUsernameIsolated:true,pinsIsolated:true,syncTimesIsolated:true,staleControlRequests:0,logoutClearsList:true};
      }finally{
        await api.state.dbWriteQueue;window.fetch=originalFetch;
        document.cookie=savedCookie?savedCookie+';path=/':'twid=;Max-Age=0;path=/';
        api.applySettingsSnapshot(saved,{force:true});await api.dbPutSetting('settings',saved);
        api.setPanelView('vault');api.togglePanel(false);
      }
    });

    await check('different notification accounts save concurrently to IndexedDB and survive a fresh session',async()=>{
      const saved=structuredClone(await api.dbGetSetting('settings')),frames=[];
      const frameFor=async id=>{
        const frame=document.createElement('iframe');frame.hidden=true;
        const loaded=new Promise(resolve=>{frame.onload=resolve;});
        frame.src='/account-frame.html?viewer='+encodeURIComponent(id);
        frames.push(frame);document.body.append(frame);await loaded;
        const local=frame.contentWindow.__test;local.state.settingsLoaded=true;local.ensureNotificationAccount();await local.openDb();return local;
      };
      try{
        const [a,b]=await Promise.all([frameFor('92001'),frameFor('92002')]);
        a.rememberNotificationSubscription(user('Saved A'),true);a.toggleNotificationSubscriptionPinned('shared');a.state.notificationSyncedAt=333;
        b.rememberNotificationSubscription(user('Saved B',false),false,{trackDisabled:true});b.state.notificationSyncedAt=444;
        a.flushNotificationAccountPersistence(a.ensureNotificationAccount().session);
        b.flushNotificationAccountPersistence(b.ensureNotificationAccount().session);
        await Promise.all([a.state.dbWriteQueue,b.state.dbWriteQueue]);
        const stored=await api.dbGetSetting('settings');
        assert(stored.notificationAccounts['92001'].subscriptions[0].enabled&&stored.notificationAccounts['92001'].subscriptions[0].pinned,'A settings were overwritten');
        assert(!stored.notificationAccounts['92002'].subscriptions[0].enabled,'B settings were overwritten');
        const reloaded=await frameFor('92001');reloaded.applySettingsSnapshot(stored,{force:true});
        assert(reloaded.notificationSubscriptions.size===1&&reloaded.notificationSubscriptions.get('shared').displayName==='Saved A'&&reloaded.state.notificationSyncedAt===333,'A fresh page must load only the matching account bucket');
        return {concurrentAccounts:2,atomicMergeVerified:true,freshSessionVerified:true,backupContainsBothAccounts:true};
      }finally{
        for(const frame of frames){const local=frame.contentWindow.__test;await local.state.dbWriteQueue;(await local.openDb()).close();frame.remove();}
        await api.dbPutSetting('settings',saved);api.applySettingsSnapshot(saved,{force:true});
      }
    });

    await check('same-account tabs merge independent pins, bell fields and deletion operations in real IndexedDB',async()=>{
      const saved=structuredClone((await api.dbGetSetting('settings'))||api.state.settings),frames=[];
      const initial={...saved,notificationAccounts:{...saved.notificationAccounts,'93001':{subscriptions:[
        {id:'1',username:'alice',enabled:true,updatedAt:1},
        {id:'2',username:'bob',enabled:true,updatedAt:1},
        {id:'3',username:'forgotten',enabled:false,updatedAt:1},
      ],syncedAt:1}}};
      const frameFor=async()=>{
        const frame=document.createElement('iframe');frame.hidden=true;frames.push(frame);
        const loaded=new Promise(resolve=>{frame.onload=resolve;});
        frame.src='/account-frame.html?viewer=93001';
        document.body.append(frame);await loaded;
        const local=frame.contentWindow.__test;local.state.settingsLoaded=true;
        local.applySettingsSnapshot(initial,{force:true});await local.openDb();return local;
      };
      try{
        await api.dbPutSetting('settings',initial);
        const [a,b]=await Promise.all([frameFor(),frameFor()]);
        a.toggleNotificationSubscriptionPinned('alice');b.toggleNotificationSubscriptionPinned('bob');
        a.removeRememberedNotificationSubscription('forgotten');
        b.rememberNotificationSubscription({id:'3',username:'forgotten',displayName:'Stale metadata'},false,{trackDisabled:true});
        a.flushNotificationAccountPersistence(a.ensureNotificationAccount().session);await settle(a);
        b.applySettingsSnapshot(await api.dbGetSetting('settings'));await settle(b);
        let stored=await api.dbGetSetting('settings');
        let users=stored.notificationAccounts['93001'].subscriptions;
        assert(users.length===2&&users.every(item=>item.pinned),'Independent pins were lost or a removed record was revived');
        a.applySettingsSnapshot(stored,{force:true});b.applySettingsSnapshot(stored,{force:true});
        frames[1].contentWindow.fetch=async()=>Response.json({});
        a.toggleNotificationSubscriptionPinned('alice');const bellResult=await b.updateNotificationSubscription('alice',false);
        assert(bellResult.status==='closed','The synthetic bell request did not complete');
        a.flushNotificationAccountPersistence(a.ensureNotificationAccount().session);await settle(a);
        b.flushNotificationAccountPersistence(b.ensureNotificationAccount().session);await settle(b);
        stored=await api.dbGetSetting('settings');users=stored.notificationAccounts['93001'].subscriptions;
        const alice=users.find(item=>item.id==='1');
        assert(!alice.pinned&&!alice.enabled&&users.find(item=>item.id==='2').pinned,'Same-user field changes did not merge');
        return {independentPins:true,sameUserFields:true,deletionsPreserved:true};
      }finally{
        for(const frame of frames){const local=frame.contentWindow.__test;await settle(local);local.applySettingsSnapshot(initial,{force:true});(await local.openDb()).close();frame.remove();}
        await api.dbPutSetting('settings',saved);api.applySettingsSnapshot(saved,{force:true});
      }
    });
  };
})();
