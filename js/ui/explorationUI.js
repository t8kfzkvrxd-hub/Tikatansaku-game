const ExplorationScreen={doors:null,visual:null,pending:false};
function openExplorationPanel(tab='bag'){
 setTab(tab);
 showChapterModal('探索メニュー',`${getUnclaimedLootBarHtml()}<nav>${[['bag','所持品'],['equip','装備'],['codex','図鑑'],['log','日誌']].map(([key,name])=>`<button class="btn btn-sub" onclick="openExplorationPanel('${key}')">${name}</button>`).join('')}</nav>${document.getElementById('sub-panel').innerHTML}`,`<button class="btn btn-sub" onclick="closeGenericModal()">探索へ戻る</button>`);
}
function explorationArea(floor=state.floor){return explorationAreas.find(a=>floor>=a.floorMin&&floor<=a.floorMax);}
function selectExplorationRoute(index){
 const view=ExplorationScreen,doors=state.currentDoors;
 if(view.pending||state.screen!=='door_select'||doors.selected||!doors[index]||performance.now()<inputSafety.until)return;
 view.pending=true;
 document.querySelectorAll('.exploration-route').forEach((b,i)=>{b.disabled=true;b.classList.add(i===index?'chosen':'faded');});
 setTimeout(()=>{view.pending=false;if(state.screen==='door_select'&&state.currentDoors===doors)selectDoor(index);},matchMedia('(prefers-reduced-motion: reduce)').matches?0:140);
}
function syncExplorationScreen(){
 const area=explorationArea(),active=state.screen==='door_select'&&area?.enabled&&!HomeScreen.active&&!isBossFloor(state.floor);
 document.body.classList.toggle('at-exploration',!!active);document.documentElement.classList.toggle('at-exploration',!!active);
 let root=document.getElementById('exploration-screen');
 if(!active){if(root)root.hidden=true;return;}
 if(!root){root=document.createElement('section');root.id='exploration-screen';root.setAttribute('aria-label','探索');document.body.append(root);}
 root.hidden=false;
 const view=ExplorationScreen;
 if(view.doors!==state.currentDoors){
  view.doors=state.currentDoors;view.pending=false;
  const sample=xs=>xs[Math.floor(Math.random()*xs.length)];
  view.visual={background:sample(area.backgrounds),titles:state.currentDoors.map(d=>area.titles[d.type]?sample(area.titles[d.type]):d.sign),line:Math.random()<.3?sample(area.lines):''};
 }
 const visual=view.visual,bg=visual.background;
 const hud=id=>{const m=partyMember(id);if(!m)return '';return `<button class="exploration-hud ${id}" onclick="openCharacterStatus('${id}')">${partyMiniHtml(m)}<small>${typeof combatStatuses==='function'?combatStatuses(m.unit):''}</small></button>`;};
 const elna=activeParty().find(m=>m.id==='elna');
 root.innerHTML=`<img class="exploration-background" src="${bg.src}" style="object-position:${bg.position}" alt="${uiEscape(area.name)}（${bg.label||'探索背景'}）"><div class="exploration-effects" aria-hidden="true">${area.effects.map(effect=>`<i class="effect-${effect}"></i>`).join('')}</div><header class="exploration-heading"><button class="exploration-menu" onclick="openExplorationPanel()">所持品ほか</button><strong>B${state.floor}F　${uiEscape(area.name)}</strong><span>危険度 GREED ${state.greedLevel||0}</span>${recommendedLevelHtml()}</header>${elna?.unit.hp>0&&visual.line?`<aside class="exploration-line">エルナ「${uiEscape(visual.line)}」</aside>`:''}<nav class="exploration-routes" aria-label="探索ルート" style="--routes:${state.currentDoors.length}">${state.currentDoors.map((d,i)=>{const meta=EXPLORATION_ROUTES[d.type]||{kind:'探索',reward:'探索先で確認',tone:'event'};return `<button class="exploration-route ${meta.tone}" onclick="selectExplorationRoute(${i})"><span class="route-icon">${d.icon}</span><strong>${uiEscape(visual.titles[i])}</strong><span>【${meta.kind}】 ${uiEscape(d.riskText||'')}</span><small>${uiEscape(d.desc)}</small><span>${meta.reward}</span></button>`;}).join('')}</nav><footer class="exploration-party">${hud('player')}${elna?hud('elna'):''}</footer>`;
}
