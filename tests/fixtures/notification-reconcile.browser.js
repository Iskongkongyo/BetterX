(() => {
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const local=(id,username,extra={})=>({id,username,enabled:true,updatedAt:1,displayName:username,...extra});
  async function setup(api,transport){
    const saved={fetch:window.fetch,items:[...api.notificationSubscriptions],time:api.state.notificationSyncedAt,
      cookie:document.cookie.split(';').map(value=>value.trim()).find(value=>value.startsWith('twid='))};
    document.cookie='twid=u%3D123;path=/';api.notificationSubscriptions.clear();
    window.fetch=async(url,options)=>{
      const request=new URL(url,location.origin);
      if(request.pathname.endsWith('/friends/list.json'))return Response.json({users:[{id_str:'900001',screen_name:'kept',notifications:true}],next_cursor_str:'0'});
      if(request.pathname.endsWith('/friendships/update.json'))return transport(new URLSearchParams(options.body).get('id'),options);
      return saved.fetch(url,options);
    };
    api.setPanelView('notifications');api.togglePanel(true);
    return async()=>{
      api.closeNotificationSyncDifferences();
      for(let index=0;index<100&&api.state.notificationCleanupInProgress;index++)await sleep(20);
      window.fetch=saved.fetch;document.cookie=saved.cookie?saved.cookie+';path=/':'twid=;Max-Age=0;path=/';
      api.notificationSubscriptions.clear();for(const [key,item]of saved.items)api.notificationSubscriptions.set(key,item);
      api.state.notificationSyncedAt=saved.time;api.scheduleNotificationSubscriptionsPersist();await sleep(550);
      api.setPanelView('vault');api.togglePanel(false);await api.state.dbWriteQueue;
    };
  }
  const dialog=()=>document.querySelector('#BetterX-notification-differences');
  const sync=async(api)=>{
    api.state.panelEl.querySelector('[data-action="sync-notification-users"]').click();
    for(let index=0;index<100&&api.state.notificationSyncInProgress;index++)await sleep(20);
    assert(!api.state.notificationSyncInProgress,'Sync did not finish');
  };
  const waitCleanup=async(api)=>{
    for(let index=0;index<200&&api.state.notificationCleanupInProgress;index++)await sleep(25);
    assert(!api.state.notificationCleanupInProgress,'Cleanup did not finish');
  };
  window.__runNotificationReconcileTests=async(api,check)=>{
    await check('difference lists retain metadata changes, recent operations and users learned during sync',async()=>{
      let posts=0;
      const cleanup=await setup(api,async()=>{posts++;return Response.json({});});
      const read=window.fetch;
      try{
        api.notificationSubscriptions.set('kept',local('900001','kept'));
        api.notificationSubscriptions.set('metadata_a',local('902001','metadata_a'));
        api.notificationSubscriptions.set('guarded_b',local('902002','guarded_b'));
        api.notificationSubscriptions.set('disabled',local('902004','disabled',{enabled:false}));
        window.fetch=async(url,options)=>{
          if(new URL(url,location.origin).pathname.endsWith('/friends/list.json')){
            const metadata=api.notificationSubscriptions.get('metadata_a');
            metadata.displayName='Updated profile';metadata.updatedAt=Date.now();
            api.beginNotificationMutationGuard('guarded_b',true);
            api.notificationSubscriptions.set('learned_c',local('902003','learned_c',{updatedAt:Date.now()}));
          }
          return read(url,options);
        };
        await sync(api);const modal=dialog();assert(modal,'The missing users were hidden from the dialog');
        const names=[...modal.querySelectorAll('a')].map(link=>new URL(link.href).pathname.slice(1));
        assert(names.join()===['guarded_b','learned_c','metadata_a'].join(),'Timestamp changes, recent guards or new local records must not remove missing users: '+names.join());
        const counts=modal.querySelector('.BetterX-notification-diff-counts').textContent;
        assert(counts.includes('本次识别 1')&&counts.includes('本地开启 4')&&counts.includes('已关闭记录 1'),'The dialog must separate active subscriptions from disabled historical records');
        assert(api.state.notificationStatusEl.textContent.includes('已关闭记录 1'),'The notification status must explain the retained-record count');
        modal.querySelector('[data-notification-diff-cancel]').click();assert(posts===0,'Reviewing the complete difference list must not change notifications');
        return {previouslyHiddenUsersListed:2,newLocalUserListed:true,disabledRecordCountExplained:true,mutationRequests:0};
      }finally{api.notificationMutationGuards.delete('902002');await cleanup();}
    });
    await check('notification differences show profile links, cancel safely and disable confirmed unavailable accounts locally',async()=>{
      const calls=[];let active=0,maxActive=0;
      const cleanup=await setup(api,async(id,options)=>{
        calls.push({id,time:performance.now()});active++;maxActive=Math.max(maxActive,active);await sleep(25);active--;
        assert(options.method==='POST'&&new URLSearchParams(options.body).get('device')==='false','Cleanup changed something other than post notifications');
        return Response.json({errors:[{code:id==='900002'?50:63}]},{status:id==='900002'?404:403});
      });
      try{
        api.notificationSubscriptions.set('kept',local('900001','kept'));
        api.notificationSubscriptions.set('gone_a',local('900002','gone_a',{displayName:'<img src=x onerror=alert(1)>',pinned:true}));
        api.notificationSubscriptions.set('suspended_b',local('900003','suspended_b',{avatarUrl:'https://pbs.twimg.com/profile_images/test.jpg'}));
        api.notificationSubscriptions.set('already_off',local('900004','already_off',{enabled:false}));
        await sync(api);let modal=dialog();assert(modal,'A complete sync with missing local subscriptions must show a dialog');
        const links=[...modal.querySelectorAll('a')];
        assert(links.length===2&&links[0].href==='https://x.com/gone_a'&&links[1].href==='https://x.com/suspended_b','Only missing enabled accounts should have profile links');
        assert(links.every(link=>link.target==='_blank'&&link.relList.contains('noopener'))&&!modal.querySelector('img'),'Profile labels must be escaped text and open safely');
        assert(modal.textContent.includes('也可能是接口暂时遗漏'),'The dialog must not declare accounts deleted solely from a mismatch');
        modal.querySelector('[data-notification-diff-cancel]').click();
        assert(!dialog()&&calls.length===0&&api.notificationSubscriptions.get('gone_a').enabled,'Cancel must make no mutation request');
        await sync(api);modal=dialog();modal.querySelector('[data-notification-diff-confirm]').click();await sleep(80);
        assert(calls.length===1&&api.state.notificationCleanupInProgress,'Requests must remain serial with a spacing interval');
        assert(api.state.panelEl.querySelector('[data-action="sync-notification-users"]').disabled,'Sync must pause during cleanup');
        await waitCleanup(api);
        assert(calls.length===2&&maxActive===1&&calls[1].time-calls[0].time>=1450,'Cleanup concurrency or spacing is too high');
        assert(!api.notificationSubscriptions.get('gone_a').enabled&&!api.notificationSubscriptions.get('suspended_b').enabled&&api.notificationSubscriptions.get('gone_a').pinned,'Explicit unavailable accounts must disable only their local notification records and preserve pins');
        assert(modal.textContent.includes('仅关闭本地记录 2'),'The result must distinguish local-only cleanup from remote success');
        await sleep(550);await api.state.dbWriteQueue;
        const saved=await api.dbGetSetting('settings');
        assert(saved.notificationAccounts["123"].subscriptions.filter(item=>item.enabled).length===1,'Cleanup did not persist the disabled records');
        modal.querySelector('[data-notification-diff-cancel]').click();await sync(api);
        assert(!dialog(),'Already disabled local records must not cause another mismatch prompt');
        return {profileLinks:2,cancelMadeNoRequests:true,maxConcurrency:1,spacingMs:Math.round(calls[1].time-calls[0].time),localOnly:2,persistenceVerified:true};
      }finally{await cleanup();}
    });
    await check('notification cleanup stops on 429 and cancellation without disabling pending users',async()=>{
      let mode='limited',posts=0;
      const cleanup=await setup(api,async()=>{posts++;return mode==='limited'?Response.json({errors:[{code:88}]},{status:429}):Response.json({});});
      try{
        for(let index=0;index<3;index++)api.notificationSubscriptions.set('missing'+index,local(String(901000+index),'missing'+index));
        await sync(api);dialog().querySelector('[data-notification-diff-confirm]').click();await waitCleanup(api);await sleep(1600);
        assert(posts===1&&dialog().textContent.includes('X 请求受限'),'Rate limiting must stop without automatic retries');
        assert([...api.notificationSubscriptions.values()].filter(item=>item.username.startsWith('missing')).every(item=>item.enabled),'Rate limiting must not alter pending local states');
        dialog().querySelector('[data-notification-diff-cancel]').click();mode='normal';posts=0;
        await sync(api);dialog().querySelector('[data-notification-diff-confirm]').click();
        for(let index=0;index<50&&api.notificationSubscriptions.get('missing0').enabled;index++)await sleep(20);
        dialog().querySelector('[data-notification-diff-cancel]').click();await waitCleanup(api);
        assert(posts===1&&!api.notificationSubscriptions.get('missing0').enabled&&api.notificationSubscriptions.get('missing1').enabled&&api.notificationSubscriptions.get('missing2').enabled,'Cancelling the delay must leave later users untouched');
        return {rateLimitedRequests:1,automaticRetries:0,cancelledQueueVerified:true,pendingUsersPreserved:true};
      }finally{await cleanup();}
    });
  };
})();
