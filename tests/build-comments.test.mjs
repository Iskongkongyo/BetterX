import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripStandaloneSourceComments } from '../scripts/strip-comments.mjs';

const fixture = [
  '// ==UserScript==',
  '// @name Fixture',
  '// ==/UserScript==',
  'const url = /https?:\\/\\//;',
  'const tricky = /["`]/;',
  'const template = `',
  '  // template text',
  '',
  '  ${(() => {',
  '    // expression comment',
  '    return `nested',
  '      // nested template text',
  '    `;',
  '  })()}',
  '`;',
  '/* block',
  '  // block text',
  '*/',
  '  // source comment',
  '  const outerIndent = true;',
  '    const nestedIndent = true;',
  'const kept = "// string text"; // inline comment remains conservative',
  '',
].join('\n');
const stripped = stripStandaloneSourceComments(fixture);
assert.match(stripped, /\/\/ @name Fixture/);
assert.match(stripped, /  \/\/ template text/);
assert.match(stripped, /  \/\/ template text\n\n  \$\{/, '模板内空行必须保留');
assert.match(stripped, /      \/\/ nested template text/);
assert.match(stripped, /  \/\/ block text/);
assert.doesNotMatch(stripped, /expression comment|source comment/);
assert.match(stripped, /^const outerIndent = true;$/m, '代码行应移除闭包公共缩进');
assert.match(stripped, /^  const nestedIndent = true;$/m, '嵌套代码应保留相对缩进');
assert.match(stripped, /https\?:\\\/\\\//);
assert.match(stripped, /const tricky = \/\["`\]\//);
assert.match(stripped, /"\/\/ string text"; \/\/ inline comment/);
assert.doesNotMatch(stripped, /inline comment remains conservative\n\n$/, '代码区空行应从发布物移除');

const release = await readFile(new URL('../更好的X（BetterX）v3.4.0.js', import.meta.url), 'utf8');
assert.ok(release.startsWith('// ==UserScript=='));
const body = release.slice(release.indexOf('// ==/UserScript==') + '// ==/UserScript=='.length);
assert.doesNotMatch(body, /^\s*\/\/ pinned 是 BetterX/m, '普通源码注释应从发布物移除');
assert.doesNotMatch(body, /^\s*\/\/ Windows 单个文件名/m, '下载源码注释也应从发布物移除');

console.log('Build strips source-only comments while preserving metadata and literal content.');
