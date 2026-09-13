import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  compactAdultSpamRules, compactI18nEntries, compactPanelTemplate, compactStyleTemplate,
  stripStandaloneSourceComments,
} from './strip-comments.mjs';

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(root, '更好的X（BetterX）v3.4.0.js');
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
  ['src/00-bootstrap-i18n.part.js', compactI18nEntries],
  ['src/features/adult-spam.part.js', compactAdultSpamRules],
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
if (!output.includes('// @version      3.4.0')) {
  throw new Error('Build aborted: expected version 3.4.0.');
}
if (!output.trimEnd().endsWith('})();')) {
  throw new Error('Build aborted: userscript wrapper is incomplete.');
}

await writeFile(outputPath, output, 'utf8');
console.log(`Built ${parts.length} modules -> ${outputPath}`);
