const lobbyBgm = new Audio('assets/audio/lobby-bgm.m4a');
lobbyBgm.loop = true;
lobbyBgm.preload = 'metadata';
lobbyBgm.volume = audioSettings.bgmVolume;
// One audio instance: null scenes intentionally remain silent until tracks exist.
const BGM_SCENES={home:null,lobby:'assets/audio/lobby-bgm.m4a',town:'assets/audio/lobby-bgm.m4a',exploration:null,battle:null,boss:null,story_calm:null,story_tense:null,story_sad:null,memory_archive:null};
let bgmScene=null,bgmFade=null,bgmVolume=audioSettings.bgmVolume;
function applyBgmSettings(){
 cancelBgmFade();bgmVolume=audioSettings.bgmVolume;lobbyBgm.volume=bgmVolume;syncLobbyAudio();
}
function currentBgmScene(){
 if(HomeScreen.active)return 'home';
 if(typeof MainStory!=='undefined'&&MainStory.active?.mode==='REPLAY')return 'memory_archive';
 if(state.screen==='town')return 'lobby';
 return state.screen==='battle'?(state.currentEnemy?.isBoss?'boss':'battle'):'exploration';
}
function cancelBgmFade(){if(bgmFade!==null){clearInterval(bgmFade);bgmFade=null;} }
function syncLobbyAudio(){
 const scene=currentBgmScene(),previous=bgmScene,changed=scene!==previous;
 bgmScene=scene;
 if(!soundEnabled||document.hidden){cancelBgmFade();lobbyBgm.pause();lobbyBgm.volume=bgmVolume;return;}
 if(!changed&&bgmFade!==null)return;
 const source=BGM_SCENES[scene],active=typeof source==='string';
 // New scene tracks reuse this same player, never layer another Audio on top.
 if(active&&lobbyBgm.getAttribute('src')!==source){lobbyBgm.pause();lobbyBgm.src=source;}
 if(changed&&(scene==='memory_archive'||previous==='memory_archive')){
  bgmVolume=audioSettings.bgmVolume;
  cancelBgmFade();const from=lobbyBgm.paused?0:lobbyBgm.volume,to=active?bgmVolume:0;let step=0;
  if(active){lobbyBgm.volume=from;lobbyBgm.play().catch(()=>{});}
  bgmFade=setInterval(()=>{lobbyBgm.volume=from+(to-from)*(++step/10);if(step===10){cancelBgmFade();if(!active)lobbyBgm.pause();lobbyBgm.volume=bgmVolume;}},30);
  return;
 }
 if(!active){lobbyBgm.pause();return;}
 if(lobbyBgm.paused)lobbyBgm.play().catch(()=>{});
}
// A user gesture retries playback when the browser blocks autoplay.
document.addEventListener('click',syncLobbyAudio);
document.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')syncLobbyAudio();});
document.addEventListener('visibilitychange',syncLobbyAudio);
window.addEventListener('pagehide',()=>{cancelBgmFade();lobbyBgm.pause();lobbyBgm.volume=bgmVolume;});
window.addEventListener('pageshow',syncLobbyAudio);
