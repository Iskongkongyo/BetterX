(() => {
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const articleFor=(id,text,author='author')=>{
    const article=document.createElement('article');article.dataset.testid='tweet';
    article.innerHTML=`<div data-testid="User-Name"><a href="/${author}">${author}</a><a href="/${author}/status/${id}"><time>now</time></a></div><div data-testid="tweetText"></div>`;
    article.querySelector('[data-testid="tweetText"]').textContent=text;
    return article;
  };
  const detailArticle=(id,author)=>{
    const article=articleFor(id,'Author links regression',author);
    article.insertAdjacentHTML('beforeend','<div style="display:flex;gap:8px"><div><button data-testid="caret" style="width:20px;height:20px"><svg width="20" height="20"></svg></button></div></div>');
    return article;
  };
  const profileResponse=(href)=>Response.json({data:{user:{result:{profile_bio:{entities:{description:{urls:href?[{expanded_url:href}]:[]}}}}}}});
  window.__runAuthorLinksTests=async(api,check)=>{
    await check('author links honor settings, Grok placement, site icons and cache expiry', async () => {
      const previousUrl = location.href;
      const path = '/Author/status/632001';
      const primary = document.querySelector('[data-testid="primaryColumn"]');
      const post = articleFor('632001', 'post with author links');
      const reply = articleFor('632002', 'reply from the same author');
      for (const article of [post, reply]) {
        article.dataset.testid = 'tweet';
        article.insertAdjacentHTML('afterbegin', `
          <div data-native-actions style="display:flex;align-items:center;justify-content:flex-end;gap:8px;overflow:hidden">
            <div data-native-more style="display:flex"><div><div style="display:flex">
              <button data-testid="caret" style="display:grid;place-items:center;width:18.75px;height:20px;border:0;padding:0;color:rgb(113,118,123)">
                <svg width="18.75" height="18.75" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/></svg>
              </button>
            </div></div></div>
          </div>`);
      }
      const overlayPost = post.cloneNode(true);
      overlayPost.querySelector('[data-native-actions]').style.gap = '0';
      post.append(post.querySelector('a[href*="/status/"]'));
      reply.querySelector('[data-testid="tweetText"]').insertAdjacentHTML('beforeend', '<a href="/author/status/632001">original post</a>');
      const layers = document.createElement('div');
      layers.id = 'layers';
      layers.append(overlayPost);
      const originalFetch = window.fetch;
      const originalGmRequest = window.GM_xmlhttpRequest;
      const originalGetValue = window.GM_getValue;
      const originalSetValue = window.GM_setValue;
      const originalNow = Date.now;
      const settingsToggle = document.querySelector('#BetterX-author-links-enabled');
      assert(settingsToggle?.closest('details').querySelector('summary').textContent === '常用功能' &&
        api.state.settings.authorLinksEnabled === false && !settingsToggle.checked, 'Author links must be off by default in Common features');
      const stored = new Map();
      window.GM_getValue = (key, fallback) => stored.has(key) ? structuredClone(stored.get(key)) : originalGetValue(key, fallback);
      window.GM_setValue = (key, value) => stored.set(key, structuredClone(value));
      const loadedAt = Date.now();
      let clock = loadedAt;
      Date.now = () => clock;
      const requests = [];
      const pixiv = { display_url: 'pixiv.net/users/3792568', expanded_url: 'https://www.pixiv.net/users/3792568' };
      const weibo = { display_url: 'weibo.com/2302633662', expanded_url: 'http://weibo.com/2302633662' };
      const website = { expanded_url: 'https://example.org/' };
      const iconRequests = [];
      window.GM_xmlhttpRequest = request => {
        iconRequests.push(request);
        request.onload({
          status: request.url.includes('sinaweibo') ? 404 : 200,
          responseText: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/></svg>',
        });
      };
      window.fetch = async (url, options) => {
        const request = new URL(url, location.origin);
        if (!request.pathname.endsWith('/UserByScreenName')) return originalFetch(url, options);
        requests.push([request, options]);
        return Response.json({ data: { user: { result: { profile_bio: { entities: {
          description: { urls: [pixiv, weibo, { expanded_url: 'javascript:alert(1)' }] },
          url: { urls: [pixiv, website] },
        } } } } } });
      };
      const buttonFor = article => article.querySelector('.BetterX-author-links button');
      const setAuthorLinks = enabled => {
        settingsToggle.checked = enabled;
        settingsToggle.dispatchEvent(new Event('change', { bubbles: true }));
      };
      try {
        history.replaceState(null, '', path);
        api.installNavigationListener();
        api.startObserver();
        primary.append(reply, post);
        api.scanArticles(document);
        await sleep(120);
        assert(requests.length === 0 && !buttonFor(post), 'Disabled author links must not make a request');
        setAuthorLinks(true);
        await sleep(40);
        assert(requests.length === 1, 'Opening post details did not request the author once');
        await api.state.dbWriteQueue;
        assert((await api.dbGetSetting('settings')).authorLinksEnabled === true, 'The author links switch must persist');
        const [request, options] = requests[0];
        assert(options.method === 'GET' && options.credentials === 'include' &&
          JSON.parse(request.searchParams.get('variables')).screen_name === 'author', 'The request must use the author handle and the active X session');
        const button = buttonFor(post);
        const caret = post.querySelector('[data-testid="caret"]');
        const actionRow = post.querySelector('[data-native-actions]');
        assert(button && button.parentElement.parentElement === actionRow &&
          Math.abs(caret.getBoundingClientRect().left - button.getBoundingClientRect().right - 8) < 1 &&
          Math.abs(button.getBoundingClientRect().top - caret.getBoundingClientRect().top) < 12 &&
          !buttonFor(reply), 'The links button must use the native author row gap outside the nested More wrappers');
        assert(getComputedStyle(button).color === getComputedStyle(caret.querySelector('svg')).color,
          'The links icon must use the native More icon color');
        const grokSlot = document.createElement('div');
        grokSlot.style.marginInlineEnd = '4px';
        grokSlot.innerHTML = '<button aria-label="Grok 操作" style="width:20px;height:20px;padding:0">G</button>';
        actionRow.prepend(grokSlot);
        await sleep(120);
        assert(buttonFor(post) === button && grokSlot.previousElementSibling === button.parentElement &&
          button.getBoundingClientRect().right <= grokSlot.getBoundingClientRect().left,
          'The links button must move left of a Grok button added to the author row');
        const centerX = node => {
          const { left, width } = (node.querySelector('svg') || node).getBoundingClientRect();
          return left + width / 2;
        };
        const grokX = centerX(grokSlot.querySelector('button'));
        assert(Math.abs((grokX - centerX(button)) - (centerX(caret) - grokX)) < 1,
          'Author links, Grok and More must have the same center-to-center spacing');
        button.scrollIntoView({ block: 'center' });
        const hoverRect = button.getBoundingClientRect();
        const hover = new Promise(resolve => button.addEventListener('pointerenter', resolve, { once: true }));
        window.__authorLinksHoverPoint = { x: centerX(button), y: hoverRect.top + hoverRect.height / 2 };
        await Promise.race([hover, sleep(2500)]);
        window.__authorLinksHoverPoint = null;
        const halo = getComputedStyle(button, '::before');
        const rowOverflow = getComputedStyle(actionRow).overflowY;
        assert(button.matches(':hover') && halo.backgroundColor === 'rgba(29, 155, 240, 0.1)' &&
          Math.abs(parseFloat(halo.width) - 34.75) < 1 &&
          Math.abs(parseFloat(halo.height) - 34.75) < 1 &&
          rowOverflow === 'visible',
          'Expected an unclipped native highlight: ' + JSON.stringify([button.matches(':hover'), halo.backgroundColor, halo.width, halo.height, rowOverflow]));
        button.click();
        const menu = post.querySelector('[popover]:popover-open');
        assert(menu, 'The links button did not open its menu');
        const menuRect = menu.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        assert(Math.min(Math.abs(menuRect.top - buttonRect.bottom), Math.abs(menuRect.bottom - buttonRect.top)) < 12,
          'The menu must stay anchored to its button');
        const links = [...menu.querySelectorAll('a')];
        assert(links.map(link => link.href).join() === [pixiv, weibo, website].map(link => link.expanded_url).join() &&
          links.every(link => link.target === '_blank' && link.relList.contains('noopener')), 'The menu must contain unique HTTP(S) destinations');
        await sleep(60);
        assert(iconRequests.map(request => request.url).join() ===
          ['pixiv/0096FA', 'sinaweibo/FF8200'].map(logo => 'https://cdn.simpleicons.org/' + logo).join() &&
          iconRequests.every(request => request.anonymous) &&
          links[0].querySelector('img')?.src.startsWith('data:image/svg+xml') &&
          links[1].querySelector('svg') && links[2].querySelector('svg'),
          'Only known sites need anonymous CDN requests, with a website icon for unknown sites and failed images');

        history.pushState(null, '', path + '/photo/1');
        document.body.append(layers);
        await sleep(180);
        assert(buttonFor(overlayPost) && !buttonFor(post) && requests.length === 1, 'The same post must reuse its links only in the active photo overlay');
        const overlayCaret = overlayPost.querySelector('[data-testid="caret"]');
        assert(buttonFor(overlayPost).parentElement.nextElementSibling === overlayCaret.closest('[data-native-more]') &&
          Math.abs(overlayCaret.getBoundingClientRect().left - buttonFor(overlayPost).getBoundingClientRect().right - 8) < 1,
          'Without Grok or a row gap the links button must retain native spacing beside More');
        assert(buttonFor(overlayPost).offsetWidth === overlayPost.querySelector('[data-testid="caret"]').offsetWidth,
          'Without Grok the links button must still use the native action width');
        const settingsLabel = settingsToggle.closest('label');
        assert(settingsLabel.textContent.trim() === '作品详情页显示作者链接' &&
          settingsLabel.nextElementSibling.textContent.includes('，而不用访问作者主页'),
          'The setting must explain where author links appear and why');
        buttonFor(overlayPost).click();
        assert(overlayPost.querySelector('[popover]:popover-open a')?.href === pixiv.expanded_url, 'The overlay links button must open its own menu');
        history.replaceState(null, '', previousUrl);
        assert(!buttonFor(overlayPost), 'Leaving the detail route must remove the open links menu');

        const week = 7 * 24 * 60 * 60 * 1000;
        assert([...stored.values()].some(entry => entry?.expiresAt === loadedAt + week), 'The cache must persist a seven-day expiry');
        clock = loadedAt + week - 1;
        history.replaceState(null, '', '/author/status/632002');
        await sleep(40);
        assert(requests.length === 1 && buttonFor(reply), 'Different posts by the same author must reuse fresh links');
        clock = loadedAt + week;
        history.replaceState(null, '', path);
        await sleep(40);
        assert(requests.length === 2 && buttonFor(post), 'Expired links must be requested again');
        setAuthorLinks(false);
        assert(!buttonFor(post), 'Turning author links off must remove the button immediately');
      } finally {
        if (settingsToggle.checked) setAuthorLinks(false);
        history.replaceState(null, '', previousUrl);
        Date.now = originalNow;
        window.GM_xmlhttpRequest = originalGmRequest;
        window.GM_getValue = originalGetValue;
        window.GM_setValue = originalSetValue;
        window.fetch = originalFetch;
        post.remove();
        reply.remove();
        layers.remove();
      }
    });
    await check('author links reject recycled nodes, attribute-only identity changes and stale async targets',async()=>{
      const previousUrl=location.href,originalFetch=window.fetch;
      const primary=document.querySelector('[data-testid="primaryColumn"]'),posts=[];
      const original=detailArticle('632101','recycle_a'),replacement=detailArticle('632101','recycle_a');
      posts.push(original,replacement);
      let completeLate;const requests=[];
      window.fetch=async(url,options)=>{
        const request=new URL(url,location.origin);
        if(!request.pathname.endsWith('/UserByScreenName'))return originalFetch(url,options);
        const name=JSON.parse(request.searchParams.get('variables')).screen_name;requests.push(name);
        if(name==='late_a')return new Promise(resolve=>{completeLate=resolve;});
        return profileResponse('https://www.pixiv.net/users/123');
      };
      try{
        primary.append(original);history.replaceState(null,'','/recycle_a/status/632101');
        api.setSettingsPartial({authorLinksEnabled:true});await sleep(40);
        const oldButton=original.querySelector('.BetterX-author-links button');assert(oldButton,'The initial author button is missing');
        original.querySelector('[data-testid="User-Name"] a').href='/different';
        original.querySelector('a[href*="/status/"]').href='/different/status/632102';
        primary.append(replacement);
        const staleClick=new MouseEvent('click',{bubbles:true,cancelable:true});oldButton.dispatchEvent(staleClick);
        assert(staleClick.defaultPrevented && !original.querySelector('.BetterX-author-links') && replacement.querySelector('.BetterX-author-links'),
          'A click before the observer flush must reject a recycled article and relocate the control');
        replacement.querySelector('a[href*="/status/"]').href='/recycle_a/status/632103';
        await sleep(160);
        assert(!replacement.querySelector('.BetterX-author-links'),'An href-only status change must invalidate the existing control');
        const matching=detailArticle('632101','recycle_a');posts.push(matching);primary.append(matching);await sleep(160);
        assert(matching.querySelector('.BetterX-author-links') && requests.filter(name=>name==='recycle_a').length===1,
          'The original route should attach to a newly inserted matching article without another request');
        const late=detailArticle('632104','late_a'),lateMatching=detailArticle('632104','late_a');posts.push(late,lateMatching);
        primary.append(late);history.replaceState(null,'','/late_a/status/632104');await sleep(20);
        assert(completeLate,'The delayed profile request did not start');
        late.querySelector('[data-testid="User-Name"] a').href='/other_late';
        late.querySelector('a[href*="/status/"]').href='/other_late/status/632105';
        primary.append(lateMatching);completeLate(profileResponse('https://www.pixiv.net/users/456'));await sleep(40);
        assert(!late.querySelector('.BetterX-author-links') && lateMatching.querySelector('.BetterX-author-links a')?.href==='https://www.pixiv.net/users/456',
          'Async completion must resolve the current author/post identity again');
        return {recycledClickBlocked:true,attributeOnlyReuseVerified:true,lateResponseIdentityVerified:true};
      }finally{
        api.setSettingsPartial({authorLinksEnabled:false});history.replaceState(null,'',previousUrl);
        window.fetch=originalFetch;posts.forEach(post=>post.remove());
      }
    });

    await check('author links recover with backoff and manual retry, cache empty profiles and cancel disabled retries',async()=>{
      const previousUrl=location.href,originalFetch=window.fetch,originalSet=window.GM_setValue;
      const primary=document.querySelector('[data-testid="primaryColumn"]'),posts=[],requests=new Map(),stored=new Map();
      let manualReady=false;
      window.GM_setValue=(key,value)=>{if(key.startsWith('betterx_author_links:'))stored.set(key,structuredClone(value));else originalSet(key,value);};
      window.fetch=async(url,options)=>{
        const request=new URL(url,location.origin);
        if(!request.pathname.endsWith('/UserByScreenName'))return originalFetch(url,options);
        const name=JSON.parse(request.searchParams.get('variables')).screen_name,count=(requests.get(name)||0)+1;requests.set(name,count);
        if((name==='retry_a'&&count===1)||(name==='retry_manual'&&!manualReady)||name==='cancel_a')throw new Error('Temporary fixture failure');
        return profileResponse(name==='empty_a'?null:'https://www.pixiv.net/users/789');
      };
      const visit=async(name,id)=>{
        const post=detailArticle(id,name);posts.push(post);primary.append(post);
        history.replaceState(null,'',`/${name}/status/${id}`);api.refreshAuthorLinks();await sleep(40);return post;
      };
      try{
        api.setSettingsPartial({authorLinksEnabled:true});
        const automatic=await visit('retry_a','632201');
        assert(automatic.querySelector('.BetterX-author-links button')?.title==='作者链接加载失败，点击重试','A failed request must expose an actionable retry control');
        for(let index=0;index<40&&!automatic.querySelector('.BetterX-author-links a');index++)await sleep(60);
        assert(requests.get('retry_a')===2 && automatic.querySelector('.BetterX-author-links a'),
          'The same post must recover after automatic retry: '+JSON.stringify({requests:requests.get('retry_a'),path:location.pathname,html:automatic.outerHTML}));
        const manual=await visit('retry_manual','632202');
        const retry=manual.querySelector('.BetterX-author-links button');assert(retry?.title.includes('重试'),'The manual retry control is missing');
        manualReady=true;retry.click();await sleep(40);
        assert(requests.get('retry_manual')===2 && manual.querySelector('.BetterX-author-links a'),'Manual retry must work without leaving the post');
        for(const id of ['632203','632204','632205'])await visit('empty_a',id);
        assert(requests.get('empty_a')===1 && posts.filter(post=>post.querySelector('[data-testid="User-Name"] a').pathname==='/empty_a').every(post=>!post.querySelector('.BetterX-author-links')),
          'Different posts by an author without links must share a successful empty cache');
        const empty=stored.get('betterx_author_links:empty_a');
        assert(empty?.links.length===0 && empty.expiresAt>Date.now() && empty.expiresAt<=Date.now()+60*60*1000,'Empty results must persist with a bounded expiry');
        await visit('cancel_a','632206');api.setSettingsPartial({authorLinksEnabled:false});await sleep(1100);
        assert(requests.get('cancel_a')===1 && requests.get('retry_manual')===2 && !document.querySelector('.BetterX-author-links'),
          'Turning the feature off must remove controls and cancel retry timers');
        return {automaticRetryRecovered:true,manualRetryRecovered:true,emptyProfileVisits:3,emptyProfileRequests:1,disabledRetryCancelled:true};
      }finally{
        api.setSettingsPartial({authorLinksEnabled:false});history.replaceState(null,'',previousUrl);
        window.fetch=originalFetch;window.GM_setValue=originalSet;posts.forEach(post=>post.remove());
      }
    });
  };
})();
