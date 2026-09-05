const HomeScreen={active:true,loaded:false};
function refreshHomeViewport(){
 if(!HomeScreen.active)return;
 document.documentElement.style.setProperty('--home-fallback-height',window.innerHeight+'px');
 HomeScreen.fit?.();
}
function settleHomeViewport(){
 refreshHomeViewport();
 clearTimeout(HomeScreen.settleTimer);
 HomeScreen.settleTimer=setTimeout(refreshHomeViewport,250);
}
window.addEventListener('resize',settleHomeViewport,{passive:true});
window.addEventListener('orientationchange',settleHomeViewport,{passive:true});
window.addEventListener('pageshow',settleHomeViewport);
window.visualViewport?.addEventListener('resize',settleHomeViewport,{passive:true});
function fitHomeArtwork(home){
 HomeScreen.artObserver?.disconnect();
 const art=home.querySelector('.home-art'),image=art.querySelector('.home-background');
 const scene=document.createElement('div');scene.className='home-scene';
 while(art.firstChild)scene.append(art.firstChild);art.append(scene);
 const effects=document.createElement('div');effects.className='environment-effects';
 effects.innerHTML='<div class="home-mist"></div><div class="home-mist home-mist-second"></div><div class="home-blue"></div><div class="home-red"></div><div class="home-lantern home-lantern-near"></div><div class="home-lantern home-lantern-far"></div><div class="home-distant-light"></div><div class="home-particles"></div>';
 const positions=[[48,72],[55,63],[59,79],[47,49],[54,30],[40,15],[21,18],[18,24],[57,86],[45,36]];
 positions.forEach(([x,y],i)=>{const p=document.createElement('i');p.style.cssText=`--x:${x}%;--y:${y}%;--delay:-${i*1.7}s;--duration:${12+i%4*2}s`;effects.querySelector('.home-particles').append(p);});
 scene.append(effects);
 const foreground=image.cloneNode();foreground.className='home-character-still';foreground.removeAttribute('fetchpriority');scene.append(foreground);
 const fit=()=>{
  if(!image.naturalWidth||!art.clientWidth||!art.clientHeight)return;
  const scale=Math.max(art.clientWidth/image.naturalWidth,art.clientHeight/image.naturalHeight);
  const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
  const leftAligned=getComputedStyle(image).objectPosition.startsWith('0%');
  Object.assign(scene.style,{width:width+'px',height:height+'px',left:(leftAligned?0:(art.clientWidth-width)/2)+'px',top:(art.clientHeight-height)/2+'px'});
 };
 image.addEventListener('load',fit,{once:true});
 HomeScreen.fit=fit;
 HomeScreen.artObserver=new ResizeObserver(fit);HomeScreen.artObserver.observe(art);settleHomeViewport();
}
function getHomeBackgroundByStoryProgress(){return 'assets/home-background.png';}
function homeSaveInfo(){
 try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return {exists:false,valid:false};const data=JSON.parse(raw);return {exists:true,valid:!!(data&&typeof data==='object'&&data.equipped&&data.camp)};}
 catch(e){return {exists:true,valid:false};}
}
function bootHomeScreen(){
 if(window.self!==window.top&&location.hash==='#game'){enterGameFromHome();return;}
 showHomeScreen();
}
function showHomeScreen(){
 if(HomeScreen.loaded&&(state.screen!=='town'||state.chapter?.pending)){addLog('地上へ帰還してからホームに戻れます。','info');return;}
 closeGenericModal();HomeScreen.active=true;
 document.body.classList.add('at-home');document.documentElement.classList.add('at-home');document.getElementById('game-container').inert=true;
 const save=homeSaveInfo();let home=document.getElementById('home-screen');
 if(!home){home=document.createElement('section');home.id='home-screen';document.body.append(home);}
 home.hidden=false;
 home.innerHTML=`<div class="home-art" aria-hidden="true"><img class="home-background" src="${getHomeBackgroundByStoryProgress()}" alt="" fetchpriority="high"></div><div class="home-shade" aria-hidden="true"></div><main class="home-menu"><p class="home-eyebrow">その手を離さず、奈落の先へ。</p><h1><span>ABYSS</span><span>DELVER</span></h1><p class="home-subtitle">地下探索型・持ち帰りローグライト</p><div class="home-rule"></div><div class="home-main-actions"><button id="home-continue" class="home-button ${save.valid?'home-primary':''}" ${save.valid?'':'disabled'} onclick="continueFromHome()"><span>つづきから</span><small>CONTINUE</small></button><button id="home-new" class="home-button ${!save.valid?'home-primary':''}" onclick="newGameFromHome()"><span>はじめから</span><small>NEW GAME</small></button></div>${save.exists&&!save.valid?'<p class="home-warning">セーブを読み取れません。データは削除していません。</p>':''}<nav class="home-sub-actions" aria-label="システムメニュー"><button onclick="showUpdateNotes(false)">お知らせ</button><span>／</span><button onclick="openHomeSettings()">設定</button></nav><p class="home-version">Version ${GAME_VERSION}</p></main>`;
 fitHomeArtwork(home);
 if(localStorage.getItem('lastSeenVersion')!==GAME_VERSION)home.querySelector('.home-version').insertAdjacentHTML('beforebegin','<p class="home-update-hint">新しいお知らせがあります</p>');
 document.getElementById(save.valid?'home-continue':'home-new').focus({preventScroll:true});
 if(typeof syncLobbyScreen==='function')syncLobbyScreen();
}
function enterGameFromHome(){
 if(!HomeScreen.loaded){loadState();HomeScreen.loaded=true;}
 HomeScreen.active=false;document.body.classList.remove('at-home');document.documentElement.classList.remove('at-home');document.getElementById('game-container').inert=false;
 const home=document.getElementById('home-screen');if(home)home.hidden=true;
 closeGenericModal();render();
 if(localStorage.getItem('lastSeenVersion')!==GAME_VERSION)showUpdateNotes(true);else checkTutorial();
}
function continueFromHome(){if(homeSaveInfo().valid)enterGameFromHome();}
function newGameFromHome(){
 if(homeSaveInfo().exists){
  showResetSaveConfirmation();
  document.querySelector('#modal-layer button[onclick="resetGameSave()"]').setAttribute('onclick','startFreshFromHome()');
  return;
 }
 enterGameFromHome();
}
function startFreshFromHome(){resetGameSave(false);HomeScreen.loaded=true;enterGameFromHome();}
function openHomeSettings(){
 showChapterModal('設定',`<div class="home-settings-list"><button class="btn btn-sub" onclick="toggleSound();openHomeSettings()">音：${soundEnabled?'ON':'OFF'}</button><button class="btn btn-sub" onclick="document.body.classList.toggle('home-reduced');openHomeSettings()">背景演出：${document.body.classList.contains('home-reduced')?'軽減':'通常'}（端末設定も反映）</button><button class="btn btn-sub" onclick="showHomeHelp()">遊び方</button><button class="btn btn-sub" onclick="showUpdateNotes(false)">アップデート履歴</button><button class="btn btn-sub" onclick="openHomeDataManagement()">データ管理</button></div>`,`<button class="btn btn-sub" onclick="closeGenericModal()">閉じる</button>`);
}
function openHomeDataManagement(){
 showChapterModal('データ管理','<p>セーブはこのブラウザに保存されます。初期化すると元に戻せません。</p><button class="btn btn-red" onclick="showResetSaveConfirmation()">セーブデータ初期化</button>',`<button class="btn btn-sub" onclick="openHomeSettings()">設定へ戻る</button>`);
}
function showHomeHelp(){showTutorialModal();const button=document.querySelector('#modal-layer button[onclick="dismissTutorial()"]');if(button)button.setAttribute('onclick','closeGenericModal()');}
