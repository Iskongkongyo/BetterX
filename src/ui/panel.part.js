  function createUI() {
    const root = document.createElement('div');
    root.id = 'BetterX-root';

    const badge = document.createElement('button');
    badge.id = 'BetterX-badge';
    badge.type = 'button';
    badge.textContent = uiText('更好的 X（BetterX）');

    const panel = document.createElement('div');
    panel.id = 'BetterX-panel';
    panel.style.display = 'none';
    panel.innerHTML = uiHtml`
      <div class="BetterX-header">
        <div class="BetterX-title">
          <div class="BetterX-title-main">
            ${APP_ICON_URL ? `<img class="BetterX-title-icon" src="${escapeHtml(APP_ICON_URL)}" alt="" draggable="false" />` : ''}
            <span>更好的 X</span>
          </div>
          <div class="BetterX-title-sub">BetterX · Alt+X 开关</div>
        </div>
        <div class="BetterX-header-actions">
          <button class="BetterX-btn BetterX-vault-action" data-action="refresh" title="重新扫描当前页面">刷新</button>
          <button class="BetterX-btn BetterX-vault-action" data-action="mark-all-read" title="把当前列表全部标为已读">全部已读</button>
          <button class="BetterX-btn" data-action="switch-language" title="切换 BetterX 界面语言">切换语言</button>
          <div class="BetterX-menu-wrap">
            <button class="BetterX-btn BetterX-icon-btn" data-action="menu-toggle" aria-label="更多" title="更多">⋯</button>
            <div class="BetterX-menu" id="BetterX-menu" hidden>
              <button class="BetterX-menu-item" data-action="export">📤 导出筛选</button>
              <button class="BetterX-menu-item" data-action="backup">💾 备份全部</button>
              <button class="BetterX-menu-item" data-action="import">📥 导入</button>
              <button class="BetterX-menu-item danger" data-action="clear-non-fav">🗑️ 清空</button>
            </div>
          </div>
          <button class="BetterX-btn BetterX-icon-btn" data-action="close" aria-label="关闭" title="关闭">✕</button>
        </div>
      </div>

      <div class="BetterX-tabs" role="tablist" aria-label="BetterX 面板">
        <button class="BetterX-tab active" type="button" role="tab" aria-selected="true" data-action="set-panel-view" data-view="vault">帖子</button>
        <button class="BetterX-tab" type="button" role="tab" aria-selected="false" data-action="set-panel-view" data-view="notifications">通知</button>
        <button class="BetterX-tab" type="button" role="tab" aria-selected="false" data-action="set-panel-view" data-view="settings">设置</button>
      </div>

      <section class="BetterX-view BetterX-vault-view" data-view-panel="vault">
      <div class="BetterX-vault-toolbar">

      <div class="BetterX-tip">提示：列表仅记录你浏览时出现过的帖子。收藏/置顶的帖子不会被上限删除或自动清理。</div>

      <div class="BetterX-summary" id="BetterX-summary"></div>

      <details class="BetterX-advanced BetterX-vault-filter-card" id="BetterX-quick-filter">
        <summary><span class="BetterX-vault-filter-title">快速筛选</span><span class="BetterX-vault-filter-state" id="BetterX-quick-filter-state"></span></summary>
        <div class="BetterX-adv-body BetterX-vault-filter-body">
          <div class="BetterX-filter-bar" id="BetterX-filter-bar"></div>

          <div class="BetterX-search-tools">
            <input type="text" class="BetterX-input" id="BetterX-search" placeholder="搜索作者、正文或备注…" aria-label="搜索帖子" />
            <div class="BetterX-toolbar-row">
              <select class="BetterX-select" id="BetterX-source" aria-label="来源筛选"></select>
              <select class="BetterX-select" id="BetterX-media" aria-label="媒体筛选"></select>
              <select class="BetterX-select" id="BetterX-sort" aria-label="排序方式">
                <option value="smart">智能排序</option>
                <option value="recent_viewed">最近浏览</option>
                <option value="recent_captured">最近抓取</option>
                <option value="first_captured">首次抓取（新→旧）</option>
                <option value="time_asc">首次抓取（旧→新）</option>
                <option value="captures">出现次数</option>
                <option value="author">按作者</option>
                <option value="source">按来源</option>
              </select>
            </div>
            <div class="BetterX-sort-hint" id="BetterX-sort-hint" role="status"></div>
          </div>
        </div>
      </details>
      </div>
      <div class="BetterX-list" id="BetterX-list"></div>
      </section>

      <section class="BetterX-view BetterX-notifications-view" data-view-panel="notifications" hidden>
        <div class="BetterX-notification-toolbar">
          <div class="BetterX-settings-intro">
            <strong>帖子通知管理</strong>
            <span>读取 X 的铃铛订阅状态；开关操作会同步修改 X 账号设置。本页不会抓取或显示订阅账号的帖子。</span>
          </div>
          <div class="BetterX-row BetterX-notification-search-row">
            <input type="search" class="BetterX-input" id="BetterX-notification-search" placeholder="搜索用户名或 @用户名…" aria-label="搜索帖子通知用户" maxlength="120" />
            <button class="BetterX-btn" data-action="search-notification-users">搜索</button>
            <button class="BetterX-btn primary" data-action="sync-notification-users">同步订阅用户</button>
          </div>
          <br/>
          <div class="BetterX-content-status" id="BetterX-notification-status">尚未读取订阅用户</div>
        </div>
        <div class="BetterX-notification-list" id="BetterX-notification-list"></div>
      </section>

      <section class="BetterX-view BetterX-settings-view" data-view-panel="settings" hidden>
      <div class="BetterX-settings-scroll">
        <div class="BetterX-settings-intro">
          <strong>设置</strong>
          <span>大多数设置会立即生效；带“保存”或“应用”按钮的设置需要手动确认。</span>
        </div>
      <div class="BetterX-controls">
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>关键词与排除词</summary>
          <div class="BetterX-adv-body">
            <div class="BetterX-adv-label">只影响 BetterX 已记录的帖子：关键词用来高亮和筛选，排除词会隐藏匹配的帖子。</div>
            <div class="BetterX-adv-label">普通文字可直接输入；正则表达式请写成 <code>/表达式/</code>，例如 <code>/猫|狗/</code>。两种写法可以混用。</div>
            <div class="BetterX-tag-editor BetterX-keyword-section">
              <div class="BetterX-row BetterX-keyword-input-row">
                <input type="text" class="BetterX-input" id="BetterX-keywords" placeholder="输入关键词，支持正则，按回车添加" maxlength="500" />
                <select class="BetterX-select" id="BetterX-keyword-mode">
                  <option value="plain">任意匹配</option>
                  <option value="and">全部匹配</option>
                </select>
                <button class="BetterX-btn primary" data-action="save-keywords">保存</button>
              </div>
              <div class="BetterX-keyword-tags BetterX-main-keyword-tags" id="BetterX-keyword-tags"></div>
            </div>
            <div class="BetterX-tag-editor BetterX-keyword-section">
              <div class="BetterX-row BetterX-keyword-input-row">
                <input type="text" class="BetterX-input" id="BetterX-exclude" placeholder="输入排除词，支持正则，按回车添加" maxlength="500" />
                <button class="BetterX-btn primary" data-action="save-exclude">保存</button>
              </div>
              <div class="BetterX-keyword-tags BetterX-main-keyword-tags" id="BetterX-exclude-keyword-tags"></div>
            </div>
          </div>
        </details>
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>内容净化</summary>
          <div class="BetterX-adv-body">
            <div class="BetterX-row BetterX-adultspam-master-row">
              <label class="BetterX-field inline"><input type="checkbox" id="BetterX-hide-adult-spam" /> 隐藏黄推 / 成人引流机器人</label>
              <select class="BetterX-select" id="BetterX-adultspam-level" title="检测强度">
                <option value="balanced">均衡</option>
                <option value="conservative">保守</option>
              </select>
            </div>
            <div class="BetterX-dependent-options" id="BetterX-adultspam-auto-options">
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-adultspam-skip-following" /> 不审查已关注账号（转发内容除外）</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-adultspam-skip-following-reposts" /> 不审查已关注账号的转发内容</label>
            <div class="BetterX-adv-label">根据正文、账号名和引流特征综合判断，只在当前页面隐藏可疑帖子，不会拉黑账号。关闭后会恢复显示。</div>
            </div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-adultspam-custom-enabled" /> 启用自定义规则（屏蔽词与账号白名单）</label>
            <div class="BetterX-dependent-options" id="BetterX-adultspam-custom-options">
            <div class="BetterX-tag-editor">
              <div class="BetterX-row">
                <input type="text" class="BetterX-input" id="BetterX-adultspam-keywords" placeholder="输入自定义屏蔽词，按回车添加" maxlength="500" />
                <button class="BetterX-btn primary" data-action="save-adultspam-keywords">保存</button>
              </div>
              <div class="BetterX-keyword-tags" id="BetterX-adultspam-keyword-tags"></div>
            </div>
            <div class="BetterX-tag-editor">
              <div class="BetterX-row">
                <input type="text" class="BetterX-input" id="BetterX-adultspam-whitelist" placeholder="输入账号白名单（如 @example），按回车添加" maxlength="500" />
                <button class="BetterX-btn primary" data-action="save-adultspam-whitelist">保存</button>
              </div>
              <div class="BetterX-keyword-tags" id="BetterX-adultspam-whitelist-tags"></div>
            </div>
            </div>
            <div class="BetterX-content-status" id="BetterX-adultspam-count">当前隐藏 0 · 本次累计 0 · 已扫描 0 · 已识别关注 0</div>
          </div>
        </details>
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>界面简化与宽屏</summary>
          <div class="BetterX-adv-body">
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-enabled" /> 启用界面简化与宽屏</label>
            <div class="BetterX-dependent-options" id="BetterX-layout-options">
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-auto-width" /> 自动读取 X 当前的时间线与左侧栏宽度（默认开启）</label>
            <div class="BetterX-row BetterX-control-row">
              <label class="BetterX-field">时间线宽度(px)
                <input type="number" min="100" max="3000" class="BetterX-input small" id="BetterX-timeline-width" />
              </label>
              <label class="BetterX-field">左侧栏宽度(px)
                <input type="number" min="50" max="500" class="BetterX-input small" id="BetterX-leftbar-width" />
              </label>
              <button class="BetterX-btn primary" data-action="save-layout">应用宽度</button>
            </div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-hide-leftbar" /> 隐藏左侧栏</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-hide-sidebar" /> 隐藏右侧栏</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-fill-center" /> 中间栏填满（启用时同时隐藏左右栏）</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-clean-nav" /> 精简导航、Premium 推广与页脚</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-hide-message" /> 隐藏右下消息栏 / Grok</label>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-layout-hide-showmore" /> 隐藏帖子“显示更多”（可能影响长文展开，默认关闭）</label>
            <div class="BetterX-adv-label">在消息页和设置页不会调整布局；关闭此功能即可恢复 X 原来的界面。</div>
            </div>
          </div>
        </details>
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>下载功能</summary>
          <div class="BetterX-adv-body">
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-mediadl" /> 一键下载图片 / 视频 / GIF</label>
            <div class="BetterX-adv-label">开启后帖子操作栏会显示下载进度与取消按钮；桌面端会显示下载任务胶囊，移动端则会显示带任务数气泡的蓝色下载按钮。</div>
            <label class="BetterX-field inline BetterX-download-zip-option"><input type="checkbox" id="BetterX-dlzip" /> 下载多个媒体自动压缩 ZIP 包</label>
            <div class="BetterX-adv-label BetterX-download-zip-option">默认开启；ZIP 内的文件会使用下方“媒体文件名”模板。关闭后会同时下载多个媒体。</div>
            <label class="BetterX-field inline BetterX-download-history-option"><input type="checkbox" id="BetterX-track-downloaded-posts" /> 记录已经下载过的帖子</label>
            <div class="BetterX-adv-label BetterX-download-history-option">默认关闭；至少成功下载帖子内一个媒体后会记录并修改该帖子的下载图标。再次点击已记录帖子的下载按钮时，会先询问是否继续下载。</div>
            <label class="BetterX-field">媒体文件名（不含扩展名）<input class="BetterX-input" id="BetterX-download-file-name-template" maxlength="180" spellcheck="false" placeholder="{用户ID}_{帖子ID}" /></label>
            <label class="BetterX-field">ZIP 压缩包名（不含 .zip）<input class="BetterX-input" id="BetterX-download-zip-name-template" maxlength="180" spellcheck="false" placeholder="{用户ID}_{帖子ID}" /></label>
            <div class="BetterX-adv-label">点击变量会插入到当前正在编辑的模板中；同时下载一个帖子内多个媒体文件时若未使用 <code>{序号}</code>，会自动追加序号避免重名。</div>
            <div class="BetterX-chip-row BetterX-download-name-tokens">
              ${DOWNLOAD_NAME_TOKENS.map(({ token }) => `<button type="button" class="BetterX-chip" data-action="insert-download-name-token" data-token="${escapeHtml(token)}">${escapeHtml(token)}</button>`).join('')}
            </div>
            <label class="BetterX-field">正则替换（可选）<input class="BetterX-input" id="BetterX-download-name-regex" maxlength="180" spellcheck="false" placeholder="例如：[\\s_]+" /></label>
            <label class="BetterX-field">替换为<input class="BetterX-input" id="BetterX-download-name-replacement" maxlength="180" spellcheck="false" placeholder="例如：_；支持 $1" /></label>
            <div class="BetterX-adv-label">正则会在变量展开后，对两个名称进行全局替换；支持捕获组替换（如 <code>$1</code>）。无效或高风险的正则不会保存。</div>
            <div class="BetterX-adv-label BetterX-download-name-preview" id="BetterX-download-name-preview"></div>
            <div class="BetterX-row"><button class="BetterX-btn primary" data-action="save-download-naming">保存自定义命名设置</button></div>
          </div>
        </details>
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>常用功能</summary>
          <div class="BetterX-adv-body">
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-hideads" /> 关闭广告（含“订阅 Premium”）</label>
            <div class="BetterX-adv-label">隐藏时间线广告、广告卡片和“订阅 Premium”提示。广告帖子不会保存到 BetterX，关闭后会重新显示。</div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-restore-media-grid" /> 帖子内媒体改为网格视图</label>
            <div class="BetterX-adv-label">把帖子里的多张媒体改成网格：2 张并排，3 张左大右二，4 张按 2×2 排列。</div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-bypassage" /> 取消年龄限制（用原图 / 视频进行替换）</label>
            <div class="BetterX-adv-label">移除敏感内容遮罩并显示原图或视频；只影响当前页面，不会修改账号设置。若暂时没显示，请稍等或重新开关一次。</div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-auto-expand-post-text" /> 自动展开帖子里“显示更多”</label>
            <div class="BetterX-adv-label">自动点开帖子正文里的“显示更多 / Show more”；不会展开回复或侧栏内容。</div>
            <div class="BetterX-row BetterX-profile-default-view-row">
              <label class="BetterX-field inline"><input type="checkbox" id="BetterX-profile-default-view-enabled" /> 进入用户主页默认查看</label>
              <select class="BetterX-select" id="BetterX-profile-default-view" aria-label="进入用户主页默认查看">
                <option value="posts">帖子</option>
                <option value="all">全部</option>
                <option value="highlights">亮点</option>
                <option value="video">视频</option>
                <option value="photo">图片</option>
              </select>
            </div>
            <div class="BetterX-adv-label">进入用户主页时自动切换到所选页签；帖子详情、回复和关注者页面不受影响。</div>
            <div class="BetterX-row BetterX-profile-default-view-row">
              <label class="BetterX-field inline"><input type="checkbox" id="BetterX-profile-post-sort-enabled" /> 用户主页帖子排序方式</label>
              <select class="BetterX-select" id="BetterX-profile-post-sort" aria-label="用户主页帖子排序方式">
                <option value="recent">最近</option>
                <option value="popular">热门</option>
              </select>
            </div>
            <div class="BetterX-adv-label">选择“热门”时，会使用 X 的热门排序；视频和图片页不受影响。</div>
          </div>
        </details>
        <details class="BetterX-advanced BetterX-settings-card">
          <summary>其他功能</summary>
          <div class="BetterX-adv-body">
            <label class="BetterX-field inline BetterX-firefox-only-setting"><input type="checkbox" id="BetterX-firefox-compat" /> 兼容 Firefox（仅 Firefox）</label>
            <div class="BetterX-adv-label BetterX-firefox-only-setting">如果 X 一直停在启动图标，可尝试开启。开启后会停用部分网络数据读取；点击开关可先查看影响。</div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-post-limit-warning" /> 上限提示</label>
            <div class="BetterX-adv-label">帖子记录接近“最大条数”时提醒你。关闭提醒后，也可以随时在这里重新开启。</div>
            <label class="BetterX-field inline"><input type="checkbox" id="BetterX-hide-app-badge" /> 隐藏应用徽标</label>
            <div class="BetterX-adv-label">在电脑上会隐藏徽标；在手机上会收成屏幕右侧的蓝色小条。点击小条、从屏幕右边缘向内滑动，或使用油猴菜单都能恢复。</div>
            <label class="BetterX-field inline BetterX-desktop-only-setting"><input type="checkbox" id="BetterX-desktop-mobile-badge" /> 切换为移动端徽标（仅 PC）</label>
            <div class="BetterX-adv-label BetterX-desktop-only-setting">在电脑上使用圆形图标和未读角标，仍可拖动位置。</div>
            <label class="BetterX-field inline BetterX-mobile-only-setting"><input type="checkbox" id="BetterX-mobile-badge-handle" /> 切换为半透明蓝色条（仅移动端）</label>
            <div class="BetterX-adv-label BetterX-mobile-only-setting">把手机上的圆形徽标收成右侧蓝色小条；点击打开面板，长按后可上下移动。</div>
          </div>
        </details>
        <details class="BetterX-advanced BetterX-settings-card" id="BetterX-advanced-settings">
          <summary>高级设置</summary>
          <div class="BetterX-adv-body">
            <div class="BetterX-row">
              <label class="BetterX-field">自动清理(天)
                <input type="number" min="0" class="BetterX-input small" id="BetterX-autoclean" />
              </label>
              <label class="BetterX-field">最大条数
                <input type="number" min="50" class="BetterX-input small" id="BetterX-maxposts" />
              </label>
              <label class="BetterX-field">闪现阈值(秒)
                <input type="number" min="1" class="BetterX-input small" id="BetterX-flashms" />
              </label>
              <label class="BetterX-field">主题
                <select class="BetterX-select" id="BetterX-theme">
                  <option value="auto">跟随系统</option>
                  <option value="dark">深色</option>
                  <option value="light">浅色</option>
                </select>
              </label>
            </div>
            <div class="BetterX-row BetterX-control-row">
              <label class="BetterX-field">下载超时(秒)
                <input type="number" min="5" class="BetterX-input small" id="BetterX-dltimeout" />
              </label>
              <label class="BetterX-field">下载并发
                <input type="number" min="1" max="6" step="1" class="BetterX-input small" id="BetterX-dlconcurrency" />
              </label>
              <label class="BetterX-field inline"><input type="checkbox" id="BetterX-markread" /> 点帖子空白处算已读</label>
              <button class="BetterX-btn primary" data-action="save-advanced">应用</button>
            </div>
            <div class="BetterX-adv-label">下载并发可设为 1～6，默认 2；调高会加快多媒体任务，但也会增加带宽与内存占用。</div>
            <div class="BetterX-adv-label">以下页面中的帖子不会保存到 BetterX：</div>
            <div class="BetterX-chip-row" id="BetterX-skip-sources"></div>
          </div>
        </details>
      </div>
      </div>
      </section>
    `;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json,.json';
    fileInput.style.display = 'none';

    const downloadPill = document.createElement('button');
    downloadPill.id = 'BetterX-download-pill';
    downloadPill.type = 'button';
    downloadPill.hidden = true;
    downloadPill.setAttribute('aria-label', uiText('查看下载任务'));
    downloadPill.title = uiText('查看下载任务');
    downloadPill.innerHTML = `
      <span class="BetterX-download-pill-icon" aria-hidden="true">⬇</span>
      <span class="BetterX-download-pill-label"></span>
      <span class="BetterX-download-pill-count" hidden></span>
    `;

    const downloadPopover = document.createElement('div');
    downloadPopover.id = 'BetterX-download-popover';
    downloadPopover.hidden = true;
    downloadPopover.setAttribute('role', 'status');

    root.appendChild(panel);
    root.appendChild(badge);
    root.appendChild(downloadPill);
    root.appendChild(downloadPopover);
    root.appendChild(fileInput);
    document.body.appendChild(root);

    state.rootEl = root;
    state.badgeEl = badge;
    state.panelEl = panel;
    state.downloadPillEl = downloadPill;
    state.downloadPopoverEl = downloadPopover;
    state.importInputEl = fileInput;
    bindPanelElements(panel);
    state.dlTimeoutInputEl = panel.querySelector('#BetterX-dltimeout');
    state.dlConcurrencyInputEl = panel.querySelector('#BetterX-dlconcurrency');
    state.mediaDownloadEl = panel.querySelector('#BetterX-mediadl');
    state.downloadZipEl = panel.querySelector('#BetterX-dlzip');
    state.downloadFileNameTemplateEl = panel.querySelector('#BetterX-download-file-name-template');
    state.downloadZipNameTemplateEl = panel.querySelector('#BetterX-download-zip-name-template');
    state.downloadNameRegexEl = panel.querySelector('#BetterX-download-name-regex');
    state.downloadNameReplacementEl = panel.querySelector('#BetterX-download-name-replacement');
    state.downloadNamePreviewEl = panel.querySelector('#BetterX-download-name-preview');
    state.trackDownloadedPostsEl = panel.querySelector('#BetterX-track-downloaded-posts');

    bindSettingsControls(panel);
    installDownloadUiLocalizationFallback(root);
    state.mediaSelectEl.innerHTML = buildMediaOptionsHtml();
    installHorizontalFilterScroller(state.filterBarEl);
    if (state.quickFilterDetailsEl) {
      state.quickFilterDetailsEl.addEventListener('toggle', () => {
        if (!state.settingsLoaded) return;
        const nextOpen = !!state.quickFilterDetailsEl.open;
        if (nextOpen === !!state.settings.quickFilterOpen) return;
        setSettingsPartial({ quickFilterOpen: nextOpen });
      });
    }

    badge.addEventListener('click', () => {
      if (state.suppressNextBadgeClick) {
        state.suppressNextBadgeClick = false;
        return;
      }
      if (!revealMobileBadge()) togglePanel();
    });
    downloadPill.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleDownloadPopover();
    });
    // 长视频会高频刷新任务 DOM；PC 的 click 可能在按下与松开之间因按钮被替换而丢失。
    // pointerdown 立即执行鼠标/触摸操作，click 则保留给键盘辅助操作兜底。
    downloadPopover.addEventListener('pointerdown', (event) => handleDownloadPopoverAction(event, downloadPopover), true);
    downloadPopover.addEventListener('click', (event) => handleDownloadPopoverAction(event, downloadPopover), true);
    makeBadgeDraggable();
    installMobileBadgeRevealGesture();

    // 搜索
    state.searchEl.addEventListener('input', debounce((e) => {
      state.searchQuery = e.target.value || '';
      resetPaging();
      refreshUI({ keepScroll: false });
    }, 200));

    // 普通设置控件由 SETTINGS_SCHEMA 统一绑定。
    [
      [state.keywordInputEl, commitKeywordInput],
      [state.excludeInputEl, commitExcludeKeywordInput],
      [state.adultSpamKeywordsEl, commitAdultSpamKeywordInput],
      [state.adultSpamWhitelistEl, commitAdultSpamWhitelistInput],
    ].forEach(([input, commit]) => bindTagCommitInput(input, commit));
    if (state.notificationSearchEl) {
      state.notificationSearchEl.addEventListener('input', () => {
        state.notificationSearchQuery = safeString(state.notificationSearchEl.value, 120).trim();
        renderNotificationSubscriptions();
      });
      state.notificationSearchEl.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.isComposing) return;
        e.preventDefault();
        applyNotificationSearch();
      });
    }
    state.firefoxCompatibilityEl.addEventListener('click', (e) => {
      e.preventDefault();
      showFirefoxCompatibilityToggleDialog(!state.settings.firefoxCompatibility);
    });
    state.mediaDownloadEl.addEventListener('change', (e) => setSettingsPartial({ mediaDownload: !!e.target.checked }));
    state.downloadZipEl.addEventListener('change', (e) => setSettingsPartial({ downloadZip: !!e.target.checked }));
    state.trackDownloadedPostsEl.addEventListener('change', (e) => {
      setSettingsPartial({ trackDownloadedPosts: !!e.target.checked });
      scheduleDownloadUiRefresh();
    });
    [state.downloadFileNameTemplateEl, state.downloadZipNameTemplateEl, state.downloadNameRegexEl, state.downloadNameReplacementEl]
      .forEach((input) => input.addEventListener('input', updateDownloadNamingPreview));
    [state.downloadFileNameTemplateEl, state.downloadZipNameTemplateEl].forEach((input) => {
      input.addEventListener('focus', () => { state.downloadNameTemplateTargetEl = input; });
    });
    state.hideAppBadgeEl.addEventListener('change', (e) => {
      setSettingsPartial({
        hideAppBadge: !!e.target.checked,
        ...(e.target.checked ? { useMobileBadgeHandle: false } : {}),
      });
      if (e.target.checked) {
        showToast(isMobileBadgeViewport()
          ? '点击屏幕右侧小蓝条可显示徽标'
          : '应用徽标已隐藏 · Alt+X 或油猴菜单可恢复');
      }
    });
    state.postLimitWarningEl.addEventListener('change', (e) => {
      const enabled = !!e.target.checked;
      postLimitWarningShownForMax = 0;
      if (postLimitWarningTimer) {
        clearTimeout(postLimitWarningTimer);
        postLimitWarningTimer = null;
      }
      setSettingsPartial({ postLimitWarningDisabled: !enabled });
      showToast(enabled ? '已恢复上限提示' : '已关闭上限提示');
      if (enabled) setTimeout(() => maybeShowPostLimitWarning(), 120);
    });
    state.useMobileBadgeHandleEl.addEventListener('change', (e) => {
      setSettingsPartial({
        useMobileBadgeHandle: !!e.target.checked,
        ...(e.target.checked ? { hideAppBadge: false } : {}),
      });
      if (e.target.checked) showToast('已切换为屏幕右侧小蓝条');
    });
    state.importInputEl.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importPosts(file);
      e.target.value = '';
    });

    // 事件委派
    root.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      const clickedAction = actionEl ? actionEl.getAttribute('data-action') : null;
      if (state.menuEl && !state.menuEl.hidden && clickedAction !== 'menu-toggle') state.menuEl.hidden = true;
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-action');
      const id = actionEl.getAttribute('data-id');
      if (dispatchPanelAction(action, actionEl, id)) return;

      switch (action) {
        case 'download-cancel':
          cancelDownloadJob(actionEl.getAttribute('data-job-id'));
          break;
        case 'download-retry':
          retryDownloadJob(actionEl.getAttribute('data-job-id'));
          break;
        case 'insert-download-name-token':
          insertDownloadNameToken(actionEl.getAttribute('data-token') || '');
          break;
        case 'save-download-naming': {
          const fileNameTemplate = safeString(state.downloadFileNameTemplateEl.value, 180).trim() || DEFAULT_SETTINGS.downloadFileNameTemplate;
          const zipNameTemplate = safeString(state.downloadZipNameTemplateEl.value, 180).trim() || DEFAULT_SETTINGS.downloadZipNameTemplate;
          const regex = safeString(state.downloadNameRegexEl.value, MAX_REGEX_SOURCE_LENGTH).trim();
          if (regex && !isSafeRegexSource(regex)) {
            showToast('⚠️ 正则无效或风险过高，未保存');
            break;
          }
          setSettingsPartial({
            downloadFileNameTemplate: fileNameTemplate,
            downloadZipNameTemplate: zipNameTemplate,
            downloadNameRegex: regex,
            downloadNameReplacement: safeString(state.downloadNameReplacementEl.value, 180),
          });
          showToast('✅ 已保存下载命名');
          break;
        }
        case 'mark-all-read': {
          const unreadPosts = filterPosts(state.posts).filter((p) => !p.clicked);
          if (!unreadPosts.length) { uiAlert('当前列表没有未读的帖子喂～'); break; }
          if (uiConfirm('确定要把当前列表的 ' + unreadPosts.length + ' 条未读帖子全部标为已读吗？')) {
            markPostsRead(unreadPosts.map((p) => p.id));
            showToast('✅ 已将当前列表全部标为已读');
          }
          break;
        }
        case 'preview-image': {
          const rawUrl = actionEl.getAttribute('data-image-url') || '';
          const postId = actionEl.getAttribute('data-post-id') || '';
          const post = postId ? getPostById(postId) : null;
          const imageUrls = post
            ? uniqueStrings((post.mediaThumbs || []).map(safeImportedAssetUrl).filter(Boolean)).slice(0, 4)
            : [rawUrl];
          const imageIndex = parseInt(actionEl.getAttribute('data-image-index') || '0', 10);
          showImagePreview(rawUrl, imageUrls, imageIndex);
          break;
        }
        case 'save-layout': {
          const timelineWidth = readIntegerSetting(state.timelineWidthEl, 'timelineWidth');
          const leftbarWidth = readIntegerSetting(state.leftbarWidthEl, 'leftbarWidth');
          setSettingsPartial({ layoutAutoWidth: false, timelineWidth, leftbarWidth });
          showToast('✓ 已切换为手动宽度并应用');
          break;
        }
        case 'save-advanced': {
          const maxPosts = readIntegerSetting(state.maxPostsInputEl, 'maxPosts');
          const flashMs = readIntegerSetting(state.flashMsInputEl, 'flashMs', 1000);
          const autoCleanDays = readIntegerSetting(state.autoCleanInputEl, 'autoCleanDays');
          const downloadTimeout = readIntegerSetting(state.dlTimeoutInputEl, 'downloadTimeout', 1000);
          const downloadConcurrency = readIntegerSetting(
            state.dlConcurrencyInputEl, 'downloadConcurrency', 1, DEFAULT_SETTINGS.downloadConcurrency
          );
          setSettingsPartial({ maxPosts, flashMs, autoCleanDays, downloadTimeout, downloadConcurrency });
          pumpDownloadTransferQueue();
          queueDbWrite(async () => { await enforceMaxPosts(); });
          runAutoClean();
          showToast('✅ 已应用高级设置');
          break;
        }
        case 'edit-note':
          state.editingNoteId = id;
          refreshUI({ keepScroll: true });
          setTimeout(() => {
            const ta = state.listEl.querySelector(`.BetterX-note-input[data-id="${id}"]`);
            if (ta) { ta.focus(); ta.selectionStart = ta.value.length; }
          }, 20);
          break;
        case 'copy': {
          const post = getPostById(id);
          if (post && post.url) {
            try {
              (navigator.clipboard && navigator.clipboard.writeText)
                ? navigator.clipboard.writeText(post.url).then(() => { actionEl.textContent = uiText('已复制'); setTimeout(() => { actionEl.textContent = uiText('复制链接'); }, 1200); })
                : window.prompt(uiText('复制链接：'), post.url);
            } catch (err) { window.prompt(uiText('复制链接：'), post.url); }
          }
          break;
        }
        default: break;
      }
    });

    repositionBadge();
    setPanelView(state.panelView);
    refreshUI();
  }
  // ── 样式 ─────────────────────────────────────────────────────────
