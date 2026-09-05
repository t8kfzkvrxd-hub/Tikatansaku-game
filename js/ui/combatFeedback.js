const combatFeedback={events:[],floats:[],enemy:null,previous:{},frames:[],serial:0,logOpen:false};
function combatName(id){return id==='player'?'主人公':id==='enemy'?'敵':id==='status'?'状態異常':CHARACTER_DATA[id]?.name||id;}
function combatApplied(actor,target,delta,label,kind){
 if(delta<0&&typeof markCharacterVisualHit==='function')markCharacterVisualHit(target,-delta);
 const frame=combatFeedback.frames.at(-1);if(!frame||!delta)return;
 if(target==='enemy'&&delta<0)delta=-Math.min(-delta,Math.max(0,(state.currentEnemy?.hp||0)-delta));
 frame.child[target]=(frame.child[target]||0)+delta;
 combatEmit(actor,target,Math.abs(delta),label,kind||(delta>0?'heal':target==='enemy'?'damage':'hurt'));
}
function combatSnapshot(enemy){const result={player:Number(state.hp)||0,enemy:Math.max(0,Number(enemy?.hp)||0)};for(const [id,unit]of Object.entries(state.companionBattle||{}))result[id]=Number(unit.hp)||0;return result;}
function combatEmit(actor,target,value,label='',kind='damage'){
 if(!value||!Number.isFinite(value))return;
 const frame=combatFeedback.frames.at(-1);if(frame){frame.events.push([actor,target,value,label,kind]);return;}
 const e={id:++combatFeedback.serial,actor,target,value:Math.round(value*10)/10,label,kind,time:Date.now()};
 const fallback=document.querySelector(`[data-combat-unit="${target}"]`)?.getBoundingClientRect();
 combatFeedback.events.push(e);combatFeedback.events=combatFeedback.events.slice(-5);
 queueMicrotask(()=>{
  if(document.body.classList.contains('at-home')||state.screen==='town')return;
  renderCombatReadout();
  const anchor=document.querySelector(`[data-combat-unit="${target}"]`),rect=anchor?.getBoundingClientRect()||fallback;if(!rect)return;
  const el=document.createElement('div');el.className=`combat-float ${kind}`;
  el.textContent=`${combatName(actor)}${target!=='enemy'&&actor!==target?' → '+combatName(target):''}\n${label?label+' ':''}${kind==='heal'||kind==='shield'||kind==='buff'?'+':target==='enemy'?'':'−'}${e.value}${kind==='heal'?' HP':kind==='buff'?'%':''}`;
  const lane=actor==='player'?-.2:actor==='enemy'?0:.2;
  el.style.left=Math.max(80,Math.min(innerWidth-80,rect.left+rect.width*(.5+lane)))+'px';
  el.style.top=Math.max(8,rect.bottom+5+(combatFeedback.floats.length%3)*17)+'px';document.body.appendChild(el);
  combatFeedback.floats.push(el);while(combatFeedback.floats.length>8)combatFeedback.floats.shift().remove();
  setTimeout(()=>{el.remove();combatFeedback.floats=combatFeedback.floats.filter(n=>n!==el);if(state.screen==='battle'&&state.currentEnemy)renderCombatReadout();},1300);
 });
}
function combatStatuses(unit,isEnemy=false){
 const data=isEnemy?{...(unit.buildStatuses||{}),poison:unit.gearPoison||0}:unit===state?{...state.statusEffects,poison:Math.max(state.statusEffects?.poison||0,state.playerPoisonTurns||0)}:{poison:unit.poison||0};
 const names={bleed:'🩸 出血',poison:'☠ 毒',fire:'🔥 炎上',freeze:'❄ 凍結',shock:'⚡ 感電',curse:'🔮 呪い',paralysis:'⚡ 麻痺',bind:'🕸 拘束',weakened:'⬇ 弱体'};
 return Object.entries(data).filter(([,n])=>n>0).map(([k,n])=>`${names[k]||k} ×${n}`).join(' / ')||'状態異常なし';
}
function renderCombatReadout(){
 if(typeof observeCharacterVisuals==='function')observeCharacterVisuals();
 let root=document.querySelector('.battle-readout');
 if(state.screen!=='battle'||!state.currentEnemy){root?.remove();if(state.screen==='town'||document.body.classList.contains('at-home')){combatFeedback.floats.forEach(n=>n.remove());combatFeedback.floats=[];}return;}
 const enemy=state.currentEnemy;
 const actions=document.querySelector('.combat-actions');
 if(combatFeedback.enemy!==enemy){combatFeedback.enemy=enemy;combatFeedback.events=[];combatFeedback.previous={};}
 if(!root){root=document.createElement('section');root.className='battle-readout';document.getElementById('viewport').prepend(root);}
 const stats=getPlayerStats(),unit=companionCombatUnit(),entries=[['player',state,stats.maxHp],...(unit?[[unit.id,unit,companionStats(unit.id).maxHp]]:[]),['enemy',enemy,enemy.maxHp]];
 root.innerHTML=entries.map(([id,u,max])=>{
  const pct=Math.max(0,Math.min(100,u.hp/max*100)),old=combatFeedback.previous[id];
  if(!old||old.pct!==pct)combatFeedback.previous[id]={pct,from:old?.pct??pct,time:Date.now()};
  const history=combatFeedback.previous[id],prev=Date.now()-history.time<800?history.from:pct;
  const recent=combatFeedback.events.filter(e=>Date.now()-e.time<1300),hurt=recent.some(e=>e.target===id&&e.kind==='hurt'),acting=recent.some(e=>e.actor===id&&e.target==='enemy');
  return `<div data-visual-state="${id!=='enemy'&&typeof characterVisualState==='function'?characterVisualState(id):'normal'}" data-combat-unit="${id}" class="battle-unit ${hurt?'hit':''} ${acting?'acting':''}"><strong>${combatName(id)}${id!=='enemy'?' Lv'+characterProgress(id).level:''}${id==='enemy'?'：'+uiEscape(enemy.name):''}${u.hp<=0?(id==='player'?'（敗北）':id==='enemy'?'（討伐）':'（気絶）'):''}</strong><span>${Math.max(0,Math.round(u.hp))} / ${Math.round(max)} HP</span><div class="hp-track"><i class="hp-trail" style="--hp-before:${prev}%;--hp-after:${pct}%;width:${pct}%"></i><i class="hp-live" style="width:${pct}%"></i></div><div class="battle-status">${combatStatuses(u,id==='enemy')}${u.buildRuntime?.shield?' / 🛡 '+u.buildRuntime.shield:''}</div></div>`;
 }).join('')+`<div class="combat-number-space" aria-hidden="true"></div><details class="battle-feed" ${combatFeedback.logOpen?'open':''}><summary>戦闘ログ（最新5件）</summary><ol>${combatFeedback.events.map(e=>`<li>${uiEscape(combatName(e.actor))} → ${uiEscape(combatName(e.target))}：${uiEscape(e.label)} ${e.kind==='heal'||e.kind==='shield'?'+':''}${e.value}${e.kind==='heal'?' HP回復':e.kind==='shield'?' シールド':e.kind==='buff'?'% 特効':e.kind==='part'?' 部位耐久ダメージ':'ダメージ'}</li>`).join('')||'<li>行動するとここに表示されます。</li>'}</ol></details>`;
 root.querySelector('details').addEventListener('toggle',e=>{combatFeedback.logOpen=e.currentTarget.open;});
 if(typeof enemyPartsHtml==='function')root.querySelector('.combat-number-space').insertAdjacentHTML('beforebegin',enemyPartsHtml(enemy));
 if(actions)root.insertBefore(actions,root.querySelector('.battle-feed'));
 if(typeof renderPartyStatus==='function')renderPartyStatus();
}
function observeCombat(fn,actorFor,label,kind){
 return function(...args){
  const enemy=state.currentEnemy;if(state.screen!=='battle'||!enemy)return fn.apply(this,args);
  if(combatFeedback.enemy!==enemy){combatFeedback.enemy=enemy;combatFeedback.events=[];combatFeedback.previous={};}
  const actor=actorFor(...args),before=combatSnapshot(enemy),frame={actor,label,child:{},critical:false,events:[]};combatFeedback.frames.push(frame);
  try{return fn.apply(this,args);}finally{
   const after=combatSnapshot(enemy),parent=combatFeedback.frames.at(-2);
   for(const target of Object.keys(before)){
    const delta=(after[target]??before[target])-before[target],own=delta-(frame.child[target]||0);
    if(parent)parent.child[target]=(parent.child[target]||0)+delta;
    if(own>0&&target==='enemy'&&actor!=='enemy'){
     let correction=own;for(const event of [...frame.events].reverse())if(event[1]==='enemy'&&event[4]==='damage'){const reduction=Math.min(correction,event[2]);event[2]-=reduction;correction-=reduction;}
    }else if(own)combatEmit(own>0?target:actor,target,Math.abs(own),frame.critical&&target==='enemy'?'CRITICAL '+label:label,own>0?'heal':target==='enemy'?'damage':'hurt');
   }
   combatFeedback.frames.pop();if(parent)parent.events.push(...frame.events);else for(const event of frame.events)combatEmit(...event);
  }
 };
}
playerCombatAction=observeCombat(playerCombatAction,()=> 'player','攻撃');
enemyTurn=observeCombat(enemyTurn,()=> 'enemy','敵行動');
companionTurn=observeCombat(companionTurn,()=>state.chapter.companion,'攻撃');
companionReceiveAttack=observeCombat(companionReceiveAttack,()=> 'enemy','攻撃');
equipmentHit=observeCombat(equipmentHit,(enemy,action,crit,slots=state.equipped)=>{
 const frame=combatFeedback.frames.at(-1);if(frame&&crit)frame.critical=true;
 return slots===state.equipped?'player':state.chapter.companion;
},'FIRE');
buildHit=observeCombat(buildHit,(enemy,action,crit,slots)=>slots===state.equipped?'player':state.chapter.companion,'追撃');
equipmentPoisonTick=observeCombat(equipmentPoisonTick,()=> 'status','POISON');
buildStatusTick=observeCombat(buildStatusTick,()=> 'status','状態異常');
processPlayerStatuses=observeCombat(processPlayerStatuses,()=> 'player','状態異常');
healFromWeaponDamage=observeCombat(healFromWeaponDamage,unit=>unit===state?'player':unit.id,'LIFESTEAL');
buildKill=observeCombat(buildKill,unit=>unit===state?'player':unit.id,'撃破回復');
buildIncomingDamage=observeCombat(buildIncomingDamage,(damage,enemy,slots,unit)=>unit===state?'player':unit.id,'反射');
onEnemyKilled=observeCombat(onEnemyKilled,()=> 'player','撃破回復');
const combatOldFloating=spawnFloatingFx;
spawnFloatingFx=function(...args){if(combatFeedback.frames.length&&args[1]!=='gold'&&/[-−+]\d|連撃/.test(args[0]))return;return combatOldFloating(...args);};
