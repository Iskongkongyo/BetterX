  function now() { return Date.now(); }

  function debugLog(...args) {
    if (DEBUG) console.debug('[BetterX]', ...args);
  }

  function clampInt(v, min, max, fallback) {
    const n = parseInt(v, 10);
    if (isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeRegExp(str) {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function uniqueStrings(list) {
    return [...new Set((list || []).filter(Boolean))];
  }

  function safeString(value, maxLength) {
    if (typeof value !== 'string') return '';
    return value.slice(0, maxLength || 1000);
  }

  function safeHttpsUrl(value, allowedHosts) {
    if (typeof value !== 'string' || !value) return '';
    try {
      const u = new URL(value);
      if (u.protocol !== 'https:') return '';
      const host = u.hostname.toLowerCase();
      if (allowedHosts && !allowedHosts.some((allowed) => host === allowed || host.endsWith('.' + allowed))) return '';
      return u.toString();
    } catch { return ''; }
  }

  function safeImportedAssetUrl(value) {
    return safeHttpsUrl(value, ['twimg.com']);
  }

  function sanitizeNotificationSubscription(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const id = safeString(raw.id, 30).trim();
    const username = safeString(raw.username, 30).replace(/^@+/, '').trim();
    if (!/^\d{1,30}$/.test(id) || !/^[a-z0-9_]{1,15}$/i.test(username)) return null;
    const updatedAt = Number(raw.updatedAt);
    const item = {
      id,
      username,
      displayName: safeString(raw.displayName, 100).trim(),
      avatarUrl: safeImportedAssetUrl(raw.avatarUrl),
      enabled: raw.enabled !== false,
      updatedAt: Number.isFinite(updatedAt) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(updatedAt))) : now(),
    };
    // pinned 是 BetterX 本地管理状态。接口返回未携带该字段时不要写入 false，
    // 这样同步 / 开关 X 通知时可以通过对象合并自然保留已有置顶状态。
    if (typeof raw.pinned === 'boolean') item.pinned = raw.pinned;
    return item;
  }

  function getNotificationMutationGuard(key) {
    const guard = notificationMutationGuards.get(key);
    if (!guard) return null;
    if (!guard.pending && guard.expiresAt <= now()) {
      notificationMutationGuards.delete(key);
      return null;
    }
    return guard;
  }

  function beginNotificationMutationGuard(key, enabled) {
    const timestamp = now();
    for (const [username, guard] of notificationMutationGuards) {
      if (!guard.pending && guard.expiresAt <= timestamp) notificationMutationGuards.delete(username);
    }
    const guard = {
      enabled: enabled === true,
      pending: true,
      expiresAt: timestamp + NOTIFICATION_MUTATION_GUARD_MS,
    };
    if (notificationMutationGuards.has(key)) notificationMutationGuards.delete(key);
    notificationMutationGuards.set(key, guard);
    while (notificationMutationGuards.size > MAX_NOTIFICATION_SUBSCRIPTIONS) {
      notificationMutationGuards.delete(notificationMutationGuards.keys().next().value);
    }
    return guard;
  }

  function rememberNotificationSubscription(raw, enabled, options) {
    const input = sanitizeNotificationSubscription({ ...raw, enabled, updatedAt: now() });
    if (!input) return false;
    const key = input.username.toLowerCase();
    const opts = options || {};
    const guard = getNotificationMutationGuard(key);
    // 请求尚未完成时不接受被动采集结果；成功后的保护期内只接受与刚才操作一致的状态。
    // 铃铛操作自身使用 authoritative 显式越过该限制。
    if (guard && opts.authoritative !== true
        && (guard.pending || guard.enabled !== (enabled === true))) return false;
    const existing = notificationSubscriptions.get(key);
    if (!enabled && !existing && !opts.trackDisabled) return false;
    const next = {
      ...(existing || {}),
      ...input,
      displayName: input.displayName || (existing && existing.displayName) || '',
      avatarUrl: input.avatarUrl || (existing && existing.avatarUrl) || '',
      enabled: enabled === true,
      updatedAt: now(),
    };
    const changed = !existing || existing.id !== next.id || existing.username !== next.username
      || existing.displayName !== next.displayName || existing.avatarUrl !== next.avatarUrl
      || existing.enabled !== next.enabled;
    if (!changed) return false;
    notificationSubscriptions.set(key, next);
    if (next.enabled) rememberFollowingRelation(next.username, true);
    scheduleNotificationSubscriptionsPersist();
    return true;
  }

  function removeRememberedNotificationSubscription(username) {
    const key = safeString(username, 30).replace(/^@+/, '').toLowerCase();
    if (!notificationSubscriptions.delete(key)) return false;
    scheduleNotificationSubscriptionsPersist();
    return true;
  }

  function toggleNotificationSubscriptionPinned(username) {
    const key = safeString(username, 30).replace(/^@+/, '').toLowerCase();
    const existing = notificationSubscriptions.get(key);
    if (!existing) return false;
    const pinned = existing.pinned !== true;
    notificationSubscriptions.set(key, { ...existing, pinned });
    scheduleNotificationSubscriptionsPersist();
    renderNotificationSubscriptions();
    showToast(pinned ? `📌 已置顶 @${existing.username}` : `已取消置顶 @${existing.username}`);
    return true;
  }

  function notificationMatchesSearch(item, query) {
    const terms = safeString(query, 120).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    const username = safeString(item && item.username, 30).toLocaleLowerCase();
    const displayName = safeString(item && item.displayName, 100).toLocaleLowerCase();
    const haystack = `${displayName}\n${username}\n@${username}`;
    return terms.every((term) => haystack.includes(term));
  }

  function applyNotificationSearch() {
    const value = state.notificationSearchEl ? state.notificationSearchEl.value : '';
    state.notificationSearchQuery = safeString(value, 120).trim();
    renderNotificationSubscriptions();
  }

  function safeImportedStatusUrl(value, expectedId) {
    const safe = safeHttpsUrl(value, ['x.com', 'twitter.com']);
    return safe && extractStatusIdFromUrl(safe) === String(expectedId) ? safe : '';
  }

  function parseKeywords(raw) {
    return uniqueStrings(
      String(raw || '')
        .split(/[,\n，]+/)
        .map((s) => s.trim().slice(0, 500))
        .filter(Boolean)
    ).slice(0, 50);
  }

  // 关键词规则允许 /表达式/ 中包含逗号（如 /a{1,3}/）；普通标签仍可用逗号或换行分隔。
  function parseKeywordRules(raw) {
    const values = [];
    let current = '';
    let inRegex = false;
    let escaped = false;
    const pushCurrent = () => {
      const value = current.trim().slice(0, 500);
      if (value) values.push(value);
      current = '';
      inRegex = false;
      escaped = false;
    };
    for (const ch of String(raw || '')) {
      if (inRegex) {
        current += ch;
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '/') inRegex = false;
        continue;
      }
      if (ch === ',' || ch === '，' || ch === '\n') {
        if (current.trim()) pushCurrent();
        continue;
      }
      current += ch;
      if (ch === '/' && current.trim() === '/') inRegex = true;
    }
    pushCurrent();
    return uniqueStrings(values).slice(0, 50);
  }

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function throttle(fn, interval) {
    let last = 0;
    return function (...args) {
      const t = Date.now();
      if (t - last >= interval) {
        last = t;
        fn.apply(this, args);
      }
    };
  }

  function monotonicNow() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }

  function markPageScrollBusy(duration) {
    pageScrollBusyUntil = Math.max(
      pageScrollBusyUntil,
      monotonicNow() + Math.max(PAGE_SCROLL_SETTLE_MS, Number(duration) || 0)
    );
    // 用户开始或继续滚动后，立即取消尚未执行的页面位置校正。
    adultSpamScrollToken++;
  }

  function isPageScrollBusy() {
    return monotonicNow() < pageScrollBusyUntil;
  }

  function installPageScrollActivityTracking() {
    if (pageScrollTrackingInstalled) return;
    pageScrollTrackingInstalled = true;
    const markWheel = () => markPageScrollBusy(320);
    const markTouch = () => markPageScrollBusy(700);
    const markTouchEnd = () => markPageScrollBusy(900);
    const markScroll = () => markPageScrollBusy(PAGE_SCROLL_SETTLE_MS);
    window.addEventListener('wheel', markWheel, { passive: true, capture: true });
    window.addEventListener('touchstart', markTouch, { passive: true, capture: true });
    window.addEventListener('touchmove', markTouch, { passive: true, capture: true });
    window.addEventListener('touchend', markTouchEnd, { passive: true, capture: true });
    window.addEventListener('touchcancel', markTouchEnd, { passive: true, capture: true });
    window.addEventListener('scroll', markScroll, { passive: true, capture: true });
    document.addEventListener('scroll', markScroll, { passive: true, capture: true });
  }

  function schedulePostShowMoreExpansion() {
    if (autoExpandIdleTimer) clearTimeout(autoExpandIdleTimer);
    const run = () => {
      const remaining = pageScrollBusyUntil - monotonicNow();
      if (remaining > 0) {
        autoExpandIdleTimer = setTimeout(run, Math.ceil(remaining) + 60);
        return;
      }
      autoExpandIdleTimer = null;
      if (state.settings.autoExpandPostText) expandPostShowMore(document);
    };
    const remaining = Math.max(0, pageScrollBusyUntil - monotonicNow());
    autoExpandIdleTimer = setTimeout(run, Math.max(100, Math.ceil(remaining) + 60));
  }

  function scheduleAdultSpamLayoutFlush(article) {
    if (article) pendingAdultSpamLayoutArticles.add(article);
    if (adultSpamLayoutIdleTimer) return;
    const run = () => {
      const remaining = pageScrollBusyUntil - monotonicNow();
      if (remaining > 0) {
        adultSpamLayoutIdleTimer = setTimeout(run, Math.ceil(remaining) + 60);
        return;
      }
      adultSpamLayoutIdleTimer = null;
      const articles = [...pendingAdultSpamLayoutArticles].filter((item) => item && item.isConnected);
      pendingAdultSpamLayoutArticles.clear();
      if (!articles.length) return;
      const anchors = captureAdultSpamScrollAnchors();
      let layoutChanged = false;
      for (const item of articles) {
        if (adultSpamFilteringEnabled()) {
          const outcome = {};
          evaluateAndApplyAdultSpam(item, outcome, false);
          if (outcome.changed) layoutChanged = true;
        } else {
          const applied = setAdultSpamHidden(item, { hidden: false, score: 0, reasons: [] });
          if (applied.changed) layoutChanged = true;
        }
      }
      if (layoutChanged) stabilizeAdultSpamScroll(anchors);
      updateAdultSpamCount();
    };
    const remaining = Math.max(0, pageScrollBusyUntil - monotonicNow());
    adultSpamLayoutIdleTimer = setTimeout(run, Math.max(100, Math.ceil(remaining) + 60));
  }

  // 后台扫描时用防抖刷新；正在编辑备注时不重绘列表，避免打断输入
  const debouncedRefreshUI = debounce(() => {
    if (!state.panelOpen) { refreshBadge(); return; }
    if (state.editingNoteId) { refreshBadge(); return; }
    refreshUI({ keepScroll: true });
  }, 120);

  const TIME_FORMATTER = new Intl.DateTimeFormat(UI_LANGUAGE, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

  function formatTime(ts) {
    if (!ts) return '-';
    try {
      const date = new Date(ts);
      return Number.isFinite(date.getTime()) ? TIME_FORMATTER.format(date) : '-';
    } catch { return '-'; }
  }

  function normalizeUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url, location.origin);
      u.hash = '';
      return u.toString();
    } catch { return url; }
  }

  function extractStatusIdFromUrl(url) {
    const match = String(url || '').match(/\/status\/(\d+)/);
    return match ? match[1] : null;
  }

  // ── 来源识别 ──────────────────────────────────────────────────────
  const RESERVED_TOP_PATHS = new Set([
    'home', 'explore', 'search', 'notifications', 'messages',
    'i', 'settings', 'compose', 'bookmarks', 'communities',
    'jobs', 'premium', 'tos', 'privacy', 'login', 'signup', 'intent',
  ]);

  function getActiveTabText() {
    // 排除 BetterX 自己的“帖子 / 设置”页签，避免把面板页签误认成 X 的时间线页签。
    const selectedTab = [...document.querySelectorAll(
      '[role="tab"][aria-selected="true"], [data-testid="ScrollSnap-List"] [aria-selected="true"]'
    )].find((tab) => !tab.closest('#BetterX-root'));
    return (selectedTab?.innerText || selectedTab?.textContent || '').trim();
  }

  function getCurrentSourceInfo() {
    const path = location.pathname || '/';
    const lower = path.toLowerCase();
    const search = location.search || '';

    if (lower === '/' || lower === '/home') {
      const activeTabText = getActiveTabText().toLowerCase();
      if (/following|正在关注|關注中|关注中/.test(activeTabText)) return { type: 'following', label: 'Following' };
      if (/for you|为你推荐|推薦|為你/.test(activeTabText)) return { type: 'for_you', label: 'For You' };
      return { type: 'home', label: 'Home' };
    }
    if (lower.startsWith('/search') || lower.startsWith('/explore') || /[?&]q=/.test(search)) return { type: 'search', label: 'Search' };
    if (lower.includes('/i/lists/')) return { type: 'list', label: 'List' };
    if (lower.includes('/bookmarks')) return { type: 'bookmarks', label: 'Bookmarks' };
    if (lower.includes('/notifications')) return { type: 'notifications', label: 'Notifications' };
    if (/^\/[^/]+\/status\/\d+/i.test(path)) {
      const user = path.split('/').filter(Boolean)[0];
      return { type: 'thread', label: `Thread @${user}` };
    }
    const firstSeg = path.split('/').filter(Boolean)[0];
    if (firstSeg && !RESERVED_TOP_PATHS.has(firstSeg.toLowerCase())) return { type: 'profile', label: `Profile @${firstSeg}` };
    return { type: 'page', label: path || 'Unknown' };
  }

  // ── 帖子内容提取 ──────────────────────────────────────────────────
  function getStatusLink(article) {
    const anchors = [...article.querySelectorAll('a[href*="/status/"]')];
    if (!anchors.length) return null;
    const best = anchors.find((a) => /\/status\/\d+($|\?)/.test(a.getAttribute('href') || '')) || anchors[0];
    const href = best.getAttribute('href');
    if (!href) return null;
    return normalizeUrl(new URL(href, location.origin).toString());
  }

  function sanitizeDisplayName(raw, username) {
    let text = String(raw || '').trim();
    if (!text) return '';
    if (text.includes('\n')) {
      text = text.split('\n')[0].trim();
    }
    if (username) {
      const handleClean = username.replace(/^@+/, '');
      const re = new RegExp('\\s*@?' + handleClean + '($|\\s.*)', 'i');
      text = text.replace(re, '').trim();
    }
    text = text.replace(/\s*[·•\u00B7\u2022]\s*.*$/, '').trim();
    return text;
  }

  function cleanAuthorInfo(rawDisplayName, rawUsername, rawTimeLabel) {
    let displayName = String(rawDisplayName || '').trim();
    let username = String(rawUsername || '').trim();
    let timeLabel = String(rawTimeLabel || '').trim();

    if (displayName.includes('\n')) {
      const lines = displayName.split('\n').map((s) => s.trim()).filter(Boolean);
      displayName = lines[0] || '';
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('@') && !username) {
          username = line;
        } else if (line === '·' || line === '•' || line === '\u00B7') {
          if (i + 1 < lines.length && !timeLabel) {
            timeLabel = lines[i + 1];
          }
        } else if (!timeLabel && (/\d+[年月日smhdw]/i.test(line) || /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(line))) {
          timeLabel = line;
        }
      }
    }

    displayName = sanitizeDisplayName(displayName, username);

    if (username && !username.startsWith('@')) {
      username = `@${username}`;
    }

    if (timeLabel) {
      timeLabel = timeLabel.replace(/^[·•\u00B7\u2022\s]+|[·•\u00B7\u2022\s]+$/g, '').trim();
    }

    return {
      displayName: displayName || username,
      username,
      timeLabel,
    };
  }

  function extractAuthor(article) {
    const text = (article.innerText || '').trim();
    const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
    let username = '';
    const statusLink = article.querySelector('a[href*="/status/"]');
    if (statusLink) {
      const parts = (statusLink.getAttribute('href') || '').split('/').filter(Boolean);
      if (parts.length >= 1 && parts[0] !== 'i') username = `@${parts[0]}`;
    }
    const userNameNode =
      article.querySelector('[data-testid="User-Name"]') ||
      article.querySelector('div[dir="ltr"] span');

    const nameLink = userNameNode?.querySelector('a[role="link"], a[href^="/"]');
    let rawDisplayName = '';
    if (nameLink) {
      const dirLtr = nameLink.querySelector('div[dir="ltr"]') || nameLink.querySelector('span');
      rawDisplayName = (dirLtr?.innerText || dirLtr?.textContent || nameLink.innerText || nameLink.textContent || '').trim();
    }
    if (!rawDisplayName && userNameNode) {
      const leafTexts = [...userNameNode.querySelectorAll('span')]
        .filter((node) => !node.querySelector('span'))
        .map((node) => (node.innerText || node.textContent || '').trim())
        .filter(Boolean);
      rawDisplayName = leafTexts.find((value) => (
        value !== username && value !== username.replace(/^@/, '') && value !== '·' && value !== '•'
      )) || (userNameNode.innerText || '').split('\n')[0].trim() || lines[0] || '';
    }
    if (!rawDisplayName) {
      rawDisplayName = lines[0] || '';
    }

    const timeNode = userNameNode?.querySelector('time') || article.querySelector('time');
    const rawTimeLabel = (timeNode?.innerText || timeNode?.textContent || '').trim();

    return cleanAuthorInfo(rawDisplayName, username, rawTimeLabel);
  }

  // 精确提取正文，避免把作者名 / 时间 / 互动数一起塞进来
  function extractText(article) {
    const nodes = [...article.querySelectorAll('[data-testid="tweetText"]')];
    let merged = nodes.map((el) => (el.innerText || '').trim()).filter(Boolean).join('\n');
    if (!merged) {
      const langNode = article.querySelector('div[lang]');
      merged = (langNode?.innerText || '').trim();
    }
    return (merged || '').slice(0, 2000);
  }

  const VIDEO_CONTAINER_SELECTORS = [
    '[data-testid="videoPlayer"]',
    '[data-testid="videoComponent"]',
    '[data-testid="playButton"]',
    '[data-testid="app-player-container"]',
    '[data-testid="preview-image"]',
    '[data-testid="card.layoutLarge.media"]',
    '[data-testid="card.layoutSmall.media"]',
    '[data-testid="placementTracking"]',
    'div[aria-label*="播放"]',
    'div[aria-label*="Play"]',
    'div[aria-label*="视频"]',
    'div[aria-label*="Video"]',
    'div[aria-label*="GIF"]',
    'div[aria-label*="动图"]',
    'div[role="progressbar"]',
    'button[aria-label*="播放"]',
    'button[aria-label*="Play"]',
  ].join(', ');
  const MEDIA_ASSET_RE = /pbs\.twimg\.com\/(?:media|ext_tw_video_thumb|amplify_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)\//;

  function isVideoPreviewImage(img, article) {
    if (!img) return false;
    const src = img.getAttribute('src') || '';
    if (/(?:ext_tw_video_thumb|amplify_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)/i.test(src)) return true;
    if (img.closest && img.closest(VIDEO_CONTAINER_SELECTORS)) return true;

    let container = img.parentElement;
    for (let depth = 0; container && depth < 6 && container !== article && container.tagName !== 'ARTICLE'; depth++, container = container.parentElement) {
      if (container.querySelector && container.querySelector(`video, ${VIDEO_CONTAINER_SELECTORS}`)) return true;
    }
    return false;
  }

  function detectMedia(article, statusId) {
    const thumbs = [];
    const idKey = statusId ? String(statusId) : '';

    // 1. 优先采用 GraphQL 拦截到的确切媒体元数据（Ground Truth）
    if (idKey) {
      for (const registry of [mediaRegistry, cardRegistry]) {
        const reg = getRegistryEntry(registry, idKey);
        if (!reg || !(reg.photos.length || reg.videos.length || reg.gifs.length)) continue;
        const hasImage = reg.photos.length > 0;
        const hasVideo = reg.videos.length > 0 || reg.gifs.length > 0;
        reg.photos.forEach((u) => { if (thumbs.length < 4) thumbs.push(u); });
        if (!hasImage && hasVideo) {
          if (registry === mediaRegistry) {
            for (const video of article.querySelectorAll('video')) {
              const poster = video.getAttribute('poster') || '';
              if (poster && thumbs.length < 4) thumbs.push(poster);
            }
          }
          for (const img of article.querySelectorAll('img[src]')) {
            const src = img.getAttribute('src') || '';
            if (MEDIA_ASSET_RE.test(src) && thumbs.length < 4) thumbs.push(src);
          }
        }
        return { hasImage, hasVideo, thumbs: uniqueStrings(thumbs).slice(0, 4) };
      }
    }

    // 2. DOM 深度扫描判定
    const videos = [...article.querySelectorAll('video')];
    let hasVideo = videos.length > 0 || !!article.querySelector(VIDEO_CONTAINER_SELECTORS);
    let photoCount = 0;

    for (const video of videos) {
      const poster = video.getAttribute('poster') || '';
      if (poster && thumbs.length < 4) thumbs.push(poster);
    }

    for (const img of article.querySelectorAll('img[src]')) {
      const src = img.getAttribute('src') || '';
      if (/profile_images|emoji|hashflags/i.test(src)) continue;
      const isMediaAsset = MEDIA_ASSET_RE.test(src) || /\/media\//.test(src);
      if (!isMediaAsset) continue;

      if (isVideoPreviewImage(img, article)) {
        hasVideo = true;
      } else {
        photoCount++;
      }
      if (thumbs.length < 4) thumbs.push(src);
    }

    const hasImage = photoCount > 0;
    return { hasImage, hasVideo, thumbs: uniqueStrings(thumbs).slice(0, 4) };
  }

  function extractAvatar(article) {
    const img = article.querySelector('img[src*="profile_images"]');
    return img ? (img.getAttribute('src') || '') : '';
  }

  // ── 关键词匹配 / 高亮 ─────────────────────────────────────────────
  function bumpKeywordCache() {
    matchCacheVersion++;
    matchCache = new Map();
  }

  function buildHaystack(post) {
    return [
      post.displayName || '',
      post.username || '',
      post.text || '',
      post.sourceLabel || '',
      ...(post.sourceHistory || []),
    ].join('\n');
  }

  function readRegexQuantifier(source, index) {
    const ch = source[index];
    if (ch === '*') return { end: index, min: 0, max: Infinity, unbounded: true, unsafe: false };
    if (ch === '+') return { end: index, min: 1, max: Infinity, unbounded: true, unsafe: false };
    if (ch === '?') return { end: index, min: 0, max: 1, unbounded: false, unsafe: false };
    if (ch !== '{') return null;
    const match = source.slice(index).match(/^\{(\d+)(?:,(\d*))?\}/);
    if (!match) return null;
    const min = Number(match[1]);
    const hasComma = match[2] !== undefined;
    const max = !hasComma ? min : (match[2] === '' ? Infinity : Number(match[2]));
    return {
      end: index + match[0].length - 1,
      min,
      max,
      unbounded: max === Infinity,
      unsafe: min > MAX_REGEX_BOUNDED_REPETITION
        || (Number.isFinite(max) && max > MAX_REGEX_BOUNDED_REPETITION),
    };
  }

  function literalMatchesRegexCategory(value, category) {
    if (category === 'digit') return /^[0-9]$/.test(value);
    if (category === 'word') return /^[A-Za-z0-9_]$/.test(value);
    if (category === 'space') return /^\s$/.test(value);
    if (category === 'not-digit') return !/^[0-9]$/.test(value);
    if (category === 'not-word') return !/^[A-Za-z0-9_]$/.test(value);
    if (category === 'not-space') return !/^\s$/.test(value);
    return true;
  }

  function simplePositiveRegexClassMatcher(atom) {
    if (!atom || atom.kind !== 'class' || !/^\[(?!\^)/.test(atom.value)) return null;
    if ([...atom.value].some((ch) => ch.charCodeAt(0) > 0x7F) || /\\[pPxXuU]/.test(atom.value)) return null;
    try { return new RegExp(`^(?:${atom.value})$`, 'i'); } catch (err) { return null; }
  }

  function regexAtomsDefinitelyDisjoint(left, right) {
    if (!left || !right) return false;
    if (left.kind === 'literal' && right.kind === 'literal') return left.value !== right.value;
    if (left.kind === 'literal' && right.kind === 'category') {
      return !literalMatchesRegexCategory(left.value, right.value);
    }
    if (left.kind === 'category' && right.kind === 'literal') {
      return !literalMatchesRegexCategory(right.value, left.value);
    }
    if (left.kind === 'class' && right.kind === 'class') {
      const leftMatcher = simplePositiveRegexClassMatcher(left);
      const rightMatcher = simplePositiveRegexClassMatcher(right);
      if (leftMatcher && rightMatcher) {
        for (let code = 0; code <= 0x7F; code++) {
          const value = String.fromCharCode(code);
          if (leftMatcher.test(value) && rightMatcher.test(value)) return false;
        }
        return true;
      }
    }
    if (left.kind !== 'category' || right.kind !== 'category') return false;
    const pair = `${left.value}|${right.value}`;
    return new Set([
      'digit|space', 'space|digit', 'digit|not-digit', 'not-digit|digit',
      'word|space', 'space|word', 'word|not-word', 'not-word|word',
      'space|not-space', 'not-space|space',
    ]).has(pair);
  }

  // 同层的可重叠可变量词同样会产生多项式/指数级回溯，例如 a*a*a*b 或 a?a?a?b。
  // 旧检查只防住 (a+)+ 一类嵌套结构，这里额外追踪可能消费同一字符的量词链。
  function hasRiskyAdjacentRegexQuantifiers(source) {
    const contexts = [{ variableAtoms: [], groupStart: -1 }];
    const currentContext = () => contexts[contexts.length - 1];
    let inClass = false;
    let classStart = -1;
    let escapedInClass = false;

    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      let atom = null;

      if (inClass) {
        if (escapedInClass) { escapedInClass = false; continue; }
        if (ch === '\\') { escapedInClass = true; continue; }
        if (ch !== ']') continue;
        inClass = false;
        atom = { kind: 'class', value: source.slice(classStart, i + 1) };
      } else if (ch === '[') {
        inClass = true;
        classStart = i;
        continue;
      } else if (ch === '\\') {
        if (i + 1 >= source.length) return true;
        const escaped = source[++i];
        if (escaped === 'b' || escaped === 'B') continue;
        if ('dDwWsS'.includes(escaped)) {
          const names = { d: 'digit', D: 'not-digit', w: 'word', W: 'not-word', s: 'space', S: 'not-space' };
          atom = { kind: 'category', value: names[escaped] };
        } else if ((escaped === 'p' || escaped === 'P') && source[i + 1] === '{') {
          const end = source.indexOf('}', i + 2);
          if (end < 0) return true;
          atom = { kind: 'class', value: source.slice(i - 1, end + 1) };
          i = end;
        } else if (escaped === 'x' && /^[0-9a-f]{2}/i.test(source.slice(i + 1, i + 3))) {
          atom = { kind: 'escape', value: source.slice(i - 1, i + 3) };
          i += 2;
        } else if (escaped === 'u' && /^[0-9a-f]{4}/i.test(source.slice(i + 1, i + 5))) {
          atom = { kind: 'escape', value: source.slice(i - 1, i + 5) };
          i += 4;
        } else {
          atom = { kind: 'literal', value: escaped };
        }
      } else if (ch === '(') {
        contexts.push({ variableAtoms: [], groupStart: i });
        continue;
      } else if (ch === ')') {
        if (contexts.length <= 1) continue;
        const closed = contexts.pop();
        atom = { kind: 'group', value: source.slice(closed.groupStart, i + 1) };
      } else if (ch === '|') {
        currentContext().variableAtoms = [];
        continue;
      } else if (ch === '^' || ch === '$') {
        continue;
      } else if (ch === '.') {
        atom = { kind: 'any', value: '.' };
      } else if (ch === '*' || ch === '+' || ch === '?' || ch === '{') {
        // 孤立量词交给 RegExp 构造器判为无效；这里不把它误当作分隔字符。
        continue;
      } else {
        atom = { kind: 'literal', value: ch };
      }

      if (!atom) continue;
      const quantifier = readRegexQuantifier(source, i + 1);
      if (!quantifier) {
        // 只有明确不可能被此前可变量词消费的必选字符，才能构成回溯分隔符。
        currentContext().variableAtoms = currentContext().variableAtoms
          .filter((previous) => !regexAtomsDefinitelyDisjoint(previous, atom));
        continue;
      }
      if (quantifier.unsafe) return true;
      const context = currentContext();
      const isVariable = quantifier.min !== quantifier.max;
      if (isVariable && context.variableAtoms.some((previous) => !regexAtomsDefinitelyDisjoint(previous, atom))) {
        return true;
      }
      if (quantifier.min > 0) {
        context.variableAtoms = context.variableAtoms
          .filter((previous) => !regexAtomsDefinitelyDisjoint(previous, atom));
      }
      if (isVariable) context.variableAtoms.push(atom);
      i = quantifier.end;
      if (source[i + 1] === '?') i++;
    }
    return false;
  }

  // 拒绝常见灾难性回溯结构：过长表达式、反向引用，以及带重复/分支的分组再次重复。
  // JavaScript 正则没有原生超时，因此这里采用保守白名单式检查，并同时限制待匹配文本长度。
  function isSafeRegexSource(src) {
    const text = String(src || '');
    if (!text || text.length > MAX_REGEX_SOURCE_LENGTH) return false;
    if (/\\(?:[1-9][0-9]*|k<)/.test(text)) return false;
    if (hasRiskyAdjacentRegexQuantifiers(text)) return false;

    const stack = [{ hasRepeat: false, hasAlternation: false }];
    let escaped = false;
    let inClass = false;
    const quantifierAt = (index) => {
      const ch = text[index];
      if (ch === '*' || ch === '+' || ch === '?') return true;
      if (ch !== '{') return false;
      return /^\{\d+(?:,\d*)?\}/.test(text.slice(index));
    };

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (inClass) { if (ch === ']') inClass = false; continue; }
      if (ch === '[') { inClass = true; continue; }
      if (ch === '(') { stack.push({ hasRepeat: false, hasAlternation: false }); continue; }
      if (ch === '|') { stack[stack.length - 1].hasAlternation = true; continue; }
      if (ch === ')' && stack.length > 1) {
        const group = stack.pop();
        const repeated = quantifierAt(i + 1);
        if (repeated && (group.hasRepeat || group.hasAlternation)) return false;
        if (repeated) stack[stack.length - 1].hasRepeat = true;
        continue;
      }
      // (?:...)、(?=...)、(?!...)、(?<=...)、(?<!...) 中开头的 ? 不是量词。
      if (ch === '?' && text[i - 1] === '(') continue;
      if (quantifierAt(i)) stack[stack.length - 1].hasRepeat = true;
    }
    if (stack.length !== 1 || inClass || escaped) return false;
    try {
      new RegExp(text);
      return true;
    } catch {
      return false;
    }
  }

  function safeRegex(src, flags) {
    if (!isSafeRegexSource(src)) return null;
    try { return new RegExp(src, flags); } catch { return null; }
  }

  // 用 /表达式/ 明确声明正则；未包裹的标签始终按普通文字匹配。
  function getDelimitedRegexSource(value) {
    const text = String(value || '').trim();
    return text.length >= 3 && text.startsWith('/') && text.endsWith('/') ? text.slice(1, -1) : null;
  }

  function isSafeKeywordRule(value) {
    const source = getDelimitedRegexSource(value);
    return source === null || isSafeRegexSource(source);
  }

  function keywordRuleMatches(rule, haystack, lowerHaystack) {
    const source = getDelimitedRegexSource(rule);
    if (source !== null) {
      const regex = safeRegex(source, 'i');
      return !!(regex && regex.test(haystack));
    }
    return lowerHaystack.includes(String(rule || '').toLowerCase());
  }

  function computeMatchedKeywords(post) {
    const cached = matchCache.get(post.id);
    if (cached && cached.v === matchCacheVersion) return cached.matched;

    const keywords = state.settings.keywords || [];
    const mode = state.settings.keywordMode === 'and' ? 'and' : 'plain';
    let matched = [];

    if (keywords.length) {
      const haystack = buildHaystack(post).slice(0, MAX_REGEX_HAYSTACK_LENGTH);
      const lower = haystack.toLowerCase();
      if (mode === 'and') {
        const all = keywords.every((kw) => keywordRuleMatches(kw, haystack, lower));
        matched = all ? [...keywords] : [];
      } else {
        matched = keywords.filter((kw) => keywordRuleMatches(kw, haystack, lower));
      }
    }
    matchCache.set(post.id, { v: matchCacheVersion, matched });
    return matched;
  }

  function matchesExclude(post) {
    const ex = state.settings.excludeKeywords || [];
    if (!ex.length) return false;
    const haystack = buildHaystack(post).slice(0, MAX_REGEX_HAYSTACK_LENGTH);
    const lower = haystack.toLowerCase();
    return ex.some((kw) => keywordRuleMatches(kw, haystack, lower));
  }

  // 在“原始文本”上定位匹配区间再分段转义，修复关键词含特殊字符时高亮失效
  function highlightText(rawText, matchedKeywords) {
    const text = rawText || '';
    const usable = uniqueStrings(matchedKeywords || []).filter(Boolean);
    if (!usable.length) return escapeHtml(text).replace(/\n/g, '<br>');

    const parts = [...usable]
      .sort((a, b) => b.length - a.length)
      .map((rule) => getDelimitedRegexSource(rule) ?? escapeRegExp(rule))
      .filter((source) => safeRegex(source, ''));
    const combined = parts.length ? safeRegex(`(${parts.join('|')})`, 'gi') : null;
    if (!combined) return escapeHtml(text).replace(/\n/g, '<br>');

    let out = '';
    let lastIndex = 0;
    let m;
    combined.lastIndex = 0;
    while ((m = combined.exec(text)) !== null) {
      if (m[0].length === 0) { combined.lastIndex++; continue; }
      out += escapeHtml(text.slice(lastIndex, m.index));
      out += `<mark class="BetterX-hl">${escapeHtml(m[0])}</mark>`;
      lastIndex = m.index + m[0].length;
    }
    out += escapeHtml(text.slice(lastIndex));
    return out.replace(/\n/g, '<br>');
  }
