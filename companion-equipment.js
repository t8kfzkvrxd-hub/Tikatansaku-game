function emptyEquipmentSlots(){return Object.fromEntries(EQUIPMENT_SLOTS.map(s=>[s.k,null]));}
function migrateCompanionEquipment(){
 const c=state.chapter;c.equipment ||= {};
 c.characters ||= {};
 for(const id of Object.keys(c.owned))characterProgress(id);
 const used=new Set(Object.values(state.equipped).filter(Boolean).map(i=>i.id));
 for(const id of new Set([...Object.keys(c.owned),...Object.keys(c.equipment)])){
  const next=emptyEquipmentSlots();
  for(const [slot,item] of Object.entries(c.equipment[id]||{})){
   if(!item)continue;normalizeEquipment(item);
   if(used.has(item.id))continue;
   const target=slot==='accessory2'&&item.type==='accessory'?slot:equipmentSlot(item);
   if(target in next&&!next[target]){next[target]=item;used.add(item.id);}
   else if(!state.storage.some(i=>i.id===item.id))state.storage.push(item);
  }
  c.equipment[id]=next;
 }
 state.storage=state.storage.filter(i=>!used.has(i.id));
 state.inventory=state.inventory.filter(i=>!used.has(i.id));
}
function equipmentOwner(item){
 if(!item)return null;
 const same=i=>i&&(i===item||(i.id&&i.id===item.id));
 if(Object.values(state.equipped).some(same))return 'player';
 for(const [id,slots]of Object.entries(state.chapter?.equipment||{}))if(Object.values(slots).some(same))return id;
 return null;
}
function characterEquipment(id='player'){
 if(id==='player')return state.equipped;
 if(!state.chapter?.owned[id])return null;
 state.chapter.equipment ||= {};return state.chapter.equipment[id] ||= emptyEquipmentSlots();
}
function companionStats(id='elna'){
 const slots=characterEquipment(id)||{},s={atk:36,def:0,maxHp:210,crit:5,vamp:0,effects:{}};
 const growth=characterGrowthStats(id);s.atk+=growth.atk;s.def+=growth.def;s.maxHp+=growth.hp;
 for(const it of Object.values(slots).filter(Boolean)){
  s.atk+=Number(it.baseAtk)||0;s.def+=Number(it.baseDef)||0;s.maxHp+=Number(it.hp)||0;s.crit+=Number(it.crit)||0;s.vamp+=Number(it.vamp)||0;
  if(it.affix==='critical')s.crit+=8;if(it.affix==='lifesteal')s.vamp+=3;if(it.affix==='max_hp')s.maxHp+=25;
  for(const [key,n]of Object.entries(it.effects||{}))s.effects[key]=(s.effects[key]||0)+n;
 }
 const syn=getSynergyBreakdown(slots),count=id=>syn.find(x=>x.id===id)?.count||0;
 if(count('syn_titan')>=2){s.def+=8;s.maxHp+=40;if(count('syn_titan')>=3){s.def+=14;s.maxHp+=60;}}
 if(count('syn_blood')>=2)s.vamp+=count('syn_blood')>=3?10:4;
 if(count('syn_curse')>=2){s.atk+=25;s.crit+=15;if(count('syn_curse')>=3){s.atk+=35;s.crit+=15;s.maxHp=Math.floor(s.maxHp*.85);}}
 const hp=state.companionBattle?.[id]?.hp??s.maxHp,items=Object.values(slots).filter(Boolean),curses=items.filter(i=>i.isCurse).length;
 s.atk+=curses*14;s.crit+=curses*8;
 if(count('syn_blood')>=1&&hp<=s.maxHp*.5){s.atk=Math.round(s.atk*1.35);s.vamp+=4;if(hp<=s.maxHp*.25){s.atk=Math.round(s.atk*1.35);s.vamp+=8;}}
 if(count('syn_gold')>=1&&state.floor>0){s.atk+=Math.floor(state.dungeonGold/100)*2;s.def+=Math.floor(state.dungeonGold/100);}
 if(items.some(i=>i.isBerserk)&&hp<=s.maxHp*.5)s.atk*=2;
 s.def+=items.filter(i=>i.affix==='low_hp_def'&&hp<=s.maxHp*.4).length*8;
 s.demeritDamage=Math.max(-40,items.reduce((n,i)=>n+(i.demeritDamageTaken||0)-(i.affix==='damage_reduction'?10:0),0));
 s.effects=equipmentEffects(slots);
 return s;
}
function characterProgress(id){
 state.chapter.characters ||= {};
 const p=state.chapter.characters[id] ||= {};
 p.level=Math.max(1,Math.min(100,Math.floor(Number(p.level)||1)));p.exp=Math.max(0,Math.floor(Number(p.exp)||0));
 p.training ||= {};p.affection ??= 0;p.costumes ||= [];p.selectedCostume ??= null;p.limitBreak ??= 0;
 return p;
}
function selectCompanion(id){
 if(state.screen!=='town'||id!==null&&!state.chapter.owned[id])return false;
 state.chapter.companion=id;saveState();render();return true;
}
function companionTurn(enemy){
 const id=state.chapter?.companion;
 if(!id||!state.chapter.owned[id]||state.chapter.pending||state.hp<=0||enemy.hp<=0)return;
 const unit=companionCombatUnit(),stats=companionStats(id),slots=characterEquipment(id),before=enemy.hp;
 if(!unit||unit.hp<=0)return false;
 unit.hp=Math.min(stats.maxHp,unit.hp+Object.values(slots).filter(Boolean).reduce((n,i)=>n+(i.turnRegen||0),0));
 unit.hp=Math.max(0,unit.hp-(unit.poison>0?5:0));unit.poison=Math.max(0,unit.poison-1);
 if(unit.hp<=0){addLog(`${CHARACTER_DATA[id]?.name||id}は毒で戦闘不能！`,'danger');return false;}
 let action=state.lastPlayerAction||'attack';
 if(!['attack','heavy','skill','defend'].includes(action))action='attack';
 unit.defending=action==='defend';
 unit.cooldown=Math.max(0,unit.cooldown-1);
 if(unit.defending){addLog(`${CHARACTER_DATA[id]?.name||id}は防御を構えた。`,'info');return false;}
 if(action==='skill'&&unit.cooldown>0)action='attack';
 if(action==='skill')unit.cooldown=Math.max(1,3-(stats.effects.skillHaste||0));
 equipmentAttackStats(stats,enemy,action,slots,unit.hp);
 const weapon=slots.weapon;
 if(weapon?.craftEffect==='elite_hunter'&&enemy.isElite)stats.atk*=2.5;
 if(weapon?.craftEffect==='desperate'&&unit.hp<=stats.maxHp*.35)stats.atk*=2;
 if(action==='heavy'&&weapon?.affix==='boss_slayer'&&enemy.isBoss)stats.atk*=1.25;
 if(action==='heavy'&&weapon?.affix==='elite_slayer'&&enemy.isElite)stats.atk*=1.3;
 const crit=Math.random()*100<Math.min(85,stats.crit);
 const damage=Math.max(1,Math.round(stats.atk*(action==='heavy'?1.5:action==='skill'?1.8:1)*(unit.attackBuff||1)*(crit?1.5+(stats.effects.critDamage||0)/100:1)-enemy.def));
 unit.attackBuff=1;enemy.hp-=damage;equipmentHit(enemy,action,crit,slots);applyRootProtection(enemy,before);
 healFromWeaponDamage(unit,stats,enemy,Math.max(0,before-Math.max(0,enemy.hp)),slots,crit);
 addLog(`${CHARACTER_DATA[id]?.name||id}の${action==='skill'?'スキル':action==='heavy'?'強攻撃':'通常攻撃'}！ ${Math.max(0,before-enemy.hp)}ダメージ。`,'gold');
 if(enemy.hp<=0){buildKill(unit,slots,stats.maxHp);if(enemy.gearPoison)unit.hp=Math.min(stats.maxHp,unit.hp+(stats.effects.poisonHeal||0));}
 if(enemy.hp<=0){enemy.hp=0;onEnemyKilled();return true;}
 return false;
}
function companionCombatUnit(){
 const id=state.chapter?.companion;if(!id||!state.chapter.owned[id]||state.chapter.pending)return null;
 state.companionBattle ||= {};
 return state.companionBattle[id] ||= {id,hp:companionStats(id).maxHp,poison:0,cooldown:0,attackBuff:1};
}
function companionReceiveAttack(enemy,attack){
 const unit=companionCombatUnit();if(!unit||unit.hp<=0)return false;
 const stats=companionStats(unit.id),e=stats.effects,slots=characterEquipment(unit.id),name=CHARACTER_DATA[unit.id]?.name||unit.id;
 if(Math.random()*100<Math.min(45,e.dodge||0)){unit.attackBuff=1+Math.min(150,e.dodgeAttack||0)/100;addLog(`${name}が回避！`,'gold');return true;}
 const just=unit.defending&&['heavy','critical_smash'].includes(enemy.actionType),guard=unit.defending&&enemy.actionType!=='grab_prep';
 const defense=stats.def;
 let damage=Math.max(1,Math.round((attack-defense)*(guard?(just?.2:.45):1)));
 damage=Math.max(1,Math.round(damage*(1+stats.demeritDamage/100)));
 damage=buildIncomingDamage(damage,enemy,slots,unit,stats.maxHp,guard);
 unit.hp=Math.max(0,unit.hp-damage);
 if(unit.hp>0&&guard){unit.hp=Math.min(stats.maxHp,unit.hp+(e.guardHeal||0));if(just)unit.attackBuff=1+Math.min(150,e.justAttack||0)/100;}
 if(['curse_poison','spore_poison'].includes(enemy.trait))unit.poison=2;
 addLog(`${enemy.name} → ${name}：${damage}ダメージ${unit.hp<=0?'・戦闘不能':''}`,'danger');
 return true;
}

function setCharacterEquipment(id,slot,itemId){
 const slots=characterEquipment(id);
 if(state.screen!=='town'||!slots||!EQUIPMENT_SLOTS.some(s=>s.k===slot))return false;
 const index=state.storage.findIndex(i=>i.id===itemId),item=state.storage[index];
 if(!item||equipmentOwner(item)||equipmentSlot(item)!==(slot==='accessory2'?'accessory':slot))return false;
 if(id==='player'){equipItem(index,true,slot);return true;}
 normalizeEquipment(item);const old=slots[slot];state.storage.splice(index,1);slots[slot]=item;if(old)state.storage.push(old);
 saveState();render();return true;
}
function removeCharacterEquipment(id,slot){
 const slots=characterEquipment(id);if(state.screen!=='town'||!slots?.[slot])return false;
 if(vaultUsed()>=state.camp.vaultSize){addLog('倉庫容量不足：解除前に整理してください。','danger');return false;}
 if(id==='player')unequipItem(slot);else{state.storage.push(slots[slot]);slots[slot]=null;saveState();render();}
 return true;
}
function compareEquipmentHtml(current,next){
 const old=current||{},item=next||{};
 const stats=[['baseAtk','ATK'],['baseDef','DEF'],['hp','HP'],['crit','会心%'],['vamp','吸血%']];
 const changes=stats.map(([key,label])=>{const from=Number(old[key])||0,to=Number(item[key])||0,d=to-from;return `<span class="${d<0?'forge-missing':d>0?'forge-ready':''}">${label} ${from} → ${to} (${d>0?'+':''}${d})</span>`;}).join(' / ');
 const keys=new Set([...Object.keys(old.effects||{}),...Object.keys(item.effects||{})]);
 const effects=[...keys].map(key=>{const from=old.effects?.[key]||0,to=item.effects?.[key]||0;return `${EQUIPMENT_EFFECTS[key]?.[0]||key}: ${from} → ${to}${EQUIPMENT_EFFECTS[key]?.[1]||''}`;}).join(' / ');
 return `<div class="gear-compare"><b>${uiEscape(old.name||'未装備')} → ${uiEscape(item.name||'未装備')}</b><div>${changes}</div><div>${uiEscape(effects)}</div><div>現在：${uiEscape(old.desc||'特殊効果なし')}</div><div>候補：${uiEscape(item.desc||effectDescription(item.effects)||'特殊効果なし')}</div></div>`;
}
let characterView={id:'player',slot:null,page:0};
function openCharacterEquipment(id='player',slot=null,page=0){
 const slots=characterEquipment(id);if(!slots)return;
 characterView={id,slot,page};const stats=id==='player'?getPlayerStats():companionStats(id);
 const tabs=[['player','主人公'],...Object.keys(state.chapter.owned).filter(k=>state.chapter.owned[k]).map(k=>[k,CHARACTER_DATA[k]?.name||k])].map(([key,label])=>`<button class="btn btn-${key===id?'gold':'sub'} btn-xs" onclick="openCharacterEquipment('${key}')">${uiEscape(label)}</button>`).join('');
 const rows=EQUIPMENT_SLOTS.map(s=>`<div class="item-row"><div>${s.icon} ${s.label}：${uiEscape(slots[s.k]?.name||'未装備')}<div>${uiEscape(slots[s.k]?getItemStatSummary(slots[s.k]):'')}</div></div><div class="forge-actions"><button class="btn btn-sub btn-xs" onclick="openCharacterEquipment('${id}','${s.k}')">比較・変更</button>${slots[s.k]?`<button class="btn btn-sub btn-xs" onclick="removeCharacterEquipment('${id}','${s.k}');openCharacterEquipment('${id}')">解除</button>`:''}</div></div>`).join('');
 const candidates=slot?state.storage.filter(i=>equipmentSlot(i)===(slot==='accessory2'?'accessory':slot)&&!equipmentOwner(i)):[];
 const pageCount=Math.max(1,Math.ceil(candidates.length/8));page=Math.min(Math.max(0,page),pageCount-1);
 const selection=slot?`<h3>${EQUIPMENT_SLOTS.find(s=>s.k===slot)?.label}の候補（倉庫）</h3>${candidates.slice(page*8,page*8+8).map(i=>`<article class="forge-recipe">${compareEquipmentHtml(slots[slot],i)}<button class="btn btn-gold btn-xs" onclick="setCharacterEquipment('${id}','${slot}','${i.id}');openCharacterEquipment('${id}','${slot}',${page})">${uiEscape(i.name)}を装備</button></article>`).join('')||'<p>候補なし。他のキャラの装備は先に解除してください。</p>'}<div class="forge-actions"><button class="btn btn-sub btn-xs" ${page===0?'disabled':''} onclick="openCharacterEquipment('${id}','${slot}',${page-1})">前へ</button>${page+1}/${pageCount}<button class="btn btn-sub btn-xs" ${page+1===pageCount?'disabled':''} onclick="openCharacterEquipment('${id}','${slot}',${page+1})">次へ</button></div>`:'';
 showChapterModal('👥 キャラ／装備',`<div class="forge-actions">${tabs}</div>${characterLevelHtml(id)}<p>総能力 ATK ${stats.atk} / DEF ${stats.def} / HP ${stats.maxHp} / 会心 ${stats.crit}%</p>${id!=='player'?'<p>通常探索の主人公とは別装備。エルナの物語戦では基礎能力・炎追撃・会心・スキル威力/CT・ガード回復・回避を反映します。その他の特殊効果は物語戦では適用しません。</p>':''}${rows}${selection}`,`<button class="btn btn-sub" onclick="closeGenericModal()">閉じる</button>`);
 if(id!=='player'){
  document.querySelector('.update-notes-body').insertAdjacentHTML('afterbegin',`<div><p>敵行動前に1回、主人公と同じ種類の行動を取ります（スキルCT中は通常攻撃）。独立HP・DEFで敵の攻撃対象となり、HP0で探索中は戦闘不能。出撃時に全回復。主人公が倒した敵には攻撃しません。討伐で経験値を獲得。</p>${id==='elna'&&state.chapter.complete?'<p>帰ってこなかったはずの声が、隣から聞こえる。契約札の名前は消えていない。</p>':''}<button class="btn btn-gold btn-xs" onclick="selectCompanion('${id}');openCharacterEquipment('${id}')">${state.chapter.companion===id?'同行中':'同行に選択'}</button><button class="btn btn-sub btn-xs" onclick="selectCompanion(null);openCharacterEquipment('${id}')">同行を外す</button></div>`);
 }
}
