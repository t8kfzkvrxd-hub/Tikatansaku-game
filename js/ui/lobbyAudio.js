const lobbyBgm = new Audio('assets/audio/lobby-bgm.m4a');
lobbyBgm.loop = true;
lobbyBgm.preload = 'metadata';
lobbyBgm.volume = 0.35;
function syncLobbyAudio(){
 const active=state.screen==='town'&&!HomeScreen.active&&soundEnabled&&!document.hidden;
 if(!active){lobbyBgm.pause();return;}
 if(lobbyBgm.paused)lobbyBgm.play().catch(()=>{});
}
// A user gesture retries playback when the browser blocks autoplay.
document.addEventListener('click',syncLobbyAudio);
document.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')syncLobbyAudio();});
document.addEventListener('visibilitychange',syncLobbyAudio);
window.addEventListener('pagehide',()=>lobbyBgm.pause());
window.addEventListener('pageshow',syncLobbyAudio);
