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
    'video[poster*="amplify_tw_video_thumb"]',
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
    getArticlesFromScope(scope).forEach(unlockAgeRestricted);
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
    t.textContent = uiText(msg);
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
      <div class="BetterX-dialog${options.showCloseIcon ? ' has-close-icon' : ''}" role="dialog" aria-modal="true" aria-labelledby="BetterX-dialog-title">
        <button type="button" class="BetterX-dialog-close" data-dialog-close hidden aria-label="${escapeHtml(uiText(options.closeIconLabel || '关闭'))}" title="${escapeHtml(uiText(options.closeIconLabel || '关闭'))}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 5.3 12 10.9l5.6-5.6 1.1 1.1-5.6 5.6 5.6 5.6-1.1 1.1-5.6-5.6-5.6 5.6-1.1-1.1 5.6-5.6-5.6-5.6z"/></svg>
        </button>
        <div class="BetterX-dialog-title" id="BetterX-dialog-title"></div>
        <div class="BetterX-dialog-body"></div>
        <div class="BetterX-dialog-actions">
          <button type="button" class="BetterX-btn" data-dialog-choice="tertiary" hidden></button>
          <button type="button" class="BetterX-btn" data-dialog-choice="secondary"></button>
          <button type="button" class="BetterX-btn primary" data-dialog-choice="primary"></button>
        </div>
      </div>
    `;
    overlay.querySelector('.BetterX-dialog-title').textContent = uiText(options.title || 'BetterX 提示');
    overlay.querySelector('.BetterX-dialog-body').innerHTML = options.bodyHtml || '';
    const primary = overlay.querySelector('[data-dialog-choice="primary"]');
    const secondary = overlay.querySelector('[data-dialog-choice="secondary"]');
    const tertiary = overlay.querySelector('[data-dialog-choice="tertiary"]');
    const closeIcon = overlay.querySelector('[data-dialog-close]');
    if (closeIcon && options.showCloseIcon) {
      closeIcon.hidden = false;
      closeIcon.addEventListener('click', () => {
        closeBetterXDialog();
        if (typeof options.onCloseIcon === 'function') options.onCloseIcon();
      });
    }
    primary.textContent = uiText(options.primaryText || '确定');
    secondary.textContent = uiText(options.secondaryText || '取消');
    if (options.tertiaryText) {
      tertiary.hidden = false;
      tertiary.textContent = uiText(options.tertiaryText);
    }
    localizeBetterXTree(overlay);
    primary.addEventListener('click', () => {
      closeBetterXDialog();
      if (typeof options.onPrimary === 'function') options.onPrimary();
    });
    secondary.addEventListener('click', () => {
      closeBetterXDialog();
      if (typeof options.onSecondary === 'function') options.onSecondary();
    });
    tertiary.addEventListener('click', () => {
      closeBetterXDialog();
      if (typeof options.onTertiary === 'function') options.onTertiary();
    });
    state.rootEl.appendChild(overlay);
    setTimeout(() => primary.focus(), 0);
  }

  function chooseUiLanguage(language) {
    if (!SUPPORTED_UI_LANGUAGES.has(language)) return;
    if (language === UI_LANGUAGE && readUiLanguageOverride() === language) {
      closeBetterXDialog();
      return;
    }
    let saved;
    try {
      if (typeof GM_setValue !== 'function') throw new Error('GM_setValue unavailable');
      saved = GM_setValue(UI_LANGUAGE_OVERRIDE_KEY, language);
    } catch (err) {
      showToast(`⚠️ ${uiText('无法保存语言设置')}`);
      return;
    }
    closeBetterXDialog();
    showToast('正在切换语言并刷新…', 0);
    Promise.resolve(saved).then(() => location.reload()).catch(() => {
      showToast(`⚠️ ${uiText('无法保存语言设置')}`);
    });
  }

  function showLanguageDialog() {
    const options = [
      { value: 'zh-CN', label: '简体中文', code: '简体' },
      { value: 'zh-TW', label: '繁體中文', code: '繁體' },
      { value: 'ja', label: '日本語', code: 'JA' },
      { value: 'en', label: 'English', code: 'EN' },
    ];
    showBetterXDialog({
      title: '选择界面语言',
      bodyHtml: `
        <div class="BetterX-language-options" role="radiogroup" aria-label="${escapeHtml(uiText('选择界面语言'))}">
          ${options.map((item) => `
            <button type="button" class="BetterX-language-option${item.value === UI_LANGUAGE ? ' is-current' : ''}"
              data-ui-language="${escapeHtml(item.value)}" role="radio" aria-checked="${item.value === UI_LANGUAGE ? 'true' : 'false'}">
              <span class="BetterX-language-code">${escapeHtml(item.code)}</span>
              <span>${escapeHtml(item.label)}</span>
              <span class="BetterX-language-check" aria-hidden="true">${item.value === UI_LANGUAGE ? '✓' : ''}</span>
            </button>
          `).join('')}
        </div>
        <p class="BetterX-language-note">选择后页面会刷新，帖子与设置数据不会受到影响。</p>
      `,
      primaryText: '取消',
    });
    const overlay = document.getElementById('BetterX-choice-dialog');
    if (!overlay) return;
    const secondary = overlay.querySelector('[data-dialog-choice="secondary"]');
    if (secondary) secondary.hidden = true;
    overlay.querySelectorAll('[data-ui-language]').forEach((button) => {
      button.addEventListener('click', () => chooseUiLanguage(button.getAttribute('data-ui-language') || ''));
    });
    const current = overlay.querySelector('.BetterX-language-option.is-current');
    if (current) setTimeout(() => current.focus(), 0);
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
      scriptVersion: (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '3.1.0',
      userscriptManager: USERSCRIPT_MANAGER || 'unknown',
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
      uiAlert('页面尚未就绪，诊断信息已输出到控制台。');
      return;
    }
    download(`betterx-firefox-diagnostic-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, json);
    if (state.rootEl) showToast('已导出 Firefox 兼容诊断');
  }

  function toggleAppBadgeFromMenu() {
    const hidden = !state.settings.hideAppBadge;
    setSettingsPartial({ hideAppBadge: hidden });
    if (state.rootEl) {
      showToast(hidden
        ? (isMobileBadgeViewport() ? '点击屏幕右侧小蓝条可显示徽标' : '已隐藏应用徽标 · Alt+X 可打开面板')
        : '已显示应用徽标');
    }
  }

  function registerMenuCommands() {
    if (typeof GM_registerMenuCommand !== 'function') return;
    try {
      GM_registerMenuCommand(uiText('BetterX：显示 / 隐藏应用徽标'), toggleAppBadgeFromMenu);
      if (IS_FIREFOX) {
        GM_registerMenuCommand(uiText('BetterX：强制开启 Firefox 兼容模式并刷新'), () => {
          switchFirefoxCompatibilityFromMenu(true);
        });
        GM_registerMenuCommand(uiText('BetterX：恢复 Firefox 完整模式并刷新'), () => {
          switchFirefoxCompatibilityFromMenu(false);
        });
        GM_registerMenuCommand(uiText('BetterX：导出 Firefox 兼容诊断'), downloadFirefoxCompatibilityDiagnostic);
      }
    } catch (err) {
      console.error('[BetterX] register menu commands failed:', err);
    }
  }

  // ── 广告检测 / 屏蔽 ──────────────────────────────────────────────────
  // X 的推广帖特征：article 外层含 [data-testid="placementTracking"] 追踪像素，
  // 且头部有独立的“广告 / Ad / Promoted”标签（不在正文 tweetText 内）。
