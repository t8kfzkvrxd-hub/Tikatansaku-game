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
 const keys=[source.keys[Math.min(materialTierLimit(),tier)]];
 const companion=companionCombatUnit();
 const companionBonus=companion?.hp>0?(companionStats(companion.id).effects.materialChance||0):0;
 if(rng()*100<Math.min(50,(equipmentEffects().materialChance||0)+companionBonus))keys.push(source.keys[Math.min(materialTierLimit(),enemy.isBoss?3:enemy.isElite?1:0)]);
 if(enemy.isBoss&&rng()<.05)keys.push(source.keys[Math.min(materialTierLimit(),4)]);
 const rareBonus=(equipmentEffects().rareMaterial||0)+(companion?.hp>0?companionStats(companion.id).effects.rareMaterial||0:0)+(enemy.buildBroken&&buildTags(state.equipped).has('farming')?5:0);
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
 return [...state.storage,...Object.values(state.equipped).filter(Boolean)].filter(it=>it.key===recipe.parent && !it.locked && (!equipmentOwner(it)||equipmentOwner(it)==='player') && (Number(it.refineCount)||0)>=10);
}
function craftingIssue(id, parentId) {
 const r=CRAFT_RECIPES[id];
 if(state.screen!=='town'||!recipeVisible(id))return '未解放';
 if(materialProgressionIssue(r.rarity))return materialProgressionIssue(r.rarity);
 if(r.unlockFloor&&!clearedMaterialMilestone(r.unlockFloor))return `${r.unlockFloor}Fクリア後に解禁`;
 if(r.parent&&!craftingParents(r).some(it=>it.id===parentId))return '未ロックの親武器+10が必要';
 if(state.vaultGold<r.gold)return 'G不足';
 if(Object.entries(r.materials).some(([key,n])=>materialCount(key)<n))return '素材不足（ロック品は対象外）';
 const consumed=Object.entries(r.materials).filter(([key])=>key!=='abyss_core').reduce((sum,[,n])=>sum+n,0);
 const parentInStorage=r.parent&&state.storage.some(it=>it.id===parentId);
 if(state.storage.length-consumed-(parentInStorage?1:0)+1>state.camp.vaultSize)return '倉庫容量不足';
 return '';
}
function craftEquipment(id,parentId) {
 const issue=craftingIssue(id,parentId); if(issue){addLog(issue,'danger');return false;}
 const r=CRAFT_RECIPES[id];
 let inherited=null;
 if(r.parent) {
  const parent=craftingParents(r).find(it=>it.id===parentId);
  if(!window.confirm(`【${parent.name}】を消費して【${r.name}】へ${r.awakening?'覚醒':'派生'}します。${r.inheritRefinement?'強化値・追加特性を引き継ぎます。':'強化値・追加特性は引き継ぎません。'}よろしいですか？`))return false;
  if(r.inheritRefinement)inherited={refineCount:Math.max(0,Number(parent.refineCount)||0),affix:parent.affix,evolutionHistory:[...(parent.evolutionHistory||[]),parent.key]};
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
 normalizeEquipment(item);
 state.storage.push(item);state.craftProgress.crafted[id]=(state.craftProgress.crafted[id]||0)+1;
 recordCodex('item',item);saveState();addLog(`🔨 【${item.name}】を作成し倉庫へ保管しました。`,'gold');render();openCrafting(forgeTab);return true;
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
