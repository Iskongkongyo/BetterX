  function updateSettingsDependencyUI() {
    if (!state.panelEl) return;
    const setGroupDisabled = (selector, disabled) => {
      const group = state.panelEl.querySelector(selector);
      if (!group) return;
      group.classList.toggle('is-disabled', disabled);
      group.querySelectorAll('input, select, button').forEach((control) => {
        control.disabled = disabled;
      });
    };

    const adultSpamDisabled = !state.settings.hideAdultSpam;
    const layoutDisabled = !state.settings.layoutEnabled;
    const adultSpamCustomDisabled = state.settings.adultSpamCustomRulesEnabled === false;
    setGroupDisabled('#BetterX-adultspam-auto-options', adultSpamDisabled);
    setGroupDisabled('#BetterX-adultspam-custom-options', adultSpamCustomDisabled);
    setGroupDisabled('#BetterX-layout-options', layoutDisabled);
    if (state.adultSpamLevelEl) state.adultSpamLevelEl.disabled = adultSpamDisabled;
    if (state.adultSpamSkipFollowingRepostsEl) {
      const repostOptionDisabled = adultSpamDisabled || state.settings.adultSpamSkipFollowing === false;
      state.adultSpamSkipFollowingRepostsEl.disabled = repostOptionDisabled;
      const repostLabel = state.adultSpamSkipFollowingRepostsEl.closest('.BetterX-field');
      if (repostLabel) {
        repostLabel.classList.toggle('is-disabled', !adultSpamDisabled && state.settings.adultSpamSkipFollowing === false);
      }
    }

    const manualWidthDisabled = layoutDisabled || state.settings.layoutAutoWidth !== false;
    [state.timelineWidthEl, state.leftbarWidthEl].forEach((control) => {
      if (control) control.disabled = manualWidthDisabled;
    });
    const saveLayoutButton = state.panelEl.querySelector('[data-action="save-layout"]');
    if (saveLayoutButton) saveLayoutButton.disabled = manualWidthDisabled;
    if (state.firefoxCompatibilityEl) {
      state.panelEl.querySelectorAll('.BetterX-firefox-only-setting').forEach((element) => {
        element.hidden = !IS_FIREFOX;
      });
    }
    const downloadControlsDisabled = !state.settings.mediaDownload;
    [
      state.downloadZipEl, state.downloadFileNameTemplateEl, state.downloadZipNameTemplateEl,
      state.downloadNameRegexEl, state.downloadNameReplacementEl, state.trackDownloadedPostsEl,
    ].forEach((control) => {
      if (control) control.disabled = downloadControlsDisabled;
    });
    if (state.downloadZipEl) {
      const label = state.downloadZipEl.closest('label');
      if (label) label.classList.toggle('is-disabled', downloadControlsDisabled);
    }
    if (state.trackDownloadedPostsEl) {
      const label = state.trackDownloadedPostsEl.closest('label');
      if (label) label.classList.toggle('is-disabled', downloadControlsDisabled);
    }
    const saveDownloadNamingButton = state.panelEl.querySelector('[data-action="save-download-naming"]');
    if (saveDownloadNamingButton) saveDownloadNamingButton.disabled = downloadControlsDisabled;
    state.panelEl.querySelectorAll('.BetterX-download-name-tokens button').forEach((button) => {
      button.disabled = downloadControlsDisabled;
    });
  }

  function formatNotificationSyncTime(timestamp) {
    if (!timestamp) return '尚未完整同步';
    try { return `上次同步：${new Date(timestamp).toLocaleString()}`; } catch (err) { return '已同步'; }
  }

  function renderNotificationSubscriptions() {
    if (!state.notificationListEl) return;
    const syncButton = state.panelEl && state.panelEl.querySelector('[data-action="sync-notification-users"]');
    if (syncButton) {
      syncButton.disabled = state.notificationSyncInProgress;
      syncButton.textContent = uiText(state.notificationSyncInProgress ? '正在同步…' : '同步订阅用户');
    }
    const allItems = [...notificationSubscriptions.values()]
      .sort((a, b) => Number(b.pinned === true) - Number(a.pinned === true)
        || Number(b.enabled) - Number(a.enabled)
        || String(a.username).localeCompare(String(b.username), undefined, { sensitivity: 'base' }));
    const query = safeString(state.notificationSearchQuery, 120).trim();
    const items = query ? allItems.filter((item) => notificationMatchesSearch(item, query)) : allItems;
    const enabledCount = allItems.filter((item) => item.enabled).length;
    const pinnedCount = allItems.filter((item) => item.pinned === true).length;
    if (state.notificationStatusEl) {
      const filterSummary = query ? ` · 筛选到 ${items.length}/${allItems.length}` : '';
      state.notificationStatusEl.textContent = uiText(state.notificationSyncInProgress
        ? `正在读取关注列表… 已发现 ${enabledCount} 个订阅${filterSummary}`
        : `已订阅 ${enabledCount} · 已置顶 ${pinnedCount} · 本地保留 ${allItems.length}${filterSummary} · ${formatNotificationSyncTime(state.settings.notificationSubscriptionsSyncedAt)}`);
    }
    if (!allItems.length) {
      state.notificationListEl.innerHTML = uiHtml`<div class="BetterX-empty">还没有读取到帖子通知订阅。点击“同步订阅用户”，或浏览已开启铃铛的用户主页后再查看。</div>`;
      return;
    }
    if (!items.length) {
      state.notificationListEl.innerHTML = uiHtml`<div class="BetterX-empty">没有找到与“<span class="BetterX-i18n-user-text">${escapeHtml(query)}</span>”匹配的用户名或 @用户名。</div>`;
      return;
    }
    state.notificationListEl.innerHTML = items.map((item) => {
      const avatar = safeImportedAssetUrl(item.avatarUrl);
      const profileUrl = `https://x.com/${encodeURIComponent(item.username)}`;
      const pending = state.notificationMutationUsers.has(item.username.toLowerCase());
      const pinned = item.pinned === true;
      const pinMark = pinned
        ? uiHtml`<span class="BetterX-notification-pin-mark" title="已置顶" aria-label="已置顶"> 📌</span>` : '';
      const forgetButton = item.enabled ? ''
        : uiHtml`<button class="BetterX-btn" data-action="forget-notification-user" data-username="${escapeHtml(item.username)}">移除记录</button>`;
      return uiHtml`
        <div class="BetterX-notification-user ${item.enabled ? '' : 'is-disabled'} ${pinned ? 'is-pinned' : ''}">
          <a class="BetterX-notification-user-main" href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer">
            ${avatar ? `<img src="${escapeHtml(avatar)}" alt="" referrerpolicy="no-referrer" />` : '<span class="BetterX-notification-avatar-fallback">@</span>'}
            <span><b>${escapeHtml(item.displayName || item.username)}${pinMark}</b><small>@${escapeHtml(item.username)}</small></span>
          </a>
          <div class="BetterX-notification-user-actions">
            <button class="BetterX-btn ${item.enabled ? 'danger' : 'primary'}" data-action="toggle-notification-user" data-username="${escapeHtml(item.username)}" data-enabled="${item.enabled ? 'false' : 'true'}" ${pending ? 'disabled' : ''}>${uiText(pending ? '处理中…' : (item.enabled ? '关闭通知' : '重新开启'))}</button>
            <button class="BetterX-btn ${pinned ? 'notification-pinned' : ''}" data-action="toggle-notification-pin" data-username="${escapeHtml(item.username)}">${uiText(pinned ? '取消置顶' : '置顶')}</button>
            ${forgetButton}
          </div>
        </div>`;
    }).join('');
  }
  function setPanelView(view) {
    if (!state.panelEl) return;
    const nextView = view === 'settings' || view === 'notifications' ? view : 'vault';
    const enteringSettings = nextView === 'settings' && state.panelView !== 'settings';
    state.panelView = nextView;
    if (enteringSettings) {
      state.panelEl.querySelectorAll('.BetterX-settings-card[open]').forEach((detailsEl) => {
        detailsEl.removeAttribute('open');
      });
    }
    state.panelEl.classList.toggle('is-settings-view', nextView !== 'vault');
    state.panelEl.querySelectorAll('[data-view-panel]').forEach((viewEl) => {
      viewEl.hidden = viewEl.getAttribute('data-view-panel') !== nextView;
    });
    state.panelEl.querySelectorAll('[data-action="set-panel-view"]').forEach((tabEl) => {
      const active = tabEl.getAttribute('data-view') === nextView;
      tabEl.classList.toggle('active', active);
      tabEl.setAttribute('aria-selected', active ? 'true' : 'false');
      tabEl.tabIndex = active ? 0 : -1;
    });
    updateSettingsDependencyUI();
    if (nextView === 'notifications') renderNotificationSubscriptions();
  }

  function togglePanel(force) {
    const next = typeof force === 'boolean' ? force : !state.panelOpen;
    state.panelOpen = next;
    if (next) updatePanelPlacement();
    if (state.panelEl) state.panelEl.style.display = next ? 'flex' : 'none';
    if (state.rootEl) state.rootEl.classList.toggle('is-open', next);
    if (next) { resetPaging(); refreshUI(); }
  }

  // ── 附加功能 ─────────────────────────────────────────────────────
  function markPostsRead(ids) {
    const targetIds = new Set((ids || []).map(String));
    if (!targetIds.size) return;
    let changed = false;
    state.posts = state.posts.map((p) => {
      if (!p.clicked && targetIds.has(String(p.id))) {
        changed = true;
        const updated = { ...p, clicked: true, lastClickedAt: now() };
        queueDbWrite(async () => { await dbPutPost(updated); });
        return updated;
      }
      return p;
    });
    if (changed) refreshUI({ keepScroll: true });
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function exportPosts() {
    const data = filterPosts(state.posts);
    if (!data.length) { uiAlert('当前筛选结果为空，没有可导出的内容。'); return; }
    download(`BetterX-filtered-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
  }

  function backupAll() {
    const portableSettings = { ...state.settings };
    // Firefox 启动模式属于当前浏览器的故障恢复状态，不随备份迁移。
    delete portableSettings.firefoxCompatibility;
    delete portableSettings.firefoxCompatibilityPrompted;
    const payload = {
      type: 'x-post-vault-backup',
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      settings: portableSettings,
      posts: state.posts,
    };
    download(`BetterX-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2));
  }

  function sanitizeImportedPost(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const id = typeof raw.id === 'string' && /^\d{1,30}$/.test(raw.id) ? raw.id : '';
    if (!id) return null;
    const timestamp = now();
    const finiteInt = (value, min, max, fallback) => {
      const n = Number(value);
      return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback;
    };
    const username = safeString(raw.username, 100);
    const usernamePart = username.replace(/^@/, '');
    const fallbackUrl = /^[A-Za-z0-9_]{1,15}$/.test(usernamePart)
      ? `https://x.com/${usernamePart}/status/${id}`
      : `https://x.com/i/web/status/${id}`;
    const mediaThumbs = uniqueStrings(
      (Array.isArray(raw.mediaThumbs) ? raw.mediaThumbs : []).map(safeImportedAssetUrl).filter(Boolean)
    ).slice(0, 4);
    const firstCapturedAt = finiteInt(raw.firstCapturedAt, 0, Number.MAX_SAFE_INTEGER, timestamp);
    const lastCapturedAt = finiteInt(raw.lastCapturedAt, 0, Number.MAX_SAFE_INTEGER, firstCapturedAt);
    const firstViewedAt = finiteInt(raw.firstViewedAt, 0, Number.MAX_SAFE_INTEGER, 0);
    const lastViewedAt = finiteInt(raw.lastViewedAt, 0, Number.MAX_SAFE_INTEGER, firstViewedAt);
    const authorInfo = cleanAuthorInfo(raw.displayName, raw.username, raw.timeLabel);
    return {
      id,
      url: safeImportedStatusUrl(raw.url, id) || fallbackUrl,
      displayName: safeString(authorInfo.displayName || raw.displayName, 200),
      username: safeString(authorInfo.username || username, 100),
      timeLabel: safeString(authorInfo.timeLabel || raw.timeLabel, 80),
      text: safeString(raw.text, 100000),
      hasImage: (() => {
        const hasVideo = raw.hasVideo === true;
        if (raw.hasImage === undefined || raw.hasImage === null) {
          return !hasVideo && mediaThumbs.length > 0;
        }
        if (hasVideo && raw.hasImage === true) {
          const onlyVideoThumbs = mediaThumbs.length > 0 && mediaThumbs.every((u) => /(?:ext_tw_video_thumb|amplify_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)/i.test(u));
          if (onlyVideoThumbs) return false;
        }
        return raw.hasImage === true;
      })(),
      hasVideo: raw.hasVideo === true,
      mediaThumbs,
      avatarUrl: safeImportedAssetUrl(raw.avatarUrl),
      sourceType: safeString(raw.sourceType, 50),
      sourceLabel: safeString(raw.sourceLabel, 100),
      capturedPath: typeof raw.capturedPath === 'string' && raw.capturedPath.startsWith('/')
        ? raw.capturedPath.slice(0, 2000)
        : '',
      favorite: raw.favorite === true,
      pinned: raw.pinned === true,
      clicked: raw.clicked === true,
      flashLost: raw.flashLost === true,
      note: safeString(raw.note, 20000),
      sourceHistory: uniqueStrings(
        (Array.isArray(raw.sourceHistory) ? raw.sourceHistory : [])
          .map((item) => safeString(item, 100)).filter(Boolean)
      ).slice(-8),
      capturedCount: finiteInt(raw.capturedCount, 1, 1000000, 1),
      firstCapturedAt,
      lastCapturedAt: Math.max(firstCapturedAt, lastCapturedAt),
      firstViewedAt,
      lastViewedAt: Math.max(firstViewedAt, lastViewedAt),
      firstSeenInDomAt: finiteInt(raw.firstSeenInDomAt, 0, Number.MAX_SAFE_INTEGER, firstCapturedAt),
      lastSeenInDomAt: finiteInt(raw.lastSeenInDomAt, 0, Number.MAX_SAFE_INTEGER, lastCapturedAt),
      lastClickedAt: finiteInt(raw.lastClickedAt, 0, Number.MAX_SAFE_INTEGER, 0),
    };
  }

  async function importPosts(file) {
    try {
      if (!file || file.size > MAX_IMPORT_FILE_BYTES) {
        uiAlert('导入失败：备份文件不能超过 25 MB。');
        return;
      }
      const text = await file.text();
      const parsed = JSON.parse(text);
      let posts = [];
      let importedSettings = null;
      if (Array.isArray(parsed)) posts = parsed;
      else if (parsed && Array.isArray(parsed.posts)) { posts = parsed.posts; importedSettings = parsed.settings || null; }
      else { uiAlert('无法识别的备份文件格式。'); return; }
      if (posts.length > MAX_IMPORT_POSTS) {
        uiAlert(`导入失败：单次最多允许 ${MAX_IMPORT_POSTS} 条帖子。`);
        return;
      }

      let added = 0, merged = 0, skipped = 0;
      const postIndexById = new Map(state.posts.map((post, index) => [post.id, index]));
      const postsToPersist = new Map();
      for (const raw of posts) {
        const imported = sanitizeImportedPost(raw);
        if (!imported) { skipped++; continue; }
        const existingIndex = postIndexById.get(imported.id);
        const existing = existingIndex == null ? null : state.posts[existingIndex];
        if (existing) {
          const combined = {
            ...existing,
            ...imported,
            id: existing.id,
            favorite: existing.favorite || imported.favorite,
            pinned: existing.pinned || imported.pinned,
            clicked: existing.clicked || imported.clicked,
            flashLost: existing.flashLost || imported.flashLost,
            note: existing.note || imported.note,
            sourceHistory: uniqueStrings([...(existing.sourceHistory || []), ...imported.sourceHistory]).slice(-8),
            mediaThumbs: imported.mediaThumbs.length ? imported.mediaThumbs : (existing.mediaThumbs || []),
            avatarUrl: existing.avatarUrl || imported.avatarUrl,
            capturedCount: Math.max(existing.capturedCount || 1, imported.capturedCount),
            firstCapturedAt: Math.min(existing.firstCapturedAt || now(), imported.firstCapturedAt),
            lastCapturedAt: Math.max(existing.lastCapturedAt || 0, imported.lastCapturedAt),
          };
          state.posts[existingIndex] = combined;
          postsToPersist.set(combined.id, combined);
          merged++;
        } else {
          state.posts.push(imported);
          postIndexById.set(imported.id, state.posts.length - 1);
          postsToPersist.set(imported.id, imported);
          added++;
        }
      }

      if (importedSettings && uiConfirm('是否同时恢复备份中的设置？')) {
        const localFirefoxCompatibility = {
          enabled: state.settings.firefoxCompatibility,
          prompted: state.settings.firefoxCompatibilityPrompted,
        };
        state.settings = sanitizeSettings(importedSettings);
        // Firefox 兼容模式与当前浏览器环境绑定，不随备份迁移到其他浏览器。
        if (IS_FIREFOX) {
          state.settings.firefoxCompatibility = !!localFirefoxCompatibility.enabled;
          state.settings.firefoxCompatibilityPrompted = !!localFirefoxCompatibility.prompted;
          if (state.settings.firefoxCompatibilityPrompted) {
            writeFirefoxCompatibilityMode(state.settings.firefoxCompatibility ? 'compat' : 'normal');
          }
        }
        (state.settings.knownFollowedHandles || []).forEach((handle) => followedHandles.add(handle));
        trimFollowedHandlesToMax();
        state.settings.knownFollowedHandles = [...followedHandles].sort().slice(0, MAX_FOLLOWED_HANDLES);
        applyTheme();
        applyAdHiding();
        applyMediaDownload();
        applyMediaGridLayout();
        applyAgeBypass();
        repositionBadge();
        queueDbWrite(async () => { await persistSettings(); });
      }
      const trimmedIds = trimPostsToMax();
      const liveIds = new Set(state.posts.map((post) => post.id));
      const survivingPosts = [...postsToPersist.values()].filter((post) => liveIds.has(post.id));
      queueDbWrite(async () => {
        await dbPutPosts(survivingPosts);
        await dbDeleteMany(trimmedIds);
      });
      await state.dbWriteQueue;
      bumpKeywordCache();
      resetPaging();
      refreshUI();
      const trimmedMessage = trimmedIds.length ? `，按最大条数清理 ${trimmedIds.length} 条` : '';
      uiAlert(`导入完成：新增 ${added} 条，合并 ${merged} 条，跳过 ${skipped} 条无效记录${trimmedMessage}。`);
    } catch (err) {
      console.error('[BetterX] import failed:', err);
      uiAlert('导入失败：文件解析出错。');
    }
  }

  async function runAutoClean() {
    const days = state.settings.autoCleanDays || 0;
    if (days <= 0) return;
    const cutoff = now() - days * 86400000;
    const toDelete = state.posts.filter((p) => !protectedPost(p) && (p.lastCapturedAt || 0) < cutoff);
    if (!toDelete.length) return;
    state.posts = state.posts.filter((p) => protectedPost(p) || (p.lastCapturedAt || 0) >= cutoff);
    prunePostRuntimeCaches(toDelete.map((p) => p.id));
    await dbDeleteMany(toDelete.map((p) => p.id));
    debugLog(`自动清理 ${toDelete.length} 条超过 ${days} 天的帖子`);
    refreshUI();
  }

  // ── 主题 / 徽标位置 ─────────────────────────────────────────────────
  function applyTheme() {
    if (!state.rootEl) return;
    let theme = state.settings.theme || 'auto';
    if (theme === 'auto') {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    state.rootEl.classList.toggle('BetterX-light', theme === 'light');
  }

  function applyBadgePos() {
    const pos = state.settings.badgePos;
    if (!state.rootEl || !pos || typeof pos.left !== 'number' || typeof pos.bottom !== 'number') return;
    const badgeWidth = state.badgeEl ? Math.max(1, state.badgeEl.offsetWidth) : 60;
    const badgeHeight = state.badgeEl ? Math.max(1, state.badgeEl.offsetHeight) : 60;
    state.rootEl.style.left = Math.max(4, Math.min(window.innerWidth - badgeWidth - 4, pos.left)) + 'px';
    state.rootEl.style.bottom = Math.max(4, Math.min(window.innerHeight - badgeHeight - 4, pos.bottom)) + 'px';
  }

  function isMobileBadgeViewport() {
    return window.innerWidth <= 640 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function stopMobileComposeTracking() {
    if (state.mobileComposeObserver) state.mobileComposeObserver.disconnect();
    if (state.mobileComposeResizeObserver) state.mobileComposeResizeObserver.disconnect();
    state.mobileComposeObserver = null;
    state.mobileComposeResizeObserver = null;
    state.mobileComposeEl = null;
    state.mobileComposeOpacityEl = null;
    if (state.mobileBadgeRaf) cancelAnimationFrame(state.mobileBadgeRaf);
    state.mobileBadgeRaf = 0;
  }

  function findMobileComposeButton() {
    const isVisibleCandidate = (el) => {
      if (!(el instanceof HTMLElement) || !el.isConnected) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const primary = [...document.querySelectorAll('[data-testid="FloatingActionButtons_Tweet_Button"]')]
      .find(isVisibleCandidate);
    if (primary) return primary;
    return [...document.querySelectorAll('a[href="/compose/post"][role="link"]')]
      .find(isVisibleCandidate) || null;
  }

  function ensureMobileComposeTracking(composeEl, opacityEl) {
    if (state.mobileComposeEl === composeEl && state.mobileComposeOpacityEl === opacityEl) return;
    if (state.mobileComposeObserver) state.mobileComposeObserver.disconnect();
    if (state.mobileComposeResizeObserver) state.mobileComposeResizeObserver.disconnect();
    state.mobileComposeEl = composeEl;
    state.mobileComposeOpacityEl = opacityEl;

    state.mobileComposeObserver = new MutationObserver(() => scheduleMobileBadgeSync());
    state.mobileComposeObserver.observe(opacityEl, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    if (typeof ResizeObserver === 'function') {
      state.mobileComposeResizeObserver = new ResizeObserver(() => scheduleMobileBadgeSync());
      state.mobileComposeResizeObserver.observe(composeEl);
      if (opacityEl !== composeEl) state.mobileComposeResizeObserver.observe(opacityEl);
    }
  }

  function syncMobileBadgeToComposeButton() {
    if (!state.rootEl || !state.badgeEl || !state.rootEl.classList.contains('BetterX-mobile')) return;
    if (state.rootEl.classList.contains('BetterX-mobile-badge-collapsed')) return;
    const composeEl = findMobileComposeButton();
    if (!composeEl) {
      if (state.mobileComposeEl) stopMobileComposeTracking();
      state.rootEl.style.left = 'auto';
      state.rootEl.style.right = '16px';
      state.rootEl.style.bottom = '84px';
      state.rootEl.style.setProperty('--xv-mobile-badge-opacity', '1');
      state.rootEl.classList.remove('BetterX-mobile-badge-inactive');
      return;
    }

    const opacityEl = composeEl.closest('[data-testid="FloatingActionButtonBase"]') || composeEl;
    ensureMobileComposeTracking(composeEl, opacityEl);
    const rect = composeEl.getBoundingClientRect();
    const badgeWidth = Math.max(1, state.badgeEl.offsetWidth || 52);
    const badgeHeight = Math.max(1, state.badgeEl.offsetHeight || 52);
    const safeDistance = 8;
    const gap = 10;
    const desiredLeft = rect.left + (rect.width - badgeWidth) / 2;
    const clampedLeft = Math.max(safeDistance, Math.min(window.innerWidth - badgeWidth - safeDistance, desiredLeft));
    const desiredBottom = window.innerHeight - rect.top + gap;
    const clampedBottom = Math.max(safeDistance, Math.min(window.innerHeight - badgeHeight - safeDistance, desiredBottom));

    state.rootEl.style.left = 'auto';
    state.rootEl.style.right = Math.max(safeDistance, window.innerWidth - clampedLeft - badgeWidth) + 'px';
    state.rootEl.style.bottom = clampedBottom + 'px';

    const inlineOpacity = parseFloat(opacityEl.style.opacity);
    const computedOpacity = parseFloat(getComputedStyle(opacityEl).opacity);
    const opacity = Math.max(0, Math.min(1,
      Number.isFinite(inlineOpacity) ? inlineOpacity : (Number.isFinite(computedOpacity) ? computedOpacity : 1)
    ));
    state.rootEl.style.setProperty('--xv-mobile-badge-opacity', String(opacity));
    state.rootEl.classList.toggle('BetterX-mobile-badge-inactive', opacity <= 0.05);
  }

  function scheduleMobileBadgeSync() {
    if (state.mobileBadgeRaf || !state.rootEl || !state.rootEl.classList.contains('BetterX-mobile')) return;
    state.mobileBadgeRaf = requestAnimationFrame(() => {
      state.mobileBadgeRaf = 0;
      syncMobileBadgeToComposeButton();
    });
  }

  function updatePanelPlacement() {
    if (!state.rootEl || !state.badgeEl || !state.panelEl) return;
    if (state.rootEl.classList.contains('BetterX-mobile')) {
      state.rootEl.classList.remove('BetterX-panel-right');
      state.panelEl.style.left = '';
      state.panelEl.style.right = '';
      state.panelEl.style.top = '';
      state.panelEl.style.bottom = '';
      return;
    }
    const rect = state.badgeEl.getBoundingClientRect();
    const panelWidth = Math.min(window.innerWidth * 0.94, 520);
    const safeDistance = 12;
    const maxLeft = Math.max(safeDistance, window.innerWidth - panelWidth - safeDistance);
    const preferredLeft = rect.left + panelWidth > window.innerWidth - safeDistance
      ? rect.right - panelWidth
      : rect.left;
    const panelLeft = Math.max(safeDistance, Math.min(maxLeft, preferredLeft));
    const alignRight = preferredLeft < rect.left;
    state.rootEl.classList.toggle('BetterX-panel-right', alignRight);
    state.panelEl.style.left = panelLeft + 'px';
    state.panelEl.style.right = 'auto';
    state.panelEl.style.top = safeDistance + 'px';
    state.panelEl.style.bottom = safeDistance + 'px';
  }

  function getMobileBadgeHandleTop(preferredTop) {
    const badgeHeight = Math.max(1, state.badgeEl ? state.badgeEl.offsetHeight : 74);
    const minTop = 12;
    const maxTop = Math.max(minTop, window.innerHeight - badgeHeight - 12);
    // 没有保存过拖动位置时，默认紧贴屏幕右侧的垂直中点。
    const fallbackTop = Math.round(window.innerHeight / 2 - badgeHeight / 2);
    const storedTop = state.settings.mobileBadgeHandleTop;
    // Number(null) 会得到 0；先判断原值，避免未拖动过的用户被错误放到屏幕顶部。
    const savedTop = Number.isFinite(preferredTop)
      ? Number(preferredTop)
      : (Number.isFinite(storedTop) ? Number(storedTop) : NaN);
    const desiredTop = Number.isFinite(savedTop) ? savedTop : fallbackTop;
    return Math.round(Math.max(minTop, Math.min(maxTop, desiredTop)));
  }

  function repositionBadge() {
    if (!state.badgeEl || !state.rootEl) return;
    const isMobile = isMobileBadgeViewport();
    const collapseMobileBadge = isMobile && (!!state.settings.hideAppBadge || !!state.settings.useMobileBadgeHandle);
    const hideDesktopBadge = !isMobile && !!state.settings.hideAppBadge;
    state.rootEl.classList.toggle('BetterX-desktop-badge-hidden', hideDesktopBadge);
    state.rootEl.classList.toggle('BetterX-mobile-badge-collapsed', collapseMobileBadge);
    const useIconBadge = isMobile || !!state.settings.useMobileBadgeOnDesktop;
    state.badgeEl.classList.toggle('mobile-mode', useIconBadge);
    state.badgeEl.classList.toggle('desktop-icon-mode', !isMobile && useIconBadge);
    state.badgeEl.setAttribute('aria-label', uiText(collapseMobileBadge ? '显示 BetterX 应用徽标' : '打开 BetterX 面板'));
    state.badgeEl.title = uiText(collapseMobileBadge ? '点按显示 BetterX 徽标' : '打开 BetterX 面板');
    if (isMobile) {
      state.rootEl.classList.add('BetterX-mobile');
      if (collapseMobileBadge) {
        stopMobileComposeTracking();
        state.rootEl.style.left = 'auto';
        state.rootEl.style.right = '0';
        state.rootEl.style.top = getMobileBadgeHandleTop() + 'px';
        state.rootEl.style.bottom = 'auto';
        state.rootEl.style.setProperty('--xv-mobile-badge-opacity', '1');
        state.rootEl.classList.remove('BetterX-mobile-badge-inactive');
      } else {
        state.rootEl.style.top = '';
        syncMobileBadgeToComposeButton();
      }
    } else {
      stopMobileComposeTracking();
      state.rootEl.classList.remove('BetterX-mobile');
      state.rootEl.classList.remove('BetterX-mobile-badge-collapsed');
      state.rootEl.classList.remove('BetterX-mobile-badge-inactive');
      state.rootEl.style.removeProperty('--xv-mobile-badge-opacity');
      state.rootEl.style.left = '';
      state.rootEl.style.right = '';
      state.rootEl.style.top = '';
      state.rootEl.style.bottom = '';
      applyBadgePos();
    }
    updatePanelPlacement();
    refreshBadge();
    scheduleDownloadUiRefresh();
  }

  function makeBadgeDraggable() {
    const badge = state.badgeEl;
    if (!badge) return;
    let startX = 0, startY = 0, origLeft = 0, origBottom = 0, dragging = false, moved = false;
    let mobilePointerId = null, mobileStartX = 0, mobileStartY = 0, mobileLongPressTimer = null;
    let mobileDragging = false, mobileCaptured = false;

    const clearMobileLongPress = () => {
      if (mobileLongPressTimer) clearTimeout(mobileLongPressTimer);
      mobileLongPressTimer = null;
    };

    badge.addEventListener('dragstart', (e) => e.preventDefault());
    badge.addEventListener('contextmenu', (e) => {
      if (state.rootEl && state.rootEl.classList.contains('BetterX-mobile-badge-collapsed')) e.preventDefault();
    });

    badge.addEventListener('pointerdown', (e) => {
      if (state.rootEl && state.rootEl.classList.contains('BetterX-mobile')) {
        if (!state.rootEl.classList.contains('BetterX-mobile-badge-collapsed')) return;
        mobilePointerId = e.pointerId;
        mobileStartX = e.clientX;
        mobileStartY = e.clientY;
        mobileDragging = false;
        mobileCaptured = false;
        clearMobileLongPress();
        mobileLongPressTimer = setTimeout(() => {
          if (mobilePointerId !== e.pointerId) return;
          mobileLongPressTimer = null;
          mobileDragging = true;
          try {
            badge.setPointerCapture(e.pointerId);
            mobileCaptured = true;
          } catch (err) {}
          state.suppressNextBadgeClick = true;
          badge.classList.add('is-mobile-dragging');
        }, 450);
        return;
      }
      dragging = true; moved = false;
      badge.classList.add('is-dragging');
      startX = e.clientX; startY = e.clientY;
      const rect = state.rootEl.getBoundingClientRect();
      origLeft = rect.left;
      origBottom = window.innerHeight - rect.bottom;
      try { badge.setPointerCapture(e.pointerId); } catch (err) {}
    });
    badge.addEventListener('pointermove', (e) => {
      if (mobilePointerId === e.pointerId) {
        if (!mobileDragging) {
          if (Math.abs(e.clientX - mobileStartX) > 10 || Math.abs(e.clientY - mobileStartY) > 10) {
            clearMobileLongPress();
            mobilePointerId = null;
          }
          return;
        }
        const badgeHeight = Math.max(1, badge.offsetHeight);
        const top = Math.max(12, Math.min(window.innerHeight - badgeHeight - 12, e.clientY - badgeHeight / 2));
        state.rootEl.style.top = Math.round(top) + 'px';
        return;
      }
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      if (!moved) return;
      const badgeWidth = Math.max(1, badge.offsetWidth);
      const badgeHeight = Math.max(1, badge.offsetHeight);
      const left = Math.max(4, Math.min(window.innerWidth - badgeWidth - 4, origLeft + dx));
      const bottom = Math.max(4, Math.min(window.innerHeight - badgeHeight - 4, origBottom - dy));
      state.rootEl.style.left = left + 'px';
      state.rootEl.style.bottom = bottom + 'px';
      updatePanelPlacement();
    });
    const end = (e) => {
      if (e && mobilePointerId === e.pointerId) {
        clearMobileLongPress();
        if (mobileDragging) {
          state.settings.mobileBadgeHandleTop = getMobileBadgeHandleTop(parseFloat(state.rootEl.style.top));
          queueDbWrite(async () => { await persistSettings(); });
        }
        if (mobileCaptured) {
          try { badge.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        mobilePointerId = null;
        mobileDragging = false;
        mobileCaptured = false;
        badge.classList.remove('is-mobile-dragging');
        return;
      }
      if (!dragging) return;
      dragging = false;
      badge.classList.remove('is-dragging');
      if (moved) {
        const rect = state.rootEl.getBoundingClientRect();
        state.settings.badgePos = { left: rect.left, bottom: window.innerHeight - rect.bottom };
        queueDbWrite(async () => { await persistSettings(); });
        badge.addEventListener('click', (ev) => { ev.stopImmediatePropagation(); ev.preventDefault(); }, { once: true, capture: true });
      }
    };
    badge.addEventListener('pointerup', end);
    badge.addEventListener('pointercancel', end);
  }

  function revealMobileBadge() {
    if (!isMobileBadgeViewport() || !state.settings.hideAppBadge) return false;
    setSettingsPartial({ hideAppBadge: false });
    showToast('已恢复应用徽标');
    return true;
  }

  function installMobileBadgeRevealGesture() {
    let edgeStart = null;
    document.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.pointerType === 'mouse' || !isMobileBadgeViewport() || !state.settings.hideAppBadge) return;
      if (event.clientX < window.innerWidth - 24) return;
      edgeStart = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startsOnBadge: !!(state.badgeEl && state.badgeEl.contains(event.target)),
      };
    }, true);
    document.addEventListener('pointerup', (event) => {
      if (!edgeStart || event.pointerId !== edgeStart.pointerId) return;
      const deltaX = edgeStart.x - event.clientX;
      const deltaY = Math.abs(edgeStart.y - event.clientY);
      const startsOnBadge = edgeStart.startsOnBadge;
      edgeStart = null;
      if (deltaX >= 32 && deltaY <= 80) {
        // 手势终点若落在半透明蓝色条上，浏览器随后仍会派发 click；拦住它以免恢复后又打开面板。
        state.suppressNextBadgeClick = startsOnBadge;
        revealMobileBadge();
      }
    }, true);
    document.addEventListener('pointercancel', () => { edgeStart = null; }, true);
  }

  const SETTING_REMOVE_ACTIONS = Object.freeze({
    'remove-keyword': ['keywords', 'data-keyword'],
    'remove-exclude-keyword': ['excludeKeywords', 'data-keyword'],
    'remove-adultspam-keyword': ['adultSpamKeywords', 'data-keyword'],
    'remove-adultspam-whitelist': ['adultSpamWhitelist', 'data-username'],
  });
  function dispatchSettingRemoveAction(action, actionEl) {
    const [settingKey, dataAttribute] = SETTING_REMOVE_ACTIONS[action] || [];
    if (!settingKey) return false;
    const value = actionEl.getAttribute(dataAttribute) || '';
    setSettingsPartial({
      [settingKey]: (state.settings[settingKey] || []).filter((item) => item !== value),
    });
    return true;
  }

  const PANEL_ACTION_HANDLERS = Object.freeze({
    'set-panel-view': ({ el }) => setPanelView(el.getAttribute('data-view')),
    'sync-notification-users': () => syncNotificationSubscriptions(),
    'search-notification-users': () => applyNotificationSearch(),
    'toggle-notification-pin': ({ el }) => toggleNotificationSubscriptionPinned(el.getAttribute('data-username') || ''),
    'toggle-notification-user': ({ el }) => updateNotificationSubscription(
      el.getAttribute('data-username') || '', el.getAttribute('data-enabled') === 'true'
    ),
    'forget-notification-user': ({ el }) => removeRememberedNotificationSubscription(el.getAttribute('data-username') || ''),
    'menu-toggle': () => { if (state.menuEl) state.menuEl.hidden = !state.menuEl.hidden; },
    close: () => togglePanel(false),
    refresh: () => { scanArticles(document); refreshUI(); },
    'switch-language': () => showLanguageDialog(),
    export: () => exportPosts(), backup: () => backupAll(),
    import: () => state.importInputEl.click(), 'clear-non-fav': () => clearNonFavoritePosts(),
    'set-filter': ({ el }) => setSettingsPartial({ filter: el.getAttribute('data-filter') }),
    'toggle-skip': ({ el }) => {
      const key = el.getAttribute('data-skip');
      const current = state.settings.skipSources || [];
      setSettingsPartial({ skipSources: current.includes(key)
        ? current.filter((item) => item !== key) : [...current, key] });
    },
    'save-keywords': () => { if (!commitKeywordInput().rejected) showToast('✅ 已保存关键词'); },
    'save-exclude': () => { if (!commitExcludeKeywordInput().rejected) showToast('✅ 已保存排除词'); },
    'save-adultspam-keywords': () => { commitAdultSpamKeywordInput(); showToast('✓ 已保存自定义屏蔽词'); },
    'save-adultspam-whitelist': () => { commitAdultSpamWhitelistInput(); showToast('✓ 已保存账号白名单'); },
    'load-more': () => {
      state.renderLimit = (state.renderLimit || state.settings.pageSize || 60) + (state.settings.pageSize || 60);
      refreshUI({ keepScroll: true });
    },
    'toggle-expand': ({ id }) => {
      if (state.expandedPosts.has(id)) state.expandedPosts.delete(id); else state.expandedPosts.add(id);
      refreshUI({ keepScroll: true });
    },
    'save-note': ({ id }) => {
      const input = state.listEl.querySelector(`.BetterX-note-input[data-id="${id}"]`);
      updatePostNote(id, input ? input.value.trim() : '');
    },
    'cancel-note': () => { state.editingNoteId = null; refreshUI({ keepScroll: true }); },
    open: ({ id }) => openRecordedPost(getPostById(id)),
    pin: ({ id }) => togglePin(id), fav: ({ id }) => toggleFavorite(id), delete: ({ id }) => deletePost(id),
  });
  function dispatchPanelAction(action, actionEl, id) {
    if (dispatchSettingRemoveAction(action, actionEl)) return true;
    const handler = PANEL_ACTION_HANDLERS[action];
    if (!handler) return false;
    handler({ el: actionEl, id });
    return true;
  }

  const PANEL_ELEMENT_IDS = Object.freeze({
    listEl: 'list', summaryEl: 'summary', filterBarEl: 'filter-bar',
    quickFilterDetailsEl: 'quick-filter', quickFilterStateEl: 'quick-filter-state',
    keywordInputEl: 'keywords', keywordTagsEl: 'keyword-tags', excludeInputEl: 'exclude',
    excludeKeywordTagsEl: 'exclude-keyword-tags', searchEl: 'search', sortHintEl: 'sort-hint',
    autoCleanInputEl: 'autoclean', maxPostsInputEl: 'maxposts', flashMsInputEl: 'flashms',
    skipSourcesEl: 'skip-sources', adultSpamKeywordsEl: 'adultspam-keywords',
    adultSpamKeywordTagsEl: 'adultspam-keyword-tags', adultSpamWhitelistEl: 'adultspam-whitelist',
    adultSpamWhitelistTagsEl: 'adultspam-whitelist-tags', adultSpamCountEl: 'adultspam-count',
    notificationListEl: 'notification-list', notificationStatusEl: 'notification-status',
    notificationSearchEl: 'notification-search', timelineWidthEl: 'timeline-width',
    leftbarWidthEl: 'leftbar-width', firefoxCompatibilityEl: 'firefox-compat',
    hideAppBadgeEl: 'hide-app-badge', postLimitWarningEl: 'post-limit-warning',
    useMobileBadgeHandleEl: 'mobile-badge-handle', menuEl: 'menu',
  });
  function bindPanelElements(panel) {
    for (const [stateKey, id] of Object.entries(PANEL_ELEMENT_IDS)) {
      state[stateKey] = panel.querySelector(`#BetterX-${id}`);
    }
  }

  function bindSettingsControls(panel) {
    for (const [settingKey, definition] of Object.entries(SETTINGS_SCHEMA)) {
      const [stateKey, selector, property] = definition.control || [];
      if (!stateKey || !selector || !property) continue;
      const control = panel.querySelector(selector);
      state[stateKey] = control;
      if (!control) continue;
      control.addEventListener('change', () => {
        const value = property === 'checked' ? !!control.checked : control.value;
        setSettingsPartial({ [settingKey]: value });
      });
    }
  }

  function syncSettingsControls() {
    for (const [settingKey, definition] of Object.entries(SETTINGS_SCHEMA)) {
      const [stateKey, , property] = definition.control || [];
      if (!stateKey || !property) continue;
      const control = state[stateKey];
      if (!control) continue;
      const value = state.settings[settingKey] ?? definition.default;
      control[property] = property === 'checked' ? !!value : String(value);
    }
  }

  function syncInactiveInput(control, value) {
    if (control && document.activeElement !== control) control.value = String(value);
  }

  function syncControlProperties(entries) {
    for (const [control, property, value] of entries) {
      if (control) control[property] = value;
    }
  }

  function readIntegerSetting(control, settingKey, scale = 1, fallbackOverride) {
    const definition = SETTINGS_SCHEMA[settingKey];
    const [, minimum, maximum] = definition.validate;
    const fallback = fallbackOverride ?? state.settings[settingKey] ?? definition.default;
    return clampInt(
      control?.value,
      Math.ceil(minimum / scale),
      Math.floor(maximum / scale),
      Math.round(fallback / scale)
    ) * scale;
  }

  // ── 创建 UI ─────────────────────────────────────────────────────
