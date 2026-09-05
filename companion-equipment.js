function emptyEquipmentSlots(){return Object.fromEntries(EQUIPMENT_SLOTS.map(s=>[s.k,null]));}
function migrateCompanionEquipment(){
 const c=state.chapter;c.equipment ||= {};
 const used=new Set(Object.values(state.equipped).filter(Boolean).map(i=>i.id));
 for(const id of new Set([...Object.keys(c.owned),...Object.keys(c.equipment)])){
  const next=emptyEquipmentSlots();
  for(const [slot,item] of Object.entries(c.equipment[id]||{})){
   if(!item)continue;normalizeEquipment(item);
   if(used.has(item.id))continue;
   const target=slot==='accessory2'&&item.type==='accessory'?slot:equipmentSlot(item);
   if(target in next&&!next[target]){next[target]=item;used.add(item.id);}
   else if(!state.storage.some(i=>i.id===item.id))state.storage.push(item);
  }
  c.equipment[id]=next;
 }
 state.storage=state.storage.filter(i=>!used.has(i.id));
 state.inventory=state.inventory.filter(i=>!used.has(i.id));
}
function equipmentOwner(item){
 if(!item)return null;
 const same=i=>i&&(i===item||(i.id&&i.id===item.id));
 if(Object.values(state.equipped).some(same))return 'player';
 for(const [id,slots]of Object.entries(state.chapter?.equipment||{}))if(Object.values(slots).some(same))return id;
 return null;
}
function characterEquipment(id='player'){
 if(id==='player')return state.equipped;
 if(!state.chapter?.owned[id])return null;
 state.chapter.equipment ||= {};return state.chapter.equipment[id] ||= emptyEquipmentSlots();
}
function companionStats(id='elna'){
 const slots=characterEquipment(id)||{},s={atk:36,def:0,maxHp:210,crit:5,vamp:0,effects:{}};
 for(const it of Object.values(slots).filter(Boolean)){
  s.atk+=Number(it.baseAtk)||0;s.def+=Number(it.baseDef)||0;s.maxHp+=Number(it.hp)||0;s.crit+=Number(it.crit)||0;s.vamp+=Number(it.vamp)||0;
  if(it.affix==='critical')s.crit+=8;if(it.affix==='lifesteal')s.vamp+=3;if(it.affix==='max_hp')s.maxHp+=25;
  for(const [key,n]of Object.entries(it.effects||{}))s.effects[key]=(s.effects[key]||0)+n;
 }
 return s;
}
function setCharacterEquipment(id,slot,itemId){
 const slots=characterEquipment(id);
 if(state.screen!=='town'||!slots||!EQUIPMENT_SLOTS.some(s=>s.k===slot))return false;
 const index=state.storage.findIndex(i=>i.id===itemId),item=state.storage[index];
 if(!item||equipmentOwner(item)||equipmentSlot(item)!==(slot==='accessory2'?'accessory':slot))return false;
 if(id==='player'){equipItem(index,true,slot);return true;}
 normalizeEquipment(item);const old=slots[slot];state.storage.splice(index,1);slots[slot]=item;if(old)state.storage.push(old);
 saveState();render();return true;
}
function removeCharacterEquipment(id,slot){
 const slots=characterEquipment(id);if(state.screen!=='town'||!slots?.[slot])return false;
 if(state.storage.length>=state.camp.vaultSize){addLog('倉庫容量不足：解除前に整理してください。','danger');return false;}
 if(id==='player')unequipItem(slot);else{state.storage.push(slots[slot]);slots[slot]=null;saveState();render();}
 return true;
}
function compareEquipmentHtml(current,next){
 const old=current||{},item=next||{};
 const stats=[['baseAtk','ATK'],['baseDef','DEF'],['hp','HP'],['crit','会心%'],['vamp','吸血%']];
 const changes=stats.map(([key,label])=>{const from=Number(old[key])||0,to=Number(item[key])||0,d=to-from;return `<span class="${d<0?'forge-missing':d>0?'forge-ready':''}">${label} ${from} → ${to} (${d>0?'+':''}${d})</span>`;}).join(' / ');
 const keys=new Set([...Object.keys(old.effects||{}),...Object.keys(item.effects||{})]);
 const effects=[...keys].map(key=>{const from=old.effects?.[key]||0,to=item.effects?.[key]||0;return `${EQUIPMENT_EFFECTS[key]?.[0]||key}: ${from} → ${to}${EQUIPMENT_EFFECTS[key]?.[1]||''}`;}).join(' / ');
 return `<div class="gear-compare"><b>${uiEscape(old.name||'未装備')} → ${uiEscape(item.name||'未装備')}</b><div>${changes}</div><div>${uiEscape(effects)}</div><div>現在：${uiEscape(old.desc||'特殊効果なし')}</div><div>候補：${uiEscape(item.desc||effectDescription(item.effects)||'特殊効果なし')}</div></div>`;
}
let characterView={id:'player',slot:null,page:0};
function openCharacterEquipment(id='player',slot=null,page=0){
 const slots=characterEquipment(id);if(!slots)return;
 characterView={id,slot,page};const stats=id==='player'?getPlayerStats():companionStats(id);
 const tabs=[['player','主人公'],...Object.keys(state.chapter.owned).filter(k=>state.chapter.owned[k]).map(k=>[k,CHARACTER_DATA[k]?.name||k])].map(([key,label])=>`<button class="btn btn-${key===id?'gold':'sub'} btn-xs" onclick="openCharacterEquipment('${key}')">${uiEscape(label)}</button>`).join('');
 const rows=EQUIPMENT_SLOTS.map(s=>`<div class="item-row"><div>${s.icon} ${s.label}：${uiEscape(slots[s.k]?.name||'未装備')}<div>${uiEscape(slots[s.k]?getItemStatSummary(slots[s.k]):'')}</div></div><div class="forge-actions"><button class="btn btn-sub btn-xs" onclick="openCharacterEquipment('${id}','${s.k}')">比較・変更</button>${slots[s.k]?`<button class="btn btn-sub btn-xs" onclick="removeCharacterEquipment('${id}','${s.k}');openCharacterEquipment('${id}')">解除</button>`:''}</div></div>`).join('');
 const candidates=slot?state.storage.filter(i=>equipmentSlot(i)===(slot==='accessory2'?'accessory':slot)&&!equipmentOwner(i)):[];
 const pageCount=Math.max(1,Math.ceil(candidates.length/8));page=Math.min(Math.max(0,page),pageCount-1);
 const selection=slot?`<h3>${EQUIPMENT_SLOTS.find(s=>s.k===slot)?.label}の候補（倉庫）</h3>${candidates.slice(page*8,page*8+8).map(i=>`<article class="forge-recipe">${compareEquipmentHtml(slots[slot],i)}<button class="btn btn-gold btn-xs" onclick="setCharacterEquipment('${id}','${slot}','${i.id}');openCharacterEquipment('${id}','${slot}',${page})">${uiEscape(i.name)}を装備</button></article>`).join('')||'<p>候補なし。他のキャラの装備は先に解除してください。</p>'}<div class="forge-actions"><button class="btn btn-sub btn-xs" ${page===0?'disabled':''} onclick="openCharacterEquipment('${id}','${slot}',${page-1})">前へ</button>${page+1}/${pageCount}<button class="btn btn-sub btn-xs" ${page+1===pageCount?'disabled':''} onclick="openCharacterEquipment('${id}','${slot}',${page+1})">次へ</button></div>`:'';
 showChapterModal('👥 キャラ／装備',`<div class="forge-actions">${tabs}</div><p>総能力 ATK ${stats.atk} / DEF ${stats.def} / HP ${stats.maxHp} / 会心 ${stats.crit}%</p>${id!=='player'?'<p>通常探索の主人公とは別装備。エルナの物語戦では基礎能力・炎追撃・会心・スキル威力/CT・ガード回復・回避を反映します。その他の特殊効果は物語戦では適用しません。</p>':''}${rows}${selection}`,`<button class="btn btn-sub" onclick="closeGenericModal()">閉じる</button>`);
}
