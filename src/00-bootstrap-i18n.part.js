// ==UserScript==
// @name         更好的 X（BetterX）
// @name:zh-CN   更好的 X（BetterX）
// @name:zh-TW   更好的 X（BetterX）
// @name:ja      もっと便利な X（BetterX）
// @name:en      Better X (BetterX)
// @namespace    https://github.com/Iskongkongyo
// @version      3.4.0
// @description  管理 X 帖子通知订阅状态、自动隐藏黄推/引流机器人与广告、界面简化与宽屏、一键下载图片/视频/GIF(多媒体可自动压缩 ZIP)、取消年龄限制(自动去除敏感/成人内容遮罩)、用户主页默认页签、记录 X 时间线中出现过的帖子，支持搜索、排序、正文折叠、备注、置顶、收藏、闪现提醒、来源识别、关键词高亮(含 AND/正则/排除词)、媒体缩略图、导入导出备份、自动清理、可拖动徽标、明暗主题、快捷键(Alt+X)、IndexedDB 持久化
// @description:zh-CN 管理 X 帖子通知订阅状态、自动隐藏黄推/引流机器人与广告、界面简化与宽屏、一键下载图片/视频/GIF（多媒体可自动压缩 ZIP）、取消年龄限制、记录与管理浏览过的帖子，并支持搜索、排序、关键词、备份、主题与 IndexedDB 持久化。
// @description:zh-TW 管理 X 貼文通知訂閱狀態、自動隱藏成人引流帳號與廣告、簡化介面與寬螢幕、一鍵下載圖片/影片/GIF（多媒體可自動壓縮為 ZIP）、解除年齡限制、記錄與管理瀏覽過的貼文，並支援搜尋、排序、關鍵字、備份、主題與 IndexedDB 持久化。
// @description:ja X のポスト通知購読を管理し、成人スパムや広告を自動非表示にします。UI の簡素化・ワイド表示、画像・動画・GIF の一括ダウンロード（ZIP 対応）、年齢制限の解除、閲覧ポストの記録・検索・並べ替え・キーワード・バックアップ・テーマ・IndexedDB 永続化に対応します。
// @description:en Manage X post-notification subscriptions, hide adult spam and ads, simplify and widen the interface, download images/videos/GIFs with optional ZIP packaging, bypass age gates, and save browsed posts with search, sorting, keywords, backups, themes, and IndexedDB persistence.
// @author        流萤可爱捏
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_setValue
// @grant        unsafeWindow
// @connect      twimg.com
// @connect      video.twimg.com
// @connect      pbs.twimg.com
// @connect      x.com
// @run-at       document-start
// @icon      data:image/jpeg;base64,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
// @noframes
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/588748/%E6%9B%B4%E5%A5%BD%E7%9A%84%20X%EF%BC%88BetterX%EF%BC%89.user.js
// @updateURL https://update.greasyfork.org/scripts/588748/%E6%9B%B4%E5%A5%BD%E7%9A%84%20X%EF%BC%88BetterX%EF%BC%89.meta.js
// ==/UserScript==

(function () {
  'use strict';

  const APP_ICON_URL = (() => {
    try {
      const icon = typeof GM_info !== 'undefined' && GM_info.script
        ? (GM_info.script.icon64 || GM_info.script.icon || '')
        : '';
      return /^(?:data:image\/|https?:\/\/)/i.test(icon) ? icon : '';
    } catch (err) {
      return '';
    }
  })();

  // ── 界面国际化 ──────────────────────────────────────────────────────
  const UI_LANGUAGE_OVERRIDE_KEY = 'betterx_ui_language_v1';
  const SUPPORTED_UI_LANGUAGES = new Set(['zh-CN', 'zh-TW', 'ja', 'en']);
  // 源文案统一使用简体中文；数组依次为繁体中文、日文、英文。
  const UI_TEXT_ENTRIES = [
    ['更好的 X', '更好的 X', 'もっと便利な X', 'Better X'],
    ['Alt+X 开关', 'Alt+X 開關', 'Alt+X で開閉', 'Toggle with Alt+X'],
    ['刷新', '重新整理', '更新', 'Refresh'], ['全部已读', '全部已讀', 'すべて既読', 'Mark all read'],
    ['重新扫描当前页面', '重新掃描目前頁面', '現在のページを再スキャン', 'Rescan the current page'], ['把当前列表全部标为已读', '將目前列表全部標為已讀', '現在の一覧をすべて既読にする', 'Mark the current list as read'],
    ['切换语言', '切換語言', '言語を切替', 'Switch language'], ['切换 BetterX 界面语言', '切換 BetterX 介面語言', 'BetterX の表示言語を切り替える', 'Switch BetterX interface language'],
    ['选择界面语言', '選擇介面語言', '表示言語を選択', 'Choose interface language'],
    ['选择后页面会刷新，帖子与设置数据不会受到影响。', '選擇後頁面會重新整理，貼文與設定資料不受影響。', '選択後にページを更新します。ポストや設定データには影響しません。', 'The page will reload after selection. Your posts and settings will not be affected.'],
    ['正在切换语言并刷新…', '正在切換語言並重新整理…', '言語を切り替えて更新中…', 'Switching language and reloading…'],
    ['无法保存语言设置', '無法儲存語言設定', '言語設定を保存できませんでした', 'Could not save the language setting'],
    ['更多', '更多', 'その他', 'More'], ['关闭', '關閉', '閉じる', 'Close'],
    ['帖子', '貼文', 'ポスト', 'Posts'], ['通知', '通知', '通知', 'Notifications'], ['设置', '設定', '設定', 'Settings'],
    ['导出筛选', '匯出篩選結果', '絞り込み結果をエクスポート', 'Export filtered'],
    ['备份全部', '備份全部', 'すべてバックアップ', 'Back up all'], ['导出备份', '匯出備份', 'バックアップをエクスポート', 'Export backup'], ['导入', '匯入', 'インポート', 'Import'],
    ['清空', '清空', '消去', 'Clear'], ['快速筛选', '快速篩選', 'クイックフィルター', 'Quick filters'],
    ['搜索', '搜尋', '検索', 'Search'], ['搜索帖子', '搜尋貼文', 'ポストを検索', 'Search posts'],
    ['搜索作者、正文或备注…', '搜尋作者、內文或備註…', '投稿者・本文・メモを検索…', 'Search author, text, or notes…'],
    ['来源筛选', '來源篩選', 'ソースで絞り込む', 'Filter by source'], ['媒体筛选', '媒體篩選', 'メディアで絞り込む', 'Filter by media'],
    ['排序方式', '排序方式', '並べ替え', 'Sort order'], ['智能排序', '智慧排序', 'スマート順', 'Smart sort'],
    ['最近浏览', '最近瀏覽', '最近表示', 'Recently viewed'], ['最近抓取', '最近擷取', '最近取得', 'Recently captured'],
    ['首次抓取（新→旧）', '首次擷取（新→舊）', '初回取得（新→古）', 'First captured (new→old)'],
    ['首次抓取（旧→新）', '首次擷取（舊→新）', '初回取得（古→新）', 'First captured (old→new)'],
    ['出现次数', '出現次數', '表示回数', 'Appearances'], ['按作者', '依作者', '投稿者順', 'By author'], ['按来源', '依來源', 'ソース順', 'By source'],
    ['全部', '全部', 'すべて', 'All'], ['未打开', '未開啟', '未表示', 'Unopened'], ['已打开', '已開啟', '表示済み', 'Opened'],
    ['快速消失', '快速消失', 'すぐ消えた', 'Disappeared quickly'], ['已收藏', '已收藏', 'お気に入り済み', 'Favorited'],
    ['已置顶', '已置頂', '固定済み', 'Pinned'], ['命中关键词', '符合關鍵字', 'キーワード一致', 'Keyword matches'],
    ['全部媒体', '全部媒體', 'すべてのメディア', 'All media'], ['含图片', '含圖片', '画像あり', 'With images'],
    ['含视频', '含影片', '動画あり', 'With video'], ['纯文字', '純文字', 'テキストのみ', 'Text only'],
    ['全部来源', '全部來源', 'すべてのソース', 'All sources'], ['主页', '首頁', 'ホーム', 'Home'],
    ['正在关注', '正在關注', 'フォロー中', 'Following'], ['为你推荐', '為你推薦', 'おすすめ', 'For You'],
    ['列表', '列表', 'リスト', 'List'], ['书签', '書籤', 'ブックマーク', 'Bookmarks'], ['未知页面', '未知頁面', '不明なページ', 'Unknown page'],
    ['个人主页', '個人主頁', 'プロフィール', 'Profile'], ['帖子详情', '貼文詳情', 'ポスト詳細', 'Post details'],
    ['搜索页', '搜尋頁', '検索ページ', 'Search page'], ['书签页', '書籤頁', 'ブックマークページ', 'Bookmarks page'],
    ['通知页', '通知頁', '通知ページ', 'Notifications page'], ['列表页', '列表頁', 'リストページ', 'List page'],
    ['总数', '總數', '合計', 'Total'], ['未读', '未讀', '未読', 'Unread'], ['图片', '圖片', '画像', 'Image'], ['视频', '影片', '動画', 'Video'],
    ['来源:', '來源：', 'ソース：', 'Source:'], ['历史来源:', '歷史來源：', '過去のソース：', 'Source history:'],
    ['抓取:', '擷取：', '取得：', 'Captured:'], ['浏览:', '瀏覽：', '表示：', 'Viewed:'], ['出现:', '出現：', '表示：', 'Seen:'],
    ['当前来源:', '目前來源：', '現在のソース：', 'Current source:'], ['当前选择：', '目前選擇：', '現在の選択：', 'Current:'],
    ['打开', '開啟', '開く', 'Open'], ['复制链接', '複製連結', 'リンクをコピー', 'Copy link'],
    [' 的个人主页', ' 的個人主頁', ' のプロフィール', ' profile'], ['复制链接：', '複製連結：', 'リンクをコピー：', 'Copy link: '], ['已复制', '已複製', 'コピー済み', 'Copied'],
    ['取消置顶', '取消置頂', '固定解除', 'Unpin'], ['置顶', '置頂', '固定', 'Pin'],
    ['取消收藏', '取消收藏', 'お気に入り解除', 'Unfavorite'], ['收藏', '收藏', 'お気に入り', 'Favorite'], ['删', '刪除', '削除', 'Delete'],
    ['展开全文', '展開全文', '全文を表示', 'Show full text'], ['收起', '收合', '折りたたむ', 'Collapse'],
    ['备注', '備註', 'メモ', 'Note'], ['保存备注', '儲存備註', 'メモを保存', 'Save note'], ['取消', '取消', 'キャンセル', 'Cancel'],
    ['在这里写备注…', '在這裡寫備註…', 'ここにメモを入力…', 'Write a note here…'], ['无正文', '無內文', '本文なし', 'No text'],
    ['加载更多', '載入更多', 'さらに読み込む', 'Load more'],
    ['帖子通知管理', '貼文通知管理', 'ポスト通知の管理', 'Post notification management'],
    ['搜索用户名或 @用户名…', '搜尋使用者名稱或 @使用者名稱…', 'ユーザー名または @ユーザー名を検索…', 'Search name or @username…'],
    ['搜索帖子通知用户', '搜尋貼文通知使用者', '通知ユーザーを検索', 'Search notification users'],
    ['同步订阅用户', '同步訂閱使用者', '購読ユーザーを同期', 'Sync subscribed users'],
    ['正在同步…', '正在同步…', '同期中…', 'Syncing…'], ['尚未读取订阅用户', '尚未讀取訂閱使用者', '購読ユーザー未取得', 'Subscribed users not loaded'],
    ['正在读取关注列表…', '正在讀取關注列表…', 'フォロー一覧を取得中…', 'Reading following list…'],
    ['已订阅', '已訂閱', '購読中', 'Subscribed'], ['本地保留', '本機保留', 'ローカル保存', 'Stored locally'],
    ['筛选到', '篩選到', '絞り込み', 'Filtered'], ['上次同步：', '上次同步：', '最終同期：', 'Last sync: '],
    ['尚未完整同步', '尚未完整同步', '完全同期前', 'Not fully synced'], ['已同步', '已同步', '同期済み', 'Synced'],
    ['处理中…', '處理中…', '処理中…', 'Processing…'], ['关闭通知', '關閉通知', '通知をオフ', 'Disable notifications'],
    ['重新开启', '重新開啟', '再度オン', 'Re-enable'], ['移除记录', '移除記錄', '記録を削除', 'Remove record'],
    ['设置', '設定', '設定', 'Settings'], ['大多数设置会立即生效；带“保存”或“应用”按钮的设置需要手动确认。', '大多數設定會立即生效；帶「儲存」或「套用」按鈕的設定需要手動確認。', 'ほとんどの設定はすぐ反映されます。「保存」または「適用」ボタンがある設定は手動で確定してください。', 'Most settings apply immediately. Settings with a Save or Apply button require confirmation.'],
    ['关键词与排除词', '關鍵字與排除詞', 'キーワードと除外語', 'Keywords and exclusions'],
    ['任意匹配', '任意符合', 'いずれか一致', 'Match any'], ['全部匹配', '全部符合', 'すべて一致', 'Match all'], ['保存', '儲存', '保存', 'Save'],
    ['输入关键词，支持正则，按回车添加', '輸入關鍵字，支援正則，按 Enter 新增', 'キーワードを入力（正規表現対応）、Enter で追加', 'Enter keywords (regex supported), press Enter to add'],
    ['输入排除词，支持正则，按回车添加', '輸入排除詞，支援正則，按 Enter 新增', '除外語を入力（正規表現対応）、Enter で追加', 'Enter exclusions (regex supported), press Enter to add'],
    ['内容净化', '內容淨化', 'コンテンツフィルター', 'Content filtering'], ['隐藏黄推 / 成人引流机器人', '隱藏成人內容／引流機器人', '成人スパムを非表示', 'Hide adult spam accounts'],
    ['检测强度', '偵測強度', '検出強度', 'Detection strength'], ['均衡', '均衡', '標準', 'Balanced'], ['保守', '保守', '控えめ', 'Conservative'],
    ['不审查已关注账号（转发内容除外）', '不審查已關注帳號（轉發內容除外）', 'フォロー中のアカウントを除外（リポストは対象）', 'Skip followed accounts (except reposts)'],
    ['不审查已关注账号的转发内容', '不審查已關注帳號的轉發內容', 'フォロー中アカウントのリポストも除外', 'Also skip reposts by followed accounts'],
    ['启用自定义规则（屏蔽词与账号白名单）', '啟用自訂規則（封鎖詞與帳號白名單）', 'カスタムルールを有効化（ブロック語・許可リスト）', 'Enable custom rules (blocked words and allowlist)'],
    ['输入自定义屏蔽词，按回车添加', '輸入自訂封鎖詞，按 Enter 新增', 'ブロック語を入力し Enter で追加', 'Enter a blocked word and press Enter'],
    ['输入账号白名单（如 @example），按回车添加', '輸入帳號白名單（如 @example），按 Enter 新增', '許可するアカウント（例 @example）を入力し Enter', 'Enter an allowed account (e.g. @example) and press Enter'],
    ['当前隐藏', '目前隱藏', '現在非表示', 'Currently hidden'], ['本次累计', '本次累計', '今回の累計', 'This session'], ['已扫描', '已掃描', 'スキャン済み', 'Scanned'], ['已识别关注', '已識別關注', '認識済みフォロー', 'Known following'],
    ['界面简化与宽屏', '介面簡化與寬螢幕', 'UI 簡素化とワイド表示', 'Simplified and wide layout'], ['启用界面简化与宽屏', '啟用介面簡化與寬螢幕', 'UI 簡素化とワイド表示を有効化', 'Enable simplified and wide layout'],
    ['时间线宽度(px)', '時間軸寬度(px)', 'タイムライン幅 (px)', 'Timeline width (px)'], ['左侧栏宽度(px)', '左側欄寬度(px)', '左サイドバー幅 (px)', 'Left sidebar width (px)'],
    ['应用宽度', '套用寬度', '幅を適用', 'Apply widths'], ['隐藏左侧栏', '隱藏左側欄', '左サイドバーを非表示', 'Hide left sidebar'], ['隐藏右侧栏', '隱藏右側欄', '右サイドバーを非表示', 'Hide right sidebar'],
    ['中间栏填满（启用时同时隐藏左右栏）', '中間欄填滿（啟用時同時隱藏左右欄）', '中央列を全幅表示（左右列も非表示）', 'Fill center column (also hides sidebars)'],
    ['精简导航、Premium 推广与页脚', '精簡導覽、Premium 推廣與頁尾', 'ナビ・Premium 広告・フッターを簡素化', 'Clean navigation, Premium promos, and footer'],
    ['隐藏右下消息栏 / Grok', '隱藏右下訊息欄 / Grok', '右下のメッセージ欄 / Grok を非表示', 'Hide Messages bar / Grok'],
    ['下载功能', '下載功能', 'ダウンロード', 'Downloads'], ['一键下载图片 / 视频 / GIF', '一鍵下載圖片 / 影片 / GIF', '画像 / 動画 / GIF をワンクリック保存', 'One-click image / video / GIF downloads'],
    ['下载多个媒体自动压缩 ZIP 包', '下載多個媒體時自動壓縮 ZIP', '複数メディアを ZIP にまとめる', 'Package multiple media files as ZIP'],
    ['记录已经下载过的帖子', '記錄已下載過的貼文', 'ダウンロード済みポストを記録', 'Track downloaded posts'],
    ['媒体文件名（不含扩展名）', '媒體檔名（不含副檔名）', 'メディア名（拡張子なし）', 'Media filename (without extension)'],
    ['ZIP 压缩包名（不含 .zip）', 'ZIP 壓縮檔名（不含 .zip）', 'ZIP 名（.zip なし）', 'ZIP filename (without .zip)'],
    ['正则替换（可选）', '正則取代（選填）', '正規表現置換（任意）', 'Regex replacement (optional)'], ['替换为', '取代為', '置換後', 'Replace with'],
    ['保存自定义命名设置', '儲存自訂命名設定', '命名設定を保存', 'Save naming settings'],
    ['常用功能', '常用功能', '一般機能', 'Common features'], ['关闭广告（含“订阅 Premium”）', '關閉廣告（含「訂閱 Premium」）', '広告を非表示（Premium を含む）', 'Hide ads (including Subscribe to Premium)'],
    ['帖子内媒体改为网格视图', '貼文內媒體改為網格檢視', 'ポスト内メディアをグリッド表示', 'Show post media in a grid'],
    ['取消年龄限制（用原图 / 视频进行替换）', '解除年齡限制（以原圖 / 影片取代）', '年齢制限を解除（元画像 / 動画に置換）', 'Bypass age gate (replace with original media)'],
    ['自动展开帖子里“显示更多”', '自動展開貼文中的「顯示更多」', 'ポストの「さらに表示」を自動展開', 'Automatically expand “Show more” in posts'],
    ['进入用户主页默认查看', '進入使用者主頁時預設檢視', 'プロフィールの既定タブ', 'Default profile tab'], ['亮点', '亮點', 'ハイライト', 'Highlights'],
    ['用户主页帖子排序方式', '使用者主頁貼文排序方式', 'プロフィールのポスト並び順', 'Profile post sorting'],
    ['最近', '最近', '最新', 'Recent'], ['热门', '熱門', '人気', 'Popular'],
    ['选择“热门”时，会使用 X 的热门排序；视频和图片页不受影响。', '選擇「熱門」時，會使用 X 的熱門排序；影片和圖片頁不受影響。', '「人気」を選ぶと X の人気順を使います。動画・画像ページには影響しません。', 'Selecting Popular uses X’s popular sorting; video and photo pages are unaffected.'],
    ['其他功能', '其他功能', 'その他の機能', 'Other features'], ['兼容 Firefox（仅 Firefox）', '相容 Firefox（僅 Firefox）', 'Firefox 互換モード（Firefox のみ）', 'Firefox compatibility (Firefox only)'],
    ['上限提示', '上限提示', '上限通知', 'Limit warning'],
    ['帖子记录接近“最大条数”时提醒你。关闭提醒后，也可以随时在这里重新开启。', '貼文記錄接近「最大筆數」時提醒你。關閉提醒後，也可以隨時在這裡重新開啟。', 'ポスト記録が「最大件数」に近づくと通知します。通知を閉じても、ここからいつでも再開できます。', 'Warns you when saved posts approach the maximum. If dismissed, the warning can be re-enabled here anytime.'],
    ['已恢复上限提示', '已恢復上限提示', '上限通知を再開しました', 'Limit warning restored'], ['已关闭上限提示', '已關閉上限提示', '上限通知を無効にしました', 'Limit warning disabled'],
    ['隐藏应用徽标', '隱藏應用徽章', 'アプリバッジを非表示', 'Hide app badge'], ['切换为移动端徽标（仅 PC）', '切換為行動版徽章（僅 PC）', 'モバイル用バッジに切替（PC のみ）', 'Use mobile badge (PC only)'],
    ['切换为半透明蓝色条（仅移动端）', '切換為半透明藍色條（僅行動裝置）', '半透明の青いバーに切替（モバイルのみ）', 'Use translucent blue bar (mobile only)'],
    ['高级设置', '進階設定', '詳細設定', 'Advanced settings'], ['自动清理(天)', '自動清理（日）', '自動削除（日）', 'Auto-clean (days)'], ['最大条数', '最大筆數', '最大件数', 'Maximum posts'],
    ['闪现阈值(秒)', '閃現門檻（秒）', '消失判定（秒）', 'Disappear threshold (sec)'], ['主题', '主題', 'テーマ', 'Theme'],
    ['跟随系统', '跟隨系統', 'システムに合わせる', 'Follow system'], ['深色', '深色', 'ダーク', 'Dark'], ['浅色', '淺色', 'ライト', 'Light'],
    ['下载超时(秒)', '下載逾時（秒）', 'タイムアウト（秒）', 'Download timeout (sec)'], ['下载并发', '下載並行數', '同時ダウンロード数', 'Concurrent downloads'],
    ['点帖子空白处算已读', '點貼文空白處視為已讀', 'ポストの空白クリックで既読', 'Mark read when clicking post whitespace'], ['应用', '套用', '適用', 'Apply'],
    ['帖子记录即将达到上限', '貼文記錄即將達到上限', 'ポスト記録が上限に近づいています', 'Post history is nearing its limit'],
    ['达到上限后，新帖子仍会继续记录；最旧的未收藏、未置顶帖子会被删除。收藏和置顶帖子不会被上限删除，因此总数有时可能超过设置值。', '達到上限後仍會繼續記錄新貼文；最舊且未收藏、未置頂的貼文會被刪除。收藏與置頂貼文不受上限刪除，因此總數有時可能超過設定值。', '上限に達しても新しいポストは記録され、古い未お気に入り・未固定のポストから削除されます。お気に入りと固定済みポストは削除されないため、合計が設定値を超える場合があります。', 'New posts will still be recorded at the limit; the oldest unfavorited and unpinned posts are removed. Favorited and pinned posts are protected, so the total may sometimes exceed the configured value.'],
    ['你可以打开“高级设置”调大“最大条数”，或先导出备份。', '你可以開啟「進階設定」調高「最大筆數」，或先匯出備份。', '「詳細設定」で上限を増やすか、先にバックアップをエクスポートできます。', 'You can increase the maximum under Advanced settings or export a backup first.'],
    ['打开高级设置', '開啟進階設定', '詳細設定を開く', 'Open advanced settings'], ['不再提示', '不再提示', '今後表示しない', "Don't remind me again"],
    ['以下页面中的帖子不会保存到 BetterX：', '以下頁面中的貼文不會儲存到 BetterX：', '次のページにあるポストは BetterX に保存しません：', 'Posts from these pages are not saved to BetterX:'],
    ['下载任务', '下載工作', 'ダウンロードタスク', 'Download tasks'], ['暂无下载任务', '暫無下載工作', 'ダウンロードはありません', 'No download tasks'],
    ['下载', '下載', 'ダウンロード', 'Download'], ['下载中', '下載中', 'ダウンロード中', 'Downloading'],
    ['排队中', '排隊中', '待機中', 'Queued'], ['排队', '排隊', '待機', 'Queued'], ['正在打包', '正在打包', '圧縮中', 'Packing'], ['打包', '打包', '圧縮', 'Packing'],
    ['正在保存', '正在儲存', '保存中', 'Saving'], ['正在取消下载', '正在取消下載', 'キャンセル中', 'Cancelling download'], ['取消中', '取消中', 'キャンセル中', 'Cancelling'],
    ['下载完成', '下載完成', 'ダウンロード完了', 'Download complete'], ['已取消', '已取消', 'キャンセル済み', 'Cancelled'], ['失败：', '失敗：', '失敗：', 'Failed: '],
    ['重试', '重試', '再試行', 'Retry'], ['查看下载任务', '查看下載工作', 'ダウンロードを表示', 'View downloads'], ['取消下载', '取消下載', 'ダウンロードをキャンセル', 'Cancel download'],
    ['下载图片/视频/GIF', '下載圖片/影片/GIF', '画像/動画/GIFを保存', 'Download images/videos/GIFs'], ['正在获取视频地址…', '正在取得影片網址…', '動画 URL を取得中…', 'Getting video URL…'],
    ['已下载过媒体；点击可再次下载', '已下載過媒體；點擊可再次下載', 'ダウンロード済みです。クリックすると再保存できます', 'Downloaded before; click to download again'],
    ['个任务', '個工作', '件のタスク', ' tasks'], ['查看下载任务：', '查看下載工作：', 'ダウンロードを表示：', 'View downloads: '],
    ['命名效果预览：', '命名效果預覽：', 'ファイル名プレビュー：', 'Filename preview: '],
    ['示例用户', '範例使用者', 'サンプルユーザー', 'Sample user'],
    ['这是用于预览下载文件名的帖子正文', '這是用於預覽下載檔名的貼文內文', 'ダウンロード名を確認するためのサンプル本文', 'Sample post text for previewing download names'],
    ['下载超时', '下載逾時', 'ダウンロードがタイムアウトしました', 'Download timed out'], ['网络错误', '網路錯誤', 'ネットワークエラー', 'Network error'],
    ['下载失败', '下載失敗', 'ダウンロード失敗', 'Download failed'], ['读取失败', '讀取失敗', '読み込み失敗', 'Read failed'],
    ['媒体总量超出经典 ZIP 范围，请改为逐个下载', '媒體總量超出傳統 ZIP 範圍，請改為逐一下載', 'メディア総量が従来形式の ZIP 上限を超えました。個別に保存してください', 'Media exceeds classic ZIP limits; download files separately'],
    ['跨域下载失败：请使用支持 GM_xmlhttpRequest 的脚本管理器', '跨網域下載失敗：請使用支援 GM_xmlhttpRequest 的使用者腳本管理器', 'クロスオリジン保存に失敗しました。GM_xmlhttpRequest 対応のユーザースクリプト管理拡張を使用してください', 'Cross-origin download failed. Use a userscript manager that supports GM_xmlhttpRequest'],
    ['⚠️ 未能取得视频地址：检测到 Violentmonkey。安卓 Firefox 上可能无法正确携带 X 登录态，请改用 Tampermonkey 后重试', '⚠️ 無法取得影片網址：偵測到 Violentmonkey。Android Firefox 可能無法正確攜帶 X 登入狀態，請改用 Tampermonkey 後重試', '⚠️ 動画 URL を取得できませんでした。Violentmonkey を検出しました。Android Firefox では X のログイン状態が正しく送信されない場合があるため、Tampermonkey に変更して再試行してください', '⚠️ Could not get the video URL. Violentmonkey was detected; Android Firefox may not pass the X login session correctly. Switch to Tampermonkey and try again'],
    ['未能取得媒体地址，请确认已登录 X 后重试', '無法取得媒體網址，請確認已登入 X 後重試', 'メディア URL を取得できませんでした。X にログインして再試行してください', 'Could not get the media URL. Make sure you are signed in to X and try again'],
    ['未找到可下载的媒体，若为视频请先点开或播放一下再试', '找不到可下載的媒體；若為影片，請先開啟或播放後再試', '保存できるメディアが見つかりません。動画の場合は一度開くか再生してから再試行してください', 'No downloadable media was found. For video, open or play it once and try again'],
    ['图片预览', '圖片預覽', '画像プレビュー', 'Image preview'], ['关闭图片预览', '關閉圖片預覽', '画像プレビューを閉じる', 'Close image preview'], ['上一张图片', '上一張圖片', '前の画像', 'Previous image'], ['下一张图片', '下一張圖片', '次の画像', 'Next image'],
    ['提示：列表仅记录你浏览时出现过的帖子。收藏/置顶的帖子不会被上限删除或自动清理。', '提示：列表僅記錄你瀏覽時出現過的貼文。收藏／置頂貼文不會因數量上限或自動清理而刪除。', 'ヒント：閲覧中に表示されたポストだけを記録します。お気に入り／固定したポストは上限や自動削除の対象外です。', 'Tip: Only posts seen while browsing are saved. Favorited or pinned posts are never removed by limits or auto-cleaning.'],
    ['读取 X 的铃铛订阅状态；开关操作会同步修改 X 账号设置。本页不会抓取或显示订阅账号的帖子。', '讀取 X 的鈴鐺訂閱狀態；開關操作會同步修改 X 帳號設定。本頁不會擷取或顯示訂閱帳號的貼文。', 'X のベル購読状態を読み取り、切替は X アカウントにも反映されます。このページで購読アカウントのポストを取得・表示することはありません。', 'Reads X bell-subscription status; toggles also update your X account. This page does not fetch or display posts from subscribed accounts.'],
    ['只影响 BetterX 已记录的帖子：关键词用来高亮和筛选，排除词会隐藏匹配的帖子。', '只影響 BetterX 已記錄的貼文：關鍵字用來醒目提示和篩選，排除詞會隱藏符合的貼文。', 'BetterX に記録済みのポストだけが対象です。キーワードは強調と絞り込みに使い、除外語に一致したポストは非表示にします。', 'Only affects posts saved by BetterX: keywords highlight and filter, while exclusions hide matching posts.'],
    ['普通文字可直接输入；正则表达式请写成 <code>/表达式/</code>，例如 <code>/猫|狗/</code>。两种写法可以混用。', '一般文字可直接輸入；正則表達式請寫成 <code>/運算式/</code>，例如 <code>/貓|狗/</code>。兩種寫法可以混用。', '通常の文字はそのまま入力できます。正規表現は <code>/式/</code> の形で入力してください（例：<code>/猫|犬/</code>）。両方を組み合わせて使えます。', 'Enter plain text directly. Write regex as <code>/expression/</code>, for example <code>/cat|dog/</code>. Both forms can be mixed.'],
    ['根据正文、账号名和引流特征综合判断，只在当前页面隐藏可疑帖子，不会拉黑账号。关闭后会恢复显示。', '根據內文、帳號名稱和引流特徵綜合判斷，只在目前頁面隱藏可疑貼文，不會封鎖帳號。關閉後會恢復顯示。', '本文、アカウント名、誘導の特徴から総合的に判定し、現在のページで疑わしいポストだけを非表示にします。アカウントはブロックせず、オフにすると再表示します。', 'Checks post text, account names, and spam signals, then hides suspicious posts only on the current page. It never blocks accounts; turn it off to show them again.'],
    ['自动读取 X 当前的时间线与左侧栏宽度（默认开启）', '自動讀取 X 目前的時間軸與左側欄寬度（預設開啟）', 'X の現在のタイムライン幅と左サイドバー幅を自動取得（既定でオン）', 'Automatically detect X timeline and left-sidebar widths (enabled by default)'],
    ['在消息页和设置页不会调整布局；关闭此功能即可恢复 X 原来的界面。', '在訊息頁和設定頁不會調整版面；關閉此功能即可恢復 X 原來的介面。', 'メッセージと設定ページではレイアウトを変更しません。この機能をオフにすると X 本来の表示に戻ります。', 'The layout is not changed on Messages or Settings pages. Turn this feature off to restore X’s original layout.'],
    ['开启后帖子操作栏会显示下载进度与取消按钮；桌面端会显示下载任务胶囊，移动端则会显示带任务数气泡的蓝色下载按钮。', '開啟後貼文操作列會顯示下載進度與取消按鈕；桌面版顯示下載工作膠囊，行動版顯示帶工作數量的藍色下載按鈕。', '有効にするとポスト操作欄に進捗とキャンセルボタンを表示します。デスクトップではタスクピル、モバイルでは件数付きの青いボタンを表示します。', 'Shows download progress and cancel controls in post actions. Desktop gets a task pill; mobile gets a blue button with a task count.'],
    ['默认开启；ZIP 内的文件会使用下方“媒体文件名”模板。关闭后会同时下载多个媒体。', '預設開啟；ZIP 內檔案使用下方「媒體檔名」範本。關閉後會同時下載多個媒體。', '既定でオンです。ZIP 内のファイル名には下のメディア名テンプレートを使います。オフの場合は複数ファイルを個別保存します。', 'Enabled by default. Files inside ZIP use the media filename template below. When disabled, media files download separately.'],
    ['默认关闭；至少成功下载帖子内一个媒体后会记录并修改该帖子的下载图标。再次点击已记录帖子的下载按钮时，会先询问是否继续下载。', '預設關閉；成功下載貼文內至少一個媒體後會記錄並變更下載圖示。再次點擊已記錄貼文時會先詢問是否繼續。', '既定ではオフです。メディアを1件以上保存すると記録し、アイコンを変更します。再ダウンロード時は確認します。', 'Disabled by default. After at least one media file is saved, the post is recorded and its icon changes. Re-downloading asks for confirmation.'],
    ['点击变量会插入到当前正在编辑的模板中；同时下载一个帖子内多个媒体文件时若未使用 {序号}，会自动追加序号避免重名。', '點擊變數會插入目前編輯中的範本；同時下載貼文內多個媒體時，若未使用 {序號}，會自動附加序號以避免重名。', '変数をクリックすると編集中のテンプレートへ挿入します。複数メディアで {序号} がない場合は重複防止の番号を自動追加します。', 'Click a variable to insert it into the active template. If {序号} is omitted for multiple media files, a number is appended automatically.'],
    ['正则会在变量展开后，对两个名称进行全局替换；支持捕获组替换（如 $1）。无效或高风险的正则不会保存。', '正則會在變數展開後對兩個名稱進行全域取代；支援擷取群組（如 $1）。無效或高風險正則不會儲存。', '変数展開後に両方の名前へ一括置換します。キャプチャ置換（$1 など）に対応し、無効または危険な式は保存しません。', 'After variables expand, the regex replaces globally in both names. Capture replacements such as $1 are supported; invalid or risky regexes are not saved.'],
    ['隐藏时间线广告、广告卡片和“订阅 Premium”提示。广告帖子不会保存到 BetterX，关闭后会重新显示。', '隱藏時間軸廣告、廣告卡片和「訂閱 Premium」提示。廣告貼文不會儲存到 BetterX，關閉後會重新顯示。', 'タイムライン広告、広告カード、「Premium に登録」の案内を非表示にします。広告ポストは BetterX に保存されず、オフにすると再表示します。', 'Hides timeline ads, ad cards, and Subscribe to Premium prompts. Ad posts are not saved to BetterX and reappear when this is turned off.'],
    ['把帖子里的多张媒体改成网格：2 张并排，3 张左大右二，4 张按 2×2 排列。', '把貼文裡的多個媒體改成網格：2 個並排，3 個左大右二，4 個按 2×2 排列。', 'ポスト内の複数メディアをグリッド表示にします。2枚は横並び、3枚は左大＋右2枚、4枚は2×2です。', 'Shows multiple media items in a grid: two side by side, three with one large item on the left, and four in a 2×2 layout.'],
    ['移除敏感内容遮罩并显示原图或视频；只影响当前页面，不会修改账号设置。若暂时没显示，请稍等或重新开关一次。', '移除敏感內容遮罩並顯示原圖或影片；只影響目前頁面，不會修改帳號設定。若暫時沒顯示，請稍候或重新開關一次。', 'センシティブな内容の覆いを外し、元の画像や動画を表示します。現在のページだけに作用し、アカウント設定は変更しません。表示されない時は少し待つか、スイッチを入れ直してください。', 'Removes the sensitive-content cover and shows the original image or video. It only affects the current page and does not change account settings. If nothing appears, wait briefly or toggle it again.'],
    ['自动点开帖子正文里的“显示更多 / Show more”；不会展开回复或侧栏内容。', '自動點開貼文內文裡的「顯示更多 / Show more」；不會展開回覆或側欄內容。', 'ポスト本文の「さらに表示 / Show more」を自動で開きます。返信やサイドバーの内容は展開しません。', 'Automatically opens “Show more” in post text. Replies and sidebar content are not expanded.'],
    ['进入用户主页时自动切换到所选页签；帖子详情、回复和关注者页面不受影响。', '進入使用者主頁時自動切換到所選分頁；貼文詳情、回覆和追蹤者頁面不受影響。', 'プロフィールを開くと選んだタブへ自動で切り替えます。ポスト詳細、返信、フォロワーページには影響しません。', 'Automatically switches to the selected tab when you open a profile. Post details, replies, and follower pages are unaffected.'],
    ['如果 X 一直停在启动图标，可尝试开启。开启后会停用部分网络数据读取；点击开关可先查看影响。', '如果 X 一直停在啟動圖示，可嘗試開啟。開啟後會停用部分網路資料讀取；點擊開關可先查看影響。', 'X が起動ロゴのまま止まる場合にお試しください。有効にすると一部のネットワークデータ読み取りを停止します。切り替える前に影響を確認できます。', 'Try this if X remains stuck on its startup logo. It disables some network-data reading; click the switch to review the impact first.'],
    ['在电脑上会隐藏徽标；在手机上会收成屏幕右侧的蓝色小条。点击小条、从屏幕右边缘向内滑动，或使用油猴菜单都能恢复。', '在電腦上會隱藏徽章；在手機上會收成螢幕右側的藍色小條。點擊小條、從螢幕右邊緣向內滑動，或使用腳本管理器選單都能恢復。', 'パソコンではバッジを隠し、スマートフォンでは画面右側の青いバーに収納します。バーをタップする、右端から内側へスワイプする、またはユーザースクリプトメニューから復元できます。', 'Hides the badge on desktop and collapses it into a blue bar on mobile. Tap the bar, swipe inward from the right edge, or use the userscript menu to restore it.'],
    ['在电脑上使用圆形图标和未读角标，仍可拖动位置。', '在電腦上使用圓形圖示和未讀角標，仍可拖曳位置。', 'パソコンで丸いアイコンと未読バッジを使います。位置は引き続きドラッグできます。', 'Uses a circular icon and unread badge on desktop; you can still drag it to a new position.'],
    ['把手机上的圆形徽标收成右侧蓝色小条；点击打开面板，长按后可上下移动。', '把手機上的圓形徽章收成右側藍色小條；點擊開啟面板，長按後可上下移動。', 'スマートフォンの丸いバッジを右側の青いバーに収納します。タップでパネルを開き、長押し後に上下へ動かせます。', 'Collapses the circular mobile badge into a blue bar on the right. Tap to open the panel; long-press to move it up or down.'],
    ['下载并发可设为 1～6，默认 2；调高会加快多媒体任务，但也会增加带宽与内存占用。', '下載並行數可設為 1～6，預設 2；提高可加速多媒體工作，但也會增加頻寬與記憶體使用。', '同時数は1～6（既定2）。増やすと速くなりますが、帯域とメモリ使用量も増えます。', 'Concurrency can be 1–6 (default 2). Higher values speed up multi-media jobs but use more bandwidth and memory.'],
    ['当前筛选条件下没有帖子。可以刷新页面、切换 X 标签页，或把筛选改回“全部”。', '目前篩選條件下沒有貼文。可重新整理頁面、切換 X 分頁，或將篩選改回「全部」。', '現在の条件に一致するポストはありません。ページや X のタブを更新するか、フィルターを「すべて」に戻してください。', 'No posts match the current filters. Refresh the page, switch X tabs, or reset the filter to All.'],
    ['还没有读取到帖子通知订阅。点击“同步订阅用户”，或浏览已开启铃铛的用户主页后再查看。', '尚未讀取貼文通知訂閱。請點擊「同步訂閱使用者」，或瀏覽已開啟鈴鐺的使用者主頁後再查看。', 'ポスト通知の購読情報がありません。「購読ユーザーを同期」を押すか、ベルを有効にしたプロフィールを開いてください。', 'No post-notification subscriptions have been read. Click “Sync subscribed users” or visit a profile with its bell enabled.'],
    ['智能排序：置顶、收藏和快消失的帖子先显示，其他的按抓到的顺序排。', '智慧排序：置頂、收藏和快速消失的貼文優先，其餘依擷取順序排列。', 'スマート順：固定・お気に入り・すぐ消えたポストを優先し、残りは取得順に表示します。', 'Smart sort: pinned, favorited, and quickly disappeared posts first; others follow capture order.'],
    ['最近浏览：按你在屏幕上看到的帖子顺序排。适合用来找刚刷过的帖子。', '最近瀏覽：依螢幕上看到貼文的順序排列，適合尋找剛瀏覽過的貼文。', '最近表示：画面で見た順に並べ、直前に見たポストを探すのに便利です。', 'Recently viewed: orders posts by when they appeared on screen, useful for finding what you just saw.'],
    ['最近抓取：按脚本发现帖子的时间排。X 会提前加载，顺序不一定等于你看到的顺序。', '最近擷取：依腳本發現貼文的時間排列。X 會預先載入，因此不一定等於實際看到的順序。', '最近取得：スクリプトが見つけた時刻順です。X の先読みのため、実際に見た順とは限りません。', 'Recently captured: orders by discovery time. X preloads posts, so this may differ from viewing order.'],
    ['出现次数：反复刷到的帖子排在前面。', '出現次數：反覆看到的貼文排在前面。', '表示回数：繰り返し表示されたポストを先にします。', 'Appearances: repeatedly seen posts come first.'],
    ['按作者：把同一个作者的帖子排在一起。', '依作者：將同一作者的貼文排在一起。', '投稿者順：同じ投稿者のポストをまとめます。', 'By author: groups posts from the same author.'],
    ['按来源：按主页、为你推荐、搜索、书签等页面分类排。', '依來源：依首頁、為你推薦、搜尋、書籤等頁面分類。', 'ソース順：ホーム、おすすめ、検索、ブックマークなどで分類します。', 'By source: groups posts by Home, For You, Search, Bookmarks, and other pages.'],
    ['BetterX：显示 / 隐藏应用徽标', 'BetterX：顯示 / 隱藏應用徽章', 'BetterX：アプリバッジを表示 / 非表示', 'BetterX: Show / hide app badge'],
    ['BetterX：强制开启 Firefox 兼容模式并刷新', 'BetterX：強制開啟 Firefox 相容模式並重新整理', 'BetterX：Firefox 互換モードを強制して更新', 'BetterX: Force Firefox compatibility and reload'],
    ['BetterX：恢复 Firefox 完整模式并刷新', 'BetterX：恢復 Firefox 完整模式並重新整理', 'BetterX：Firefox フルモードに戻して更新', 'BetterX: Restore full Firefox mode and reload'],
    ['BetterX：导出 Firefox 兼容诊断', 'BetterX：匯出 Firefox 相容診斷', 'BetterX：Firefox 互換診断をエクスポート', 'BetterX: Export Firefox compatibility diagnostics'],
    ['无法读取当前 X 用户 ID，请确认已经登录', '無法讀取目前 X 使用者 ID，請確認已登入', '現在の X ユーザー ID を取得できません。ログインを確認してください', 'Could not read the current X user ID. Make sure you are signed in'],
    ['本次识别', '本次識別', '今回検出', 'Found this time'], ['个，当前保留', '個，目前保留', '件、現在保持', '; currently keeping'], ['个订阅', '個訂閱', '件の購読', ' subscriptions'],
    ['同步失败：', '同步失敗：', '同期失敗：', 'Sync failed: '], ['修改失败：', '修改失敗：', '変更失敗：', 'Update failed: '],
    ['已开启', '已開啟', '有効化しました', 'Enabled'], ['的帖子通知', '的貼文通知', 'のポスト通知', ' post notifications'], ['已关闭', '已關閉', '無効化しました', 'Disabled'],
    ['下载完成：已逐个保存', '下載完成：已逐一儲存', 'ダウンロード完了：個別に保存', 'Download complete: saved separately'], ['个文件', '個檔案', 'ファイル', ' files'],
    ['，跳过', '，略過', '、スキップ', '; skipped'], ['个失败项', '個失敗項目', '件の失敗', ' failed items'],
    ['正在开启 Firefox 兼容模式并刷新…', '正在開啟 Firefox 相容模式並重新整理…', 'Firefox 互換モードを有効にして更新中…', 'Enabling Firefox compatibility and reloading…'],
    ['正在关闭 Firefox 兼容模式并刷新…', '正在關閉 Firefox 相容模式並重新整理…', 'Firefox 互換モードを無効にして更新中…', 'Disabling Firefox compatibility and reloading…'],
    ['此选项仅用于 Firefox', '此選項僅適用於 Firefox', 'この設定は Firefox 専用です', 'This option is only for Firefox'],
    ['已开启 Firefox 兼容模式', '已開啟 Firefox 相容模式', 'Firefox 互換モードを有効にしました', 'Firefox compatibility enabled'],
    ['已使用 Firefox 完整功能模式', '已使用 Firefox 完整功能模式', 'Firefox フル機能モードを使用します', 'Using full Firefox mode'],
    ['已导出 Firefox 兼容诊断', '已匯出 Firefox 相容診斷', 'Firefox 互換診断をエクスポートしました', 'Firefox compatibility diagnostics exported'],
    ['已恢复应用徽标', '已恢復應用徽章', 'アプリバッジを復元しました', 'App badge restored'], ['已显示应用徽标', '已顯示應用徽章', 'アプリバッジを表示しました', 'App badge shown'],
    ['已隐藏应用徽标 · Alt+X 可打开面板', '已隱藏應用徽章 · Alt+X 可開啟面板', 'アプリバッジを非表示にしました · Alt+X でパネルを開けます', 'App badge hidden · Press Alt+X to open the panel'],
    ['点击屏幕右侧小蓝条可显示徽标', '點擊螢幕右側小藍條可顯示徽章', '画面右の青いバーをタップしてバッジを表示', 'Tap the blue bar on the right to show the badge'],
    ['已切换为屏幕右侧小蓝条', '已切換為螢幕右側小藍條', '画面右の青いバーに切り替えました', 'Switched to the blue right-edge bar'],
    ['显示 BetterX 应用徽标', '顯示 BetterX 應用徽章', 'BetterX アプリバッジを表示', 'Show BetterX app badge'], ['打开 BetterX 面板', '開啟 BetterX 面板', 'BetterX パネルを開く', 'Open BetterX panel'],
    ['点按显示 BetterX 徽标', '點按以顯示 BetterX 徽章', 'タップして BetterX バッジを表示', 'Tap to show the BetterX badge'],
    ['正则无效或风险过高，未保存', '正則無效或風險過高，未儲存', '正規表現が無効または危険なため保存しませんでした', 'Regex was invalid or too risky and was not saved'],
    ['已保存下载命名', '已儲存下載命名', 'ダウンロード命名設定を保存しました', 'Download naming saved'], ['已将当前列表全部标为已读', '已將目前列表全部標為已讀', '現在の一覧をすべて既読にしました', 'Marked the current list as read'],
    ['已保存关键词', '已儲存關鍵字', 'キーワードを保存しました', 'Keywords saved'], ['已保存排除词', '已儲存排除詞', '除外語を保存しました', 'Exclusions saved'],
    ['已保存自定义屏蔽词', '已儲存自訂封鎖詞', 'カスタムブロック語を保存しました', 'Custom blocked words saved'], ['已保存账号白名单', '已儲存帳號白名單', 'アカウント許可リストを保存しました', 'Account allowlist saved'],
    ['已切换为手动宽度并应用', '已切換為手動寬度並套用', '手動幅へ切り替えて適用しました', 'Switched to manual widths and applied'], ['已应用高级设置', '已套用進階設定', '詳細設定を適用しました', 'Advanced settings applied'],
    ['确定要清空', '確定要清空', '消去しますか：', 'Clear'], ['条未收藏/未置顶的帖子吗？此操作不可撤销。', '筆未收藏／未置頂的貼文嗎？此操作無法復原。', '件のお気に入り／固定されていないポスト。この操作は取り消せません。', ' unfavorited/unpinned posts? This cannot be undone.'],
    ['导入失败：单次最多允许', '匯入失敗：單次最多允許', 'インポート失敗：一度に許可される上限は', 'Import failed: at most'], ['条帖子。', '筆貼文。', '件です。', ' posts are allowed.'],
    ['导入完成：新增', '匯入完成：新增', 'インポート完了：追加', 'Import complete: added'], ['条，合并', '筆，合併', '件、統合', ', merged'], ['条，跳过', '筆，略過', '件、スキップ', ', skipped'], ['条无效记录', '筆無效記錄', '件の無効な記録', ' invalid records'],
    ['该帖子内媒体文件曾下载过，是否继续下载？', '此貼文的媒體曾下載過，是否繼續？', 'このポストのメディアはダウンロード済みです。続行しますか？', 'Media from this post was downloaded before. Continue?'],
    ['是否同时恢复备份中的设置？', '是否同時還原備份中的設定？', 'バックアップ内の設定も復元しますか？', 'Restore settings from the backup too?'],
    ['页面尚未就绪，诊断信息已输出到控制台。', '頁面尚未就緒，診斷資訊已輸出至主控台。', 'ページの準備ができていません。診断情報をコンソールへ出力しました。', 'The page is not ready; diagnostics were written to the console.'],
    ['当前筛选结果为空，没有可导出的内容。', '目前篩選結果為空，沒有可匯出的內容。', '現在の絞り込み結果は空です。エクスポートする内容がありません。', 'The current filtered result is empty; there is nothing to export.'],
    ['导入失败：备份文件不能超过 25 MB。', '匯入失敗：備份檔不得超過 25 MB。', 'インポート失敗：バックアップは 25 MB 以下にしてください。', 'Import failed: backup files cannot exceed 25 MB.'],
    ['无法识别的备份文件格式。', '無法識別的備份檔格式。', '認識できないバックアップ形式です。', 'Unrecognized backup format.'],
    ['导入失败：文件解析出错。', '匯入失敗：檔案解析錯誤。', 'インポート失敗：ファイルを解析できませんでした。', 'Import failed: file parsing error.'],
    ['当前列表没有未读的帖子喂～', '目前列表沒有未讀貼文喔～', '現在の一覧に未読ポストはありません。', 'There are no unread posts in the current list.'],
    ['确定要把当前列表的 ', '確定要將目前列表中的 ', '現在の一覧にある', 'Mark all '], [' 条未读帖子全部标为已读吗？', ' 筆未讀貼文全部標為已讀嗎？', '件の未読ポストをすべて既読にしますか？', ' unread posts in the current list as read?'],
    ['⚠️ 已忽略', '⚠️ 已忽略', '⚠️ 無視しました：', '⚠️ Ignored'], ['条高风险或无效正则', '筆高風險或無效正則', '件の危険または無効な正規表現', ' risky or invalid regex rules'],
    ['最多保存 50 个', '最多儲存 50 個', '保存できる上限は50件です：', 'At most 50 can be saved: '],
    ['自定义屏蔽词', '自訂封鎖詞', 'カスタムブロック語', 'custom blocked words'], ['关键词', '關鍵字', 'キーワード', 'keywords'], ['排除词', '排除詞', '除外語', 'exclusions'],
    ['没有找到与“', '找不到與「', '「', 'No username or @username matched “'], ['”匹配的用户名或 @用户名。', '」相符的使用者名稱或 @使用者名稱。', '」に一致するユーザー名または @ユーザー名はありません。', '”.'],
    ['开启“兼容 Firefox”？', '開啟「Firefox 相容模式」？', 'Firefox 互換モードを有効にしますか？', 'Enable Firefox compatibility?'],
    ['开启后 BetterX 不再改写页面的', '開啟後 BetterX 將不再改寫頁面的', '有効にすると BetterX はページの', 'When enabled, BetterX will stop wrapping the page’s'],
    ['可避免部分 Firefox 环境或多个 X 脚本冲突时一直卡在 X 图标。', '可避免部分 Firefox 環境或多個 X 腳本衝突時一直卡在 X 圖示。', 'を変更しなくなり、一部の Firefox 環境や複数の X スクリプトが競合した際に X ロゴで停止する問題を避けられます。', ', which can prevent X from getting stuck on its logo in some Firefox setups or when multiple X scripts conflict.'],
    ['以下能力可能降级：', '以下功能可能受限：', '次の機能が制限される場合があります：', 'The following features may be limited:'],
    ['部分视频 / GIF 无法取得真实下载地址；', '部分影片 / GIF 可能無法取得實際下載網址；', '一部の動画 / GIF の実際のダウンロード URL を取得できない場合があります。', 'Some videos / GIFs may not expose a direct download URL;'],
    ['部分年龄限制视频无法内联显示；', '部分年齡限制影片可能無法直接顯示；', '一部の年齢制限動画をページ内表示できない場合があります。', 'Some age-restricted videos may not display inline;'],
    ['无法从接口响应学习关注关系，主要依靠主页按钮和“正在关注”时间线。', '無法從介面回應學習關注關係，主要依靠個人主頁按鈕與「正在關注」時間軸。', 'API 応答からフォロー関係を学習できず、プロフィールのボタンと「フォロー中」タイムラインが主な情報源になります。', 'Following relationships cannot be learned from API responses and instead rely mainly on profile buttons and the Following timeline.'],
    ['帖子记录、搜索、面板、内容净化、广告过滤、布局和图片 DOM 兜底不受影响。确认后页面会刷新。', '貼文記錄、搜尋、面板、內容淨化、廣告過濾、版面配置與圖片 DOM 備援不受影響。確認後頁面會重新整理。', 'ポスト記録、検索、パネル、コンテンツフィルター、広告非表示、レイアウト、画像の DOM フォールバックには影響しません。確認後にページを更新します。', 'Post history, search, the panel, content filtering, ad hiding, layout, and the image DOM fallback are unaffected. The page will reload after confirmation.'],
    ['开启并刷新', '開啟並重新整理', '有効にして更新', 'Enable and reload'],
    ['关闭“兼容 Firefox”？', '關閉「Firefox 相容模式」？', 'Firefox 互換モードを無効にしますか？', 'Disable Firefox compatibility?'],
    ['关闭后将恢复 v1.7 的网络媒体与关注关系采集。如果当前环境曾卡在只显示 X 图标的页面，建议继续保持开启。确认后页面会刷新。', '關閉後將恢復 v1.7 的網路媒體與關注關係擷取。如果目前環境曾卡在只顯示 X 圖示的頁面，建議繼續保持開啟。確認後頁面會重新整理。', '無効にすると v1.7 のネットワークメディア・フォロー関係の取得を再開します。X ロゴだけの画面で停止したことがある環境では、有効のままにすることをおすすめします。確認後にページを更新します。', 'Disabling restores v1.7 network media and following-relationship capture. If this setup has ever stalled on the X logo, keeping compatibility enabled is recommended. The page will reload after confirmation.'],
    ['关闭并刷新', '關閉並重新整理', '無効にして更新', 'Disable and reload'],
    ['检测到 Firefox', '偵測到 Firefox', 'Firefox を検出しました', 'Firefox detected'],
    ['请问你在使用 BetterX 时，能否正常进入 X？', '使用 BetterX 時，是否能正常進入 X？', 'BetterX の使用中、X を正常に開けていますか？', 'Can you open X normally while using BetterX?'],
    ['目前已知部分 Firefox 用户会一直卡在', '目前已知部分 Firefox 使用者會一直卡在', '一部の Firefox ユーザーでは', 'Some Firefox users may remain stuck on the'],
    ['只显示 X 图标', '只顯示 X 圖示', 'X ロゴだけが表示される', 'X-logo-only'],
    ['的启动页面，常见于广告过滤、媒体下载等多个 X 脚本同时运行的环境。', '的啟動畫面，常見於廣告過濾、媒體下載等多個 X 腳本同時執行的環境。', '起動画面で停止することがあります。広告フィルターやメディア保存など、複数の X スクリプトを同時に使う環境で起きやすい問題です。', ' startup screen, especially when multiple X scripts such as ad filters and media downloaders run together.'],
    ['如果遇到异常，请点击', '如果遇到異常，請點擊', '問題がある場合は', 'If you encounter this issue, click'],
    ['有异常', '有異常', '問題あり', 'Having problems'],
    ['，BetterX 会开启', '，BetterX 會開啟', 'を選ぶと、BetterX は', '; BetterX will enable'],
    ['“设置 → 其他功能 → 兼容 Firefox”', '「設定 → 其他功能 → Firefox 相容模式」', '「設定 → その他の機能 → Firefox 互換モード」', '“Settings → Other features → Firefox compatibility”'],
    ['。该模式会停用页面网络 Hook；部分视频 / GIF 下载、年龄限制视频和接口关注关系识别可能降级，其他主体功能不受影响。', '。此模式會停用頁面網路 Hook；部分影片 / GIF 下載、年齡限制影片與介面關注關係識別可能受限，其他主要功能不受影響。', '。このモードはページのネットワーク Hook を無効化します。一部の動画 / GIF の保存、年齢制限動画、API によるフォロー関係の認識は制限される場合がありますが、その他の主要機能には影響しません。', '. This disables page network hooks. Some video / GIF downloads, age-restricted videos, and API-based following detection may be limited; other main features are unaffected.'],
    ['目前正常', '目前正常', '現在は正常', 'Working normally'],
    ['确定', '確定', '確認', 'OK'], ['未知错误', '未知錯誤', '不明なエラー', 'Unknown error'],
  ];

  function readUiLanguageOverride() {
    try {
      if (typeof GM_getValue !== 'function') return '';
      const value = String(GM_getValue(UI_LANGUAGE_OVERRIDE_KEY, '') || '');
      return SUPPORTED_UI_LANGUAGES.has(value) ? value : '';
    } catch (err) { return ''; }
  }

  function detectUiLanguage() {
    const override = readUiLanguageOverride();
    if (override) return override;
    let raw = '';
    try { raw = (document.documentElement && document.documentElement.lang) || ''; } catch (err) {}
    if (!raw) raw = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    const value = String(raw).toLowerCase();
    if (/^zh-(?:tw|hk|mo|hant)/.test(value)) return 'zh-TW';
    if (/^ja(?:-|$)/.test(value)) return 'ja';
    if (/^en(?:-|$)/.test(value)) return 'en';
    return 'zh-CN';
  }

  const UI_LANGUAGE = detectUiLanguage();
  const UI_LANGUAGE_INDEX = { 'zh-TW': 1, ja: 2, en: 3 };
  const UI_TRANSLATION_INDEX = UI_LANGUAGE_INDEX[UI_LANGUAGE] || 0;
  const UI_TRANSLATION_MAP = new Map(
    UI_TEXT_ENTRIES.map((entry) => [entry[0], UI_TRANSLATION_INDEX ? entry[UI_TRANSLATION_INDEX] : entry[0]])
  );
  const UI_TRANSLATION_PATTERN = UI_TRANSLATION_INDEX
    ? new RegExp(UI_TEXT_ENTRIES.map((entry) => entry[0])
      .sort((a, b) => b.length - a.length)
      .map((text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
    : null;
  const UI_LOCALIZATION_SKIP_SELECTOR = [
    '.BetterX-text', '.BetterX-note-text', '.BetterX-note-input', '.BetterX-author-profile',
    '.BetterX-notification-user-main b', '.BetterX-notification-user-main small',
    '.BetterX-keyword-tags', '.BetterX-i18n-user-text', 'code', 'script', 'style',
  ].join(',');

  function uiText(value) {
    const input = String(value == null ? '' : value);
    if (!UI_TRANSLATION_PATTERN || !input) return input;
    return input.replace(UI_TRANSLATION_PATTERN, (matched) => UI_TRANSLATION_MAP.get(matched) || matched);
  }

  function uiHtml(strings, ...values) {
    return strings.reduce((html, chunk, index) => (
      html + uiText(chunk) + (index < values.length ? values[index] : '')
    ), '');
  }

  function shouldSkipUiLocalization(node) {
    const element = node && (node.nodeType === 1 ? node : node.parentElement);
    return !!(element && element.closest && element.closest(UI_LOCALIZATION_SKIP_SELECTOR));
  }

  function localizeBetterXTree(root) {
    if (!UI_TRANSLATION_PATTERN || !root) return;
    if (root.nodeType === 3) {
      if (shouldSkipUiLocalization(root)) return;
      const before = root.nodeValue || '';
      const after = uiText(before);
      if (after !== before) root.nodeValue = after;
      return;
    }
    const localizeElement = (element) => {
      if (!element || element.nodeType !== 1 || element.matches('code, script, style')) return;
      ['title', 'placeholder', 'aria-label'].forEach((name) => {
        if (!element.hasAttribute(name)) return;
        const before = element.getAttribute(name) || '';
        const after = uiText(before);
        if (after !== before) element.setAttribute(name, after);
      });
    };
    if (root.nodeType === 1) localizeElement(root);
    if (root.querySelectorAll) root.querySelectorAll('*').forEach(localizeElement);
    const showText = typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;
    if (!document.createTreeWalker) return;
    const walker = document.createTreeWalker(root, showText);
    let node;
    while ((node = walker.nextNode())) {
      if (shouldSkipUiLocalization(node)) continue;
      const before = node.nodeValue || '';
      const after = uiText(before);
      if (after !== before) node.nodeValue = after;
    }
  }

  // 下载弹层本轮不改造；暂时只观察这一个小容器，不再观察整棵 BetterX UI。
  let downloadUiLocalizationObserver = null;
  function installDownloadUiLocalizationFallback(root) {
    if (typeof MutationObserver !== 'function' || !root.querySelector) return;
    const downloadRoot = root.querySelector('#BetterX-download-popover');
    if (!downloadRoot) return;
    if (downloadUiLocalizationObserver) downloadUiLocalizationObserver.disconnect();
    downloadUiLocalizationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          localizeBetterXTree(mutation.target.parentElement);
        } else {
          mutation.addedNodes.forEach((node) => localizeBetterXTree(node));
        }
      }
    });
    downloadUiLocalizationObserver.observe(downloadRoot, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  }

  function uiAlert(message) { window.alert(uiText(message)); }
  function uiConfirm(message) { return window.confirm(uiText(message)); }
