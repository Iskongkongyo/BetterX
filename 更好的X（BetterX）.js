// ==UserScript==
// @name         更好的 X（BetterX）
// @namespace    https://github.com/Iskongkongyo
// @version      2.2.0
// @description  自动隐藏黄推/引流机器人与广告、界面净化与宽屏、一键下载图片/视频/GIF(多媒体自动打包 zip)、取消年龄限制(自动展开敏感/成人内容遮罩)、记录 X 时间线中出现过的帖子，支持搜索、排序、正文折叠、备注、置顶、收藏、闪现提醒、来源识别、关键词高亮(含 AND/正则/排除词)、媒体缩略图、导入导出备份、自动清理、可拖动徽标、明暗主题、快捷键(Alt+X)、IndexedDB 持久化
// @author        流萤可爱捏
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_setValue
// @grant        unsafeWindow
// @connect      twimg.com
// @connect      video.twimg.com
// @connect      pbs.twimg.com
// @connect      x.com
// @run-at       document-start
// @icon      data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAUEBAQEAwUEBAQGBQUGCA0ICAcHCBALDAkNExAUExIQEhIUFx0ZFBYcFhISGiMaHB4fISEhFBkkJyQgJh0gISD/2wBDAQUGBggHCA8ICA8gFRIVICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICD/wAARCABAAEADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7LoorC17XpdLsoorO08/Vr2UwWdrI20OwyS7EZ2xqo3MfTjqQCAX9S1fStHgWfVdQt7KNjtUzSBdx9BnqfYVgD4ieGJYXmspL6+jXPz29hMyHHX59oXj61mG3t9BZtSvdQhudZmQm41e+IRYYx12gnEUYJwsYIyTyScmuF1j41/CzTrlllvbjxBeodrz2dkGDEHjLHarYPTrUOXYtRuenQ+PtDktheT2mrWVn/FdXemzRRJ/vMVwB/tH5feuohmgubeO4t5UmhlUOkkbBldTyCCOCK+etO/aJ8Fi+QTz61DbuwV2vbVWMWf4g8bHgdwR06Hse/m0268PsfEXgm8ijspF+0XGlM2bK6Ujd5kWAfJYg53J8pzkqeTQpdwcGj0qivO/EHiGDVvAyPoWoXenanqF7Fbp5ZxPayo4eVWHI+VEcnqrDHUMM9R4T1efXPCtnqF2ipd/PDcKn3fNjdo3I9iykj2IpxlfR7kdbGrdZFuX81YlT5mZm2gADnJ7Vw2m202veIZPFl67m0aFLbTLZgV/cg7mnYesjbSF7KiE8nA2fGMsMlpYaTczCK0v5yLticD7PHG0sgJ9GCBT7Map+GNWOtaPDrRJ23rCeND0jjIBQD/gJBPuTWbilJy7lI8Pux4h+I/xk8UW9tZXF54f0snT4pNwSCGSMEM29gRu37idoZsccA1s6P+zF4YhzP4k8SXt47fN5FoRCi+24hnb65FdVqcgfwDD4S01o7KbVY5IHmB2+UjfNcS9ufn27s8tIK6bw1rA1PQ7MSlY7xLdfNizyCv7tjj0Dqw/D3pJq5r7OUVzrr+hxx+Afwmkglgj0y886FtjMuoTbuRkHk46H0rq/B+ixeFNOfwnbXVxc2NgFksmumDyJC+f3ZIAyFYMBx0IHauV8TeObLwf43W51DWre30ya2aO4tpZFVjIkgO6PP3nCyAlP4l6cgZ67TNX0/WdRs9X0q/ttQsrmxcJcWzhkcB0I+h5PB5FHNccoSSTezOTks00L4x20ETNCup6e6Wbuu6GNhKisSOnmBdsa56rsHatrwrpEenfEVrXT7+9u47G0uDePcTmQI80quiYB2qxIkcjAIyM8EV57+0fYrd+BEvjIyHTpobpXB+4C/lP+B3oceqCvTfgto1/oXwd0Oy1XTn06/ZHmmgcgsC7swJH8OQQdpyV6HkVcaf8Ay8v8jCW5e+Imj32qaLbGwtJLtxKbaaKPG7yJ1MMrDJH3Q+76Ke9ct4T1qytrW30aS6jjKy/Y7cn5BK8a4ULns8aLIv8AeBOOldt4u1VILMaUk/kvdITNLnHkw5wx/wB5s7VHXJJHSvJZ9PtfFvju7i1GB9P0vSjBaqSdm5kHmnevbG9QAeVAP3SxwTLp2vZmB4q+EzeLPHt5fa9rM80NtcAWliGWOGKzcBwcn1k81Sf7yr6iuq8H/Ca70jSVl0XWpLG6tLyU27SsZYjFJ5ZYdc4wuCo+VioyMjdVbxBqNx4e1221GTXHutL0kG4VbqXbuQ5Ur54UyFTgfKdwbjPQVb0L9oDwxrqywx6NqtjcWitNLHNPbxgRqDucl3GVUDJGMjg4pRlePJb/ADOyVRtXT/y+4i8U/CS11PWdU1HX7s3rXkKn7T5bokeAoJVF3BSFjUEk85B4AxWP8NdL8JeF/Ez2Xhm68ybV7WELBDKJFjSJN09yeflWWQBVHfG4DBrauPjM17r1z4Ss9DFjfwIv73U7hbkPuXdgCElWbac7S447cGsvRtJ1CDXrrV5L0W9rfGO2nvLe3WKcJ3VXHyxqX2/dXIAGCDkknJuKj0QlUUVru/PfsZPxi8QR+INH8S+E9NjW4uIYo4mIcEMIy1xcAAdCixqPdmAr1X4D60dd+CehXEupS6hcW6vazSSjlWRiNoPdQNuD3GK5n+xLDQvFurfY9Lt7MX9nby294i8wNCQux8/8sw4jYn1kO7Ocj2LRbtL/AEW3vIkESSrkRBdvlHoUPuCCK0g/dscc2m9DhviWLzSbjTPEGnT26XUk8dnGbgZWJzvxLg8NtRpDj1C++eDj13R4IfsNpqNv5aFjJLLcKXlcklmJJ5JYks3ck177eWNjqNv9n1Czgu4chvLnjDrkdDg8VAuiaKqhV0iyVVGABbpgD06UNJ7ka9D5V8Y3UvjO7sPCfh64glm1F0haRmBjESnkv2wzkAA+nqQDXh8K6H4e8U/bPEl1Yz6qs8Xk6MGWNLaJG/fToHbc23aRlsAh2+UYBH0vq3w98K6zqAvrnTzFKYfs8gtpDCs0W7dscLjIzk+tXF8FeD1WJV8MaWBEwdf9FTO4DGSccnHrUSppxaQ1Od9dvI+fvEtl4R1jVTpehPb6TqccUmoQ3Ej+VmdOPMKDGSudhGNxD4A+bNaNp410m50WGKLUEtLaVY/Ps7q4jys2cSDr0BOPwr3G88G+FL8H7R4esN5xiWOFY5Fx0w64Yfga0rfS9NtLSG0trGCOCBBHGgQYVQMAflUUqMacVHe39dROUm9WfPN1qkuopeWcet2t1bxSv9jfzVEkS/ZvMaMuD+8iJUxuDyBKgyeK9w8EK58EaZdSAK17H9tKBshPNJkC574DAZ74rTutF0a9CC80myudgIXzYEfbnrjI4q8qqiBEUKqjAAGABWyVg1P/2Q==
// @noframes
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const APP_ICON_URL = (() => {
    try {
      const icon = typeof GM_info !== 'undefined' && GM_info.script
        ? (GM_info.script.icon64 || GM_info.script.icon || '')
        : '';
      return /^(?:data:image\/|https?:\/\/)/i.test(icon) ? icon : '';
    } catch (err) {
      return '';
    }
  })();

  // ── 常量 ──────────────────────────────────────────────────────────
  const DB_NAME = 'x_post_vault_db';
  const DB_VERSION = 2;
  const POSTS_STORE = 'posts';
  const SETTINGS_STORE = 'settings';
  const CLEANUP_INTERVAL_MS = 1500;
  const NETWORK_HOOK_CHECK_INTERVAL_MS = 5000;
  const MAX_NETWORK_RESPONSE_BYTES = 8000000;
  const MAX_IMPORT_FILE_BYTES = 25 * 1024 * 1024;
  const MAX_IMPORT_POSTS = 20000;
  const MAX_REGEX_SOURCE_LENGTH = 180;
  const MAX_REGEX_HAYSTACK_LENGTH = 20000;
  const IS_FIREFOX = /(?:^|\s)Firefox\//i.test(navigator.userAgent || '');
  const FIREFOX_COMPAT_MODE_KEY = 'betterx_firefox_compatibility_mode';
  const DEBUG = false;

  function readFirefoxCompatibilityMode() {
    if (!IS_FIREFOX) return 'normal';
    let value = '';
    try {
      if (typeof GM_getValue === 'function') value = GM_getValue(FIREFOX_COMPAT_MODE_KEY, '');
    } catch (err) {}
    if (!value) {
      try { value = localStorage.getItem(FIREFOX_COMPAT_MODE_KEY) || ''; } catch (err) {}
    }
    return value === 'compat' || value === 'normal' ? value : 'unset';
  }

  let firefoxCompatibilityMode = readFirefoxCompatibilityMode();

  function writeFirefoxCompatibilityMode(mode) {
    const normalized = mode === 'compat' ? 'compat' : 'normal';
    firefoxCompatibilityMode = normalized;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(FIREFOX_COMPAT_MODE_KEY, normalized);
    } catch (err) {}
    try { localStorage.setItem(FIREFOX_COMPAT_MODE_KEY, normalized); } catch (err) {}
  }

  const FILTERS = [
    { key: 'all', label: '全部' },
    { key: 'unread', label: '未打开' },
    { key: 'flash', label: '快速消失' },
    { key: 'favorite', label: '已收藏' },
    { key: 'pinned', label: '已置顶' },
    { key: 'opened', label: '已打开' },
    { key: 'keyword', label: '命中关键词' },
  ];

  const MEDIA_FILTERS = [
    { key: 'all', label: '全部媒体' },
    { key: 'image', label: '含图片' },
    { key: 'video', label: '含视频' },
    { key: 'text', label: '纯文字' },
  ];

  const SKIP_SOURCE_OPTIONS = [
    { key: 'profile', label: '个人主页' },
    { key: 'thread', label: '帖子详情' },
    { key: 'search', label: '搜索页' },
    { key: 'bookmarks', label: '书签页' },
    { key: 'notifications', label: '通知页' },
    { key: 'list', label: '列表页' },
  ];

  const DEFAULT_SETTINGS = {
    settingsRevision: 9,
    keywords: [],
    excludeKeywords: [],
    keywordMode: 'plain',   // 'plain' | 'and' | 'regex'
    filter: 'all',
    sourceFilter: 'all',
    mediaFilter: 'all',
    sortBy: 'default',      // 'default' | 'time_asc' | 'captures' | 'author' | 'source'
    autoCleanDays: 0,
    maxPosts: 1000,
    flashMs: 8000,
    markReadOnClick: true,
    skipSources: [],
    theme: 'auto',          // 'auto' | 'dark' | 'light'
    pageSize: 60,
    badgePos: null,         // 桌面端可拖动徽标位置 { left, bottom }
    hideAds: true,          // 默认关闭广告（隐藏含“广告”标记的推广帖）
    hideAdultSpam: false,   // 隐藏疑似黄推 / 成人引流机器人
    adultSpamLevel: 'balanced', // 'conservative' | 'balanced'
    adultSpamSkipFollowing: true, // 默认不审查已经关注的账号
    adultSpamSkipFollowingReposts: false, // 可选：不审查已关注账号转发的第三方内容
    knownFollowedHandles: [], // 从 X 接口、主页按钮和“正在关注”时间线学习的本地关注关系
    adultSpamKeywords: [],  // 用户自定义字面关键词（命中即隐藏）
    adultSpamWhitelist: [], // 用户名白名单（不带 @）
    layoutEnabled: false,   // 界面净化与宽屏总开关
    layoutAutoWidth: true,  // 默认读取 X 当前实际宽度，不主动改写原生宽度
    timelineWidth: 600,
    leftbarWidth: 275,
    layoutHideLeftbar: false,
    layoutHideSidebar: false,
    layoutFillCenter: false,
    layoutCleanNavigation: true,
    layoutHideMessageGrok: true,
    layoutHideShowMore: false,
    mediaDownload: true,    // 默认开启一键下载图片/视频/GIF
    bypassAgeRestriction: false, // 取消年龄限制：用原图/视频内联替换遮罩
    firefoxCompatibility: false, // Firefox 兼容模式：停用页面 fetch/XHR Hook
    firefoxCompatibilityPrompted: false, // 是否已完成 Firefox 首次兼容性询问
    useMobileBadgeOnDesktop: false, // PC 端可选使用移动端圆形图标徽标
    downloadTimeout: 360000, // 下载超时（毫秒），默认 360 秒
  };

  const state = {
    dbPromise: null,
    dbWriteQueue: Promise.resolve(),
    posts: [],
    settings: { ...DEFAULT_SETTINGS },
    searchQuery: '',
    expandedPosts: new Set(),
    editingNoteId: null,
    renderLimit: DEFAULT_SETTINGS.pageSize,
    lastFilteredCount: 0,

    visibleMap: new Map(),

    observer: null,
    cleanupTimer: null,
    networkHookTimer: null,
    settingsLoaded: false,
    panelOpen: false,
    panelView: 'vault',

    rootEl: null,
    panelEl: null,
    badgeEl: null,
    listEl: null,
    summaryEl: null,
    filterBarEl: null,
    sourceSelectEl: null,
    mediaSelectEl: null,
    keywordInputEl: null,
    excludeInputEl: null,
    keywordModeEl: null,
    searchEl: null,
    sortEl: null,
    autoCleanInputEl: null,
    maxPostsInputEl: null,
    flashMsInputEl: null,
    dlTimeoutInputEl: null,
    markReadEl: null,
    themeSelectEl: null,
    skipSourcesEl: null,
    importInputEl: null,
    hideAdultSpamEl: null,
    adultSpamLevelEl: null,
    adultSpamSkipFollowingEl: null,
    adultSpamSkipFollowingRepostsEl: null,
    adultSpamKeywordsEl: null,
    adultSpamWhitelistEl: null,
    adultSpamCountEl: null,
    layoutEnabledEl: null,
    layoutAutoWidthEl: null,
    timelineWidthEl: null,
    leftbarWidthEl: null,
    layoutHideLeftbarEl: null,
    layoutHideSidebarEl: null,
    layoutFillCenterEl: null,
    layoutCleanNavigationEl: null,
    layoutHideMessageGrokEl: null,
    layoutHideShowMoreEl: null,
    firefoxCompatibilityEl: null,
    useMobileBadgeOnDesktopEl: null,
    layoutStyleEl: null,
    detectedTimelineWidth: 0,
    detectedLeftbarWidth: 0,
    mobileComposeEl: null,
    mobileComposeOpacityEl: null,
    mobileComposeObserver: null,
    mobileComposeResizeObserver: null,
    mobileBadgeRaf: 0,
  };

  // 关键词匹配缓存（避免每次渲染都重算）
  let matchCache = new Map();
  let matchCacheVersion = 0;

  // 内容净化判定缓存：文章节点会持续补全，指纹变化时自动重新判断。
  let adultSpamCache = new WeakMap();
  let adultSpamRulesVersion = 0;
  const followedHandles = new Set();
  const adultSpamScannedIds = new Set();
  const adultSpamSessionHiddenIds = new Set();
  let adultSpamScrollToken = 0;
  const scheduleFollowingFilterRefresh = debounce(() => {
    adultSpamRulesVersion++;
    adultSpamCache = new WeakMap();
    if (document.body && state.settings.hideAdultSpam && state.settings.adultSpamSkipFollowing) {
      applyAdultSpamFiltering();
    } else {
      updateAdultSpamCount();
    }
  }, 250);
  const scheduleFollowedHandlesPersist = debounce(() => {
    if (!state.settingsLoaded) return;
    state.settings.knownFollowedHandles = [...followedHandles].sort().slice(0, 5000);
    queueDbWrite(async () => { await persistSettings(); });
  }, 750);

  function rememberFollowingRelation(handle, following) {
    const normalized = String(handle || '').replace(/^@+/, '').toLowerCase();
    if (!/^[a-z0-9_]{1,15}$/.test(normalized) || typeof following !== 'boolean') return false;
    const hadHandle = followedHandles.has(normalized);
    if (following) followedHandles.add(normalized);
    else followedHandles.delete(normalized);
    if (hadHandle === following) return false;
    scheduleFollowingFilterRefresh();
    scheduleFollowedHandlesPersist();
    return true;
  }

  // ── 基础工具 ──────────────────────────────────────────────────────
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

  // 后台扫描时用防抖刷新；正在编辑备注时不重绘列表，避免打断输入
  const debouncedRefreshUI = debounce(() => {
    if (state.editingNoteId) { refreshBadge(); return; }
    refreshUI({ keepScroll: true });
  }, 120);

  const TIME_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
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
    )].find((tab) => !tab.closest('#xvault-root'));
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
    const displayName = (userNameNode?.innerText || '').trim() || lines[0] || '';
    return { displayName, username };
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

  function detectMedia(article) {
    const thumbs = [];
    let hasImage = false;
    let hasVideo = false;
    for (const img of article.querySelectorAll('img[src]')) {
      const src = img.getAttribute('src') || '';
      if (/pbs\.twimg\.com\/media/.test(src) || /\/media\//.test(src)) {
        hasImage = true;
        if (thumbs.length < 4) thumbs.push(src);
      }
    }
    const video = article.querySelector('video');
    if (video) {
      hasVideo = true;
      const poster = video.getAttribute('poster') || '';
      if (poster && thumbs.length < 4) thumbs.push(poster);
    }
    if (!hasImage && article.querySelector('img[src*="media"]')) hasImage = true;
    return { hasImage, hasVideo, thumbs: uniqueStrings(thumbs).slice(0, 4) };
  }

  function extractAvatar(article) {
    const img = article.querySelector('img[src*="profile_images"]');
    return img ? (img.getAttribute('src') || '') : '';
  }

  function isProbablyPostArticle(article) {
    if (!(article instanceof HTMLElement)) return false;
    const url = getStatusLink(article);
    if (!url) return false;
    return !!extractStatusIdFromUrl(url);
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

  // 拒绝常见灾难性回溯结构：过长表达式、反向引用，以及带重复/分支的分组再次重复。
  // JavaScript 正则没有原生超时，因此这里采用保守白名单式检查，并同时限制待匹配文本长度。
  function isSafeRegexSource(src) {
    const text = String(src || '');
    if (!text || text.length > MAX_REGEX_SOURCE_LENGTH) return false;
    if (/\\(?:[1-9][0-9]*|k<)/.test(text)) return false;

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
    return stack.length === 1 && !inClass && !escaped;
  }

  function safeRegex(src, flags) {
    if (!isSafeRegexSource(src)) return null;
    try { return new RegExp(src, flags); } catch { return null; }
  }

  function computeMatchedKeywords(post) {
    const cached = matchCache.get(post.id);
    if (cached && cached.v === matchCacheVersion) return cached.matched;

    const keywords = state.settings.keywords || [];
    const mode = state.settings.keywordMode || 'plain';
    let matched = [];

    if (keywords.length) {
      const haystack = buildHaystack(post).slice(0, MAX_REGEX_HAYSTACK_LENGTH);
      const lower = haystack.toLowerCase();
      if (mode === 'regex') {
        matched = keywords.filter((kw) => { const re = safeRegex(kw, 'i'); return re ? re.test(haystack) : false; });
      } else if (mode === 'and') {
        const all = keywords.every((kw) => lower.includes(kw.toLowerCase()));
        matched = all ? [...keywords] : [];
      } else {
        matched = keywords.filter((kw) => lower.includes(kw.toLowerCase()));
      }
    }
    matchCache.set(post.id, { v: matchCacheVersion, matched });
    return matched;
  }

  function matchesExclude(post) {
    const ex = state.settings.excludeKeywords || [];
    if (!ex.length) return false;
    const mode = state.settings.keywordMode || 'plain';
    const haystack = buildHaystack(post).slice(0, MAX_REGEX_HAYSTACK_LENGTH);
    const lower = haystack.toLowerCase();
    if (mode === 'regex') {
      return ex.some((kw) => { const re = safeRegex(kw, 'i'); return re ? re.test(haystack) : false; });
    }
    return ex.some((kw) => lower.includes(kw.toLowerCase()));
  }

  // 在“原始文本”上定位匹配区间再分段转义，修复关键词含特殊字符时高亮失效
  function highlightText(rawText, matchedKeywords) {
    const text = rawText || '';
    const mode = state.settings.keywordMode || 'plain';
    const usable = uniqueStrings(matchedKeywords || []).filter(Boolean);
    if (!usable.length) return escapeHtml(text).replace(/\n/g, '<br>');

    let combined = null;
    if (mode === 'regex') {
      const parts = usable.filter((kw) => safeRegex(kw, ''));
      combined = parts.length ? safeRegex(`(${parts.join('|')})`, 'gi') : null;
    } else {
      const sorted = [...usable].sort((a, b) => b.length - a.length);
      combined = safeRegex(`(${sorted.map(escapeRegExp).join('|')})`, 'gi');
    }
    if (!combined) return escapeHtml(text).replace(/\n/g, '<br>');

    let out = '';
    let lastIndex = 0;
    let m;
    combined.lastIndex = 0;
    while ((m = combined.exec(text)) !== null) {
      if (m[0].length === 0) { combined.lastIndex++; continue; }
      out += escapeHtml(text.slice(lastIndex, m.index));
      out += `<mark class="xvault-hl">${escapeHtml(m[0])}</mark>`;
      lastIndex = m.index + m[0].length;
    }
    out += escapeHtml(text.slice(lastIndex));
    return out.replace(/\n/g, '<br>');
  }

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

  // 超出上限时修剪，但永不删除收藏 / 置顶的帖子
  async function enforceMaxPosts() {
    const max = state.settings.maxPosts || 500;
    const kept = state.posts.filter(protectedPost);
    const others = state.posts
      .filter((p) => !protectedPost(p))
      .sort((a, b) => (b.lastCapturedAt || 0) - (a.lastCapturedAt || 0));
    const allowOthers = Math.max(0, max - kept.length);
    if (others.length <= allowOthers) return;
    const toDelete = others.slice(allowOthers);
    const keepOthers = others.slice(0, allowOthers);
    state.posts = [...kept, ...keepOthers];
    const ids = toDelete.map((p) => p.id);
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
        ? `<img class="xvault-mobile-icon" src="${escapeHtml(APP_ICON_URL)}" alt="" draggable="false" />`
        : '<span class="xvault-mobile-icon-fallback">🧰</span>';
      state.badgeEl.innerHTML = `${iconHtml}<span class="xvault-mobile-dot" style="display:${unreadCount > 0 ? 'block' : 'none'}">${unreadCount}</span>`;
    } else {
      state.badgeEl.textContent = `总数 ${totalCount} · 未读${unreadCount}${flashCount ? ` · ⚡${flashCount}` : ''}`;
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
    return `
      <div class="xvault-stat">总数 <b>${total}</b></div>
      <div class="xvault-stat">未打开 <b>${unread}</b></div>
      <div class="xvault-stat">已打开 <b>${opened}</b></div>
      <div class="xvault-stat">已收藏 <b>${favorite}</b></div>
      <div class="xvault-stat">已置顶 <b>${pinned}</b></div>
      <div class="xvault-stat">快速消失 <b>${flash}</b></div>
      <div class="xvault-stat">命中关键词 <b>${keywordHits}</b></div>
    `;
  }

  function buildFilterHtml() {
    return FILTERS.map((f) => {
      const active = state.settings.filter === f.key ? 'active' : '';
      return `<button class="xvault-chip ${active}" data-action="set-filter" data-filter="${escapeHtml(f.key)}">${escapeHtml(f.label)}</button>`;
    }).join('');
  }

  function getAvailableSources() {
    return uniqueStrings(state.posts.map((p) => p.sourceLabel).filter(Boolean))
      .sort((a, b) => localizeSourceLabel(a).localeCompare(localizeSourceLabel(b), 'zh-CN'));
  }

  function localizeSourceLabel(source) {
    const raw = String(source || '').trim();
    const exactLabels = {
      Home: '主页',
      Following: '正在关注',
      'For You': '为你推荐',
      Search: '搜索',
      List: '列表',
      Bookmarks: '书签',
      Notifications: '通知',
      Unknown: '未知页面',
    };
    if (exactLabels[raw]) return exactLabels[raw];
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
      return `<option value="${escapeHtml(source)}" ${isSelected}>${escapeHtml(label)}</option>`;
    }).join('');
  }

  function buildMediaOptionsHtml() {
    const selected = state.settings.mediaFilter || 'all';
    return MEDIA_FILTERS.map((f) => {
      const isSelected = selected === f.key ? 'selected' : '';
      return `<option value="${escapeHtml(f.key)}" ${isSelected}>${escapeHtml(f.label)}</option>`;
    }).join('');
  }

  function buildSkipSourcesHtml() {
    const skip = state.settings.skipSources || [];
    return SKIP_SOURCE_OPTIONS.map((o) => {
      const active = skip.includes(o.key) ? 'active' : '';
      return `<button class="xvault-chip ${active}" data-action="toggle-skip" data-skip="${escapeHtml(o.key)}">${escapeHtml(o.label)}</button>`;
    }).join('');
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
    const sortBy = state.settings.sortBy || 'default';
    result.sort((a, b) => {
      const pinDiff = Number(!!b.pinned) - Number(!!a.pinned);
      if (pinDiff !== 0) return pinDiff;
      if (sortBy === 'time_asc') return (a.lastCapturedAt || 0) - (b.lastCapturedAt || 0);
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
    return matchedKeywords.map((kw) => `<span class="xvault-tag keyword">${escapeHtml(kw)}</span>`).join('');
  }

  function renderMetaTags(post) {
    const tags = [];
    if (post.pinned) tags.push(`<span class="xvault-tag pin">📌 置顶</span>`);
    if (post.favorite) tags.push(`<span class="xvault-tag fav">★ 已收藏</span>`);
    if (post.flashLost && !post.clicked) tags.push(`<span class="xvault-tag flash">⚡ 快速消失</span>`);
    if (post.clicked) tags.push(`<span class="xvault-tag opened">👁 已打开</span>`);
    if (post.hasImage) tags.push(`<span class="xvault-tag">🖼 图片</span>`);
    if (post.hasVideo) tags.push(`<span class="xvault-tag">🎬 视频</span>`);
    if (post.sourceLabel) tags.push(`<span class="xvault-tag source">来源: ${escapeHtml(localizeSourceLabel(post.sourceLabel))}</span>`);
    return tags.join('');
  }

  function renderThumbs(post) {
    const thumbs = uniqueStrings((post.mediaThumbs || []).map(safeImportedAssetUrl).filter(Boolean)).slice(0, 4);
    if (!thumbs.length) return '';
    return `<div class="xvault-thumbs">${thumbs.map((src) =>
      `<img class="xvault-thumb" src="${escapeHtml(src)}" loading="lazy" referrerpolicy="no-referrer" alt="" />`
    ).join('')}</div>`;
  }

  function renderPostItem(post) {
    const matchedKeywords = computeMatchedKeywords(post);
    const authorHtml = highlightText([post.displayName || '', post.username || ''].filter(Boolean).join(' '), matchedKeywords);
    const textHtml = highlightText(post.text || '(无正文)', matchedKeywords);
    const isExpanded = state.expandedPosts.has(post.id);
    const isEditingNote = state.editingNoteId === post.id;
    const textIsLong = (post.text || '').length > 120;
    const historyText = (post.sourceHistory || []).length > 1
      ? ` · 历史来源: ${(post.sourceHistory || []).map(localizeSourceLabel).join(' / ')}`
      : '';
    const avatarUrl = safeImportedAssetUrl(post.avatarUrl);
    const avatarHtml = avatarUrl
      ? `<img class="xvault-avatar" src="${escapeHtml(avatarUrl)}" referrerpolicy="no-referrer" alt="" />`
      : '';
    const noteHtml = isEditingNote
      ? `<div class="xvault-note-edit">
           <textarea class="xvault-note-input" data-id="${escapeHtml(post.id)}" placeholder="在这里写备注…">${escapeHtml(post.note || '')}</textarea>
           <div class="xvault-note-actions">
             <button class="xvault-btn primary" data-action="save-note" data-id="${escapeHtml(post.id)}">保存备注</button>
             <button class="xvault-btn" data-action="cancel-note">取消</button>
           </div>
         </div>`
      : `<button class="xvault-btn xvault-note-btn" data-action="edit-note" data-id="${escapeHtml(post.id)}">${post.note ? '✏️ 备注' : '+ 备注'}</button>
         ${post.note ? `<div class="xvault-note-text">💬 ${escapeHtml(post.note)}</div>` : ''}`;

    return `
      <div class="xvault-item ${post.flashLost ? 'is-flash-lost' : ''} ${post.pinned ? 'is-pinned' : ''} ${!post.clicked ? 'is-unread' : ''}" data-id="${escapeHtml(post.id)}">
        <div class="xvault-item-top">
          <div class="xvault-author">
            <div class="xvault-author-head">
              ${avatarHtml}
              <div class="xvault-author-line">${authorHtml}</div>
            </div>
            <div class="xvault-submeta">
              <span>抓取: ${escapeHtml(formatTime(post.lastCapturedAt))}</span>
              <span>出现: ${escapeHtml(String(post.capturedCount || 1))} 次</span>
            </div>
          </div>
          <div class="xvault-actions">
            <button class="xvault-btn primary" data-action="open" data-id="${escapeHtml(post.id)}">打开</button>
            <button class="xvault-btn" data-action="copy" data-id="${escapeHtml(post.id)}">复制链接</button>
            <button class="xvault-btn" data-action="pin" data-id="${escapeHtml(post.id)}">${post.pinned ? '取消置顶' : '置顶'}</button>
            <button class="xvault-btn" data-action="fav" data-id="${escapeHtml(post.id)}">${post.favorite ? '取消收藏' : '收藏'}</button>
            <button class="xvault-btn danger" data-action="delete" data-id="${escapeHtml(post.id)}">删</button>
          </div>
        </div>

        <div class="xvault-text ${textIsLong && !isExpanded ? 'collapsed' : ''}">${textHtml}</div>
        ${textIsLong ? `<button class="xvault-expand-btn" data-action="toggle-expand" data-id="${escapeHtml(post.id)}">${isExpanded ? '▲ 收起' : '▼ 展开全文'}</button>` : ''}

        ${renderThumbs(post)}

        <div class="xvault-tags">
          ${renderMetaTags(post)}
          ${renderKeywordTags(matchedKeywords)}
        </div>

        <div class="xvault-note-area">${noteHtml}</div>

        <div class="xvault-bottom-meta">
          <span>当前来源: ${escapeHtml(localizeSourceLabel(post.sourceLabel) || '-')}</span>
          <span>${escapeHtml(historyText)}</span>
        </div>
      </div>
    `;
  }

  function refreshUI(opts) {
    opts = opts || {};
    if (!state.panelEl) return;
    const keepListScroll = !!opts.keepScroll || state.panelView === 'settings';
    refreshBadge();

    if (state.summaryEl) state.summaryEl.innerHTML = buildSummaryHtml();
    if (state.filterBarEl) state.filterBarEl.innerHTML = buildFilterHtml();
    if (state.sourceSelectEl) {
      const cur = state.settings.sourceFilter || 'all';
      state.sourceSelectEl.innerHTML = buildSourceOptionsHtml();
      state.sourceSelectEl.value = cur;
    }
    if (state.mediaSelectEl) state.mediaSelectEl.value = state.settings.mediaFilter || 'all';
    if (state.skipSourcesEl) state.skipSourcesEl.innerHTML = buildSkipSourcesHtml();
    if (state.keywordInputEl && document.activeElement !== state.keywordInputEl) {
      state.keywordInputEl.value = (state.settings.keywords || []).join(', ');
    }
    if (state.excludeInputEl && document.activeElement !== state.excludeInputEl) {
      state.excludeInputEl.value = (state.settings.excludeKeywords || []).join(', ');
    }
    if (state.keywordModeEl) state.keywordModeEl.value = state.settings.keywordMode || 'plain';
    if (state.sortEl) state.sortEl.value = state.settings.sortBy || 'default';
    if (state.autoCleanInputEl && document.activeElement !== state.autoCleanInputEl) {
      state.autoCleanInputEl.value = String(state.settings.autoCleanDays || 0);
    }
    if (state.maxPostsInputEl && document.activeElement !== state.maxPostsInputEl) {
      state.maxPostsInputEl.value = String(state.settings.maxPosts || DEFAULT_SETTINGS.maxPosts);
    }
    if (state.flashMsInputEl && document.activeElement !== state.flashMsInputEl) {
      state.flashMsInputEl.value = String(Math.round((state.settings.flashMs || 8000) / 1000));
    }
    if (state.dlTimeoutInputEl && document.activeElement !== state.dlTimeoutInputEl) {
      state.dlTimeoutInputEl.value = String(Math.round((state.settings.downloadTimeout || DEFAULT_SETTINGS.downloadTimeout) / 1000));
    }
    if (state.markReadEl) state.markReadEl.checked = state.settings.markReadOnClick !== false;
    if (state.themeSelectEl) state.themeSelectEl.value = state.settings.theme || 'auto';
    if (state.hideAdsEl) state.hideAdsEl.checked = !!state.settings.hideAds;
    if (state.hideAdultSpamEl) state.hideAdultSpamEl.checked = !!state.settings.hideAdultSpam;
    if (state.adultSpamLevelEl) state.adultSpamLevelEl.value = state.settings.adultSpamLevel || DEFAULT_SETTINGS.adultSpamLevel;
    if (state.adultSpamSkipFollowingEl) state.adultSpamSkipFollowingEl.checked = state.settings.adultSpamSkipFollowing !== false;
    if (state.adultSpamSkipFollowingRepostsEl) {
      state.adultSpamSkipFollowingRepostsEl.checked = !!state.settings.adultSpamSkipFollowingReposts;
    }
    if (state.adultSpamKeywordsEl && document.activeElement !== state.adultSpamKeywordsEl) {
      state.adultSpamKeywordsEl.value = (state.settings.adultSpamKeywords || []).join(', ');
    }
    if (state.adultSpamWhitelistEl && document.activeElement !== state.adultSpamWhitelistEl) {
      state.adultSpamWhitelistEl.value = (state.settings.adultSpamWhitelist || []).map((name) => '@' + name).join(', ');
    }
    if (state.layoutEnabledEl) state.layoutEnabledEl.checked = !!state.settings.layoutEnabled;
    if (state.layoutAutoWidthEl) state.layoutAutoWidthEl.checked = state.settings.layoutAutoWidth !== false;
    if (state.timelineWidthEl && document.activeElement !== state.timelineWidthEl) {
      state.timelineWidthEl.value = String(
        state.settings.layoutAutoWidth !== false && state.detectedTimelineWidth
          ? state.detectedTimelineWidth
          : (state.settings.timelineWidth || DEFAULT_SETTINGS.timelineWidth)
      );
    }
    if (state.leftbarWidthEl && document.activeElement !== state.leftbarWidthEl) {
      state.leftbarWidthEl.value = String(
        state.settings.layoutAutoWidth !== false && state.detectedLeftbarWidth
          ? state.detectedLeftbarWidth
          : (state.settings.leftbarWidth || DEFAULT_SETTINGS.leftbarWidth)
      );
    }
    if (state.layoutHideLeftbarEl) state.layoutHideLeftbarEl.checked = !!state.settings.layoutHideLeftbar;
    if (state.layoutHideSidebarEl) state.layoutHideSidebarEl.checked = !!state.settings.layoutHideSidebar;
    if (state.layoutFillCenterEl) state.layoutFillCenterEl.checked = !!state.settings.layoutFillCenter;
    if (state.layoutCleanNavigationEl) state.layoutCleanNavigationEl.checked = state.settings.layoutCleanNavigation !== false;
    if (state.layoutHideMessageGrokEl) state.layoutHideMessageGrokEl.checked = state.settings.layoutHideMessageGrok !== false;
    if (state.layoutHideShowMoreEl) state.layoutHideShowMoreEl.checked = !!state.settings.layoutHideShowMore;
    updateAdultSpamCount();
    if (state.mediaDownloadEl) state.mediaDownloadEl.checked = !!state.settings.mediaDownload;
    if (state.bypassAgeEl) state.bypassAgeEl.checked = !!state.settings.bypassAgeRestriction;
    if (state.firefoxCompatibilityEl) {
      state.firefoxCompatibilityEl.checked = !!state.settings.firefoxCompatibility;
    }
    if (state.useMobileBadgeOnDesktopEl) {
      state.useMobileBadgeOnDesktopEl.checked = !!state.settings.useMobileBadgeOnDesktop;
    }
    updateSettingsDependencyUI();

    if (!state.listEl) return;
    const scrollTop = keepListScroll ? state.listEl.scrollTop : 0;

    const filtered = filterPosts(state.posts);
    state.lastFilteredCount = filtered.length;

    if (!filtered.length) {
      state.listEl.innerHTML = `<div class="xvault-empty">当前筛选条件下没有帖子。可以刷新页面、切换 X 标签页，或把筛选改回“全部”。</div>`;
      return;
    }

    const limit = state.renderLimit || state.settings.pageSize || 60;
    const shown = filtered.slice(0, limit);
    let html = shown.map(renderPostItem).join('');
    if (filtered.length > shown.length) {
      html += `<button class="xvault-loadmore" data-action="load-more">加载更多（还有 ${filtered.length - shown.length} 条）</button>`;
    }
    state.listEl.innerHTML = html;
    if (keepListScroll) state.listEl.scrollTop = scrollTop;
  }

  function sanitizeSettings(raw) {
    const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const enumValue = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
    const stringList = (value, maxItems, maxLength) => uniqueStrings(
      (Array.isArray(value) ? value : []).map((item) => safeString(item, maxLength).trim()).filter(Boolean)
    ).slice(0, maxItems);
    const badgePos = input.badgePos && Number.isFinite(input.badgePos.left) && Number.isFinite(input.badgePos.bottom)
      ? { left: input.badgePos.left, bottom: input.badgePos.bottom }
      : null;
    return {
      settingsRevision: DEFAULT_SETTINGS.settingsRevision,
      keywords: stringList(input.keywords, 50, 500),
      excludeKeywords: stringList(input.excludeKeywords, 50, 500),
      keywordMode: enumValue(input.keywordMode, ['plain', 'and', 'regex'], DEFAULT_SETTINGS.keywordMode),
      filter: enumValue(input.filter, FILTERS.map((item) => item.key), DEFAULT_SETTINGS.filter),
      sourceFilter: safeString(input.sourceFilter, 100) || DEFAULT_SETTINGS.sourceFilter,
      mediaFilter: enumValue(input.mediaFilter, MEDIA_FILTERS.map((item) => item.key), DEFAULT_SETTINGS.mediaFilter),
      sortBy: enumValue(input.sortBy, ['default', 'time_asc', 'captures', 'author', 'source'], DEFAULT_SETTINGS.sortBy),
      autoCleanDays: clampInt(input.autoCleanDays, 0, 3650, DEFAULT_SETTINGS.autoCleanDays),
      maxPosts: clampInt(input.maxPosts, 50, 5000, DEFAULT_SETTINGS.maxPosts),
      flashMs: clampInt(input.flashMs, 1000, 60000, DEFAULT_SETTINGS.flashMs),
      downloadTimeout: clampInt(input.downloadTimeout, 5000, 600000, DEFAULT_SETTINGS.downloadTimeout),
      markReadOnClick: typeof input.markReadOnClick === 'boolean' ? input.markReadOnClick : DEFAULT_SETTINGS.markReadOnClick,
      skipSources: stringList(input.skipSources, SKIP_SOURCE_OPTIONS.length, 30)
        .filter((key) => SKIP_SOURCE_OPTIONS.some((item) => item.key === key)),
      theme: enumValue(input.theme, ['auto', 'dark', 'light'], DEFAULT_SETTINGS.theme),
      pageSize: clampInt(input.pageSize, 20, 200, DEFAULT_SETTINGS.pageSize),
      badgePos,
      hideAds: typeof input.hideAds === 'boolean' ? input.hideAds : DEFAULT_SETTINGS.hideAds,
      hideAdultSpam: input.hideAdultSpam === true,
      adultSpamLevel: enumValue(input.adultSpamLevel, ['conservative', 'balanced'], DEFAULT_SETTINGS.adultSpamLevel),
      adultSpamSkipFollowing: typeof input.adultSpamSkipFollowing === 'boolean'
        ? input.adultSpamSkipFollowing
        : DEFAULT_SETTINGS.adultSpamSkipFollowing,
      adultSpamSkipFollowingReposts: input.adultSpamSkipFollowingReposts === true,
      knownFollowedHandles: uniqueStrings(stringList(input.knownFollowedHandles, 5000, 30)
        .map((item) => item.replace(/^@+/, '').toLowerCase())
        .filter((item) => /^[a-z0-9_]{1,15}$/.test(item))),
      adultSpamKeywords: stringList(input.adultSpamKeywords, 50, 80),
      adultSpamWhitelist: uniqueStrings(stringList(input.adultSpamWhitelist, 100, 30)
        .map((item) => item.replace(/^@+/, '').toLowerCase())
        .filter((item) => /^[a-z0-9_]{1,15}$/.test(item))),
      layoutEnabled: input.layoutEnabled === true,
      layoutAutoWidth: input.layoutAutoWidth !== false,
      timelineWidth: clampInt(input.timelineWidth, 600, 3000, DEFAULT_SETTINGS.timelineWidth),
      leftbarWidth: clampInt(input.leftbarWidth, 160, 500, DEFAULT_SETTINGS.leftbarWidth),
      layoutHideLeftbar: input.layoutHideLeftbar === true,
      layoutHideSidebar: input.layoutHideSidebar === true,
      layoutFillCenter: input.layoutFillCenter === true,
      layoutCleanNavigation: input.layoutCleanNavigation !== false,
      layoutHideMessageGrok: input.layoutHideMessageGrok !== false,
      layoutHideShowMore: input.layoutHideShowMore === true,
      mediaDownload: typeof input.mediaDownload === 'boolean' ? input.mediaDownload : DEFAULT_SETTINGS.mediaDownload,
      bypassAgeRestriction: input.bypassAgeRestriction === true,
      firefoxCompatibility: input.firefoxCompatibility === true,
      firefoxCompatibilityPrompted: input.firefoxCompatibilityPrompted === true,
      useMobileBadgeOnDesktop: input.useMobileBadgeOnDesktop === true,
    };
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
      // v1.6.2 起内容净化默认使用“均衡”；把旧版默认档位迁移到新默认。
      if (revision < 4 && (input.adultSpamLevel == null || input.adultSpamLevel === 'conservative')) {
        input.adultSpamLevel = DEFAULT_SETTINGS.adultSpamLevel;
      }
      // v1.7 收尾版默认开启广告过滤和媒体下载；旧版默认关闭值同步迁移。
      if (revision < 7) {
        if (input.hideAds == null || input.hideAds === false) input.hideAds = true;
        if (input.mediaDownload == null || input.mediaDownload === false) input.mediaDownload = true;
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
    await dbPutSetting('settings', sanitizeSettings(state.settings));
  }

  function resetPaging() { state.renderLimit = state.settings.pageSize || 60; }

  function setSettingsPartial(nextPartial) {
    const touchesKeywords = ('keywords' in nextPartial) || ('excludeKeywords' in nextPartial) || ('keywordMode' in nextPartial);
    const touchesAdultSpam = ('hideAdultSpam' in nextPartial) || ('adultSpamLevel' in nextPartial)
      || ('adultSpamSkipFollowing' in nextPartial) || ('adultSpamSkipFollowingReposts' in nextPartial)
      || ('adultSpamKeywords' in nextPartial)
      || ('adultSpamWhitelist' in nextPartial);
    const touchesLayout = ['layoutEnabled', 'layoutAutoWidth', 'timelineWidth', 'leftbarWidth', 'layoutHideLeftbar',
      'layoutHideSidebar', 'layoutFillCenter', 'layoutCleanNavigation', 'layoutHideMessageGrok',
      'layoutHideShowMore'].some((key) => key in nextPartial);
    state.settings = { ...state.settings, ...nextPartial };
    if (touchesKeywords) bumpKeywordCache();
    if (touchesAdultSpam) {
      adultSpamRulesVersion++;
      adultSpamCache = new WeakMap();
      applyAdultSpamFiltering();
    }
    if (touchesLayout) applyLayoutEnhancements();
    if ('theme' in nextPartial) applyTheme();
    if ('hideAds' in nextPartial) applyAdHiding();
    if ('mediaDownload' in nextPartial) applyMediaDownload();
    if ('bypassAgeRestriction' in nextPartial) applyAgeBypass();
    if ('firefoxCompatibility' in nextPartial && IS_FIREFOX) {
      state.settings.firefoxCompatibilityPrompted = true;
      writeFirefoxCompatibilityMode(nextPartial.firefoxCompatibility ? 'compat' : 'normal');
    }
    if ('useMobileBadgeOnDesktop' in nextPartial) repositionBadge();
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
    matchCache.delete(id);
    queueDbWrite(async () => { await dbDeletePost(id); });
    refreshUI({ keepScroll: true });
  }

  function clearNonFavoritePosts() {
    const targets = state.posts.filter((p) => !protectedPost(p));
    if (!targets.length) return;
    if (!window.confirm(`确定要清空 ${targets.length} 条未收藏/未置顶的帖子吗？此操作不可撤销。`)) return;
    const ids = targets.map((p) => p.id);
    state.posts = state.posts.filter(protectedPost);
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
  function getPageWindow() {
    // Firefox 首次选择前或兼容模式开启时，不读取 unsafeWindow 的页面对象。
    if (IS_FIREFOX && firefoxCompatibilityMode !== 'normal') return window;
    return (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
  }
  let networkHookWarningShown = false;
  const mediaRegistry = new Map(); // statusId -> { photos:[], gifs:[], videos:[] }
  // 卡片媒体注册表（第三方引用卡片 / 内嵌播放器）
  const cardRegistry = new Map(); // statusId -> { photos:[], gifs:[], videos:[] }

  function registerMedia(id, mediaArr) {
    if (!id || !Array.isArray(mediaArr) || !mediaArr.length) return;
    const key = String(id);
    const entry = mediaRegistry.get(key) || { photos: [], gifs: [], videos: [] };
    for (const m of mediaArr) {
      if (!m || typeof m !== 'object') continue;
      if (m.type === 'photo' && m.media_url_https) {
        entry.photos.push(m.media_url_https);
      } else if ((m.type === 'video' || m.type === 'animated_gif') && m.video_info && Array.isArray(m.video_info.variants)) {
        const mp4s = m.video_info.variants.filter((v) => v && v.content_type === 'video/mp4' && v.url);
        mp4s.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        if (mp4s[0]) {
          if (m.type === 'animated_gif') entry.gifs.push(mp4s[0].url);
          else entry.videos.push(mp4s[0].url);
        }
      }
    }
    entry.photos = uniqueStrings(entry.photos);
    entry.gifs = uniqueStrings(entry.gifs);
    entry.videos = uniqueStrings(entry.videos);
    mediaRegistry.set(key, entry);
  }

  function pushCardEntry(id, acc) {
    if (!id) return;
    if (!acc || (!acc.photos.length && !acc.gifs.length && !acc.videos.length)) return;
    const key = String(id);
    const entry = cardRegistry.get(key) || { photos: [], gifs: [], videos: [] };
    acc.photos.forEach((u) => { if (u) entry.photos.push(u); });
    acc.gifs.forEach((u) => { if (u) entry.gifs.push(u); });
    acc.videos.forEach((u) => { if (u) entry.videos.push(u); });
    entry.photos = uniqueStrings(entry.photos);
    entry.gifs = uniqueStrings(entry.gifs);
    entry.videos = uniqueStrings(entry.videos);
    cardRegistry.set(key, entry);
  }

  // 从一个 media_entity（含 type/media_url_https/video_info）取最佳 URL
  function pickEntityMedia(m, acc) {
    if (!m || typeof m !== 'object') return false;
    if (m.type === 'photo' && m.media_url_https) { acc.photos.push(m.media_url_https); return true; }
    if ((m.type === 'video' || m.type === 'animated_gif') && m.video_info && Array.isArray(m.video_info.variants)) {
      const mp4s = m.video_info.variants.filter((v) => v && v.content_type === 'video/mp4' && v.url);
      mp4s.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      if (mp4s[0]) { (m.type === 'animated_gif' ? acc.gifs : acc.videos).push(mp4s[0].url); return true; }
    }
    return false;
  }

  // 解析推文的 card 结构：优先 unified_card 里的真实媒体，其次 mp4 流，最后退而用最大缩略图
  function harvestCard(id, card) {
    if (!id || !card || typeof card !== 'object') return;
    const legacy = card.legacy || card;
    const bvs = legacy.binding_values;
    const entries = [];
    if (Array.isArray(bvs)) { for (const e of bvs) if (e && e.key) entries.push(e); }
    else if (bvs && typeof bvs === 'object') { for (const k in bvs) entries.push({ key: k, value: bvs[k] }); }
    if (!entries.length) return;
    const acc = { photos: [], gifs: [], videos: [] };
    const thumbs = [];
    let gotReal = false;
    for (const e of entries) {
      const key = e.key || '';
      const val = e.value || {};
      if (key === 'unified_card' && val.string_value) {
        try {
          const uc = JSON.parse(val.string_value);
          const me = uc && uc.media_entities;
          if (me && typeof me === 'object') { for (const mk in me) { if (pickEntityMedia(me[mk], acc)) gotReal = true; } }
        } catch (e2) {}
      }
      const sv = val.string_value;
      if (typeof sv === 'string' && sv.indexOf('.mp4') !== -1 && /^https?:/i.test(sv)) { acc.videos.push(sv); gotReal = true; }
      if (val.image_value && val.image_value.url) { thumbs.push({ key: key, url: val.image_value.url, w: val.image_value.width || 0 }); }
    }
    if (!gotReal && thumbs.length) {
      thumbs.sort((a, b) => {
        const score = (t) => (/large|orig|full/i.test(t.key) ? 100000 : 0) + (t.w || 0);
        return score(b) - score(a);
      });
      acc.photos.push(thumbs[0].url);
    }
    pushCardEntry(id, acc);
  }

  function harvestFollowingRelationship(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    const legacy = obj.legacy && typeof obj.legacy === 'object' ? obj.legacy : null;
    const handle = safeString(
      (legacy && legacy.screen_name) || obj.screen_name || obj.screenName || '',
      30
    ).replace(/^@+/, '').toLowerCase();
    if (!/^[a-z0-9_]{1,15}$/.test(handle)) return;

    const perspectives = obj.relationship_perspectives && typeof obj.relationship_perspectives === 'object'
      ? obj.relationship_perspectives
      : null;
    const candidates = [
      legacy && legacy.following,
      obj.following,
      perspectives && perspectives.following,
    ];
    const following = candidates.find((value) => typeof value === 'boolean');
    if (typeof following !== 'boolean') return;
    rememberFollowingRelation(handle, following);
  }

  function getHandleFromFollowControl(control) {
    if (!control || !control.getAttribute) return '';
    const labelText = `${control.getAttribute('aria-label') || ''} ${control.innerText || ''}`;
    const labelMatch = labelText.match(/@([a-z0-9_]{1,15})/i);
    if (labelMatch) return labelMatch[1].toLowerCase();
    const href = control.closest('a[href]')?.getAttribute('href') || control.getAttribute('href') || '';
    const hrefMatch = href.match(/^\/([a-z0-9_]{1,15})(?:[/?#]|$)/i);
    if (hrefMatch && !RESERVED_TOP_PATHS.has(hrefMatch[1].toLowerCase())) return hrefMatch[1].toLowerCase();
    const testId = control.getAttribute('data-testid') || '';
    const testIdMatch = testId.match(/^([a-z0-9_]{1,15})-(?:un)?follow$/i);
    return testIdMatch ? testIdMatch[1].toLowerCase() : '';
  }

  function harvestFollowingControlsFromRoot(root) {
    if (!root || !root.querySelectorAll) return false;
    const selector = '[data-testid$="-follow"], [data-testid$="-unfollow"]';
    const controls = [];
    if (root.matches && root.matches(selector)) controls.push(root);
    root.querySelectorAll(selector).forEach((control) => controls.push(control));
    let changed = false;
    for (const control of controls) {
      const testId = control.getAttribute('data-testid') || '';
      const following = testId.endsWith('-unfollow') ? true : (testId.endsWith('-follow') ? false : null);
      const handle = getHandleFromFollowControl(control);
      if (handle && typeof following === 'boolean') {
        changed = rememberFollowingRelation(handle, following) || changed;
      }
    }
    return changed;
  }

  function harvestMedia(obj, depth) {
    if (!obj || typeof obj !== 'object' || depth > 40) return;
    if (Array.isArray(obj)) { for (const it of obj) harvestMedia(it, depth + 1); return; }
    harvestFollowingRelationship(obj);
    const idStr = obj.id_str;
    const ext = obj.extended_entities;
    if (idStr && ext && Array.isArray(ext.media)) registerMedia(idStr, ext.media);
    // 卡片媒体：card 与 legacy 同级，id 取 rest_id / id_str / legacy.id_str
    if (obj.card && typeof obj.card === 'object') {
      const cid = obj.rest_id || idStr || (obj.legacy && obj.legacy.id_str);
      if (cid) { try { harvestCard(String(cid), obj.card); } catch (e) {} }
    }
    for (const k in obj) {
      const v = obj[k];
      if (v && typeof v === 'object') { try { harvestMedia(v, depth + 1); } catch (e) {} }
    }
  }

  function tryHarvest(txt) {
    if (!txt || txt.length > MAX_NETWORK_RESPONSE_BYTES) return;
    if (txt.indexOf('extended_entities') === -1 && txt.indexOf('binding_values') === -1
      && txt.indexOf('"following"') === -1 && txt.indexOf('relationship_perspectives') === -1) return;
    let json;
    try { json = JSON.parse(txt); } catch (e) { return; }
    try { harvestMedia(json, 0); } catch (e) {}
  }

  function harvestXhrResponse(xhr) {
    const url = xhr && xhr.__xvUrl ? String(xhr.__xvUrl) : '';
    if (!/(graphql|\/2\/timeline|\/i\/api\/)/i.test(url)) return;
    try {
      if (xhr.responseType === '' || xhr.responseType === 'text') {
        tryHarvest(xhr.responseText);
      } else if (xhr.responseType === 'json' && xhr.response && typeof xhr.response === 'object') {
        harvestMedia(xhr.response, 0);
      } else if (xhr.responseType === 'arraybuffer' && xhr.response && typeof xhr.response.byteLength === 'number' && xhr.response.byteLength <= MAX_NETWORK_RESPONSE_BYTES) {
        tryHarvest(new TextDecoder('utf-8').decode(new Uint8Array(xhr.response)));
      } else if (xhr.responseType === 'blob' && xhr.response && typeof xhr.response.size === 'number' && typeof xhr.response.text === 'function' && xhr.response.size <= MAX_NETWORK_RESPONSE_BYTES) {
        xhr.response.text().then(tryHarvest).catch(() => {});
      }
    } catch (e) {}
  }

  function warnNetworkHooksDisabled(reason) {
    if (networkHookWarningShown) return;
    networkHookWarningShown = true;
    console.warn('[BetterX] 为避免阻断 X 页面启动，已停用网络媒体采集：', reason);
  }

  function installNetworkHooks() {
    // Firefox/Tampermonkey 可能把脚本放进 JavaScript 沙箱；跨 Xray 返回 Promise/Response，
    // 或与其他下载/过滤脚本叠加包装 fetch/XHR 时，可能令 X 永远停在启动徽标。
    // 首次选择前先安全暂缓；用户明确开启兼容模式后沿用 v1.6.4 的熔断策略。
    if (IS_FIREFOX && firefoxCompatibilityMode !== 'normal') {
      warnNetworkHooksDisabled(firefoxCompatibilityMode === 'compat'
        ? 'Firefox 兼容模式不改写 fetch/XMLHttpRequest'
        : 'Firefox 首次兼容性选择前暂缓改写 fetch/XMLHttpRequest');
      return;
    }

    const pageWin = getPageWindow();
    try {
      const origFetch = pageWin.fetch;
      if (origFetch && !origFetch.__xvHooked) {
        const hooked = function (...args) {
          const p = origFetch.apply(this, args);
          try {
            p.then((res) => {
              try {
                const url = (res && res.url) || '';
                if (res && res.clone && /(graphql|\/2\/timeline|\/i\/api\/)/i.test(url)) {
                  res.clone().text().then(tryHarvest).catch(() => {});
                }
              } catch (e) {}
            }).catch(() => {});
          } catch (e) {}
          return p;
        };
        hooked.__xvHooked = true;
        pageWin.fetch = hooked;
      }
    } catch (e) {}
    try {
      const XHR = pageWin.XMLHttpRequest;
      if (XHR && XHR.prototype && XHR.prototype.open && !XHR.prototype.open.__xvHooked) {
        const origOpen = XHR.prototype.open;
        const hookedOpen = function (method, url) {
          this.__xvUrl = url;
          return origOpen.apply(this, arguments);
        };
        hookedOpen.__xvHooked = true;
        XHR.prototype.open = hookedOpen;
      }
      if (XHR && XHR.prototype && XHR.prototype.send && !XHR.prototype.send.__xvHooked) {
        const origSend = XHR.prototype.send;
        const hookedSend = function () {
          try {
            this.addEventListener('load', () => harvestXhrResponse(this), { once: true });
          } catch (e) {}
          return origSend.apply(this, arguments);
        };
        hookedSend.__xvHooked = true;
        XHR.prototype.send = hookedSend;
      }
    } catch (e) {}
  }

  function extOfUrl(u, def) {
    const base = String(u || '').split('?')[0];
    const m = base.match(/\.([a-zA-Z0-9]{2,4})$/);
    return m ? m[1].toLowerCase() : (def || 'bin');
  }
  // X 对年龄限制帖子渲染的通用占位图 ID（非真实媒体，需要排除）
  const AGE_PLACEHOLDER_RE = /\/media\/GxJIrSUagAAK-ZP\b/;
  function upgradePhoto(u) {
    const base = String(u).split('?')[0];
    const ext = extOfUrl(base, 'jpg');
    return base + '?format=' + ext + '&name=orig';
  }

  // 提取图片的唯一 ID（忽略后缀与查询串），用于去重：
  // 注册表为 .../media/GXXX.jpg，DOM 为 .../media/GXXX?format=jpg&name=...，两者共享同一 ID。
  function photoKey(u) {
    const m = String(u || '').match(/\/media\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : String(u || '').split('?')[0];
  }

  function collectMedia(article, statusId) {
    const out = { photos: [], gifs: [], videos: [] };
    const seenPhoto = new Set();
    const seenGif = new Set();
    const seenVideo = new Set();
    const addPhoto = (u) => { if (!u) return; const k = photoKey(u); if (seenPhoto.has(k)) return; seenPhoto.add(k); out.photos.push(upgradePhoto(u)); };
    const addGif = (u) => { if (!u || seenGif.has(u)) return; seenGif.add(u); out.gifs.push(u); };
    const addVideo = (u) => { if (!u || seenVideo.has(u)) return; seenVideo.add(u); out.videos.push(u); };
    const reg = statusId ? mediaRegistry.get(String(statusId)) : null;
    if (reg) {
      reg.photos.forEach(addPhoto);
      reg.gifs.forEach(addGif);
      reg.videos.forEach(addVideo);
    }
    // DOM 兜底：图片（仅正文媒体，排除头像/表情/卡片图标）
    article.querySelectorAll('[data-testid="tweetPhoto"] img, img[src*="pbs.twimg.com/media/"]').forEach((img) => {
      const src = img.currentSrc || img.src || '';
      if (AGE_PLACEHOLDER_RE.test(src)) return; // X 年龄限制通用占位图，不是真实媒体，跳过
      if (/pbs\.twimg\.com\/media\//.test(src)) addPhoto(src);
    });
    // DOM 兜底：GIF（由 tweet_video_thumb 海报推导 mp4）
    article.querySelectorAll('video[poster]').forEach((v) => {
      const poster = v.getAttribute('poster') || '';
      const g = poster.match(/tweet_video_thumb\/([A-Za-z0-9_-]+)\.(?:jpg|png|webp)/);
      if (g) addGif('https://video.twimg.com/tweet_video/' + g[1] + '.mp4');
    });
    return out;
  }

  // 用 arraybuffer 拉取后在本 realm 包成 Blob，避免 GM 跨 realm 的 Blob 导致 JSZip 读取卡死
  function makeDownloadTimeoutError() {
    const error = new Error('下载超时');
    error.code = 'DOWNLOAD_TIMEOUT';
    return error;
  }

  function fetchBlob(url) {
    return new Promise((resolve, reject) => {
      const timeoutMs = state.settings.downloadTimeout || DEFAULT_SETTINGS.downloadTimeout;
      if (typeof GM_xmlhttpRequest !== 'undefined') {
        GM_xmlhttpRequest({
          method: 'GET', url, responseType: 'arraybuffer', timeout: timeoutMs,
          onload: (r) => {
            if (r.status >= 200 && r.status < 300 && r.response) {
              const ct = ((r.responseHeaders || '').match(/content-type:\s*([^\r\n;]+)/i) || [])[1];
              resolve(new Blob([r.response], ct ? { type: ct.trim() } : undefined));
            } else { reject(new Error('HTTP ' + r.status)); }
          },
          onerror: () => reject(new Error('网络错误')),
          ontimeout: () => reject(makeDownloadTimeoutError()),
        });
      } else {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        let didTimeout = false;
        const timer = controller ? setTimeout(() => { didTimeout = true; controller.abort(); }, timeoutMs) : null;
        fetch(url, controller ? { signal: controller.signal } : undefined)
          .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('HTTP ' + r.status))))
          .then(resolve)
          .catch((error) => {
            if (didTimeout || (error && error.name === 'AbortError')) reject(makeDownloadTimeoutError());
            else if (error && /^HTTP /.test(error.message || '')) reject(error);
            else reject(new Error('跨域下载失败：请使用支持 GM_xmlhttpRequest 的脚本管理器'));
          })
          .finally(() => { if (timer) clearTimeout(timer); });
      }
    });
  }

  async function fetchBlobWithTimeoutRetry(url) {
    while (true) {
      try {
        return await fetchBlob(url);
      } catch (error) {
        if (!error || error.code !== 'DOWNLOAD_TIMEOUT') throw error;
        const shouldRetry = confirm('下载超时，是否重新下载？');
        if (!shouldRetry) throw error;
        showToast('正在重新下载…', 0);
      }
    }
  }

  // 将 Blob 读为 ArrayBuffer（优先用原生方法，否则回退 FileReader）
  function blobToArrayBuffer(blob) {
    if (blob && typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error || new Error('读取失败'));
      fr.readAsArrayBuffer(blob);
    });
  }

  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }

  // 内置无压缩(STORE) ZIP 打包器：纯同步、无外部依赖、不依赖 Promise/调度器
  // （JSZip 3.x 的 generateAsync 依赖 setImmediate/MessageChannel 调度，在 Tampermonkey
  //   沙盒里通过 new Function 加载时该调度器不触发，导致永远卡死，故自写同步版）
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  // files: [{ name: string, data: Uint8Array }] -> Blob(application/zip)
  function buildStoreZip(files) {
    const enc = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;
    for (const f of files) {
      const nameBytes = enc.encode(f.name);
      const data = f.data;
      const crc = crc32(data);
      const size = data.length >>> 0;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true);
      lh.setUint16(4, 20, true);
      lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, 0, true);
      lh.setUint16(10, 0, true);
      lh.setUint16(12, 0x21, true);
      lh.setUint32(14, crc, true);
      lh.setUint32(18, size, true);
      lh.setUint32(22, size, true);
      lh.setUint16(26, nameBytes.length, true);
      lh.setUint16(28, 0, true);
      chunks.push(new Uint8Array(lh.buffer), nameBytes, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true);
      ch.setUint16(4, 20, true);
      ch.setUint16(6, 20, true);
      ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true);
      ch.setUint16(12, 0, true);
      ch.setUint16(14, 0x21, true);
      ch.setUint32(16, crc, true);
      ch.setUint32(20, size, true);
      ch.setUint32(24, size, true);
      ch.setUint16(28, nameBytes.length, true);
      ch.setUint16(30, 0, true);
      ch.setUint16(32, 0, true);
      ch.setUint16(34, 0, true);
      ch.setUint16(36, 0, true);
      ch.setUint32(38, 0, true);
      ch.setUint32(42, offset, true);
      central.push({ header: new Uint8Array(ch.buffer), name: nameBytes });
      offset += 30 + nameBytes.length + size;
    }
    const centralStart = offset;
    let centralSize = 0;
    for (const c of central) { chunks.push(c.header, c.name); centralSize += c.header.length + c.name.length; }
    const eo = new DataView(new ArrayBuffer(22));
    eo.setUint32(0, 0x06054b50, true);
    eo.setUint16(4, 0, true);
    eo.setUint16(6, 0, true);
    eo.setUint16(8, files.length, true);
    eo.setUint16(10, files.length, true);
    eo.setUint32(12, centralSize, true);
    eo.setUint32(16, centralStart, true);
    eo.setUint16(20, 0, true);
    chunks.push(new Uint8Array(eo.buffer));
    return new Blob(chunks, { type: 'application/zip' });
  }

  async function downloadTweetMedia(article, author, statusId) {
    const media = collectMedia(article, statusId);
    const items = [];
    media.photos.forEach((u) => items.push({ url: u, ext: extOfUrl(u, 'jpg') }));
    media.gifs.forEach((u) => items.push({ url: u, ext: 'mp4' }));
    media.videos.forEach((u) => items.push({ url: u, ext: 'mp4' }));
    if (!items.length) {
      // 第三方引用卡片（内嵌视频 / 缩略图）：标准媒体为空时回退到卡片注册表
      const card = statusId ? cardRegistry.get(String(statusId)) : null;
      if (card) {
        card.photos.forEach((u) => items.push({ url: u, ext: extOfUrl(u, 'jpg') }));
        card.gifs.forEach((u) => items.push({ url: u, ext: 'mp4' }));
        card.videos.forEach((u) => items.push({ url: u, ext: 'mp4' }));
      }
    }
    if (!items.length) { showToast('未找到可下载的媒体，若为视频请先点开或播放一下再试'); return; }
    const uname = String((author && author.username) || 'x').replace(/^@/, '') || 'x';
    const baseName = (uname + '_' + statusId).replace(/[\\/:*?"<>|]+/g, '_');
    debugLog('准备下载', items.length, '个媒体');

    // 单个：直接下载
    if (items.length === 1) {
      showToast('开始下载…', 0);
      try {
        const blob = await fetchBlobWithTimeoutRetry(items[0].url);
        saveBlob(blob, baseName + '.' + items[0].ext);
        showToast('✅ 下载完成');
      } catch (e) {
        console.error('[BetterX] 下载失败:', e);
        showToast('❌ 下载失败：' + ((e && e.message) || '未知错误'), 5000);
      }
      return;
    }

    // 多个：逐个抓取（带进度提示，单个失败不影响其余）
    const blobs = [];
    for (let i = 0; i < items.length; i++) {
      showToast('抓取中 ' + (i + 1) + ' / ' + items.length + ' …', 0);
      try {
        const b = await fetchBlobWithTimeoutRetry(items[i].url);
        blobs.push({ blob: b, ext: items[i].ext, idx: i + 1 });
        debugLog('已抓取 ' + (i + 1) + '/' + items.length, (b.size / 1024).toFixed(0) + 'KB');
      } catch (e) {
        console.error('[BetterX] 第 ' + (i + 1) + ' 个抓取失败:', e);
        showToast('⚠️ 第 ' + (i + 1) + ' 个抓取失败，已跳过', 4000);
      }
    }
    if (!blobs.length) { showToast('❌ 全部抓取失败，未下载', 5000); return; }

    // 打包（内置同步 ZIP 生成器：纯本地、无外部库、不依赖异步引擎）
    showToast('正在打包 ' + blobs.length + ' 个文件…', 0);
    try {
      const files = [];
      for (const it of blobs) {
        const buf = await blobToArrayBuffer(it.blob);
        files.push({ name: it.idx + '.' + it.ext, data: new Uint8Array(buf) });
      }
      debugLog('开始生成 zip（内置同步打包）…');
      const content = buildStoreZip(files);
      saveBlob(content, baseName + '.zip');
      showToast('✅ 打包完成：' + baseName + '.zip（' + blobs.length + ' 个文件）', 5000);
      debugLog('打包完成', (content.size / 1024).toFixed(0) + 'KB');
    } catch (e) {
      console.error('[BetterX] 打包失败，改为逐个下载:', e);
      showToast('⚠️ 打包失败：' + ((e && e.message) || '未知错误') + '，改为逐个下载…', 6000);
      for (let i = 0; i < blobs.length; i++) {
        saveBlob(blobs[i].blob, baseName + '_' + blobs[i].idx + '.' + blobs[i].ext);
        await new Promise((r) => setTimeout(r, 900));
      }
      showToast('✅ 已逐个下载 ' + blobs.length + ' 个文件');
    }
  }

  function handleDownloadClick(btn, article, author, statusId) {
    if (btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';
    const old = btn.innerHTML;
    btn.innerHTML = '⏳';
    Promise.resolve(downloadTweetMedia(article, author, statusId)).catch(() => {}).then(() => {
      btn.innerHTML = old;
      btn.dataset.busy = '0';
    });
  }

  function injectDownloadButtons(scope) {
    if (!state.settings.mediaDownload) return;
    const root = (scope && scope.querySelectorAll) ? scope : document;
    const articles = (root.matches && root.matches('article')) ? [root] : root.querySelectorAll('article');
    articles.forEach((article) => {
      if (article.closest('#xvault-root')) return;
      if (article.querySelector('.xvault-dl-btn')) return;
      const hasDomMedia = article.querySelector('[data-testid="tweetPhoto"], [data-testid="videoComponent"], [data-testid="videoPlayer"], img[src*="pbs.twimg.com/media/"], video[poster]');
      const statusId = extractStatusIdFromUrl(getStatusLink(article));
      const hasReg = statusId && mediaRegistry.has(String(statusId));
      if (!hasDomMedia && !hasReg) return;
      const author = extractAuthor(article);
      const group = article.querySelector('[role="group"]');
      const btn = document.createElement('button');
      btn.className = 'xvault-dl-btn';
      btn.type = 'button';
      btn.title = '下载图片/视频/GIF';
      btn.textContent = '⬇';
      btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); handleDownloadClick(btn, article, author, statusId); }, true);
      if (group) { btn.classList.add('in-group'); group.appendChild(btn); }
      else { btn.classList.add('floating'); if (!article.style.position) article.style.position = 'relative'; article.appendChild(btn); }
    });
  }

  function removeDownloadButtons() {
    document.querySelectorAll('.xvault-dl-btn').forEach((el) => el.remove());
  }

  function applyMediaDownload() {
    if (state.settings.mediaDownload) injectDownloadButtons(document);
    else removeDownloadButtons();
  }

  // ── 取消年龄限制（用下载能力内联替换遮罩）─────────────
  // 原理：X 对敏感/成人媒体加「年龄限制」遮罩，点「显示」只会弹二维码要求去 App 验证，
  // 网页端无效。但这些媒体的真实地址仍能从时间线接口/DOM 取到（与下载同源）。
  // 所以这里不点按钮，而是直接用原图/视频把遮罩内联替换掉，且不改动账号设置。
  const AGE_WARN_RE = /年龄限制|成人内容|敏感内容|敏感媒体|可能不适合|验证.{0,6}年龄|个人资料验证|age[- ]?restricted|adult content|sensitive (?:media|content)|might not be suitable|verify your age|profile to view/i;

  function findAgeWarnEl(article) {
    const nodes = article.querySelectorAll('span, div[dir="ltr"]');
    for (const el of nodes) {
      if (el.closest('[data-testid="tweetText"]')) continue;
      const t = (el.textContent || '').trim();
      if (t && t.length <= 400 && AGE_WARN_RE.test(t)) return el;
    }
    return null;
  }

  // 从警告文案向上找到整个“遮罩块”（只含警告文本、不含正文的最大祖先）
  function getAgeMaskBlock(warnEl, article) {
    let best = warnEl;
    let el = warnEl.parentElement;
    for (let i = 0; i < 10 && el && el !== article; i++, el = el.parentElement) {
      if (el.querySelector('[data-testid="tweetText"]')) break;
      if ((el.textContent || '').length <= 500) best = el; else break;
    }
    return best;
  }

  function buildUnlockedMediaEl(media) {
    const box = document.createElement('div');
    box.className = 'xvault-unlocked';
    const total = media.photos.length + media.gifs.length + media.videos.length;
    if (total === 1) {
      box.classList.add('xv-n1');
    } else {
      box.classList.add('xv-multi');
      if (total === 2) box.classList.add('xv-n2');
      else if (total === 3) box.classList.add('xv-n3');
      else if (total === 4) box.classList.add('xv-n4');
      else box.classList.add('xv-nm');
    }
    media.photos.forEach((u) => {
      const a = document.createElement('a');
      a.href = u; a.target = '_blank'; a.rel = 'noopener';
      const img = document.createElement('img');
      img.src = u; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.alt = '';
      a.appendChild(img); box.appendChild(a);
    });
    media.gifs.forEach((u) => {
      const v = document.createElement('video');
      v.src = u; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.controls = true;
      box.appendChild(v);
    });
    media.videos.forEach((u) => {
      const v = document.createElement('video');
      v.src = u; v.controls = true; v.playsInline = true; v.preload = 'metadata';
      box.appendChild(v);
    });
    return box;
  }

  // 第三方引用卡片 / 内嵌播放器的年龄遮罩：X 会在真实内容上盖一层带“显示”按钮的遮罩，
  // 且真实卡片（含可播放视频 / 真实卡片图）已在 DOM 中。这里定位并揭掉遮罩覆盖层，露出真实内容。
  const CARD_CONTENT_SEL = [
    '[data-testid="card.wrapper"]',
    '[data-testid^="card.layout"]',
    '[data-testid="videoComponent"]',
    '[data-testid="videoPlayer"]',
    'img[src*="/card_img/"]',
    'video[poster*="amplify_video_thumb"]',
    'video[poster*="ext_tw_video_thumb"]',
    'video[poster*="tweet_video_thumb"]',
    'video[src^="blob:"]',
  ].join(', ');

  function revealCardUnderMask(warnEl, article) {
    if (!warnEl || !article) return;
    if (warnEl.closest('.xvault-mask-hidden')) return; // 已揭掉，避免重复处理
    // 仅当帖子确实存在可露出的真实卡片 / 播放器时才动手，否则保持原状（避免误伤纯图片遮罩）
    if (!article.querySelector(CARD_CONTENT_SEL)) return;
    // 从警告文案向上找“遮罩覆盖层”：包含文案与按钮、但本身不含真实卡片内容的最上层祖先
    let overlay = warnEl;
    let el = warnEl.parentElement;
    for (let i = 0; i < 14 && el && el !== article; i++, el = el.parentElement) {
      if (el.querySelector(CARD_CONTENT_SEL)) break; // 到达含真实内容的层，停止上移
      overlay = el;
    }
    if (!overlay || overlay === article) return;
    if (overlay.querySelector(CARD_CONTENT_SEL)) return; // 安全兑底：绝不隐藏含真实内容的层
    overlay.classList.add('xvault-mask-hidden');
  }

  function unlockAgeRestricted(article) {
    if (!article || !article.querySelector) return;
    if (article.closest('#xvault-root')) return;
    if (article.querySelector('.xvault-unlocked')) return; // 已处理，避免重复注入
    const warnEl = findAgeWarnEl(article);
    if (!warnEl) return;
    const statusId = extractStatusIdFromUrl(getStatusLink(article));
    const media = collectMedia(article, statusId);
    if (!media.photos.length && !media.gifs.length && !media.videos.length) {
      // 无标准媒体：优先用卡片注册表（从 GraphQL 采集的第三方引用卡片 / 内嵌播放器媒体）手动注入
      const card = statusId ? cardRegistry.get(String(statusId)) : null;
      if (card && (card.photos.length || card.gifs.length || card.videos.length)) {
        const cblock = getAgeMaskBlock(warnEl, article);
        if (!cblock || !cblock.parentElement) return;
        cblock.classList.add('xvault-mask-hidden');
        cblock.insertAdjacentElement('afterend', buildUnlockedMediaEl(card));
        return;
      }
      // 仍取不到：回退到“揭掉遮罩层”（适用于真实卡片仍在 DOM 的情况）
      revealCardUnderMask(warnEl, article);
      return;
    }
    const block = getAgeMaskBlock(warnEl, article);
    if (!block || !block.parentElement) return;
    block.classList.add('xvault-mask-hidden');
    block.insertAdjacentElement('afterend', buildUnlockedMediaEl(media));
  }

  function revealAgeRestricted(scope) {
    if (!state.settings.bypassAgeRestriction) return;
    const root = (scope && scope.querySelectorAll) ? scope : document;
    const articles = (root.matches && root.matches('article')) ? [root] : root.querySelectorAll('article');
    articles.forEach(unlockAgeRestricted);
  }

  function removeUnlockedMedia() {
    document.querySelectorAll('.xvault-unlocked').forEach((el) => el.remove());
    document.querySelectorAll('.xvault-mask-hidden').forEach((el) => el.classList.remove('xvault-mask-hidden'));
  }

  function applyAgeBypass() {
    if (state.settings.bypassAgeRestriction) revealAgeRestricted(document);
    else removeUnlockedMedia();
  }

  let xvToastTimer = null;
  function showToast(msg, duration) {
    let t = document.getElementById('xvault-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'xvault-toast';
      (state.rootEl || document.body).appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    if (xvToastTimer) clearTimeout(xvToastTimer);
    xvToastTimer = null;
    const timeoutMs = duration === undefined ? 2600 : Math.max(0, Number(duration) || 0);
    if (timeoutMs > 0) xvToastTimer = setTimeout(() => t.classList.remove('show'), timeoutMs);
  }

  function closeBetterXDialog() {
    const dialog = document.getElementById('xvault-choice-dialog');
    if (dialog) dialog.remove();
  }

  function showBetterXDialog(options) {
    if (!state.rootEl) return;
    closeBetterXDialog();
    const overlay = document.createElement('div');
    overlay.id = 'xvault-choice-dialog';
    overlay.className = 'xvault-dialog-overlay';
    overlay.innerHTML = `
      <div class="xvault-dialog" role="dialog" aria-modal="true" aria-labelledby="xvault-dialog-title">
        <div class="xvault-dialog-title" id="xvault-dialog-title"></div>
        <div class="xvault-dialog-body"></div>
        <div class="xvault-dialog-actions">
          <button type="button" class="xvault-btn" data-dialog-choice="secondary"></button>
          <button type="button" class="xvault-btn primary" data-dialog-choice="primary"></button>
        </div>
      </div>
    `;
    overlay.querySelector('.xvault-dialog-title').textContent = options.title || 'BetterX 提示';
    overlay.querySelector('.xvault-dialog-body').innerHTML = options.bodyHtml || '';
    const primary = overlay.querySelector('[data-dialog-choice="primary"]');
    const secondary = overlay.querySelector('[data-dialog-choice="secondary"]');
    primary.textContent = options.primaryText || '确定';
    secondary.textContent = options.secondaryText || '取消';
    primary.addEventListener('click', () => {
      closeBetterXDialog();
      if (typeof options.onPrimary === 'function') options.onPrimary();
    });
    secondary.addEventListener('click', () => {
      closeBetterXDialog();
      if (typeof options.onSecondary === 'function') options.onSecondary();
    });
    state.rootEl.appendChild(overlay);
    setTimeout(() => primary.focus(), 0);
  }

  function setFirefoxCompatibilityChoice(enabled) {
    setSettingsPartial({
      firefoxCompatibility: !!enabled,
      firefoxCompatibilityPrompted: true,
    });
  }

  function reloadAfterFirefoxCompatibilityChange(enabled) {
    setFirefoxCompatibilityChoice(enabled);
    showToast(enabled ? '正在开启 Firefox 兼容模式并刷新…' : '正在关闭 Firefox 兼容模式并刷新…', 0);
    Promise.resolve(state.dbWriteQueue).then(() => location.reload()).catch(() => location.reload());
  }

  function showFirefoxCompatibilityToggleDialog(enable) {
    if (!IS_FIREFOX) {
      showToast('此选项仅用于 Firefox');
      return;
    }
    if (enable) {
      showBetterXDialog({
        title: '开启“兼容 Firefox”？',
        bodyHtml: `
          <p>开启后 BetterX 不再改写页面的 <code>fetch</code> / <code>XMLHttpRequest</code>，可避免部分 Firefox 环境或多个 X 脚本冲突时一直卡在 X 图标。</p>
          <p>以下能力可能降级：</p>
          <ul>
            <li>部分视频 / GIF 无法取得真实下载地址；</li>
            <li>部分年龄限制视频无法内联显示；</li>
            <li>无法从接口响应学习关注关系，主要依靠主页按钮和“正在关注”时间线。</li>
          </ul>
          <p>帖子记录、搜索、面板、内容净化、广告过滤、布局和图片 DOM 兜底不受影响。确认后页面会刷新。</p>
        `,
        primaryText: '开启并刷新',
        secondaryText: '取消',
        onPrimary: () => reloadAfterFirefoxCompatibilityChange(true),
        onSecondary: () => refreshUI({ keepScroll: true }),
      });
      return;
    }
    showBetterXDialog({
      title: '关闭“兼容 Firefox”？',
      bodyHtml: '<p>关闭后将恢复网络媒体与关注关系采集。如果当前环境曾卡在只显示 X 图标的页面，建议继续保持开启。确认后页面会刷新。</p>',
      primaryText: '关闭并刷新',
      secondaryText: '取消',
      onPrimary: () => reloadAfterFirefoxCompatibilityChange(false),
      onSecondary: () => refreshUI({ keepScroll: true }),
    });
  }

  function maybePromptFirefoxCompatibility() {
    if (!IS_FIREFOX || firefoxCompatibilityMode !== 'unset' || state.settings.firefoxCompatibilityPrompted) return;
    showBetterXDialog({
      title: '检测到 Firefox',
      bodyHtml: `
        <p>请问你在使用 BetterX 时，能否正常进入 X？</p>
        <p>目前已知部分 Firefox 用户会一直卡在<strong>只显示 X 图标</strong>的启动页面，常见于广告过滤、媒体下载等多个 X 脚本同时运行的环境。</p>
        <p>如果遇到异常，请点击 <strong>有异常</strong>，BetterX 会开启<strong>“设置 → 其他功能 → 兼容 Firefox”</strong>。该模式会停用页面网络 Hook；部分视频 / GIF 下载、年龄限制视频和接口关注关系识别可能降级，其他主体功能不受影响。</p>
      `,
      primaryText: '有异常',
      secondaryText: '目前正常',
      onPrimary: () => {
        setFirefoxCompatibilityChoice(true);
        showToast('已开启 Firefox 兼容模式');
      },
      onSecondary: () => {
        setFirefoxCompatibilityChoice(false);
        installNetworkHookTimer();
        showToast('已使用 Firefox 完整功能模式');
      },
    });
  }

  // ── 广告检测 / 屏蔽 ──────────────────────────────────────────────────
  // X 的推广帖特征：article 外层含 [data-testid="placementTracking"] 追踪像素，
  // 且头部有独立的“广告 / Ad / Promoted”标签（不在正文 tweetText 内）。
  const AD_LABELS = ['广告', '推广', 'Ad', 'Promoted', 'Publicidad', 'Anúncio', '広告', '광고'];
  function isAdArticle(article) {
    if (!article || !article.querySelector) return false;
    const cell = article.closest('[data-testid="cellInnerDiv"]') || article;
    // 特征1：广告展示追踪像素（只有推广帖才有；top/right/bottom/left-impression-pixel）。
    // 注意：视频帖也会用 placementTracking 包裹播放器，但不含 impression-pixel，故不能用 placementTracking 判定。
    if (cell.querySelector && cell.querySelector('[data-testid$="impression-pixel"]')) return true;
    // 特征2：头部独立的“广告”标签（排除正文里恰好提到“广告”的情况）
    const nodes = article.querySelectorAll('span, div[dir="ltr"]');
    for (const el of nodes) {
      if (el.closest && el.closest('[data-testid="tweetText"]')) continue;
      const t = (el.textContent || '').trim();
      if (t && t.length <= 12 && AD_LABELS.includes(t)) return true;
    }
    return false;
  }

  function hideAdElement(article) {
    const cell = article.closest('[data-testid="cellInnerDiv"]') || article;
    if (cell && cell.classList) cell.classList.add('xvault-ad-hidden');
    else if (cell) cell.style.display = 'none';
  }

  function sweepAds() {
    if (!state.settings.hideAds) return;
    document.querySelectorAll('article').forEach((a) => {
      if (isAdArticle(a)) hideAdElement(a);
    });
  }

  function unhideAds() {
    document.querySelectorAll('.xvault-ad-hidden').forEach((el) => el.classList.remove('xvault-ad-hidden'));
  }

  function applyAdHiding() {
    if (state.settings.hideAds) sweepAds();
    else unhideAds();
  }

  // ── 界面净化与宽屏 ─────────────────────────────────────────────────
  // 参考 X/Twitter Clean-up & Wide Layout Display；改用可逆 CSS 和现有批处理观察器，
  // 不复制其无防抖的全页 MutationObserver，也不写入不可恢复的内联宽度。
  const LAYOUT_EXCLUDED_PATHS = ['/messages', '/settings'];
  const LAYOUT_NAV_LABELS = new Set([
    '书签', '書籤', 'Bookmarks', 'ブックマーク', '북마크',
    '工作机会', '工作機會', 'Careers', '求人', '채용 정보',
    '创作者工作室', '創作者工作室', 'Creator Studio', 'クリエイタースタジオ', '크리에이터 스튜디오',
    '社区', '社群', 'Communities', 'コミュニティ', '커뮤니티',
    '商业', '商業', 'Business', 'ビジネス', '비즈니스',
    'Premium', 'プレミアム', '认证组织', '認證組織', 'Verified Orgs', '認証済み組織', '인증된 조직',
    '营利', '營利', 'Monetization', '収益化', '수익 창출', '广告', '廣告', 'Ads', '広告', '광고',
  ]);
  const LAYOUT_SUBSCRIBE_LABELS = [
    '订阅 Premium', '訂閱 Premium', 'Subscribe to Premium', 'プレミアムにサブスクライブ', 'Premium 구독하기',
  ];
  const LAYOUT_FOOTER_LABELS = new Set(['页脚', '頁尾', 'Footer', 'フッター', '바닥글']);
  const LAYOUT_SHOW_MORE_LABELS = new Set(['显示更多', '顯示更多', 'Show more', 'さらに表示', '더 보기']);

  function ensureLayoutStyle() {
    let style = state.layoutStyleEl;
    if (!style || !style.isConnected) {
      style = document.getElementById('xvault-layout-style') || document.createElement('style');
      style.id = 'xvault-layout-style';
      if (!style.isConnected) (document.head || document.documentElement).appendChild(style);
      state.layoutStyleEl = style;
    }
    return style;
  }

  function clearLayoutDomClasses() {
    const classes = [
      'xvault-layout-clean-hidden', 'xvault-layout-showmore-hidden',
      'xvault-layout-primary', 'xvault-layout-row', 'xvault-layout-main',
      'xvault-layout-shell', 'xvault-layout-left-width-target',
    ];
    for (const className of classes) {
      document.querySelectorAll(`.${className}`).forEach((el) => el.classList.remove(className));
    }
  }

  function clearLayoutStructureClasses() {
    const classes = [
      'xvault-layout-primary', 'xvault-layout-row', 'xvault-layout-main',
      'xvault-layout-shell', 'xvault-layout-left-width-target',
    ];
    for (const className of classes) {
      document.querySelectorAll(`.${className}`).forEach((el) => el.classList.remove(className));
    }
  }

  function getLayoutElements() {
    const primaryCandidates = [...document.querySelectorAll('main [data-testid="primaryColumn"]')];
    const primary = primaryCandidates.find((el) => {
      const rect = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && css.display !== 'none' && css.visibility !== 'hidden';
    }) || primaryCandidates[0] || null;
    const main = primary ? primary.closest('main') : [...document.querySelectorAll('main[role="main"]')].find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(el).display !== 'none';
    }) || null;
    const row = primary ? primary.parentElement : null;
    // X 当前结构中，真正随导航栏改变宽度的是 header 下第二层 div。
    const leftWidthTarget = document.querySelector('header[role="banner"] > div > div')
      || document.querySelector('header[role="banner"] > div:first-child');
    return { primary, main, row, leftWidthTarget };
  }

  function updateDetectedLayoutWidthInputs() {
    if (state.settings.layoutAutoWidth === false) return;
    if (state.timelineWidthEl && document.activeElement !== state.timelineWidthEl && state.detectedTimelineWidth) {
      state.timelineWidthEl.value = String(state.detectedTimelineWidth);
    }
    if (state.leftbarWidthEl && document.activeElement !== state.leftbarWidthEl && state.detectedLeftbarWidth) {
      state.leftbarWidthEl.value = String(state.detectedLeftbarWidth);
    }
  }

  function detectNativeLayoutWidths(elements) {
    const { primary, leftWidthTarget } = elements;
    // 结构类已经生效时保留首次读到的原生值，避免把“填满后”的宽度误认为原生宽度。
    if (primary && !primary.classList.contains('xvault-layout-primary')) {
      const width = Math.round(primary.getBoundingClientRect().width);
      if (width >= 300 && width <= 3000) state.detectedTimelineWidth = width;
    }
    if (leftWidthTarget && !leftWidthTarget.classList.contains('xvault-layout-left-width-target')) {
      const width = Math.round(leftWidthTarget.getBoundingClientRect().width);
      if (width >= 120 && width <= 600) state.detectedLeftbarWidth = width;
    }
    updateDetectedLayoutWidthInputs();
  }

  function bindLayoutStructureClasses(elements, needsStructure, expandCenter, manualWidth) {
    clearLayoutStructureClasses();
    if (!needsStructure) return;
    const { primary, main, row, leftWidthTarget } = elements;
    if (primary) primary.classList.add('xvault-layout-primary');
    if (row) row.classList.add('xvault-layout-row');
    if (main) main.classList.add('xvault-layout-main');
    if (manualWidth && leftWidthTarget) leftWidthTarget.classList.add('xvault-layout-left-width-target');
    if (expandCenter && main) {
      // 隐藏任意侧栏后，从主列同级行一直贯通到 #react-root，释放剩余空间的宽度限制。
      let ancestor = row ? row.parentElement : main.parentElement;
      while (ancestor && ancestor !== document.body) {
        if (ancestor !== main) ancestor.classList.add('xvault-layout-shell');
        if (ancestor.id === 'react-root') break;
        ancestor = ancestor.parentElement;
      }
    }
  }

  function buildLayoutCss(options) {
    const {
      autoWidth, timelineWidth, leftbarWidth, effectiveLeftbarWidth,
      hideLeftbar, hideSidebar, expandCenter,
    } = options;
    const rules = [
      '.xvault-layout-clean-hidden, .xvault-layout-showmore-hidden { display: none !important; }',
    ];

    if (hideLeftbar) rules.push('header[role="banner"] { display: none !important; }');
    if (hideSidebar) rules.push('[data-testid="sidebarColumn"] { display: none !important; }');

    if (expandCenter) {
      rules.push(`
        .xvault-layout-shell {
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          margin-inline: 0 !important;
        }
        .xvault-layout-main {
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          flex: 1 1 0% !important; margin-inline: auto !important;
        }
        .xvault-layout-row {
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          margin-inline: auto !important;
        }
        .xvault-layout-primary {
          width: auto !important; max-width: none !important; min-width: 0 !important;
          flex: 1 1 0% !important; margin-inline: 0 !important;
        }
        .xvault-layout-primary > div,
        .xvault-layout-primary > div > div,
        .xvault-layout-primary .r-1ye8kvj,
        .xvault-layout-primary [data-testid="cellInnerDiv"],
        .xvault-layout-primary [data-testid="cellInnerDiv"] > div,
        .xvault-layout-primary [data-testid="cellInnerDiv"] article,
        .xvault-layout-primary [data-testid="cellInnerDiv"] article > div {
          box-sizing: border-box !important;
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          margin-inline: 0 !important;
        }
        ${!autoWidth && !hideLeftbar ? `.xvault-layout-left-width-target { width: ${leftbarWidth}px !important; }` : ''}
      `);
      if (hideSidebar && !hideLeftbar) {
        rules.push(`
          /* 右栏消失后让“左栏 + 主列”从视口左边开始，避免外层居中布局留下大块空白。 */
          .xvault-layout-shell {
            justify-content: flex-start !important;
            align-items: flex-start !important;
          }
          header[role="banner"] {
            box-sizing: border-box !important;
            width: ${effectiveLeftbarWidth}px !important;
            min-width: ${effectiveLeftbarWidth}px !important;
            max-width: ${effectiveLeftbarWidth}px !important;
            flex: 0 0 ${effectiveLeftbarWidth}px !important;
          }
        `);
      }
    } else if (!autoWidth) {
      rules.push(`
        .xvault-layout-main { max-width: none !important; min-width: 0 !important; flex: 1 1 auto !important; }
        .xvault-layout-row { width: max-content !important; max-width: none !important; margin-inline: auto !important; }
        .xvault-layout-primary {
          width: ${timelineWidth}px !important; max-width: none !important;
          flex: 0 0 ${timelineWidth}px !important; margin-inline: auto !important;
        }
        .xvault-layout-left-width-target { width: ${leftbarWidth}px !important; }
      `);
    }

    if (state.settings.layoutHideMessageGrok !== false) {
      rules.push(`
        [data-testid="chat-drawer-root"], [data-testid="GrokDrawer"] {
          opacity: 0 !important; pointer-events: none !important;
          transform: translate(200px, 200px) !important;
        }
      `);
    }
    return rules.join('\n');
  }

  function applyLayoutDomCleanup() {
    document.querySelectorAll('.xvault-layout-clean-hidden').forEach((el) => el.classList.remove('xvault-layout-clean-hidden'));
    if (state.settings.layoutCleanNavigation !== false) {
      document.querySelectorAll('nav[role="navigation"] div[dir="ltr"]').forEach((item) => {
        const label = (item.textContent || '').trim();
        if (!LAYOUT_NAV_LABELS.has(label)) return;
        const target = item.closest('a, div[role="link"]');
        if (target) target.classList.add('xvault-layout-clean-hidden');
      });
      for (const label of LAYOUT_SUBSCRIBE_LABELS) {
        document.querySelectorAll(`[aria-label="${label}"]`).forEach((el) => el.classList.add('xvault-layout-clean-hidden'));
      }
      document.querySelectorAll('[data-testid="super-upsell-UpsellCardRenderProperties"]').forEach((el) => el.classList.add('xvault-layout-clean-hidden'));
      document.querySelectorAll('nav[role="navigation"][aria-label]').forEach((nav) => {
        if (LAYOUT_FOOTER_LABELS.has((nav.getAttribute('aria-label') || '').trim())) nav.classList.add('xvault-layout-clean-hidden');
      });
    }

    document.querySelectorAll('.xvault-layout-showmore-hidden').forEach((el) => el.classList.remove('xvault-layout-showmore-hidden'));
    if (state.settings.layoutHideShowMore) {
      document.querySelectorAll('article a[role="link"]').forEach((link) => {
        if (LAYOUT_SHOW_MORE_LABELS.has((link.textContent || '').trim())) link.classList.add('xvault-layout-showmore-hidden');
      });
    }
  }

  function applyLayoutEnhancements() {
    if (!document.documentElement) return;
    const style = ensureLayoutStyle();
    const excluded = LAYOUT_EXCLUDED_PATHS.some((path) => location.pathname.startsWith(path));
    if (!state.settings.layoutEnabled || excluded) {
      style.textContent = '';
      clearLayoutDomClasses();
      return;
    }

    const autoWidth = state.settings.layoutAutoWidth !== false;
    const timelineWidth = clampInt(state.settings.timelineWidth, 600, 3000, DEFAULT_SETTINGS.timelineWidth);
    const leftbarWidth = clampInt(state.settings.leftbarWidth, 160, 500, DEFAULT_SETTINGS.leftbarWidth);
    const fillCenter = !!state.settings.layoutFillCenter;
    const hideLeftbar = fillCenter || !!state.settings.layoutHideLeftbar;
    const hideSidebar = fillCenter || !!state.settings.layoutHideSidebar;
    const expandCenter = hideLeftbar || hideSidebar;
    const needsStructure = expandCenter || !autoWidth;
    let elements = getLayoutElements();
    // 从手动宽度切回纯自动模式时，先同步撤销旧结构规则，再读取真正的原生尺寸。
    if (autoWidth && !needsStructure && elements.primary && elements.primary.classList.contains('xvault-layout-primary')) {
      style.textContent = '';
      clearLayoutStructureClasses();
      elements = getLayoutElements();
    }
    if (autoWidth) detectNativeLayoutWidths(elements);
    const effectiveLeftbarWidth = autoWidth
      ? clampInt(state.detectedLeftbarWidth, 120, 600, leftbarWidth)
      : leftbarWidth;
    bindLayoutStructureClasses(elements, needsStructure, expandCenter, !autoWidth);
    style.textContent = buildLayoutCss({
      autoWidth, timelineWidth, leftbarWidth, effectiveLeftbarWidth,
      hideLeftbar, hideSidebar, expandCenter,
    });
    applyLayoutDomCleanup();
  }

  // ── 内容净化：黄推 / 成人引流机器人 ─────────────────────────────────
  // 只处理已经渲染的 DOM，不改写 XHR / Fetch 返回值，也不自动拉黑或举报账号。
  const ADULT_SPAM_STRONG_TERMS = [
    '抽插', '淫叫', '母狗', '肉便器', '母猪', '反差婊', '小穴', '穴穴', '性奴', '蜜穴',
    '爆菊', '性交', '爆操', '福利姬', '里番', '裸照', '裸体', '阴茎', '做愛','嫩穴',
    '做爱', '自慰', '精液', '打飞机', '性欲', '果照', '肏', '约炮', '裸聊','美鲍', '子宫',
    '援交', '外围', '包夜', '无套', '全套服务', '上门约', '成人视频', '成人影片',
    '黄片', '黄网', '色情网站', '看片网站', 'porn', 'nudes', 'onlyfans leak',
    'sex video', 'wataa', 'Wataa', '私处', '尤物', '人妻', '口交', '内射', 'ts',
    '阴道', '偷拍', '手冲', '淫趴', 'p眼', '屁眼', '皮炎', '迷奸', '小烧货', '骚货', 'sao货',
    '破处', '陪睡', '后入', '肛交', '催情','约啪','艹','跳蛋','晨勃','Chudai','chudai',
    '露B','潮喷','龟头','射精','肉棒','鸡巴','3p','4i','被操','榨精','撸管','深喉','69',
    'G点','91','糖心','麻豆','50度灰','足交','乳交','烧姬','约爱','字母圈','淫窝','车震',
    'TS','约p','戴套','阴唇','秒射','飞机杯','屁穴','幹','性爱','鸡鸡','磨豆腐','双头龙',
  ];
  const ADULT_SPAM_SENSITIVE_TERMS = [
    '一发入魂', '调教', '高潮', '翘臀', '奶子', '反差', '巨乳', '嫩妹', '尿尿',
    '痴女', '黑丝', '白丝', '玉足', '喷了', '涩涩', '私房', '纯欲', '蜜桃臀',
    '可瑟瑟', '固炮', '炮友', '找主人', '大一学生', '白虎', '烧鸡', '好色',
    '色色', '熟女', '少妇', '嫩模', '学生妹', '商k', '白给', '处男', '野战',
    '射出来','魅魔','性瘾','打桩','喷出来','射出来','戴套','福照','无码',
    '有码','情趣','丝袜','刺激','娇喘','罩杯','早泄','失禁','毛毛','绝顶',
    '肉欲','黑森林','制服','赤裸','粉嫩','水多','喷水','呻吟','吸吮',
  ];
  const ADULT_SPAM_BOT_BAIT_TERMS = [
    '陪我聊聊天', '有没有单男', '有没有单女', '我是真人', '互关', '互粉', '互fo',
    '体制内老师', '体制内护士', '体制内医生', '在线等哥哥', '在线等弟弟',
  ];
  const ADULT_SPAM_SUGGESTIVE_TERMS = [
    '同城可约', '附近可约', '私密视频', '福利视频', '大尺度视频', '成人直播',
    '萝莉资源', '少女资源', '嫩模资源', '看片入口', '成人视频资源',
  ];
  const ADULT_SPAM_MARKETING_TERMS = [
    '免费领取', '点击领取', '立即加入', '频道入口', '群组入口', '资源合集',
    '试看', '解锁', '置顶获取', '主页获取', '进群', '电报群',
  ];
  const ADULT_SPAM_CONTACT_TERMS = [
    '私信', '私聊', '联系我', '加我', '主页', '简介', '置顶', 'telegram',
    'whatsapp', '电报', '飞机群', 'tg群', '订阅'
  ];
  const ADULT_SPAM_CONTEXT_EXEMPTIONS = [
    '黄推机器人', '举报黄推', '屏蔽黄推', '黄推太多', '垃圾黄推', '清理黄推',
    '色情诈骗', '反诈', '曝光骗子',
  ];
  const ADULT_SPAM_NAME_RE = /(?:福利姬|约炮|裸聊|外围|看片|成人视频|黄网|反差婊|巨乳|痴女|porn|nudes|onlyfans|sex(?:y|cam)?|xxx)/i;
  const ADULT_SPAM_EXACT_AMBIGUOUS_RE = /^(?:骚|逼|肏|doi|spa|全套|处女|chu男|cchu男|c男)$/i;
  const ADULT_SPAM_AMBIGUOUS_RES = [
    /(?<!离)骚(?!操作|扰|包|话|客|气)/,
    /(?<!牛|装|傻|苦|逗|懵|被)逼(?!迫|真|近|问|债|婚|供|退)/,
    /处女(?!作|航|座|秀)/,
  ];
  const ADULT_SPAM_BOT_HANDLE_RES = [
    /^[a-z]{4,10}\d{5,12}$/i,
    /^[a-z]+_[a-z]+\d{4,}$/i,
    /^[A-Z][a-z]+[A-Z][a-z]+\d{2,}$/,
    /^(?=[a-z]*[bcdfghjklmnpqrstvwxyz]{4})[a-z]+\d+$/i,
  ];
  const ADULT_SPAM_TEMPLATE_RES = [
    /快领我回家|扣1白给|推特第一骚|我约过她|姐姐在等你|视频要吗|满足我|可瑟瑟/,
    /懂[得的].{0,3}(?:来|私|入|dd|联系|撩|进|加)/i,
    /(?:找|来|想要).{0,5}(?:哥哥|主人).{0,5}(?:调教|私聊|联系|带走)/,
    /(?:在线等|蹲一个|急需一位).{0,6}(?:哥哥|弟弟|单男|主人)/,
    /(?:主页|简介).{0,5}(?:打飞|打飞机|打✈️?|有资源|有福利|可约)|(?:打飞|打飞机|打✈️?).{0,5}(?:主页|简介)/,
    /(?:刷了半天|就她|点开|快看).{0,5}(?:主页|简介)/,
    /(?:👉|⬆|↑|✈️?).{0,4}@[a-z0-9_]+|@[a-z0-9_]+.{0,4}(?:👉|⬆|↑|✈️?)/i,
    /(?:包夜|上门|外围|服务|按摩).{0,5}(?:全套|spa)|(?:全套|spa).{0,5}(?:包夜|上门|外围|服务)/i,
    /(?:酒店|约|想|一起).{0,5}doi|doi.{0,5}(?:酒店|约|一起)/i,
    /(?:c\s*\/?\s*chu男|chu男|c男)/i,
  ];
  const ADULT_SPAM_COMBO_RES = [
    /(?:同城|附近).{0,5}(?:可约|约炮|上门)/,
    /(?:私信|私聊|联系|加我).{0,8}(?:约炮|裸聊|看片|黄网|成人视频)/,
    /(?:约炮|裸聊|看片|黄网|成人视频).{0,8}(?:私信|私聊|联系|加我|主页|电报)/,
    /(?:萝莉|少女|嫩模|空姐|学生妹|少妇).{0,6}(?:资源|上门|可约|视频|福利)/,
    /(?:免费|最新|海量).{0,6}(?:成人视频|黄片|色情视频|看片资源)/,
    /(?:成人视频|黄片|色情视频).{0,5}(?:资源|入口|合集|频道|群)/,
  ];
  const ADULT_SPAM_REPOST_CONTEXT_RE = /(?:已转帖|已轉帖|转帖|轉帖|转发|轉發|reposted|retweeted|リポスト|재게시|리트윗)/i;

  function normalizeAdultSpamText(value) {
    let text = String(value || '').slice(0, 5000);
    try { text = text.normalize('NFKC'); } catch (err) {}
    return text.toLowerCase()
      .replace(/[\u200b-\u200f\u202a-\u202e\u2060\ufeff\ufe0e\ufe0f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compactAdultSpamText(value) {
    return normalizeAdultSpamText(value).replace(/[\s\p{P}\p{S}_]+/gu, '');
  }

  function countMatchedTerms(haystack, terms) {
    let count = 0;
    for (const term of terms) {
      const normalized = compactAdultSpamText(term);
      if (normalized && haystack.includes(normalized)) count++;
    }
    return count;
  }

  function getAdultSpamInput(article) {
    const author = extractAuthor(article);
    // 合并原创正文与引用正文；只取第一个 tweetText 会漏掉引用卡片中的敏感内容。
    const text = (extractText(article) || '').trim().slice(0, 2500);
    const socialContextEl = article.querySelector('[data-testid="socialContext"]');
    const repostContext = (socialContextEl?.innerText || '').trim().slice(0, 300);
    const isRepost = ADULT_SPAM_REPOST_CONTEXT_RE.test(repostContext);
    let reposterUsername = '';
    if (isRepost && socialContextEl) {
      // X 通常把 socialContext 的 span 放在转发者链接内部，链接不是它的子节点。
      const actorLinks = [socialContextEl.closest('a[href]'), ...socialContextEl.querySelectorAll('a[href]')].filter(Boolean);
      const actorLink = actorLinks.find((link) => {
        const href = link.getAttribute('href') || '';
        return /^\/[a-z0-9_]{1,15}(?:[/?#]|$)/i.test(href);
      });
      const actorMatch = (actorLink?.getAttribute('href') || '').match(/^\/([a-z0-9_]{1,15})(?:[/?#]|$)/i);
      const actorHandle = (actorMatch?.[1] || '').toLowerCase();
      if (actorHandle && !RESERVED_TOP_PATHS.has(actorHandle)) reposterUsername = actorHandle;
    }
    const rawUsername = String(author.username || '').replace(/^@/, '');
    const username = rawUsername.toLowerCase();
    const externalLinkCount = [...article.querySelectorAll('a[href]')].filter((link) => {
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('/') || /^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\//i.test(href)) return false;
      return /^(?:https?:\/\/|\/\/)/i.test(href);
    }).length;
    const mentionCount = (text.match(/@[a-z0-9_]{1,15}/gi) || []).length;
    const hasMedia = !!article.querySelector('video, [data-testid="tweetPhoto"], img[src*="pbs.twimg.com/media"]');
    const isFollowingTimeline = getCurrentSourceInfo().type === 'following';
    if (isFollowingTimeline) {
      if (isRepost && reposterUsername) rememberFollowingRelation(reposterUsername, true);
      else if (!isRepost && username) rememberFollowingRelation(username, true);
    }
    return {
      text, displayName: author.displayName || '', username, rawUsername,
      repostContext, isRepost, reposterUsername, externalLinkCount, mentionCount, hasMedia, isFollowingTimeline,
    };
  }

  function scoreAdultSpam(input) {
    const normalized = normalizeAdultSpamText(`${input.displayName}\n${input.repostContext || ''}\n${input.text}`);
    const compact = compactAdultSpamText(normalized);
    const usernameText = normalizeAdultSpamText(input.username);
    const whitelist = state.settings.adultSpamWhitelist || [];
    if (input.username && whitelist.includes(input.username)) {
      return { hidden: false, score: 0, reasons: ['账号白名单'] };
    }
    const contentAuthorFollowed = !!(input.username && followedHandles.has(input.username));
    const reposterFollowed = !!(input.reposterUsername && followedHandles.has(input.reposterUsername));
    const originalPostInFollowingTimeline = input.isFollowingTimeline && !input.isRepost;
    const followedAccountRepost = input.isRepost
      && state.settings.adultSpamSkipFollowingReposts === true
      && (input.isFollowingTimeline || reposterFollowed);
    if (state.settings.adultSpamSkipFollowing !== false
      && (originalPostInFollowingTimeline || contentAuthorFollowed || followedAccountRepost)) {
      return {
        hidden: false,
        score: 0,
        reasons: [followedAccountRepost
          ? '已关注账号的转发内容'
          : (contentAuthorFollowed ? '正文原作者已关注' : '正在关注时间线的原创帖')],
      };
    }

    for (const customTerm of state.settings.adultSpamKeywords || []) {
      const normalizedTerm = normalizeAdultSpamText(customTerm);
      const compactTerm = compactAdultSpamText(customTerm);
      if ((normalizedTerm && normalized.includes(normalizedTerm)) || (compactTerm && compact.includes(compactTerm))) {
        return { hidden: true, score: 99, reasons: [`自定义词：${customTerm}`] };
      }
    }

    const reasons = [];
    let score = 0;
    let signalGroups = 0;
    const strongCount = countMatchedTerms(compact, ADULT_SPAM_STRONG_TERMS);
    const sensitiveCount = countMatchedTerms(compact, ADULT_SPAM_SENSITIVE_TERMS);
    const botBaitCount = countMatchedTerms(compact, ADULT_SPAM_BOT_BAIT_TERMS);
    const suggestiveCount = countMatchedTerms(compact, ADULT_SPAM_SUGGESTIVE_TERMS);
    const marketingCount = countMatchedTerms(compact, ADULT_SPAM_MARKETING_TERMS);
    const contactCount = countMatchedTerms(compact, ADULT_SPAM_CONTACT_TERMS);
    const comboCount = ADULT_SPAM_COMBO_RES.filter((re) => re.test(compact)).length;
    const templateCount = ADULT_SPAM_TEMPLATE_RES.filter((re) => re.test(normalized) || re.test(compact)).length;
    const exactAmbiguous = ADULT_SPAM_EXACT_AMBIGUOUS_RE.test(compactAdultSpamText(input.text));
    const ambiguousCount = ADULT_SPAM_AMBIGUOUS_RES.filter((re) => re.test(compact)).length;
    const riskyName = ADULT_SPAM_NAME_RE.test(input.displayName) || ADULT_SPAM_NAME_RE.test(usernameText);
    const syntheticHandle = ADULT_SPAM_BOT_HANDLE_RES.some((re) => re.test(input.rawUsername || input.username || ''));

    if (strongCount) { score += Math.min(14, strongCount * 10); signalGroups++; reasons.push('强成人内容词'); }
    if (sensitiveCount) { score += Math.min(10, sensitiveCount * 4); signalGroups++; reasons.push('敏感暗示词'); }
    if (botBaitCount) { score += Math.min(6, botBaitCount * 3); signalGroups++; reasons.push('机器人诱导短句'); }
    if (suggestiveCount) { score += Math.min(6, suggestiveCount * 3); signalGroups++; reasons.push('成人引流短语'); }
    if (comboCount) { score += Math.min(8, comboCount * 4); signalGroups++; reasons.push('高风险组合话术'); }
    if (templateCount) { score += Math.min(10, templateCount * 8); signalGroups++; reasons.push('黄推模板话术'); }
    if (exactAmbiguous) { score += 10; signalGroups++; reasons.push('单字露骨内容'); }
    if (ambiguousCount) { score += Math.min(6, ambiguousCount * 4); signalGroups++; reasons.push('语境敏感词'); }
    if (marketingCount) { score += Math.min(4, marketingCount * 2); signalGroups++; reasons.push('营销引导'); }
    if (contactCount) { score += Math.min(4, contactCount * 2); signalGroups++; reasons.push('站外联系引导'); }
    if (riskyName) {
      score += 3;
      signalGroups++;
      reasons.push('账号名特征');
    }
    if (syntheticHandle) { score += 3; signalGroups++; reasons.push('机器用户名结构'); }
    if (input.externalLinkCount > 0) { score += 2; signalGroups++; reasons.push('外部链接'); }
    if ((input.mentionCount || 0) > 0 && (contactCount || templateCount)) {
      score += 3;
      signalGroups++;
      reasons.push('@账号引流');
    }
    const riskEmojiCount = (normalized.match(/[✈️🔞💦🈲👅🍑👙🙇❣️❤️🍓🎀💋🥵]/gu) || []).length;
    if (riskEmojiCount >= 2 || normalized.includes('🔞')) { score += 3; signalGroups++; reasons.push('高风险表情组合'); }
    const hasContentRisk = strongCount || sensitiveCount || botBaitCount || suggestiveCount || comboCount || templateCount || exactAmbiguous || ambiguousCount || riskyName;
    if (input.hasMedia && hasContentRisk) { score += 2; signalGroups++; reasons.push('敏感媒体组合'); }
    if (input.text && input.text.length <= 120 && hasContentRisk) score += 1;

    const exemptionCount = countMatchedTerms(compact, ADULT_SPAM_CONTEXT_EXEMPTIONS);
    if (exemptionCount) { score = Math.max(0, score - 6); reasons.push('讨论/反诈语境降权'); }
    const threshold = state.settings.adultSpamLevel === 'balanced' ? 6 : 9;
    const hasStrongAnchor = strongCount > 0 || templateCount > 0 || comboCount > 0 || exactAmbiguous;
    const qualified = hasStrongAnchor || (hasContentRisk && signalGroups >= 2);
    return { hidden: qualified && score >= threshold, score, reasons };
  }

  function captureAdultSpamScrollAnchors() {
    const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    const candidates = [...document.querySelectorAll('article')]
      .map((article) => {
        const rect = article.getBoundingClientRect();
        return {
          article,
          statusId: extractStatusIdFromUrl(getStatusLink(article)) || '',
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
        };
      })
      .filter((item) => item.height > 0 && item.bottom > -viewportHeight && item.top < viewportHeight * 2)
      .sort((a, b) => {
        const score = (item) => item.bottom > 0 && item.top < viewportHeight
          ? Math.max(0, item.top)
          : viewportHeight + Math.min(Math.abs(item.top), Math.abs(item.bottom));
        return score(a) - score(b);
      });
    candidates.fallbackY = Math.max(0, window.scrollY || 0);
    return candidates;
  }

  function resolveAdultSpamScrollAnchor(candidate) {
    let article = candidate.article;
    if ((!article || !article.isConnected) && candidate.statusId) {
      article = [...document.querySelectorAll('article')].find((item) => (
        extractStatusIdFromUrl(getStatusLink(item)) === String(candidate.statusId)
      )) || null;
    }
    if (!article || !article.isConnected || article.classList.contains('xvault-adult-spam-hidden')) return null;
    const rect = article.getBoundingClientRect();
    return rect.height > 0 ? { article, top: rect.top } : null;
  }

  function restoreAdultSpamScrollAnchor(candidates) {
    for (const candidate of candidates || []) {
      const current = resolveAdultSpamScrollAnchor(candidate);
      if (!current) continue;
      const delta = current.top - candidate.top;
      if (Math.abs(delta) > 1) window.scrollBy(0, delta);
      return true;
    }
    if (candidates && Number.isFinite(candidates.fallbackY)) {
      const delta = candidates.fallbackY - (window.scrollY || 0);
      if (Math.abs(delta) > 1) window.scrollTo(0, candidates.fallbackY);
    }
    return false;
  }

  function stabilizeAdultSpamScroll(candidates) {
    const token = ++adultSpamScrollToken;
    if (!candidates || !candidates.length) return;
    restoreAdultSpamScrollAnchor(candidates);
    if (typeof requestAnimationFrame !== 'function') return;
    requestAnimationFrame(() => {
      if (token !== adultSpamScrollToken) return;
      restoreAdultSpamScrollAnchor(candidates);
      requestAnimationFrame(() => {
        if (token === adultSpamScrollToken) restoreAdultSpamScrollAnchor(candidates);
      });
    });
  }

  function setAdultSpamHidden(article, decision) {
    // 保留 X 虚拟列表管理的 cellInnerDiv 外壳，只隐藏帖子本身，避免列表节点被反复销毁和重建。
    const target = article;
    if (!target || !target.classList) return false;
    if (decision.hidden) {
      target.classList.add('xvault-adult-spam-hidden');
      target.dataset.xvaultAdultSpamReason = `${decision.score} 分：${decision.reasons.join('、')}`;
    } else {
      target.classList.remove('xvault-adult-spam-hidden');
      delete target.dataset.xvaultAdultSpamReason;
    }
    return decision.hidden;
  }

  function evaluateAndApplyAdultSpam(article) {
    if (!state.settings.hideAdultSpam || !article || !article.querySelector) return false;
    const input = getAdultSpamInput(article);
    const statusId = extractStatusIdFromUrl(getStatusLink(article)) || '';
    const fingerprint = `${statusId}\n${input.username}\n${input.rawUsername}\n${input.displayName}\n${input.repostContext}\n${input.isRepost}\n${input.reposterUsername}\n${input.text}\n${input.externalLinkCount}\n${input.mentionCount}\n${input.hasMedia}\n${input.isFollowingTimeline}`;
    const statsKey = statusId || fingerprint;
    adultSpamScannedIds.add(statsKey);
    const cached = adultSpamCache.get(article);
    if (cached && cached.version === adultSpamRulesVersion && cached.fingerprint === fingerprint) {
      return setAdultSpamHidden(article, cached.decision);
    }
    const decision = scoreAdultSpam(input);
    adultSpamCache.set(article, { version: adultSpamRulesVersion, fingerprint, decision });
    const hidden = setAdultSpamHidden(article, decision);
    if (hidden) adultSpamSessionHiddenIds.add(statsKey);
    if (hidden) debugLog('内容净化已隐藏帖子', statusId || '(无 ID)', decision.score, decision.reasons);
    return hidden;
  }

  function updateAdultSpamCount() {
    if (!state.adultSpamCountEl) return;
    const currentCount = document.querySelectorAll('.xvault-adult-spam-hidden').length;
    state.adultSpamCountEl.textContent = `当前隐藏 ${currentCount} · 本次累计 ${adultSpamSessionHiddenIds.size} · 已扫描 ${adultSpamScannedIds.size} · 已识别关注 ${followedHandles.size}`;
  }

  function unhideAdultSpam() {
    document.querySelectorAll('.xvault-adult-spam-hidden').forEach((el) => {
      el.classList.remove('xvault-adult-spam-hidden');
      delete el.dataset.xvaultAdultSpamReason;
    });
    updateAdultSpamCount();
  }

  function sweepAdultSpam() {
    if (!state.settings.hideAdultSpam) return;
    harvestFollowingControlsFromRoot(document);
    document.querySelectorAll('article').forEach(evaluateAndApplyAdultSpam);
    updateAdultSpamCount();
  }

  function applyAdultSpamFiltering() {
    const anchors = captureAdultSpamScrollAnchors();
    if (state.settings.hideAdultSpam) {
      // 直接按新判定更新差异，不再“全部显示 → 全部隐藏”，避免规则刷新时整页闪烁。
      sweepAdultSpam();
    } else {
      unhideAdultSpam();
    }
    stabilizeAdultSpamScroll(anchors);
  }

  function parseAdultSpamWhitelist(raw) {
    return uniqueStrings(parseKeywords(raw)
      .map((item) => item.replace(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\//i, ''))
      .map((item) => item.replace(/^@+/, '').replace(/\/$/, '').toLowerCase())
      .filter((item) => /^[a-z0-9_]{1,15}$/.test(item)));
  }

  // ── 抓取 / 扫描 / 闪现检测 ────────────────────────────────────────────
  function captureArticle(article) {
    if (state.settings.hideAds && isAdArticle(article)) { hideAdElement(article); return; }
    if (state.settings.hideAdultSpam && evaluateAndApplyAdultSpam(article)) return;
    if (!isProbablyPostArticle(article)) return;
    const url = getStatusLink(article);
    const id = extractStatusIdFromUrl(url);
    if (!id) return;

    const sourceInfo = getCurrentSourceInfo();
    if ((state.settings.skipSources || []).includes(sourceInfo.type)) return;

    const isFirstVisibleCapture = !state.visibleMap.has(id);
    const author = extractAuthor(article);
    const text = extractText(article);
    const media = detectMedia(article);
    const avatarUrl = extractAvatar(article);

    if (isFirstVisibleCapture) {
      upsertPost({
        id, url,
        displayName: author.displayName,
        username: author.username,
        text,
        hasImage: media.hasImage,
        hasVideo: media.hasVideo,
        mediaThumbs: media.thumbs,
        avatarUrl,
        sourceType: sourceInfo.type,
        sourceLabel: sourceInfo.label,
        capturedPath: location.pathname + location.search,
        firstSeenInDomAt: now(),
        lastSeenInDomAt: now(),
      }, { countCapture: true });
      state.visibleMap.set(id, { firstSeenInDomAt: now(), lastSeenInDomAt: now(), articleEl: article });
    } else {
      const info = state.visibleMap.get(id);
      if (info) { info.lastSeenInDomAt = now(); info.articleEl = article; }
      const existing = getPostById(id);
      if (existing) {
        const needsPatch =
          (!existing.text && text) ||
          (!existing.displayName && author.displayName) ||
          (!existing.username && author.username) ||
          (!(existing.mediaThumbs || []).length && media.thumbs.length) ||
          (!existing.avatarUrl && avatarUrl) ||
          existing.sourceLabel !== sourceInfo.label ||
          existing.url !== url;
        if (needsPatch) {
          upsertPost({
            ...existing,
            url,
            displayName: existing.displayName || author.displayName,
            username: existing.username || author.username,
            text: existing.text || text,
            hasImage: existing.hasImage || media.hasImage,
            hasVideo: existing.hasVideo || media.hasVideo,
            mediaThumbs: (existing.mediaThumbs || []).length ? existing.mediaThumbs : media.thumbs,
            avatarUrl: existing.avatarUrl || avatarUrl,
            sourceType: sourceInfo.type,
            sourceLabel: sourceInfo.label,
            capturedPath: location.pathname + location.search,
            lastSeenInDomAt: now(),
          }, { countCapture: false });
        }
      }
    }
  }

  function scanArticles(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('article').forEach(captureArticle);
    if (state.settings.mediaDownload) injectDownloadButtons(scope);
    if (state.settings.bypassAgeRestriction) revealAgeRestricted(scope);
    if (state.settings.hideAdultSpam) updateAdultSpamCount();
  }

  function checkDisappearedPosts() {
    if (document.hidden) return;
    const ts = now();
    const flashMs = state.settings.flashMs || 8000;

    const currentId = extractStatusIdFromUrl(location.href);
    if (currentId) {
      const p = getPostById(currentId);
      if (p && !p.clicked) markClicked(currentId);
    }

    for (const [id, info] of state.visibleMap.entries()) {
      const el = info.articleEl;
      const stillInDom = !!(el && document.contains(el));
      if (stillInDom) { info.lastSeenInDomAt = ts; continue; }
      const visibleDuration = (info.lastSeenInDomAt || ts) - (info.firstSeenInDomAt || ts);
      if (visibleDuration >= 0 && visibleDuration <= flashMs) markFlashLost(id);
      state.visibleMap.delete(id);
    }
  }

  // ── 交互 ─────────────────────────────────────────────────────────
  function handleDocumentClick(e) {
    const target = e.target;
    if (!target || !target.closest) return;

    if (state.panelOpen && !target.closest('#xvault-root')) {
      togglePanel(false);
    }

    const anchor = target.closest('a[href*="/status/"]');
    if (anchor) {
      const id = extractStatusIdFromUrl(anchor.href || anchor.getAttribute('href') || '');
      if (id) { markClicked(id); return; }
    }

    if (state.settings.markReadOnClick !== false) {
      const interactive = target.closest('a, button, [role="button"], [role="link"], [role="menuitem"], [data-testid="caret"]');
      if (!interactive) {
        const article = target.closest('article');
        if (article) {
          const id = extractStatusIdFromUrl(getStatusLink(article));
          if (id) markClicked(id);
        }
      }
    }
  }

  function handleKeydown(e) {
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'x' || e.key === 'X')) {
      e.preventDefault();
      togglePanel();
    }
  }

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
    setGroupDisabled('#xvault-adultspam-options', adultSpamDisabled);
    setGroupDisabled('#xvault-layout-options', layoutDisabled);
    if (state.adultSpamLevelEl) state.adultSpamLevelEl.disabled = adultSpamDisabled;
    if (state.adultSpamSkipFollowingRepostsEl) {
      const repostOptionDisabled = adultSpamDisabled || state.settings.adultSpamSkipFollowing === false;
      state.adultSpamSkipFollowingRepostsEl.disabled = repostOptionDisabled;
      const repostLabel = state.adultSpamSkipFollowingRepostsEl.closest('.xvault-field');
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
      state.firefoxCompatibilityEl.disabled = !IS_FIREFOX;
      const label = state.firefoxCompatibilityEl.closest('label');
      if (label) label.classList.toggle('is-disabled', !IS_FIREFOX);
    }
  }

  function setPanelView(view) {
    if (!state.panelEl) return;
    const nextView = view === 'settings' ? 'settings' : 'vault';
    const enteringSettings = nextView === 'settings' && state.panelView !== 'settings';
    state.panelView = nextView;
    if (enteringSettings) {
      state.panelEl.querySelectorAll('.xvault-settings-card[open]').forEach((detailsEl) => {
        detailsEl.removeAttribute('open');
      });
    }
    state.panelEl.classList.toggle('is-settings-view', nextView === 'settings');
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
    if (!data.length) { window.alert('当前筛选结果为空，没有可导出的内容。'); return; }
    download(`xvault-filtered-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
  }

  function backupAll() {
    const payload = {
      type: 'x-post-vault-backup',
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      posts: state.posts,
    };
    download(`xvault-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2));
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
    return {
      id,
      url: safeImportedStatusUrl(raw.url, id) || fallbackUrl,
      displayName: safeString(raw.displayName, 200),
      username,
      text: safeString(raw.text, 100000),
      hasImage: raw.hasImage === true || mediaThumbs.length > 0,
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
      firstSeenInDomAt: finiteInt(raw.firstSeenInDomAt, 0, Number.MAX_SAFE_INTEGER, firstCapturedAt),
      lastSeenInDomAt: finiteInt(raw.lastSeenInDomAt, 0, Number.MAX_SAFE_INTEGER, lastCapturedAt),
      lastClickedAt: finiteInt(raw.lastClickedAt, 0, Number.MAX_SAFE_INTEGER, 0),
    };
  }

  async function importPosts(file) {
    try {
      if (!file || file.size > MAX_IMPORT_FILE_BYTES) {
        window.alert('导入失败：备份文件不能超过 25 MB。');
        return;
      }
      const text = await file.text();
      const parsed = JSON.parse(text);
      let posts = [];
      let importedSettings = null;
      if (Array.isArray(parsed)) posts = parsed;
      else if (parsed && Array.isArray(parsed.posts)) { posts = parsed.posts; importedSettings = parsed.settings || null; }
      else { window.alert('无法识别的备份文件格式。'); return; }
      if (posts.length > MAX_IMPORT_POSTS) {
        window.alert(`导入失败：单次最多允许 ${MAX_IMPORT_POSTS} 条帖子。`);
        return;
      }

      let added = 0, merged = 0, skipped = 0;
      for (const raw of posts) {
        const imported = sanitizeImportedPost(raw);
        if (!imported) { skipped++; continue; }
        const existing = getPostById(imported.id);
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
          state.posts[getPostIndexById(imported.id)] = combined;
          queueDbWrite(async () => { await dbPutPost(combined); });
          merged++;
        } else {
          state.posts.push(imported);
          queueDbWrite(async () => { await dbPutPost(imported); });
          added++;
        }
      }

      if (importedSettings && window.confirm('是否同时恢复备份中的设置？')) {
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
        state.settings.knownFollowedHandles = [...followedHandles].sort().slice(0, 5000);
        applyTheme();
        applyAdHiding();
        applyMediaDownload();
        applyAgeBypass();
        repositionBadge();
        queueDbWrite(async () => { await persistSettings(); });
      }
      queueDbWrite(async () => { await enforceMaxPosts(); });
      await state.dbWriteQueue;
      bumpKeywordCache();
      resetPaging();
      refreshUI();
      window.alert(`导入完成：新增 ${added} 条，合并 ${merged} 条，跳过 ${skipped} 条无效记录。`);
    } catch (err) {
      console.error('[BetterX] import failed:', err);
      window.alert('导入失败：文件解析出错。');
    }
  }

  async function runAutoClean() {
    const days = state.settings.autoCleanDays || 0;
    if (days <= 0) return;
    const cutoff = now() - days * 86400000;
    const toDelete = state.posts.filter((p) => !protectedPost(p) && (p.lastCapturedAt || 0) < cutoff);
    if (!toDelete.length) return;
    state.posts = state.posts.filter((p) => protectedPost(p) || (p.lastCapturedAt || 0) >= cutoff);
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
    state.rootEl.classList.toggle('xvault-light', theme === 'light');
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
    if (!state.rootEl || !state.badgeEl || !state.rootEl.classList.contains('xvault-mobile')) return;
    const composeEl = findMobileComposeButton();
    if (!composeEl) {
      if (state.mobileComposeEl) stopMobileComposeTracking();
      state.rootEl.style.left = 'auto';
      state.rootEl.style.right = '16px';
      state.rootEl.style.bottom = '84px';
      state.rootEl.style.setProperty('--xv-mobile-badge-opacity', '1');
      state.rootEl.classList.remove('xvault-mobile-badge-inactive');
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
    state.rootEl.classList.toggle('xvault-mobile-badge-inactive', opacity <= 0.05);
  }

  function scheduleMobileBadgeSync() {
    if (state.mobileBadgeRaf || !state.rootEl || !state.rootEl.classList.contains('xvault-mobile')) return;
    state.mobileBadgeRaf = requestAnimationFrame(() => {
      state.mobileBadgeRaf = 0;
      syncMobileBadgeToComposeButton();
    });
  }

  function updatePanelPlacement() {
    if (!state.rootEl || !state.badgeEl || !state.panelEl) return;
    if (state.rootEl.classList.contains('xvault-mobile')) {
      state.rootEl.classList.remove('xvault-panel-right');
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
    state.rootEl.classList.toggle('xvault-panel-right', alignRight);
    state.panelEl.style.left = panelLeft + 'px';
    state.panelEl.style.right = 'auto';
    state.panelEl.style.top = safeDistance + 'px';
    state.panelEl.style.bottom = safeDistance + 'px';
  }

  function repositionBadge() {
    if (!state.badgeEl || !state.rootEl) return;
    const isMobile = isMobileBadgeViewport();
    const useIconBadge = isMobile || !!state.settings.useMobileBadgeOnDesktop;
    state.badgeEl.classList.toggle('mobile-mode', useIconBadge);
    state.badgeEl.classList.toggle('desktop-icon-mode', !isMobile && useIconBadge);
    if (isMobile) {
      state.rootEl.classList.add('xvault-mobile');
      syncMobileBadgeToComposeButton();
    } else {
      stopMobileComposeTracking();
      state.rootEl.classList.remove('xvault-mobile');
      state.rootEl.classList.remove('xvault-mobile-badge-inactive');
      state.rootEl.style.removeProperty('--xv-mobile-badge-opacity');
      state.rootEl.style.left = '';
      state.rootEl.style.right = '';
      state.rootEl.style.bottom = '';
      applyBadgePos();
    }
    updatePanelPlacement();
    refreshBadge();
  }

  function makeBadgeDraggable() {
    const badge = state.badgeEl;
    if (!badge) return;
    let startX = 0, startY = 0, origLeft = 0, origBottom = 0, dragging = false, moved = false;

    badge.addEventListener('dragstart', (e) => e.preventDefault());

    badge.addEventListener('pointerdown', (e) => {
      if (state.rootEl && state.rootEl.classList.contains('xvault-mobile')) return;
      dragging = true; moved = false;
      badge.classList.add('is-dragging');
      startX = e.clientX; startY = e.clientY;
      const rect = state.rootEl.getBoundingClientRect();
      origLeft = rect.left;
      origBottom = window.innerHeight - rect.bottom;
      try { badge.setPointerCapture(e.pointerId); } catch (err) {}
    });
    badge.addEventListener('pointermove', (e) => {
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
    const end = () => {
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

  // ── 创建 UI ─────────────────────────────────────────────────────
  function createUI() {
    const root = document.createElement('div');
    root.id = 'xvault-root';

    const badge = document.createElement('button');
    badge.id = 'xvault-badge';
    badge.type = 'button';
    badge.textContent = '更好的 X（BetterX）';

    const panel = document.createElement('div');
    panel.id = 'xvault-panel';
    panel.style.display = 'none';
    panel.innerHTML = `
      <div class="xvault-header">
        <div class="xvault-title">
          <div class="xvault-title-main">
            ${APP_ICON_URL ? `<img class="xvault-title-icon" src="${escapeHtml(APP_ICON_URL)}" alt="" draggable="false" />` : ''}
            <span>更好的 X</span>
          </div>
          <div class="xvault-title-sub">BetterX · Alt+X 开关</div>
        </div>
        <div class="xvault-header-actions">
          <button class="xvault-btn xvault-vault-action" data-action="refresh" title="重新扫描当前页面">刷新</button>
          <button class="xvault-btn xvault-vault-action" data-action="mark-all-read" title="把当前列表全部标为已读">全部已读</button>
          <div class="xvault-menu-wrap">
            <button class="xvault-btn xvault-icon-btn" data-action="menu-toggle" aria-label="更多" title="更多">⋯</button>
            <div class="xvault-menu" id="xvault-menu" hidden>
              <button class="xvault-menu-item" data-action="export">📤 导出筛选</button>
              <button class="xvault-menu-item" data-action="backup">💾 备份全部</button>
              <button class="xvault-menu-item" data-action="import">📥 导入</button>
              <button class="xvault-menu-item danger" data-action="clear-non-fav">🗑️ 清空</button>
            </div>
          </div>
          <button class="xvault-btn xvault-icon-btn" data-action="close" aria-label="关闭" title="关闭">✕</button>
        </div>
      </div>

      <div class="xvault-tabs" role="tablist" aria-label="BetterX 面板">
        <button class="xvault-tab active" type="button" role="tab" aria-selected="true" data-action="set-panel-view" data-view="vault">帖子</button>
        <button class="xvault-tab" type="button" role="tab" aria-selected="false" data-action="set-panel-view" data-view="settings">设置</button>
      </div>

      <section class="xvault-view xvault-vault-view" data-view-panel="vault">
      <div class="xvault-vault-toolbar">

      <div class="xvault-tip">提示：列表仅记录你浏览时出现过的帖子。收藏/置顶的帖子不会被上限修剪或自动清理。</div>

      <div class="xvault-summary" id="xvault-summary"></div>
      <div class="xvault-section-label">快速筛选</div>
      <div class="xvault-filter-bar" id="xvault-filter-bar"></div>

      <div class="xvault-search-tools">
        <input type="text" class="xvault-input" id="xvault-search" placeholder="搜索作者、正文或备注…" aria-label="搜索帖子" />
        <div class="xvault-toolbar-row">
          <select class="xvault-select" id="xvault-source" aria-label="来源筛选"></select>
          <select class="xvault-select" id="xvault-media" aria-label="媒体筛选"></select>
          <select class="xvault-select" id="xvault-sort" aria-label="排序方式">
            <option value="default">默认排序</option>
            <option value="time_asc">最早先看</option>
            <option value="captures">出现次数</option>
            <option value="author">按作者</option>
            <option value="source">按来源</option>
          </select>
        </div>
      </div>
      </div>
      <div class="xvault-list" id="xvault-list"></div>
      </section>

      <section class="xvault-view xvault-settings-view" data-view-panel="settings" hidden>
      <div class="xvault-settings-scroll">
        <div class="xvault-settings-intro">
          <strong>设置</strong>
          <span>修改会立即生效；需要手动保存的项目仍保留应用按钮。</span>
        </div>
      <div class="xvault-controls">
        <details class="xvault-advanced xvault-settings-card">
          <summary>关键词与排除词</summary>
          <div class="xvault-adv-body">
            <div class="xvault-row">
              <input type="text" class="xvault-input" id="xvault-keywords" placeholder="关键词（逗号分隔）" />
              <select class="xvault-select" id="xvault-keyword-mode">
                <option value="plain">任意匹配</option>
                <option value="and">全部匹配</option>
                <option value="regex">正则</option>
              </select>
              <button class="xvault-btn primary" data-action="save-keywords">保存</button>
            </div>
            <div class="xvault-row">
              <input type="text" class="xvault-input" id="xvault-exclude" placeholder="排除词（命中则隐藏，逗号分隔）" />
              <button class="xvault-btn" data-action="save-exclude">保存</button>
            </div>
          </div>
        </details>
        <details class="xvault-advanced xvault-settings-card">
          <summary>内容净化</summary>
          <div class="xvault-adv-body">
            <div class="xvault-row xvault-adultspam-master-row">
              <label class="xvault-field inline"><input type="checkbox" id="xvault-hide-adult-spam" /> 隐藏黄推 / 成人引流机器人</label>
              <select class="xvault-select" id="xvault-adultspam-level" title="检测强度">
                <option value="balanced">均衡</option>
                <option value="conservative">保守</option>
              </select>
            </div>
            <div class="xvault-dependent-options" id="xvault-adultspam-options">
            <label class="xvault-field inline"><input type="checkbox" id="xvault-adultspam-skip-following" /> 不审查已关注账号（转发内容除外）</label>
            <label class="xvault-field inline"><input type="checkbox" id="xvault-adultspam-skip-following-reposts" /> 不审查已关注账号的转发内容</label>
            <div class="xvault-adv-label">使用多信号评分，只隐藏当前页面帖子，不改写网络响应、不自动拉黑账号；关闭开关即可恢复。</div>
            <div class="xvault-row">
              <input type="text" class="xvault-input" id="xvault-adultspam-keywords" placeholder="自定义屏蔽词（字面匹配，逗号分隔）" />
            </div>
            <div class="xvault-row">
              <input type="text" class="xvault-input" id="xvault-adultspam-whitelist" placeholder="账号白名单（如 @example，逗号分隔）" />
              <button class="xvault-btn primary" data-action="save-adultspam">保存规则</button>
            </div>
            </div>
            <div class="xvault-content-status" id="xvault-adultspam-count">当前隐藏 0 · 本次累计 0 · 已扫描 0 · 已识别关注 0</div>
          </div>
        </details>
        <details class="xvault-advanced xvault-settings-card">
          <summary>界面净化与宽屏</summary>
          <div class="xvault-adv-body">
            <label class="xvault-field inline"><input type="checkbox" id="xvault-layout-enabled" /> 启用界面净化与宽屏</label>
            <div class="xvault-dependent-options" id="xvault-layout-options">
            <label class="xvault-field inline"><input type="checkbox" id="xvault-layout-auto-width" /> 自动读取 X 当前的时间线与左侧栏宽度（默认开启）</label>
            <div class="xvault-row xvault-control-row">
              <label class="xvault-field">时间线宽度(px)
                <input type="number" min="600" max="3000" class="xvault-input small" id="xvault-timeline-width" />
              </label>
              <label class="xvault-field">左侧栏宽度(px)
                <input type="number" min="160" max="500" class="xvault-input small" id="xvault-leftbar-width" />
              </label>
              <button class="xvault-btn primary" data-action="save-layout">应用宽度</button>
            </div>
            <div class="xvault-adv-label">自动读取时，上方数字只显示实测值且不会改写 X 原生布局；关闭自动读取后即可编辑并应用手动宽度。</div>
            <label class="xvault-field inline"><input type="checkbox" id="xvault-layout-hide-leftbar" /> 隐藏左侧导航栏</label>
            <label class="xvault-field inline"><input type="checkbox" id="xvault-layout-hide-sidebar" /> 隐藏右侧栏</label>
            <label class="xvault-field inline"><input type="checkbox" id="xvault-layout-fill-center" /> 中间栏填满（启用时同时隐藏左右栏）</label>
            <label class="xvault-field inline"><input type="checkbox" id="xvault-layout-clean-nav" /> 精简导航、Premium 推广与页脚</label>
            <label class="xvault-field inline"><input type="checkbox" id="xvault-layout-hide-message" /> 隐藏右下消息栏 / Grok</label>
            <label class="xvault-field inline"><input type="checkbox" id="xvault-layout-hide-showmore" /> 隐藏帖子“显示更多”（可能影响长文展开，默认关闭）</label>
            <div class="xvault-adv-label">消息页和设置页自动停用版面调整；所有改动均可关闭恢复。</div>
            </div>
          </div>
        </details>
        <details class="xvault-advanced xvault-settings-card">
          <summary>高级设置</summary>
          <div class="xvault-adv-body">
            <div class="xvault-row">
              <label class="xvault-field">自动清理(天)
                <input type="number" min="0" class="xvault-input small" id="xvault-autoclean" />
              </label>
              <label class="xvault-field">最大条数
                <input type="number" min="50" class="xvault-input small" id="xvault-maxposts" />
              </label>
              <label class="xvault-field">闪现阈值(秒)
                <input type="number" min="1" class="xvault-input small" id="xvault-flashms" />
              </label>
              <label class="xvault-field">主题
                <select class="xvault-select" id="xvault-theme">
                  <option value="auto">跟随系统</option>
                  <option value="dark">深色</option>
                  <option value="light">浅色</option>
                </select>
              </label>
            </div>
            <div class="xvault-row xvault-control-row">
              <label class="xvault-field">下载超时(秒)
                <input type="number" min="5" class="xvault-input small" id="xvault-dltimeout" />
              </label>
              <label class="xvault-field inline"><input type="checkbox" id="xvault-markread" /> 点空白处算已读</label>
              <button class="xvault-btn primary" data-action="save-advanced">应用</button>
            </div>
            <div class="xvault-adv-label">不记录以下来源：</div>
            <div class="xvault-chip-row" id="xvault-skip-sources"></div>
          </div>
        </details>
        <details class="xvault-advanced xvault-settings-card">
          <summary>其他功能</summary>
          <div class="xvault-adv-body">
            <label class="xvault-field inline"><input type="checkbox" id="xvault-firefox-compat" /> 兼容 Firefox（仅 Firefox）</label>
            <div class="xvault-adv-label">遇到页面一直卡在只显示 X 图标时开启；会停用页面网络 Hook，点击开关可查看具体影响。</div>
            <label class="xvault-field inline xvault-desktop-only-setting"><input type="checkbox" id="xvault-desktop-mobile-badge" /> 切换为移动端徽标（仅 PC）</label>
            <div class="xvault-adv-label xvault-desktop-only-setting">使用圆形脚本图标与未读角标，并继续支持桌面端拖拽。</div>
            <label class="xvault-field inline"><input type="checkbox" id="xvault-hideads" /> 关闭广告（隐藏含“广告”标记的推广帖）</label>
            <div class="xvault-adv-label">开启后自动隐藏时间线里的推广帖，且不会记入保险箱。</div>
            <label class="xvault-field inline"><input type="checkbox" id="xvault-mediadl" /> 一键下载图片 / 视频 / GIF</label>
            <div class="xvault-adv-label">开启后帖子操作栏会出现 ⬇ 按钮：单个媒体按「用户ID_帖子ID」命名；多个则打包为同名 zip，包内按 1、2、3… 命名。</div>
            <label class="xvault-field inline"><input type="checkbox" id="xvault-bypassage" /> 取消年龄限制（用原图 / 视频内联替换遮罩）</label>
            <div class="xvault-adv-label">如果不显示，请耐心等待或者重新开关按钮；仅本地操作，不改动账号设置。</div>
          </div>
        </details>
      </div>
      </div>
      </section>
    `;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json,.json';
    fileInput.style.display = 'none';

    root.appendChild(panel);
    root.appendChild(badge);
    root.appendChild(fileInput);
    document.body.appendChild(root);

    state.rootEl = root;
    state.badgeEl = badge;
    state.panelEl = panel;
    state.importInputEl = fileInput;
    state.listEl = panel.querySelector('#xvault-list');
    state.summaryEl = panel.querySelector('#xvault-summary');
    state.filterBarEl = panel.querySelector('#xvault-filter-bar');
    state.sourceSelectEl = panel.querySelector('#xvault-source');
    state.mediaSelectEl = panel.querySelector('#xvault-media');
    state.keywordInputEl = panel.querySelector('#xvault-keywords');
    state.excludeInputEl = panel.querySelector('#xvault-exclude');
    state.keywordModeEl = panel.querySelector('#xvault-keyword-mode');
    state.searchEl = panel.querySelector('#xvault-search');
    state.sortEl = panel.querySelector('#xvault-sort');
    state.autoCleanInputEl = panel.querySelector('#xvault-autoclean');
    state.maxPostsInputEl = panel.querySelector('#xvault-maxposts');
    state.flashMsInputEl = panel.querySelector('#xvault-flashms');
    state.dlTimeoutInputEl = panel.querySelector('#xvault-dltimeout');
    state.markReadEl = panel.querySelector('#xvault-markread');
    state.themeSelectEl = panel.querySelector('#xvault-theme');
    state.skipSourcesEl = panel.querySelector('#xvault-skip-sources');
    state.hideAdsEl = panel.querySelector('#xvault-hideads');
    state.hideAdultSpamEl = panel.querySelector('#xvault-hide-adult-spam');
    state.adultSpamLevelEl = panel.querySelector('#xvault-adultspam-level');
    state.adultSpamSkipFollowingEl = panel.querySelector('#xvault-adultspam-skip-following');
    state.adultSpamSkipFollowingRepostsEl = panel.querySelector('#xvault-adultspam-skip-following-reposts');
    state.adultSpamKeywordsEl = panel.querySelector('#xvault-adultspam-keywords');
    state.adultSpamWhitelistEl = panel.querySelector('#xvault-adultspam-whitelist');
    state.adultSpamCountEl = panel.querySelector('#xvault-adultspam-count');
    state.layoutEnabledEl = panel.querySelector('#xvault-layout-enabled');
    state.layoutAutoWidthEl = panel.querySelector('#xvault-layout-auto-width');
    state.timelineWidthEl = panel.querySelector('#xvault-timeline-width');
    state.leftbarWidthEl = panel.querySelector('#xvault-leftbar-width');
    state.layoutHideLeftbarEl = panel.querySelector('#xvault-layout-hide-leftbar');
    state.layoutHideSidebarEl = panel.querySelector('#xvault-layout-hide-sidebar');
    state.layoutFillCenterEl = panel.querySelector('#xvault-layout-fill-center');
    state.layoutCleanNavigationEl = panel.querySelector('#xvault-layout-clean-nav');
    state.layoutHideMessageGrokEl = panel.querySelector('#xvault-layout-hide-message');
    state.layoutHideShowMoreEl = panel.querySelector('#xvault-layout-hide-showmore');
    state.firefoxCompatibilityEl = panel.querySelector('#xvault-firefox-compat');
    state.mediaDownloadEl = panel.querySelector('#xvault-mediadl');
    state.bypassAgeEl = panel.querySelector('#xvault-bypassage');
    state.useMobileBadgeOnDesktopEl = panel.querySelector('#xvault-desktop-mobile-badge');
    state.menuEl = panel.querySelector('#xvault-menu');

    state.mediaSelectEl.innerHTML = buildMediaOptionsHtml();

    badge.addEventListener('click', () => togglePanel());
    makeBadgeDraggable();

    // 搜索
    state.searchEl.addEventListener('input', debounce((e) => {
      state.searchQuery = e.target.value || '';
      resetPaging();
      refreshUI({ keepScroll: false });
    }, 200));

    // 下拉选择
    state.sourceSelectEl.addEventListener('change', (e) => setSettingsPartial({ sourceFilter: e.target.value }));
    state.mediaSelectEl.addEventListener('change', (e) => setSettingsPartial({ mediaFilter: e.target.value }));
    state.sortEl.addEventListener('change', (e) => setSettingsPartial({ sortBy: e.target.value }));
    state.keywordModeEl.addEventListener('change', (e) => setSettingsPartial({ keywordMode: e.target.value }));
    state.markReadEl.addEventListener('change', (e) => setSettingsPartial({ markReadOnClick: !!e.target.checked }));
    state.themeSelectEl.addEventListener('change', (e) => setSettingsPartial({ theme: e.target.value }));
    state.hideAdsEl.addEventListener('change', (e) => setSettingsPartial({ hideAds: !!e.target.checked }));
    state.hideAdultSpamEl.addEventListener('change', (e) => setSettingsPartial({ hideAdultSpam: !!e.target.checked }));
    state.adultSpamLevelEl.addEventListener('change', (e) => setSettingsPartial({ adultSpamLevel: e.target.value }));
    state.adultSpamSkipFollowingEl.addEventListener('change', (e) => setSettingsPartial({ adultSpamSkipFollowing: !!e.target.checked }));
    state.adultSpamSkipFollowingRepostsEl.addEventListener('change', (e) => {
      setSettingsPartial({ adultSpamSkipFollowingReposts: !!e.target.checked });
    });
    state.layoutEnabledEl.addEventListener('change', (e) => setSettingsPartial({ layoutEnabled: !!e.target.checked }));
    state.layoutAutoWidthEl.addEventListener('change', (e) => setSettingsPartial({ layoutAutoWidth: !!e.target.checked }));
    state.layoutHideLeftbarEl.addEventListener('change', (e) => setSettingsPartial({ layoutHideLeftbar: !!e.target.checked }));
    state.layoutHideSidebarEl.addEventListener('change', (e) => setSettingsPartial({ layoutHideSidebar: !!e.target.checked }));
    state.layoutFillCenterEl.addEventListener('change', (e) => setSettingsPartial({ layoutFillCenter: !!e.target.checked }));
    state.layoutCleanNavigationEl.addEventListener('change', (e) => setSettingsPartial({ layoutCleanNavigation: !!e.target.checked }));
    state.layoutHideMessageGrokEl.addEventListener('change', (e) => setSettingsPartial({ layoutHideMessageGrok: !!e.target.checked }));
    state.layoutHideShowMoreEl.addEventListener('change', (e) => setSettingsPartial({ layoutHideShowMore: !!e.target.checked }));
    state.firefoxCompatibilityEl.addEventListener('click', (e) => {
      e.preventDefault();
      showFirefoxCompatibilityToggleDialog(!state.settings.firefoxCompatibility);
    });
    state.mediaDownloadEl.addEventListener('change', (e) => setSettingsPartial({ mediaDownload: !!e.target.checked }));
    state.bypassAgeEl.addEventListener('change', (e) => setSettingsPartial({ bypassAgeRestriction: !!e.target.checked }));
    state.useMobileBadgeOnDesktopEl.addEventListener('change', (e) => {
      setSettingsPartial({ useMobileBadgeOnDesktop: !!e.target.checked });
    });
    state.importInputEl.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importPosts(file);
      e.target.value = '';
    });

    // 事件委派
    root.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      const clickedAction = actionEl ? actionEl.getAttribute('data-action') : null;
      if (state.menuEl && !state.menuEl.hidden && clickedAction !== 'menu-toggle') state.menuEl.hidden = true;
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-action');
      const id = actionEl.getAttribute('data-id');

      switch (action) {
        case 'set-panel-view':
          setPanelView(actionEl.getAttribute('data-view'));
          break;
        case 'menu-toggle':
          if (state.menuEl) state.menuEl.hidden = !state.menuEl.hidden;
          break;
        case 'close': togglePanel(false); break;
        case 'refresh': scanArticles(document); refreshUI(); break;
        case 'mark-all-read': {
          const unreadPosts = filterPosts(state.posts).filter((p) => !p.clicked);
          if (!unreadPosts.length) { alert('当前列表没有未读的帖子喂～'); break; }
          if (confirm('确定要把当前列表的 ' + unreadPosts.length + ' 条未读帖子全部标为已读吗？')) {
            markPostsRead(unreadPosts.map((p) => p.id));
            showToast('✅ 已将当前列表全部标为已读');
          }
          break;
        }
        case 'export': exportPosts(); break;
        case 'backup': backupAll(); break;
        case 'import': state.importInputEl.click(); break;
        case 'clear-non-fav': clearNonFavoritePosts(); break;
        case 'load-more':
          state.renderLimit = (state.renderLimit || state.settings.pageSize || 60) + (state.settings.pageSize || 60);
          refreshUI({ keepScroll: true });
          break;
        case 'set-filter':
          setSettingsPartial({ filter: actionEl.getAttribute('data-filter') });
          break;
        case 'toggle-skip': {
          const key = actionEl.getAttribute('data-skip');
          const cur = state.settings.skipSources || [];
          const nextSkip = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
          setSettingsPartial({ skipSources: nextSkip });
          break;
        }
        case 'save-keywords': {
          const parsed = parseKeywords(state.keywordInputEl.value);
          const rejected = state.settings.keywordMode === 'regex' ? parsed.filter((item) => !isSafeRegexSource(item)) : [];
          const accepted = rejected.length ? parsed.filter((item) => isSafeRegexSource(item)) : parsed;
          setSettingsPartial({ keywords: accepted });
          showToast(rejected.length ? `⚠️ 已忽略 ${rejected.length} 条高风险或无效正则` : '✅ 已保存关键词', rejected.length ? 5000 : undefined);
          break;
        }
        case 'save-exclude': {
          const parsed = parseKeywords(state.excludeInputEl.value);
          const rejected = state.settings.keywordMode === 'regex' ? parsed.filter((item) => !isSafeRegexSource(item)) : [];
          const accepted = rejected.length ? parsed.filter((item) => isSafeRegexSource(item)) : parsed;
          setSettingsPartial({ excludeKeywords: accepted });
          showToast(rejected.length ? `⚠️ 已忽略 ${rejected.length} 条高风险或无效正则` : '✅ 已保存排除词', rejected.length ? 5000 : undefined);
          break;
        }
        case 'save-adultspam': {
          const adultSpamKeywords = parseKeywords(state.adultSpamKeywordsEl.value).slice(0, 50)
            .map((item) => item.slice(0, 80));
          const adultSpamWhitelist = parseAdultSpamWhitelist(state.adultSpamWhitelistEl.value).slice(0, 100);
          setSettingsPartial({ adultSpamKeywords, adultSpamWhitelist });
          showToast('✓ 已保存内容净化规则');
          break;
        }
        case 'save-layout': {
          const timelineWidth = clampInt(state.timelineWidthEl.value, 600, 3000, state.settings.timelineWidth);
          const leftbarWidth = clampInt(state.leftbarWidthEl.value, 160, 500, state.settings.leftbarWidth);
          setSettingsPartial({ layoutAutoWidth: false, timelineWidth, leftbarWidth });
          showToast('✓ 已切换为手动宽度并应用');
          break;
        }
        case 'save-advanced': {
          const maxPosts = clampInt(state.maxPostsInputEl.value, 50, 5000, state.settings.maxPosts);
          const flashSec = clampInt(state.flashMsInputEl.value, 1, 60, Math.round((state.settings.flashMs || 8000) / 1000));
          const days = clampInt(state.autoCleanInputEl.value, 0, 3650, state.settings.autoCleanDays);
          const dlSec = state.dlTimeoutInputEl ? clampInt(state.dlTimeoutInputEl.value, 5, 600, Math.round((state.settings.downloadTimeout || DEFAULT_SETTINGS.downloadTimeout) / 1000)) : Math.round((state.settings.downloadTimeout || DEFAULT_SETTINGS.downloadTimeout) / 1000);
          setSettingsPartial({ maxPosts, flashMs: flashSec * 1000, autoCleanDays: days, downloadTimeout: dlSec * 1000 });
          queueDbWrite(async () => { await enforceMaxPosts(); });
          runAutoClean();
          showToast('✅ 已应用高级设置');
          break;
        }
        case 'toggle-expand':
          if (state.expandedPosts.has(id)) state.expandedPosts.delete(id); else state.expandedPosts.add(id);
          refreshUI({ keepScroll: true });
          break;
        case 'edit-note':
          state.editingNoteId = id;
          refreshUI({ keepScroll: true });
          setTimeout(() => {
            const ta = state.listEl.querySelector(`.xvault-note-input[data-id="${id}"]`);
            if (ta) { ta.focus(); ta.selectionStart = ta.value.length; }
          }, 20);
          break;
        case 'save-note': {
          const ta = state.listEl.querySelector(`.xvault-note-input[data-id="${id}"]`);
          updatePostNote(id, ta ? ta.value.trim() : '');
          break;
        }
        case 'cancel-note':
          state.editingNoteId = null;
          refreshUI({ keepScroll: true });
          break;
        case 'open': {
          const post = getPostById(id);
          if (post && post.url) { markClicked(id); window.open(post.url, '_blank', 'noopener'); }
          break;
        }
        case 'copy': {
          const post = getPostById(id);
          if (post && post.url) {
            try {
              (navigator.clipboard && navigator.clipboard.writeText)
                ? navigator.clipboard.writeText(post.url).then(() => { actionEl.textContent = '已复制'; setTimeout(() => { actionEl.textContent = '复制链接'; }, 1200); })
                : window.prompt('复制链接：', post.url);
            } catch (err) { window.prompt('复制链接：', post.url); }
          }
          break;
        }
        case 'pin': togglePin(id); break;
        case 'fav': toggleFavorite(id); break;
        case 'delete': deletePost(id); break;
        default: break;
      }
    });

    repositionBadge();
    setPanelView(state.panelView);
    refreshUI();
  }

  // ── 样式 ─────────────────────────────────────────────────────────
  function addStyle(css) {
    if (typeof GM_addStyle !== 'undefined') { GM_addStyle(css); return; }
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function installStyles() {
    addStyle(`
      #xvault-root {
        position: fixed; left: 16px; bottom: 16px; z-index: 2147483000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        --xv-panel-bg: rgba(21,24,28,0.98);
        --xv-text: #e7e9ea;
        --xv-border: rgba(255,255,255,0.12);
        --xv-chip-bg: rgba(255,255,255,0.06);
        --xv-input-bg: rgba(255,255,255,0.06);
        --xv-muted: rgba(231,233,234,0.62);
        --xv-item-bg: rgba(255,255,255,0.03);
        --xv-accent: #1d9bf0;
      }
      #xvault-root.xvault-light {
        --xv-panel-bg: rgba(255,255,255,0.99);
        --xv-text: #0f1419;
        --xv-border: rgba(0,0,0,0.12);
        --xv-chip-bg: rgba(0,0,0,0.05);
        --xv-input-bg: rgba(0,0,0,0.04);
        --xv-muted: rgba(15,20,25,0.6);
        --xv-item-bg: rgba(0,0,0,0.02);
      }
      #xvault-badge {
        background: var(--xv-accent); color: #fff; border: none; border-radius: 999px;
        padding: 10px 16px; font-size: 13px; font-weight: 700; cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.35); touch-action: none; user-select: none;
      }
      #xvault-badge:hover { filter: brightness(1.08); }
      #xvault-badge.mobile-mode {
        width: 52px; height: 52px; padding: 0; border-radius: 50%; font-size: 22px;
        display: flex; align-items: center; justify-content: center; position: relative;
      }
      .xvault-mobile-icon {
        width: 42px; height: 42px; border-radius: 50%; object-fit: cover;
        border: 2px solid rgba(255,255,255,.72); box-shadow: 0 2px 8px rgba(0,0,0,.22);
        pointer-events: none; user-select: none; -webkit-user-drag: none;
      }
      #xvault-badge.mobile-mode.desktop-icon-mode { width: 64px; height: 64px; }
      #xvault-badge.mobile-mode.desktop-icon-mode .xvault-mobile-icon { width: 54px; height: 54px; }
      #xvault-badge.desktop-icon-mode { cursor: grab; }
      #xvault-badge.desktop-icon-mode.is-dragging { cursor: grabbing; }
      #xvault-badge.desktop-icon-mode .xvault-mobile-icon-fallback { font-size: 30px; }
      .xvault-mobile-icon-fallback { line-height: 1; }
      #xvault-root.xvault-mobile .xvault-desktop-only-setting { display: none !important; }
      .xvault-mobile-dot {
        position: absolute; top: -2px; right: -2px; background: #f4212e; color: #fff;
        min-width: 18px; height: 18px; border-radius: 999px; font-size: 11px; font-weight: 700;
        line-height: 18px; text-align: center; padding: 0 4px;
      }
      #xvault-root.xvault-mobile { left: auto; right: 16px; bottom: 84px; }
      #xvault-root.xvault-mobile #xvault-badge {
        opacity: var(--xv-mobile-badge-opacity, 1);
        transition: opacity 170ms ease-out, filter .15s;
      }
      #xvault-root.xvault-mobile.xvault-mobile-badge-inactive #xvault-badge { pointer-events: none; }

      #xvault-panel {
        position: absolute; bottom: calc(100% + 10px); left: 0;
        width: min(94vw, 480px); max-height: calc(100vh - 96px);
        background: var(--xv-panel-bg); color: var(--xv-text);
        border: 1px solid var(--xv-border); border-radius: 16px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.5); backdrop-filter: blur(12px);
        display: flex; flex-direction: column; overflow: hidden;
      }
      #xvault-root.xvault-panel-right #xvault-panel { left: auto; right: 0; }
      #xvault-root.xvault-mobile #xvault-panel { position: fixed; right: 12px; left: auto; bottom: 84px; max-height: calc(100vh - 120px); }
      .xvault-ad-hidden { display: none !important; }
      .xvault-adult-spam-hidden { display: none !important; }
      .xvault-dl-btn {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 30px; height: 30px; margin-left: 2px; padding: 0 6px;
        border: none; background: transparent; color: rgb(83,100,113);
        font-size: 16px; line-height: 1; cursor: pointer; border-radius: 999px;
        transition: background .15s, color .15s;
      }
      .xvault-dl-btn:hover { background: rgba(29,155,240,0.12); color: rgb(29,155,240); }
      .xvault-dl-btn.in-group { align-self: center; flex: 0 0 auto; }
      .xvault-dl-btn.floating {
        position: absolute; top: 8px; right: 8px; z-index: 5;
        width: 34px; height: 34px; margin: 0;
        background: rgba(0,0,0,0.6); color: #fff;
      }
      .xvault-dl-btn.floating:hover { background: rgba(29,155,240,0.9); color: #fff; }
      .xvault-mask-hidden { display: none !important; }
      .xvault-unlocked { display: grid; gap: 3px; margin: 8px 0; width: 100%; max-width: 100%; border-radius: 14px; overflow: hidden; border: 1px solid rgba(0,0,0,0.15); }
      .xvault-unlocked > a { display: block; overflow: hidden; }
      /* 单图/单视频：按原始比例完整展示 */
      .xvault-unlocked.xv-n1 { grid-template-columns: 1fr; }
      .xvault-unlocked.xv-n1 img, .xvault-unlocked.xv-n1 video { display: block; margin: 0 auto; width: auto; height: auto; max-width: 100%; max-height: 510px; object-fit: contain; background: #000; }
      /* 多图：X 经典马赛克，裁切填满方格 */
      .xvault-unlocked.xv-multi > a, .xvault-unlocked.xv-multi > video { width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: hidden; }
      .xvault-unlocked.xv-multi img, .xvault-unlocked.xv-multi video { display: block; width: 100%; height: 100%; object-fit: cover; background: #000; }
      .xvault-unlocked.xv-n2 { grid-template-columns: 1fr 1fr; aspect-ratio: 16 / 9; }
      .xvault-unlocked.xv-n3 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; aspect-ratio: 16 / 9; }
      .xvault-unlocked.xv-n3 > *:first-child { grid-row: 1 / span 2; }
      .xvault-unlocked.xv-n4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; aspect-ratio: 16 / 9; }
      .xvault-unlocked.xv-nm { grid-template-columns: 1fr 1fr; }
      .xvault-unlocked.xv-nm > a, .xvault-unlocked.xv-nm > video { aspect-ratio: 1 / 1; min-width: 0; min-height: 0; overflow: hidden; }
      #xvault-toast {
        position: fixed; left: 50%; bottom: 90px; transform: translateX(-50%) translateY(10px);
        background: rgba(21,24,28,0.98); color: #fff; padding: 10px 16px; border-radius: 10px;
        font-size: 13px; z-index: 2147483600; box-shadow: 0 6px 24px rgba(0,0,0,0.4);
        opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; max-width: 80vw;
      }
      #xvault-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

      .xvault-dialog-overlay {
        position: fixed; inset: 0; z-index: 2147483646;
        display: flex; align-items: center; justify-content: center;
        padding: 18px; background: rgba(0,0,0,.64); backdrop-filter: blur(4px);
        color: var(--xv-text);
      }
      .xvault-dialog {
        width: min(92vw, 460px); max-height: min(82vh, 640px); overflow: auto;
        padding: 20px; border: 1px solid var(--xv-border); border-radius: 16px;
        background: var(--xv-panel-bg); box-shadow: 0 18px 64px rgba(0,0,0,.55);
      }
      .xvault-dialog-title { font-size: 18px; line-height: 1.35; font-weight: 800; margin-bottom: 12px; }
      .xvault-dialog-body { font-size: 14px; line-height: 1.65; color: var(--xv-text); }
      .xvault-dialog-body p { margin: 0 0 10px; }
      .xvault-dialog-body ul { margin: 0 0 12px; padding-left: 22px; }
      .xvault-dialog-body li { margin: 4px 0; }
      .xvault-dialog-body code {
        padding: 1px 5px; border-radius: 5px; background: var(--xv-chip-bg);
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .92em;
      }
      .xvault-dialog-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 18px; }
      .xvault-dialog-actions .xvault-btn { min-width: 104px; padding: 9px 14px; font-size: 14px; }

      #xvault-panel * { box-sizing: border-box; }
      .xvault-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 14px 14px 8px; }
      .xvault-title-main { font-size: 15px; font-weight: 800; }
      .xvault-title-sub { font-size: 11px; color: var(--xv-muted); margin-top: 2px; }
      .xvault-header-actions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
      .xvault-tip { padding: 0 14px 8px; font-size: 13px; color: var(--xv-muted); }

      .xvault-btn {
        background: var(--xv-chip-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 8px; padding: 5px 10px; font-size: 12px; cursor: pointer; white-space: nowrap;
      }
      .xvault-btn:hover { border-color: var(--xv-accent); }
      .xvault-btn.primary { background: var(--xv-accent); color: #fff; border-color: var(--xv-accent); }
      .xvault-btn.danger { color: #f4212e; }
      .xvault-btn.danger:hover { border-color: #f4212e; }

      .xvault-summary { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 10px; }
      .xvault-stat { background: var(--xv-chip-bg); border-radius: 8px; padding: 4px 8px; font-size: 11px; color: var(--xv-muted); }
      .xvault-stat b { color: var(--xv-text); font-size: 12px; }

      .xvault-filter-bar, .xvault-chip-row { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 10px; }
      .xvault-chip-row { padding: 6px 0 0; }
      .xvault-chip {
        background: var(--xv-chip-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 999px; padding: 4px 12px; font-size: 12px; cursor: pointer;
      }
      .xvault-chip.active { background: var(--xv-accent); color: #fff; border-color: var(--xv-accent); }

      .xvault-controls { padding: 0 14px 10px; display: flex; flex-direction: column; gap: 8px; }
      .xvault-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
      .xvault-control-row { align-items: flex-end; }
      .xvault-control-row > .xvault-btn,
      .xvault-control-row > .xvault-field > .xvault-input { height: 32px; }
      .xvault-control-row > .xvault-field.inline {
        height: 32px; justify-content: center; align-self: flex-end;
      }
      .xvault-row .xvault-input { flex: 1 1 120px; }
      .xvault-input {
        background: var(--xv-input-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 8px; padding: 7px 10px; font-size: 13px; width: 100%;
      }
      .xvault-input.small { width: 90px; flex: 0 0 auto; }
      .xvault-select {
        background: var(--xv-input-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 8px; padding: 6px 8px; font-size: 12px; cursor: pointer;
      }
      .xvault-select option { color: #000; }
      .xvault-light .xvault-select option { color: #0f1419; }

      .xvault-advanced { border: 1px solid var(--xv-border); border-radius: 8px; padding: 6px 10px; }
      .xvault-advanced summary { cursor: pointer; font-size: 13px; color: var(--xv-muted); }
      .xvault-adv-body { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
      .xvault-field { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--xv-muted); }
      .xvault-field.inline { flex-direction: row; align-items: center; gap: 6px; }
      .xvault-adv-label { font-size: 12px; color: var(--xv-muted); }
      .xvault-content-status { font-size: 11px; color: var(--xv-muted); padding: 5px 8px; border-radius: 7px; background: var(--xv-chip-bg); }

      .xvault-list { overflow-y: auto; padding: 4px 14px 14px; display: flex; flex-direction: column; gap: 10px; }
      .xvault-empty { padding: 24px 8px; text-align: center; color: var(--xv-muted); font-size: 13px; }
      .xvault-loadmore {
        margin-top: 4px; background: var(--xv-chip-bg); color: var(--xv-text); border: 1px dashed var(--xv-border);
        border-radius: 8px; padding: 8px; font-size: 12px; cursor: pointer;
      }

      .xvault-item { background: var(--xv-item-bg); border: 1px solid var(--xv-border); border-radius: 12px; padding: 10px 12px; }
      .xvault-item.is-flash-lost { border-color: rgba(244,33,46,0.5); }
      .xvault-item.is-pinned { border-color: rgba(29,155,240,0.6); }
      .xvault-item-top { display: flex; justify-content: space-between; gap: 8px; }
      .xvault-author-head { display: flex; align-items: center; gap: 8px; }
      .xvault-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex: 0 0 auto; }
      .xvault-author-line { font-size: 13px; font-weight: 700; word-break: break-word; }
      .xvault-submeta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 3px; font-size: 10px; color: var(--xv-muted); }
      .xvault-actions { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; align-content: flex-start; }

      .xvault-text { margin: 8px 0 4px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
      .xvault-text.collapsed { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .xvault-expand-btn { background: none; border: none; color: var(--xv-accent); font-size: 12px; cursor: pointer; padding: 0; }
      .xvault-hl { background: #ffd400; color: #000; border-radius: 3px; padding: 0 1px; }

      .xvault-thumbs { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
      .xvault-thumb { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; border: 1px solid var(--xv-border); }

      .xvault-tags { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0; }
      .xvault-tag { font-size: 10px; padding: 2px 6px; border-radius: 6px; background: var(--xv-chip-bg); color: var(--xv-muted); }
      .xvault-tag.fav { background: rgba(255,212,0,0.15); color: #ffd400; }
      .xvault-tag.pin { background: rgba(29,155,240,0.15); color: var(--xv-accent); }
      .xvault-tag.flash { background: rgba(244,33,46,0.15); color: #f4212e; }
      .xvault-tag.opened { background: rgba(0,186,124,0.15); color: #00ba7c; }
      .xvault-tag.keyword { background: rgba(255,212,0,0.15); color: #ffd400; }

      .xvault-note-area { margin-top: 4px; }
      .xvault-note-btn { font-size: 11px; padding: 3px 8px; }
      .xvault-note-text { margin-top: 4px; font-size: 12px; color: var(--xv-text); background: var(--xv-chip-bg); border-radius: 6px; padding: 6px 8px; word-break: break-word; }
      .xvault-note-input { width: 100%; min-height: 60px; resize: vertical; background: var(--xv-input-bg); color: var(--xv-text); border: 1px solid var(--xv-border); border-radius: 8px; padding: 7px; font-size: 12px; }
      .xvault-note-actions { display: flex; gap: 6px; margin-top: 6px; }
      .xvault-bottom-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; font-size: 10px; color: var(--xv-muted); }

      .xvault-list::-webkit-scrollbar { width: 8px; }
      .xvault-list::-webkit-scrollbar-thumb { background: var(--xv-border); border-radius: 8px; }

      /* ===== UI/UX 优化：吸顶 / 分区 / 菜单 / 视觉统一 ===== */
      .xvault-panel-top { flex: 0 0 auto; }
      .xvault-list { flex: 1 1 auto; min-height: 120px; }
      .xvault-header { padding-bottom: 10px; border-bottom: 1px solid var(--xv-border); }
      .xvault-section-label { padding: 8px 14px 2px; font-size: 11px; font-weight: 700; letter-spacing: .03em; color: var(--xv-muted); }
      .xvault-controls .xvault-section-label { padding: 4px 0 0; }
      .xvault-controls { border-top: 1px solid var(--xv-border); padding-top: 12px; }
      /* “…”下拉菜单 */
      .xvault-menu-wrap { position: relative; display: inline-flex; }
      .xvault-icon-btn { padding: 5px 10px; font-weight: 700; line-height: 1; }
      .xvault-menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: 30; display: flex; flex-direction: column; gap: 2px; padding: 6px; min-width: 150px; background: var(--xv-panel-bg); border: 1px solid var(--xv-border); border-radius: 12px; box-shadow: 0 10px 32px rgba(0,0,0,0.45); backdrop-filter: blur(12px); }
      .xvault-menu[hidden] { display: none; }
      .xvault-menu-item { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: transparent; color: var(--xv-text); border: none; border-radius: 8px; padding: 8px 10px; font-size: 13px; cursor: pointer; white-space: nowrap; transition: background .15s; }
      .xvault-menu-item:hover { background: var(--xv-chip-bg); }
      .xvault-menu-item.danger { color: #f4212e; }
      .xvault-menu-item.danger:hover { background: rgba(244,33,46,0.12); }
      /* 视觉统一：过渡 / 悬停 / 聚焦 */
      .xvault-btn { transition: background .15s, border-color .15s, color .15s; }
      .xvault-btn:hover { background: var(--xv-chip-bg); }
      .xvault-btn.primary:hover { background: var(--xv-accent); filter: brightness(1.08); }
      .xvault-chip { transition: background .15s, border-color .15s, color .15s; }
      .xvault-input, .xvault-select, .xvault-note-input { transition: border-color .15s, box-shadow .15s; }
      .xvault-input:focus, .xvault-select:focus, .xvault-note-input:focus { outline: none; border-color: var(--xv-accent); box-shadow: 0 0 0 2px rgba(29,155,240,0.25); }
      .xvault-item { transition: border-color .15s, background .15s; }
      .xvault-item:hover { border-color: rgba(29,155,240,0.5); }
      /* 折叠区：箭头指示 */
      .xvault-advanced { transition: border-color .15s; }
      .xvault-advanced[open] { border-color: rgba(29,155,240,0.4); }
      .xvault-advanced summary { list-style: none; display: flex; align-items: center; gap: 6px; font-weight: 600; user-select: none; }
      .xvault-advanced summary::-webkit-details-marker { display: none; }
      .xvault-advanced summary::before { content: '▸'; font-size: 10px; color: var(--xv-muted); transition: transform .15s; }
      .xvault-advanced[open] summary::before { transform: rotate(90deg); }

      /* ===== v1.7：双视图工作台 ===== */
      #xvault-panel {
        position: fixed;
        top: 12px;
        bottom: 12px;
        width: min(94vw, 520px);
        height: auto;
        max-height: none;
      }
      .xvault-header {
        flex: 0 0 auto; align-items: center; min-height: 58px; padding: 11px 14px;
        border-bottom: none; background: var(--xv-panel-bg);
      }
      .xvault-title { min-width: 0; }
      .xvault-title-main { display: flex; align-items: center; gap: 8px; font-size: 17px; letter-spacing: -.01em; }
      .xvault-title-icon {
        width: 26px; height: 26px; flex: 0 0 26px; border-radius: 7px; object-fit: cover;
        box-shadow: 0 1px 5px rgba(0,0,0,.28); pointer-events: none; user-select: none; -webkit-user-drag: none;
      }
      .xvault-title-sub { font-size: 11px; }
      .xvault-header-actions { flex-wrap: nowrap; align-items: center; }
      .xvault-header-actions .xvault-btn {
        display: inline-flex; align-items: center; justify-content: center; height: 30px; min-height: 30px;
      }
      .xvault-header-actions .xvault-icon-btn { width: 30px; padding: 0; }
      #xvault-panel.is-settings-view .xvault-vault-action { display: none; }
      .xvault-btn:disabled, .xvault-input:disabled, .xvault-select:disabled {
        cursor: not-allowed; opacity: .48; filter: none;
      }

      .xvault-tabs {
        flex: 0 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
        margin: 0 14px 10px; padding: 3px; border-radius: 11px; background: var(--xv-chip-bg);
      }
      .xvault-tab {
        display: flex; align-items: center; justify-content: center; min-height: 32px;
        border: 0; border-radius: 8px; background: transparent; text-align: center;
        color: var(--xv-muted); font-size: 13px; font-weight: 700; cursor: pointer;
        transition: background .15s, color .15s, box-shadow .15s;
      }
      .xvault-tab:hover { color: var(--xv-text); }
      .xvault-tab.active {
        color: #fff; background: var(--xv-accent); box-shadow: 0 2px 8px rgba(29,155,240,.22);
      }
      .xvault-view { flex: 1 1 auto; min-height: 0; }
      .xvault-view[hidden] { display: none !important; }
      .xvault-vault-view { display: flex; flex-direction: column; }
      .xvault-vault-toolbar {
        flex: 0 0 auto; border-top: 1px solid var(--xv-border); border-bottom: 1px solid var(--xv-border);
        background: var(--xv-panel-bg);
      }
      .xvault-tip {
        margin: 9px 14px 7px; padding: 7px 9px; border-radius: 8px;
        background: rgba(29,155,240,.08); color: var(--xv-muted); font-size: 12px; line-height: 1.45;
      }
      .xvault-summary {
        flex-wrap: wrap; overflow-x: visible; padding: 0 14px 8px;
      }
      .xvault-summary::-webkit-scrollbar, .xvault-filter-bar::-webkit-scrollbar { display: none; }
      .xvault-stat { flex: 0 0 auto; border: 1px solid transparent; padding: 4px 8px; font-size: 12px; }
      .xvault-stat b { font-size: 13px; }
      .xvault-section-label { padding: 2px 14px 5px; font-size: 11px; text-transform: uppercase; }
      .xvault-filter-bar {
        flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding: 0 14px 9px;
      }
      .xvault-chip { flex: 0 0 auto; min-height: 28px; padding: 4px 11px; }
      .xvault-search-tools { display: grid; gap: 7px; padding: 0 14px 11px; }
      .xvault-search-tools > .xvault-input { height: 36px; padding-left: 12px; border-radius: 10px; }
      .xvault-toolbar-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
      .xvault-toolbar-row .xvault-select { width: 100%; min-width: 0; height: 32px; border-radius: 9px; font-size: 13px; }
      .xvault-list {
        flex: 1 1 auto; min-height: 120px; overflow-y: auto; padding: 10px 12px 14px; gap: 8px;
        overscroll-behavior: contain;
      }

      .xvault-settings-view { display: flex; flex-direction: column; border-top: 1px solid var(--xv-border); }
      .xvault-settings-scroll {
        flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
        padding: 12px 14px 18px; scrollbar-color: var(--xv-border) transparent;
      }
      .xvault-settings-intro { display: flex; flex-direction: column; gap: 2px; padding: 0 2px 10px; }
      .xvault-settings-intro strong { font-size: 15px; }
      .xvault-settings-intro span { color: var(--xv-muted); font-size: 12px; line-height: 1.45; }
      .xvault-settings-view .xvault-controls {
        gap: 9px; padding: 0; border-top: 0;
      }
      .xvault-settings-card {
        padding: 0; overflow: hidden; border-radius: 12px; background: var(--xv-item-bg);
      }
      .xvault-settings-card > summary {
        min-height: 43px; padding: 0 12px; color: var(--xv-text); font-size: 14px;
      }
      .xvault-settings-card[open] { border-color: rgba(29,155,240,.34); }
      .xvault-settings-card[open] > summary { border-bottom: 1px solid var(--xv-border); }
      .xvault-settings-card > .xvault-adv-body { gap: 10px; padding: 12px; }
      .xvault-settings-card .xvault-field,
      .xvault-settings-card .xvault-adv-label { font-size: 13px; line-height: 1.45; }
      .xvault-settings-card .xvault-content-status { font-size: 12px; line-height: 1.4; }
      .xvault-dependent-options { display: flex; flex-direction: column; gap: 9px; }
      .xvault-dependent-options.is-disabled { opacity: .5; }
      .xvault-field.is-disabled { opacity: .5; }
      .xvault-adultspam-master-row { flex-wrap: nowrap; justify-content: space-between; }
      .xvault-adultspam-master-row > .xvault-field { flex: 1 1 auto; min-width: 0; }
      .xvault-adultspam-master-row > .xvault-select { flex: 0 0 auto; min-width: 72px; }
      .xvault-settings-view .xvault-field.inline {
        position: relative; min-height: 28px; padding-left: 46px; color: var(--xv-text); line-height: 1.35;
      }
      .xvault-settings-view .xvault-field.inline > input[type="checkbox"] {
        appearance: none; -webkit-appearance: none; position: absolute; left: 0; top: 50%;
        width: 38px; height: 22px; margin: 0; border: 1px solid var(--xv-border); border-radius: 999px;
        background: var(--xv-input-bg); transform: translateY(-50%); cursor: pointer; transition: .16s ease;
      }
      .xvault-settings-view .xvault-field.inline > input[type="checkbox"]::after {
        content: ''; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px;
        border-radius: 50%; background: var(--xv-muted); box-shadow: 0 1px 3px rgba(0,0,0,.35); transition: .16s ease;
      }
      .xvault-settings-view .xvault-field.inline > input[type="checkbox"]:checked {
        border-color: var(--xv-accent); background: var(--xv-accent);
      }
      .xvault-settings-view .xvault-field.inline > input[type="checkbox"]:checked::after {
        left: 18px; background: #fff;
      }
      .xvault-settings-view .xvault-field.inline > input[type="checkbox"]:focus-visible {
        outline: 2px solid rgba(29,155,240,.45); outline-offset: 2px;
      }
      .xvault-settings-view .xvault-control-row > .xvault-field.inline {
        align-self: flex-end; justify-content: center; height: 32px;
      }

      .xvault-item { position: relative; flex: 0 0 auto; padding: 11px 12px; border-radius: 13px; overflow: hidden; }
      .xvault-empty, .xvault-loadmore { flex: 0 0 auto; }
      .xvault-item.is-unread::before {
        content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px;
        border-radius: 0 3px 3px 0; background: var(--xv-accent);
      }
      .xvault-avatar { width: 32px; height: 32px; }
      .xvault-author { min-width: 120px; }
      .xvault-author-line { font-size: 14px; }
      .xvault-submeta, .xvault-tag, .xvault-bottom-meta { font-size: 11px; }
      .xvault-text { font-size: 14px; line-height: 1.55; }
      .xvault-note-btn { font-size: 12px; }
      .xvault-item-top { align-items: flex-start; }
      .xvault-actions { max-width: 58%; }
      .xvault-actions .xvault-btn { min-height: 28px; padding: 4px 8px; }
      .xvault-bottom-meta { padding-top: 7px; border-top: 1px solid var(--xv-border); }

      @media (max-width: 640px) {
        #xvault-root.xvault-mobile #xvault-panel {
          inset: 8px; width: auto; height: calc(100dvh - 16px); max-height: none; border-radius: 18px;
        }
        #xvault-root.xvault-mobile.is-open #xvault-badge { opacity: 0; pointer-events: none; }
        .xvault-header { min-height: 54px; padding: 9px 11px; }
        .xvault-title-icon { display: none; }
        .xvault-title-sub { display: none; }
        .xvault-header-actions { gap: 4px; }
        .xvault-header-actions .xvault-btn { padding: 5px 7px; }
        .xvault-tabs { margin: 0 10px 8px; }
        .xvault-tip { margin: 7px 10px 6px; }
        .xvault-summary, .xvault-filter-bar { padding-left: 10px; padding-right: 10px; }
        .xvault-section-label { padding-left: 10px; padding-right: 10px; }
        .xvault-search-tools { padding: 0 10px 9px; }
        .xvault-toolbar-row { grid-template-columns: 1fr 1fr; }
        .xvault-toolbar-row .xvault-select:last-child { grid-column: 1 / -1; }
        .xvault-list { padding: 8px 9px 12px; }
        .xvault-settings-scroll { padding: 10px 10px 16px; }
        .xvault-item-top { flex-direction: column; }
        .xvault-actions { max-width: none; justify-content: flex-start; }
        .xvault-thumb { width: 64px; height: 64px; }
      }
    `);
  }

  // ── 观察器 / 定时器 / 导航 ───────────────────────────────────────────
  function startObserver() {
    if (state.observer) state.observer.disconnect();
    const throttledDisappear = throttle(checkDisappearedPosts, 400);
    const throttledAdultSpamCount = throttle(updateAdultSpamCount, 300);
    const throttledLayoutRefresh = throttle(applyLayoutEnhancements, 250);
    const pendingRoots = new Set();
    const collectArticlesFromRoot = (root, articles) => {
      if (!root || !root.isConnected || root.closest('#xvault-root')) return;
      if (root.matches('article')) { articles.add(root); return; }
      const parentArticle = root.closest('article');
      if (parentArticle) { articles.add(parentArticle); return; }
      root.querySelectorAll('article').forEach((article) => articles.add(article));
    };
    const flushAddedRoots = debounce(() => {
      const articles = new Set();
      for (const root of pendingRoots) {
        collectArticlesFromRoot(root, articles);
      }
      pendingRoots.clear();
      for (const article of articles) {
        captureArticle(article);
        if (state.settings.mediaDownload) injectDownloadButtons(article);
        if (state.settings.bypassAgeRestriction) revealAgeRestricted(article);
      }
      if (state.settings.hideAdultSpam) throttledAdultSpamCount();
      if (state.settings.layoutEnabled) throttledLayoutRefresh();
    }, 100);
    state.observer = new MutationObserver((mutations) => {
      let hadRemoval = false;
      const immediateAdultArticles = new Set();
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.id === 'xvault-root' || node.closest && node.closest('#xvault-root')) continue;
          harvestFollowingControlsFromRoot(node);
          pendingRoots.add(node);
          if (state.settings.hideAdultSpam) collectArticlesFromRoot(node, immediateAdultArticles);
        }
        if (state.settings.hideAdultSpam && mutation.addedNodes.length && mutation.target instanceof HTMLElement) {
          // 正文可能以 Text 节点分步补入；同时检查 mutation.target，确保内容补全后仍能在本帧重判。
          collectArticlesFromRoot(mutation.target, immediateAdultArticles);
        }
        if (mutation.removedNodes && mutation.removedNodes.length) hadRemoval = true;
      }
      if (immediateAdultArticles.size) {
        // MutationObserver 在浏览器绘制前执行；立即过滤可避免新黄推先闪现 100ms 再消失。
        const anchors = captureAdultSpamScrollAnchors();
        let hiddenAny = false;
        for (const article of immediateAdultArticles) {
          if (evaluateAndApplyAdultSpam(article)) hiddenAny = true;
        }
        if (hiddenAny) stabilizeAdultSpamScroll(anchors);
      }
      if (hadRemoval) {
        throttledDisappear();
        if (state.settings.hideAdultSpam) throttledAdultSpamCount();
      }
      if (pendingRoots.size) flushAddedRoots();
      if (state.rootEl && state.rootEl.classList.contains('xvault-mobile')) scheduleMobileBadgeSync();
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
    if (savedSettings && typeof savedSettings === 'object') {
      const migratedSettings = migrateSettingsDefaults(savedSettings);
      state.settings = sanitizeSettings(migratedSettings);
      if (Number(savedSettings.settingsRevision || 0) < DEFAULT_SETTINGS.settingsRevision) {
        await dbPutSetting('settings', state.settings);
      }
    }
    if (IS_FIREFOX) {
      if (firefoxCompatibilityMode === 'compat' || firefoxCompatibilityMode === 'normal') {
        const compatibilityEnabled = firefoxCompatibilityMode === 'compat';
        const needsSync = state.settings.firefoxCompatibility !== compatibilityEnabled
          || !state.settings.firefoxCompatibilityPrompted;
        state.settings.firefoxCompatibility = compatibilityEnabled;
        state.settings.firefoxCompatibilityPrompted = true;
        if (needsSync) await dbPutSetting('settings', sanitizeSettings(state.settings));
      } else if (state.settings.firefoxCompatibilityPrompted) {
        // 从仅有 IndexedDB 设置的旧安装补写 document-start 可读取的启动标记。
        writeFirefoxCompatibilityMode(state.settings.firefoxCompatibility ? 'compat' : 'normal');
      }
    }
    const persistedFollowedHandles = state.settings.knownFollowedHandles || [];
    persistedFollowedHandles.forEach((handle) => followedHandles.add(handle));
    state.settingsLoaded = true;
    if (followedHandles.size !== persistedFollowedHandles.length) scheduleFollowedHandlesPersist();
    const rawPosts = (await dbGetAllPosts()).filter(Boolean);
    const all = rawPosts.map(sanitizeImportedPost).filter(Boolean)
      .sort((a, b) => (b.lastCapturedAt || 0) - (a.lastCapturedAt || 0));
    if (all.length !== rawPosts.length) debugLog('已忽略', rawPosts.length - all.length, '条无效本地记录');
    state.posts = all;
    await enforceMaxPosts();
  }

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

  function installNavigationListener() {
    let lastUrl = location.href;
    const onNav = (restorePosition) => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
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
  async function boot() {
    installStyles();
    createUI();
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
    harvestFollowingControlsFromRoot(document);
    scanArticles(document);
    applyAdHiding();
    applyAdultSpamFiltering();
    applyMediaDownload();
    applyAgeBypass();
    applyLayoutEnhancements();
    startObserver();
    installCleanupTimer();
    installNetworkHookTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    installNavigationListener();
    await runAutoClean();
    setTimeout(maybePromptFirefoxCompatibility, 250);

    const throttledReposition = throttle(repositionBadge, 500);
    const throttledLayoutResize = throttle(applyLayoutEnhancements, 250);
    const handleMobileBadgeViewportChange = () => scheduleMobileBadgeSync();
    window.addEventListener('resize', throttledReposition);
    window.addEventListener('resize', throttledLayoutResize);
    window.addEventListener('scroll', handleMobileBadgeViewportChange, { passive: true });
    document.addEventListener('scroll', handleMobileBadgeViewportChange, { passive: true, capture: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleMobileBadgeViewportChange, { passive: true });
      window.visualViewport.addEventListener('scroll', handleMobileBadgeViewportChange, { passive: true });
    }
    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('keydown', handleKeydown, true);
    if (window.matchMedia) {
      try {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
          if ((state.settings.theme || 'auto') === 'auto') applyTheme();
        });
      } catch (err) {}
    }
    debugLog('v2.2.0 started');
  }

  function waitForPageReady() {
    if (document.body) { boot(); return; }
    const timer = setInterval(() => {
      if (document.body) { clearInterval(timer); boot(); }
    }, 100);
  }

  installNetworkHooks();
  waitForPageReady();
})();
