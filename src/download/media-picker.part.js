  const DOWNLOAD_LONG_PRESS_MS = 500;
  const DOWNLOAD_BUTTON_HINT = '点击下载全部，长按或 Shift+点击选择下载';
  let downloadMediaPicker = null;

  function getDownloadMediaThumbnails(article, items) {
    const previews = new Map();
    for (const entry of videoPosterRegistry.values()) {
      if (entry.thumbnailUrl) previews.set(entry.url, entry.thumbnailUrl);
    }
    article.querySelectorAll('video[poster]').forEach((video) => {
      const poster = video.getAttribute('poster') || '';
      const directUrl = safeHttpsUrl(video.currentSrc || video.src || '', ['video.twimg.com']);
      if (directUrl) previews.set(directUrl, poster);
      const matched = getRegistryEntry(videoPosterRegistry, getVideoPosterKey(poster));
      if (matched) previews.set(matched.url, poster);
    });
    return items.map((item) => {
      const gifId = item.mediaType === 'gif' && item.url.match(/\/tweet_video\/([A-Za-z0-9_-]+)\.mp4(?:\?|$)/);
      const raw = item.mediaType === 'image' ? item.url : previews.get(item.url)
        || (gifId ? `https://pbs.twimg.com/tweet_video_thumb/${gifId[1]}.jpg` : '');
      const safe = safeHttpsUrl(raw, ['pbs.twimg.com']);
      if (!safe) return '';
      const url = new URL(safe);
      if (url.pathname.startsWith('/media/')) url.searchParams.set('name', 'small');
      return url.href;
    });
  }

  function closeDownloadMediaPicker() {
    if (downloadMediaPicker) downloadMediaPicker.cancel();
  }

  function showDownloadMediaPicker(items, article) {
    closeDownloadMediaPicker();
    if (!state.rootEl || !items.length) return Promise.resolve(null);
    return new Promise((resolve) => {
      const previousFocus = document.activeElement;
      const overlay = document.createElement('div');
      overlay.id = 'BetterX-media-picker';
      overlay.className = 'BetterX-dialog-overlay BetterX-media-picker-overlay';
      overlay.innerHTML = uiHtml`
        <div class="BetterX-dialog BetterX-media-picker" role="dialog" aria-modal="true" aria-labelledby="BetterX-media-picker-title">
          <div class="BetterX-dialog-title" id="BetterX-media-picker-title">选择要下载的媒体</div>
          <div class="BetterX-media-picker-toolbar">
            <span class="BetterX-media-picker-count" aria-live="polite"></span>
            <button type="button" class="BetterX-btn" data-media-toggle>全不选</button>
          </div>
          <div class="BetterX-media-picker-grid"></div>
          <div class="BetterX-dialog-actions">
            <button type="button" class="BetterX-btn" data-media-cancel>取消</button>
            <button type="button" class="BetterX-btn primary" data-media-confirm>下载所选</button>
          </div>
        </div>
      `;
      const grid = overlay.querySelector('.BetterX-media-picker-grid');
      const count = overlay.querySelector('.BetterX-media-picker-count');
      const toggle = overlay.querySelector('[data-media-toggle]');
      const confirm = overlay.querySelector('[data-media-confirm]');
      const inputs = [];
      const thumbnails = getDownloadMediaThumbnails(article, items);
      items.forEach((item, index) => {
        const kind = item.mediaType === 'gif' ? 'GIF' : uiText(item.mediaType === 'video' ? '视频' : '图片');
        const entry = document.createElement('label');
        entry.className = 'BetterX-media-picker-item';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = true;
        input.setAttribute('aria-label', `${kind} ${index + 1}`);
        const thumb = document.createElement('span');
        thumb.className = 'BetterX-media-picker-thumb';
        const placeholder = document.createElement('span');
        placeholder.className = 'BetterX-media-picker-placeholder';
        placeholder.textContent = uiText('无预览');
        thumb.appendChild(placeholder);
        if (thumbnails[index]) {
          const image = document.createElement('img');
          image.src = thumbnails[index];
          image.alt = '';
          image.loading = 'lazy';
          image.decoding = 'async';
          image.referrerPolicy = 'no-referrer';
          image.draggable = false;
          image.addEventListener('error', () => image.remove(), { once: true });
          thumb.appendChild(image);
        }
        const caption = document.createElement('span');
        caption.className = 'BetterX-media-picker-caption';
        caption.textContent = `${kind} ${index + 1}`;
        entry.append(input, thumb, caption);
        grid.appendChild(entry);
        inputs.push(input);
      });
      const update = () => {
        const selected = inputs.filter((input) => input.checked).length;
        count.textContent = `${uiText('已选')} ${selected} / ${items.length}`;
        toggle.textContent = uiText(selected === items.length ? '全不选' : '全选');
        confirm.textContent = `${uiText('下载所选')} (${selected})`;
        confirm.disabled = selected === 0;
      };
      let settled = false;
      const finish = (selection) => {
        if (settled) return;
        settled = true;
        document.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('pagehide', cancel);
        window.removeEventListener('popstate', cancel);
        overlay.remove();
        downloadMediaPicker = null;
        if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        resolve(selection);
      };
      const cancel = () => finish(null);
      const onKeyDown = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault(); event.stopImmediatePropagation(); cancel();
        } else if (event.key === 'Tab') {
          const focusable = [...overlay.querySelectorAll('input, button:not(:disabled)')];
          const first = focusable[0], last = focusable[focusable.length - 1];
          if (event.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && (document.activeElement === last || !overlay.contains(document.activeElement))) {
            event.preventDefault(); first.focus();
          }
        }
      };
      grid.addEventListener('change', update);
      toggle.addEventListener('click', () => {
        const selectAll = !inputs.every((input) => input.checked);
        inputs.forEach((input) => { input.checked = selectAll; });
        update();
      });
      confirm.addEventListener('click', () => {
        const selected = items.filter((_item, index) => inputs[index].checked);
        if (selected.length) finish(selected);
      });
      overlay.querySelector('[data-media-cancel]').addEventListener('click', cancel);
      // 触摸长按结束后的兼容 click 可能重新命中新弹窗。在弹窗收到新的
      // 按下事件前忽略这类 click；保留键盘激活以及 label 转发给 checkbox 的点击。
      let pointerInteractionStarted = false;
      overlay.addEventListener('pointerdown', () => { pointerInteractionStarted = true; }, true);
      overlay.addEventListener('pointercancel', () => { pointerInteractionStarted = false; }, true);
      overlay.addEventListener('click', (event) => {
        if (event.detail > 0 && !pointerInteractionStarted) {
          event.preventDefault(); event.stopImmediatePropagation();
        }
      }, true);
      overlay.addEventListener('click', (event) => {
        event.stopPropagation();
        if (event.target === overlay) cancel();
      });
      const preventBackgroundScroll = (event) => {
        if (!grid.contains(event.target)) event.preventDefault();
      };
      overlay.addEventListener('wheel', preventBackgroundScroll, { passive: false });
      overlay.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
      document.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('pagehide', cancel);
      window.addEventListener('popstate', cancel);
      downloadMediaPicker = { cancel };
      update();
      state.rootEl.appendChild(overlay);
      inputs[0].focus({ preventScroll: true });
    });
  }

  function bindDownloadButtonGestures(button, article, controls) {
    let press = null, timer = null, suppressClick = false;
    const clearPress = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      press = null;
    };
    const activate = (selectMedia) => {
      if (!button.isConnected || !state.settings.mediaDownload || isDownloadExcludedArticle(article)) return;
      const statusId = extractStatusIdFromUrl(getStatusLink(article));
      if (!statusId) return;
      controls.dataset.statusId = statusId;
      handleDownloadClick(article, extractAuthor(article), statusId, { selectMedia }).catch((error) => {
        debugLog('download start failed:', error);
        showToast('无法开始下载，请重试');
      });
    };
    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.isPrimary === false || press) return;
      event.stopPropagation();
      suppressClick = false;
      press = { id: event.pointerId, x: event.clientX, y: event.clientY,
        statusId: extractStatusIdFromUrl(getStatusLink(article)) };
      const started = press;
      timer = setTimeout(() => {
        timer = null;
        if (press !== started) return;
        if (started.statusId !== extractStatusIdFromUrl(getStatusLink(article))) {
          suppressClick = true;
          clearPress();
          return;
        }
        suppressClick = true;
        activate(true);
      }, DOWNLOAD_LONG_PRESS_MS);
    });
    button.addEventListener('pointermove', (event) => {
      if (!press || event.pointerId !== press.id) return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) {
        suppressClick = true;
        clearPress();
      }
    });
    button.addEventListener('pointerup', (event) => {
      if (press?.id === event.pointerId) clearPress();
    });
    for (const type of ['pointercancel', 'pointerleave', 'lostpointercapture']) {
      button.addEventListener(type, (event) => {
        if (!press || press.id !== event.pointerId) return;
        suppressClick = true;
        clearPress();
      });
    }
    button.addEventListener('contextmenu', (event) => { event.preventDefault(); event.stopPropagation(); });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') suppressClick = false;
    });
    button.addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation();
      if (suppressClick) { suppressClick = false; return; }
      activate(!!event.shiftKey);
    }, true);
  }
