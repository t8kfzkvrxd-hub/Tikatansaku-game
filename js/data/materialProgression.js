const MATERIAL_MILESTONES=[
 {rarity:'Common',clear:0},{rarity:'Rare',clear:0},{rarity:'Epic',clear:0},
 {rarity:'Legendary',clear:100},{rarity:'Mythic',clear:300},{rarity:'Abyssal',clear:500},
 {rarity:'Abyssal',clear:1000,key:'post_abyss',name:'深淵原質'}
];
function clearedMaterialMilestone(floor){return !floor||!!state.bossFirstKills?.[floor]||(floor===100&&!!state.chapter?.complete);}
function materialTierLimit(){let tier=2;for(let i=3;i<6;i++)if(clearedMaterialMilestone(MATERIAL_MILESTONES[i].clear))tier=i;return tier;}
function materialProgressionIssue(rarity){const rule=MATERIAL_MILESTONES.find(r=>r.rarity===rarity);return rule&&!clearedMaterialMilestone(rule.clear)?`${rule.clear}Fクリア後に解禁`:'';}
function partyChestQuality(){const companion=companionCombatUnit();return (equipmentEffects().chestQuality||0)+(companion?.hp>0?(companionStats(companion.id).effects.chestQuality||0):0);}
const MATERIAL_DROP_RATES={
 enemy:[.82,.18,.08,.04,.025,.015],
 elite:[.86,.28,.14,.06,.035,.02],
 boss:[.90,.40,.24,.10,.06,.03],
 chest:[.84,.25,.12,.05,.03,.018],
 rare_chest:[.88,.36,.20,.08,.05,.028]
};
function materialDropPlan({source='chest',limit=materialTierLimit(),floor=state.floor,quality=0,materialBonus=0,rareBonus=0,parts=[],repeat=false}={}){
 const guaranteed=[];
 if(source==='abyss'){
  const after=Array(6).fill(0);if(clearedMaterialMilestone(1000))after[5]=.01;
  return {before:[...after],after,guaranteed};
 }
 const kind=['cursed_chest','sealed_vault','rare_chest'].includes(source)?'rare_chest':source==='boss_repeat'?'boss':MATERIAL_DROP_RATES[source]?source:'chest';
 const before=[...MATERIAL_DROP_RATES[kind]],after=[...before];
 const add=(tier,p)=>{if(tier>limit)return;after[tier]=1-(1-after[tier])*(1-Math.max(0,Math.min(1,p)));};
 if(kind==='boss')guaranteed.push(Math.min(limit,3));
 if(['enemy','elite','boss'].includes(source)){
  add(source==='boss'?3:source==='elite'?1:0,Math.min(.5,materialBonus/100));
  add(2,Math.min(.25,rareBonus/100));
  for(const part of parts)if(part.tier<=limit)add(part.tier,part.rate);
 }else{
  const boost=1+Math.min(.5,Math.max(0,quality/100)+(floor>100?Math.min(.05,(floor-100)*.0005):0));
  for(let i=1;i<6;i++)after[i]*=boost;
 }
 for(let i=0;i<6;i++)after[i]=i>limit?0:Math.min(after[i],i?after[i-1]*.85:1);
 return {before,after,guaranteed};
}
function rollMaterialPlan(plan,rng=Math.random){return plan.after.flatMap((p,i)=>p>0&&rng()<p?[i]:[]);}
function materialInstance(key,source){return {...MATERIALS[key],key,type:'material',id:crypto.randomUUID(),locked:false,dropSource:source,desc:'鍛冶場で使用する製作素材'};}
function createMaterialReward(source='chest',floor=state.floor,forcedRarity=null,rng=Math.random){
 const area=AREAS.find(a=>floor>=a.min&&floor<=a.max)||AREAS[AREAS.length-1];
 const enemies=source==='boss'?[area.boss]:[...area.enemies,area.elite,area.boss];
 const enemy=enemies[Math.floor(rng()*enemies.length)],table=MONSTER_MATERIALS[enemy.materialSource];
 if(forcedRarity){const tier=Math.min(materialTierLimit(),Math.max(0,MATERIAL_MILESTONES.findIndex(r=>r.rarity===forcedRarity)));return materialInstance(table.keys[tier],source);}
 const plan=materialDropPlan({source,floor,quality:partyChestQuality()});
 const rewards=[...plan.guaranteed,...rollMaterialPlan(plan,rng)].map(t=>materialInstance(source==='abyss'?'post_abyss':table.keys[t],source));
 return {type:'material_bundle',icon:'💎',rarity:rewards.map(i=>i.rarity).join(' / ')||'—',name:rewards.map(i=>i.name).join('・')||'素材なし',rewards};
}
for(const [source,table]of Object.entries(MONSTER_MATERIALS)){
 const name=MATERIALS[table.keys[0]].source,key=source+'_abyssal';
 MATERIALS[key]={name:name+'の深淵結晶',rarity:'Abyssal',icon:'🌌',source:name};table.keys.push(key);
}
MATERIALS.post_abyss={name:'深淵原質',rarity:'Abyssal',icon:'🌑',source:'1000Fクリア後の深淵（将来用）',unlockFloor:1000};
// The historical core balance remains a currency, not a ranked equipment drop.
MATERIALS.abyss_core.rarity='Epic';
