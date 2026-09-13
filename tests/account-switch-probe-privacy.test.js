const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const probePath = path.join(__dirname, '..', 'BetterX账号切换探测器v0.1.0.js');
const source = fs.readFileSync(probePath, 'utf8');

assert.doesNotMatch(source, /\.innerText|\.textContent|\.outerHTML|document\.cookie/,
  '账号切换探测器不得采集页面文字、HTML 或 Cookie');
assert.match(source, /parts\[0\] = '<handle>'/,
  '账号切换探测器必须脱敏主页用户名');
assert.match(source, /UserAvatar-Container-<handle>/,
  '账号切换探测器必须脱敏头像 testid 中的用户名');
assert.match(source, /fullUrlsCollected:\s*false/,
  '账号切换探测报告必须声明不收集完整网址');
assert.match(source, /GM_registerMenuCommand\('BetterX 探测器：导出账号切换诊断'/,
  '账号切换探测器缺少报告导出入口');

console.log('BetterX account switch probe privacy tests passed');
