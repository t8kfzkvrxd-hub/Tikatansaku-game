function materialKnown(key){return !!state.craftProgress.materials[key]||materialCount(key,true)>0||state.inventory.some(i=>i.type==='material'&&i.key===key);}
function materialSources(key){
 const rows=[];
 for(const area of AREAS)for(const enemy of [...area.enemies,area.elite,area.boss]){
  const table=MONSTER_MATERIALS[enemy.materialSource],tier=table?.keys.indexOf(key)??-1;
  if(tier<0&&key!=='abyss_core'&&key!=='post_abyss')continue;
  const boss=enemy===area.boss;if(key==='abyss_core'&&!boss)continue;
  const kind=boss?'boss':enemy===area.elite?'elite':'normal';
  const floors=boss?[area.max]:Array.from({length:area.max-area.min+1},(_,i)=>area.min+i).filter(f=>!isBossFloor(f)&&!isSafeReturnFloor(f));
  rows.push({area,enemy,kind,floors,chest:key!=='abyss_core'&&key!=='post_abyss',drop:key==='abyss_core'||key==='post_abyss'||!boss||tier>=2});
 }
 return rows;
}
function materialRange(floors){
 const groups=[];for(const f of floors){const last=groups.at(-1);if(last&&last[1]+1===f)last[1]=f;else groups.push([f,f]);}
 return groups.map(([a,b])=>a===b?`${a}F`:`${a}〜${b}F`).join('・');
}
function materialSourceHtml(key){
 const known=materialKnown(key),rows=materialSources(key);
 return rows.map(r=>{const seen=known&&!!state.codex.enemies[r.enemy.name];return `<div>${seen?uiEscape(r.enemy.name):'？？？'}（${{normal:'通常敵',elite:'エリート',boss:'ボス'}[r.kind]}） / ${seen?materialRange(r.floors):r.area.min+'〜'+r.area.max+'F付近'}${!r.drop?'・宝箱のみ':''}</div>`;}).join('')||'<div>入手先未登録</div>';
}
function openMaterialDetail(key,recipeId=null){
 const m=MATERIALS[key];if(!m)return;const known=materialKnown(key),rows=materialSources(key),ids=MATERIAL_RECIPES[key]||[];
 const uses=ids.slice(0,8).map(id=>`<button class="btn btn-sub btn-xs" ${recipeVisible(id)?'':'disabled'} onclick="openRecipeDetail('${id}')">${recipeVisible(id)?uiEscape(CRAFT_RECIPES[id].name):'？？？'}</button>`).join('');
 showChapterModal(known?uiEscape(m.name):'？？？',`<p>${m.rarity} / 保管 ${materialCount(key,true)}（製作可能 ${materialCount(key)}） / 探索中 ${state.inventory.filter(i=>i.key===key&&i.type==='material').length}</p><h3>入手方法・出現階層</h3>${materialSourceHtml(key)}<p>宝箱：${rows.some(r=>r.chest)?'入手可能（該当エリア）':'対象外'}</p><p>${key==='post_abyss'?'1000Fクリア後の深淵専用。通常階層では出ません。現在は将来用素材。':materialProgressionIssue(m.rarity)||'クリア実績で解禁済み（低階層へ戻っても抽選対象）。素材はレア度別の独立抽選、補正後も上位レアほど低確率。未解禁は0%、確定分は100%。'}</p><h3>主な用途（${ids.length}レシピ）</h3><div class="forge-actions">${uses||'使用レシピ未登録'}</div>`,`<button class="btn btn-sub btn-xs" onclick="openMaterialRecipes('${key}')">使用レシピ一覧</button><button class="btn btn-sub btn-xs" onclick="${recipeId?`openRecipeDetail('${recipeId}')`:`openLobbyFacility('warehouse')`}">戻る</button><button class="btn btn-sub btn-xs" onclick="closeGenericModal()">閉じる</button>`);
}
const warehouseFilters={query:'',area:'all',kind:'all',rarity:'all',sort:'acquired',page:0};
function setWarehouseFilter(key,value){if(!(key in warehouseFilters))return;warehouseFilters[key]=value;warehouseFilters.page=0;renderSubPanel();}
function warehouseControls(){
 const select=(key,label,options)=>`<label>${label}<select aria-label="倉庫${label}" onchange="setWarehouseFilter('${key}',this.value)">${options.map(([k,v])=>`<option value="${k}" ${warehouseFilters[key]===k?'selected':''}>${uiEscape(v)}</option>`).join('')}</select></label>`;
 return `<div class="forge-filters"><label>名前検索<input aria-label="倉庫検索" value="${uiEscape(warehouseFilters.query)}" onchange="setWarehouseFilter('query',this.value)"></label>${select('sort','並び順',ITEM_SORTS)}${select('rarity','レア度',[['all','すべて'],...['Common','Rare','Epic','Legendary','Mythic','Abyssal'].map(r=>[r,r])])}${storageCategory==='material'?select('area','階層帯',[['all','すべて'],...AREAS.map(a=>[String(a.id),a.min+'〜'+a.max+'F'])])+select('kind','素材分類',[['all','すべて'],['normal','通常素材'],['monster','モンスター素材'],['boss','ボス素材'],['enhance','強化素材'],['awaken','覚醒素材'],['abyss','深淵']]):''}</div>`;
}
function filteredWarehouseRows(rows){
 const f=warehouseFilters;
 return rows.filter(({it})=>{
  if(f.query&&!String(it.name).toLowerCase().includes(f.query.toLowerCase())||f.rarity!=='all'&&it.rarity!==f.rarity)return false;
  if(it.type!=='material'||storageCategory!=='material')return true;
  const sources=materialSources(it.key),recipes=(MATERIAL_RECIPES[it.key]||[]).map(id=>CRAFT_RECIPES[id]);
  if(f.area!=='all'&&!sources.some(r=>String(r.area.id)===f.area))return false;
  return f.kind==='all'||f.kind==='normal'&&sources.some(r=>r.kind==='normal')||f.kind==='monster'&&sources.some(r=>r.kind!=='boss')||f.kind==='boss'&&sources.some(r=>r.kind==='boss')||f.kind==='enhance'&&(it.materialCategory==='enhance'||it.tags?.includes('enhance'))||f.kind==='awaken'&&recipes.some(r=>r.awakening)||f.kind==='abyss'&&(it.rarity==='Abyssal'||it.key==='abyss_core');
 }).sort((a,b)=>compareItemOrder(a.it,b.it,f.sort)||a.idx-b.idx);
}
