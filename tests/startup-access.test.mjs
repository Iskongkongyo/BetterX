import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

for (const path of [
  '../src/main.part.js',
  '../更好的X（BetterX）v3.9.0.js',
]) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const bootStart = source.indexOf('async function boot()');
  const bootEnd = source.indexOf('function waitForPageReady()', bootStart);
  const boot = source.slice(bootStart, bootEnd);
  const createUiAt = boot.indexOf('createUI();');
  const shortcutAt = boot.indexOf("document.addEventListener('keydown', handleKeydown, true);");
  const databaseAt = boot.indexOf('await openDb();');
  assert.ok(createUiAt >= 0 && shortcutAt > createUiAt, `${path} 未在 UI 创建后绑定快捷键`);
  assert.ok(databaseAt > shortcutAt, `${path} 的 Alt+X 不应等待数据库初始化`);
  assert.equal(
    boot.match(/document\.addEventListener\('keydown', handleKeydown, true\);/g)?.length,
    1,
    `${path} 快捷键只能绑定一次`
  );
  assert.match(boot, /try \{ installStyles\(\); \} catch/, `${path} 样式注入失败不应阻止 UI 创建`);
}

const storageSource = await readFile(new URL('../src/core/storage-posts.part.js', import.meta.url), 'utf8');
assert.match(storageSource, /request\.onblocked\s*=/, 'IndexedDB upgrade blocking must be handled');
assert.match(storageSource, /db\.onversionchange\s*=/, 'old tabs must release IndexedDB connections on upgrade');
assert.match(storageSource, /DB_OPEN_BLOCKED/, 'blocked database startup must leave the pending state');
assert.match(storageSource, /new BroadcastChannel\(CROSS_TAB_CHANNEL_NAME\)/, 'cross-tab changes must be synchronized');

console.log('Badge creation and Alt+X binding no longer wait for database startup.');
