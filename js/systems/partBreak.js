const PART_TYPES={
 head:{name:'頭',tier:1},fang:{name:'牙',tier:0},leg:{name:'脚',tier:0},leftWing:{name:'左翼',tier:1,atk:.95},rightWing:{name:'右翼',tier:1,atk:.95},
 arm:{name:'腕',tier:1,atk:.9},armor:{name:'装甲',tier:0,def:.75},horn:{name:'角',tier:1,atk:.9},core:{name:'コア',tier:2,atk:.9},root:{name:'根',tier:0},branch:{name:'枝',tier:1},mask:{name:'仮面',tier:1}
};
const PART_TEMPLATES={beast:['fang','leg','head'],flying:['leftWing','rightWing','head'],armored:['armor','arm','head'],humanoid:['arm','head','leg'],plant:['root','branch','core'],undead:['head','arm','mask'],biological:['core','arm','leg'],memory:['mask','core','arm']};
const ENEMY_PART_FAMILIES=[['beast','undead','humanoid','armored'],['armored','undead','flying','armored'],['biological','armored','beast','biological'],['plant','plant','beast','plant'],['armored','biological','beast','undead'],['biological','biological','beast','biological'],['undead','undead','undead','memory'],['memory','memory','memory','memory'],['memory','beast','armored','memory'],['plant','armored','biological','memory']];
const BOSS_PARTS=[['arm','leg','head'],['armor','arm','core'],['horn','arm','core'],['root','branch','core'],['arm','armor','core'],['armor','arm','core'],['mask','arm','core'],['mask','armor','core'],['mask','arm','core'],['armor','arm','core']];
const ENEMY_PART_DEFINITIONS={};
AREAS.forEach((area,i)=>[...area.enemies,area.elite,area.boss].forEach((enemy,j)=>{
 const family=enemy.partFamily||ENEMY_PART_FAMILIES[i]?.[Math.min(3,j)]||'armored';
 ENEMY_PART_DEFINITIONS[enemy.materialSource]={family,parts:j===4?(enemy.partIds||BOSS_PARTS[i]||['armor','arm','core']):PART_TEMPLATES[family].slice(0,j===3?3:2)};
}));
function ensureEnemyParts(enemy){
 if(!enemy||enemy.parts)return enemy?.parts||[];
 const data=ENEMY_PART_DEFINITIONS[enemy.materialSource];enemy.partTarget='body';
 enemy.parts=(data?.parts||[]).map(id=>{const p=PART_TYPES[id],max=Math.max(8,Math.round(enemy.maxHp*(id==='core'?.28:.18)));return {id,hp:max,maxHp:max,broken:false};});return enemy.parts;
}
function selectEnemyPart(id){
 const enemy=state.currentEnemy;if(state.screen!=='battle'||!enemy||enemy.acting||enemy.rewardClaimed)return;
 if(id!=='body'&&!ensureEnemyParts(enemy).some(p=>p.id===id))return;
 enemy.partTarget=id;renderCombatReadout();
}
function partBreakPower(damage,slots,action){
 const type=slots.weapon?.weaponType||'sword',factor={greathammer:1.8,greatsword:1.4,greataxe:1.5,spear:1.2,pike:1.2,bow:1.2,crossbow:1.2,dagger:.7,claw:.8}[type]||1;
 return Math.max(1,Math.round(damage*.55*factor*(action==='heavy'?1.3:1)*(buildTags(slots).has('break')?1.3:1)+(equipmentEffects(slots).breakPower||0)));
}
function hitEnemyPart(enemy,action,slots){
 const part=ensureEnemyParts(enemy).find(p=>p.id===enemy.partTarget);if(!part||part.broken||action==='defend')return;
 const before=enemy.partHitStart?.[slots===state.equipped?'player':'companion'];if(before==null)return;
 const damage=Math.max(0,before-enemy.hp);if(!damage)return;
 const power=partBreakPower(damage,slots,action),lost=Math.min(part.hp,power);part.hp=Math.max(0,part.hp-power);
 if(typeof combatEmit==='function')combatEmit(slots===state.equipped?'player':state.chapter.companion,'enemy',lost,`${PART_TYPES[part.id].name}${part.hp===0?'を破壊！':'耐久'}`,'part');
 if(part.hp===0){
  part.broken=true;enemy.buildBroken=true;const def=PART_TYPES[part.id];
  if(def.atk)enemy.atk=Math.max(1,Math.round(enemy.atk*def.atk));if(def.def)enemy.def=Math.max(0,Math.round(enemy.def*def.def));
  addLog(`💥 ${def.name}を破壊！${def.atk?' 敵ATK低下':''}${def.def?' 敵DEF低下':''}`,'gold');playSound('crit');spawnFloatingFx(`${def.name}を破壊！`,'crit');
 }
}
function partMaterialKey(enemy,part){return MONSTER_MATERIALS[enemy.materialSource]?.keys[PART_TYPES[part.id].tier];}
function partRewardRolls(enemy,rng=Math.random){
 const keys=[];for(const part of ensureEnemyParts(enemy)){const tier=PART_TYPES[part.id].tier;if(tier>materialTierLimit())continue;const key=partMaterialKey(enemy,part);if(key&&rng()<(part.broken?.22:.08))keys.push(key);}return keys;
}
function enemyPartsHtml(enemy){
 const parts=ensureEnemyParts(enemy);if(!parts.length)return '';
 return `<nav class="enemy-parts" aria-label="攻撃部位"><button aria-pressed="${enemy.partTarget==='body'}" onclick="selectEnemyPart('body')" ${enemy.acting?'disabled':''}>本体</button>${parts.map(p=>{const d=PART_TYPES[p.id],key=partMaterialKey(enemy,p),known=key&&materialKnown(key);return `<button aria-pressed="${enemy.partTarget===p.id}" onclick="selectEnemyPart('${p.id}')" ${enemy.acting?'disabled':''}><b>${d.name} ${p.broken?'BROKEN':Math.ceil(p.hp/p.maxHp*100)+'%'}</b><small>${p.broken?'破壊済み':p.hp+' / '+p.maxHp} / ${known?uiEscape(MATERIALS[key].name):'？？？'}</small></button>`;}).join('')}</nav><small class="part-help">部位攻撃でも本体ダメージ100%。部位素材の追加抽選8%→破壊後22%。翼・腕・角・コア：ATK低下／装甲：DEF低下。</small>`;
}
const materialSourceWithoutParts=materialSourceHtml;
materialSourceHtml=function(key){
 const original=materialSourceWithoutParts(key);if(!materialKnown(key))return original;
 const hints=materialSources(key).filter(r=>state.codex.enemies[r.enemy.name]).flatMap(r=>(ENEMY_PART_DEFINITIONS[r.enemy.materialSource]?.parts||[]).filter(id=>partMaterialKey(r.enemy,{id})===key).map(id=>`${uiEscape(r.enemy.name)}：${PART_TYPES[id].name}破壊で追加抽選8%→22%`));
 return original+hints.map(h=>`<div>🔨 ${h}</div>`).join('');
};
