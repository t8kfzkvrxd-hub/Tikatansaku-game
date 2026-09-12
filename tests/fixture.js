// Test pages only; never loaded by index.html. Save-profile preflight followed by
// an explicit story-complete component fixture (story tests own their progression).
(() => {
 const mode=new URLSearchParams(location.search).get('saveProfile')||'new';
 const keys=['ABYSS_ROGUE_SAVED_V2','ABYSS_TUTORIAL_SEEN','lastSeenVersion'];
 const backup=Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]));
 window.addEventListener('pagehide',()=>{for(const [k,v]of Object.entries(backup))v===null?localStorage.removeItem(k):localStorage.setItem(k,v);},{once:true});
 window.fixtureResults=[];
 const seen=new WeakSet();
 document.addEventListener('load',event=>{
  const frame=event.target;if(frame.tagName!=='IFRAME'||seen.has(frame))return;seen.add(frame);
  const w=frame.contentWindow;if(!w.__gameDebug)return;
  const home=w.eval('HomeScreen.active');
  try{
   w.enterGameFromHome();
   w.eval(`MainStory.active=null;state.chapter.pending=null;state.chapter.checkpoint=null;resetGameSave(false);HomeScreen.active=false;`);
   if(mode!=='new')w.eval(`state.deepestFloorReached=30;state.bossFirstKills[10]=true;state.bossFirstKills[20]=true;state.vaultGold=1234;saveState();`);
   if(mode==='legacy'){
    const save=JSON.parse(localStorage.getItem(keys[0]));delete save.chapter.mainStory;
    localStorage.setItem(keys[0],JSON.stringify(save));w.loadState();
   }else if(mode==='complete')w.eval(`state.chapter.mainStory=newMainStoryState(false);state.chapter.mainStory.stage='free';state.chapter.mainStory.read={1:true,2:true};state.chapter.mainStory.unlocked={1:true,2:true};state.chapter.mainStory.noticeSeen=true;saveState();loadState();`);
   const ok=w.eval(mode==='new'?`mainStoryState().stage==='opening'&&!mainStoryState().legacy`:mode==='legacy'?`mainStoryState().legacy&&mainStoryState().stage==='free'&&state.vaultGold===1234&&state.deepestFloorReached===30`:`!mainStoryState().legacy&&mainStoryState().stage==='free'&&mainStoryState().read[2]&&state.vaultGold===1234&&state.deepestFloorReached===30`);
   if(!ok)throw Error('save profile migration '+mode);
   window.fixtureResults.push({mode,pass:true});
   // Each component test specifies its own floors/items. Do not let an unrelated
   // opening modal block combat/UI assertions. Real story flow is tested separately.
   w.eval(`MainStory.active=null;state.chapter.pending=null;state.chapter.checkpoint=null;resetGameSave(false);state.chapter.mainStory=newMainStoryState(false);state.chapter.mainStory.stage='free';state.chapter.mainStory.read={1:true,2:true};state.chapter.mainStory.unlocked={1:true,2:true};state.chapter.mainStory.noticeSeen=true;MainStory.active=null;state.chapter.pending=null;state.chapter.checkpoint=null;state.screen='town';saveState();document.getElementById('modal-layer').style.display='none';`);
   w.eval(`state.chapter.contract=true;state.chapter.owned.elna=true;state.chapter.companion='elna';saveState();`);
   if(home)w.showHomeScreen();else w.render();
  }catch(error){window.fixtureResults.push({mode,pass:false,error:error.stack});}
 },true);
})();
