  const DISMISS_WIDGET_RULES = [
    { key: 'hideWhatsHappening', className: 'BetterX-whatsnew-hidden', rootClass: 'BetterX-hide-whatsnew',
      selector: 'section[role="region"]', resolve: getWhatsHappeningContainer, bindings: new WeakMap() },
    { key: 'hideWhoToFollow', className: 'BetterX-who-to-follow-hidden', rootClass: 'BetterX-hide-who-to-follow',
      selector: 'aside[role="complementary"]', resolve: getWhoToFollowContainer, bindings: new WeakMap() },
    { key: 'hideMoney', className: 'BetterX-money-hidden', rootClass: 'BetterX-hide-money',
      selector: 'a[href*="/i/money"]', resolve: getMoneyEntry, bindings: new WeakMap() },
  ];
  const DISMISS_WIDGET_MUTATION_SCOPE = DISMISS_WIDGET_RULES
    .flatMap(rule => [rule.selector, `.${rule.className}`]).join(', ');
  const DISMISS_WIDGET_MARKED_SELECTOR = DISMISS_WIDGET_RULES.map(rule => `.${rule.className}`).join(', ');

  function dismissWidgetsActive() {
    return DISMISS_WIDGET_RULES.some(rule => state.settings[rule.key]);
  }

  function isOutsidePostContent(element) {
    return !element.closest('article, [data-testid="tweet"], #BetterX-root, [data-testid="primaryColumn"]');
  }

  function getExclusiveWidgetContainer(marker) {
    let container = marker;
    for (let depth = 0; depth < 2; depth++) {
      const parent = container.parentElement;
      if (!parent?.matches('div') || parent.children.length !== 1
          || parent.matches('[role], [data-testid="sidebarColumn"], [data-testid="primaryColumn"], [data-testid="cellInnerDiv"]')
          || [...parent.childNodes].some(node => node.nodeType === 3 && node.textContent.trim())) break;
      container = parent;
    }
    return container;
  }

  function getWhatsHappeningContainer(region) {
    if (!region.matches('section[role="region"]') || !isOutsidePostContent(region)) return null;
    // “有什么新鲜事”的可访问标题与随机 ID 会随语言和渲染变化；组合稳定的趋势标记与探索入口。
    if (region.querySelector('article, [data-testid="tweet"]') || !region.querySelector('[data-testid="trend"]')
        || !region.querySelector('a[href="/explore/tabs/for-you"], a[href^="/explore/tabs/for-you?"]')) return null;
    return getExclusiveWidgetContainer(region);
  }

  function getWhoToFollowContainer(aside) {
    if (!aside.matches('aside[role="complementary"]') || !isOutsidePostContent(aside)) return null;
    // 仅处理独立的推荐卡片，关注者页、搜索结果和正文中的 UserCell 不属于此结构。
    if (aside.querySelector('article, [data-testid="tweet"]') || !aside.querySelector('[data-testid="UserCell"]')
        || !aside.querySelector('a[href="/i/connect_people"], a[href^="/i/connect_people?"]')) return null;
    return getExclusiveWidgetContainer(aside);
  }

  function getMoneyEntry(link) {
    if (!link.matches('a[href]') || !isOutsidePostContent(link)) return null;
    try {
      const url = new URL(link.getAttribute('href'), location.origin);
      const sameSite = url.origin === location.origin
        || (url.protocol === 'https:' && ['x.com', 'm.x.com', 'twitter.com', 'www.x.com', 'www.twitter.com'].includes(url.hostname));
      return sameSite && url.pathname.replace(/\/+$/, '') === '/i/money' ? link : null;
    } catch { return null; }
  }

  function collectDismissMatches(scope, selector) {
    const matches = new Set(scope.querySelectorAll(selector));
    if (scope.matches?.(selector)) matches.add(scope);
    const ancestor = scope.closest?.(selector);
    if (ancestor) matches.add(ancestor);
    return matches;
  }

  function sweepDismissWidgets(root = document) {
    const scope = root?.querySelectorAll ? root : document;
    if (scope.closest?.('article, [data-testid="tweet"], #BetterX-root, [data-testid="primaryColumn"]')) {
      // 正文和主列表不参与卡片识别；若 X 把曾标记过的节点移进正文，撤销旧标记。
      for (const element of collectDismissMatches(scope, DISMISS_WIDGET_MARKED_SELECTOR)) {
        for (const rule of DISMISS_WIDGET_RULES) {
          if (element.classList.contains(rule.className)) {
            element.classList.remove(rule.className);
            rule.bindings.delete(element);
          }
        }
      }
      return;
    }
    for (const rule of DISMISS_WIDGET_RULES) {
      if (!state.settings[rule.key]) continue;
      // X 可复用导航链接或卡片外壳；先撤销已不再对应原目标的标记。
      for (const container of collectDismissMatches(scope, `.${rule.className}`)) {
        const marker = rule.bindings.get(container);
        if (marker?.isConnected && container.contains(marker) && rule.resolve(marker) === container) continue;
        container.classList.remove(rule.className);
        rule.bindings.delete(container);
      }
      for (const marker of collectDismissMatches(scope, rule.selector)) {
        const container = rule.resolve(marker);
        if (!container) continue;
        rule.bindings.set(container, marker);
        if (!container.classList.contains(rule.className)) container.classList.add(rule.className);
      }
    }
  }

  function applyDismissWidgetHiding() {
    for (const rule of DISMISS_WIDGET_RULES) {
      document.documentElement.classList.toggle(rule.rootClass, !!state.settings[rule.key]);
      if (!state.settings[rule.key]) {
        document.querySelectorAll(`.${rule.className}`).forEach(element => element.classList.remove(rule.className));
        rule.bindings = new WeakMap();
      }
    }
    if (dismissWidgetsActive()) sweepDismissWidgets();
  }
