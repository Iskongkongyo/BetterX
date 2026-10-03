import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compactStaticBlocks } from '../scripts/strip-comments.mjs';

const fixture = [
  '  const FIXTURE = Object.freeze({',
  "    label: 'keep  two spaces',",
  '    run: (value) => value + 1,',
  '  });',
  '',
  '  function afterFixture() {}',
].join('\n');
const compactedFixture = compactStaticBlocks(fixture, [
  ['const FIXTURE = Object.freeze({', 'function afterFixture'],
]);
assert.match(compactedFixture, /const FIXTURE[^\r\n]+\}\);/);
assert.match(compactedFixture, /keep  two spaces/);
assert.match(compactedFixture, /\n\n  function afterFixture/);

const release = await readFile(new URL('../更好的X（BetterX）v3.8.0.js', import.meta.url), 'utf8');
const cases = [
  ['../src/00-bootstrap-i18n.part.js', 'const UI_LANGUAGE = detectUiLanguage();', 'function uiText'],
  ['../src/core/config-state.part.js', 'const FILTERS = [', 'const PROFILE_DEFAULT_VIEW_OPTIONS ='],
  ['../src/core/config-state.part.js', 'const POST_SHOW_MORE_LABELS = new Set([', 'const PROFILE_DEFAULT_VIEW_REDIRECT_GUARD_KEY ='],
  ['../src/core/config-state.part.js', 'const SETTINGS_SCHEMA = Object.freeze({', 'const DEFAULT_SETTINGS ='],
  ['../src/core/utilities-filtering.part.js', 'const TIME_FORMATTER = new Intl.DateTimeFormat(UI_LANGUAGE, {', 'function formatTime'],
  ['../src/core/utilities-filtering.part.js', 'const RESERVED_TOP_PATHS = new Set([', 'function getActiveTabText'],
  ['../src/core/utilities-filtering.part.js', 'const VIDEO_CONTAINER_SELECTORS = [', 'const MEDIA_ASSET_RE ='],
  ['../src/core/storage-posts.part.js', 'const SETTINGS_EFFECT_ORDER = [', 'function runSettingsEffects'],
  ['../src/core/network-harvest.part.js', 'const TWEET_DETAIL_FEATURES = {', 'function setBoundedRegistryEntry'],
  ['../src/features/media-age-dialogs.part.js', 'const CARD_CONTENT_SEL = [', 'function revealCardUnderMask'],
  ['../src/features/ads-layout.part.js', 'const PREMIUM_UPSELL_LABELS = new Set([', 'function isAdArticle'],
  ['../src/features/ads-layout.part.js', 'const LAYOUT_NAV_LABELS = new Set([', 'function layoutEnhancementsActive'],
  ['../src/ui/panel-state.part.js', 'const SETTING_REMOVE_ACTIONS = Object.freeze({', 'function dispatchSettingRemoveAction'],
  ['../src/ui/panel-state.part.js', 'const PANEL_ACTION_HANDLERS = Object.freeze({', 'function dispatchPanelAction'],
  ['../src/ui/panel-state.part.js', 'const PANEL_ELEMENT_IDS = Object.freeze({', 'function bindPanelElements'],
];

for (const [path, opening, boundary] of cases) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const sourceStart = source.indexOf(opening);
  const sourceEnd = source.indexOf(boundary, sourceStart);
  const releaseStart = release.indexOf(opening);
  const releaseEnd = release.indexOf(boundary, releaseStart);
  assert.ok(sourceStart >= 0 && sourceEnd > sourceStart, `${path} 找不到静态声明`);
  assert.ok(releaseStart >= 0 && releaseEnd > releaseStart, `${path} 的静态声明未进入发布物`);
  assert.match(source.slice(sourceStart, sourceEnd).trim(), /[\r\n]/, `${opening} 的源码应保持可读排版`);
  assert.doesNotMatch(release.slice(releaseStart, releaseEnd).trim(), /[\r\n]/, `${opening} 在发布物中应折叠为一行`);
}

console.log('Build compacts selected static declarations while preserving readable source.');
