export function compactCss(css) {
  let output = '';
  let quote = '';
  let pendingSpace = false;
  for (let index = 0; index < css.length; index++) {
    const char = css[index];
    const next = css[index + 1];
    if (quote) {
      output += char;
      if (char === '\\' && next) output += css[++index];
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      if (pendingSpace && output) output += ' ';
      pendingSpace = false;
      quote = char;
      output += char;
      continue;
    }
    if (char === '/' && next === '*') {
      const end = css.indexOf('*/', index + 2);
      index = end < 0 ? css.length : end + 1;
      pendingSpace = true;
      continue;
    }
    if (/\s/.test(char)) {
      pendingSpace = true;
      continue;
    }
    if (pendingSpace && output) output += ' ';
    pendingSpace = false;
    output += char;
  }
  return output.trim();
}

export function compactStyleTemplate(source) {
  const opening = 'addStyle(`';
  const start = source.indexOf(opening);
  if (start < 0) return source;
  const cssStart = start + opening.length;
  const end = source.indexOf('`);', cssStart);
  if (end < 0) return source;
  return source.slice(0, cssStart) + compactCss(source.slice(cssStart, end)) + source.slice(end);
}

export function compactMarkupWhitespace(markup) {
  let output = '';
  let quote = '';
  let pendingSpace = false;
  for (let index = 0; index < markup.length; index++) {
    const char = markup[index];
    const next = markup[index + 1];
    if (quote) {
      output += char;
      if (char === '\\' && next) output += markup[++index];
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      if (pendingSpace && output) output += ' ';
      pendingSpace = false;
      quote = char;
      output += char;
      continue;
    }
    if (/\s/.test(char)) {
      pendingSpace = true;
      continue;
    }
    if (pendingSpace && output) output += ' ';
    pendingSpace = false;
    output += char;
  }
  return output.trim();
}

export function compactPanelTemplate(source) {
  const opening = 'panel.innerHTML = uiHtml`';
  const start = source.indexOf(opening);
  const boundary = source.indexOf('const fileInput', start + opening.length);
  if (start < 0 || boundary < 0) return source;
  const htmlStart = start + opening.length;
  const end = source.lastIndexOf('`;', boundary);
  if (end < htmlStart) return source;
  return source.slice(0, htmlStart)
    + compactMarkupWhitespace(source.slice(htmlStart, end))
    + source.slice(end);
}

export function compactI18nEntries(source) {
  const opening = 'const UI_TEXT_ENTRIES = [';
  const start = source.indexOf(opening);
  const boundary = source.indexOf('function readUiLanguageOverride', start + opening.length);
  if (start < 0 || boundary < 0) return source;
  const end = source.lastIndexOf('];', boundary);
  if (end < start) return source;
  return source.slice(0, start)
    + compactMarkupWhitespace(source.slice(start, end + 2))
    + source.slice(end + 2);
}

export function compactAdultSpamRules(source) {
  const opening = 'const ADULT_SPAM_STRONG_TERMS = [';
  const start = source.indexOf(opening);
  const boundary = source.indexOf('function normalizeAdultSpamText', start + opening.length);
  if (start < 0 || boundary < 0) return source;
  return source.slice(0, start)
    + compactMarkupWhitespace(source.slice(start, boundary))
    + '\n\n  '
    + source.slice(boundary);
}

export function stripStandaloneSourceComments(source) {
  const stack = [{ type: 'code', templateExpression: false, braceDepth: 0 }];
  let metadata = source.startsWith('// ==UserScript==');
  const canStartRegex = (line, index) => {
    const prefix = line.slice(0, index).trimEnd();
    if (!prefix) return true;
    if (prefix.endsWith('=>') || /(?:return|case|throw|delete|void|typeof|instanceof|yield|await)\s*$/.test(prefix)) return true;
    return '([{,:;=!?&|+-*%^~<>'.includes(prefix[prefix.length - 1]);
  };

  const scanLine = (line) => {
    for (let index = 0; index < line.length; index++) {
      const context = stack[stack.length - 1];
      const char = line[index];
      const next = line[index + 1];
      if (context.type === 'block') {
        if (char === '*' && next === '/') { stack.pop(); index++; }
        continue;
      }
      if (context.type === 'single' || context.type === 'double') {
        if (char === '\\') { index++; continue; }
        if ((context.type === 'single' && char === "'") || (context.type === 'double' && char === '"')) stack.pop();
        continue;
      }
      if (context.type === 'regex') {
        if (char === '\\') { index++; continue; }
        if (char === '[') { context.inClass = true; continue; }
        if (char === ']') { context.inClass = false; continue; }
        if (char === '/' && !context.inClass) stack.pop();
        continue;
      }
      if (context.type === 'template') {
        if (char === '\\') { index++; continue; }
        if (char === '`') { stack.pop(); continue; }
        if (char === '$' && next === '{') {
          stack.push({ type: 'code', templateExpression: true, braceDepth: 1 });
          index++;
        }
        continue;
      }
      if (char === '/' && next === '/') break;
      if (char === '/' && next === '*') { stack.push({ type: 'block' }); index++; continue; }
      if (char === '/' && canStartRegex(line, index)) {
        stack.push({ type: 'regex', inClass: false });
        continue;
      }
      if (char === "'") { stack.push({ type: 'single' }); continue; }
      if (char === '"') { stack.push({ type: 'double' }); continue; }
      if (char === '`') { stack.push({ type: 'template' }); continue; }
      if (!context.templateExpression) continue;
      if (char === '{') context.braceDepth++;
      if (char === '}' && --context.braceDepth === 0) stack.pop();
    }
  };

  return source.split(/(?<=\n)/).map((line) => {
    if (metadata) {
      if (line.trim() === '// ==/UserScript==') metadata = false;
      return line;
    }
    const context = stack[stack.length - 1];
    if (context.type === 'code' && (!line.trim() || line.trimStart().startsWith('//'))) return '';
    scanLine(line);
    // 源码整体位于 userscript 闭包内；发布时去掉这层公共缩进，保留内部相对层级。
    // 仅处理从代码上下文开始的行，避免改写模板、字符串续行和块注释内容。
    return context.type === 'code' && line.startsWith('  ') ? line.slice(2) : line;
  }).join('');
}
