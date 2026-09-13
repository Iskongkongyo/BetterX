  const DOWNLOAD_NAME_TOKENS = [
    { token: '{用户名}', key: 'user-name' },
    { token: '{用户ID}', key: 'user-id' },
    { token: '{帖子ID}', key: 'status-id' },
    { token: '{发布时间}', key: 'date-time' },
    { token: '{帖子正文}', key: 'full-text' },
    { token: '{文件类型}', key: 'file-type' },
    { token: '{原文件名}', key: 'file-name' },
    { token: '{序号}', key: 'index' },
  ];
  // 英文变量仅用于兼容已保存的旧模板；设置面板只展示中文变量。
  const DOWNLOAD_NAME_LEGACY_TOKENS = {
    'user-name': 'user-name', 'user-id': 'user-id', 'status-id': 'status-id', 'date-time': 'date-time',
    'full-text': 'full-text', 'file-type': 'file-type', 'file-name': 'file-name', index: 'index',
  };
  const DOWNLOAD_NAME_CHINESE_TOKENS = {
    用户名: 'user-name', 用户ID: 'user-id', 帖子ID: 'status-id', 发布时间: 'date-time',
    帖子正文: 'full-text', 文件类型: 'file-type', 原文件名: 'file-name', 序号: 'index',
  };

  function formatDownloadNameDate(value) {
    const date = new Date(value || Date.now());
    const safeDate = Number.isFinite(date.getTime()) ? date : new Date();
    const pad = (number) => String(number).padStart(2, '0');
    return `${safeDate.getFullYear()}-${pad(safeDate.getMonth() + 1)}-${pad(safeDate.getDate())}_${pad(safeDate.getHours())}-${pad(safeDate.getMinutes())}-${pad(safeDate.getSeconds())}`;
  }

  function sanitizeDownloadName(value, fallback) {
    let name = String(value == null ? '' : value);
    try { name = name.normalize('NFKC'); } catch (err) {}
    name = name
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_')
      .replace(/\s+/g, ' ')
      .replace(/[. ]+$/g, '')
      .trim();
    // Windows 单个文件名通常最多 255 字节；按字符保守截断，仍给扩展名留出空间。
    return (name || fallback || 'x_download').slice(0, 160);
  }

  function getDownloadSourceName(url, ext) {
    let raw = '';
    try { raw = new URL(url).pathname.split('/').pop() || ''; } catch (err) {}
    raw = raw.replace(new RegExp(`\\.${escapeRegExp(String(ext || ''))}$`, 'i'), '');
    return sanitizeDownloadName(raw, 'media');
  }

  function renderDownloadNameTemplate(template, values) {
    return String(template || '').replace(/\{([^{}]+)\}/g, (all, rawKey) => {
      const key = DOWNLOAD_NAME_CHINESE_TOKENS[rawKey] || DOWNLOAD_NAME_LEGACY_TOKENS[rawKey];
      return key && values[key] != null ? String(values[key]) : all;
    });
  }

  function downloadTemplateIncludesIndex(template) {
    return /\{(?:序号|index)\}/.test(String(template || ''));
  }

  function applyDownloadNameRegex(name, regexSource, replacement) {
    const source = String(regexSource || '').trim();
    const regex = source ? safeRegex(source, 'g') : null;
    if (!regex) return name;
    try { return name.replace(regex, String(replacement || '')); } catch (err) { return name; }
  }

  function buildDownloadNameBase(job, purpose, item) {
    const isZip = purpose === 'zip';
    const mediaType = isZip ? 'zip' : (item && item.mediaType) || 'media';
    const values = {
      'user-name': job.displayName || job.username || 'x',
      'user-id': job.username || 'x',
      'status-id': job.statusId || 'post',
      'date-time': formatDownloadNameDate(job.postDate || job.createdAt),
      'full-text': String(job.postText || '').replace(/\s+/g, ' ').trim().slice(0, 80) || '无正文',
      'file-type': mediaType,
      'file-name': isZip ? 'media' : getDownloadSourceName(item && item.url, item && item.ext),
      'index': isZip ? '' : String((item && item.index != null ? item.index : 0) + 1),
    };
    const template = isZip ? job.zipNameTemplate : job.fileNameTemplate;
    const rendered = renderDownloadNameTemplate(template, values);
    return sanitizeDownloadName(
      applyDownloadNameRegex(rendered, job.downloadNameRegex, job.downloadNameReplacement),
      `${values['user-id']}_${values['status-id']}`
    );
  }

  function appendDownloadExtension(baseName, ext) {
    const extension = String(ext || 'bin').replace(/^\.+/, '').toLowerCase() || 'bin';
    const duplicateExtension = new RegExp(`\\.${escapeRegExp(extension)}$`, 'i');
    return `${String(baseName || 'download').replace(duplicateExtension, '')}.${extension}`;
  }

  function getDownloadItemFilename(job, item) {
    let baseName = buildDownloadNameBase(job, 'file', item);
    // 兼容旧默认：多文件时自动补序号；手动写入 {index} 则完全由模板控制。
    if (job.items.length > 1 && !downloadTemplateIncludesIndex(job.fileNameTemplate)) {
      baseName = sanitizeDownloadName(`${baseName}_${(item.index || 0) + 1}`, baseName);
    }
    return appendDownloadExtension(baseName, item.ext);
  }

  function getDownloadZipFilename(job) {
    return appendDownloadExtension(buildDownloadNameBase(job, 'zip'), 'zip');
  }

  function updateDownloadNamingPreview() {
    if (!state.downloadNamePreviewEl) return;
    const fileTemplate = state.downloadFileNameTemplateEl
      ? state.downloadFileNameTemplateEl.value
      : state.settings.downloadFileNameTemplate;
    const zipTemplate = state.downloadZipNameTemplateEl
      ? state.downloadZipNameTemplateEl.value
      : state.settings.downloadZipNameTemplate;
    const regex = state.downloadNameRegexEl ? state.downloadNameRegexEl.value : state.settings.downloadNameRegex;
    const replacement = state.downloadNameReplacementEl ? state.downloadNameReplacementEl.value : state.settings.downloadNameReplacement;
    const demoJob = {
      username: 'BetterX', displayName: '示例用户', statusId: '1234567890',
      postText: '这是用于预览下载文件名的帖子正文', postDate: new Date(2026, 0, 2, 3, 4, 5), createdAt: Date.now(),
      fileNameTemplate: fileTemplate, zipNameTemplate: zipTemplate,
      downloadNameRegex: isSafeRegexSource(regex) ? regex : '', downloadNameReplacement: replacement,
      items: [{ url: 'https://pbs.twimg.com/media/example.jpg', ext: 'jpg', mediaType: 'image', index: 0 }],
    };
    const item = demoJob.items[0];
    state.downloadNamePreviewEl.textContent = `命名效果预览：${getDownloadItemFilename(demoJob, item)} · ${getDownloadZipFilename(demoJob)}`;
  }

  function insertDownloadNameToken(token) {
    const inputs = [state.downloadFileNameTemplateEl, state.downloadZipNameTemplateEl].filter(Boolean);
    const remembered = state.downloadNameTemplateTargetEl;
    const target = inputs.includes(remembered) ? remembered : state.downloadFileNameTemplateEl;
    if (!target) return;
    const start = Number.isFinite(target.selectionStart) ? target.selectionStart : target.value.length;
    const end = Number.isFinite(target.selectionEnd) ? target.selectionEnd : start;
    target.value = `${target.value.slice(0, start)}${token}${target.value.slice(end)}`;
    target.focus();
    target.selectionStart = target.selectionEnd = start + token.length;
    updateDownloadNamingPreview();
  }

  function extOfUrl(u, def) {
    const base = String(u || '').split('?')[0];
    const m = base.match(/\.([a-zA-Z0-9]{2,4})$/);
    return m ? m[1].toLowerCase() : (def || 'bin');
  }
  // X 对年龄限制帖子渲染的通用占位图 ID（非真实媒体，需要排除）
  const AGE_PLACEHOLDER_RE = /\/media\/GxJIrSUagAAK-ZP\b/;
  function upgradePhoto(u) {
    const base = String(u).split('?')[0];
    const ext = extOfUrl(base, 'jpg');
    return base + '?format=' + ext + '&name=orig';
  }

  // 提取图片的唯一 ID（忽略后缀与查询串），用于去重：
  // 注册表为 .../media/GXXX.jpg，DOM 为 .../media/GXXX?format=jpg&name=...，两者共享同一 ID。
  function photoKey(u) {
    const m = String(u || '').match(/\/media\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : String(u || '').split('?')[0];
  }

  function collectMedia(article, statusId) {
    const out = { photos: [], gifs: [], videos: [] };
    const seenPhoto = new Set();
    const seenGif = new Set();
    const seenVideo = new Set();
    const addPhoto = (u) => { if (!u) return; const k = photoKey(u); if (seenPhoto.has(k)) return; seenPhoto.add(k); out.photos.push(upgradePhoto(u)); };
    const addGif = (u) => { if (!u || seenGif.has(u)) return; seenGif.add(u); out.gifs.push(u); };
    const addVideo = (u) => { if (!u || seenVideo.has(u)) return; seenVideo.add(u); out.videos.push(u); };
    const reg = statusId ? getRegistryEntry(mediaRegistry, String(statusId)) : null;
    if (reg) {
      reg.photos.forEach(addPhoto);
      reg.gifs.forEach(addGif);
      reg.videos.forEach(addVideo);
    }
    // 某些移动端/Violentmonkey 环境会把真实 video.twimg.com 地址直接留在 video.src，
    // 无需等待 GraphQL；blob: 地址仍交给后面的按需单帖查询处理。
    article.querySelectorAll('video').forEach((video) => {
      const directUrl = safeHttpsUrl(video.currentSrc || video.src || video.getAttribute('src') || '', ['video.twimg.com']);
      if (!directUrl) return;
      if (/video\.twimg\.com\/tweet_video\//i.test(directUrl)) addGif(directUrl);
      else if (/video\.twimg\.com\/(?:ext_tw_video|amplify_tw_video|amplify_video)\//i.test(directUrl)) addVideo(directUrl);
    });
    // DOM 兜底：图片（仅正文媒体，排除头像/表情/卡片图标）
    article.querySelectorAll('[data-testid="tweetPhoto"] img, img[src*="pbs.twimg.com/media/"]').forEach((img) => {
      const src = img.currentSrc || img.src || '';
      if (AGE_PLACEHOLDER_RE.test(src)) return; // X 年龄限制通用占位图，不是真实媒体，跳过
      if (/pbs\.twimg\.com\/media\//.test(src)) addPhoto(src);
    });
    // DOM 兜底：GIF（由 tweet_video_thumb 海报推导 mp4）
    article.querySelectorAll('video[poster]').forEach((v) => {
      const poster = v.getAttribute('poster') || '';
      const g = poster.match(/tweet_video_thumb\/([A-Za-z0-9_-]+)\.(?:jpg|png|webp)/);
      if (g) addGif('https://video.twimg.com/tweet_video/' + g[1] + '.mp4');
    });
    // 嵌套引用帖的视频只有 blob: 播放地址，但其海报仍带稳定的媒体 ID。
    // 用网络响应中建立的海报映射找回真实 MP4，不依赖外层 / 内层帖子 ID 是否一致。
    article.querySelectorAll(
      'video[poster], img[src*="/amplify_tw_video_thumb/"], img[src*="/amplify_video_thumb/"], '
      + 'img[src*="/ext_tw_video_thumb/"], img[src*="/tweet_video_thumb/"]'
    ).forEach((element) => {
      const poster = element.getAttribute('poster') || element.currentSrc || element.src || '';
      const posterKey = getVideoPosterKey(poster);
      const matched = posterKey ? getRegistryEntry(videoPosterRegistry, posterKey) : null;
      if (!matched || !matched.url) return;
      if (matched.type === 'gif') addGif(matched.url);
      else addVideo(matched.url);
    });
    return out;
  }

  // 用 arraybuffer 拉取后在本 realm 包成 Blob，避免 GM 跨 realm 的 Blob 导致 JSZip 读取卡死
  function makeDownloadTimeoutError() {
    const error = new Error('下载超时');
    error.code = 'DOWNLOAD_TIMEOUT';
    return error;
  }

  function makeDownloadCancelledError() {
    const error = new Error('下载已取消');
    error.code = 'DOWNLOAD_CANCELLED';
    return error;
  }

  function fetchBlob(url, options) {
    const opts = options || {};
    const timeoutMs = state.settings.downloadTimeout || DEFAULT_SETTINGS.downloadTimeout;
    if (opts.signal && opts.signal.aborted) return Promise.reject(makeDownloadCancelledError());

    if (typeof GM_xmlhttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        let settled = false;
        let request = null;
        const finish = (callback, value) => {
          if (settled) return;
          settled = true;
          if (opts.signal) opts.signal.removeEventListener('abort', abortRequest);
          if (typeof opts.onRequestHandle === 'function') opts.onRequestHandle(request, false);
          callback(value);
        };
        const abortRequest = () => {
          try { if (request && typeof request.abort === 'function') request.abort(); } catch (err) {}
          finish(reject, makeDownloadCancelledError());
        };
        try {
          request = GM_xmlhttpRequest({
            method: 'GET', url, responseType: 'arraybuffer', timeout: timeoutMs,
            onprogress: (event) => {
              if (settled || (opts.signal && opts.signal.aborted)) return;
              if (typeof opts.onProgress === 'function') {
                opts.onProgress(Number(event.loaded) || 0, Number(event.total) || 0, event.lengthComputable === true);
              }
            },
            onload: (response) => {
              if (opts.signal && opts.signal.aborted) {
                finish(reject, makeDownloadCancelledError());
                return;
              }
              if (response.status >= 200 && response.status < 300 && response.response) {
                const ct = ((response.responseHeaders || '').match(/content-type:\s*([^\r\n;]+)/i) || [])[1];
                finish(resolve, new Blob([response.response], ct ? { type: ct.trim() } : undefined));
              } else {
                finish(reject, new Error('HTTP ' + response.status));
              }
            },
            onerror: () => finish(reject, new Error('网络错误')),
            ontimeout: () => finish(reject, makeDownloadTimeoutError()),
            onabort: () => finish(reject, makeDownloadCancelledError()),
          });
          if (typeof opts.onRequestHandle === 'function') opts.onRequestHandle(request, true);
          if (opts.signal) {
            opts.signal.addEventListener('abort', abortRequest, { once: true });
            if (opts.signal.aborted) abortRequest();
          }
        } catch (error) {
          finish(reject, error);
        }
      });
    }

    return (async () => {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      let didTimeout = false;
      const relayAbort = () => { if (controller) controller.abort(); };
      if (opts.signal && controller) opts.signal.addEventListener('abort', relayAbort, { once: true });
      const timer = controller ? setTimeout(() => { didTimeout = true; controller.abort(); }, timeoutMs) : null;
      try {
        const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const total = Number(response.headers && response.headers.get('content-length')) || 0;
        const contentType = (response.headers && response.headers.get('content-type')) || '';
        if (response.body && typeof response.body.getReader === 'function') {
          const reader = response.body.getReader();
          const chunks = [];
          let loaded = 0;
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            chunks.push(part.value);
            loaded += part.value.byteLength;
            if (typeof opts.onProgress === 'function') opts.onProgress(loaded, total, total > 0);
          }
          return new Blob(chunks, contentType ? { type: contentType } : undefined);
        }
        const blob = await response.blob();
        if (typeof opts.onProgress === 'function') opts.onProgress(blob.size, blob.size, true);
        return blob;
      } catch (error) {
        if (opts.signal && opts.signal.aborted) throw makeDownloadCancelledError();
        if (didTimeout || (error && error.name === 'AbortError')) throw makeDownloadTimeoutError();
        if (error && /^HTTP /.test(error.message || '')) throw error;
        throw new Error('跨域下载失败：请使用支持 GM_xmlhttpRequest 的脚本管理器');
      } finally {
        if (timer) clearTimeout(timer);
        if (opts.signal && controller) opts.signal.removeEventListener('abort', relayAbort);
      }
    })();
  }

  async function fetchBlobWithRetry(url, options) {
    let lastError = null;
    for (let attempt = 0; attempt <= DOWNLOAD_MAX_RETRIES; attempt++) {
      try {
        return await fetchBlob(url, options);
      } catch (error) {
        lastError = error;
        if (error && error.code === 'DOWNLOAD_CANCELLED') throw error;
        if (attempt >= DOWNLOAD_MAX_RETRIES || /^HTTP 4\d\d/.test((error && error.message) || '')) throw error;
        if (options && typeof options.onRetry === 'function') options.onRetry(attempt + 1, error);
      }
    }
    throw lastError || new Error('下载失败');
  }

  // 将 Blob 读为 ArrayBuffer（优先用原生方法，否则回退 FileReader）
  function blobToArrayBuffer(blob) {
    if (blob && typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error || new Error('读取失败'));
      fr.readAsArrayBuffer(blob);
    });
  }

  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  // 内置无压缩(STORE) ZIP 打包器：纯同步、无外部依赖、不依赖 Promise/调度器
  // （JSZip 3.x 的 generateAsync 依赖 setImmediate/MessageChannel 调度，在 Tampermonkey
  //   沙盒里通过 new Function 加载时该调度器不触发，导致永远卡死，故自写同步版）
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function toDosDateTime(value) {
    const input = value instanceof Date ? new Date(value.getTime()) : new Date(value || Date.now());
    const date = Number.isFinite(input.getTime()) ? input : new Date();
    const year = Math.max(1980, Math.min(2107, date.getFullYear()));
    const month = year === 1980 && date.getFullYear() < 1980 ? 1 : date.getMonth() + 1;
    const day = year === 1980 && date.getFullYear() < 1980 ? 1 : date.getDate();
    const dosTime = ((date.getHours() & 0x1F) << 11)
      | ((date.getMinutes() & 0x3F) << 5)
      | (Math.floor(date.getSeconds() / 2) & 0x1F);
    const dosDate = ((year - 1980) << 9) | ((month & 0x0F) << 5) | (day & 0x1F);
    return { dosTime, dosDate };
  }

  function makeClassicZipLimitError() {
    const error = new Error('媒体总量超出经典 ZIP 范围，请改为逐个下载');
    error.code = 'ZIP_CLASSIC_LIMIT';
    return error;
  }

  function prepareClassicZipEntries(files, modifiedAt) {
    if (!Array.isArray(files) || files.length > CLASSIC_ZIP_MAX_FILES) throw makeClassicZipLimitError();
    const enc = new TextEncoder();
    const fallbackTime = modifiedAt || new Date();
    let offset = 0;
    let centralSize = 0;
    const prepared = files.map((file) => {
      const nameBytes = enc.encode(file.name);
      const size = Number(file.data && file.data.length);
      if (!Number.isSafeInteger(size) || size < 0 || size > CLASSIC_ZIP_MAX_VALUE
          || nameBytes.length > CLASSIC_ZIP_MAX_FILES) throw makeClassicZipLimitError();
      const localSize = 30 + nameBytes.length + size;
      const centralEntrySize = 46 + nameBytes.length;
      if (offset + localSize > CLASSIC_ZIP_MAX_VALUE
          || centralSize + centralEntrySize > CLASSIC_ZIP_MAX_VALUE) throw makeClassicZipLimitError();
      const entry = {
        nameBytes,
        data: file.data,
        size,
        offset,
        ...toDosDateTime(file.modifiedAt || fallbackTime),
      };
      offset += localSize;
      centralSize += centralEntrySize;
      return entry;
    });
    if (offset + centralSize + 22 > CLASSIC_ZIP_MAX_VALUE) throw makeClassicZipLimitError();
    return { prepared, centralStart: offset, centralSize };
  }

  // files: [{ name: string, data: Uint8Array }] -> Blob(application/zip)
  function buildStoreZip(files, modifiedAt) {
    const layout = prepareClassicZipEntries(files, modifiedAt);
    const chunks = [];
    const central = [];
    for (const entry of layout.prepared) {
      const { nameBytes, data, size, offset, dosTime, dosDate } = entry;
      const crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true);
      lh.setUint16(4, 20, true);
      lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, 0, true);
      lh.setUint16(10, dosTime, true);
      lh.setUint16(12, dosDate, true);
      lh.setUint32(14, crc, true);
      lh.setUint32(18, size, true);
      lh.setUint32(22, size, true);
      lh.setUint16(26, nameBytes.length, true);
      lh.setUint16(28, 0, true);
      chunks.push(new Uint8Array(lh.buffer), nameBytes, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true);
      ch.setUint16(4, 20, true);
      ch.setUint16(6, 20, true);
      ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true);
      ch.setUint16(12, dosTime, true);
      ch.setUint16(14, dosDate, true);
      ch.setUint32(16, crc, true);
      ch.setUint32(20, size, true);
      ch.setUint32(24, size, true);
      ch.setUint16(28, nameBytes.length, true);
      ch.setUint16(30, 0, true);
      ch.setUint16(32, 0, true);
      ch.setUint16(34, 0, true);
      ch.setUint16(36, 0, true);
      ch.setUint32(38, 0, true);
      ch.setUint32(42, offset, true);
      central.push({ header: new Uint8Array(ch.buffer), name: nameBytes });
    }
    for (const c of central) chunks.push(c.header, c.name);
    const eo = new DataView(new ArrayBuffer(22));
    eo.setUint32(0, 0x06054b50, true);
    eo.setUint16(4, 0, true);
    eo.setUint16(6, 0, true);
    eo.setUint16(8, files.length, true);
    eo.setUint16(10, files.length, true);
    eo.setUint32(12, layout.centralSize, true);
    eo.setUint32(16, layout.centralStart, true);
    eo.setUint16(20, 0, true);
    chunks.push(new Uint8Array(eo.buffer));
    return new Blob(chunks, { type: 'application/zip' });
  }

  const downloadJobs = new Map();
  const downloadTransferQueue = [];
  let activeDownloadTransfers = 0;
  let downloadUiRaf = 0;

  function isDownloadedPostRecorded(statusId) {
    if (!state.settings.trackDownloadedPosts) return false;
    return (state.settings.downloadedPostIds || []).includes(String(statusId || ''));
  }

  function recordDownloadedPost(statusId) {
    const id = String(statusId || '');
    if (!state.settings.trackDownloadedPosts || !/^\d{1,30}$/.test(id)) return;
    const existing = state.settings.downloadedPostIds || [];
    const next = [...existing.filter((item) => item !== id), id].slice(-MAX_DOWNLOADED_POST_IDS);
    if (next.length === existing.length && next.every((item, index) => item === existing[index])) return;
    state.settings.downloadedPostIds = next;
    queueDbWrite(async () => { await persistSettings(); });
    scheduleDownloadUiRefresh();
  }

  function collectDownloadItems(article, statusId) {
    const media = collectMedia(article, statusId);
    const items = [];
    media.photos.forEach((u) => items.push({ url: u, ext: extOfUrl(u, 'jpg'), mediaType: 'image' }));
    media.gifs.forEach((u) => items.push({ url: u, ext: 'mp4', mediaType: 'gif' }));
    media.videos.forEach((u) => items.push({ url: u, ext: 'mp4', mediaType: 'video' }));
    if (!items.length) {
      // 第三方引用卡片（内嵌视频 / 缩略图）：标准媒体为空时回退到卡片注册表
      const card = statusId ? getRegistryEntry(cardRegistry, String(statusId)) : null;
      if (card) {
        card.photos.forEach((u) => items.push({ url: u, ext: extOfUrl(u, 'jpg'), mediaType: 'image' }));
        card.gifs.forEach((u) => items.push({ url: u, ext: 'mp4', mediaType: 'gif' }));
        card.videos.forEach((u) => items.push({ url: u, ext: 'mp4', mediaType: 'video' }));
      }
    }
    return items;
  }

  function articleMayContainVideo(article) {
    if (!article || !article.querySelector) return false;
    return !!article.querySelector(
      'video, [data-testid="videoComponent"], [data-testid="videoPlayer"], [data-testid="playButton"], '
      + 'img[src*="ext_tw_video_thumb"], img[src*="amplify_tw_video_thumb"], '
      + 'img[src*="amplify_video_thumb"], img[src*="tweet_video_thumb"]'
    );
  }

  function needsOnDemandVideoLookup(article, statusId) {
    if (!articleMayContainVideo(article)) return false;
    const id = String(statusId || '');
    const registered = mediaRegistry.get(id) || cardRegistry.get(id);
    return !registered || !((registered.videos && registered.videos.length) || (registered.gifs && registered.gifs.length));
  }

  function getMissingMediaMessage(article) {
    if (IS_VIOLENTMONKEY && articleMayContainVideo(article)) {
      return '⚠️ 未能取得视频地址：检测到 Violentmonkey。安卓 Firefox 上可能无法正确携带 X 登录态，请改用 Tampermonkey 后重试';
    }
    return isFirefoxCompatibilityActive()
      ? '未能取得媒体地址，请确认已登录 X 后重试'
      : '未找到可下载的媒体，若为视频请先点开或播放一下再试';
  }

  function formatDownloadBytes(value) {
    const bytes = Math.max(0, Number(value) || 0);
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes < 10485760 ? 1 : 0)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function isActiveDownloadJob(job) {
    return !!job && ['queued', 'downloading', 'packing', 'saving', 'cancelling'].includes(job.status);
  }

  function getDownloadJobProgress(job) {
    if (!job) return { loaded: 0, total: 0, percent: 0, allKnown: false };
    let loaded = 0;
    let total = 0;
    let allKnown = job.itemProgress.length > 0;
    for (const progress of job.itemProgress) {
      loaded += progress.loaded || 0;
      total += progress.total || 0;
      if (!progress.totalKnown) allKnown = false;
    }
    const percent = allKnown && total > 0 ? Math.max(0, Math.min(100, Math.round((loaded / total) * 100))) : 0;
    return { loaded, total, percent, allKnown };
  }

  function describeDownloadJob(job, compact) {
    const progress = getDownloadJobProgress(job);
    if (job.status === 'queued') return compact ? '排队' : '排队中';
    if (job.status === 'packing') return compact ? '打包' : `正在打包 ${job.packCompleted || 0}/${job.packTotal || job.items.length}`;
    if (job.status === 'saving') return compact ? '保存' : '正在保存';
    if (job.status === 'cancelling') return compact ? '取消中' : '正在取消下载';
    if (job.status === 'done') return job.failedCount ? `完成，跳过 ${job.failedCount}` : '下载完成';
    if (job.status === 'cancelled') return job.savedCount ? `已取消，已保存 ${job.savedCount}` : '已取消';
    if (job.status === 'error') return `失败：${job.errorMessage || '未知错误'}`;
    if (progress.allKnown) return `${progress.percent}%`;
    if (progress.loaded > 0) return formatDownloadBytes(progress.loaded);
    return compact ? '下载' : `下载中 ${job.completedCount || 0}/${job.items.length}`;
  }

  function scheduleDownloadUiRefresh() {
    if (downloadUiRaf) return;
    const run = () => { downloadUiRaf = 0; refreshDownloadUi(); };
    downloadUiRaf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(run) : setTimeout(run, 16);
  }

  function renderDownloadTaskPopover() {
    if (!state.downloadPopoverEl || state.downloadPopoverEl.hidden) return;
    const jobs = [...downloadJobs.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!jobs.length) {
      if (state.downloadPopoverEl.dataset.renderSignature !== 'empty') {
        state.downloadPopoverEl.innerHTML = '<div class="BetterX-download-empty">暂无下载任务</div>';
        state.downloadPopoverEl.dataset.renderSignature = 'empty';
      }
      return;
    }
    const models = jobs.map((job) => ({
      job,
      canCancel: isActiveDownloadJob(job) && job.status !== 'cancelling',
      canRetry: job.status === 'error' || job.status === 'cancelled',
    }));
    // 进度事件很频繁。只在任务结构/操作按钮变化时重建，避免 PC 鼠标按下与松开之间按钮被替换。
    const renderSignature = models.map(({ job, canCancel, canRetry }) => `${job.id}:${canCancel ? 1 : 0}:${canRetry ? 1 : 0}`).join('|');
    if (state.downloadPopoverEl.dataset.renderSignature !== renderSignature) {
      state.downloadPopoverEl.innerHTML = `
        <div class="BetterX-download-popover-title">下载任务</div>
        ${models.map(({ job, canCancel, canRetry }) => `<div class="BetterX-download-task" data-job-id="${escapeHtml(job.id)}">
            <div class="BetterX-download-task-main">
              <strong>${escapeHtml(job.baseName)}</strong>
              <span></span>
            </div>
            <div class="BetterX-download-task-actions">
              ${canCancel ? `<button type="button" data-action="download-cancel" data-job-id="${escapeHtml(job.id)}">取消</button>` : ''}
              ${canRetry ? `<button type="button" data-action="download-retry" data-job-id="${escapeHtml(job.id)}">重试</button>` : ''}
            </div>
          </div>`).join('')}
      `;
      state.downloadPopoverEl.dataset.renderSignature = renderSignature;
    }
    const taskElements = new Map(
      [...state.downloadPopoverEl.querySelectorAll('.BetterX-download-task[data-job-id]')]
        .map((element) => [element.dataset.jobId || '', element])
    );
    models.forEach(({ job }) => {
      const task = taskElements.get(String(job.id));
      if (!task) return;
      const progress = getDownloadJobProgress(job);
      task.style.setProperty('--xv-task-progress', progress.allKnown ? `${progress.percent}%` : '0%');
      const status = task.querySelector('.BetterX-download-task-main span');
      if (status) status.textContent = describeDownloadJob(job, false);
    });
  }

  function refreshDownloadUi() {
    const controls = document.querySelectorAll('.BetterX-download-controls[data-status-id]');
    controls.forEach((control) => {
      const job = downloadJobs.get(control.dataset.statusId || '');
      const button = control.querySelector('.BetterX-dl-btn');
      const cancel = control.querySelector('.BetterX-dl-cancel');
      if (!button) return;
      const active = isActiveDownloadJob(job);
      const downloadedBefore = !active && isDownloadedPostRecorded(control.dataset.statusId || '');
      const progress = getDownloadJobProgress(job);
      control.dataset.downloadState = job ? job.status : 'idle';
      button.classList.toggle('is-progress', active);
      button.classList.toggle('is-downloaded', downloadedBefore);
      button.style.setProperty('--xv-download-progress', `${progress.percent * 3.6}deg`);
      if (job && !downloadedBefore) {
        button.textContent = describeDownloadJob(job, true);
      } else if (downloadedBefore) {
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v9.17l3.59-3.59L18 10l-6 6-6-6 1.41-1.42L11 12.17V3zM4 14v4a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4h-2v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4z"/></svg>';
      } else {
        button.textContent = '⬇';
      }
      button.title = job && !downloadedBefore
        ? uiText(describeDownloadJob(job, false))
        : uiText(downloadedBefore ? '已下载过媒体；点击可再次下载' : '下载图片/视频/GIF');
      button.setAttribute('aria-label', button.title);
      if (cancel) cancel.hidden = !active;
      localizeBetterXTree(control);
    });

    if (!state.downloadPillEl) return;
    const jobs = [...downloadJobs.values()];
    const activeJobs = jobs.filter(isActiveDownloadJob);
    state.downloadPillEl.hidden = jobs.length === 0;
    if (!jobs.length) {
      if (state.downloadPopoverEl) state.downloadPopoverEl.hidden = true;
      return;
    }
    const loaded = activeJobs.reduce((sum, job) => sum + getDownloadJobProgress(job).loaded, 0);
    const total = activeJobs.reduce((sum, job) => sum + getDownloadJobProgress(job).total, 0);
    const allKnown = activeJobs.length > 0 && activeJobs.every((job) => getDownloadJobProgress(job).allKnown);
    const percent = allKnown && total > 0 ? Math.round((loaded / total) * 100) : 0;
    const isMobile = state.rootEl && state.rootEl.classList.contains('BetterX-mobile');
    const recentJob = jobs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    const label = uiText(activeJobs.length
      ? `${activeJobs.length} 个任务 · ${allKnown ? percent + '%' : formatDownloadBytes(loaded)}`
      : describeDownloadJob(recentJob, false));
    const labelEl = state.downloadPillEl.querySelector('.BetterX-download-pill-label');
    const countEl = state.downloadPillEl.querySelector('.BetterX-download-pill-count');
    if (labelEl) labelEl.textContent = label;
    if (countEl) {
      countEl.hidden = !isMobile || activeJobs.length === 0;
      countEl.textContent = activeJobs.length > 99 ? '99+' : String(activeJobs.length);
    }
    state.downloadPillEl.setAttribute('aria-label', uiText(activeJobs.length ? `查看下载任务：${label}` : `查看下载任务：${describeDownloadJob(recentJob, false)}`));
    state.downloadPillEl.style.setProperty('--xv-download-progress', `${percent * 3.6}deg`);
    state.downloadPillEl.classList.toggle('is-progress', activeJobs.length > 0);
    renderDownloadTaskPopover();
  }

  function toggleDownloadPopover(force) {
    if (!state.downloadPopoverEl || !downloadJobs.size) return;
    const next = typeof force === 'boolean' ? force : state.downloadPopoverEl.hidden;
    state.downloadPopoverEl.hidden = !next;
    if (next) renderDownloadTaskPopover();
  }

  function getDownloadConcurrencyLimit() {
    return clampInt(
      state.settings.downloadConcurrency,
      DOWNLOAD_MIN_CONCURRENCY,
      DOWNLOAD_MAX_CONCURRENCY,
      DEFAULT_SETTINGS.downloadConcurrency
    );
  }

  function pumpDownloadTransferQueue() {
    const concurrencyLimit = getDownloadConcurrencyLimit();
    while (activeDownloadTransfers < concurrencyLimit && downloadTransferQueue.length) {
      const entry = downloadTransferQueue.shift();
      if (entry.job.cancelRequested) { entry.reject(makeDownloadCancelledError()); continue; }
      activeDownloadTransfers++;
      Promise.resolve().then(entry.task).then(entry.resolve, entry.reject).finally(() => {
        activeDownloadTransfers--;
        pumpDownloadTransferQueue();
      });
    }
  }

  function runWithDownloadSlot(job, task) {
    return new Promise((resolve, reject) => {
      downloadTransferQueue.push({ job, task, resolve, reject });
      pumpDownloadTransferQueue();
    });
  }

  function cancelDownloadJob(jobId) {
    const job = downloadJobs.get(String(jobId || ''));
    if (!isActiveDownloadJob(job) || job.cancelRequested || job.status === 'cancelling') return;
    job.cancelRequested = true;
    job.status = 'cancelling';
    job.cancelHandles = new Set([...(job.cancelHandles || []), ...(job.requests || [])]);
    job.controllers.forEach((controller) => { try { controller.abort(); } catch (err) {} });
    (job.requests || []).forEach((request) => { try { if (request && typeof request.abort === 'function') request.abort(); } catch (err) {} });
    const repeatAbort = () => {
      (job.cancelHandles || []).forEach((request) => {
        try { if (request && typeof request.abort === 'function') request.abort(); } catch (err) {}
      });
    };
    (job.cancelAbortTimers || []).forEach((timer) => clearTimeout(timer));
    job.cancelAbortTimers = [80, 250, 700, 1500].map((delay) => setTimeout(repeatAbort, delay));
    job.cancelAbortTimers.push(setTimeout(() => {
      if (job.cancelHandles) job.cancelHandles.clear();
      job.cancelAbortTimers = [];
    }, 2500));
    for (let index = downloadTransferQueue.length - 1; index >= 0; index--) {
      const queued = downloadTransferQueue[index];
      if (queued.job !== job) continue;
      downloadTransferQueue.splice(index, 1);
      queued.reject(makeDownloadCancelledError());
    }
    job.updatedAt = now();
    scheduleDownloadUiRefresh();
  }

  function scheduleDownloadJobCleanup(job, delay) {
    if (job.cleanupTimer) clearTimeout(job.cleanupTimer);
    job.cleanupTimer = setTimeout(() => {
      if (downloadJobs.get(job.id) === job && !isActiveDownloadJob(job)) downloadJobs.delete(job.id);
      scheduleDownloadUiRefresh();
    }, delay);
  }

  function saveIndividualDownload(job, result) {
    if (!result || !result.blob) return;
    job.updatedAt = now();
    saveBlob(result.blob, getDownloadItemFilename(job, result));
    result.blob = null;
    result.saved = true;
    job.savedCount++;
    scheduleDownloadUiRefresh();
  }

  async function runDownloadJob(job) {
    job.status = 'downloading';
    job.updatedAt = now();
    scheduleDownloadUiRefresh();
    const zipMemoryLimit = isMobileBadgeViewport()
      ? DOWNLOAD_ZIP_MEMORY_LIMIT_MOBILE
      : DOWNLOAD_ZIP_MEMORY_LIMIT_DESKTOP;
    const retainedResults = [];
    let retainedBytes = 0;
    // 此任务开始时固定读取开关，避免用户在下载途中切换设置导致同一任务的保存方式混杂。
    let individualMode = job.zipEnabled === false;

    const acceptResult = (result) => {
      if (job.items.length === 1) {
        job.status = 'saving';
        saveBlob(result.blob, getDownloadItemFilename(job, result));
        result.blob = null;
        result.saved = true;
        job.savedCount++;
        return;
      }
      if (!individualMode && retainedBytes + result.blob.size > zipMemoryLimit) {
        individualMode = true;
        job.fallbackIndividual = true;
        retainedResults.splice(0).forEach((saved) => saveIndividualDownload(job, saved));
        retainedBytes = 0;
      }
      if (individualMode) saveIndividualDownload(job, result);
      else {
        retainedResults.push(result);
        retainedBytes += result.blob.size;
      }
    };

    const outcomes = await Promise.all(job.items.map((item, index) => runWithDownloadSlot(job, async () => {
      if (job.cancelRequested) throw makeDownloadCancelledError();
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (controller) job.controllers.add(controller);
      job.itemProgress[index].status = 'downloading';
      try {
        const blob = await fetchBlobWithRetry(item.url, {
          signal: controller ? controller.signal : null,
          onRequestHandle: (request, active) => {
            if (!request || !job.requests) return;
            if (active) {
              job.requests.add(request);
              if (job.cancelRequested && typeof request.abort === 'function') {
                job.cancelHandles.add(request);
                try { request.abort(); } catch (err) {}
              }
            } else job.requests.delete(request);
          },
          onProgress: (loaded, total, totalKnown) => {
            if (job.cancelRequested) return;
            const progress = job.itemProgress[index];
            progress.loaded = loaded;
            progress.total = totalKnown ? total : 0;
            progress.totalKnown = totalKnown && total > 0;
            job.updatedAt = now();
            scheduleDownloadUiRefresh();
          },
          onRetry: () => {
            const progress = job.itemProgress[index];
            progress.loaded = 0;
            progress.total = 0;
            progress.totalKnown = false;
            job.retryCount++;
            scheduleDownloadUiRefresh();
          },
        });
        const progress = job.itemProgress[index];
        progress.loaded = blob.size;
        progress.total = blob.size;
        progress.totalKnown = true;
        progress.status = 'done';
        job.completedCount++;
        const result = { blob, ext: item.ext, mediaType: item.mediaType, url: item.url, index };
        acceptResult(result);
        return { ok: true, result };
      } catch (error) {
        job.itemProgress[index].status = error && error.code === 'DOWNLOAD_CANCELLED' ? 'cancelled' : 'error';
        return { ok: false, error, index };
      } finally {
        if (controller) job.controllers.delete(controller);
        job.updatedAt = now();
        scheduleDownloadUiRefresh();
      }
    }).catch((error) => {
      job.itemProgress[index].status = error && error.code === 'DOWNLOAD_CANCELLED' ? 'cancelled' : 'error';
      return { ok: false, error, index };
    })));

    if (job.cancelRequested) {
      retainedResults.forEach((result) => { result.blob = null; });
      job.status = 'cancelled';
      job.updatedAt = now();
      scheduleDownloadJobCleanup(job, 5000);
      scheduleDownloadUiRefresh();
      return;
    }

    const failures = outcomes.filter((outcome) => !outcome.ok && (!outcome.error || outcome.error.code !== 'DOWNLOAD_CANCELLED'));
    job.failedCount = failures.length;
    if (!job.savedCount && !retainedResults.length) {
      job.status = 'error';
      job.errorMessage = failures[0] && failures[0].error ? failures[0].error.message : '全部媒体下载失败';
      job.updatedAt = now();
      scheduleDownloadJobCleanup(job, 30000);
      scheduleDownloadUiRefresh();
      return;
    }

    if (!individualMode && retainedResults.length === 1) {
      saveIndividualDownload(job, retainedResults[0]);
      retainedResults.length = 0;
    } else if (!individualMode && retainedResults.length > 1) {
      job.status = 'packing';
      job.packCompleted = 0;
      job.packTotal = retainedResults.length;
      scheduleDownloadUiRefresh();
      const files = [];
      try {
        for (const result of retainedResults) {
          if (job.cancelRequested) throw makeDownloadCancelledError();
          const buffer = await blobToArrayBuffer(result.blob);
          if (job.cancelRequested) throw makeDownloadCancelledError();
          result.blob = null;
          files.push({ resultIndex: result.index, name: getDownloadItemFilename(job, result), data: new Uint8Array(buffer), modifiedAt: new Date() });
          job.packCompleted++;
          scheduleDownloadUiRefresh();
        }
        if (job.cancelRequested) throw makeDownloadCancelledError();
        const content = buildStoreZip(files, new Date());
        if (job.cancelRequested) throw makeDownloadCancelledError();
        job.status = 'saving';
        saveBlob(content, getDownloadZipFilename(job));
        job.savedCount = files.length;
        files.length = 0;
      } catch (error) {
        if (error && error.code === 'DOWNLOAD_CANCELLED') {
          retainedResults.forEach((result) => { result.blob = null; });
          files.length = 0;
          throw error;
        }
        job.fallbackIndividual = true;
        job.status = 'saving';
        let fallbackSaved = 0;
        for (let index = 0; index < retainedResults.length; index++) {
          const result = retainedResults[index];
          const prepared = files.find((file) => file.resultIndex === result.index);
          const fallbackBlob = result.blob || (prepared ? new Blob([prepared.data]) : null);
          if (fallbackBlob) {
            saveBlob(fallbackBlob, getDownloadItemFilename(job, result));
            fallbackSaved++;
          }
          result.blob = null;
        }
        job.savedCount += fallbackSaved;
        files.length = 0;
        if (error && error.code !== 'ZIP_CLASSIC_LIMIT') console.error('[BetterX] ZIP 打包失败，已改为逐个保存:', error);
      }
      retainedResults.length = 0;
    }

    job.status = 'done';
    job.updatedAt = now();
    job.errorMessage = '';
    if (job.savedCount > 0) recordDownloadedPost(job.statusId);
    scheduleDownloadJobCleanup(job, 8000);
    scheduleDownloadUiRefresh();
    showToast(job.fallbackIndividual || job.individualDownloads
      ? `✅ 下载完成：已逐个保存 ${job.savedCount} 个文件`
      : `✅ 下载完成${job.failedCount ? `，跳过 ${job.failedCount} 个失败项` : ''}`,
    5000);
  }

  function startDownloadJob(items, author, statusId, postText, postDate) {
    const id = String(statusId || '');
    const previous = downloadJobs.get(id);
    if (isActiveDownloadJob(previous)) { toggleDownloadPopover(true); return previous; }
    if (previous && previous.cleanupTimer) clearTimeout(previous.cleanupTimer);
    const uname = String((author && author.username) || 'x').replace(/^@/, '') || 'x';
    const job = {
      id, statusId: id, username: uname, displayName: String((author && author.displayName) || '').trim(),
      postText: String(postText || '').slice(0, 2000), postDate: postDate || '', items: items.map((item) => ({ ...item })),
      fileNameTemplate: state.settings.downloadFileNameTemplate || DEFAULT_SETTINGS.downloadFileNameTemplate,
      zipNameTemplate: state.settings.downloadZipNameTemplate || DEFAULT_SETTINGS.downloadZipNameTemplate,
      downloadNameRegex: state.settings.downloadNameRegex || '',
      downloadNameReplacement: state.settings.downloadNameReplacement || '',
      itemProgress: items.map(() => ({ loaded: 0, total: 0, totalKnown: false, status: 'queued' })),
      status: 'queued', createdAt: now(), updatedAt: now(), completedCount: 0, failedCount: 0,
      savedCount: 0, retryCount: 0, packCompleted: 0, packTotal: 0, fallbackIndividual: false,
      zipEnabled: state.settings.downloadZip !== false, individualDownloads: state.settings.downloadZip === false,
      cancelRequested: false, controllers: new Set(), requests: new Set(), cancelHandles: new Set(),
      cancelAbortTimers: [], cleanupTimer: null, errorMessage: '',
    };
    job.baseName = buildDownloadNameBase(job, 'zip');
    downloadJobs.set(id, job);
    scheduleDownloadUiRefresh();
    Promise.resolve(runDownloadJob(job)).catch((error) => {
      job.status = error && error.code === 'DOWNLOAD_CANCELLED' ? 'cancelled' : 'error';
      job.errorMessage = (error && error.message) || '未知错误';
      job.updatedAt = now();
      scheduleDownloadJobCleanup(job, job.status === 'cancelled' ? 5000 : 30000);
      scheduleDownloadUiRefresh();
    });
    return job;
  }

  function retryDownloadJob(jobId) {
    const previous = downloadJobs.get(String(jobId || ''));
    if (!previous || isActiveDownloadJob(previous)) return;
    return startDownloadJob(previous.items, {
      username: previous.username,
      displayName: previous.displayName,
    }, previous.statusId, previous.postText, previous.postDate);
  }

  async function handleDownloadClick(article, author, statusId) {
    const existing = downloadJobs.get(String(statusId || ''));
    if (isActiveDownloadJob(existing)) { toggleDownloadPopover(true); return; }
    if (isDownloadedPostRecorded(statusId)
      && !uiConfirm('该帖子内媒体文件曾下载过，是否继续下载？')) return;
    let items = collectDownloadItems(article, statusId);
    if (needsOnDemandVideoLookup(article, statusId)) {
      showToast('正在获取视频地址…');
      const found = await requestTweetDetailMedia(statusId);
      if (found) items = collectDownloadItems(article, statusId);
    }
    if (!items.length) {
      showToast(getMissingMediaMessage(article), IS_VIOLENTMONKEY ? 7000 : undefined);
      return;
    }
    const activeAfterLookup = downloadJobs.get(String(statusId || ''));
    if (isActiveDownloadJob(activeAfterLookup)) { toggleDownloadPopover(true); return; }
    const postDate = article.querySelector('time')?.getAttribute('datetime') || '';
    startDownloadJob(items, author, statusId, extractText(article), postDate);
  }

  function isDownloadExcludedArticle(article) {
    if (!article) return false;
    // 通知卡片会复用 tweetText / pbs.twimg.com/media，但它不是可下载的帖子操作区。
    if (article.matches && article.matches('[data-testid="notification"]')) return true;
    return !!(article.closest && article.closest('[data-testid="notification"]'));
  }

  function injectDownloadButtons(scope) {
    if (!state.settings.mediaDownload) return;
    const root = (scope && scope.querySelectorAll) ? scope : document;
    const articles = (root.matches && root.matches('article')) ? [root] : root.querySelectorAll('article');
    articles.forEach((article) => {
      if (article.closest('#BetterX-root')) return;
      if (isDownloadExcludedArticle(article)) {
        article.querySelectorAll('.BetterX-download-controls').forEach((control) => control.remove());
        return;
      }
      if (article.querySelector('.BetterX-download-controls')) return;
      const statusId = extractStatusIdFromUrl(getStatusLink(article));
      // 没有帖子 ID 的通知/推荐卡片无法稳定命名和隔离任务，不注入下载控件。
      if (!statusId) return;
      const hasDomMedia = article.querySelector('[data-testid="tweetPhoto"], [data-testid="videoComponent"], [data-testid="videoPlayer"], img[src*="pbs.twimg.com/media/"], video[poster]');
      const hasReg = statusId && (mediaRegistry.has(String(statusId)) || cardRegistry.has(String(statusId)));
      if (!hasDomMedia && !hasReg) return;
      const author = extractAuthor(article);
      const group = article.querySelector('[role="group"]');
      const controls = document.createElement('span');
      controls.className = 'BetterX-download-controls';
      controls.dataset.statusId = String(statusId || '');
      const btn = document.createElement('button');
      btn.className = 'BetterX-dl-btn';
      btn.type = 'button';
      btn.title = '下载图片/视频/GIF';
      btn.textContent = '⬇';
      btn.addEventListener('click', (event) => {
        event.preventDefault(); event.stopPropagation(); handleDownloadClick(article, author, statusId);
      }, true);
      const cancel = document.createElement('button');
      cancel.className = 'BetterX-dl-cancel';
      cancel.type = 'button';
      cancel.title = '取消下载';
      cancel.textContent = '×';
      cancel.hidden = true;
      cancel.addEventListener('click', (event) => {
        event.preventDefault(); event.stopPropagation(); cancelDownloadJob(statusId);
      }, true);
      controls.append(btn, cancel);
      localizeBetterXTree(controls);
      if (group) { controls.classList.add('in-group'); group.appendChild(controls); }
      else {
        controls.classList.add('floating');
        if (!article.style.position) article.style.position = 'relative';
        article.appendChild(controls);
      }
    });
    scheduleDownloadUiRefresh();
  }

  function removeDownloadButtons() {
    document.querySelectorAll('.BetterX-download-controls, .BetterX-dl-btn').forEach((el) => el.remove());
  }

  function applyMediaDownload() {
    if (state.settings.mediaDownload) injectDownloadButtons(document);
    else removeDownloadButtons();
  }

  // ── 恢复多媒体网格视图 ────────────────────────────────────────────
  // X 现将多媒体放进 ScrollSnap 轮播；只给含两项以上媒体的列表加类，
  // 保留原有链接、视频控件和 React 事件处理，关闭设置时也能无损还原。
