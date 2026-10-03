import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  compactAdultSpamRules, compactI18nEntries, compactPanelTemplate, compactStyleTemplate,
  compactStaticBlocks, stripStandaloneSourceComments,
} from './strip-comments.mjs';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, '更好的X（BetterX）v3.8.0.js');
const parts = [
  'src/00-bootstrap-i18n.part.js',
  'src/core/config-state.part.js',
  'src/core/utilities-filtering.part.js',
  'src/core/storage-posts.part.js',
  'src/core/network-harvest.part.js',
  'src/download/download.part.js',
  'src/features/media-age-dialogs.part.js',
  'src/features/ads-layout.part.js',
  'src/features/adult-spam.part.js',
  'src/posts/capture.part.js',
  'src/ui/image-preview-interactions.part.js',
  'src/ui/panel-state.part.js',
  'src/ui/tag-editors.part.js',
  'src/ui/panel.part.js',
  'src/ui/styles.part.js',
  'src/core/observers-lifecycle.part.js',
  'src/features/navigation.part.js',
  'src/main.part.js',
];

const chunks = await Promise.all(parts.map((part) => readFile(resolve(root, part), 'utf8')));
const releaseTransforms = new Map([
  ['src/00-bootstrap-i18n.part.js', (source) => compactStaticBlocks(compactI18nEntries(source), [
    ['const UI_LANGUAGE = detectUiLanguage();', 'function uiText'],
  ])],
  ['src/core/config-state.part.js', (source) => compactStaticBlocks(source, [
    ['const FILTERS = [', 'const PROFILE_DEFAULT_VIEW_OPTIONS ='],
    ['const POST_SHOW_MORE_LABELS = new Set([', 'const PROFILE_DEFAULT_VIEW_REDIRECT_GUARD_KEY ='],
    ['const SETTINGS_SCHEMA = Object.freeze({', 'const DEFAULT_SETTINGS ='],
  ])],
  ['src/core/utilities-filtering.part.js', (source) => compactStaticBlocks(source, [
    ['const TIME_FORMATTER = new Intl.DateTimeFormat(UI_LANGUAGE, {', 'function formatTime'],
    ['const RESERVED_TOP_PATHS = new Set([', 'function getActiveTabText'],
    ['const VIDEO_CONTAINER_SELECTORS = [', 'const MEDIA_ASSET_RE ='],
  ])],
  ['src/core/storage-posts.part.js', (source) => compactStaticBlocks(source, [
    ['const SETTINGS_EFFECT_ORDER = [', 'function runSettingsEffects'],
  ])],
  ['src/core/network-harvest.part.js', (source) => compactStaticBlocks(source, [
    ['const TWEET_DETAIL_FEATURES = {', 'function setBoundedRegistryEntry'],
  ])],
  ['src/features/adult-spam.part.js', compactAdultSpamRules],
  ['src/features/media-age-dialogs.part.js', (source) => compactStaticBlocks(source, [
    ['const CARD_CONTENT_SEL = [', 'function revealCardUnderMask'],
  ])],
  ['src/features/ads-layout.part.js', (source) => compactStaticBlocks(source, [
    ['const PREMIUM_UPSELL_LABELS = new Set([', 'function isAdArticle'],
    ['const LAYOUT_NAV_LABELS = new Set([', 'function layoutEnhancementsActive'],
  ])],
  ['src/ui/panel-state.part.js', (source) => compactStaticBlocks(source, [
    ['const SETTING_REMOVE_ACTIONS = Object.freeze({', 'function dispatchSettingRemoveAction'],
    ['const PANEL_ACTION_HANDLERS = Object.freeze({', 'function dispatchPanelAction'],
    ['const PANEL_ELEMENT_IDS = Object.freeze({', 'function bindPanelElements'],
  ])],
  ['src/ui/panel.part.js', compactPanelTemplate],
  ['src/ui/styles.part.js', compactStyleTemplate],
]);
const output = chunks.map((chunk, index) => {
  const transform = releaseTransforms.get(parts[index]);
  return stripStandaloneSourceComments(transform ? transform(chunk) : chunk);
}).join('');

if (!output.startsWith('// ==UserScript==')) {
  throw new Error('Build aborted: userscript metadata header is missing.');
}
if (!output.includes('// @version      3.8.0')) {
  throw new Error('Build aborted: expected version 3.8.0.');
}
if (!output.trimEnd().endsWith('})();')) {
  throw new Error('Build aborted: userscript wrapper is incomplete.');
}

await writeFile(outputPath, output, 'utf8');
console.log(`Built ${parts.length} modules -> ${outputPath}`);
