'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'BetterX原生帖子功能探测器v0.1.0.js');
let source = fs.readFileSync(scriptPath, 'utf8');
const bootMarker = '  installFetchHook();\n  installXhrHook();';
assert.ok(source.includes(bootMarker), 'probe boot marker should exist');
source = source.replace(bootMarker, `
  globalThis.__probeExports = {
    maskHandle,
    sanitizePrimitive,
    sanitizeRoute,
    sanitizeEndpointPath,
    sanitizeObjectPath,
    sanitizeParameters,
    parseRequestBody,
    operationInfo,
  };
  return;
${bootMarker}`);

const context = {
  console,
  URL,
  URLSearchParams,
  navigator: { userAgent: 'probe-test' },
  location: {
    origin: 'https://x.com',
    href: 'https://x.com/home',
    pathname: '/home',
  },
};
vm.createContext(context);
vm.runInContext(source, context, { filename: scriptPath });

const probe = context.__probeExports;
assert.ok(probe, 'test exports should be installed');

assert.equal(probe.sanitizePrimitive('userId', '123456789012345678'), '<id>');
assert.equal(probe.sanitizePrimitive('listId', '987654321098765432'), '<id>');
assert.equal(probe.sanitizePrimitive('screenName', 'private_user'), '@pr***r');
assert.equal(
  probe.sanitizeRoute('https://x.com/private_user/status/123456789012345678?q=very-private'),
  '/pr***r/status/<id>?<q>'
);
assert.equal(
  probe.sanitizeEndpointPath('/i/api/2/users/123456789012345678/timeline'),
  '/i/api/2/users/<id>/timeline'
);
assert.equal(probe.sanitizeObjectPath('$.users.123456789012345678.legacy.notifications'), '$.users.<id>.legacy.notifications');

const variables = encodeURIComponent(JSON.stringify({
  userId: '123456789012345678',
  cursor: 'private-cursor',
  rawQuery: 'private search words',
  count: 20,
}));
const info = probe.operationInfo(
  `https://x.com/i/api/graphql/queryHash123/HomeTimeline?variables=${variables}`,
  'GET'
);
assert.equal(info.operation, 'HomeTimeline');
assert.equal(info.queryId, 'queryHash123');
assert.equal(info.variables.userId, '<id>');
assert.equal(info.variables.cursor, '<cursor>');
assert.equal(info.variables.count, 20);
assert.ok(!JSON.stringify(info).includes('private'));
assert.ok(!JSON.stringify(info).includes('123456789012345678'));

const restInfo = probe.operationInfo('https://x.com/i/api/2/users/123456789012345678/timeline', 'GET');
assert.ok(!JSON.stringify(restInfo).includes('123456789012345678'));

const restRequest = probe.operationInfo(
  'https://x.com/i/api/1.1/friends/following/list.json?count=200&cursor=private-cursor&user_id=123456789012345678&q=private-search',
  'GET'
);
assert.equal(restRequest.queryParameters.count, '200');
assert.equal(restRequest.queryParameters.cursor, '<cursor>');
assert.equal(restRequest.queryParameters.user_id, '<id>');
assert.equal(restRequest.queryParameters.q, '<redacted>');
assert.ok(!JSON.stringify(restRequest).includes('private'));

const mutationRequest = probe.operationInfo(
  'https://x.com/i/api/1.1/friendships/update.json',
  'POST',
  'id=123456789012345678&device=true&cursor=private-cursor'
);
assert.equal(mutationRequest.requestBody.id, '<id>');
assert.equal(mutationRequest.requestBody.device, 'true');
assert.equal(mutationRequest.requestBody.cursor, '<cursor>');
assert.ok(!JSON.stringify(mutationRequest).includes('123456789012345678'));

console.log('BetterX native post action probe privacy tests passed');
