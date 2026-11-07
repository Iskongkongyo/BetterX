  const notificationAccountSessions = new Map();
  let notificationAccountToken = null;
  let notificationAccountTrackingInstalled = false;

  function sanitizeNotificationAccountProfile(raw, trimHistory = true) {
    const users = new Map();
    for (const rawItem of Array.isArray(raw?.subscriptions) ? raw.subscriptions : []) {
      const item = sanitizeNotificationSubscription(rawItem);
      if (!item) continue;
      const previous = users.get(item.id);
      // 迁移旧版改名后留下的重复项；较新资料未带 pinned 时仍保留本地置顶。
      users.set(item.id, previous
        ? (item.updatedAt >= previous.updatedAt ? { ...previous, ...item } : { ...item, ...previous }) : item);
    }
    const handles = new Map();
    for (const item of users.values()) {
      const key = item.username.toLowerCase(), previous = handles.get(key);
      // 用户名可能被另一 ID 重新使用，不能把两个身份的本地状态合并。
      if (!previous || item.updatedAt >= previous.updatedAt) handles.set(key, item);
    }
    let subscriptions = [...handles.values()];
    if (trimHistory && subscriptions.length > MAX_NOTIFICATION_SUBSCRIPTIONS) {
      const enabled = subscriptions.filter((item) => item.enabled);
      const history = subscriptions.filter((item) => !item.enabled)
        .sort((a, b) => Number(b.pinned === true) - Number(a.pinned === true) || b.updatedAt - a.updatedAt);
      subscriptions = [...enabled, ...history.slice(0, Math.max(0, MAX_NOTIFICATION_SUBSCRIPTIONS - enabled.length))];
    }
    const syncedAt = Number(raw?.syncedAt);
    return { subscriptions, syncedAt: Number.isFinite(syncedAt) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, syncedAt)) : 0 };
  }

  function sanitizeNotificationAccounts(raw) {
    const accounts = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return accounts;
    for (const [id, profile] of Object.entries(raw)) {
      if (/^\d{1,30}$/.test(id) && profile && typeof profile === 'object' && !Array.isArray(profile)) {
        accounts[id] = sanitizeNotificationAccountProfile(profile);
      }
    }
    return accounts;
  }

  function applyNotificationAccountChanges(profile, changes) {
    const base = sanitizeNotificationAccountProfile(profile);
    const users = new Map(base.subscriptions.map((item) => [item.id, item]));
    let syncedAt = base.syncedAt;
    for (const change of changes) {
      if (change.syncedAt !== undefined) { syncedAt = Math.max(syncedAt, change.syncedAt); continue; }
      if (change.remove) { users.delete(change.id); continue; }
      const previous = users.get(change.id);
      // 元数据、置顶等过期增量不能复活另一标签页已经移除的记录。
      if (!previous && !change.create) continue;
      users.set(change.id, { ...(previous || change.fallback || {}), ...change.patch, id: change.id });
    }
    return sanitizeNotificationAccountProfile({ subscriptions: [...users.values()], syncedAt });
  }

  function captureNotificationAccountChanges(session, profile) {
    // 先对完整运行时名单求增量；容量淘汰不是用户主动删除，不能生成跨页删除操作。
    const next = sanitizeNotificationAccountProfile(profile, false);
    const previous = new Map(session.profile.subscriptions.map((item) => [item.id, item]));
    const fields = ['username', 'displayName', 'avatarUrl', 'enabled', 'pinned', 'updatedAt'];
    const changes = [];
    for (const item of next.subscriptions) {
      const prior = previous.get(item.id);
      previous.delete(item.id);
      const patch = Object.fromEntries(fields.filter((key) => prior ? prior[key] !== item[key] : item[key] !== undefined)
        .map((key) => [key, item[key]]));
      if (Object.keys(patch).length) {
        const reopening = prior && !prior.enabled && item.enabled;
        changes.push({ id: item.id, patch, create: !prior || reopening,
          ...(reopening ? { fallback: item } : {}) });
      }
    }
    for (const id of previous.keys()) changes.push({ id, remove: true });
    if (next.syncedAt !== session.profile.syncedAt) changes.push({ syncedAt: next.syncedAt });
    if (changes.length) {
      const revision = ++session.generation;
      session.pending.push(...changes.map((change) => ({ ...change, revision })));
    }
    session.profile = sanitizeNotificationAccountProfile(next);
    session.dirty = session.pending.length > 0;
  }

  function cacheNotificationAccount(session) {
    if (!session) return;
    captureNotificationAccountChanges(session, {
      subscriptions: [...notificationSubscriptions.values()], syncedAt: state.notificationSyncedAt,
    });
    // 让当前界面、备份与保存后的容量策略一致，避免已淘汰历史在后续增量中再次补入。
    if (notificationSubscriptions.size > session.profile.subscriptions.length) activateNotificationAccountProfile(session);
  }

  function activateNotificationAccountProfile(session) {
    notificationSubscriptions.clear();
    for (const item of session?.profile.subscriptions || []) notificationSubscriptions.set(item.username.toLowerCase(), { ...item });
    state.notificationSyncedAt = session?.profile.syncedAt || 0;
  }

  function refreshNotificationAccountProfile(session, saved) {
    const profile = applyNotificationAccountChanges(saved, session.pending);
    if (session.initialized) {
      const next = new Map(profile.subscriptions.map((item) => [item.id, item]));
      const previous = new Set(session.profile.subscriptions.map((item) => item.id));
      for (const item of session.profile.subscriptions) {
        if (!next.has(item.id) || next.get(item.id).enabled !== item.enabled
            || next.get(item.id).username !== item.username) noteNotificationStateChange(session, item.id);
      }
      for (const id of next.keys()) if (!previous.has(id)) noteNotificationStateChange(session, id);
    }
    session.profile = profile;
    session.initialized = true;
  }

  function ensureNotificationAccount() {
    const rawId = getCurrentViewerId();
    const viewerId = /^\d{1,30}$/.test(rawId) ? rawId : '';
    if (notificationAccountToken?.viewerId === viewerId) return notificationAccountToken;
    const previous = notificationAccountToken;
    if (previous?.session) {
      cacheNotificationAccount(previous.session);
      flushNotificationAccountPersistence(previous.session);
    }
    const early = !previous && viewerId ? [...notificationSubscriptions.values()] : [];
    closeNotificationSyncDifferences();
    notificationSubscriptions.clear();notificationMutationGuards.clear();state.notificationMutationUsers.clear();
    state.notificationSyncInProgress = false;state.notificationCleanupInProgress = false;
    state.notificationSearchQuery = '';
    if (state.notificationSearchEl) state.notificationSearchEl.value = '';
    let session = viewerId ? notificationAccountSessions.get(viewerId) : null;
    if (viewerId && !session) {
      session = { viewerId, profile: sanitizeNotificationAccountProfile(state.settings.notificationAccounts?.[viewerId]),
        initialized: state.settingsLoaded, dirty: false, generation: 0, timer: null, pending: [], flushing: false,
        stateRevision: 0, stateVersions: new Map() };
      if (early.length) captureNotificationAccountChanges(session, {
        subscriptions: [...session.profile.subscriptions, ...early], syncedAt: session.profile.syncedAt,
      });
      notificationAccountSessions.set(viewerId, session);
    } else if (session && state.settingsLoaded) refreshNotificationAccountProfile(session, state.settings.notificationAccounts?.[viewerId]);
    notificationAccountToken = { viewerId, session };
    activateNotificationAccountProfile(session);
    if (state.rootEl && state.panelView === 'notifications') queueMicrotask(() => renderNotificationSubscriptions());
    return notificationAccountToken;
  }

  function isCurrentNotificationAccount(token, refresh = true) {
    return !!token?.viewerId && (refresh ? ensureNotificationAccount() : notificationAccountToken) === token;
  }

  function scheduleNotificationSubscriptionsPersist(options = {}) {
    const token = ensureNotificationAccount();
    if (!token.viewerId) return;
    const session = token.session;
    cacheNotificationAccount(session);
    if (session.timer) clearTimeout(session.timer);
    session.timer = setTimeout(() => { session.timer = null;flushNotificationAccountPersistence(session); }, 500);
    if (options.render !== false) renderNotificationSubscriptions();
  }

  function flushNotificationAccountPersistence(session) {
    if (!session) return;
    if (notificationAccountToken?.session === session) cacheNotificationAccount(session);
    if (!session.dirty || !state.settingsLoaded || session.flushing) return;
    if (session.timer) clearTimeout(session.timer);
    session.timer = null;
    const changes = session.pending.slice(), generation = session.generation;
    session.flushing = true;
    state.settings.notificationAccounts = { ...state.settings.notificationAccounts, [session.viewerId]: session.profile };
    writeSettingsMirror(state.settings);
    queueDbWrite(async () => {
      let success = false;
      try {
        if (notificationAccountSessions.get(session.viewerId) !== session) return;
        const saved = await dbPutNotificationAccount(session.viewerId, changes);
        if (notificationAccountSessions.get(session.viewerId) !== session) return;
        if (notificationAccountToken?.session === session) cacheNotificationAccount(session);
        session.pending = session.pending.filter((change) => change.revision > generation);
        session.dirty = session.pending.length > 0;
        state.settings.notificationAccounts = saved.notificationAccounts;
        restoreNotificationAccounts(false, false);
        writeSettingsMirror({ ...saved, notificationAccounts: state.settings.notificationAccounts });
        success = true;
      } finally {
        session.flushing = false;
        if (success && session.dirty) flushNotificationAccountPersistence(session);
      }
    });
  }

  function flushAllNotificationAccounts() {
    ensureNotificationAccount();
    for (const session of notificationAccountSessions.values()) if (session.dirty) flushNotificationAccountPersistence(session);
  }

  async function dbPutNotificationAccount(viewerId, changes) {
    const db = await openDb();
    let saved;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, 'readwrite'), store = tx.objectStore(SETTINGS_STORE);
      const request = store.get('settings');
      request.onsuccess = () => {
        const base = sanitizeSettings(migrateSettingsDefaults(request.result?.value || state.settings));
        saved = { ...base, notificationAccounts: { ...base.notificationAccounts,
          [viewerId]: applyNotificationAccountChanges(base.notificationAccounts[viewerId], changes) } };
        store.put({ key: 'settings', value: saved });
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = resolve;tx.onerror = () => reject(tx.error);tx.onabort = () => reject(tx.error);
    });
    publishCrossTabChange('settings-reload');
    return saved;
  }

  function restoreNotificationAccounts(force = false, flushDirty = true) {
    const previous = notificationAccountToken;
    if (previous?.session) cacheNotificationAccount(previous.session);
    if (force) {
      for (const session of notificationAccountSessions.values()) if (session.timer) clearTimeout(session.timer);
      notificationAccountSessions.clear();notificationAccountToken = null;notificationSubscriptions.clear();
      ensureNotificationAccount();
      return;
    }
    for (const session of notificationAccountSessions.values()) {
      refreshNotificationAccountProfile(session, state.settings.notificationAccounts?.[session.viewerId]);
      if (session.dirty) state.settings.notificationAccounts = {
        ...state.settings.notificationAccounts, [session.viewerId]: session.profile,
      };
    }
    if (previous?.session) activateNotificationAccountProfile(previous.session);
    ensureNotificationAccount();
    if (flushDirty) for (const session of notificationAccountSessions.values()) if (session.dirty) flushNotificationAccountPersistence(session);
  }

  function notificationActionMatchesAccount(element) {
    const token = ensureNotificationAccount();
    const id = element.getAttribute('data-notification-id');
    const item = notificationSubscriptions.get((element.getAttribute('data-username') || '').toLowerCase());
    if (token.viewerId && element.getAttribute('data-notification-viewer') === token.viewerId
        && (!id || item?.id === id)) return true;
    renderNotificationSubscriptions();return false;
  }

  function installNotificationAccountTracking() {
    ensureNotificationAccount();
    if (notificationAccountTrackingInstalled || typeof window.addEventListener !== 'function') return;
    notificationAccountTrackingInstalled = true;
    let timer = null;
    const check = () => {
      const previous = notificationAccountToken;
      ensureNotificationAccount();
      if (previous !== notificationAccountToken) renderNotificationSubscriptions(true);
    };
    const visibility = () => {
      if (timer) clearInterval(timer);
      timer = null;
      if (!document.hidden) { check();timer = setInterval(check, 1000); }
    };
    window.addEventListener('focus', check);window.addEventListener('pageshow', visibility);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', () => {
      if (timer) clearInterval(timer);timer = null;
      if (notificationAccountToken?.session) { cacheNotificationAccount(notificationAccountToken.session);flushNotificationAccountPersistence(notificationAccountToken.session); }
    });
    visibility();
  }
