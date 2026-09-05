const WEAPON_TYPES=Object.fromEntries([
 ['sword','片手剣',1,1,1,1,1,1,'normalAttack'],['greatsword','大剣',1.4,.7,.8,.7,1.4,1,'heavyAttack'],
 ['rapier','細剣',.85,1.3,1.4,1,.6,.6,'crit'],['dagger','短剣',.7,1.5,1.3,1.4,.5,.4,'multiHit'],
 ['dual','双剣',.8,1.4,1.2,1.3,.7,.4,'multiHit'],['axe','斧',1.2,.9,1,.8,1.3,.8,'break'],
 ['greataxe','大斧',1.5,.6,1,.7,1.5,.7,'singleStrike'],['spear','槍',1.1,1,1,1,1.1,1,'pierce'],
 ['pike','長槍',1.2,.8,1,.8,1.2,1.2,'counter'],['hammer','槌',1.2,.8,.8,.7,1.5,1,'break'],
 ['greathammer','大槌',1.5,.6,.7,.6,1.8,1,'heavyAttack'],['mace','メイス',1.1,.9,1,1,1.3,1,'shock'],
 ['scythe','大鎌',1.2,.9,1.1,1.2,1,.5,'lifesteal'],['claw','爪',.7,1.5,1.2,1.4,.7,.4,'bleed'],
 ['fist','拳',.8,1.4,1.1,1,1,1,'counter'],['bow','弓',1,1.1,1.3,1,.7,.2,'crit'],
 ['crossbow','クロスボウ',1.3,.7,1.3,1,.9,.2,'singleStrike'],['staff','杖',1,.9,1,1.4,.6,.5,'skillPower'],
 ['book','魔導書',.9,1,1,1.5,.5,.6,'curse'],['gun','銃',1.3,.8,1.3,.9,1,.2,'pierce'],
 ['chain','チェーン',.9,1.2,1,1.3,.9,.5,'status'],['shield','盾武器',.7,.8,.6,.7,1,1.8,'guard']
].map(([id,name,power,speed,crit,status,breakFit,guard,build])=>[id,{name,power,speed,crit,status,break:breakFit,guard,build}]));
const BUILD_CATALOG={
 lifesteal:'吸血',bleed:'出血',poison:'毒',fire:'炎上',freeze:'凍結',shock:'感電',curse:'呪い',crit:'会心',multiHit:'連撃',singleStrike:'一撃特化',lowHp:'低HP背水',highHp:'高HP維持',shield:'シールド',guard:'ガード',justGuard:'ジャストガード',counter:'カウンター',reflect:'反射',dodge:'回避',break:'部位破壊',boss:'ボス特攻',mob:'雑魚殲滅',status:'状態異常蓄積',statusHunter:'状態異常特攻',conversion:'属性変換',hybrid:'属性複合',normalAttack:'通常攻撃特化',heavyAttack:'強攻撃特化',skillPower:'スキル火力',skillHaste:'スキル回転',onKill:'撃破時強化',longFight:'長期戦',burst:'短期決戦',overheal:'オーバーヒール',onHurt:'被弾時強化',unhurt:'ノーダメージ強化',pierce:'防御無視',defDown:'敵DEF低下',speed:'攻撃速度',extraAttack:'追加攻撃',followUp:'追撃',summon:'召喚/分身',farming:'素材ドロップ特化',rareMaterial:'レア素材特化',chest:'宝箱特化',safe:'探索安全型',deep:'深層特化',abyssal:'Abyssal特化'
};
function weaponIdentity(item){
 if(item.type!=='weapon')return item;
 const name=item.name||'',e=item.effects||{};
 item.weaponType ||= /大槌|粉砕槌/.test(name)?'greathammer':/槌/.test(name)?'mace':/鎌/.test(name)?'scythe':/杖/.test(name)?'staff':/斧/.test(name)?'axe':/槍/.test(name)?'spear':WEAPON_TYPES[item.archetype]?item.archetype:'sword';
 item.primaryBuildTag ||= item.vamp||item.setTag==='blood'?'lifesteal':e.poisonChance||e.poisonBonus?'poison':e.fireDamage?'fire':item.archetype==='thunder'?'shock':item.isCurse?'curse':item.crit>=10?'crit':e.dodge?'dodge':e.breakPower?'break':e.materialChance||item.goldRate?'farming':item.craftEffect==='desperate'||e.lowHpPower?'lowHp':item.craftEffect==='elite_hunter'?'mob':e.skillPower?'skillPower':item.baseDef?'guard':WEAPON_TYPES[item.weaponType].build;
 item.secondaryBuildTags ||= [];
 item.tags=[...new Set([...(item.tags||[]),item.primaryBuildTag,...item.secondaryBuildTags])];
 return item;
}
const LEGACY_RECIPE_MIGRATIONS=[];
function weaponAudit(){
 const rows=Object.entries(EQUIPMENT_CATALOG).filter(([,r])=>r.type==='weapon');
 const group=key=>rows.reduce((a,[,r])=>(a[r[key]||'unset']=(a[r[key]||'unset']||0)+1,a),{});
 const cross=key=>rows.reduce((a,[,r])=>{const bucket=a[r[key]] ||= {};bucket[r.primaryBuildTag]=(bucket[r.primaryBuildTag]||0)+1;return a;},{});
 return {total:rows.length,base:rows.filter(([,r])=>!r.evolutionRoot).length,generatedEvolutions:rows.filter(([,r])=>r.evolutionRoot).length,craftable:rows.filter(([id])=>CRAFT_RECIPES[id]).length,dropOnly:0,activeProcedural:0,testOnly:0,rarity:group('rarity'),weaponType:group('weaponType'),build:group('primaryBuildTag'),rarityBuild:cross('rarity'),weaponTypeBuild:cross('weaponType'),unassigned:rows.filter(([,r])=>!r.primaryBuildTag).length,legacyMigrations:LEGACY_RECIPE_MIGRATIONS,weaponKinds:WEAPON_TYPES};
}
CRAFT_RECIPES.starter_w={name:'錆びたショートソード',icon:'🗡️',type:'weapon',slot:'weapon',rarity:'Common',baseAtk:6,gold:15,materials:{},desc:'通常攻撃特化の初期武器',archetype:'sword'};
for(const [id,item]of Object.entries(UNIQUE_ITEMS)){
 if(!['weapon','armor','accessory'].includes(item.type)||CRAFT_RECIPES[id])continue;
 const tier=Math.max(0,MATERIAL_MILESTONES.findIndex(r=>r.rarity===item.rarity));
 const sourceArea={giant_ram:1,guardian_aegis:2,mutagen_core:3,mother_tree_heart:4,nereus_crown:5,living_core_relic:6}[id]||(item.archetype==='thunder'?2:item.setTag==='blood'?3:item.rarity==='Abyssal'?6:1);
 const area=AREAS.find(a=>a.id===sourceArea)||AREAS[0];
 const material=MONSTER_MATERIALS[area.boss.materialSource].keys[tier];
 CRAFT_RECIPES[id]={...item,gold:100*(tier+1),materials:{[material]:3},desc:item.desc||'旧秘宝の復元製作'};
 LEGACY_RECIPE_MIGRATIONS.push(id);
}
for(const r of Object.values(CRAFT_RECIPES))weaponIdentity(r);
for(const r of Object.values(UNIQUE_ITEMS))weaponIdentity(r);
Object.assign(EQUIPMENT_CATALOG,CRAFT_RECIPES);
const EVOLUTION_STAGES=[{id:'legendary',rarity:'Legendary',clear:100},{id:'mythic',rarity:'Mythic',clear:300},{id:'abyssal',rarity:'Abyssal',clear:500},{id:'deep',rarity:'Abyssal',clear:1000}];
const EVOLUTION_BRANCHES={assault:{name:'猛攻',effects:{skillPower:15},secondary:'heavyAttack'},blood:{name:'血誓',effects:{lifestealRate:6},secondary:'lifesteal'}};
const EVOLUTION_ROOTS=Object.entries(CRAFT_RECIPES).filter(([,r])=>r.type==='weapon');
for(const [root,base]of EVOLUTION_ROOTS){
 const profiles=root==='iron_sword'?{...EVOLUTION_BRANCHES,...Object.fromEntries(Object.entries(BUILD_CATALOG).map(([tag,name])=>['build_'+tag,{name:name+'刻印',primary:tag,secondary:base.primaryBuildTag,effects:{}}]))}:EVOLUTION_BRANCHES;
 for(const [branch,profile]of Object.entries(profiles)){
  let parent=root;
  for(const stage of EVOLUTION_STAGES){
   const baseTier=MATERIAL_MILESTONES.findIndex(r=>r.rarity===base.rarity),stageTier=MATERIAL_MILESTONES.findIndex(r=>r.rarity===stage.rarity);
   if(stageTier<baseTier)continue;
   const id=`evolve_${root}_${branch}_${stage.id}`,tier=stageTier;
   const source=base.quarrySource||AREAS[0].boss.materialSource;
   const material=stage.clear===1000?'post_abyss':MONSTER_MATERIALS[source].keys[tier];
   const r={...base,name:`${base.name}・${profile.name}${stage.id==='deep'?'深淵':stage.rarity}`,parent,awakening:true,hiddenMaterial:null,unlockFloor:stage.clear,inheritRefinement:true,evolutionRoot:root,secondaryBuildTags:[...new Set([...(base.secondaryBuildTags||[]),profile.secondary])],effects:{...(base.effects||{}),...profile.effects},materials:{[material]:3,abyss_core:2},gold:stage.clear*5,desc:`${base.desc||''} / ${profile.name}派生：覚醒後+0・追加特性を継承 / ${stage.clear}Fクリア後`};
   // Different branches emphasize effects, rather than multiplying every base stat.
   r.rarity=stage.rarity;
   r.primaryBuildTag=profile.primary||base.primaryBuildTag;
   r.hiddenMaterial=base.hiddenMaterial||null;
   r.effects={...(base.effects||{}),...Object.fromEntries(Object.entries(profile.effects).map(([key,n])=>[key,n*(EVOLUTION_STAGES.indexOf(stage)+1)]))};
   r.baseAtk=Math.round((base.baseAtk||0)*(branch==='assault'?1.08:.95));
   weaponIdentity(r);CRAFT_RECIPES[id]=r;EQUIPMENT_CATALOG[id]=r;parent=id;
  }
 }
}
