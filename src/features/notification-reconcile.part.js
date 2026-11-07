  const NOTIFICATION_CLEANUP_INTERVAL_MS = 1500;
  let notificationDifferenceDialog = null;

  function getNotificationSyncDifferences(collected) {
    const syncedIds = new Set([...collected.values()].map((item) => item.id));
    const seen = new Set();
    const missing = [];
    for (const current of notificationSubscriptions.values()) {
      // 展示完整的当前差集；时间戳或操作保护只能影响后续关闭，不能让用户从名单消失。
      if (!current.enabled || syncedIds.has(current.id) || seen.has(current.id)) continue;
      seen.add(current.id);
      missing.push({ ...current });
    }
    return missing.sort((a, b) => a.username.localeCompare(b.username));
  }

  function waitNotificationCleanupInterval(signal) {
    if (signal?.aborted) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', done);
        resolve();
      };
      const timer = setTimeout(done, NOTIFICATION_CLEANUP_INTERVAL_MS);
      signal?.addEventListener('abort', done, { once: true });
    });
  }

  async function runNotificationDifferenceCleanup(items, viewerId, options = {}) {
    const accountToken = ensureNotificationAccount();
    const result = { closed: 0, localOnly: 0, skipped: 0, failed: 0, processed: 0, reason: 'done' };
    if (state.notificationCleanupInProgress || state.notificationSyncInProgress) return { ...result, reason: 'busy' };
    state.notificationCleanupInProgress = true;
    renderNotificationSubscriptions();
    let requested = false;
    try {
      for (const item of items) {
        if (options.signal?.aborted) { result.reason = 'cancelled'; break; }
        if (!viewerId || !isCurrentNotificationAccount(accountToken) || accountToken.viewerId !== viewerId) { result.reason = 'accountChanged'; break; }
        let current = notificationSubscriptions.get(item.username.toLowerCase());
        if (requested && current?.enabled && current.id === item.id) await waitNotificationCleanupInterval(options.signal);
        if (options.signal?.aborted) { result.reason = 'cancelled'; break; }
        if (!isCurrentNotificationAccount(accountToken) || accountToken.viewerId !== viewerId) { result.reason = 'accountChanged'; break; }
        current = notificationSubscriptions.get(item.username.toLowerCase());
        let status = { status: 'skipped' };
        if (current?.enabled && current.id === item.id && !(current.updatedAt > item.updatedAt)) {
          requested = true;
          status = await updateNotificationSubscription(item.username, false, {
            cleanup: true, quiet: true, expectedId: item.id, viewerId,
          });
        }
        result.processed++;
        if (status.status === 'closed') result.closed++;
        else if (status.status === 'localOnly') result.localOnly++;
        else if (status.status === 'skipped') result.skipped++;
        else if (status.status === 'accountChanged') result.reason = 'accountChanged';
        else {
          result.failed++;
          result.reason = status.rateLimited ? 'rateLimited' : 'failed';
        }
        options.onProgress?.(item, status.status, { ...result });
        if (result.reason !== 'done') break;
      }
      if (options.signal?.aborted && result.reason === 'done') result.reason = 'cancelled';
      return result;
    } finally {
      if (isCurrentNotificationAccount(accountToken)) state.notificationCleanupInProgress = false;
      renderNotificationSubscriptions();
    }
  }

  function closeNotificationSyncDifferences() {
    notificationDifferenceDialog?.close();
  }

  function notificationCleanupSummary(result, total) {
    return `${uiText('已处理')} ${result.processed} / ${total} · ${uiText('已关闭')} ${result.closed} · ${uiText('仅关闭本地记录')} ${result.localOnly}`;
  }

  function showNotificationSyncDifferences(items, viewerId, syncedCount) {
    if (!state.rootEl || !items.length || state.notificationCleanupInProgress) return;
    closeNotificationSyncDifferences();
    const previousFocus = document.activeElement;
    const controller = new AbortController();
    const overlay = document.createElement('div');
    overlay.id = 'BetterX-notification-differences';
    overlay.className = 'BetterX-dialog-overlay';
    overlay.innerHTML = uiHtml`
      <div class="BetterX-dialog BetterX-notification-differences" role="dialog" aria-modal="true" aria-labelledby="BetterX-notification-diff-title">
        <div class="BetterX-dialog-title" id="BetterX-notification-diff-title">订阅用户与本地记录不一致</div>
        <p class="BetterX-notification-diff-counts"></p>
        <div class="BetterX-dialog-body">
          <p>以下用户在本地仍开启了通知，但本次同步未识别到。账号可能已注销、被封禁或冻结，也可能是接口暂时遗漏。请点击用户名核实。</p>
          <p>确认后逐个尝试关闭 X 通知；仅在 X 明确返回账号不存在或已被封禁时关闭本地记录。其他失败会停止处理并保留未处理记录。</p>
        </div>
        <ul class="BetterX-notification-diff-list"></ul>
        <div class="BetterX-notification-diff-progress" role="status" aria-live="polite"></div>
        <div class="BetterX-dialog-actions">
          <button type="button" class="BetterX-btn" data-notification-diff-cancel>取消</button>
          <button type="button" class="BetterX-btn primary" data-notification-diff-confirm>关闭以上用户通知</button>
        </div>
      </div>`;
    const list = overlay.querySelector('.BetterX-notification-diff-list');
    const enabledCount = [...notificationSubscriptions.values()].filter((item) => item.enabled).length;
    overlay.querySelector('.BetterX-notification-diff-counts').textContent = `${uiText('本次识别')} ${syncedCount ?? 0} · ${uiText('本地开启')} ${enabledCount} · ${uiText('已关闭记录')} ${notificationSubscriptions.size - enabledCount}`;
    const progress = overlay.querySelector('.BetterX-notification-diff-progress');
    const confirm = overlay.querySelector('[data-notification-diff-confirm]');
    const cancel = overlay.querySelector('[data-notification-diff-cancel]');
    const rows = new Map();
    for (const item of items) {
      const row = document.createElement('li');
      const link = document.createElement('a');
      link.href = `https://x.com/${encodeURIComponent(item.username)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'BetterX-i18n-user-text';
      link.textContent = item.displayName ? `${item.displayName} (@${item.username})` : `@${item.username}`;
      const status = document.createElement('span');
      row.append(link, status);list.append(row);rows.set(item.id, status);
    }
    progress.textContent = `${uiText('未识别用户')} ${items.length}`;
    const close = () => {
      controller.abort();
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('pagehide', close);
      overlay.remove();
      if (notificationDifferenceDialog?.overlay === overlay) notificationDifferenceDialog = null;
      if (previousFocus?.isConnected && !previousFocus.disabled) previousFocus.focus({ preventScroll: true });
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); }
      else if (event.key === 'Tab') {
        const controls = [...overlay.querySelectorAll('a, button:not(:disabled):not([hidden])')];
        const first = controls[0], last = controls[controls.length - 1];
        if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)
            || !overlay.contains(document.activeElement)) {
          event.preventDefault();(event.shiftKey ? last : first)?.focus();
        }
      }
    };
    cancel.addEventListener('click', close);
    overlay.addEventListener('click', (event) => { event.stopPropagation();if (event.target === overlay) close(); });
    confirm.addEventListener('click', async () => {
      if (confirm.disabled || state.notificationSyncInProgress || state.notificationCleanupInProgress) return;
      confirm.disabled = true;confirm.textContent = uiText('正在关闭通知…');
      cancel.focus({ preventScroll: true });
      try {
        const result = await runNotificationDifferenceCleanup(items, viewerId, {
          signal: controller.signal,
          onProgress(item, status, result) {
            if (!overlay.isConnected) return;
            const label = status === 'closed' ? '已关闭' : status === 'localOnly' ? '仅关闭本地记录'
              : status === 'skipped' ? '已跳过' : '未能关闭';
            rows.get(item.id).textContent = uiText(label);
            progress.textContent = notificationCleanupSummary(result, items.length);
          },
        });
        const reason = result.reason === 'rateLimited' ? 'X 请求受限，已停止处理，请稍后重新同步。'
          : result.reason === 'accountChanged' ? 'X 账号已切换，已停止处理。'
          : result.reason === 'failed' || result.reason === 'busy' ? '处理未完成，未关闭的用户保持原状态。'
          : result.reason === 'cancelled' ? '已取消后续处理。' : '处理完成。';
        const summary = `${notificationCleanupSummary(result, items.length)} · ${uiText(reason)}`;
        if (overlay.isConnected) { progress.textContent = summary;confirm.hidden = true;cancel.textContent = uiText('关闭'); }
        else showToast(summary);
      } catch (error) {
        debugLog('notification cleanup failed:', error);
        if (overlay.isConnected) progress.textContent = uiText('处理未完成，未关闭的用户保持原状态。');
      } finally {
        if (overlay.isConnected) { confirm.hidden = true;cancel.textContent = uiText('关闭'); }
      }
    });
    notificationDifferenceDialog = { overlay, close };
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('pagehide', close);
    state.rootEl.append(overlay);cancel.focus({ preventScroll: true });
  }
