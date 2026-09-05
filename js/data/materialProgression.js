const MATERIAL_MILESTONES=[
 {rarity:'Common',clear:0},{rarity:'Rare',clear:0},{rarity:'Epic',clear:0},
 {rarity:'Legendary',clear:100},{rarity:'Mythic',clear:300},{rarity:'Abyssal',clear:500},
 {rarity:'Abyssal',clear:1000,key:'post_abyss',name:'深淵原質'}
];
function clearedMaterialMilestone(floor){return !floor||!!state.bossFirstKills?.[floor]||(floor===100&&!!state.chapter?.complete);}
function materialTierLimit(){let tier=2;for(let i=3;i<6;i++)if(clearedMaterialMilestone(MATERIAL_MILESTONES[i].clear))tier=i;return tier;}
function materialProgressionIssue(rarity){const rule=MATERIAL_MILESTONES.find(r=>r.rarity===rarity);return rule&&!clearedMaterialMilestone(rule.clear)?`${rule.clear}Fクリア後に解禁`:'';}
function createMaterialReward(source='chest',floor=state.floor,forcedRarity=null,rng=Math.random){
 const area=AREAS.find(a=>floor>=a.min&&floor<=a.max)||AREAS[AREAS.length-1];
 const enemies=source==='boss'?[area.boss]:[...area.enemies,area.elite,area.boss];
 const enemy=enemies[Math.floor(rng()*enemies.length)],table=MONSTER_MATERIALS[enemy.materialSource];
 const roll=Math.max(0,rng()-(source!=='enemy'?(equipmentEffects().chestQuality||0)/100:0)-(floor>100?Math.min(.05,(floor-100)*.0005):0)),tier=Math.min(materialTierLimit(),forcedRarity?Math.max(0,MATERIAL_MILESTONES.findIndex(r=>r.rarity===forcedRarity)):source==='cursed_chest'?Math.max(2,roll<.2?materialTierLimit():2):roll<.05?materialTierLimit():roll<.25?2:roll<.75?1:0);
 const key=table.keys[tier];return {...MATERIALS[key],key,type:'material',id:crypto.randomUUID(),locked:false,dropSource:source,desc:'鍛冶場で使用する製作素材'};
}
for(const [source,table]of Object.entries(MONSTER_MATERIALS)){
 const name=MATERIALS[table.keys[0]].source,key=source+'_abyssal';
 MATERIALS[key]={name:name+'の深淵結晶',rarity:'Abyssal',icon:'🌌',source:name};table.keys.push(key);
}
MATERIALS.post_abyss={name:'深淵原質',rarity:'Abyssal',icon:'🌑',source:'1000Fクリア後',unlockFloor:1000};
// The historical core balance remains a currency, not a ranked equipment drop.
MATERIALS.abyss_core.rarity='Epic';
