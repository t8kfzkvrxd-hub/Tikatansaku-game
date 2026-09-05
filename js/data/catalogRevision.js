const CATALOG_BEFORE=structuredClone(EQUIPMENT_CATALOG);
const MONSTER_WEAPON_ROLES=[
 ['claw','mace','axe'],['spear','staff','greathammer'],['book','fist','dual'],['pike','staff','dagger'],['sword','book','greataxe'],
 ['mace','bow','claw'],['spear','scythe','greataxe'],['rapier','crossbow','dual'],['book','dagger','rapier'],['axe','greatsword','bow']
];
AREAS.forEach((area,a)=>area.enemies.forEach((enemy,j)=>{
 const r=CRAFT_RECIPES[`gear_${enemy.materialSource}_weapon`];if(!r)return;
 const type=MONSTER_WEAPON_ROLES[a]?.[j];if(!type)return;
 const rank=a*3+j,tier=rank<14?0:rank<24?1:2;
 r.weaponType=type;r.name=enemy.name+'の'+WEAPON_TYPES[type].name;
 r.secondaryBuildTags=[...new Set([...(r.secondaryBuildTags||[]),WEAPON_TYPES[type].build])];
 r.tags=[...new Set([...r.tags,...r.secondaryBuildTags])];r.rarity=MATERIAL_MILESTONES[tier].rarity;
 r.materials={[MONSTER_MATERIALS[enemy.materialSource].keys[tier]]:4};
 r.desc+=' / 武器種特性：'+BUILD_CATALOG[WEAPON_TYPES[type].build];
}));
for(const r of Object.values(CRAFT_RECIPES))if(r.evolutionRoot){
 const base=CRAFT_RECIPES[r.evolutionRoot];
 r.weaponType=base.weaponType;r.secondaryBuildTags=[...new Set([...(r.secondaryBuildTags||[]),...(base.secondaryBuildTags||[])])];r.tags=[...new Set([...r.tags,...r.secondaryBuildTags])];
 const old=CATALOG_BEFORE[r.evolutionRoot];if(old.name!==base.name)r.name=r.name.replace(old.name,base.name);
}
const ARMOR_BUILD_PROFILES={
 head:['crit','poison','skillPower','farming','fire','freeze','curse','statusHunter'],
 armor:['highHp','shield','lifesteal','lowHp','guard','onHurt','reflect','unhurt'],
 arms:['speed','multiHit','break','justGuard','counter','heavyAttack','crit','skillHaste'],
 legs:['dodge','unhurt','safe','normalAttack','freeze','farming','highHp','longFight'],
 accessory:['lifesteal','bleed','poison','fire','freeze','justGuard','counter','shield','overheal','lowHp','highHp','break','farming','statusHunter','conversion','hybrid']
};
const CATALOG_BUILD_EFFECTS={crit:{critDamage:30},poison:{poisonBonus:80},skillPower:{skillPower:20},farming:{materialChance:12},fire:{fireDamage:8},freeze:{critDamage:20},curse:{critPoison:30},statusHunter:{poisonCrit:20},highHp:{guardHeal:3},shield:{guardHeal:4},lifesteal:{lifestealRate:5},lowHp:{lowHpPower:70},guard:{guardHeal:8},onHurt:{lowHpPower:25},reflect:{guardHeal:3},unhurt:{dodge:8},speed:{fireDamage:3},multiHit:{critPoison:25},break:{breakPower:5},justGuard:{justAttack:80},counter:{justAttack:35},heavyAttack:{breakPower:3},skillHaste:{skillHaste:1},dodge:{dodge:14},safe:{dodge:5},normalAttack:{poisonChance:25},longFight:{poisonBonus:50},bleed:{lifestealRate:3},overheal:{lifestealRate:5},conversion:{fireDamage:5},hybrid:{poisonChance:25}};
const CATALOG_CONDITIONS=[['normalAttack','通常攻撃連携'],['lowHp','背水連携'],['longFight','持久連携'],['crit','会心連携'],['shield','障壁連携'],['statusHunter','状態特攻連携']];
for(const [slot,profiles]of Object.entries(ARMOR_BUILD_PROFILES)){
 const counts=slot==='accessory'?[16,14,12,8,6,4]:[8,8,6,4,3,3];
 counts.forEach((count,tier)=>{
  for(let n=0;n<count;n++){
   const primary=profiles[n],condition=CATALOG_CONDITIONS[tier],secondary=condition[0]===primary?'boss':condition[0];
   const source=AREAS[n%AREAS.length].enemies[n%3].materialSource,key=MONSTER_MATERIALS[source].keys[tier];
   const id=`kit_${slot}_${primary}_${tier}`,rarity=MATERIAL_MILESTONES[tier].rarity;
   const effects={...CATALOG_BUILD_EFFECTS[primary]};
   // Low-rarity conditional effects stay competitive; high tiers add utility rather than replacing them.
   if(tier>=3)effects[tier===3?'skillPower':tier===4?'materialChance':'guardHeal']=tier===3?10:tier===4?6:4;
   const r={name:`${BUILD_CATALOG[primary]}の${EQUIPMENT_SLOTS.find(s=>s.k===slot).label.replace('1','')}・${condition[1]}`,icon:slot==='accessory'?'💍':EQUIPMENT_SLOTS.find(s=>s.k===slot).icon,type:slot==='accessory'?'accessory':'armor',slot,rarity,primaryBuildTag:primary,secondaryBuildTags:[secondary],tags:[primary,secondary],effects,baseAtk:slot==='arms'?2+tier*2:0,baseDef:slot==='accessory'?tier:3+tier*3,hp:slot==='armor'?20+tier*14:5+tier*5,gold:120*(tier+1),materials:{[key]:3+tier},unlockFloor:MATERIAL_MILESTONES[tier].clear,desc:`${BUILD_CATALOG[primary]}＋${BUILD_CATALOG[secondary]}の組み合わせ / ${effectDescription(effects)}`};
   CRAFT_RECIPES[id]=r;
  }
 });
}
for(const [id,r]of Object.entries(CRAFT_RECIPES)){
 r.catalogKind=r.parent?(r.awakening?'AWAKENED':'DERIVED'):'BASE';
 const existing=[...buildTags({item:r})];r.primaryBuildTag ||= existing[0]||'guard';r.secondaryBuildTags ||= existing.filter(t=>t!==r.primaryBuildTag);
 r.tags=[...new Set([...(r.tags||[]),r.primaryBuildTag,...r.secondaryBuildTags])];EQUIPMENT_CATALOG[id]=r;
}
function catalogRoot(id){const seen=new Set();while(CRAFT_RECIPES[id]?.parent&&!seen.has(id)){seen.add(id);id=CRAFT_RECIPES[id].parent;}return id;}
function catalogAudit(catalog=EQUIPMENT_CATALOG){
 const rows=Object.entries(catalog),group=(items,key)=>items.reduce((a,[,r])=>{const v=typeof key==='function'?key(r):r[key]||'none';a[v]=(a[v]||0)+1;return a;},{}),base=rows.filter(([,r])=>r.type==='weapon'&&!r.parent),derived=rows.filter(([,r])=>r.type==='weapon'&&r.parent);
 const matrix={},builds={};for(const [id,r]of rows){const slot=r.slot||r.type;(matrix[slot] ||= {})[r.rarity]=((matrix[slot]||{})[r.rarity]||0)+1;(builds[slot] ||= {})[r.primaryBuildTag||'none']=((builds[slot]||{})[r.primaryBuildTag||'none']||0)+1;}
 const signatures=new Map();for(const [id,r]of rows){const shape={...r};for(const k of ['name','icon','desc','gold','materials','parent','evolutionRoot','unlockFloor','hiddenMaterial','catalogKind'])delete shape[k];const canonical=o=>o&&typeof o==='object'?Array.isArray(o)?o.map(canonical).sort():Object.fromEntries(Object.keys(o).sort().map(k=>[k,canonical(o[k])])):o;const signature=JSON.stringify([canonical(shape),rows.filter(([,c])=>c.parent===id).map(([k])=>k).sort()]);const ids=signatures.get(signature)||[];ids.push(id);signatures.set(signature,ids);}
 return {total:rows.length,slots:group(rows,r=>r.slot||r.type),rarity:group(rows,'rarity'),matrix,builds,baseWeapons:base.length,baseTypes:group(base,'weaponType'),baseRarity:group(base,'rarity'),baseBuild:group(base,'primaryBuildTag'),derived:derived.length,derivedRarity:group(derived,'rarity'),deep:derived.filter(([,r])=>r.unlockFloor===1000).length,unassigned:rows.filter(([,r])=>!r.primaryBuildTag).length,duplicates:[...signatures.values()].filter(ids=>ids.length>1),future:rows.filter(([,r])=>(r.unlockFloor||MATERIAL_MILESTONES.find(m=>m.rarity===r.rarity)?.clear||0)>MAX_DUNGEON_FLOOR).length};
}
