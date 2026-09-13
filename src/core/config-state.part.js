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
  const MAX_NOTIFICATION_SUBSCRIPTIONS = 2000;
  // 铃铛接口成功前后，网络 Hook 仍可能延迟处理到操作前的用户资料响应。
  // 在短暂保护期内以用户刚确认的操作为准，避免旧状态把界面覆盖回去。
  const NOTIFICATION_MUTATION_GUARD_MS = 5000;
  const MAX_DOWNLOADED_POST_IDS = 5000;
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
  const MAX_REGEX_BOUNDED_REPETITION = 1000;
  const PAGE_SCROLL_SETTLE_MS = 180;
  const IS_FIREFOX = /(?:^|\s)Firefox\//i.test(navigator.userAgent || '');
  const USERSCRIPT_MANAGER = (() => {
    try {
      return typeof GM_info !== 'undefined' && GM_info
        ? String(GM_info.scriptHandler || '')
        : '';
    } catch (err) { return ''; }
  })();
  const IS_VIOLENTMONKEY = /violent\s*monkey/i.test(USERSCRIPT_MANAGER);
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

  const SORT_HINTS = {
    smart: '智能排序：置顶、收藏和快消失的帖子先显示，其他的按抓到的顺序排。',
    recent_viewed: '最近浏览：按你在屏幕上看到的帖子顺序排。适合用来找刚刷过的帖子。',
    recent_captured: '最近抓取：按脚本发现帖子的时间排。X 会提前加载，顺序不一定等于你看到的顺序。',
    first_captured: '首次抓取（新→旧）：新发现的帖子排在前；同一条帖子后来又出现，也不会换位置。',
    time_asc: '首次抓取（旧→新）：最早发现的帖子排在前，适合从头慢慢翻。',
    captures: '出现次数：反复刷到的帖子排在前面。',
    author: '按作者：把同一个作者的帖子排在一起。',
    source: '按来源：按主页、为你推荐、搜索、书签等页面分类排。',
  };

  const SORT_LABELS = {
    smart: '智能排序',
    recent_viewed: '最近浏览',
    recent_captured: '最近抓取',
    first_captured: '首次抓取（新→旧）',
    time_asc: '首次抓取（旧→新）',
    captures: '出现次数',
    author: '按作者',
    source: '按来源',
  };

  const SOURCE_SORT_RANK = new Map([
    ['Search', 0], ['Bookmarks', 1], ['Home', 2], ['For You', 3],
  ]);
  const SOURCE_EXACT_LABELS = Object.freeze({
    Home: '主页', Following: '正在关注', 'For You': '为你推荐', Search: '搜索',
    List: '列表', Bookmarks: '书签', Notifications: '通知', Unknown: '未知页面',
  });

  const SKIP_SOURCE_OPTIONS = [
    { key: 'profile', label: '个人主页' },
    { key: 'thread', label: '帖子详情' },
    { key: 'search', label: '搜索页' },
    { key: 'bookmarks', label: '书签页' },
    { key: 'notifications', label: '通知页' },
    { key: 'list', label: '列表页' },
  ];

  const PROFILE_DEFAULT_VIEW_OPTIONS = ['posts', 'all', 'highlights', 'video', 'photo'];
  const PROFILE_POST_SORT_OPTIONS = ['recent', 'popular'];
  const POST_SHOW_MORE_LABELS = new Set([
    '显示更多', '顯示更多', 'Show more', 'さらに表示', '더 보기',
  ]);
  const PROFILE_DEFAULT_VIEW_REDIRECT_GUARD_KEY = 'betterx_profile_default_view_redirect_guard_v1';
  const PROFILE_DEFAULT_VIEW_REDIRECT_GUARD_MS = 15000;
  const PROFILE_NAVIGATION_BYPASS_GUARD_KEY = 'betterx_profile_navigation_bypass_guard_v1';
  const PROFILE_NAVIGATION_BYPASS_GUARD_MS = 30000;
  // 账号切换菜单里的账号项也可能带有 /用户名 链接，但点击语义是切换登录账号，
  // 不能当成普通主页导航接管，否则会阻断 X 自己的账号切换处理。
  const PROFILE_LINK_REWRITE_EXCLUSION_SELECTOR = [
    '[role="menu"]',
    '[role="menuitem"]',
    '[data-testid="SideNav_AccountSwitcher_Button"]',
    '[data-testid*="AccountSwitcher"]',
  ].join(', ');
  // 这些是 X 的一级功能路由，不应被误判为用户名主页。
  const PROFILE_ROOT_ROUTE_EXCLUSIONS = new Set([
    'about', 'account', 'compose', 'download', 'explore', 'home', 'i', 'intent', 'jobs',
    'legal', 'login', 'logout', 'messages', 'notifications', 'privacy', 'search', 'settings',
    'share', 'signup', 'tos', 'x',
  ]);

  // 每个设置的默认值、校验、控件与副作用只声明一次。
  const bind = (stateKey, selector, property = 'checked') => [stateKey, selector, property];
  const setting = (defaultValue, validate, control, effects) => Object.freeze({
    default: defaultValue, validate, ...(control ? { control } : {}), ...(effects ? { effects } : {}),
  });
  const bool = (defaultValue, control, effects) => setting(defaultValue, ['boolean'], control, effects);
  const SETTINGS_SCHEMA = Object.freeze({
    settingsRevision: setting(31, ['revision']),
    keywords: setting([], ['keywordRules', 50, 500], null, ['keywords']),
    excludeKeywords: setting([], ['keywordRules', 50, 500], null, ['keywords']),
    keywordMode: setting('plain', ['enum', ['plain', 'and']], bind('keywordModeEl', '#BetterX-keyword-mode', 'value'), ['keywords']),
    filter: setting('all', ['filter']), sourceFilter: setting('all', ['stringDefault', 100], bind('sourceSelectEl', '#BetterX-source', 'value')),
    mediaFilter: setting('all', ['mediaFilter'], bind('mediaSelectEl', '#BetterX-media', 'value')),
    sortBy: setting('smart', ['enum', ['smart', 'recent_viewed', 'recent_captured', 'first_captured', 'time_asc', 'captures', 'author', 'source']], bind('sortEl', '#BetterX-sort', 'value')),
    quickFilterOpen: bool(false), autoCleanDays: setting(0, ['int', 0, 3650]), maxPosts: setting(1000, ['int', 50, 5000]),
    postLimitWarningDisabled: bool(false), flashMs: setting(8000, ['int', 1000, 60000]),
    markReadOnClick: bool(true, bind('markReadEl', '#BetterX-markread')), skipSources: setting([], ['skipSources']),
    theme: setting('auto', ['enum', ['auto', 'dark', 'light']], bind('themeSelectEl', '#BetterX-theme', 'value'), ['theme']),
    pageSize: setting(60, ['int', 20, 200]), badgePos: setting(null, ['badgePos']),
    hideAds: bool(true, bind('hideAdsEl', '#BetterX-hideads'), ['ads']),
    hideAdultSpam: bool(false, bind('hideAdultSpamEl', '#BetterX-hide-adult-spam'), ['adultSpam']),
    adultSpamCustomRulesEnabled: bool(true, bind('adultSpamCustomRulesEl', '#BetterX-adultspam-custom-enabled'), ['adultSpam']),
    adultSpamLevel: setting('balanced', ['enum', ['conservative', 'balanced']], bind('adultSpamLevelEl', '#BetterX-adultspam-level', 'value'), ['adultSpam']),
    adultSpamSkipFollowing: bool(true, bind('adultSpamSkipFollowingEl', '#BetterX-adultspam-skip-following'), ['adultSpam']),
    adultSpamSkipFollowingReposts: bool(false, bind('adultSpamSkipFollowingRepostsEl', '#BetterX-adultspam-skip-following-reposts'), ['adultSpam']),
    knownFollowedHandles: setting([], ['handles', 5000]), notificationSubscriptions: setting([], ['notifications']),
    notificationSubscriptionsSyncedAt: setting(0, ['timestamp']),
    adultSpamKeywords: setting([], ['stringList', 50, 80], null, ['adultSpam']),
    adultSpamWhitelist: setting([], ['handles', 100], null, ['adultSpam']),
    layoutEnabled: bool(false, bind('layoutEnabledEl', '#BetterX-layout-enabled'), ['layout']),
    layoutAutoWidth: bool(true, bind('layoutAutoWidthEl', '#BetterX-layout-auto-width'), ['layout']),
    timelineWidth: setting(600, ['int', 100, 3000], null, ['layout']), leftbarWidth: setting(275, ['int', 50, 500], null, ['layout']),
    layoutHideLeftbar: bool(false, bind('layoutHideLeftbarEl', '#BetterX-layout-hide-leftbar'), ['layout']),
    layoutHideSidebar: bool(false, bind('layoutHideSidebarEl', '#BetterX-layout-hide-sidebar'), ['layout']),
    layoutFillCenter: bool(false, bind('layoutFillCenterEl', '#BetterX-layout-fill-center'), ['layout']),
    layoutCleanNavigation: bool(true, bind('layoutCleanNavigationEl', '#BetterX-layout-clean-nav'), ['layout']),
    layoutHideMessageGrok: bool(true, bind('layoutHideMessageGrokEl', '#BetterX-layout-hide-message'), ['layout']),
    layoutHideShowMore: bool(false, bind('layoutHideShowMoreEl', '#BetterX-layout-hide-showmore'), ['layout']),
    mediaDownload: bool(true, null, ['mediaDownload']), downloadZip: bool(true),
    downloadFileNameTemplate: setting('{用户ID}_{帖子ID}', ['trimmedStringDefault', 180]),
    downloadZipNameTemplate: setting('{用户ID}_{帖子ID}', ['trimmedStringDefault', 180]),
    downloadNameRegex: setting('', ['safeRegex']), downloadNameReplacement: setting('', ['string', 180]),
    trackDownloadedPosts: bool(false), downloadedPostIds: setting([], ['downloadedIds']),
    bypassAgeRestriction: bool(false, bind('bypassAgeEl', '#BetterX-bypassage'), ['ageBypass']),
    restoreMediaGrid: bool(false, bind('restoreMediaGridEl', '#BetterX-restore-media-grid'), ['mediaGrid']),
    firefoxCompatibility: bool(false, null, ['firefoxCompatibility']), firefoxCompatibilityPrompted: bool(false),
    useMobileBadgeOnDesktop: bool(false, bind('useMobileBadgeOnDesktopEl', '#BetterX-desktop-mobile-badge'), ['badge']),
    hideAppBadge: setting(false, ['hideAppBadge'], null, ['badge']),
    useMobileBadgeHandle: setting(false, ['mobileBadgeHandle'], null, ['badge']),
    mobileBadgeHandleTop: setting(null, ['mobileBadgeTop']),
    profileDefaultViewEnabled: bool(true, bind('profileDefaultViewEnabledEl', '#BetterX-profile-default-view-enabled')),
    profileDefaultView: setting('posts', ['enum', PROFILE_DEFAULT_VIEW_OPTIONS], bind('profileDefaultViewEl', '#BetterX-profile-default-view', 'value')),
    profilePostSortEnabled: bool(true, bind('profilePostSortEnabledEl', '#BetterX-profile-post-sort-enabled')),
    profilePostSort: setting('recent', ['enum', PROFILE_POST_SORT_OPTIONS], bind('profilePostSortEl', '#BetterX-profile-post-sort', 'value')),
    autoExpandPostText: bool(false, bind('autoExpandPostTextEl', '#BetterX-auto-expand-post-text'), ['autoExpand']),
    downloadTimeout: setting(360000, ['int', 5000, 600000]),
    downloadConcurrency: setting(2, ['int', DOWNLOAD_MIN_CONCURRENCY, DOWNLOAD_MAX_CONCURRENCY]),
  });
  const DEFAULT_SETTINGS = Object.freeze(Object.fromEntries(
    Object.entries(SETTINGS_SCHEMA).map(([key, definition]) => [key, definition.default])
  ));

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
    viewObserver: null,
    viewedArticleIds: new WeakMap(),
    cleanupTimer: null,
    networkHookTimer: null,
    settingsLoaded: false,
    panelOpen: false,
    panelView: 'vault',
    // UI 引用由 createUI() 与 bindSettingsControls() 按需挂载。
    notificationSearchQuery: '',
    detectedTimelineWidth: 0,
    detectedLeftbarWidth: 0,
    mobileBadgeRaf: 0,
    suppressNextBadgeClick: false,
    notificationSyncInProgress: false,
    notificationMutationUsers: new Set(),
  };

  // 关键词匹配缓存（避免每次渲染都重算）
  let matchCache = new Map();
  let matchCacheVersion = 0;
  const autoExpandedPostShowMoreControls = new WeakSet();

  // 内容净化判定缓存：文章节点会持续补全，指纹变化时自动重新判断。
  let adultSpamCache = new WeakMap();
  let adultSpamRulesVersion = 0;
  const followedHandles = new Set();
  const notificationSubscriptions = new Map();
  const notificationMutationGuards = new Map();
  const adultSpamScannedIds = new Set();
  const adultSpamSessionHiddenIds = new Set();
  const adultSpamHiddenArticles = new Set();
  let adultSpamScannedIdsCapped = false;
  let adultSpamSessionHiddenIdsCapped = false;
  let adultSpamScrollToken = 0;
  let pageScrollBusyUntil = 0;
  let pageScrollTrackingInstalled = false;
  let autoExpandIdleTimer = null;
  let adultSpamLayoutIdleTimer = null;
  const pendingAdultSpamLayoutArticles = new Set();
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
  const scheduleNotificationSubscriptionsPersist = debounce(() => {
    if (!state.settingsLoaded) return;
    state.settings.notificationSubscriptions = [...notificationSubscriptions.values()]
      .sort((a, b) => Number(b.pinned === true) - Number(a.pinned === true)
        || Number(b.enabled) - Number(a.enabled) || (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, MAX_NOTIFICATION_SUBSCRIPTIONS);
    queueDbWrite(async () => { await persistSettings(); });
    renderNotificationSubscriptions();
  }, 500);

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
