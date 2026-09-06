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
function resetBattleBuilds(){clearTemporarySynergies();for(const unit of [state,...Object.values(state.companionBattle||{})]){const old=unit.buildRuntime||{},kills=old.kills||0;unit.buildRuntime={hits:0,hurt:0,kills,shield:0,charge:0,synergyNext:old.synergyCarry||0,synergyCarry:old.synergyCarry||0,synergyLoadout:old.synergyLoadout};}}
function buildConditions(stats,enemy,action,hp,runtime){
 const active=enemy.gearPoison>0||Object.values(enemy.buildStatuses||{}).some(v=>v>0);
 return {singleStrike:action==='heavy'&&runtime.hits%3===0,lowHp:hp<stats.maxHp*.35,highHp:hp>=stats.maxHp*.9,normalAttack:action==='attack',heavyAttack:action==='heavy',skillPower:action==='skill',onKill:runtime.kills>0,longFight:(enemy.turnCount||0)>=4,burst:(enemy.turnCount||0)<2,onHurt:runtime.hurt>0,unhurt:runtime.hurt===0,boss:!!enemy.isBoss,mob:!enemy.isBoss,statusHunter:!!active,deep:state.floor>=61,abyssal:state.floor>=500,counter:runtime.charge>0};
}
function buildAttack(stats,enemy,action,slots,hp,previewRuntime=null){
 const tags=buildTags(slots),unit=previewRuntime?{}:synergyUnit(slots);if(!unit)return;
 const runtime=previewRuntime||buildRuntime(unit),statuses=enemy.buildStatuses||{};
 const conditions=buildConditions(stats,enemy,action,hp,runtime);
 const activeTags=[...tags].filter(t=>conditions[t]);
 const newlyActive=activeTags.filter(t=>!(runtime.activeTags||[]).includes(t));runtime.activeTags=activeTags;
 if(!previewRuntime&&state.screen==='battle'&&action!=='defend'&&newlyActive.length)addLog(`[${unit===state?'主人公':CHARACTER_DATA[unit.id]?.name||unit.id}] ${newlyActive.slice(0,3).map(t=>BUILD_CATALOG[t]).join('・')} 発動`,'gold');
 let bonus=0;for(const [tag,condition]of Object.entries(conditions))if(tags.has(tag)&&condition)bonus+=tag==='singleStrike'?(runtime.hits%3===0?.5:0):tag==='normalAttack'||tag==='heavyAttack'?.3:.2;
 if(tags.has('crit'))stats.crit+=15;
 if(statuses.bleed>0)stats.crit+=equipmentEffects(slots).bleedCrit||0;
 if(statuses.freeze>0&&tags.has('crit'))stats.crit+=15;
 if(statuses.shock>0)bonus+=.1;
 if(tags.has('pierce'))stats.atk+=Math.round(enemy.def*.35);
 if(tags.has('shield')&&tags.has('highHp')&&hp>=stats.maxHp)bonus+=.15;
 if(tags.has('statusHunter')&&statuses.curse>0)bonus+=Math.min(.3,statuses.curse*.05);
 if(tags.has('poison')&&tags.has('longFight')&&enemy.gearPoison)bonus+=Math.min(.4,enemy.turnCount*.04);
 const synergy=evaluateSynergies(slots,'attack',{enemy,action,hp,stats,runtime,unit,preview:!!previewRuntime});
 const nativeBonus=bonus;
 stats.iceHeavy=synergy.values.iceHeavy||0;stats.dawnHeavy=synergy.values.dawnHeavy||0;
 stats.dawnPierce=synergy.values.dawnPierce||0;stats.curseDefense=synergy.values.curseDefense||0;
 stats.dawnDamage=synergy.values.dawnDamage||0;stats.curseDamage=synergy.values.curseDamage||0;
 stats.synergySkillCrit=action==='skill'&&synergy.matched.some(r=>['iceTomb','firstLight'].includes(r.origin)&&r.stat==='crit');
 if(!previewRuntime)beginTemporarySynergyAttack(enemy,unit,slots,action);
 bonus+=(synergy.values.power||0)/100;
 stats.crit+=synergy.values.crit||0;stats.atk+=Math.round((enemy.def||0)*(synergy.values.pierce||0)/100);
 if(!previewRuntime)syncSynergyRuntime(unit,slots);
 if(action!=='defend'){const applied=Math.min(Math.max(0,100-bonus*100),25,Math.max(0,35-(synergy.values.power||0)),runtime.synergyNext||0);bonus+=applied/100;if(!previewRuntime&&runtime.synergyNext&&state.screen==='battle')addLog(`[${unit===state?'主人公':unit.id}] 次攻撃補助 実適用 +${Math.round(applied*10)/10}%`,'gold');runtime.synergyNext=0;runtime.synergyCarry=0;if(!previewRuntime)synergyMemory(enemy,unit).freezeReady=false;}
 if(synergy.values.crit||synergy.values.pierce||Math.min(1,bonus)>Math.min(1,nativeBonus))synergyNotice(synergy,'条件付き攻撃補助');
 if(action!=='defend')runtime.charge=0;
 stats.atk=Math.round(stats.atk*(1+Math.min(1,bonus)));
}
function buildHit(enemy,action,crit,slots){
 const tags=buildTags(slots),unit=synergyUnit(slots);if(!unit)return;
 const statusBefore={...enemy.buildStatuses};
 const runtime=buildRuntime(unit);runtime.hits++;enemy.buildStatuses ||= {};
 const chance=tags.has('status')?.55:.3,effects=equipmentEffects(slots);
 for(const tag of ['bleed','fire','freeze','shock','curse'])if(tags.has(tag)&&Math.random()<chance)enemy.buildStatuses[tag]=Math.max(enemy.buildStatuses[tag]||0,Math.min((tag==='bleed'?5+Math.min(5,effects.bleedCap||0):5)+synergyStatusCap(slots,tag),(enemy.buildStatuses[tag]||0)+1+(tag==='bleed'?Math.min(2,effects.bleedStacks||0):0)));
 if((tags.has('poison')||tags.has('status'))&&Math.random()<chance)enemy.gearPoison=3;
 if(tags.has('defDown'))enemy.def=Math.max(0,enemy.def-1);
 if(tags.has('break')&&action==='heavy'){enemy.def=Math.max(0,enemy.def-3);if(typeof ensureEnemyParts!=='function')enemy.buildBroken=true;}
 const stats=slots===state.equipped?getPlayerStats():companionStats(unit.id);
 const triggers={multiHit:runtime.hits%3===0,speed:runtime.hits%2===0,extraAttack:Math.random()<Math.min(.65,(enemy.buildStatuses.shock?.45:.25)+(effects.extraChance||0)/100),summon:runtime.hits%4===0};
 for(const [tag,trigger]of Object.entries(triggers))if(tags.has(tag)&&trigger){const damage=Math.max(1,Math.round(stats.atk*(tag==='summon'?.35*(1+Math.min(100,(effects.summonPower||0)+(tags.has('skillPower')?20:0))/100):tag==='speed'?.1:.2)));enemy.hp-=damage;const label=tag==='summon'?'影の分身 SUMMON':tag==='extraAttack'?'ADDITIONAL 追加攻撃':BUILD_CATALOG[tag];combatApplied(slots===state.equipped?'player':unit.id,'enemy',-damage,label);addLog(`${label}！ ${damage}ダメージ`,'gold');if(tag==='extraAttack'&&tags.has('status')&&Math.random()<chance)enemy.gearPoison=3;}
 if(tags.has('followUp')&&(enemy.gearPoison||Object.values(enemy.buildStatuses).some(n=>n>0))){enemy.pendingBuildFollowUps ||= [];enemy.pendingBuildFollowUps.push({actor:slots===state.equipped?'player':unit.id,damage:Math.max(1,Math.round(stats.atk*.2))});}
 if(tags.has('conversion')&&enemy.buildStatuses.fire>0){const spent=completedBuildState(slots).some(b=>b.id==='alchemist'&&b.active)?1:enemy.buildStatuses.fire;enemy.buildStatuses.shock=Math.min(5,(enemy.buildStatuses.shock||0)+spent);enemy.buildStatuses.fire-=spent;}
 if(tags.has('hybrid')){const count=Object.values(enemy.buildStatuses).filter(n=>n>0).length,damage=Math.max(1,Math.round(stats.atk*.05*Math.min(3,count+1)));enemy.hp-=damage;combatApplied(slots===state.equipped?'player':unit.id,'enemy',-damage,'HYBRID 属性複合');}
 synergyHit(enemy,action,crit,slots,unit,stats,statusBefore);
 rememberSynergyStatuses(enemy,slots,statusBefore);
}
function buildStatusTick(enemy){
 const pending=enemy.pendingBuildFollowUps||[];enemy.pendingBuildFollowUps=[];
 for(const hit of pending){if(enemy.hp<=0)break;enemy.hp-=hit.damage;combatApplied(hit.actor,'enemy',-hit.damage,'FOLLOW-UP 敵行動前追撃');addLog(`${hit.synergyNames?.length?'['+hit.synergyNames.join('・')+'] ':''}${hit.actor==='player'?'主人公':CHARACTER_DATA[hit.actor]?.name||hit.actor}：FOLLOW-UP 敵行動前追撃 ${hit.damage}`,'gold');}
 const s=enemy.buildStatuses;if(!s)return;
 for(const tag of Object.keys(s)){
  if(s[tag]<=0)continue;
  if(tag==='bleed'||tag==='fire'){const damage=Math.max(1,Math.min(40,Math.round(enemy.maxHp*.005*s[tag])));enemy.hp-=damage;combatApplied('status','enemy',-damage,tag==='bleed'?'BLEED':'BURN');addLog(`${BUILD_CATALOG[tag]} ${damage}ダメージ`,'danger');}
  if(tag==='freeze'&&Math.random()<(enemy.isBoss?.1:.25))enemy.stunned=true;
  s[tag]--;
 }
}
function buildLifestealValues(unit,stats,enemy,slots,crit=false){
 const tags=buildTags(slots),effects=equipmentEffects(slots);
 let rate=(stats.vamp||0)+(effects.lifestealRate||0)+(tags.has('lifesteal')?4:0);
 if(tags.has('lowHp')&&unit.hp<stats.maxHp*.5)rate+=5;
 if(crit&&tags.has('crit'))rate*=1.2;
 if(enemy.buildStatuses?.bleed>0&&tags.has('lifesteal'))rate*=1.25;
 if(enemy.buildStatuses?.bleed>0)rate+=effects.bleedLeech||0;
 rate+=evaluateSynergies(slots,'leech',{unit,stats,enemy,crit,hp:unit.hp}).values.leech||0;
 const conditional=rate;rate=Math.min(25,rate)*(enemy.isBoss?.5:1);
 const resistance=Math.max(0,1-(enemy.healingSuppression||0)-(enemy.isBoss?(enemy.turnCount||0)/30:0));
 return {base:tags.has('lifesteal')?4:0,equipment:(stats.vamp||0)+(effects.lifestealRate||0),conditional,rate,resistance,cap:25};
}
function healFromWeaponDamage(unit,stats,enemy,damage,slots,crit=false){
 const tags=buildTags(slots),runtime=buildRuntime(unit),{rate,resistance}=buildLifestealValues(unit,stats,enemy,slots,crit);
 const heal=Math.floor(Math.min(Math.max(0,damage)*rate/100,stats.maxHp*.08)*resistance);
 const applied=Math.min(Math.max(0,stats.maxHp-unit.hp),heal);unit.hp+=applied;
 const synergy=evaluateSynergies(slots,'heal',{unit,stats,enemy,hp:unit.hp,overflow:heal-applied});
 synergyNextPower(synergy);
 if(tags.has('overheal')||synergy.values.overflow){const beforeShield=runtime.shield;runtime.shield=Math.min(Math.round(stats.maxHp*.15),runtime.shield+Math.floor((heal-applied)*(tags.has('overheal')?1:synergy.values.overflow/100)));if(runtime.shield>beforeShield){combatEmit(unit===state?'player':unit.id,unit===state?'player':unit.id,runtime.shield-beforeShield,'SHIELD','shield');synergyNotice(synergy,`余剰障壁 +${runtime.shield-beforeShield}`);}}
 if(applied)synergyNotice(evaluateSynergies(slots,'leech',{unit,stats,enemy,hp:unit.hp-applied}),`吸血 +${applied}HP`);
 if(applied)addLog(`吸血回復 +${applied}HP`,'heal');return applied;
}
function buildIncomingDamage(damage,enemy,slots,unit,maxHp,guard=false){
 const tags=buildTags(slots),r=buildRuntime(unit);
 const synergy=evaluateSynergies(slots,'incoming',{enemy,unit,maxHp,hp:unit.hp,guard});
 damage=Math.round(damage*(1-(synergy.values.reduction||0)/100));
 synergyNextPower(synergy);
 if(synergy.values.reduction||synergy.values.shield)synergyNotice(synergy,'防御・障壁補助');
 if(enemy.buildStatuses?.curse>0)damage=Math.round(damage*(1-Math.min(.15,enemy.buildStatuses.curse*.03)));
 if(tags.has('shield')&&!r.shieldGranted){r.shieldGranted=true;const beforeShield=r.shield;r.shield=Math.max(r.shield,Math.round(maxHp*.05));if(r.shield>beforeShield)combatEmit(unit===state?'player':unit.id,unit===state?'player':unit.id,r.shield-beforeShield,'SHIELD','shield');}
 if(synergy.values.shield&&!r.synergyShieldGranted){r.synergyShieldGranted=true;const beforeShield=r.shield;r.shield=Math.min(Math.round(maxHp*.15),r.shield+Math.round(maxHp*synergy.values.shield/100));const applied=r.shield-beforeShield;if(applied)combatEmit(unit===state?'player':unit.id,unit===state?'player':unit.id,applied,'SHIELD 初回障壁（実適用）','shield');}
 const absorbed=Math.min(r.shield,damage);r.shield-=absorbed;damage-=absorbed;
 if(tags.has('safe'))damage=Math.round(damage*.95);
 if(tags.has('guard')&&guard)damage=Math.round(damage*.9);
 if(guard&&(tags.has('counter')||tags.has('justGuard')&&['heavy','critical_smash'].includes(enemy.actionType)))r.charge=1;
 if(tags.has('reflect')){const before=enemy.hp,result=evaluateSynergies(slots,'reflect',{unit,enemy,maxHp,hp:unit.hp});enemy.hp=Math.max(1,enemy.hp-Math.min(20,Math.round(damage*(.15+(result.values.reflect||0)/100))));if(before>enemy.hp){addLog(`[反射] ${before-enemy.hp}ダメージ`,'gold');synergyNotice(result,`反射 ${before-enemy.hp}`);}}
 if(damage>0)r.hurt++;return Math.max(0,damage);
}
function buildKill(unit,slots,maxHp){const r=buildRuntime(unit);r.kills++;if(buildTags(slots).has('onKill'))unit.hp=Math.min(maxHp,unit.hp+Math.ceil(maxHp*.03));const result=evaluateSynergies(slots,'kill',{unit,maxHp,hp:unit.hp});if(unit.hp>0&&result.values.heal){const before=unit.hp;unit.hp=Math.min(maxHp,unit.hp+Math.floor(maxHp*result.values.heal/100));if(unit.hp>before)synergyNotice(result,`撃破回復 +${unit.hp-before}`);}synergyNextPower(result);}
