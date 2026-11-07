  const AUTHOR_LINKS_ROUTE = /^\/([a-z0-9_]{1,15})\/status\/(\d+)(\/photo\/\d+)?\/?$/i;
  const AUTHOR_LINKS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
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
  let authorLinksView = null;

  async function loadAuthorProfileLinks(screenName) {
    const pending = authorLinksRequests.get(screenName);
    if (pending) return pending;

    const key = 'betterx_author_links:' + screenName;
    try {
      const cached = GM_getValue(key, null);
      if (cached?.expiresAt > now() && Array.isArray(cached.links)) return cached.links;
    } catch {}

    const request = requestAuthorProfileLinks(screenName).then((links) => {
      if (links.length) {
        try { GM_setValue(key, { links, expiresAt: now() + AUTHOR_LINKS_CACHE_TTL_MS }); }
        catch {}
      }
      return links;
    }).finally(() => authorLinksRequests.delete(screenName));
    authorLinksRequests.set(screenName, request);
    return request;
  }

  function findAuthorLinksCaret(screenName, statusId, photo) {
    const scope = photo ? ':is(#layers, [role="dialog"])' : '[data-testid="primaryColumn"]';
    const permalink = 'a[href$="/status/' + statusId + '"], a[href*="/status/' + statusId + '?"], a[href*="/status/' + statusId + '/photo/"]';
    for (const article of document.querySelectorAll(scope + ' article[data-testid="tweet"]')) {
      const header = article.querySelector('[data-testid="User-Name"]');
      const author = header?.querySelector('a[href]');
      if (author?.pathname.toLowerCase() !== '/' + screenName) continue;
      // 时间线样式的帖子在作者栏自带时间链接，优先用它排除引用目标帖的回复。
      const timestamp = header.querySelector('a[href*="/status/"]');
      if (timestamp ? extractStatusIdFromUrl(timestamp.href) !== statusId : !article.querySelector(permalink)) continue;
      const caret = article.querySelector('button[data-testid="caret"]');
      if (caret) return caret;
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

  function createAuthorLinksControl(links) {
    const label = uiText('作者链接');
    const control = document.createElement('span');
    control.className = 'BetterX-author-links';
    control.addEventListener('click', (event) => event.stopPropagation());

    const button = document.createElement('button');
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 13a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7m2.7 5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.7-1.7"/></svg>';

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

  function refreshAuthorLinks() {
    const route = state.settings.authorLinksEnabled && (location.pathname || '').match(AUTHOR_LINKS_ROUTE);
    if (!route) {
      authorLinksView?.control?.remove();
      authorLinksView = null;
      return;
    }

    const [, handle, statusId, photoPath] = route;
    const screenName = handle.toLowerCase();
    const key = screenName + '/' + statusId;
    const photo = Boolean(photoPath);
    if (authorLinksView?.key !== key) {
      authorLinksView?.control?.remove();
      const view = { key, photo, links: [], control: null, caret: null, caretSlot: null, target: null };
      authorLinksView = view;
      loadAuthorProfileLinks(screenName).then((links) => {
        if (authorLinksView !== view) return;
        view.links = links;
        refreshAuthorLinks();
      }).catch(() => {});
      return;
    }

    const view = authorLinksView;
    if (!view.links.length) return;
    if (view.photo !== photo || !view.control?.isConnected || !view.caretSlot?.contains(view.caret)) {
      view.control?.remove();
      view.control = null;
      view.photo = photo;
      view.caret = findAuthorLinksCaret(screenName, statusId, photo);
      if (!view.caret) return;
      view.caretSlot = getAuthorLinksSlot(view.caret);
      view.control = createAuthorLinksControl(view.links);
    }
    const target = getAuthorLinksTarget(view.caretSlot);
    if (target !== view.target || target.previousElementSibling !== view.control) {
      placeAuthorLinksControl(view, target);
    }
  }

