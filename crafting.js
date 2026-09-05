function discoverMaterial(key) {
 state.craftProgress.materials[key]=true;
 for(const [id,r] of Object.entries(CRAFT_RECIPES)) if(r.hiddenMaterial===key && !state.craftProgress.recipes[id]) {
  state.craftProgress.recipes[id]=true; addLog(`🔨 隠し派生【${r.name}】が解放された！`,'gold');
 }
}
function dropMonsterMaterials(enemy, rng=Math.random) {
 const source=MONSTER_MATERIALS[enemy.materialSource];
 if(!source) return;
 if(enemy.isBoss)discoverMaterial('abyss_core');
 const roll=rng();
 const tier=enemy.isBoss?3:enemy.isElite?(roll<.015?4:roll<.08?3:roll<.55?2:1):(roll<.002?4:roll<.01?3:roll<.05?2:roll<.20?1:0);
 const keys=[source.keys[Math.min(materialTierLimit(),tier)],...(typeof partRewardRolls==='function'?partRewardRolls(enemy,rng):[])];
 const companion=companionCombatUnit();
 const companionBonus=companion?.hp>0?(companionStats(companion.id).effects.materialChance||0):0;
 if(rng()*100<Math.min(50,(equipmentEffects().materialChance||0)+companionBonus))keys.push(source.keys[Math.min(materialTierLimit(),enemy.isBoss?3:enemy.isElite?1:0)]);
 if(enemy.isBoss&&rng()<.05)keys.push(source.keys[Math.min(materialTierLimit(),4)]);
 const rareBonus=(equipmentEffects().rareMaterial||0)+(companion?.hp>0?companionStats(companion.id).effects.rareMaterial||0:0)+(enemy.buildBroken&&(buildTags(state.equipped).has('farming')||companion?.hp>0&&buildTags(characterEquipment(companion.id)).has('farming'))?5:0);
 if(rng()*100<Math.min(25,rareBonus))keys.push(source.keys[Math.min(materialTierLimit(),2)]);
 if(materialTierLimit()>=5&&rng()<.03)keys.push(source.keys[5]);
 if(clearedMaterialMilestone(1000)&&rng()<.05)keys.push('post_abyss');
 keys.forEach(key=>{
  discoverMaterial(key);
  const material={...MATERIALS[key],key,type:'material',id:crypto.randomUUID(),locked:false};
  state.inventory.push(material); addLog(`素材【${material.name}】[${material.rarity}]を獲得！帰還して保管しよう。`,'gold');
  showItemToast(material);
 });
 saveState();
 return keys;
}
function materialCount(key, includeLocked=false) {
 return key==='abyss_core'?state.abyssCores:state.storage.filter(it=>it.type==='material'&&it.key===key&&(includeLocked||!it.locked)).length;
}
function recipeVisible(id) { const r=CRAFT_RECIPES[id]; return r && (!r.hiddenMaterial || state.craftProgress.recipes[id]); }
function craftingParents(recipe) {
 const equipped=recipe.awakening?[state.equipped,...Object.values(state.chapter.equipment||{})]:[state.equipped];
 return [...new Map([...state.storage,...equipped.flatMap(slots=>Object.values(slots).filter(Boolean))].map(it=>[it.id,it])).values()].filter(it=>it.key===recipe.parent && !it.locked && (recipe.awakening || ((!equipmentOwner(it)||equipmentOwner(it)==='player') && (Number(it.refineCount)||0)>=10)));
}
function craftingIssue(id, parentId) {
 const r=CRAFT_RECIPES[id];
 if(state.screen!=='town'||!recipeVisible(id))return '未解放';
 if(materialProgressionIssue(r.rarity))return materialProgressionIssue(r.rarity);
 if(r.unlockFloor&&!clearedMaterialMilestone(r.unlockFloor))return `${r.unlockFloor}Fクリア後に解禁`;
 if(r.parent&&!craftingParents(r).some(it=>it.id===parentId))return r.awakening?'未ロックの覚醒元武器が必要':'未ロックの親武器+10が必要';
 if(state.vaultGold<r.gold)return 'G不足';
 if(Object.entries(r.materials).some(([key,n])=>materialCount(key)<n))return '素材不足（ロック品は対象外）';
 const parentInStorage=r.parent&&state.storage.some(it=>it.id===parentId);
 const replacingEquipped=r.awakening&&craftingParents(r).some(it=>it.id===parentId&&equipmentOwner(it));
 if(!replacingEquipped&&vaultUsed()-(parentInStorage?1:0)+1>state.camp.vaultSize)return '倉庫容量不足';
 return '';
}
function craftEquipment(id,parentId) {
 const issue=craftingIssue(id,parentId); if(issue){addLog(issue,'danger');return false;}
 const r=CRAFT_RECIPES[id];
 let inherited=null, replacement=null;
 if(r.parent) {
  const parent=craftingParents(r).find(it=>it.id===parentId);
  const level=Math.max(0,Number(parent.refineCount)||0);
  const warning=r.awakening?`覚醒すると強化値はリセットされます。\n${parent.name} +${level} → ${r.name} +0\n強化値：+${level} → +0\n${level>0?`強化値+${level}は失われます。本当に覚醒しますか？`:'覚醒しますか？'}`:`【${parent.name}】を消費して【${r.name}】へ派生します。${r.inheritRefinement?'強化値・追加特性を引き継ぎます。':'強化値・追加特性は引き継ぎません。'}よろしいですか？`;
  if(!window.confirm(warning))return false;
  if(r.inheritRefinement||r.awakening)inherited={refineCount:r.awakening?0:level,...(r.inheritRefinement?{affix:parent.affix}:{}),evolutionHistory:[...(parent.evolutionHistory||[]),parent.key]};
  if(r.awakening){
   const owner=equipmentOwner(parent),slots=owner?characterEquipment(owner):null;
   const slot=slots&&Object.keys(slots).find(k=>slots[k]?.id===parent.id);
   if(slot)replacement={slots,slot};
  }
  const at=state.storage.indexOf(parent);if(at>=0)state.storage.splice(at,1);
  else for(const slot of Object.keys(state.equipped))if(state.equipped[slot]===parent)state.equipped[slot]=null;
 }
 for(const [key,n] of Object.entries(r.materials)) {
  if(key==='abyss_core')state.abyssCores-=n;
  else for(let i=0;i<n;i++)state.storage.splice(state.storage.findIndex(it=>it.type==='material'&&it.key===key&&!it.locked),1);
 }
 state.vaultGold-=r.gold;
 const item={key:id,id:crypto.randomUUID(),name:r.name,icon:r.icon,rarity:r.rarity,type:r.type,slot:r.slot,tags:[...(r.tags||[])],effects:{...(r.effects||{})},quarrySource:r.quarrySource,crit:r.crit||0,archetype:r.archetype,baseAtk:r.baseAtk||0,baseDef:r.baseDef||0,hp:r.hp||0,desc:r.desc,craftEffect:r.craftEffect,refineCount:0,locked:['Mythic','Abyssal'].includes(r.rarity)};
 for(const [key,value]of Object.entries(r))if(!(key in item)&&!['materials','gold','parent','hiddenMaterial'].includes(key))item[key]=structuredClone(value);
 if(inherited){Object.assign(item,inherited);item.baseAtk+=inherited.refineCount*3;}
 if(r.awakening){item.refineCount=0;item.enhanceLevel=0;}
 normalizeEquipment(item);
 if(replacement)replacement.slots[replacement.slot]=item;else state.storage.push(item);
 state.craftProgress.crafted[id]=(state.craftProgress.crafted[id]||0)+1;
 recordCodex('item',item);saveState();addLog(`🔨 【${item.name}】を作成し${replacement?'装備を更新':'倉庫へ保管'}しました。`,'gold');render();openCrafting(forgeTab);return true;
}
let forgeTab='create';
function openCrafting(tab='create') {
 renderForgeUi(tab);
}
function materialCodexHtml() {
 return `<details><summary>🦴 素材図鑑</summary>${Object.entries(MATERIALS).map(([key,m])=>{
 const found=state.craftProgress.materials[key]||(m.currency&&state.abyssCores>0);
 const uses=(MATERIAL_RECIPES[key]||[]).map(id=>recipeVisible(id)?CRAFT_RECIPES[id].name:'？？？').join(' / ');
 return `<div class="item-row" style="display:block;font-size:11px">${found?m.icon+' '+m.name:'？？？'} [${m.rarity}] ${found?'発見済み / '+m.source:'未発見'}<br>所持 ${materialCount(key,true)} / 使用：${found?(uses||'現時点ではレシピなし'):'？？？'}${found?`<button class="btn btn-sub btn-xs" onclick="openMaterialRecipes('${key}')">この素材で作れる装備</button>`:''}</div>`;
 }).join('')}</details>`;
}
