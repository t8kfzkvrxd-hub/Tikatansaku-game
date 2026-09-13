// New chapter progression is isolated inside the existing chapter save envelope.
const MainStory={active:null,scheduled:false,closing:false,facilityVisit:null};
function mainStoryState(){return state.chapter?.mainStory;}
function newMainStoryState(legacy=false){return {version:2,legacy,stage:legacy?'free':'opening',seen:{chapterTwoStart:false},read:{},unlocked:{1:true},firstPlayed:{},autoplaySkipped:{},noticeSeen:false,craftedId:null,visited:{}};}
function mainStoryTutorial(){const s=mainStoryState();return !!s&&!s.legacy&&s.stage!=='free';}
function mainStoryTownRequired(){return mainStoryTutorial()&&['tavern','forge','warehouse','shop','equipment','ending','return'].includes(mainStoryState().stage);}
function persistMainStory(){
 if(MainStory.active?.mode!=='REPLAY'&&state.chapter.pending?.kind==='mainStory'){
  checkpointChapter({currentDoors:structuredClone(state.currentDoors||[])});
 }else saveState();
}
function mainStoryBackground(place,floor=1){
 if(place==='exploration')return explorationArea(floor)?.backgrounds[0]?.src||mainStoryBackground('mine');
 if(place==='portal')return 'assets/images/exploration/return-portal.png';
 if(place==='mine')return explorationArea(1)?.backgrounds[0]?.src||'assets/images/exploration/explore-01-mine.png';
 return 'assets/ac935e06-88d5-4889-9435-5e3a3e410ef6.png';
}
function playMainStory(scene,mode='STORY',queue=[]){
 const data=MAIN_STORY_SCENES[scene],s=mainStoryState();if(!data||!s||MainStory.active)return;
 if(mode==='REPLAY'&&!s.unlocked[data.episode])return;
 MainStory.active={scene,page:0,mode,queue:[...queue]};
 if(mode==='REPLAY')syncLobbyAudio();
 if(mode!=='REPLAY')state.chapter.pending={kind:'mainStory',...MainStory.active};
 persistMainStory();renderMainStory();
}
function renderMainStory(){
 const a=MainStory.active;if(!a)return;
 const data=MAIN_STORY_SCENES[a.scene],line=data.lines[a.page];
 if(!line){finishMainStoryScene();return;}
 const [speaker,text]=line,names={player:'主人公',elna:'エルナ'},visual=storyVisualState(a.scene,a.page);
 const m=document.getElementById('modal-layer');m.style.display='flex';m.className='legendary-modal main-story-modal';
 m.innerHTML=`<section class="main-story-scene" role="dialog" aria-modal="true" aria-label="${uiEscape(data.title)}" style="background-image:url('${mainStoryBackground(data.place,data.floor)}')">${visual.background?'<img class="story-background" alt="" aria-hidden="true">':''}<header class="story-heading">${uiEscape(data.chapterTitle||'第1章 ふたりで潜る理由')} / ${uiEscape(data.title)}${a.mode==='REPLAY'?' ― 回想':''}</header><div class="story-portraits">${storyPortraitMarkup(visual)}</div><div class="story-dialog"><h2 class="story-speaker">${uiEscape(names[speaker]||speaker||'　')}</h2><div class="story-text" tabindex="0" onclick="nextMainStory()">${uiEscape(text)}</div><footer class="story-actions"><small>${a.page+1} / ${data.lines.length}</small><button class="btn btn-sub" onclick="skipMainStory()">${mainStoryState().seen[a.scene]?'既読スキップ':'会話をスキップ'}</button><button class="btn btn-gold" onclick="nextMainStory()">次へ ▼</button></footer></div></section>`;
 bindStoryImages(m,visual.background,a.page===0);
 if(a.mode==='REPLAY')m.querySelector('.story-actions').insertAdjacentHTML('beforeend','<button class="btn btn-sub" onclick="cancelMainStoryReplay()">回想を終了</button>');
 m.querySelector('.story-text').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();nextMainStory();}};
 m.querySelector('.main-story-scene').classList.toggle('is-entering',a.page===0);
 m.onkeydown=e=>{if(e.key!=='Tab'||!MainStory.active)return;const focusables=[...m.querySelectorAll('button,[tabindex="0"]')],first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};
 m.querySelector('.story-actions .btn-gold').focus({preventScroll:true});
}
function nextMainStory(){
 const a=MainStory.active;if(!a)return;
 a.page++;
 if(a.mode!=='REPLAY')state.chapter.pending={kind:'mainStory',...a};
 persistMainStory();renderMainStory();
}
function skipMainStory(){if(!MainStory.active)return;if(!mainStoryState().seen[MainStory.active.scene]&&!confirm('この会話をスキップしますか？ 必要な施設操作は省略されません。'))return;finishMainStoryScene();}
function finishMainStoryScene(){
 const a=MainStory.active;if(!a)return;const s=mainStoryState(),data=MAIN_STORY_SCENES[a.scene];
 s.seen[a.scene]=true;if(a.mode!=='REPLAY')s.firstPlayed[a.scene]=true;
 if(MAIN_STORY_EPISODES[data.episode].every(id=>s.seen[id]))s.read[data.episode]=true;
 MainStory.active=null;
 if(a.mode!=='REPLAY'){state.chapter.pending=null;state.chapter.checkpoint=null;}
 const m=document.getElementById('modal-layer');m.style.display='none';m.className='';m.innerHTML='';
 if(a.mode==='REPLAY'){
  saveState();if(a.queue.length){const [next,...queue]=a.queue;playMainStory(next,'REPLAY',queue);}else {syncLobbyAudio();openMemoryArchive();}return;
 }
 if(data.entry){saveState();render();return;}
 if(data.floor){advanceAfterMainStoryBoss(data.floor);return;}
 if(a.scene==='opening'){s.stage='dungeon';state.chapter.mode='skip';if(!state.chapter.contract)registerFirstContract();}
 if(a.scene==='afterBoss'){
  s.stage='return';state.chapter.pending={kind:'mainStoryReturn'};checkpointChapter();returnToTown(true);return;
 }
 if(a.scene==='tavern')s.stage='forge';
 if(a.scene==='ending'){
  s.stage='free';s.read[2]=true;state.chapter.guideActive=false;addLog('次の目標：20F。支度を整えて地下迷宮へ。','gold');
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches){const fade=document.createElement('div');fade.className='main-story-outro';fade.setAttribute('aria-hidden','true');document.body.append(fade);setTimeout(()=>fade.remove(),350);}
 }
 saveState();render();
 if(a.scene==='perk'&&expeditionPerksPending()){openExpeditionPerks();return;}
 if(['forge','warehouse','shop','equipment'].includes(a.scene)){openMainStoryFacility();return;}
 scheduleMainStory();
}
function replayMainStory(episode=1,all=false){
 const s=mainStoryState();if(!s?.unlocked[episode]||MainStory.active)return;
 const scenes=all?Object.keys(MAIN_STORY_EPISODES).filter(n=>Number(n)>=episode&&s.unlocked[n]).flatMap(n=>MAIN_STORY_EPISODES[n]):[...MAIN_STORY_EPISODES[episode]];
 playMainStory(scenes.shift(),'REPLAY',scenes);
}
function cancelMainStoryReplay(){
 if(MainStory.active?.mode!=='REPLAY')return;
 MainStory.active=null;syncLobbyAudio();openMemoryArchive();
}
function scheduleMainStory(){
 if(MainStory.scheduled)return;MainStory.scheduled=true;
 setTimeout(()=>{MainStory.scheduled=false;syncMainStory();},0);
}
function syncMainStory(){
 const s=mainStoryState();if(!s||HomeScreen.active||MainStory.active||MainStory.closing)return;
 if(document.getElementById('modal-layer').style.display!=='none')return;
 if(state.chapter.pending?.kind==='mainStory'){
  const p=state.chapter.pending;if(MAIN_STORY_SCENES[p.scene]){MainStory.active={...p};renderMainStory();return;}
 }
 if(state.chapter.pending?.kind==='return'){returnToTown(true);return;}
 if(s.stage==='return'){returnToTown(true);return;}
 if(state.floor===101&&state.screen==='door_select'&&!s.seen.chapterTwoStart){playMainStory('chapterTwoStart');return;}
 if(s.legacy){
  if((state.deepestFloorReached>=10||state.bossFirstKills[10])&&!s.noticeSeen&&state.screen==='town'){
   s.unlocked[2]=true;
   showChapterModal('メインストーリーが新しくなりました','<p>第1章「ふたりで潜る理由」の到達済みの話を、記憶の書庫で読めます。進行や所持品は変わりません。</p>','<button class="btn btn-gold" onclick="ackMainStoryNotice(true)">最初から見る</button><button class="btn btn-sub" onclick="ackMainStoryNotice(false)">あとで</button>');
  }return;
 }
 if(s.stage==='opening'){playMainStory('opening');return;}
 if(state.screen==='town'&&mainStoryTownRequired()){continueMainStoryTown();return;}
 if(s.stage!=='dungeon')return;
 const scene={4:'childhood',5:'portal',6:'material',9:'beforeBoss'}[state.floor];
 if(scene&&!s.seen[scene]&&['door_select','safe_point'].includes(state.screen)){playMainStory(scene);return;}
 if(state.floor===7&&state.screen==='battle'&&ensureEnemyParts(state.currentEnemy).some(p=>p.id==='arm')&&!s.seen.parts)playMainStory('parts');
}
function ackMainStoryNotice(replay){const s=mainStoryState();s.noticeSeen=true;saveState();document.getElementById('modal-layer').style.display='none';if(replay)replayMainStory(1,true);}
function mainStoryRecipe(){
 const ready=Object.entries(CRAFT_RECIPES).filter(([id,r])=>r.type==='weapon'&&!r.parent&&r.rarity==='Common'&&!craftingIssue(id));
 return ready.filter(([,r])=>Object.keys(r.materials).length).sort((a,b)=>a[1].gold-b[1].gold)[0]?.[0]||ready.find(([id])=>id==='iron_sword')?.[0]||ready[0]?.[0];
}
function continueMainStoryTown(){
 const s=mainStoryState();if(!mainStoryTownRequired()||state.screen!=='town'||MainStory.active)return;
 const scene=s.stage;
 if(!s.seen[scene]){playMainStory(scene,'TUTORIAL');return;}
 openMainStoryFacility();
}
function openMainStoryFacility(){
 const s=mainStoryState();if(state.screen!=='town'||!mainStoryTownRequired())return;
 if(s.stage==='forge'){
  const recipe=mainStoryRecipe();
  if(recipe){forgeFilters.character='player';openRecipeDetail(recipe);}
  else {openCrafting();document.querySelector('#modal-layer .update-notes-actions')?.insertAdjacentHTML('beforeend','<button class="btn btn-sub" onclick="openLobbyFacility(\'warehouse\')">倉庫のロック・容量を確認</button>');}
  mainStoryGuide(recipe?(Object.keys(CRAFT_RECIPES[recipe].materials).length?'今の素材で作れる基本武器。能力差と進むビルドを確認して、最初の一本を作ろう。':`素材が少ない時の基本レシピ：${CRAFT_RECIPES[recipe].name}（${CRAFT_RECIPES[recipe].gold}G）。作成して装備しよう。`):'作れる基本武器を確認。素材のロック・倉庫容量も確認してください。');
 }else if(s.stage==='warehouse'){openLobbyFacility('warehouse');MainStory.facilityVisit='warehouse';mainStoryGuide('余った装備・素材はここに保管。「ロビーへ戻る」で次へ。');}
 else if(s.stage==='shop'){openLobbyFacility('town-shop');MainStory.facilityVisit='shop';mainStoryGuide('傷薬は次の探索へ持ち込めます。購入は任意。確認したら閉じて次へ。');}
 else if(s.stage==='equipment'){
  openCharacterEquipment('player','weapon');MainStory.facilityVisit='equipment';mainStoryGuide('主人公／エルナを切り替え、作った装備をどちらかに装備しよう。');
 }
}
function mainStoryGuide(text){const body=document.querySelector('#modal-layer .update-notes-body');if(body)body.insertAdjacentHTML('afterbegin',`<p class="main-story-guide">${uiEscape(text)}</p>`);}
function mainStoryEquipped(){const s=mainStoryState();return [state.equipped,characterEquipment('elna')].some(slots=>Object.values(slots||{}).some(it=>it?.id===s.craftedId));}

// Hooks retain the existing inventory, combat, progression and return implementations.
const mainStoryMigrate=migrateChapter;
migrateChapter=function(saved){
 MainStory.active=null;MainStory.facilityVisit=null;
 mainStoryMigrate(saved);
 const legacy=!!saved?.mode||!!saved?.contract||(state.deepestFloorReached||0)>0;
 const raw=saved?.mainStory;
 state.chapter.mainStory={...newMainStoryState(legacy),...(raw||{}),seen:{...(raw?.seen||{})},read:{...(raw?.read||{})},unlocked:{1:true,...(raw?.unlocked||{})},firstPlayed:{...(raw?.firstPlayed||{})},autoplaySkipped:{...(raw?.autoplaySkipped||{})},visited:{...(raw?.visited||{})}};
 if(state.deepestFloorReached>=10||state.bossFirstKills[10])state.chapter.mainStory.unlocked[2]=true;
 const story=mainStoryState(),reached=Math.max(Number(state.deepestFloorReached)||0,...Object.keys(state.bossFirstKills||{}).filter(f=>state.bossFirstKills[f]).map(Number));
 const previousChapterTwo=!Object.prototype.hasOwnProperty.call(raw?.seen||{},'chapterTwoStart');
 if(!Object.prototype.hasOwnProperty.call(story.seen,'chapterTwoStart'))story.seen.chapterTwoStart=reached>=101;
 for(const m of ALL_MAIN_STORY_MILESTONES)if(reached>=m.floor){
  story.unlocked[m.episode]=true;
  // Existing progress is archive-only, never a backlog of forced scenes.
  if(!raw||Number(raw.version||1)<2||(m.episode>=12&&previousChapterTwo))story.autoplaySkipped[m.scene]=true;
 }
 story.version=2;
 // Archive-era progress is retained, but its retired scenes never autoplay.
 if(state.chapter.pending&&!['mainStory','mainStoryReturn','return'].includes(state.chapter.pending.kind)){
  state.chapter.pending={kind:'return',floor:state.floor};state.currentEnemy=null;
 }
};
const mainStoryRender=render;
render=function(){mainStoryRender();scheduleMainStory();};
checkTutorial=function(){scheduleMainStory();};
showChapterWelcome=function(){scheduleMainStory();};
const mainStoryEnter=enterGameFromHome;
enterGameFromHome=function(){mainStoryEnter();if(mainStoryState()?.stage==='opening'){document.getElementById('modal-layer').style.display='none';syncMainStory();}else scheduleMainStory();};
const mainStoryDismiss=dismissUpdateNotes;
dismissUpdateNotes=function(mark){mainStoryDismiss(mark);scheduleMainStory();};
resumeChapter=function(){if(state.chapter.pending?.kind==='return')returnToTown(true);else syncMainStory();};
openMemoryArchive=function(){
 const s=mainStoryState();if(!s)return;
 const entries=[{episode:1,title:'始まり〜10階・町の支度',floor:1},...MAIN_STORY_MILESTONES];
 showChapterModal('記憶の書庫','<h3>第1章 ふたりで潜る理由</h3>'+entries.map((m,i)=>`<p><button class="btn btn-sub" ${s.unlocked[m.episode]?'':'disabled'} onclick="replayMainStoryChapterEpisode(${i+1})">第${i+1}話「${m.title}」 / ${(i===0?s.read[1]&&s.read[2]:s.read[m.episode])?'既読':s.unlocked[m.episode]?'未読':m.floor+'F到達で解放'}</button></p>`).join('')+'<h3>第2章 地図のない先</h3>'+CHAPTER_TWO_MILESTONES.map((m,i)=>`<p><button class="btn btn-sub" ${s.unlocked[m.episode]?'':'disabled'} onclick="replayMainStory(${m.episode})">第${i+1}話「${uiEscape(m.title)}」 / ${s.read[m.episode]?'既読':s.unlocked[m.episode]?'未読':m.floor+'F到達で解放'}</button></p>`).join('')+'<p>到達済みの話を回想できます。回想で装備・素材・攻略進行は変わりません。</p>','<button class="btn btn-sub" onclick="closeGenericModal()">閉じる</button>');
};
function replayMainStoryChapterEpisode(number){
 if(number!==1){const m=MAIN_STORY_MILESTONES[number-2];if(m)replayMainStory(m.episode);return;}
 const s=mainStoryState();if(!s||MainStory.active)return;
 const scenes=[...MAIN_STORY_EPISODES[1],...(s.unlocked[2]?MAIN_STORY_EPISODES[2]:[])];
 playMainStory(scenes.shift(),'REPLAY',scenes);
}
chapterTownHtml=function(){return mainStoryTownRequired()?'<button class="btn btn-gold" onclick="continueMainStoryTown()">町の案内を再開</button>':'';};
tutorialBanner=function(){return '';};
const mainStoryStartRun=startDungeonRun;
startDungeonRun=function(){if(mainStoryTownRequired()){continueMainStoryTown();return;}if(MainStory.active)return;mainStoryStartRun();};
afterChapterBoss=function(floor){
 if(MainStory.active)return;
 state.maxUnlockedFloor=Math.max(state.maxUnlockedFloor,Math.min(MAX_DUNGEON_FLOOR,floor+10));
 state.currentEnemy=null;state.chapter.unlocked[floor]=true;
 const s=mainStoryState();if(floor>=10)s.unlocked[2]=true;
 if(floor===10&&mainStoryTutorial()&&s.stage==='dungeon'){playBossMainStory('afterBoss');return;}
 const milestone=ALL_MAIN_STORY_MILESTONES.find(m=>m.floor===floor);
 if(milestone){
  s.unlocked[milestone.episode]=true;
  if(!s.firstPlayed[milestone.scene]&&!s.autoplaySkipped[milestone.scene]){playBossMainStory(milestone.scene);return;}
 }
 advanceAfterMainStoryBoss(floor);
};
function playBossMainStory(scene){
 // A defeated enemy is null. Persist a safe backdrop before Home renders on reload.
 state.screen='door_select';state.currentDoors=[];playMainStory(scene);
}
function advanceAfterMainStoryBoss(floor){
 if(floor>=MAX_DUNGEON_FLOOR){saveState();returnToTown(true);return;}
 state.floor=floor+1;generateDoorsForFloor();saveState();
}
const mainStoryReturn=finalizeSafeReturn;
finalizeSafeReturn=function(){
 const s=mainStoryState();
 // Clear the loot checkpoint BEFORE the existing atomic return save, so reload cannot pay twice.
 if(s?.stage==='return'&&state.screen!=='town'&&!state.returnResolved&&canStoreItems(state.inventory)){
  s.stage='tavern';state.chapter.pending=null;state.chapter.checkpoint=null;
 }
 mainStoryReturn();
 if(s?.stage==='tavern'&&state.screen==='town'){saveState();document.getElementById('modal-layer').style.display='none';scheduleMainStory();}
};
const mainStoryClose=closeGenericModal;
closeGenericModal=function(){
 if(MainStory.active)return;
 const s=mainStoryState(),visit=MainStory.facilityVisit;MainStory.facilityVisit=null;
 if(mainStoryTownRequired()&&visit===s.stage){
  s.visited[visit]=true;
  if(visit==='warehouse')s.stage='shop';
  if(visit==='shop')s.stage='equipment';
  if(visit==='equipment'&&mainStoryEquipped())s.stage='ending';
  saveState();
 }
 MainStory.closing=true;mainStoryClose();MainStory.closing=false;scheduleMainStory();
};
const mainStoryCraft=craftEquipment;
craftEquipment=function(id,parent){
 const before=new Set(state.storage.map(it=>it.id));const result=mainStoryCraft(id,parent),s=mainStoryState();
 if(result&&s?.stage==='forge'&&CRAFT_RECIPES[id]?.type==='weapon'){
  s.craftedId=state.storage.find(it=>!before.has(it.id)&&it.key===id)?.id;
  if(s.craftedId){s.stage='warehouse';saveState();document.querySelector('#modal-layer .update-notes-actions')?.insertAdjacentHTML('beforeend','<button class="btn btn-gold" onclick="closeGenericModal()">倉庫の案内へ</button>');}
 }return result;
};
const mainStoryOpenPerks=openExpeditionPerks;
openExpeditionPerks=function(...args){
 if(MainStory.active)return;
 if(mainStoryTutorial()&&expeditionPerksPending()&&['door_select','safe_point'].includes(state.screen))offerExpeditionPerks();
 if(mainStoryTutorial()&&!mainStoryState().seen.perk&&expeditionPerksPending()&&['door_select','safe_point'].includes(state.screen)){playMainStory('perk','TUTORIAL');return;}
 return mainStoryOpenPerks(...args);
};
const mainStoryDoors=generateDoorsForFloor;
generateDoorsForFloor=function(){
 mainStoryDoors();const s=mainStoryState();
 if(mainStoryTutorial()&&[1,2,3,6,7].includes(state.floor)&&state.screen==='door_select'){
  const combat=state.currentDoors.find(d=>['battle_normal','elite_battle'].includes(d.type));
  if(combat){state.currentDoors=[{...combat,type:'battle_normal',...(state.floor===7?{sign:'腕に力を込める採掘兵',desc:'部位を狙い、敵の構えを崩す。'}:{sign:'坑道を進む ― 魔物の気配'})}];render();}
 }
};
const mainStoryAction=playerCombatAction;
playerCombatAction=function(...args){if(MainStory.active)return;return mainStoryAction(...args);};
const mainStoryBattleTip=decorateBattleDecision;
decorateBattleDecision=function(root,enemy){
 mainStoryBattleTip(root,enemy);
 if(!mainStoryTutorial()||state.floor>10)return;
 let tip='';
 if(state.floor<=3){const action=enemy.actionType;
  tip=['heavy','critical_smash'].includes(action)?'エルナ「……来る」 防御で大技に備えよう。':action==='counter_stance'?'強攻撃には反撃。通常攻撃かスキルを選ぼう。':action==='falter'?'隙ができた。強攻撃の好機。':state.floor===1?'通常攻撃で様子を見る。次の行動も確認。':state.floor===2?'強攻撃は大きな一撃。敵の構えに注意。':'スキルは再使用まで待ち時間。好機に使おう。';
 }else if(state.floor===7)tip='部位から腕を選択 → 破壊で敵ATK低下。';
 else if(state.floor===10)tip='巨人の予告を確認。大技には防御、隙には強攻撃。';
 if(tip){const advice=root.querySelector('.battle-intent span');if(advice){advice.classList.add('main-story-tip');advice.textContent=tip;}}
};
