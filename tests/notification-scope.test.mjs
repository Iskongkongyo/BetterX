import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../更好的X（BetterX）v3.6.0.js', import.meta.url), 'utf8');

assert.match(source, /@version\s+3\.6\.0/);
assert.match(source, /function syncNotificationSubscriptions\(/, '应保留通知订阅同步');
assert.match(source, /function updateNotificationSubscription\(/, '应保留通知铃铛开关');
assert.match(source, /function renderNotificationSubscriptions\(/, '应保留通知订阅列表');
assert.doesNotMatch(source, /BetterX-nt-native-frame/, '通知页不应嵌入订阅帖子时间线');
assert.doesNotMatch(source, /function (?:load|render)NotificationTimeline\(/, '通知页不应抓取或渲染订阅帖子');

console.log('Notification UI stays limited to subscription management.');
