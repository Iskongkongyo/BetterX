import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const downloadModule = (await readFile(new URL('../src/download/download.part.js', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
const actual = createHash('sha256').update(downloadModule).digest('hex').toUpperCase();
const expected = '1EE34EEAF44825F956C6D0F77D30DDC3ECB73896A00E56FA588F7B65F9516D50';
assert.equal(actual, expected, '下载模块已变更；若是有意修改，请在完成回归后更新基准哈希');

console.log('Download module matches the reviewed media selection, quiet indicator, multilingual naming and GIF baseline.');
