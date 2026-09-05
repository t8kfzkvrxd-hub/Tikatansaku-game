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
