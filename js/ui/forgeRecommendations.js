const FORGE_VIEWS=[['recommended','おすすめ'],['available','作成可能'],['build','ビルド'],['weapon','武器'],['armor','防具'],['accessory','アクセ'],['all','すべて']];
let forgeView='recommended';
function buildChangeSummary(slots,slot,item){
 const before=completedBuildState(slots),after=completedBuildState({...slots,[slot]:item});
 const gained=after.filter(b=>b.active&&!before.find(p=>p.id===b.id).active),lost=before.filter(b=>b.active&&!after.find(p=>p.id===b.id).active);
 return `<p>${gained.length?'完成：'+gained.map(b=>'《'+b.name+'》').join('・'):'完成ビルドの新規成立なし'}${lost.length?'<br>解除：'+lost.map(b=>'《'+b.name+'》').join('・'):''}</p>`;
}
function forgeBuildOverview(id=forgeFilters.character){
 const slots=characterEquipment(id)||state.equipped,counts={};
 for(const item of Object.values(slots).filter(Boolean))if(item.primaryBuildTag)counts[item.primaryBuildTag]=(counts[item.primaryBuildTag]||0)+1;
 const primary=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||a.localeCompare(b));
 const builds=completedBuildState(slots),near=builds.filter(b=>!b.configured).sort((a,b)=>(a.missing.length+a.missingRoles.length)-(b.missing.length+b.missingRoles.length))[0];
 return {slots,primary,builds,near};
}
function forgeOverviewHtml(id=forgeFilters.character){
 const v=forgeBuildOverview(id),b=v.near,active=v.builds.filter(b=>b.active);
 return `<details class="forge-overview"><summary>方向性：${v.primary.slice(0,2).map(t=>uiEscape(BUILD_CATALOG[t])).join('・')||'未装備の部位を整える'} / ${active.length?active.slice(0,2).map(b=>'《'+b.name+'》').join('・')+(active.length>2?' 他'+(active.length-2)+'件':''):'完成 0件'}</summary><p>完成：${active.slice(0,2).map(b=>'《'+b.name+'》').join('・')||'なし'}</p>${b?`<p>次の候補《${b.name}》 ${b.requiredTags.length-b.missing.length}/${b.requiredTags.length}タグ${b.missing.length?' / 不足：'+b.missing.map(t=>BUILD_CATALOG[t]).join('・'):''}${b.missingRoles.length?' / 武器・防具・アクセの構成も必要':''}</p>`:''}<button class="btn btn-sub btn-xs" onclick="openCompletedBuilds('${id}')">完成条件を詳しく見る</button></details>`;
}
function forgeRecommendations(id=forgeFilters.character,limit=5){
 const {slots,primary,builds}=forgeBuildOverview(id),counts=new Map(),owned=new Set(forgeOwnership().map(i=>i.key));
 const count=k=>{if(!counts.has(k))counts.set(k,materialCount(k));return counts.get(k);};
 const candidates=[];
 for(const {id:recipeId,r} of FORGE_INDEX){
  if(!recipeVisible(recipeId)||materialProgressionIssue(r.rarity)||(r.unlockFloor&&!clearedMaterialMilestone(r.unlockFloor)))continue;
  const parents=craftingParents(r),issue=craftingIssue(recipeId,parents[0]?.id);
  if(issue&&!issue.startsWith('素材不足'))continue;
  const missing=Object.entries(r.materials).map(([key,n])=>({key,need:n,owned:count(key),missing:Math.max(0,n-count(key))}));
  const deficit=missing.reduce((n,m)=>n+m.missing,0);
  if(deficit>5)continue;
  const slotOptions=r.type==='accessory'?['accessory','accessory2']:[equipmentSlot(r)];
  let best=null;
  for(const slot of slotOptions){
   const old=slots[slot],next=completedBuildState({...slots,[slot]:r});
   const completed=next.find(b=>b.active&&!builds.find(p=>p.id===b.id)?.active);
   const closer=next.find(b=>!b.locked&&b.missing.length===1&&b.missingRoles.length===0&&builds.find(p=>p.id===b.id).missing.length>1);
   const delta={atk:(r.baseAtk||0)-(old?.baseAtk||0),def:(r.baseDef||0)-(old?.baseDef||0),hp:(r.hp||0)-(old?.hp||0)};
   const improves=delta.atk>0||delta.def>0||delta.hp>0,maintains=builds.filter(b=>b.active).every(b=>next.find(n=>n.id===b.id)?.active);
   let rank=0,reason='';
   if(completed){rank=6;reason=`《${completed.name}》が完成します`;}
   else if(closer){rank=5;reason=`《${closer.name}》まであと1タグ`;}
   else if(primary[0]&&r.primaryBuildTag===primary[0]&&improves){rank=4;reason=`${BUILD_CATALOG[primary[0]]}の方向性を維持して基礎能力を改善`;}
   else if(improves&&old){rank=3;reason='現在装備から基礎能力を改善';}
   else if(!owned.has(recipeId)&&r.primaryBuildTag&&!primary.includes(r.primaryBuildTag)){rank=2;reason=`${BUILD_CATALOG[r.primaryBuildTag]}ビルドを始める候補`;}
   else if(!old){rank=1;reason=`未装備の${EQUIPMENT_SLOTS.find(s=>s.k===slot)?.label||slot}を補います`;}
   if(!rank||old?.key===recipeId||!maintains)continue;
   const candidate={id:recipeId,r,slot,reason,rank,deficit,missing,delta,ready:!issue};
   if(!best||candidate.rank>best.rank)best=candidate;
  }
  if(best)candidates.push(best);
 }
 return candidates.sort((a,b)=>Number(b.ready)-Number(a.ready)||b.rank-a.rank||a.deficit-b.deficit||a.id.localeCompare(b.id)).slice(0,limit);
}
function selectForgeView(view){
 if(!FORGE_VIEWS.some(([id])=>id===view))return;
 forgeView=view;forgeFilters.page=0;
 Object.assign(forgeFilters,{part:'all',weapon:'all',build:'all',available:false,material:null,query:'',rarity:'all',favorite:false,uncrafted:false,newOnly:false});
 if(view==='available')forgeFilters.available=true;
 if(['weapon','accessory'].includes(view))forgeFilters.part=view;
 if(view==='build')forgeFilters.build=forgeBuildOverview().primary[0]||'all';
 openCrafting('create');
}
function forgeRecommendationHtml(row){
 const {id,r,reason,delta,missing,deficit}=row;
 return `<article class="forge-recipe forge-recommendation" data-recipe="${id}"><h3>${uiEscape(r.name)}</h3><p class="forge-reason">${uiEscape(reason)}</p><p>${r.rarity} / 基礎能力差 ${[['atk','ATK'],['def','DEF'],['hp','HP']].map(([k,n])=>`${n} ${delta[k]>0?'+':''}${delta[k]}`).join(' / ')}</p><div class="forge-actions">${missing.map(m=>`<button class="btn btn-sub material-link" onclick="openMaterialDetail('${m.key}','${id}')">${materialKnown(m.key)?uiEscape(MATERIALS[m.key]?.name||m.key):'？？？'} ${m.owned}/${m.need}${m.missing?'（あと'+m.missing+'）':''}</button>`).join('')}</div><p>${deficit?'不足素材 合計'+deficit+'個':'作成可能'} / ${r.gold}G</p><button class="btn btn-gold" onclick="forgeFilters.accessory='${row.slot}';openRecipeDetail('${id}')">比較・${deficit?'素材を確認':'作成する'}</button></article>`;
}
