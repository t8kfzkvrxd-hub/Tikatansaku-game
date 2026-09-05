const portraitTouchQuery=matchMedia('(orientation: portrait) and (hover: none) and (pointer: coarse)');
function syncOrientationGuide(){
 const blocked=portraitTouchQuery.matches;
 for(const id of ['game-container','home-screen','modal-layer']){
  const element=document.getElementById(id);
  if(element)element.inert=blocked||(id==='game-container'&&HomeScreen.active);
 }
 document.getElementById('rotate-guide').setAttribute('aria-hidden',String(!blocked));
}
portraitTouchQuery.addEventListener('change',syncOrientationGuide);
window.addEventListener('DOMContentLoaded',syncOrientationGuide);

function syncMobileViewport(){
 const root=document.documentElement;
 const viewport=window.visualViewport;
 root.style.setProperty('--game-viewport-height',window.innerHeight+'px');
 // Pinch zoom retains the browser's normal panning behavior.
 const unzoomed=viewport&&Math.abs(viewport.scale-1)<0.01;
 root.style.setProperty('--modal-viewport-height',(unzoomed?viewport.height:window.innerHeight)+'px');
 root.style.setProperty('--modal-viewport-top',(unzoomed?viewport.offsetTop:0)+'px');
}
window.addEventListener('resize',syncMobileViewport,{passive:true});
window.visualViewport?.addEventListener('resize',syncMobileViewport,{passive:true});
window.visualViewport?.addEventListener('scroll',syncMobileViewport,{passive:true});
syncMobileViewport();
