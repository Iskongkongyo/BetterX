(() => {
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function startupFrame(width,settings,duration=80){
    const frame=document.createElement('iframe');
    frame.style.cssText=`position:fixed;left:0;top:0;width:${width}px;height:780px;border:0;z-index:2147483646`;
    const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=reject;});
    frame.srcdoc=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body><main role="main"></main><script>
      window.GM_getValue=(key,fallback)=>key==='betterx_settings_mirror_v1'?{version:1,settings:${JSON.stringify(settings)}}:fallback;
      window.__startupWrites=[];window.GM_setValue=(...args)=>__startupWrites.push(args);
      window.GM_registerMenuCommand=()=>{};window.GM_info={script:{},scriptHandler:'Startup appearance regression'};
      window.__startupErrors=[];
      addEventListener('error',event=>__startupErrors.push(String(event.error||event.message)));
      addEventListener('unhandledrejection',event=>__startupErrors.push(String(event.reason)));
    </script><script src="/badge-startup.js"></script><script>
      window.__badgeFrames=[];
      const sample=()=>{
        const root=document.querySelector('#BetterX-root'),badge=document.querySelector('#BetterX-badge');
        if(root&&badge){const style=getComputedStyle(badge),rect=badge.getBoundingClientRect();
          __badgeFrames.push({root:root.className,badge:badge.className,width:rect.width,height:rect.height,
            visibility:style.visibility,opacity:style.opacity,right:innerWidth-rect.right,top:rect.top,
            loaded:__test.state.settingsLoaded});}
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
      __test.boot();
    </script></body></html>`;
    document.body.append(frame);
    try{
      await loaded;
      for(let index=0;index<50&&!frame.contentWindow.__badgeFrames.length;index++)await sleep(20);
      await sleep(duration);
      const win=frame.contentWindow,api=win.__test,samples=win.__badgeFrames;
      assert(samples.length>=2,'No first-paint badge samples were collected');
      assert(samples.every(sample=>!sample.loaded),'The database must remain blocked throughout the startup check');
      assert(win.__startupErrors.length===0,JSON.stringify(win.__startupErrors));
      assert(win.__startupWrites.length===0,'Startup appearance must not overwrite saved settings');
      win.document.dispatchEvent(new win.KeyboardEvent('keydown',{key:'x',altKey:true,bubbles:true}));
      assert(api.state.panelOpen&&api.state.panelEl.style.display!=='none','Alt+X must work while database loading is blocked');
      return samples;
    }finally{frame.remove();}
  }
  window.__runBadgeStartupTests=async(_api,check)=>{
    await check('desktop startup paints the saved icon or capsule directly while IndexedDB is blocked',async()=>{
      const icon=await startupFrame(1000,{useMobileBadgeOnDesktop:true,badgePos:{left:840,right:24,bottom:90},theme:'light'},1150);
      assert(icon.every(sample=>sample.badge.includes('desktop-icon-mode')&&sample.width===64&&Math.abs(sample.right-24)<1),
        'The desktop icon flashed a capsule or lost its saved edge: '+JSON.stringify(icon[0]));
      const capsule=await startupFrame(1000,{useMobileBadgeOnDesktop:false});
      assert(capsule.every(sample=>!sample.badge.includes('mobile-mode')&&!sample.root.includes('BetterX-mobile')),'Saved off must keep the desktop capsule on its first paint');
      const hidden=await startupFrame(1000,{hideAppBadge:true,useMobileBadgeOnDesktop:true});
      assert(hidden.every(sample=>sample.visibility==='hidden'),'A hidden desktop badge must not flash before its preference loads');
      return {firstPaintIcon:true,savedRight:24,blockedForMs:1150,savedOffVerified:true,hiddenBadgeVerified:true,shortcutAvailable:true};
    });
    await check('mobile startup paints the saved blue handle or circle directly while IndexedDB is blocked',async()=>{
      const handle=await startupFrame(390,{useMobileBadgeHandle:true,mobileBadgeHandleTop:170},1150);
      assert(handle.every(sample=>sample.root.includes('BetterX-mobile-badge-collapsed')&&sample.width===15&&sample.height===76&&sample.top===170&&Math.abs(sample.right)<1),
        'The blue handle flashed a circle or lost its saved position: '+JSON.stringify(handle[0]));
      const circle=await startupFrame(390,{useMobileBadgeHandle:false,hideAppBadge:false});
      assert(circle.every(sample=>sample.badge.includes('mobile-mode')&&!sample.root.includes('BetterX-mobile-badge-collapsed')&&sample.width===52),'Saved off must keep the mobile circle on its first paint');
      const legacy=await startupFrame(390,{hideAppBadgeOnDesktop:true,mobileBadgeHandleTop:190});
      assert(legacy.every(sample=>sample.width===15&&sample.top===190),'Legacy hidden-badge settings must start as the blue handle on mobile');
      return {firstPaintHandle:true,savedTop:170,blockedForMs:1150,savedOffVerified:true,legacyHiddenVerified:true,shortcutAvailable:true};
    });
  };
})();
