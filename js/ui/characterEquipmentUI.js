let equipmentCandidateSort='recommended';
function equipmentCandidates(id,slot){
 const all=[...state.storage,...Object.values(state.equipped),...Object.values(state.chapter.equipment||{}).flatMap(Object.values)].filter(Boolean);
 const seen=new Set();
 return all.filter(i=>{if(seen.has(i.id)||equipmentSlot(i)!==(slot==='accessory2'?'accessory':slot))return false;seen.add(i.id);return true;}).map((item,index)=>({item,index})).sort((a,b)=>{
  const key={atk:'baseAtk',def:'baseDef',hp:'hp'}[equipmentCandidateSort];
  if(key)return (b.item[key]||0)-(a.item[key]||0);
  if(equipmentCandidateSort==='recent')return b.index-a.index;
  if(equipmentCandidateSort==='build')return gearBuildText(a.item).localeCompare(gearBuildText(b.item),'ja');
  if(equipmentCandidateSort==='recommended')return Number(!!equipmentOwner(a.item))-Number(!!equipmentOwner(b.item))||((b.item.baseAtk||0)+(b.item.baseDef||0)+(b.item.hp||0)/10)-((a.item.baseAtk||0)+(a.item.baseDef||0)+(a.item.hp||0)/10);
  return compareItemOrder(a.item,b.item,equipmentCandidateSort);
 }).map(r=>r.item);
}
function gearBuildText(item){return [...buildTags({item})].map(t=>BUILD_CATALOG[t]||t).join(' / ')||'なし';}
function compareCharacterTotals(id,slot,item){
 const slots=characterEquipment(id),next={...slots,[slot]:item};
 const before=id==='player'?getPlayerStats(slots):companionStats(id,slots),after=id==='player'?getPlayerStats(next):companionStats(id,next);
 return `<div class="gear-compare"><b>装備変更後の総能力（現在と同じHP・探索条件）</b>${[['atk','ATK'],['def','DEF'],['maxHp','HP'],['crit','会心%'],['vamp','吸血%']].map(([k,label])=>{const delta=after[k]-before[k];return `<div>${label} ${before[k]} → ${after[k]} (${delta>0?'+':''}${delta})</div>`;}).join('')}</div>`;
}
function openEquipmentCandidate(itemId){
 const {id,slot,page}=characterView,item=equipmentCandidates(id,slot).find(i=>i.id===itemId);if(!item)return;
 const current=characterEquipment(id)[slot],owner=equipmentOwner(item),name=owner==='player'?'主人公':CHARACTER_DATA[owner]?.name||owner;
 showChapterModal('装備比較',`${compareCharacterTotals(id,slot,item)}${compareEquipmentHtml(current,item)}<p>現在のビルド：${uiEscape(gearBuildText(current))}</p><p>候補のビルド：${uiEscape(gearBuildText(item))}</p><p>下段は装備単体の差分です。条件付き効果は発動条件も確認してください。</p>${item.locked?'<p>🔒 ロック中（売却保護・装備は可能）</p>':''}`,`<button class="btn btn-sub" onclick="openCharacterEquipment('${id}','${slot}',${page})">戻る</button><button class="btn btn-gold" ${owner?'disabled':''} onclick="setCharacterEquipment('${id}','${slot}','${item.id}');openCharacterEquipment('${id}','${slot}',${page})">${owner?uiEscape(name)+'が装備中':uiEscape(item.name)+'を装備'}</button>`);
}
function openCharacterEquipment(id='player',slot=null,page=0){
 const slots=characterEquipment(id);if(!slots)return;
 const stats=id==='player'?getPlayerStats():companionStats(id);
 const tabs=[['player','主人公'],...Object.keys(state.chapter.owned).filter(k=>state.chapter.owned[k]).map(k=>[k,CHARACTER_DATA[k]?.name||k])].map(([key,name])=>{const s=key==='player'?getPlayerStats():companionStats(key);return `<button class="btn character-tab ${key===id?'btn-gold':'btn-sub'}" aria-pressed="${key===id}" onclick="openCharacterEquipment('${key}')"><b>${uiEscape(name)} Lv${characterProgress(key).level}</b><small>HP ${s.maxHp} / ATK ${s.atk} / DEF ${s.def}</small></button>`;}).join('');
 const rows=EQUIPMENT_SLOTS.map(s=>`<div class="equipment-slot ${slot===s.k?'selected':''}"><button class="btn btn-sub" onclick="openCharacterEquipment('${id}','${s.k}')"><b>${s.icon} ${s.label}</b><span>${uiEscape(slots[s.k]?.name||'未装備')}</span></button>${slots[s.k]?`<button class="btn btn-sub" onclick="removeCharacterEquipment('${id}','${s.k}');openCharacterEquipment('${id}','${s.k}')">解除</button>`:''}</div>`).join('');
 const candidates=slot?equipmentCandidates(id,slot):[],pages=Math.max(1,Math.ceil(candidates.length/8));page=Math.max(0,Math.min(page,pages-1));characterView={id,slot,page};
 const selection=slot?`<h3>${uiEscape(EQUIPMENT_SLOTS.find(s=>s.k===slot).label)}の候補</h3><label>並び替え <select onchange="equipmentCandidateSort=this.value;openCharacterEquipment('${id}','${slot}')">${[['recommended','おすすめ（装備可能・基礎能力）'],['atk','ATK順'],['def','DEF順'],['hp','HP順'],['rarity','レアリティ'],['build','ビルド'],['recent','最近入手（保存順）']].map(([k,n])=>`<option value="${k}" ${equipmentCandidateSort===k?'selected':''}>${n}</option>`).join('')}</select></label><div class="equipment-candidates">${candidates.slice(page*8,page*8+8).map(i=>{const owner=equipmentOwner(i),label=owner===id?'現在装備中':owner?(owner==='player'?'主人公':CHARACTER_DATA[owner]?.name||owner)+'が装備中':'装備可能';return `<article class="forge-recipe"><b>${uiEscape(i.name)}</b><div>${uiEscape(i.rarity)} / ${uiEscape(getItemStatSummary(i))}</div><div>${uiEscape(gearBuildText(i))}</div><p>${label}${i.locked?' / 🔒 ロック中':''}</p><button class="btn btn-sub" onclick="openEquipmentCandidate('${i.id}')">比較・選択</button></article>`;}).join('')||'<p>この部位の装備はありません。</p>'}</div><div class="forge-actions"><button class="btn btn-sub" ${page===0?'disabled':''} onclick="openCharacterEquipment('${id}','${slot}',${page-1})">前へ</button>${page+1}/${pages}<button class="btn btn-sub" ${page+1===pages?'disabled':''} onclick="openCharacterEquipment('${id}','${slot}',${page+1})">次へ</button></div>`:'';
 showChapterModal('👥 キャラ／装備',`<div class="character-tabs">${tabs}</div>${characterLevelHtml(id)}<p>総能力 HP ${stats.maxHp} / ATK ${stats.atk} / DEF ${stats.def}</p><div class="equipment-slots">${rows}</div>${selection}${id!=='player'?`<p>独立HPで通常戦闘に参加。HP0では戦闘不能、出撃時に回復します。</p><button class="btn btn-sub" onclick="selectCompanion('${id}');openCharacterEquipment('${id}')">${state.chapter.companion===id?'同行中':'同行に選択'}</button><button class="btn btn-sub" onclick="selectCompanion(null);openCharacterEquipment('${id}')">同行を外す</button>`:''}`,`<button class="btn btn-sub" onclick="closeGenericModal()">閉じる</button>`);
};
