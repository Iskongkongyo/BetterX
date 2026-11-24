import assert from 'node:assert/strict';
import { loadUserscript } from './helpers/userscript-harness.mjs';

const links=[{href:'https://www.pixiv.net/users/123',label:'pixiv.net/users/123'}];
const flush=async()=>{for(let index=0;index<16;index++)await Promise.resolve();};
function harness(){
  const stored=new Map(),timers=new Map();let nextTimer=0;
  const context=loadUserscript(`loadAuthorProfileLinks, refreshAuthorLinks, resetAuthorLinksView,
    startAuthorLinksRequest, getView:()=>authorLinksView`, `
    now=()=>globalThis.clock;
    requestAuthorProfileLinks=async name=>{globalThis.requests++;return globalThis.transport(name);};
  `,{
    clock:100000,requests:0,transport:async()=>links,
    GM_getValue:(key,fallback)=>stored.get(key)??fallback,
    GM_setValue:(key,value)=>stored.set(key,value),
    setTimeout:(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,at:context.clock+delay});return id;},
    clearTimeout:id=>timers.delete(id),
  });
  context.__test.state.settings.authorLinksEnabled=true;
  context.location.pathname='/author/status/123';
  const advance=async ms=>{
    const end=context.clock+ms;
    while(true){
      const due=[...timers].sort((a,b)=>a[1].at-b[1].at).find(([,timer])=>timer.at<=end);
      if(!due)break;
      const [id,timer]=due;timers.delete(id);context.clock=timer.at;timer.fn();await flush();
    }
    context.clock=end;await flush();
  };
  return {context,api:context.__test,stored,timers,advance};
}

{
  const {context,api,stored}=harness();
  const pending=Array.from({length:10},()=>api.loadAuthorProfileLinks('Author'));
  await Promise.all(pending);assert.equal(context.requests,1);
  await api.loadAuthorProfileLinks('author');assert.equal(context.requests,1);
  assert.equal(stored.get('betterx_author_links:author').expiresAt,context.clock+7*24*60*60*1000);
  context.clock+=7*24*60*60*1000;
  await api.loadAuthorProfileLinks('author');assert.equal(context.requests,2);
}
{
  const {context,api,stored}=harness();context.transport=async()=>[];
  for(let index=0;index<3;index++)assert.equal((await api.loadAuthorProfileLinks('author')).length,0);
  assert.equal(context.requests,1,'Empty profiles must be cached across post visits');
  assert.equal(stored.get('betterx_author_links:author').expiresAt,context.clock+60*60*1000);
  context.clock+=60*60*1000;
  await api.loadAuthorProfileLinks('author');assert.equal(context.requests,2,'Expired empty profiles must refresh');
}
{
  const {context,api,timers,advance,stored}=harness();
  context.transport=async()=>{throw new Error('temporary failure');};
  api.refreshAuthorLinks();await flush();
  assert.equal(api.getView().status,'error');assert.equal(context.requests,1);
  assert.equal(stored.size,0,'Failures must not become cached empty profiles');
  for(let index=0;index<20;index++)api.refreshAuthorLinks();await flush();
  assert.equal(context.requests,1,'DOM changes must not bypass retry backoff');
  await advance(999);assert.equal(context.requests,1);
  await advance(1);assert.equal(context.requests,2);
  await advance(3999);assert.equal(context.requests,2);
  await advance(1);assert.equal(context.requests,3);
  assert.equal(timers.size,0,'Automatic retries must stop after three total attempts');
  context.transport=async()=>links;
  api.getView().attempts=0;api.startAuthorLinksRequest(api.getView());await flush();
  assert.equal(context.requests,4);assert.equal(api.getView().status,'ready');
}
{
  const {context,api,timers,advance}=harness();
  context.transport=async()=>{throw new Error('offline');};
  api.refreshAuthorLinks();await flush();assert.equal(timers.size,1);
  context.location.pathname='/home';api.refreshAuthorLinks();
  assert.equal(api.getView(),null);assert.equal(timers.size,0);
  await advance(10000);assert.equal(context.requests,1,'Leaving details must cancel scheduled retries');
  context.location.pathname='/author/status/124';api.refreshAuthorLinks();await flush();
  assert.equal(timers.size,1);
  api.state.settings.authorLinksEnabled=false;api.refreshAuthorLinks();
  assert.equal(timers.size,0);await advance(10000);assert.equal(context.requests,2);
}
{
  const {context,api}=harness();let complete;
  context.transport=()=>new Promise(resolve=>{complete=resolve;});
  api.refreshAuthorLinks();await flush();
  context.location.pathname='/home';api.refreshAuthorLinks();
  complete(links);await flush();assert.equal(api.getView(),null,'Late responses must not revive an inactive view');
}
{
  const { context, api, stored } = harness();
  let resolveOld;
  context.transport = () => new Promise((resolve) => { resolveOld = resolve; });
  api.refreshAuthorLinks();
  api.state.settings.authorLinksEnabled = false;
  api.refreshAuthorLinks();
  api.state.settings.authorLinksEnabled = true;
  const latest = [{ href: 'https://example.org/fresh', label: 'fresh' }];
  context.transport = async () => latest;
  api.refreshAuthorLinks();
  await flush();
  resolveOld(links);
  await flush();
  assert.equal(context.requests, 2, 'Re-enabling must start a fresh profile request');
  assert.equal(stored.get('betterx_author_links:author').links[0].href, latest[0].href);
  assert.equal(api.getView().links[0].href, latest[0].href);
}
{
  const profile={profile_bio:{entities:{description:{urls:[
    {expanded_url:links[0].href,display_url:links[0].label},
    {expanded_url:'javascript:alert(1)'},
  ]}}},legacy:{entities:{url:{urls:[{expanded_url:links[0].href},{expanded_url:'https://example.org/'}]}}}};
  const payload={data:{user:{result:profile}}};
  const context=loadUserscript('requestAuthorProfileLinks','requestXSessionJson=async()=>globalThis.payload;',{payload});
  const result=await context.__test.requestAuthorProfileLinks('author');
  assert.deepEqual(Array.from(result,link=>link.href),[links[0].href,'https://example.org/']);
  payload.data.user.result={legacy:{entities:{url:{urls:[{expanded_url:'https://legacy.example/'}]}}}};
  assert.equal((await context.__test.requestAuthorProfileLinks('author'))[0].href,'https://legacy.example/');
  context.payload={errors:[{message:'rate limited'}]};
  await assert.rejects(context.__test.requestAuthorProfileLinks('author'),/no readable author profile/);
}
{
  const requests = [];
  const shortUrl = 'https://t.co/AbCdEf';
  const unresolved = 'https://bit.ly/xyz';
  const legacyMapping = {
    'https://t.cn/known': { href: 'https://example.org/known', expiresAt: 200000 },
    'https://t.co/expired': { href: 'https://example.org/stale', expiresAt: 90000 },
    'https://t.co/invalid': { href: 'https://bit.ly/still-short', expiresAt: 200000 },
  };
  const profile = { legacy: { entities: { url: { urls: [
    { url: shortUrl, expanded_url: unresolved, unwound_url: links[0].href, display_url: 't.co/AbCdEf' },
    { url: 'https://t.co/duplicate', expanded_url: links[0].href },
    { url: 'https://t.cn/known', display_url: 't.cn/known' },
    { expanded_url: unresolved, unwound_url: 'mailto:bad@example.org', display_url: 'bit.ly/xyz' },
    { url: 'https://t.co/expired' },
    { url: 'https://t.co/invalid' },
  ] } } } };
  const context = loadUserscript('isShortUrl, requestAuthorProfileLinks',
    'now = () => 100000; requestXSessionJson = async () => globalThis.payload;', {
      payload: { data: { user: { result: profile } } },
      GM_getValue: (key, fallback) => key === 'betterx_short_links' ? legacyMapping : fallback,
      GM_xmlhttpRequest: (options) => requests.push(options.url),
    });
  const { isShortUrl, requestAuthorProfileLinks } = context.__test;
  for (const host of ['t.co', 't.cn', 'x.gd', 'bit.ly', 'c1n.cn', 'tinyurl.com', 'shrturi.com', 'dub.sh']) {
    assert.equal(isShortUrl('https://' + host + '/abc'), true);
  }
  assert.equal(isShortUrl('https://example.org/t.cn'), false);
  const result = await requestAuthorProfileLinks('author');
  assert.deepEqual(Array.from(result, (link) => link.href), [
    links[0].href, 'https://example.org/known', unresolved, 'https://t.co/expired', 'https://t.co/invalid',
  ]);
  assert.equal(result[0].label, 'pixiv.net/users/123');
  assert.equal(result[1].label, 'example.org/known');
  assert.equal(result[2].label, 'bit.ly/xyz');
  assert.deepEqual(requests, [], 'Short links must use X data or a valid cache without preflight requests');
}
function homeHarness(profiles, transport = async () => []){
  const created=[],articles=[],reads=[],redirects=[],icons=[];
  const stored=new Map(Object.entries(profiles));
  const document={
    body:null,cookie:'',documentElement:{lang:'zh-CN'},
    createElement(tag){
      const node={tagName:tag.toUpperCase(),children:[],dataset:{},attrs:new Map(),listeners:{},className:'',id:'',
        style:{setProperty(key,value){this[key]=value;}},isConnected:true,parentElement:null,previousElementSibling:null,firstElementChild:null,
        setAttribute(key,value){node.attrs.set(key,String(value));},
        getAttribute(key){return node.attrs.get(key);},
        addEventListener(type,fn){(node.listeners[type]=node.listeners[type]||[]).push(fn);},
        append(...nodes){for(const child of nodes){child.parentElement=node;node.children.push(child);}node.firstElementChild=node.children[0];},
        replaceChildren(...nodes){node.children=nodes;node.firstElementChild=nodes[0];},
        querySelector(){return null;},
        matches(){return false;},
        closest(selector){return node.parentElement?.closest(selector)||null;},
        remove(){node.isConnected=false;node.removed=true;},
      };
      created.push(node);
      return node;
    },
    querySelectorAll(selector){
      if(selector==='[data-betterx-author-links="home"]'){
        return created.filter(node=>node.isConnected&&node.className==='BetterX-author-links'&&node.dataset.betterxAuthorLinks==='home');
      }
      if(selector==='[data-betterx-author-links="none"]'){
        return articles.filter(node=>node.isConnected&&node.dataset.betterxAuthorLinks==='none');
      }
      if(selector==='[data-testid="primaryColumn"] article[data-testid="tweet"]')return articles.filter(node=>node.isConnected);
      return [];
    },
  };
  const context=loadUserscript('refreshAuthorLinks, getCachedAuthorProfileLinks, loadAuthorProfileLinks, installNetworkHooks, createAuthorLinkIcon, cacheHarvestedAuthorProfileLinks, getView:()=>authorLinksView',
    'now=()=>globalThis.clock;requestAuthorProfileLinks=async name=>{globalThis.requests++;return globalThis.transport(name);};',{
      clock:100000,requests:0,document,transport,
      GM_getValue:(key,fallback)=>{reads.push(key);return stored.get(key)??fallback;},
      GM_setValue:(key,value)=>stored.set(key,value),
      GM_xmlhttpRequest:options=>{
        if(options.url.startsWith('https://cdn.simpleicons.org/')){
          icons.push(options.url);
          options.onload({status:200,responseText:'<svg viewBox="0 0 24 24"></svg>'});
          return;
        }
        redirects.push(options.url);
        options.onload({status:200,finalUrl:'https://www.pixiv.net/users/1'});
      },
      getComputedStyle:()=>({columnGap:'0',display:'flex',flexDirection:'row'}),
    });
  context.__test.state.settings.authorLinksEnabled=true;
  context.location.pathname='/home';
  const addArticle=(name)=>{
    let control=null;
    const caret={tagName:'BUTTON',isConnected:true,previousElementSibling:null,parentElement:null,
      closest(selector){return selector==='article'||selector==='article[data-testid="tweet"]'?article:null;},
      contains(node){return node===caret;},
      querySelector(){return null;},
      getBoundingClientRect(){return {width:0,height:0};},
      before(inserted){control=inserted;inserted.parentElement=article;caret.previousElementSibling=inserted;},
    };
    const article={isConnected:true,dataset:{},nameQueries:0,
      setAuthor(next){name=next;},
      closest(selector){return selector==='article'||selector==='article[data-testid="tweet"]'?article:selector==='[data-testid="primaryColumn"]'?document:null;},
      querySelector(selector){
        if(selector==='[data-testid="User-Name"]'){
          article.nameQueries++;
          return {querySelector:query=>name?(query==='a[href*="/status/"]'?{href:'https://x.com/'+name+'/status/123'}:{pathname:'/'+name}):null};
        }
        if(selector==='button[data-testid="caret"]')return caret;
        if(selector==='.BetterX-author-links')return control?.isConnected?control:null;
        return null;
      },
      remove(){article.isConnected=false;},
      get control(){return control;},
    };
    caret.parentElement=article;
    articles.push(article);
    return article;
  };
  return {context,api:context.__test,stored,reads,redirects,icons,addArticle};
}

{
  const h=homeHarness({'betterx_author_links:author':{links,expiresAt:200000}});
  const article=h.addArticle('author');
  h.api.refreshAuthorLinks();
  assert.ok(article.control,'A cached author must get an entry button on the home timeline');
  const [button,menu]=article.control.children;
  assert.equal(menu.getAttribute('popover'),'auto');
  assert.equal(button.getAttribute('popovertarget'),menu.id);
  assert.deepEqual(Array.from(menu.children,link=>link.href),[links[0].href]);
  assert.equal(h.context.requests,0,'The home timeline must never request author profiles');
  h.context.location.pathname='/explore';
  h.api.refreshAuthorLinks();
  assert.equal(article.control.isConnected,false,'Leaving the home timeline must remove injected buttons');
}
{
  const h=homeHarness({
    'betterx_author_links:empty':{links:[],expiresAt:200000},
    'betterx_author_links:expired':{links,expiresAt:90000},
  });
  const unknown=h.addArticle('unknown'),empty=h.addArticle('empty'),expired=h.addArticle('expired'),nameless=h.addArticle('');
  h.api.refreshAuthorLinks();
  for(const article of [unknown,empty,expired,nameless]){
    assert.equal(article.control,null,'Only cached, unexpired and non-empty author links may render');
  }
  assert.equal(h.context.requests,0,'Uncached authors must stay silent on the home timeline');
}
{
  const h=homeHarness({
    'betterx_author_links:author':{links,expiresAt:200000},
    'betterx_author_links:writer':{links:[{href:'https://github.com/writer',label:'github.com/writer'}],expiresAt:200000},
  });
  const first=h.addArticle('author'),second=h.addArticle('writer');
  h.api.refreshAuthorLinks();
  const [firstButton,firstMenu]=first.control.children,[secondButton,secondMenu]=second.control.children;
  assert.notEqual(firstMenu.id,secondMenu.id,'Each tweet must own a distinct popover id');
  assert.equal(firstButton.getAttribute('popovertarget'),firstMenu.id);
  assert.equal(secondButton.getAttribute('popovertarget'),secondMenu.id);
  assert.notEqual(firstButton.style['anchor-name'],secondButton.style['anchor-name'],'Anchors must not collide');
  assert.equal(firstMenu.style['position-anchor'],firstButton.style['anchor-name']);
  assert.deepEqual(Array.from(firstMenu.children,link=>link.href),[links[0].href]);
  assert.deepEqual(Array.from(secondMenu.children,link=>link.href),['https://github.com/writer']);
  h.api.refreshAuthorLinks();
  assert.equal(first.control.children[1],firstMenu,'Repeated scans must reuse the injected control');
}
{
  const h=homeHarness({'betterx_author_links:author':{links,expiresAt:200000}});
  assert.deepEqual(Array.from(h.api.getCachedAuthorProfileLinks('author'),link=>link.href),[links[0].href]);
  assert.equal(h.api.getCachedAuthorProfileLinks('missing'),null);
  assert.equal(h.api.getCachedAuthorProfileLinks('bad name!'),null);
  assert.equal(h.api.getCachedAuthorProfileLinks(''),null);
}
{
  const h=homeHarness({'betterx_author_links:author':{links:[],expiresAt:200000}});
  assert.equal(h.api.getCachedAuthorProfileLinks('author'),null);
  assert.deepEqual(Array.from(await h.api.loadAuthorProfileLinks('author')),[]);
  const authorReads=h.reads.filter(key=>key.startsWith('betterx_author_links:'));
  assert.equal(authorReads.length,1,'A valid empty cache entry must stay in memory so the detail view hits it');
  assert.equal(h.context.requests,0,'A valid empty cache entry must not refetch the profile');
}
{
  const shortHref = 'https://t.co/old';
  const record = { links: [{ href: shortHref, label: 't.co/old' }], expiresAt: 200000 };
  const h = homeHarness({ 'betterx_author_links:author': record });
  const article = h.addArticle('author');
  h.api.refreshAuthorLinks();
  assert.equal(article.control?.children[1]?.children[0]?.href, shortHref);
  assert.equal((await h.api.loadAuthorProfileLinks('author'))[0].href, shortHref);
  const nextLinks = [{ href: 'https://example.org/current', label: 'current' }];
  h.api.cacheHarvestedAuthorProfileLinks('author', nextLinks);
  await flush();
  assert.deepEqual(h.redirects, [], 'An unresolved legacy link must not start a background request');
  assert.equal(h.stored.get('betterx_author_links:author').links[0].href, nextLinks[0].href);
  assert.equal(article.control?.children[1]?.children[0]?.href, nextLinks[0].href);
}
{
  const shortHref = 'https://t.co/old';
  const record = { links: [{ href: shortHref, label: 't.co/old' }], expiresAt: 200000 };
  const h = homeHarness({
    'betterx_author_links:author': record,
    betterx_short_links: { [shortHref]: { href: 'https://example.org/known', expiresAt: 150000 } },
  });
  const article = h.addArticle('author');
  h.api.refreshAuthorLinks();
  assert.equal(article.control?.children[1]?.children[0]?.href, 'https://example.org/known');
  assert.equal((await h.api.loadAuthorProfileLinks('author'))[0].href, 'https://example.org/known');
  assert.deepEqual(h.redirects, []);
  assert.deepEqual(h.stored.get('betterx_author_links:author'), record, 'Reading a legacy link must not rewrite the author record');
}
{
  const h=homeHarness({},async()=>links);
  const article=h.addArticle('unknown');
  h.api.refreshAuthorLinks();
  assert.equal(article.nameQueries,1,'The author node is read once per tweet');
  h.api.refreshAuthorLinks();
  assert.equal(article.nameQueries,1,'Tweets without cached links must not be re-read on every flush');
  assert.equal(article.dataset.betterxAuthorLinks,'none');
  await h.api.loadAuthorProfileLinks('unknown');
  assert.equal(h.context.requests,1);
  h.api.refreshAuthorLinks();
  assert.ok(article.control,'A newly cached author must be picked up on the next scan');
  assert.equal(article.dataset.betterxAuthorLinks,undefined,'The injected tweet must drop the negative marker');
}
{
  const stored=new Map(),redirects=[];
  const makeRes=(url,body,extra={})=>({
    url,ok:true,status:200,headers:{get:()=>'application/json'},
    json:async()=>typeof body==='string'?JSON.parse(body):body,
    clone:()=>({text:async()=>typeof body==='string'?body:JSON.stringify(body)}),
    ...extra,
  });
  let nextResponse=null;
  const context=loadUserscript('installNetworkHooks, getCachedAuthorProfileLinks, loadAuthorProfileLinks, requestXSessionJson','now=()=>globalThis.clock;',{
    clock:100000,
    GM_getValue:(key,fallback)=>stored.get(key)??fallback,
    GM_setValue:(key,value)=>stored.set(key,value),
    GM_xmlhttpRequest:options=>{redirects.push(options.url);options.onload({status:200,finalUrl:'https://www.pixiv.net/users/88'});},
    fetch:async()=>nextResponse,
  });
  context.__test.state.settings.authorLinksEnabled = true;
  context.__test.installNetworkHooks();

  nextResponse=makeRes('https://x.com/i/api/graphql/abc/UserByScreenName?variables=%7B%22screen_name%22%3A%22Alice%22%7D',{
    data:{user:{result:{__typename:'User',core:{screen_name:'Alice'},profile_bio:{entities:{description:{urls:[
      {url:'https://t.co/alice',expanded_url:'https://www.pixiv.net/users/88',display_url:'t.co/alice'},
    ]}}}}}},
  });
  await context.fetch('https://x.com/i/api/graphql/abc/UserByScreenName?variables=%7B%22screen_name%22%3A%22Alice%22%7D');
  await flush();
  assert.ok(redirects.every((url) => url.startsWith('https://cdn.simpleicons.org/')));
  assert.deepEqual(Array.from(context.__test.getCachedAuthorProfileLinks('alice'),item=>item.href),['https://www.pixiv.net/users/88']);

  nextResponse=makeRes('https://x.com/i/api/graphql/abc/UserByRestId?variables=%7B%22userId%22%3A%2242%22%7D',{
    data:{user:{result:{__typename:'User',legacy:{screen_name:'Bob',entities:{url:{urls:[{expanded_url:'https://github.com/bob',display_url:'github.com/bob'}]}}}}}},
  });
  await context.fetch('https://x.com/i/api/graphql/abc/UserByRestId?variables=%7B%22userId%22%3A%2242%22%7D');
  await flush();
  assert.deepEqual(Array.from(context.__test.getCachedAuthorProfileLinks('bob'),item=>item.href),['https://github.com/bob']);

  nextResponse=makeRes('https://x.com/i/api/graphql/abc/UserByScreenName',{
    data:{user:{result:{__typename:'User',legacy:{screen_name:'EmptyUser',entities:{description:{urls:[]}}}}}},
  });
  await context.fetch('https://x.com/i/api/graphql/abc/UserByScreenName');
  await flush();
  assert.deepEqual(Array.from(stored.get('betterx_author_links:emptyuser').links),[],'Intercepted empty profiles must be cached');
  assert.equal(stored.get('betterx_author_links:emptyuser').expiresAt,100000+60*60*1000);

  for(const [url,body,extra] of [
    ['https://x.com/i/api/graphql/abc/UserByScreenName',{data:{user:{result:{__typename:'User',legacy:{screen_name:'FailedHttp',entities:{url:{urls:[{expanded_url:'https://example.com'}]}}}}}}},{ok:false,status:429}],
    ['https://x.com/i/api/graphql/abc/UserByScreenName',{errors:[{message:'rate limit'}],data:{user:{result:{legacy:{screen_name:'GqlErr',entities:{url:{urls:[{expanded_url:'https://example.com'}]}}}}}}}],
    ['https://x.com/i/api/graphql/abc/UserByScreenName',{data:{user:{result:{__typename:'UserUnavailable',legacy:{screen_name:'Banned'}}}}}],
    ['https://x.com/i/api/graphql/abc/ProfileSpotlightsQuery',{data:{user_result_by_screen_name:{result:{__typename:'User',legacy:{screen_name:'NoEntities'}}}}}],
  ]){
    nextResponse=makeRes(url,body,extra||{});
    await context.fetch(url);
    await flush();
  }
  for(const name of ['failedhttp','gqlerr','banned','noentities']){
    assert.equal(stored.has('betterx_author_links:'+name),false,`${name} must not be cached`);
  }

  class XHR{
    constructor(){this.listeners=[];this.responseType='';this.status=200;}
    open(){}send(){}addEventListener(type,fn){if(type==='load')this.listeners.push(fn);}
    getResponseHeader(){return null;}
    fire(){this.listeners.forEach(fn=>fn());}
  }
  context.XMLHttpRequest=XHR;
  context.__test.installNetworkHooks();
  const xhrOk=new XHR();
  xhrOk.responseType='json';
  xhrOk.response={data:{users:[{result:{legacy:{screen_name:'Carol',entities:{url:{urls:[{expanded_url:'https://example.org/carol'}]}}}}}]}};
  xhrOk.open('GET','https://x.com/i/api/graphql/abc/UsersByRestIds');
  xhrOk.send();xhrOk.fire();
  await flush();
  assert.deepEqual(Array.from(context.__test.getCachedAuthorProfileLinks('carol'),item=>item.href),['https://example.org/carol']);

  const xhrErr=new XHR();
  xhrErr.status=500;xhrErr.responseType='json';
  xhrErr.response={data:{user:{result:{legacy:{screen_name:'Dave',entities:{url:{urls:[{expanded_url:'https://example.org/dave'}]}}}}}}};
  xhrErr.open('GET','https://x.com/i/api/graphql/abc/UserByScreenName');
  xhrErr.send();xhrErr.fire();
  await flush();
  assert.equal(stored.has('betterx_author_links:dave'),false,'Failed XHR user detail must not be cached');

  nextResponse=makeRes('https://x.com/i/api/1.1/users/show.json?screen_name=eve',{
    screen_name:'Eve',entities:{url:{urls:[{expanded_url:'https://example.org/eve',display_url:'example.org/eve'}]}},
  });
  await context.__test.requestXSessionJson('/i/api/1.1/users/show.json?screen_name=eve');
  await flush();
  assert.deepEqual(Array.from(context.__test.getCachedAuthorProfileLinks('eve'),item=>item.href),['https://example.org/eve']);

  const profilePath = '/i/api/graphql/abc/UserByScreenName';
  const payloadFor = (name) => ({ data: { user: { result: {
    legacy: { screen_name: name, entities: { url: { urls: [{ url: 'https://t.co/disabled' }] } } },
  } } } });
  nextResponse = makeRes('https://example.org' + profilePath, payloadFor('Foreign'));
  await context.fetch(nextResponse.url);
  await flush();
  assert.equal(stored.has('betterx_author_links:foreign'), false, 'Only X responses can update author profiles');

  context.__test.state.settings.authorLinksEnabled = false;
  const requestsBeforeDisabled = redirects.length;
  nextResponse = makeRes('https://x.com' + profilePath, payloadFor('DisabledFetch'));
  await context.fetch(nextResponse.url);
  const xhrOff = new XHR();
  xhrOff.responseType = 'json';
  xhrOff.response = payloadFor('DisabledXhr');
  xhrOff.open('GET', profilePath);
  xhrOff.send();
  xhrOff.fire();
  nextResponse = makeRes('https://x.com' + profilePath, payloadFor('DisabledSession'));
  await context.__test.requestXSessionJson(profilePath);
  await flush();
  for (const name of ['disabledfetch', 'disabledxhr', 'disabledsession']) {
    assert.equal(stored.has('betterx_author_links:' + name), false, name + ' must not persist links when disabled');
  }
  assert.equal(redirects.length, requestsBeforeDisabled, 'Disabled profile harvest must not make a GM request');
}
{
  const stored=new Map();
  const context=loadUserscript('requestXSessionJson, getCachedAuthorProfileLinks','now=()=>globalThis.clock;',{
    clock:100000,
    GM_getValue:(key,fallback)=>stored.get(key)??fallback,
    GM_setValue:(key,value)=>stored.set(key,value),
    fetch:async()=>({
      ok:true,status:200,
      json:async()=>({data:{user:{result:{legacy:{screen_name:'Frank',entities:{url:{urls:[{expanded_url:'https://example.org/frank'}]}}}}}}}),
    }),
  });
  context.__test.state.settings.authorLinksEnabled = true;
  await context.__test.requestXSessionJson('/i/api/graphql/abc/UserByScreenName?variables=%7B%22screen_name%22%3A%22Frank%22%7D');
  await flush();
  assert.deepEqual(Array.from(context.__test.getCachedAuthorProfileLinks('frank'),item=>item.href),['https://example.org/frank'],'Session requests must cache user details even without fetch/XHR hooks');
}
{
  const stored=new Map();
  const res={
    url:'https://x.com/i/api/graphql/abc/UserByScreenName',ok:true,status:200,headers:{get:()=>'application/json'},
    clone:()=>({text:async()=>JSON.stringify({data:{user:{result:{legacy:{screen_name:'Author',entities:{url:{urls:[{expanded_url:links[0].href,display_url:links[0].label}]}}}}}}})}),
  };
  const h=homeHarness({});
  const article=h.addArticle('author');
  h.api.refreshAuthorLinks();
  assert.equal(article.control,null);
  h.context.fetch=async()=>res;
  h.api.installNetworkHooks();
  await h.context.fetch(res.url);
  await flush();
  assert.ok(article.control,'Intercepted user detail on /home must immediately render author links on visible tweets');
}
{
  const h=homeHarness({},async()=>links);
  await h.api.loadAuthorProfileLinks('author');
  await flush();
  assert.deepEqual(h.icons,['https://cdn.simpleicons.org/pixiv/0096FA'],'Resolving author links must prefetch uncached site icons');
  const iconDict=h.stored.get('betterx_author_link_icons');
  assert.ok(iconDict['pixiv/0096FA']?.dataUrl?.startsWith('data:image/svg+xml'),'Fetched SVG icon must persist in GM storage');
  assert.equal(iconDict['pixiv/0096FA'].expiresAt,100000+365*24*60*60*1000,'Icon cache must stay valid for one year');

  h.icons.length=0;
  const fresh=homeHarness({'betterx_author_link_icons':iconDict});
  const iconNode=fresh.api.createAuthorLinkIcon('https://www.pixiv.net/users/123');
  assert.equal(fresh.icons.length,0,'Persisted icon cache must hit without network requests');
  assert.equal(iconNode.children[0]?.tagName,'IMG','Cached icon must render synchronously as <img>');
  assert.equal(iconNode.children[0]?.src,iconDict['pixiv/0096FA'].dataUrl);

  fresh.context.clock+=365*24*60*60*1000;
  const expiredNode=fresh.api.createAuthorLinkIcon('https://www.pixiv.net/users/123');
  assert.equal(expiredNode.children.length,0,'Expired icon must fall back to globe SVG while refreshing');
  assert.deepEqual(fresh.icons,['https://cdn.simpleicons.org/pixiv/0096FA'],'Expired icon must re-fetch on control creation');

  const invalid=loadUserscript('createAuthorLinkIcon','now=()=>100000;',{
    document:fresh.context.document,
    GM_xmlhttpRequest:options=>options.onload({status:200,responseText:'<html>not svg</html>'}),
    GM_setValue:()=>{throw new Error('non-svg must not be cached');},
  });
  invalid.__test.createAuthorLinkIcon('https://www.pixiv.net/users/123');
  await flush();
}
// Harvest regression: active-race.
for(const activeFails of [true,false]){
  const stored=new Map();let settleActive,requestUrl;
  const context=loadUserscript('refreshAuthorLinks, cacheHarvestedAuthorProfileLinks, installNetworkHooks, getView:()=>authorLinksView','now=()=>100000;',{
    GM_getValue:(key,fallback)=>stored.get(key)??fallback,
    GM_setValue:(key,value)=>stored.set(key,value),
    fetch:url=>new Promise(resolve=>{requestUrl=url;settleActive=resolve;}),
  });
  const api=context.__test;
  api.state.settings.authorLinksEnabled=true;context.location.pathname='/author/status/123';
  api.installNetworkHooks();api.refreshAuthorLinks();await flush();
  const fresh=[{href:'https://example.org/new',label:'new'}];
  api.cacheHarvestedAuthorProfileLinks('author',fresh);
  const payload=activeFails?{errors:[{message:'rate limited'}]}:{data:{user:{result:{legacy:{screen_name:'Author',entities:{url:{urls:[{expanded_url:'https://example.org/old'}]}}}}}}};
  settleActive({url:requestUrl,ok:!activeFails,status:activeFails?429:200,
    headers:{get:()=>'application/json'},json:async()=>payload,clone:()=>({text:async()=>JSON.stringify(payload)}),
  });
  await flush();
  assert.equal(api.getView().status,'ready','Successful passive details must survive a failed active request');
  assert.equal(stored.get('betterx_author_links:author')?.links[0]?.href,'https://example.org/new','Late active responses must not overwrite newer passive details');
  assert.equal(api.getView().links[0]?.href,'https://example.org/new');
}
// Harvest regression: detail-sync.
for(const initial of [[],[{href:'https://example.org/old',label:'old'}],'error']){
  const h=homeHarness({},async()=>{if(initial==='error')throw new Error('offline');return initial;});
  const article=h.addArticle('author');
  h.context.location.pathname='/author/status/123';
  h.api.refreshAuthorLinks();await flush();
  const previous=article.control;
  const fresh=[{href:'https://example.org/new',label:'new'}];
  await h.api.cacheHarvestedAuthorProfileLinks('author',fresh);
  assert.equal(h.api.getView().status,'ready','Passive details must refresh empty, ready and error views');
  assert.equal(article.control?.children[1]?.children[0]?.href,'https://example.org/new','Passive recovery must replace any retry button or obsolete menu');
  if(previous)assert.equal(previous.isConnected,false,'A changed author menu must detach the previous control');
  await h.api.cacheHarvestedAuthorProfileLinks('author',[]);
  assert.equal(h.api.getView().status,'empty');
  assert.equal(article.querySelector('.BetterX-author-links'),null,'An emptied profile must remove its detail control');
}
// Harvest regression: home-sync.
{
  const h=homeHarness({
    'betterx_author_links:author':{links,expiresAt:200000},
    'betterx_author_links:writer':{links:[{href:'https://example.org/writer',label:'writer'}],expiresAt:200000},
  });
  const author=h.addArticle('author'),writer=h.addArticle('writer'),unknown=h.addArticle('unknown');
  h.api.refreshAuthorLinks();
  const oldControl=author.control,writerControl=writer.control;
  const fresh=[{href:'https://example.org/new',label:'new'}];
  await h.api.cacheHarvestedAuthorProfileLinks('author',fresh);
  assert.equal(author.control?.children[1]?.children[0]?.href,'https://example.org/new','Existing home menus must refresh when intercepted links change');
  assert.equal(oldControl.isConnected,false);
  assert.equal(writer.control,writerControl,'Updating one author must preserve other authors\' controls');
  const unknownQueries=unknown.nameQueries;
  await h.api.cacheHarvestedAuthorProfileLinks('author',fresh);
  assert.equal(unknown.nameQueries,unknownQueries,'Identical passive details must not re-scan unrelated cache misses');
  const url = 'https://x.com/i/api/graphql/abc/UserByScreenName';
  const payload = { data: { user: { result: {
    legacy: { screen_name: 'author', entities: { description: { urls: [] }, url: { urls: [] } } },
  } } } };
  h.context.fetch = async () => ({ url, ok: true, clone: () => ({ text: async () => JSON.stringify(payload) }) });
  h.api.installNetworkHooks();
  await h.context.fetch(url);
  await flush();
  assert.equal(h.stored.get('betterx_author_links:author').links.length, 0);
  assert.equal(h.stored.get('betterx_author_links:author').authoritativeEmpty, true);
  assert.equal(author.querySelector('.BetterX-author-links'),null,'Empty intercepted profiles must remove home menus');
  h.api.cacheHarvestedAuthorProfileLinks('author', fresh, { preserveResolved: true });
  assert.equal(author.querySelector('.BetterX-author-links'), null, 'Timeline responses must preserve an authoritative empty profile');
  assert.equal(writer.control,writerControl);
}
// Harvest regression: icon-cooldown.
for(const failure of ['http','network','timeout']){
  const h=homeHarness({'betterx_author_links:author':{links:[{href:'https://weibo.com/123',label:'weibo'}],expiresAt:200000}});
  let calls=0,succeed=false;
  h.context.GM_xmlhttpRequest=options=>{
    calls++;
    if(succeed)options.onload({status:200,responseText:'<svg xmlns="http://www.w3.org/2000/svg"></svg>'});
    else if(failure==='http')options.onload({status:404,responseText:'not found'});
    else if(failure==='network')options.onerror();
    else options.ontimeout();
  };
  h.api.getCachedAuthorProfileLinks('author');await flush();
  for(let index=0;index<3;index++){h.api.getCachedAuthorProfileLinks('author');await flush();}
  assert.equal(calls,1,`${failure}: cached profile reads must respect the failed icon cooldown`);
  h.context.clock+=60000;succeed=true;
  h.api.getCachedAuthorProfileLinks('author');await flush();
  assert.equal(calls,2,`${failure}: a failed icon must be retryable after cooldown`);
  h.api.getCachedAuthorProfileLinks('author');await flush();
  assert.equal(calls,2,'A successful retry must populate the existing icon cache');
}
// Site logo matching: pixiv.me, alias/subdomain precedence, and common site icons.
{
  const context=loadUserscript('AUTHOR_LINK_SITE_LOGOS, AUTHOR_LINK_DOMAIN_LOGOS, getAuthorLinkLogo');
  const {AUTHOR_LINK_SITE_LOGOS:rules,AUTHOR_LINK_DOMAIN_LOGOS:domainMap,getAuthorLinkLogo:getLogo}=context.__test;
  const totalDomains=rules.reduce((sum,[,domains])=>sum+domains.length,0);
  assert.equal(domainMap.size,totalDomains,'Site logo domains must not collide or duplicate');
  for(const [url,expected] of [
    ['https://pixiv.me/alice','pixiv/0096FA'],
    ['https://www.pixiv.me/alice','pixiv/0096FA'],
    ['https://PIXIV.ME./alice','pixiv/0096FA'],
    ['https://alice.fanbox.cc/','pixiv/0096FA'],
    ['https://music.youtube.com/watch?v=1','youtubemusic/FF0000'],
    ['https://www.youtube.com/@alice','youtube/FF0033'],
    ['https://youtu.be/abc','youtube/FF0033'],
    ['https://weixin.qq.com/r/abc','wechat/07C160'],
    ['https://qun.qq.com/abc','qq/1EBAFC'],
    ['https://alice.bsky.social','bluesky/0285FF'],
    ['https://alice.github.io/site','github/6E7781'],
    ['https://www.bilibili.tv/en','bilibili/00AEEC'],
    ['https://acg.tv/av1','bilibili/00AEEC'],
    ['https://instagr.am/p/1','instagram/FF0069'],
    ['https://v.douyin.com/abc','tiktok/FE2C55'],
    ['https://x.com/alice','x/6E7781'],
    ['https://twitter.com/alice','x/6E7781'],
    ['https://discord.gg/invite','discord/5865F2'],
    ['https://t.me/alice','telegram/26A5E4'],
    ['https://www.xiaohongshu.com/user/1','xiaohongshu/FF2442'],
    ['https://xhslink.com/a/1','xiaohongshu/FF2442'],
    ['https://misskey.io/@alice','misskey/86B300'],
    ['https://www.nicovideo.jp/user/1','niconico/6E7781'],
    ['https://afdian.com/a/alice','afdian/946CE6'],
    ['https://steamcommunity.com/id/alice','steam/3B82C4'],
    ['https://alice.itch.io/game','itchdotio/FA5C5C'],
    ['https://open.spotify.com/artist/1','spotify/1DB954'],
    ['https://note.com/alice','note/2CB696'],
  ])assert.equal(getLogo(url),expected,`Expected logo ${expected} for ${url}`);
  for(const url of ['https://notpixiv.me/alice','https://fakepixiv.net','javascript:alert(1)','mailto:a@pixiv.me','not a url']){
    assert.equal(getLogo(url),'',`Unexpected logo match for ${url}`);
  }
}
// Home skeleton articles, recycled home controls, and empty-DOM navigation returns.
{
  const h=homeHarness({
    'betterx_author_links:cached':{links,expiresAt:200000},
    'betterx_author_links:writer':{links:[{href:'https://github.com/writer',label:'github.com/writer'}],expiresAt:200000},
  },async()=>[{href:'https://www.pixiv.net/users/999',label:'pixiv.net/users/999'}]);
  const skeleton=h.addArticle('');
  h.api.refreshAuthorLinks();
  assert.equal(skeleton.dataset.betterxAuthorLinks,undefined,'Skeleton tweets without an author name must not be locked to none');
  skeleton.setAuthor('cached');
  h.api.refreshAuthorLinks();
  assert.equal(skeleton.control?.children[1]?.children[0]?.href,links[0].href,'Skeleton tweets must inject once the author mounts');

  skeleton.setAuthor('writer');
  h.api.refreshAuthorLinks();
  assert.equal(skeleton.control?.children[1]?.children[0]?.href,'https://github.com/writer','Recycled home articles must replace stale author buttons');
  const writerControl=skeleton.control;
  skeleton.setAuthor('uncached');
  h.api.refreshAuthorLinks();
  assert.equal(writerControl.isConnected,false);
  assert.equal(skeleton.querySelector('.BetterX-author-links'),null,'Recycled home articles reassigned to an uncached author must remove stale buttons');
  assert.equal(skeleton.dataset.betterxAuthorLinks,'none');

  // Issue 3: returning to /home while home articles are not yet mounted must not lose the generation bump.
  const returning=h.addArticle('later');
  h.api.refreshAuthorLinks();
  assert.equal(returning.dataset.betterxAuthorLinks,'none');
  returning.isConnected=false;
  h.context.location.pathname='/later/status/700';
  h.api.refreshAuthorLinks();
  await flush();
  h.context.location.pathname='/home';
  h.api.refreshAuthorLinks();
  assert.equal(returning.control,null);
  returning.isConnected=true;
  h.api.refreshAuthorLinks();
  assert.equal(returning.control?.children[1]?.children[0]?.href,'https://www.pixiv.net/users/999',
    'Home articles re-attached after returning from detail view must re-evaluate stale none markers');

  // Reserved single-segment paths inside User-Name must be skipped in favor of the actual handle.
  const verifiedHeader={
    isConnected:true,dataset:{},
    closest(selector){return selector==='article'||selector==='article[data-testid="tweet"]'?verifiedHeader:selector==='[data-testid="primaryColumn"]'?h.context.document:null;},
    querySelector(selector){
      if(selector==='[data-testid="User-Name"]')return {querySelectorAll:()=>[{pathname:'/home'},{pathname:'/about/'},{pathname:'/Cached/'}]};
      return null;
    },
  };
  const ctx=loadUserscript('getArticleAuthorName');
  assert.equal(ctx.__test.getArticleAuthorName(verifiedHeader),'cached');

  // Re-harvesting identical links after in-memory LRU eviction must not trigger generation churn.
  const evictStored=new Map([['betterx_author_links:evicted',{links,expiresAt:200000}]]);
  const evictHarness=homeHarness(Object.fromEntries(evictStored));
  evictHarness.api.getCachedAuthorProfileLinks('evicted');
  for(let i=0;i<210;i++)await evictHarness.api.cacheHarvestedAuthorProfileLinks(`filler_${i}`,[{href:`https://example.org/${i}`,label:`${i}`}]);
  const miss=evictHarness.addArticle('miss_user');
  evictHarness.api.refreshAuthorLinks();
  const missQueries=miss.nameQueries;
  await evictHarness.api.cacheHarvestedAuthorProfileLinks('evicted',links);
  evictHarness.api.refreshAuthorLinks();
  assert.equal(miss.nameQueries,missQueries,'Evicted unchanged cache hits must not re-scan unrelated cache misses');
}
// Partial user payloads must not wipe valid cached links; timeline payloads harvest non-empty profiles safely.
{
  const stored=new Map([['betterx_author_links:alice',{links,expiresAt:200000}]]);
  let nextResponse=null;
  const makeRes=(url,body)=>({
    url,ok:true,status:200,headers:{get:()=>'application/json'},
    json:async()=>body,clone:()=>({text:async()=>JSON.stringify(body)}),
  });
  const context=loadUserscript('installNetworkHooks, getCachedAuthorProfileLinks, drainNetworkHarvestQueue, networkHarvestQueue','now=()=>globalThis.clock;',{
    clock:100000,
    GM_getValue:(key,fallback)=>stored.get(key)??fallback,
    GM_setValue:(key,value)=>stored.set(key,value),
    GM_xmlhttpRequest:options=>options.onerror(),
    fetch:async()=>nextResponse,
  });
  context.__test.installNetworkHooks();

  // Disabled authorLinksEnabled must not queue text-only HomeTimeline payloads for profile harvesting.
  nextResponse=makeRes('https://x.com/i/api/graphql/abc/HomeTimeline',{
    data:{home:{home_timeline_urt:{instructions:[{entries:[{content:{itemContent:{tweet_results:{result:{
      __typename:'Tweet',rest_id:'900',
      core:{user_results:{result:{
        __typename:'User',rest_id:'10',core:{screen_name:'DisabledUser'},
        profile_bio:{entities:{description:{urls:[{expanded_url:'https://example.org/off',display_url:'off'}]}}},
      }}},
    }}}}}]}]}}},
  });
  await context.fetch('https://x.com/i/api/graphql/abc/HomeTimeline');
  await flush();
  assert.equal(context.__test.networkHarvestQueue.length,0,'Disabled author links must not queue profile-only timeline payloads');
  assert.equal(stored.has('betterx_author_links:disableduser'),false);

  context.__test.state.settings.authorLinksEnabled=true;

  for(const [url,body] of [
    ['https://x.com/i/api/graphql/abc/UserByScreenName',{data:{user:{result:{__typename:'User',core:{screen_name:'Alice'},profile_bio:{entities:{description:{urls:[]}}}}}}}],
    ['https://x.com/i/api/graphql/abc/ProfileSpotlightsQuery',{data:{user_result_by_screen_name:{result:{__typename:'User',legacy:{screen_name:'Alice',entities:{description:{urls:[]}}}}}}}],
    ['https://x.com/i/api/graphql/abc/UsersByRestIds',{data:{users:[{result:{__typename:'User',legacy:{screen_name:'Alice',entities:{description:{urls:[]}}}}}]}}],
    ['https://x.com/i/api/graphql/abc/UserByScreenName',{data:{user:{result:{__typename:'User',legacy:{screen_name:'Alice',url:'https://t.co/site',entities:{description:{urls:[]},url:{urls:[]}}}}}}}],
    ['https://x.com/i/api/graphql/abc/UserByScreenName',{data:{user:{result:{__typename:'User',legacy:{screen_name:'Alice',entities:{description:{}}}}}}}],
    ['https://x.com/i/api/graphql/abc/UserByScreenName',{data:{user:{result:{__typename:'User',core:{screen_name:'Alice'},profile_bio:{entities:{description:{urls:[{expanded_url:'https://example.org/partial',display_url:'example.org/partial'}]}}}}}}}],
  ]){
    nextResponse=makeRes(url,body);
    await context.fetch(url);
    await flush();
  }
  assert.deepEqual(Array.from(context.__test.getCachedAuthorProfileLinks('alice'),item=>item.href),[links[0].href],
    'Partial or empty passive user payloads must not overwrite an existing valid cache');

  for(const [url,body] of [
    ['https://x.com/i/api/graphql/abc/ProfileSpotlightsQuery',{data:{user_result_by_screen_name:{result:{__typename:'User',legacy:{screen_name:'SpotlightEmpty',entities:{description:{urls:[]}}}}}}}],
    ['https://x.com/i/api/graphql/abc/UserByScreenName',{data:{user:{result:{__typename:'User',core:{screen_name:'NullEntities'},profile_bio:{entities:{description:{urls:[]}}},legacy:{entities:null}}}}}],
  ]){
    nextResponse=makeRes(url,body);
    await context.fetch(url);
    await flush();
  }
  assert.equal(stored.has('betterx_author_links:spotlightempty'),false,'Partial spotlight endpoints must not write empty negative caches');
  assert.equal(stored.has('betterx_author_links:nullentities'),false,'Null legacy.entities must not pass completeness checks');

  // REST friends/list.json must never trigger timeline author link harvesting.
  nextResponse=makeRes('https://x.com/i/api/1.1/friends/list.json?cursor=-1',{
    users:[{id_str:'77',screen_name:'FriendUser',entities:{url:{urls:[{expanded_url:'https://example.org/friend',display_url:'friend'}]}}}],
  });
  await context.fetch('https://x.com/i/api/1.1/friends/list.json?cursor=-1');
  await flush();
  context.__test.drainNetworkHarvestQueue({timeRemaining:()=>100});
  await flush();
  assert.equal(stored.has('betterx_author_links:frienduser'),false,'REST friends/list.json must not harvest author profile links');

  // Later complete User node in the same timeline payload must supersede an earlier partial one.
  nextResponse=makeRes('https://x.com/i/api/graphql/abc/HomeTimeline',{
    data:{home:{home_timeline_urt:{instructions:[{entries:[
      {content:{itemContent:{tweet_results:{result:{
        __typename:'Tweet',rest_id:'901a',
        core:{user_results:{result:{
          __typename:'User',rest_id:'11',core:{screen_name:'HomeAuthor'},
          profile_bio:{entities:{description:{urls:[{expanded_url:'https://www.pixiv.net/users/555',display_url:'pixiv.net/users/555'}]}}},
        }}},
      }}}}},
      {content:{itemContent:{tweet_results:{result:{
        __typename:'Tweet',rest_id:'901b',
        core:{user_results:{result:{
          __typename:'User',rest_id:'11',core:{screen_name:'HomeAuthor'},
          profile_bio:{entities:{description:{urls:[{expanded_url:'https://www.pixiv.net/users/555',display_url:'pixiv.net/users/555'}]}}},
          legacy:{screen_name:'HomeAuthor',id_str:'11',entities:{url:{urls:[{expanded_url:'https://github.com/homeauthor',display_url:'github.com/homeauthor'}]}}},
        }}},
      }}}}},
    ]}]}}},
  });
  await context.fetch('https://x.com/i/api/graphql/abc/HomeTimeline');
  await flush();
  context.__test.drainNetworkHarvestQueue({timeRemaining:()=>100});
  await flush();
  assert.deepEqual(
    Array.from(context.__test.getCachedAuthorProfileLinks('homeauthor'),item=>item.href),
    ['https://www.pixiv.net/users/555','https://github.com/homeauthor'],
    'Complete User nodes must supersede earlier partial nodes and keep combined links'
  );

  // Failing short link in HomeTimeline must not overwrite an already-resolved cache entry.
  nextResponse=makeRes('https://x.com/i/api/graphql/abc/HomeTimeline',{
    data:{home:{home_timeline_urt:{instructions:[{entries:[{content:{itemContent:{tweet_results:{result:{
      __typename:'Tweet',rest_id:'903',
      core:{user_results:{result:{
        __typename:'User',rest_id:'13',core:{screen_name:'Alice'},
        legacy:{screen_name:'Alice',entities:{url:{urls:[{expanded_url:'https://bit.ly/fail',display_url:'bit.ly/fail'}]}}},
      }}},
    }}}}}]}]}}},
  });
  await context.fetch('https://x.com/i/api/graphql/abc/HomeTimeline');
  await flush();
  context.__test.drainNetworkHarvestQueue({timeRemaining:()=>100});
  await flush();
  assert.deepEqual(Array.from(context.__test.getCachedAuthorProfileLinks('alice'),item=>item.href),[links[0].href],
    'Failed short-link resolution from timeline must preserve previously resolved links');

  nextResponse=makeRes('https://x.com/i/api/graphql/abc/HomeTimeline',{
    data:{home:{home_timeline_urt:{instructions:[{entries:[{content:{itemContent:{tweet_results:{result:{
      __typename:'Tweet',rest_id:'902',
      core:{user_results:{result:{
        __typename:'User',rest_id:'12',core:{screen_name:'EmptyTimeline'},
        legacy:{screen_name:'EmptyTimeline',entities:{description:{urls:[]}}},
      }}},
    }}}}}]}]}}},
  });
  await context.fetch('https://x.com/i/api/graphql/abc/HomeTimeline');
  await flush();
  context.__test.drainNetworkHarvestQueue({timeRemaining:()=>100});
  await flush();
  assert.equal(stored.has('betterx_author_links:emptytimeline'),false,'Timeline payloads must not write negative empty caches');
}
console.log('Author links preserve current profiles, honor the setting across network paths, and keep homepage, detail, retry, cache, and icon behavior. Short links use X data or cached destinations without preflight requests.');
