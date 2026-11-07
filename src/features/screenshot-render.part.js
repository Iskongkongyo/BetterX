  const SCREENSHOT_MAX_PIXELS = 16 * 1024 * 1024;
  const SCREENSHOT_MAX_DIMENSION = 16384;
  const SCREENSHOT_MAX_ASSET_BYTES = 12 * 1024 * 1024;
  let screenshotInFlight = false;
  let lastScreenshotReport = null;

  function screenshotImageType(bytes, declared) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
    const head = new TextDecoder().decode(bytes.subarray(0, 2048)).replace(/^\uFEFF/, '').trim();
    if (/^GIF8[79]a/.test(head)) return 'image/gif';
    if (/^RIFF[\s\S]{4}WEBP/.test(head)) return 'image/webp';
    if (/^(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) return 'image/svg+xml';
    return /^image\/(?:avif|bmp|x-icon)$/i.test(declared || '') ? declared : '';
  }

  function screenshotAssetUrl(raw) {
    if (typeof raw !== 'string' || !raw.trim()) return '';
    if (/^data:image\//i.test(raw || '')) return raw;
    try {
      const url = new URL(raw, location.href);
      if (url.protocol === 'blob:' && url.origin === location.origin) return url.href;
      if (url.origin === location.origin && /^https?:$/.test(url.protocol)) return url.href;
      return safeHttpsUrl(url.href, ['twimg.com']);
    } catch { return ''; }
  }

  function screenshotScale(width, height) {
    return Math.min(2, SCREENSHOT_MAX_DIMENSION / width, SCREENSHOT_MAX_DIMENSION / height,
      Math.sqrt(SCREENSHOT_MAX_PIXELS / (width * height)));
  }

  function screenshotAbortError() {
    const error = new Error('Screenshot cancelled or timed out');
    error.name = 'AbortError';
    return error;
  }

  function screenshotRequestBytes(url, signal) {
    if (signal.aborted) return Promise.reject(screenshotAbortError());
    if (typeof GM_xmlhttpRequest !== 'function' || /^blob:/.test(url)) {
      return screenshotFetchBytes(url, signal);
    }
    return new Promise((resolve, reject) => {
      let request, settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', abort);
        callback(value);
      };
      const abort = () => {
        finish(reject, screenshotAbortError());
        try { request?.abort(); } catch {}
      };
      signal.addEventListener('abort', abort, { once: true });
      try {
        request = GM_xmlhttpRequest({
          method: 'GET', url, responseType: 'arraybuffer', timeout: 12000, anonymous: true,
          onload: async (response) => {
            if (settled) return;
            try {
              if (!(response.status >= 200 && response.status < 300)) throw new Error(`HTTP ${response.status}`);
              if (response.finalUrl && !screenshotAssetUrl(response.finalUrl)) throw new Error('Unexpected image redirect');
              const raw = response.response;
              if (!raw || typeof raw !== 'object') throw new Error('Empty image response');
              // GM 的 ArrayBuffer / Blob 可能来自另一个 realm；不要用 instanceof 判断。
              const buffer = typeof raw.arrayBuffer === 'function' ? await raw.arrayBuffer() : raw;
              const bytes = ArrayBuffer.isView(buffer)
                ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) : new Uint8Array(buffer);
              if (!bytes.length || bytes.length > SCREENSHOT_MAX_ASSET_BYTES) throw new Error('Invalid image size');
              const type = ((response.responseHeaders || '').match(/content-type:\s*([^;\r\n]+)/i) || [])[1] || '';
              finish(resolve, { bytes, type: type.trim().toLowerCase() });
            } catch (error) { finish(reject, error); }
          },
          onprogress: (event) => {
            if (event.loaded > SCREENSHOT_MAX_ASSET_BYTES) {
              finish(reject, new Error('Image exceeds size limit'));
              try { request?.abort(); } catch {}
            }
          },
          onerror: () => finish(reject, new Error('Image request failed')),
          ontimeout: () => finish(reject, new Error('Image request timed out')),
          onabort: () => finish(reject, screenshotAbortError()),
        });
        if (signal.aborted) abort();
      } catch (error) { finish(reject, error); }
    });
  }

  async function screenshotFetchBytes(url, signal) {
    const response = await fetch(url, { signal, credentials: 'omit', redirect: 'error' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (Number(response.headers.get('content-length')) > SCREENSHOT_MAX_ASSET_BYTES) throw new Error('Image exceeds size limit');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length > SCREENSHOT_MAX_ASSET_BYTES) throw new Error('Invalid image size');
    return { bytes, type: (response.headers.get('content-type') || '').split(';')[0].toLowerCase() };
  }

  function screenshotLoadImage(source, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) { reject(screenshotAbortError()); return; }
      const image = new Image();
      const finish = (callback, value) => {
        image.onload = image.onerror = null;
        signal.removeEventListener('abort', abort);
        callback(value);
      };
      const abort = () => { image.src = ''; finish(reject, screenshotAbortError()); };
      image.onload = () => finish(resolve, image);
      image.onerror = () => finish(reject, new Error('Image decode failed'));
      signal.addEventListener('abort', abort, { once: true });
      image.src = source;
    });
  }

  function screenshotRasterImage(image) {
    const width = image.naturalWidth || image.videoWidth || image.width;
    const height = image.naturalHeight || image.videoHeight || image.height;
    if (!width || !height) throw new Error('Image has no decoded pixels');
    const scale = Math.min(1, 2048 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    try {
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } finally { canvas.width = canvas.height = 1; }
  }

  async function screenshotEmbedAsset(raw, context, kind) {
    const url = screenshotAssetUrl(raw);
    if (!url) throw new Error('Unsupported image URL');
    if (context.assets.has(url)) return context.assets.get(url);
    const task = (async () => {
      const entry = { kind, host: /^data:/.test(url) ? 'data' : new URL(url).hostname, ok: false };
      context.report.resources.push(entry);
      try {
        let source = url;
        if (!/^data:image\//.test(url)) {
          let result;
          try { result = await screenshotRequestBytes(url, context.signal); }
          catch (error) {
            if (context.signal.aborted || typeof GM_xmlhttpRequest !== 'function') throw error;
            entry.fallback = 'cors-fetch';
            result = await screenshotFetchBytes(url, context.signal);
          }
          const type = screenshotImageType(result.bytes, result.type);
          if (!type) throw new Error('Response is not a supported image');
          entry.bytes = result.bytes.length;
          entry.type = type;
          context.bytes += result.bytes.length;
          if (context.bytes > 36 * 1024 * 1024) throw new Error('Screenshot images exceed size limit');
          const blob = new Blob([result.bytes], { type });
          source = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Image encoding failed'));
            reader.readAsDataURL(blob);
          });
        }
        const image = await screenshotLoadImage(source, context.signal);
        const png = screenshotRasterImage(image);
        context.encodedBytes += png.length;
        if (context.encodedBytes > 48 * 1024 * 1024) throw new Error('Encoded screenshot images exceed size limit');
        entry.ok = true;
        return png;
      } catch (error) {
        entry.error = String(error.message || error).slice(0, 160);
        // 不缓存失败，也不把失败伪装成可成功解码的灰色图片。
        context.assets.delete(url);
        throw error;
      }
    })();
    context.assets.set(url, task);
    return task;
  }

  function copyScreenshotStyle(source, target, context, pseudo) {
    const computed = getComputedStyle(source, pseudo || null);
    for (const property of computed) {
      const value = computed.getPropertyValue(property);
      if (property === 'content' || property === 'cursor' || !value) continue;
      target.style.setProperty(property, value, computed.getPropertyPriority(property));
      if (!/url\(/i.test(value)) continue;
      const matches = [...value.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi)];
      const external = [];
      let localValue = value;
      for (const match of matches) {
        const raw = (match[1] || match[2] || match[3] || '').trim();
        const reference = screenshotLocalReference(raw);
        if (reference) {
          localValue = localValue.replace(match[0], `url("${reference}")`);
          context.definitions.add(reference.slice(1));
        } else external.push(match);
      }
      target.style.setProperty(property, localValue);
      if (!external.length) continue;
      context.jobs.push(async () => {
        let embedded = localValue;
        for (const match of external) {
          const raw = (match[1] || match[2] || match[3] || '').trim();
          if (!raw || raw.startsWith('#')) continue;
          const png = await screenshotEmbedAsset(raw, context, 'css');
          embedded = embedded.replace(match[0], `url("${png}")`);
        }
        target.style.setProperty(property, embedded);
      });
    }
    target.style.setProperty('animation', 'none', 'important');
    target.style.setProperty('transition', 'none', 'important');
    target.style.setProperty('caret-color', 'transparent', 'important');
    target.style.setProperty('content-visibility', 'visible', 'important');
    return computed;
  }

  function screenshotLocalReference(raw) {
    if (raw.startsWith('#')) return raw;
    try {
      const url = new URL(raw, location.href), page = new URL(location.href);
      if (url.hash && url.origin === page.origin && url.pathname === page.pathname && url.search === page.search) return url.hash;
    } catch {}
    return '';
  }

  function screenshotPseudo(source, type, context) {
    if (!(source instanceof HTMLElement)) return null;
    const content = getComputedStyle(source, type).content;
    if (!content || content === 'none' || content === 'normal' || !/^["']/.test(content)) return null;
    const node = document.createElement('span');
    node.textContent = content.slice(1, -1).replace(/\\([0-9a-f]{1,6})\s?/gi, (_all, hex) => {
      const value = parseInt(hex, 16); return value && value <= 0x10ffff ? String.fromCodePoint(value) : '';
    }).replace(/\\([\s\S])/g, '$1');
    copyScreenshotStyle(source, node, context, type);
    return node;
  }

  function cloneScreenshotNode(source, context, inheritSvg = false) {
    if (source.nodeType === 3) return document.createTextNode(source.nodeValue || '');
    if (source.nodeType !== 1 || /^(SCRIPT|STYLE|LINK|IFRAME|NOSCRIPT|SOURCE)$/.test(source.tagName)) return null;
    if (source.matches('.BetterX-download-controls, [data-betterx-screenshot-menu], [role="tooltip"]')) return null;
    if (++context.nodes > 3000) throw new Error('Post is too complex to capture');
    const style = getComputedStyle(source);
    if (style.display === 'none') return null;
    const tag = source.tagName.toUpperCase();
    const replaceMedia = tag === 'VIDEO' || tag === 'CANVAS';
    const clone = replaceMedia ? document.createElement('img') : source.cloneNode(false);
    for (const attribute of [...clone.attributes]) {
      if (['href', 'xlink:href'].includes(attribute.name) && clone.namespaceURI === 'http://www.w3.org/2000/svg'
          && !['USE', 'IMAGE'].includes(tag) && screenshotLocalReference(attribute.value)) {
        const reference = screenshotLocalReference(attribute.value);
        clone.setAttribute(attribute.name, reference);
        context.definitions.add(reference.slice(1));
        continue;
      }
      if (/^on/i.test(attribute.name) || ['src', 'srcset', 'sizes', 'href', 'xlink:href', 'loading', 'autofocus'].includes(attribute.name)) clone.removeAttribute(attribute.name);
    }
    copyScreenshotStyle(source, clone, context);
    if (style.visibility === 'hidden' || Number(style.opacity) === 0) return clone;
    if (inheritSvg && !source.hasAttribute('class')) {
      for (const property of ['color', 'fill', 'stroke', 'fill-opacity', 'stroke-opacity', 'stroke-width']) {
        if (!source.hasAttribute(property) && !source.style.getPropertyValue(property)) clone.style.setProperty(property, 'inherit');
      }
    }
    if (tag === 'IMG' || tag === 'IMAGE' || replaceMedia) {
      let raw = tag === 'IMG' ? source.currentSrc || source.src
        : tag === 'IMAGE' ? source.getAttribute('href') || source.getAttribute('xlink:href') : '';
      let pixels = '';
      if ((tag === 'IMG' && source.complete) || tag === 'CANVAS' || (tag === 'VIDEO' && source.readyState >= 2)) {
        try { pixels = screenshotRasterImage(source); } catch {}
      }
      if (pixels) {
        context.encodedBytes += pixels.length;
        if (context.encodedBytes > 48 * 1024 * 1024) throw new Error('Encoded screenshot images exceed size limit');
      }
      if (tag === 'VIDEO' && !pixels) {
        const thumbnail = [...(source.parentElement?.querySelectorAll('img[src]') || [])]
          .find(image => getVideoPosterKey(image.currentSrc || image.src));
        raw = source.poster || thumbnail?.currentSrc || thumbnail?.src || '';
        context.report.videoPosters++;
      }
      clone.removeAttribute('crossorigin');
      context.jobs.push(async () => {
        const image = pixels || await screenshotEmbedAsset(raw, context, tag.toLowerCase());
        if (tag === 'IMAGE') clone.setAttribute('href', image);
        else clone.setAttribute('src', image);
      });
      return clone;
    }
    if (tag === 'USE') {
      const href = source.getAttribute('href') || source.getAttribute('xlink:href') || '';
      if (href.startsWith('#')) {
        const referenced = document.getElementById(href.slice(1));
        if (referenced && !context.references.has(referenced)) {
          context.references.add(referenced);
          const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          copyScreenshotStyle(source, group, context);
          const content = cloneScreenshotNode(referenced, context, true);
          if (content?.tagName.toUpperCase() === 'SYMBOL') {
            const inner = document.createElementNS(group.namespaceURI, 'g');
            inner.style.cssText = content.style.cssText;
            inner.append(...content.childNodes); group.appendChild(inner);
          } else if (content) group.appendChild(content);
          context.references.delete(referenced);
          return group;
        }
      }
      return null;
    }
    const before = screenshotPseudo(source, '::before', context);
    if (before) clone.appendChild(before);
    for (const child of source.childNodes) {
      const cloned = cloneScreenshotNode(child, context, inheritSvg);
      if (cloned) clone.appendChild(cloned);
    }
    const after = screenshotPseudo(source, '::after', context);
    if (after) clone.appendChild(after);
    // 只移动副本，保留用户正在查看的轮播位置与原页面的样式。
    if (source.scrollLeft || source.scrollTop) {
      for (const child of clone.children) {
        child.style.transform = `translate(${-source.scrollLeft}px, ${-source.scrollTop}px) ${child.style.transform === 'none' ? '' : child.style.transform}`;
      }
    }
    return clone;
  }

  function screenshotBackground(article) {
    for (let element = article; element; element = element.parentElement) {
      const color = getComputedStyle(element).backgroundColor;
      if (color && color !== 'transparent' && !/^rgba\([^)]*,\s*0\)$/.test(color)) return color;
    }
    return getComputedStyle(article).color === 'rgb(231, 233, 234)' ? '#000000' : '#ffffff';
  }

  async function capturePostScreenshot(article, expectedId) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const report = { version: '4.3.0', startedAt: new Date().toISOString(), browser: navigator.userAgent,
      resources: [], videoPosters: 0, ok: false };
    lastScreenshotReport = report;
    const context = { signal: controller.signal, report, assets: new Map(), jobs: [], references: new Set(), definitions: new Set(), nodes: 0, bytes: 0, encodedBytes: 0 };
    let canvas;
    try {
      if (!article?.isConnected || (expectedId && extractStatusIdFromUrl(getStatusLink(article)) !== expectedId)) throw new Error('Post is no longer available');
      const rect = article.getBoundingClientRect();
      const width = Math.ceil(rect.width), height = Math.ceil(rect.height);
      if (!(width > 0 && height > 0)) throw new Error('Post has no visible layout');
      const author = extractAuthor(article);
      const background = screenshotBackground(article);
      const clone = cloneScreenshotNode(article, context);
      const definitions = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      for (const id of context.definitions) {
        const definition = document.getElementById(id);
        if (definition && !article.contains(definition)) {
          const cloned = cloneScreenshotNode(definition, context);
          if (cloned) definitions.appendChild(cloned);
        }
        if (context.definitions.size > 100) throw new Error('Too many SVG references');
      }
      const scale = screenshotScale(width, height);
      report.width = width; report.height = height; report.scale = scale;
      if (!clone || scale < 0.1) throw new Error('Post exceeds screenshot limits');
      Object.assign(clone.style, { position: 'relative', margin: '0', left: '0', top: '0', right: 'auto', bottom: 'auto',
        width: `${width}px`, height: `${height}px`, boxSizing: 'border-box', transform: 'none', backgroundColor: background });
      let cursor = 0;
      const worker = async () => {
        while (cursor < context.jobs.length) {
          if (controller.signal.aborted) throw screenshotAbortError();
          await context.jobs[cursor++]();
        }
      };
      const outcomes = await Promise.allSettled(Array.from({ length: Math.min(4, context.jobs.length) }, worker));
      const failure = outcomes.find((result) => result.status === 'rejected');
      if (failure) throw failure.reason;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', width); svg.setAttribute('height', height);
      svg.appendChild(definitions);
      const foreign = document.createElementNS(svg.namespaceURI, 'foreignObject');
      foreign.setAttribute('width', '100%'); foreign.setAttribute('height', '100%');
      foreign.appendChild(clone); svg.appendChild(foreign);
      const xml = new XMLSerializer().serializeToString(svg);
      const image = await screenshotLoadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`, controller.signal);
      canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(width * scale)); canvas.height = Math.max(1, Math.floor(height * scale));
      const drawing = canvas.getContext('2d');
      drawing.fillStyle = background; drawing.fillRect(0, 0, canvas.width, canvas.height);
      drawing.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG encoding failed')), 'image/png'));
      report.ok = true; report.outputBytes = blob.size;
      const name = String(author.username || 'x').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'x';
      const id = expectedId || extractStatusIdFromUrl(getStatusLink(article)) || Date.now();
      return { blob, filename: `BetterX_${name}_${id}.png`, report };
    } catch (error) {
      report.error = String(error.message || error).slice(0, 200);
      controller.abort();
      throw error;
    } finally {
      clearTimeout(timer);
      if (canvas) canvas.width = canvas.height = 1;
      context.assets.clear(); context.jobs.length = 0;
    }
  }

  function exportScreenshotDiagnostic() {
    if (!lastScreenshotReport) return;
    saveBlob(new Blob([JSON.stringify(lastScreenshotReport, null, 2)], { type: 'application/json' }), 'BetterX_screenshot_diagnostic.json');
  }

  async function runPostScreenshot(article, statusId) {
    if (screenshotInFlight) { showToast('正在生成另一张截图，请稍候'); return; }
    screenshotInFlight = true;
    showToast('正在生成帖子截图…', 0);
    try {
      const result = await capturePostScreenshot(article, statusId);
      saveBlob(result.blob, result.filename);
      showToast('帖子截图已保存');
      return result;
    } catch (error) {
      console.error('[BetterX] screenshot failed:', lastScreenshotReport);
      showToast('帖子截图失败，请重试');
      showBetterXDialog({ title: '无法生成完整截图',
        bodyHtml: `<p>${escapeHtml(uiText('部分图片未能读取或渲染失败。请重试；仍有问题时可导出诊断信息。'))}</p>`,
        primaryText: '重试', secondaryText: '关闭', tertiaryText: '导出截图诊断',
        onPrimary: () => runPostScreenshot(article, statusId), onTertiary: exportScreenshotDiagnostic });
    } finally { screenshotInFlight = false; }
  }
