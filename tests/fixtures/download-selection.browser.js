(() => {
  const assert = (condition,message) => {if(!condition)throw new Error(message);};
  const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
  const photo = name => ({type:'photo',media_url_https:`https://pbs.twimg.com/media/${name}.jpg`});
  const video = (name,gif=false) => ({type:gif?'animated_gif':'video',
    media_url_https:`https://pbs.twimg.com/${gif?'tweet_video_thumb':'ext_tw_video_thumb'}/${name}${gif?'.jpg':'/pu/img/preview.jpg'}`,
    video_info:{variants:[{content_type:'video/mp4',bitrate:100,url:`https://video.twimg.com/${gif?'tweet_video':'ext_tw_video'}/${name}.mp4`}]}});
  const mixed = () => [photo('pickA'),photo('pickB'),video('pickGif',true),video('pickVideo')];
  const makePost = (api,id,media,register=true) => {
    const article=document.createElement('article');
    article.innerHTML=`<div data-testid="User-Name"><a href="/picker"><span>Picker Author</span></a><a href="/picker/status/${id}"><time datetime="2026-10-30T00:00:00Z">now</time></a></div><div data-testid="tweetText">picker original post</div><div role="group"></div>`;
    for(const item of media){
      const element=document.createElement(item.type==='photo'?'img':'video');
      element.setAttribute(item.type==='photo'?'src':'poster',item.media_url_https);
      article.appendChild(element);
    }
    document.querySelector('main').appendChild(article);
    if(register)api.registerMedia(id,media);
    api.injectDownloadButtons(article);
    return article;
  };
  const transport = (api,lookup) => {
    const requests=[],saved=[];
    const restore=api.mockDownloadTransport({
      fetch:async(url,options)=>{requests.push(url);options.onProgress(12,12,true);return new Blob(['fixture data'],{type:'application/octet-stream'});},
      save:(blob,name)=>saved.push({blob,name}),lookup,
    });
    return {requests,saved,restore};
  };
  const clearJobs = api => {
    for(const job of api.downloadJobs.values())clearTimeout(job.cleanupTimer);
    api.downloadJobs.clear();api.refreshDownloadUi();
  };
  const waitForJob = async(api,id) => {
    for(let count=0;count<200;count++){
      const job=api.downloadJobs.get(id);
      if(job && !['queued','downloading','packing','saving'].includes(job.status))return job;
      await sleep(10);
    }
    throw new Error('The selected download did not finish');
  };
  const point = (button,type,extra={}) => button.dispatchEvent(new PointerEvent(type,{
    bubbles:true,button:0,isPrimary:true,pointerId:71,clientX:20,clientY:20,...extra,
  }));
  const picker = () => document.querySelector('#BetterX-media-picker');
  const click = button => button.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));
  const configure = api => api.setSettingsPartial({mediaDownload:true,downloadZip:true,trackDownloadedPosts:false,
    gifDownloadFormat:'mp4',gifDownloadFormatEnabled:true,downloadFileNameTemplate:'{文件类型}_{序号}',
    downloadZipNameTemplate:'{用户ID}_{帖子ID}',downloadNameRegex:'',downloadNameReplacement:'',hideAdultSpam:false});

  window.__runDownloadSelectionTests = async(api,check) => {
    await check('mixed media picker sends only checked GIF/video items through the ZIP pipeline',async()=>{
      configure(api);api.setSettingsPartial({trackDownloadedPosts:true,silentDownload:true});
      const io=transport(api),article=makePost(api,'410001',mixed());
      try{
        const button=article.querySelector('.BetterX-dl-btn');
        point(button,'pointerdown');await sleep(540);point(button,'pointerup');click(button);
        const modal=picker();assert(modal,'Long press did not open the selector');
        assert(modal.querySelector('[role="dialog"]').getAttribute('aria-modal')==='true','The picker is missing dialog semantics');
        const inputs=[...modal.querySelectorAll('input')];
        assert(inputs.length===4 && inputs.every(input=>input.checked),'Media must be selected by default');
        assert(io.requests.length===0 && !api.downloadJobs.has('410001'),'Browsing the picker started a download');
        const invert=modal.querySelector('[data-media-toggle]');
        const confirm=modal.querySelector('[data-media-confirm]');
        const count=modal.querySelector('.BetterX-media-picker-count');
        assert(invert.textContent==='反选','The picker must offer inversion');
        invert.click();
        assert(inputs.every(input=>!input.checked) && count.textContent==='已选 0 / 4','Inverting all selected items must clear the selection and count');
        assert(modal.querySelector('[data-media-confirm]').disabled,'An empty selection must disable confirmation');
        invert.click();
        assert(inputs.every(input=>input.checked) && !confirm.disabled && count.textContent==='已选 4 / 4','Inverting an empty selection must select all and enable confirmation');
        inputs[1].click();inputs[2].click();inputs[3].click();
        invert.click();
        assert(inputs.map(input=>Number(input.checked)).join('')==='0111' && count.textContent==='已选 3 / 4' && confirm.textContent==='下载所选 (3)','Partial inversion must flip every item and refresh both counts');
        invert.click();
        assert(inputs.map(input=>Number(input.checked)).join('')==='1000' && count.textContent==='已选 1 / 4','Inverting twice must restore the original partial selection');
        invert.click();inputs[1].click();
        assert(inputs.map(input=>Number(input.checked)).join('')==='0011' && !confirm.disabled && count.textContent==='已选 2 / 4','Only the chosen GIF and video should remain selected');
        assert(invert.textContent==='反选' && io.requests.length===0,'Inverting must keep its label and wait for download confirmation');
        assert(modal.textContent.includes('GIF 3') && modal.textContent.includes('视频 4'),'Mixed media kinds were not labelled');
        modal.querySelector('[data-media-confirm]').click();
        const job=await waitForJob(api,'410001');await api.state.dbWriteQueue;
        assert(job.status==='done' && job.items.length===2,'The selected job did not complete');
        assert(io.requests.length===2 && io.requests.every(url=>url.includes('pickGif')||url.includes('pickVideo')),'Unchecked images were fetched');
        assert(job.items[0].mediaType==='gif' && job.items[0].ext==='mp4','GIF-as-MP4 setting was lost');
        assert(io.saved.length===1 && io.saved[0].name==='picker_410001.zip','Selected items did not use the ZIP naming settings');
        const bytes=new Uint8Array(await io.saved[0].blob.arrayBuffer());
        const view=new DataView(bytes.buffer),names=[];
        for(let offset=0;view.getUint32(offset,true)===0x04034b50;){
          const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true);
          names.push(new TextDecoder().decode(bytes.subarray(offset+30,offset+30+nameLength)));
          offset+=30+nameLength+extraLength+size;
        }
        assert(names.join('|')==='gif_1.mp4|video_2.mp4','The ZIP includes the wrong files or lost custom naming');
        assert(api.state.settings.downloadedPostIds.includes('410001'),'Successful selection was not recorded');
        assert(api.state.downloadPillEl.hidden,'Selection ignored the quiet download setting');
        return {choices:4,selected:2,mediaRequests:2,zipEntries:names,downloadHistoryVerified:true,inversionVerified:true};
      }finally{api.closeDownloadMediaPicker();clearJobs(api);io.restore();article.remove();}
    });

    await check('recorded posts confirm before hold/Shift-click selection and cancel without media work',async()=>{
      configure(api);const id='410008',media=[photo('recordedPhoto'),video('recordedVideo')];
      const article=makePost(api,id,media,false),originalConfirm=window.confirm;
      let answer=false,prompts=0,lookups=0;
      const io=transport(api,async()=>{lookups++;api.registerMedia(id,media);return true;});
      try{
        api.setSettingsPartial({trackDownloadedPosts:true,downloadedPostIds:[...(api.state.settings.downloadedPostIds||[]),id]});
        window.confirm=message=>{
          prompts++;
          assert(message==='该帖子内媒体文件曾下载过，是否继续下载？','The re-download prompt changed');
          assert(!picker() && lookups===0 && io.requests.length===0,'The prompt appeared after media work began');
          return answer;
        };
        const button=article.querySelector('.BetterX-dl-btn');
        point(button,'pointerdown');await sleep(540);point(button,'pointerup');click(button);
        assert(prompts===1 && !picker(),'A long hold did not confirm before selection');
        assert(lookups===0 && io.requests.length===0 && !api.downloadJobs.has(id),'Declining confirmation started media work');
        assert(!api.pendingDownloadSelections.has(id) && !api.pendingDownloadStarts.has(id),'Declining confirmation left a pending task');
        answer=true;
        button.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1,shiftKey:true}));
        await sleep(0);
        assert(prompts===2 && lookups===1 && picker(),'Accepting confirmation did not open the selector after lookup');
        await api.handleDownloadClick(article,{},id,{selectMedia:true});
        assert(prompts===2,'Repeated activation prompted while selection was open');
        picker().querySelector('[data-media-confirm]').click();
        const job=await waitForJob(api,id);
        assert(job.status==='done' && prompts===2 && io.requests.length===2,'Selection prompted again or lost its media');
        return {holdPromptFirst:true,shiftClickPromptFirst:true,cancelledLookups:0,confirmOncePerAttempt:true};
      }finally{
        window.confirm=originalConfirm;api.closeDownloadMediaPicker();clearJobs(api);io.restore();article.remove();
        api.setSettingsPartial({trackDownloadedPosts:false});
      }
    });

    await check('selection supports touch cancellation, focus trapping, Escape, backdrop and replacement',async()=>{
      configure(api);const io=transport(api),article=makePost(api,'410002',[photo('cancelA'),photo('cancelB')]);
      const other=makePost(api,'410003',[photo('other')]);
      try{
        const button=article.querySelector('.BetterX-dl-btn');button.focus();
        point(button,'pointerdown',{pointerType:'touch'});point(button,'pointermove',{pointerType:'touch',clientY:50});
        await sleep(540);point(button,'pointerup',{pointerType:'touch'});click(button);
        assert(!picker() && io.requests.length===0,'Scrolling the touch button started a download');
        point(button,'pointerdown',{pointerType:'touch'});await sleep(540);point(button,'pointerup',{pointerType:'touch'});click(button);
        assert(picker(),'A stationary touch hold did not open the selector');
        await api.handleDownloadClick(article,{},'410002',{selectMedia:true});
        assert(document.querySelectorAll('#BetterX-media-picker').length===1,'Repeated activation duplicated the selector');
        const first=picker().querySelector('button'),last=picker().querySelector('[data-media-confirm]');
        first.focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));
        assert(document.activeElement===last,'Shift+Tab escaped the dialog');
        document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await sleep(0);
        assert(!picker() && !api.pendingDownloadSelections.has('410002'),'Escape left the dialog or selection lock behind');
        assert(document.activeElement===button,'Closing the dialog did not restore focus');
        let pending=api.handleDownloadClick(article,{},'410002',{selectMedia:true});
        picker().click();await pending;assert(!picker(),'Backdrop click did not cancel');
        pending=api.handleDownloadClick(article,{},'410002',{selectMedia:true});
        const replacement=api.handleDownloadClick(other,{},'410003',{selectMedia:true});
        await pending;assert(picker() && !api.pendingDownloadSelections.has('410002'),'Replacing a picker stranded its previous request');
        picker().querySelector('[data-media-cancel]').click();await replacement;
        pending=api.handleDownloadClick(article,{},'410002',{selectMedia:true});
        api.setSettingsPartial({mediaDownload:false});await pending;
        assert(!picker() && io.requests.length===0 && api.pendingDownloadSelections.size===0,'Disabling downloads did not clean up selection');
        return {touchScrollCancelled:true,keyboardAndFocusVerified:true,downloadRequests:0};
      }finally{api.closeDownloadMediaPicker();clearJobs(api);io.restore();article.remove();other.remove();api.setSettingsPartial({mediaDownload:true});}
    });

    await check('on-demand lookup completes before selection and recycled DOM cannot change its target',async()=>{
      configure(api);let finishLookup,lookupCount=0;
      const io=transport(api,()=>{lookupCount++;return new Promise(resolve=>finishLookup=resolve);});
      const media=[photo('lookupPhoto'),video('lookupVideo')];
      const article=makePost(api,'410004',media,false);
      try{
        const pending=api.handleDownloadClick(article,{username:'@lookup'},'410004',{selectMedia:true});
        await api.handleDownloadClick(article,{},'410004',{selectMedia:true});
        assert(lookupCount===1 && !picker(),'Lookup was duplicated or selection opened too early');
        api.registerMedia('410004',media);finishLookup(true);await sleep(0);
        assert(picker()?.querySelectorAll('input').length===2,'Lookup results were absent from the selector');
        assert(io.requests.length===0,'Resolving media downloaded it before confirmation');
        // Keep the picker snapshot even if X reuses the article while it is open.
        article.querySelector('a[href*="/status/"]').href='/newauthor/status/419999';
        article.querySelector('[data-testid="tweetText"]').textContent='a different post';
        picker().querySelector('input').click();picker().querySelector('[data-media-confirm]').click();
        await pending;const job=await waitForJob(api,'410004');
        assert(job.status==='done' && job.username==='lookup' && job.postText==='picker original post','Selection lost its original post metadata');
        assert(io.requests.length===1 && io.requests[0].includes('lookupVideo'),'The selected video was not isolated');
        assert(io.saved.length===1 && io.saved[0].name==='video_1.mp4','Single selection did not save as an individual file');
        api.injectDownloadButtons(article);
        assert(article.querySelector('.BetterX-download-controls').dataset.statusId==='419999','Reused controls retain the old post ID');
        const late=makePost(api,'410005',[video('lateVideo')],false);
        const lateRequest=api.handleDownloadClick(late,{},'410005',{selectMedia:true});
        late.querySelector('a[href*="/status/"]').href='/another/status/418888';finishLookup(true);await lateRequest;
        assert(!picker() && !api.pendingDownloadSelections.has('410005'),'Lookup reused a different article as the old target');
        late.remove();
        return {lookupRequests:lookupCount,selectedVideoRequests:io.requests.length,metadataSnapshotVerified:true};
      }finally{api.closeDownloadMediaPicker();clearJobs(api);io.restore();article.remove();}
    });

    window.__prepareNativeDownloadTest = mobile => {
      configure(api);api.setSettingsPartial({silentDownload:false});api.togglePanel(false);api.repositionBadge();
      const id=mobile?'410007':'410006',io=transport(api),article=makePost(api,id,mixed());
      article.style.cssText='position:fixed;top:20px;left:14px;width:350px;z-index:1000;background:#808080;padding:10px';
      article.querySelectorAll('img,video').forEach(element=>element.style.display='none');
      const button=article.querySelector('.BetterX-dl-btn'),rect=button.getBoundingClientRect();
      const events=[];
      const log=event=>events.push({type:event.type,target:event.target.id||event.target.className,detail:event.detail});
      const eventTypes=['pointerdown','pointerup','pointercancel','lostpointercapture','click','contextmenu'];
      eventTypes.forEach(type=>document.addEventListener(type,log,true));
      window.__nativeDownload={...io,
        events,
        targetPoint(selector){const rect=picker().querySelector(selector).getBoundingClientRect();return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};},
        checkMobileLayout(){
          const modal=picker(),rect=modal.querySelector('[role="dialog"]').getBoundingClientRect();
          const columns=getComputedStyle(modal.querySelector('.BetterX-media-picker-grid')).gridTemplateColumns.split(' ').length;
          return columns===2 && rect.left>=0 && rect.right<=document.documentElement.clientWidth && rect.bottom<=visualViewport.height && io.requests.length===0;
        },
        async verify(expected){const job=await waitForJob(api,id);return job.status==='done'&&job.items.length===expected&&io.requests.length===expected&&io.saved.length===1;},
        cleanup(){eventTypes.forEach(type=>document.removeEventListener(type,log,true));api.closeDownloadMediaPicker();clearJobs(api);io.restore();article.remove();},
      };
      return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};
    };
  };
})();
