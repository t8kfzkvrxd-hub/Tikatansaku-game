const EQUIPMENT_SLOTS = [
 {k:'weapon',label:'武器',icon:'⚔️'},{k:'head',label:'頭',icon:'👑'},
 {k:'armor',label:'胴',icon:'🥋'},{k:'arms',label:'腕',icon:'🧤'},
 {k:'legs',label:'脚',icon:'🥾'},{k:'accessory',label:'アクセ1',icon:'💍'},
 {k:'accessory2',label:'アクセ2',icon:'💍'}
];
const EQUIPMENT_EFFECTS = {
 poisonChance:['毒付与率','%'], poisonBonus:['毒敵ダメージ','%'],poisonCrit:['毒敵への会心率','%'],poisonHeal:['毒敵撃破時回復','HP'],
 fireDamage:['攻撃時の炎追撃',''],critDamage:['会心ダメージ','%'],
 skillPower:['スキル威力','%'],skillHaste:['スキルCT短縮','T'],
 justAttack:['JUST GUARD後の次撃','%'],guardHeal:['ガード成功時回復','HP'],
 dodge:['回避率','%'],dodgeAttack:['回避後の次撃','%'],
 breakPower:['強攻撃時の敵防御破壊',''],lowHpPower:['HP35%以下の攻撃力','%'],
 materialChance:['追加素材率','%'],critPoison:['会心時の毒付与率','%'],quarryPower:['素材元の敵への攻撃力','%']
};
const GEAR_PROFILES = {
 poison:{weapon:{poisonChance:40},head:{poisonCrit:25},arms:{critPoison:75},legs:{dodge:10},accessory:{poisonBonus:120}},
 fire:{weapon:{fireDamage:12},head:{skillPower:15},arms:{fireDamage:8},legs:{dodge:8,fireDamage:3},accessory:{fireDamage:10}},
 crit:{weapon:{critDamage:50},head:{critDamage:35},arms:{critDamage:60},legs:{dodge:10,dodgeAttack:30},accessory:{critPoison:100}},
 guard:{weapon:{justAttack:60},head:{guardHeal:4},arms:{justAttack:80},legs:{guardHeal:3,dodge:5},accessory:{guardHeal:8}},
 dodge:{weapon:{dodgeAttack:90},head:{dodge:10},arms:{dodgeAttack:70},legs:{dodge:18},accessory:{dodge:12,dodgeAttack:30}},
 break:{weapon:{breakPower:6},head:{skillPower:20},arms:{breakPower:4},legs:{dodge:8,breakPower:1},accessory:{skillPower:30}},
 desperate:{weapon:{lowHpPower:90},head:{lowHpPower:25},arms:{lowHpPower:50},legs:{dodge:12},accessory:{lowHpPower:80}},
 farming:{weapon:{materialChance:12},head:{materialChance:15},arms:{materialChance:8,skillPower:10},legs:{materialChance:10,dodge:5},accessory:{materialChance:20}},
 skill:{weapon:{skillPower:35},head:{skillPower:20},arms:{skillHaste:1},legs:{dodge:10},accessory:{skillPower:40}}
};
const TRAIT_BUILD = {spore_poison:'poison',curse_poison:'poison',skill_bind:'poison',paralysis:'crit',counter_heavy:'guard',guard_enrage:'break',grab_attack:'break',speed:'dodge',regen_cell:'desperate',exposed_weakpoint:'skill',rage_stack:'desperate',low_hp_frenzy:'fire',copy_buff:'crit',death_pulse:'farming'};
function effectDescription(effects={}) {return Object.entries(effects).map(([key,n])=>`${EQUIPMENT_EFFECTS[key]?.[0]||key}+${n}${EQUIPMENT_EFFECTS[key]?.[1]||''}`).join(' / ');}
function equipmentSlot(item) {return item?.slot || ({weapon:'weapon',armor:'armor',accessory:'accessory'}[item?.type]);}
function normalizeEquipment(item) {
 if(!item||!['weapon','armor','accessory'].includes(item.type))return item;
 item.slot ||= equipmentSlot(item);
 item.tags ||= [item.setTag||item.archetype||(item.type==='armor'?'guard':'general')];
 item.id ||= crypto.randomUUID();
 return item;
}
function migrateEquipment() {
 const old=state.equipped||{},next=Object.fromEntries(EQUIPMENT_SLOTS.map(s=>[s.k,null]));
 for(const [key,item] of Object.entries(old)) {
  if(!item)continue;normalizeEquipment(item);
  const slot=key==='accessory2'?'accessory2':equipmentSlot(item);
  if(slot in next&&!next[slot])next[slot]=item;
  else if(item.type==='accessory'&&!next.accessory2)next.accessory2=item;
  else state.storage.push(item);
 }
 state.equipped=next;
 [...state.storage,...state.inventory].forEach(normalizeEquipment);
}
function equippedAccessories() {return [state.equipped.accessory,state.equipped.accessory2].filter(Boolean);}
function equipmentEffects() {
 const effects={};Object.values(state.equipped).filter(Boolean).forEach(item=>Object.entries(item.effects||{}).forEach(([key,n])=>effects[key]=(effects[key]||0)+n));
 if(state.effectSeal?.turns>0)delete effects[state.effectSeal.key];
 return effects;
}
function equipmentSynergies() {
 const e=equipmentEffects(),lines=[];
 if((e.poisonChance||e.critPoison)&&e.poisonBonus)lines.push('☠️ 毒付与 → 毒特効');
 if((e.poisonChance||e.critPoison)&&e.poisonCrit)lines.push('☠️ 毒付与 → 毒敵会心');
 if((e.poisonChance||e.critPoison)&&e.poisonHeal)lines.push('☠️ 毒付与 → 撃破回復');
 if(e.dodge&&e.dodgeAttack)lines.push('💨 回避 → 次撃強化');
 if(e.guardHeal&&e.justAttack)lines.push('🛡️ ガード回復＋JUST GUARD強化');
 if(e.breakPower&&e.skillPower)lines.push('🔨 防御破壊 → スキル追撃');
 return lines;
}
function unequipItem(slot) {
 const item=state.equipped[slot];if(!item)return;
 const list=state.screen==='town'?state.storage:state.inventory;
 if(state.screen==='town'&&list.length>=state.camp.vaultSize){addLog('倉庫容量不足：解除前に整理してください。','danger');return;}
 list.push(item);state.equipped[slot]=null;saveState();render();
}
function equipmentAttackStats(stats,enemy,action) {
 const e=equipmentEffects();
 const quarry=Object.values(state.equipped).filter(i=>i?.quarrySource&&i.quarrySource===enemy.materialSource).reduce((sum,i)=>sum+(i.effects?.quarryPower||0),0);
 stats.atk*=1+Math.min(60,quarry)/100;
 if(enemy.gearPoison>0) {stats.atk*=1+Math.min(200,e.poisonBonus||0)/100;stats.crit+=e.poisonCrit||0;}
 if(state.hp<=stats.maxHp*.35)stats.atk*=1+Math.min(150,e.lowHpPower||0)/100;
 if(action==='skill')stats.atk*=1+Math.min(100,e.skillPower||0)/100;
 stats.atk=Math.round(stats.atk);
}
function equipmentHit(enemy,action,isCrit=false) {
 const e=equipmentEffects();
 if(e.fireDamage){enemy.hp-=e.fireDamage;addLog(`🔥 炎追撃 ${e.fireDamage}ダメージ`,'gold');}
 if(Math.random()*100<Math.min(85,(e.poisonChance||0)+(isCrit?(e.critPoison||0):0))) {enemy.gearPoison=3;addLog('☠️ 敵に毒を付与（3T）','gold');}
 if(action==='heavy'&&e.breakPower){enemy.def=Math.max(0,enemy.def-e.breakPower);addLog(`🔨 防御破壊 -${e.breakPower}`,'gold');}
}
function equipmentPoisonTick(enemy) {
 if(enemy.gearPoison>0){const damage=Math.max(3,Math.round(enemy.maxHp*.015));enemy.gearPoison--;enemy.hp-=damage;addLog(`☠️ 毒 ${damage}ダメージ`,'gold');}
}

AREAS.forEach((area,areaIndex)=>{
 area.enemies.forEach((enemy,j)=>{
  const build=TRAIT_BUILD[enemy.trait]||'farming',profile=GEAR_PROFILES[build];
  for(const slot of ['weapon','head','arms','legs','accessory']) {
   const source=enemy.materialSource,id=`gear_${source}_${slot}`;
   const effects={...profile[slot],quarryPower:20};
   if(slot==='accessory'&&j===2)effects.poisonHeal=8;
   if(slot==='head'&&j===1)effects.materialChance=5;
   const rarity=slot==='arms'?'Common':slot==='weapon'?'Epic':'Rare';
   const label={weapon:'狩刃',head:'観測冠',arms:'戦手',legs:'遊脚',accessory:'紋章'}[slot];
   CRAFT_RECIPES[id]={name:`${enemy.name}の${label}`,icon:{weapon:'🗡️',head:'👑',arms:'🧤',legs:'🥾',accessory:'💍'}[slot],type:slot==='weapon'?'weapon':slot==='accessory'?'accessory':'armor',slot,rarity,tags:[build,areaIndex>=2?'abyss':areaIndex===1?'machine':'beast'],effects,
    baseAtk:slot==='weapon'?28+areaIndex*20:slot==='arms'?4+areaIndex*2:0,baseDef:['head','arms','legs'].includes(slot)?3+areaIndex*2:0,hp:slot==='legs'?8+areaIndex*4:0,crit:build==='crit'?8:0,
    archetype:build==='poison'?'dagger':build==='fire'?'thunder':'sword',gold:100+areaIndex*120,
    quarrySource:source,materials:{[source+'_common']:3,[source+'_rare']:1},desc:`${build}ビルド：${effectDescription(effects)}（素材元：${enemy.name}）`};
  }
 });
 const source=area.boss.materialSource;
 for(const slot of ['armor','accessory']) {
  const effects=slot==='armor'?{guardHeal:5,lowHpPower:20}:{skillPower:20,fireDamage:6};
  CRAFT_RECIPES[`gear_${source}_${slot}`]={name:`${area.boss.name}の${slot==='armor'?'王鎧':'王印'}`,icon:slot==='armor'?'🥋':'💍',type:slot,slot,rarity:'Legendary',tags:['boss','guard','skill'],effects,baseDef:slot==='armor'?20+areaIndex*6:4,baseAtk:slot==='accessory'?10+areaIndex*4:0,hp:slot==='armor'?65+areaIndex*15:20,gold:400+areaIndex*100,materials:{[source+'_legendary']:2,abyss_core:2},desc:effectDescription(effects)};
 }
 const parent=`forge_${area.id}_awaken`;
 CRAFT_RECIPES[`gear_${source}_awaken`]={name:area.boss.name+'の真魂剣',icon:'💠',type:'weapon',slot:'weapon',rarity:'Mythic',parent,awakening:true,hiddenMaterial:source+'_mythic',baseAtk:85+areaIndex*28,tags:['boss','skill'],effects:{skillPower:30,fireDamage:15},gold:1000+areaIndex*200,materials:{[source+'_mythic']:1,abyss_core:5},desc:'汎用型：スキル威力+30% / 炎追撃+15'};
});
Object.values(CRAFT_RECIPES).forEach(r=>{
 r.slot ||= equipmentSlot(r);r.tags ||= [r.craftEffect==='elite_hunter'?'boss':r.craftEffect==='desperate'?'desperate':r.archetype||'guard'];
 if(!r.effects&&!r.craftEffect){r.effects=r.type==='armor'?{guardHeal:3}:r.awakening?{skillPower:15}:{skillPower:10};r.desc+=' / '+effectDescription(r.effects);}
});
Object.values(UNIQUE_ITEMS).filter(i=>['weapon','armor','accessory'].includes(i.type)).forEach(i=>{i.slot ||= equipmentSlot(i);i.tags ||= [i.setTag||i.archetype||(i.type==='armor'?'guard':'general')];});
const EQUIPMENT_CATALOG = {...Object.fromEntries(Object.entries(UNIQUE_ITEMS).filter(([,i])=>['weapon','armor','accessory'].includes(i.type))),...CRAFT_RECIPES};
window.__equipmentDebug={slots:EQUIPMENT_SLOTS,recipes:CRAFT_RECIPES,materials:MATERIALS,catalog:EQUIPMENT_CATALOG};
