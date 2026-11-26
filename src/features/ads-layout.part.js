  // X 新版界面（2025）取消了 data-testid，推广标签改为时间线内文本，例如：
  // “来自 apple.com 的广告”“已推广”“Promoted by Webull HK”“推广人 Webull HK”。
  // 因此不能再用精确词表；统一按标签文本模式匹配，并排除正文与作者链接，避免误伤。
  const AD_LABEL_MAX_LENGTH = 80;
  const AD_LABEL_HINT_RE = /广告|廣告|推广|推廣|赞助|贊助|広告|プロモーション|광고|프로모션|(?:Ad|Ads|Promoted|Sponsored|Anzeige|Publicidad|Anúncio|Promocionado|Promovido|Patrocinado|Reklama|Sponsorisé|Gesponsert|Реклама)/i;
  const AD_LABEL_PATTERNS = [
    /^(?:广告|廣告|已推广|已推廣|推广|推廣|赞助|贊助|赞助内容|贊助內容|広告|プロモーション|광고|프로모션|Anzeige|Publicidad|Anúncio|Promocionado|Promovido|Patrocinado|Reklama|Sponsorisé|Gesponsert|Реклама)$/i,
    /^(?:Ad|Ads|Promoted|Sponsored)$/i,
    /^(?:来自|來自)[^]{1,80}的(?:广告|廣告)$/,
    /^(?:Ad|Ads|Promoted|Sponsored)\s*(?:from|by)\s+[^]{1,80}$/i,
    /^(?:推广人|推廣人|广告主|廣告主|推广方|推廣方|赞助人|贊助人)\s*[^]{0,80}$/,
    /^[^]{1,80}(?:の広告|による広告|のプロモーション)$/,
    /^[^]{1,80}의\s*(?:광고|프로모션)$/,
    /^(?:Anzeige|Publicidad|Anúncio|Promocionado|Promovido|Patrocinado|Reklama|Sponsorisé|Gesponsert)\s+(?:von|de|por|door|par|di|da)\s+[^]{1,80}$/i,
  ];
  const AD_LABEL_IGNORE_SELECTOR = [
    '#BetterX-root', '[data-testid="tweetText"]', '[data-testid="User-Name"]', '[data-testid^="card."]',
    '[data-testid="quoteTweet"]', '[data-testid="quoteTweetContainer"]', '[data-testid="tweetPhoto"]',
    '[data-testid="videoPlayer"]', '[data-testid="videoComponent"]',
    'div[lang][dir="auto"]', '.whitespace-pre-wrap', 'blockquote', 'a[href]',
  ].join(', ');
  const AD_IMPRESSION_SELECTOR = '[data-testid$="impression-pixel"]';
  const AD_ARTICLE_ROW_SELECTOR = 'li[data-index]';
  const hiddenAdArticleContainers = new WeakSet();
  const PROMOTED_TREND_SELECTOR = 'a[href*="promoted_trend_click"]';
  const PROMOTED_TREND_MARKED_SELECTOR = '.BetterX-ad-trend-hidden, .BetterX-ad-trend-collapsed';
  const promotedTrendLinks = new WeakMap();
  // X 新增的独立程序化广告位（Google SafeFrame），不属于 article，需隐藏整个卡片以免留下空白。
  const STANDALONE_AD_SELECTOR = [
    '[data-testid="whoToFollowSspAd"]',
    '[data-testid$="SspAd"]',
    'iframe[src*="doubleclick.net"]',
    'iframe[src*="googlesyndication.com"]',
    'iframe[src*="amazon-adsystem.com"]',
    'iframe[id^="google_ads_iframe"]',
    'ins.adsbygoogle',
  ].join(', ');
  const PREMIUM_UPSELL_SELECTOR = 'aside[role="complementary"], a[href*="/i/premium_sign_up"]';
  const PREMIUM_UPSELL_LABELS = new Set([
    '订阅 Premium', '訂閱 Premium', 'Subscribe to Premium',
    'プレミアムにサブスクライブ', 'Premium 구독하기',
  ]);
  const PREMIUM_UPSELL_ACTION_LABELS = new Set([
    '订阅', '訂閱', 'Subscribe', 'サブスクライブ', '구독하기',
  ]);
  const NFL_SCORES_SELECTOR = '[data-testid="nfl_scores_sidebar"]';

  function isAdLabelText(text) {
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    if (!value || value.length > AD_LABEL_MAX_LENGTH) return false;
    return AD_LABEL_PATTERNS.some((pattern) => pattern.test(value));
  }

  function hasAdLabel(article) {
    if (!article || typeof document.createTreeWalker !== 'function') return false;
    const showText = typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;
    const walker = document.createTreeWalker(article, showText);
    let node;
    while ((node = walker.nextNode())) {
      const text = (node.nodeValue || '').trim();
      if (!text || text.length > AD_LABEL_MAX_LENGTH || !AD_LABEL_HINT_RE.test(text)) continue;
      if (!isAdLabelText(text)) continue;
      const element = node.parentElement;
      // 正文、作者名与站内链接里出现“广告 / Promoted”等词不算推广标签。
      if (!element || (element.closest && element.closest(AD_LABEL_IGNORE_SELECTOR))) continue;
      return true;
    }
    return false;
  }

  function isAdArticle(article) {
    if (!article || !article.querySelector) return false;
    const cell = (article.closest && article.closest('[data-testid="cellInnerDiv"]')) || article;
    // 特征1：广告展示追踪像素（只有推广帖才有；top/right/bottom/left-impression-pixel）。
    // 注意：视频帖也会用 placementTracking 包裹播放器，但不含 impression-pixel，故不能用 placementTracking 判定。
    if (cell.querySelector && cell.querySelector(AD_IMPRESSION_SELECTOR)) return true;
    // 特征2：推广标签。旧版是精确的“广告 / Promoted”，新版是“来自 X 的广告 / 已推广 / 推广人 X”等。
    return hasAdLabel(article);
  }

  // 新版时间线使用绝对定位虚拟列表（main ul > li[data-index] + inline transform），
  // display:none 会让列表项从测量中消失并留下空白；改为折叠高度，至少移除广告内容。
  function hideAdElement(article) {
    if (!article) return;
    const cell = article.closest?.('[data-testid="cellInnerDiv"]');
    const row = cell ? null : article.closest?.(AD_ARTICLE_ROW_SELECTOR);
    const container = cell || row || article;
    hiddenAdArticleContainers.add(container);
    container.classList.add(row ? 'BetterX-ad-collapsed' : 'BetterX-ad-hidden');
  }

  function updateAdArticleVisibility(article) {
    if (!article?.classList) return false;
    if (isAdArticle(article)) {
      hideAdElement(article);
      return true;
    }
    // X 可复用帖子或其外壳。只清理此前由帖子过滤添加的标记。
    for (const container of [article, article.closest?.('[data-testid="cellInnerDiv"]'), article.closest?.(AD_ARTICLE_ROW_SELECTOR)]) {
      if (container && hiddenAdArticleContainers.delete(container)) {
        container.classList.remove('BetterX-ad-hidden', 'BetterX-ad-collapsed');
      }
    }
    return false;
  }

  function hideStandaloneAdElement(element) {
    if (!element) return;
    const container = element.matches && element.matches(STANDALONE_AD_SELECTOR)
      ? element
      : (element.closest ? element.closest(STANDALONE_AD_SELECTOR) : null);
    if (container && container.classList) container.classList.add('BetterX-ad-hidden');
  }

  function getPromotedTrendTarget(link) {
    if (link.closest('article, [data-testid="tweet"], #BetterX-root')) return null;
    try {
      const url = new URL(link.getAttribute('href'), location.origin);
      if (url.protocol !== 'https:' || url.port || !X_API_HOSTS.has(url.hostname)
          || url.searchParams.get('src') !== 'promoted_trend_click') return null;
    } catch { return null; }
    const trend = link.closest('[data-testid="trend"]');
    const region = link.closest('[data-testid="sidebarColumn"], [data-testid="trendList"], [data-testid="trends"]')
      || (/^\/explore(?:\/|$)/.test(location.pathname) ? link.closest('main, [data-testid="primaryColumn"]') : null);
    const row = trend || link.closest('li, div[role="link"]');
    if (!row || (!trend && !region?.contains(row)) || row.querySelector('article, [data-testid="tweet"]')) return null;
    return row;
  }

  function sweepPromotedTrends(scope) {
    eachMatchingInScope(scope, PROMOTED_TREND_MARKED_SELECTOR, (row) => {
      const link = promotedTrendLinks.get(row);
      if (link && row.contains(link) && getPromotedTrendTarget(link) === row) return;
      promotedTrendLinks.delete(row);
      row.classList.remove('BetterX-ad-trend-hidden', 'BetterX-ad-trend-collapsed');
    });
    eachMatchingInScope(scope, PROMOTED_TREND_SELECTOR, (link) => {
      const row = getPromotedTrendTarget(link);
      if (!row) return;
      promotedTrendLinks.set(row, link);
      row.classList.add(row.matches(AD_ARTICLE_ROW_SELECTOR) ? 'BetterX-ad-trend-collapsed' : 'BetterX-ad-trend-hidden');
    });
  }

  function hidePremiumUpsellElement(element) {
    if (!element || !element.closest) return;
    // 新版：侧栏卡片是 <section><h2>订阅 Premium</h2>…<a href="/i/premium_sign_up">订阅</a></section>，
    // 外层 aside 同时包含趋势列表，因此只能隐藏卡片本身。
    const aside = element.closest('aside[role="complementary"]');
    const signupLink = element.closest('a[href*="/i/premium_sign_up"]');
    const link = signupLink || aside?.querySelector('a[href*="/i/premium_sign_up"]');
    const card = link?.closest('section');
    if (card && (!aside || aside.contains(card))) {
      const heading = card.querySelector('h1, h2, h3');
      if (PREMIUM_UPSELL_LABELS.has((heading?.textContent || '').trim())
          || PREMIUM_UPSELL_LABELS.has((link.textContent || '').trim())) {
        card.classList.add('BetterX-ad-hidden');
        return;
      }
    }

    if (aside) {
      const label = (aside.getAttribute('aria-label') || '').trim();
      if (!PREMIUM_UPSELL_LABELS.has(label)) return;

      // PC 端 aside 外还有一层带边框和留白的卡片容器；仅在它没有其他内容时一并隐藏。
      const wrapper = aside.parentElement && aside.parentElement.children.length === 1
        ? aside.parentElement
        : aside;
      wrapper.classList.add('BetterX-ad-hidden');
      return;
    }

    // 移动端只有一个“订阅”链接，没有 aside；动作文本校验可避免误伤普通 Premium 导航入口。
    const actionLabel = (signupLink && (signupLink.innerText || signupLink.textContent) || '').trim();
    if (!signupLink || !PREMIUM_UPSELL_ACTION_LABELS.has(actionLabel)) return;

    // 提供的移动端 DOM 中按钮外有三层独占包装；逐层确认没有兄弟元素后再隐藏，避免留下占位。
    let wrapper = signupLink;
    for (let depth = 0; depth < 3; depth++) {
      const parent = wrapper.parentElement;
      if (!parent || parent.children.length !== 1
          || parent.matches('body, main, header, nav, [role="navigation"]')) break;
      wrapper = parent;
    }
    wrapper.classList.add('BetterX-ad-hidden');
  }

  function eachMatchingInScope(scope, selector, callback) {
    if (!scope) return;
    const ancestor = scope.closest?.(selector);
    if (ancestor) callback(ancestor);
    if (scope.querySelectorAll) scope.querySelectorAll(selector).forEach(callback);
  }

  function sweepStandaloneAds(root) {
    if (!state.settings.hideAds) return;
    const scope = root && root.querySelectorAll ? root : document;
    eachMatchingInScope(scope, STANDALONE_AD_SELECTOR, hideStandaloneAdElement);
    sweepPromotedTrends(scope);
    eachMatchingInScope(scope, PREMIUM_UPSELL_SELECTOR, hidePremiumUpsellElement);
  }

  function sweepAds(root) {
    if (!state.settings.hideAds) return;
    getArticlesFromScope(root).forEach(updateAdArticleVisibility);
    sweepStandaloneAds(root);
  }

  function unhideAds() {
    document.querySelectorAll('.BetterX-ad-hidden, .BetterX-ad-collapsed, ' + PROMOTED_TREND_MARKED_SELECTOR)
      .forEach((el) => el.classList.remove(
        'BetterX-ad-hidden', 'BetterX-ad-collapsed', 'BetterX-ad-trend-hidden', 'BetterX-ad-trend-collapsed',
      ));
  }

  function applyAdHiding() {
    document.documentElement?.classList?.toggle('BetterX-hide-ads', Boolean(state.settings.hideAds));
    if (state.settings.hideAds) sweepAds();
    else unhideAds();
  }

  // ── 网络层广告过滤 ────────────────────────────────────────────────
  // X 新版时间线先 fetch GraphQL，再渲染虚拟列表。直接删除响应里的推广入口，
  // X 就不会为广告预留高度，避免“隐藏后留下大块空白”。DOM 层继续作为 SSR/缓存/兼容模式兜底。
  function isPromotedTimelineItemContent(content) {
    return Boolean(content?.promotedMetadata || content?.promoted_metadata);
  }

  function stripPromotedItems(items) {
    if (!Array.isArray(items)) return items;
    const kept = items.filter((item) => !isPromotedTimelineItemContent(item?.item?.itemContent)
      && !isPromotedTimelineItemContent(item?.item?.content)
      && !isPromotedTimelineItemContent(item?.itemContent)
      && !isPromotedTimelineItemContent(item?.content));
    return kept.length === items.length ? items : kept;
  }

  function stripPromotedFromTimelinePayload(payload) {
    let changed = false;
    const keepEntry = (entry) => {
      const content = entry?.content;
      if (isPromotedTimelineItemContent(content?.itemContent) || isPromotedTimelineItemContent(content?.content)) {
        changed = true;
        return false;
      }
      const items = stripPromotedItems(content?.items);
      if (items === content?.items) return true;
      changed = true;
      content.items = items;
      // 有 ID 的模块可能在本次或后续响应中收到普通追加项，保留其定位目标。
      return items.length > 0 || Boolean(entry.entryId || entry.entry_id);
    };
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(visit); return; }
      if (Array.isArray(node.instructions)) {
        const kept = [];
        for (const instruction of node.instructions) {
          if (!instruction || typeof instruction !== 'object') { kept.push(instruction); continue; }
          if (Array.isArray(instruction.entries)) {
            const entries = instruction.entries.filter(keepEntry);
            if (entries.length !== instruction.entries.length) instruction.entries = entries;
          }
          const moduleItems = stripPromotedItems(instruction.moduleItems);
          if (moduleItems !== instruction.moduleItems) {
            instruction.moduleItems = moduleItems;
            changed = true;
          }
          if (!instruction.entry || keepEntry(instruction.entry)) kept.push(instruction);
        }
        if (kept.length !== node.instructions.length) node.instructions = kept;
      }
      for (const key of Object.keys(node)) {
        if (key === 'instructions') continue;
        visit(node[key]);
      }
    };
    visit(payload);
    return changed;
  }

  function getNflEntryContainer(element) {
    if (!element) return null;
    const marker = element.matches && element.matches(NFL_SCORES_SELECTOR)
      ? element
      : (element.closest ? element.closest(NFL_SCORES_SELECTOR) : null);
    if (!marker) return null;
    // nfl_scores_sidebar 是卡片内的追踪层；其父节点才包含标题、球队和比赛入口。
    const container = marker.parentElement;
    return container && !container.matches('body, main, [data-testid="sidebarColumn"]')
      ? container
      : marker;
  }

  function hideNflEntryElement(element) {
    const container = getNflEntryContainer(element);
    if (container && container.classList) container.classList.add('BetterX-nfl-hidden');
  }

  function sweepNflEntries(root = document) {
    if (!state.settings.hideNfl) return;
    const scope = root && root.querySelectorAll ? root : document;
    if (scope.matches && scope.matches(NFL_SCORES_SELECTOR)) hideNflEntryElement(scope);
    if (scope.closest) hideNflEntryElement(scope.closest(NFL_SCORES_SELECTOR));
    scope.querySelectorAll(NFL_SCORES_SELECTOR).forEach(hideNflEntryElement);
  }

  function unhideNflEntries() {
    document.querySelectorAll('.BetterX-nfl-hidden')
      .forEach((element) => element.classList.remove('BetterX-nfl-hidden'));
  }

  function applyNflHiding() {
    if (state.settings.hideNfl) sweepNflEntries();
    else unhideNflEntries();
  }
  // ── 界面简化与宽屏 ─────────────────────────────────────────────────
  // 参考 X/Twitter Clean-up & Wide Layout Display；改用可逆 CSS 和现有批处理观察器，
  // 不复制其无防抖的全页 MutationObserver，也不写入不可恢复的内联宽度。
  const LAYOUT_EXCLUDED_PATHS = ['/messages', '/settings'];
  const LAYOUT_NAV_LABELS = new Set([
    '书签', '書籤', 'Bookmarks', 'ブックマーク', '북마크',
    '工作机会', '工作機會', 'Careers', '求人', '채용 정보',
    '创作者工作室', '創作者工作室', 'Creator Studio', 'クリエイタースタジオ', '크리에이터 스튜디오',
    '社区', '社群', 'Communities', 'コミュニティ', '커뮤니티',
    '商业', '商業', 'Business', 'ビジネス', '비즈니스',
    'Premium', 'プレミアム', '认证组织', '認證組織', 'Verified Orgs', '認証済み組織', '인증된 조직',
    '营利', '營利', 'Monetization', '収益化', '수익 창출', '广告', '廣告', 'Ads', '広告', '광고',
  ]);
  const LAYOUT_SUBSCRIBE_LABELS = new Set([
    '订阅 Premium', '訂閱 Premium', 'Subscribe to Premium', 'プレミアムにサブスクライブ', 'Premium 구독하기',
  ]);
  const LAYOUT_FOOTER_LABELS = new Set(['页脚', '頁尾', 'Footer', 'フッター', '바닥글']);
  const LAYOUT_SHOW_MORE_LABELS = new Set(['显示更多', '顯示更多', 'Show more', 'さらに表示', '더 보기']);
  const LAYOUT_STRUCTURE_SELECTOR = 'main, header[role="banner"], [data-testid="primaryColumn"]';
  const LAYOUT_STRUCTURE_CLASSES = [
    'BetterX-layout-primary', 'BetterX-layout-row', 'BetterX-layout-main',
    'BetterX-layout-shell', 'BetterX-layout-left-width-target',
  ];
  const LAYOUT_DOM_CLASSES = [
    'BetterX-layout-clean-hidden', 'BetterX-layout-showmore-hidden', ...LAYOUT_STRUCTURE_CLASSES,
  ];

  function layoutEnhancementsActive() {
    return !!state.settings.layoutEnabled
      && !LAYOUT_EXCLUDED_PATHS.some((path) => location.pathname.startsWith(path));
  }

  function ensureLayoutStyle() {
    let style = state.layoutStyleEl;
    if (!style || !style.isConnected) {
      style = document.getElementById('BetterX-layout-style') || document.createElement('style');
      style.id = 'BetterX-layout-style';
      if (!style.isConnected) (document.head || document.documentElement).appendChild(style);
      state.layoutStyleEl = style;
    }
    return style;
  }

  function clearLayoutClasses(classes) {
    const selector = classes.map((className) => `.${className}`).join(', ');
    document.querySelectorAll(selector).forEach((el) => el.classList.remove(...classes));
  }

  function clearLayoutDomClasses() { clearLayoutClasses(LAYOUT_DOM_CLASSES); }
  function clearLayoutStructureClasses() { clearLayoutClasses(LAYOUT_STRUCTURE_CLASSES); }

  function getLayoutElements() {
    const primaryCandidates = [...document.querySelectorAll('main [data-testid="primaryColumn"]')];
    const primary = primaryCandidates.find((el) => {
      const rect = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && css.display !== 'none' && css.visibility !== 'hidden';
    }) || primaryCandidates[0] || null;
    const main = primary ? primary.closest('main') : [...document.querySelectorAll('main[role="main"]')].find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(el).display !== 'none';
    }) || null;
    const row = primary ? primary.parentElement : null;
    // X 当前结构中，真正随导航栏改变宽度的是 header 下第二层 div。
    const leftWidthTarget = document.querySelector('header[role="banner"] > div > div')
      || document.querySelector('header[role="banner"] > div:first-child');
    return { primary, main, row, leftWidthTarget };
  }

  function updateDetectedLayoutWidthInputs() {
    if (state.settings.layoutAutoWidth === false) return;
    if (state.timelineWidthEl && document.activeElement !== state.timelineWidthEl && state.detectedTimelineWidth) {
      state.timelineWidthEl.value = String(state.detectedTimelineWidth);
    }
    if (state.leftbarWidthEl && document.activeElement !== state.leftbarWidthEl && state.detectedLeftbarWidth) {
      state.leftbarWidthEl.value = String(state.detectedLeftbarWidth);
    }
  }

  function detectNativeLayoutWidths(elements) {
    const { primary, leftWidthTarget } = elements;
    // 结构类已经生效时保留首次读到的原生值，避免把“填满后”的宽度误认为原生宽度。
    if (primary && !primary.classList.contains('BetterX-layout-primary')) {
      const width = Math.round(primary.getBoundingClientRect().width);
      if (width >= 300 && width <= 3000) state.detectedTimelineWidth = width;
    }
    if (leftWidthTarget && !leftWidthTarget.classList.contains('BetterX-layout-left-width-target')) {
      const width = Math.round(leftWidthTarget.getBoundingClientRect().width);
      if (width >= 120 && width <= 600) state.detectedLeftbarWidth = width;
    }
    updateDetectedLayoutWidthInputs();
  }

  function bindLayoutStructureClasses(elements, needsStructure, expandCenter, manualWidth) {
    clearLayoutStructureClasses();
    if (!needsStructure) return;
    const { primary, main, row, leftWidthTarget } = elements;
    if (primary) primary.classList.add('BetterX-layout-primary');
    if (row) row.classList.add('BetterX-layout-row');
    if (main) main.classList.add('BetterX-layout-main');
    if (manualWidth && leftWidthTarget) leftWidthTarget.classList.add('BetterX-layout-left-width-target');
    if (expandCenter && main) {
      // 隐藏任意侧栏后，从主列同级行一直贯通到 #react-root，释放剩余空间的宽度限制。
      let ancestor = row ? row.parentElement : main.parentElement;
      while (ancestor && ancestor !== document.body) {
        if (ancestor !== main) ancestor.classList.add('BetterX-layout-shell');
        if (ancestor.id === 'react-root') break;
        ancestor = ancestor.parentElement;
      }
    }
  }

  function buildLayoutCss(options) {
    const {
      autoWidth, timelineWidth, leftbarWidth, effectiveLeftbarWidth,
      hideLeftbar, hideSidebar, expandCenter,
    } = options;
    const rules = [
      '.BetterX-layout-clean-hidden, .BetterX-layout-showmore-hidden { display: none !important; }',
    ];

    if (hideLeftbar) rules.push('header[role="banner"] { display: none !important; }');
    if (hideSidebar) rules.push('[data-testid="sidebarColumn"] { display: none !important; }');

    // X 新版布局中只改 header 内层 div 不一定会释放左栏占位；手动模式同时约束外层 header。
    if (!autoWidth && !hideLeftbar) {
      rules.push(`
        header[role="banner"] {
          box-sizing: border-box !important;
          width: ${leftbarWidth}px !important;
          min-width: ${leftbarWidth}px !important;
          max-width: ${leftbarWidth}px !important;
          flex: 0 0 ${leftbarWidth}px !important;
        }
        header[role="banner"] > div,
        header[role="banner"] > div > div,
        .BetterX-layout-left-width-target {
          box-sizing: border-box !important;
          width: ${leftbarWidth}px !important;
          min-width: 0 !important;
          max-width: ${leftbarWidth}px !important;
        }
      `);
      if (leftbarWidth <= 120) {
        rules.push(`
          /* 窄左栏进入仅图标模式，避免 X 的文字标签撑回原宽度。 */
          header[role="banner"] nav[role="navigation"] a[role="link"] div[dir="ltr"],
          header[role="banner"] nav[role="navigation"] [data-testid="AppTabBar_More_Menu"] div[dir="ltr"],
          header[role="banner"] [data-testid="SideNav_AccountSwitcher_Button"] div[dir="ltr"],
          header[role="banner"] [data-testid="SideNav_NewTweet_Button"] span {
            display: none !important;
          }
          header[role="banner"] nav[role="navigation"] a[role="link"],
          header[role="banner"] nav[role="navigation"] [data-testid="AppTabBar_More_Menu"],
          header[role="banner"] [data-testid="SideNav_AccountSwitcher_Button"],
          header[role="banner"] [data-testid="SideNav_NewTweet_Button"] {
            box-sizing: border-box !important;
            max-width: ${Math.max(44, leftbarWidth)}px !important;
          }
        `);
      }
    }

    if (expandCenter) {
      rules.push(`
        .BetterX-layout-shell {
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          margin-inline: 0 !important;
        }
        .BetterX-layout-main {
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          flex: 1 1 0% !important; margin-inline: auto !important;
        }
        .BetterX-layout-row {
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          margin-inline: auto !important;
        }
        .BetterX-layout-primary {
          width: auto !important; max-width: none !important; min-width: 0 !important;
          flex: 1 1 0% !important; margin-inline: 0 !important;
        }
        .BetterX-layout-primary > div,
        .BetterX-layout-primary > div > div,
        .BetterX-layout-primary .r-1ye8kvj,
        .BetterX-layout-primary [data-testid="cellInnerDiv"],
        .BetterX-layout-primary [data-testid="cellInnerDiv"] > div,
        .BetterX-layout-primary [data-testid="cellInnerDiv"] article,
        .BetterX-layout-primary [data-testid="cellInnerDiv"] article > div {
          box-sizing: border-box !important;
          width: 100% !important; max-width: none !important; min-width: 0 !important;
          margin-inline: 0 !important;
        }
      `);
      if (hideSidebar && !hideLeftbar) {
        rules.push(`
          /* 右栏消失后让“左栏 + 主列”从视口左边开始，避免外层居中布局留下大块空白。 */
          .BetterX-layout-shell {
            justify-content: flex-start !important;
            align-items: flex-start !important;
          }
          header[role="banner"] {
            box-sizing: border-box !important;
            width: ${effectiveLeftbarWidth}px !important;
            min-width: ${effectiveLeftbarWidth}px !important;
            max-width: ${effectiveLeftbarWidth}px !important;
            flex: 0 0 ${effectiveLeftbarWidth}px !important;
          }
        `);
      }
    } else if (!autoWidth) {
      rules.push(`
        .BetterX-layout-main { max-width: none !important; min-width: 0 !important; flex: 1 1 auto !important; }
        .BetterX-layout-row { width: max-content !important; max-width: none !important; margin-inline: auto !important; }
        .BetterX-layout-primary {
          width: ${timelineWidth}px !important; max-width: none !important;
          flex: 0 0 ${timelineWidth}px !important; margin-inline: auto !important;
        }
        .BetterX-layout-left-width-target { width: ${leftbarWidth}px !important; }
      `);
    }

    if (state.settings.layoutHideMessageGrok !== false) {
      rules.push(`
        [data-testid="chat-drawer-root"], [data-testid="GrokDrawer"] {
          opacity: 0 !important; pointer-events: none !important;
          transform: translate(200px, 200px) !important;
        }
      `);
    }
    return rules.join('\n');
  }

  function getLayoutScopeElements(root, selector) {
    const scope = root && root.querySelectorAll ? root : document;
    const elements = new Set(scope.querySelectorAll(selector));
    if (scope.matches && scope.matches(selector)) elements.add(scope);
    const ancestor = scope.closest && scope.closest(selector);
    if (ancestor) elements.add(ancestor);
    return elements;
  }

  function layoutRootAffectsStructure(root) {
    return !!(root && ((root.matches && root.matches(LAYOUT_STRUCTURE_SELECTOR))
      || (root.querySelector && root.querySelector(LAYOUT_STRUCTURE_SELECTOR))));
  }

  function applyLayoutDomCleanup(root = document) {
    getLayoutScopeElements(root, '.BetterX-layout-clean-hidden, .BetterX-layout-showmore-hidden')
      .forEach((el) => el.classList.remove('BetterX-layout-clean-hidden', 'BetterX-layout-showmore-hidden'));
    if (state.settings.layoutCleanNavigation !== false) {
      getLayoutScopeElements(root, 'nav[role="navigation"] div[dir="ltr"]').forEach((item) => {
        const label = (item.textContent || '').trim();
        if (!LAYOUT_NAV_LABELS.has(label)) return;
        const target = item.closest('a, div[role="link"]');
        if (target) target.classList.add('BetterX-layout-clean-hidden');
      });
      getLayoutScopeElements(root, '[data-testid="super-upsell-UpsellCardRenderProperties"]')
        .forEach((el) => el.classList.add('BetterX-layout-clean-hidden'));
      getLayoutScopeElements(root, '[aria-label]').forEach((element) => {
        const label = (element.getAttribute('aria-label') || '').trim();
        if (LAYOUT_SUBSCRIBE_LABELS.has(label)
            || (element.matches('nav[role="navigation"]') && LAYOUT_FOOTER_LABELS.has(label))) {
          element.classList.add('BetterX-layout-clean-hidden');
        }
      });
    }
    if (state.settings.layoutHideShowMore && !state.settings.autoExpandPostText) {
      getLayoutScopeElements(root, 'article a[role="link"]').forEach((link) => {
        if (LAYOUT_SHOW_MORE_LABELS.has((link.textContent || '').trim())) link.classList.add('BetterX-layout-showmore-hidden');
      });
    }
  }

  function applyLayoutEnhancements() {
    if (!document.documentElement) return;
    const style = ensureLayoutStyle();
    if (!layoutEnhancementsActive()) {
      style.textContent = '';
      clearLayoutDomClasses();
      return;
    }

    const autoWidth = state.settings.layoutAutoWidth !== false;
    const timelineWidth = clampInt(state.settings.timelineWidth, 100, 3000, DEFAULT_SETTINGS.timelineWidth);
    const leftbarWidth = clampInt(state.settings.leftbarWidth, 50, 500, DEFAULT_SETTINGS.leftbarWidth);
    const fillCenter = !!state.settings.layoutFillCenter;
    const hideLeftbar = fillCenter || !!state.settings.layoutHideLeftbar;
    const hideSidebar = fillCenter || !!state.settings.layoutHideSidebar;
    const expandCenter = hideLeftbar || hideSidebar;
    const needsStructure = expandCenter || !autoWidth;
    let elements = getLayoutElements();
    // 从手动宽度切回纯自动模式时，先同步撤销旧结构规则，再读取真正的原生尺寸。
    if (autoWidth && !needsStructure && elements.primary && elements.primary.classList.contains('BetterX-layout-primary')) {
      style.textContent = '';
      clearLayoutStructureClasses();
      elements = getLayoutElements();
    }
    if (autoWidth) detectNativeLayoutWidths(elements);
    const effectiveLeftbarWidth = autoWidth
      ? clampInt(state.detectedLeftbarWidth, 120, 600, leftbarWidth)
      : leftbarWidth;
    bindLayoutStructureClasses(elements, needsStructure, expandCenter, !autoWidth);
    const css = buildLayoutCss({
      autoWidth, timelineWidth, leftbarWidth, effectiveLeftbarWidth,
      hideLeftbar, hideSidebar, expandCenter,
    });
    if (style.textContent !== css) style.textContent = css;
    applyLayoutDomCleanup();
  }

  // ── 内容净化：黄推 / 成人引流机器人 ─────────────────────────────────
  // 只处理已经渲染的 DOM，不改写 XHR / Fetch 返回值，也不自动拉黑或举报账号。
