const BUILD_BALANCE_BEFORE=structuredClone(EQUIPMENT_CATALOG);
const BUILD_TIERS={
 A:['lifesteal','bleed','poison','fire','freeze','shock','curse','crit','multiHit','lowHp','highHp','shield','guard','justGuard','counter','dodge','break','normalAttack','heavyAttack','skillPower'],
 B:['reflect','singleStrike','status','statusHunter','conversion','hybrid','skillHaste','onKill','longFight','burst','overheal','onHurt','unhurt','pierce','defDown','speed','extraAttack','followUp','summon','boss','mob'],
 C:['farming','rareMaterial','chest','safe','deep','abyssal']
};
const BUILD_PARTNERS={lifesteal:'bleed',bleed:'lifesteal',poison:'longFight',fire:'hybrid',freeze:'crit',shock:'extraAttack',curse:'statusHunter',crit:'freeze',multiHit:'status',lowHp:'lifesteal',highHp:'shield',shield:'overheal',guard:'counter',justGuard:'counter',counter:'guard',dodge:'unhurt',break:'heavyAttack',normalAttack:'multiHit',heavyAttack:'break',skillPower:'skillHaste',reflect:'guard',singleStrike:'heavyAttack',status:'followUp',statusHunter:'curse',conversion:'fire',hybrid:'shock',skillHaste:'summon',onKill:'mob',longFight:'poison',burst:'singleStrike',overheal:'lifesteal',onHurt:'lowHp',unhurt:'dodge',pierce:'singleStrike',defDown:'multiHit',speed:'extraAttack',extraAttack:'status',followUp:'poison',summon:'skillPower',boss:'highHp',mob:'onKill',farming:'break',rareMaterial:'farming',chest:'safe',safe:'dodge',deep:'longFight',abyssal:'statusHunter'};
const BUILD_RULE_TEXT={
 lifesteal:'有効与ダメージから吸血。出血中の敵は吸血補正',bleed:'命中時に出血蓄積。出血中の敵への装備補助',poison:'毒付与と毒対象への特攻',fire:'命中時に炎上蓄積・継続ダメージ',freeze:'凍結蓄積で確率行動阻害。会心と連携',shock:'感電中の敵への攻撃補正・追加攻撃連携',curse:'呪い蓄積で敵攻撃を軽減',crit:'会心率上昇。凍結対象は追加会心',multiHit:'3ヒットごとに連撃',singleStrike:'強攻撃の周期的な一撃補正',lowHp:'HP35%未満で攻撃強化',highHp:'HP90%以上で攻撃強化',shield:'戦闘中一度だけHP5%の障壁',guard:'防御時の追加軽減と回復',justGuard:'大技を防御して次撃を強化',counter:'防御で反撃準備、次撃を強化',reflect:'被ダメージの一部を反射',dodge:'回避率補正',break:'強攻撃で敵DEFを削る',boss:'ボスへの攻撃補正',mob:'ボス以外への攻撃補正',status:'状態異常付与率を上昇',statusHunter:'状態異常中の敵へ攻撃補正',conversion:'炎上蓄積を感電へ変換',hybrid:'状態異常の種類数で複合ダメージ',normalAttack:'通常攻撃を強化',heavyAttack:'強攻撃を強化',skillPower:'スキル攻撃を強化',skillHaste:'スキルCTを短縮',onKill:'撃破時HP回復と以後の攻撃補正',longFight:'4ターン以降に攻撃補正',burst:'戦闘開始2ターンの攻撃補正',overheal:'吸血の余剰回復を障壁化',onHurt:'被弾後に攻撃補正',unhurt:'未被弾中に攻撃補正',pierce:'敵DEFの35%をATKへ加算する貫通補正',defDown:'命中ごとに敵DEFを削る',speed:'2ヒットごとの速撃（行動間隔は変化しない）',extraAttack:'同じ命中処理内で確率追加ヒット',followUp:'状態異常中の敵へ敵行動前に追撃',summon:'4ヒットごとに影の分身が攻撃',farming:'追加素材抽選率を上昇',rareMaterial:'追加レア素材抽選率を上昇',chest:'宝箱素材の品質抽選を補助',safe:'被ダメージ5%軽減',deep:'61F以降で攻撃補正',abyssal:'500F以降で攻撃補正（将来用）'
};
BUILD_CATALOG.speed='速撃';BUILD_CATALOG.pierce='防御貫通';BUILD_CATALOG.summon='影の分身';
function assignBalancedBuild(r,tag,secondary){
 r.primaryBuildTag=tag;r.secondaryBuildTags=secondary?[secondary]:[];r.tags=[tag,...r.secondaryBuildTags];
 r.effects={...(CATALOG_BUILD_EFFECTS[tag]||{})};
 r.desc=BUILD_RULE_TEXT[tag]+(secondary?' / '+BUILD_RULE_TEXT[secondary]:'');
 delete r.setTag;delete r.craftEffect;delete r.isCurse;delete r.vamp;delete r.crit;
}
// Reuse all evolution IDs; redistribute their parent chains, not saved instances.
const balanceRoots=Object.entries(CRAFT_RECIPES).filter(([,r])=>r.type==='weapon'&&!r.parent&&['Common','Rare','Epic'].includes(r.rarity));
const balanceChains=new Map();
for(const [id,r]of Object.entries(CRAFT_RECIPES))if(r.evolutionRoot){const key=id.replace(/_(legendary|mythic|abyssal|deep)$/,'');if(!balanceChains.has(key))balanceChains.set(key,[]);balanceChains.get(key).push([id,r]);}
const balanceSchedule=[...BUILD_TIERS.A,...BUILD_TIERS.B,...BUILD_TIERS.A,...BUILD_TIERS.C,...BUILD_TIERS.A,...BUILD_TIERS.B];
const rootUse=new Map(),usedRootBuild=new Set();let chainIndex=0;
for(const chain of balanceChains.values()){
 const tag=balanceSchedule[chainIndex%balanceSchedule.length],partner=BUILD_PARTNERS[tag];
 const preferred={lifesteal:'scythe',bleed:'claw',poison:'dagger',fire:'axe',freeze:'staff',shock:'mace',curse:'book',crit:'rapier',guard:'pike',counter:'fist',normalAttack:'sword',heavyAttack:'greatsword',singleStrike:'greataxe',skillPower:'staff',pierce:'crossbow',break:'greathammer',multiHit:'dual',dodge:'bow'}[tag];
 const ordered=balanceRoots.filter(([id])=>!usedRootBuild.has(id+'|'+tag)).sort((a,b)=>(rootUse.get(a[0])||0)-(rootUse.get(b[0])||0)||(b[1].weaponType===preferred)-(a[1].weaponType===preferred));
 const [root,base]=ordered[0];rootUse.set(root,(rootUse.get(root)||0)+1);
 usedRootBuild.add(root+'|'+tag);
 let parent=root;
 for(const [id,r]of chain){
  r.parent=parent;r.evolutionRoot=root;r.weaponType=base.weaponType;r.archetype=base.archetype;
  assignBalancedBuild(r,tag,chainIndex%3===0?partner:null);
  r.name=`${base.name}・${BUILD_CATALOG[tag]}${r.unlockFloor===1000?'深淵':r.rarity}`;
  r.baseAtk=Math.round((base.baseAtk||6)*(1.1+EVOLUTION_STAGES.findIndex(s=>s.clear===r.unlockFloor)*.12));r.baseDef=base.baseDef||0;r.hp=base.hp||0;
  const source=base.quarrySource||Object.entries(MONSTER_MATERIALS).find(([,m])=>m.keys.some(k=>base.materials?.[k]))?.[0]||AREAS[0].boss.materialSource,tier=MATERIAL_MILESTONES.findIndex(m=>m.rarity===r.rarity);
  r.quarrySource=source;r.effects.quarryPower=20;
  r.materials={[r.unlockFloor===1000?'post_abyss':MONSTER_MATERIALS[source].keys[tier]]:3,abyss_core:2};
  parent=id;
 }
 chainIndex++;
}
let farmingRedistributed=0;
for(const r of Object.values(CRAFT_RECIPES))if(r.type!=='weapon'&&r.primaryBuildTag==='farming'){
 const rotation=['farming','rareMaterial','chest','safe','deep','status','speed','extraAttack'];
 const tag=rotation[farmingRedistributed++%rotation.length];if(tag==='farming')continue;
 const quarry=r.effects?.quarryPower;assignBalancedBuild(r,tag,null);if(quarry)r.effects.quarryPower=quarry;
 r.name+='・'+BUILD_CATALOG[tag];
}
// Fill only missing armor roles and accessory choices; each part has its own support role.
const SUPPORT_EFFECTS={head:{critDamage:15},armor:{guardHeal:3},arms:{skillPower:10},legs:{dodge:5},accessory:{lifestealRate:3}};
const BLOOD_SUPPORT={head:{bleedCrit:20},armor:{bleedLeech:5},arms:{bleedStacks:1},legs:{bleedDodge:10},accessory:{bleedCap:2}};
Object.assign(EQUIPMENT_EFFECTS,{bleedCrit:['出血敵への会心率','%'],bleedLeech:['出血敵への吸血率','%'],bleedStacks:['出血付与時の追加蓄積',''],bleedDodge:['出血敵からの回避率','%'],bleedCap:['出血スタック上限',''],summonPower:['影分身ダメージ','%'],extraChance:['追加攻撃確率','%']});
let balanceAddedArmor=0,balanceAddedAccessories=0;
for(const [tier,tags]of Object.entries(BUILD_TIERS))for(const tag of tags){
 const related=r=>r.primaryBuildTag===tag||(r.secondaryBuildTags||[]).includes(tag);
 const armorSlots=['head','armor','arms','legs'],needed=tier==='A'?3:tier==='B'?2:1;
 const existing=armorSlots.filter(slot=>Object.values(CRAFT_RECIPES).some(r=>r.slot===slot&&related(r)));
 const addSlots=armorSlots.filter(s=>!existing.includes(s)).slice(0,Math.max(0,needed-existing.length));
 if(tag==='bleed')for(const s of armorSlots)if(!existing.includes(s)&&!addSlots.includes(s))addSlots.push(s);
 const accCount=Object.values(CRAFT_RECIPES).filter(r=>r.slot==='accessory'&&related(r)).length;
 const accNeeded=Math.max(0,(tier==='A'?3:2)-accCount);
 for(const [i,slot]of [...addSlots,...Array(accNeeded).fill('accessory')].entries()){
  const rarity=i%2?'Rare':'Common',rank=rarity==='Rare'?1:0;
  const id=`support_${tag}_${slot}_${i}`,source=AREAS[Object.keys(BUILD_CATALOG).indexOf(tag)%AREAS.length].enemies[0].materialSource;
  const secondary=slot==='head'?'crit':slot==='armor'?'highHp':slot==='arms'?'normalAttack':slot==='legs'?'unhurt':BUILD_PARTNERS[tag];
  const r={type:slot==='accessory'?'accessory':'armor',slot,rarity,icon:EQUIPMENT_SLOTS.find(s=>s.k===slot).icon,baseAtk:0,baseDef:slot==='armor'?8:3,hp:slot==='armor'?25:8,gold:180+rank*120,materials:{[MONSTER_MATERIALS[source].keys[rank]]:5},catalogKind:'BASE'};
  assignBalancedBuild(r,tag,secondary===tag?null:secondary);
  Object.assign(r.effects,tag==='bleed'?BLOOD_SUPPORT[slot]:slot==='accessory'?[{lifestealRate:3},{guardHeal:4},{critDamage:20}][i%3]:SUPPORT_EFFECTS[slot]);
  if(tag==='summon'||secondary==='summon')r.effects.summonPower=slot==='accessory'?25:15;
  if(tag==='extraAttack'||secondary==='extraAttack')r.effects.extraChance=slot==='accessory'?10:5;
  r.name=`${BUILD_CATALOG[tag]}の${EQUIPMENT_SLOTS.find(s=>s.k===slot).label}・${slot==='accessory'?['血契','護符','鋭眼'][i%3]:'連携具'}`;
  r.desc+=' / '+effectDescription(r.effects);CRAFT_RECIPES[id]=r;EQUIPMENT_CATALOG[id]=r;
  if(slot==='accessory')balanceAddedAccessories++;else balanceAddedArmor++;
 }
}
for(const [id,effects]of Object.entries({kit_accessory_bleed_0:{bleedCap:2},kit_accessory_bleed_1:{bleedStacks:1}})){
 const r=CRAFT_RECIPES[id];if(r){Object.assign(r.effects,effects);r.desc+=' / '+effectDescription(effects);}
}
