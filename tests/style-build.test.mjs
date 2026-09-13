import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compactCss, compactStyleTemplate } from '../scripts/strip-comments.mjs';

const fixture = `
  /* removable */
  .parent .child {
    width: calc(100% - 16px);
    content: "keep  two spaces /* and comment text */";
  }
`;
const compactedFixture = compactCss(fixture);
assert.equal(
  compactedFixture,
  '.parent .child { width: calc(100% - 16px); content: "keep  two spaces /* and comment text */"; }'
);

const styleSource = await readFile(new URL('../src/ui/styles.part.js', import.meta.url), 'utf8');
const release = await readFile(new URL('../更好的X（BetterX）v3.4.0.js', import.meta.url), 'utf8');
const compactedSource = compactStyleTemplate(styleSource);
const opening = 'addStyle(`';
const closing = '`);';
const sourceCssStart = compactedSource.indexOf(opening) + opening.length;
const sourceCssEnd = compactedSource.indexOf(closing, sourceCssStart);
const releaseCssStart = release.indexOf(opening) + opening.length;
const releaseCssEnd = release.indexOf(closing, releaseCssStart);
const builtCss = release.slice(releaseCssStart, releaseCssEnd);

assert.ok(styleSource.split(/\r?\n/).length > 700, '源码 CSS 应继续保留可读排版');
assert.equal(builtCss, compactedSource.slice(sourceCssStart, sourceCssEnd));
assert.doesNotMatch(builtCss, /[\r\n]/, '发布物中的静态 CSS 应压缩为一行');
assert.doesNotMatch(builtCss, /\/\*/, '发布物中的 CSS 注释应移除');
assert.match(builtCss, /calc\(100vw - 16px\)/, 'calc 运算符所需空白必须保留');
assert.match(builtCss, /content: '‹'/, 'CSS 字符串内容必须保留');

console.log('Build compacts static CSS while preserving source formatting and significant whitespace.');
