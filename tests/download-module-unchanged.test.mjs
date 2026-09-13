import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const downloadModule = await readFile(new URL('../src/download/download.part.js', import.meta.url));
const actual = createHash('sha256').update(downloadModule).digest('hex').toUpperCase();
const expected = '5508DA68D5409B5DD00AB3C217616F457580B0B732F6E5FC7845B5A0B64784B8';
assert.equal(actual, expected, '下载模块已变更；若是有意修改，请在完成回归后更新基准哈希');

console.log('Download module matches the untouched v3.3.0 baseline.');
