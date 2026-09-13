  function markPostViewed(id) {
    const index = getPostIndexById(id);
    if (index < 0) return;
    const existing = state.posts[index];
    const timestamp = now();
    // IntersectionObserver 可能因图片加载或布局变化再次回调；短时间内的重复回调不改写浏览顺序。
    if (existing.lastViewedAt && timestamp - existing.lastViewedAt < 500) return;
    const updated = {
      ...existing,
      firstViewedAt: existing.firstViewedAt || timestamp,
      lastViewedAt: timestamp,
    };
    state.posts[index] = updated;
    queueDbWrite(async () => { await dbPutPost(updated); });
    debouncedRefreshUI();
  }

  function observeArticleView(article, id) {
    if (!article || !id || !state.viewObserver) return;
    state.viewedArticleIds.set(article, String(id));
    state.viewObserver.observe(article);
  }

  function unobserveArticleViews(root) {
    if (!root || !state.viewObserver || !(root instanceof HTMLElement)) return;
    if (root.matches('article')) state.viewObserver.unobserve(root);
    root.querySelectorAll('article').forEach((article) => state.viewObserver.unobserve(article));
  }

  function captureArticle(article) {
    if (state.settings.hideAds && isAdArticle(article)) { hideAdElement(article); return; }
    let adultSpamResult;
    if (adultSpamFilteringEnabled() && evaluateAndApplyAdultSpam(article, adultSpamResult = {}, true)) return;
    if (!(article instanceof HTMLElement)) return;
    const url = adultSpamResult?.url ?? getStatusLink(article);
    const id = adultSpamResult?.id ?? extractStatusIdFromUrl(url);
    if (!id) return;
    observeArticleView(article, id);

    const sourceInfo = getCurrentSourceInfo();
    if ((state.settings.skipSources || []).includes(sourceInfo.type)) return;

    const isFirstVisibleCapture = !state.visibleMap.has(id);
    const author = adultSpamResult?.input?.author || extractAuthor(article);
    const text = adultSpamResult?.input?.text ?? extractText(article);
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

  function expandPostShowMore(scope) {
    if (!state.settings.autoExpandPostText) return 0;
    const articles = getArticlesFromScope(scope);
    let expanded = 0;
    articles.forEach((article) => {
      if (article.closest('#BetterX-root')) return;
      article.querySelectorAll('button, a[role="link"], [role="button"]').forEach((control) => {
        if (autoExpandedPostShowMoreControls.has(control)) return;
        const label = (control.innerText || control.textContent || '').trim();
        if (!POST_SHOW_MORE_LABELS.has(label)) return;
        // 只命中帖子 article 内文案完全等于“显示更多”的可交互控件；
        // “显示更多回复”等不同文案不会命中，避免自动展开讨论串或侧栏内容。
        autoExpandedPostShowMoreControls.add(control);
        try {
          control.click();
          expanded++;
        } catch (err) {}
      });
    });
    return expanded;
  }

  function scanArticles(root) {
    const scope = root && root.querySelectorAll ? root : document;
    if (state.settings.hideAds) sweepStandaloneAds(scope);
    getArticlesFromScope(scope).forEach(captureArticle);
    if (state.settings.mediaDownload) injectDownloadButtons(scope);
    if (state.settings.restoreMediaGrid) applyMediaGridLayout(scope);
    if (state.settings.bypassAgeRestriction) revealAgeRestricted(scope);
    if (state.settings.autoExpandPostText) expandPostShowMore(scope);
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
