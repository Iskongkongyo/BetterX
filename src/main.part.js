  async function boot() {
    installPageScrollActivityTracking();
    try { installStyles(); } catch (err) { console.error('[BetterX] style init failed:', err); }
    createUI();
    // 数据库升级被其他 X 标签页阻塞时也必须立即保留面板入口与恢复快捷键。
    document.addEventListener('keydown', handleKeydown, true);
    applyTheme();
    try {
      await openDb();
      await loadStateFromDb();
    } catch (err) {
      console.error('[BetterX] DB init failed:', err);
    }
    bumpKeywordCache();
    resetPaging();
    applyTheme();
    repositionBadge();
    refreshUI();
    redirectBareProfileToPreferredView();
    harvestFollowingControlsFromRoot(document);
    startObserver();
    scanArticles(document);
    applyAdHiding();
    applyAdultSpamFiltering();
    applyMediaDownload();
    applyMediaGridLayout();
    applyAgeBypass();
    applyLayoutEnhancements();
    installCleanupTimer();
    installNetworkHookTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    installNavigationListener();
    await runAutoClean();
    setTimeout(maybePromptFirefoxCompatibility, 250);
    // 先让首次 Firefox 兼容询问获得展示机会；若其仍打开，容量提醒会自行延后。
    setTimeout(() => {
      postLimitWarningReady = true;
      maybeShowPostLimitWarning();
    }, 600);

    const throttledReposition = throttle(repositionBadge, 500);
    const throttledLayoutResize = throttle(applyLayoutEnhancements, 250);
    // 徽标只需跟随浮动发帖按钮的大致位置；限制到约 12 FPS，避免移动端滚动时逐帧强制布局。
    const handleMobileBadgeViewportChange = throttle(scheduleMobileBadgeSync, 80);
    window.addEventListener('resize', throttledReposition);
    window.addEventListener('resize', throttledLayoutResize);
    window.addEventListener('scroll', handleMobileBadgeViewportChange, { passive: true });
    document.addEventListener('scroll', handleMobileBadgeViewportChange, { passive: true, capture: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleMobileBadgeViewportChange, { passive: true });
      window.visualViewport.addEventListener('scroll', handleMobileBadgeViewportChange, { passive: true });
    }
    document.addEventListener('click', handleDocumentClick, true);
    if (window.matchMedia) {
      try {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
          if ((state.settings.theme || 'auto') === 'auto') applyTheme();
        });
      } catch (err) {}
    }
    debugLog('v3.4.0 started');
  }

  function waitForPageReady() {
    if (document.body) { boot(); return; }
    const timer = setInterval(() => {
      if (document.body) { clearInterval(timer); boot(); }
    }, 100);
  }

  // document-start 先改写当前 URL，让 X 首次启动时直接读取目标页签，避免黑色开屏。
  redirectBareProfileToPreferredView();
  installProfileDefaultViewLinkRewrite();
  registerMenuCommands();
  installNetworkHooks();
  waitForPageReady();
})();
