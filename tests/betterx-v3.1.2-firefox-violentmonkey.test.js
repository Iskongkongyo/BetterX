const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', '更好的X（BetterX）v3.1.2.js');
let source = fs.readFileSync(scriptPath, 'utf8');
const startupPattern = /^\s*redirectBareProfileToPreferredView\(\);\r?\n\s*installProfileDefaultViewLinkRewrite\(\);\r?\n\s*registerMenuCommands\(\);\r?\n\s*installNetworkHooks\(\);\r?\n\s*waitForPageReady\(\);/m;
assert.match(source, startupPattern, '找不到脚本启动标记');
source = source.replace(startupPattern, `
  globalThis.__betterxTest = {
    requestTweetDetailMedia,
    collectMedia,
    needsOnDemandVideoLookup,
    getMissingMediaMessage,
    IS_VIOLENTMONKEY,
    USERSCRIPT_MANAGER,
  };
`);

const makePayload = (id, url) => ({
  data: {
    tweetResult: {
      result: {
        rest_id: id,
        legacy: {
          id_str: id,
          extended_entities: {
            media: [{
              type: 'video',
              media_url_https: `https://pbs.twimg.com/ext_tw_video_thumb/${id}/pu/img/example.jpg`,
              video_info: {
                variants: [{ content_type: 'video/mp4', bitrate: 1000000, url }],
              },
            }],
          },
        },
      },
    },
  },
});

let fetchCalls = 0;
let fetchOptions = null;
let gmCalls = 0;
let gmMode = 'response';
const context = {
  console,
  navigator: { userAgent: 'Mozilla/5.0 (Android 14; Mobile; rv:145.0) Gecko/145.0 Firefox/145.0' },
  location: {
    origin: 'https://x.com',
    href: 'https://x.com/home',
    pathname: '/home',
    search: '',
  },
  URL,
  URLSearchParams,
  AbortController,
  setTimeout,
  clearTimeout,
  GM_info: { scriptHandler: 'Violentmonkey', script: { version: '3.1.2' } },
  // 复现用户更容易遇到问题的“Firefox 普通模式”：按需查询仍必须执行。
  GM_getValue: (key, fallback) => key === 'betterx_firefox_compatibility_mode' ? 'normal' : fallback,
  GM_xmlhttpRequest: (details) => {
    gmCalls++;
    const decodedUrl = decodeURIComponent(details.url);
    assert.match(decodedUrl, /TweetResultByRestId/);
    assert.match(decodedUrl, /responsive_web_jetfuel_frame/);
    assert.match(decodedUrl, /longform_notetweets_rich_text_read_enabled/);
    if (gmMode === 'error') {
      details.onerror({ status: 0, statusText: 'mock error' });
    } else if (gmMode === 'responseText') {
      details.onload({
        status: 200,
        response: null,
        responseText: JSON.stringify(
          makePayload('2222222222222222222', 'https://video.twimg.com/ext_tw_video/response-text.mp4'),
        ),
      });
    } else {
      details.onload({
        status: 200,
        response: makePayload('1111111111111111111', 'https://video.twimg.com/ext_tw_video/gm-first.mp4'),
      });
    }
    return { abort() {} };
  },
  document: {
    body: null,
    cookie: 'ct0=test-csrf; twid=u%3D123456789012345678',
  },
  fetch: async (url, options) => {
    fetchCalls++;
    fetchOptions = options;
    return {
      ok: true,
      status: 200,
      json: async () => makePayload('3333333333333333333', 'https://video.twimg.com/ext_tw_video/fetch-fallback.mp4'),
    };
  },
};
context.globalThis = context;
context.window = context;
vm.runInNewContext(source, context, { filename: scriptPath });

const {
  requestTweetDetailMedia,
  collectMedia,
  needsOnDemandVideoLookup,
  getMissingMediaMessage,
  IS_VIOLENTMONKEY,
  USERSCRIPT_MANAGER,
} = context.__betterxTest;

const emptyArticle = { querySelectorAll: () => [] };
const videoArticle = {
  querySelector: () => ({}),
  querySelectorAll: () => [],
};
const directVideoArticle = {
  querySelectorAll: (selector) => selector === 'video'
    ? [{
      currentSrc: 'https://video.twimg.com/tweet_video/DIRECTGIF.mp4',
      src: '',
      getAttribute: () => '',
    }, {
      currentSrc: 'https://video.twimg.com/amplify_video/123/vid/avc1/direct.mp4',
      src: '',
      getAttribute: () => '',
    }]
    : [],
};

(async () => {
  assert.equal(USERSCRIPT_MANAGER, 'Violentmonkey');
  assert.equal(IS_VIOLENTMONKEY, true);
  assert.equal(needsOnDemandVideoLookup(videoArticle, '1111111111111111111'), true);
  const directMedia = collectMedia(directVideoArticle, '4444444444444444444');
  assert.deepEqual(Array.from(directMedia.gifs), ['https://video.twimg.com/tweet_video/DIRECTGIF.mp4']);
  assert.deepEqual(Array.from(directMedia.videos), ['https://video.twimg.com/amplify_video/123/vid/avc1/direct.mp4']);

  // 与参考脚本一致：普通模式也直接用 GM 请求按需查询，不依赖全局网络 Hook。
  assert.equal(await requestTweetDetailMedia('1111111111111111111'), true);
  assert.equal(gmCalls, 1);
  assert.equal(fetchCalls, 0);
  assert.deepEqual(
    Array.from(collectMedia(emptyArticle, '1111111111111111111').videos),
    ['https://video.twimg.com/ext_tw_video/gm-first.mp4'],
  );

  gmMode = 'responseText';
  assert.equal(await requestTweetDetailMedia('2222222222222222222'), true);
  assert.equal(gmCalls, 2);
  assert.equal(fetchCalls, 0);
  assert.deepEqual(
    Array.from(collectMedia(emptyArticle, '2222222222222222222').videos),
    ['https://video.twimg.com/ext_tw_video/response-text.mp4'],
  );

  gmMode = 'error';
  assert.equal(await requestTweetDetailMedia('3333333333333333333'), true);
  assert.equal(gmCalls, 3);
  assert.equal(fetchCalls, 1);
  assert.equal(fetchOptions.credentials, 'include');
  assert.deepEqual(
    Array.from(collectMedia(emptyArticle, '3333333333333333333').videos),
    ['https://video.twimg.com/ext_tw_video/fetch-fallback.mp4'],
  );

  const warning = getMissingMediaMessage(videoArticle);
  assert.match(warning, /Violentmonkey/);
  assert.match(warning, /Tampermonkey/);

  console.log('BetterX v3.1.2 Firefox/Violentmonkey tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
