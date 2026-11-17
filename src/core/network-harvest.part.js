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
  // 视频海报 -> 真实 MP4。引用帖嵌套较深时，DOM 只保留外层帖子 ID，
  // 而 GraphQL 会把媒体登记在内层帖子 ID 下；用页面可见的海报 ID 跨层关联两者。
  const videoPosterRegistry = new Map(); // posterKey -> { type:'video'|'gif', url, thumbnailUrl }
  const tweetDetailMediaLookupJobs = new Map(); // statusId -> Promise<boolean>
  // 当全局网络采集没有命中视频时按需查询单帖详情；不依赖浏览器或兼容模式。
  const TWEET_DETAIL_QUERY_ID = 'zAz9764BcLZOJ0JU2wrd1A';
  const TWEET_DETAIL_FEATURES = {
    creator_subscriptions_tweet_preview_api_enabled: true,
    premium_content_api_read_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: false,
    responsive_web_grok_analyze_post_followups_enabled: false,
    responsive_web_jetfuel_frame: false,
    responsive_web_grok_share_attachment_enabled: true,
    articles_preview_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    responsive_web_grok_show_grok_translated_post: false,
    responsive_web_grok_analysis_button_from_backend: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    profile_label_improvements_pcf_label_in_post_enabled: true,
    rweb_tipjar_consumption_enabled: true,
    verified_phone_label_enabled: false,
    responsive_web_grok_image_annotation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_enhance_cards_enabled: false,
  };

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

  function getVideoPosterKey(rawUrl) {
    if (!rawUrl) return '';
    try {
      const url = new URL(String(rawUrl), 'https://pbs.twimg.com');
      if (!/(?:^|\.)twimg\.com$/i.test(url.hostname)) return '';
      const path = url.pathname;
      const directoryMatch = path.match(/\/(amplify_tw_video_thumb|amplify_video_thumb|ext_tw_video_thumb)\/([A-Za-z0-9_-]+)/i);
      if (directoryMatch) return `${directoryMatch[1].toLowerCase()}:${directoryMatch[2]}`;
      const gifMatch = path.match(/\/tweet_video_thumb\/([A-Za-z0-9_-]+)(?:\.[A-Za-z0-9]+)?$/i);
      return gifMatch ? `tweet_video_thumb:${gifMatch[1]}` : '';
    } catch (err) { return ''; }
  }

  function registerVideoPosterMedia(media, mp4Url) {
    if (!media || !mp4Url) return;
    const posterUrl = media.media_url_https || media.media_url || '';
    const posterKey = getVideoPosterKey(posterUrl);
    if (!posterKey) return;
    setBoundedRegistryEntry(videoPosterRegistry, posterKey, {
      type: media.type === 'animated_gif' ? 'gif' : 'video',
      url: mp4Url,
      thumbnailUrl: safeHttpsUrl(posterUrl, ['pbs.twimg.com']),
    });
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
          registerVideoPosterMedia(m, mp4s[0].url);
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
      if (mp4s[0]) {
        (m.type === 'animated_gif' ? acc.gifs : acc.videos).push(mp4s[0].url);
        registerVideoPosterMedia(m, mp4s[0].url);
        return true;
      }
    }
    return false;
  }

  function readCookieValue(name) {
    const prefix = `${name}=`;
    try {
      const part = String(document.cookie || '').split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
      return part ? decodeURIComponent(part.slice(prefix.length)) : '';
    } catch (err) { return ''; }
  }

  function isFirefoxCompatibilityActive() {
    return IS_FIREFOX && firefoxCompatibilityMode === 'compat';
  }

  function buildFirefoxTweetDetailHeaders() {
    const headers = {
      authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
      'x-twitter-client-language': 'en',
      'x-twitter-active-user': 'yes',
      'content-type': 'application/json',
    };
    const csrfToken = readCookieValue('ct0');
    const guestToken = readCookieValue('gt');
    if (csrfToken) headers['x-csrf-token'] = csrfToken;
    if (guestToken) headers['x-guest-token'] = guestToken;
    else headers['x-twitter-auth-type'] = 'OAuth2Session';
    return headers;
  }

  function getCurrentViewerId() {
    const twid = readCookieValue('twid');
    const match = String(twid || '').match(/(?:^|=)u?=?([0-9]{1,30})$/i)
      || String(twid || '').match(/u=([0-9]{1,30})/i);
    return match ? match[1] : '';
  }

  async function requestXSessionJson(pathOrUrl, options) {
    const opts = options || {};
    const url = new URL(pathOrUrl, location.origin).href;
    const headers = buildFirefoxTweetDetailHeaders();
    if (readCookieValue('ct0')) headers['x-twitter-auth-type'] = 'OAuth2Session';
    if (opts.form) headers['content-type'] = 'application/x-www-form-urlencoded';
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 30000) : null;
    try {
      const pageWin = getPageWindow();
      const fetchImpl = pageWin && typeof pageWin.fetch === 'function' ? pageWin.fetch : fetch;
      const response = await fetchImpl.call(pageWin || window, url, {
        method: opts.method || 'GET',
        credentials: 'include',
        ...(opts.cache ? { cache: opts.cache } : {}),
        ...(opts.skipUserDetailHarvest ? { __xvSkipUserDetailHarvest: true } : {}),
        headers,
        body: opts.body || undefined,
        signal: controller ? controller.signal : undefined,
      });
      if (!response || !response.ok) {
        let payload = null;
        try { payload = await response?.json(); } catch {}
        throw makeXSessionRequestError(response?.status, payload);
      }
      const payload = await response.json();
      if (Array.isArray(payload?.errors) && payload.errors.length) throw makeXSessionRequestError(response.status, payload);
      if (!opts.skipUserDetailHarvest && USER_DETAIL_API_RE.test(url)) harvestUserDetailPayload(payload, url);
      return payload;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function makeXSessionRequestError(status, payload) {
    const error = new Error(`X 接口返回 ${status || '未知状态'}`);
    error.status = Number(status) || 0;
    error.codes = (Array.isArray(payload?.errors) ? payload.errors : [])
      .map((item) => Number(item?.code)).filter(Number.isFinite);
    return error;
  }

  const SHORT_LINK_HOSTS = [
    't.co', 't.cn', 'x.gd', 'bit.ly', 'c1n.cn', 'tinyurl.com', 'shrturi.com', 'dub.sh',
    'is.gd', 'v.gd', 'ow.ly', 't.ly', 'cutt.ly', 'rb.gy', 'reurl.cc', 'url.cn', 'suo.im',
  ];
  const SHORT_LINK_RESOLVE_TIMEOUT_MS = 6000;
  const SHORT_LINK_CACHE_KEY = 'betterx_short_links';
  const SHORT_LINK_CACHE_TTL_MS = 365 * 24 * 60 * 60 * 1000;
  const SHORT_LINK_CACHE_LIMIT = 300;
  let shortLinkCache = null;

  function isShortUrl(url) {
    try {
      const host = new URL(url).hostname.toLowerCase().replace(/\.$/, '');
      return SHORT_LINK_HOSTS.some((domain) => host === domain || host.endsWith('.' + domain));
    } catch { return false; }
  }

  function authorLinkLabel(href) {
    try {
      const { hostname, pathname, search } = new URL(href);
      const text = hostname.replace(/^www\./, '') + pathname.replace(/\/$/, '') + search;
      return text.length > 40 ? text.slice(0, 39) + '…' : text;
    } catch { return href; }
  }

  function resolvedLinkUrl(candidate, original) {
    try {
      const { href, protocol } = new URL(candidate);
      // 只换协议（http→https）的跳转仍停在短链服务商，继续解析没有意义。
      if ((protocol !== 'http:' && protocol !== 'https:') || href === original || isShortUrl(href)) return '';
      return href;
    } catch { return ''; }
  }

  function requestShortUrlRedirect(method, url, timeout) {
    return new Promise((resolve, reject) => {
      try {
        GM_xmlhttpRequest({
          method, url, timeout, anonymous: true,
          onload: (response) => resolve(response || {}),
          onerror: () => reject(new Error('short link network error')),
          ontimeout: () => reject(new Error('short link timeout')),
          onabort: () => reject(new Error('short link aborted')),
        });
      } catch (error) { reject(error); }
    });
  }

  function readShortLinkCache() {
    if (!shortLinkCache) {
      shortLinkCache = {};
      try {
        const stored = GM_getValue(SHORT_LINK_CACHE_KEY, null);
        if (stored && typeof stored === 'object' && !Array.isArray(stored)) shortLinkCache = stored;
      } catch {}
    }
    return shortLinkCache;
  }

  function getCachedShortLink(url) {
    const entry = readShortLinkCache()[url];
    if (!Number.isFinite(entry?.expiresAt) || entry.expiresAt <= now()) return '';
    return resolvedLinkUrl(entry.href, url);
  }

  // 短链还原结果单独存一年：资料缓存过期后重新抓取也能直接复用，不再打短链服务商。
  function rememberShortLink(url, href) {
    const cache = readShortLinkCache();
    cache[url] = { href, expiresAt: now() + SHORT_LINK_CACHE_TTL_MS };
    const keys = Object.keys(cache);
    if (keys.length > SHORT_LINK_CACHE_LIMIT) {
      for (const key of keys) if (!(cache[key]?.expiresAt > now())) delete cache[key];
      const overflow = Object.keys(cache).sort((left, right) => cache[left].expiresAt - cache[right].expiresAt);
      while (overflow.length > SHORT_LINK_CACHE_LIMIT) delete cache[overflow.shift()];
    }
    try { GM_setValue(SHORT_LINK_CACHE_KEY, cache); } catch {}
  }

  // HEAD 最省流量，但部分短链服务商拒绝 HEAD 或不带跳转响应，回退 GET 时共享同一超时预算。
  async function resolveShortUrl(url, timeoutMs = SHORT_LINK_RESOLVE_TIMEOUT_MS) {
    if (!isShortUrl(url)) return url;
    const cached = getCachedShortLink(url);
    if (cached) return cached;
    const deadline = Date.now() + timeoutMs;
    for (const method of ['HEAD', 'GET']) {
      const timeout = deadline - Date.now();
      if (timeout <= 0) break;
      try {
        const { finalUrl } = await requestShortUrlRedirect(method, url, timeout);
        const resolved = resolvedLinkUrl(finalUrl, url);
        if (resolved) {
          rememberShortLink(url, resolved);
          return resolved;
        }
      } catch {}
    }
    return url;
  }

  const USER_DETAIL_API_RE = /\/(?:i\/api\/)?(?:graphql\/[^/]+\/(?:UserByScreenName|UserByRestId|UsersByRestIds|ProfileSpotlightsQuery)|1\.1\/users\/show\.json)(?:[/?#]|$)/i;
  const AUTHORITATIVE_USER_DETAIL_API_RE = /\/(?:i\/api\/)?(?:graphql\/[^/]+\/UserByScreenName|1\.1\/users\/show\.json)(?:[/?#]|$)/i;
  const TIMELINE_PROFILE_HARVEST_API_RE = /\/(?:i\/api\/)?(?:graphql\/[^/]+\/(?:Home|UserTweets|UserMedia|UserHighlights|TweetDetail|.*Timeline|Bookmarks|Likes|Explore)|2\/timeline\/)/i;
  const TIMELINE_PROFILE_HARVEST_LIMIT = 500;
  const timelineHarvestedAuthorLinks = new Map();
  const harvestedLegacySubnodes = new WeakSet();

  function extractRequestedScreenName(url) {
    try {
      const parsed = new URL(String(url || ''), location.origin);
      const vars = parsed.searchParams.get('variables');
      if (vars) {
        const obj = JSON.parse(vars);
        if (typeof obj?.screen_name === 'string') return obj.screen_name;
      }
      const queryName = parsed.searchParams.get('screen_name');
      return typeof queryName === 'string' ? queryName : '';
    } catch { return ''; }
  }

  function extractScreenNameFromProfileNode(profile, fallbackScreenName = '') {
    const raw = profile?.legacy?.screen_name || profile?.core?.screen_name || profile?.screen_name || fallbackScreenName || '';
    const clean = String(raw).trim().replace(/^@+/, '').toLowerCase();
    return /^[a-z0-9_]{1,15}$/.test(clean) ? clean : '';
  }

  function extractLinksFromProfileNode(profile) {
    const entitySources = [profile?.profile_bio?.entities, profile?.legacy?.entities, profile?.entities];
    const links = new Map();
    for (const field of entitySources.flatMap((entities) => [entities?.description, entities?.url])) {
      if (!Array.isArray(field?.urls)) continue;
      for (const entry of field.urls) {
        const rawUrl = entry?.expanded_url || entry?.url;
        if (typeof rawUrl !== 'string') continue;
        try {
          const { href, protocol } = new URL(rawUrl);
          if ((protocol !== 'https:' && protocol !== 'http:') || links.has(href)) continue;
          const label = typeof entry.display_url === 'string' ? entry.display_url.trim() : '';
          links.set(href, { href, label: label || href });
        } catch {}
      }
    }
    return [...links.values()];
  }

  function getProfileHarvestInfo(profile, url = '') {
    if (!profile || typeof profile !== 'object' || profile.__typename === 'UserUnavailable') return null;
    const hasProfileBioEntities = Boolean(profile.profile_bio?.entities && typeof profile.profile_bio.entities === 'object');
    const hasLegacyEntities = Boolean(profile.legacy?.entities && typeof profile.legacy.entities === 'object');
    const hasRootEntities = Boolean(profile.entities && typeof profile.entities === 'object');
    if (!hasProfileBioEntities && !hasLegacyEntities && !hasRootEntities) return null;

    const rawProfileUrl = typeof profile.legacy?.url === 'string'
      ? profile.legacy.url
      : (typeof profile.url === 'string' ? profile.url : '');
    const hasUnexpandedUrl = /^https?:\/\//i.test(rawProfileUrl.trim())
      && !Array.isArray(profile.legacy?.entities?.url?.urls)
      && !Array.isArray(profile.entities?.url?.urls)
      && !Array.isArray(profile.profile_bio?.entities?.url?.urls);
    const hasDescriptionOrUrlField = Boolean(
      profile.legacy?.entities?.description || profile.legacy?.entities?.url
      || profile.entities?.description || profile.entities?.url
      || (hasLegacyEntities && (profile.profile_bio?.entities?.description || profile.profile_bio?.entities?.url))
    );
    const isCompleteProfile = (hasLegacyEntities || hasRootEntities) && hasDescriptionOrUrlField && !hasUnexpandedUrl;
    const allowEmptyCache = isCompleteProfile && AUTHORITATIVE_USER_DETAIL_API_RE.test(url);
    return {
      links: extractLinksFromProfileNode(profile),
      isCompleteProfile,
      allowEmptyCache,
    };
  }

  function isAuthorLinksHarvestActive() {
    return Boolean(state.settings.authorLinksEnabled
      || (!state.settingsLoaded && readSettingsMirror()?.authorLinksEnabled));
  }

  function isTimelineUserProfileNode(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    if (harvestedLegacySubnodes.has(value)) return false;
    if (value.__typename === 'UserUnavailable' || value.__typename === 'Tweet') return false;
    if (typeof value.full_text === 'string' || typeof value.legacy?.full_text === 'string') return false;
    if (value.__typename === 'User') return true;
    // 兼容未携带 __typename 的 User 节点，同时避免把 User.legacy 子对象误当成独立用户节点。
    if (value.rest_id || value.core || value.profile_bio) return true;
    return typeof value.id_str === 'string' && typeof value.screen_name === 'string'
      && Boolean(value.entities?.description || value.entities?.url);
  }

  function harvestTimelineUserProfileLinks(value, harvestedAuthors) {
    if (!isTimelineUserProfileNode(value)) return;
    if (value.legacy && typeof value.legacy === 'object') harvestedLegacySubnodes.add(value.legacy);
    const info = getProfileHarvestInfo(value);
    if (!info || !info.links.length) return;
    const screenName = extractScreenNameFromProfileNode(value);
    if (!screenName) return;
    const seenComplete = harvestedAuthors?.get(screenName);
    if (seenComplete === true || (seenComplete === false && !info.isCompleteProfile)) return;
    harvestedAuthors?.set(screenName, info.isCompleteProfile);
    if (!info.isCompleteProfile && hasValidNonEmptyAuthorLinksCache(screenName)) return;
    const rawKey = info.links.map((link) => link.href).join('\n');
    if (timelineHarvestedAuthorLinks.get(screenName) === rawKey && hasValidNonEmptyAuthorLinksCache(screenName)) return;
    if (timelineHarvestedAuthorLinks.has(screenName)) timelineHarvestedAuthorLinks.delete(screenName);
    timelineHarvestedAuthorLinks.set(screenName, rawKey);
    while (timelineHarvestedAuthorLinks.size > TIMELINE_PROFILE_HARVEST_LIMIT) {
      timelineHarvestedAuthorLinks.delete(timelineHarvestedAuthorLinks.keys().next().value);
    }
    cacheHarvestedAuthorProfileLinks(screenName, info.links, { preserveResolved: true });
  }

  function harvestUserDetailPayload(payload, url = '') {
    if (!payload || typeof payload !== 'object' || (Array.isArray(payload.errors) && payload.errors.length)) return;
    const fallbackScreenName = extractRequestedScreenName(url);
    const candidates = [];
    if (payload.data?.user?.result) candidates.push({ result: payload.data.user.result, fallbackScreenName });
    if (payload.data?.user_result_by_screen_name?.result) {
      candidates.push({ result: payload.data.user_result_by_screen_name.result, fallbackScreenName });
    }
    if (Array.isArray(payload.data?.users)) {
      for (const item of payload.data.users) {
        if (item) candidates.push({ result: item.result || item, fallbackScreenName: '' });
      }
    }
    if (!candidates.length && payload.screen_name && payload.entities) {
      candidates.push({ result: payload, fallbackScreenName });
    }
    for (const { result, fallbackScreenName: candidateFallback } of candidates) {
      const profile = result?.user || result;
      const info = getProfileHarvestInfo(profile, url);
      if (!info) continue;
      const screenName = extractScreenNameFromProfileNode(profile, candidateFallback);
      if (!screenName) continue;
      if (!info.links.length) {
        // 残缺资料或部分字段查询返回的空链接不得写负缓存，更不得覆盖已有有效缓存。
        if (!info.allowEmptyCache || hasValidNonEmptyAuthorLinksCache(screenName)) continue;
      } else if (!info.isCompleteProfile && hasValidNonEmptyAuthorLinksCache(screenName)) {
        continue;
      }
      cacheHarvestedAuthorProfileLinks(screenName, info.links);
    }
  }

  function harvestUserDetailResponseText(text, url = '') {
    if (!text || text.length > MAX_NETWORK_RESPONSE_BYTES) return;
    try { harvestUserDetailPayload(JSON.parse(text), url); } catch {}
  }

  async function requestAuthorProfileLinks(screenName) {
    const params = new URLSearchParams({
      variables: JSON.stringify({ screen_name: screenName, withGrokTranslatedBio: true }),
      features: JSON.stringify({
        hidden_profile_subscriptions_enabled: true,
        profile_label_improvements_pcf_label_in_post_enabled: true,
        responsive_web_profile_redirect_enabled: true,
        rweb_tipjar_consumption_enabled: false,
        verified_phone_label_enabled: false,
        subscriptions_verification_info_is_identity_verified_enabled: true,
        subscriptions_verification_info_verified_since_enabled: true,
        highlights_tweets_tab_ui_enabled: true,
        responsive_web_twitter_article_notes_tab_enabled: true,
        subscriptions_feature_can_gift_premium: false,
        creator_subscriptions_tweet_preview_api_enabled: true,
        responsive_web_graphql_timeline_navigation_enabled: true,
      }),
      fieldToggles: JSON.stringify({ withPayments: false, withAuxiliaryUserLabels: true }),
    });
    const payload = await requestXSessionJson('/i/api/graphql/AMIBMjtxEEATh4z8V9GtRg/UserByScreenName?' + params, { skipUserDetailHarvest: true });
    const result = payload?.data?.user?.result;
    const profile = result?.user || result;
    if (!profile || (!profile.profile_bio && !profile.legacy)) throw new Error('X returned no readable author profile');
    return resolveAuthorProfileLinks(extractLinksFromProfileNode(profile));
  }

  function isShortLinkLabel(label) {
    const text = String(label || '').trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/^\/+/, '');
    return text ? isShortUrl('https://' + text) : false;
  }

  async function resolveAuthorProfileLinks(links) {
    if (!links.some((link) => isShortUrl(link.href))) return links;
    const resolved = await Promise.all(links.map(async (link) => {
      const finalHref = await resolveShortUrl(link.href);
      if (finalHref === link.href) return link;
      // 短链形式的面板标签跟随真实地址，平台图标由解析后的域名决定。
      return { href: finalHref, label: isShortLinkLabel(link.label) ? authorLinkLabel(finalHref) : link.label };
    }));
    return [...new Map(resolved.map((link) => [link.href, link])).values()];
  }

  function notificationUserFromRest(raw, enabled) {
    if (!raw || typeof raw !== 'object') return null;
    const legacy = raw.legacy && typeof raw.legacy === 'object' ? raw.legacy : null;
    const core = raw.core && typeof raw.core === 'object' ? raw.core : null;
    const avatar = raw.avatar && typeof raw.avatar === 'object' ? raw.avatar : null;
    return sanitizeNotificationSubscription({
      id: raw.rest_id || raw.id_str || raw.id || legacy?.id_str,
      username: legacy?.screen_name || core?.screen_name || raw.screen_name || raw.username,
      displayName: core?.name || raw.name || legacy?.name,
      avatarUrl: avatar?.image_url || avatar?.imageUrl || legacy?.profile_image_url_https
        || legacy?.profile_image_url || raw.profile_image_url_https || raw.profile_image_url,
      enabled,
      updatedAt: now(),
    });
  }

  function getNotificationEnabledState(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const explicit = raw.notifications_settings?.notifications_enabled
      ?? raw.legacy?.notifications_settings?.notifications_enabled;
    if (typeof explicit === 'boolean') return explicit;
    // 关注列表的旧字段 false 不是可靠的关闭证据，保持与被动资料读取相同的规则。
    return raw.notifications === true || raw.legacy?.notifications === true ? true : null;
  }

  function parseNotificationFollowingPage(payload) {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.users)) {
      throw new Error('X 未返回有效的关注列表，请稍后重试');
    }
    if (Array.isArray(payload.errors) && payload.errors.length) throw new Error('X 返回接口错误，请稍后重试');
    const rawCursor = payload.next_cursor_str ?? payload.next_cursor;
    const nextCursor = typeof rawCursor === 'string' ? rawCursor.trim()
      : (Number.isSafeInteger(rawCursor) ? String(rawCursor) : '');
    if (!nextCursor || nextCursor.length > 200) throw new Error('关注列表分页信息缺失，请稍后重试');
    return { users: payload.users, nextCursor };
  }

  async function syncNotificationSubscriptions() {
    const accountToken = ensureNotificationAccount();
    const readRevision = accountToken.session?.stateRevision || 0;
    if (state.notificationSyncInProgress || state.notificationCleanupInProgress) return;
    const viewerId = getCurrentViewerId();
    if (!viewerId) {
      showToast('⚠️ 无法读取当前 X 用户 ID，请确认已经登录');
      return;
    }
    state.notificationSyncInProgress = true;
    closeNotificationSyncDifferences();
    renderNotificationSubscriptions();
    const collected = new Map();
    const seenCursors = new Set();
    let cursor = '-1';
    let pageCount = 0;
    try {
      do {
        if (seenCursors.has(cursor)) throw new Error('关注列表分页没有前进，已停止同步');
        seenCursors.add(cursor);
        const params = new URLSearchParams({
          include_profile_interstitial_type: '1',
          include_blocking: '1',
          include_blocked_by: '1',
          include_followed_by: '1',
          include_want_retweets: '1',
          include_mute_edge: '1',
          include_can_dm: '1',
          include_can_media_tag: '1',
          include_ext_is_blue_verified: '1',
          include_ext_verified_type: '1',
          include_ext_profile_image_shape: '1',
          skip_status: '1',
          cursor,
          user_id: viewerId,
          count: '200',
          with_total_count: 'true',
        });
        // friends/following/list 是“你关注的粉丝”，不能用来枚举自己关注的全部账号。
        const payload = await requestXSessionJson(`/i/api/1.1/friends/list.json?${params}`, {
          cache: 'no-store',
          skipUserDetailHarvest: true,
        });
        if (!isCurrentNotificationAccount(accountToken)) return;
        const { users, nextCursor } = parseNotificationFollowingPage(payload);
        for (const rawUser of users) {
          const item = notificationUserFromRest(rawUser, true);
          if (!item) continue;
          rememberFollowingRelation(item.username, true);
          if (getNotificationEnabledState(rawUser) === true) collected.set(item.id, item);
        }
        cursor = nextCursor;
        pageCount++;
        if (pageCount >= 50 && cursor && cursor !== '0') throw new Error('关注账号过多，已达到 50 页安全上限');
      } while (cursor && cursor !== '0');

      // 同步响应可能被裁剪或暂时遗漏账号，只增量合并，不据此删除本地订阅。
      // 统一合并入口，保留本地置顶，并尊重刚刚修改铃铛时的竞态保护。
      if (!isCurrentNotificationAccount(accountToken)) return;
      mergeNotificationSubscriptions(collected.values(), { accountToken, readRevision });
      state.notificationSyncedAt = now();
      scheduleNotificationSubscriptionsPersist({ render: false });
      const enabledTotal = [...notificationSubscriptions.values()].filter((item) => item.enabled).length;
      showToast(`✅ 本次识别 ${collected.size} 个，当前保留 ${enabledTotal} 个订阅`);
      const differences = getNotificationSyncDifferences(collected);
      if (differences.length) showNotificationSyncDifferences(differences, viewerId, collected.size);
    } catch (err) {
      if (!isCurrentNotificationAccount(accountToken)) return;
      console.error('[BetterX] sync notification subscriptions failed:', err);
      showToast(`⚠️ 同步失败：${safeString(err && err.message, 120) || '未知错误'}`);
    } finally {
      if (isCurrentNotificationAccount(accountToken)) state.notificationSyncInProgress = false;
      renderNotificationSubscriptions();
    }
  }

  async function updateNotificationSubscription(username, enabled, options) {
    const accountToken = ensureNotificationAccount();
    if (!accountToken.viewerId) return { status: 'accountChanged' };
    const opts = options || {};
    const key = safeString(username, 30).replace(/^@+/, '').toLowerCase();
    const existing = opts.expectedId ? getNotificationSubscriptionById(opts.expectedId) : notificationSubscriptions.get(key);
    if (!existing || !/^\d{1,30}$/.test(existing.id) || state.notificationMutationUsers.has(existing.id)
        || (state.notificationCleanupInProgress && !opts.cleanup)
        || (opts.expectedId && existing.id !== opts.expectedId)) return { status: 'skipped' };
    if (opts.viewerId && accountToken.viewerId !== opts.viewerId) return { status: 'accountChanged' };
    const desiredEnabled = enabled === true;
    const mutationGuard = beginNotificationMutationGuard(existing.id, desiredEnabled);
    const body = new URLSearchParams({
      include_profile_interstitial_type: '1',
      include_blocking: '1',
      include_blocked_by: '1',
      include_followed_by: '1',
      include_want_retweets: '1',
      include_mute_edge: '1',
      include_can_dm: '1',
      include_can_media_tag: '1',
      include_ext_is_blue_verified: '1',
      include_ext_verified_type: '1',
      include_ext_profile_image_shape: '1',
      skip_status: '1',
      cursor: '-1',
      id: existing.id,
      device: desiredEnabled ? 'true' : 'false',
    });
    state.notificationMutationUsers.add(existing.id);
    renderNotificationSubscriptions();
    try {
      await requestXSessionJson('/i/api/1.1/friendships/update.json', {
        method: 'POST',
        form: true,
        skipUserDetailHarvest: true,
        body: body.toString(),
      });
      if (!isCurrentNotificationAccount(accountToken)) {
        if (notificationMutationGuards.get(existing.id) === mutationGuard) notificationMutationGuards.delete(existing.id);
        return { status: 'accountChanged' };
      }
      rememberNotificationSubscription(getNotificationSubscriptionById(existing.id) || existing, desiredEnabled, {
        trackDisabled: true,
        authoritative: true,
        accountToken,
      });
      mutationGuard.pending = false;
      mutationGuard.expiresAt = now() + NOTIFICATION_MUTATION_GUARD_MS;
      renderNotificationSubscriptions();
      if (!opts.quiet) showToast(desiredEnabled ? `✅ 已开启 @${existing.username} 的帖子通知` : `已关闭 @${existing.username} 的帖子通知`);
      return { status: desiredEnabled ? 'enabled' : 'closed', enabled: desiredEnabled };
    } catch (err) {
      if (!isCurrentNotificationAccount(accountToken)) return { status: 'accountChanged' };
      const unavailable = opts.cleanup && !desiredEnabled && getCurrentViewerId() === opts.viewerId
        && ((err.status === 404 && err.codes?.includes(50)) || (err.status === 403 && err.codes?.includes(63)));
      if (unavailable) {
        rememberNotificationSubscription(getNotificationSubscriptionById(existing.id) || existing, false,
          { trackDisabled: true, authoritative: true, accountToken });
        mutationGuard.pending = false;
        mutationGuard.expiresAt = now() + NOTIFICATION_MUTATION_GUARD_MS;
        return { status: 'localOnly' };
      }
      if (notificationMutationGuards.get(existing.id) === mutationGuard) notificationMutationGuards.delete(existing.id);
      console.error('[BetterX] update notification subscription failed:', err);
      if (!opts.quiet) showToast(`⚠️ 修改失败：${safeString(err && err.message, 120) || '未知错误'}`);
      return { status: 'failed', rateLimited: err.status === 429 || err.codes?.includes(88) === true };
    } finally {
      if (isCurrentNotificationAccount(accountToken)) state.notificationMutationUsers.delete(existing.id);
      renderNotificationSubscriptions();
    }
  }

  function extractMediaFromTweetDetail(payload, statusId) {
    const targetId = String(statusId || '');
    if (!payload || !targetId) return false;
    const stack = [payload];
    let scanned = 0;
    let foundMedia = false;
    while (stack.length && scanned < 12000) {
      const current = stack.pop();
      scanned++;
      if (!current || typeof current !== 'object') continue;
      const candidates = [current, current.tweet, current.tweet_results && current.tweet_results.result].filter(Boolean);
      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object') continue;
        const legacy = candidate.legacy && typeof candidate.legacy === 'object' ? candidate.legacy : null;
        const candidateId = String(candidate.rest_id || candidate.id_str || candidate.id || (legacy && legacy.id_str) || '');
        const media = (candidate.extended_entities && candidate.extended_entities.media)
          || (legacy && legacy.extended_entities && legacy.extended_entities.media);
        // 同时登记内层引用帖：外层 TweetResultByRestId 的媒体可能只存在于
        // quoted_status_result / retweeted_status_result 的后代节点中。
        if (candidateId && Array.isArray(media) && media.length) {
          registerMedia(candidateId, media);
          foundMedia = true;
        }
        const card = candidate.card || (legacy && legacy.card);
        if (candidateId && card) {
          harvestCard(candidateId, card);
          const cardMedia = cardRegistry.get(candidateId);
          if (cardMedia && (cardMedia.photos.length || cardMedia.gifs.length || cardMedia.videos.length)) foundMedia = true;
        }
      }
      const children = Array.isArray(current) ? current : Object.values(current);
      for (const child of children) {
        if (child && typeof child === 'object') stack.push(child);
      }
    }
    return foundMedia;
  }

  function requestTweetDetailMediaWithGm(url, statusId) {
    if (typeof GM_xmlhttpRequest !== 'function') return Promise.resolve(false);
    return new Promise((resolve) => {
      try {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          headers: buildFirefoxTweetDetailHeaders(),
          responseType: 'json',
          timeout: 30000,
          onload: (response) => {
            if (!response || response.status < 200 || response.status >= 300) { resolve(false); return; }
            let payload = response.response;
            // 部分 Violentmonkey + Firefox 组合即使声明 json，仍只提供 responseText。
            if ((!payload || typeof payload === 'string') && response.responseText) payload = response.responseText;
            if (typeof payload === 'string') {
              try { payload = JSON.parse(payload); } catch (err) { resolve(false); return; }
            }
            resolve(extractMediaFromTweetDetail(payload, statusId));
          },
          onerror: () => resolve(false),
          ontimeout: () => resolve(false),
          onabort: () => resolve(false),
        });
      } catch (err) { resolve(false); }
    });
  }

  function requestTweetDetailMedia(statusId) {
    const id = String(statusId || '');
    if (!id) return Promise.resolve(false);
    if (tweetDetailMediaLookupJobs.has(id)) return tweetDetailMediaLookupJobs.get(id);
    const variables = { tweetId: id, withCommunity: false, includePromotedContent: false, withVoice: false };
    const fieldToggles = { withArticleRichContentState: true, withArticlePlainText: false, withGrokAnalyze: false, withDisallowedReplyControls: false };
    const url = `https://x.com/i/api/graphql/${TWEET_DETAIL_QUERY_ID}/TweetResultByRestId?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(TWEET_DETAIL_FEATURES))}&fieldToggles=${encodeURIComponent(JSON.stringify(fieldToggles))}`;
    const task = (async () => {
      // 参考 Azuki 的 X/Twitter 媒体批量下载器（MIT）：
      // https://greasyfork.org/scripts/528890
      // 发现 DOM 视频后直接通过 GM_xmlhttpRequest 查询 TweetResultByRestId，
      // 不依赖全局 fetch/XHR Hook 是否成功，也沿用脚本管理器默认的 Cookie 行为。
      if (await requestTweetDetailMediaWithGm(url, id)) return true;
      // 脚本管理器未提供 GM 请求或请求失败时，再用带登录态的同源 fetch 兜底。
      try {
        const payload = await requestXSessionJson(url);
        return extractMediaFromTweetDetail(payload, id);
      } catch (err) {
        debugLog('same-origin tweet detail lookup failed:', err);
        return false;
      }
    })().finally(() => tweetDetailMediaLookupJobs.delete(id));
    tweetDetailMediaLookupJobs.set(id, task);
    return task;
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

  function harvestNotificationRelationship(obj, accountToken = ensureNotificationAccount(), readRevision = accountToken.session?.stateRevision || 0, batch) {
    if (!isCurrentNotificationAccount(accountToken, false)) return;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    const relationship = obj.relationship && typeof obj.relationship === 'object' ? obj.relationship : null;
    const relationshipSource = relationship && relationship.source && typeof relationship.source === 'object'
      ? relationship.source
      : null;
    const relationshipTarget = relationship && relationship.target && typeof relationship.target === 'object'
      ? relationship.target
      : null;
    if (relationshipSource && relationshipTarget && typeof relationshipSource.notifications_enabled === 'boolean') {
      const targetUser = notificationUserFromRest(relationshipTarget, relationshipSource.notifications_enabled);
      if (targetUser) {
        rememberNotificationSubscription(targetUser, relationshipSource.notifications_enabled, { trackDisabled: true, accountToken, readRevision, batch });
      }
    }
    // 普通关注列表中的 notifications=false 可能来自裁剪响应；只把 true 当作新增证据。
    // 明确关闭仅接受用户资料字段或铃铛修改响应，避免同步时误删本地订阅。
    const enabled = getNotificationEnabledState(obj);
    if (typeof enabled !== 'boolean') return;
    const user = notificationUserFromRest(obj, enabled);
    if (user) rememberNotificationSubscription(user, enabled, { accountToken, readRevision, batch });
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

  function textMayContainHarvestData(txt, harvestProfileLinks = false) {
    return txt.indexOf('extended_entities') !== -1 || txt.indexOf('binding_values') !== -1
      || txt.indexOf('"following"') !== -1 || txt.indexOf('relationship_perspectives') !== -1
      || txt.indexOf('notifications_settings') !== -1 || txt.indexOf('notifications_enabled') !== -1
      || txt.indexOf('"notifications"') !== -1
      || (harvestProfileLinks && (txt.indexOf('profile_bio') !== -1 || txt.indexOf('expanded_url') !== -1));
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

  function enqueueNetworkHarvestObject(root, accountToken = ensureNotificationAccount(), readRevision = accountToken.session?.stateRevision || 0, options = null) {
    if (!root || typeof root !== 'object') return;
    if (networkHarvestQueue.length >= MAX_NETWORK_HARVEST_JOBS) {
      networkHarvestDroppedJobs++;
      return;
    }
    const harvestProfileLinks = Boolean(options?.harvestProfileLinks)
      && !(Array.isArray(root.errors) && root.errors.length && !root.data);
    networkHarvestQueue.push({
      type: 'object', stack: [{ value: root, depth: 0 }], processedNodes: 0,
      accountToken, readRevision,
      harvestProfileLinks,
      harvestedAuthors: new Map(),
    });
    scheduleNetworkHarvestDrain();
  }

  function tryHarvest(txt, accountToken = ensureNotificationAccount(), readRevision = accountToken.session?.stateRevision || 0, options = null) {
    const harvestProfileLinks = Boolean(options?.harvestProfileLinks) && isAuthorLinksHarvestActive();
    if (!txt || txt.length > MAX_NETWORK_RESPONSE_BYTES || !textMayContainHarvestData(txt, harvestProfileLinks)) return;
    if (networkHarvestQueue.length >= MAX_NETWORK_HARVEST_JOBS
        || networkHarvestQueuedChars + txt.length > MAX_NETWORK_HARVEST_QUEUE_CHARS) {
      networkHarvestDroppedJobs++;
      return;
    }
    networkHarvestQueuedChars += txt.length;
    networkHarvestQueue.push({
      type: 'text', text: txt, charLength: txt.length,
      accountToken, readRevision,
      harvestProfileLinks,
      harvestedAuthors: new Map(),
    });
    scheduleNetworkHarvestDrain();
  }

  function processHarvestObjectNode(value, depth, stack, accountToken, readRevision, batch, harvestProfileLinks = false, harvestedAuthors = null) {
    if (!value || typeof value !== 'object' || depth > 40) return;
    if (!Array.isArray(value)) {
      harvestFollowingRelationship(value);
      harvestNotificationRelationship(value, accountToken, readRevision, batch);
      if (harvestProfileLinks) harvestTimelineUserProfileLinks(value, harvestedAuthors);
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
    const accountToken = ensureNotificationAccount();
    const authorLinksActive = isAuthorLinksHarvestActive();
    const batch = { changed: false };
    let nodeBudget = NETWORK_HARVEST_SLICE_NODES;
    while (networkHarvestQueue.length && nodeBudget > 0) {
      if (typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() <= 2 && nodeBudget < NETWORK_HARVEST_SLICE_NODES) break;
      let job = networkHarvestQueue[0];
      if (job.type === 'text') {
        networkHarvestQueuedChars = Math.max(0, networkHarvestQueuedChars - (job.charLength || 0));
        let parsed;
        try { parsed = JSON.parse(job.text); } catch (err) { networkHarvestQueue.shift(); continue; }
        const harvestProfileLinks = Boolean(job.harvestProfileLinks)
          && !(Array.isArray(parsed?.errors) && parsed.errors.length && !parsed?.data);
        job = {
          type: 'object', stack: [{ value: parsed, depth: 0 }], processedNodes: 0,
          accountToken: job.accountToken, readRevision: job.readRevision,
          harvestProfileLinks, harvestedAuthors: job.harvestedAuthors || new Map(),
        };
        networkHarvestQueue[0] = job;
        nodeBudget = Math.max(1, nodeBudget - 50);
      }
      const harvestProfileLinks = Boolean(job.harvestProfileLinks && authorLinksActive);
      while (job.stack.length && nodeBudget > 0 && job.processedNodes < MAX_NETWORK_HARVEST_NODES_PER_JOB) {
        const node = job.stack.pop();
        job.processedNodes++;
        nodeBudget--;
        try {
          processHarvestObjectNode(node.value, node.depth, job.stack, job.accountToken, job.readRevision, batch, harvestProfileLinks, job.harvestedAuthors);
        } catch (err) {}
        if (typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() <= 2) break;
      }
      if (!job.stack.length || job.processedNodes >= MAX_NETWORK_HARVEST_NODES_PER_JOB) {
        if (job.processedNodes >= MAX_NETWORK_HARVEST_NODES_PER_JOB) networkHarvestDroppedJobs++;
        networkHarvestQueue.shift();
      } else {
        break;
      }
    }
    if (batch.changed && isCurrentNotificationAccount(accountToken)) scheduleNotificationSubscriptionsPersist();
  }

  function declaredResponseTooLarge(getHeader) {
    try {
      const raw = getHeader('content-length');
      const size = Number(raw);
      return Number.isFinite(size) && size > MAX_NETWORK_RESPONSE_BYTES;
    } catch (err) { return false; }
  }

  function harvestXhrResponse(xhr) {
    const accountToken = xhr?.__xvNotificationAccountToken;
    const readRevision = xhr?.__xvNotificationReadRevision;
    const url = xhr && xhr.__xvUrl ? String(xhr.__xvUrl) : '';
    const isApi = /(graphql|\/2\/timeline|\/i\/api\/)/i.test(url);
    const httpOk = xhr?.status === undefined || (Number(xhr.status) >= 200 && Number(xhr.status) < 300);
    const isUserDetail = httpOk && USER_DETAIL_API_RE.test(url);
    const harvestOptions = {
      harvestProfileLinks: httpOk && !USER_DETAIL_API_RE.test(url) && TIMELINE_PROFILE_HARVEST_API_RE.test(url),
    };
    if (!isApi && !isUserDetail) return;
    try {
      if (typeof xhr.getResponseHeader === 'function'
          && declaredResponseTooLarge((name) => xhr.getResponseHeader(name))) return;
      if (xhr.responseType === '' || xhr.responseType === 'text') {
        if (isUserDetail) harvestUserDetailResponseText(xhr.responseText, url);
        if (isApi) tryHarvest(xhr.responseText, accountToken, readRevision, harvestOptions);
      } else if (xhr.responseType === 'json' && xhr.response && typeof xhr.response === 'object') {
        if (isUserDetail) harvestUserDetailPayload(xhr.response, url);
        if (isApi) enqueueNetworkHarvestObject(xhr.response, accountToken, readRevision, harvestOptions);
      } else if (xhr.responseType === 'arraybuffer' && xhr.response && typeof xhr.response.byteLength === 'number' && xhr.response.byteLength <= MAX_NETWORK_RESPONSE_BYTES) {
        const text = new TextDecoder('utf-8').decode(new Uint8Array(xhr.response));
        if (isUserDetail) harvestUserDetailResponseText(text, url);
        if (isApi) tryHarvest(text, accountToken, readRevision, harvestOptions);
      } else if (xhr.responseType === 'blob' && xhr.response && typeof xhr.response.size === 'number' && typeof xhr.response.text === 'function' && xhr.response.size <= MAX_NETWORK_RESPONSE_BYTES) {
        xhr.response.text().then((text) => {
          if (isUserDetail) harvestUserDetailResponseText(text, url);
          if (isApi) tryHarvest(text, accountToken, readRevision, harvestOptions);
        }).catch(() => {});
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
            const accountToken = ensureNotificationAccount();
            const readRevision = accountToken.session?.stateRevision || 0;
            const reqUrl = typeof args[0] === 'string'
              ? args[0]
              : (args[0] && typeof args[0].url === 'string' ? args[0].url : (args[0] instanceof URL ? args[0].href : ''));
            const p = origFetch.apply(this, args);
            try {
              p.then((res) => {
                try {
                  const url = (res && res.url) || reqUrl;
                  const isApi = /(graphql|\/2\/timeline|\/i\/api\/)/i.test(url);
                  const httpOk = Boolean(res) && res.ok !== false && (!Number.isFinite(res.status) || (res.status >= 200 && res.status < 300));
                  const skipUserDetailHarvest = Boolean(args[1]?.__xvSkipUserDetailHarvest);
                  const isUserDetail = httpOk && !skipUserDetailHarvest && USER_DETAIL_API_RE.test(url);
                  const harvestOptions = {
                    harvestProfileLinks: httpOk && !skipUserDetailHarvest
                      && !USER_DETAIL_API_RE.test(url)
                      && TIMELINE_PROFILE_HARVEST_API_RE.test(url),
                  };
                  if (res && res.clone && (isApi || isUserDetail)) {
                    if (res.headers && declaredResponseTooLarge((name) => res.headers.get(name))) return;
                    const contentType = res.headers && res.headers.get ? (res.headers.get('content-type') || '') : '';
                    if (contentType && !/(?:json|javascript|text)/i.test(contentType)) return;
                    res.clone().text().then((text) => {
                      if (isUserDetail) harvestUserDetailResponseText(text, url);
                      if (isApi) tryHarvest(text, accountToken, readRevision, harvestOptions);
                    }).catch(() => {});
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
            this.__xvUrl = typeof url === 'string' ? url : (url && typeof url.href === 'string' ? url.href : String(url || ''));
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
            this.__xvNotificationAccountToken = ensureNotificationAccount();
            this.__xvNotificationReadRevision = this.__xvNotificationAccountToken.session?.stateRevision || 0;
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

  // ── 下载命名 ──────────────────────────────────────────────────────
  // 模板变量与参考格式保持直观：账号显示名 / ID、帖子 ID、正文、时间和媒体类型都可组合。
  // 扩展名统一由下载器追加，避免模板误填后出现 .jpg.jpg。
