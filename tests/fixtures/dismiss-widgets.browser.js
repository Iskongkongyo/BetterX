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
    await check('4.4.0 hide settings precede common features and preserve old choices with reversible controls',async()=>{
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
        const sharedAside=document.createElement('aside');
        sharedAside.setAttribute('role','complementary');
        sharedAside.innerHTML='<section><h2>订阅 Premium</h2><a href="/i/premium_sign_up">订阅</a></section><section>普通趋势</section>';
        sidebar.appendChild(sharedAside);
        group.querySelector('#BetterX-hide-nfl').click();group.querySelector('#BetterX-hideads').click();
        assert(!visible(all.nfl)&&!visible(all.premium)&&!visible(all['standalone-ad']),'Moved NFL/ad controls stopped working');
        assert(!visible(sharedAside.firstElementChild)&&sharedAside.lastElementChild.checkVisibility(),'Premium filtering hid the shared sidebar or left the card visible');
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

    await check('ad fallback preserves ordinary cards and restores a reused timeline row', async () => {
      const previous = { ...api.state.settings };
      const host = document.createElement('main');
      host.innerHTML = '<ul>'
        + '<li data-index="1" id="ad-fixture-row"><article data-testid="tweet">'
        + '<span data-label>Promoted by Acme</span><div data-testid="tweetText">Post text</div></article></li>'
        + '<li data-index="2" id="ad-fixture-card"><article data-testid="tweet">'
        + '<a data-testid="card.wrapper" href="https://example.org/news"><span>Sponsored by a local library</span></a>'
        + '<a href="https://x.com/search?q=topic&amp;src=promoted_trend_click">A link shared within the post</a></article></li>'
        + '</ul><div data-testid="sidebarColumn"><ul>'
        + '<li data-index="3" id="ad-fixture-trend"><a href="https://x.com/search?q=topic&amp;src=promoted_trend_click">Promoted trend</a></li>'
        + '<li data-index="4" id="ad-fixture-organic-trend"><a href="https://x.com/search?q=topic&amp;src=promoted_trend_click_archive">Ordinary trend</a></li>'
        + '</ul></div>';
      const hasHeight = (id) => host.querySelector('#' + id).getBoundingClientRect().height > 0;
      try {
        api.applySettingsSnapshot({ ...previous, hideAds: true, hideAdultSpam: false });
        api.startObserver();
        document.body.appendChild(host);
        api.scanArticles(host);
        assert(!hasHeight('ad-fixture-row'), 'A genuine ad label was missed');
        assert(!hasHeight('ad-fixture-trend'), 'A genuine promoted trend was missed');
        assert(hasHeight('ad-fixture-card'), 'A link card or search link inside a post hid ordinary content');
        assert(hasHeight('ad-fixture-organic-trend'), 'A different src parameter matched a promoted trend');

        const trend = host.querySelector('#ad-fixture-trend a');
        trend.setAttribute('href', 'https://x.com/search?q=ordinary');
        await sleep(50);
        assert(hasHeight('ad-fixture-trend'), 'A reused trend link retained a stale ad marker');
        trend.setAttribute('href', 'https://x.com/search?q=topic&src=promoted_trend_click');
        await sleep(50);
        assert(!hasHeight('ad-fixture-trend'), 'Promotion added via a trend href update was missed');

        const row = host.querySelector('#ad-fixture-row');
        row.querySelector('[data-label]').remove();
        await sleep(170);
        assert(hasHeight('ad-fixture-row'), 'Removing an ad label without replacing the article left the row collapsed');

        row.innerHTML = '<article data-testid="tweet"><span>Promoted by Acme</span></article>';
        await sleep(170);
        assert(!hasHeight('ad-fixture-row'), 'An ad inserted into the same row was missed');
        row.innerHTML = '<article data-testid="tweet"><div data-testid="tweetText">A new ordinary post</div></article>';
        await sleep(170);
        assert(hasHeight('ad-fixture-row'), 'A recycled row kept the previous post’s ad marker');
        return { adLabelsVerified: true, linkCardsPreserved: true, reusedRowRestored: true };
      } finally {
        api.state.observer?.disconnect();
        api.state.observerCleanup?.();
        api.state.viewObserver?.disconnect();
        host.remove();
        api.applySettingsSnapshot(previous);
        await api.state.dbWriteQueue;
      }
    });

    await check('Hide ads filters the Grok Bot Premium offer without hiding surrounding content', async () => {
      const previous = { ...api.state.settings };
      const host = document.createElement('div');
      host.innerHTML = '<aside role="complementary" data-fixture="sidebar">'
        + '<div data-fixture="trends">Ordinary trends</div>'
        + '<aside role="complementary" aria-label="Get Grok Bot with X Premium" data-fixture="offer">'
        + '<span data-testid="grokBotMark"></span><div>Get Grok Bot with X Premium</div>'
        + '<a href="/i/premium_sign_up?referring_page=grok-bot-offer%3Ahome-sidebar">Get the offer</a>'
        + '<button data-testid="grokBotOfferDismiss" type="button">Dismiss</button></aside></aside>'
        + '<div role="dialog" aria-label="Premium information" data-fixture="dialog">'
        + '<a href="/i/premium_sign_up">View options</a></div>'
        + '<aside role="complementary" data-fixture="grok">'
        + '<span data-testid="grokBotMark"></span><a href="/i/grok">Open Grok</a></aside>';
      document.body.appendChild(host);
      const get = (id) => host.querySelector('[data-fixture="' + id + '"]');
      const offer = get('offer');
      let dismissals = 0;
      offer.querySelector('button').addEventListener('click', () => { dismissals++; });
      try {
        api.applySettingsSnapshot({ ...previous, hideAds: false });
        assert(visible(offer), 'The offer must remain visible with Hide ads off');

        api.applySettingsSnapshot({ ...previous, hideAds: true });
        assert(!visible(offer), 'Hide ads did not hide the supplied Grok Bot offer');
        assert(['sidebar', 'trends', 'dialog', 'grok'].every((id) => visible(get(id))),
          'The offer rule hid an ordinary sidebar, trend, dialog or Grok entry');

        const inserted = offer.cloneNode(true);
        inserted.setAttribute('aria-label', 'Grok Bot avec X Premium');
        inserted.querySelector('a').setAttribute('href', '/i/grok');
        get('sidebar').appendChild(inserted);
        assert(visible(inserted), 'The dismiss marker alone should not hide a card');
        inserted.querySelector('a').setAttribute('href', '/i/premium_sign_up?referring_page=grok-bot-offer%3Ahome-sidebar');
        assert(!visible(inserted), 'A late Premium link did not hide the localized offer');
        inserted.querySelector('button').remove();
        assert(visible(inserted), 'A reused card should be visible once the offer marker is gone');

        api.applySettingsSnapshot({ ...previous, hideAds: false });
        assert(visible(offer), 'Turning Hide ads off did not restore the offer');
        assert(dismissals === 0, 'The offer must not be permanently dismissed');
        return { offerHidden: true, dynamicOfferHidden: true, surroundingsPreserved: true };
      } finally {
        host.remove();
        api.applySettingsSnapshot(previous);
        await api.state.dbWriteQueue;
      }
    });
  };
})();
