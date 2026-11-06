(async () => {
  const api = window.__test;
  const results = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = async (name, fn) => {
    try { results.push({ name, passed: true, ...(await fn()) }); }
    catch (error) { results.push({ name, passed: false, error: String(error.stack || error) }); }
  };
  const articleFor = (id, text) => {
    const article = document.createElement('article');
    article.innerHTML = `<div data-testid="User-Name"><a href="/author"><span>Author</span></a><a href="/author/status/${id}"><time>now</time></a></div><div data-testid="tweetText"></div>`;
    article.querySelector('[data-testid="tweetText"]').textContent = text;
    return article;
  };

  try {
    api.installStyles();
    api.createUI();
    api.state.settingsLoaded = true;
    await api.openDb();
    const first = { id: '123', text: 'post one', displayName: 'Author', username: '@author', note: 'saved note', firstCapturedAt: 1, lastCapturedAt: 1 };
    const second = { ...first, id: '124', text: 'post two', note: '' };
    await api.dbPutPost(first);
    await api.dbPutPost(second);
    api.state.posts = await api.dbGetAllPosts();
    api.rebuildPostIndex();
    api.togglePanel(true);

    await check('cross-tab refresh preserves the editor, focus, selection and draft', async () => {
      api.state.editingNoteId = '123';
      api.refreshUI({ keepScroll: true });
      const input = api.state.listEl.querySelector('.BetterX-note-input');
      input.value = '';
      input.focus();
      assert(document.execCommand('insertText', false, 'unsaved draft just typed'), 'Could not create an editable text history');
      input.setSelectionRange(3, 10, 'backward');
      api.scheduleCrossTabReload('post-changed', '124');
      await api.flushCrossTabReload();
      const current = api.state.listEl.querySelector('.BetterX-note-input');
      assert(current === input, 'The editing node was replaced');
      assert(current.value === 'unsaved draft just typed', 'The draft was overwritten');
      assert(document.activeElement === input, 'Keyboard focus was lost');
      assert(input.selectionStart === 3 && input.selectionEnd === 10, 'The text selection was lost');
      assert(input.selectionDirection === 'backward', 'The selection direction changed');
      assert(document.execCommand('undo') && input.value === '', 'Refresh erased the native undo history');
      assert(document.execCommand('redo') && input.value === 'unsaved draft just typed', 'Refresh erased the native redo history');
      await api.dbPutPost({ ...first, note: 'remote saved note' });
      api.scheduleCrossTabReload('post-changed', '123');
      await api.flushCrossTabReload();
      assert(input.value === 'unsaved draft just typed', 'A remote update to the same post erased the local draft');
      api.state.searchQuery = 'no_matching_post';
      api.refreshUI();
      api.state.searchQuery = '';
      api.refreshUI();
      assert(api.state.listEl.querySelector('.BetterX-note-input').value === 'unsaved draft just typed', 'Filtering out the editor erased its draft');
      api.dispatchPanelAction('cancel-note', null, null);
      assert(!api.state.noteDrafts.has('123'), 'Cancel retained an obsolete draft');
      assert(api.state.listEl.textContent.includes('remote saved note'), 'Cancel did not reveal the newer stored note');
      api.state.editingNoteId = '123';
      api.refreshUI();
      api.state.listEl.querySelector('.BetterX-note-input').value = 'new saved note';
      api.dispatchPanelAction('save-note', null, '123');
      await api.state.dbWriteQueue;
      assert((await api.dbGetAllPosts()).find(post => post.id === '123').note === 'new saved note', 'Saving the draft failed');
      assert(!api.state.noteDrafts.has('123'), 'Save retained an obsolete draft');
      return { sameEditorNode: true, draftAndSelectionPreserved: true };
    });
    api.togglePanel(false);

    await check('real DOM capture saves complete long text while scoring a bounded prefix', async () => {
      Object.assign(api.state.settings, { hideAds: false, hideAdultSpam: true });
      const article = articleFor('201', 'a'.repeat(10000));
      document.querySelector('main').append(article);
      const input = api.getAdultSpamInput(article);
      assert(input.text.length === 2500 && input.fullText.length === 10000, 'Scoring and capture text were not separated');
      api.captureArticle(article);
      await api.state.dbWriteQueue;
      assert((await api.dbGetAllPosts()).find(post => post.id === '201')?.text.length === 10000, 'IndexedDB did not retain the long post');
      article.remove();
      return { scoringCharacters: 2500, storedCharacters: 10000 };
    });

    await check('30 MB backup volumes round-trip through real IndexedDB', async () => {
      Object.assign(api.state.settings, { hideAdultSpam: false, theme: 'dark' });
      api.state.posts = Array.from({ length: 1000 }, (_, i) => ({ id: String(i + 1000), text: '文'.repeat(10000), note: 'memo', firstCapturedAt: i + 1, lastCapturedAt: i + 1 }));
      api.rebuildPostIndex();
      api.backupAll();
      const buttons = [...document.querySelectorAll('[data-backup-part]')];
      assert(buttons.length === 2, 'Large backup did not offer both volumes');
      assert(window.__downloads.length === 0, 'Volumes were generated before the user selected a download');
      buttons.forEach(button => button.click());
      assert(window.__downloads.length === 2, 'Volume download buttons did not produce both files');
      for (const file of window.__downloads) {
        assert(file.blob.size <= 25 * 1024 * 1024, 'A volume exceeds the importer limit');
        const payload = JSON.parse(await file.blob.text());
        assert(payload.backupPart.total === 2, 'Missing volume metadata');
        assert(payload.settings.firefoxCompatibility === undefined, 'Backup changed Firefox portability behavior');
      }
      assert(api.state.importInputEl.multiple, 'The file picker does not allow multiple volumes');
      api.closeBetterXDialog();
      const before = await api.dbGetAllPosts();
      await api.dbDeleteMany(before.map(post => post.id));
      api.state.posts = [];
      api.rebuildPostIndex();
      const promptsBefore = window.__confirmCount;
      const files = window.__downloads.map(file => file.blob);
      assert(await api.importPosts(files), 'The volume import failed');
      const restored = await api.dbGetAllPosts();
      assert(restored.length === 1000, 'Restored backup record count differs');
      assert(restored.every(post => post.text === '文'.repeat(10000) && post.note === 'memo'), 'Restored post content differs');
      assert(window.__confirmCount - promptsBefore === 1, 'Settings were confirmed repeatedly');
      return { parts: files.length, bytes: files.reduce((sum, file) => sum + file.size, 0), restoredRecords: restored.length };
    });

    await check('continuous mutations are captured before a transient post leaves the DOM', async () => {
      Object.assign(api.state.settings, { mediaDownload: false, hideAds: false, hideNfl: false, hideAdultSpam: false, restoreMediaGrid: false, bypassAgeRestriction: false, autoExpandPostText: false, layoutEnabled: false });
      let captures = 0;
      let transientCaptures = 0;
      api.watchCapture(article => { captures++; if (article.dataset.transient) transientCaptures++; });
      const busy = document.createElement('article');
      document.querySelector('main').append(busy);
      api.startObserver();
      const updates = setInterval(() => { const node = document.createElement('span'); node.textContent = 'update'; busy.append(node); }, 40);
      const transient = articleFor('999999', 'transient post');
      transient.dataset.transient = 'true';
      setTimeout(() => document.querySelector('main').append(transient), 80);
      setTimeout(() => transient.remove(), 450);
      await sleep(650);
      clearInterval(updates);
      const duringUpdates = captures;
      await sleep(180);
      api.state.observer.disconnect();
      api.state.observerCleanup();
      api.state.viewObserver?.disconnect();
      await api.state.dbWriteQueue;
      assert(duringUpdates > 0, 'Continuous updates starved capture');
      assert(transientCaptures > 0, 'The transient article was never captured');
      assert((await api.dbGetAllPosts()).some(post => post.id === '999999'), 'The transient post was not persisted');
      busy.remove();
      return { capturesDuringUpdates: duringUpdates, transientCaptures };
    });

    await check('unsafe nested expressions are rejected before browser matching', async () => {
      const expressions = ['((a+))+$', '(?:(?:a+))+$', '((a|aa))+$', 'a*(?:a*)b', 'a*A*A*b'];
      for (const pattern of expressions) {
        assert(!api.isSafeRegexSource(pattern), `Accepted unsafe pattern ${pattern}`);
        assert(!api.keywordRuleMatches(`/${pattern}/`, 'a'.repeat(32) + '!', ''), 'Unsafe keyword reached the regex matcher');
      }
      assert(api.keywordRuleMatches('/cat|dog/', 'a cat', 'a cat'), 'A normal expression no longer works');
      return { rejectedPatterns: expressions.length };
    });

    await check('hidden views defer work and become current when selected', async () => {
      api.state.posts = Array.from({ length: 5000 }, (_, index) => ({
        id: String(80000 + index), text: `post ${index}`,
        firstCapturedAt: 5000 - index, lastCapturedAt: 5000 - index,
      }));
      api.rebuildPostIndex();
      api.togglePanel(true);
      const work = { cards: 0, filters: 0, settings: 0 };
      api.watchViewWork(kind => work[kind]++);
      api.setPanelView('settings');
      assert(work.cards === 0 && work.filters === 0, 'Entering settings rendered hidden posts');
      const hiddenPosts = api.state.listEl.innerHTML;
      api.state.posts[0] = { ...api.state.posts[0], text: 'updated while hidden' };
      api.refreshUI();
      assert(work.cards === 0 && work.filters === 0, 'Settings refresh filtered or rendered hidden posts');
      assert(api.state.listEl.innerHTML === hiddenPosts, 'The hidden posts DOM was rewritten');
      const hiddenNotifications = api.state.notificationListEl.innerHTML;
      api.notificationSubscriptions.set('fresh_account', { id: '901', username: 'fresh_account', displayName: 'Fresh notification', enabled: true });
      api.renderNotificationSubscriptions();
      assert(api.state.notificationListEl.innerHTML === hiddenNotifications, 'Background notification update rendered its hidden list');
      api.setPanelView('notifications');
      assert(api.state.notificationListEl.textContent.includes('Fresh notification'), 'Entering notifications did not render the latest data');
      assert(work.cards === 0 && work.filters === 0, 'Notifications rendered hidden posts');
      const themeBefore = api.state.themeSelectEl.value;
      api.state.settings.theme = 'light';
      api.refreshUI();
      assert(api.state.themeSelectEl.value === themeBefore, 'Notifications refreshed hidden settings');
      api.setPanelView('vault');
      assert(api.state.listEl.textContent.includes('updated while hidden'), 'Returning to posts displayed stale data');
      const visibleCards = work.cards;
      assert(visibleCards > 0 && work.filters === 1, 'The visible posts page was not rendered once');
      api.setPanelView('settings');
      assert(work.cards === visibleCards && work.filters === 1, 'Returning to settings regenerated hidden posts');
      assert(api.state.themeSelectEl.value === 'light', 'Returning to settings did not sync the current control values');
      const before = { ...work };
      api.applySettingsSnapshot({ ...api.state.settings });
      assert(JSON.stringify(work) === JSON.stringify(before), 'An unchanged snapshot regenerated the visible page');
      api.togglePanel(false);
      api.refreshUI();
      assert(JSON.stringify(work) === JSON.stringify(before), 'A closed panel generated page content');
      return { records: 5000, hiddenPostRenders: 0, hiddenFilterPasses: 0, cardsOnEnteringPosts: visibleCards };
    });
    await check('adult-spam filtering preserves benign DOM posts and respects contextual and custom rules', async () => {
      api.state.posts = await api.dbGetAllPosts();
      api.rebuildPostIndex();
      api.setSettingsPartial({maxPosts:5000,hideAdultSpam:true,adultSpamSkipFollowing:false,
        adultSpamCustomRulesEnabled:true,adultSpamKeywords:[],adultSpamWhitelist:[]});
      const texts = ['hosts','central','events','do not stop until','从原定的 9-10 月推迟到 11 月 19 日。',
        '9.1x','9-1x','Python 3.9.1','项目主页更新了','妈妈做了晚饭',
        '成人英语课程，免费领取资料，项目主页有资源','TS NTR 91 69 免费领取，主页有资源 👉 @helper 🔞💦'];
      const articles = texts.map((text,index) => {
        const article = articleFor(String(300000 + index),text);
        const media = document.createElement('div');
        media.dataset.testid = 'tweetPhoto';
        const link = document.createElement('a');
        link.href = 'https://example.invalid/guide';
        link.textContent = 'guide';
        article.append(media,link);
        document.querySelector('main').append(article);
        return article;
      });
      const positive = articleFor('399999','成人视频资源，私信领取');
      document.querySelector('main').append(positive);
      for (const mode of ['balanced','conservative']) {
        api.setSettingsPartial({adultSpamLevel:mode});
        for (const article of articles) {
          api.captureArticle(article);
          assert(!article.classList.contains('BetterX-adult-spam-hidden'), `${mode}: benign post was hidden: ${article.textContent}`);
        }
        api.captureArticle(positive);
        assert(positive.classList.contains('BetterX-adult-spam-hidden'), `${mode}: explicit adult promotion was not hidden`);
      }
      await api.state.dbWriteQueue;
      const stored = await api.dbGetAllPosts();
      assert(texts.every((_text,index) => stored.some(post => post.id === String(300000 + index))), 'Benign posts were excluded from capture');
      assert(!stored.some(post => post.id === '399999'), 'Filtered adult promotion was captured');
      api.setSettingsPartial({adultSpamKeywords:['hosts']});
      assert(articles[0].classList.contains('BetterX-adult-spam-hidden'), 'Explicit user block did not take effect');
      api.setSettingsPartial({adultSpamWhitelist:['author']});
      assert(!articles[0].classList.contains('BetterX-adult-spam-hidden'), 'Allowlist did not override the user block');
      assert(!positive.classList.contains('BetterX-adult-spam-hidden'), 'Allowlist did not restore the adult post');
      api.setSettingsPartial({adultSpamWhitelist:[],adultSpamCustomRulesEnabled:false});
      assert(!articles[0].classList.contains('BetterX-adult-spam-hidden'), 'Disabling custom rules did not restore the benign post');
      assert(positive.classList.contains('BetterX-adult-spam-hidden'), 'Disabling custom rules unexpectedly disabled the built-in filter');
      api.setSettingsPartial({hideAdultSpam:false,adultSpamKeywords:[]});
      assert(!positive.classList.contains('BetterX-adult-spam-hidden'), 'Disabling the built-in filter did not restore its hidden post');
      await api.state.dbWriteQueue;
      for (const article of [...articles,positive]) article.remove();
      return {benignPosts:texts.length,modes:2,benignCaptured:true,adultPromotionFiltered:true,userOverridesVerified:true};
    });
    await check('desktop icon position survives viewport changes and cancelled drags', async () => {
      const frame = document.createElement('iframe');
      frame.style.cssText = 'width:900px;height:600px;border:0';
      frame.srcdoc = '<!doctype html><html lang="zh-CN"><script>window.GM_getValue=(_key,fallback)=>fallback;</script><script src="/userscript.js"></script><body></body></html>';
      document.body.append(frame);
      let local;
      try {
        await new Promise(resolve => frame.addEventListener('load', resolve, {once:true}));
        const win = frame.contentWindow;
        local = win.__test;
        local.installStyles();
        local.createUI();
        local.setSettingsPartial({useMobileBadgeOnDesktop:true,badgePos:{left:800,bottom:80}});
        const badge = local.state.badgeEl;
        const emit = (type, dx=0, dy=0, pointerId=1) => badge.dispatchEvent(new win.PointerEvent(type, {
          bubbles:true, pointerId, button:0, isPrimary:true, clientX:830+dx, clientY:490+dy,
        }));
        emit('pointerdown'); emit('pointermove',10,-20); emit('pointerup',10,-20);
        await local.state.dbWriteQueue;
        const saved = (await local.dbGetSetting('settings')).badgePos;
        assert(Number.isFinite(saved.right), 'The saved edge was lost during IndexedDB persistence');
        const initial = badge.getBoundingClientRect();
        const right = win.innerWidth - initial.right;
        assert(Math.abs(initial.left-810)<1, 'Desktop drag did not reach the intended location');
        frame.style.width = '1600px';
        await sleep(50);
        local.repositionBadge();
        assert(Math.abs(win.innerWidth-badge.getBoundingClientRect().right-right)<1,
          'Widening the desktop viewport moved the icon away from its saved right edge');
        local.setSettingsPartial({useMobileBadgeOnDesktop:false});
        assert(Math.abs(win.innerWidth-badge.getBoundingClientRect().right-right)<1,
          'Switching to a text badge measured the old icon content');
        local.setSettingsPartial({useMobileBadgeOnDesktop:true});
        frame.style.width = '390px'; await sleep(50); local.repositionBadge();
        assert(local.state.rootEl.classList.contains('BetterX-mobile'), 'The mobile breakpoint was not entered');
        frame.style.width = '1600px'; await sleep(50); local.repositionBadge();
        assert(Math.abs(win.innerWidth-badge.getBoundingClientRect().right-right)<1,
          'A temporary mobile viewport overwrote the desktop location');
        // Simulate a reload by applying only the persisted position to a new UI.
        local.state.rootEl.remove(); local.createUI();
        local.setSettingsPartial({badgePos:saved});
        assert(Math.abs(win.innerWidth-local.state.badgeEl.getBoundingClientRect().right-right)<1,
          'Reloading at a different viewport width lost the saved edge');
        const currentBadge = local.state.badgeEl;
        const point = currentBadge.getBoundingClientRect();
        for (const [type, dx] of [['pointerdown',0],['pointermove',-150],['pointercancel',-150]]) {
          currentBadge.dispatchEvent(new win.PointerEvent(type, {bubbles:true,pointerId:2,button:0,isPrimary:true,clientX:point.left+20+dx,clientY:point.top+20}));
        }
        assert(JSON.stringify(local.state.settings.badgePos)===JSON.stringify(saved), 'A cancelled drag overwrote the saved position');
        assert(Math.abs(currentBadge.getBoundingClientRect().left-point.left)<1, 'A cancelled drag did not restore the saved position');
        const pointer = (type, id, button, x) => currentBadge.dispatchEvent(new win.PointerEvent(type, {
          bubbles:true,pointerId:id,button,isPrimary:true,clientX:x,clientY:point.top+20,
        }));
        pointer('pointerdown',3,2,point.left+20); pointer('pointermove',3,2,point.left-100); pointer('pointerup',3,2,point.left-100);
        assert(JSON.stringify(local.state.settings.badgePos)===JSON.stringify(saved), 'The secondary mouse button moved the icon');
        pointer('pointerdown',4,0,point.left+20); pointer('pointermove',5,0,point.left-100); pointer('pointerup',5,0,point.left-100);
        assert(Math.abs(currentBadge.getBoundingClientRect().left-point.left)<1, 'Another pointer moved the active drag');
        pointer('pointercancel',4,0,point.left+20);
        local.setSettingsPartial({badgePos:{left:20,bottom:80,right:1516}});
        frame.style.width='900px'; await sleep(50); local.repositionBadge();
        assert(Math.abs(currentBadge.getBoundingClientRect().left-20)<1, 'The saved left edge was not preserved');
        local.setSettingsPartial({badgePos:{left:810,bottom:100,right:26}});
        frame.style.width='680px'; await sleep(50); local.repositionBadge();
        assert(Math.abs(win.innerWidth-currentBadge.getBoundingClientRect().right-26)<1, 'A narrow desktop viewport lost the right edge');
        frame.style.width='390px'; await sleep(50);
        local.setSettingsPartial({useMobileBadgeHandle:true,mobileBadgeHandleTop:150});
        const touch = (type, id, y) => currentBadge.dispatchEvent(new win.PointerEvent(type, {
          bubbles:true,pointerId:id,button:0,isPrimary:true,pointerType:'touch',clientX:385,clientY:y,
        }));
        touch('pointerdown',6,180); await sleep(480); touch('pointermove',6,330); touch('pointercancel',6,330);
        assert(local.state.settings.mobileBadgeHandleTop===150 && local.state.rootEl.style.top==='150px',
          'Cancelling a mobile handle drag did not retain the saved position');
        touch('pointerdown',7,180); await sleep(480); touch('pointermove',7,330); touch('pointerup',7,330);
        assert(local.state.settings.mobileBadgeHandleTop>150, 'A completed mobile handle drag was not saved');
        assert(local.state.settings.badgePos.right===26, 'Dragging the mobile handle overwrote the desktop position');
        return {savedRight:right,viewportWidths:[900,1600,390,1600,900,680,390],indexedDbAndCancelVerified:true,mobileHandleVerified:true};
      } finally {
        if (local) { await local.state.dbWriteQueue; (await local.openDb()).close(); }
        frame.remove();
      }
    });

    await check('quiet downloads hide only the badge task indicator and restore it immediately', async () => {
      api.setSettingsPartial({silentDownload:false});
      const job = {id:'quiet-download',status:'downloading',baseName:'sample',createdAt:1,updatedAt:1,
        itemProgress:[{loaded:25,total:100,totalKnown:true}],items:[{}]};
      api.downloadJobs.set(job.id,job);
      const controls = document.createElement('div');
      controls.className = 'BetterX-download-controls'; controls.dataset.statusId = job.id;
      controls.innerHTML = '<button class="BetterX-dl-btn"></button><button class="BetterX-dl-cancel"></button>';
      document.querySelector('main').append(controls);
      const visible = element => !element.hidden && getComputedStyle(element).display !== 'none';
      try {
        api.refreshDownloadUi();
        assert(visible(api.state.downloadPillEl), 'The default download indicator was hidden');
        api.toggleDownloadPopover(true);
        assert(visible(api.state.downloadPopoverEl), 'The task popover did not open');
        api.setPanelView('settings'); api.togglePanel(true);
        const toggle = document.querySelector('#BetterX-silent-download');
        assert(toggle && !toggle.checked, 'The quiet toggle is missing or enabled by default');
        toggle.checked = true; toggle.dispatchEvent(new Event('change',{bubbles:true}));
        await api.state.dbWriteQueue; await sleep(40);
        assert(api.state.settings.silentDownload===true, 'The quiet toggle did not update settings');
        assert((await api.dbGetSetting('settings')).silentDownload===true, 'Quiet mode was not saved in IndexedDB');
        assert(!visible(api.state.downloadPillEl) && !visible(api.state.downloadPopoverEl), 'Quiet mode left badge task UI visible');
        api.toggleDownloadPopover(true);
        assert(!visible(api.state.downloadPopoverEl), 'The task popover could reopen while quiet');
        assert(!controls.querySelector('.BetterX-dl-cancel').hidden, 'Quiet mode removed the post cancel control');
        job.itemProgress[0].loaded=75; api.refreshDownloadUi();
        assert(controls.querySelector('.BetterX-dl-btn').textContent==='75%', 'Post download progress stopped updating');
        assert(api.downloadJobs.get(job.id)===job && job.status==='downloading', 'Quiet mode changed the active job');
        toggle.checked=false; toggle.dispatchEvent(new Event('change',{bubbles:true})); await sleep(40);
        assert(visible(api.state.downloadPillEl), 'Turning quiet mode off did not restore the current task');
        assert(api.state.downloadPillEl.textContent.includes('75%'), 'The restored indicator has stale progress');
        assert(!visible(api.state.downloadPopoverEl), 'Turning quiet mode off reopened the old popover');
        api.applySettingsSnapshot({...api.state.settings,silentDownload:true}); await sleep(40);
        assert(!visible(api.state.downloadPillEl), 'Restored settings did not hide the indicator');
        api.applySettingsSnapshot({...api.state.settings,silentDownload:false}); await sleep(40);
        assert(visible(api.state.downloadPillEl), 'Restored settings did not show the indicator');
        job.status='done'; api.refreshDownloadUi();
        api.setSettingsPartial({silentDownload:true}); await sleep(40);
        assert(!visible(api.state.downloadPillEl), 'Quiet mode showed the completed task');
        api.state.rootEl.classList.add('BetterX-mobile'); api.refreshDownloadUi();
        assert(!visible(api.state.downloadPillEl), 'Quiet mode left the mobile task indicator visible');
        api.setSettingsPartial({silentDownload:false}); api.togglePanel(false); await sleep(40);
        assert(visible(api.state.downloadPillEl), 'The mobile indicator did not return when quiet mode was disabled');
        return {defaultEnabled:false,inFlightToggle:true,postProgressAndCancelPreserved:true,restoredSettingsVerified:true};
      } finally {
        api.downloadJobs.delete(job.id); controls.remove();
        api.state.rootEl.classList.remove('BetterX-mobile');
        api.setSettingsPartial({silentDownload:false}); api.togglePanel(false); api.refreshDownloadUi();
      }
    });
    await window.__runDownloadSelectionTests(api, check);

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
  } catch (error) {
    results.push({ name: 'browser setup', passed: false, error: String(error.stack || error) });
  }
  window.__browserResults = results;
  document.querySelector('#results').textContent = JSON.stringify(results, null, 2);
})();
