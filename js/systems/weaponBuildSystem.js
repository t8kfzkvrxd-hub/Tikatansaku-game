function buildTags(slots){
 const tags=new Set(),aliases={blood:'lifesteal',desperate:'lowHp',skill:'skillPower',thunder:'shock'};
 for(const item of Object.values(slots).filter(Boolean)){
  for(const raw of [item.primaryBuildTag,...(item.secondaryBuildTags||[]),...(item.tags||[]),item.setTag]){const tag=aliases[raw]||raw;if(BUILD_CATALOG[tag])tags.add(tag);}
  if(item.vamp)tags.add('lifesteal');if(item.crit)tags.add('crit');if(item.isCurse)tags.add('curse');
  const mapping={poisonChance:'poison',poisonBonus:'poison',fireDamage:'fire',critDamage:'crit',lowHpPower:'lowHp',guardHeal:'guard',justAttack:'justGuard',dodge:'dodge',breakPower:'break',materialChance:'farming'};
  for(const [key,tag]of Object.entries(mapping))if(item.effects?.[key])tags.add(tag);
 }
 return tags;
}
function buildRuntime(unit){return unit.buildRuntime ||= {hits:0,hurt:0,kills:0,shield:0,charge:0};}
function buildAttack(stats,enemy,action,slots,hp){
 const tags=buildTags(slots),unit=slots===state.equipped?state:companionCombatUnit();if(!unit)return;
 const runtime=buildRuntime(unit),statuses=enemy.buildStatuses||{},active=Object.values(statuses).filter(v=>v>0).length;
 const conditions={singleStrike:action==='heavy',lowHp:hp<stats.maxHp*.35,highHp:hp>=stats.maxHp*.9,normalAttack:action==='attack',heavyAttack:action==='heavy',skillPower:action==='skill',onKill:runtime.kills>0,longFight:enemy.turnCount>=4,burst:(enemy.turnCount||0)<2,onHurt:runtime.hurt>0,unhurt:runtime.hurt===0,boss:enemy.isBoss,mob:!enemy.isBoss,statusHunter:active>0,deep:state.floor>=61,abyssal:state.floor>=500,counter:runtime.charge>0};
 let bonus=0;for(const [tag,condition]of Object.entries(conditions))if(tags.has(tag)&&condition)bonus+=tag==='singleStrike'?(runtime.hits%3===0?.5:0):tag==='normalAttack'||tag==='heavyAttack'?.3:.2;
 if(tags.has('crit'))stats.crit+=15;
 if(statuses.freeze>0&&tags.has('crit'))stats.crit+=15;
 if(statuses.shock>0)bonus+=.1;
 if(tags.has('pierce'))stats.atk+=Math.round(enemy.def*.35);
 if(tags.has('shield')&&tags.has('highHp')&&hp>=stats.maxHp)bonus+=.15;
 if(tags.has('statusHunter')&&statuses.curse>0)bonus+=Math.min(.3,statuses.curse*.05);
 if(action!=='defend')runtime.charge=0;
 if(tags.has('poison')&&tags.has('longFight')&&enemy.gearPoison)bonus+=Math.min(.4,enemy.turnCount*.04);
 stats.atk=Math.round(stats.atk*(1+Math.min(1,bonus)));
}
function buildHit(enemy,action,crit,slots){
 const tags=buildTags(slots),unit=slots===state.equipped?state:companionCombatUnit();if(!unit)return;
 const runtime=buildRuntime(unit);runtime.hits++;enemy.buildStatuses ||= {};
 const chance=tags.has('status')?.55:.3;
 for(const tag of ['bleed','fire','freeze','shock','curse'])if(tags.has(tag)&&Math.random()<chance)enemy.buildStatuses[tag]=Math.min(5,(enemy.buildStatuses[tag]||0)+1);
 if((tags.has('poison')||tags.has('status'))&&Math.random()<chance)enemy.gearPoison=3;
 if(tags.has('defDown'))enemy.def=Math.max(0,enemy.def-1);
 if(tags.has('break')&&action==='heavy'){enemy.def=Math.max(0,enemy.def-3);enemy.buildBroken=true;}
 const stats=slots===state.equipped?getPlayerStats():companionStats(unit.id);
 const triggers={multiHit:runtime.hits%3===0,speed:runtime.hits%2===0,extraAttack:Math.random()<(enemy.buildStatuses.shock?.45:.25),followUp:Object.values(enemy.buildStatuses).some(n=>n>0),summon:runtime.hits%4===0};
 for(const [tag,trigger]of Object.entries(triggers))if(tags.has(tag)&&trigger){const damage=Math.max(1,Math.round(stats.atk*(tag==='summon'?.35:tag==='speed'?.1:.2)));enemy.hp-=damage;addLog(`${BUILD_CATALOG[tag]}：追撃 ${damage}`,'gold');}
 if(tags.has('conversion')){enemy.buildStatuses.shock=Math.min(5,(enemy.buildStatuses.shock||0)+(enemy.buildStatuses.fire||1));enemy.buildStatuses.fire=0;}
 if(tags.has('hybrid')){const count=Object.values(enemy.buildStatuses).filter(n=>n>0).length;enemy.hp-=Math.max(1,Math.round(stats.atk*.05*Math.min(3,count+1)));}
}
function buildStatusTick(enemy){
 const s=enemy.buildStatuses;if(!s)return;
 for(const tag of Object.keys(s)){
  if(s[tag]<=0)continue;
  if(tag==='bleed'||tag==='fire'){const damage=Math.max(1,Math.min(40,Math.round(enemy.maxHp*.005*s[tag])));enemy.hp-=damage;addLog(`${BUILD_CATALOG[tag]} ${damage}ダメージ`,'danger');}
  if(tag==='freeze'&&Math.random()<(enemy.isBoss?.1:.25))enemy.stunned=true;
  s[tag]--;
 }
}
function healFromWeaponDamage(unit,stats,enemy,damage,slots,crit=false){
 const tags=buildTags(slots),effects=equipmentEffects(slots),runtime=buildRuntime(unit);
 let rate=(stats.vamp||0)+(effects.lifestealRate||0)+(tags.has('lifesteal')?4:0);
 if(tags.has('lowHp')&&unit.hp<stats.maxHp*.5)rate+=5;
 if(crit&&tags.has('crit'))rate*=1.2;
 if(enemy.buildStatuses?.bleed>0&&tags.has('lifesteal'))rate*=1.25;
 rate=Math.min(25,rate)*(enemy.isBoss?.5:1);
 const resistance=Math.max(0,1-(enemy.healingSuppression||0)-(enemy.isBoss?(enemy.turnCount||0)/30:0));
 const heal=Math.floor(Math.min(Math.max(0,damage)*rate/100,stats.maxHp*.08)*resistance);
 const applied=Math.min(Math.max(0,stats.maxHp-unit.hp),heal);unit.hp+=applied;
 if(tags.has('overheal'))runtime.shield=Math.min(Math.round(stats.maxHp*.15),runtime.shield+heal-applied);
 if(applied)addLog(`吸血回復 +${applied}HP`,'heal');return applied;
}
function buildIncomingDamage(damage,enemy,slots,unit,maxHp,guard=false){
 const tags=buildTags(slots),r=buildRuntime(unit);
 if(enemy.buildStatuses?.curse>0)damage=Math.round(damage*(1-Math.min(.15,enemy.buildStatuses.curse*.03)));
 if(tags.has('shield')&&!r.shieldGranted){r.shieldGranted=true;r.shield=Math.max(r.shield,Math.round(maxHp*.05));}
 const absorbed=Math.min(r.shield,damage);r.shield-=absorbed;damage-=absorbed;
 if(tags.has('safe'))damage=Math.round(damage*.95);
 if(tags.has('guard')&&guard)damage=Math.round(damage*.9);
 if(guard&&(tags.has('counter')||tags.has('justGuard')&&['heavy','critical_smash'].includes(enemy.actionType)))r.charge=1;
 if(tags.has('reflect'))enemy.hp=Math.max(1,enemy.hp-Math.min(20,Math.round(damage*.15)));
 if(damage>0)r.hurt++;return Math.max(0,damage);
}
function buildKill(unit,slots,maxHp){const r=buildRuntime(unit);r.kills++;if(buildTags(slots).has('onKill'))unit.hp=Math.min(maxHp,unit.hp+Math.ceil(maxHp*.03));}
