function itemSynergy(item){const r=synergyEquipmentDefinition(item);return r&&(EQUIPMENT_SYNERGIES[item.key||item.id]||SYNERGY_DEFINITION_INDEX.get(r))||null;}
function completedBuildState(slots){
 const tags=buildTags(slots),roles=new Set(Object.values(slots).filter(Boolean).map(i=>i.type));
 return COMPLETED_BUILDS.map(build=>({...build,missing:build.requiredTags.filter(t=>!tags.has(t)),missingRoles:build.requiredRoles.filter(r=>!roles.has(r))})).map(b=>({...b,configured:!b.missing.length&&!b.missingRoles.length,locked:state.floor<(b.unlockFloor||0),active:!b.missing.length&&!b.missingRoles.length&&state.floor>=(b.unlockFloor||0)}));
}
const synergyMemories=new WeakMap();
let temporarySynergies=new WeakMap();
function clearTemporarySynergies(unit=null){if(unit)temporarySynergies.delete(unit);else temporarySynergies=new WeakMap();}
function invalidateTemporaryMarks(unit){const t=temporarySynergies.get(unit);if(t){t.iceBurialMark=false;t.curseJudgmentMark=false;t.direct=null;}}
function temporarySynergy(enemy,unit,slots){
 if(!enemy||!unit)return {};
 slots ||= unit===state?state.equipped:state.chapter?.equipment?.[unit.id];
 const signature=JSON.stringify(slots||{});
 let t=temporarySynergies.get(unit);
 if(!t||t.enemy!==enemy){t={enemy,signature,actions:0};temporarySynergies.set(unit,t);}
 if(t.signature!==signature){t.signature=signature;t.iceBurialMark=false;t.curseJudgmentMark=false;t.direct=null;}
 return t;
}
function beginTemporarySynergyAttack(enemy,unit,slots,action){
 const t=temporarySynergy(enemy,unit,slots);
 t.direct=['attack','heavy','skill'].includes(action)?{ice:!!t.iceBurialMark,curse:!!t.curseJudgmentMark}:null;
 t.actions=(t.actions||0)+1;
}
function consumeTemporarySynergyMarks(enemy,slots){
 const unit=synergyUnit(slots);if(!unit)return;
 const t=temporarySynergy(enemy,unit,slots);if(!t.direct)return;
 if(t.direct.ice)t.iceBurialMark=false;if(t.direct.curse)t.curseJudgmentMark=false;
}
const dawnHeavyUses=new WeakMap();
function dawnHeavyUsed(enemy,unit){return !!dawnHeavyUses.get(enemy)?.has(unit);}
function synergyTargetDefense(enemy,stats){return Math.max(0,enemy.def||0)*(1-Math.min(10,stats.curseDefense||0)/100)*(1-Math.min(20,stats.dawnPierce||0)/100);}
function synergyHeavyDamage(damage,stats,enemy,unit){
 let multiplier=1+(stats.iceHeavy||0)/100;
 if(stats.dawnHeavy&&!dawnHeavyUsed(enemy,unit)){
  let actors=dawnHeavyUses.get(enemy);if(!actors){actors=new WeakSet();dawnHeavyUses.set(enemy,actors);}actors.add(unit);multiplier*=1+stats.dawnHeavy/100;
 }
 return Math.max(1,Math.round(damage*multiplier*(1+(stats.dawnDamage||0)/100)*(1+(stats.curseDamage||0)/100)));
}
function synergyDirectDamage(damage,stats){return Math.max(1,Math.round(damage*(1+(stats.dawnDamage||0)/100)*(1+(stats.curseDamage||0)/100)));}
function synergyMemory(enemy,unit,create=false){
 if(!enemy||!unit)return {};
 let actors=synergyMemories.get(enemy);if(!actors&&create){actors=new WeakMap();synergyMemories.set(enemy,actors);}
 if(!actors)return {};
 const slots=unit===state?state.equipped:state.chapter?.equipment?.[unit.id],signature=Object.entries(slots||{}).map(([k,i])=>k+':'+(i?.id||'')+':'+(i?.key||'')).join('|');
 let memory=actors.get(unit);if(memory?.signature!==signature)memory=null;if(!memory&&create){memory={signature};actors.set(unit,memory);}
 return memory||{};
}
function rememberSynergyStatuses(enemy,slots,before){
 const unit=synergyUnit(slots);if(!unit)return;
 const m=synergyMemory(enemy,unit,true);
 const t=temporarySynergy(enemy,unit,slots),active=completedBuildState(slots).filter(b=>b.active).map(b=>b.id);
 for(const tag of ['bleed','freeze','shock','curse'])if((enemy.buildStatuses?.[tag]||0)>(before[tag]||0)){
  m[tag]=enemy.synergyRound||0;if(tag==='freeze'||tag==='shock')m[tag+'Ready']=true;
  if(tag==='freeze'&&active.includes('iceTomb'))t.iceBurialMark=true;
  if(tag==='curse'&&active.includes('hexJudge'))t.curseJudgmentMark=true;
 }
}
function synergyUnit(slots){
 if(slots===state.equipped)return state;
 const id=Object.keys(state.chapter?.equipment||{}).find(id=>state.chapter.equipment[id]===slots);
 return id?state.companionBattle?.[id]||null:null;
}
function synergyContext(slots,options={}){
 const unit=options.unit||synergyUnit(slots),runtime=options.runtime||unit?.buildRuntime||{hits:0,hurt:0,charge:0,shield:0,kills:0};
 return {slots,unit,runtime,enemy:options.enemy||state.currentEnemy||{},hp:options.hp??unit?.hp??1,maxHp:options.maxHp||options.stats?.maxHp||1,action:options.action||'attack',...options};
}
function synergyCondition(rule,c){
 const e=c.enemy||{},s=e.buildStatuses||{},r=c.runtime||{},ratio=c.hp/Math.max(1,c.maxHp),turn=e.turnCount||0,n=rule.strict?3:1;
 const statuses=Object.values(s).filter(v=>v>0).length+(e.gearPoison>0?1:0);
 const memory=synergyMemory(e,c.unit),recent=tag=>memory[tag]!=null&&(e.synergyRound||0)-memory[tag]<=1;
 const temporary=temporarySynergy(e,c.unit,c.slots);
 switch(rule.condition){
  case 'iceCritical':return ['attack','skill'].includes(c.action)&&!!temporary.iceBurialMark;
  case 'iceHeavy':return c.action==='heavy'&&!!temporary.iceBurialMark;
  case 'iceMarkCrit':return !!temporary.direct?.ice&&!!c.crit;
  case 'curseMark':return ['attack','skill','heavy'].includes(c.action)&&!!temporary.curseJudgmentMark;
  case 'curseThree':return s.curse>=3;
  case 'dawnOpening':return (temporary.actions||0)<2;
  case 'dawnHeavy':return c.action==='heavy'&&(temporary.actions||0)<2&&!dawnHeavyUsed(e,c.unit);
  case 'bleedRecent':return s.bleed>0||recent('bleed');case 'curseRecent':return s.curse>0||recent('curse');
  case 'freezeRemembered':return s.freeze>0||!!memory.freezeReady;case 'shockRemembered':return s.shock>0||!!memory.shockReady;
  case 'always':return true;case 'low':return ratio<=(rule.strict?.25:.5);case 'high':return ratio>=(rule.strict?1:.9);
  case 'bleed':return (s.bleed||0)>=n;case 'poison':return e.gearPoison>0;case 'fire':return (s.fire||0)>=n;case 'freeze':return s.freeze>0;case 'shock':return s.shock>0;case 'curse':return (s.curse||0)>=n;
  case 'critical':return !!c.crit;case 'third':return r.hits>0&&r.hits%3===0;case 'second':return r.hits>0&&r.hits%2===0;case 'fourth':return r.hits>0&&r.hits%4===0;
  case 'heavyThird':return c.action==='heavy'&&r.hits%3===0;case 'firstIncoming':return !r.synergyShieldGranted;
  case 'guard':return !!c.guard;case 'just':return c.guard&&['heavy','critical_smash'].includes(e.actionType);case 'charged':return r.charge>0;
  case 'heavy':return c.action==='heavy';case 'normal':return c.action==='attack';case 'skill':return c.action==='skill';
  case 'boss':return !!e.isBoss;case 'mob':return !e.isBoss;case 'status':return statuses>0;case 'multipleStatuses':return statuses>=(rule.strict?3:2);
  case 'long':return turn>=(rule.strict?6:4);case 'opening':return turn<2;case 'full':return c.overflow>0;
  case 'hurt':return r.hurt>0;case 'unhurt':return r.hurt===0;case 'armored':return (e.def||0)>=(c.stats?.atk||1)*.25;
  case 'deep':return state.floor>=61;case 'abyssal':return state.floor>=500;case 'broken':return !!e.buildBroken;
  case 'deepBoss':return state.floor>=61&&e.isBoss;case 'poisonLong':return e.gearPoison>0&&turn>=4;case 'frozenCrit':return s.freeze>0&&c.crit;
  case 'maxStatus':return r.hits>0&&r.hits%3===0&&(rule.primary==='poison'?e.gearPoison>=3:(s[rule.primary]||0)>=5);
  default:return false;
 }
}
function evaluateSynergies(slots,trigger,options={}){
 const c=synergyContext(slots,options),rules=[];
 for(const item of Object.values(slots).filter(Boolean)){const spec=itemSynergy(item);if(spec)for(const rule of spec.rules)rules.push({...rule,origin:spec.id});}
 for(const build of completedBuildState(slots).filter(b=>b.active))for(const rule of build.rules)rules.push({...rule,origin:build.id,completedName:build.name});
 const matched=rules.filter(r=>r.trigger===trigger&&synergyCondition(r,c)),values={};
 for(const rule of matched)values[rule.stat]=Math.min(SYNERGY_LIMITS[rule.stat]||0,(values[rule.stat]||0)+rule.value);
 return {values,matched,context:c,trigger};
}
function synergyNotice(result,text){
 const c=result.context;if(c.preview||!c.unit||state.screen!=='battle')return;
 const names=[...new Set(result.matched.filter(r=>r.completedName).map(r=>r.completedName))];if(!names.length)return;
 const r=buildRuntime(c.unit),turn=c.enemy.turnCount||0;if(r.synergyLogTurn!==turn){r.synergyLogTurn=turn;r.synergyLogCount=0;}
 if(r.synergyLogCount>=2)return;r.synergyLogCount++;
 addLog(`[${c.unit===state?'主人公':CHARACTER_DATA[c.unit.id]?.name||c.unit.id}／${names.slice(0,2).join('・')}] ${text}`,'gold');
}
function syncSynergyRuntime(unit,slots){
 const runtime=buildRuntime(unit),key=Object.entries(slots).map(([slot,i])=>slot+':'+(i?.id||'')+':'+(i?.key||'')).join('|');
 if(runtime.synergyLoadout!==key){runtime.synergyLoadout=key;runtime.synergyNext=0;runtime.synergyCarry=0;}
 return runtime;
}
function synergyNextPower(result){const {unit}=result.context;if(!unit||!result.values.nextPower)return;const r=syncSynergyRuntime(unit,result.context.slots);r.synergyNext=Math.max(r.synergyNext||0,result.values.nextPower);if(result.trigger==='kill')r.synergyCarry=result.values.nextPower;synergyNotice(result,`次攻撃補助を予約（上限内で適用時に確定）`);}
function synergyHit(enemy,action,crit,slots,unit,stats,hitStatuses=null){
 const r=syncSynergyRuntime(unit,slots);if(r.synergyResolving)return;
 r.synergyResolving=true;
 try{
  const result=evaluateSynergies(slots,'hit',{enemy,action,crit,unit,stats,hp:unit.hp}),v=result.values;
  temporarySynergy(enemy,unit,slots).direct=null;
  synergyMemory(enemy,unit).shockReady=false;
  const statusBefore=JSON.stringify([enemy.gearPoison,enemy.buildStatuses,enemy.def]);
  synergyNextPower(result);
  if(v.poisonExtend&&enemy.gearPoison>0)enemy.gearPoison=Math.min(5+synergyStatusCap(slots,'poison'),enemy.gearPoison+v.poisonExtend);
  enemy.buildStatuses ||= {};
  const addStatus=(tag,n)=>{const before=enemy.buildStatuses[tag]||0,cap=5+synergyStatusCap(slots,tag)+(tag==='bleed'?Math.min(5,equipmentEffects(slots).bleedCap||0):0);enemy.buildStatuses[tag]=Math.max(before,Math.min(cap,before+n));};
  if(v.fire)addStatus('fire',v.fire);
  if(v.statusAdvance){const tag=[...buildTags(slots)].find(t=>['bleed','fire','freeze','shock','curse'].includes(t));if(tag)addStatus(tag,v.statusAdvance);else if(buildTags(slots).has('poison'))enemy.gearPoison=Math.min(5+synergyStatusCap(slots,'poison'),(enemy.gearPoison||0)+1);}
  if(v.missingStatus){const tag=['bleed','fire','freeze','shock','curse','poison'].find(t=>t==='poison'?!enemy.gearPoison:!enemy.buildStatuses[t]);if(tag==='poison')enemy.gearPoison=1;else if(tag)addStatus(tag,1);}
  if(v.defDown)enemy.def=Math.max(0,enemy.def-v.defDown);
  const direct=Math.min(35,(v.extra||0)+(v.summon||0)),damage=Math.min(Math.max(0,enemy.hp),Math.max(0,Math.round(stats.atk*direct/100)));
  if(damage){enemy.hp-=damage;combatApplied(unit===state?'player':unit.id,'enemy',-damage,v.summon?'シナジー分身':'シナジー追撃');synergyNotice(result,`追加 ${damage}`);}
  if(v.follow&&enemy.hp>0){enemy.pendingBuildFollowUps ||= [];enemy.pendingBuildFollowUps.push({actor:unit===state?'player':unit.id,damage:Math.max(1,Math.round(stats.atk*v.follow/100)),synergyNames:[...new Set(result.matched.filter(r=>r.stat==='follow'&&r.completedName).map(r=>r.completedName))].slice(0,2)});}
  if(damage)for(const primary of new Set(result.matched.filter(r=>r.consumeStatus).map(r=>r.primary))){if(primary==='poison')enemy.gearPoison=Math.max(0,enemy.gearPoison-1);else enemy.buildStatuses[primary]=Math.max(0,(enemy.buildStatuses[primary]||0)-2);}
  if(statusBefore!==JSON.stringify([enemy.gearPoison,enemy.buildStatuses,enemy.def]))synergyNotice(result,'状態蓄積・弱体化補助');
 }finally{r.synergyResolving=false;}
}
function synergyDodge(slots,unit,stats,enemy){synergyNextPower(evaluateSynergies(slots,'dodge',{unit,stats,enemy,hp:unit.hp}));}
function synergyStatusCap(slots,tag){
 const result=evaluateSynergies(slots,'effects');return Math.min(2,result.matched.filter(r=>r.stat==='statusCap'&&r.primary===tag).reduce((n,r)=>n+r.value,0));
}
