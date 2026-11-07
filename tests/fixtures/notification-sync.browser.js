(() => {
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  window.__runNotificationSyncTests=async(api,check)=>{
    const isolated=async(run)=>{
      const saved=structuredClone(api.state.settings),originalFetch=window.fetch;
      const oldCookie=document.cookie.split(';').map(value=>value.trim()).find(value=>value.startsWith('twid='));
      try{
        document.cookie='twid=u%3D123;path=/';
        api.applySettingsSnapshot({...saved,notificationAccounts:{...saved.notificationAccounts,
          '123':{subscriptions:[{id:'9',username:'oldname',enabled:true,pinned:true,updatedAt:1}],syncedAt:0}}},{force:true});
        api.setPanelView('notifications');api.togglePanel(true);
        return await run();
      }finally{
        api.closeNotificationSyncDifferences();api.applySettingsSnapshot(saved,{force:true});
        await api.state.dbWriteQueue;await api.dbPutSetting('settings',saved);
        window.fetch=originalFetch;document.cookie=oldCookie?oldCookie+';path=/':'twid=;Max-Age=0;path=/';
        api.setPanelView('vault');api.togglePanel(false);
      }
    };
    await check('slow pagination preserves a later bell change after the short guard expires',()=>isolated(async()=>{
      let finish;const mutations=[];
      window.fetch=async(url,options)=>{
        const request=new URL(url,location.origin);
        if(request.pathname.endsWith('/friendships/update.json')){mutations.push(new URLSearchParams(options.body).get('device'));return Response.json({});}
        if(request.searchParams.get('cursor')==='-1')return Response.json({users:[{id_str:'9',screen_name:'oldname',notifications:true}],next_cursor_str:'100'});
        return new Promise(resolve=>{finish=()=>resolve(Response.json({users:[],next_cursor_str:'0'}));});
      };
      const sync=api.syncNotificationSubscriptions();
      for(let index=0;index<100&&!finish;index++)await sleep(5);
      assert(finish,'The second sync page did not start');
      await api.updateNotificationSubscription('oldname',false);
      api.notificationMutationGuards.get('9').expiresAt=0;finish();await sync;
      assert(!api.notificationSubscriptions.get('oldname').enabled,'An old first page re-enabled the local bell');
      assert(mutations.length===1&&mutations[0]==='false','The test must only issue one disabling request');
      const button=api.state.notificationListEl.querySelector('[data-action="toggle-notification-user"]');
      assert(button.dataset.enabled==='true','The UI must offer to re-enable the disabled bell');
      return {expiredGuardProtected:true,enableRequests:0};
    }));
    await check('renamed users keep one pinned row and stale controls reject reassigned usernames',()=>isolated(async()=>{
      const stale=api.state.notificationListEl.querySelector('[data-action="toggle-notification-user"]');
      const mutations=[];
      window.fetch=async(url,options)=>{
        if(new URL(url,location.origin).pathname.endsWith('/friendships/update.json')){
          mutations.push(new URLSearchParams(options.body).get('id'));return Response.json({});
        }
        return Response.json({users:[{id_str:'9',screen_name:'newname',notifications:true}],next_cursor_str:'0'});
      };
      await api.syncNotificationSubscriptions();
      assert(api.notificationSubscriptions.size===1&&api.notificationSubscriptions.get('newname').pinned,'Rename lost the pin or duplicated the identity');
      assert(api.state.notificationListEl.querySelectorAll('.BetterX-notification-user').length===1,'The DOM has duplicate user rows');
      api.rememberNotificationSubscription({id:'10',username:'oldname'},true);
      api.dispatchPanelAction('toggle-notification-user',stale);await sleep(10);
      assert(mutations.length===0,'The old button targeted a new owner of the same username');
      const button=api.state.notificationListEl.querySelector('[data-action="toggle-notification-user"][data-notification-id="9"]');
      button.click();await sleep(20);
      assert(mutations.length===1&&mutations[0]==='9'&&!api.notificationSubscriptions.get('newname').enabled,'The renamed row targeted the wrong ID');
      return {singleIdentity:true,pinPreserved:true,staleControlRequests:0};
    }));
    await check('notification sync batches 55 and 2000 users into one capture and two list renders',()=>isolated(async()=>{
      const observations=[];
      for(const count of [55,2000]){
        api.applySettingsSnapshot({...api.state.settings,notificationAccounts:{...api.state.settings.notificationAccounts,
          '123':{subscriptions:[],syncedAt:0}}},{force:true});
        await sleep(0);
        const users=Array.from({length:count},(_,index)=>({id_str:String(50000+index),screen_name:'batch'+index,notifications:true}));
        window.fetch=async url=>{
          const cursor=new URL(url,location.origin).searchParams.get('cursor');
          const offset=cursor==='-1'?0:Number(cursor);
          return Response.json({users:users.slice(offset,offset+200),next_cursor_str:offset+200<count?String(offset+200):'0'});
        };
        const metrics={renders:0,schedules:0,captures:0};
        const restore=api.watchNotificationWork(kind=>metrics[kind]++);
        try{await api.syncNotificationSubscriptions();}finally{restore();}
        assert(metrics.renders===2&&metrics.schedules===1&&metrics.captures===1,'Sync side effects still scale with user count: '+JSON.stringify(metrics));
        assert(api.notificationSubscriptions.size===count&&api.state.notificationListEl.querySelectorAll('.BetterX-notification-user').length===count,'The batched result did not reach the DOM');
        observations.push({subscriptions:count,...metrics});
      }
      return {observations};
    }));
    await check('full disabled history yields to a new enabled subscription in UI, IndexedDB and reload',()=>isolated(async()=>{
      const history=Array.from({length:2000},(_,index)=>({id:String(10000+index),username:'history'+index,
        enabled:false,updatedAt:index+1,...(index===0?{pinned:true}:{})}));
      const initial={...api.state.settings,notificationAccounts:{...api.state.settings.notificationAccounts,
        '123':{subscriptions:history,syncedAt:1}}};
      await api.dbPutSetting('settings',initial);api.applySettingsSnapshot(initial,{force:true});
      api.rememberNotificationSubscription({id:'99999',username:'newactive'},true);
      assert(api.notificationSubscriptions.size===2000&&api.notificationSubscriptions.get('newactive').enabled,'New enabled user was evicted');
      assert(api.notificationSubscriptions.get('history0').pinned&&!api.notificationSubscriptions.has('history1'),'Disabled history priority is wrong');
      assert(api.state.notificationListEl.querySelector('[data-notification-id="99999"]'),'The active user is missing from the DOM');
      api.flushNotificationAccountPersistence(api.ensureNotificationAccount().session);await api.state.dbWriteQueue;
      const stored=await api.dbGetSetting('settings');
      assert(stored.notificationAccounts['123'].subscriptions.length===2000&&stored.notificationAccounts['123'].subscriptions.some(item=>item.id==='99999'&&item.enabled),'The active user did not survive real IndexedDB persistence');
      api.applySettingsSnapshot(stored,{force:true});
      assert(api.notificationSubscriptions.get('newactive').enabled&&api.notificationSubscriptions.get('history0').pinned,'Reload lost the active user or pinned history');
      return {retainedRecords:2000,enabledPreserved:true,pinnedHistoryPreserved:true,reloadVerified:true};
    }));
    await check('notification sync reads all following pages, updates new bells and persists complete results without accepting error pages',async()=>{
      const originalFetch=window.fetch,originalItems=[...api.notificationSubscriptions.entries()];
      const previousTime=api.state.notificationSyncedAt;
      const oldCookie=document.cookie.split(';').map(value=>value.trim()).find(value=>value.startsWith('twid='));
      const users=Array.from({length:260},(_,index)=>({id_str:String(780000+index),screen_name:'syncuser'+index,name:'Sync '+index,notifications:index<55}));
      let requests=0,wrongEndpointRequests=0,failSecondPage=false;
      const button=api.state.panelEl.querySelector('[data-action="sync-notification-users"]');
      window.fetch=async(url,options)=>{
        const request=new URL(url,location.origin);
        if(!request.pathname.endsWith('/friends/list.json')&&!request.pathname.endsWith('/friends/following/list.json'))return originalFetch(url,options);
        requests++;await sleep(25);
        assert(options.method==='GET'&&options.credentials==='include'&&options.cache==='no-store','Sync must make a fresh read with the active X session');
        if(request.pathname.includes('/friends/following/')){
          wrongEndpointRequests++;return Response.json({users:users.slice(0,139).map((user,index)=>({...user,notifications:index<9})),next_cursor_str:'0'});
        }
        assert(request.searchParams.get('user_id')==='123','Sync requested another viewer');
        if(request.searchParams.get('cursor')==='-1')return Response.json({users:users.slice(0,200),next_cursor_str:'1234'});
        assert(request.searchParams.get('cursor')==='1234','Sync lost its pagination cursor');
        return Response.json(failSecondPage?{users:[],errors:[{code:88}],next_cursor_str:'0'}:{users:users.slice(200),next_cursor_str:'0'});
      };
      const sync=async()=>{
        button.click();assert(button.disabled,'The sync button must disable during a request');
        for(let index=0;index<100&&api.state.notificationSyncInProgress;index++)await sleep(20);
        assert(!api.state.notificationSyncInProgress&&!button.disabled,'The sync button did not recover');
      };
      try{
        document.cookie='twid=u%3D123;path=/';api.notificationSubscriptions.clear();
        api.setPanelView('notifications');api.togglePanel(true);
        await sync();
        assert(requests===2&&wrongEndpointRequests===0&&api.notificationSubscriptions.size===55,'Full following must discover all 55 fixture subscriptions, not only 9 mutuals');
        assert(api.state.notificationListEl.querySelectorAll('.BetterX-notification-user').length===55&&api.state.notificationStatusEl.textContent.includes('已订阅 55'),'The notification UI did not show all synced subscriptions');
        api.notificationSubscriptions.get('syncuser0').pinned=true;users[70].notifications=true;
        await sync();
        assert(api.notificationSubscriptions.size===56&&api.notificationSubscriptions.get('syncuser0').pinned,'The next sync must discover newly enabled bells and preserve pins');
        await sleep(550);await api.state.dbWriteQueue;
        const persisted=await api.dbGetSetting('settings');
        assert(persisted.notificationAccounts["123"].subscriptions.filter(item=>item.enabled).length===56,'The complete sync result was not persisted');
        const completedAt=api.state.notificationSyncedAt;
        failSecondPage=true;await sync();
        assert(api.state.notificationSyncedAt===completedAt&&api.notificationSubscriptions.size===56,'A JSON error page must not count as a completed sync or discard known subscribers');
        return {wrongEndpointRequests:0,initialSubscriptions:55,afterNewBell:56,paginationVerified:true,persistenceVerified:true,jsonErrorRejected:true};
      }finally{
        window.fetch=originalFetch;
        document.cookie=oldCookie?oldCookie+';path=/':'twid=;Max-Age=0;path=/';
        api.notificationSubscriptions.clear();for(const [key,item]of originalItems)api.notificationSubscriptions.set(key,item);
        api.state.notificationSyncedAt=previousTime;api.scheduleNotificationSubscriptionsPersist();await sleep(550);
        api.setPanelView('vault');api.togglePanel(false);await api.state.dbWriteQueue;
      }
    });
  };
})();
