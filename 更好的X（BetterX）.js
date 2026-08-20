// ==UserScript==
// @name         更好的 X（BetterX）
// @namespace    https://github.com/Iskongkongyo
// @version      2.5.0
// @description  自动隐藏黄推/引流机器人与广告、界面简化与宽屏、一键下载图片/视频/GIF(多媒体自动打包 zip)、取消年龄限制(自动去除敏感/成人内容遮罩)、记录 X 时间线中出现过的帖子，支持搜索、排序、正文折叠、备注、置顶、收藏、闪现提醒、来源识别、关键词高亮(含 AND/正则/排除词)、媒体缩略图、导入导出备份、自动清理、可拖动徽标、明暗主题、快捷键(Alt+X)、IndexedDB 持久化
// @author        流萤可爱捏
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
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
// @downloadURL https://update.greasyfork.org/scripts/588748/%E6%9B%B4%E5%A5%BD%E7%9A%84%20X%EF%BC%88BetterX%EF%BC%89.user.js
// @updateURL https://update.greasyfork.org/scripts/588748/%E6%9B%B4%E5%A5%BD%E7%9A%84%20X%EF%BC%88BetterX%EF%BC%89.meta.js
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
  const MAX_NETWORK_HARVEST_QUEUE_CHARS = 16000000;
  const MAX_NETWORK_HARVEST_JOBS = 6;
  const MAX_NETWORK_HARVEST_NODES_PER_JOB = 250000;
  const NETWORK_HARVEST_SLICE_NODES = 1200;
  const MAX_NETWORK_REHOOKS_PER_API = 4;
  const MAX_MEDIA_REGISTRY_ENTRIES = 2000;
  const MAX_SESSION_STAT_IDS = 20000;
  const MAX_FOLLOWED_HANDLES = 5000;
  const DOWNLOAD_MIN_CONCURRENCY = 1;
  const DOWNLOAD_MAX_CONCURRENCY = 6;
  const DOWNLOAD_MAX_RETRIES = 1;
  const DOWNLOAD_ZIP_MEMORY_LIMIT_DESKTOP = 384 * 1024 * 1024;
  const DOWNLOAD_ZIP_MEMORY_LIMIT_MOBILE = 128 * 1024 * 1024;
  const CLASSIC_ZIP_MAX_VALUE = 0xFFFFFFFF;
  const CLASSIC_ZIP_MAX_FILES = 0xFFFF;
  const MAX_IMPORT_FILE_BYTES = 25 * 1024 * 1024;
  const MAX_IMPORT_POSTS = 20000;
  const MAX_REGEX_SOURCE_LENGTH = 180;
  const MAX_REGEX_HAYSTACK_LENGTH = 20000;
  const IS_FIREFOX = /(?:^|\s)Firefox\//i.test(navigator.userAgent || '');
  const FIREFOX_COMPAT_MODE_KEY = 'betterx_firefox_compatibility_mode';
  const SETTINGS_MIRROR_KEY = 'betterx_settings_mirror_v1';
  const DEBUG = false;

  function readFirefoxCompatibilityMode() {
    if (!IS_FIREFOX) return 'normal';
    let value = '';
    try {
      if (typeof GM_getValue === 'function') value = GM_getValue(FIREFOX_COMPAT_MODE_KEY, '');
    } catch (err) {}
    return value === 'compat' || value === 'normal' ? value : 'unset';
  }

  let firefoxCompatibilityMode = readFirefoxCompatibilityMode();

  function readSettingsMirror() {
    try {
      if (typeof GM_getValue !== 'function') return null;
      const raw = GM_getValue(SETTINGS_MIRROR_KEY, null);
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
      const settings = raw.settings && typeof raw.settings === 'object' && !Array.isArray(raw.settings)
        ? raw.settings
        : raw;
      return settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : null;
    } catch (err) {
      debugLog('read settings mirror failed:', err);
      return null;
    }
  }

  function writeSettingsMirror(settings) {
    try {
      if (typeof GM_setValue !== 'function') return;
      GM_setValue(SETTINGS_MIRROR_KEY, {
        version: 1,
        savedAt: Date.now(),
        settings,
      });
    } catch (err) {
      debugLog('write settings mirror failed:', err);
    }
  }

  function writeFirefoxCompatibilityMode(mode) {
    const normalized = mode === 'compat' ? 'compat' : 'normal';
    firefoxCompatibilityMode = normalized;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(FIREFOX_COMPAT_MODE_KEY, normalized);
    } catch (err) {}
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
    settingsRevision: 14,
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
    adultSpamCustomRulesEnabled: true, // 自定义屏蔽词与账号白名单独立于智能黄推识别
    adultSpamLevel: 'balanced', // 'conservative' | 'balanced'
    adultSpamSkipFollowing: true, // 默认不审查已经关注的账号
    adultSpamSkipFollowingReposts: false, // 可选：不审查已关注账号转发的第三方内容
    knownFollowedHandles: [], // 从 X 接口、主页按钮和“正在关注”时间线学习的本地关注关系
    adultSpamKeywords: [],  // 用户自定义字面关键词（命中即隐藏）
    adultSpamWhitelist: [], // 用户名白名单（不带 @）
    layoutEnabled: false,   // 界面简化与宽屏总开关
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
    restoreMediaGrid: false, // 将 X 的多媒体正文轮播恢复为网格视图
    firefoxCompatibility: false, // Firefox 兼容模式：停用页面 fetch/XHR Hook
    firefoxCompatibilityPrompted: false, // 是否已完成 Firefox 首次兼容性询问
    useMobileBadgeOnDesktop: false, // PC 端可选使用移动端圆形图标徽标
    hideAppBadgeOnDesktop: false, // PC 端隐藏 BetterX 应用徽标；仍可用 Alt+X / 油猴菜单打开
    downloadTimeout: 360000, // 下载超时（毫秒），默认 360 秒
    downloadConcurrency: 2, // 同时传输的媒体数量，允许 1～6
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
    downloadPillEl: null,
    downloadPopoverEl: null,
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
    dlConcurrencyInputEl: null,
    markReadEl: null,
    themeSelectEl: null,
    skipSourcesEl: null,
    importInputEl: null,
    hideAdultSpamEl: null,
    adultSpamCustomRulesEl: null,
    adultSpamLevelEl: null,
    adultSpamSkipFollowingEl: null,
    adultSpamSkipFollowingRepostsEl: null,
    adultSpamKeywordsEl: null,
    adultSpamKeywordTagsEl: null,
    adultSpamWhitelistEl: null,
    adultSpamWhitelistTagsEl: null,
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
    restoreMediaGridEl: null,
    useMobileBadgeOnDesktopEl: null,
    hideAppBadgeOnDesktopEl: null,
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
  let adultSpamScannedIdsCapped = false;
  let adultSpamSessionHiddenIdsCapped = false;
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
    state.settings.knownFollowedHandles = [...followedHandles].sort().slice(0, MAX_FOLLOWED_HANDLES);
    queueDbWrite(async () => { await persistSettings(); });
  }, 750);

  function trimFollowedHandlesToMax() {
    while (followedHandles.size > MAX_FOLLOWED_HANDLES) {
      followedHandles.delete(followedHandles.values().next().value);
    }
  }

  function rememberFollowingRelation(handle, following) {
    const normalized = String(handle || '').replace(/^@+/, '').toLowerCase();
    if (!/^[a-z0-9_]{1,15}$/.test(normalized) || typeof following !== 'boolean') return false;
    const hadHandle = followedHandles.has(normalized);
    if (following) {
      if (!hadHandle && followedHandles.size >= MAX_FOLLOWED_HANDLES) {
        followedHandles.delete(followedHandles.values().next().value);
      }
      followedHandles.add(normalized);
    }
    else followedHandles.delete(normalized);
    if (hadHandle === following) return false;
    scheduleFollowingFilterRefresh();
    scheduleFollowedHandlesPersist();
    return true;
  }

  function addBoundedSessionStat(target, value, capFlag) {
    if (!value || target.has(value)) return capFlag;
    if (target.size >= MAX_SESSION_STAT_IDS) return true;
    target.add(value);
    return capFlag;
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
    if (!state.panelOpen) { refreshBadge(); return; }
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

  function isVideoPreviewImage(img, article) {
    if (!img) return false;
    const src = img.getAttribute('src') || '';
    if (/(?:ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)/i.test(src)) return true;
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
      const reg = getRegistryEntry(mediaRegistry, idKey);
      if (reg && (reg.photos.length > 0 || reg.videos.length > 0 || reg.gifs.length > 0)) {
        const hasImage = reg.photos.length > 0;
        const hasVideo = reg.videos.length > 0 || reg.gifs.length > 0;
        reg.photos.forEach((u) => { if (thumbs.length < 4) thumbs.push(u); });
        if (!hasImage && hasVideo) {
          for (const video of article.querySelectorAll('video')) {
            const poster = video.getAttribute('poster') || '';
            if (poster && thumbs.length < 4) thumbs.push(poster);
          }
          for (const img of article.querySelectorAll('img[src]')) {
            const src = img.getAttribute('src') || '';
            if (/pbs\.twimg\.com\/(?:media|ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)\//.test(src)) {
              if (thumbs.length < 4) thumbs.push(src);
            }
          }
        }
        return { hasImage, hasVideo, thumbs: uniqueStrings(thumbs).slice(0, 4) };
      }

      const cardReg = getRegistryEntry(cardRegistry, idKey);
      if (cardReg && (cardReg.photos.length > 0 || cardReg.videos.length > 0 || cardReg.gifs.length > 0)) {
        const hasImage = cardReg.photos.length > 0;
        const hasVideo = cardReg.videos.length > 0 || cardReg.gifs.length > 0;
        cardReg.photos.forEach((u) => { if (thumbs.length < 4) thumbs.push(u); });
        if (!hasImage && hasVideo) {
          for (const img of article.querySelectorAll('img[src]')) {
            const src = img.getAttribute('src') || '';
            if (/pbs\.twimg\.com\/(?:media|ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)\//.test(src)) {
              if (thumbs.length < 4) thumbs.push(src);
            }
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
      const isMediaAsset = /pbs\.twimg\.com\/(?:media|ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)\//.test(src) || /\/media\//.test(src);
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
      out += `<mark class="BetterX-hl">${escapeHtml(m[0])}</mark>`;
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
      return `<button class="BetterX-chip ${active}" data-action="set-filter" data-filter="${escapeHtml(f.key)}">${escapeHtml(f.label)}</button>`;
    }).join('');
  }

  function getAvailableSources() {
    return uniqueStrings(state.posts.map((p) => p.sourceLabel).filter(Boolean))
      .sort((a, b) => {
        const rank = (source) => {
          const pinnedOrder = ['Search', 'Bookmarks', 'Home', 'For You'];
          const index = pinnedOrder.indexOf(source);
          if (index >= 0) return index;
          // 个人主页来源统一置后，避免大量账号名称挤占常用来源的位置。
          if (/^Profile\s+@/i.test(source)) return 100;
          return 10;
        };
        const rankDiff = rank(a) - rank(b);
        return rankDiff || localizeSourceLabel(a).localeCompare(localizeSourceLabel(b), 'zh-CN');
      });
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
      return `<button class="BetterX-chip ${active}" data-action="toggle-skip" data-skip="${escapeHtml(o.key)}">${escapeHtml(o.label)}</button>`;
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
    return matchedKeywords.map((kw) => `<span class="BetterX-tag keyword">${escapeHtml(kw)}</span>`).join('');
  }

  function renderMetaTags(post) {
    const tags = [];
    if (post.pinned) tags.push(`<span class="BetterX-tag pin">📌 置顶</span>`);
    if (post.favorite) tags.push(`<span class="BetterX-tag fav">★ 已收藏</span>`);
    if (post.flashLost && !post.clicked) tags.push(`<span class="BetterX-tag flash">⚡ 快速消失</span>`);
    if (post.clicked) tags.push(`<span class="BetterX-tag opened">👁 已打开</span>`);
    if (post.hasImage) tags.push(`<span class="BetterX-tag">🖼 图片</span>`);
    if (post.hasVideo) tags.push(`<span class="BetterX-tag">🎬 视频</span>`);
    if (post.sourceLabel) tags.push(`<span class="BetterX-tag source">来源: ${escapeHtml(localizeSourceLabel(post.sourceLabel))}</span>`);
    return tags.join('');
  }

  function renderThumbs(post) {
    const thumbs = uniqueStrings((post.mediaThumbs || []).map(safeImportedAssetUrl).filter(Boolean)).slice(0, 4);
    if (!thumbs.length) return '';
    return `<div class="BetterX-thumbs">${thumbs.map((src) =>
      `<img class="BetterX-thumb" src="${escapeHtml(src)}" loading="lazy" referrerpolicy="no-referrer" alt="" />`
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
      ? `<a class="BetterX-author-profile" href="${escapeHtml(profileUrl)}" title="打开 @${escapeHtml(handle)} 的个人主页">${authorLabelHtml}</a>`
      : authorLabelHtml;
    const timeHtml = timeLabel ? `<span class="BetterX-author-time"> · ${escapeHtml(timeLabel)}</span>` : '';
    const textHtml = highlightText(post.text || '(无正文)', matchedKeywords);
    const isExpanded = state.expandedPosts.has(post.id);
    const isEditingNote = state.editingNoteId === post.id;
    const textIsLong = (post.text || '').length > 120;
    const historyText = (post.sourceHistory || []).length > 1
      ? ` · 历史来源: ${(post.sourceHistory || []).map(localizeSourceLabel).join(' / ')}`
      : '';
    const avatarUrl = safeImportedAssetUrl(post.avatarUrl);
    const avatarHtml = avatarUrl
      ? `<img class="BetterX-avatar" src="${escapeHtml(avatarUrl)}" referrerpolicy="no-referrer" alt="" />`
      : '';
    const noteHtml = isEditingNote
      ? `<div class="BetterX-note-edit">
           <textarea class="BetterX-note-input" data-id="${escapeHtml(post.id)}" placeholder="在这里写备注…">${escapeHtml(post.note || '')}</textarea>
           <div class="BetterX-note-actions">
             <button class="BetterX-btn primary" data-action="save-note" data-id="${escapeHtml(post.id)}">保存备注</button>
             <button class="BetterX-btn" data-action="cancel-note">取消</button>
           </div>
         </div>`
      : `<button class="BetterX-btn BetterX-note-btn" data-action="edit-note" data-id="${escapeHtml(post.id)}">${post.note ? '✏️ 备注' : '+ 备注'}</button>
         ${post.note ? `<div class="BetterX-note-text">💬 ${escapeHtml(post.note)}</div>` : ''}`;

    return `
      <div class="BetterX-item ${post.flashLost ? 'is-flash-lost' : ''} ${post.pinned ? 'is-pinned' : ''} ${!post.clicked ? 'is-unread' : ''}" data-id="${escapeHtml(post.id)}">
        <div class="BetterX-item-top">
          <div class="BetterX-author">
            <div class="BetterX-author-head">
              ${avatarHtml}
              <div class="BetterX-author-line">${authorHtml}${timeHtml}</div>
            </div>
            <div class="BetterX-submeta">
              <span>抓取: ${escapeHtml(formatTime(post.lastCapturedAt))}</span>
              <span>出现: ${escapeHtml(String(post.capturedCount || 1))} 次</span>
            </div>
          </div>
          <div class="BetterX-actions">
            <button class="BetterX-btn primary" data-action="open" data-id="${escapeHtml(post.id)}">打开</button>
            <button class="BetterX-btn" data-action="copy" data-id="${escapeHtml(post.id)}">复制链接</button>
            <button class="BetterX-btn" data-action="pin" data-id="${escapeHtml(post.id)}">${post.pinned ? '取消置顶' : '置顶'}</button>
            <button class="BetterX-btn" data-action="fav" data-id="${escapeHtml(post.id)}">${post.favorite ? '取消收藏' : '收藏'}</button>
            <button class="BetterX-btn danger" data-action="delete" data-id="${escapeHtml(post.id)}">删</button>
          </div>
        </div>

        <div class="BetterX-text ${textIsLong && !isExpanded ? 'collapsed' : ''}">${textHtml}</div>
        ${textIsLong ? `<button class="BetterX-expand-btn" data-action="toggle-expand" data-id="${escapeHtml(post.id)}">${isExpanded ? '▲ 收起' : '▼ 展开全文'}</button>` : ''}

        ${renderThumbs(post)}

        <div class="BetterX-tags">
          ${renderMetaTags(post)}
          ${renderKeywordTags(matchedKeywords)}
        </div>

        <div class="BetterX-note-area">${noteHtml}</div>

        <div class="BetterX-bottom-meta">
          <span>当前来源: ${escapeHtml(localizeSourceLabel(post.sourceLabel) || '-')}</span>
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
    if (state.dlConcurrencyInputEl && document.activeElement !== state.dlConcurrencyInputEl) {
      state.dlConcurrencyInputEl.value = String(state.settings.downloadConcurrency || DEFAULT_SETTINGS.downloadConcurrency);
    }
    if (state.markReadEl) state.markReadEl.checked = state.settings.markReadOnClick !== false;
    if (state.themeSelectEl) state.themeSelectEl.value = state.settings.theme || 'auto';
    if (state.hideAdsEl) state.hideAdsEl.checked = !!state.settings.hideAds;
    if (state.restoreMediaGridEl) state.restoreMediaGridEl.checked = !!state.settings.restoreMediaGrid;
    if (state.hideAdultSpamEl) state.hideAdultSpamEl.checked = !!state.settings.hideAdultSpam;
    if (state.adultSpamCustomRulesEl) {
      state.adultSpamCustomRulesEl.checked = state.settings.adultSpamCustomRulesEnabled !== false;
    }
    if (state.adultSpamLevelEl) state.adultSpamLevelEl.value = state.settings.adultSpamLevel || DEFAULT_SETTINGS.adultSpamLevel;
    if (state.adultSpamSkipFollowingEl) state.adultSpamSkipFollowingEl.checked = state.settings.adultSpamSkipFollowing !== false;
    if (state.adultSpamSkipFollowingRepostsEl) {
      state.adultSpamSkipFollowingRepostsEl.checked = !!state.settings.adultSpamSkipFollowingReposts;
    }
    renderAdultSpamKeywordTags();
    renderAdultSpamWhitelistTags();
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
    if (state.hideAppBadgeOnDesktopEl) {
      state.hideAppBadgeOnDesktopEl.checked = !!state.settings.hideAppBadgeOnDesktop;
    }
    updateSettingsDependencyUI();

    if (!state.listEl) return;
    const scrollTop = keepListScroll ? state.listEl.scrollTop : 0;

    const filtered = filterPosts(state.posts);
    state.lastFilteredCount = filtered.length;

    if (!filtered.length) {
      state.listEl.innerHTML = `<div class="BetterX-empty">当前筛选条件下没有帖子。可以刷新页面、切换 X 标签页，或把筛选改回“全部”。</div>`;
      return;
    }

    const limit = state.renderLimit || state.settings.pageSize || 60;
    const shown = filtered.slice(0, limit);
    let html = shown.map(renderPostItem).join('');
    if (filtered.length > shown.length) {
      html += `<button class="BetterX-loadmore" data-action="load-more">加载更多（还有 ${filtered.length - shown.length} 条）</button>`;
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
      downloadConcurrency: clampInt(input.downloadConcurrency, DOWNLOAD_MIN_CONCURRENCY, DOWNLOAD_MAX_CONCURRENCY, DEFAULT_SETTINGS.downloadConcurrency),
      markReadOnClick: typeof input.markReadOnClick === 'boolean' ? input.markReadOnClick : DEFAULT_SETTINGS.markReadOnClick,
      skipSources: stringList(input.skipSources, SKIP_SOURCE_OPTIONS.length, 30)
        .filter((key) => SKIP_SOURCE_OPTIONS.some((item) => item.key === key)),
      theme: enumValue(input.theme, ['auto', 'dark', 'light'], DEFAULT_SETTINGS.theme),
      pageSize: clampInt(input.pageSize, 20, 200, DEFAULT_SETTINGS.pageSize),
      badgePos,
      hideAds: typeof input.hideAds === 'boolean' ? input.hideAds : DEFAULT_SETTINGS.hideAds,
      hideAdultSpam: input.hideAdultSpam === true,
      adultSpamCustomRulesEnabled: typeof input.adultSpamCustomRulesEnabled === 'boolean'
        ? input.adultSpamCustomRulesEnabled
        : DEFAULT_SETTINGS.adultSpamCustomRulesEnabled,
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
      timelineWidth: clampInt(input.timelineWidth, 100, 3000, DEFAULT_SETTINGS.timelineWidth),
      leftbarWidth: clampInt(input.leftbarWidth, 50, 500, DEFAULT_SETTINGS.leftbarWidth),
      layoutHideLeftbar: input.layoutHideLeftbar === true,
      layoutHideSidebar: input.layoutHideSidebar === true,
      layoutFillCenter: input.layoutFillCenter === true,
      layoutCleanNavigation: input.layoutCleanNavigation !== false,
      layoutHideMessageGrok: input.layoutHideMessageGrok !== false,
      layoutHideShowMore: input.layoutHideShowMore === true,
      mediaDownload: typeof input.mediaDownload === 'boolean' ? input.mediaDownload : DEFAULT_SETTINGS.mediaDownload,
      bypassAgeRestriction: input.bypassAgeRestriction === true,
      restoreMediaGrid: input.restoreMediaGrid === true,
      firefoxCompatibility: input.firefoxCompatibility === true,
      firefoxCompatibilityPrompted: input.firefoxCompatibilityPrompted === true,
      useMobileBadgeOnDesktop: input.useMobileBadgeOnDesktop === true,
      hideAppBadgeOnDesktop: input.hideAppBadgeOnDesktop === true,
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

  function setSettingsPartial(nextPartial) {
    const touchesKeywords = ('keywords' in nextPartial) || ('excludeKeywords' in nextPartial) || ('keywordMode' in nextPartial);
    const touchesAdultSpam = ('hideAdultSpam' in nextPartial) || ('adultSpamCustomRulesEnabled' in nextPartial)
      || ('adultSpamLevel' in nextPartial)
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
    if ('restoreMediaGrid' in nextPartial) applyMediaGridLayout();
    if ('firefoxCompatibility' in nextPartial && IS_FIREFOX) {
      state.settings.firefoxCompatibilityPrompted = true;
      writeFirefoxCompatibilityMode(nextPartial.firefoxCompatibility ? 'compat' : 'normal');
    }
    if ('useMobileBadgeOnDesktop' in nextPartial || 'hideAppBadgeOnDesktop' in nextPartial) repositionBadge();
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
    prunePostRuntimeCaches([id]);
    queueDbWrite(async () => { await dbDeletePost(id); });
    refreshUI({ keepScroll: true });
  }

  function clearNonFavoritePosts() {
    const targets = state.posts.filter((p) => !protectedPost(p));
    if (!targets.length) return;
    if (!window.confirm(`确定要清空 ${targets.length} 条未收藏/未置顶的帖子吗？此操作不可撤销。`)) return;
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
  function getPageWindow() {
    // Firefox 首次选择前或兼容模式开启时，不读取 unsafeWindow 的页面对象。
    if (IS_FIREFOX && firefoxCompatibilityMode !== 'normal') return window;
    return (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
  }
  let networkHookWarningShown = false;
  let networkRehookWarningShown = false;
  const networkHookInstallCounts = { fetch: 0, xhrOpen: 0, xhrSend: 0 };
  const mediaRegistry = new Map(); // statusId -> { photos:[], gifs:[], videos:[] }
  // 卡片媒体注册表（第三方引用卡片 / 内嵌播放器）
  const cardRegistry = new Map(); // statusId -> { photos:[], gifs:[], videos:[] }

  function setBoundedRegistryEntry(registry, key, value) {
    if (registry.has(key)) registry.delete(key);
    registry.set(key, value);
    while (registry.size > MAX_MEDIA_REGISTRY_ENTRIES) {
      registry.delete(registry.keys().next().value);
    }
  }

  function getRegistryEntry(registry, key) {
    if (!registry.has(key)) return null;
    const value = registry.get(key);
    // Map 的插入顺序用作轻量 LRU；实际下载过或再次采集到的帖子延后淘汰。
    registry.delete(key);
    registry.set(key, value);
    return value;
  }

  function registerMedia(id, mediaArr) {
    if (!id || !Array.isArray(mediaArr) || !mediaArr.length) return;
    const key = String(id);
    const entry = getRegistryEntry(mediaRegistry, key) || { photos: [], gifs: [], videos: [] };
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
    setBoundedRegistryEntry(mediaRegistry, key, entry);
    syncMediaFlagsToPost(key);
  }

  function pushCardEntry(id, acc) {
    if (!id) return;
    if (!acc || (!acc.photos.length && !acc.gifs.length && !acc.videos.length)) return;
    const key = String(id);
    const entry = getRegistryEntry(cardRegistry, key) || { photos: [], gifs: [], videos: [] };
    acc.photos.forEach((u) => { if (u) entry.photos.push(u); });
    acc.gifs.forEach((u) => { if (u) entry.gifs.push(u); });
    acc.videos.forEach((u) => { if (u) entry.videos.push(u); });
    entry.photos = uniqueStrings(entry.photos);
    entry.gifs = uniqueStrings(entry.gifs);
    entry.videos = uniqueStrings(entry.videos);
    setBoundedRegistryEntry(cardRegistry, key, entry);
    syncMediaFlagsToPost(key);
  }

  function syncMediaFlagsToPost(idStr) {
    if (!idStr) return;
    const post = getPostById(idStr);
    if (!post) return;
    const reg = getRegistryEntry(mediaRegistry, idStr) || getRegistryEntry(cardRegistry, idStr);
    if (!reg) return;
    const hasPhoto = (reg.photos || []).length > 0;
    const hasVid = (reg.videos || []).length > 0 || (reg.gifs || []).length > 0;
    if (hasPhoto || hasVid) {
      if (post.hasImage !== hasPhoto || post.hasVideo !== hasVid) {
        upsertPost({
          ...post,
          hasImage: hasPhoto,
          hasVideo: hasVid,
        }, { countCapture: false });
      }
    }
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

  const networkHarvestQueue = [];
  let networkHarvestQueuedChars = 0;
  let networkHarvestScheduled = false;
  let networkHarvestDroppedJobs = 0;

  function textMayContainHarvestData(txt) {
    return txt.indexOf('extended_entities') !== -1 || txt.indexOf('binding_values') !== -1
      || txt.indexOf('"following"') !== -1 || txt.indexOf('relationship_perspectives') !== -1;
  }

  function scheduleNetworkHarvestDrain() {
    if (networkHarvestScheduled || !networkHarvestQueue.length) return;
    networkHarvestScheduled = true;
    const run = (deadline) => {
      networkHarvestScheduled = false;
      drainNetworkHarvestQueue(deadline);
      if (networkHarvestQueue.length) scheduleNetworkHarvestDrain();
    };
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(run, { timeout: 750 });
    } else {
      setTimeout(() => run({ didTimeout: false, timeRemaining: () => 8 }), 16);
    }
  }

  function enqueueNetworkHarvestObject(root) {
    if (!root || typeof root !== 'object') return;
    if (networkHarvestQueue.length >= MAX_NETWORK_HARVEST_JOBS) {
      networkHarvestDroppedJobs++;
      return;
    }
    networkHarvestQueue.push({ type: 'object', stack: [{ value: root, depth: 0 }], processedNodes: 0 });
    scheduleNetworkHarvestDrain();
  }

  function tryHarvest(txt) {
    if (!txt || txt.length > MAX_NETWORK_RESPONSE_BYTES || !textMayContainHarvestData(txt)) return;
    if (networkHarvestQueue.length >= MAX_NETWORK_HARVEST_JOBS
        || networkHarvestQueuedChars + txt.length > MAX_NETWORK_HARVEST_QUEUE_CHARS) {
      networkHarvestDroppedJobs++;
      return;
    }
    networkHarvestQueuedChars += txt.length;
    networkHarvestQueue.push({ type: 'text', text: txt, charLength: txt.length });
    scheduleNetworkHarvestDrain();
  }

  function processHarvestObjectNode(value, depth, stack) {
    if (!value || typeof value !== 'object' || depth > 40) return;
    if (!Array.isArray(value)) {
      harvestFollowingRelationship(value);
      const idStr = value.id_str;
      const ext = value.extended_entities;
      if (idStr && ext && Array.isArray(ext.media)) registerMedia(idStr, ext.media);
      // 卡片媒体：card 与 legacy 同级，id 取 rest_id / id_str / legacy.id_str
      if (value.card && typeof value.card === 'object') {
        const cid = value.rest_id || idStr || (value.legacy && value.legacy.id_str);
        if (cid) { try { harvestCard(String(cid), value.card); } catch (err) {} }
      }
    }
    const children = Array.isArray(value) ? value : Object.values(value);
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (child && typeof child === 'object') stack.push({ value: child, depth: depth + 1 });
      if (stack.length >= MAX_NETWORK_HARVEST_NODES_PER_JOB) break;
    }
  }

  function drainNetworkHarvestQueue(deadline) {
    let nodeBudget = NETWORK_HARVEST_SLICE_NODES;
    while (networkHarvestQueue.length && nodeBudget > 0) {
      if (typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() <= 2 && nodeBudget < NETWORK_HARVEST_SLICE_NODES) break;
      let job = networkHarvestQueue[0];
      if (job.type === 'text') {
        networkHarvestQueuedChars = Math.max(0, networkHarvestQueuedChars - (job.charLength || 0));
        let parsed;
        try { parsed = JSON.parse(job.text); } catch (err) { networkHarvestQueue.shift(); continue; }
        job = { type: 'object', stack: [{ value: parsed, depth: 0 }], processedNodes: 0 };
        networkHarvestQueue[0] = job;
        nodeBudget = Math.max(1, nodeBudget - 50);
      }
      while (job.stack.length && nodeBudget > 0 && job.processedNodes < MAX_NETWORK_HARVEST_NODES_PER_JOB) {
        const node = job.stack.pop();
        job.processedNodes++;
        nodeBudget--;
        try { processHarvestObjectNode(node.value, node.depth, job.stack); } catch (err) {}
        if (typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() <= 2) break;
      }
      if (!job.stack.length || job.processedNodes >= MAX_NETWORK_HARVEST_NODES_PER_JOB) {
        if (job.processedNodes >= MAX_NETWORK_HARVEST_NODES_PER_JOB) networkHarvestDroppedJobs++;
        networkHarvestQueue.shift();
      } else {
        break;
      }
    }
  }

  function declaredResponseTooLarge(getHeader) {
    try {
      const raw = getHeader('content-length');
      const size = Number(raw);
      return Number.isFinite(size) && size > MAX_NETWORK_RESPONSE_BYTES;
    } catch (err) { return false; }
  }

  function harvestXhrResponse(xhr) {
    const url = xhr && xhr.__xvUrl ? String(xhr.__xvUrl) : '';
    if (!/(graphql|\/2\/timeline|\/i\/api\/)/i.test(url)) return;
    try {
      if (typeof xhr.getResponseHeader === 'function'
          && declaredResponseTooLarge((name) => xhr.getResponseHeader(name))) return;
      if (xhr.responseType === '' || xhr.responseType === 'text') {
        tryHarvest(xhr.responseText);
      } else if (xhr.responseType === 'json' && xhr.response && typeof xhr.response === 'object') {
        enqueueNetworkHarvestObject(xhr.response);
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

  function warnNetworkRehookLimit(apiName) {
    if (networkRehookWarningShown) return;
    networkRehookWarningShown = true;
    console.warn(`[BetterX] ${apiName} 被其他脚本反复替换，已停止继续套娃 Hook；可导出 Firefox 兼容诊断。`);
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
        if (networkHookInstallCounts.fetch >= MAX_NETWORK_REHOOKS_PER_API) {
          warnNetworkRehookLimit('fetch');
        } else {
          const hooked = function (...args) {
            const p = origFetch.apply(this, args);
            try {
              p.then((res) => {
                try {
                  const url = (res && res.url) || '';
                  if (res && res.clone && /(graphql|\/2\/timeline|\/i\/api\/)/i.test(url)) {
                    if (res.headers && declaredResponseTooLarge((name) => res.headers.get(name))) return;
                    const contentType = res.headers && res.headers.get ? (res.headers.get('content-type') || '') : '';
                    if (contentType && !/(?:json|javascript|text)/i.test(contentType)) return;
                    res.clone().text().then(tryHarvest).catch(() => {});
                  }
                } catch (e) {}
              }).catch(() => {});
            } catch (e) {}
            return p;
          };
          hooked.__xvHooked = true;
          pageWin.fetch = hooked;
          if (pageWin.fetch === hooked) networkHookInstallCounts.fetch++;
        }
      }
    } catch (e) {}
    try {
      const XHR = pageWin.XMLHttpRequest;
      if (XHR && XHR.prototype && XHR.prototype.open && !XHR.prototype.open.__xvHooked) {
        if (networkHookInstallCounts.xhrOpen >= MAX_NETWORK_REHOOKS_PER_API) {
          warnNetworkRehookLimit('XMLHttpRequest.open');
        } else {
          const origOpen = XHR.prototype.open;
          const hookedOpen = function (method, url) {
            this.__xvUrl = url;
            return origOpen.apply(this, arguments);
          };
          hookedOpen.__xvHooked = true;
          XHR.prototype.open = hookedOpen;
          if (XHR.prototype.open === hookedOpen) networkHookInstallCounts.xhrOpen++;
        }
      }
      if (XHR && XHR.prototype && XHR.prototype.send && !XHR.prototype.send.__xvHooked) {
        if (networkHookInstallCounts.xhrSend >= MAX_NETWORK_REHOOKS_PER_API) {
          warnNetworkRehookLimit('XMLHttpRequest.send');
        } else {
          const origSend = XHR.prototype.send;
          const hookedSend = function () {
            try {
              this.addEventListener('load', () => harvestXhrResponse(this), { once: true });
            } catch (e) {}
            return origSend.apply(this, arguments);
          };
          hookedSend.__xvHooked = true;
          XHR.prototype.send = hookedSend;
          if (XHR.prototype.send === hookedSend) networkHookInstallCounts.xhrSend++;
        }
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
    const reg = statusId ? getRegistryEntry(mediaRegistry, String(statusId)) : null;
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

  function makeDownloadCancelledError() {
    const error = new Error('下载已取消');
    error.code = 'DOWNLOAD_CANCELLED';
    return error;
  }

  function fetchBlob(url, options) {
    const opts = options || {};
    const timeoutMs = state.settings.downloadTimeout || DEFAULT_SETTINGS.downloadTimeout;
    if (opts.signal && opts.signal.aborted) return Promise.reject(makeDownloadCancelledError());

    if (typeof GM_xmlhttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        let settled = false;
        let request = null;
        const finish = (callback, value) => {
          if (settled) return;
          settled = true;
          if (opts.signal) opts.signal.removeEventListener('abort', abortRequest);
          if (typeof opts.onRequestHandle === 'function') opts.onRequestHandle(request, false);
          callback(value);
        };
        const abortRequest = () => {
          try { if (request && typeof request.abort === 'function') request.abort(); } catch (err) {}
          finish(reject, makeDownloadCancelledError());
        };
        try {
          request = GM_xmlhttpRequest({
            method: 'GET', url, responseType: 'arraybuffer', timeout: timeoutMs,
            onprogress: (event) => {
              if (settled || (opts.signal && opts.signal.aborted)) return;
              if (typeof opts.onProgress === 'function') {
                opts.onProgress(Number(event.loaded) || 0, Number(event.total) || 0, event.lengthComputable === true);
              }
            },
            onload: (response) => {
              if (opts.signal && opts.signal.aborted) {
                finish(reject, makeDownloadCancelledError());
                return;
              }
              if (response.status >= 200 && response.status < 300 && response.response) {
                const ct = ((response.responseHeaders || '').match(/content-type:\s*([^\r\n;]+)/i) || [])[1];
                finish(resolve, new Blob([response.response], ct ? { type: ct.trim() } : undefined));
              } else {
                finish(reject, new Error('HTTP ' + response.status));
              }
            },
            onerror: () => finish(reject, new Error('网络错误')),
            ontimeout: () => finish(reject, makeDownloadTimeoutError()),
            onabort: () => finish(reject, makeDownloadCancelledError()),
          });
          if (typeof opts.onRequestHandle === 'function') opts.onRequestHandle(request, true);
          if (opts.signal) {
            opts.signal.addEventListener('abort', abortRequest, { once: true });
            if (opts.signal.aborted) abortRequest();
          }
        } catch (error) {
          finish(reject, error);
        }
      });
    }

    return (async () => {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      let didTimeout = false;
      const relayAbort = () => { if (controller) controller.abort(); };
      if (opts.signal && controller) opts.signal.addEventListener('abort', relayAbort, { once: true });
      const timer = controller ? setTimeout(() => { didTimeout = true; controller.abort(); }, timeoutMs) : null;
      try {
        const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const total = Number(response.headers && response.headers.get('content-length')) || 0;
        const contentType = (response.headers && response.headers.get('content-type')) || '';
        if (response.body && typeof response.body.getReader === 'function') {
          const reader = response.body.getReader();
          const chunks = [];
          let loaded = 0;
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            chunks.push(part.value);
            loaded += part.value.byteLength;
            if (typeof opts.onProgress === 'function') opts.onProgress(loaded, total, total > 0);
          }
          return new Blob(chunks, contentType ? { type: contentType } : undefined);
        }
        const blob = await response.blob();
        if (typeof opts.onProgress === 'function') opts.onProgress(blob.size, blob.size, true);
        return blob;
      } catch (error) {
        if (opts.signal && opts.signal.aborted) throw makeDownloadCancelledError();
        if (didTimeout || (error && error.name === 'AbortError')) throw makeDownloadTimeoutError();
        if (error && /^HTTP /.test(error.message || '')) throw error;
        throw new Error('跨域下载失败：请使用支持 GM_xmlhttpRequest 的脚本管理器');
      } finally {
        if (timer) clearTimeout(timer);
        if (opts.signal && controller) opts.signal.removeEventListener('abort', relayAbort);
      }
    })();
  }

  async function fetchBlobWithRetry(url, options) {
    let lastError = null;
    for (let attempt = 0; attempt <= DOWNLOAD_MAX_RETRIES; attempt++) {
      try {
        return await fetchBlob(url, options);
      } catch (error) {
        lastError = error;
        if (error && error.code === 'DOWNLOAD_CANCELLED') throw error;
        if (attempt >= DOWNLOAD_MAX_RETRIES || /^HTTP 4\d\d/.test((error && error.message) || '')) throw error;
        if (options && typeof options.onRetry === 'function') options.onRetry(attempt + 1, error);
      }
    }
    throw lastError || new Error('下载失败');
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
    setTimeout(() => URL.revokeObjectURL(url), 3000);
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

  function toDosDateTime(value) {
    const input = value instanceof Date ? new Date(value.getTime()) : new Date(value || Date.now());
    const date = Number.isFinite(input.getTime()) ? input : new Date();
    const year = Math.max(1980, Math.min(2107, date.getFullYear()));
    const month = year === 1980 && date.getFullYear() < 1980 ? 1 : date.getMonth() + 1;
    const day = year === 1980 && date.getFullYear() < 1980 ? 1 : date.getDate();
    const dosTime = ((date.getHours() & 0x1F) << 11)
      | ((date.getMinutes() & 0x3F) << 5)
      | (Math.floor(date.getSeconds() / 2) & 0x1F);
    const dosDate = ((year - 1980) << 9) | ((month & 0x0F) << 5) | (day & 0x1F);
    return { dosTime, dosDate };
  }

  function makeClassicZipLimitError() {
    const error = new Error('媒体总量超出经典 ZIP 范围，请改为逐个下载');
    error.code = 'ZIP_CLASSIC_LIMIT';
    return error;
  }

  function prepareClassicZipEntries(files, modifiedAt) {
    if (!Array.isArray(files) || files.length > CLASSIC_ZIP_MAX_FILES) throw makeClassicZipLimitError();
    const enc = new TextEncoder();
    const fallbackTime = modifiedAt || new Date();
    let offset = 0;
    let centralSize = 0;
    const prepared = files.map((file) => {
      const nameBytes = enc.encode(file.name);
      const size = Number(file.data && file.data.length);
      if (!Number.isSafeInteger(size) || size < 0 || size > CLASSIC_ZIP_MAX_VALUE
          || nameBytes.length > CLASSIC_ZIP_MAX_FILES) throw makeClassicZipLimitError();
      const localSize = 30 + nameBytes.length + size;
      const centralEntrySize = 46 + nameBytes.length;
      if (offset + localSize > CLASSIC_ZIP_MAX_VALUE
          || centralSize + centralEntrySize > CLASSIC_ZIP_MAX_VALUE) throw makeClassicZipLimitError();
      const entry = {
        nameBytes,
        data: file.data,
        size,
        offset,
        ...toDosDateTime(file.modifiedAt || fallbackTime),
      };
      offset += localSize;
      centralSize += centralEntrySize;
      return entry;
    });
    if (offset + centralSize + 22 > CLASSIC_ZIP_MAX_VALUE) throw makeClassicZipLimitError();
    return { prepared, centralStart: offset, centralSize };
  }

  // files: [{ name: string, data: Uint8Array }] -> Blob(application/zip)
  function buildStoreZip(files, modifiedAt) {
    const layout = prepareClassicZipEntries(files, modifiedAt);
    const chunks = [];
    const central = [];
    for (const entry of layout.prepared) {
      const { nameBytes, data, size, offset, dosTime, dosDate } = entry;
      const crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true);
      lh.setUint16(4, 20, true);
      lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, 0, true);
      lh.setUint16(10, dosTime, true);
      lh.setUint16(12, dosDate, true);
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
      ch.setUint16(12, dosTime, true);
      ch.setUint16(14, dosDate, true);
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
    }
    for (const c of central) chunks.push(c.header, c.name);
    const eo = new DataView(new ArrayBuffer(22));
    eo.setUint32(0, 0x06054b50, true);
    eo.setUint16(4, 0, true);
    eo.setUint16(6, 0, true);
    eo.setUint16(8, files.length, true);
    eo.setUint16(10, files.length, true);
    eo.setUint32(12, layout.centralSize, true);
    eo.setUint32(16, layout.centralStart, true);
    eo.setUint16(20, 0, true);
    chunks.push(new Uint8Array(eo.buffer));
    return new Blob(chunks, { type: 'application/zip' });
  }

  const downloadJobs = new Map();
  const downloadTransferQueue = [];
  let activeDownloadTransfers = 0;
  let downloadUiRaf = 0;

  function collectDownloadItems(article, statusId) {
    const media = collectMedia(article, statusId);
    const items = [];
    media.photos.forEach((u) => items.push({ url: u, ext: extOfUrl(u, 'jpg') }));
    media.gifs.forEach((u) => items.push({ url: u, ext: 'mp4' }));
    media.videos.forEach((u) => items.push({ url: u, ext: 'mp4' }));
    if (!items.length) {
      // 第三方引用卡片（内嵌视频 / 缩略图）：标准媒体为空时回退到卡片注册表
      const card = statusId ? getRegistryEntry(cardRegistry, String(statusId)) : null;
      if (card) {
        card.photos.forEach((u) => items.push({ url: u, ext: extOfUrl(u, 'jpg') }));
        card.gifs.forEach((u) => items.push({ url: u, ext: 'mp4' }));
        card.videos.forEach((u) => items.push({ url: u, ext: 'mp4' }));
      }
    }
    return items;
  }

  function formatDownloadBytes(value) {
    const bytes = Math.max(0, Number(value) || 0);
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes < 10485760 ? 1 : 0)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function isActiveDownloadJob(job) {
    return !!job && ['queued', 'downloading', 'packing', 'saving', 'cancelling'].includes(job.status);
  }

  function getDownloadJobProgress(job) {
    if (!job) return { loaded: 0, total: 0, percent: 0, allKnown: false };
    let loaded = 0;
    let total = 0;
    let allKnown = job.itemProgress.length > 0;
    for (const progress of job.itemProgress) {
      loaded += progress.loaded || 0;
      total += progress.total || 0;
      if (!progress.totalKnown) allKnown = false;
    }
    const percent = allKnown && total > 0 ? Math.max(0, Math.min(100, Math.round((loaded / total) * 100))) : 0;
    return { loaded, total, percent, allKnown };
  }

  function describeDownloadJob(job, compact) {
    const progress = getDownloadJobProgress(job);
    if (job.status === 'queued') return compact ? '排队' : '排队中';
    if (job.status === 'packing') return compact ? '打包' : `正在打包 ${job.packCompleted || 0}/${job.packTotal || job.items.length}`;
    if (job.status === 'saving') return compact ? '保存' : '正在保存';
    if (job.status === 'cancelling') return compact ? '取消中' : '正在取消下载';
    if (job.status === 'done') return job.failedCount ? `完成，跳过 ${job.failedCount}` : '下载完成';
    if (job.status === 'cancelled') return job.savedCount ? `已取消，已保存 ${job.savedCount}` : '已取消';
    if (job.status === 'error') return `失败：${job.errorMessage || '未知错误'}`;
    if (progress.allKnown) return `${progress.percent}%`;
    if (progress.loaded > 0) return formatDownloadBytes(progress.loaded);
    return compact ? '下载' : `下载中 ${job.completedCount || 0}/${job.items.length}`;
  }

  function scheduleDownloadUiRefresh() {
    if (downloadUiRaf) return;
    const run = () => { downloadUiRaf = 0; refreshDownloadUi(); };
    downloadUiRaf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(run) : setTimeout(run, 16);
  }

  function renderDownloadTaskPopover() {
    if (!state.downloadPopoverEl || state.downloadPopoverEl.hidden) return;
    const jobs = [...downloadJobs.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!jobs.length) {
      if (state.downloadPopoverEl.dataset.renderSignature !== 'empty') {
        state.downloadPopoverEl.innerHTML = '<div class="BetterX-download-empty">暂无下载任务</div>';
        state.downloadPopoverEl.dataset.renderSignature = 'empty';
      }
      return;
    }
    const models = jobs.map((job) => ({
      job,
      canCancel: isActiveDownloadJob(job) && job.status !== 'cancelling',
      canRetry: job.status === 'error' || job.status === 'cancelled',
    }));
    // 进度事件很频繁。只在任务结构/操作按钮变化时重建，避免 PC 鼠标按下与松开之间按钮被替换。
    const renderSignature = models.map(({ job, canCancel, canRetry }) => `${job.id}:${canCancel ? 1 : 0}:${canRetry ? 1 : 0}`).join('|');
    if (state.downloadPopoverEl.dataset.renderSignature !== renderSignature) {
      state.downloadPopoverEl.innerHTML = `
        <div class="BetterX-download-popover-title">下载任务</div>
        ${models.map(({ job, canCancel, canRetry }) => `<div class="BetterX-download-task" data-job-id="${escapeHtml(job.id)}">
            <div class="BetterX-download-task-main">
              <strong>${escapeHtml(job.baseName)}</strong>
              <span></span>
            </div>
            <div class="BetterX-download-task-actions">
              ${canCancel ? `<button type="button" data-action="download-cancel" data-job-id="${escapeHtml(job.id)}">取消</button>` : ''}
              ${canRetry ? `<button type="button" data-action="download-retry" data-job-id="${escapeHtml(job.id)}">重试</button>` : ''}
            </div>
          </div>`).join('')}
      `;
      state.downloadPopoverEl.dataset.renderSignature = renderSignature;
    }
    const taskElements = new Map(
      [...state.downloadPopoverEl.querySelectorAll('.BetterX-download-task[data-job-id]')]
        .map((element) => [element.dataset.jobId || '', element])
    );
    models.forEach(({ job }) => {
      const task = taskElements.get(String(job.id));
      if (!task) return;
      const progress = getDownloadJobProgress(job);
      task.style.setProperty('--xv-task-progress', progress.allKnown ? `${progress.percent}%` : '0%');
      const status = task.querySelector('.BetterX-download-task-main span');
      if (status) status.textContent = describeDownloadJob(job, false);
    });
  }

  function refreshDownloadUi() {
    const controls = document.querySelectorAll('.BetterX-download-controls[data-status-id]');
    controls.forEach((control) => {
      const job = downloadJobs.get(control.dataset.statusId || '');
      const button = control.querySelector('.BetterX-dl-btn');
      const cancel = control.querySelector('.BetterX-dl-cancel');
      if (!button) return;
      const active = isActiveDownloadJob(job);
      const progress = getDownloadJobProgress(job);
      control.dataset.downloadState = job ? job.status : 'idle';
      button.classList.toggle('is-progress', active);
      button.style.setProperty('--xv-download-progress', `${progress.percent * 3.6}deg`);
      button.textContent = job ? describeDownloadJob(job, true) : '⬇';
      button.title = job ? describeDownloadJob(job, false) : '下载图片/视频/GIF';
      if (cancel) cancel.hidden = !active;
    });

    if (!state.downloadPillEl) return;
    const jobs = [...downloadJobs.values()];
    const activeJobs = jobs.filter(isActiveDownloadJob);
    state.downloadPillEl.hidden = jobs.length === 0;
    if (!jobs.length) {
      if (state.downloadPopoverEl) state.downloadPopoverEl.hidden = true;
      return;
    }
    const loaded = activeJobs.reduce((sum, job) => sum + getDownloadJobProgress(job).loaded, 0);
    const total = activeJobs.reduce((sum, job) => sum + getDownloadJobProgress(job).total, 0);
    const allKnown = activeJobs.length > 0 && activeJobs.every((job) => getDownloadJobProgress(job).allKnown);
    const percent = allKnown && total > 0 ? Math.round((loaded / total) * 100) : 0;
    const isMobile = state.rootEl && state.rootEl.classList.contains('BetterX-mobile');
    const recentJob = jobs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    const label = activeJobs.length
      ? `${activeJobs.length} 个任务 · ${allKnown ? percent + '%' : formatDownloadBytes(loaded)}`
      : describeDownloadJob(recentJob, false);
    const labelEl = state.downloadPillEl.querySelector('.BetterX-download-pill-label');
    const countEl = state.downloadPillEl.querySelector('.BetterX-download-pill-count');
    if (labelEl) labelEl.textContent = label;
    if (countEl) {
      countEl.hidden = !isMobile || activeJobs.length === 0;
      countEl.textContent = activeJobs.length > 99 ? '99+' : String(activeJobs.length);
    }
    state.downloadPillEl.setAttribute('aria-label', activeJobs.length ? `查看下载任务：${label}` : `查看下载任务：${describeDownloadJob(recentJob, false)}`);
    state.downloadPillEl.style.setProperty('--xv-download-progress', `${percent * 3.6}deg`);
    state.downloadPillEl.classList.toggle('is-progress', activeJobs.length > 0);
    renderDownloadTaskPopover();
  }

  function toggleDownloadPopover(force) {
    if (!state.downloadPopoverEl || !downloadJobs.size) return;
    const next = typeof force === 'boolean' ? force : state.downloadPopoverEl.hidden;
    state.downloadPopoverEl.hidden = !next;
    if (next) renderDownloadTaskPopover();
  }

  function getDownloadConcurrencyLimit() {
    return clampInt(
      state.settings.downloadConcurrency,
      DOWNLOAD_MIN_CONCURRENCY,
      DOWNLOAD_MAX_CONCURRENCY,
      DEFAULT_SETTINGS.downloadConcurrency
    );
  }

  function pumpDownloadTransferQueue() {
    const concurrencyLimit = getDownloadConcurrencyLimit();
    while (activeDownloadTransfers < concurrencyLimit && downloadTransferQueue.length) {
      const entry = downloadTransferQueue.shift();
      if (entry.job.cancelRequested) { entry.reject(makeDownloadCancelledError()); continue; }
      activeDownloadTransfers++;
      Promise.resolve().then(entry.task).then(entry.resolve, entry.reject).finally(() => {
        activeDownloadTransfers--;
        pumpDownloadTransferQueue();
      });
    }
  }

  function runWithDownloadSlot(job, task) {
    return new Promise((resolve, reject) => {
      downloadTransferQueue.push({ job, task, resolve, reject });
      pumpDownloadTransferQueue();
    });
  }

  function cancelDownloadJob(jobId) {
    const job = downloadJobs.get(String(jobId || ''));
    if (!isActiveDownloadJob(job) || job.cancelRequested || job.status === 'cancelling') return;
    job.cancelRequested = true;
    job.status = 'cancelling';
    job.cancelHandles = new Set([...(job.cancelHandles || []), ...(job.requests || [])]);
    job.controllers.forEach((controller) => { try { controller.abort(); } catch (err) {} });
    (job.requests || []).forEach((request) => { try { if (request && typeof request.abort === 'function') request.abort(); } catch (err) {} });
    const repeatAbort = () => {
      (job.cancelHandles || []).forEach((request) => {
        try { if (request && typeof request.abort === 'function') request.abort(); } catch (err) {}
      });
    };
    (job.cancelAbortTimers || []).forEach((timer) => clearTimeout(timer));
    job.cancelAbortTimers = [80, 250, 700, 1500].map((delay) => setTimeout(repeatAbort, delay));
    job.cancelAbortTimers.push(setTimeout(() => {
      if (job.cancelHandles) job.cancelHandles.clear();
      job.cancelAbortTimers = [];
    }, 2500));
    for (let index = downloadTransferQueue.length - 1; index >= 0; index--) {
      const queued = downloadTransferQueue[index];
      if (queued.job !== job) continue;
      downloadTransferQueue.splice(index, 1);
      queued.reject(makeDownloadCancelledError());
    }
    job.updatedAt = now();
    scheduleDownloadUiRefresh();
  }

  function scheduleDownloadJobCleanup(job, delay) {
    if (job.cleanupTimer) clearTimeout(job.cleanupTimer);
    job.cleanupTimer = setTimeout(() => {
      if (downloadJobs.get(job.id) === job && !isActiveDownloadJob(job)) downloadJobs.delete(job.id);
      scheduleDownloadUiRefresh();
    }, delay);
  }

  function saveIndividualDownload(job, result) {
    if (!result || !result.blob) return;
    job.updatedAt = now();
    saveBlob(result.blob, `${job.baseName}_${result.index + 1}.${result.ext}`);
    result.blob = null;
    result.saved = true;
    job.savedCount++;
    scheduleDownloadUiRefresh();
  }

  async function runDownloadJob(job) {
    job.status = 'downloading';
    job.updatedAt = now();
    scheduleDownloadUiRefresh();
    const zipMemoryLimit = isMobileBadgeViewport()
      ? DOWNLOAD_ZIP_MEMORY_LIMIT_MOBILE
      : DOWNLOAD_ZIP_MEMORY_LIMIT_DESKTOP;
    const retainedResults = [];
    let retainedBytes = 0;
    let individualMode = false;

    const acceptResult = (result) => {
      if (job.items.length === 1) {
        job.status = 'saving';
        saveBlob(result.blob, `${job.baseName}.${result.ext}`);
        result.blob = null;
        result.saved = true;
        job.savedCount++;
        return;
      }
      if (!individualMode && retainedBytes + result.blob.size > zipMemoryLimit) {
        individualMode = true;
        job.fallbackIndividual = true;
        retainedResults.splice(0).forEach((saved) => saveIndividualDownload(job, saved));
        retainedBytes = 0;
      }
      if (individualMode) saveIndividualDownload(job, result);
      else {
        retainedResults.push(result);
        retainedBytes += result.blob.size;
      }
    };

    const outcomes = await Promise.all(job.items.map((item, index) => runWithDownloadSlot(job, async () => {
      if (job.cancelRequested) throw makeDownloadCancelledError();
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (controller) job.controllers.add(controller);
      job.itemProgress[index].status = 'downloading';
      try {
        const blob = await fetchBlobWithRetry(item.url, {
          signal: controller ? controller.signal : null,
          onRequestHandle: (request, active) => {
            if (!request || !job.requests) return;
            if (active) {
              job.requests.add(request);
              if (job.cancelRequested && typeof request.abort === 'function') {
                job.cancelHandles.add(request);
                try { request.abort(); } catch (err) {}
              }
            } else job.requests.delete(request);
          },
          onProgress: (loaded, total, totalKnown) => {
            if (job.cancelRequested) return;
            const progress = job.itemProgress[index];
            progress.loaded = loaded;
            progress.total = totalKnown ? total : 0;
            progress.totalKnown = totalKnown && total > 0;
            job.updatedAt = now();
            scheduleDownloadUiRefresh();
          },
          onRetry: () => {
            const progress = job.itemProgress[index];
            progress.loaded = 0;
            progress.total = 0;
            progress.totalKnown = false;
            job.retryCount++;
            scheduleDownloadUiRefresh();
          },
        });
        const progress = job.itemProgress[index];
        progress.loaded = blob.size;
        progress.total = blob.size;
        progress.totalKnown = true;
        progress.status = 'done';
        job.completedCount++;
        const result = { blob, ext: item.ext, index };
        acceptResult(result);
        return { ok: true, result };
      } catch (error) {
        job.itemProgress[index].status = error && error.code === 'DOWNLOAD_CANCELLED' ? 'cancelled' : 'error';
        return { ok: false, error, index };
      } finally {
        if (controller) job.controllers.delete(controller);
        job.updatedAt = now();
        scheduleDownloadUiRefresh();
      }
    }).catch((error) => {
      job.itemProgress[index].status = error && error.code === 'DOWNLOAD_CANCELLED' ? 'cancelled' : 'error';
      return { ok: false, error, index };
    })));

    if (job.cancelRequested) {
      retainedResults.forEach((result) => { result.blob = null; });
      job.status = 'cancelled';
      job.updatedAt = now();
      scheduleDownloadJobCleanup(job, 5000);
      scheduleDownloadUiRefresh();
      return;
    }

    const failures = outcomes.filter((outcome) => !outcome.ok && (!outcome.error || outcome.error.code !== 'DOWNLOAD_CANCELLED'));
    job.failedCount = failures.length;
    if (!job.savedCount && !retainedResults.length) {
      job.status = 'error';
      job.errorMessage = failures[0] && failures[0].error ? failures[0].error.message : '全部媒体下载失败';
      job.updatedAt = now();
      scheduleDownloadJobCleanup(job, 30000);
      scheduleDownloadUiRefresh();
      return;
    }

    if (!individualMode && retainedResults.length === 1) {
      saveIndividualDownload(job, retainedResults[0]);
      retainedResults.length = 0;
    } else if (!individualMode && retainedResults.length > 1) {
      job.status = 'packing';
      job.packCompleted = 0;
      job.packTotal = retainedResults.length;
      scheduleDownloadUiRefresh();
      const files = [];
      try {
        for (const result of retainedResults) {
          if (job.cancelRequested) throw makeDownloadCancelledError();
          const buffer = await blobToArrayBuffer(result.blob);
          if (job.cancelRequested) throw makeDownloadCancelledError();
          result.blob = null;
          files.push({ resultIndex: result.index, name: `${result.index + 1}.${result.ext}`, data: new Uint8Array(buffer), modifiedAt: new Date() });
          job.packCompleted++;
          scheduleDownloadUiRefresh();
        }
        if (job.cancelRequested) throw makeDownloadCancelledError();
        const content = buildStoreZip(files, new Date());
        if (job.cancelRequested) throw makeDownloadCancelledError();
        job.status = 'saving';
        saveBlob(content, `${job.baseName}.zip`);
        job.savedCount = files.length;
        files.length = 0;
      } catch (error) {
        if (error && error.code === 'DOWNLOAD_CANCELLED') {
          retainedResults.forEach((result) => { result.blob = null; });
          files.length = 0;
          throw error;
        }
        job.fallbackIndividual = true;
        job.status = 'saving';
        let fallbackSaved = 0;
        for (let index = 0; index < retainedResults.length; index++) {
          const result = retainedResults[index];
          const prepared = files.find((file) => file.resultIndex === result.index);
          const fallbackBlob = result.blob || (prepared ? new Blob([prepared.data]) : null);
          if (fallbackBlob) {
            saveBlob(fallbackBlob, `${job.baseName}_${result.index + 1}.${result.ext}`);
            fallbackSaved++;
          }
          result.blob = null;
        }
        job.savedCount += fallbackSaved;
        files.length = 0;
        if (error && error.code !== 'ZIP_CLASSIC_LIMIT') console.error('[BetterX] ZIP 打包失败，已改为逐个保存:', error);
      }
      retainedResults.length = 0;
    }

    job.status = 'done';
    job.updatedAt = now();
    job.errorMessage = '';
    scheduleDownloadJobCleanup(job, 8000);
    scheduleDownloadUiRefresh();
    showToast(job.fallbackIndividual
      ? `✅ 下载完成：已逐个保存 ${job.savedCount} 个文件`
      : `✅ 下载完成${job.failedCount ? `，跳过 ${job.failedCount} 个失败项` : ''}`,
    5000);
  }

  function startDownloadJob(items, author, statusId) {
    const id = String(statusId || '');
    const previous = downloadJobs.get(id);
    if (isActiveDownloadJob(previous)) { toggleDownloadPopover(true); return previous; }
    if (previous && previous.cleanupTimer) clearTimeout(previous.cleanupTimer);
    const uname = String((author && author.username) || 'x').replace(/^@/, '') || 'x';
    const baseName = (uname + '_' + statusId).replace(/[\\/:*?"<>|]+/g, '_');
    const job = {
      id, statusId: id, baseName, username: uname, items: items.map((item) => ({ ...item })),
      itemProgress: items.map(() => ({ loaded: 0, total: 0, totalKnown: false, status: 'queued' })),
      status: 'queued', createdAt: now(), updatedAt: now(), completedCount: 0, failedCount: 0,
      savedCount: 0, retryCount: 0, packCompleted: 0, packTotal: 0, fallbackIndividual: false,
      cancelRequested: false, controllers: new Set(), requests: new Set(), cancelHandles: new Set(),
      cancelAbortTimers: [], cleanupTimer: null, errorMessage: '',
    };
    downloadJobs.set(id, job);
    scheduleDownloadUiRefresh();
    Promise.resolve(runDownloadJob(job)).catch((error) => {
      job.status = error && error.code === 'DOWNLOAD_CANCELLED' ? 'cancelled' : 'error';
      job.errorMessage = (error && error.message) || '未知错误';
      job.updatedAt = now();
      scheduleDownloadJobCleanup(job, job.status === 'cancelled' ? 5000 : 30000);
      scheduleDownloadUiRefresh();
    });
    return job;
  }

  function retryDownloadJob(jobId) {
    const previous = downloadJobs.get(String(jobId || ''));
    if (!previous || isActiveDownloadJob(previous)) return;
    return startDownloadJob(previous.items, { username: previous.username }, previous.statusId);
  }

  function handleDownloadClick(article, author, statusId) {
    const existing = downloadJobs.get(String(statusId || ''));
    if (isActiveDownloadJob(existing)) { toggleDownloadPopover(true); return; }
    const items = collectDownloadItems(article, statusId);
    if (!items.length) {
      showToast('未找到可下载的媒体，若为视频请先点开或播放一下再试');
      return;
    }
    startDownloadJob(items, author, statusId);
  }

  function isDownloadExcludedArticle(article) {
    if (!article) return false;
    // 通知卡片会复用 tweetText / pbs.twimg.com/media，但它不是可下载的帖子操作区。
    if (article.matches && article.matches('[data-testid="notification"]')) return true;
    return !!(article.closest && article.closest('[data-testid="notification"]'));
  }

  function injectDownloadButtons(scope) {
    if (!state.settings.mediaDownload) return;
    const root = (scope && scope.querySelectorAll) ? scope : document;
    const articles = (root.matches && root.matches('article')) ? [root] : root.querySelectorAll('article');
    articles.forEach((article) => {
      if (article.closest('#BetterX-root')) return;
      if (isDownloadExcludedArticle(article)) {
        article.querySelectorAll('.BetterX-download-controls').forEach((control) => control.remove());
        return;
      }
      if (article.querySelector('.BetterX-download-controls')) return;
      const statusId = extractStatusIdFromUrl(getStatusLink(article));
      // 没有帖子 ID 的通知/推荐卡片无法稳定命名和隔离任务，不注入下载控件。
      if (!statusId) return;
      const hasDomMedia = article.querySelector('[data-testid="tweetPhoto"], [data-testid="videoComponent"], [data-testid="videoPlayer"], img[src*="pbs.twimg.com/media/"], video[poster]');
      const hasReg = statusId && (mediaRegistry.has(String(statusId)) || cardRegistry.has(String(statusId)));
      if (!hasDomMedia && !hasReg) return;
      const author = extractAuthor(article);
      const group = article.querySelector('[role="group"]');
      const controls = document.createElement('span');
      controls.className = 'BetterX-download-controls';
      controls.dataset.statusId = String(statusId || '');
      const btn = document.createElement('button');
      btn.className = 'BetterX-dl-btn';
      btn.type = 'button';
      btn.title = '下载图片/视频/GIF';
      btn.textContent = '⬇';
      btn.addEventListener('click', (event) => {
        event.preventDefault(); event.stopPropagation(); handleDownloadClick(article, author, statusId);
      }, true);
      const cancel = document.createElement('button');
      cancel.className = 'BetterX-dl-cancel';
      cancel.type = 'button';
      cancel.title = '取消下载';
      cancel.textContent = '×';
      cancel.hidden = true;
      cancel.addEventListener('click', (event) => {
        event.preventDefault(); event.stopPropagation(); cancelDownloadJob(statusId);
      }, true);
      controls.append(btn, cancel);
      if (group) { controls.classList.add('in-group'); group.appendChild(controls); }
      else {
        controls.classList.add('floating');
        if (!article.style.position) article.style.position = 'relative';
        article.appendChild(controls);
      }
    });
    scheduleDownloadUiRefresh();
  }

  function removeDownloadButtons() {
    document.querySelectorAll('.BetterX-download-controls, .BetterX-dl-btn').forEach((el) => el.remove());
  }

  function applyMediaDownload() {
    if (state.settings.mediaDownload) injectDownloadButtons(document);
    else removeDownloadButtons();
  }

  // ── 恢复多媒体网格视图 ────────────────────────────────────────────
  // X 现将多媒体放进 ScrollSnap 轮播；只给含两项以上媒体的列表加类，
  // 保留原有链接、视频控件和 React 事件处理，关闭设置时也能无损还原。
  function getArticlesFromScope(scope) {
    const root = (scope && scope.querySelectorAll) ? scope : document;
    return root.matches && root.matches('article') ? [root] : [...root.querySelectorAll('article')];
  }

  function removeMediaGridLayout(scope) {
    const root = (scope && scope.querySelectorAll) ? scope : document;
    root.querySelectorAll('.BetterX-media-grid').forEach((el) => {
      el.classList.remove('BetterX-media-grid', 'BetterX-media-grid-count-2', 'BetterX-media-grid-count-3', 'BetterX-media-grid-count-4');
    });
    root.querySelectorAll('.BetterX-media-grid-box').forEach((el) => el.classList.remove('BetterX-media-grid-box'));
  }

  function restoreMediaGridInArticle(article) {
    if (!article || article.closest('#BetterX-root')) return;
    article.querySelectorAll('[data-testid="ScrollSnap-List"]').forEach((list) => {
      const items = [...list.children].filter((child) => child.getAttribute('role') === 'presentation');
      const nav = list.closest('nav[role="navigation"]');
      if (!nav) return;
      nav.classList.remove('BetterX-media-grid', 'BetterX-media-grid-count-2', 'BetterX-media-grid-count-3', 'BetterX-media-grid-count-4');
      if (nav.parentElement) nav.parentElement.classList.remove('BetterX-media-grid-box');
      if (items.length < 2) return;
      nav.classList.add('BetterX-media-grid', `BetterX-media-grid-count-${Math.min(items.length, 4)}`);
      if (nav.parentElement) nav.parentElement.classList.add('BetterX-media-grid-box');
    });
  }

  function applyMediaGridLayout(scope) {
    if (!state.settings.restoreMediaGrid) {
      removeMediaGridLayout(scope);
      return;
    }
    getArticlesFromScope(scope).forEach(restoreMediaGridInArticle);
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

  function buildUnlockedMediaEl(media, statusUrl) {
    const box = document.createElement('div');
    box.className = 'BetterX-unlocked BetterX-native-media-grid';
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
    const nativeStatusUrl = normalizeUrl(statusUrl || '').replace(/\/photo\/\d+$/i, '');
    media.photos.forEach((u, index) => {
      const a = document.createElement('a');
      // 使用 X 自己的 /photo/n 路由，点击后仍进入原生图片查看器，而不是裸图新标签页。
      a.href = nativeStatusUrl ? `${nativeStatusUrl}/photo/${index + 1}` : u;
      a.className = 'BetterX-unlocked-tile BetterX-unlocked-photo';
      a.setAttribute('role', 'link');
      if (!nativeStatusUrl) { a.target = '_blank'; a.rel = 'noopener'; }
      const mediaEl = document.createElement('div');
      mediaEl.className = 'BetterX-unlocked-media';
      mediaEl.setAttribute('data-testid', 'tweetPhoto');
      mediaEl.setAttribute('aria-label', '图像');
      const img = document.createElement('img');
      img.src = u; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.alt = '';
      mediaEl.appendChild(img); a.appendChild(mediaEl); box.appendChild(a);
    });
    media.gifs.forEach((u) => {
      const tile = document.createElement('div');
      tile.className = 'BetterX-unlocked-tile BetterX-unlocked-video';
      tile.setAttribute('data-testid', 'videoComponent');
      const v = document.createElement('video');
      v.src = u; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
      tile.appendChild(v); box.appendChild(tile);
    });
    media.videos.forEach((u) => {
      const tile = document.createElement('div');
      tile.className = 'BetterX-unlocked-tile BetterX-unlocked-video';
      tile.setAttribute('data-testid', 'videoComponent');
      const v = document.createElement('video');
      v.src = u; v.controls = true; v.playsInline = true; v.preload = 'metadata';
      tile.appendChild(v); box.appendChild(tile);
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
    if (warnEl.closest('.BetterX-mask-hidden')) return; // 已揭掉，避免重复处理
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
    overlay.classList.add('BetterX-mask-hidden');
  }

  function unlockAgeRestricted(article) {
    if (!article || !article.querySelector) return;
    if (article.closest('#BetterX-root')) return;
    if (article.querySelector('.BetterX-unlocked')) return; // 已处理，避免重复注入
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
        cblock.classList.add('BetterX-mask-hidden');
        cblock.insertAdjacentElement('afterend', buildUnlockedMediaEl(card, getStatusLink(article)));
        return;
      }
      // 仍取不到：回退到“揭掉遮罩层”（适用于真实卡片仍在 DOM 的情况）
      revealCardUnderMask(warnEl, article);
      return;
    }
    const block = getAgeMaskBlock(warnEl, article);
    if (!block || !block.parentElement) return;
    block.classList.add('BetterX-mask-hidden');
    block.insertAdjacentElement('afterend', buildUnlockedMediaEl(media, getStatusLink(article)));
  }

  function revealAgeRestricted(scope) {
    if (!state.settings.bypassAgeRestriction) return;
    const root = (scope && scope.querySelectorAll) ? scope : document;
    const articles = (root.matches && root.matches('article')) ? [root] : root.querySelectorAll('article');
    articles.forEach(unlockAgeRestricted);
  }

  function removeUnlockedMedia() {
    document.querySelectorAll('.BetterX-unlocked').forEach((el) => el.remove());
    document.querySelectorAll('.BetterX-mask-hidden').forEach((el) => el.classList.remove('BetterX-mask-hidden'));
  }

  function applyAgeBypass() {
    if (state.settings.bypassAgeRestriction) revealAgeRestricted(document);
    else removeUnlockedMedia();
  }

  let xvToastTimer = null;
  function showToast(msg, duration) {
    let t = document.getElementById('BetterX-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'BetterX-toast';
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
    const dialog = document.getElementById('BetterX-choice-dialog');
    if (dialog) dialog.remove();
  }

  function showBetterXDialog(options) {
    if (!state.rootEl) return;
    closeBetterXDialog();
    const overlay = document.createElement('div');
    overlay.id = 'BetterX-choice-dialog';
    overlay.className = 'BetterX-dialog-overlay';
    overlay.innerHTML = `
      <div class="BetterX-dialog" role="dialog" aria-modal="true" aria-labelledby="BetterX-dialog-title">
        <div class="BetterX-dialog-title" id="BetterX-dialog-title"></div>
        <div class="BetterX-dialog-body"></div>
        <div class="BetterX-dialog-actions">
          <button type="button" class="BetterX-btn" data-dialog-choice="secondary"></button>
          <button type="button" class="BetterX-btn primary" data-dialog-choice="primary"></button>
        </div>
      </div>
    `;
    overlay.querySelector('.BetterX-dialog-title').textContent = options.title || 'BetterX 提示';
    overlay.querySelector('.BetterX-dialog-body').innerHTML = options.bodyHtml || '';
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
      bodyHtml: '<p>关闭后将恢复 v1.7 的网络媒体与关注关系采集。如果当前环境曾卡在只显示 X 图标的页面，建议继续保持开启。确认后页面会刷新。</p>',
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

  function switchFirefoxCompatibilityFromMenu(enabled) {
    if (!IS_FIREFOX) return;
    writeFirefoxCompatibilityMode(enabled ? 'compat' : 'normal');
    const reload = () => {
      try { location.reload(); } catch (err) { console.error('[BetterX] reload failed:', err); }
    };
    if (!state.settingsLoaded) { reload(); return; }
    state.settings.firefoxCompatibility = !!enabled;
    state.settings.firefoxCompatibilityPrompted = true;
    queueDbWrite(async () => { await persistSettings(); });
    Promise.resolve(state.dbWriteQueue).then(reload).catch(reload);
  }

  function buildFirefoxCompatibilityDiagnostic() {
    const diagnostic = {
      generatedAt: new Date().toISOString(),
      scriptVersion: (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '2.5.0',
      userAgent: navigator.userAgent || '',
      page: `${location.origin || ''}${location.pathname || ''}`,
      readyState: document.readyState || '',
      visibilityState: document.visibilityState || '',
      firefoxCompatibilityMode,
      settingsLoaded: !!state.settingsLoaded,
      settingsCompatibilityEnabled: !!state.settings.firefoxCompatibility,
      postsInMemory: state.posts.length,
      mediaRegistrySize: mediaRegistry.size,
      cardRegistrySize: cardRegistry.size,
      followedHandlesSize: followedHandles.size,
      networkHookInstallCounts: { ...networkHookInstallCounts },
      networkHarvestQueueSize: networkHarvestQueue.length,
      networkHarvestQueuedChars,
      networkHarvestDroppedJobs,
      networkHookStatus: { fetch: 'not-inspected', xhrOpen: 'not-inspected', xhrSend: 'not-inspected' },
    };
    // 兼容模式下诊断也不读取 unsafeWindow，避免自救工具反过来触发 Xray 问题。
    if (firefoxCompatibilityMode === 'normal') {
      try {
        const pageWin = getPageWindow();
        diagnostic.networkHookStatus.fetch = !!(pageWin.fetch && pageWin.fetch.__xvHooked);
        const proto = pageWin.XMLHttpRequest && pageWin.XMLHttpRequest.prototype;
        diagnostic.networkHookStatus.xhrOpen = !!(proto && proto.open && proto.open.__xvHooked);
        diagnostic.networkHookStatus.xhrSend = !!(proto && proto.send && proto.send.__xvHooked);
      } catch (error) {
        diagnostic.networkHookStatus.error = String((error && error.message) || error || 'unknown');
      }
    }
    return diagnostic;
  }

  function downloadFirefoxCompatibilityDiagnostic() {
    const diagnostic = buildFirefoxCompatibilityDiagnostic();
    const json = JSON.stringify(diagnostic, null, 2);
    console.info('[BetterX] Firefox compatibility diagnostic:', diagnostic);
    if (!document.body) {
      window.alert('页面尚未就绪，诊断信息已输出到控制台。');
      return;
    }
    download(`betterx-firefox-diagnostic-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, json);
    if (state.rootEl) showToast('已导出 Firefox 兼容诊断');
  }

  function toggleDesktopBadgeFromMenu() {
    if (isMobileBadgeViewport()) {
      if (state.rootEl) showToast('“隐藏应用徽标”仅对 PC 生效');
      else window.alert('BetterX：“隐藏应用徽标”仅对 PC 生效。');
      return;
    }
    const hidden = !state.settings.hideAppBadgeOnDesktop;
    setSettingsPartial({ hideAppBadgeOnDesktop: hidden });
    if (state.rootEl) showToast(hidden ? '已隐藏应用徽标 · Alt+X 可打开面板' : '已显示应用徽标');
  }

  function registerMenuCommands() {
    if (typeof GM_registerMenuCommand !== 'function') return;
    try {
      GM_registerMenuCommand('BetterX：显示 / 隐藏应用徽标（仅 PC）', toggleDesktopBadgeFromMenu);
      if (IS_FIREFOX) {
        GM_registerMenuCommand('BetterX：强制开启 Firefox 兼容模式并刷新', () => {
          switchFirefoxCompatibilityFromMenu(true);
        });
        GM_registerMenuCommand('BetterX：恢复 Firefox 完整模式并刷新', () => {
          switchFirefoxCompatibilityFromMenu(false);
        });
        GM_registerMenuCommand('BetterX：导出 Firefox 兼容诊断', downloadFirefoxCompatibilityDiagnostic);
      }
    } catch (err) {
      console.error('[BetterX] register menu commands failed:', err);
    }
  }

  // ── 广告检测 / 屏蔽 ──────────────────────────────────────────────────
  // X 的推广帖特征：article 外层含 [data-testid="placementTracking"] 追踪像素，
  // 且头部有独立的“广告 / Ad / Promoted”标签（不在正文 tweetText 内）。
  const AD_LABELS = ['广告', '推广', 'Ad', 'Promoted', 'Publicidad', 'Anúncio', '広告', '광고'];
  // X 新增的独立程序化广告位（Google SafeFrame），不属于 article，需隐藏整个卡片以免留下空白。
  const STANDALONE_AD_SELECTOR = '[data-testid="whoToFollowSspAd"], [data-testid$="SspAd"]';
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
    if (cell && cell.classList) cell.classList.add('BetterX-ad-hidden');
    else if (cell) cell.style.display = 'none';
  }

  function hideStandaloneAdElement(element) {
    if (!element) return;
    const container = element.matches && element.matches(STANDALONE_AD_SELECTOR)
      ? element
      : (element.closest ? element.closest(STANDALONE_AD_SELECTOR) : null);
    if (!container) return;
    if (container.classList) container.classList.add('BetterX-ad-hidden');
    else if (container.style) container.style.display = 'none';
  }

  function sweepStandaloneAds(root) {
    if (!state.settings.hideAds) return;
    const scope = root && root.querySelectorAll ? root : document;
    if (scope.matches && scope.matches(STANDALONE_AD_SELECTOR)) hideStandaloneAdElement(scope);
    if (scope.closest) hideStandaloneAdElement(scope.closest(STANDALONE_AD_SELECTOR));
    scope.querySelectorAll(STANDALONE_AD_SELECTOR).forEach(hideStandaloneAdElement);
  }

  function sweepAds(root) {
    if (!state.settings.hideAds) return;
    const scope = root && root.querySelectorAll ? root : document;
    const articles = scope.matches && scope.matches('article') ? [scope] : scope.querySelectorAll('article');
    articles.forEach((a) => {
      if (isAdArticle(a)) hideAdElement(a);
    });
    sweepStandaloneAds(scope);
  }

  function unhideAds() {
    document.querySelectorAll('.BetterX-ad-hidden').forEach((el) => el.classList.remove('BetterX-ad-hidden'));
  }

  function applyAdHiding() {
    if (state.settings.hideAds) sweepAds();
    else unhideAds();
  }
  // ── 界面简化与宽屏 ─────────────────────────────────────────────────
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
      style = document.getElementById('BetterX-layout-style') || document.createElement('style');
      style.id = 'BetterX-layout-style';
      if (!style.isConnected) (document.head || document.documentElement).appendChild(style);
      state.layoutStyleEl = style;
    }
    return style;
  }

  function clearLayoutDomClasses() {
    const classes = [
      'BetterX-layout-clean-hidden', 'BetterX-layout-showmore-hidden',
      'BetterX-layout-primary', 'BetterX-layout-row', 'BetterX-layout-main',
      'BetterX-layout-shell', 'BetterX-layout-left-width-target',
    ];
    for (const className of classes) {
      document.querySelectorAll(`.${className}`).forEach((el) => el.classList.remove(className));
    }
  }

  function clearLayoutStructureClasses() {
    const classes = [
      'BetterX-layout-primary', 'BetterX-layout-row', 'BetterX-layout-main',
      'BetterX-layout-shell', 'BetterX-layout-left-width-target',
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
    if (primary && !primary.classList.contains('BetterX-layout-primary')) {
      const width = Math.round(primary.getBoundingClientRect().width);
      if (width >= 300 && width <= 3000) state.detectedTimelineWidth = width;
    }
    if (leftWidthTarget && !leftWidthTarget.classList.contains('BetterX-layout-left-width-target')) {
      const width = Math.round(leftWidthTarget.getBoundingClientRect().width);
      if (width >= 120 && width <= 600) state.detectedLeftbarWidth = width;
    }
    updateDetectedLayoutWidthInputs();
  }

  function bindLayoutStructureClasses(elements, needsStructure, expandCenter, manualWidth) {
    clearLayoutStructureClasses();
    if (!needsStructure) return;
    const { primary, main, row, leftWidthTarget } = elements;
    if (primary) primary.classList.add('BetterX-layout-primary');
    if (row) row.classList.add('BetterX-layout-row');
    if (main) main.classList.add('BetterX-layout-main');
    if (manualWidth && leftWidthTarget) leftWidthTarget.classList.add('BetterX-layout-left-width-target');
    if (expandCenter && main) {
      // 隐藏任意侧栏后，从主列同级行一直贯通到 #react-root，释放剩余空间的宽度限制。
      let ancestor = row ? row.parentElement : main.parentElement;
      while (ancestor && ancestor !== document.body) {
        if (ancestor !== main) ancestor.classList.add('BetterX-layout-shell');
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
      '.BetterX-layout-clean-hidden, .BetterX-layout-showmore-hidden { display: none !important; }',
    ];

    if (hideLeftbar) rules.push('header[role="banner"] { display: none !important; }');
    if (hideSidebar) rules.push('[data-testid="sidebarColumn"] { display: none !important; }');

    // X 新版布局中只改 header 内层 div 不一定会释放左栏占位；手动模式同时约束外层 header。
    if (!autoWidth && !hideLeftbar) {
      rules.push(`
        header[role="banner"] {
          box-sizing: border-box !important;
          width: ${leftbarWidth}px !important;
          min-width: ${leftbarWidth}px !important;
          max-width: ${leftbarWidth}px !important;
          flex: 0 0 ${leftbarWidth}px !important;
        }
        header[role="banner"] > div,
        header[role="banner"] > div > div,
        .BetterX-layout-left-width-target {
          box-sizing: border-box !important;
          width: ${leftbarWidth}px !important;
          min-width: 0 !important;
          max-width: ${leftbarWidth}px !important;
        }
      `);
      if (leftbarWidth <= 120) {
        rules.push(`
          /* 窄左栏进入仅图标模式，避免 X 的文字标签撑回原宽度。 */
          header[role="banner"] nav[role="navigation"] a[role="link"] div[dir="ltr"],
          header[role="banner"] nav[role="navigation"] [data-testid="AppTabBar_More_Menu"] div[dir="ltr"],
          header[role="banner"] [data-testid="SideNav_AccountSwitcher_Button"] div[dir="ltr"],
          header[role="banner"] [data-testid="SideNav_NewTweet_Button"] span {
            display: none !important;
          }
          header[role="banner"] nav[role="navigation"] a[role="link"],
          header[role="banner"] nav[role="navigation"] [data-testid="AppTabBar_More_Menu"],
          header[role="banner"] [data-testid="SideNav_AccountSwitcher_Button"],
          header[role="banner"] [data-testid="SideNav_NewTweet_Button"] {
            box-sizing: border-box !important;
            max-width: ${Math.max(44, leftbarWidth)}px !important;
          }
        `);
      }
    }

    if (expandCenter) {
      rules.push(`
        .BetterX-layout-shell {
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          margin-inline: 0 !important;
        }
        .BetterX-layout-main {
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          flex: 1 1 0% !important; margin-inline: auto !important;
        }
        .BetterX-layout-row {
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          margin-inline: auto !important;
        }
        .BetterX-layout-primary {
          width: auto !important; max-width: none !important; min-width: 0 !important;
          flex: 1 1 0% !important; margin-inline: 0 !important;
        }
        .BetterX-layout-primary > div,
        .BetterX-layout-primary > div > div,
        .BetterX-layout-primary .r-1ye8kvj,
        .BetterX-layout-primary [data-testid="cellInnerDiv"],
        .BetterX-layout-primary [data-testid="cellInnerDiv"] > div,
        .BetterX-layout-primary [data-testid="cellInnerDiv"] article,
        .BetterX-layout-primary [data-testid="cellInnerDiv"] article > div {
          box-sizing: border-box !important;
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          margin-inline: 0 !important;
        }
      `);
      if (hideSidebar && !hideLeftbar) {
        rules.push(`
          /* 右栏消失后让“左栏 + 主列”从视口左边开始，避免外层居中布局留下大块空白。 */
          .BetterX-layout-shell {
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
        .BetterX-layout-main { max-width: none !important; min-width: 0 !important; flex: 1 1 auto !important; }
        .BetterX-layout-row { width: max-content !important; max-width: none !important; margin-inline: auto !important; }
        .BetterX-layout-primary {
          width: ${timelineWidth}px !important; max-width: none !important;
          flex: 0 0 ${timelineWidth}px !important; margin-inline: auto !important;
        }
        .BetterX-layout-left-width-target { width: ${leftbarWidth}px !important; }
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
    document.querySelectorAll('.BetterX-layout-clean-hidden').forEach((el) => el.classList.remove('BetterX-layout-clean-hidden'));
    if (state.settings.layoutCleanNavigation !== false) {
      document.querySelectorAll('nav[role="navigation"] div[dir="ltr"]').forEach((item) => {
        const label = (item.textContent || '').trim();
        if (!LAYOUT_NAV_LABELS.has(label)) return;
        const target = item.closest('a, div[role="link"]');
        if (target) target.classList.add('BetterX-layout-clean-hidden');
      });
      for (const label of LAYOUT_SUBSCRIBE_LABELS) {
        document.querySelectorAll(`[aria-label="${label}"]`).forEach((el) => el.classList.add('BetterX-layout-clean-hidden'));
      }
      document.querySelectorAll('[data-testid="super-upsell-UpsellCardRenderProperties"]').forEach((el) => el.classList.add('BetterX-layout-clean-hidden'));
      document.querySelectorAll('nav[role="navigation"][aria-label]').forEach((nav) => {
        if (LAYOUT_FOOTER_LABELS.has((nav.getAttribute('aria-label') || '').trim())) nav.classList.add('BetterX-layout-clean-hidden');
      });
    }

    document.querySelectorAll('.BetterX-layout-showmore-hidden').forEach((el) => el.classList.remove('BetterX-layout-showmore-hidden'));
    if (state.settings.layoutHideShowMore) {
      document.querySelectorAll('article a[role="link"]').forEach((link) => {
        if (LAYOUT_SHOW_MORE_LABELS.has((link.textContent || '').trim())) link.classList.add('BetterX-layout-showmore-hidden');
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
    const timelineWidth = clampInt(state.settings.timelineWidth, 100, 3000, DEFAULT_SETTINGS.timelineWidth);
    const leftbarWidth = clampInt(state.settings.leftbarWidth, 50, 500, DEFAULT_SETTINGS.leftbarWidth);
    const fillCenter = !!state.settings.layoutFillCenter;
    const hideLeftbar = fillCenter || !!state.settings.layoutHideLeftbar;
    const hideSidebar = fillCenter || !!state.settings.layoutHideSidebar;
    const expandCenter = hideLeftbar || hideSidebar;
    const needsStructure = expandCenter || !autoWidth;
    let elements = getLayoutElements();
    // 从手动宽度切回纯自动模式时，先同步撤销旧结构规则，再读取真正的原生尺寸。
    if (autoWidth && !needsStructure && elements.primary && elements.primary.classList.contains('BetterX-layout-primary')) {
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
    const customRulesEnabled = state.settings.adultSpamCustomRulesEnabled !== false;
    const whitelist = customRulesEnabled ? (state.settings.adultSpamWhitelist || []) : [];
    if (input.username && whitelist.includes(input.username)) {
      return { hidden: false, score: 0, reasons: ['账号白名单'] };
    }
    if (customRulesEnabled) {
      for (const customTerm of state.settings.adultSpamKeywords || []) {
        const normalizedTerm = normalizeAdultSpamText(customTerm);
        const compactTerm = compactAdultSpamText(customTerm);
        if ((normalizedTerm && normalized.includes(normalizedTerm)) || (compactTerm && compact.includes(compactTerm))) {
          return { hidden: true, score: 99, reasons: [`自定义词：${customTerm}`] };
        }
      }
    }

    if (!state.settings.hideAdultSpam) return { hidden: false, score: 0, reasons: [] };

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
    if (!article || !article.isConnected || article.classList.contains('BetterX-adult-spam-hidden')) return null;
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
      target.classList.add('BetterX-adult-spam-hidden');
      target.dataset.BetterXAdultSpamReason = `${decision.score} 分：${decision.reasons.join('、')}`;
    } else {
      target.classList.remove('BetterX-adult-spam-hidden');
      delete target.dataset.BetterXAdultSpamReason;
    }
    return decision.hidden;
  }

  function evaluateAndApplyAdultSpam(article) {
    if (!adultSpamFilteringEnabled() || !article || !article.querySelector) return false;
    const input = getAdultSpamInput(article);
    const statusId = extractStatusIdFromUrl(getStatusLink(article)) || '';
    const fingerprint = `${statusId}\n${input.username}\n${input.rawUsername}\n${input.displayName}\n${input.repostContext}\n${input.isRepost}\n${input.reposterUsername}\n${input.text}\n${input.externalLinkCount}\n${input.mentionCount}\n${input.hasMedia}\n${input.isFollowingTimeline}`;
    const statsKey = statusId || fingerprint;
    adultSpamScannedIdsCapped = addBoundedSessionStat(
      adultSpamScannedIds, statsKey, adultSpamScannedIdsCapped
    );
    const cached = adultSpamCache.get(article);
    if (cached && cached.version === adultSpamRulesVersion && cached.fingerprint === fingerprint) {
      return setAdultSpamHidden(article, cached.decision);
    }
    const decision = scoreAdultSpam(input);
    adultSpamCache.set(article, { version: adultSpamRulesVersion, fingerprint, decision });
    const hidden = setAdultSpamHidden(article, decision);
    if (hidden) {
      adultSpamSessionHiddenIdsCapped = addBoundedSessionStat(
        adultSpamSessionHiddenIds, statsKey, adultSpamSessionHiddenIdsCapped
      );
    }
    if (hidden) debugLog('内容净化已隐藏帖子', statusId || '(无 ID)', decision.score, decision.reasons);
    return hidden;
  }

  function updateAdultSpamCount() {
    if (!state.adultSpamCountEl) return;
    const currentCount = document.querySelectorAll('.BetterX-adult-spam-hidden').length;
    const hiddenCount = `${adultSpamSessionHiddenIds.size}${adultSpamSessionHiddenIdsCapped ? '+' : ''}`;
    const scannedCount = `${adultSpamScannedIds.size}${adultSpamScannedIdsCapped ? '+' : ''}`;
    state.adultSpamCountEl.textContent = `当前隐藏 ${currentCount} · 本次累计 ${hiddenCount} · 已扫描 ${scannedCount} · 已识别关注 ${followedHandles.size}`;
  }

  function unhideAdultSpam() {
    document.querySelectorAll('.BetterX-adult-spam-hidden').forEach((el) => {
      el.classList.remove('BetterX-adult-spam-hidden');
      delete el.dataset.BetterXAdultSpamReason;
    });
    updateAdultSpamCount();
  }

  function sweepAdultSpam() {
    if (!adultSpamFilteringEnabled()) return;
    harvestFollowingControlsFromRoot(document);
    document.querySelectorAll('article').forEach(evaluateAndApplyAdultSpam);
    updateAdultSpamCount();
  }

  function applyAdultSpamFiltering() {
    const anchors = captureAdultSpamScrollAnchors();
    if (adultSpamFilteringEnabled()) {
      // 直接按新判定更新差异，不再“全部显示 → 全部隐藏”，避免规则刷新时整页闪烁。
      sweepAdultSpam();
    } else {
      unhideAdultSpam();
    }
    stabilizeAdultSpamScroll(anchors);
  }

  function adultSpamFilteringEnabled() {
    const hasCustomKeywords = state.settings.adultSpamCustomRulesEnabled !== false
      && (state.settings.adultSpamKeywords || []).length > 0;
    return !!(state.settings.hideAdultSpam || hasCustomKeywords);
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
    if (adultSpamFilteringEnabled() && evaluateAndApplyAdultSpam(article)) return;
    if (!isProbablyPostArticle(article)) return;
    const url = getStatusLink(article);
    const id = extractStatusIdFromUrl(url);
    if (!id) return;

    const sourceInfo = getCurrentSourceInfo();
    if ((state.settings.skipSources || []).includes(sourceInfo.type)) return;

    const isFirstVisibleCapture = !state.visibleMap.has(id);
    const author = extractAuthor(article);
    const text = extractText(article);
    const media = detectMedia(article, id);
    const avatarUrl = extractAvatar(article);

    if (isFirstVisibleCapture) {
      upsertPost({
        id, url,
        displayName: author.displayName,
        username: author.username,
        timeLabel: author.timeLabel,
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
          (author.displayName && existing.displayName !== author.displayName) ||
          (author.username && existing.username !== author.username) ||
          (author.timeLabel && existing.timeLabel !== author.timeLabel) ||
          (!(existing.mediaThumbs || []).length && media.thumbs.length) ||
          (!existing.avatarUrl && avatarUrl) ||
          existing.hasImage !== media.hasImage ||
          existing.hasVideo !== media.hasVideo ||
          existing.sourceLabel !== sourceInfo.label ||
          existing.url !== url;
        if (needsPatch) {
          upsertPost({
            ...existing,
            url,
            displayName: author.displayName || existing.displayName,
            username: author.username || existing.username,
            timeLabel: author.timeLabel || existing.timeLabel || '',
            text: existing.text || text,
            hasImage: media.hasImage,
            hasVideo: media.hasVideo,
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
    if (state.settings.hideAds) sweepStandaloneAds(scope);
    scope.querySelectorAll('article').forEach(captureArticle);
    if (state.settings.mediaDownload) injectDownloadButtons(scope);
    if (state.settings.restoreMediaGrid) applyMediaGridLayout(scope);
    if (state.settings.bypassAgeRestriction) revealAgeRestricted(scope);
    if (adultSpamFilteringEnabled()) updateAdultSpamCount();
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

    if (state.downloadPopoverEl && !state.downloadPopoverEl.hidden
      && !target.closest('#BetterX-download-popover') && !target.closest('#BetterX-download-pill')) {
      toggleDownloadPopover(false);
    }

    if (state.panelOpen && !target.closest('#BetterX-root')) {
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
      state.panelEl.querySelectorAll('.BetterX-settings-card[open]').forEach((detailsEl) => {
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
          const onlyVideoThumbs = mediaThumbs.length > 0 && mediaThumbs.every((u) => /(?:ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)/i.test(u));
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
      window.alert(`导入完成：新增 ${added} 条，合并 ${merged} 条，跳过 ${skipped} 条无效记录${trimmedMessage}。`);
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

  function repositionBadge() {
    if (!state.badgeEl || !state.rootEl) return;
    const isMobile = isMobileBadgeViewport();
    const hideDesktopBadge = !isMobile && !!state.settings.hideAppBadgeOnDesktop;
    state.rootEl.classList.toggle('BetterX-desktop-badge-hidden', hideDesktopBadge);
    const useIconBadge = isMobile || !!state.settings.useMobileBadgeOnDesktop;
    state.badgeEl.classList.toggle('mobile-mode', useIconBadge);
    state.badgeEl.classList.toggle('desktop-icon-mode', !isMobile && useIconBadge);
    if (isMobile) {
      state.rootEl.classList.add('BetterX-mobile');
      syncMobileBadgeToComposeButton();
    } else {
      stopMobileComposeTracking();
      state.rootEl.classList.remove('BetterX-mobile');
      state.rootEl.classList.remove('BetterX-mobile-badge-inactive');
      state.rootEl.style.removeProperty('--xv-mobile-badge-opacity');
      state.rootEl.style.left = '';
      state.rootEl.style.right = '';
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

    badge.addEventListener('dragstart', (e) => e.preventDefault());

    badge.addEventListener('pointerdown', (e) => {
      if (state.rootEl && state.rootEl.classList.contains('BetterX-mobile')) return;
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
  function handleDownloadPopoverAction(event, downloadPopover) {
    if (!event || !downloadPopover) return false;
    if (event.type === 'pointerdown' && Number.isFinite(event.button) && event.button !== 0) return false;
    const actionEl = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
    if (!actionEl || !downloadPopover.contains(actionEl)) return false;
    const action = actionEl.getAttribute('data-action');
    if (action !== 'download-cancel' && action !== 'download-retry') return false;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    const jobId = actionEl.getAttribute('data-job-id');
    if (action === 'download-cancel') cancelDownloadJob(jobId);
    else retryDownloadJob(jobId);
    return true;
  }

  function renderAdultSpamKeywordTags() {
    if (!state.adultSpamKeywordTagsEl) return;
    state.adultSpamKeywordTagsEl.textContent = '';
    for (const keyword of state.settings.adultSpamKeywords || []) {
      const tag = document.createElement('span');
      tag.className = 'BetterX-keyword-tag';
      const label = document.createElement('span');
      label.className = 'BetterX-keyword-tag-label';
      label.textContent = keyword;
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'BetterX-keyword-tag-remove';
      removeButton.setAttribute('data-action', 'remove-adultspam-keyword');
      removeButton.setAttribute('data-keyword', keyword);
      removeButton.setAttribute('aria-label', `删除屏蔽词 ${keyword}`);
      removeButton.title = `删除“${keyword}”`;
      removeButton.textContent = '×';
      tag.appendChild(label);
      tag.appendChild(removeButton);
      state.adultSpamKeywordTagsEl.appendChild(tag);
    }
  }

  function commitAdultSpamKeywordInput() {
    if (!state.adultSpamKeywordsEl) return false;
    const pending = parseKeywords(state.adultSpamKeywordsEl.value)
      .map((item) => item.slice(0, 80));
    if (!pending.length) {
      state.adultSpamKeywordsEl.value = '';
      return false;
    }
    const current = state.settings.adultSpamKeywords || [];
    const combined = uniqueStrings([...current, ...pending]);
    const next = combined.slice(0, 50);
    state.adultSpamKeywordsEl.value = '';
    if (next.length === current.length && next.every((item, index) => item === current[index])) return false;
    setSettingsPartial({ adultSpamKeywords: next });
    if (combined.length > next.length) showToast('最多保存 50 个自定义屏蔽词');
    return true;
  }

  function renderAdultSpamWhitelistTags() {
    if (!state.adultSpamWhitelistTagsEl) return;
    state.adultSpamWhitelistTagsEl.textContent = '';
    for (const username of state.settings.adultSpamWhitelist || []) {
      const tag = document.createElement('span');
      tag.className = 'BetterX-keyword-tag';
      const label = document.createElement('span');
      label.className = 'BetterX-keyword-tag-label';
      label.textContent = '@' + username;
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'BetterX-keyword-tag-remove';
      removeButton.setAttribute('data-action', 'remove-adultspam-whitelist');
      removeButton.setAttribute('data-username', username);
      removeButton.setAttribute('aria-label', `删除白名单账号 @${username}`);
      removeButton.title = `删除“@${username}”`;
      removeButton.textContent = '×';
      tag.appendChild(label);
      tag.appendChild(removeButton);
      state.adultSpamWhitelistTagsEl.appendChild(tag);
    }
  }

  function commitAdultSpamWhitelistInput() {
    if (!state.adultSpamWhitelistEl) return false;
    const pending = parseAdultSpamWhitelist(state.adultSpamWhitelistEl.value).slice(0, 100);
    state.adultSpamWhitelistEl.value = '';
    if (!pending.length) return false;
    const adultSpamWhitelist = uniqueStrings([
      ...(state.settings.adultSpamWhitelist || []),
      ...pending,
    ]).slice(0, 100);
    setSettingsPartial({ adultSpamWhitelist });
    return true;
  }

  function createUI() {
    const root = document.createElement('div');
    root.id = 'BetterX-root';

    const badge = document.createElement('button');
    badge.id = 'BetterX-badge';
    badge.type = 'button';
    badge.textContent = '更好的 X（BetterX）';

    const panel = document.createElement('div');
    panel.id = 'BetterX-panel';
    panel.style.display = 'none';
    panel.innerHTML = `
      <div class="BetterX-header">
        <div class="BetterX-title">
          <div class="BetterX-title-main">
            ${APP_ICON_URL ? `<img class="BetterX-title-icon" src="${escapeHtml(APP_ICON_URL)}" alt="" draggable="false" />` : ''}
            <span>更好的 X</span>
          </div>
          <div class="BetterX-title-sub">BetterX · Alt+X 开关</div>
        </div>
        <div class="BetterX-header-actions">
          <button class="BetterX-btn BetterX-vault-action" data-action="refresh" title="重新扫描当前页面">刷新</button>
          <button class="BetterX-btn BetterX-vault-action" data-action="mark-all-read" title="把当前列表全部标为已读">全部已读</button>
          <div class="BetterX-menu-wrap">
            <button class="BetterX-btn BetterX-icon-btn" data-action="menu-toggle" aria-label="更多" title="更多">⋯</button>
            <div class="BetterX-menu" id="BetterX-menu" hidden>
              <button class="BetterX-menu-item" data-action="export">📤 导出筛选</button>
              <button class="BetterX-menu-item" data-action="backup">💾 备份全部</button>
              <button class="BetterX-menu-item" data-action="import">📥 导入</button>
              <button class="BetterX-menu-item danger" data-action="clear-non-fav">🗑️ 清空</button>
            </div>
          </div>
          <button class="BetterX-btn BetterX-icon-btn" data-action="close" aria-label="关闭" title="关闭">✕</button>
        </div>
      </div>

      <div class="BetterX-tabs" role="tablist" aria-label="BetterX 面板">
        <button class="BetterX-tab active" type="button" role="tab" aria-selected="true" data-action="set-panel-view" data-view="vault">帖子</button>
        <button class="BetterX-tab" type="button" role="tab" aria-selected="false" data-action="set-panel-view" data-view="settings">设置</button>
      </div>

      <section class="BetterX-view BetterX-vault-view" data-view-panel="vault">
      <div class="BetterX-vault-toolbar">

      <div class="BetterX-tip">提示：列表仅记录你浏览时出现过的帖子。收藏/置顶的帖子不会被上限删除或自动清理。</div>

      <div class="BetterX-summary" id="BetterX-summary"></div>
      <div class="BetterX-section-label">快速筛选</div>
      <div class="BetterX-filter-bar" id="BetterX-filter-bar"></div>

      <div class="BetterX-search-tools">
        <input type="text" class="BetterX-input" id="BetterX-search" placeholder="搜索作者、正文或备注…" aria-label="搜索帖子" />
        <div class="BetterX-toolbar-row">
          <select class="BetterX-select" id="BetterX-source" aria-label="来源筛选"></select>
          <select class="BetterX-select" id="BetterX-media" aria-label="媒体筛选"></select>
          <select class="BetterX-select" id="BetterX-sort" aria-label="排序方式">
            <option value="default">默认排序</option>
            <option value="time_asc">最早先看</option>
            <option value="captures">出现次数</option>
            <option value="author">按作者</option>
            <option value="source">按来源</option>
          </select>
        </div>
      </div>
      </div>
      <div class="BetterX-list" id="BetterX-list"></div>
      </section>

      <section class="BetterX-view BetterX-settings-view" data-view-panel="settings" hidden>
      <div class="BetterX-settings-scroll">
        <div class="BetterX-settings-intro">
          <strong>设置</strong>
          <span>修改会立即生效；需要手动保存的项目仍保留应用按钮。</span>
        </div>
      <div class="BetterX-controls">
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>关键词与排除词</summary>
          <div class="BetterX-adv-body">
            <div class="BetterX-adv-label">仅作用于已记录的帖子：关键词用于高亮与筛选；排除词命中后会从列表隐藏。</div>
            <div class="BetterX-row">
              <input type="text" class="BetterX-input" id="BetterX-keywords" placeholder="关键词（逗号分隔）" />
              <select class="BetterX-select" id="BetterX-keyword-mode">
                <option value="plain">任意匹配</option>
                <option value="and">全部匹配</option>
                <option value="regex">正则</option>
              </select>
              <button class="BetterX-btn primary" data-action="save-keywords">保存</button>
            </div>
            <div class="BetterX-row">
              <input type="text" class="BetterX-input" id="BetterX-exclude" placeholder="排除词（命中则隐藏，逗号分隔）" />
              <button class="BetterX-btn" data-action="save-exclude">保存</button>
            </div>
          </div>
        </details>
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>内容净化</summary>
          <div class="BetterX-adv-body">
            <div class="BetterX-row BetterX-adultspam-master-row">
              <label class="BetterX-field inline"><input type="checkbox" id="BetterX-hide-adult-spam" /> 隐藏黄推 / 成人引流机器人</label>
              <select class="BetterX-select" id="BetterX-adultspam-level" title="检测强度">
                <option value="balanced">均衡</option>
                <option value="conservative">保守</option>
              </select>
            </div>
            <div class="BetterX-dependent-options" id="BetterX-adultspam-auto-options">
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-adultspam-skip-following" /> 不审查已关注账号（转发内容除外）</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-adultspam-skip-following-reposts" /> 不审查已关注账号的转发内容</label>
            <div class="BetterX-adv-label">使用多信号评分，只隐藏当前页面 DOM，不改写网络响应、不自动拉黑账号；关闭开关即可恢复。</div>
            </div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-adultspam-custom-enabled" /> 启用自定义规则（屏蔽词与账号白名单）</label>
            <div class="BetterX-dependent-options" id="BetterX-adultspam-custom-options">
            <div class="BetterX-tag-editor">
              <div class="BetterX-keyword-tags" id="BetterX-adultspam-keyword-tags"></div>
              <input type="text" class="BetterX-input" id="BetterX-adultspam-keywords" placeholder="输入自定义屏蔽词，按回车添加" maxlength="500" />
            </div>
            <div class="BetterX-tag-editor">
              <div class="BetterX-keyword-tags" id="BetterX-adultspam-whitelist-tags"></div>
              <input type="text" class="BetterX-input" id="BetterX-adultspam-whitelist" placeholder="输入账号白名单（如 @example），按回车添加" maxlength="500" />
            </div>
            <div class="BetterX-row">
              <button class="BetterX-btn primary" data-action="save-adultspam">保存规则</button>
            </div>
            </div>
            <div class="BetterX-content-status" id="BetterX-adultspam-count">当前隐藏 0 · 本次累计 0 · 已扫描 0 · 已识别关注 0</div>
          </div>
        </details>
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>界面简化与宽屏</summary>
          <div class="BetterX-adv-body">
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-enabled" /> 启用界面简化与宽屏</label>
            <div class="BetterX-dependent-options" id="BetterX-layout-options">
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-auto-width" /> 自动读取 X 当前的时间线与左侧栏宽度（默认开启）</label>
            <div class="BetterX-row BetterX-control-row">
              <label class="BetterX-field">时间线宽度(px)
                <input type="number" min="100" max="3000" class="BetterX-input small" id="BetterX-timeline-width" />
              </label>
              <label class="BetterX-field">左侧栏宽度(px)
                <input type="number" min="50" max="500" class="BetterX-input small" id="BetterX-leftbar-width" />
              </label>
              <button class="BetterX-btn primary" data-action="save-layout">应用宽度</button>
            </div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-hide-leftbar" /> 隐藏左侧栏</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-hide-sidebar" /> 隐藏右侧栏</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-fill-center" /> 中间栏填满（启用时同时隐藏左右栏）</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-clean-nav" /> 精简导航、Premium 推广与页脚</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-hide-message" /> 隐藏右下消息栏 / Grok</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-hide-showmore" /> 隐藏帖子“显示更多”（可能影响长文展开，默认关闭）</label>
            <div class="BetterX-adv-label">消息页和设置页自动停用版面调整；所有改动均可关闭恢复。</div>
            </div>
          </div>
        </details>
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>高级设置</summary>
          <div class="BetterX-adv-body">
            <div class="BetterX-row">
              <label class="BetterX-field">自动清理(天)
                <input type="number" min="0" class="BetterX-input small" id="BetterX-autoclean" />
              </label>
              <label class="BetterX-field">最大条数
                <input type="number" min="50" class="BetterX-input small" id="BetterX-maxposts" />
              </label>
              <label class="BetterX-field">闪现阈值(秒)
                <input type="number" min="1" class="BetterX-input small" id="BetterX-flashms" />
              </label>
              <label class="BetterX-field">主题
                <select class="BetterX-select" id="BetterX-theme">
                  <option value="auto">跟随系统</option>
                  <option value="dark">深色</option>
                  <option value="light">浅色</option>
                </select>
              </label>
            </div>
            <div class="BetterX-row BetterX-control-row">
              <label class="BetterX-field">下载超时(秒)
                <input type="number" min="5" class="BetterX-input small" id="BetterX-dltimeout" />
              </label>
              <label class="BetterX-field">下载并发
                <input type="number" min="1" max="6" step="1" class="BetterX-input small" id="BetterX-dlconcurrency" />
              </label>
              <label class="BetterX-field inline"><input type="checkbox" id="BetterX-markread" /> 点帖子空白处算已读</label>
              <button class="BetterX-btn primary" data-action="save-advanced">应用</button>
            </div>
            <div class="BetterX-adv-label">下载并发可设为 1～6，默认 2；调高会加快多媒体任务，但也会增加带宽与内存占用。</div>
            <div class="BetterX-adv-label">不记录以下来源：</div>
            <div class="BetterX-chip-row" id="BetterX-skip-sources"></div>
          </div>
        </details>
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>常用功能</summary>
          <div class="BetterX-adv-body">
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-hideads" /> 关闭广告（隐藏推广帖和独立广告位）</label>
            <div class="BetterX-adv-label">开启后自动隐藏时间线推广帖及 X 新增的程序化广告卡片；推广帖不会记录，关闭开关即可恢复显示。</div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-mediadl" /> 一键下载图片 / 视频 / GIF（多文件自动压缩ZIP包）</label>
            <div class="BetterX-adv-label">开启后帖子操作栏会显示下载进度与取消按钮；桌面端会显示下载任务胶囊，移动端则会显示带任务数气泡的蓝色下载按钮。</div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-restore-media-grid" /> 帖子内媒体改为网格视图</label>
            <div class="BetterX-adv-label">将 X 新版的多媒体正文轮播改为网格展示；两张并排，三张为左大右二，四张为 2×2 网格。</div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-bypassage" /> 取消年龄限制（用原图 / 视频进行替换）</label>
            <div class="BetterX-adv-label">不显示的话，请稍等；实在不行，请重新关开按钮；仅本地操作，不改动账号设置。</div>
          </div>
        </details>
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>其他功能</summary>
          <div class="BetterX-adv-body">
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-firefox-compat" /> 兼容 Firefox（仅 Firefox）</label>
            <div class="BetterX-adv-label">遇到页面一直卡在只显示 X 图标时开启；会停用页面网络 Hook，点击开关可查看具体影响。</div>
            <label class="BetterX-field inline BetterX-desktop-only-setting"><input type="checkbox" id="BetterX-hide-app-badge" /> 隐藏应用徽标（仅 PC）</label>
            <div class="BetterX-adv-label BetterX-desktop-only-setting">隐藏后仍可使用 Alt+X 打开面板，也可通过油猴菜单“显示 / 隐藏应用徽标”恢复。</div>
            <label class="BetterX-field inline BetterX-desktop-only-setting"><input type="checkbox" id="BetterX-desktop-mobile-badge" /> 切换为移动端徽标（仅 PC）</label>
            <div class="BetterX-adv-label BetterX-desktop-only-setting">使用圆形脚本图标与未读角标，并继续支持桌面端拖拽。</div>
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

    const downloadPill = document.createElement('button');
    downloadPill.id = 'BetterX-download-pill';
    downloadPill.type = 'button';
    downloadPill.hidden = true;
    downloadPill.setAttribute('aria-label', '查看下载任务');
    downloadPill.title = '查看下载任务';
    downloadPill.innerHTML = `
      <span class="BetterX-download-pill-icon" aria-hidden="true">⬇</span>
      <span class="BetterX-download-pill-label"></span>
      <span class="BetterX-download-pill-count" hidden></span>
    `;

    const downloadPopover = document.createElement('div');
    downloadPopover.id = 'BetterX-download-popover';
    downloadPopover.hidden = true;
    downloadPopover.setAttribute('role', 'status');

    root.appendChild(panel);
    root.appendChild(badge);
    root.appendChild(downloadPill);
    root.appendChild(downloadPopover);
    root.appendChild(fileInput);
    document.body.appendChild(root);

    state.rootEl = root;
    state.badgeEl = badge;
    state.panelEl = panel;
    state.downloadPillEl = downloadPill;
    state.downloadPopoverEl = downloadPopover;
    state.importInputEl = fileInput;
    state.listEl = panel.querySelector('#BetterX-list');
    state.summaryEl = panel.querySelector('#BetterX-summary');
    state.filterBarEl = panel.querySelector('#BetterX-filter-bar');
    state.sourceSelectEl = panel.querySelector('#BetterX-source');
    state.mediaSelectEl = panel.querySelector('#BetterX-media');
    state.keywordInputEl = panel.querySelector('#BetterX-keywords');
    state.excludeInputEl = panel.querySelector('#BetterX-exclude');
    state.keywordModeEl = panel.querySelector('#BetterX-keyword-mode');
    state.searchEl = panel.querySelector('#BetterX-search');
    state.sortEl = panel.querySelector('#BetterX-sort');
    state.autoCleanInputEl = panel.querySelector('#BetterX-autoclean');
    state.maxPostsInputEl = panel.querySelector('#BetterX-maxposts');
    state.flashMsInputEl = panel.querySelector('#BetterX-flashms');
    state.dlTimeoutInputEl = panel.querySelector('#BetterX-dltimeout');
    state.dlConcurrencyInputEl = panel.querySelector('#BetterX-dlconcurrency');
    state.markReadEl = panel.querySelector('#BetterX-markread');
    state.themeSelectEl = panel.querySelector('#BetterX-theme');
    state.skipSourcesEl = panel.querySelector('#BetterX-skip-sources');
    state.hideAdsEl = panel.querySelector('#BetterX-hideads');
    state.hideAdultSpamEl = panel.querySelector('#BetterX-hide-adult-spam');
    state.adultSpamCustomRulesEl = panel.querySelector('#BetterX-adultspam-custom-enabled');
    state.adultSpamLevelEl = panel.querySelector('#BetterX-adultspam-level');
    state.adultSpamSkipFollowingEl = panel.querySelector('#BetterX-adultspam-skip-following');
    state.adultSpamSkipFollowingRepostsEl = panel.querySelector('#BetterX-adultspam-skip-following-reposts');
    state.adultSpamKeywordsEl = panel.querySelector('#BetterX-adultspam-keywords');
    state.adultSpamKeywordTagsEl = panel.querySelector('#BetterX-adultspam-keyword-tags');
    state.adultSpamWhitelistEl = panel.querySelector('#BetterX-adultspam-whitelist');
    state.adultSpamWhitelistTagsEl = panel.querySelector('#BetterX-adultspam-whitelist-tags');
    state.adultSpamCountEl = panel.querySelector('#BetterX-adultspam-count');
    state.layoutEnabledEl = panel.querySelector('#BetterX-layout-enabled');
    state.layoutAutoWidthEl = panel.querySelector('#BetterX-layout-auto-width');
    state.timelineWidthEl = panel.querySelector('#BetterX-timeline-width');
    state.leftbarWidthEl = panel.querySelector('#BetterX-leftbar-width');
    state.layoutHideLeftbarEl = panel.querySelector('#BetterX-layout-hide-leftbar');
    state.layoutHideSidebarEl = panel.querySelector('#BetterX-layout-hide-sidebar');
    state.layoutFillCenterEl = panel.querySelector('#BetterX-layout-fill-center');
    state.layoutCleanNavigationEl = panel.querySelector('#BetterX-layout-clean-nav');
    state.layoutHideMessageGrokEl = panel.querySelector('#BetterX-layout-hide-message');
    state.layoutHideShowMoreEl = panel.querySelector('#BetterX-layout-hide-showmore');
    state.firefoxCompatibilityEl = panel.querySelector('#BetterX-firefox-compat');
    state.mediaDownloadEl = panel.querySelector('#BetterX-mediadl');
    state.restoreMediaGridEl = panel.querySelector('#BetterX-restore-media-grid');
    state.bypassAgeEl = panel.querySelector('#BetterX-bypassage');
    state.useMobileBadgeOnDesktopEl = panel.querySelector('#BetterX-desktop-mobile-badge');
    state.hideAppBadgeOnDesktopEl = panel.querySelector('#BetterX-hide-app-badge');
    state.menuEl = panel.querySelector('#BetterX-menu');

    state.mediaSelectEl.innerHTML = buildMediaOptionsHtml();

    badge.addEventListener('click', () => togglePanel());
    downloadPill.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleDownloadPopover();
    });
    // 长视频会高频刷新任务 DOM；PC 的 click 可能在按下与松开之间因按钮被替换而丢失。
    // pointerdown 立即执行鼠标/触摸操作，click 则保留给键盘辅助操作兜底。
    downloadPopover.addEventListener('pointerdown', (event) => handleDownloadPopoverAction(event, downloadPopover), true);
    downloadPopover.addEventListener('click', (event) => handleDownloadPopoverAction(event, downloadPopover), true);
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
    state.adultSpamCustomRulesEl.addEventListener('change', (e) => {
      setSettingsPartial({ adultSpamCustomRulesEnabled: !!e.target.checked });
    });
    state.adultSpamLevelEl.addEventListener('change', (e) => setSettingsPartial({ adultSpamLevel: e.target.value }));
    state.adultSpamSkipFollowingEl.addEventListener('change', (e) => setSettingsPartial({ adultSpamSkipFollowing: !!e.target.checked }));
    state.adultSpamSkipFollowingRepostsEl.addEventListener('change', (e) => {
      setSettingsPartial({ adultSpamSkipFollowingReposts: !!e.target.checked });
    });
    state.adultSpamKeywordsEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      commitAdultSpamKeywordInput();
    });
    state.adultSpamKeywordsEl.addEventListener('blur', () => commitAdultSpamKeywordInput());
    state.adultSpamWhitelistEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      commitAdultSpamWhitelistInput();
    });
    state.adultSpamWhitelistEl.addEventListener('blur', () => commitAdultSpamWhitelistInput());
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
    state.restoreMediaGridEl.addEventListener('change', (e) => setSettingsPartial({ restoreMediaGrid: !!e.target.checked }));
    state.bypassAgeEl.addEventListener('change', (e) => setSettingsPartial({ bypassAgeRestriction: !!e.target.checked }));
    state.useMobileBadgeOnDesktopEl.addEventListener('change', (e) => {
      setSettingsPartial({ useMobileBadgeOnDesktop: !!e.target.checked });
    });
    state.hideAppBadgeOnDesktopEl.addEventListener('change', (e) => {
      setSettingsPartial({ hideAppBadgeOnDesktop: !!e.target.checked });
      if (e.target.checked) showToast('应用徽标已隐藏 · Alt+X 或油猴菜单可恢复');
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
        case 'download-cancel':
          cancelDownloadJob(actionEl.getAttribute('data-job-id'));
          break;
        case 'download-retry':
          retryDownloadJob(actionEl.getAttribute('data-job-id'));
          break;
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
          commitAdultSpamKeywordInput();
          commitAdultSpamWhitelistInput();
          showToast('✓ 已保存内容净化规则');
          break;
        }
        case 'remove-adultspam-keyword': {
          const keyword = actionEl.getAttribute('data-keyword') || '';
          const adultSpamKeywords = (state.settings.adultSpamKeywords || []).filter((item) => item !== keyword);
          setSettingsPartial({ adultSpamKeywords });
          break;
        }
        case 'remove-adultspam-whitelist': {
          const username = actionEl.getAttribute('data-username') || '';
          const adultSpamWhitelist = (state.settings.adultSpamWhitelist || []).filter((item) => item !== username);
          setSettingsPartial({ adultSpamWhitelist });
          break;
        }
        case 'save-layout': {
          const timelineWidth = clampInt(state.timelineWidthEl.value, 100, 3000, state.settings.timelineWidth);
          const leftbarWidth = clampInt(state.leftbarWidthEl.value, 50, 500, state.settings.leftbarWidth);
          setSettingsPartial({ layoutAutoWidth: false, timelineWidth, leftbarWidth });
          showToast('✓ 已切换为手动宽度并应用');
          break;
        }
        case 'save-advanced': {
          const maxPosts = clampInt(state.maxPostsInputEl.value, 50, 5000, state.settings.maxPosts);
          const flashSec = clampInt(state.flashMsInputEl.value, 1, 60, Math.round((state.settings.flashMs || 8000) / 1000));
          const days = clampInt(state.autoCleanInputEl.value, 0, 3650, state.settings.autoCleanDays);
          const dlSec = state.dlTimeoutInputEl ? clampInt(state.dlTimeoutInputEl.value, 5, 600, Math.round((state.settings.downloadTimeout || DEFAULT_SETTINGS.downloadTimeout) / 1000)) : Math.round((state.settings.downloadTimeout || DEFAULT_SETTINGS.downloadTimeout) / 1000);
          const downloadConcurrency = state.dlConcurrencyInputEl
            ? clampInt(state.dlConcurrencyInputEl.value, DOWNLOAD_MIN_CONCURRENCY, DOWNLOAD_MAX_CONCURRENCY, DEFAULT_SETTINGS.downloadConcurrency)
            : DEFAULT_SETTINGS.downloadConcurrency;
          setSettingsPartial({ maxPosts, flashMs: flashSec * 1000, autoCleanDays: days, downloadTimeout: dlSec * 1000, downloadConcurrency });
          pumpDownloadTransferQueue();
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
            const ta = state.listEl.querySelector(`.BetterX-note-input[data-id="${id}"]`);
            if (ta) { ta.focus(); ta.selectionStart = ta.value.length; }
          }, 20);
          break;
        case 'save-note': {
          const ta = state.listEl.querySelector(`.BetterX-note-input[data-id="${id}"]`);
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
      #BetterX-root {
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
      #BetterX-root.BetterX-light {
        --xv-panel-bg: rgba(255,255,255,0.99);
        --xv-text: #0f1419;
        --xv-border: rgba(0,0,0,0.12);
        --xv-chip-bg: rgba(0,0,0,0.05);
        --xv-input-bg: rgba(0,0,0,0.04);
        --xv-muted: rgba(15,20,25,0.6);
        --xv-item-bg: rgba(0,0,0,0.02);
      }
      #BetterX-badge {
        background: var(--xv-accent); color: #fff; border: none; border-radius: 999px;
        padding: 10px 16px; font-size: 13px; font-weight: 700; cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.35); touch-action: none; user-select: none;
      }
      #BetterX-badge:hover { filter: brightness(1.08); }
      #BetterX-root.BetterX-desktop-badge-hidden:not(.BetterX-mobile) #BetterX-badge {
        visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;
      }
      #BetterX-badge.mobile-mode {
        width: 52px; height: 52px; padding: 0; border-radius: 50%; font-size: 22px;
        display: flex; align-items: center; justify-content: center; position: relative;
      }
      .BetterX-mobile-icon {
        width: 42px; height: 42px; border-radius: 50%; object-fit: cover;
        border: 2px solid rgba(255,255,255,.72); box-shadow: 0 2px 8px rgba(0,0,0,.22);
        pointer-events: none; user-select: none; -webkit-user-drag: none;
      }
      #BetterX-badge.mobile-mode.desktop-icon-mode { width: 64px; height: 64px; }
      #BetterX-badge.mobile-mode.desktop-icon-mode .BetterX-mobile-icon { width: 54px; height: 54px; }
      #BetterX-badge.desktop-icon-mode { cursor: grab; }
      #BetterX-badge.desktop-icon-mode.is-dragging { cursor: grabbing; }
      #BetterX-badge.desktop-icon-mode .BetterX-mobile-icon-fallback { font-size: 30px; }
      .BetterX-mobile-icon-fallback { line-height: 1; }
      #BetterX-root.BetterX-mobile .BetterX-desktop-only-setting { display: none !important; }
      .BetterX-mobile-dot {
        position: absolute; top: -2px; right: -2px; background: #f4212e; color: #fff;
        min-width: 18px; height: 18px; border-radius: 999px; font-size: 11px; font-weight: 700;
        line-height: 18px; text-align: center; padding: 0 4px;
      }
      #BetterX-root.BetterX-mobile { left: auto; right: 16px; bottom: 84px; }
      #BetterX-root.BetterX-mobile #BetterX-badge {
        opacity: var(--xv-mobile-badge-opacity, 1);
        transition: opacity 170ms ease-out, filter .15s;
      }
      #BetterX-root.BetterX-mobile.BetterX-mobile-badge-inactive #BetterX-badge,
      #BetterX-root.BetterX-mobile.BetterX-mobile-badge-inactive #BetterX-download-pill { pointer-events: none; }

      /* X 2026 的多媒体正文轮播恢复为传统网格；类名仅由脚本加到含 2+ 项媒体的轮播。 */
      article .BetterX-media-grid-box {
        padding-bottom: 0 !important; height: auto !important; min-height: 0 !important;
      }
      article nav.BetterX-media-grid {
        position: relative !important; inset: auto !important; width: 100% !important;
        height: auto !important; overflow: visible !important;
      }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-prevButtonWrapper"],
      article nav.BetterX-media-grid [data-testid="ScrollSnap-nextButtonWrapper"] { display: none !important; }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-SwipeableList"] {
        width: 100% !important; height: auto !important; overflow: visible !important;
      }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-List"] {
        display: grid !important; width: 100% !important; height: auto !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px;
        margin: 0 !important; padding: 0 !important; overflow: hidden !important;
        border-radius: 16px; scroll-snap-type: none !important;
      }
      article nav.BetterX-media-grid-count-2 [data-testid="ScrollSnap-List"] {
        grid-template-rows: minmax(0, 1fr); aspect-ratio: 16 / 9;
      }
      article nav.BetterX-media-grid-count-3 [data-testid="ScrollSnap-List"],
      article nav.BetterX-media-grid-count-4 [data-testid="ScrollSnap-List"] {
        grid-template-rows: repeat(2, minmax(0, 1fr)); aspect-ratio: 16 / 9;
      }
      article nav.BetterX-media-grid-count-3 [data-testid="ScrollSnap-List"] > [role="presentation"]:first-child {
        grid-row: span 2;
      }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-List"] > [role="presentation"] {
        display: block !important; width: auto !important; min-width: 0 !important;
        height: 100% !important; margin: 0 !important; overflow: hidden !important;
        scroll-snap-align: none !important;
      }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-List"] > [role="presentation"] > div,
      article nav.BetterX-media-grid [data-testid="ScrollSnap-List"] > [role="presentation"] > div > div {
        width: 100% !important; height: 100% !important; min-height: 0 !important;
      }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-List"] > [role="presentation"] > div {
        aspect-ratio: auto !important;
      }

      #BetterX-download-pill {
        position: absolute; left: calc(100% + 8px); bottom: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        min-width: 42px; height: 36px;
        padding: 0 12px; border: 1px solid rgba(255,255,255,.16); border-radius: 999px;
        background: var(--xv-panel-bg); color: var(--xv-text); box-shadow: 0 4px 16px rgba(0,0,0,.28);
        font-size: 12px; font-weight: 700; white-space: nowrap; cursor: pointer; backdrop-filter: blur(10px);
      }
      .BetterX-download-pill-icon { font-size: 17px; line-height: 1; }
      .BetterX-download-pill-label { line-height: 1; }
      .BetterX-download-pill-count { display: none; }
      #BetterX-download-pill:hover { border-color: var(--xv-accent); }
      #BetterX-download-pill.is-progress {
        border-color: transparent;
        background: linear-gradient(var(--xv-panel-bg), var(--xv-panel-bg)) padding-box,
          conic-gradient(var(--xv-accent) var(--xv-download-progress, 0deg), var(--xv-border) 0) border-box;
      }
      #BetterX-root.BetterX-panel-right #BetterX-download-pill { left: auto; right: calc(100% + 8px); }
      #BetterX-download-popover {
        position: absolute; left: calc(100% + 8px); bottom: 44px; width: min(360px, calc(100vw - 32px));
        max-height: min(420px, calc(100vh - 120px)); overflow: auto; padding: 10px;
        border: 1px solid var(--xv-border); border-radius: 14px; background: var(--xv-panel-bg); color: var(--xv-text);
        box-shadow: 0 12px 42px rgba(0,0,0,.42); backdrop-filter: blur(12px);
      }
      #BetterX-root.BetterX-panel-right #BetterX-download-popover { left: auto; right: calc(100% + 8px); }
      #BetterX-download-pill[hidden], #BetterX-download-popover[hidden],
      .BetterX-dl-cancel[hidden] { display: none !important; }
      .BetterX-download-popover-title { padding: 2px 4px 8px; font-size: 13px; font-weight: 800; }
      .BetterX-download-empty { padding: 14px 8px; color: var(--xv-muted); text-align: center; font-size: 12px; }
      .BetterX-download-task {
        display: flex; align-items: center; gap: 8px; min-width: 0; padding: 9px 8px; margin-top: 5px;
        border: 1px solid var(--xv-border); border-radius: 10px;
        background: linear-gradient(90deg, rgba(29,155,240,.14) var(--xv-task-progress, 0%), transparent 0), var(--xv-item-bg);
      }
      .BetterX-download-task-main { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: 3px; }
      .BetterX-download-task-main strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
      .BetterX-download-task-main span { color: var(--xv-muted); font-size: 11px; }
      .BetterX-download-task-actions { display: flex; flex: 0 0 auto; gap: 4px; }
      .BetterX-download-task-actions button {
        padding: 4px 7px; border: 1px solid var(--xv-border); border-radius: 7px;
        background: var(--xv-chip-bg); color: var(--xv-text); font-size: 11px; cursor: pointer;
      }
      .BetterX-download-task-actions button:hover { border-color: var(--xv-accent); }

      #BetterX-panel {
        position: absolute; bottom: calc(100% + 10px); left: 0;
        width: min(94vw, 480px); max-height: calc(100vh - 96px);
        background: var(--xv-panel-bg); color: var(--xv-text);
        border: 1px solid var(--xv-border); border-radius: 16px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.5); backdrop-filter: blur(12px);
        display: flex; flex-direction: column; overflow: hidden;
      }
      #BetterX-root.BetterX-panel-right #BetterX-panel { left: auto; right: 0; }
      #BetterX-root.BetterX-mobile #BetterX-panel { position: fixed; right: 12px; left: auto; bottom: 84px; max-height: calc(100vh - 120px); }
      .BetterX-ad-hidden { display: none !important; }
      .BetterX-adult-spam-hidden { display: none !important; }
      .BetterX-download-controls {
        display: inline-flex; align-items: center; justify-content: center; gap: 1px; flex: 0 0 auto;
      }
      .BetterX-download-controls.floating {
        position: absolute; top: 8px; right: 8px; z-index: 5; padding: 2px;
        border-radius: 999px; background: rgba(0,0,0,.62);
      }
      .BetterX-dl-btn, .BetterX-dl-cancel {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 34px; height: 34px; margin: 0; padding: 0 8px;
        border: none; background: transparent; color: rgb(83,100,113);
        font-size: 19px; font-weight: 700; line-height: 1; cursor: pointer; border-radius: 999px;
        transition: background .15s, color .15s, min-width .15s;
      }
      .BetterX-download-controls:not([data-download-state="idle"]) .BetterX-dl-btn { font-size: 12px; }
      .BetterX-dl-btn:hover { background: rgba(29,155,240,0.12); color: rgb(29,155,240); }
      .BetterX-dl-btn.is-progress {
        color: rgb(29,155,240);
        background: conic-gradient(rgba(29,155,240,.24) var(--xv-download-progress, 0deg), transparent 0);
      }
      .BetterX-dl-cancel { min-width: 24px; width: 24px; padding: 0; color: rgb(244,33,46); font-size: 17px; }
      .BetterX-dl-cancel:hover { background: rgba(244,33,46,.12); }
      .BetterX-download-controls.in-group { align-self: center; }
      .BetterX-download-controls.floating .BetterX-dl-btn,
      .BetterX-download-controls.floating .BetterX-dl-cancel { color: #fff; }
      .BetterX-download-controls.floating .BetterX-dl-btn:hover { background: rgba(29,155,240,.88); }
      .BetterX-download-controls.floating .BetterX-dl-cancel:hover { background: rgba(244,33,46,.88); }
      article[data-testid="notification"] .BetterX-download-controls { display: none !important; }
      .BetterX-mask-hidden { display: none !important; }
      /* 年龄限制媒体没有可复用的 X React 媒体节点；按旧版原生网格的结构与尺寸重建。 */
      .BetterX-unlocked.BetterX-native-media-grid {
        display: grid; gap: 2px; margin: 8px 0; width: 100%; max-width: 100%;
        border-radius: 16px; overflow: hidden; background: #000;
      }
      .BetterX-unlocked .BetterX-unlocked-tile,
      .BetterX-unlocked .BetterX-unlocked-media {
        display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: hidden;
      }
      .BetterX-unlocked .BetterX-unlocked-photo { cursor: pointer; }
      /* 单媒体沿用 X 的“完整可见、受最大高度约束”效果。 */
      .BetterX-unlocked.xv-n1 { grid-template-columns: 1fr; background: transparent; }
      .BetterX-unlocked.xv-n1 .BetterX-unlocked-tile { height: auto; background: #000; }
      .BetterX-unlocked.xv-n1 img, .BetterX-unlocked.xv-n1 video {
        display: block; margin: 0 auto; width: auto; height: auto; max-width: 100%; max-height: 510px;
        object-fit: contain; background: #000;
      }
      /* 多媒体遵循旧版 X 的 2 / 3 / 4 项马赛克布局。 */
      .BetterX-unlocked.xv-multi img, .BetterX-unlocked.xv-multi video {
        display: block; width: 100%; height: 100%; object-fit: cover; background: #000;
      }
      .BetterX-unlocked.xv-n2 { grid-template-columns: 1fr 1fr; grid-template-rows: minmax(0, 1fr); aspect-ratio: 16 / 9; }
      .BetterX-unlocked.xv-n3 { grid-template-columns: 1fr 1fr; grid-template-rows: repeat(2, minmax(0, 1fr)); aspect-ratio: 16 / 9; }
      .BetterX-unlocked.xv-n3 > *:first-child { grid-row: span 2; }
      .BetterX-unlocked.xv-n4 { grid-template-columns: 1fr 1fr; grid-template-rows: repeat(2, minmax(0, 1fr)); aspect-ratio: 16 / 9; }
      .BetterX-unlocked.xv-nm { grid-template-columns: 1fr 1fr; }
      .BetterX-unlocked.xv-nm .BetterX-unlocked-tile { aspect-ratio: 1 / 1; }
      #BetterX-toast {
        position: fixed; left: 50%; bottom: 90px; transform: translateX(-50%) translateY(10px);
        background: rgba(21,24,28,0.98); color: #fff; padding: 10px 16px; border-radius: 10px;
        font-size: 13px; z-index: 2147483600; box-shadow: 0 6px 24px rgba(0,0,0,0.4);
        opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; max-width: 80vw;
      }
      #BetterX-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

      .BetterX-dialog-overlay {
        position: fixed; inset: 0; z-index: 2147483646;
        display: flex; align-items: center; justify-content: center;
        padding: 18px; background: rgba(0,0,0,.64); backdrop-filter: blur(4px);
        color: var(--xv-text);
      }
      .BetterX-dialog {
        width: min(92vw, 460px); max-height: min(82vh, 640px); overflow: auto;
        padding: 20px; border: 1px solid var(--xv-border); border-radius: 16px;
        background: var(--xv-panel-bg); box-shadow: 0 18px 64px rgba(0,0,0,.55);
      }
      .BetterX-dialog-title { font-size: 18px; line-height: 1.35; font-weight: 800; margin-bottom: 12px; }
      .BetterX-dialog-body { font-size: 14px; line-height: 1.65; color: var(--xv-text); }
      .BetterX-dialog-body p { margin: 0 0 10px; }
      .BetterX-dialog-body ul { margin: 0 0 12px; padding-left: 22px; }
      .BetterX-dialog-body li { margin: 4px 0; }
      .BetterX-dialog-body code {
        padding: 1px 5px; border-radius: 5px; background: var(--xv-chip-bg);
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .92em;
      }
      .BetterX-dialog-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 18px; }
      .BetterX-dialog-actions .BetterX-btn { min-width: 104px; padding: 9px 14px; font-size: 14px; }

      #BetterX-panel * { box-sizing: border-box; }
      .BetterX-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 14px 14px 8px; }
      .BetterX-title-main { font-size: 15px; font-weight: 800; }
      .BetterX-title-sub { font-size: 11px; color: var(--xv-muted); margin-top: 2px; }
      .BetterX-header-actions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
      .BetterX-tip { padding: 0 14px 8px; font-size: 13px; color: var(--xv-muted); }

      .BetterX-btn {
        background: var(--xv-chip-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 8px; padding: 5px 10px; font-size: 12px; cursor: pointer; white-space: nowrap;
      }
      .BetterX-btn:hover { border-color: var(--xv-accent); }
      .BetterX-btn.primary { background: var(--xv-accent); color: #fff; border-color: var(--xv-accent); }
      .BetterX-btn.danger { color: #f4212e; }
      .BetterX-btn.danger:hover { border-color: #f4212e; }

      .BetterX-summary { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 10px; }
      .BetterX-stat { background: var(--xv-chip-bg); border-radius: 8px; padding: 4px 8px; font-size: 11px; color: var(--xv-muted); }
      .BetterX-stat b { color: var(--xv-text); font-size: 12px; }

      .BetterX-filter-bar, .BetterX-chip-row { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 10px; }
      .BetterX-chip-row { padding: 6px 0 0; }
      .BetterX-chip {
        background: var(--xv-chip-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 999px; padding: 4px 12px; font-size: 12px; cursor: pointer;
      }
      .BetterX-chip.active { background: var(--xv-accent); color: #fff; border-color: var(--xv-accent); }

      .BetterX-controls { padding: 0 14px 10px; display: flex; flex-direction: column; gap: 8px; }
      .BetterX-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
      .BetterX-control-row { align-items: flex-end; }
      .BetterX-control-row > .BetterX-btn,
      .BetterX-control-row > .BetterX-field > .BetterX-input { height: 32px; }
      .BetterX-control-row > .BetterX-field.inline {
        height: 32px; justify-content: center; align-self: flex-end;
      }
      .BetterX-row .BetterX-input { flex: 1 1 120px; }
      .BetterX-input {
        background: var(--xv-input-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 8px; padding: 7px 10px; font-size: 13px; width: 100%;
      }
      .BetterX-input.small { width: 90px; flex: 0 0 auto; }
      .BetterX-select {
        background: var(--xv-input-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 8px; padding: 6px 8px; font-size: 12px; cursor: pointer;
      }
      .BetterX-select option { color: #000; }
      .BetterX-light .BetterX-select option { color: #0f1419; }

      .BetterX-advanced { border: 1px solid var(--xv-border); border-radius: 8px; padding: 6px 10px; }
      .BetterX-advanced summary { cursor: pointer; font-size: 13px; color: var(--xv-muted); }
      .BetterX-adv-body { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
      .BetterX-field { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--xv-muted); }
      .BetterX-field.inline { flex-direction: row; align-items: center; gap: 6px; }
      .BetterX-adv-label { font-size: 12px; color: var(--xv-muted); }
      .BetterX-content-status { font-size: 11px; color: var(--xv-muted); padding: 5px 8px; border-radius: 7px; background: var(--xv-chip-bg); }

      .BetterX-list { overflow-y: auto; padding: 4px 14px 14px; display: flex; flex-direction: column; gap: 10px; }
      .BetterX-empty { padding: 24px 8px; text-align: center; color: var(--xv-muted); font-size: 13px; }
      .BetterX-loadmore {
        margin-top: 4px; background: var(--xv-chip-bg); color: var(--xv-text); border: 1px dashed var(--xv-border);
        border-radius: 8px; padding: 8px; font-size: 12px; cursor: pointer;
      }

      .BetterX-item { background: var(--xv-item-bg); border: 1px solid var(--xv-border); border-radius: 12px; padding: 10px 12px; }
      .BetterX-item.is-flash-lost { border-color: rgba(244,33,46,0.5); }
      .BetterX-item.is-pinned { border-color: rgba(29,155,240,0.6); }
      .BetterX-item-top { display: flex; justify-content: space-between; gap: 8px; }
      .BetterX-author-head { display: flex; align-items: center; gap: 8px; }
      .BetterX-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex: 0 0 auto; }
      .BetterX-author-line { font-size: 13px; font-weight: 700; word-break: break-word; line-height: 1.35; }
      .BetterX-author-profile { color: inherit; text-decoration: none; }
      .BetterX-author-profile:hover { color: var(--xv-accent); text-decoration: underline; }
      .BetterX-author-handle { color: var(--xv-muted); font-weight: 400; font-size: 12px; }
      .BetterX-author-time { color: var(--xv-muted); font-weight: 400; font-size: 12px; white-space: nowrap; }
      .BetterX-submeta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 3px; font-size: 10px; color: var(--xv-muted); }
      .BetterX-actions { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; align-content: flex-start; }

      .BetterX-text { margin: 8px 0 4px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
      .BetterX-text.collapsed { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .BetterX-expand-btn { background: none; border: none; color: var(--xv-accent); font-size: 12px; cursor: pointer; padding: 0; }
      .BetterX-hl { background: #ffd400; color: #000; border-radius: 3px; padding: 0 1px; }

      .BetterX-thumbs { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
      .BetterX-thumb { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; border: 1px solid var(--xv-border); }

      .BetterX-tags { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0; }
      .BetterX-tag { font-size: 10px; padding: 2px 6px; border-radius: 6px; background: var(--xv-chip-bg); color: var(--xv-muted); }
      .BetterX-tag.fav { background: rgba(255,212,0,0.15); color: #ffd400; }
      .BetterX-tag.pin { background: rgba(29,155,240,0.15); color: var(--xv-accent); }
      .BetterX-tag.flash { background: rgba(244,33,46,0.15); color: #f4212e; }
      .BetterX-tag.opened { background: rgba(0,186,124,0.15); color: #00ba7c; }
      .BetterX-tag.keyword { background: rgba(255,212,0,0.15); color: #ffd400; }

      .BetterX-note-area { margin-top: 4px; }
      .BetterX-note-btn { font-size: 11px; padding: 3px 8px; }
      .BetterX-note-text { margin-top: 4px; font-size: 12px; color: var(--xv-text); background: var(--xv-chip-bg); border-radius: 6px; padding: 6px 8px; word-break: break-word; }
      .BetterX-note-input { width: 100%; min-height: 60px; resize: vertical; background: var(--xv-input-bg); color: var(--xv-text); border: 1px solid var(--xv-border); border-radius: 8px; padding: 7px; font-size: 12px; }
      .BetterX-note-actions { display: flex; gap: 6px; margin-top: 6px; }
      .BetterX-bottom-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; font-size: 10px; color: var(--xv-muted); }

      .BetterX-list::-webkit-scrollbar { width: 8px; }
      .BetterX-list::-webkit-scrollbar-thumb { background: var(--xv-border); border-radius: 8px; }

      /* ===== UI/UX 优化：吸顶 / 分区 / 菜单 / 视觉统一 ===== */
      .BetterX-panel-top { flex: 0 0 auto; }
      .BetterX-list { flex: 1 1 auto; min-height: 120px; }
      .BetterX-header { padding-bottom: 10px; border-bottom: 1px solid var(--xv-border); }
      .BetterX-section-label { padding: 8px 14px 2px; font-size: 11px; font-weight: 700; letter-spacing: .03em; color: var(--xv-muted); }
      .BetterX-controls .BetterX-section-label { padding: 4px 0 0; }
      .BetterX-controls { border-top: 1px solid var(--xv-border); padding-top: 12px; }
      /* “…”下拉菜单 */
      .BetterX-menu-wrap { position: relative; display: inline-flex; }
      .BetterX-icon-btn { padding: 5px 10px; font-weight: 700; line-height: 1; }
      .BetterX-menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: 30; display: flex; flex-direction: column; gap: 2px; padding: 6px; min-width: 150px; background: var(--xv-panel-bg); border: 1px solid var(--xv-border); border-radius: 12px; box-shadow: 0 10px 32px rgba(0,0,0,0.45); backdrop-filter: blur(12px); }
      .BetterX-menu[hidden] { display: none; }
      .BetterX-menu-item { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: transparent; color: var(--xv-text); border: none; border-radius: 8px; padding: 8px 10px; font-size: 13px; cursor: pointer; white-space: nowrap; transition: background .15s; }
      .BetterX-menu-item:hover { background: var(--xv-chip-bg); }
      .BetterX-menu-item.danger { color: #f4212e; }
      .BetterX-menu-item.danger:hover { background: rgba(244,33,46,0.12); }
      /* 视觉统一：过渡 / 悬停 / 聚焦 */
      .BetterX-btn { transition: background .15s, border-color .15s, color .15s; }
      .BetterX-btn:hover { background: var(--xv-chip-bg); }
      .BetterX-btn.primary:hover { background: var(--xv-accent); filter: brightness(1.08); }
      .BetterX-chip { transition: background .15s, border-color .15s, color .15s; }
      .BetterX-input, .BetterX-select, .BetterX-note-input { transition: border-color .15s, box-shadow .15s; }
      .BetterX-input:focus, .BetterX-select:focus, .BetterX-note-input:focus { outline: none; border-color: var(--xv-accent); box-shadow: 0 0 0 2px rgba(29,155,240,0.25); }
      .BetterX-item { transition: border-color .15s, background .15s; }
      .BetterX-item:hover { border-color: rgba(29,155,240,0.5); }
      /* 折叠区：箭头指示 */
      .BetterX-advanced { transition: border-color .15s; }
      .BetterX-advanced[open] { border-color: rgba(29,155,240,0.4); }
      .BetterX-advanced summary { list-style: none; display: flex; align-items: center; gap: 6px; font-weight: 600; user-select: none; }
      .BetterX-advanced summary::-webkit-details-marker { display: none; }
      .BetterX-advanced summary::before { content: '▸'; font-size: 10px; color: var(--xv-muted); transition: transform .15s; }
      .BetterX-advanced[open] summary::before { transform: rotate(90deg); }

      /* ===== v1.7：双视图工作台 ===== */
      #BetterX-panel {
        position: fixed;
        top: 12px;
        bottom: 12px;
        width: min(94vw, 520px);
        height: auto;
        max-height: none;
      }
      .BetterX-header {
        flex: 0 0 auto; align-items: center; min-height: 58px; padding: 11px 14px;
        border-bottom: none; background: var(--xv-panel-bg);
      }
      .BetterX-title { min-width: 0; }
      .BetterX-title-main { display: flex; align-items: center; gap: 8px; font-size: 17px; letter-spacing: -.01em; }
      .BetterX-title-icon {
        width: 26px; height: 26px; flex: 0 0 26px; border-radius: 7px; object-fit: cover;
        box-shadow: 0 1px 5px rgba(0,0,0,.28); pointer-events: none; user-select: none; -webkit-user-drag: none;
      }
      .BetterX-title-sub { font-size: 11px; }
      .BetterX-header-actions { flex-wrap: nowrap; align-items: center; }
      .BetterX-header-actions .BetterX-btn {
        display: inline-flex; align-items: center; justify-content: center; height: 30px; min-height: 30px;
      }
      .BetterX-header-actions .BetterX-icon-btn { width: 30px; padding: 0; }
      #BetterX-panel.is-settings-view .BetterX-vault-action { display: none; }
      .BetterX-btn:disabled, .BetterX-input:disabled, .BetterX-select:disabled {
        cursor: not-allowed; opacity: .48; filter: none;
      }

      .BetterX-tabs {
        flex: 0 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
        margin: 0 14px 10px; padding: 3px; border-radius: 11px; background: var(--xv-chip-bg);
      }
      .BetterX-tab {
        display: flex; align-items: center; justify-content: center; min-height: 32px;
        border: 0; border-radius: 8px; background: transparent; text-align: center;
        color: var(--xv-muted); font-size: 13px; font-weight: 700; cursor: pointer;
        transition: background .15s, color .15s, box-shadow .15s;
      }
      .BetterX-tab:hover { color: var(--xv-text); }
      .BetterX-tab.active {
        color: #fff; background: var(--xv-accent); box-shadow: 0 2px 8px rgba(29,155,240,.22);
      }
      .BetterX-view { flex: 1 1 auto; min-height: 0; }
      .BetterX-view[hidden] { display: none !important; }
      .BetterX-vault-view { display: flex; flex-direction: column; }
      .BetterX-vault-toolbar {
        flex: 0 0 auto; border-top: 1px solid var(--xv-border); border-bottom: 1px solid var(--xv-border);
        background: var(--xv-panel-bg);
      }
      .BetterX-tip {
        margin: 9px 14px 7px; padding: 7px 9px; border-radius: 8px;
        background: rgba(29,155,240,.08); color: var(--xv-muted); font-size: 12px; line-height: 1.45;
      }
      .BetterX-summary {
        flex-wrap: wrap; overflow-x: visible; padding: 0 14px 8px;
      }
      .BetterX-summary::-webkit-scrollbar, .BetterX-filter-bar::-webkit-scrollbar { display: none; }
      .BetterX-stat { flex: 0 0 auto; border: 1px solid transparent; padding: 4px 8px; font-size: 12px; }
      .BetterX-stat b { font-size: 13px; }
      .BetterX-section-label { padding: 2px 14px 5px; font-size: 11px; text-transform: uppercase; }
      .BetterX-filter-bar {
        flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding: 0 14px 9px;
      }
      .BetterX-chip { flex: 0 0 auto; min-height: 28px; padding: 4px 11px; }
      .BetterX-search-tools { display: grid; gap: 7px; padding: 0 14px 11px; }
      .BetterX-search-tools > .BetterX-input { height: 36px; padding-left: 12px; border-radius: 10px; }
      .BetterX-toolbar-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
      .BetterX-toolbar-row .BetterX-select { width: 100%; min-width: 0; height: 32px; border-radius: 9px; font-size: 13px; }
      .BetterX-list {
        flex: 1 1 auto; min-height: 120px; overflow-y: auto; padding: 10px 12px 14px; gap: 8px;
        overscroll-behavior: contain;
      }

      .BetterX-settings-view { display: flex; flex-direction: column; border-top: 1px solid var(--xv-border); }
      .BetterX-settings-scroll {
        flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
        padding: 12px 14px 18px; scrollbar-color: var(--xv-border) transparent;
      }
      .BetterX-settings-intro { display: flex; flex-direction: column; gap: 2px; padding: 0 2px 10px; }
      .BetterX-settings-intro strong { font-size: 15px; }
      .BetterX-settings-intro span { color: var(--xv-muted); font-size: 12px; line-height: 1.45; }
      .BetterX-settings-view .BetterX-controls {
        gap: 9px; padding: 0; border-top: 0;
      }
      .BetterX-settings-card {
        padding: 0; overflow: hidden; border-radius: 12px; background: var(--xv-item-bg);
      }
      .BetterX-settings-card > summary {
        min-height: 43px; padding: 0 12px; color: var(--xv-text); font-size: 14px;
      }
      .BetterX-settings-card[open] { border-color: rgba(29,155,240,.34); }
      .BetterX-settings-card[open] > summary { border-bottom: 1px solid var(--xv-border); }
      .BetterX-settings-card > .BetterX-adv-body { gap: 10px; padding: 12px; }
      .BetterX-settings-card .BetterX-field,
      .BetterX-settings-card .BetterX-adv-label { font-size: 13px; line-height: 1.45; }
      .BetterX-settings-card .BetterX-content-status { font-size: 12px; line-height: 1.4; }
      .BetterX-dependent-options { display: flex; flex-direction: column; gap: 9px; }
      .BetterX-dependent-options.is-disabled { opacity: .5; }
      .BetterX-field.is-disabled { opacity: .5; }
      .BetterX-adultspam-master-row { flex-wrap: nowrap; justify-content: space-between; }
      .BetterX-adultspam-master-row > .BetterX-field { flex: 1 1 auto; min-width: 0; }
      .BetterX-adultspam-master-row > .BetterX-select { flex: 0 0 auto; min-width: 72px; }
      .BetterX-tag-editor {
        display: flex; flex-direction: column; gap: 7px; min-width: 0; padding: 8px;
        border: 1px solid var(--xv-border); border-radius: 10px; background: var(--xv-input-bg);
      }
      .BetterX-keyword-tags { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
      .BetterX-keyword-tags:empty { display: none; }
      .BetterX-keyword-tag {
        display: inline-flex; align-items: center; gap: 5px; max-width: 100%; min-height: 26px;
        padding: 3px 5px 3px 9px; border: 1px solid rgba(29,155,240,.35); border-radius: 999px;
        background: rgba(29,155,240,.12); color: var(--xv-text); font-size: 12px; line-height: 1.3;
      }
      .BetterX-keyword-tag-label { overflow-wrap: anywhere; }
      .BetterX-keyword-tag-remove {
        display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto;
        width: 19px; height: 19px; padding: 0; border: 0; border-radius: 50%;
        background: transparent; color: var(--xv-muted); cursor: pointer; font-size: 17px; line-height: 1;
      }
      .BetterX-keyword-tag-remove:hover { background: rgba(244,33,46,.14); color: #f4212e; }
      .BetterX-tag-editor > .BetterX-input { width: 100%; margin: 0; background: transparent; }
      .BetterX-settings-view .BetterX-field.inline {
        position: relative; min-height: 28px; padding-left: 46px; color: var(--xv-text); line-height: 1.35;
      }
      .BetterX-settings-view .BetterX-field.inline > input[type="checkbox"] {
        appearance: none; -webkit-appearance: none; position: absolute; left: 0; top: 50%;
        width: 38px; height: 22px; margin: 0; border: 1px solid var(--xv-border); border-radius: 999px;
        background: var(--xv-input-bg); transform: translateY(-50%); cursor: pointer; transition: .16s ease;
      }
      .BetterX-settings-view .BetterX-field.inline > input[type="checkbox"]::after {
        content: ''; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px;
        border-radius: 50%; background: var(--xv-muted); box-shadow: 0 1px 3px rgba(0,0,0,.35); transition: .16s ease;
      }
      .BetterX-settings-view .BetterX-field.inline > input[type="checkbox"]:checked {
        border-color: var(--xv-accent); background: var(--xv-accent);
      }
      .BetterX-settings-view .BetterX-field.inline > input[type="checkbox"]:checked::after {
        left: 18px; background: #fff;
      }
      .BetterX-settings-view .BetterX-field.inline > input[type="checkbox"]:focus-visible {
        outline: 2px solid rgba(29,155,240,.45); outline-offset: 2px;
      }
      .BetterX-settings-view .BetterX-control-row > .BetterX-field.inline {
        align-self: flex-end; justify-content: center; height: 32px;
      }

      .BetterX-item { position: relative; flex: 0 0 auto; padding: 11px 12px; border-radius: 13px; overflow: hidden; }
      .BetterX-empty, .BetterX-loadmore { flex: 0 0 auto; }
      .BetterX-item.is-unread::before {
        content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px;
        border-radius: 0 3px 3px 0; background: var(--xv-accent);
      }
      .BetterX-avatar { width: 32px; height: 32px; }
      .BetterX-author { min-width: 120px; }
      .BetterX-author-line { font-size: 14px; }
      .BetterX-submeta, .BetterX-tag, .BetterX-bottom-meta { font-size: 11px; }
      .BetterX-text { font-size: 14px; line-height: 1.55; }
      .BetterX-note-btn { font-size: 12px; }
      .BetterX-item-top { align-items: flex-start; }
      .BetterX-actions { max-width: 58%; }
      .BetterX-actions .BetterX-btn { min-height: 28px; padding: 4px 8px; }
      .BetterX-bottom-meta { padding-top: 7px; border-top: 1px solid var(--xv-border); }

      @media (max-width: 640px) {
        #BetterX-root.BetterX-mobile #BetterX-panel {
          inset: 8px; width: auto; height: calc(100dvh - 16px); max-height: none; border-radius: 18px;
        }
        #BetterX-root.BetterX-mobile #BetterX-download-pill {
          left: auto; right: 0; bottom: calc(100% + 10px); width: 52px; min-width: 52px; height: 52px; padding: 0;
          overflow: visible; border: 0; background: var(--xv-accent); color: var(--xv-accent);
          box-shadow: 0 4px 16px rgba(0,0,0,.35); opacity: var(--xv-mobile-badge-opacity, 1);
          transition: opacity 170ms ease-out, filter .15s;
        }
        #BetterX-root.BetterX-mobile #BetterX-download-pill.is-progress { border: 0; background: var(--xv-accent); }
        #BetterX-root.BetterX-mobile .BetterX-download-pill-icon {
          display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;
          border-radius: 50%; background: #fff; color: var(--xv-accent); font-size: 24px; font-weight: 900;
          box-shadow: 0 1px 5px rgba(0,0,0,.18);
        }
        #BetterX-root.BetterX-mobile .BetterX-download-pill-label { display: none; }
        #BetterX-root.BetterX-mobile .BetterX-download-pill-count {
          position: absolute; display: block; top: -2px; right: -2px; min-width: 18px; height: 18px;
          padding: 0 4px; border-radius: 999px; background: #f4212e; color: #fff;
          font-size: 11px; font-weight: 700; line-height: 18px; text-align: center;
        }
        #BetterX-root.BetterX-mobile .BetterX-download-pill-count[hidden] { display: none !important;
        }
        #BetterX-root.BetterX-mobile #BetterX-download-popover {
          position: absolute; left: auto; right: 0; bottom: calc(200% + 20px);
          width: min(360px, calc(100vw - 16px)); max-height: min(52vh, 420px);
        }
        #BetterX-root.BetterX-mobile.is-open #BetterX-badge,
        #BetterX-root.BetterX-mobile.is-open #BetterX-download-pill { opacity: 0; pointer-events: none; }
        .BetterX-header { min-height: 54px; padding: 9px 11px; }
        .BetterX-title-icon { display: none; }
        .BetterX-title-sub { display: none; }
        .BetterX-header-actions { gap: 4px; }
        .BetterX-header-actions .BetterX-btn { padding: 5px 7px; }
        .BetterX-tabs { margin: 0 10px 8px; }
        .BetterX-tip { margin: 7px 10px 6px; }
        .BetterX-summary, .BetterX-filter-bar { padding-left: 10px; padding-right: 10px; }
        .BetterX-section-label { padding-left: 10px; padding-right: 10px; }
        .BetterX-search-tools { padding: 0 10px 9px; }
        .BetterX-toolbar-row { grid-template-columns: 1fr 1fr; }
        .BetterX-toolbar-row .BetterX-select:last-child { grid-column: 1 / -1; }
        .BetterX-list { padding: 8px 9px 12px; }
        .BetterX-settings-scroll { padding: 10px 10px 16px; }
        .BetterX-item-top { flex-direction: column; }
        .BetterX-actions { max-width: none; justify-content: flex-start; }
        .BetterX-thumb { width: 64px; height: 64px; }
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
      if (!root || !root.isConnected || root.closest('#BetterX-root')) return;
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
        if (state.settings.restoreMediaGrid) applyMediaGridLayout(article);
        if (state.settings.bypassAgeRestriction) revealAgeRestricted(article);
      }
      if (adultSpamFilteringEnabled()) throttledAdultSpamCount();
      if (state.settings.layoutEnabled) throttledLayoutRefresh();
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
    applyMediaGridLayout();
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
    debugLog('v2.5.0 started');
  }

  function waitForPageReady() {
    if (document.body) { boot(); return; }
    const timer = setInterval(() => {
      if (document.body) { clearInterval(timer); boot(); }
    }, 100);
  }

  registerMenuCommands();
  installNetworkHooks();
  waitForPageReady();
})();
