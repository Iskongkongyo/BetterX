  function closeImagePreview() {
    const preview = document.getElementById('BetterX-image-preview');
    if (!preview) return;
    try {
      if (typeof preview._betterxCleanup === 'function') preview._betterxCleanup();
    } catch (err) {}
    preview.remove();
  }

  function showImagePreview(rawUrl, rawUrls, rawIndex) {
    const clickedSrc = safeImportedAssetUrl(rawUrl);
    const sources = uniqueStrings(
      (Array.isArray(rawUrls) ? rawUrls : [rawUrl])
        .map(safeImportedAssetUrl)
        .filter(Boolean)
    ).slice(0, 4);
    if (clickedSrc && !sources.includes(clickedSrc)) sources.unshift(clickedSrc);
    if (!sources.length) return;

    let currentIndex = Number.parseInt(rawIndex, 10);
    if (!Number.isFinite(currentIndex) || currentIndex < 0 || currentIndex >= sources.length) {
      currentIndex = clickedSrc ? sources.indexOf(clickedSrc) : 0;
      if (currentIndex < 0) currentIndex = 0;
    }

    closeImagePreview();

    const overlay = document.createElement('div');
    overlay.id = 'BetterX-image-preview';
    overlay.className = 'BetterX-image-preview';
    overlay.tabIndex = -1;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '图片预览；电脑端可滚轮缩放并用左右按钮或方向键切图，移动端可双指缩放并左右滑动切图；按 Esc 或点击空白处关闭');

    const box = document.createElement('div');
    box.className = 'BetterX-image-preview-box';
    const image = document.createElement('img');
    image.referrerPolicy = 'no-referrer';
    image.alt = '帖子图片预览';
    image.draggable = false;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'BetterX-image-preview-close';
    close.innerHTML = '<span aria-hidden="true">×</span>';
    close.setAttribute('aria-label', '关闭图片预览');
    close.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeImagePreview();
    });

    const previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'BetterX-image-preview-nav BetterX-image-preview-prev';
    previous.innerHTML = '<span aria-hidden="true">‹</span>';
    previous.setAttribute('aria-label', '上一张图片');

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'BetterX-image-preview-nav BetterX-image-preview-next';
    next.innerHTML = '<span aria-hidden="true">›</span>';
    next.setAttribute('aria-label', '下一张图片');

    box.appendChild(image);
    overlay.append(box, previous, next, close);

    const zoom = {
      scale: 1,
      x: 0,
      y: 0,
      min: 1,
      max: 6,
      pointers: new Map(),
      panStart: null,
      pinchStart: null,
      swipeStart: null,
    };

    let navRaf = 0;
    const clampScale = (value) => Math.max(zoom.min, Math.min(zoom.max, value));
    const isFinePointer = () => {
      try { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; }
      catch (err) { return !isMobileBadgeViewport(); }
    };
    const updateNavVisibility = () => {
      const multi = sources.length > 1;
      previous.hidden = !multi;
      next.hidden = !multi;
      previous.disabled = currentIndex <= 0;
      next.disabled = currentIndex >= sources.length - 1;
    };
    const updateNavPositions = () => {
      if (sources.length <= 1 || !isFinePointer() || !image.isConnected || !image.complete) return;
      const rect = image.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const size = 44;
      const gap = 14;
      const edge = 12;
      const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
      const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
      const top = Math.max(edge, Math.min(viewportHeight - edge - size, rect.top + rect.height / 2 - size / 2));
      const prevLeft = Math.max(edge, Math.min(viewportWidth - edge - size, rect.left - gap - size));
      const nextLeft = Math.max(edge, Math.min(viewportWidth - edge - size, rect.right + gap));
      previous.style.left = `${Math.round(prevLeft)}px`;
      previous.style.top = `${Math.round(top)}px`;
      next.style.left = `${Math.round(nextLeft)}px`;
      next.style.top = `${Math.round(top)}px`;
    };
    const scheduleNavPositions = () => {
      if (navRaf) return;
      navRaf = requestAnimationFrame(() => {
        navRaf = 0;
        updateNavPositions();
      });
    };
    const constrainTranslation = () => {
      if (zoom.scale <= 1.0001) {
        zoom.scale = 1;
        zoom.x = 0;
        zoom.y = 0;
        return;
      }
      const baseWidth = image.offsetWidth || 0;
      const baseHeight = image.offsetHeight || 0;
      const viewWidth = box.clientWidth || window.innerWidth;
      const viewHeight = box.clientHeight || window.innerHeight;
      const maxX = Math.max(0, (baseWidth * zoom.scale - viewWidth) / 2);
      const maxY = Math.max(0, (baseHeight * zoom.scale - viewHeight) / 2);
      zoom.x = Math.max(-maxX, Math.min(maxX, zoom.x));
      zoom.y = Math.max(-maxY, Math.min(maxY, zoom.y));
    };
    const applyZoom = () => {
      constrainTranslation();
      image.style.transform = `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})`;
      box.classList.toggle('is-zoomed', zoom.scale > 1.0001);
      scheduleNavPositions();
    };
    const resetZoom = () => {
      zoom.scale = 1;
      zoom.x = 0;
      zoom.y = 0;
      zoom.panStart = null;
      zoom.pinchStart = null;
      zoom.swipeStart = null;
      box.classList.remove('is-panning');
      applyZoom();
    };
    const getStageCenter = () => {
      const rect = box.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const zoomAt = (nextScale, clientX, clientY) => {
      const previousScale = zoom.scale;
      const scale = clampScale(nextScale);
      if (Math.abs(scale - previousScale) < 0.0001) return;
      const center = getStageCenter();
      const focalX = (clientX - center.x - zoom.x) / previousScale;
      const focalY = (clientY - center.y - zoom.y) / previousScale;
      zoom.scale = scale;
      zoom.x = clientX - center.x - focalX * scale;
      zoom.y = clientY - center.y - focalY * scale;
      applyZoom();
    };
    const pointerPair = () => [...zoom.pointers.values()].slice(0, 2);
    const startPinch = () => {
      const pair = pointerPair();
      if (pair.length < 2) { zoom.pinchStart = null; return; }
      const [a, b] = pair;
      const midpointX = (a.x + b.x) / 2;
      const midpointY = (a.y + b.y) / 2;
      const distance = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const center = getStageCenter();
      zoom.pinchStart = {
        distance,
        scale: zoom.scale,
        focalX: (midpointX - center.x - zoom.x) / zoom.scale,
        focalY: (midpointY - center.y - zoom.y) / zoom.scale,
      };
      zoom.panStart = null;
      zoom.swipeStart = null;
    };
    const preloadNeighbors = () => {
      [currentIndex - 1, currentIndex + 1].forEach((index) => {
        if (index < 0 || index >= sources.length) return;
        const preload = new Image();
        preload.referrerPolicy = 'no-referrer';
        preload.src = sources[index];
      });
    };
    const setCurrentImage = (index) => {
      if (index < 0 || index >= sources.length || index === currentIndex && image.src) return false;
      currentIndex = index;
      resetZoom();
      image.alt = sources.length > 1 ? `帖子图片预览，第 ${currentIndex + 1} 张，共 ${sources.length} 张` : '帖子图片预览';
      image.src = sources[currentIndex];
      updateNavVisibility();
      preloadNeighbors();
      scheduleNavPositions();
      return true;
    };
    const navigateImage = (step) => setCurrentImage(currentIndex + step);

    previous.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      navigateImage(-1);
    });
    next.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      navigateImage(1);
    });

    overlay.addEventListener('wheel', (event) => {
      if (event.target && event.target.closest && event.target.closest('button')) return;
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.16 : (1 / 1.16);
      zoomAt(zoom.scale * factor, event.clientX, event.clientY);
    }, { passive: false });

    box.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.pointerType === 'mouse' && zoom.scale <= 1.0001) return;
      // 未缩放时点按空白仍用于关闭；已有触点时则允许第二根手指落在图片外缘参与捏合。
      if (event.target === box && zoom.scale <= 1.0001 && zoom.pointers.size === 0) return;
      if (event.pointerType !== 'mouse') event.preventDefault();
      if (event.pointerType !== 'mouse' && zoom.scale <= 1.0001 && zoom.pointers.size === 0) {
        zoom.swipeStart = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          time: Date.now(),
        };
      }
      zoom.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, type: event.pointerType });
      try { box.setPointerCapture(event.pointerId); } catch (err) {}
      if (zoom.pointers.size >= 2) {
        startPinch();
      } else if (zoom.scale > 1.0001) {
        zoom.swipeStart = null;
        zoom.panStart = { id: event.pointerId, x: event.clientX, y: event.clientY, tx: zoom.x, ty: zoom.y };
        box.classList.add('is-panning');
      }
    });

    box.addEventListener('pointermove', (event) => {
      if (!zoom.pointers.has(event.pointerId)) return;
      if (event.pointerType !== 'mouse') event.preventDefault();
      zoom.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, type: event.pointerType });

      if (zoom.pointers.size >= 2) {
        if (!zoom.pinchStart) startPinch();
        const pair = pointerPair();
        if (pair.length < 2 || !zoom.pinchStart) return;
        const [a, b] = pair;
        const midpointX = (a.x + b.x) / 2;
        const midpointY = (a.y + b.y) / 2;
        const distance = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const nextScale = clampScale(zoom.pinchStart.scale * (distance / zoom.pinchStart.distance));
        const center = getStageCenter();
        zoom.scale = nextScale;
        zoom.x = midpointX - center.x - zoom.pinchStart.focalX * nextScale;
        zoom.y = midpointY - center.y - zoom.pinchStart.focalY * nextScale;
        applyZoom();
        return;
      }

      if (zoom.panStart && zoom.panStart.id === event.pointerId && zoom.scale > 1.0001) {
        zoom.x = zoom.panStart.tx + event.clientX - zoom.panStart.x;
        zoom.y = zoom.panStart.ty + event.clientY - zoom.panStart.y;
        applyZoom();
      }
    }, { passive: false });

    const endPointer = (event, cancelled) => {
      if (!zoom.pointers.has(event.pointerId)) return;
      const pointerCountBeforeEnd = zoom.pointers.size;
      const swipe = !cancelled && zoom.swipeStart && zoom.swipeStart.id === event.pointerId
        && pointerCountBeforeEnd === 1 && zoom.scale <= 1.0001
        ? {
            dx: event.clientX - zoom.swipeStart.x,
            dy: event.clientY - zoom.swipeStart.y,
            elapsed: Date.now() - zoom.swipeStart.time,
          }
        : null;

      zoom.pointers.delete(event.pointerId);
      try { if (box.hasPointerCapture(event.pointerId)) box.releasePointerCapture(event.pointerId); } catch (err) {}
      zoom.pinchStart = null;
      zoom.swipeStart = null;
      box.classList.remove('is-panning');

      if (swipe && swipe.elapsed <= 900 && Math.abs(swipe.dx) >= 52 && Math.abs(swipe.dx) > Math.abs(swipe.dy) * 1.15) {
        if (swipe.dx < 0) navigateImage(1);
        else navigateImage(-1);
      }

      if (zoom.pointers.size >= 2) {
        startPinch();
      } else if (zoom.pointers.size === 1 && zoom.scale > 1.0001) {
        const [id, point] = zoom.pointers.entries().next().value;
        zoom.panStart = { id, x: point.x, y: point.y, tx: zoom.x, ty: zoom.y };
        box.classList.add('is-panning');
      } else {
        zoom.panStart = null;
      }
    };
    box.addEventListener('pointerup', (event) => endPointer(event, false));
    box.addEventListener('pointercancel', (event) => endPointer(event, true));

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target === box) closeImagePreview();
    });
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeImagePreview();
        return;
      }
      if (event.key === 'ArrowLeft' && sources.length > 1) {
        event.preventDefault();
        navigateImage(-1);
      } else if (event.key === 'ArrowRight' && sources.length > 1) {
        event.preventDefault();
        navigateImage(1);
      }
    });

    const onViewportChange = () => scheduleNavPositions();
    window.addEventListener('resize', onViewportChange, { passive: true });
    window.addEventListener('orientationchange', onViewportChange, { passive: true });
    image.addEventListener('load', () => {
      applyZoom();
      scheduleNavPositions();
    });
    overlay._betterxCleanup = () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('orientationchange', onViewportChange);
      if (navRaf) cancelAnimationFrame(navRaf);
      navRaf = 0;
    };

    // 预览层必须直接挂在页面根节点，避免移动端 BetterX 浮动根节点的位置/宽度影响 fixed 定位。
    localizeBetterXTree(overlay);
    (document.body || document.documentElement).appendChild(overlay);
    updateNavVisibility();
    image.src = sources[currentIndex];
    image.alt = sources.length > 1 ? `帖子图片预览，第 ${currentIndex + 1} 张，共 ${sources.length} 张` : '帖子图片预览';
    preloadNeighbors();
    overlay.focus();
  }

  function openRecordedPost(post) {
    if (!post || !post.url || !post.id) return;
    const safeUrl = safeImportedStatusUrl(post.url, post.id);
    if (!safeUrl) return;
    markClicked(post.id);

    if (!isMobileBadgeViewport()) {
      window.open(safeUrl, '_blank', 'noopener');
      return;
    }

    // 移动端用当前 x.com 页面内的同源相对链接跳转。
    // 避免 window.open(https://x.com/...) 被 Android/iOS 当作 App Link / Universal Link，弹出“打开 X”提示。
    try {
      const target = new URL(safeUrl, location.href);
      const relativeHref = `${target.pathname}${target.search}${target.hash}`;
      const anchor = document.createElement('a');
      anchor.href = relativeHref;
      anchor.target = '_self';
      anchor.setAttribute('data-betterx-internal-nav', 'true');
      anchor.style.display = 'none';
      (document.body || document.documentElement).appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (err) {
      const id = encodeURIComponent(String(post.id));
      location.assign(`/i/status/${id}`);
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

    if (state.panelOpen && !target.closest('#BetterX-root') && !target.closest('#BetterX-image-preview')) {
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

