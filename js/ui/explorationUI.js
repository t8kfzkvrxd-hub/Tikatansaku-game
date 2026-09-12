const ExplorationScreen={doors:null,visual:null,pending:false};
function explorationRouteCard(d,i,title){
 const meta=d.type==='deep_area_event'&&state.floor>100?{kind:'採取',reward:'素材 / 休息も選択可能',tone:'gather',icon:'💎'}:EXPLORATION_ROUTES[d.type]||{kind:'イベント',reward:'探索先で確認',tone:'event'};
 const risks={cursed_chest:'開封で最大HP減少',golden_stairs:'契約すると敵が強化',elite_battle:'強敵との戦闘',heal_spring:'回復選択時は次の宝箱に代償',emergency_portal:'戦利品の半分を失う',sealed_vault:'鍵を消費',merchant:'購入にG必要'},rewards={battle_normal:'G・素材 / 撃破で探索強化へ',cursed_chest:'解禁済みの希少素材',golden_stairs:'契約中の獲得G 3倍'};
 return `<button class="exploration-route ${meta.tone}" onclick="selectExplorationRoute(${i})"><span class="route-label"><span class="route-icon">${meta.icon||d.icon}</span>${meta.kind}</span><strong>${uiEscape(title)}</strong><span class="route-risk">危険：${uiEscape(d.runRisk==='bold'?'敵ATK +30%・3戦':d.runRisk==='safe'?'敵ATK −15%・1戦':risks[d.type]||d.riskText||'不明')}</span><span class="route-reward">見返り：${uiEscape(d.runRisk==='bold'?'G +50% / 素材通常':d.runRisk==='safe'?'G −25% / 素材通常':rewards[d.type]||meta.reward)}</span></button>`;
}
function openExplorationPanel(tab='bag'){
 setTab(tab);
 showChapterModal('探索メニュー',`${getUnclaimedLootBarHtml()}<nav>${[['bag','所持品'],['equip','装備'],['codex','図鑑'],['log','日誌']].map(([key,name])=>`<button class="btn btn-sub" onclick="openExplorationPanel('${key}')">${name}</button>`).join('')}</nav>${document.getElementById('sub-panel').innerHTML}`,`<button class="btn btn-sub" onclick="closeGenericModal()">探索へ戻る</button>`);
}
function explorationArea(floor=state.floor){return explorationAreas.find(a=>floor>=a.floorMin&&floor<=a.floorMax);}
function selectExplorationRoute(index){
 if(expeditionPerksPending()){openExpeditionPerks();return;}
 const view=ExplorationScreen,doors=state.currentDoors;
 if(view.pending||state.screen!=='door_select'||doors.selected||!doors[index]||performance.now()<inputSafety.until)return;
 view.pending=true;
 document.querySelectorAll('.exploration-route').forEach((b,i)=>{b.disabled=true;b.classList.add(i===index?'chosen':'faded');});
 setTimeout(()=>{view.pending=false;if(state.screen==='door_select'&&state.currentDoors===doors)selectDoor(index);},matchMedia('(prefers-reduced-motion: reduce)').matches?0:260);
}
function syncExplorationScreen(){
 observeCharacterVisuals();
 const area=explorationArea(),active=state.screen==='door_select'&&area?.enabled&&!HomeScreen.active&&!isBossFloor(state.floor);
 document.body.classList.toggle('at-exploration',!!active);document.documentElement.classList.toggle('at-exploration',!!active);
 let root=document.getElementById('exploration-screen');
 if(!active){if(root)root.hidden=true;return;}
 if(!root){root=document.createElement('section');root.id='exploration-screen';root.setAttribute('aria-label','探索');document.body.append(root);}
 root.hidden=false;
 const view=ExplorationScreen;
 if(view.doors!==state.currentDoors||view.areaId!==area.id){
  view.areaId=area.id;
  view.doors=state.currentDoors;view.pending=false;
  const sample=xs=>xs[Math.floor(Math.random()*xs.length)];
  view.visual={background:sample(area.backgrounds),titles:state.currentDoors.map(d=>area.titles[d.type]?sample(area.titles[d.type]):d.sign),line:Math.random()<.3?sample(area.lines):''};
 }
 const visual=view.visual,bg=visual.background;
 const hud=explorationCharacterHud;
 const elna=activeParty().find(m=>m.id==='elna');
 root.innerHTML=`<img class="exploration-background" src="${bg.src}" style="object-position:${bg.position}" alt="${uiEscape(area.name)}（${bg.label||'探索背景'}）"><div class="exploration-effects" aria-hidden="true">${area.effects.map(effect=>`<i class="effect-${effect}"></i>`).join('')}</div><header class="exploration-heading"><button class="exploration-menu" onclick="openExplorationPanel()">所持品ほか</button><strong>B${state.floor}F　${uiEscape(area.name)}</strong><span>危険度 GREED ${state.greedLevel||0}</span>${recommendedLevelHtml()}${expeditionPerkButton()}${state.chapter.contract&&state.chapter.mode!=='skip'&&!state.chapter.read[10]&&TUTORIAL_STEPS[state.floor]?`<span class="exploration-tutorial">エルナ：${uiEscape(TUTORIAL_STEPS[state.floor][0])}</span>`:''}</header>${elna?.unit.hp>0&&visual.line?`<aside class="exploration-line">エルナ「${uiEscape(visual.line)}」</aside>`:''}<nav class="exploration-routes" aria-label="探索ルート" style="--routes:${state.currentDoors.length}">${state.currentDoors.map((d,i)=>explorationRouteCard(d,i,visual.titles[i])).join('')}</nav><footer class="exploration-party">${hud('player')}${elna?hud('elna'):''}</footer>`;
}
