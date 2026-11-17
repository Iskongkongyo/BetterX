  // 作者链接入口与布局参考 LolipopJ 的 PR #3：https://github.com/Iskongkongyo/BetterX/pull/3
  const AUTHOR_LINKS_ROUTE = /^\/([a-z0-9_]{1,15})\/status\/(\d+)(\/photo\/\d+)?\/?$/i;
  const AUTHOR_LINKS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const AUTHOR_LINKS_EMPTY_TTL_MS = 60 * 60 * 1000;
  const AUTHOR_LINKS_RETRY_DELAYS = [1000, 4000];
  const AUTHOR_LINKS_MISS_TTL_MS = 30 * 1000;
  const AUTHOR_LINKS_HOME_ROUTE = /^\/home\/?$/i;
  const AUTHOR_LINK_ICON_CACHE_KEY = 'betterx_author_link_icons';
  const AUTHOR_LINK_ICON_CACHE_TTL_MS = 365 * 24 * 60 * 60 * 1000;
  const AUTHOR_LINK_ICON_CACHE_LIMIT = 150;
  const AUTHOR_LINK_ICON_RETRY_MS = 30 * 1000;
  const AUTHOR_GROK_BUTTON = 'button:is([aria-label*="Grok" i], [data-testid*="grok" i])';
  const AUTHOR_LINK_SITE_LOGOS = [
    ['pixiv/0096FA', ['pixiv.net', 'pixiv.me', 'fanbox.cc']],
    ['sinaweibo/FF8200', ['weibo.com', 'weibo.cn', 'weibo.com.cn']],
    ['bilibili/00AEEC', ['bilibili.com', 'b23.tv', 'bilibili.tv', 'acg.tv', 'bili2233.cn']],
    ['youtubemusic/FF0000', ['music.youtube.com']],
    ['youtube/FF0033', ['youtube.com', 'youtu.be', 'youtube-nocookie.com']],
    ['instagram/FF0069', ['instagram.com', 'instagr.am', 'ig.me']],
    ['tiktok/FE2C55', ['tiktok.com', 'tiktokv.com', 'douyin.com', 'iesdouyin.com']],
    ['twitch/9146FF', ['twitch.tv', 'twitch.com']],
    ['patreon/FF424D', ['patreon.com']],
    ['kofi/FF5A16', ['ko-fi.com', 'kofi.com']],
    ['linktree/43E660', ['linktr.ee', 'linktree.com']],
    ['bluesky/0285FF', ['bsky.app', 'bsky.social']],
    ['github/6E7781', ['github.com', 'github.io']],
    ['x/6E7781', ['x.com', 'twitter.com']],
    ['threads/6E7781', ['threads.net', 'threads.com']],
    ['facebook/0866FF', ['facebook.com', 'fb.com', 'fb.me']],
    ['messenger/0866FF', ['m.me', 'messenger.com']],
    ['discord/5865F2', ['discord.gg', 'discord.com', 'discordapp.com']],
    ['telegram/26A5E4', ['t.me', 'telegram.me', 'telegram.org']],
    ['whatsapp/1FA855', ['wa.me', 'whatsapp.com']],
    ['line/00C300', ['line.me', 'lin.ee']],
    ['wechat/07C160', ['weixin.qq.com', 'wechat.com']],
    ['qq/1EBAFC', ['qq.com']],
    ['xiaohongshu/FF2442', ['xiaohongshu.com', 'xhslink.com']],
    ['zhihu/0084FF', ['zhihu.com']],
    ['douban/2D963D', ['douban.com']],
    ['kuaishou/FF4906', ['kuaishou.com']],
    ['reddit/FF4500', ['reddit.com', 'redd.it']],
    ['tumblr/4F80B8', ['tumblr.com']],
    ['mastodon/6364FF', ['mastodon.social', 'mastodon.online', 'mastodon.cloud', 'mstdn.jp', 'pawoo.net', 'baraag.net', 'fedibird.com', 'fosstodon.org']],
    ['misskey/86B300', ['misskey.io', 'misskey.design', 'misskey.art', 'misskey.social']],
    ['plurk/FF574D', ['plurk.com']],
    ['vk/0077FF', ['vk.com']],
    ['naver/03C75A', ['naver.com', 'naver.me']],
    ['kakaotalk/E0A800', ['kakao.com']],
    ['snapchat/E0A800', ['snapchat.com']],
    ['signal/3B45FD', ['signal.me', 'signal.group', 'signal.org']],
    ['niconico/6E7781', ['nicovideo.jp', 'nico.ms']],
    ['kick/22C55E', ['kick.com']],
    ['vimeo/1AB7EA', ['vimeo.com']],
    ['deviantart/05CC47', ['deviantart.com', 'fav.me']],
    ['artstation/13AFF0', ['artstation.com']],
    ['behance/1769FF', ['behance.net']],
    ['dribbble/EA4C89', ['dribbble.com']],
    ['pinterest/E60023', ['pinterest.com', 'pinterest.jp', 'pinterest.co.uk', 'pin.it']],
    ['flickr/0063DC', ['flickr.com', 'flic.kr']],
    ['unsplash/6E7781', ['unsplash.com']],
    ['newgrounds/F08C00', ['newgrounds.com']],
    ['furaffinity/4F7CAC', ['furaffinity.net']],
    ['spotify/1DB954', ['spotify.com', 'spoti.fi']],
    ['soundcloud/FF5500', ['soundcloud.com']],
    ['bandcamp/1DA0C3', ['bandcamp.com']],
    ['applemusic/FA243C', ['music.apple.com']],
    ['applepodcasts/9933CC', ['podcasts.apple.com']],
    ['neteasecloudmusic/D43C33', ['music.163.com', '163cn.tv']],
    ['lastdotfm/D51007', ['last.fm']],
    ['mixcloud/6E4AFF', ['mixcloud.com']],
    ['buymeacoffee/E0A800', ['buymeacoffee.com', 'bmc.link']],
    ['gumroad/E052B2', ['gumroad.com']],
    ['afdian/946CE6', ['afdian.com', 'afdian.net']],
    ['onlyfans/00AFF0', ['onlyfans.com']],
    ['carrd/596CAF', ['carrd.co']],
    ['bento/768CFF', ['bento.me']],
    ['aboutdotme/6E7781', ['about.me']],
    ['paypal/0070BA', ['paypal.me', 'paypal.com']],
    ['etsy/F16521', ['etsy.com']],
    ['shopify/7AB55C', ['myshopify.com']],
    ['note/2CB696', ['note.com', 'note.mu']],
    ['substack/FF6719', ['substack.com']],
    ['medium/6E7781', ['medium.com']],
    ['notion/6E7781', ['notion.site', 'notion.so']],
    ['wordpress/21759B', ['wordpress.com', 'wordpress.org']],
    ['blogger/FF5722', ['blogspot.com', 'blogspot.jp', 'blogspot.co.uk', 'blogger.com']],
    ['archiveofourown/CC0000', ['archiveofourown.org']],
    ['wattpad/FF500A', ['wattpad.com']],
    ['tapas/E0A800', ['tapas.io']],
    ['ameba/2D8C3C', ['ameblo.jp', 'ameba.jp']],
    ['goodreads/8C6D46', ['goodreads.com']],
    ['letterboxd/FF8000', ['letterboxd.com']],
    ['imdb/DFA900', ['imdb.com']],
    ['qiita/55C500', ['qiita.com']],
    ['zenn/3EA8FF', ['zenn.dev']],
    ['juejin/007FFF', ['juejin.cn']],
    ['devdotto/6E7781', ['dev.to']],
    ['steam/3B82C4', ['steamcommunity.com', 'store.steampowered.com', 's.team']],
    ['itchdotio/FA5C5C', ['itch.io']],
    ['vrchat/6E7781', ['vrchat.com']],
    ['roblox/6E7781', ['roblox.com']],
    ['playstation/0070D1', ['playstation.com']],
    ['myanimelist/3B66C7', ['myanimelist.net']],
    ['anilist/02A9FF', ['anilist.co']],
    ['gitlab/FC6D26', ['gitlab.com']],
    ['gitee/C71D23', ['gitee.com']],
    ['codeberg/2185D0', ['codeberg.org']],
    ['huggingface/E09F00', ['huggingface.co', 'hf.co']],
    ['stackoverflow/F58025', ['stackoverflow.com']],
    ['npm/CB3837', ['npmjs.com']],
    ['vercel/6E7781', ['vercel.app', 'vercel.com']],
    ['netlify/00A396', ['netlify.app', 'netlify.com']],
    ['googlescholar/4285F4', ['scholar.google.com']],
    ['orcid/7FA824', ['orcid.org']],
    ['arxiv/B31B1B', ['arxiv.org']],
  ];
  const AUTHOR_LINK_DOMAIN_LOGOS = new Map(
    AUTHOR_LINK_SITE_LOGOS.flatMap(([logo, domains]) => domains.map((domain) => [domain, logo]))
  );
  const authorLinksRequests = new Map();
  const authorLinksHarvestedLinks = new Map();
  const authorLinksPassiveJobs = new Map();
  const authorLinksCache = new Map();
  const authorLinksCacheMisses = new Map();
  const authorLinksShortLinkAttempted = new Set();
  const authorLinksHomeMissGenerations = new WeakMap();
  const authorLinksHomePlacements = new WeakMap();
  const authorLinkIconRequests = new Map();
  const authorLinkIconRetryAt = new Map();
  let authorLinkIconCache = null;
  let authorLinksControlSeq = 0;
  let authorLinksView = null;
  let authorLinksLifecycleInstalled = false;
  let authorLinksHomeInjected = false;
  let authorLinksGeneration = 0;

  function getAuthorLinkLogo(href) {
    try {
      const { protocol, hostname } = new URL(href);
      if (protocol !== 'http:' && protocol !== 'https:') return '';
      // 按域名层级从具体到父域逐级查找，使 music.youtube.com、weixin.qq.com 等子域优先于主域规则。
      for (let host = hostname.toLowerCase().replace(/\.+$/, ''); host;) {
        const logo = AUTHOR_LINK_DOMAIN_LOGOS.get(host);
        if (logo) return logo;
        const dot = host.indexOf('.');
        if (dot < 0) break;
        host = host.slice(dot + 1);
      }
    } catch {}
    return '';
  }

  function readAuthorLinkIconCache() {
    if (!authorLinkIconCache) {
      authorLinkIconCache = {};
      try {
        const stored = GM_getValue(AUTHOR_LINK_ICON_CACHE_KEY, null);
        if (stored && typeof stored === 'object' && !Array.isArray(stored)) authorLinkIconCache = stored;
      } catch {}
    }
    return authorLinkIconCache;
  }

  function getCachedAuthorLinkIcon(logo) {
    if (!logo) return '';
    const entry = readAuthorLinkIconCache()[logo];
    if (!Number.isFinite(entry?.expiresAt) || entry.expiresAt <= now()) return '';
    return typeof entry.dataUrl === 'string' && entry.dataUrl.startsWith('data:image/svg+xml') ? entry.dataUrl : '';
  }

  function rememberAuthorLinkIcon(logo, dataUrl) {
    const cache = readAuthorLinkIconCache();
    cache[logo] = { dataUrl, expiresAt: now() + AUTHOR_LINK_ICON_CACHE_TTL_MS };
    const keys = Object.keys(cache);
    if (keys.length > AUTHOR_LINK_ICON_CACHE_LIMIT) {
      for (const key of keys) if (!(cache[key]?.expiresAt > now())) delete cache[key];
      const overflow = Object.keys(cache).sort((left, right) => (cache[left]?.expiresAt || 0) - (cache[right]?.expiresAt || 0));
      while (overflow.length > AUTHOR_LINK_ICON_CACHE_LIMIT) delete cache[overflow.shift()];
    }
    try { GM_setValue(AUTHOR_LINK_ICON_CACHE_KEY, cache); } catch {}
  }

  function fetchAuthorLinkIcon(logo) {
    if (!logo) return Promise.resolve('');
    const cached = getCachedAuthorLinkIcon(logo);
    if (cached) return Promise.resolve(cached);
    if (authorLinkIconRetryAt.get(logo) > now()) return Promise.resolve('');
    const pending = authorLinkIconRequests.get(logo);
    if (pending) return pending;
    const request = new Promise((resolve) => {
      try {
        // X 的 img-src 允许 data: 图片，CDN 请求由脚本管理器发出并做 1 年本地缓存。
        GM_xmlhttpRequest({
          method: 'GET', url: 'https://cdn.simpleicons.org/' + logo, anonymous: true, timeout: 8000,
          onload: ({ status, responseText }) => {
            if (status !== 200 || typeof responseText !== 'string' || !/<svg\b/i.test(responseText)) {
              resolve('');
              return;
            }
            const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(responseText);
            rememberAuthorLinkIcon(logo, dataUrl);
            resolve(dataUrl);
          },
          onerror: () => resolve(''),
          ontimeout: () => resolve(''),
          onabort: () => resolve(''),
        });
      } catch { resolve(''); }
    }).then((dataUrl) => {
      if (dataUrl) authorLinkIconRetryAt.delete(logo);
      else authorLinkIconRetryAt.set(logo, now() + AUTHOR_LINK_ICON_RETRY_MS);
      return dataUrl;
    }).finally(() => authorLinkIconRequests.delete(logo));
    authorLinkIconRequests.set(logo, request);
    return request;
  }

  function prefetchAuthorLinkIcons(links) {
    if (!state.settings.authorLinksEnabled || !Array.isArray(links)) return;
    for (const link of links) {
      const logo = getAuthorLinkLogo(link?.href);
      if (logo && !getCachedAuthorLinkIcon(logo)) fetchAuthorLinkIcon(logo);
    }
  }

  function readAuthorLinksRecord(screenName) {
    let cached = authorLinksCache.get(screenName);
    if (!cached) {
      try { cached = GM_getValue('betterx_author_links:' + screenName, null); } catch { cached = null; }
    }
    return cached && Number.isFinite(cached.expiresAt) && cached.expiresAt > now() && Array.isArray(cached.links)
      ? cached
      : null;
  }

  function authorProfileLinksChanged(screenName, links) {
    const previous = readAuthorLinksRecord(screenName);
    return !previous || JSON.stringify(previous.links) !== JSON.stringify(links);
  }

  function hasValidNonEmptyAuthorLinksCache(screenName) {
    screenName = String(screenName || '').toLowerCase();
    if (!/^[a-z0-9_]{1,15}$/.test(screenName)) return false;
    const cached = readAuthorLinksRecord(screenName);
    return Boolean(cached && cached.links.length > 0);
  }

  function saveAuthorProfileLinksCache(screenName, links, onCommit) {
    screenName = String(screenName || '').toLowerCase();
    if (!/^[a-z0-9_]{1,15}$/.test(screenName) || !Array.isArray(links)) return null;
    const key = 'betterx_author_links:' + screenName;
    const changed = authorProfileLinksChanged(screenName, links);
    const cached = { links, expiresAt: now() + (links.length ? AUTHOR_LINKS_CACHE_TTL_MS : AUTHOR_LINKS_EMPTY_TTL_MS) };
    authorLinksCache.set(screenName, cached);
    authorLinksCacheMisses.delete(screenName);
    if (links.length) {
      if (changed) authorLinksGeneration++;
      prefetchAuthorLinkIcons(links);
    }
    if (authorLinksCache.size > 200) authorLinksCache.delete(authorLinksCache.keys().next().value);
    try { GM_setValue(key, cached); } catch {}
    onCommit?.(changed);
    return cached;
  }

  function applyHarvestedAuthorProfileLinks(screenName, links, options = null) {
    if (options?.preserveResolved && links.some((link) => isShortUrl(link.href))) {
      const existing = readAuthorLinksRecord(screenName);
      if (existing?.links.length && !existing.links.some((link) => isShortUrl(link.href))) {
        return existing.links;
      }
    }
    let changed = false;
    saveAuthorProfileLinksCache(screenName, links, (wasChanged) => { changed = wasChanged; });
    if (!state.settings.authorLinksEnabled) return links;
    if (homeAuthorLinksActive()) {
      if (changed) {
        for (const control of document.querySelectorAll('[data-betterx-author-links="home"]')) {
          if (control.dataset.betterxAuthorLinksAuthor === screenName) control.remove();
        }
        refreshHomeAuthorLinks();
      }
    } else if (authorLinksView?.screenName === screenName && isActiveAuthorLinksView(authorLinksView)) {
      const view = authorLinksView;
      const status = links.length ? 'ready' : 'empty';
      clearTimeout(view.retryTimer);
      view.retryTimer = null;
      if (view.status !== status || JSON.stringify(view.links) !== JSON.stringify(links)) {
        removeAuthorLinksControl(view);
        view.links = links;
        view.status = status;
        refreshAuthorLinks();
      }
    }
    return links;
  }

  async function resolveHarvestedAuthorProfileLinks(screenName) {
    let rawLinks;
    let links;
    do {
      rawLinks = authorLinksHarvestedLinks.get(screenName);
      links = await resolveAuthorProfileLinks(rawLinks);
    } while (rawLinks !== authorLinksHarvestedLinks.get(screenName));
    return links;
  }

  function cacheHarvestedAuthorProfileLinks(screenName, rawLinks, options = null) {
    screenName = String(screenName || '').toLowerCase();
    if (!/^[a-z0-9_]{1,15}$/.test(screenName) || !Array.isArray(rawLinks)) return Promise.resolve(null);
    authorLinksHarvestedLinks.set(screenName, rawLinks);
    const pending = authorLinksRequests.get(screenName) || authorLinksPassiveJobs.get(screenName);
    if (pending) return pending;
    if (!rawLinks.some((link) => isShortUrl(link.href))) {
      authorLinksHarvestedLinks.delete(screenName);
      return Promise.resolve(applyHarvestedAuthorProfileLinks(screenName, rawLinks, options));
    }
    const job = resolveHarvestedAuthorProfileLinks(screenName)
      .then((links) => applyHarvestedAuthorProfileLinks(screenName, links, options))
      .finally(() => {
        authorLinksPassiveJobs.delete(screenName);
        authorLinksHarvestedLinks.delete(screenName);
      });
    authorLinksPassiveJobs.set(screenName, job);
    return job;
  }

  async function loadAuthorProfileLinks(screenName) {
    screenName = screenName.toLowerCase();
    const pending = authorLinksRequests.get(screenName) || authorLinksPassiveJobs.get(screenName);
    if (pending) return pending;

    const key = 'betterx_author_links:' + screenName;
    try {
      const cached = authorLinksCache.get(screenName) || GM_getValue(key, null);
      if (Number.isFinite(cached?.expiresAt) && cached.expiresAt > now() && Array.isArray(cached.links)) {
        authorLinksCacheMisses.delete(screenName);
        if (!authorLinksCache.has(screenName)) {
          authorLinksCache.set(screenName, cached);
          if (authorLinksCache.size > 200) authorLinksCache.delete(authorLinksCache.keys().next().value);
          if (cached.links.length) authorLinksGeneration++;
        }
        prefetchAuthorLinkIcons(cached.links);
        resolveCachedShortLinks(screenName, cached);
        return cached.links;
      }
    } catch {}
    authorLinksCache.delete(screenName);

    const request = requestAuthorProfileLinks(screenName).catch((error) => {
      const harvested = authorLinksHarvestedLinks.get(screenName);
      if (!harvested) throw error;
      return harvested;
    }).then(async (links) => {
      if (authorLinksHarvestedLinks.has(screenName)) {
        links = await resolveHarvestedAuthorProfileLinks(screenName);
        return applyHarvestedAuthorProfileLinks(screenName, links);
      }
      saveAuthorProfileLinksCache(screenName, links);
      return links;
    }).finally(() => {
      authorLinksRequests.delete(screenName);
      authorLinksHarvestedLinks.delete(screenName);
    });
    authorLinksRequests.set(screenName, request);
    return request;
  }

  // 缓存里还留着短链时后台还原一次，成功后原地覆写、保留原有过期时间。
  function resolveCachedShortLinks(screenName, cached) {
    if (!cached.links.some((link) => isShortUrl(link.href))) return;
    // 失败也不重试：同一次页面会话内每个作者最多请求一轮，避免滚动时反复打短链服务商。
    if (authorLinksShortLinkAttempted.has(screenName)) return;
    authorLinksShortLinkAttempted.add(screenName);
    resolveAuthorProfileLinks(cached.links).then((links) => {
      const changed = links.length !== cached.links.length
        || links.some((link, index) => link.href !== cached.links[index].href);
      if (!changed) return;
      const refreshed = { links, expiresAt: cached.expiresAt };
      authorLinksCache.set(screenName, refreshed);
      authorLinksGeneration++;
      prefetchAuthorLinkIcons(links);
      try { GM_setValue('betterx_author_links:' + screenName, refreshed); } catch {}
    }).catch(() => {});
  }

  function rememberAuthorLinksMiss(screenName) {
    authorLinksCacheMisses.set(screenName, now() + AUTHOR_LINKS_MISS_TTL_MS);
    if (authorLinksCacheMisses.size > 500) authorLinksCacheMisses.delete(authorLinksCacheMisses.keys().next().value);
  }

  // 主页信息流只消费已有缓存：未命中也记下短期空结果，避免滚动时反复读取扩展存储。
  function getCachedAuthorProfileLinks(screenName) {
    screenName = String(screenName || '').toLowerCase();
    if (!/^[a-z0-9_]{1,15}$/.test(screenName)) return null;
    if (authorLinksCacheMisses.get(screenName) > now()) return null;
    let cached = authorLinksCache.get(screenName);
    if (!cached) {
      try { cached = GM_getValue('betterx_author_links:' + screenName, null); } catch { cached = null; }
    }
    if (!cached || !Number.isFinite(cached.expiresAt) || cached.expiresAt <= now() || !Array.isArray(cached.links)) {
      authorLinksCache.delete(screenName);
      rememberAuthorLinksMiss(screenName);
      return null;
    }
    if (!authorLinksCache.has(screenName)) {
      authorLinksCache.set(screenName, cached);
      if (authorLinksCache.size > 200) authorLinksCache.delete(authorLinksCache.keys().next().value);
    }
    authorLinksCacheMisses.delete(screenName);
    resolveCachedShortLinks(screenName, cached);
    // 有效但为空的缓存项本身就是负缓存，留在内存里让详情页直接命中，避免重复读取 GM 存储。
    const links = cached.links.filter((link) => typeof link?.href === 'string' && /^https?:\/\//i.test(link.href));
    if (links.length) prefetchAuthorLinkIcons(links);
    return links.length ? links : null;
  }

  function isAuthorLinksCaret(caret, screenName, statusId, photo) {
    const article = caret?.closest('article[data-testid="tweet"]');
    if (!article?.isConnected || !caret.isConnected || caret.closest('[hidden], [aria-hidden="true"]')) return false;
    const scope = photo ? '#layers, [role="dialog"]' : '[data-testid="primaryColumn"]';
    if (!article.closest(scope) || (!photo && article.closest('#layers, [role="dialog"]'))) return false;
    const header = article.querySelector('[data-testid="User-Name"]');
    if (getHeaderAuthorName(header) !== screenName) return false;
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
    const rowGap = target.parentElement ? parseFloat(getComputedStyle(target.parentElement).columnGap) : 0;
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

  function makeAuthorLinkIconImage(dataUrl) {
    const image = document.createElement('img');
    image.alt = '';
    image.src = dataUrl;
    return image;
  }

  function createAuthorLinkIcon(href) {
    const icon = document.createElement('span');
    icon.className = 'BetterX-author-link-icon';
    icon.setAttribute('aria-hidden', 'true');
    const logo = getAuthorLinkLogo(href);
    const cachedDataUrl = logo ? getCachedAuthorLinkIcon(logo) : '';
    if (cachedDataUrl) {
      icon.append(makeAuthorLinkIconImage(cachedDataUrl));
      return icon;
    }
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
    if (logo) {
      fetchAuthorLinkIcon(logo).then((dataUrl) => {
        if (!dataUrl || !icon.isConnected) return;
        const image = makeAuthorLinkIconImage(dataUrl);
        image.addEventListener('load', () => {
          if (icon.isConnected) icon.replaceChildren(image);
        }, { once: true });
      });
    }
    return icon;
  }

  function createAuthorLinksControl(links, view) {
    const failed = view.status === 'error';
    const label = uiText(failed ? '作者链接加载失败，点击重试' : '作者链接');
    const control = document.createElement('span');
    control.className = 'BetterX-author-links';
    if (!view.home) {
      control.addEventListener('click', (event) => {
        const route = getAuthorLinksRoute();
        if (!isActiveAuthorLinksView(view) || !isAuthorLinksCaret(view.caret, route.screenName, route.statusId, route.photo)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          refreshAuthorLinks();
        }
      }, true);
    }
    // 首页的推文卡片本身可点击跳转，菜单内的点击不能再冒泡到 X 的路由。
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
    menu.className = 'BetterX-author-links-menu';
    // 主页可能同时存在多条缓存作者的推文，ID 与锚点名必须按控件唯一。
    const seq = ++authorLinksControlSeq;
    menu.id = 'BetterX-author-links-menu-' + seq;
    menu.setAttribute('popover', 'auto');
    menu.style.setProperty('position-anchor', '--betterx-author-links-' + seq);
    button.style.setProperty('anchor-name', '--betterx-author-links-' + seq);
    button.setAttribute('popovertarget', menu.id);
    for (const { href, label } of links) {
      const link = document.createElement('a');
      link.href = href;
      link.title = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const text = document.createElement('span');
      text.textContent = label;
      link.append(createAuthorLinkIcon(href), text);
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

  function homeAuthorLinksActive() {
    return Boolean(state.settings.authorLinksEnabled && AUTHOR_LINKS_HOME_ROUTE.test(location.pathname || ''));
  }

  function getHeaderAuthorName(header) {
    if (!header) return '';
    const candidates = typeof header.querySelectorAll === 'function'
      ? header.querySelectorAll('a[href]')
      : [header.querySelector('a[href]')].filter(Boolean);
    for (const link of candidates) {
      const path = link?.pathname || '';
      if (!/^\/[a-z0-9_]{1,15}\/?$/i.test(path)) continue;
      const name = path.replace(/\//g, '').toLowerCase();
      if (!RESERVED_TOP_PATHS.has(name) && !PROFILE_ROOT_ROUTE_EXCLUSIONS.has(name)) return name;
    }
    return '';
  }

  function getArticleAuthorName(article) {
    return getHeaderAuthorName(article.querySelector('[data-testid="User-Name"]'));
  }

  function removeHomeAuthorLinks() {
    if (!authorLinksHomeInjected) return;
    authorLinksHomeInjected = false;
    for (const control of document.querySelectorAll('[data-betterx-author-links="home"]')) control.remove();
  }

  // 首页只消费本地缓存：未缓存作者保持静默，避免滚动时向 X 发起成片请求触发限流。
  function refreshHomeAuthorLinks() {
    if (!homeAuthorLinksActive()) { removeHomeAuthorLinks(); return; }
    for (const article of document.querySelectorAll('[data-testid="primaryColumn"] article[data-testid="tweet"]')) {
      if (!article.isConnected || article.closest('#layers, [role="dialog"]')) continue;
      // 仅在缓存版本与本节点判定版本一致时跳过；返回首页或缓存更新后自动重评。
      if (article.dataset.betterxAuthorLinks === 'none') {
        if (authorLinksHomeMissGenerations.get(article) === authorLinksGeneration) continue;
        delete article.dataset.betterxAuthorLinks;
      }
      const existing = article.querySelector('.BetterX-author-links');
      const caret = article.querySelector('button[data-testid="caret"]');
      if (!caret || caret.closest('[hidden], [aria-hidden="true"]')) {
        existing?.remove();
        continue;
      }
      const screenName = getArticleAuthorName(article);
      if (!screenName) {
        // 作者节点尚未挂载完成时不写入 none，等待后续 DOM 补全。
        existing?.remove();
        continue;
      }
      if (existing) {
        if (existing.dataset.betterxAuthorLinksAuthor === screenName) {
          const placed = authorLinksHomePlacements.get(existing);
          const fastTarget = placed && placed.caret === caret && placed.caretSlot?.contains(caret)
            ? getAuthorLinksTarget(placed.caretSlot)
            : null;
          if (fastTarget && fastTarget === placed.target && fastTarget.previousElementSibling === existing) continue;
          const caretSlot = fastTarget ? placed.caretSlot : getAuthorLinksSlot(caret);
          const target = fastTarget || getAuthorLinksTarget(caretSlot);
          if (target !== placed?.target || target.previousElementSibling !== existing) {
            const homeView = { home: true, caret, caretSlot, control: existing, target: placed?.target || null };
            placeAuthorLinksControl(homeView, target);
            authorLinksHomePlacements.set(existing, { caret, caretSlot, target: homeView.target });
          }
          continue;
        }
        existing.remove();
      }
      const links = getCachedAuthorProfileLinks(screenName);
      if (!links) {
        article.dataset.betterxAuthorLinks = 'none';
        authorLinksHomeMissGenerations.set(article, authorLinksGeneration);
        continue;
      }
      const caretSlot = getAuthorLinksSlot(caret);
      const control = createAuthorLinksControl(links, { home: true });
      control.dataset.betterxAuthorLinks = 'home';
      control.dataset.betterxAuthorLinksAuthor = screenName;
      delete article.dataset.betterxAuthorLinks;
      authorLinksHomeMissGenerations.delete(article);
      const homeView = { home: true, caret, caretSlot, control, target: null };
      placeAuthorLinksControl(homeView, getAuthorLinksTarget(caretSlot));
      authorLinksHomePlacements.set(control, { caret, caretSlot, target: homeView.target });
      authorLinksHomeInjected = true;
    }
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
    if (!route) resetAuthorLinksView();
    refreshHomeAuthorLinks();
    if (!route) return;
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

