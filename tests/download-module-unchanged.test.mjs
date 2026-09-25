import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const downloadModule = await readFile(new URL('../src/download/download.part.js', import.meta.url));
const actual = createHash('sha256').update(downloadModule).digest('hex').toUpperCase();
const expected = '89FF1482A6AA5AF4057B66312C4872B25985440A84579C64E2A8F98A8881F601';
assert.equal(actual, expected, '下载模块已变更；若是有意修改，请在完成回归后更新基准哈希');

console.log('Download module matches the reviewed v3.7.0 click-stable GIF and guest-layout baseline.');
