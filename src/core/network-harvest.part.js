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
  const videoPosterRegistry = new Map(); // posterKey -> { type:'video'|'gif', url }
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
        headers,
        body: opts.body || undefined,
        signal: controller ? controller.signal : undefined,
      });
      if (!response || !response.ok) throw new Error(`X 接口返回 ${response ? response.status : '未知状态'}`);
      return await response.json();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function notificationUserFromRest(raw, enabled) {
    if (!raw || typeof raw !== 'object') return null;
    return sanitizeNotificationSubscription({
      id: raw.id_str || raw.id,
      username: raw.screen_name,
      displayName: raw.name,
      avatarUrl: raw.profile_image_url_https || raw.profile_image_url,
      enabled,
      updatedAt: now(),
    });
  }

  async function syncNotificationSubscriptions() {
    if (state.notificationSyncInProgress) return;
    const viewerId = getCurrentViewerId();
    if (!viewerId) {
      showToast('⚠️ 无法读取当前 X 用户 ID，请确认已经登录');
      return;
    }
    state.notificationSyncInProgress = true;
    renderNotificationSubscriptions();
    const collected = new Map();
    let cursor = '-1';
    let pageCount = 0;
    try {
      do {
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
        const payload = await requestXSessionJson(`/i/api/1.1/friends/following/list.json?${params}`);
        const users = Array.isArray(payload && payload.users) ? payload.users : [];
        for (const rawUser of users) {
          const username = safeString(rawUser && rawUser.screen_name, 30).replace(/^@+/, '');
          if (username) rememberFollowingRelation(username, true);
          if (rawUser && rawUser.notifications === true) {
            const item = notificationUserFromRest(rawUser, true);
            if (item) collected.set(item.username.toLowerCase(), item);
          }
        }
        cursor = safeString((payload && (payload.next_cursor_str || payload.next_cursor)) || '0', 200);
        pageCount++;
        if (pageCount >= 50 && cursor && cursor !== '0') throw new Error('关注账号过多，已达到 50 页安全上限');
      } while (cursor && cursor !== '0');

      // 同步响应可能被裁剪或暂时遗漏账号，只增量合并，不据此删除本地订阅。
      for (const [key, item] of collected) {
        const existing = notificationSubscriptions.get(key);
        notificationSubscriptions.set(key, { ...(existing || {}), ...item, enabled: true, updatedAt: now() });
      }
      state.settings.notificationSubscriptionsSyncedAt = now();
      scheduleNotificationSubscriptionsPersist();
      const enabledTotal = [...notificationSubscriptions.values()].filter((item) => item.enabled).length;
      showToast(`✅ 本次识别 ${collected.size} 个，当前保留 ${enabledTotal} 个订阅`);
    } catch (err) {
      console.error('[BetterX] sync notification subscriptions failed:', err);
      showToast(`⚠️ 同步失败：${safeString(err && err.message, 120) || '未知错误'}`);
    } finally {
      state.notificationSyncInProgress = false;
      renderNotificationSubscriptions();
    }
  }

  async function updateNotificationSubscription(username, enabled) {
    const key = safeString(username, 30).replace(/^@+/, '').toLowerCase();
    const existing = notificationSubscriptions.get(key);
    if (!existing || !/^\d{1,30}$/.test(existing.id) || state.notificationMutationUsers.has(key)) return;
    const desiredEnabled = enabled === true;
    const mutationGuard = beginNotificationMutationGuard(key, desiredEnabled);
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
    state.notificationMutationUsers.add(key);
    renderNotificationSubscriptions();
    try {
      await requestXSessionJson('/i/api/1.1/friendships/update.json', {
        method: 'POST',
        form: true,
        body: body.toString(),
      });
      rememberNotificationSubscription(existing, desiredEnabled, {
        trackDisabled: true,
        authoritative: true,
      });
      mutationGuard.pending = false;
      mutationGuard.expiresAt = now() + NOTIFICATION_MUTATION_GUARD_MS;
      renderNotificationSubscriptions();
      showToast(desiredEnabled ? `✅ 已开启 @${existing.username} 的帖子通知` : `已关闭 @${existing.username} 的帖子通知`);
    } catch (err) {
      if (notificationMutationGuards.get(key) === mutationGuard) notificationMutationGuards.delete(key);
      console.error('[BetterX] update notification subscription failed:', err);
      showToast(`⚠️ 修改失败：${safeString(err && err.message, 120) || '未知错误'}`);
    } finally {
      state.notificationMutationUsers.delete(key);
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

  function harvestNotificationRelationship(obj) {
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
        rememberNotificationSubscription(targetUser, relationshipSource.notifications_enabled, { trackDisabled: true });
      }
    }
    const legacy = obj.legacy && typeof obj.legacy === 'object' ? obj.legacy : null;
    const core = obj.core && typeof obj.core === 'object' ? obj.core : null;
    const settings = obj.notifications_settings && typeof obj.notifications_settings === 'object'
      ? obj.notifications_settings
      : null;
    // 普通关注列表中的 notifications=false 可能来自裁剪响应；只把 true 当作新增证据。
    // 明确关闭仅接受用户资料字段或铃铛修改响应，避免同步时误删本地订阅。
    const enabled = settings && typeof settings.notifications_enabled === 'boolean'
      ? settings.notifications_enabled
      : (obj.notifications === true || (legacy && legacy.notifications === true) ? true : null);
    if (typeof enabled !== 'boolean') return;

    const username = safeString(
      (legacy && legacy.screen_name) || (core && core.screen_name) || obj.screen_name || obj.username || '',
      30
    ).replace(/^@+/, '');
    const id = safeString(obj.rest_id || obj.id_str || obj.id || (legacy && legacy.id_str) || '', 30);
    if (!/^[a-z0-9_]{1,15}$/i.test(username) || !/^\d{1,30}$/.test(id)) return;
    const avatar = obj.avatar && typeof obj.avatar === 'object' ? obj.avatar : null;
    rememberNotificationSubscription({
      id,
      username,
      displayName: safeString((core && core.name) || obj.name || (legacy && legacy.name) || '', 100),
      avatarUrl: safeImportedAssetUrl(
        (avatar && (avatar.image_url || avatar.imageUrl))
        || (legacy && (legacy.profile_image_url_https || legacy.profile_image_url))
        || obj.profile_image_url_https || obj.profile_image_url || ''
      ),
    }, enabled);
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
      || txt.indexOf('"following"') !== -1 || txt.indexOf('relationship_perspectives') !== -1
      || txt.indexOf('notifications_settings') !== -1 || txt.indexOf('notifications_enabled') !== -1
      || txt.indexOf('"notifications"') !== -1;
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
      harvestNotificationRelationship(value);
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

  // ── 下载命名 ──────────────────────────────────────────────────────
  // 模板变量与参考格式保持直观：账号显示名 / ID、帖子 ID、正文、时间和媒体类型都可组合。
  // 扩展名统一由下载器追加，避免模板误填后出现 .jpg.jpg。
