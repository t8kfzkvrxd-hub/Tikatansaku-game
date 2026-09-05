const MATERIALS = { abyss_core: {name:'深淵の核',rarity:'Mythic',icon:'💠',source:'階層ボス',currency:true} };
const MONSTER_MATERIALS = {};
const CRAFT_RECIPES = {
 iron_sword:{name:'鉄の剣',icon:'⚔️',rarity:'Common',type:'weapon',baseAtk:12,gold:35,materials:{},desc:'派生の起点',archetype:'sword'}
};
const CRAFT_THEMES = [
 {prefix:'坑道',normal:'骨刃',rare:'略奪剣',upper:'狂牙剣',boss:'巨人砕き',hidden:'王殺しの略奪剣'},
 {prefix:'古代',normal:'石刃',rare:'機甲剣',upper:'雷光機甲剣',boss:'守護者の雷剣',hidden:'終焉機甲剣'},
 {prefix:'変異',normal:'細胞刃',rare:'血牙剣',upper:'再生血剣',boss:'完全体の血刃',hidden:'禁忌血刃'},
 {prefix:'森林',normal:'根刃',rare:'毒牙剣',upper:'古森の剣',boss:'母樹の霊剣',hidden:'世界樹の牙'},
 {prefix:'水底',normal:'鱗刃',rare:'潮流剣',upper:'深海剣',boss:'ネレウスの王剣',hidden:'海淵の神剣'},
 {prefix:'胎動',normal:'肉骨刃',rare:'神経剣',upper:'脈動剣',boss:'深淵胎動剣',hidden:'終焉の心剣'}
];
AREAS.forEach((area, i) => {
 const theme=area.craftTheme||CRAFT_THEMES[i];
 [...area.enemies,area.elite,area.boss].forEach((enemy,j) => {
  const id=`area_${area.id}_enemy_${j}`;
  enemy.materialSource=id;
  const boss=enemy===area.boss;
  const keys=['common','rare','epic','legendary','mythic'];
  const parts=boss?['欠片','魔核','心臓','固有核','完全魂核']:['牙片','皮膜','特殊器官','完全魔核','原初心臓'];
  MONSTER_MATERIALS[id]={boss,keys:keys.map((tier,k)=>{
   const key=`${id}_${tier}`;
   MATERIALS[key]={name:`${enemy.name.replace(/[【】]/g,'')}の${parts[k]}`,rarity:['Common','Rare','Epic','Legendary','Mythic'][k],icon:boss?'🔮':'🦴',source:enemy.name};
   return key;
  })};
 });
 const common=area.enemies[0].materialSource+'_common', rare=area.enemies[1].materialSource+'_rare', epic=area.elite.materialSource+'_epic', boss=area.boss.materialSource+'_legendary', secret=area.elite.materialSource+'_mythic';
 const stem=`forge_${area.id}`;
 const defs=[
  ['normal',theme.normal,'Common','iron_sword',{[common]:3},18+i*14],
  ['rare',theme.rare,'Rare',stem+'_normal',{[rare]:2},24+i*17],
  ['upper',theme.upper,'Epic',stem+'_rare',{[epic]:2,abyss_core:1},38+i*20],
  ['awaken',theme.boss,'Legendary',stem+'_upper',{[boss]:2,abyss_core:3},62+i*25],
  ['hidden',theme.hidden,'Mythic',stem+'_rare',{[secret]:1,[boss]:1,abyss_core:5},80+i*28]
 ];
 defs.forEach(([stage,name,rarity,parent,materials,baseAtk],n)=>{
  CRAFT_RECIPES[stem+'_'+stage]={name,icon:n>=3?'🔥':'⚔️',rarity,type:'weapon',archetype:n===1?'dagger':'sword',parent,materials,baseAtk,gold:80+(i*80)+(n*100),awakening:n>=3,hiddenMaterial:n===4?secret:null,craftEffect:n===1?'elite_hunter':n===2?'desperate':null,desc:n===1?'Eliteへの攻撃力+150%':n===2?'HP35%以下で攻撃力+100%':n>=3?'ボス素材による最終形態':'鍛錬+10から次の派生へ'};
 });
 CRAFT_RECIPES[stem+'_armor']={name:theme.prefix+'の装甲',icon:'🛡️',rarity:'Rare',type:'armor',baseDef:8+i*5,hp:20+i*10,gold:100+i*80,materials:{[common]:4,[rare]:1},desc:'防御と最大HPを強化'};
});

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
 const keys=[source.keys[tier]];
 if(rng()*100<Math.min(50,equipmentEffects().materialChance||0))keys.push(source.keys[enemy.isBoss?3:enemy.isElite?1:0]);
 if(enemy.isBoss&&rng()<.05)keys.push(source.keys[4]);
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
 if(r.parent) {
  const parent=craftingParents(r).find(it=>it.id===parentId);
  if(!window.confirm(`【${parent.name}】を消費して【${r.name}】へ${r.awakening?'覚醒':'派生'}します。強化値・追加特性は引き継ぎません。よろしいですか？`))return false;
  const at=state.storage.indexOf(parent);if(at>=0)state.storage.splice(at,1);
  else for(const slot of Object.keys(state.equipped))if(state.equipped[slot]===parent)state.equipped[slot]=null;
 }
 for(const [key,n] of Object.entries(r.materials)) {
  if(key==='abyss_core')state.abyssCores-=n;
  else for(let i=0;i<n;i++)state.storage.splice(state.storage.findIndex(it=>it.type==='material'&&it.key===key&&!it.locked),1);
 }
 state.vaultGold-=r.gold;
 const item={key:id,id:crypto.randomUUID(),name:r.name,icon:r.icon,rarity:r.rarity,type:r.type,slot:r.slot,tags:[...(r.tags||[])],effects:{...(r.effects||{})},quarrySource:r.quarrySource,crit:r.crit||0,archetype:r.archetype,baseAtk:r.baseAtk||0,baseDef:r.baseDef||0,hp:r.hp||0,desc:r.desc,craftEffect:r.craftEffect,refineCount:0,locked:['Mythic','Abyssal'].includes(r.rarity)};
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
