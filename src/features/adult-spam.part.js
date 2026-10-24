  // 多义短词、数字和通用引流用语归入 WEAK_TERMS，只能辅助评分，不能充当成人内容依据。
  const ADULT_SPAM_STRONG_TERMS = [
    '抽插', '淫叫', '母狗', '肉便器', '母猪', '反差婊', '小穴', '穴穴', '性奴', '蜜穴',
    '爆菊', '性交', '爆操', '福利姬', '里番', '裸照', '裸体', '阴茎', '做愛','嫩穴',
    '做爱', '自慰', '精液', '打飞机', '果照', '约炮', '裸聊','美鲍',
    '援交', '包夜', '成人视频', '成人影片',
    '黄片', '黄网', '色情网站', '看片网站', 'porn', 'nudes', 'onlyfans leak','网黄',
    'sex video', 'sex videos', 'wataa', 'Wataa', '私处', '尤物', '人妻', '口交', '内射',
    '阴道', '淫趴', '屁眼', '迷奸', '小烧货', '骚货', 'sao货',
    '破处', '陪睡', '后入', '肛交', '催情','约啪','跳蛋','Chudai','chudai',
    '露B','潮喷','龟头','射精','肉棒','鸡巴','被操','榨精','撸管','深喉',
    '足交','乳交','烧姬','淫窝','车震',
    '约p','阴唇','秒射','飞机杯','屁穴','性爱','鸡鸡','磨豆腐','双头龙','没她骚','爱几把',
  ];
  const ADULT_SPAM_WEAK_TERMS = [
    'ts', 'TS', 'ntr', 'NTR', '91', '69', '3p', '4i', 'p眼', 'G点',
    '皮炎', '子宫', '手冲', '外围', '无套', '全套服务', '发情', '性欲', '晨勃',
    '糖心', '麻豆', '50度灰', '字母圈', '戴套', '偷拍', '艹', '幹',
    '同城可约', '附近可约', '私密视频', '大尺度视频', '成人直播', '上门约', '约爱',
    '福不黑', '我的福', '顶不住', '瓜', '线下', '同城',
    '妈妈', '儿子', '一夜', '进入身', 'sao', '全国牵', 't.cn', '👆', '👉',
    '联系', '主页', '快手', '抖音', '免费', '我好看', '寻',
  ];
  const ADULT_SPAM_SENSITIVE_TERMS = [
    '一发入魂', '调教', '高潮', '翘臀', '奶子', '反差', '巨乳', '嫩妹', '尿尿',
    '痴女', '黑丝', '白丝', '玉足', '喷了', '涩涩', '私房', '纯欲', '蜜桃臀',
    '可瑟瑟', '固炮', '炮友', '找主人', '大一学生', '白虎', '烧鸡', '好色',
    '色色', '熟女', '少妇', '嫩模', '学生妹', '商k', '白给', '处男', '野战',
    '射出来','魅魔','性瘾','打桩','喷出来','射出来','戴套','福照','无码','蛋蛋',
    '有码','情趣','丝袜','刺激','娇喘','罩杯','早泄','失禁','毛毛','绝顶',
    '肉欲','黑森林','制服','赤裸','粉嫩','水多','喷水','呻吟','吸吮','成人',
  ];
  const ADULT_SPAM_BOT_BAIT_TERMS = [
    '陪我聊聊天', '有没有单男', '有没有单女', '我是真人', '互关', '互粉', '互fo',
    '体制内老师', '体制内护士', '体制内医生', '在线等哥哥', '在线等弟弟',
  ];
  const ADULT_SPAM_SUGGESTIVE_TERMS = [
    '福利视频',
    '萝莉资源', '少女资源', '嫩模资源', '看片入口', '成人视频资源', '可瑟瑟', '推特第一骚',
  ];
  const ADULT_SPAM_MARKETING_TERMS = [
    '免费领取', '点击领取', '立即加入', '频道入口', '群组入口', '资源合集',
    '试看', '解锁', '置顶获取', '主页获取', '进群', '电报群',
  ];
  const ADULT_SPAM_CONTACT_TERMS = [
    '私信', '私聊', '联系我', '加我', '主页', '简介', '置顶', 'telegram',
    'whatsapp', '电报', '飞机群', 'tg群', '订阅'
  ];
  const ADULT_SPAM_CONTEXT_EXEMPTIONS = [
    '黄推机器人', '举报黄推', '屏蔽黄推', '黄推太多', '垃圾黄推', '清理黄推',
    '色情诈骗', '反诈', '曝光骗子',
  ];
  const ADULT_SPAM_NAME_RE = /(?:福利姬|约炮|裸聊|看片|成人视频|黄网|反差婊|巨乳|痴女|(?:^|[^a-z0-9])(?:porn|nudes|onlyfans|sex(?:y|cam)?|xxx)(?![a-z0-9]))/i;
  const ADULT_SPAM_EXACT_AMBIGUOUS_RE = /^(?:骚|逼|肏|doi|spa|全套|处女|chu男|cchu男|c男)$/i;
  const ADULT_SPAM_AMBIGUOUS_RES = [
    /(?<!离)骚(?!操作|扰|包|话|客|气)/,
    /(?<!牛|装|傻|苦|逗|懵|被)逼(?!迫|真|近|问|债|婚|供|退)/,
    /处女(?!作|航|座|秀)/,
  ];
  const ADULT_SPAM_BOT_HANDLE_RES = [
    /^[a-z]{4,10}\d{5,12}$/i,
    /^[a-z]+_[a-z]+\d{4,}$/i,
    /^[A-Z][a-z]+[A-Z][a-z]+\d{2,}$/,
    /^(?=[a-z]*[bcdfghjklmnpqrstvwxyz]{4})[a-z]+\d+$/i,
  ];
  const ADULT_SPAM_TEMPLATE_RES = [
    /快领我回家|扣1白给|推特第一骚|我约过她|姐姐在等你|视频要吗|满足我|可瑟瑟/,
    /懂[得的].{0,3}(?:来|私|入|dd|联系|撩|进|加)/i,
    /(?:找|来|想要).{0,5}(?:哥哥|主人).{0,5}(?:调教|私聊|联系|带走)/,
    /(?:在线等|蹲一个|急需一位).{0,6}(?:哥哥|弟弟|单男|主人)/,
    /(?:主页|简介).{0,5}(?:打飞|打飞机|打✈️?|有资源|有福利|可约)|(?:打飞|打飞机|打✈️?).{0,5}(?:主页|简介)/,
    /(?:刷了半天|就她|点开|快看).{0,5}(?:主页|简介)/,
    /(?:👉|⬆|↑|✈️?).{0,4}@[a-z0-9_]+|@[a-z0-9_]+.{0,4}(?:👉|⬆|↑|✈️?)/i,
    /(?:包夜|上门|外围|服务|按摩).{0,5}(?:全套|spa)|(?:全套|spa).{0,5}(?:包夜|上门|外围|服务)/i,
    /(?:酒店|约|想|一起).{0,5}doi|doi.{0,5}(?:酒店|约|一起)/i,
    /(?:c\s*\/?\s*chu男|chu男|c男)/i,
  ];
  const ADULT_SPAM_COMBO_RES = [
    /(?:同城|附近).{0,5}(?:可约|约炮|上门)/,
    /(?:私信|私聊|联系|加我).{0,8}(?:约炮|裸聊|看片|黄网|成人视频)/,
    /(?:约炮|裸聊|看片|黄网|成人视频).{0,8}(?:私信|私聊|联系|加我|主页|电报)/,
    /(?:萝莉|少女|嫩模|空姐|学生妹|少妇).{0,6}(?:资源|上门|可约|视频|福利)/,
    /(?:免费|最新|海量).{0,6}(?:成人视频|黄片|色情视频|看片资源)/,
    /(?:成人视频|黄片|色情视频).{0,5}(?:资源|入口|合集|频道|群)/,
  ];
  const ADULT_SPAM_REPOST_CONTEXT_RE = /(?:已转帖|已轉帖|转帖|轉帖|转发|轉發|reposted|retweeted|リポスト|재게시|리트윗)/i;

  function normalizeAdultSpamText(value) {
    let text = String(value || '').slice(0, 5000);
    try { text = text.normalize('NFKC'); } catch (err) {}
    return text.toLowerCase()
      .replace(/[\u200b-\u200f\u202a-\u202e\u2060\ufeff\ufe0e\ufe0f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compactAdultSpamText(value) {
    return normalizeAdultSpamText(value).replace(/[\s\p{P}\p{S}_]+/gu, '');
  }

  function compileAdultSpamTerms(terms, allowObfuscation = true) {
    const compiled = new Map();
    for (const raw of terms) {
      const normalized = normalizeAdultSpamText(raw);
      if (!normalized) continue;
      const compact = compactAdultSpamText(normalized);
      const key = compact || normalized;
      let patternSource = '';
      if (/^[\x00-\x7F]+$/.test(normalized) && /[a-z0-9]/.test(normalized)) {
        const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let literal = escape(normalized);
        if (allowObfuscation && compact.length >= 4 && /^[a-z0-9 ]+$/.test(normalized) && /[a-z]/.test(normalized)) {
          // 明确的较长英文词允许插入标点，但单词内部不跨空格拼接。
          literal = normalized.split(' ').map((word) => [...word].map(escape).join('[\\p{P}\\p{S}_]*'))
            .join('[\\s\\p{P}\\p{S}_]*');
        }
        patternSource = `(?:^|[^a-z0-9_])${literal}(?![a-z0-9_])`;
      }
      const variantKey = patternSource || compact || normalized;
      if (!compiled.has(key)) compiled.set(key, new Map());
      const variants = compiled.get(key);
      if (!variants.has(variantKey)) variants.set(variantKey, {
        normalized, compact, pattern: patternSource ? new RegExp(patternSource, 'u') : null,
      });
    }
    // 不同大小写、全角或插符形式归为一个词条，任一形式命中都只计一次。
    return [...compiled].map(([key, variants]) => ({ key, variants: [...variants.values()] }));
  }

  // 内置词表在启动时只标准化一次，避免每评分一条帖子就重复处理全部固定词。
  const ADULT_SPAM_WEAK_KEYS = new Set(ADULT_SPAM_WEAK_TERMS.map((term) => compactAdultSpamText(term) || normalizeAdultSpamText(term)));
  const withoutWeakTerms = (terms) => terms.filter((term) => !ADULT_SPAM_WEAK_KEYS.has(compactAdultSpamText(term)));
  const COMPILED_ADULT_SPAM_TERMS = (() => {
    const groups = {
      strong: compileAdultSpamTerms(withoutWeakTerms(ADULT_SPAM_STRONG_TERMS)),
      sensitive: compileAdultSpamTerms(withoutWeakTerms(ADULT_SPAM_SENSITIVE_TERMS)),
      botBait: compileAdultSpamTerms(ADULT_SPAM_BOT_BAIT_TERMS),
      suggestive: compileAdultSpamTerms(ADULT_SPAM_SUGGESTIVE_TERMS),
      marketing: compileAdultSpamTerms(ADULT_SPAM_MARKETING_TERMS),
      contact: compileAdultSpamTerms(ADULT_SPAM_CONTACT_TERMS),
      exemptions: compileAdultSpamTerms(ADULT_SPAM_CONTEXT_EXEMPTIONS),
      weak: compileAdultSpamTerms(ADULT_SPAM_WEAK_TERMS, false),
    };
    const claimed = new Map();
    const variantKey = (variant) => variant.pattern?.source || variant.compact || variant.normalized;
    for (const group of ['strong', 'suggestive', 'sensitive', 'botBait', 'marketing', 'contact', 'weak']) {
      groups[group] = groups[group].filter((term) => {
        const existing = claimed.get(term.key);
        if (existing) {
          const variants = new Set(existing.variants.map(variantKey));
          for (const variant of term.variants) {
            if (!variants.has(variantKey(variant))) {
              existing.variants.push(variant);
              variants.add(variantKey(variant));
            }
          }
          return false;
        }
        claimed.set(term.key, term);
        return true;
      });
    }
    return groups;
  })();
  let compiledAdultSpamCustomRulesVersion = -1;
  let compiledAdultSpamCustomRules = [];

  function getCompiledAdultSpamCustomRules() {
    if (compiledAdultSpamCustomRulesVersion === adultSpamRulesVersion) {
      return compiledAdultSpamCustomRules;
    }
    compiledAdultSpamCustomRules = (state.settings.adultSpamKeywords || []).map((raw) => ({
      raw,
      normalized: normalizeAdultSpamText(raw),
      compact: compactAdultSpamText(raw),
    }));
    compiledAdultSpamCustomRulesVersion = adultSpamRulesVersion;
    return compiledAdultSpamCustomRules;
  }

  function countCompiledTerms(normalized, compact, terms) {
    let count = 0;
    for (const term of terms) {
      if (term.variants.some((variant) => variant.pattern
        ? variant.pattern.test(normalized)
        : variant.compact ? compact.includes(variant.compact) : normalized.includes(variant.normalized))) count++;
    }
    return count;
  }

  function getAdultSpamInput(article) {
    const author = extractAuthor(article);
    // 合并原创正文与引用正文；只取第一个 tweetText 会漏掉引用卡片中的敏感内容。
    const fullText = (extractText(article) || '').trim();
    const text = fullText.slice(0, 2500);
    const socialContextEl = article.querySelector('[data-testid="socialContext"]');
    const repostContext = (socialContextEl?.innerText || '').trim().slice(0, 300);
    const isRepost = ADULT_SPAM_REPOST_CONTEXT_RE.test(repostContext);
    let reposterUsername = '';
    if (isRepost && socialContextEl) {
      // X 通常把 socialContext 的 span 放在转发者链接内部，链接不是它的子节点。
      const actorLinks = [socialContextEl.closest('a[href]'), ...socialContextEl.querySelectorAll('a[href]')].filter(Boolean);
      const actorLink = actorLinks.find((link) => {
        const href = link.getAttribute('href') || '';
        return /^\/[a-z0-9_]{1,15}(?:[/?#]|$)/i.test(href);
      });
      const actorMatch = (actorLink?.getAttribute('href') || '').match(/^\/([a-z0-9_]{1,15})(?:[/?#]|$)/i);
      const actorHandle = (actorMatch?.[1] || '').toLowerCase();
      if (actorHandle && !RESERVED_TOP_PATHS.has(actorHandle)) reposterUsername = actorHandle;
    }
    const rawUsername = String(author.username || '').replace(/^@/, '');
    const username = rawUsername.toLowerCase();
    const externalLinkCount = [...article.querySelectorAll('a[href]')].filter((link) => {
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('/') || /^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\//i.test(href)) return false;
      return /^(?:https?:\/\/|\/\/)/i.test(href);
    }).length;
    const mentionCount = (text.match(/@[a-z0-9_]{1,15}/gi) || []).length;
    const hasMedia = !!article.querySelector('video, [data-testid="tweetPhoto"], img[src*="pbs.twimg.com/media"]');
    const isFollowingTimeline = getCurrentSourceInfo().type === 'following';
    if (isFollowingTimeline) {
      if (isRepost && reposterUsername) rememberFollowingRelation(reposterUsername, true);
      else if (!isRepost && username) rememberFollowingRelation(username, true);
    }
    return {
      author, text, fullText, displayName: author.displayName || '', username, rawUsername,
      repostContext, isRepost, reposterUsername, externalLinkCount, mentionCount, hasMedia, isFollowingTimeline,
    };
  }

  function scoreAdultSpam(input) {
    const normalized = normalizeAdultSpamText(`${input.displayName}\n${input.repostContext || ''}\n${input.text}`);
    const compact = compactAdultSpamText(normalized);
    const usernameText = normalizeAdultSpamText(input.username);
    const customRulesEnabled = state.settings.adultSpamCustomRulesEnabled !== false;
    const whitelist = customRulesEnabled ? (state.settings.adultSpamWhitelist || []) : [];
    if (input.username && whitelist.includes(input.username)) {
      return { hidden: false, score: 0, reasons: ['账号白名单'] };
    }
    if (customRulesEnabled) {
      for (const customRule of getCompiledAdultSpamCustomRules()) {
        if ((customRule.normalized && normalized.includes(customRule.normalized))
          || (customRule.compact && compact.includes(customRule.compact))) {
          return { hidden: true, score: 99, reasons: [`自定义词：${customRule.raw}`] };
        }
      }
    }

    if (!state.settings.hideAdultSpam) return { hidden: false, score: 0, reasons: [] };

    const contentAuthorFollowed = !!(input.username && followedHandles.has(input.username));
    const reposterFollowed = !!(input.reposterUsername && followedHandles.has(input.reposterUsername));
    const originalPostInFollowingTimeline = input.isFollowingTimeline && !input.isRepost;
    const followedAccountRepost = input.isRepost
      && state.settings.adultSpamSkipFollowingReposts === true
      && (input.isFollowingTimeline || reposterFollowed);
    if (state.settings.adultSpamSkipFollowing !== false
      && (originalPostInFollowingTimeline || contentAuthorFollowed || followedAccountRepost)) {
      return {
        hidden: false,
        score: 0,
        reasons: [followedAccountRepost
          ? '已关注账号的转发内容'
          : (contentAuthorFollowed ? '正文原作者已关注' : '正在关注时间线的原创帖')],
      };
    }

    const reasons = [];
    let score = 0;
    const strongCount = countCompiledTerms(normalized, compact, COMPILED_ADULT_SPAM_TERMS.strong);
    const sensitiveCount = countCompiledTerms(normalized, compact, COMPILED_ADULT_SPAM_TERMS.sensitive);
    const botBaitCount = countCompiledTerms(normalized, compact, COMPILED_ADULT_SPAM_TERMS.botBait);
    const suggestiveCount = countCompiledTerms(normalized, compact, COMPILED_ADULT_SPAM_TERMS.suggestive);
    const marketingCount = countCompiledTerms(normalized, compact, COMPILED_ADULT_SPAM_TERMS.marketing);
    const contactCount = countCompiledTerms(normalized, compact, COMPILED_ADULT_SPAM_TERMS.contact);
    const weakCount = countCompiledTerms(normalized, compact, COMPILED_ADULT_SPAM_TERMS.weak);
    const comboCount = ADULT_SPAM_COMBO_RES.filter((re) => re.test(compact)).length;
    const templateCount = ADULT_SPAM_TEMPLATE_RES.filter((re) => re.test(normalized) || re.test(compact)).length;
    const exactAmbiguous = ADULT_SPAM_EXACT_AMBIGUOUS_RE.test(compactAdultSpamText(input.text));
    const ambiguousCount = ADULT_SPAM_AMBIGUOUS_RES.filter((re) => re.test(compact)).length;
    const riskyName = ADULT_SPAM_NAME_RE.test(input.displayName) || ADULT_SPAM_NAME_RE.test(usernameText);
    const syntheticHandle = ADULT_SPAM_BOT_HANDLE_RES.some((re) => re.test(input.rawUsername || input.username || ''));

    if (strongCount) { score += Math.min(14, strongCount * 10); reasons.push('强成人内容词'); }
    if (sensitiveCount) { score += Math.min(10, sensitiveCount * 4); reasons.push('敏感暗示词'); }
    if (botBaitCount) { score += Math.min(6, botBaitCount * 3); reasons.push('机器人诱导短句'); }
    if (suggestiveCount) { score += Math.min(6, suggestiveCount * 3); reasons.push('成人引流短语'); }
    if (comboCount) { score += Math.min(8, comboCount * 4); reasons.push('高风险组合话术'); }
    if (templateCount) { score += Math.min(10, templateCount * 8); reasons.push('黄推模板话术'); }
    if (exactAmbiguous) { score += 2; reasons.push('多义词（需语境）'); }
    if (ambiguousCount) { score += Math.min(6, ambiguousCount * 4); reasons.push('语境敏感词'); }
    if (weakCount) { score += Math.min(2, weakCount); reasons.push('多义词/引流辅助词'); }
    if (marketingCount) { score += Math.min(4, marketingCount * 2); reasons.push('营销引导'); }
    if (contactCount) { score += Math.min(4, contactCount * 2); reasons.push('站外联系引导'); }
    if (riskyName) {
      score += 3;
      reasons.push('账号名特征');
    }
    if (syntheticHandle) { score += 3; reasons.push('机器用户名结构'); }
    if (input.externalLinkCount > 0) { score += 2; reasons.push('外部链接'); }
    if ((input.mentionCount || 0) > 0 && (contactCount || templateCount)) {
      score += 3;
      reasons.push('@账号引流');
    }
    const riskEmojiCount = (normalized.match(/[✈️🔞💦🈲👅🍑👙🙇❣️❤️🍓🎀💋🥵]/gu) || []).length;
    if (riskEmojiCount >= 2 || normalized.includes('🔞')) { score += 3; reasons.push('高风险表情组合'); }
    const hasPromotionContext = contactCount || marketingCount || comboCount || templateCount;
    const hasAdultContext = strongCount > 0 || suggestiveCount > 0
      || ((sensitiveCount >= 2 || riskyName) && hasPromotionContext);
    if (input.hasMedia && hasAdultContext) { score += 2; reasons.push('敏感媒体组合'); }
    if (input.text && input.text.length <= 120 && hasAdultContext) score += 1;

    const exemptionCount = countCompiledTerms(normalized, compact, COMPILED_ADULT_SPAM_TERMS.exemptions);
    if (exemptionCount) { score = Math.max(0, score - 6); reasons.push('讨论/反诈语境降权'); }
    const threshold = state.settings.adultSpamLevel === 'balanced' ? 6 : 9;
    // 辅助词、普通导流模板、图片、链接或机器式用户名不能代替成人内容证据。
    return { hidden: !!hasAdultContext && score >= threshold, score, reasons };
  }

  function captureAdultSpamScrollAnchors(articles = document.querySelectorAll('article')) {
    const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    const candidates = [...articles]
      .map((article) => {
        const rect = article.getBoundingClientRect();
        return {
          article,
          statusId: extractStatusIdFromUrl(getStatusLink(article)) || '',
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
        };
      })
      .filter((item) => item.height > 0 && item.bottom > -viewportHeight && item.top < viewportHeight * 2)
      .sort((a, b) => {
        const score = (item) => item.bottom > 0 && item.top < viewportHeight
          ? Math.max(0, item.top)
          : viewportHeight + Math.min(Math.abs(item.top), Math.abs(item.bottom));
        return score(a) - score(b);
      });
    candidates.fallbackY = Math.max(0, window.scrollY || 0);
    return candidates;
  }

  function resolveAdultSpamScrollAnchor(candidate) {
    let article = candidate.article;
    if ((!article || !article.isConnected) && candidate.statusId) {
      article = [...document.querySelectorAll('article')].find((item) => (
        extractStatusIdFromUrl(getStatusLink(item)) === String(candidate.statusId)
      )) || null;
    }
    if (!article || !article.isConnected || article.classList.contains('BetterX-adult-spam-hidden')) return null;
    const rect = article.getBoundingClientRect();
    return rect.height > 0 ? { article, top: rect.top } : null;
  }

  function restoreAdultSpamScrollAnchor(candidates) {
    if (isPageScrollBusy()) return false;
    for (const candidate of candidates || []) {
      const current = resolveAdultSpamScrollAnchor(candidate);
      if (!current) continue;
      const delta = current.top - candidate.top;
      if (Math.abs(delta) > 1) window.scrollBy(0, delta);
      return true;
    }
    if (candidates && Number.isFinite(candidates.fallbackY)) {
      const delta = candidates.fallbackY - (window.scrollY || 0);
      if (Math.abs(delta) > 1) window.scrollTo(0, candidates.fallbackY);
    }
    return false;
  }

  function stabilizeAdultSpamScroll(candidates) {
    const token = ++adultSpamScrollToken;
    if (!candidates || !candidates.length || isPageScrollBusy()) return;
    if (typeof requestAnimationFrame !== 'function') return;
    requestAnimationFrame(() => {
      if (token !== adultSpamScrollToken || isPageScrollBusy()) return;
      restoreAdultSpamScrollAnchor(candidates);
    });
  }

  function setAdultSpamHidden(article, decision) {
    // 保留 X 虚拟列表管理的 cellInnerDiv 外壳，只隐藏帖子本身，避免列表节点被反复销毁和重建。
    const target = article;
    if (!target || !target.classList) return { hidden: false, changed: false };
    const wasHidden = target.classList.contains('BetterX-adult-spam-hidden');
    if (decision.hidden) {
      target.classList.add('BetterX-adult-spam-hidden');
      target.dataset.BetterXAdultSpamReason = `${decision.score} 分：${decision.reasons.join('、')}`;
      adultSpamHiddenArticles.add(target);
    } else {
      target.classList.remove('BetterX-adult-spam-hidden');
      delete target.dataset.BetterXAdultSpamReason;
      adultSpamHiddenArticles.delete(target);
    }
    return { hidden: !!decision.hidden, changed: wasHidden !== !!decision.hidden };
  }

  function evaluateAndApplyAdultSpam(article, outcome, deferLayoutWhileScrolling) {
    if (!adultSpamFilteringEnabled() || !article || !article.querySelector) return false;
    const input = getAdultSpamInput(article);
    const statusUrl = getStatusLink(article);
    const statusId = extractStatusIdFromUrl(statusUrl) || '';
    if (outcome && typeof outcome === 'object') Object.assign(outcome, { input, url: statusUrl, id: statusId });
    const fingerprint = `${statusId}\n${input.username}\n${input.rawUsername}\n${input.displayName}\n${input.repostContext}\n${input.isRepost}\n${input.reposterUsername}\n${input.text}\n${input.externalLinkCount}\n${input.mentionCount}\n${input.hasMedia}\n${input.isFollowingTimeline}`;
    const statsKey = statusId || fingerprint;
    adultSpamScannedIdsCapped = addBoundedSessionStat(
      adultSpamScannedIds, statsKey, adultSpamScannedIdsCapped
    );
    const cached = adultSpamCache.get(article);
    const decision = cached && cached.version === adultSpamRulesVersion && cached.fingerprint === fingerprint
      ? cached.decision
      : scoreAdultSpam(input);
    if (!cached || cached.version !== adultSpamRulesVersion || cached.fingerprint !== fingerprint) {
      adultSpamCache.set(article, { version: adultSpamRulesVersion, fingerprint, decision });
    }
    const currentlyHidden = article.classList.contains('BetterX-adult-spam-hidden');
    if (deferLayoutWhileScrolling && isPageScrollBusy() && currentlyHidden !== !!decision.hidden) {
      scheduleAdultSpamLayoutFlush(article);
      if (outcome && typeof outcome === 'object') {
        outcome.hidden = !!decision.hidden;
        outcome.changed = false;
        outcome.deferred = true;
      }
      return !!decision.hidden;
    }
    const applied = setAdultSpamHidden(article, decision);
    if (outcome && typeof outcome === 'object') {
      outcome.hidden = applied.hidden;
      outcome.changed = applied.changed;
    }
    if (applied.hidden) {
      adultSpamSessionHiddenIdsCapped = addBoundedSessionStat(
        adultSpamSessionHiddenIds, statsKey, adultSpamSessionHiddenIdsCapped
      );
    }
    if (applied.hidden && applied.changed) {
      debugLog('内容净化已隐藏帖子', statusId || '(无 ID)', decision.score, decision.reasons);
    }
    return applied.hidden;
  }

  function updateAdultSpamCount() {
    if (!state.adultSpamCountEl) return;
    for (const article of adultSpamHiddenArticles) {
      if (article.isConnected && article.classList.contains('BetterX-adult-spam-hidden')) continue;
      article.classList.remove('BetterX-adult-spam-hidden');
      delete article.dataset.BetterXAdultSpamReason;
      adultSpamHiddenArticles.delete(article);
    }
    const currentCount = adultSpamHiddenArticles.size;
    const hiddenCount = `${adultSpamSessionHiddenIds.size}${adultSpamSessionHiddenIdsCapped ? '+' : ''}`;
    const scannedCount = `${adultSpamScannedIds.size}${adultSpamScannedIdsCapped ? '+' : ''}`;
    state.adultSpamCountEl.textContent = uiText(`当前隐藏 ${currentCount} · 本次累计 ${hiddenCount} · 已扫描 ${scannedCount} · 已识别关注 ${followedHandles.size}`);
  }

  function unhideAdultSpam() {
    adultSpamHiddenArticles.forEach((el) => {
      el.classList.remove('BetterX-adult-spam-hidden');
      delete el.dataset.BetterXAdultSpamReason;
    });
    adultSpamHiddenArticles.clear();
    updateAdultSpamCount();
  }

  function sweepAdultSpam(articles = document.querySelectorAll('article')) {
    if (!adultSpamFilteringEnabled()) return;
    harvestFollowingControlsFromRoot(document);
    articles.forEach((article) => evaluateAndApplyAdultSpam(article));
    updateAdultSpamCount();
  }

  function applyAdultSpamFiltering() {
    const articles = document.querySelectorAll('article');
    if (isPageScrollBusy()) {
      articles.forEach(scheduleAdultSpamLayoutFlush);
      return;
    }
    const anchors = captureAdultSpamScrollAnchors(articles);
    if (adultSpamFilteringEnabled()) {
      // 直接按新判定更新差异，不再“全部显示 → 全部隐藏”，避免规则刷新时整页闪烁。
      sweepAdultSpam(articles);
    } else {
      unhideAdultSpam();
    }
    stabilizeAdultSpamScroll(anchors);
  }

  function adultSpamFilteringEnabled() {
    const hasCustomKeywords = state.settings.adultSpamCustomRulesEnabled !== false
      && (state.settings.adultSpamKeywords || []).length > 0;
    return !!(state.settings.hideAdultSpam || hasCustomKeywords);
  }

  function parseAdultSpamWhitelist(raw) {
    return uniqueStrings(parseKeywords(raw)
      .map((item) => item.replace(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\//i, ''))
      .map((item) => item.replace(/^@+/, '').replace(/\/$/, '').toLowerCase())
      .filter((item) => /^[a-z0-9_]{1,15}$/.test(item)));
  }

  // ── 抓取 / 扫描 / 闪现检测 ────────────────────────────────────────────
