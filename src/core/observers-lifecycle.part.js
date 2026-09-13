  function startViewObserver() {
    if (state.viewObserver) state.viewObserver.disconnect();
    state.viewedArticleIds = new WeakMap();
    if (typeof IntersectionObserver !== 'function') {
      state.viewObserver = null;
      return;
    }
    state.viewObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.15) continue;
        const article = entry.target;
        const id = state.viewedArticleIds.get(article)
          || extractStatusIdFromUrl(getStatusLink(article));
        if (id) markPostViewed(id);
      }
    }, {
      // 仅在帖子真正进入主视区后记录；15% 同时兼顾长帖和普通帖。
      threshold: [0.15],
    });
  }

  function startObserver() {
    if (state.observer) state.observer.disconnect();
    startViewObserver();
    const throttledDisappear = throttle(checkDisappearedPosts, 400);
    const throttledAdultSpamCount = throttle(updateAdultSpamCount, 300);
    const throttledLayoutRefresh = throttle(applyLayoutEnhancements, 250);
    const pendingRoots = new Set();
    const collectArticlesFromRoot = (root, articles) => {
      if (!root || !root.isConnected || root.closest('#BetterX-root')) return;
      if (root.matches('article')) { articles.add(root); return; }
      const parentArticle = root.closest('article');
      if (parentArticle) { articles.add(parentArticle); return; }
      root.querySelectorAll('article').forEach((article) => articles.add(article));
    };
    const flushAddedRoots = debounce(() => {
      const articles = new Set();
      let layoutNeedsFullRefresh = false;
      const deferAutoExpand = state.settings.autoExpandPostText && isPageScrollBusy();
      for (const root of pendingRoots) {
        collectArticlesFromRoot(root, articles);
        if (layoutEnhancementsActive()) {
          applyLayoutDomCleanup(root);
          if (layoutRootAffectsStructure(root)) layoutNeedsFullRefresh = true;
        }
      }
      pendingRoots.clear();
      for (const article of articles) {
        captureArticle(article);
        if (state.settings.mediaDownload) injectDownloadButtons(article);
        if (state.settings.restoreMediaGrid) applyMediaGridLayout(article);
        if (state.settings.bypassAgeRestriction) revealAgeRestricted(article);
        // 向下滚动时 X 通过虚拟列表异步插入帖子；这里是首屏 scanArticles 之外的增量入口。
        if (state.settings.autoExpandPostText && !deferAutoExpand) expandPostShowMore(article);
      }
      if (deferAutoExpand) schedulePostShowMoreExpansion();
      if (adultSpamFilteringEnabled()) throttledAdultSpamCount();
      if (layoutNeedsFullRefresh) throttledLayoutRefresh();
    }, 100);
    state.observer = new MutationObserver((mutations) => {
      let hadRemoval = false;
      const immediateAdultArticles = new Set();
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.id === 'BetterX-root' || node.closest && node.closest('#BetterX-root')) continue;
          if (state.settings.hideAds) sweepStandaloneAds(node);
          harvestFollowingControlsFromRoot(node);
          pendingRoots.add(node);
          if (adultSpamFilteringEnabled()) collectArticlesFromRoot(node, immediateAdultArticles);
        }
        if (adultSpamFilteringEnabled() && mutation.addedNodes.length && mutation.target instanceof HTMLElement) {
          // 正文可能以 Text 节点分步补入；同时检查 mutation.target，确保内容补全后仍能在本帧重判。
          collectArticlesFromRoot(mutation.target, immediateAdultArticles);
        }
        if (mutation.removedNodes && mutation.removedNodes.length) {
          hadRemoval = true;
          for (const node of mutation.removedNodes) unobserveArticleViews(node);
        }
      }
      if (immediateAdultArticles.size) {
        // MutationObserver 在浏览器绘制前执行；立即过滤可避免新黄推先闪现 100ms 再消失。
        // 用户正在滚动时不读取锚点、更不主动改写 scrollY；让触控惯性与 X 虚拟列表保持主导。
        const anchors = isPageScrollBusy() ? null : captureAdultSpamScrollAnchors();
        let layoutChanged = false;
        for (const article of immediateAdultArticles) {
          const outcome = {};
          evaluateAndApplyAdultSpam(article, outcome, true);
          if (outcome.changed) layoutChanged = true;
        }
        if (layoutChanged && anchors) stabilizeAdultSpamScroll(anchors);
      }
      if (hadRemoval) {
        throttledDisappear();
        if (adultSpamFilteringEnabled()) throttledAdultSpamCount();
      }
      if (pendingRoots.size) flushAddedRoots();
      if (state.rootEl && state.rootEl.classList.contains('BetterX-mobile')) scheduleMobileBadgeSync();
    });
    // X 是 SPA，主时间线容器会被整体替换；保留 body 作为稳定根节点，但把重活批量延后并按 article 去重。
    state.observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopCleanupTimer() {
    if (!state.cleanupTimer) return;
    clearInterval(state.cleanupTimer);
    state.cleanupTimer = null;
  }

  function installCleanupTimer() {
    stopCleanupTimer();
    if (document.hidden) return;
    state.cleanupTimer = setInterval(checkDisappearedPosts, CLEANUP_INTERVAL_MS);
  }

  function stopNetworkHookTimer() {
    if (!state.networkHookTimer) return;
    clearInterval(state.networkHookTimer);
    state.networkHookTimer = null;
  }

  function installNetworkHookTimer() {
    stopNetworkHookTimer();
    if (document.hidden) return;
    installNetworkHooks();
    state.networkHookTimer = setInterval(installNetworkHooks, NETWORK_HOOK_CHECK_INTERVAL_MS);
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stopCleanupTimer();
      stopNetworkHookTimer();
    }
    else {
      checkDisappearedPosts();
      installCleanupTimer();
      installNetworkHookTimer();
    }
  }

  async function loadStateFromDb() {
    const savedSettings = await dbGetSetting('settings');
    const mirroredSettings = readSettingsMirror();
    const hasDbSettings = !!(savedSettings && typeof savedSettings === 'object' && !Array.isArray(savedSettings));
    const sourceSettings = hasDbSettings ? savedSettings : mirroredSettings;
    if (sourceSettings && typeof sourceSettings === 'object') {
      const migratedSettings = migrateSettingsDefaults(sourceSettings);
      state.settings = sanitizeSettings(migratedSettings);
      // IndexedDB 缺失时从油猴存储自动恢复；版本迁移后也同步回两处。
      if (!hasDbSettings || Number(sourceSettings.settingsRevision || 0) < DEFAULT_SETTINGS.settingsRevision) {
        await dbPutSetting('settings', state.settings);
      }
      writeSettingsMirror(state.settings);
    } else {
      // 首次安装也建立一份镜像，后续即使 x.com 网站数据被清理仍有恢复来源。
      state.settings = sanitizeSettings(state.settings);
      writeSettingsMirror(state.settings);
    }
    if (IS_FIREFOX) {
      if (firefoxCompatibilityMode === 'compat' || firefoxCompatibilityMode === 'normal') {
        const compatibilityEnabled = firefoxCompatibilityMode === 'compat';
        const needsSync = state.settings.firefoxCompatibility !== compatibilityEnabled
          || !state.settings.firefoxCompatibilityPrompted;
        state.settings.firefoxCompatibility = compatibilityEnabled;
        state.settings.firefoxCompatibilityPrompted = true;
        if (needsSync) {
          const sanitized = sanitizeSettings(state.settings);
          writeSettingsMirror(sanitized);
          await dbPutSetting('settings', sanitized);
        }
      } else if (state.settings.firefoxCompatibilityPrompted) {
        // 从仅有 IndexedDB 设置的旧安装补写 document-start 可读取的启动标记。
        writeFirefoxCompatibilityMode(state.settings.firefoxCompatibility ? 'compat' : 'normal');
      }
    }
    const persistedFollowedHandles = state.settings.knownFollowedHandles || [];
    persistedFollowedHandles.forEach((handle) => followedHandles.add(handle));
    trimFollowedHandlesToMax();
    // document-start 的网络 Hook 可能先于 IndexedDB 完成并学到订阅状态；
    // 载入持久数据后再把这批早期结果合并回来，避免启动竞态覆盖新信息。
    const earlyNotificationSubscriptions = new Map(notificationSubscriptions);
    notificationSubscriptions.clear();
    for (const item of state.settings.notificationSubscriptions || []) {
      const sanitized = sanitizeNotificationSubscription(item);
      if (sanitized) notificationSubscriptions.set(sanitized.username.toLowerCase(), sanitized);
    }
    for (const [key, item] of earlyNotificationSubscriptions) notificationSubscriptions.set(key, item);
    state.settingsLoaded = true;
    if (earlyNotificationSubscriptions.size) scheduleNotificationSubscriptionsPersist();
    if (followedHandles.size !== persistedFollowedHandles.length) scheduleFollowedHandlesPersist();
    const rawPosts = (await dbGetAllPosts()).filter(Boolean);
    const all = rawPosts.map(sanitizeImportedPost).filter(Boolean)
      .sort((a, b) => (b.lastCapturedAt || 0) - (a.lastCapturedAt || 0));
    if (all.length !== rawPosts.length) debugLog('已忽略', rawPosts.length - all.length, '条无效本地记录');
    state.posts = all;
    await enforceMaxPosts();
  }
