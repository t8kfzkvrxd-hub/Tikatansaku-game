const CHARACTER_VISUALS={player:['normal','hit','critical'],elna:['normal','hit','critical','fainted']};
const CharacterVisual={records:new Map(),hitMs:750,criticalRatio:.25,timer:null};
function characterVisualRecord(id){
 const m=partyMember(id);if(!m)return null;
 let r=CharacterVisual.records.get(id);
 if(!r||r.unit!==m.unit){r={unit:m.unit,hp:m.unit.hp,until:0,damage:0};CharacterVisual.records.set(id,r);}
 return r;
}
function markCharacterVisualHit(id,damage){
 if(!CHARACTER_VISUALS[id]||damage<=0)return;
 const r=characterVisualRecord(id);if(!r)return;
 r.fromHp=r.unit.hp+damage;r.hp=r.unit.hp;r.damage=damage;r.until=performance.now()+CharacterVisual.hitMs;
 clearTimeout(CharacterVisual.timer);
 CharacterVisual.timer=setTimeout(()=>{
  if(typeof syncExplorationScreen==='function')syncExplorationScreen();
  if(state.screen==='battle')renderCombatReadout();
 },CharacterVisual.hitMs+10);
}
function observeCharacterVisuals(){
 if(state.screen==='town'||HomeScreen.active){CharacterVisual.records.clear();clearTimeout(CharacterVisual.timer);return;}
 const active=activeParty();
 for(const id of CharacterVisual.records.keys())if(!active.some(m=>m.id===id))CharacterVisual.records.delete(id);
 for(const m of active){const r=characterVisualRecord(m.id);if(!r)continue;
  if(m.unit.hp<r.hp)markCharacterVisualHit(m.id,r.hp-m.unit.hp);
  if(m.unit.hp>r.hp&&r.hp<=0)r.until=0;
  r.hp=m.unit.hp;
 }
}
function characterVisualState(id,now=performance.now()){
 const m=partyMember(id);if(!m)return 'normal';
 if(m.unit.hp<=0)return id==='player'?'critical':'fainted';
 const r=characterVisualRecord(id);if(r?.until>now)return 'hit';
 return m.unit.hp/m.stats.maxHp<=CharacterVisual.criticalRatio?'critical':'normal';
}
function characterPortraitHtml(id){
 const kinds=CHARACTER_VISUALS[id];if(!kinds)return '';
 const current=characterVisualState(id);
 return `<span class="character-portrait" aria-hidden="true">${kinds.map(kind=>`<img src="assets/characters/${id}/states/${id}-${kind}.png" class="${kind===current?'visible':''}" alt="" width="1024" height="1536" decoding="async">`).join('')}</span>`;
}
function explorationCharacterHud(id){
 const m=partyMember(id);if(!m)return '';
 const kind=characterVisualState(id),r=characterVisualRecord(id),hp=Math.max(0,m.unit.hp),pct=Math.min(100,hp/m.stats.maxHp*100),name=uiEscape(m.name);
 return `<button class="exploration-hud ${id}" data-character="${id}" data-visual-state="${kind}" onclick="openCharacterStatus('${id}')" aria-label="${name}の状態：${kind==='fainted'?'気絶':kind==='critical'?'瀕死':kind==='hit'?'被弾':'通常'}">${characterPortraitHtml(id)}<span class="character-hud-info"><strong>${name} Lv${characterProgress(id).level}</strong><span>HP ${Math.round(hp)} / ${Math.round(m.stats.maxHp)}</span><span class="character-hp" role="progressbar" aria-label="${name} HP" aria-valuemin="0" aria-valuemax="${Math.round(m.stats.maxHp)}" aria-valuenow="${Math.round(hp)}"><i style="width:${pct}%;--hud-from:${kind==='hit'?Math.min(100,r.fromHp/m.stats.maxHp*100):pct}%"></i></span><small>${kind==='fainted'?'【気絶】':kind==='critical'?'【瀕死】':''}${uiEscape(combatStatuses(m.unit))}</small>${kind==='hit'?`<b class="character-damage">−${Math.round(r.damage)}</b>`:''}</span></button>`;
}
