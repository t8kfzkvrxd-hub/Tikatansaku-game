const FORGE_PAGE_SIZE=12;
const FORGE_PARTS=[['all','すべて'],['weapon','武器'],['head','頭'],['armor','胴'],['arms','腕'],['legs','脚'],['accessory','アクセ']];
const FORGE_WEAPONS=[['all','すべて'],...Object.entries(WEAPON_TYPES).map(([id,r])=>[id,r.name]),['other','その他']];
const FORGE_TAG_NAMES={poison:'毒',fire:'炎',crit:'会心',guard:'ガード 防御',dodge:'回避',break:'部位破壊',boss:'ボス',beast:'獣',machine:'機械 古代',abyss:'深淵',farming:'素材 周回',desperate:'瀕死',skill:'スキル'};
function uiEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const FORGE_INDEX=Object.entries(CRAFT_RECIPES).map(([id,r])=>({id,r,category:r.weaponType||'other',search:[r.name,r.desc,...(r.tags||[]).flatMap(t=>[t,BUILD_CATALOG[t]||FORGE_TAG_NAMES[t]||'']),...Object.keys(r.materials).map(k=>MATERIALS[k]?.name||k)].join(' ').toLowerCase()}));
const MATERIAL_RECIPES={};
FORGE_INDEX.forEach(({id,r})=>Object.keys(r.materials).forEach(key=>(MATERIAL_RECIPES[key] ||= []).push(id)));
let forgeFilters={part:'all',weapon:'all',rarity:'all',available:false,uncrafted:false,newOnly:false,favorite:false,query:'',material:null,page:0,character:'player',accessory:'accessory'};
function forgeProgress(){state.craftProgress.favorites ||= {};state.craftProgress.seen ||= {};return state.craftProgress;}
function forgeOwnership(){return [...state.storage,...state.inventory,...Object.values(state.equipped),...Object.values(state.chapter?.equipment||{}).flatMap(slots=>Object.values(slots))].filter(Boolean);}
function filteredForgeRecipes(){
 const p=forgeProgress(),f=forgeFilters,query=f.query.trim().toLowerCase();
 return FORGE_INDEX.filter(({id,r,category,search})=>{
  if(forgeTab==='awaken'&&!r.awakening||forgeTab==='tree'&&!r.parent||forgeTab==='create'&&r.parent)return false;
  if(f.part!=='all'&&equipmentSlot(r)!==f.part||f.weapon!=='all'&&(r.type!=='weapon'||category!==f.weapon)||f.rarity!=='all'&&r.rarity!==f.rarity)return false;
  if(f.material&&!r.materials[f.material])return false;
  const visible=recipeVisible(id);
  if(query&&(!visible||!search.includes(query)))return false;
  if(f.uncrafted&&p.crafted[id]||f.favorite&&!p.favorites[id]||f.newOnly&&(!visible||p.seen[id]))return false;
  if(f.available&&(!visible||craftingIssue(id,craftingParents(r)[0]?.id)))return false;
  return true;
 });
}
function setForgeFilter(key,value){if(!(key in forgeFilters))return;forgeFilters[key]=value;forgeFilters.page=0;renderForgeResults();}
function forgePage(delta){forgeFilters.page+=delta;renderForgeResults();document.getElementById('forge-results')?.scrollIntoView({block:'nearest'});}
function toggleRecipeFavorite(id){const p=forgeProgress();p.favorites[id]=!p.favorites[id];saveState();renderForgeResults();}
function acknowledgeRecipes(){const p=forgeProgress();filteredForgeRecipes().slice(forgeFilters.page*FORGE_PAGE_SIZE,(forgeFilters.page+1)*FORGE_PAGE_SIZE).forEach(({id})=>{if(recipeVisible(id))p.seen[id]=true;});saveState();renderForgeResults();}
function forgeMaterialHtml(recipe){return Object.entries(recipe.materials).map(([key,n])=>`<div class="${materialCount(key)<n?'forge-missing':'forge-ready'}">${uiEscape(MATERIALS[key]?.name||key)}：${materialCount(key)} / ${n}${materialCount(key)<n?' 不足':''}</div>`).join('')||'<div>素材不要</div>';}
function forgeStatus(id,r){
 if(!recipeVisible(id))return '🔒 未発見';
 const badges=[];
 if(forgeOwnership().some(i=>i.key===id))badges.push('🎒 所持');
 if(state.craftProgress.crafted[id])badges.push('✓ 作成済み');
 const issue=craftingIssue(id,craftingParents(r)[0]?.id);badges.push(issue?'△ '+issue:'● 作成可能');return badges.join(' / ');
}
function recipeCardHtml(id,r){
 if(!recipeVisible(id))return `<article class="forge-recipe" data-recipe="${id}"><h3>${recipeVisible(r.parent)?uiEscape(CRAFT_RECIPES[r.parent].name):'？？？'} → ？？？</h3><p>🔒 未発見：特殊素材を発見すると解放</p></article>`;
 const p=forgeProgress(),parent=craftingParents(r)[0],issue=craftingIssue(id,parent?.id),label=EQUIPMENT_SLOTS.find(s=>s.k===equipmentSlot(r))?.label||r.type;
 return `<article class="forge-recipe r-${r.rarity}" data-recipe="${id}"><h3>${r.parent?`${uiEscape(CRAFT_RECIPES[r.parent].name)} +10 → `:''}${r.icon} ${uiEscape(r.name)}</h3><div>${r.rarity} / ${label}${r.primaryBuildTag?` / ${BUILD_CATALOG[r.primaryBuildTag]}（${WEAPON_TYPES[r.weaponType]?.name||r.weaponType}）`:""}　${forgeStatus(id,r)} ${!p.seen[id]?'🆕 新規解放':''}</div><div>${uiEscape(getItemStatSummary(r))}</div><div>${uiEscape(r.desc)} / ${uiEscape(effectDescription(r.effects))}</div>${forgeMaterialHtml(r)}<div class="${state.vaultGold<r.gold?'forge-missing':''}">必要G ${r.gold} / 所持 ${state.vaultGold}</div><div class="forge-actions"><button class="btn btn-gold btn-xs" onclick="openRecipeDetail('${id}')">${r.parent?'派生比較・詳細':'現在装備と比較・詳細'}</button>${!r.parent?`<button class="btn btn-sub btn-xs" ${issue?'disabled':''} onclick="craftEquipment('${id}')">${issue||'作成'}</button>`:''}<button class="btn btn-sub btn-xs" aria-pressed="${!!p.favorites[id]}" onclick="toggleRecipeFavorite('${id}')">${p.favorites[id]?'★':'☆'} お気に入り</button></div></article>`;
}
function renderForgeResults(){
 const target=document.getElementById('forge-results');if(!target)return;
 const rows=filteredForgeRecipes(),pages=Math.max(1,Math.ceil(rows.length/FORGE_PAGE_SIZE));forgeFilters.page=Math.min(Math.max(0,forgeFilters.page),pages-1);
 target.innerHTML=`<p role="status">${rows.length}件 / ${forgeFilters.page+1}ページ目（最大${FORGE_PAGE_SIZE}件表示）${forgeFilters.material?' / 素材逆引き：'+uiEscape(MATERIALS[forgeFilters.material]?.name):''}</p>${rows.slice(forgeFilters.page*FORGE_PAGE_SIZE,(forgeFilters.page+1)*FORGE_PAGE_SIZE).map(({id,r})=>recipeCardHtml(id,r)).join('')||'<p>条件に一致するレシピはありません。</p>'}`;
 document.getElementById('forge-paging').innerHTML=`<button class="btn btn-sub btn-xs" ${!forgeFilters.page?'disabled':''} onclick="forgePage(-1)">前へ</button><span>${forgeFilters.page+1}/${pages}</span><button class="btn btn-sub btn-xs" ${forgeFilters.page+1>=pages?'disabled':''} onclick="forgePage(1)">次へ</button><button class="btn btn-sub btn-xs" onclick="acknowledgeRecipes()">このページを確認済みに</button>`;
}
function renderForgeUi(tab='create'){
 if(!['create','refine','tree','awaken','uses'].includes(tab))tab='create';
 if(forgeTab!==tab)forgeFilters.page=0;forgeTab=tab;
 const nav=[['create','作成'],['refine','強化'],['tree','武器ツリー'],['awaken','覚醒'],...(forgeFilters.material?[['uses','素材の使用先']]:[])].map(([key,label])=>`<button class="btn btn-${tab===key?'gold':'sub'} btn-xs" onclick="openCrafting('${key}')">${label}</button>`).join('');
 const select=(key,label,options)=>`<label>${label}<select aria-label="${label}" onchange="setForgeFilter('${key}',this.value)">${options.map(([k,l])=>`<option value="${k}" ${forgeFilters[key]===k?'selected':''}>${l}</option>`).join('')}</select></label>`;
 const filters=`<div class="forge-filters"><label class="forge-search">名前・素材名・タグで検索<input aria-label="レシピ検索" value="${uiEscape(forgeFilters.query)}" placeholder="毒 / 蜘蛛 / guard" oninput="setForgeFilter('query',this.value)"></label>${select('part','部位',FORGE_PARTS)}${select('weapon','武器カテゴリ',FORGE_WEAPONS)}${select('rarity','レアリティ',[['all','すべて'],...['Common','Rare','Epic','Legendary','Mythic','Abyssal'].map(k=>[k,k])])}</div><div class="forge-actions">${[['available','作成可能のみ'],['uncrafted','未作成のみ'],['newOnly','新規解放'],['favorite','お気に入り']].map(([k,l])=>`<label><input type="checkbox" ${forgeFilters[k]?'checked':''} onchange="setForgeFilter('${k}',this.checked)"> ${l}</label>`).join('')}<button class="btn btn-sub btn-xs" onclick="resetForgeFilters()">絞り込み解除</button></div>`;
 showChapterModal('🔨 鍛冶屋',`<nav class="forge-actions">${nav}</nav>${tab==='refine'?forgeRefineHtml():`<p style="font-size:12px">倉庫の未ロック素材を使用。親武器+10を消費。通常派生は+0、上位進化は強化値・追加特性を継承します。吸血は与ダメージ比例（率25%・最大HP8%上限）。ボスは半減し30Tで無効化。</p><details class="forge-filter-panel" ${window.innerWidth>=600?'open':''}><summary>🔎 検索・絞り込み（部位 / レア度など）</summary>${filters}</details><div id="forge-results"></div>`}`,`${tab!=='refine'?'<div id="forge-paging" class="forge-actions"></div>':''}<button class="btn btn-sub btn-xs" onclick="closeGenericModal()">閉じる</button>`);
 if(tab!=='refine')renderForgeResults();
}
function resetForgeFilters(){forgeFilters={...forgeFilters,part:'all',weapon:'all',rarity:'all',available:false,uncrafted:false,newOnly:false,favorite:false,query:'',material:null,page:0};openCrafting(forgeTab);}
function forgeRefineHtml(){
 const id=characterEquipment(forgeFilters.character)?forgeFilters.character:'player',slots=characterEquipment(id);
 const chars=[['player','主人公'],...Object.keys(state.chapter.owned).filter(k=>state.chapter.owned[k]).map(k=>[k,CHARACTER_DATA[k]?.name||k])];
 return `<p>強化は+10まで。キャラごとの装備を鍛錬できます。</p><div class="forge-actions">${chars.map(([k,l])=>`<button class="btn btn-${id===k?'gold':'sub'} btn-xs" onclick="forgeFilters.character='${k}';openCrafting('refine')">${uiEscape(l)}</button>`).join('')}</div>${state.camp.blacksmith<2?'<p>🔒 鍛冶屋Lv2で解放</p>':EQUIPMENT_SLOTS.map(s=>{const i=slots[s.k];return i?`<article class="forge-recipe">${s.label}：${uiEscape(i.name)}<div>${uiEscape(getItemStatSummary(i))}</div><button class="btn btn-gold btn-xs" ${i.refineCount>=10||state.vaultGold<getRefineCost(i)?'disabled':''} onclick="refineCharacterItem('${id}','${s.k}')">${i.refineCount>=10?'MAX +10':`強化 ${getRefineCost(i)}G`}</button></article>`:'';}).join('')}`;
}
function refineCharacterItem(id,slot){if(state.screen!=='town'||state.camp.blacksmith<2)return;const item=characterEquipment(id)?.[slot];if(!item)return;refineEquipmentItem(item,slot);openCrafting('refine');}
function openRecipeDetail(id,parentId){
 const r=CRAFT_RECIPES[id];if(!recipeVisible(id))return;
 const parents=r.parent?craftingParents(r):[],parent=parents.find(i=>i.id===parentId)||parents[0],issue=craftingIssue(id,parent?.id);
 const slots=characterEquipment(forgeFilters.character)||state.equipped;
 const slot=r.type==='accessory'?forgeFilters.accessory:equipmentSlot(r),current=r.parent?(parent||CRAFT_RECIPES[r.parent]):slots[slot];
 const characters=[['player','主人公'],...Object.keys(state.chapter.owned).filter(k=>state.chapter.owned[k]).map(k=>[k,CHARACTER_DATA[k]?.name||k])];
 const compareSelect=!r.parent?`<label>比較対象 <select aria-label="比較キャラ" onchange="forgeFilters.character=this.value;openRecipeDetail('${id}')">${characters.map(([k,l])=>`<option value="${k}" ${forgeFilters.character===k?'selected':''}>${uiEscape(l)}</option>`).join('')}</select></label>${r.type==='accessory'?`<select aria-label="比較アクセ枠" onchange="forgeFilters.accessory=this.value;openRecipeDetail('${id}')"><option value="accessory" ${slot==='accessory'?'selected':''}>アクセ1</option><option value="accessory2" ${slot==='accessory2'?'selected':''}>アクセ2</option></select>`:''}`:'';
 showChapterModal(`${r.icon} ${uiEscape(r.name)}`,`<article class="forge-recipe"><p>${r.rarity} / ${EQUIPMENT_SLOTS.find(s=>s.k===equipmentSlot(r))?.label}</p>${r.parent?`<p>必要強化：+10（親武器と素材を消費）${parent?'':' / 親武器未所持：比較元は未強化の基礎性能'}</p><select id="parent-${id}" aria-label="消費する親武器" onchange="openRecipeDetail('${id}',this.value)">${parents.map(i=>`<option value="${i.id}" ${i.id===parent?.id?'selected':''}>${uiEscape(i.name)} / ${equipmentOwner(i)==='player'?'主人公装備中':'倉庫'}</option>`).join('')}</select>`:compareSelect}${compareEquipmentHtml(current,r.inheritRefinement&&parent?{...r,baseAtk:(r.baseAtk||0)+(parent.refineCount||0)*3,affix:parent.affix}:r)}${forgeMaterialHtml(r)}<p>必要G ${r.gold} / 所持 ${state.vaultGold}</p><p>${uiEscape(issue||'作成可能')}</p></article>`,`<button class="btn btn-gold btn-xs" ${issue?'disabled':''} onclick="craftEquipment('${id}',document.getElementById('parent-${id}')?.value)">${r.awakening?'覚醒':r.parent?'派生':'作成'}</button><button class="btn btn-sub btn-xs" onclick="openCrafting('${forgeTab}')">一覧へ戻る</button><button class="btn btn-sub btn-xs" onclick="closeGenericModal()">閉じる</button>`);
}
function openMaterialRecipes(key){
 if(!MATERIALS[key])return;
 forgeFilters={...forgeFilters,part:'all',weapon:'all',rarity:'all',available:false,uncrafted:false,newOnly:false,favorite:false,query:'',material:key,page:0};
 openCrafting('uses');
 const target=document.getElementById('forge-results');
 target.insertAdjacentHTML('beforebegin','<p>この素材で作れる装備：派生は「武器ツリー」、最終形態は「覚醒」でも確認できます。</p>');
}
function visitTownSection(id){
 if(document.body.classList.contains('at-lobby')){openLobbyFacility(id);return;}
 closeGenericModal();
 if(id==='warehouse'){setTab('bag');document.getElementById('sub-panel').scrollIntoView({behavior:'smooth',block:'start'});return;}
 const target=document.getElementById(id);if(target){for(let p=target;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;target.scrollIntoView({behavior:'smooth',block:'start'});}
}
function townShortcutsHtml(){return `<nav class="home-shortcuts" aria-label="地上の行き先"><button class="btn btn-gold" onclick="visitTownSection('town-expedition')">🪜 地下迷宮へ<br><small>支援・開始地点を選ぶ</small></button><button class="btn btn-sub" onclick="openCrafting('create')">🔨 鍛冶屋<br><small>作成・強化・派生</small></button><button class="btn btn-sub" onclick="visitTownSection('town-shop')">🏪 道具屋</button><button class="btn btn-sub" onclick="visitTownSection('town-tavern')">🍺 酒場</button><button class="btn btn-sub" onclick="visitTownSection('warehouse')">📦 倉庫</button><button class="btn btn-sub" onclick="visitTownSection('town-lab')">🔬 研究所</button><button class="btn btn-sub" onclick="openMemoryArchive()">📖 記憶の書庫</button><button class="btn btn-sub" onclick="openCharacterEquipment()">👥 キャラ／装備</button></nav>`;}
