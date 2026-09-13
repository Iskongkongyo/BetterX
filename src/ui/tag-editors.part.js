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
    renderTagList({
      container: state.adultSpamKeywordTagsEl,
      values: state.settings.adultSpamKeywords,
      action: 'remove-adultspam-keyword',
      dataAttribute: 'data-keyword',
      removeLabel: '屏蔽词',
    });
  }

  function renderTagList({
    container, values, action, dataAttribute, removeLabel, formatLabel = (value) => value,
  }) {
    if (!container) return;
    container.textContent = '';
    for (const value of values || []) {
      const tag = document.createElement('span');
      tag.className = 'BetterX-keyword-tag';
      const label = document.createElement('span');
      label.className = 'BetterX-keyword-tag-label';
      label.textContent = formatLabel(value);
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'BetterX-keyword-tag-remove';
      removeButton.setAttribute('data-action', action);
      removeButton.setAttribute(dataAttribute, value);
      removeButton.setAttribute('aria-label', uiText(`删除${removeLabel} ${formatLabel(value)}`));
      removeButton.title = uiText(`删除“${formatLabel(value)}”`);
      removeButton.textContent = '×';
      tag.append(label, removeButton);
      container.appendChild(tag);
    }
  }

  function renderSavedKeywordTags() {
    renderTagList({
      container: state.keywordTagsEl,
      values: state.settings.keywords,
      action: 'remove-keyword',
      dataAttribute: 'data-keyword',
      removeLabel: '关键词',
    });
  }

  function renderSavedExcludeKeywordTags() {
    renderTagList({
      container: state.excludeKeywordTagsEl,
      values: state.settings.excludeKeywords,
      action: 'remove-exclude-keyword',
      dataAttribute: 'data-keyword',
      removeLabel: '排除词',
    });
  }

  function commitKeywordTagInput(input, settingKey, label) {
    if (!input) return { changed: false, rejected: 0 };
    const parsed = parseKeywordRules(input.value);
    const rejected = parsed.filter((item) => !isSafeKeywordRule(item));
    const accepted = rejected.length ? parsed.filter((item) => isSafeKeywordRule(item)) : parsed;
    input.value = '';
    if (!accepted.length) {
      if (rejected.length) showToast(`⚠️ 已忽略 ${rejected.length} 条高风险或无效正则`, 5000);
      return { changed: false, rejected: rejected.length };
    }
    const current = state.settings[settingKey] || [];
    const combined = uniqueStrings([...current, ...accepted]);
    const next = combined.slice(0, 50);
    const changed = next.length !== current.length || next.some((item, index) => item !== current[index]);
    if (changed) setSettingsPartial({ [settingKey]: next });
    if (combined.length > next.length) showToast(`最多保存 50 个${label}`);
    if (rejected.length) showToast(`⚠️ 已忽略 ${rejected.length} 条高风险或无效正则`, 5000);
    return { changed, rejected: rejected.length };
  }

  function commitKeywordInput() {
    return commitKeywordTagInput(state.keywordInputEl, 'keywords', '关键词');
  }

  function commitExcludeKeywordInput() {
    return commitKeywordTagInput(state.excludeInputEl, 'excludeKeywords', '排除词');
  }

  function commitPlainTagInput({
    input, settingKey, parse, maxItems, pendingLimit = Infinity, limitMessage = '', alwaysCommit = false,
  }) {
    if (!input) return false;
    const pending = parse(input.value).slice(0, pendingLimit);
    input.value = '';
    if (!pending.length) return false;
    const current = state.settings[settingKey] || [];
    const combined = uniqueStrings([...current, ...pending]);
    const next = combined.slice(0, maxItems);
    const unchanged = next.length === current.length
      && next.every((item, index) => item === current[index]);
    if (unchanged && !alwaysCommit) return false;
    setSettingsPartial({ [settingKey]: next });
    if (limitMessage && combined.length > next.length) showToast(limitMessage);
    return true;
  }

  function commitAdultSpamKeywordInput() {
    return commitPlainTagInput({
      input: state.adultSpamKeywordsEl,
      settingKey: 'adultSpamKeywords',
      parse: (raw) => parseKeywords(raw).map((item) => item.slice(0, 80)),
      maxItems: 50,
      limitMessage: '最多保存 50 个自定义屏蔽词',
    });
  }

  function renderAdultSpamWhitelistTags() {
    renderTagList({
      container: state.adultSpamWhitelistTagsEl,
      values: state.settings.adultSpamWhitelist,
      action: 'remove-adultspam-whitelist',
      dataAttribute: 'data-username',
      removeLabel: '白名单账号',
      formatLabel: (username) => `@${username}`,
    });
  }

  function commitAdultSpamWhitelistInput() {
    return commitPlainTagInput({
      input: state.adultSpamWhitelistEl,
      settingKey: 'adultSpamWhitelist',
      parse: parseAdultSpamWhitelist,
      maxItems: 100,
      pendingLimit: 100,
      alwaysCommit: true,
    });
  }

  function bindTagCommitInput(input, commit) {
    if (!input) return;
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.isComposing) return;
      event.preventDefault();
      commit();
    });
    input.addEventListener('blur', commit);
  }

  function installHorizontalFilterScroller(el) {
    if (!el) return;

    // PC 鼠标滚轮映射为横向滚动；触控板原生横向 deltaX 继续按浏览器默认行为。
    el.addEventListener('wheel', (event) => {
      if (el.scrollWidth <= el.clientWidth + 1) return;
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY) || event.deltaY === 0) return;
      const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      const canMove = event.deltaY > 0 ? el.scrollLeft < maxScrollLeft - 1 : el.scrollLeft > 1;
      if (!canMove) return;
      event.preventDefault();
      el.scrollLeft = Math.max(0, Math.min(maxScrollLeft, el.scrollLeft + event.deltaY));
    }, { passive: false });

    // 鼠标按住按钮行左右拖动，体验接近移动端滑动。
    // 注意：不能在 pointerdown 时立即 capture，否则正常点击筛选按钮会被容器抢走。
    // 只有移动超过阈值、确认用户是在拖动后，才接管指针。
    let pointerId = null;
    let startX = 0;
    let startScrollLeft = 0;
    let dragged = false;
    let captured = false;
    let suppressClickUntil = 0;
    el.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || el.scrollWidth <= el.clientWidth + 1) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScrollLeft = el.scrollLeft;
      dragged = false;
      captured = false;
    });
    el.addEventListener('pointermove', (event) => {
      if (pointerId !== event.pointerId) return;
      const delta = event.clientX - startX;
      if (!dragged && Math.abs(delta) < 5) return;
      if (!dragged) {
        dragged = true;
        try {
          el.setPointerCapture(pointerId);
          captured = true;
        } catch (err) {}
        el.classList.add('is-dragging');
      }
      event.preventDefault();
      el.scrollLeft = startScrollLeft - delta;
    });
    const finishDrag = (event) => {
      if (pointerId !== event.pointerId) return;
      if (dragged) suppressClickUntil = performance.now() + 120;
      if (captured) {
        try { el.releasePointerCapture(pointerId); } catch (err) {}
      }
      pointerId = null;
      dragged = false;
      captured = false;
      el.classList.remove('is-dragging');
    };
    el.addEventListener('pointerup', finishDrag);
    el.addEventListener('pointercancel', finishDrag);
    el.addEventListener('click', (event) => {
      if (performance.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
  }
