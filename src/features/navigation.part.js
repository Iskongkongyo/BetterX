  const layoutScrollPositions = new Map();
  let layoutNavigationToken = 0;

  function usesExpandedLayout() {
    return !!(state.settings.layoutEnabled && (
      state.settings.layoutFillCenter
      || state.settings.layoutHideLeftbar
      || state.settings.layoutHideSidebar
    ));
  }

  function getTopVisibleStatusAnchor() {
    const { primary } = getLayoutElements();
    if (!primary) return null;
    const visible = [...primary.querySelectorAll('article[data-testid="tweet"], article')]
      .map((article) => ({ article, rect: article.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight)
      .sort((a, b) => a.rect.top - b.rect.top)[0];
    if (!visible) return null;
    const statusId = extractStatusIdFromUrl(getStatusLink(visible.article));
    return statusId ? { statusId: String(statusId), top: visible.rect.top } : null;
  }

  function rememberLayoutScrollPosition(url) {
    if (!usesExpandedLayout() || !url) return;
    layoutScrollPositions.set(url, {
      y: Math.max(0, window.scrollY || 0),
      anchor: getTopVisibleStatusAnchor(),
    });
    while (layoutScrollPositions.size > 20) {
      layoutScrollPositions.delete(layoutScrollPositions.keys().next().value);
    }
  }

  function findStatusArticle(statusId) {
    if (!statusId) return null;
    const { primary } = getLayoutElements();
    if (!primary) return null;
    return [...primary.querySelectorAll('article[data-testid="tweet"], article')].find((article) => (
      extractStatusIdFromUrl(getStatusLink(article)) === String(statusId)
    )) || null;
  }

  function restoreLayoutScrollPosition(saved, restoreState) {
    if (!saved || !usesExpandedLayout()) return;
    if (!restoreState.anchorFound) window.scrollTo(0, saved.y);
    if (!saved.anchor) return;
    const article = findStatusArticle(saved.anchor.statusId);
    if (!article) return;
    const delta = article.getBoundingClientRect().top - saved.anchor.top;
    if (Math.abs(delta) > 1) window.scrollBy(0, delta);
    restoreState.anchorFound = true;
  }

  function scheduleNavigationRefresh(savedPosition) {
    const token = ++layoutNavigationToken;
    const restoreState = { anchorFound: false };
    [0, 60, 180, 420, 800].forEach((delay, index) => {
      setTimeout(() => {
        if (token !== layoutNavigationToken) return;
        applyLayoutEnhancements();
        if (savedPosition) restoreLayoutScrollPosition(savedPosition, restoreState);
        if (index >= 2) scanArticles(document);
      }, delay);
    });
  }

  function getConfiguredProfileDefaultView() {
    // document-start 阶段 IndexedDB 尚未就绪，优先读取同步可用的 GM 设置镜像；
    // 正常运行后则使用内存设置，让刚改完下拉框的下一次点击立即生效。
    const settings = state.settingsLoaded ? state.settings : (readSettingsMirror() || DEFAULT_SETTINGS);
    if (settings.profileDefaultViewEnabled === false) return 'posts';
    return PROFILE_DEFAULT_VIEW_OPTIONS.includes(settings.profileDefaultView)
      ? settings.profileDefaultView
      : DEFAULT_SETTINGS.profileDefaultView;
  }

  function getConfiguredProfilePostSort() {
    const settings = state.settingsLoaded ? state.settings : (readSettingsMirror() || DEFAULT_SETTINGS);
    if (settings.profilePostSortEnabled === false) return 'recent';
    return PROFILE_POST_SORT_OPTIONS.includes(settings.profilePostSort)
      ? settings.profilePostSort
      : DEFAULT_SETTINGS.profilePostSort;
  }

  function readProfileDefaultViewRedirectGuard() {
    try {
      const raw = sessionStorage.getItem(PROFILE_DEFAULT_VIEW_REDIRECT_GUARD_KEY);
      const guard = raw ? JSON.parse(raw) : null;
      if (!guard || typeof guard !== 'object'
          || !/^[a-z0-9_]{1,15}$/i.test(guard.handle || '')
          || !PROFILE_DEFAULT_VIEW_OPTIONS.includes(guard.view)
          || !Number.isFinite(guard.createdAt)
          || now() - guard.createdAt > PROFILE_DEFAULT_VIEW_REDIRECT_GUARD_MS) {
        if (raw) sessionStorage.removeItem(PROFILE_DEFAULT_VIEW_REDIRECT_GUARD_KEY);
        return null;
      }
      return {
        ...guard,
        sort: PROFILE_POST_SORT_OPTIONS.includes(guard.sort) ? guard.sort : DEFAULT_SETTINGS.profilePostSort,
      };
    } catch (err) { return null; }
  }

  function armProfileDefaultViewRedirectGuard(handle, view, sort) {
    try {
      sessionStorage.setItem(PROFILE_DEFAULT_VIEW_REDIRECT_GUARD_KEY, JSON.stringify({
        handle: String(handle || '').toLowerCase(), view,
        sort: PROFILE_POST_SORT_OPTIONS.includes(sort) ? sort : DEFAULT_SETTINGS.profilePostSort,
        createdAt: now(),
      }));
    } catch (err) {}
  }

  function consumeProfileDefaultViewRedirectGuard(handle, view, sort) {
    const guard = readProfileDefaultViewRedirectGuard();
    const normalizedSort = PROFILE_POST_SORT_OPTIONS.includes(sort) ? sort : DEFAULT_SETTINGS.profilePostSort;
    if (!guard || guard.handle !== String(handle || '').toLowerCase()
        || guard.view !== view || guard.sort !== normalizedSort) return false;
    try { sessionStorage.removeItem(PROFILE_DEFAULT_VIEW_REDIRECT_GUARD_KEY); } catch (err) {}
    return true;
  }

  function getBareProfileHandle(pathname) {
    const normalizedPath = String(pathname == null ? location.pathname : pathname)
      .replace(/^\/+|\/+$/g, '');
    if (!normalizedPath || normalizedPath.includes('/')) return '';
    let handle = '';
    try { handle = decodeURIComponent(normalizedPath); } catch (err) { return ''; }
    if (!/^[a-z0-9_]{1,15}$/i.test(handle)) return '';
    if (PROFILE_ROOT_ROUTE_EXCLUSIONS.has(handle.toLowerCase())) return '';
    return handle;
  }

  function applyPreferredProfileViewToUrl(targetUrl, handle, view, sort) {
    const isMediaView = view === 'video' || view === 'photo';
    if (isMediaView) targetUrl.pathname = `/${handle}/media`;
    else targetUrl.pathname = view === 'posts' ? `/${handle}` : `/${handle}/${view}`;

    // X 的视频与图片共用 /media；图片由 filter=photo 区分。
    // 媒体页不支持主页帖子热门排序，避免拼出无效的 sort + filter 组合。
    if (view === 'photo') targetUrl.searchParams.set('filter', 'photo');
    else if (isMediaView) targetUrl.searchParams.delete('filter');
    if (!isMediaView && sort === 'popular') targetUrl.searchParams.set('sort', 'popular');
    else targetUrl.searchParams.delete('sort');
    return targetUrl;
  }

  function getPreferredProfileViewUrl(rawUrl) {
    const view = getConfiguredProfileDefaultView();
    const sort = getConfiguredProfilePostSort();
    if (view === 'posts' && sort === 'recent') return '';
    let targetUrl;
    try { targetUrl = new URL(rawUrl, location.href); } catch (err) { return ''; }
    if (!/^(?:x|twitter)\.com$/i.test(targetUrl.hostname)) return '';
    const handle = getBareProfileHandle(targetUrl.pathname);
    if (!handle) return '';
    applyPreferredProfileViewToUrl(targetUrl, handle, view, sort);
    return targetUrl.href;
  }

  function navigateToPreferredProfileView(targetUrl, replace) {
    try {
      const method = replace ? 'replaceState' : 'pushState';
      history[method](history.state, '', targetUrl);
      // document-start 时 X 尚未启动，改写 URL 后让它首次读取正确页签即可；
      // 已启动时主动通知路由器，避免整页刷新出现黑色开屏。
      if (document.readyState !== 'loading') {
        const event = typeof PopStateEvent === 'function' ? new PopStateEvent('popstate') : new Event('popstate');
        window.dispatchEvent(event);
      }
      return true;
    } catch (err) {
      try {
        if (replace) location.replace(targetUrl);
        else location.assign(targetUrl);
      } catch (fallbackError) {}
      return false;
    }
  }

  function isExplicitProfileTabLink(link) {
    return !!(link && (link.getAttribute('role') === 'tab' || link.closest('[role="tab"]')));
  }

  function isProfileLinkRewriteExcludedTarget(target) {
    return !!(target && target.closest && target.closest(PROFILE_LINK_REWRITE_EXCLUSION_SELECTOR));
  }

  function armProfileNavigationBypassGuard() {
    try {
      sessionStorage.setItem(
        PROFILE_NAVIGATION_BYPASS_GUARD_KEY,
        String(now() + PROFILE_NAVIGATION_BYPASS_GUARD_MS)
      );
    } catch (err) {}
  }

  function shouldBypassProfileNavigationRedirect() {
    try {
      const expiresAt = Number(sessionStorage.getItem(PROFILE_NAVIGATION_BYPASS_GUARD_KEY));
      if (Number.isFinite(expiresAt) && expiresAt > now()) return true;
      sessionStorage.removeItem(PROFILE_NAVIGATION_BYPASS_GUARD_KEY);
    } catch (err) {}
    return false;
  }

  function getSearchResultProfileHandle(resultContainer) {
    if (!resultContainer || !resultContainer.querySelector) return '';
    const avatar = resultContainer.querySelector('[data-testid^="UserAvatar-Container-"]');
    const avatarTestId = avatar ? (avatar.getAttribute('data-testid') || '') : '';
    const avatarMatch = avatarTestId.match(/^UserAvatar-Container-([a-z0-9_]{1,15})$/i);
    if (avatarMatch && !PROFILE_ROOT_ROUTE_EXCLUSIONS.has(avatarMatch[1].toLowerCase())) return avatarMatch[1];

    // 搜索联想项目前是没有 href 的 button；头像 testid 取不到时，再从独立的 @用户名文本兜底。
    const handleMatch = String(resultContainer.innerText || resultContainer.textContent || '')
      .match(/(?:^|\s)@([a-z0-9_]{1,15})(?=\s|$)/i);
    return handleMatch && !PROFILE_ROOT_ROUTE_EXCLUSIONS.has(handleMatch[1].toLowerCase())
      ? handleMatch[1]
      : '';
  }

  function getProfileTargetFromClickTarget(target) {
    if (!target || !target.closest) return null;
    if (isProfileLinkRewriteExcludedTarget(target)) return null;
    const directLink = target.closest('a[href]');
    const directHandle = directLink ? getBareProfileHandle(directLink.pathname) : '';
    if (directHandle) return { link: directLink, handle: directHandle, url: directLink.href };

    const resultContainer = target.closest('[data-testid="UserCell"], [data-testid="typeaheadResult"]');
    if (!resultContainer) return null;
    // PC 的 UserCell 自身就是 button；移动端探索页则是 typeaheadResult 包住 TypeaheadUser 主按钮。
    // 只放行这两个“打开用户”的主控件，继续排除内部额外嵌套的关注、菜单和表单控件。
    const interactive = target.closest('button, [role="button"], [role="menuitem"], input, select, textarea');
    const interactiveTestId = interactive ? (interactive.getAttribute('data-testid') || '') : '';
    const isPrimaryResultControl = interactive === resultContainer
      || interactiveTestId === 'UserCell'
      || interactiveTestId === 'TypeaheadUser';
    if (interactive && !isPrimaryResultControl) return null;

    const nestedLink = [...resultContainer.querySelectorAll('a[href]')].find((candidate) => (
      !!getBareProfileHandle(candidate.pathname)
    ));
    if (nestedLink) {
      return { link: nestedLink, handle: getBareProfileHandle(nestedLink.pathname), url: nestedLink.href };
    }
    const handle = getSearchResultProfileHandle(resultContainer);
    return handle
      ? { link: null, handle, url: new URL(`/${handle}`, location.origin).href }
      : null;
  }

  function redirectBareProfileToPreferredView() {
    const view = getConfiguredProfileDefaultView();
    const sort = getConfiguredProfilePostSort();
    // “帖子 + 最近”就是 X 的用户主页默认状态，无需额外改写 URL。
    if (view === 'posts' && sort === 'recent') return false;
    const handle = getBareProfileHandle();
    if (!handle) return false;
    // 账号切换可能先导航到目标账号的 /用户名，再由 X 完成登录态切换；即使中途整页重载，
    // sessionStorage 中的短期标记也会阻止 BetterX 把该中间地址再次改写为 /all。
    if (shouldBypassProfileNavigationRedirect()) return false;

    // X 在目标页签不可用时会自行回退到 /用户名；消费本次跳转的短期标记后停留在“帖子”，避免来回跳转。
    if (consumeProfileDefaultViewRedirectGuard(handle, view, sort)) return false;

    const targetUrl = new URL(location.href);
    applyPreferredProfileViewToUrl(targetUrl, handle, view, sort);
    if (targetUrl.href === new URL(location.href).href) return false;
    // replaceState 不会把“纯主页”留在历史记录里，按返回键时也不会来回重定向。
    armProfileDefaultViewRedirectGuard(handle, view, sort);
    navigateToPreferredProfileView(targetUrl.href, true);
    return true;
  }

  function installProfileDefaultViewLinkRewrite() {
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!target || !target.closest) return;
      if (isProfileLinkRewriteExcludedTarget(target)) {
        armProfileNavigationBypassGuard();
        return;
      }
      // 账号切换弹层实际使用 HoverCard + 无 href 的 UserCell，而不是 role="menu"。
      // 点击左下角账号按钮时已经设置短期标记；这里必须在解析 UserCell 之前读取它，
      // 否则会把“切换账号”误接管成 /目标账号/all 的普通主页导航。
      if (shouldBypassProfileNavigationRedirect()) return;
      const profileTarget = getProfileTargetFromClickTarget(target);
      if (!profileTarget) return;
      const { link, handle } = profileTarget;
      if (link && link.hasAttribute('download')) return;
      const view = getConfiguredProfileDefaultView();
      const sort = getConfiguredProfilePostSort();
      // 用户点击个人主页的“帖子”页签是明确选择，跳过一次默认页签重定向。
      if (handle && (view !== 'posts' || sort !== 'recent') && link && isExplicitProfileTabLink(link)) {
        armProfileDefaultViewRedirectGuard(handle, view, sort);
        return;
      }
      const preferredUrl = getPreferredProfileViewUrl(profileTarget.url);
      // 某些 X SPA 路由会在事件开始时缓存原 href，单纯改写属性可能仍打开“帖子”页。
      // 搜索联想的 UserCell 甚至没有 href；必须在 X 先初始化“帖子”页之前接管点击。
      if (preferredUrl && (!link || link.href !== preferredUrl)) {
        if (!handle) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        armProfileDefaultViewRedirectGuard(handle, view, sort);
        navigateToPreferredProfileView(preferredUrl, false);
      }
    }, true);
  }

  function installNavigationListener() {
    let lastUrl = location.href;
    const onNav = (restorePosition) => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        if (redirectBareProfileToPreferredView()) return;
        installNetworkHooks();
        scheduleNavigationRefresh(restorePosition ? layoutScrollPositions.get(lastUrl) : null);
      }
    };
    window.addEventListener('popstate', () => {
      rememberLayoutScrollPosition(lastUrl);
      onNav(true);
    });
    const origPush = history.pushState;
    history.pushState = function (...args) {
      const previousUrl = location.href;
      rememberLayoutScrollPosition(previousUrl);
      const r = origPush.apply(this, args);
      onNav(false);
      return r;
    };
    const origReplace = history.replaceState;
    history.replaceState = function (...args) {
      const previousUrl = location.href;
      rememberLayoutScrollPosition(previousUrl);
      const r = origReplace.apply(this, args);
      onNav(false);
      return r;
    };
  }
  // ── 启动 ──────────────────────────────────────────────────────
