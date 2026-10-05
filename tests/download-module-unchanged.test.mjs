import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const downloadModule = await readFile(new URL('../src/download/download.part.js', import.meta.url));
const actual = createHash('sha256').update(downloadModule).digest('hex').toUpperCase();
const expected = '60A8C404ECB2EEE81901AF7FEC81EA4FA7DAE1102927DB31AC2DDD26F0EABF54';
assert.equal(actual, expected, '下载模块已变更；若是有意修改，请在完成回归后更新基准哈希');

console.log('Download module matches the reviewed v3.9.0 multilingual naming and GIF baseline.');
