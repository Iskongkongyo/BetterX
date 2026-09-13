  // ── IndexedDB ─────────────────────────────────────────────────────
  function queueDbWrite(task) {
    state.dbWriteQueue = state.dbWriteQueue
      .then(() => task())
      .catch((err) => console.error('[BetterX] IndexedDB write failed:', err));
    return state.dbWriteQueue;
  }

  function openDb() {
    if (state.dbPromise) return state.dbPromise;
    state.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(POSTS_STORE)) {
          const postsStore = db.createObjectStore(POSTS_STORE, { keyPath: 'id' });
          postsStore.createIndex('lastCapturedAt', 'lastCapturedAt', { unique: false });
          postsStore.createIndex('favorite', 'favorite', { unique: false });
          postsStore.createIndex('clicked', 'clicked', { unique: false });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return state.dbPromise;
  }

  async function dbGetAllPosts() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(POSTS_STORE, 'readonly');
      const request = tx.objectStore(POSTS_STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async function dbPutPost(post) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(POSTS_STORE, 'readwrite');
      tx.objectStore(POSTS_STORE).put(post);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function dbPutPosts(posts) {
    if (!posts || !posts.length) return;
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(POSTS_STORE, 'readwrite');
      const store = tx.objectStore(POSTS_STORE);
      for (const post of posts) store.put(post);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function dbDeletePost(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(POSTS_STORE, 'readwrite');
      tx.objectStore(POSTS_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function dbDeleteMany(ids) {
    if (!ids || !ids.length) return;
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(POSTS_STORE, 'readwrite');
      const store = tx.objectStore(POSTS_STORE);
      for (const id of ids) store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function dbGetSetting(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, 'readonly');
      const request = tx.objectStore(SETTINGS_STORE).get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  async function dbPutSetting(key, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, 'readwrite');
      tx.objectStore(SETTINGS_STORE).put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  // ── 数据操作 ─────────────────────────────────────────────────────
  function getPostIndexById(id) { return state.posts.findIndex((p) => p.id === id); }
  function getPostById(id) { return state.posts.find((p) => p.id === id); }
  function protectedPost(p) { return !!(p.favorite || p.pinned); }

  function prunePostRuntimeCaches(ids) {
    for (const rawId of ids || []) {
      const id = String(rawId);
      matchCache.delete(id);
      state.visibleMap.delete(id);
      state.expandedPosts.delete(id);
      mediaRegistry.delete(id);
      cardRegistry.delete(id);
    }
  }

  let postLimitWarningShownForMax = 0;
  let postLimitWarningTimer = null;
  let postLimitWarningReady = false;

  function getPostLimitWarningThreshold(maxPosts) {
    const maximum = clampInt(maxPosts, 50, 5000, DEFAULT_SETTINGS.maxPosts);
    return Math.max(1, Math.ceil(maximum * 0.9));
  }

  function formatPostLimitWarningCount(count, maximum) {
    if (UI_LANGUAGE === 'zh-TW') return `目前已記錄 ${count} 筆貼文；設定的「最大筆數」為 ${maximum} 筆。`;
    if (UI_LANGUAGE === 'ja') return `現在 ${count} 件を記録しています。設定された上限は ${maximum} 件です。`;
    if (UI_LANGUAGE === 'en') return `Currently recorded: ${count} posts; the configured maximum is ${maximum}.`;
    return `当前已记录 ${count} 条帖子，设置的“最大条数”为 ${maximum} 条。`;
  }

  function openAdvancedSettingsFromPostLimitWarning() {
    togglePanel(true);
    setPanelView('settings');
    setTimeout(() => {
      const advanced = state.panelEl && state.panelEl.querySelector('#BetterX-advanced-settings');
      if (!advanced) return;
      advanced.open = true;
      try { advanced.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (err) {}
      if (state.maxPostsInputEl) {
        try { state.maxPostsInputEl.focus({ preventScroll: true }); } catch (err) { state.maxPostsInputEl.focus(); }
        state.maxPostsInputEl.select();
      }
    }, 0);
  }

  function maybeShowPostLimitWarning() {
    if (!postLimitWarningReady || !state.settingsLoaded || state.settings.postLimitWarningDisabled || !state.rootEl) return false;
    const maximum = clampInt(state.settings.maxPosts, 50, 5000, DEFAULT_SETTINGS.maxPosts);
    const threshold = getPostLimitWarningThreshold(maximum);
    const count = state.posts.length;
    if (count < threshold) {
      if (postLimitWarningShownForMax === maximum) postLimitWarningShownForMax = 0;
      return false;
    }
    if (postLimitWarningShownForMax === maximum) return false;
    // 不覆盖语言选择、Firefox 兼容询问等正在显示的对话框，稍后再提醒。
    if (document.getElementById('BetterX-choice-dialog')) {
      if (!postLimitWarningTimer) {
        postLimitWarningTimer = setTimeout(() => {
          postLimitWarningTimer = null;
          maybeShowPostLimitWarning();
        }, 1200);
      }
      return false;
    }
    postLimitWarningShownForMax = maximum;
    showBetterXDialog({
      title: '帖子记录即将达到上限',
      bodyHtml: `
        <p>${escapeHtml(formatPostLimitWarningCount(count, maximum))}</p>
        <p>${escapeHtml(uiText('达到上限后，新帖子仍会继续记录；最旧的未收藏、未置顶帖子会被删除。收藏和置顶帖子不会被上限删除，因此总数有时可能超过设置值。'))}</p>
        <p>${escapeHtml(uiText('你可以打开“高级设置”调大“最大条数”，或先导出备份。'))}</p>
      `,
      primaryText: '打开高级设置',
      secondaryText: '导出备份',
      tertiaryText: '不再提示',
      showCloseIcon: true,
      onPrimary: openAdvancedSettingsFromPostLimitWarning,
      onSecondary: backupAll,
      onTertiary: () => setSettingsPartial({ postLimitWarningDisabled: true }),
    });
    return true;
  }

  // 超出上限时修剪，但永不删除收藏 / 置顶的帖子。
  function trimPostsToMax() {
    const max = state.settings.maxPosts || 500;
    const kept = state.posts.filter(protectedPost);
    const others = state.posts
      .filter((p) => !protectedPost(p))
      .sort((a, b) => (b.lastCapturedAt || 0) - (a.lastCapturedAt || 0));
    const allowOthers = Math.max(0, max - kept.length);
    if (others.length <= allowOthers) return [];
    const toDelete = others.slice(allowOthers);
    const keepOthers = others.slice(0, allowOthers);
    state.posts = [...kept, ...keepOthers];
    const ids = toDelete.map((p) => p.id);
    prunePostRuntimeCaches(ids);
    return ids;
  }

  async function enforceMaxPosts() {
    const ids = trimPostsToMax();
    if (!ids.length) return;
    await dbDeleteMany(ids);
  }

  // ── 统计 / 筛选栏 ───────────────────────────────────────────────
  function refreshBadge() {
    if (!state.badgeEl) return;
    const totalCount = state.posts.length;
    let flashCount = 0, unreadCount = 0;
    for (const p of state.posts) {
      if (!p.clicked) unreadCount++;
      if (p.flashLost && !p.clicked) flashCount++;
    }
    if (state.badgeEl.classList.contains('mobile-mode')) {
      const iconHtml = APP_ICON_URL
        ? `<img class="BetterX-mobile-icon" src="${escapeHtml(APP_ICON_URL)}" alt="" draggable="false" />`
        : '<span class="BetterX-mobile-icon-fallback">🧰</span>';
      state.badgeEl.innerHTML = `${iconHtml}<span class="BetterX-mobile-dot" style="display:${unreadCount > 0 ? 'block' : 'none'}">${unreadCount}</span>`;
    } else {
      state.badgeEl.textContent = uiText(`总数 ${totalCount} · 未读${unreadCount}${flashCount ? ` · ⚡${flashCount}` : ''}`);
    }
  }

  function buildSummaryHtml() {
    const total = state.posts.length;
    let unread = 0, opened = 0, favorite = 0, flash = 0, keywordHits = 0, pinned = 0;
    for (const p of state.posts) {
      if (!p.clicked) unread++; else opened++;
      if (p.favorite) favorite++;
      if (p.pinned) pinned++;
      if (p.flashLost && !p.clicked) flash++;
      if (computeMatchedKeywords(p).length > 0) keywordHits++;
    }
    return uiHtml`
      <div class="BetterX-stat">总数 <b>${total}</b></div>
      <div class="BetterX-stat">未打开 <b>${unread}</b></div>
      <div class="BetterX-stat">已打开 <b>${opened}</b></div>
      <div class="BetterX-stat">已收藏 <b>${favorite}</b></div>
      <div class="BetterX-stat">已置顶 <b>${pinned}</b></div>
      <div class="BetterX-stat">快速消失 <b>${flash}</b></div>
      <div class="BetterX-stat">命中关键词 <b>${keywordHits}</b></div>
    `;
  }

  function buildFilterHtml() {
    return FILTERS.map((f) => {
      const active = state.settings.filter === f.key ? 'active' : '';
      return `<button class="BetterX-chip ${active}" data-action="set-filter" data-filter="${escapeHtml(f.key)}">${escapeHtml(uiText(f.label))}</button>`;
    }).join('');
  }

  function getAvailableSources() {
    return uniqueStrings(state.posts.map((p) => p.sourceLabel).filter(Boolean))
      .sort((a, b) => {
        const rank = (source) => SOURCE_SORT_RANK.get(source)
          ?? (/^Profile\s+@/i.test(source) ? 100 : 10);
        const rankDiff = rank(a) - rank(b);
        return rankDiff || localizeSourceLabel(a).localeCompare(localizeSourceLabel(b), UI_LANGUAGE);
      });
  }

  function localizeSourceLabel(source) {
    const raw = String(source || '').trim();
    if (SOURCE_EXACT_LABELS[raw]) return SOURCE_EXACT_LABELS[raw];
    if (/^Thread\s+@/i.test(raw)) return raw.replace(/^Thread\s+/i, '帖子详情 ');
    if (/^Profile\s+@/i.test(raw)) return raw.replace(/^Profile\s+/i, '个人主页 ');
    return raw;
  }

  function buildSourceOptionsHtml() {
    const selected = state.settings.sourceFilter || 'all';
    const options = ['all', ...getAvailableSources()];
    return options.map((source) => {
      const label = source === 'all' ? '全部来源' : localizeSourceLabel(source);
      const isSelected = selected === source ? 'selected' : '';
      return `<option value="${escapeHtml(source)}" ${isSelected}>${escapeHtml(uiText(label))}</option>`;
    }).join('');
  }

  function buildMediaOptionsHtml() {
    const selected = state.settings.mediaFilter || 'all';
    return MEDIA_FILTERS.map((f) => {
      const isSelected = selected === f.key ? 'selected' : '';
      return `<option value="${escapeHtml(f.key)}" ${isSelected}>${escapeHtml(uiText(f.label))}</option>`;
    }).join('');
  }

  function buildQuickFilterStateText() {
    const filterKey = state.settings.filter || DEFAULT_SETTINGS.filter;
    const filterLabel = FILTERS.find((item) => item.key === filterKey)?.label || '全部';
    const source = state.settings.sourceFilter || 'all';
    const sourceLabel = source === 'all' ? '全部来源' : (localizeSourceLabel(source) || '全部来源');
    const mediaKey = state.settings.mediaFilter || DEFAULT_SETTINGS.mediaFilter;
    const mediaLabel = MEDIA_FILTERS.find((item) => item.key === mediaKey)?.label || '全部媒体';
    const sortKey = state.settings.sortBy || DEFAULT_SETTINGS.sortBy;
    const sortLabel = SORT_LABELS[sortKey] || SORT_LABELS.smart;
    return `(当前选择：${filterLabel} · ${sourceLabel} · ${mediaLabel} · ${sortLabel})`;
  }

  function updateQuickFilterHeader() {
    if (state.quickFilterDetailsEl) {
      const shouldOpen = !!state.settings.quickFilterOpen;
      if (state.quickFilterDetailsEl.open !== shouldOpen) state.quickFilterDetailsEl.open = shouldOpen;
    }
    if (state.quickFilterStateEl) {
      const text = buildQuickFilterStateText();
      state.quickFilterStateEl.textContent = uiText(text);
      state.quickFilterStateEl.title = uiText(text);
    }
  }

  function buildSkipSourcesHtml() {
    const skip = state.settings.skipSources || [];
    return SKIP_SOURCE_OPTIONS.map((o) => {
      const active = skip.includes(o.key) ? 'active' : '';
      return `<button class="BetterX-chip ${active}" data-action="toggle-skip" data-skip="${escapeHtml(o.key)}">${escapeHtml(uiText(o.label))}</button>`;
    }).join('');
  }

  function updateSortHint() {
    if (!state.sortHintEl) return;
    const sortBy = state.settings.sortBy || DEFAULT_SETTINGS.sortBy;
    state.sortHintEl.textContent = uiText(SORT_HINTS[sortBy] || SORT_HINTS.smart);
  }

  function passesMediaFilter(p) {
    switch (state.settings.mediaFilter) {
      case 'image': return !!p.hasImage;
      case 'video': return !!p.hasVideo;
      case 'text':  return !p.hasImage && !p.hasVideo;
      default: return true;
    }
  }

  function filterPosts(posts) {
    let result = [...posts];
    switch (state.settings.filter) {
      case 'unread':   result = result.filter((p) => !p.clicked); break;
      case 'flash':    result = result.filter((p) => p.flashLost && !p.clicked); break;
      case 'favorite': result = result.filter((p) => p.favorite); break;
      case 'pinned':   result = result.filter((p) => p.pinned); break;
      case 'opened':   result = result.filter((p) => p.clicked); break;
      case 'keyword':  result = result.filter((p) => computeMatchedKeywords(p).length > 0); break;
      default: break;
    }
    if (state.settings.sourceFilter && state.settings.sourceFilter !== 'all') {
      result = result.filter((p) => p.sourceLabel === state.settings.sourceFilter);
    }
    result = result.filter(passesMediaFilter);
    if ((state.settings.excludeKeywords || []).length) {
      result = result.filter((p) => !matchesExclude(p));
    }
    const q = (state.searchQuery || '').trim().toLowerCase();
    if (q) {
      result = result.filter((p) =>
        (p.displayName || '').toLowerCase().includes(q) ||
        (p.username    || '').toLowerCase().includes(q) ||
        (p.text        || '').toLowerCase().includes(q) ||
        (p.note        || '').toLowerCase().includes(q)
      );
    }
    const sortBy = state.settings.sortBy || 'smart';
    result.sort((a, b) => {
      // 以下三种时间排序刻意不让置顶、收藏或闪现记录插队，便于按顺序找回刚浏览的帖子。
      if (sortBy === 'recent_viewed') {
        return (b.lastViewedAt || b.lastCapturedAt || 0) - (a.lastViewedAt || a.lastCapturedAt || 0);
      }
      if (sortBy === 'recent_captured') return (b.lastCapturedAt || 0) - (a.lastCapturedAt || 0);
      if (sortBy === 'first_captured') return (b.firstCapturedAt || b.lastCapturedAt || 0) - (a.firstCapturedAt || a.lastCapturedAt || 0);
      if (sortBy === 'time_asc') return (a.firstCapturedAt || a.lastCapturedAt || 0) - (b.firstCapturedAt || b.lastCapturedAt || 0);
      const pinDiff = Number(!!b.pinned) - Number(!!a.pinned);
      if (pinDiff !== 0) return pinDiff;
      if (sortBy === 'captures')  return (b.capturedCount || 1) - (a.capturedCount || 1);
      if (sortBy === 'author')    return (a.displayName || '').localeCompare(b.displayName || '');
      if (sortBy === 'source')    return (a.sourceLabel || '').localeCompare(b.sourceLabel || '');
      const favDiff = Number(!!b.favorite) - Number(!!a.favorite);
      if (favDiff !== 0) return favDiff;
      const flashDiff = Number(!!b.flashLost) - Number(!!a.flashLost);
      if (flashDiff !== 0) return flashDiff;
      return (b.lastCapturedAt || 0) - (a.lastCapturedAt || 0);
    });
    return result;
  }

  // ── 渲染 ─────────────────────────────────────────────────────────
  function renderKeywordTags(matchedKeywords) {
    if (!matchedKeywords.length) return '';
    return matchedKeywords.map((kw) => `<span class="BetterX-tag keyword">${escapeHtml(kw)}</span>`).join('');
  }

  function renderMetaTags(post) {
    const tags = [];
    if (post.pinned) tags.push(uiHtml`<span class="BetterX-tag pin">📌 置顶</span>`);
    if (post.favorite) tags.push(uiHtml`<span class="BetterX-tag fav">★ 已收藏</span>`);
    if (post.flashLost && !post.clicked) tags.push(uiHtml`<span class="BetterX-tag flash">⚡ 快速消失</span>`);
    if (post.clicked) tags.push(uiHtml`<span class="BetterX-tag opened">👁 已打开</span>`);
    if (post.hasImage) tags.push(uiHtml`<span class="BetterX-tag">🖼 图片</span>`);
    if (post.hasVideo) tags.push(uiHtml`<span class="BetterX-tag">🎬 视频</span>`);
    if (post.sourceLabel) tags.push(uiHtml`<span class="BetterX-tag source">来源: ${escapeHtml(uiText(localizeSourceLabel(post.sourceLabel)))}</span>`);
    return tags.join('');
  }

  function renderThumbs(post) {
    const thumbs = uniqueStrings((post.mediaThumbs || []).map(safeImportedAssetUrl).filter(Boolean)).slice(0, 4);
    if (!thumbs.length) return '';
    return `<div class="BetterX-thumbs">${thumbs.map((src, index) =>
      uiHtml`<button type="button" class="BetterX-thumb-button" data-action="preview-image" data-post-id="${escapeHtml(post.id)}" data-image-index="${index}" data-image-url="${escapeHtml(src)}" aria-label="放大查看第 ${index + 1} 张图片">
        <img class="BetterX-thumb" src="${escapeHtml(src)}" loading="lazy" referrerpolicy="no-referrer" alt="" />
      </button>`
    ).join('')}</div>`;
  }

  function renderPostItem(post) {
    const matchedKeywords = computeMatchedKeywords(post);
    const authorInfo = cleanAuthorInfo(post.displayName, post.username, post.timeLabel);
    const displayName = authorInfo.displayName;
    const username = authorInfo.username;
    const timeLabel = authorInfo.timeLabel || post.timeLabel || '';
    const handle = username.replace(/^@/, '');
    const profileUrl = /^[A-Za-z0-9_]{1,15}$/.test(handle) ? `https://x.com/${handle}` : '';

    const displayNameHtml = highlightText(displayName, matchedKeywords);
    const showHandle = username &&
      username.toLowerCase() !== displayName.toLowerCase() &&
      handle.toLowerCase() !== displayName.toLowerCase();
    const handleHtml = showHandle
      ? `<span class="BetterX-author-handle">${highlightText(username, matchedKeywords)}</span>`
      : '';

    const authorLabelHtml = `${displayNameHtml}${handleHtml ? ' ' + handleHtml : ''}`;
    const authorHtml = profileUrl
      ? uiHtml`<a class="BetterX-author-profile" href="${escapeHtml(profileUrl)}" title="打开 @${escapeHtml(handle)} 的个人主页">${authorLabelHtml}</a>`
      : authorLabelHtml;
    const timeHtml = timeLabel ? `<span class="BetterX-author-time"> · ${escapeHtml(timeLabel)}</span>` : '';
    const textHtml = post.text
      ? highlightText(post.text, matchedKeywords) : escapeHtml(uiText('(无正文)'));
    const isExpanded = state.expandedPosts.has(post.id);
    const isEditingNote = state.editingNoteId === post.id;
    const textIsLong = (post.text || '').length > 120;
    const historyText = (post.sourceHistory || []).length > 1
      ? uiHtml` · 历史来源: ${(post.sourceHistory || []).map((source) => uiText(localizeSourceLabel(source))).join(' / ')}`
      : '';
    const avatarUrl = safeImportedAssetUrl(post.avatarUrl);
    const avatarHtml = avatarUrl
      ? `<img class="BetterX-avatar" src="${escapeHtml(avatarUrl)}" referrerpolicy="no-referrer" alt="" />`
      : '';
    const noteHtml = isEditingNote
      ? uiHtml`<div class="BetterX-note-edit">
           <textarea class="BetterX-note-input" data-id="${escapeHtml(post.id)}" placeholder="在这里写备注…">${escapeHtml(post.note || '')}</textarea>
           <div class="BetterX-note-actions">
             <button class="BetterX-btn primary" data-action="save-note" data-id="${escapeHtml(post.id)}">保存备注</button>
             <button class="BetterX-btn" data-action="cancel-note">取消</button>
           </div>
         </div>`
      : uiHtml`<button class="BetterX-btn BetterX-note-btn" data-action="edit-note" data-id="${escapeHtml(post.id)}">${uiText(post.note ? '✏️ 备注' : '+ 备注')}</button>
         ${post.note ? `<div class="BetterX-note-text">💬 ${escapeHtml(post.note)}</div>` : ''}`;

    return uiHtml`
      <div class="BetterX-item ${post.flashLost ? 'is-flash-lost' : ''} ${post.pinned ? 'is-pinned' : ''} ${!post.clicked ? 'is-unread' : ''}" data-id="${escapeHtml(post.id)}">
        <div class="BetterX-item-top">
          <div class="BetterX-author">
            <div class="BetterX-author-head">
              ${avatarHtml}
              <div class="BetterX-author-line">${authorHtml}${timeHtml}</div>
            </div>
          <div class="BetterX-submeta">
            <span>抓取: ${escapeHtml(formatTime(post.lastCapturedAt))}</span>
            ${post.lastViewedAt ? uiHtml`<span>浏览: ${escapeHtml(formatTime(post.lastViewedAt))}</span>` : ''}
            <span>出现: ${escapeHtml(String(post.capturedCount || 1))} 次</span>
            </div>
          </div>
          <div class="BetterX-actions">
            <button class="BetterX-btn primary" data-action="open" data-id="${escapeHtml(post.id)}">打开</button>
            <button class="BetterX-btn" data-action="copy" data-id="${escapeHtml(post.id)}">复制链接</button>
            <button class="BetterX-btn" data-action="pin" data-id="${escapeHtml(post.id)}">${uiText(post.pinned ? '取消置顶' : '置顶')}</button>
            <button class="BetterX-btn" data-action="fav" data-id="${escapeHtml(post.id)}">${uiText(post.favorite ? '取消收藏' : '收藏')}</button>
            <button class="BetterX-btn danger" data-action="delete" data-id="${escapeHtml(post.id)}">删</button>
          </div>
        </div>

        <div class="BetterX-text ${textIsLong && !isExpanded ? 'collapsed' : ''}">${textHtml}</div>
        ${textIsLong ? uiHtml`<button class="BetterX-expand-btn" data-action="toggle-expand" data-id="${escapeHtml(post.id)}">${uiText(isExpanded ? '▲ 收起' : '▼ 展开全文')}</button>` : ''}

        ${renderThumbs(post)}

        <div class="BetterX-tags">
          ${renderMetaTags(post)}
          ${renderKeywordTags(matchedKeywords)}
        </div>

        <div class="BetterX-note-area">${noteHtml}</div>

        <div class="BetterX-bottom-meta">
          <span>当前来源: ${escapeHtml(uiText(localizeSourceLabel(post.sourceLabel) || '-'))}</span>
          <span>${escapeHtml(historyText)}</span>
        </div>
      </div>
    `;
  }

  function refreshUI(opts) {
    opts = opts || {};
    if (!state.panelEl) return;
    refreshBadge();
    // 面板关闭时只维护轻量徽标；筛选、排序和富 HTML 渲染延后到真正打开面板时。
    if (!state.panelOpen && opts.force !== true) return;
    const keepListScroll = !!opts.keepScroll || state.panelView === 'settings';

    if (state.summaryEl) state.summaryEl.innerHTML = buildSummaryHtml();
    if (state.filterBarEl) state.filterBarEl.innerHTML = buildFilterHtml();
    if (state.sourceSelectEl) {
      state.sourceSelectEl.innerHTML = buildSourceOptionsHtml();
    }
    if (state.skipSourcesEl) state.skipSourcesEl.innerHTML = buildSkipSourcesHtml();
    renderSavedKeywordTags();
    renderSavedExcludeKeywordTags();
    syncSettingsControls();
    updateSortHint();
    updateQuickFilterHeader();
    syncInactiveInput(state.autoCleanInputEl, state.settings.autoCleanDays || 0);
    syncInactiveInput(state.maxPostsInputEl, state.settings.maxPosts || DEFAULT_SETTINGS.maxPosts);
    syncInactiveInput(state.flashMsInputEl, Math.round((state.settings.flashMs || 8000) / 1000));
    if (state.dlTimeoutInputEl && document.activeElement !== state.dlTimeoutInputEl) {
      state.dlTimeoutInputEl.value = String(Math.round((state.settings.downloadTimeout || DEFAULT_SETTINGS.downloadTimeout) / 1000));
    }
    if (state.dlConcurrencyInputEl && document.activeElement !== state.dlConcurrencyInputEl) {
      state.dlConcurrencyInputEl.value = String(state.settings.downloadConcurrency || DEFAULT_SETTINGS.downloadConcurrency);
    }
    renderAdultSpamKeywordTags();
    renderAdultSpamWhitelistTags();
    syncInactiveInput(state.timelineWidthEl,
      state.settings.layoutAutoWidth !== false && state.detectedTimelineWidth
        ? state.detectedTimelineWidth : (state.settings.timelineWidth || DEFAULT_SETTINGS.timelineWidth));
    syncInactiveInput(state.leftbarWidthEl,
      state.settings.layoutAutoWidth !== false && state.detectedLeftbarWidth
        ? state.detectedLeftbarWidth : (state.settings.leftbarWidth || DEFAULT_SETTINGS.leftbarWidth));
    updateAdultSpamCount();
    if (state.mediaDownloadEl) state.mediaDownloadEl.checked = !!state.settings.mediaDownload;
    if (state.downloadZipEl) state.downloadZipEl.checked = state.settings.downloadZip !== false;
    if (state.downloadFileNameTemplateEl && document.activeElement !== state.downloadFileNameTemplateEl) {
      state.downloadFileNameTemplateEl.value = state.settings.downloadFileNameTemplate || DEFAULT_SETTINGS.downloadFileNameTemplate;
    }
    if (state.downloadZipNameTemplateEl && document.activeElement !== state.downloadZipNameTemplateEl) {
      state.downloadZipNameTemplateEl.value = state.settings.downloadZipNameTemplate || DEFAULT_SETTINGS.downloadZipNameTemplate;
    }
    if (state.downloadNameRegexEl && document.activeElement !== state.downloadNameRegexEl) {
      state.downloadNameRegexEl.value = state.settings.downloadNameRegex || '';
    }
    if (state.downloadNameReplacementEl && document.activeElement !== state.downloadNameReplacementEl) {
      state.downloadNameReplacementEl.value = state.settings.downloadNameReplacement || '';
    }
    if (state.trackDownloadedPostsEl) state.trackDownloadedPostsEl.checked = !!state.settings.trackDownloadedPosts;
    updateDownloadNamingPreview();
    syncControlProperties([
      [state.firefoxCompatibilityEl, 'checked', !!state.settings.firefoxCompatibility],
      [state.hideAppBadgeEl, 'checked', !!state.settings.hideAppBadge],
      [state.postLimitWarningEl, 'checked', !state.settings.postLimitWarningDisabled],
      [state.useMobileBadgeHandleEl, 'checked', !!state.settings.useMobileBadgeHandle],
      [state.profileDefaultViewEl, 'disabled', state.settings.profileDefaultViewEnabled === false],
      [state.profilePostSortEl, 'disabled', state.settings.profilePostSortEnabled === false],
    ]);
    updateSettingsDependencyUI();
    renderNotificationSubscriptions();
    localizeBetterXTree(state.downloadNamePreviewEl);

    if (!state.listEl) return;
    const scrollTop = keepListScroll ? state.listEl.scrollTop : 0;

    const filtered = filterPosts(state.posts);
    state.lastFilteredCount = filtered.length;

    if (!filtered.length) {
      state.listEl.innerHTML = uiHtml`<div class="BetterX-empty">当前筛选条件下没有帖子。可以刷新页面、切换 X 标签页，或把筛选改回“全部”。</div>`;
      return;
    }

    const limit = state.renderLimit || state.settings.pageSize || 60;
    const shown = filtered.slice(0, limit);
    let html = shown.map(renderPostItem).join('');
    if (filtered.length > shown.length) {
      html += uiHtml`<button class="BetterX-loadmore" data-action="load-more">加载更多（还有 ${filtered.length - shown.length} 条）</button>`;
    }
    state.listEl.innerHTML = html;
    if (keepListScroll) state.listEl.scrollTop = scrollTop;
  }

  function sanitizeSettings(raw) {
    const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const stringList = (value, maxItems, maxLength) => uniqueStrings(
      (Array.isArray(value) ? value : []).map((item) => safeString(item, maxLength).trim()).filter(Boolean)
    ).slice(0, maxItems);
    const notificationList = () => {
      const result = [];
      const handles = new Set();
      for (const rawItem of Array.isArray(input.notificationSubscriptions) ? input.notificationSubscriptions : []) {
        const item = sanitizeNotificationSubscription(rawItem);
        const key = item?.username.toLowerCase();
        if (!item || handles.has(key)) continue;
        handles.add(key);
        result.push(item);
        if (result.length >= MAX_NOTIFICATION_SUBSCRIPTIONS) break;
      }
      return result;
    };
    const sanitizeValue = (key, definition) => {
      const [type, first, second] = definition.validate || [];
      const value = input[key];
      const fallback = definition.default;
      switch (type) {
        case 'revision': return fallback;
        case 'boolean': return typeof value === 'boolean' ? value : fallback;
        case 'int': return clampInt(value, first, second, fallback);
        case 'enum': return first.includes(value) ? value : fallback;
        case 'filter': return FILTERS.some((item) => item.key === value) ? value : fallback;
        case 'mediaFilter': return MEDIA_FILTERS.some((item) => item.key === value) ? value : fallback;
        case 'string': return safeString(value, first);
        case 'stringDefault': return safeString(value, first) || fallback;
        case 'trimmedStringDefault': return safeString(value, first).trim() || fallback;
        case 'stringList': return stringList(value, first, second);
        case 'keywordRules': return stringList(value, first, second).filter(isSafeKeywordRule);
        case 'skipSources': return stringList(value, SKIP_SOURCE_OPTIONS.length, 30)
          .filter((candidate) => SKIP_SOURCE_OPTIONS.some((item) => item.key === candidate));
        case 'handles': return uniqueStrings(stringList(value, first, 30)
          .map((item) => item.replace(/^@+/, '').toLowerCase())
          .filter((item) => /^[a-z0-9_]{1,15}$/.test(item)));
        case 'notifications': return notificationList();
        case 'timestamp': {
          const timestamp = Number(value);
          return Number.isFinite(timestamp)
            ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(timestamp))) : 0;
        }
        case 'badgePos': return value && Number.isFinite(value.left) && Number.isFinite(value.bottom)
          ? { left: value.left, bottom: value.bottom } : null;
        case 'safeRegex': {
          const source = safeString(value, MAX_REGEX_SOURCE_LENGTH);
          return isSafeRegexSource(source) ? source : fallback;
        }
        case 'downloadedIds': return uniqueStrings(stringList(value, MAX_DOWNLOADED_POST_IDS, 30)
          .filter((item) => /^\d{1,30}$/.test(item)));
        case 'hideAppBadge': return value === true || input.hideAppBadgeOnDesktop === true;
        case 'mobileBadgeHandle': return value === true
          && input.hideAppBadge !== true && input.hideAppBadgeOnDesktop !== true;
        case 'mobileBadgeTop': return Number.isFinite(value)
          ? Math.max(0, Math.min(100000, Math.round(value))) : fallback;
        default: throw new Error(`[BetterX] Missing settings validator: ${key}`);
      }
    };
    return Object.fromEntries(
      Object.entries(SETTINGS_SCHEMA).map(([key, definition]) => [key, sanitizeValue(key, definition)])
    );
  }

  function migrateSettingsDefaults(raw) {
    const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
    const revision = clampInt(input.settingsRevision, 0, 999, 0);
    if (revision < DEFAULT_SETTINGS.settingsRevision) {
      // 仅把旧版默认值迁移到新默认；其他自定义值原样保留。
      if (input.maxPosts == null || Number(input.maxPosts) === 500) input.maxPosts = DEFAULT_SETTINGS.maxPosts;
      if (input.downloadTimeout == null || Number(input.downloadTimeout) === 60000) {
        input.downloadTimeout = DEFAULT_SETTINGS.downloadTimeout;
      }
      if (input.downloadConcurrency == null) input.downloadConcurrency = DEFAULT_SETTINGS.downloadConcurrency;
      // v1.6.2 起内容净化默认使用“均衡”；把旧版默认档位迁移到新默认。
      if (revision < 4 && (input.adultSpamLevel == null || input.adultSpamLevel === 'conservative')) {
        input.adultSpamLevel = DEFAULT_SETTINGS.adultSpamLevel;
      }
      // v1.7 收尾版默认开启广告过滤和媒体下载；旧版默认关闭值同步迁移。
      if (revision < 7) {
        if (input.hideAds == null || input.hideAds === false) input.hideAds = true;
        if (input.mediaDownload == null || input.mediaDownload === false) input.mediaDownload = true;
      }
      // v2.6 将旧“默认排序”明确为智能排序，避免旧设置落入无效值。
      if (revision < 15 && (!input.sortBy || input.sortBy === 'default')) input.sortBy = 'smart';
      // v2.6.0 新增 ZIP 开关；旧设置未填写时保持默认自动压缩。
      if (revision < 16 && input.downloadZip == null) input.downloadZip = DEFAULT_SETTINGS.downloadZip;
      // v2.7.0 新增用户主页默认页签；旧设置沿用 X 原本的“帖子”页。
      if (revision < 17 && input.profileDefaultView == null) input.profileDefaultView = DEFAULT_SETTINGS.profileDefaultView;
      // v2.7.0 新增自动展开长文；默认关闭，避免改变旧用户的阅读习惯。
      if (revision < 18 && input.autoExpandPostText == null) input.autoExpandPostText = DEFAULT_SETTINGS.autoExpandPostText;
      // v3.1.2 新增用户主页帖子排序；旧用户保持 X 原本的“最近”顺序。
      if (revision < 29 && input.profilePostSort == null) input.profilePostSort = DEFAULT_SETTINGS.profilePostSort;
      // 排序设置增加独立开关；已经使用该设置的用户保持启用。
      if (revision < 30 && input.profilePostSortEnabled == null) {
        input.profilePostSortEnabled = DEFAULT_SETTINGS.profilePostSortEnabled;
      }
      if (revision < 31 && input.postLimitWarningDisabled == null) {
        input.postLimitWarningDisabled = DEFAULT_SETTINGS.postLimitWarningDisabled;
      }
      // v2.7.0 新增下载命名模板；沿用原“用户名_帖子 ID”的默认命名。
      if (revision < 19) {
        if (input.downloadFileNameTemplate == null) input.downloadFileNameTemplate = DEFAULT_SETTINGS.downloadFileNameTemplate;
        if (input.downloadZipNameTemplate == null) input.downloadZipNameTemplate = DEFAULT_SETTINGS.downloadZipNameTemplate;
        if (input.downloadNameRegex == null) input.downloadNameRegex = DEFAULT_SETTINGS.downloadNameRegex;
        if (input.downloadNameReplacement == null) input.downloadNameReplacement = DEFAULT_SETTINGS.downloadNameReplacement;
      }
      // v2.7.0 下载模板改用中文变量；旧英文变量继续兼容，自定义模板不改写。
      if (revision < 20) {
        if (input.downloadFileNameTemplate === '{user-id}_{status-id}') {
          input.downloadFileNameTemplate = DEFAULT_SETTINGS.downloadFileNameTemplate;
        }
        if (input.downloadZipNameTemplate === '{user-id}_{status-id}') {
          input.downloadZipNameTemplate = DEFAULT_SETTINGS.downloadZipNameTemplate;
        }
        if (input.trackDownloadedPosts == null) input.trackDownloadedPosts = DEFAULT_SETTINGS.trackDownloadedPosts;
        if (input.downloadedPostIds == null) input.downloadedPostIds = [];
      }
      // 2.8.0 收尾：移动端隐藏改为右侧唤醒半透明蓝色条，沿用旧开关的选择。
      if (revision < 21 && input.hideAppBadge == null && input.hideAppBadgeOnDesktop != null) {
        input.hideAppBadge = input.hideAppBadgeOnDesktop === true;
      }
      // 关键词/排除词改为标签内 /表达式/ 声明正则；旧“正则”模式的规则自动保留为新写法。
      if (revision < 24 && input.keywordMode === 'regex') {
        ['keywords', 'excludeKeywords'].forEach((key) => {
          if (!Array.isArray(input[key])) return;
          input[key] = input[key].map((item) => {
            const rule = safeString(item, 500).trim();
            return isSafeRegexSource(rule) ? `/${rule}/` : rule;
          });
        });
        input.keywordMode = DEFAULT_SETTINGS.keywordMode;
      }
      // v1.6 已手动改过宽度的用户继续使用手动值；旧默认值则切换为自动读取。
      if (input.layoutAutoWidth == null) {
        const customTimeline = input.timelineWidth != null && Number(input.timelineWidth) !== 600;
        const customLeftbar = input.leftbarWidth != null && Number(input.leftbarWidth) !== 275;
        input.layoutAutoWidth = !(customTimeline || customLeftbar);
      }
      input.settingsRevision = DEFAULT_SETTINGS.settingsRevision;
    }
    return input;
  }

  async function persistSettings() {
    const sanitized = sanitizeSettings(state.settings);
    // 设置同时镜像到油猴存储：即使浏览器/清理扩展清掉 x.com 的 IndexedDB，仍可自动恢复。
    writeSettingsMirror(sanitized);
    await dbPutSetting('settings', sanitized);
  }

  function resetPaging() { state.renderLimit = state.settings.pageSize || 60; }

  const SETTINGS_EFFECT_ORDER = [
    'keywords', 'adultSpam', 'layout', 'theme', 'ads', 'mediaDownload',
    'ageBypass', 'mediaGrid', 'autoExpand', 'firefoxCompatibility', 'badge',
  ];
  const SETTINGS_EFFECT_HANDLERS = {
    keywords() {
      bumpKeywordCache();
    },
    adultSpam() {
      adultSpamRulesVersion++;
      adultSpamCache = new WeakMap();
      applyAdultSpamFiltering();
    },
    layout() {
      applyLayoutEnhancements();
    },
    theme() {
      applyTheme();
    },
    ads() {
      applyAdHiding();
    },
    mediaDownload() {
      applyMediaDownload();
    },
    ageBypass() {
      applyAgeBypass();
    },
    mediaGrid() {
      applyMediaGridLayout();
    },
    autoExpand(nextPartial) {
      if (nextPartial.autoExpandPostText) expandPostShowMore(document);
    },
    firefoxCompatibility(nextPartial) {
      if (!IS_FIREFOX) return;
      state.settings.firefoxCompatibilityPrompted = true;
      writeFirefoxCompatibilityMode(nextPartial.firefoxCompatibility ? 'compat' : 'normal');
    },
    badge() {
      repositionBadge();
    },
  };

  function runSettingsEffects(nextPartial) {
    const requestedEffects = new Set();
    for (const settingKey of Object.keys(nextPartial)) {
      for (const effect of SETTINGS_SCHEMA[settingKey]?.effects || []) requestedEffects.add(effect);
    }
    for (const effect of SETTINGS_EFFECT_ORDER) {
      if (requestedEffects.has(effect)) SETTINGS_EFFECT_HANDLERS[effect](nextPartial);
    }
  }

  function setSettingsPartial(nextPartial) {
    state.settings = { ...state.settings, ...nextPartial };
    runSettingsEffects(nextPartial);
    resetPaging();
    queueDbWrite(async () => { await persistSettings(); });
    refreshUI();
  }

  function upsertPost(post, opts) {
    const countCapture = !opts || opts.countCapture !== false;
    const index = getPostIndexById(post.id);
    const timestamp = now();
    matchCache.delete(post.id);

    if (index >= 0) {
      const existing = state.posts[index];
      const merged = {
        ...existing,
        ...post,
        id: existing.id,
        favorite: !!existing.favorite,
        pinned: !!existing.pinned,
        clicked: !!existing.clicked,
        flashLost: existing.flashLost || false,
        note: existing.note || post.note || '',
        firstCapturedAt: existing.firstCapturedAt || post.firstCapturedAt || timestamp,
        lastCapturedAt: timestamp,
        capturedCount: countCapture ? ((existing.capturedCount || 1) + 1) : (existing.capturedCount || 1),
        sourceHistory: uniqueStrings([...(existing.sourceHistory || []), post.sourceLabel]).slice(-8),
        mediaThumbs: (post.mediaThumbs && post.mediaThumbs.length) ? post.mediaThumbs : (existing.mediaThumbs || []),
        avatarUrl: existing.avatarUrl || post.avatarUrl || '',
      };
      state.posts[index] = merged;
      queueDbWrite(async () => { await dbPutPost(merged); });
    } else {
      const created = {
        favorite: false,
        pinned: false,
        clicked: false,
        flashLost: false,
        note: '',
        sourceHistory: uniqueStrings([post.sourceLabel]).slice(-8),
        capturedCount: 1,
        firstCapturedAt: timestamp,
        lastCapturedAt: timestamp,
        mediaThumbs: [],
        avatarUrl: '',
        ...post,
      };
      state.posts.push(created);
      maybeShowPostLimitWarning();
      queueDbWrite(async () => {
        await dbPutPost(created);
        await enforceMaxPosts();
      });
    }

    if (state.posts.length > (state.settings.maxPosts || 500) + 50) {
      queueDbWrite(async () => { await enforceMaxPosts(); });
    }
    debouncedRefreshUI();
  }

  function deletePost(id) {
    state.posts = state.posts.filter((p) => p.id !== id);
    prunePostRuntimeCaches([id]);
    queueDbWrite(async () => { await dbDeletePost(id); });
    refreshUI({ keepScroll: true });
  }

  function clearNonFavoritePosts() {
    const targets = state.posts.filter((p) => !protectedPost(p));
    if (!targets.length) return;
    if (!uiConfirm(`确定要清空 ${targets.length} 条未收藏/未置顶的帖子吗？此操作不可撤销。`)) return;
    const ids = targets.map((p) => p.id);
    state.posts = state.posts.filter(protectedPost);
    prunePostRuntimeCaches(ids);
    queueDbWrite(async () => { await dbDeleteMany(ids); });
    refreshUI();
  }

  function markClicked(id) {
    const index = getPostIndexById(id);
    if (index < 0) return;
    const post = state.posts[index];
    if (post.clicked) return;
    const updated = { ...post, clicked: true, lastClickedAt: now() };
    state.posts[index] = updated;
    queueDbWrite(async () => { await dbPutPost(updated); });
    refreshUI({ keepScroll: true });
  }

  function toggleFavorite(id) {
    const index = getPostIndexById(id);
    if (index < 0) return;
    const updated = { ...state.posts[index], favorite: !state.posts[index].favorite };
    state.posts[index] = updated;
    queueDbWrite(async () => { await dbPutPost(updated); });
    refreshUI({ keepScroll: true });
  }

  function togglePin(id) {
    const index = getPostIndexById(id);
    if (index < 0) return;
    const updated = { ...state.posts[index], pinned: !state.posts[index].pinned };
    state.posts[index] = updated;
    queueDbWrite(async () => { await dbPutPost(updated); });
    refreshUI({ keepScroll: true });
  }

  function markFlashLost(id) {
    const index = getPostIndexById(id);
    if (index < 0) return;
    const post = state.posts[index];
    if (post.clicked || post.flashLost) return;
    const updated = { ...post, flashLost: true, flashLostAt: now() };
    state.posts[index] = updated;
    queueDbWrite(async () => { await dbPutPost(updated); });
    debouncedRefreshUI();
  }

  function updatePostNote(id, note) {
    const idx = getPostIndexById(id);
    if (idx < 0) return;
    const updated = { ...state.posts[idx], note };
    state.posts[idx] = updated;
    state.editingNoteId = null;
    matchCache.delete(id);
    queueDbWrite(async () => { await dbPutPost(updated); });
    refreshUI({ keepScroll: true });
  }
  // ── 媒体下载（图片 / 视频 / GIF）─────────────────────────────────────
  // 说明：X 的 <video> 用 blob: 地址，无法直接下载，故拦截页面网络响应
  // (GraphQL/timeline) 收集真实媒体 URL（含视频 mp4 变体 + 图片），并以 DOM 兜底
  // 提取图片、由海报推导 GIF 的 mp4，再用 GM_xmlhttpRequest 抓取字节、JSZip 打包。
