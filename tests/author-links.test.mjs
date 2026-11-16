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
  const calls=[];
  const store=new Map();
  const context=loadUserscript('isShortUrl, resolveShortUrl','now=()=>globalThis.clock;',{
    clock:100000,
    GM_getValue:(key,fallback)=>store.get(key)??fallback,
    GM_setValue:(key,value)=>store.set(key,value),
    GM_xmlhttpRequest:options=>{
      calls.push({method:options.method,timeout:options.timeout});
      if(options.method==='HEAD'){options.onerror();return;}
      options.onload({status:200,finalUrl:'https://www.pixiv.net/users/123'});
    },
  });
  const {isShortUrl:isShort,resolveShortUrl:resolve}=context.__test;
  for(const url of ['https://t.co/abc','https://t.cn/abc','https://x.gd/abc','https://bit.ly/abc','https://c1n.cn/abc',
    'https://tinyurl.com/abc','https://shrturi.com/abc','https://dub.sh/abc'])assert.ok(isShort(url),`${url} must be treated as a short link`);
  for(const url of ['https://www.pixiv.net/users/123','https://example.org/t.cn','not a url'])assert.ok(!isShort(url),`${url} must not be treated as a short link`);
  assert.equal(await resolve('https://t.co/abc'),'https://www.pixiv.net/users/123','A failed HEAD must fall back to GET');
  assert.deepEqual(calls.map(call=>call.method),['HEAD','GET']);
  assert.ok(calls.every(call=>call.timeout>0&&call.timeout<=6000),'Short link requests must respect the 6s budget');
  const dictionary=store.get('betterx_short_links');
  assert.equal(dictionary['https://t.co/abc'].href,'https://www.pixiv.net/users/123','Resolved short links must be remembered');
  assert.equal(dictionary['https://t.co/abc'].expiresAt,context.clock+365*24*60*60*1000,'Resolved short links are cached for one year');
  calls.length=0;
  assert.equal(await resolve('https://t.co/abc'),'https://www.pixiv.net/users/123');
  assert.equal(calls.length,0,'A remembered short link must not be requested again');
  assert.equal(await resolve('https://www.pixiv.net/users/123'),'https://www.pixiv.net/users/123');
  assert.equal(calls.length,0,'Regular links must not trigger redirect requests');
}
{
  for(const [label,respond] of [['network error',options=>options.onerror()],['timeout',options=>options.ontimeout()],
    ['unsafe redirect',options=>options.onload({status:200,finalUrl:'javascript:alert(1)'})],
    ['missing final url',options=>options.onload({status:200})]]){
    const context=loadUserscript('resolveShortUrl','',{GM_xmlhttpRequest:respond});
    assert.equal(await context.__test.resolveShortUrl('https://bit.ly/abc'),'https://bit.ly/abc',`${label} must keep the original short link`);
    assert.equal(await context.__test.resolveShortUrl('https://bit.ly/abc',0),'https://bit.ly/abc','An exhausted timeout budget must not throw');
  }
  const throwing=loadUserscript('resolveShortUrl','',{GM_xmlhttpRequest:()=>{throw new Error('blocked');}});
  assert.equal(await throwing.__test.resolveShortUrl('https://bit.ly/abc'),'https://bit.ly/abc','A blocked request API must fall back silently');
}
{
  const shortUrl='https://t.co/AbCdEf';
  const profile={legacy:{entities:{url:{urls:[
    {expanded_url:shortUrl,display_url:'t.co/AbCdEf'},
    {expanded_url:'https://example.org/',display_url:'example.org'},
  ]}}}};
  const calls=[];
  const context=loadUserscript('requestAuthorProfileLinks','requestXSessionJson=async()=>globalThis.payload;',{
    payload:{data:{user:{result:profile}}},
    GM_xmlhttpRequest:options=>{calls.push(options.url);options.onload({status:200,finalUrl:'https://www.pixiv.net/users/123'});},
  });
  const result=await context.__test.requestAuthorProfileLinks('author');
  assert.deepEqual(Array.from(result,link=>link.href),['https://www.pixiv.net/users/123','https://example.org/']);
  assert.equal(result[0].label,'pixiv.net/users/123','Short link labels must follow the resolved host');
  assert.deepEqual(calls,[shortUrl],'Only short links trigger redirect requests');
}
{
  const shortUrl='https://bit.ly/xyz';
  const profile={legacy:{entities:{url:{urls:[{expanded_url:shortUrl,display_url:'bit.ly/xyz'}]}}}};
  const context=loadUserscript('requestAuthorProfileLinks','requestXSessionJson=async()=>globalThis.payload;',{
    payload:{data:{user:{result:profile}}},
    GM_xmlhttpRequest:options=>options.ontimeout(),
  });
  const result=await context.__test.requestAuthorProfileLinks('author');
  assert.deepEqual(Array.from(result,link=>link.href),[shortUrl],'Failed resolution keeps the original short link');
  assert.equal(result[0].label,'bit.ly/xyz','Failed resolution keeps the original label');
}
{
  const profile={legacy:{entities:{url:{urls:[{expanded_url:'https://t.co/one'},{expanded_url:'https://t.co/two'}]}}}};
  const context=loadUserscript('requestAuthorProfileLinks','requestXSessionJson=async()=>globalThis.payload;',{
    payload:{data:{user:{result:profile}}},
    GM_xmlhttpRequest:options=>options.onload({status:200,finalUrl:'https://www.pixiv.net/users/123'}),
  });
  const result=await context.__test.requestAuthorProfileLinks('author');
  assert.deepEqual(Array.from(result,link=>link.href),['https://www.pixiv.net/users/123'],'Links converging on one target must collapse');
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
        closest(){return null;},
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
  const context=loadUserscript('refreshAuthorLinks, getCachedAuthorProfileLinks, loadAuthorProfileLinks, installNetworkHooks, createAuthorLinkIcon',
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
      closest(selector){return selector==='article'?article:null;},
      querySelector(){return null;},
      getBoundingClientRect(){return {width:0,height:0};},
      before(inserted){control=inserted;},
    };
    const article={isConnected:true,dataset:{},nameQueries:0,
      closest(){return null;},
      querySelector(selector){
        if(selector==='[data-testid="User-Name"]'){
          article.nameQueries++;
          return {querySelector:()=>name?{pathname:'/'+name}:null};
        }
        if(selector==='button[data-testid="caret"]')return caret;
        if(selector==='.BetterX-author-links')return control;
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
  const h=homeHarness({'betterx_author_links:author':{links:[{href:'https://t.co/old',label:'t.co/old'}],expiresAt:200000}});
  const cached=h.api.getCachedAuthorProfileLinks('author');
  assert.equal(cached[0].href,'https://t.co/old','The timeline renders the cached link before resolution');
  await flush();
  assert.deepEqual(h.redirects,['https://t.co/old'],'A legacy cached short link must still resolve from the timeline');
  assert.equal(h.stored.get('betterx_author_links:author').links[0].href,'https://www.pixiv.net/users/1');
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
  const protocolOnly=loadUserscript('resolveShortUrl','',{
    GM_xmlhttpRequest:options=>options.onload({status:200,finalUrl:'https://t.co/abc'}),
  });
  assert.equal(await protocolOnly.__test.resolveShortUrl('http://t.co/abc'),'http://t.co/abc','A protocol-only redirect must not count as resolved');
  const chained=loadUserscript('resolveShortUrl','',{
    GM_xmlhttpRequest:options=>options.onload({status:200,finalUrl:'https://bit.ly/still'}),
  });
  assert.equal(await chained.__test.resolveShortUrl('https://t.co/abc'),'https://t.co/abc','A redirect to another shortener must keep the original link');
}
{
  const stored=new Map([['betterx_author_links:author',{links:[{href:'https://t.co/old',label:'t.co/old'}],expiresAt:200000}]]);
  const requested=[];
  const context=loadUserscript('loadAuthorProfileLinks','now=()=>globalThis.clock;',{
    clock:100000,
    GM_getValue:(key,fallback)=>stored.get(key)??fallback,
    GM_setValue:(key,value)=>stored.set(key,value),
    GM_xmlhttpRequest:options=>{requested.push(options.url);options.onload({status:200,finalUrl:'https://www.pixiv.net/users/1'});},
  });
  const cached=await context.__test.loadAuthorProfileLinks('author');
  assert.equal(cached[0].href,'https://t.co/old','Cached links must render before the background resolution finishes');
  await flush();
  assert.deepEqual(requested,['https://t.co/old'],'Legacy caches holding short links must resolve once in the background');
  const refreshed=stored.get('betterx_author_links:author');
  assert.equal(refreshed.links[0].href,'https://www.pixiv.net/users/1','Resolved short links must be persisted');
  assert.equal(refreshed.expiresAt,200000,'Overwriting a resolved cache entry must keep its original expiry');
  assert.deepEqual(Object.keys(refreshed),['links','expiresAt'],'No migration marker may be stored');
  await context.__test.loadAuthorProfileLinks('author');await flush();
  assert.deepEqual(requested,['https://t.co/old'],'An already refreshed cache entry must not be requested again');
}
{
  const stored=new Map([['betterx_author_links:author',{links:[{href:'https://t.co/old',label:'t.co/old'}],expiresAt:200000}]]);
  const requested=[];
  const context=loadUserscript('loadAuthorProfileLinks','now=()=>globalThis.clock;',{
    clock:100000,
    GM_getValue:(key,fallback)=>stored.get(key)??fallback,
    GM_setValue:(key,value)=>stored.set(key,value),
    GM_xmlhttpRequest:options=>{requested.push(options.method);options.onerror();},
  });
  await context.__test.loadAuthorProfileLinks('author');await flush();
  assert.deepEqual(requested,['HEAD','GET'],'A failed resolution tries HEAD then GET once');
  await context.__test.loadAuthorProfileLinks('author');await flush();
  assert.equal(requested.length,2,'Failed short links must not be retried on every cache read');
  assert.equal(stored.get('betterx_author_links:author').links[0].href,'https://t.co/old','A failed resolution leaves the cache untouched');
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
  context.__test.installNetworkHooks();

  nextResponse=makeRes('https://x.com/i/api/graphql/abc/UserByScreenName?variables=%7B%22screen_name%22%3A%22Alice%22%7D',{
    data:{user:{result:{__typename:'User',core:{screen_name:'Alice'},profile_bio:{entities:{description:{urls:[
      {expanded_url:'https://t.co/alice',display_url:'t.co/alice'},
    ]}}}}}},
  });
  await context.fetch('https://x.com/i/api/graphql/abc/UserByScreenName?variables=%7B%22screen_name%22%3A%22Alice%22%7D');
  await flush();
  assert.deepEqual(redirects,['https://t.co/alice'],'Intercepted user detail short links must resolve before caching');
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
console.log('Author links cache empty results, bound retries, recover on demand and ignore obsolete responses; profile parsers validate and deduplicate links; short links resolve through HEAD/GET redirects, refresh labels, resolve legacy cached short links once in place without extending their expiry, reject protocol-only or chained shortener redirects and fall back on failures; the home timeline injects isolated cached-author menus without extra requests and skips re-scanning decided tweets; intercepted user detail APIs populate the cache across fetch, XHR and session requests; site icons cache for one year and prefetch on link discovery or control injection.');
