import assert from 'node:assert/strict';
import { loadUserscript } from './helpers/userscript-harness.mjs';

// Exercise the production pointer handlers with a deterministic clock, including
// cancellations that do not reliably produce a click in a real browser.
let clock = 0, nextTimer = 0;
const timers = new Map();
const context = loadUserscript('bindDownloadButtonGestures', `
  globalThis.starts = [];
  getStatusLink = article => article.url;
  extractStatusIdFromUrl = url => url;
  extractAuthor = article => article.author;
  isDownloadExcludedArticle = () => false;
  handleDownloadClick = async (...args) => {globalThis.starts.push(args);};
`, {
  setTimeout: (fn, delay) => {const id=++nextTimer;timers.set(id,{fn,at:clock+delay});return id;},
  clearTimeout: id => timers.delete(id),
});
const advance = ms => {
  const end = clock + ms;
  while (true) {
    const next = [...timers].sort((a,b)=>a[1].at-b[1].at).find(([,timer])=>timer.at<=end);
    if (!next) break;
    const [id,timer] = next; timers.delete(id); clock=timer.at; timer.fn();
  }
  clock=end;
};
const article = {url:'123',author:{username:'@original'}};
const controls = {dataset:{}};
const listeners = new Map();
const button = {isConnected:true,addEventListener(type,handler){listeners.set(type,handler);}};
context.__test.bindDownloadButtonGestures(button,article,controls);
const emit = (type, extra={}) => listeners.get(type)?.({
  button:0,isPrimary:true,pointerId:1,clientX:20,clientY:20,preventDefault(){},stopPropagation(){},...extra,
});
emit('pointerdown'); advance(499); assert.equal(context.starts.length,0);
emit('pointerup'); emit('click'); assert.equal(context.starts.length,1);
assert.equal(context.starts[0][3].selectMedia,false,'A short click must download all media');
emit('pointerdown'); advance(500); assert.equal(context.starts.length,2);
assert.equal(context.starts[1][3].selectMedia,true);
emit('pointerup'); emit('click'); assert.equal(context.starts.length,2,'Release after a long press must not download all');
emit('keydown',{key:'Enter'}); emit('click'); assert.equal(context.starts.length,3,'Keyboard activation must remain available');
emit('click',{shiftKey:true}); assert.equal(context.starts[3][3].selectMedia,true);
for (const type of ['pointercancel','pointerleave','lostpointercapture']) {
  const before=context.starts.length;
  emit('pointerdown'); emit(type); advance(600); emit('click');
  assert.equal(context.starts.length,before,`${type} must cancel both the hold and its stray click`);
}
let before=context.starts.length;
emit('pointerdown'); emit('pointermove',{clientY:40}); advance(600); emit('click');
assert.equal(context.starts.length,before,'A scroll/drag gesture must not download');
emit('pointerdown',{button:2}); advance(600); assert.equal(context.starts.length,before);
emit('pointerdown'); emit('pointercancel',{pointerId:2}); advance(500); emit('pointerup'); emit('click');
assert.equal(context.starts.length,before+1,'A different pointer must not cancel the active hold');
before=context.starts.length;
emit('pointerdown'); article.url='124'; advance(600); emit('pointerup'); emit('click');
assert.equal(context.starts.length,before,'A recycled article must cancel its old long press');
article.author={username:'@new-author'}; emit('pointerdown'); emit('pointerup'); emit('click');
assert.equal(context.starts.at(-1)[2],'124');
assert.equal(context.starts.at(-1)[1].username,'@new-author');
assert.equal(controls.dataset.statusId,'124','Activation must use the current article identity');
before=context.starts.length;
emit('pointerdown'); button.isConnected=false; advance(600); emit('pointerup'); emit('click');
assert.equal(context.starts.length,before,'Removed buttons must not start downloads');
button.isConnected=true;
emit('pointerdown'); context.__test.state.settings.mediaDownload=false; advance(600); emit('pointerup'); emit('click');
assert.equal(context.starts.length,before,'Disabling downloads must cancel a pending hold');

const flow = loadUserscript('handleDownloadClick, pendingDownloadStarts, pendingDownloadSelections, downloadJobs', `
  globalThis.items=[{url:'one.jpg',mediaType:'image',ext:'jpg'},{url:'two.mp4',mediaType:'gif',ext:'gif',convertToGif:true}];
  globalThis.jobs=[];globalThis.pickers=[];globalThis.confirmations=0;globalThis.confirmResult=true;globalThis.lookupNeeded=false;
  globalThis.lookups=0;globalThis.popovers=0;globalThis.failCollect=false;
  collectDownloadItems=()=>{if(globalThis.failCollect)throw new Error('collection failed');return globalThis.items;};
  needsOnDemandVideoLookup=()=>globalThis.lookupNeeded;
  requestTweetDetailMedia=()=>{globalThis.lookups++;return new Promise(resolve=>globalThis.finishLookup=resolve);};
  showDownloadMediaPicker=items=>new Promise(resolve=>{globalThis.pickers.push(items);globalThis.choose=resolve;});
  startDownloadJob=(...args)=>{globalThis.jobs.push(args);};
  extractText=article=>article.text;getStatusLink=article=>article.id;extractStatusIdFromUrl=url=>url;
  scheduleDownloadUiRefresh=()=>{};showToast=()=>{};getMissingMediaMessage=()=>'';
  uiConfirm=()=>{globalThis.confirmations++;return globalThis.confirmResult;};
  toggleDownloadPopover=()=>{globalThis.popovers++;};
`);
const api=flow.__test;
const post={id:'123',text:'original text',querySelector:()=>null};
const select=()=>api.handleDownloadClick(post,{username:'@original'},'123',{selectMedia:true});
let pending=select();
assert.equal(api.pendingDownloadSelections.size,1);
await select(); await api.handleDownloadClick(post,{},'123');
assert.equal(flow.pickers.length,1,'Repeated activation must not open another selector');
post.text='updated while selecting';
flow.choose([flow.items[1]]); await pending;
assert.equal(flow.jobs.length,1);
assert.equal(flow.jobs[0][0].length,1);
assert.equal(flow.jobs[0][0][0].convertToGif,true,'Selection must preserve the GIF conversion setting');
assert.equal(flow.jobs[0][3],'original text','Selection must retain the original naming context');
assert.equal(api.pendingDownloadSelections.size,0);

api.state.settings.trackDownloadedPosts=true;api.state.settings.downloadedPostIds=['123'];
pending=select(); assert.equal(flow.confirmations,0,'Opening the selector must not prompt for re-download');
flow.choose(null);await pending;
assert.equal(flow.confirmations,0);assert.equal(flow.jobs.length,1);
pending=select();flow.confirmResult=false;flow.choose([flow.items[0]]);await pending;
assert.equal(flow.confirmations,1);assert.equal(flow.jobs.length,1,'Declining re-download must not start a task');
api.state.settings.trackDownloadedPosts=false;
flow.lookupNeeded=true;pending=select();
assert.equal(api.pendingDownloadStarts.size,1);await select();assert.equal(flow.lookups,1);
flow.finishLookup(true);await Promise.resolve();
flow.choose([flow.items[0]]);await pending;
assert.equal(flow.jobs.length,2);assert.equal(api.pendingDownloadStarts.size,0);
pending=select();post.id='999';flow.finishLookup(true);await pending;
assert.equal(flow.jobs.length,2,'Lookup must not combine a recycled post with the old ID');
assert.equal(api.pendingDownloadSelections.size,0);
post.id='123';flow.lookupNeeded=false;flow.failCollect=true;
await assert.rejects(select(),/collection failed/);assert.equal(api.pendingDownloadSelections.size,0,'Errors must release the selection lock');
flow.failCollect=false;
pending=select();api.state.settings.mediaDownload=false;flow.choose([flow.items[0]]);await pending;
assert.equal(flow.jobs.length,2,'Disabling downloads during selection must prevent a new task');
api.state.settings.mediaDownload=true;
api.downloadJobs.set('123',{status:'downloading'});await select();
assert.equal(flow.popovers,1,'An active job must retain its task controls');

const media=loadUserscript('registerMedia, getDownloadMediaThumbnails');
const videoUrl='https://video.twimg.com/ext_tw_video/42/pu/vid/clip.mp4';
const poster='https://pbs.twimg.com/ext_tw_video_thumb/42/pu/img/preview.jpg';
media.__test.registerMedia('456',[{type:'video',media_url_https:poster,video_info:{variants:[{content_type:'video/mp4',url:videoUrl}]}}]);
const items=[
  {mediaType:'image',url:'https://pbs.twimg.com/media/photo.jpg?format=jpg&name=orig'},
  {mediaType:'video',url:videoUrl},
  {mediaType:'gif',url:'https://video.twimg.com/tweet_video/animation.mp4'},
  {mediaType:'image',url:'https://example.invalid/image.jpg'},
];
const original=JSON.stringify(items);
const thumbnails=media.__test.getDownloadMediaThumbnails({querySelectorAll:()=>[]},items);
assert.equal(new URL(thumbnails[0]).searchParams.get('name'),'small','Picker previews must not fetch original-size photos');
assert.equal(thumbnails[1],poster,'A registered video must keep its own preview');
assert.equal(thumbnails[2],'https://pbs.twimg.com/tweet_video_thumb/animation.jpg');
assert.equal(thumbnails[3],'','Unknown preview hosts must use the placeholder');
assert.equal(JSON.stringify(items),original,'Preview generation must not alter download URLs');

console.log('Download selection preserves click/hold semantics, cancellation, media formats, preview mapping and per-post task locks.');
