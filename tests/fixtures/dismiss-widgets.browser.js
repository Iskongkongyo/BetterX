(() => {
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const visible=element=>getComputedStyle(element).display!=='none';
  const trends=()=>'<div data-widget="trends"><section role="region" aria-labelledby="random-trends"><h1 id="random-trends">当前趋势</h1><div aria-label="时间线：当前趋势"><h2>有什么新鲜事</h2><div data-testid="trend" role="link">Topic</div><a href="/explore/tabs/for-you">显示更多</a></div></section></div>';
  const follows=()=>'<div data-widget="follows"><div><aside aria-label="推荐关注" role="complementary"><h2>推荐关注</h2><ul><li role="listitem" data-testid="UserCell">Example account</li></ul><a href="/i/connect_people?user_id=123">显示更多</a></aside></div></div>';
  const nav=()=>'<nav role="navigation"><a data-widget="money" href="/i/money" aria-label="Money" role="link">Money</a><a data-widget="home" href="/home">Home</a><a data-widget="other-money" href="/i/moneybox">Moneybox</a><a data-widget="foreign-money" href="https://example.invalid/i/money">Other site</a></nav>';
  const makeHost=()=>{
    const host=document.createElement('section');
    host.innerHTML=`<div data-testid="sidebarColumn">${trends()}${follows()}<div data-widget="nfl"><div data-testid="nfl_scores_sidebar">NFL scores</div></div><div data-widget="premium"><aside role="complementary" aria-label="订阅 Premium"><a href="/i/premium_sign_up">订阅</a></aside></div><div data-widget="standalone-ad" data-testid="whoToFollowSspAd">Ad</div><div data-widget="keep">Keep this card</div></div>${nav()}<div data-testid="primaryColumn"><article data-widget="post"><div data-testid="tweetText">有什么新鲜事 推荐关注 Money</div><a data-widget="post-money" href="/i/money">Money in a post</a></article>${trends()}<div data-testid="UserCell" data-widget="followers-list">Followers</div></div>`;
    document.body.appendChild(host);return host;
  };
  const widgets=host=>Object.fromEntries([...host.querySelectorAll('[data-widget]')].map(element=>[element.dataset.widget,element]));

  window.__runDismissWidgetTests=async(api,check)=>{
    await check('4.3.0 hide settings precede common features and preserve old choices with reversible controls',async()=>{
      const previous={...api.state.settings},host=makeHost();
      const sidebar=host.querySelector('[data-testid="sidebarColumn"]');
      const card={trends:sidebar.querySelector('[data-widget="trends"]'),follows:sidebar.querySelector('[data-widget="follows"]'),money:host.querySelector('[data-widget="money"]')};
      try{
        const legacy={...api.DEFAULT_SETTINGS,settingsRevision:39,hideAds:false,hideNfl:false,layoutEnabled:false};
        for(const key of ['hideWhatsHappening','hideWhoToFollow','hideMoney'])delete legacy[key];
        api.applySettingsSnapshot(legacy);api.applyDismissWidgetHiding();api.setPanelView('settings');api.togglePanel(true);
        assert(api.state.settings.hideAds===false&&api.state.settings.hideNfl===false,'Upgrade changed existing hiding choices');
        const summaries=[...api.state.panelEl.querySelectorAll('summary')].map(element=>element.textContent.trim());
        assert(summaries.indexOf('关闭功能')<summaries.indexOf('常用功能'),'Hide features is not before Common features');
        const group=document.querySelector('#BetterX-dismiss-features');
        for(const id of ['hide-nfl','hideads','hide-whatsnew','hide-who-to-follow','hide-money']){
          assert(group.querySelector(`#BetterX-${id}`),`Missing relocated/new control: ${id}`);
          assert(document.querySelectorAll(`#BetterX-${id}`).length===1,`Duplicated control: ${id}`);
          assert(!group.querySelector(`#BetterX-${id}`).checked,`${id} should default off`);
        }
        assert(Object.values(card).every(visible),'Widgets must remain visible with hiding off by default');
        for(const control of [api.state.mediaDownloadEl,api.state.downloadZipEl,api.state.trackDownloadedPostsEl,api.state.postLimitWarningEl]){
          assert(control.checked,'A download or post-limit control did not default on');
        }
        assert(api.state.panelEl.querySelector('[data-skip="thread"]').classList.contains('active'),'Post details exclusion did not default on');
        const all=widgets(host);
        for(const key of ['home','other-money','foreign-money','post','post-money','followers-list','keep','premium','nfl','standalone-ad'])assert(visible(all[key]),`Unrelated content was hidden: ${key}`);
        assert(visible(host.querySelector('[data-testid="primaryColumn"] [data-widget="trends"]')),'The main Explore region was hidden');
        for(const [id,key,target] of [['hide-whatsnew','hideWhatsHappening','trends'],['hide-who-to-follow','hideWhoToFollow','follows'],['hide-money','hideMoney','money']]){
          const input=group.querySelector(`#BetterX-${id}`);assert(!input.checked,'Hide controls should default off');
          input.click();await api.state.dbWriteQueue;
          assert(!visible(card[target])&&api.state.settings[key]===true,`${key} did not hide its target`);
          assert((await api.dbGetSetting('settings'))[key]===true,`${key} was not persisted`);
          for(const [other,element]of Object.entries(card))if(other!==target)assert(visible(element),`${key} changed another hide setting`);
          input.click();assert(visible(card[target]),`${key} did not restore its target`);
        }
        group.querySelector('#BetterX-hide-nfl').click();group.querySelector('#BetterX-hideads').click();
        assert(!visible(all.nfl)&&!visible(all.premium)&&!visible(all['standalone-ad']),'Moved NFL/ad controls stopped working');
        api.setSettingsPartial({hideWhatsHappening:false,hideWhoToFollow:false,hideMoney:false});await api.state.dbWriteQueue;
        const saved=await api.dbGetSetting('settings');
        api.setSettingsPartial({hideWhatsHappening:true,hideWhoToFollow:true,hideMoney:true});
        await api.state.dbWriteQueue;
        const savedEnabled=await api.dbGetSetting('settings');
        api.applySettingsSnapshot({});api.applySettingsSnapshot(savedEnabled);
        assert(Object.values(card).every(element=>!visible(element)),'New off defaults overwrote previously enabled settings');
        api.applySettingsSnapshot(saved);
        assert(Object.values(card).every(visible),'Restoring saved settings did not restore visibility');
        api.applySettingsSnapshot({...saved,settingsRevision:0,mediaDownload:false,downloadZip:false,
          trackDownloadedPosts:false,postLimitWarningDisabled:true,skipSources:[]});
        for(const control of [api.state.mediaDownloadEl,api.state.downloadZipEl,api.state.trackDownloadedPostsEl,api.state.postLimitWarningEl]){
          assert(!control.checked,'Legacy off choices were overwritten by the new on defaults');
        }
        assert(!api.state.panelEl.querySelector('[data-skip="thread"]').classList.contains('active'),'Legacy empty exclusions were overwritten');
        return {sectionOrderVerified:true,independentControls:5,newDefaultsVerified:true,oldOnAndOffChoicesPreserved:true,settingsRestoreVerified:true};
      }finally{host.remove();api.applySettingsSnapshot(previous);api.togglePanel(false);await api.state.dbWriteQueue;}
    });

    await check('dynamic cards and reused Money links are hidden incrementally without hiding post content',async()=>{
      const previous={...api.state.settings};let host;
      try{
        api.setSettingsPartial({hideWhatsHappening:true,hideWhoToFollow:true,hideMoney:true,hideAds:false,hideNfl:false,layoutEnabled:false});
        api.startObserver();host=makeHost();await sleep(30);
        const sidebar=host.querySelector('[data-testid="sidebarColumn"]');
        const whats=sidebar.querySelector('[data-widget="trends"]'),follow=sidebar.querySelector('[data-widget="follows"]'),money=host.querySelector('[data-widget="money"]');
        assert(!visible(whats)&&!visible(follow)&&!visible(money),'Newly inserted widgets were not hidden');
        money.setAttribute('href','/home');await sleep(150);assert(visible(money),'A reused Money anchor hid the Home entry');
        money.setAttribute('href','/i/money?from=menu');await sleep(150);assert(!visible(money),'A Money href update was missed');
        const region=whats.querySelector('section'),aside=follow.querySelector('aside');
        const oldRegion=region.innerHTML,oldAside=aside.innerHTML;
        region.innerHTML='<h2>Ordinary sidebar content</h2>';aside.innerHTML='<p>Ordinary complementary content</p>';
        await sleep(150);assert(visible(whats)&&visible(follow),'Reused card wrappers retained obsolete hiding');
        region.innerHTML=oldRegion;aside.innerHTML=oldAside;await sleep(30);
        assert(!visible(whats)&&!visible(follow),'Nested widget content was not recognized on return');
        host.querySelector('article').appendChild(money);await sleep(30);
        assert(visible(money),'A moved Money anchor hid post content');
        const detached=whats;detached.remove();
        api.setSettingsPartial({hideWhatsHappening:false,hideWhoToFollow:false,hideMoney:false});
        sidebar.appendChild(detached);await sleep(30);
        assert(visible(detached),'A cached detached card remained hidden after disabling its setting');
        return {newCardsHidden:true,hrefReuseVerified:true,wrapperReuseVerified:true,postContentPreserved:true};
      }finally{
        api.state.observer?.disconnect();api.state.observerCleanup?.();api.state.viewObserver?.disconnect();
        host?.remove();api.applySettingsSnapshot(previous);await api.state.dbWriteQueue;
      }
    });
  };
})();
