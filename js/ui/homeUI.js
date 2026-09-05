const HomeScreen={active:true,loaded:false};
function getHomeBackgroundByStoryProgress(){return 'assets/home-background.png';}
function homeSaveInfo(){
 try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return {exists:false,valid:false};const data=JSON.parse(raw);return {exists:true,valid:!!(data&&typeof data==='object'&&data.equipped&&data.camp)};}
 catch(e){return {exists:true,valid:false};}
}
function bootHomeScreen(){
 if(location.hash==='#game'){enterGameFromHome();return;}
 showHomeScreen();
 if(localStorage.getItem('lastSeenVersion')!==GAME_VERSION)showUpdateNotes(true);
}
function showHomeScreen(){
 if(HomeScreen.loaded&&(state.screen!=='town'||state.chapter?.pending)){addLog('地上へ帰還してからホームに戻れます。','info');return;}
 closeGenericModal();HomeScreen.active=true;
 document.body.classList.add('at-home');document.getElementById('game-container').inert=true;
 const save=homeSaveInfo();let home=document.getElementById('home-screen');
 if(!home){home=document.createElement('section');home.id='home-screen';document.body.append(home);}
 home.hidden=false;
 home.innerHTML=`<div class="home-art" aria-hidden="true"><img class="home-background" src="${getHomeBackgroundByStoryProgress()}" alt="" fetchpriority="high"><div class="home-blue"></div><div class="home-lantern home-lantern-near"></div><div class="home-lantern home-lantern-far"></div><div class="home-presence"></div></div><div class="home-shade" aria-hidden="true"></div><div class="home-mist" aria-hidden="true"></div><div class="home-mist home-mist-second" aria-hidden="true"></div><div class="home-particles" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i style="--x:${8+i*9}%;--y:${20+(i*17)%65}%;--delay:-${i*2.7}s;--duration:${17+i%4*3}s"></i>`).join('')}</div><main class="home-menu"><p class="home-eyebrow">その手を離さず、奈落の先へ。</p><h1><span>ABYSS</span><span>DELVER</span></h1><p class="home-subtitle">地下探索型・持ち帰りローグライト</p><div class="home-rule"></div><div class="home-main-actions"><button id="home-continue" class="home-button ${save.valid?'home-primary':''}" ${save.valid?'':'disabled'} onclick="continueFromHome()"><span>つづきから</span><small>CONTINUE</small></button><button id="home-new" class="home-button ${!save.valid?'home-primary':''}" onclick="newGameFromHome()"><span>はじめから</span><small>NEW GAME</small></button></div>${save.exists&&!save.valid?'<p class="home-warning">セーブを読み取れません。データは削除していません。</p>':''}<nav class="home-sub-actions" aria-label="システムメニュー"><button onclick="showUpdateNotes(false)">お知らせ</button><span>／</span><button onclick="openHomeSettings()">設定</button></nav><p class="home-version">Version ${GAME_VERSION}</p></main>`;
 document.getElementById(save.valid?'home-continue':'home-new').focus({preventScroll:true});
}
function enterGameFromHome(){
 if(!HomeScreen.loaded){loadState();HomeScreen.loaded=true;}
 HomeScreen.active=false;document.body.classList.remove('at-home');document.getElementById('game-container').inert=false;
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
