  // 作者链接入口与布局参考 LolipopJ 的 PR #3：https://github.com/Iskongkongyo/BetterX/pull/3
  const AUTHOR_LINKS_ROUTE = /^\/([a-z0-9_]{1,15})\/status\/(\d+)(\/photo\/\d+)?\/?$/i;
  const AUTHOR_LINKS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const AUTHOR_LINKS_EMPTY_TTL_MS = 60 * 60 * 1000;
  const AUTHOR_LINKS_RETRY_DELAYS = [1000, 4000];
  const AUTHOR_GROK_BUTTON = 'button:is([aria-label*="Grok" i], [data-testid*="grok" i])';
  const AUTHOR_LINK_SITE_LOGOS = [
    ['pixiv.net', 'pixiv/0096FA'],
    ['weibo.com', 'sinaweibo/FF8200'],
    ['weibo.cn', 'sinaweibo/FF8200'],
    ['bilibili.com', 'bilibili/00AEEC'],
    ['b23.tv', 'bilibili/00AEEC'],
    ['youtube.com', 'youtube/FF0033'],
    ['youtu.be', 'youtube/FF0033'],
    ['instagram.com', 'instagram/FF0069'],
    ['tiktok.com', 'tiktok/FE2C55'],
    ['twitch.tv', 'twitch/9146FF'],
    ['patreon.com', 'patreon/FF424D'],
    ['ko-fi.com', 'kofi/FF5A16'],
    ['linktr.ee', 'linktree/43E660'],
    ['bsky.app', 'bluesky/0285FF'],
    ['github.com', 'github/6E7781'],
  ];
  const authorLinksRequests = new Map();
  const authorLinksCache = new Map();
  let authorLinksView = null;
  let authorLinksLifecycleInstalled = false;

  async function loadAuthorProfileLinks(screenName) {
    screenName = screenName.toLowerCase();
    const pending = authorLinksRequests.get(screenName);
    if (pending) return pending;

    const key = 'betterx_author_links:' + screenName;
    try {
      const cached = authorLinksCache.get(screenName) || GM_getValue(key, null);
      if (Number.isFinite(cached?.expiresAt) && cached.expiresAt > now() && Array.isArray(cached.links)) {
        return cached.links;
      }
    } catch {}
    authorLinksCache.delete(screenName);

    const request = requestAuthorProfileLinks(screenName).then((links) => {
      const cached = { links, expiresAt: now() + (links.length ? AUTHOR_LINKS_CACHE_TTL_MS : AUTHOR_LINKS_EMPTY_TTL_MS) };
      authorLinksCache.set(screenName, cached);
      if (authorLinksCache.size > 200) authorLinksCache.delete(authorLinksCache.keys().next().value);
      try { GM_setValue(key, cached); } catch {}
      return links;
    }).finally(() => authorLinksRequests.delete(screenName));
    authorLinksRequests.set(screenName, request);
    return request;
  }

  function isAuthorLinksCaret(caret, screenName, statusId, photo) {
    const article = caret?.closest('article[data-testid="tweet"]');
    if (!article?.isConnected || !caret.isConnected || caret.closest('[hidden], [aria-hidden="true"]')) return false;
    const scope = photo ? '#layers, [role="dialog"]' : '[data-testid="primaryColumn"]';
    if (!article.closest(scope) || (!photo && article.closest('#layers, [role="dialog"]'))) return false;
    const header = article.querySelector('[data-testid="User-Name"]');
    const author = header?.querySelector('a[href]');
    if (author?.pathname.toLowerCase().replace(/\/$/, '') !== '/' + screenName) return false;
    const timestamp = header.querySelector('a[href*="/status/"]');
    if (timestamp) return extractStatusIdFromUrl(timestamp.href) === statusId;
    const permalink = 'a[href$="/status/' + statusId + '"], a[href*="/status/' + statusId + '?"], a[href*="/status/' + statusId + '/photo/"]';
    return [...article.querySelectorAll(permalink)].some((link) => !link.closest('.BetterX-author-links') && link.closest('article') === article);
  }

  function findAuthorLinksCaret(screenName, statusId, photo) {
    const scope = photo ? ':is(#layers, [role="dialog"])' : '[data-testid="primaryColumn"]';
    for (const article of document.querySelectorAll(scope + ' article[data-testid="tweet"]')) {
      const caret = article.querySelector('button[data-testid="caret"]');
      if (isAuthorLinksCaret(caret, screenName, statusId, photo)) return caret;
    }
    return null;
  }

  function getAuthorLinksSlot(caret) {
    const article = caret.closest('article');
    const name = article.querySelector('[data-testid="User-Name"]');
    let actionSlot = caret;
    // 点菜单内部也有横排容器，真正的操作栏在这些容器之外。
    for (let slot = caret; slot.parentElement !== article; slot = slot.parentElement) {
      const row = slot.parentElement;
      const { display, flexDirection } = getComputedStyle(row);
      if (!display.endsWith('flex') || flexDirection !== 'row') continue;
      if (getAuthorLinksTarget(slot) !== slot) return slot;
      if (row.contains(name)) break;
      actionSlot = slot;
    }
    return actionSlot;
  }

  function getAuthorLinksTarget(caretSlot) {
    for (let slot = caretSlot.previousElementSibling; slot; slot = slot.previousElementSibling) {
      if (slot.matches(AUTHOR_GROK_BUTTON) || slot.querySelector(AUTHOR_GROK_BUTTON)) return slot;
    }
    return caretSlot;
  }

  function placeAuthorLinksControl(view, target) {
    const { control, caret, caretSlot } = view;
    const button = control.firstElementChild;
    const { width, height } = caret.getBoundingClientRect();
    const nativeIcon = caret.querySelector('svg');
    if (nativeIcon) {
      const iconSize = nativeIcon.getBoundingClientRect().width;
      if (iconSize) button.style.setProperty('--xv-author-links-icon-size', iconSize + 'px');
      button.style.setProperty('--xv-author-links-color', getComputedStyle(nativeIcon).color);
    }
    button.style.width = width ? `${width}px` : '';
    button.style.height = height ? `${height}px` : '';
    const rowGap = parseFloat(getComputedStyle(target.parentElement).columnGap);
    const extraGap = rowGap > 0 ? 0 : 8;
    control.style.marginInlineEnd = extraGap + 'px';
    if (target.previousElementSibling !== control) target.before(control);
    view.target = target;
    if (target === caretSlot || !width) return;

    const grok = target.matches(AUTHOR_GROK_BUTTON) ? target : target.querySelector(AUTHOR_GROK_BUTTON);
    if (!grok.getBoundingClientRect().width) return;
    const centerX = (node) => {
      const rect = (node.querySelector('svg') || node).getBoundingClientRect();
      return rect.left + rect.width / 2;
    };
    // 作者栏本身的 gap 和两侧原生按钮的外边距都反映在图标中心距中。
    const grokX = centerX(grok);
    const nativeSpacing = Math.abs(centerX(caret) - grokX);
    const linksSpacing = Math.abs(grokX - centerX(button));
    control.style.marginInlineEnd = (extraGap + Math.max(0, nativeSpacing - linksSpacing)) + 'px';
  }

  function createAuthorLinkIcon(href, menu) {
    const icon = document.createElement('span');
    icon.className = 'BetterX-author-link-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
    const host = new URL(href).hostname.replace(/\.$/, '');
    const logo = AUTHOR_LINK_SITE_LOGOS.find(([domain]) => host === domain || host.endsWith('.' + domain))?.[1];
    if (logo) menu.addEventListener('beforetoggle', () => {
      // X 的 img-src 允许 data: 图片，CDN 请求由脚本管理器发出。
      try {
        GM_xmlhttpRequest({
          method: 'GET', url: 'https://cdn.simpleicons.org/' + logo, anonymous: true, timeout: 8000,
          onload: ({ status, responseText }) => {
            if (status !== 200 || !responseText || !icon.isConnected) return;
            const image = document.createElement('img');
            image.alt = '';
            image.addEventListener('load', () => icon.replaceChildren(image), { once: true });
            image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(responseText);
          },
        });
      } catch {}
    }, { once: true });
    return icon;
  }

  function createAuthorLinksControl(links, view) {
    const failed = view.status === 'error';
    const label = uiText(failed ? '作者链接加载失败，点击重试' : '作者链接');
    const control = document.createElement('span');
    control.className = 'BetterX-author-links';
    control.addEventListener('click', (event) => {
      const route = getAuthorLinksRoute();
      if (!isActiveAuthorLinksView(view) || !isAuthorLinksCaret(view.caret, route.screenName, route.statusId, route.photo)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        refreshAuthorLinks();
      }
    }, true);
    control.addEventListener('click', (event) => event.stopPropagation());

    const button = document.createElement('button');
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 13a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7m2.7 5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.7-1.7"/></svg>';

    if (failed) {
      button.addEventListener('click', (event) => {
        if (event.defaultPrevented || !isActiveAuthorLinksView(view)) return;
        view.attempts = 0;
        startAuthorLinksRequest(view);
      });
      control.append(button);
      return control;
    }

    const menu = document.createElement('div');
    menu.id = 'BetterX-author-links-menu';
    menu.setAttribute('popover', 'auto');
    button.setAttribute('popovertarget', menu.id);
    for (const { href, label } of links) {
      const link = document.createElement('a');
      link.href = href;
      link.title = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const text = document.createElement('span');
      text.textContent = label;
      link.append(createAuthorLinkIcon(href, menu), text);
      menu.append(link);
    }

    control.append(button, menu);
    return control;
  }

  function getAuthorLinksRoute() {
    const route = state.settings.authorLinksEnabled && (location.pathname || '').match(AUTHOR_LINKS_ROUTE);
    if (!route) return null;
    const [, handle, statusId, photoPath] = route;
    const screenName = handle.toLowerCase();
    return { screenName, statusId, photo: Boolean(photoPath), key: screenName + '/' + statusId };
  }

  function isActiveAuthorLinksView(view) {
    return authorLinksView === view && getAuthorLinksRoute()?.key === view.key;
  }

  function removeAuthorLinksControl(view) {
    view.control?.remove();
    view.control = null;
    view.caret = null;
    view.caretSlot = null;
    view.target = null;
  }

  function resetAuthorLinksView() {
    if (!authorLinksView) return;
    clearTimeout(authorLinksView.retryTimer);
    removeAuthorLinksControl(authorLinksView);
    authorLinksView = null;
  }

  function startAuthorLinksRequest(view) {
    if (!isActiveAuthorLinksView(view) || view.status === 'loading') return;
    clearTimeout(view.retryTimer);
    view.retryTimer = null;
    view.status = 'loading';
    view.attempts++;
    removeAuthorLinksControl(view);
    loadAuthorProfileLinks(view.screenName).then((links) => {
      if (!isActiveAuthorLinksView(view)) return;
      view.links = links;
      view.status = links.length ? 'ready' : 'empty';
      refreshAuthorLinks();
    }).catch((error) => {
      if (!isActiveAuthorLinksView(view)) return;
      view.status = 'error';
      debugLog('author links request failed:', error);
      const delay = AUTHOR_LINKS_RETRY_DELAYS[view.attempts - 1];
      if (delay !== undefined) view.retryTimer = setTimeout(() => {
        view.retryTimer = null;
        startAuthorLinksRequest(view);
      }, delay);
      refreshAuthorLinks();
    });
  }

  function refreshAuthorLinks() {
    const route = getAuthorLinksRoute();
    if (!route) { resetAuthorLinksView(); return; }
    if (!authorLinksLifecycleInstalled && typeof window.addEventListener === 'function') {
      authorLinksLifecycleInstalled = true;
      window.addEventListener('pagehide', resetAuthorLinksView);
      window.addEventListener('pageshow', refreshAuthorLinks);
    }
    const { screenName, statusId, photo, key } = route;
    if (authorLinksView?.key !== key) {
      resetAuthorLinksView();
      authorLinksView = { ...route, status: 'idle', attempts: 0, retryTimer: null, links: [], control: null, caret: null, caretSlot: null, target: null };
    }
    const view = authorLinksView;
    if (view.status === 'idle') startAuthorLinksRequest(view);
    if (view.status !== 'ready' && view.status !== 'error') return;
    if (view.photo !== photo || !view.control?.isConnected || !view.caretSlot?.contains(view.caret)
        || !isAuthorLinksCaret(view.caret, screenName, statusId, photo)) {
      removeAuthorLinksControl(view);
      view.photo = photo;
      view.caret = findAuthorLinksCaret(screenName, statusId, photo);
      if (!view.caret) return;
      view.caretSlot = getAuthorLinksSlot(view.caret);
      view.control = createAuthorLinksControl(view.links, view);
    }
    const target = getAuthorLinksTarget(view.caretSlot);
    if (target !== view.target || target.previousElementSibling !== view.control) {
      placeAuthorLinksControl(view, target);
    }
  }

