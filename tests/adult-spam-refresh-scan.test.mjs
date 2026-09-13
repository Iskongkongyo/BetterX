import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/features/adult-spam.part.js', import.meta.url), 'utf8');
const captureStart = source.indexOf('  function captureAdultSpamScrollAnchors');
const captureEnd = source.indexOf('  function resolveAdultSpamScrollAnchor');
const sweepStart = source.indexOf('  function sweepAdultSpam');
const sweepEnd = source.indexOf('  function adultSpamFilteringEnabled');
assert.ok(captureStart >= 0 && captureEnd > captureStart && sweepStart >= 0 && sweepEnd > sweepStart);

let documentScans = 0;
let evaluated = 0;
let harvested = 0;
let stabilizedWith = null;
const articles = Array.from({ length: 3 }, (_, index) => ({
  getBoundingClientRect: () => ({ top: index * 100, bottom: index * 100 + 80, height: 80 }),
}));
const api = vm.runInNewContext(`(() => {
  const document = {
    documentElement: { clientHeight: 800 },
    querySelectorAll(selector) { documentScans++; return articles; },
  };
  const window = { innerHeight: 800, scrollY: 25 };
  const extractStatusIdFromUrl = () => '';
  const getStatusLink = () => '';
  const isPageScrollBusy = () => false;
  const adultSpamFilteringEnabled = () => true;
  const harvestFollowingControlsFromRoot = () => { harvested++; };
  const evaluateAndApplyAdultSpam = () => { evaluated++; };
  const updateAdultSpamCount = () => {};
  const scheduleAdultSpamLayoutFlush = () => {};
  const unhideAdultSpam = () => {};
  const stabilizeAdultSpamScroll = (anchors) => { stabilizedWith = anchors; };
${source.slice(captureStart, captureEnd)}
${source.slice(sweepStart, sweepEnd)}
  return { applyAdultSpamFiltering };
})()`, { articles, get documentScans() { return documentScans; }, set documentScans(value) { documentScans = value; },
  get evaluated() { return evaluated; }, set evaluated(value) { evaluated = value; },
  get harvested() { return harvested; }, set harvested(value) { harvested = value; },
  get stabilizedWith() { return stabilizedWith; }, set stabilizedWith(value) { stabilizedWith = value; } });

api.applyAdultSpamFiltering();
assert.equal(documentScans, 1, '规则刷新只应枚举一次页面帖子');
assert.equal(evaluated, articles.length);
assert.equal(harvested, 1);
assert.equal(stabilizedWith.length, articles.length);

console.log('Adult-spam refresh reuses one article snapshot for anchoring and evaluation.');
