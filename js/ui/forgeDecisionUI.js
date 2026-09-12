const FORGE_BRANCH_LABELS={ready:'今すぐ進める',materials:'素材を集めれば進める',prepare:'準備が必要',future:'将来解禁'};
function forgeBranchState(id){
 const r=CRAFT_RECIPES[id];if(!r)return {group:'future',text:'未登録'};
 const locked=materialProgressionIssue(r.rarity)||(r.unlockFloor&&!clearedMaterialMilestone(r.unlockFloor)?`${r.unlockFloor}Fボス撃破後に解禁`:'')||(!recipeVisible(id)?'施設・進行解禁が必要':'');
 if(locked)return {group:'future',text:locked};
 const issue=craftingIssue(id,craftingParents(r)[0]?.id);return {group:!issue?'ready':issue.startsWith('素材不足')?'materials':'prepare',text:issue||'素材・G・親装備の条件を満たしています'};
}
function forgeBranchSummary(id){const r=CRAFT_RECIPES[id],s=forgeBranchState(id);return `<span><b>${forgeRecipeRevealed(id)?uiEscape(r.name):'？？？'}</b> / ${uiEscape(s.text)}</span>`;}
forgeNextPreview=function(id){
 const children=FORGE_CHILDREN[id]||[];if(!children.length)return '<div class="forge-next-preview">登録済みの最終派生</div>';
 return `<div class="forge-next-preview">${Object.keys(FORGE_BRANCH_LABELS).map(group=>{const rows=children.filter(n=>forgeBranchState(n.id).group===group);return rows.length?`${group==='future'?'<details><summary>将来解禁 '+rows.length+'件</summary>':'<b>'+FORGE_BRANCH_LABELS[group]+'</b>'}${rows.slice(0,2).map(n=>forgeBranchSummary(n.id)).join('')}${group==='future'?'</details>':''}`:'';}).join('')}</div>`;
};
function forgeEmptyAdvice(){
 const weapon=characterEquipment(forgeFilters.character)?.weapon,candidates=FORGE_INDEX.filter(n=>n.r.type==='weapon'&&recipeVisible(n.id)&&(!n.r.parent||craftingParents(n.r).length));
 if(vaultUsed()>=state.camp.vaultSize)return {reason:'倉庫が満杯です',label:'倉庫を整理する',action:"openLobbyFacility('warehouse')"};
 const material=candidates.find(n=>forgeBranchState(n.id).group==='materials');
 if(material)return {reason:'作成候補の素材が不足しています',label:'不足素材・入手先を見る',action:`openRecipeDetail('${material.id}')`};
 const gold=candidates.find(n=>forgeBranchState(n.id).text==='G不足');
 if(gold)return {reason:`作成にはGが不足しています（必要 ${gold.r.gold}G）`,label:'Gを集めに探索へ',action:"openLobbyFacility('town-expedition')"};
 const locked=(FORGE_CHILDREN[weapon?.key]||[]).find(n=>forgeBranchState(n.id).group==='future');
 if(locked)return {reason:'次の派生：'+forgeBranchState(locked.id).text,label:'探索へ',action:"openLobbyFacility('town-expedition')"};
 if(weapon&&(facilityTier()<2||(weapon.refineCount||0)>=10))return {reason:facilityTier()<2?'武器強化は10Fクリア後に解禁します':'今の武器は強化上限です。新たな派生の解禁を目指せます',label:'探索へ',action:"openLobbyFacility('town-expedition')"};
 if(weapon)return {reason:'現在の条件では次のおすすめ武器がありません',label:'今の武器の強化条件を見る',action:"openCrafting('refine')"};
 return {reason:'現在の装備から近い完成候補はありません',label:'ビルド候補を見る',action:`openCompletedBuilds('${forgeFilters.character}')`};
}
function forgeEmptyHtml(){const a=forgeEmptyAdvice();return `<p>${uiEscape(a.reason)}</p><button class="btn btn-gold" onclick="${a.action}">${a.label}</button><details><summary>上級者向け</summary><button class="btn btn-sub" onclick="selectForgeView('all')">すべてを見る</button></details>`;}
function forgeFutureGroups(id){
 const slots=characterEquipment(forgeFilters.character),r=CRAFT_RECIPES[id],after=completedBuildState({...slots,weapon:r}),tags=buildTags({weapon:r});
 return weaponBuildFutures(id).map(b=>{const n=after.find(x=>x.id===b.id),close=!n.locked&&n.missing.length===1&&!n.missingRoles.length;return {build:b,after:n,group:forgeBranchState(id).group==='future'?'将来的に関連する':n.active?'この装備で構成完成':close?'この装備であと1タグ':b.requiredTags.some(t=>tags.has(t))?'相性あり':'将来的に関連する'};});
}
weaponFuturesHtml=function(id){return `<details><summary>完成ビルドとの関係（武器だけでは完成しません）</summary>${forgeFutureGroups(id).map(({build:b,after:n,group})=>`<p><b>${group}</b><br><button class="btn btn-sub" onclick="openCompletedBuilds('${forgeFilters.character}','${b.id}')">《${b.name}》</button><br>この武器に替えた場合：不足 ${n.missing.length}タグ / 不足部位 ${n.missingRoles.length}${n.locked?' / 主効果未解禁':''}</p>`).join('')}</details>`;};
