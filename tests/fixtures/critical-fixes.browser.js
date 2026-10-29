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
  } catch (error) {
    results.push({ name: 'browser setup', passed: false, error: String(error.stack || error) });
  }
  window.__browserResults = results;
  document.querySelector('#results').textContent = JSON.stringify(results, null, 2);
})();
