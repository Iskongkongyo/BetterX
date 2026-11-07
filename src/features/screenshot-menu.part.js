  let screenshotMenuCleanup = null;
  let screenshotMenuInstalled = false;
  let screenshotClosingMenu = false;
  const SCREENSHOT_MENU_SELECTOR = '[role="menu"], [data-testid="sheetDialog"]';

  function visibleScreenshotMenus() {
    return [...document.querySelectorAll(SCREENSHOT_MENU_SELECTOR)].filter(menu => {
      if (menu.closest('#BetterX-root, [hidden], [aria-hidden="true"]')) return false;
      const rect = menu.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(menu).visibility !== 'hidden';
    });
  }

  function findScreenshotMenuTrigger(target) {
    const element = target?.nodeType === 1 ? target : target?.parentElement;
    if (!element || element.closest('#BetterX-root')) return null;
    const button = element.closest('[data-testid="caret"], button[aria-haspopup="menu"]');
    if (!button || !button.closest('article')) return null;
    if (button.matches('[data-testid="caret"]')) return button;
    const label = (button.getAttribute('aria-label') || '').trim().toLowerCase();
    const use = button.querySelector('svg use');
    return ['more', '更多', '詳細', '详细'].includes(label)
      || (use?.getAttribute('href') || use?.getAttribute('xlink:href')) === '#icon-more' ? button : null;
  }

  function scheduleScreenshotMenu(trigger, previousMenus) {
    screenshotMenuCleanup?.();
    const article = trigger.closest('article');
    const statusId = extractStatusIdFromUrl(getStatusLink(article));
    if (!statusId || isDownloadExcludedArticle(article)) return;
    const priorMenus = previousMenus || new Set(visibleScreenshotMenus());
    let menu = null, item = null, timer = null, stopped = false;
    const retries = [];
    const observer = new MutationObserver(() => inject());
    const cleanup = () => {
      if (stopped) return;
      stopped = true;
      observer.disconnect();
      clearTimeout(timer);
      retries.forEach(clearTimeout);
      retries.length = 0;
      if (screenshotMenuCleanup === cleanup) screenshotMenuCleanup = null;
    };
    const inject = () => {
      if (stopped || !trigger.isConnected) { cleanup(); return; }
      if (menu && !menu.isConnected) { cleanup(); return; }
      if (!menu) {
        const triggerRect = trigger.getBoundingClientRect();
        const candidates = visibleScreenshotMenus().filter(candidate => !priorMenus.has(candidate)
          || candidate.id === trigger.getAttribute('aria-controls'));
        candidates.sort((a, b) => {
          const distance = candidate => { const rect = candidate.getBoundingClientRect(); return Math.hypot(rect.left - triggerRect.left, rect.top - triggerRect.top); };
          return distance(a) - distance(b);
        });
        menu = candidates[0] || null;
        if (!menu) return;
        observer.disconnect();
        observer.observe(menu, { childList: true, subtree: true, attributes: true,
          attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
      }
      if (item?.isConnected) return;
      const nativeItem = menu.querySelector('[role="menuitem"]:not([data-betterx-screenshot-menu])');
      if (!nativeItem) return;
      menu.querySelectorAll('[data-betterx-screenshot-menu]').forEach(element => element.remove());
      item = document.createElement('div');
      item.setAttribute('role', 'menuitem'); item.tabIndex = 0;
      item.setAttribute('data-betterx-screenshot-menu', '');
      item.className = 'BetterX-screenshot-menu-item';
      item.style.color = getComputedStyle(nativeItem).color;
      item.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h6l2 2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-2Zm3 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/></svg><span></span>`;
      item.querySelector('span').textContent = uiText('保存帖子截图');
      const activate = (event) => {
        event.preventDefault(); event.stopPropagation();
        cleanup();
        screenshotClosingMenu = true;
        try { trigger.click(); } finally { screenshotClosingMenu = false; }
        runPostScreenshot(article, statusId);
      };
      item.addEventListener('click', activate);
      item.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') activate(event);
      });
      nativeItem.parentElement.insertBefore(item, nativeItem);
      retries.forEach(clearTimeout);
      retries.length = 0;
    };
    screenshotMenuCleanup = cleanup;
    observer.observe(document.body, { childList: true, subtree: true, attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'role', 'data-testid'] });
    // 仅在原生菜单打开期间观察；不增加常驻的整页扫描。
    timer = setTimeout(cleanup, 5000);
    // 底部菜单可能先挂载隐藏节点，再通过属性或动画显示。
    for (const delay of [60, 180, 420, 900]) retries.push(setTimeout(inject, delay));
    queueMicrotask(inject);
  }

  function installPostScreenshotMenu() {
    if (screenshotMenuInstalled) return;
    screenshotMenuInstalled = true;
    let press = null;
    const open = event => {
      if (screenshotClosingMenu || (event.type === 'keydown' && (!['Enter', ' '].includes(event.key) || event.repeat))) return;
      if (event.type === 'pointerdown' && (event.button !== 0 || event.isPrimary === false)) return;
      const trigger = findScreenshotMenuTrigger(event.target);
      if (!trigger) return;
      if (event.type === 'click' && press?.trigger === trigger && Date.now() - press.at < 2000 && screenshotMenuCleanup) {
        press = null;
        return;
      }
      const previous = new Set(visibleScreenshotMenus());
      if (event.type !== 'click') press = { trigger, at: Date.now(), id: event.pointerId,
        down: event.type === 'pointerdown', x: event.clientX, y: event.clientY };
      // 在触摸按下阶段记录菜单并开始观察，避免 pointerup 先打开菜单、click 才到达时被误认为旧菜单。
      scheduleScreenshotMenu(trigger, previous);
    };
    document.addEventListener('pointerdown', open, true);
    document.addEventListener('pointermove', event => {
      if (!press?.down || press.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) {
        screenshotMenuCleanup?.(); press = null;
      }
    }, true);
    document.addEventListener('pointerup', event => { if (press?.id === event.pointerId) press.down = false; }, true);
    document.addEventListener('pointercancel', event => {
      if (press?.id === event.pointerId) { screenshotMenuCleanup?.(); press = null; }
    }, true);
    document.addEventListener('click', open, true);
    document.addEventListener('keydown', open, true);
    window.addEventListener('pagehide', () => { screenshotMenuCleanup?.(); press = null; });
  }
