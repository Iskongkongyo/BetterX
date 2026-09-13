  function addStyle(css) {
    if (typeof GM_addStyle !== 'undefined') { GM_addStyle(css); return; }
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function installStyles() {
    addStyle(`
      #BetterX-root {
        position: fixed; left: 16px; bottom: 16px; z-index: 2147483000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        --xv-panel-bg: rgba(21,24,28,0.98);
        --xv-text: #e7e9ea;
        --xv-border: rgba(255,255,255,0.12);
        --xv-chip-bg: rgba(255,255,255,0.06);
        --xv-input-bg: rgba(255,255,255,0.06);
        --xv-muted: rgba(231,233,234,0.62);
        --xv-item-bg: rgba(255,255,255,0.03);
        --xv-accent: #1d9bf0;
      }
      #BetterX-root.BetterX-light {
        --xv-panel-bg: rgba(255,255,255,0.99);
        --xv-text: #0f1419;
        --xv-border: rgba(0,0,0,0.12);
        --xv-chip-bg: rgba(0,0,0,0.05);
        --xv-input-bg: rgba(0,0,0,0.04);
        --xv-muted: rgba(15,20,25,0.6);
        --xv-item-bg: rgba(0,0,0,0.02);
      }
      #BetterX-badge {
        background: var(--xv-accent); color: #fff; border: none; border-radius: 999px;
        padding: 10px 16px; font-size: 13px; font-weight: 700; cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.35); touch-action: none; user-select: none;
      }
      #BetterX-badge:hover { filter: brightness(1.08); }
      #BetterX-root.BetterX-desktop-badge-hidden:not(.BetterX-mobile) #BetterX-badge {
        visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;
      }
      #BetterX-badge.mobile-mode {
        width: 52px; height: 52px; padding: 0; border-radius: 50%; font-size: 22px;
        display: flex; align-items: center; justify-content: center; position: relative;
      }
      .BetterX-mobile-icon {
        width: 42px; height: 42px; border-radius: 50%; object-fit: cover;
        border: 2px solid rgba(255,255,255,.72); box-shadow: 0 2px 8px rgba(0,0,0,.22);
        pointer-events: none; user-select: none; -webkit-user-drag: none;
      }
      #BetterX-badge.mobile-mode.desktop-icon-mode { width: 64px; height: 64px; }
      #BetterX-badge.mobile-mode.desktop-icon-mode .BetterX-mobile-icon { width: 54px; height: 54px; }
      #BetterX-badge.desktop-icon-mode { cursor: grab; }
      #BetterX-badge.desktop-icon-mode.is-dragging { cursor: grabbing; }
      #BetterX-badge.desktop-icon-mode .BetterX-mobile-icon-fallback { font-size: 30px; }
      .BetterX-mobile-icon-fallback { line-height: 1; }
      #BetterX-root.BetterX-mobile .BetterX-desktop-only-setting { display: none !important; }
      .BetterX-firefox-only-setting[hidden] { display: none !important; }
      .BetterX-mobile-only-setting { display: none !important; }
      #BetterX-root.BetterX-mobile label.BetterX-mobile-only-setting { display: flex !important; }
      #BetterX-root.BetterX-mobile div.BetterX-mobile-only-setting { display: block !important; }
      .BetterX-mobile-dot {
        position: absolute; top: -2px; right: -2px; background: #f4212e; color: #fff;
        min-width: 18px; height: 18px; border-radius: 999px; font-size: 11px; font-weight: 700;
        line-height: 18px; text-align: center; padding: 0 4px;
      }
      #BetterX-root.BetterX-mobile { left: auto; right: 16px; bottom: 84px; }
      #BetterX-root.BetterX-mobile #BetterX-badge {
        opacity: var(--xv-mobile-badge-opacity, 1);
        transition: opacity 170ms ease-out, filter .15s;
      }
      #BetterX-root.BetterX-mobile:not(.BetterX-mobile-badge-collapsed) #BetterX-badge {
        touch-action: manipulation;
      }
      #BetterX-root.BetterX-mobile.BetterX-mobile-badge-collapsed #BetterX-badge {
        width: 15px; height: 76px; min-height: 76px; padding: 0; border-radius: 999px 0 0 999px;
        background: #1d9bf0; box-shadow: -1px 2px 8px rgba(0,0,0,.2); opacity: .56 !important;
      }
      #BetterX-root.BetterX-mobile.BetterX-mobile-badge-collapsed #BetterX-badge::after {
        content: '‹'; display: block; color: rgba(255,255,255,.92); font-size: 16px; font-weight: 400; line-height: 1;
        transform: translateX(-1px);
      }
      #BetterX-root.BetterX-mobile.BetterX-mobile-badge-collapsed #BetterX-badge.is-mobile-dragging {
        opacity: .88 !important; transition: none; cursor: ns-resize;
      }
      #BetterX-root.BetterX-mobile.BetterX-mobile-badge-collapsed .BetterX-mobile-icon,
      #BetterX-root.BetterX-mobile.BetterX-mobile-badge-collapsed .BetterX-mobile-icon-fallback,
      #BetterX-root.BetterX-mobile.BetterX-mobile-badge-collapsed .BetterX-mobile-dot,
      #BetterX-root.BetterX-mobile.BetterX-mobile-badge-collapsed #BetterX-download-pill { display: none !important; }
      #BetterX-root.BetterX-mobile.BetterX-mobile-badge-inactive #BetterX-badge,
      #BetterX-root.BetterX-mobile.BetterX-mobile-badge-inactive #BetterX-download-pill { pointer-events: none; }

      /* X 2026 的多媒体正文轮播恢复为传统网格；类名仅由脚本加到含 2+ 项媒体的轮播。 */
      article .BetterX-media-grid-box {
        padding-bottom: 0 !important; height: auto !important; min-height: 0 !important;
      }
      article nav.BetterX-media-grid {
        position: relative !important; inset: auto !important; width: 100% !important;
        height: auto !important; overflow: visible !important;
      }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-prevButtonWrapper"],
      article nav.BetterX-media-grid [data-testid="ScrollSnap-nextButtonWrapper"] { display: none !important; }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-SwipeableList"] {
        width: 100% !important; height: auto !important; overflow: visible !important;
      }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-List"] {
        display: grid !important; width: 100% !important; height: auto !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px;
        margin: 0 !important; padding: 0 !important; overflow: hidden !important;
        border-radius: 16px; scroll-snap-type: none !important;
      }
      article nav.BetterX-media-grid-count-2 [data-testid="ScrollSnap-List"] {
        grid-template-rows: minmax(0, 1fr); aspect-ratio: 16 / 9;
      }
      article nav.BetterX-media-grid-count-3 [data-testid="ScrollSnap-List"],
      article nav.BetterX-media-grid-count-4 [data-testid="ScrollSnap-List"] {
        grid-template-rows: repeat(2, minmax(0, 1fr)); aspect-ratio: 16 / 9;
      }
      article nav.BetterX-media-grid-count-3 [data-testid="ScrollSnap-List"] > [role="presentation"]:first-child {
        grid-row: span 2;
      }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-List"] > [role="presentation"] {
        display: block !important; width: auto !important; min-width: 0 !important;
        height: 100% !important; margin: 0 !important; overflow: hidden !important;
        scroll-snap-align: none !important;
      }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-List"] > [role="presentation"] > div,
      article nav.BetterX-media-grid [data-testid="ScrollSnap-List"] > [role="presentation"] > div > div {
        width: 100% !important; height: 100% !important; min-height: 0 !important;
      }
      article nav.BetterX-media-grid [data-testid="ScrollSnap-List"] > [role="presentation"] > div {
        aspect-ratio: auto !important;
      }

      #BetterX-download-pill {
        position: absolute; left: calc(100% + 8px); bottom: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        min-width: 42px; height: 36px;
        padding: 0 12px; border: 1px solid rgba(255,255,255,.16); border-radius: 999px;
        background: var(--xv-panel-bg); color: var(--xv-text); box-shadow: 0 4px 16px rgba(0,0,0,.28);
        font-size: 12px; font-weight: 700; white-space: nowrap; cursor: pointer; backdrop-filter: blur(10px);
      }
      .BetterX-download-pill-icon { font-size: 17px; line-height: 1; }
      .BetterX-download-pill-label { line-height: 1; }
      .BetterX-download-pill-count { display: none; }
      #BetterX-download-pill:hover { border-color: var(--xv-accent); }
      #BetterX-download-pill.is-progress {
        border-color: transparent;
        background: linear-gradient(var(--xv-panel-bg), var(--xv-panel-bg)) padding-box,
          conic-gradient(var(--xv-accent) var(--xv-download-progress, 0deg), var(--xv-border) 0) border-box;
      }
      #BetterX-root.BetterX-panel-right #BetterX-download-pill { left: auto; right: calc(100% + 8px); }
      #BetterX-download-popover {
        position: absolute; left: calc(100% + 8px); bottom: 44px; width: min(360px, calc(100vw - 32px));
        box-sizing: border-box; max-width: calc(100vw - 16px);
        max-height: min(420px, calc(100vh - 120px)); overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; padding: 10px;
        border: 1px solid var(--xv-border); border-radius: 14px; background: var(--xv-panel-bg); color: var(--xv-text);
        box-shadow: 0 12px 42px rgba(0,0,0,.42); backdrop-filter: blur(12px);
      }
      #BetterX-root.BetterX-panel-right #BetterX-download-popover { left: auto; right: calc(100% + 8px); }
      #BetterX-download-pill[hidden], #BetterX-download-popover[hidden],
      .BetterX-dl-cancel[hidden] { display: none !important; }
      .BetterX-download-popover-title { padding: 2px 4px 8px; font-size: 13px; font-weight: 800; }
      .BetterX-download-empty { padding: 14px 8px; color: var(--xv-muted); text-align: center; font-size: 12px; }
      .BetterX-download-task {
        display: flex; align-items: center; gap: 8px; min-width: 0; padding: 9px 8px; margin-top: 5px;
        border: 1px solid var(--xv-border); border-radius: 10px;
        background: linear-gradient(90deg, rgba(29,155,240,.14) var(--xv-task-progress, 0%), transparent 0), var(--xv-item-bg);
      }
      .BetterX-download-task-main { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: 3px; }
      .BetterX-download-task-main strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
      .BetterX-download-task-main span { min-width: 0; overflow-wrap: anywhere; color: var(--xv-muted); font-size: 11px; }
      .BetterX-download-task-actions { display: flex; flex: 0 0 auto; gap: 4px; }
      .BetterX-download-task-actions button {
        padding: 4px 7px; border: 1px solid var(--xv-border); border-radius: 7px;
        background: var(--xv-chip-bg); color: var(--xv-text); font-size: 11px; cursor: pointer;
      }
      .BetterX-download-task-actions button:hover { border-color: var(--xv-accent); }

      #BetterX-panel {
        position: absolute; bottom: calc(100% + 10px); left: 0;
        width: min(94vw, 480px); max-height: calc(100vh - 96px);
        background: var(--xv-panel-bg); color: var(--xv-text);
        border: 1px solid var(--xv-border); border-radius: 16px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.5); backdrop-filter: blur(12px);
        display: flex; flex-direction: column; overflow: hidden;
      }
      #BetterX-root.BetterX-panel-right #BetterX-panel { left: auto; right: 0; }
      #BetterX-root.BetterX-mobile #BetterX-panel { position: fixed; right: 12px; left: auto; bottom: 84px; max-height: calc(100vh - 120px); }
      .BetterX-ad-hidden { display: none !important; }
      .BetterX-adult-spam-hidden { display: none !important; }
      .BetterX-download-controls {
        display: inline-flex; align-items: center; justify-content: center; gap: 1px; flex: 0 0 auto;
      }
      .BetterX-download-controls.floating {
        position: absolute; top: 8px; right: 8px; z-index: 5; padding: 2px;
        border-radius: 999px; background: rgba(0,0,0,.62);
      }
      .BetterX-dl-btn, .BetterX-dl-cancel {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 34px; height: 34px; margin: 0; padding: 0 8px;
        border: none; background: transparent; color: rgb(83,100,113);
        font-size: 19px; font-weight: 700; line-height: 1; cursor: pointer; border-radius: 999px;
        transition: background .15s, color .15s, min-width .15s;
      }
      .BetterX-download-controls:not([data-download-state="idle"]) .BetterX-dl-btn { font-size: 12px; }
      .BetterX-dl-btn:hover { background: rgba(29,155,240,0.12); color: rgb(29,155,240); }
      .BetterX-dl-btn.is-progress {
        color: rgb(29,155,240);
        background: conic-gradient(rgba(29,155,240,.24) var(--xv-download-progress, 0deg), transparent 0);
      }
      .BetterX-dl-btn.is-downloaded { color: rgb(29,155,240); text-shadow: 0 0 8px rgba(29,155,240,.28); }
      .BetterX-dl-btn.is-downloaded:hover { color: rgb(29,155,240); background: rgba(29,155,240,.14); }
      .BetterX-dl-btn.is-downloaded svg { width: 22px; height: 22px; fill: currentColor; }
      .BetterX-dl-cancel { min-width: 24px; width: 24px; padding: 0; color: rgb(244,33,46); font-size: 17px; }
      .BetterX-dl-cancel:hover { background: rgba(244,33,46,.12); }
      .BetterX-download-controls.in-group { align-self: center; }
      .BetterX-download-controls.floating .BetterX-dl-btn,
      .BetterX-download-controls.floating .BetterX-dl-cancel { color: #fff; }
      .BetterX-download-controls.floating .BetterX-dl-btn.is-downloaded { color: rgb(29,155,240); }
      .BetterX-download-controls.floating .BetterX-dl-btn:hover { background: rgba(29,155,240,.88); }
      .BetterX-download-controls.floating .BetterX-dl-cancel:hover { background: rgba(244,33,46,.88); }
      article[data-testid="notification"] .BetterX-download-controls { display: none !important; }
      .BetterX-mask-hidden { display: none !important; }
      /* 年龄限制媒体没有可复用的 X React 媒体节点；按旧版原生网格的结构与尺寸重建。 */
      .BetterX-unlocked.BetterX-native-media-grid {
        display: grid; gap: 2px; margin: 8px 0; width: 100%; max-width: 100%;
        border-radius: 16px; overflow: hidden; background: #000;
      }
      .BetterX-unlocked .BetterX-unlocked-tile,
      .BetterX-unlocked .BetterX-unlocked-media {
        display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: hidden;
      }
      .BetterX-unlocked .BetterX-unlocked-photo { cursor: pointer; }
      /* 单媒体沿用 X 的“完整可见、受最大高度约束”效果。 */
      .BetterX-unlocked.xv-n1 { grid-template-columns: 1fr; background: transparent; }
      .BetterX-unlocked.xv-n1 .BetterX-unlocked-tile { height: auto; background: #000; }
      .BetterX-unlocked.xv-n1 img, .BetterX-unlocked.xv-n1 video {
        display: block; margin: 0 auto; width: auto; height: auto; max-width: 100%; max-height: 510px;
        object-fit: contain; background: #000;
      }
      /* 多媒体遵循旧版 X 的 2 / 3 / 4 项马赛克布局。 */
      .BetterX-unlocked.xv-multi img, .BetterX-unlocked.xv-multi video {
        display: block; width: 100%; height: 100%; object-fit: cover; background: #000;
      }
      .BetterX-unlocked.xv-n2 { grid-template-columns: 1fr 1fr; grid-template-rows: minmax(0, 1fr); aspect-ratio: 16 / 9; }
      .BetterX-unlocked.xv-n3 { grid-template-columns: 1fr 1fr; grid-template-rows: repeat(2, minmax(0, 1fr)); aspect-ratio: 16 / 9; }
      .BetterX-unlocked.xv-n3 > *:first-child { grid-row: span 2; }
      .BetterX-unlocked.xv-n4 { grid-template-columns: 1fr 1fr; grid-template-rows: repeat(2, minmax(0, 1fr)); aspect-ratio: 16 / 9; }
      .BetterX-unlocked.xv-nm { grid-template-columns: 1fr 1fr; }
      .BetterX-unlocked.xv-nm .BetterX-unlocked-tile { aspect-ratio: 1 / 1; }
      #BetterX-toast {
        position: fixed; left: 50%; bottom: 90px; transform: translateX(-50%) translateY(10px);
        background: rgba(21,24,28,0.98); color: #fff; padding: 10px 16px; border-radius: 10px;
        font-size: 13px; z-index: 2147483600; box-shadow: 0 6px 24px rgba(0,0,0,0.4);
        opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; max-width: 80vw;
      }
      #BetterX-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

      .BetterX-dialog-overlay {
        position: fixed; inset: 0; z-index: 2147483646;
        display: flex; align-items: center; justify-content: center;
        padding: 18px; background: rgba(0,0,0,.64); backdrop-filter: blur(4px);
        color: var(--xv-text);
      }
      .BetterX-dialog {
        position: relative;
        width: min(92vw, 460px); max-height: min(82vh, 640px); overflow: auto;
        padding: 20px; border: 1px solid var(--xv-border); border-radius: 16px;
        background: var(--xv-panel-bg); box-shadow: 0 18px 64px rgba(0,0,0,.55);
      }
      .BetterX-dialog.has-close-icon .BetterX-dialog-title { padding-right: 38px; }
      .BetterX-dialog-close {
        position: absolute; top: 12px; right: 12px; z-index: 1;
        display: inline-flex; align-items: center; justify-content: center;
        width: 34px; height: 34px; padding: 0; border: 0; border-radius: 999px;
        background: transparent; color: var(--xv-muted); cursor: pointer;
      }
      .BetterX-dialog-close[hidden] { display: none !important; }
      .BetterX-dialog-close:hover { background: var(--xv-chip-bg); color: var(--xv-text); }
      .BetterX-dialog-close:focus-visible { outline: 2px solid var(--xv-accent); outline-offset: 2px; }
      .BetterX-dialog-close svg { width: 20px; height: 20px; fill: currentColor; }
      .BetterX-dialog-title { font-size: 18px; line-height: 1.35; font-weight: 800; margin-bottom: 12px; }
      .BetterX-dialog-body { font-size: 14px; line-height: 1.65; color: var(--xv-text); }
      .BetterX-dialog-body p { margin: 0 0 10px; }
      .BetterX-dialog-body ul { margin: 0 0 12px; padding-left: 22px; }
      .BetterX-dialog-body li { margin: 4px 0; }
      .BetterX-dialog-body code {
        padding: 1px 5px; border-radius: 5px; background: var(--xv-chip-bg);
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .92em;
      }
      .BetterX-dialog-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 9px; margin-top: 18px; }
      .BetterX-dialog-actions .BetterX-btn { min-width: 104px; padding: 9px 14px; font-size: 14px; }
      .BetterX-language-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
      .BetterX-language-option {
        display: grid; grid-template-columns: 38px minmax(0, 1fr) 18px; align-items: center; gap: 9px;
        min-height: 48px; padding: 8px 10px; border: 1px solid var(--xv-border); border-radius: 10px;
        background: var(--xv-chip-bg); color: var(--xv-text); text-align: left; cursor: pointer;
      }
      .BetterX-language-option:hover, .BetterX-language-option:focus-visible { border-color: var(--xv-accent); outline: none; }
      .BetterX-language-option.is-current { border-color: var(--xv-accent); box-shadow: inset 0 0 0 1px var(--xv-accent); }
      .BetterX-language-code { color: var(--xv-muted); font-size: 11px; font-weight: 800; }
      .BetterX-language-check { color: var(--xv-accent); font-size: 16px; font-weight: 900; text-align: right; }
      .BetterX-language-note { margin: 12px 0 0 !important; color: var(--xv-muted); font-size: 12px; }

      #BetterX-panel * { box-sizing: border-box; }
      .BetterX-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 14px 14px 8px; }
      .BetterX-title-main { font-size: 15px; font-weight: 800; }
      .BetterX-title-sub { font-size: 11px; color: var(--xv-muted); margin-top: 2px; }
      .BetterX-header-actions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
      .BetterX-tip { padding: 0 14px 8px; font-size: 13px; color: var(--xv-muted); }

      .BetterX-btn {
        background: var(--xv-chip-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 8px; padding: 5px 10px; font-size: 12px; cursor: pointer; white-space: nowrap;
      }
      .BetterX-btn:hover { border-color: var(--xv-accent); }
      .BetterX-btn.primary { background: var(--xv-accent); color: #fff; border-color: var(--xv-accent); }
      .BetterX-btn.danger { color: #f4212e; }
      .BetterX-btn.danger:hover { border-color: #f4212e; }

      .BetterX-summary { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 10px; }
      .BetterX-stat { background: var(--xv-chip-bg); border-radius: 8px; padding: 4px 8px; font-size: 11px; color: var(--xv-muted); }
      .BetterX-stat b { color: var(--xv-text); font-size: 12px; }

      .BetterX-filter-bar, .BetterX-chip-row { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 10px; }
      .BetterX-chip-row { padding: 6px 0 0; }
      .BetterX-chip {
        background: var(--xv-chip-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 999px; padding: 4px 12px; font-size: 12px; cursor: pointer;
      }
      .BetterX-chip.active { background: var(--xv-accent); color: #fff; border-color: var(--xv-accent); }

      .BetterX-controls { padding: 0 14px 10px; display: flex; flex-direction: column; gap: 8px; }
      .BetterX-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
      .BetterX-control-row { align-items: flex-end; }
      .BetterX-control-row > .BetterX-btn,
      .BetterX-control-row > .BetterX-field > .BetterX-input { height: 32px; }
      .BetterX-control-row > .BetterX-field.inline {
        height: 32px; justify-content: center; align-self: flex-end;
      }
      .BetterX-row .BetterX-input { flex: 1 1 120px; }
      .BetterX-input {
        background: var(--xv-input-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 8px; padding: 7px 10px; font-size: 13px; width: 100%;
      }
      .BetterX-input.small { width: 90px; flex: 0 0 auto; }
      .BetterX-select {
        background: var(--xv-input-bg); color: var(--xv-text); border: 1px solid var(--xv-border);
        border-radius: 8px; padding: 6px 8px; font-size: 12px; cursor: pointer;
      }
      .BetterX-select option { color: #000; }
      .BetterX-light .BetterX-select option { color: #0f1419; }

      .BetterX-advanced { border: 1px solid var(--xv-border); border-radius: 8px; padding: 6px 10px; }
      .BetterX-advanced summary { cursor: pointer; font-size: 13px; color: var(--xv-muted); }
      .BetterX-adv-body { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
      .BetterX-field { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--xv-muted); }
      .BetterX-field.inline { flex-direction: row; align-items: center; gap: 6px; }
      .BetterX-download-zip-option { margin-left: 0; }
      .BetterX-adv-label { font-size: 12px; color: var(--xv-muted); }
      .BetterX-content-status { font-size: 11px; color: var(--xv-muted); padding: 5px 8px; border-radius: 7px; background: var(--xv-chip-bg); }

      .BetterX-list { overflow-y: auto; padding: 4px 14px 14px; display: flex; flex-direction: column; gap: 10px; }
      .BetterX-empty { padding: 24px 8px; text-align: center; color: var(--xv-muted); font-size: 13px; }
      .BetterX-loadmore {
        margin-top: 4px; background: var(--xv-chip-bg); color: var(--xv-text); border: 1px dashed var(--xv-border);
        border-radius: 8px; padding: 8px; font-size: 12px; cursor: pointer;
      }

      .BetterX-item { background: var(--xv-item-bg); border: 1px solid var(--xv-border); border-radius: 12px; padding: 10px 12px; }
      .BetterX-item.is-flash-lost { border-color: rgba(244,33,46,0.5); }
      .BetterX-item.is-pinned { border-color: rgba(29,155,240,0.6); }
      .BetterX-item-top { display: flex; justify-content: space-between; gap: 8px; }
      .BetterX-author-head { display: flex; align-items: center; gap: 8px; }
      .BetterX-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex: 0 0 auto; }
      .BetterX-author-line { font-size: 13px; font-weight: 700; word-break: break-word; line-height: 1.35; }
      .BetterX-author-profile { color: inherit; text-decoration: none; }
      .BetterX-author-profile:hover { color: var(--xv-accent); text-decoration: underline; }
      .BetterX-author-handle { color: var(--xv-muted); font-weight: 400; font-size: 12px; }
      .BetterX-author-time { color: var(--xv-muted); font-weight: 400; font-size: 12px; white-space: nowrap; }
      .BetterX-submeta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 3px; font-size: 10px; color: var(--xv-muted); }
      .BetterX-actions { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; align-content: flex-start; }

      .BetterX-text { margin: 8px 0 4px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
      .BetterX-text.collapsed { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .BetterX-expand-btn { background: none; border: none; color: var(--xv-accent); font-size: 12px; cursor: pointer; padding: 0; }
      .BetterX-hl { background: #ffd400; color: #000; border-radius: 3px; padding: 0 1px; }

      .BetterX-thumbs { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
      .BetterX-thumb-button { padding: 0; border: 0; border-radius: 8px; background: none; cursor: zoom-in; line-height: 0; }
      .BetterX-thumb-button:focus-visible { outline: 2px solid var(--xv-accent); outline-offset: 2px; }
      .BetterX-thumb { display: block; width: 72px; height: 72px; object-fit: cover; border-radius: 8px; border: 1px solid var(--xv-border); transition: transform .16s ease, box-shadow .16s ease; }
      .BetterX-thumb-button:hover .BetterX-thumb { transform: scale(1.04); box-shadow: 0 3px 12px rgba(0, 0, 0, .28); }
      .BetterX-image-preview {
        position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center;
        box-sizing: border-box; overflow: hidden; overscroll-behavior: contain; touch-action: none;
        padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
        background: rgba(0, 0, 0, .86); cursor: zoom-out;
      }
      .BetterX-image-preview-box {
        position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;
        min-width: 0; min-height: 0; overflow: hidden; cursor: default; touch-action: none; user-select: none;
      }
      .BetterX-image-preview-box img {
        display: block; width: auto; height: auto; max-width: 100%; max-height: 100%; object-fit: contain;
        border-radius: 10px; box-shadow: 0 12px 46px rgba(0, 0, 0, .55);
        transform: translate3d(0, 0, 0) scale(1); transform-origin: center center; will-change: transform;
        cursor: zoom-in; touch-action: none; user-select: none; -webkit-user-drag: none;
      }
      .BetterX-image-preview-box.is-zoomed img { cursor: grab; }
      .BetterX-image-preview-box.is-panning img { cursor: grabbing; }
      .BetterX-image-preview-close {
        position: fixed; top: max(12px, env(safe-area-inset-top)); right: max(12px, env(safe-area-inset-right)); z-index: 3;
        display: grid; place-items: center; width: 38px; height: 38px; padding: 0; border: 1px solid rgba(255,255,255,.52); border-radius: 50%;
        background: rgba(20,20,20,.9); color: #fff; text-align: center; text-indent: 0; cursor: pointer;
        box-shadow: 0 3px 14px rgba(0,0,0,.38); touch-action: manipulation;
      }
      .BetterX-image-preview-close > span {
        display: block; margin: 0; padding: 0; font: 700 27px/1 Arial, sans-serif; line-height: 1; transform: translateY(-1px);
      }
      .BetterX-image-preview-nav {
        position: fixed; z-index: 2; display: grid; place-items: center; width: 44px; height: 44px; padding: 0;
        border: 1px solid rgba(255,255,255,.48); border-radius: 50%; background: rgba(20,20,20,.78); color: #fff;
        text-align: center; text-indent: 0; cursor: pointer; box-shadow: 0 3px 14px rgba(0,0,0,.34);
        touch-action: manipulation; transition: opacity .14s ease, background .14s ease, transform .14s ease;
      }
      .BetterX-image-preview-nav > span { display: block; font: 700 34px/1 Arial, sans-serif; line-height: 1; transform: translateY(-1px); }
      .BetterX-image-preview-nav:hover:not(:disabled) { background: rgba(20,20,20,.94); transform: scale(1.06); }
      .BetterX-image-preview-nav:disabled { opacity: .24; cursor: default; }
      .BetterX-image-preview-nav[hidden] { display: none !important; }
      @media (hover: none), (pointer: coarse) {
        .BetterX-image-preview-nav { display: none !important; }
      }

      .BetterX-tags { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0; }
      .BetterX-tag { font-size: 10px; padding: 2px 6px; border-radius: 6px; background: var(--xv-chip-bg); color: var(--xv-muted); }
      .BetterX-tag.fav { background: rgba(255,212,0,0.15); color: #ffd400; }
      .BetterX-tag.pin { background: rgba(29,155,240,0.15); color: var(--xv-accent); }
      .BetterX-tag.flash { background: rgba(244,33,46,0.15); color: #f4212e; }
      .BetterX-tag.opened { background: rgba(0,186,124,0.15); color: #00ba7c; }
      .BetterX-tag.keyword { background: rgba(255,212,0,0.15); color: #ffd400; }

      .BetterX-note-area { margin-top: 4px; }
      .BetterX-note-btn { font-size: 11px; padding: 3px 8px; }
      .BetterX-note-text { margin-top: 4px; font-size: 12px; color: var(--xv-text); background: var(--xv-chip-bg); border-radius: 6px; padding: 6px 8px; word-break: break-word; }
      .BetterX-note-input { width: 100%; min-height: 60px; resize: vertical; background: var(--xv-input-bg); color: var(--xv-text); border: 1px solid var(--xv-border); border-radius: 8px; padding: 7px; font-size: 12px; }
      .BetterX-note-actions { display: flex; gap: 6px; margin-top: 6px; }
      .BetterX-bottom-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; font-size: 10px; color: var(--xv-muted); }

      .BetterX-list::-webkit-scrollbar { width: 8px; }
      .BetterX-list::-webkit-scrollbar-thumb { background: var(--xv-border); border-radius: 8px; }

      /* ===== UI/UX 优化：吸顶 / 分区 / 菜单 / 视觉统一 ===== */
      .BetterX-panel-top { flex: 0 0 auto; }
      .BetterX-list { flex: 1 1 auto; min-height: 120px; }
      .BetterX-header { padding-bottom: 10px; border-bottom: 1px solid var(--xv-border); }
      .BetterX-section-label { padding: 8px 14px 2px; font-size: 11px; font-weight: 700; letter-spacing: .03em; color: var(--xv-muted); }
      .BetterX-controls .BetterX-section-label { padding: 4px 0 0; }
      .BetterX-controls { border-top: 1px solid var(--xv-border); padding-top: 12px; }
      /* “…”下拉菜单 */
      .BetterX-menu-wrap { position: relative; display: inline-flex; }
      .BetterX-icon-btn { padding: 5px 10px; font-weight: 700; line-height: 1; }
      .BetterX-menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: 30; display: flex; flex-direction: column; gap: 2px; padding: 6px; min-width: 150px; background: var(--xv-panel-bg); border: 1px solid var(--xv-border); border-radius: 12px; box-shadow: 0 10px 32px rgba(0,0,0,0.45); backdrop-filter: blur(12px); }
      .BetterX-menu[hidden] { display: none; }
      .BetterX-menu-item { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: transparent; color: var(--xv-text); border: none; border-radius: 8px; padding: 8px 10px; font-size: 13px; cursor: pointer; white-space: nowrap; transition: background .15s; }
      .BetterX-menu-item:hover { background: var(--xv-chip-bg); }
      .BetterX-menu-item.danger { color: #f4212e; }
      .BetterX-menu-item.danger:hover { background: rgba(244,33,46,0.12); }
      /* 视觉统一：过渡 / 悬停 / 聚焦 */
      .BetterX-btn { transition: background .15s, border-color .15s, color .15s; }
      .BetterX-btn:hover { background: var(--xv-chip-bg); }
      .BetterX-btn.primary:hover { background: var(--xv-accent); filter: brightness(1.08); }
      .BetterX-chip { transition: background .15s, border-color .15s, color .15s; }
      .BetterX-input, .BetterX-select, .BetterX-note-input { transition: border-color .15s, box-shadow .15s; }
      .BetterX-input:focus, .BetterX-select:focus, .BetterX-note-input:focus { outline: none; border-color: var(--xv-accent); box-shadow: 0 0 0 2px rgba(29,155,240,0.25); }
      .BetterX-item { transition: border-color .15s, background .15s; }
      .BetterX-item:hover { border-color: rgba(29,155,240,0.5); }
      /* 折叠区：箭头指示 */
      .BetterX-advanced { transition: border-color .15s; }
      .BetterX-advanced[open] { border-color: rgba(29,155,240,0.4); }
      .BetterX-advanced summary { list-style: none; display: flex; align-items: center; gap: 6px; font-weight: 600; user-select: none; }
      .BetterX-advanced summary::-webkit-details-marker { display: none; }
      .BetterX-advanced summary::before { content: '▸'; font-size: 10px; color: var(--xv-muted); transition: transform .15s; }
      .BetterX-advanced[open] summary::before { transform: rotate(90deg); }

      /* ===== v1.7：双视图工作台 ===== */
      #BetterX-panel {
        position: fixed;
        top: 12px;
        bottom: 12px;
        width: min(94vw, 520px);
        height: auto;
        max-height: none;
      }
      .BetterX-header {
        flex: 0 0 auto; align-items: center; min-height: 58px; padding: 11px 14px;
        border-bottom: none; background: var(--xv-panel-bg);
      }
      .BetterX-title { min-width: 0; }
      .BetterX-title-main { display: flex; align-items: center; gap: 8px; font-size: 17px; letter-spacing: -.01em; }
      .BetterX-title-icon {
        width: 26px; height: 26px; flex: 0 0 26px; border-radius: 7px; object-fit: cover;
        box-shadow: 0 1px 5px rgba(0,0,0,.28); pointer-events: none; user-select: none; -webkit-user-drag: none;
      }
      .BetterX-title-sub { font-size: 11px; }
      .BetterX-header-actions { flex-wrap: nowrap; align-items: center; }
      .BetterX-header-actions .BetterX-btn {
        display: inline-flex; align-items: center; justify-content: center; height: 30px; min-height: 30px;
      }
      .BetterX-header-actions .BetterX-icon-btn { width: 30px; padding: 0; }
      #BetterX-panel.is-settings-view .BetterX-vault-action { display: none; }
      .BetterX-btn:disabled, .BetterX-input:disabled, .BetterX-select:disabled {
        cursor: not-allowed; opacity: .48; filter: none;
      }

      .BetterX-tabs {
        flex: 0 0 auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px;
        margin: 0 14px 10px; padding: 3px; border-radius: 11px; background: var(--xv-chip-bg);
      }
      .BetterX-tab {
        display: flex; align-items: center; justify-content: center; min-height: 32px;
        border: 0; border-radius: 8px; background: transparent; text-align: center;
        color: var(--xv-muted); font-size: 13px; font-weight: 700; cursor: pointer;
        transition: background .15s, color .15s, box-shadow .15s;
      }
      .BetterX-tab:hover { color: var(--xv-text); }
      .BetterX-tab.active {
        color: #fff; background: var(--xv-accent); box-shadow: 0 2px 8px rgba(29,155,240,.22);
      }
      .BetterX-view { flex: 1 1 auto; min-height: 0; }
      .BetterX-view[hidden] { display: none !important; }
      .BetterX-vault-view { display: flex; flex-direction: column; }
      .BetterX-notifications-view { display: flex; flex-direction: column; min-height: 0; }
      .BetterX-notification-toolbar { flex: 0 0 auto; padding: 0 14px 12px; border-bottom: 1px solid var(--xv-border); }
      .BetterX-notification-search-row { margin: 10px 0 0; gap: 8px; }
      .BetterX-notification-search-row .BetterX-input { flex: 1 1 240px; min-width: 0; }
      .BetterX-notification-actions { margin: 8px 0; flex-wrap: wrap; }
      .BetterX-notification-list { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 10px 14px 18px; }
      .BetterX-notification-user { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--xv-border); }
      .BetterX-notification-user.is-pinned { box-shadow: inset 3px 0 0 var(--xv-accent); padding-left: 8px; }
      .BetterX-notification-user.is-disabled { opacity: .68; }
      .BetterX-notification-user.is-disabled.is-pinned { opacity: .82; }
      .BetterX-notification-pin-mark { font-size: 12px; vertical-align: 1px; }
      .BetterX-btn.notification-pinned { color: var(--xv-accent); border-color: var(--xv-accent); font-weight: 700; }
      .BetterX-notification-user-main { display: flex; align-items: center; gap: 9px; min-width: 0; color: var(--xv-text); text-decoration: none; }
      .BetterX-notification-user-main img, .BetterX-notification-avatar-fallback { width: 38px; height: 38px; flex: 0 0 38px; border-radius: 50%; object-fit: cover; }
      .BetterX-notification-avatar-fallback { display: grid; place-items: center; background: var(--xv-chip-bg); color: var(--xv-muted); font-weight: 800; }
      .BetterX-notification-user-main span span, .BetterX-notification-user-main > span { min-width: 0; }
      .BetterX-notification-user-main b, .BetterX-notification-user-main small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .BetterX-notification-user-main small { color: var(--xv-muted); font-size: 12px; }
      .BetterX-notification-user-actions { display: flex; justify-content: flex-end; gap: 6px; flex-wrap: wrap; }
      .BetterX-vault-toolbar {
        flex: 0 0 auto; border-top: 1px solid var(--xv-border); border-bottom: 1px solid var(--xv-border);
        background: var(--xv-panel-bg);
      }
      .BetterX-tip {
        margin: 9px 14px 7px; padding: 7px 9px; border-radius: 8px;
        background: rgba(29,155,240,.08); color: var(--xv-muted); font-size: 12px; line-height: 1.45;
      }
      .BetterX-summary {
        flex-wrap: wrap; overflow-x: visible; padding: 0 14px 8px;
      }
      .BetterX-summary::-webkit-scrollbar, .BetterX-filter-bar::-webkit-scrollbar { display: none; }
      .BetterX-stat { flex: 0 0 auto; border: 1px solid transparent; padding: 4px 8px; font-size: 12px; }
      .BetterX-stat b { font-size: 13px; }
      .BetterX-section-label { padding: 2px 14px 5px; font-size: 11px; text-transform: uppercase; }
      .BetterX-filter-bar {
        flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; min-width: 0; width: 100%;
        scrollbar-width: none; padding: 0 14px 9px; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch;
      }
      .BetterX-filter-bar.is-dragging { cursor: grabbing; user-select: none; }
      .BetterX-filter-bar.is-dragging .BetterX-chip { pointer-events: none; }
      .BetterX-chip { flex: 0 0 auto; min-height: 28px; padding: 4px 11px; }
      .BetterX-search-tools { display: grid; gap: 7px; padding: 0 14px 11px; }
      .BetterX-search-tools > .BetterX-input { height: 36px; padding-left: 12px; border-radius: 10px; }
      .BetterX-toolbar-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
      .BetterX-toolbar-row .BetterX-select { width: 100%; min-width: 0; height: 32px; border-radius: 9px; font-size: 13px; }
      .BetterX-sort-hint { min-height: 18px; padding: 0 2px; color: var(--xv-text); font-family: SimHei, "Microsoft YaHei", "Noto Sans CJK SC", sans-serif; font-size: 12px; font-weight: 600; line-height: 1.5; }
      .BetterX-vault-filter-card { margin: 0 14px 10px; min-width: 0; }
      .BetterX-vault-filter-card > summary { min-width: 0; max-width: 100%; overflow: hidden; }
      .BetterX-vault-filter-title { flex: 0 0 auto; }
      .BetterX-vault-filter-state {
        flex: 1 1 auto; min-width: 0; max-width: 100%; margin-left: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        color: var(--xv-muted); font-size: 11px; font-weight: 500;
      }
      .BetterX-vault-filter-card .BetterX-adv-body { min-width: 0; }
      .BetterX-vault-filter-card .BetterX-filter-bar { padding: 0 0 3px; }
      .BetterX-vault-filter-card .BetterX-search-tools { padding: 0; min-width: 0; }
      .BetterX-list {
        flex: 1 1 auto; min-height: 120px; overflow-y: auto; padding: 10px 12px 14px; gap: 8px;
        overscroll-behavior: contain;
      }

      .BetterX-settings-view { display: flex; flex-direction: column; border-top: 1px solid var(--xv-border); }
      .BetterX-settings-scroll {
        flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
        padding: 12px 14px 18px; scrollbar-color: var(--xv-border) transparent;
      }
      .BetterX-settings-intro { display: flex; flex-direction: column; gap: 2px; padding: 0 2px 10px; }
      .BetterX-settings-intro strong { font-size: 15px; }
      .BetterX-settings-intro span { color: var(--xv-muted); font-size: 12px; line-height: 1.45; }
      .BetterX-settings-view .BetterX-controls {
        gap: 9px; padding: 0; border-top: 0;
      }
      .BetterX-settings-card, .BetterX-vault-filter-card {
        padding: 0; overflow: hidden; border-radius: 12px; background: var(--xv-item-bg);
      }
      .BetterX-settings-card > summary, .BetterX-vault-filter-card > summary {
        min-height: 43px; padding: 0 12px; color: var(--xv-text); font-size: 14px;
      }
      .BetterX-settings-card[open], .BetterX-vault-filter-card[open] { border-color: rgba(29,155,240,.34); }
      .BetterX-settings-card[open] > summary, .BetterX-vault-filter-card[open] > summary { border-bottom: 1px solid var(--xv-border); }
      .BetterX-settings-card > .BetterX-adv-body, .BetterX-vault-filter-card > .BetterX-adv-body { gap: 10px; padding: 12px; }
      .BetterX-settings-card .BetterX-field,
      .BetterX-settings-card .BetterX-adv-label { font-size: 13px; line-height: 1.45; }
      .BetterX-download-name-tokens { gap: 6px; }
      .BetterX-download-name-tokens .BetterX-chip { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; color: var(--xv-text); font-weight: 650; }
      .BetterX-download-name-preview { color: var(--xv-text); font-weight: 650; }
      .BetterX-settings-card .BetterX-content-status { font-size: 12px; line-height: 1.4; }
      .BetterX-dependent-options { display: flex; flex-direction: column; gap: 9px; }
      .BetterX-dependent-options.is-disabled { opacity: .5; }
      .BetterX-field.is-disabled { opacity: .5; }
      .BetterX-adultspam-master-row { flex-wrap: nowrap; justify-content: space-between; }
      .BetterX-adultspam-master-row > .BetterX-field { flex: 1 1 auto; min-width: 0; }
      .BetterX-adultspam-master-row > .BetterX-select { flex: 0 0 auto; min-width: 72px; }
      .BetterX-profile-default-view-row { flex-wrap: nowrap; justify-content: space-between; }
      .BetterX-profile-default-view-row > .BetterX-field { flex: 1 1 auto; min-width: 0; }
      .BetterX-profile-default-view-row > .BetterX-select { flex: 0 0 auto; min-width: 72px; }
      .BetterX-tag-editor {
        display: flex; flex-direction: column; gap: 7px; min-width: 0; padding: 8px;
        border: 1px solid var(--xv-border); border-radius: 10px; background: var(--xv-input-bg);
      }
      .BetterX-keyword-tags { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
      .BetterX-keyword-tags:empty { display: none; }
      .BetterX-main-keyword-tags { padding: 0 2px; }
      .BetterX-keyword-section > .BetterX-row { width: 100%; }
      .BetterX-keyword-tag {
        display: inline-flex; align-items: center; gap: 5px; max-width: 100%; min-height: 26px;
        padding: 3px 5px 3px 9px; border: 1px solid rgba(29,155,240,.35); border-radius: 999px;
        background: rgba(29,155,240,.12); color: var(--xv-text); font-size: 12px; line-height: 1.3;
      }
      .BetterX-keyword-tag-label { overflow-wrap: anywhere; }
      .BetterX-keyword-tag-remove {
        display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto;
        width: 19px; height: 19px; padding: 0; border: 0; border-radius: 50%;
        background: transparent; color: var(--xv-muted); cursor: pointer; font-size: 17px; line-height: 1;
      }
      .BetterX-keyword-tag-remove:hover { background: rgba(244,33,46,.14); color: #f4212e; }
      .BetterX-tag-editor > .BetterX-input { width: 100%; margin: 0; background: transparent; }
      .BetterX-settings-view .BetterX-field.inline {
        position: relative; min-height: 28px; padding-left: 46px; color: var(--xv-text); line-height: 1.35;
      }
      .BetterX-settings-view .BetterX-field.inline > input[type="checkbox"] {
        appearance: none; -webkit-appearance: none; position: absolute; left: 0; top: 50%;
        width: 38px; height: 22px; margin: 0; border: 1px solid var(--xv-border); border-radius: 999px;
        background: var(--xv-input-bg); transform: translateY(-50%); cursor: pointer; transition: .16s ease;
      }
      .BetterX-settings-view .BetterX-field.inline > input[type="checkbox"]::after {
        content: ''; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px;
        border-radius: 50%; background: var(--xv-muted); box-shadow: 0 1px 3px rgba(0,0,0,.35); transition: .16s ease;
      }
      .BetterX-settings-view .BetterX-field.inline > input[type="checkbox"]:checked {
        border-color: var(--xv-accent); background: var(--xv-accent);
      }
      .BetterX-settings-view .BetterX-field.inline > input[type="checkbox"]:checked::after {
        left: 18px; background: #fff;
      }
      .BetterX-settings-view .BetterX-field.inline > input[type="checkbox"]:focus-visible {
        outline: 2px solid rgba(29,155,240,.45); outline-offset: 2px;
      }
      .BetterX-settings-view .BetterX-control-row > .BetterX-field.inline {
        align-self: flex-end; justify-content: center; height: 32px;
      }

      .BetterX-item { position: relative; flex: 0 0 auto; padding: 11px 12px; border-radius: 13px; overflow: hidden; }
      .BetterX-empty, .BetterX-loadmore { flex: 0 0 auto; }
      .BetterX-item.is-unread::before {
        content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px;
        border-radius: 0 3px 3px 0; background: var(--xv-accent);
      }
      .BetterX-avatar { width: 32px; height: 32px; }
      .BetterX-author { min-width: 120px; }
      .BetterX-author-line { font-size: 14px; }
      .BetterX-submeta, .BetterX-tag, .BetterX-bottom-meta { font-size: 11px; }
      .BetterX-text { font-size: 14px; line-height: 1.55; }
      .BetterX-note-btn { font-size: 12px; }
      .BetterX-item-top { align-items: flex-start; }
      .BetterX-actions { max-width: 58%; }
      .BetterX-actions .BetterX-btn { min-height: 28px; padding: 4px 8px; }
      .BetterX-bottom-meta { padding-top: 7px; border-top: 1px solid var(--xv-border); }

      @media (max-width: 640px) {
        #BetterX-root.BetterX-mobile #BetterX-panel {
          inset: 8px; width: auto; height: calc(100dvh - 16px); max-height: none; border-radius: 18px;
        }
        #BetterX-root.BetterX-mobile #BetterX-download-pill {
          left: auto; right: 0; bottom: calc(100% + 10px); width: 52px; min-width: 52px; height: 52px; padding: 0;
          overflow: visible; border: 0; background: var(--xv-accent); color: var(--xv-accent);
          box-shadow: 0 4px 16px rgba(0,0,0,.35); opacity: var(--xv-mobile-badge-opacity, 1);
          transition: opacity 170ms ease-out, filter .15s;
        }
        #BetterX-root.BetterX-mobile #BetterX-download-pill.is-progress { border: 0; background: var(--xv-accent); }
        #BetterX-root.BetterX-mobile .BetterX-download-pill-icon {
          display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;
          border-radius: 50%; background: #fff; color: var(--xv-accent); font-size: 24px; font-weight: 900;
          box-shadow: 0 1px 5px rgba(0,0,0,.18);
        }
        #BetterX-root.BetterX-mobile .BetterX-download-pill-label { display: none; }
        #BetterX-root.BetterX-mobile .BetterX-download-pill-count {
          position: absolute; display: block; top: -2px; right: -2px; min-width: 18px; height: 18px;
          padding: 0 4px; border-radius: 999px; background: #f4212e; color: #fff;
          font-size: 11px; font-weight: 700; line-height: 18px; text-align: center;
        }
        #BetterX-root.BetterX-mobile .BetterX-download-pill-count[hidden] { display: none !important;
        }
        #BetterX-root.BetterX-mobile #BetterX-download-popover {
          position: absolute; left: auto; right: 0; bottom: calc(200% + 20px);
          width: min(360px, calc(100vw - 16px)); max-width: calc(100vw - 16px); max-height: min(52dvh, 420px);
        }
        #BetterX-root.BetterX-mobile.is-open #BetterX-badge,
        #BetterX-root.BetterX-mobile.is-open #BetterX-download-pill { opacity: 0; pointer-events: none; }
        .BetterX-header { min-height: 54px; padding: 9px 11px; }
        .BetterX-title-icon { display: none; }
        .BetterX-title-sub { display: none; }
        .BetterX-header-actions { gap: 4px; }
        .BetterX-header-actions .BetterX-btn { padding: 5px 7px; }
        .BetterX-tabs { margin: 0 10px 8px; }
        .BetterX-tip { margin: 7px 10px 6px; }
        .BetterX-summary, .BetterX-filter-bar { padding-left: 10px; padding-right: 10px; }
        .BetterX-section-label { padding-left: 10px; padding-right: 10px; }
        .BetterX-search-tools { padding: 0 10px 9px; }
        .BetterX-vault-filter-card { margin: 0 10px 8px; }
        .BetterX-vault-filter-card .BetterX-filter-bar,
        .BetterX-vault-filter-card .BetterX-search-tools { padding-left: 0; padding-right: 0; }
        .BetterX-toolbar-row { grid-template-columns: 1fr 1fr; }
        .BetterX-toolbar-row .BetterX-select:last-child { grid-column: 1 / -1; }
        .BetterX-list { padding: 8px 9px 12px; }
        .BetterX-notification-toolbar { padding: 0 10px 10px; }
        .BetterX-notification-search-row { flex-wrap: nowrap; }
        .BetterX-notification-search-row .BetterX-btn { flex: 0 0 auto; }
        .BetterX-notification-list { padding: 8px 10px 14px; }
        /* 通知用户卡片按实际可用宽度自适应：
           两个按钮通常可与用户名同排；按钮更多或空间不足时再自然换到下一行。 */
        .BetterX-notification-user {
          align-items: center; flex-direction: row; flex-wrap: wrap;
        }
        .BetterX-notification-user-main {
          width: auto; flex: 1 1 96px; min-width: 0;
        }
        .BetterX-notification-user-actions {
          width: auto; max-width: 100%; flex: 0 1 auto; justify-content: flex-start;
        }
        .BetterX-settings-scroll { padding: 10px 10px 16px; }
        .BetterX-item-top { flex-direction: column; }
        .BetterX-actions { max-width: none; justify-content: flex-start; }
        .BetterX-thumb { width: 64px; height: 64px; }
        .BetterX-image-preview {
          padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));
        }
        .BetterX-image-preview-close {
          top: max(8px, env(safe-area-inset-top)); right: max(8px, env(safe-area-inset-right)); width: 40px; height: 40px;
        }
      }
    `);
  }
  // ── 观察器 / 定时器 / 导航 ───────────────────────────────────────────
