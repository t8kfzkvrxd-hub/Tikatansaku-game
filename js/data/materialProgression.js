const MATERIAL_MILESTONES=[
 {rarity:'Common',clear:0},{rarity:'Rare',clear:0},{rarity:'Epic',clear:0},
 {rarity:'Legendary',clear:100},{rarity:'Mythic',clear:300},{rarity:'Abyssal',clear:500},
 {rarity:'Abyssal',clear:1000,key:'post_abyss',name:'深淵原質'}
];
function clearedMaterialMilestone(floor){return !floor||!!state.bossFirstKills?.[floor]||(floor===100&&!!state.chapter?.complete);}
function materialTierLimit(){let tier=2;for(let i=3;i<6;i++)if(clearedMaterialMilestone(MATERIAL_MILESTONES[i].clear))tier=i;return tier;}
function materialProgressionIssue(rarity){const rule=MATERIAL_MILESTONES.find(r=>r.rarity===rarity);return rule&&!clearedMaterialMilestone(rule.clear)?`${rule.clear}Fクリア後に解禁`:'';}
function partyChestQuality(){const companion=companionCombatUnit();return (equipmentEffects().chestQuality||0)+(companion?.hp>0?(companionStats(companion.id).effects.chestQuality||0):0);}
const MATERIAL_RATE_BONUS=.02;
function materialDropPlan({source='chest',limit=materialTierLimit(),floor=state.floor,quality=0,materialBonus=0,rareBonus=0,parts=[],repeat=false}={}){
 const before=Array(6).fill(0),guaranteed=[];
 if(source==='abyss'){
  const after=Array(6).fill(0);
  if(clearedMaterialMilestone(1000)){before[5]=.05;after[5]=Math.min(1,before[5]+MATERIAL_RATE_BONUS);}
  return {before,after,guaranteed};
 }
 const add=(tier,p)=>{tier=Math.min(limit,tier);before[tier]=1-(1-before[tier])*(1-Math.max(0,Math.min(1,p)));};
 if(source==='boss'){
  guaranteed.push(Math.min(limit,3));add(4,.05);
 }else if(source==='enemy'||source==='elite'){
  const distribution=source==='elite'?[0,.45,.47,.065,.015,0]:[.8,.15,.04,.008,.002,0];
  distribution.forEach((p,i)=>{before[Math.min(limit,i)]+=p;});
 }else{
  const shift=quality/100+(floor>100?Math.min(.05,(floor-100)*.0005):0);
  const intervals=source==='cursed_chest'?[[0,.2,limit],[.2,1,2]]:[[0,.05,limit],[.05,.25,2],[.25,.75,1],[.75,1,0]];
  for(const [lo,hi,tier]of intervals){const a=lo===0?0:Math.min(1,lo+shift),b=hi===1?1:Math.min(1,hi+shift);before[Math.min(limit,tier)]+=Math.max(0,b-a);}
 }
 if(source==='normal')before.forEach((p,i)=>before[i]=p*.99);
 if(['enemy','elite','boss'].includes(source)){
  add(source==='boss'?3:source==='elite'?1:0,Math.min(.5,materialBonus/100));
  add(2,Math.min(.25,rareBonus/100));
  for(const part of parts)if(part.tier<=limit)add(part.tier,part.rate);
  if(limit>=5)add(5,.03);
  if(source==='enemy'){add(0,.03*.8);add(1,.03*.2);}
  if(source==='elite'){add(1,.08*.7);add(2,.08*.3);}
  if(source==='boss'&&repeat){
   const extra=materialDropPlan({source:'chest',limit,floor,quality});
   extra.before.forEach((p,i)=>add(i,p*.1));
  }
 }
 return {before,after:before.map((p,i)=>i>limit?0:Math.min(1,p+MATERIAL_RATE_BONUS)),guaranteed};
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
