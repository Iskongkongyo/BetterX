(() => {
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const colors={red:[220,30,40],green:[20,200,60],yellow:[250,190,0],blue:[20,80,230]};
  const url=(color,extension='png')=>`https://pbs.twimg.com/betterx-shot/${color}.${extension}?format=${extension}&name=small`;
  const transport=async raw=>{
    const color=Object.keys(colors).find(color=>raw.includes(`/betterx-shot/${color}.`));
    if(!color)throw new Error('Unknown fixture image');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="rgb(${colors[color]})"/></svg>`;
    return {bytes:new TextEncoder().encode(svg),type:'application/octet-stream'};
  };
  const post=(id='420001',dark=false)=>{
    const article=document.createElement('article');
    article.style.cssText=`position:relative;width:360px;box-sizing:border-box;padding:16px;background:${dark?'#000':'#fff'};color:${dark?'#e7e9ea':'#0f1419'};font:15px/22px Arial`;
    article.innerHTML=`<div style="display:flex;align-items:center;gap:10px;height:44px"><img data-shot="avatar" src="${url('red')}" style="width:40px;height:40px;border-radius:50%"><div data-testid="User-Name"><a href="/photo" style="color:inherit"><span>Author <img data-shot="emoji" alt="🔥" src="${url('yellow','svg')}" style="width:20px;height:20px;vertical-align:middle"></span></a><a href="/photo/status/${id}"><time>now</time></a></div><button data-testid="caret" aria-label="More" aria-haspopup="menu">⋯</button></div><div data-testid="tweetText" style="margin-top:12px">Colorful post with images</div><div style="display:flex;gap:10px;margin-top:12px"><img data-shot="photo" src="${url('green')}" style="width:130px;height:80px;object-fit:cover"><div data-shot="background" style="width:80px;height:80px;background-image:url('${url('blue')}');background-size:cover"></div></div><span class="BetterX-download-controls" style="position:absolute;right:0;top:0">SHOULD NOT APPEAR</span>`;
    document.querySelector('main').appendChild(article);return article;
  };
  const points=article=>Object.fromEntries([...article.querySelectorAll('[data-shot]')].map(element=>{
    const outer=article.getBoundingClientRect(),rect=element.getBoundingClientRect();
    return [element.dataset.shot,{x:rect.left-outer.left+rect.width/2,y:rect.top-outer.top+rect.height/2}];
  }));
  const decode=async blob=>{
    const image=new Image(),source=URL.createObjectURL(blob);
    try{image.src=source;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      const context=canvas.getContext('2d');context.drawImage(image,0,0);return {canvas,context};
    }finally{URL.revokeObjectURL(source);}
  };
  const checkColor=(decoded,point,expected,scale,label)=>{
    const actual=[...decoded.context.getImageData(Math.floor(point.x*scale),Math.floor(point.y*scale),1,1).data];
    assert(expected.every((value,index)=>Math.abs(actual[index]-value)<5),`${label}: expected ${expected}, received ${actual}`);
  };
  const mobileSheet=()=>{
    const template=document.createElement('template');template.innerHTML=window.__mobilePostMoreHtml;
    return template.content.firstElementChild;
  };
  const mobileTrigger=article=>{
    const trigger=article.querySelector('[data-testid="caret"]');
    trigger.setAttribute('aria-label','更多');trigger.setAttribute('aria-expanded','false');
    trigger.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24"><g><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></g></svg>';
    return trigger;
  };
  window.__runPostScreenshotTests=async(api,check)=>{
    await check('PNG preserves color in cross-origin avatars, SVG emoji, photos and CSS backgrounds',async()=>{
      const originalGM=window.GM_xmlhttpRequest;let rejectedOnce=false;
      window.GM_xmlhttpRequest=()=>{throw new Error('The fixture transport should be used');};
      const calls=[],restore=api.mockScreenshotTransport(async(raw,signal)=>{
        calls.push(raw);if(!rejectedOnce&&raw.includes('/red.')){rejectedOnce=true;throw new Error('Manager request failed');}return transport(raw,signal);
      });
      try{
        for(const dark of [false,true]){
          const article=post(dark?'420002':'420001',dark);
          const definitions=document.createElementNS('http://www.w3.org/2000/svg','svg');
          definitions.style.cssText='position:absolute;width:0;height:0';
          definitions.innerHTML='<defs><path id="shot-icon" d="M0 0h24v24H0z"/><linearGradient id="shot-gradient"><stop stop-color="rgb(180,80,20)"/><stop offset="1" stop-color="rgb(180,80,20)"/></linearGradient></defs>';
          document.body.appendChild(definitions);
          const icons=document.createElement('div');icons.style.cssText='display:flex;gap:8px;margin-top:8px';
          icons.innerHTML='<svg data-shot="icon" width="24" height="24" viewBox="0 0 24 24" style="fill:rgb(180,0,200)"><use href="#shot-icon"/></svg><svg data-shot="gradient" width="24" height="24"><rect width="24" height="24" fill="url(#shot-gradient)"/></svg><span data-shot="nativeEmoji" style="font:24px/28px Segoe UI Emoji,Arial">🌈</span><span data-shot="pseudo" class="shot-pseudo" style="display:block;width:24px;height:24px"></span>';
          const pseudoStyle=document.createElement('style');pseudoStyle.textContent='.shot-pseudo::before{content:"";display:block;width:24px;height:24px;background:rgb(0,160,170)}';document.head.appendChild(pseudoStyle);
          article.appendChild(icons);
          try{
            await Promise.all([...article.querySelectorAll('img')].map(image=>image.decode()));
            let tainted=false;const scratch=document.createElement('canvas');
            try{scratch.getContext('2d').drawImage(article.querySelector('img'),0,0);scratch.toDataURL();}catch{tainted=true;}
            assert(tainted,'The fixture failed to exercise the cross-origin image path');
            const before=article.outerHTML,locations=points(article);
            const capture=await api.capturePostScreenshot(article,dark?'420002':'420001');
            assert(capture.blob.type==='image/png' && capture.blob.size>0,'No PNG was generated');
            const output=await decode(capture.blob),scale=capture.report.scale;
            checkColor(output,locations.avatar,colors.red,scale,'avatar');
            checkColor(output,locations.emoji,colors.yellow,scale,'SVG emoji');
            checkColor(output,locations.photo,colors.green,scale,'post photo');
            checkColor(output,locations.background,colors.blue,scale,'CSS background');
            checkColor(output,locations.icon,[180,0,200],scale,'referenced SVG icon');
            checkColor(output,locations.gradient,[180,80,20],scale,'referenced SVG gradient');
            checkColor(output,locations.pseudo,[0,160,170],scale,'CSS pseudo element');
            const emoji=locations.nativeEmoji;
            const rgba=output.context.getImageData(Math.floor((emoji.x-10)*scale),Math.floor((emoji.y-10)*scale),Math.floor(20*scale),Math.floor(20*scale)).data;
            let colored=0;for(let index=0;index<rgba.length;index+=4)if(Math.max(...rgba.slice(index,index+3))-Math.min(...rgba.slice(index,index+3))>40)colored++;
            assert(colored>20,'Native emoji lost its colored glyph');
            checkColor(output,{x:355,y:5},dark?[0,0,0]:[255,255,255],scale,'post background');
            assert(article.outerHTML===before,'Capture changed the live article');
            assert(capture.report.resources.length===4 && capture.report.resources.every(resource=>resource.ok),'Embedded asset reporting is incomplete');
            if(!dark)assert(capture.report.resources.some(resource=>resource.fallback==='cors-fetch'),'A failed manager request did not use the CORS fallback');
            assert(output.canvas.width===720,'The screenshot did not retain 2x resolution');
            window.__screenshotPreview=capture.blob;
          }finally{article.remove();definitions.remove();pseudoStyle.remove();}
        }
        return {themes:2,colorSampleChecks:18,networkAssets:calls.length,liveDomUnchanged:true};
      }finally{restore();if(originalGM)window.GM_xmlhttpRequest=originalGM;else delete window.GM_xmlhttpRequest;}
    });

    await check('failed image requests do not produce gray screenshots or poison a later retry',async()=>{
      let fail=true;const saved=[],article=post('420003');
      const restore=api.mockScreenshotTransport(async(raw,signal)=>{if(fail&&raw.includes('/green.'))throw new Error('HTTP 503');return transport(raw,signal);});
      const undoSave=api.mockDownloadTransport({save:(blob,name)=>saved.push({blob,name})});
      try{
        const first=api.runPostScreenshot(article,'420003');
        await api.runPostScreenshot(article,'420003');
        await first;
        assert(saved.length===0,'An incomplete screenshot was silently saved');
        const report=api.screenshotReport();
        assert(!report.ok && report.resources.some(resource=>resource.error==='HTTP 503'),'Missing image failures were not diagnosed');
        api.exportScreenshotDiagnostic();
        const diagnostic=JSON.parse(await saved[0].blob.text());
        assert(diagnostic.resources.some(resource=>resource.host==='pbs.twimg.com' && !resource.ok),'Diagnostic export lost the failed image');
        api.closeBetterXDialog();fail=false;
        const capture=await api.runPostScreenshot(article,'420003');
        assert(capture?.report.ok && saved.length===2 && saved[1].name.endsWith('.png'),'A retry did not recover from the resource failure');
        checkColor(await decode(saved[1].blob),points(article).photo,colors.green,capture.report.scale,'retried photo');
        return {incompletePngSaved:false,retryRecovered:true,diagnosticExportVerified:true};
      }finally{api.closeBetterXDialog();restore();undoSave();article.remove();}
    });

    await check('video posters, readable canvas and scrolled media stay colored without changing playback DOM',async()=>{
      const restore=api.mockScreenshotTransport(transport),article=post('420004');
      try{
        const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;margin-top:8px';
        row.innerHTML=`<div data-shot="carousel" style="display:flex;overflow:hidden;width:100px;height:60px"><img src="${url('red')}" style="width:100px;height:60px;flex:none"><img src="${url('green')}" style="width:100px;height:60px;flex:none"></div><video data-shot="video" poster="${url('blue')}" style="width:100px;height:60px;object-fit:cover"></video><canvas data-shot="canvas" width="50" height="60" style="width:50px;height:60px"></canvas>`;
        article.appendChild(row);row.querySelector('canvas').getContext('2d').fillStyle='#00c8dc';row.querySelector('canvas').getContext('2d').fillRect(0,0,50,60);
        row.querySelector('[data-shot="carousel"]').scrollLeft=100;
        const before=article.outerHTML,locations=points(article);
        const capture=await api.capturePostScreenshot(article,'420004'),output=await decode(capture.blob);
        checkColor(output,locations.carousel,colors.green,capture.report.scale,'scrolled carousel');
        checkColor(output,locations.video,colors.blue,capture.report.scale,'video poster');
        checkColor(output,locations.canvas,[0,200,220],capture.report.scale,'canvas');
        assert(capture.report.videoPosters===1,'Video poster fallback was not recorded');
        assert(article.outerHTML===before && row.querySelector('[data-shot="carousel"]').scrollLeft===100,'Screenshot modified the live media');
        const empty=document.createElement('video');empty.style.cssText='width:100px;height:60px';article.appendChild(empty);
        let failed=false;try{await api.capturePostScreenshot(article,'420004');}catch{failed=true;}
        assert(failed,'A posterless video incorrectly used an unrelated image such as the avatar');
        return {poster:true,canvas:true,scrollPositionPreserved:true};
      }finally{restore();article.remove();}
    });

    await check('the post More menu contains one screenshot action and works with media downloads disabled',async()=>{
      const restore=api.mockScreenshotTransport(transport),saved=[];
      const undoSave=api.mockDownloadTransport({save:(blob,name)=>saved.push({blob,name})});
      const article=post('420005'),trigger=article.querySelector('[data-testid="caret"]');let menu,secondArticle;
      trigger.addEventListener('click',()=>{
        if(menu?.isConnected){menu.remove();return;}
        menu=document.createElement('div');menu.setAttribute('role','menu');
        menu.style.cssText='position:fixed;left:100px;top:50px;background:white;color:black';
        menu.innerHTML='<div role="menuitem">Original action</div>';document.body.appendChild(menu);
      });
      try{
        api.setSettingsPartial({mediaDownload:false});api.installPostScreenshotMenu();api.installPostScreenshotMenu();
        trigger.click();await sleep(0);
        assert(menu.querySelectorAll('[data-betterx-screenshot-menu]').length===1,'The screenshot menu item was absent or duplicated');
        assert(menu.firstElementChild.textContent==='保存帖子截图','The screenshot action was not placed first');
        menu.innerHTML='<div role="menuitem">Rerendered original action</div>';await sleep(0);
        assert(menu.querySelectorAll('[data-betterx-screenshot-menu]').length===1,'React-like menu replacement lost the screenshot entry');
        menu.querySelector('[data-betterx-screenshot-menu]').click();
        for(let attempt=0;attempt<200&&!saved.length;attempt++)await sleep(10);
        assert(saved.length===1 && saved[0].name==='BetterX_photo_420005.png','The menu did not save the selected post');
        assert(!menu.isConnected,'The native menu stayed open during capture');
        assert(api.screenshotReport().ok,'Menu capture did not finish successfully');
        // X can reuse a previously hidden menu for a different post.
        secondArticle=post('420006');const secondTrigger=secondArticle.querySelector('[data-testid="caret"]');
        secondTrigger.addEventListener('click',()=>{if(menu.isConnected)menu.remove();else document.body.appendChild(menu);});
        secondTrigger.click();await sleep(0);
        assert(menu.querySelectorAll('[data-betterx-screenshot-menu]').length===1,'A reused menu duplicated its entry');
        menu.querySelector('[data-betterx-screenshot-menu]').click();
        for(let attempt=0;attempt<200&&saved.length<2;attempt++)await sleep(10);
        assert(saved[1]?.name==='BetterX_photo_420006.png','A reused menu retained the previous post target');
        return {menuItems:1,reinsertedAfterRender:true,reusedMenuTargetVerified:true,independentOfMediaDownloads:true};
      }finally{api.stopScreenshotMenu();menu?.remove();article.remove();secondArticle?.remove();restore();undoSave();api.setSettingsPartial({mediaDownload:true});}
    });

    await check('mobile sheetDialog supports click, early touch opening, visibility changes and rerendering',async()=>{
      api.installPostScreenshotMenu();
      const article=post('420008'),trigger=mobileTrigger(article),sheet=mobileSheet();
      const unrelated=mobileSheet();document.body.appendChild(unrelated);
      const toggle=()=>{if(sheet.isConnected){sheet.remove();trigger.setAttribute('aria-expanded','false');}
        else{document.body.appendChild(sheet);trigger.setAttribute('aria-expanded','true');}};
      trigger.addEventListener('click',toggle);
      try{
        assert(!sheet.querySelector('[role="menu"]'),'The mobile fixture must omit the desktop menu role');
        trigger.querySelector('path').dispatchEvent(new MouseEvent('click',{bubbles:true}));await sleep(0);
        assert(sheet.querySelectorAll('[data-betterx-screenshot-menu]').length===1,'Mobile sheetDialog was not recognized');
        assert(!unrelated.querySelector('[data-betterx-screenshot-menu]'),'An unrelated visible sheet was modified');
        sheet.querySelector('[data-testid="sheetDialog"]').innerHTML='<div role="menuitem">Rerendered mobile action</div>';
        await sleep(0);assert(sheet.querySelectorAll('[data-betterx-screenshot-menu]').length===1,'Mobile rerender lost the screenshot entry');
        trigger.click();await sleep(0);
        sheet.querySelector('[data-betterx-screenshot-menu]')?.remove();
        trigger.removeEventListener('click',toggle);
        // A touch handler can display a sheet before its compatibility click fires.
        trigger.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:81,isPrimary:true,button:0,clientX:10,clientY:10}));
        document.body.appendChild(sheet);trigger.setAttribute('aria-expanded','true');
        trigger.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:81,isPrimary:true,button:0,clientX:10,clientY:10}));
        trigger.click();await sleep(0);
        assert(sheet.querySelectorAll('[data-betterx-screenshot-menu]').length===1,'A pre-click touch sheet was missed');
        api.stopScreenshotMenu();sheet.remove();sheet.querySelector('[data-betterx-screenshot-menu]')?.remove();
        sheet.style.display='none';document.body.appendChild(sheet);trigger.setAttribute('aria-expanded','false');
        trigger.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:82,isPrimary:true,button:0,clientX:10,clientY:10}));
        trigger.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:82,isPrimary:true,button:0,clientX:10,clientY:10}));
        trigger.click();await sleep(0);
        sheet.style.display='block';trigger.setAttribute('aria-expanded','true');await sleep(0);
        assert(sheet.querySelectorAll('[data-betterx-screenshot-menu]').length===1,'An attribute-only visibility change was missed');
        api.stopScreenshotMenu();sheet.remove();sheet.querySelector('[data-betterx-screenshot-menu]')?.remove();
        trigger.setAttribute('aria-expanded','false');
        trigger.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:83,isPrimary:true,button:0,clientX:10,clientY:10}));
        trigger.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:83,isPrimary:true,button:0,clientX:10,clientY:10}));
        document.body.appendChild(sheet);await sleep(0);
        assert(!sheet.querySelector('[data-betterx-screenshot-menu]'),'A cancelled gesture kept watching unrelated menus');
        return {sheetDialog:true,unrelatedSheetPreserved:true,earlyTouchAndVisibilityVerified:true,cancelledGestureCleanedUp:true};
      }finally{api.stopScreenshotMenu();article.remove();sheet.remove();unrelated.remove();}
    });

    window.__prepareNativeMobileScreenshot=()=>{
      const article=post('420007'),trigger=mobileTrigger(article),sheet=mobileSheet(),saved=[];
      article.style.cssText+=';position:fixed;left:12px;top:12px;width:350px;z-index:1000';
      const restore=api.mockScreenshotTransport(transport);
      const undoSave=api.mockDownloadTransport({save:(blob,name)=>saved.push({blob,name})});
      let openedByTouch=false,maskPressed=false;
      const toggle=()=>{if(sheet.isConnected){sheet.remove();trigger.setAttribute('aria-expanded','false');}
        else{document.body.appendChild(sheet);trigger.setAttribute('aria-expanded','true');}};
      trigger.addEventListener('pointerup',()=>{toggle();openedByTouch=true;});
      trigger.addEventListener('click',event=>{if(event.detail>0&&openedByTouch){openedByTouch=false;return;}toggle();});
      const mask=sheet.querySelector('[data-testid="mask"]');
      mask.addEventListener('pointerdown',()=>maskPressed=true);
      mask.addEventListener('click',()=>{if(maskPressed&&sheet.isConnected)toggle();maskPressed=false;});
      const center=element=>{const rect=element.getBoundingClientRect();return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};};
      window.__nativeMobileScreenshot={
        menuPoint(){const action=sheet.querySelector('[data-betterx-screenshot-menu]');assert(action,'No screenshot entry in the mobile sheet');return center(action);},
        async verify(){for(let attempt=0;attempt<200&&!saved.length;attempt++)await sleep(10);
          return saved.length===1&&saved[0].blob.type==='image/png'&&saved[0].name==='BetterX_photo_420007.png'&&!sheet.isConnected;},
        cleanup(){api.stopScreenshotMenu();api.closeBetterXDialog();article.remove();sheet.remove();restore();undoSave();},
      };
      return center(trigger);
    };
  };
})();
