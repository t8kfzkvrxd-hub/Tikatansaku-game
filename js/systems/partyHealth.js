function partyMember(id){
 if(id==='player')return {id,name:'主人公',unit:state,stats:getPlayerStats()};
 if(!state.chapter?.owned[id])return null;
 state.companionBattle ||= {};
 const stats=companionStats(id),unit=state.companionBattle[id] ||= {id,hp:stats.maxHp,poison:0,cooldown:0,attackBuff:1};
 unit.id=id;unit.hp=Math.max(0,Math.min(stats.maxHp,Number.isFinite(unit.hp)?unit.hp:stats.maxHp));
 return {id,name:CHARACTER_DATA[id]?.name||id,unit,stats};
}
function activeParty(){return ['player',...(state.chapter?.companion&&state.chapter.owned[state.chapter.companion]&&!state.chapter.pending?[state.chapter.companion]:[])].map(partyMember).filter(Boolean);}
function selectEnemyTarget(enemy,rng=Math.random){
 const targets=activeParty().filter(m=>m.unit.hp>0).reverse();
 return targets[Math.min(targets.length-1,Math.floor(rng()*targets.length))]?.id||'player';
}
function healCompanionAtRest(fraction=1){
 const id=state.chapter?.companion,m=id?partyMember(id):null;if(!m)return;
 const before=m.unit.hp;
 m.unit.hp=before<=0?Math.max(1,Math.floor(m.stats.maxHp*.25)):Math.min(m.stats.maxHp,before+Math.round(m.stats.maxHp*fraction));
 m.unit.poison=0;addLog(`${m.name}：${before<=0?'気絶から復帰':'休息回復'} HP +${m.unit.hp-before}`,'heal');
}
function restoreCompanionsAtTown(){
 for(const id of Object.keys(state.chapter?.owned||{})){const m=partyMember(id);if(m){m.unit.hp=m.stats.maxHp;m.unit.poison=0;}}
}
let healingSelection=null;
function openHealingTargets(index){
 const item=state.inventory[index];if(!item||item.type!=='potion'||state.currentEnemy?.acting)return;
 healingSelection=item;
 showChapterModal('回復する相手',`<p>${uiEscape(item.name)}：気絶は休憩・回復イベントで復帰できます。</p><div class="healing-targets">${activeParty().map(m=>`<button class="btn btn-sub" ${m.unit.hp<=0||m.unit.hp>=m.stats.maxHp?'disabled':''} onclick="applyHealingTarget('${m.id}')">${partyMiniHtml(m)}<span>${m.unit.hp<=0?'気絶（通常薬では復帰不可）':m.unit.hp>=m.stats.maxHp?'HP満タン':'回復する'}</span></button>`).join('')}</div>`,`<button class="btn btn-sub" onclick="healingSelection=null;closeGenericModal()">キャンセル</button>`);
}
function applyHealingTarget(id){
 const item=healingSelection,index=state.inventory.indexOf(item);
 if(index<0||state.currentEnemy?.acting||!activeParty().some(m=>m.id===id))return false;
 const targets=item.target==='all'||item.healAll?activeParty():[partyMember(id)];
 const valid=targets.filter(m=>m.unit.hp>0&&m.unit.hp<m.stats.maxHp&&((item.heal||0)+(m.stats.maxHp*(item.healPercent||0)/100)>0));
 if(!valid.length)return false;
 healingSelection=null;state.inventory.splice(index,1);
 for(const m of valid){const before=m.unit.hp,amount=(item.heal||0)+Math.round(m.stats.maxHp*(item.healPercent||0)/100);m.unit.hp=Math.min(m.stats.maxHp,before+Math.max(0,amount));if(item.cureAll){if(m.id==='player')clearPlayerStatuses();else m.unit.poison=0;}addLog(`${m.name}：${item.name} HP +${m.unit.hp-before}`,'heal');combatEmit(m.id,m.id,m.unit.hp-before,'回復薬','heal');}
 playSound('heal');closeGenericModal();saveState();updateHeader();render();return true;
}
