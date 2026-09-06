const CHARACTER_SD_ASSETS={
 player:{name:'主人公',sdImage:'assets/characters/player/player-sd.png'},
 elna:{name:'エルナ',sdImage:'assets/characters/elna/elna-sd.png'}
};
function characterSDAsset(id){return CHARACTER_SD_ASSETS[id]||CHARACTER_DATA[id]||{name:id};}
function renderCharacterSD(id,{size='medium',selected=false,showName=true,showLevel=false,showShadow=false,clickable=false}={}){
 const asset=characterSDAsset(id),tag=clickable?'button':'span';
 return `<${tag} class="character-sd sd-${['small','medium','lobby'].includes(size)?size:'medium'} ${selected?'sd-selected':''} ${showShadow?'sd-shadow':''}" data-character-sd="${uiEscape(id)}" ${clickable?`type="button" aria-pressed="${selected}" onclick="openLobbyEquipment('${uiEscape(id)}')"`:''}><span class="sd-figure">${asset.sdImage?`<img src="${uiEscape(asset.sdImage)}" alt="" decoding="async">`:'👤'}</span>${showName?`<span class="sd-name">${selected?'✓ ':''}${uiEscape(asset.name)}${showLevel?` Lv${characterProgress(id).level}`:''}</span>`:''}</${tag}>`;
}
function equipmentOwnerSD(item){const owner=equipmentOwner(item);return owner?`<span class="sd-owner">${renderCharacterSD(owner,{size:'small'})} 装備中</span>`:'';}
function warehouseEquippedSD(){
 const ids=['player',...Object.keys(state.chapter.owned).filter(id=>state.chapter.owned[id])];
 return `<details><summary>キャラクター装備中（倉庫の未装備品とは別）</summary>${ids.map(id=>`<div>${renderCharacterSD(id,{size:'small'})}<ul>${Object.entries(characterEquipment(id)||{}).filter(([,item])=>item).map(([slot,item])=>`<li>${uiEscape(EQUIPMENT_SLOTS.find(s=>s.k===slot)?.label||slot)}：${uiEscape(item.name)} — ${equipmentOwnerSD(item)}</li>`).join('')||'<li>未装備</li>'}</ul></div>`).join('')}</details>`;
}
function syncLobbySD(root){
 let dock=root.querySelector('.lobby-character-sds');
 if(!dock){dock=document.createElement('div');dock.className='lobby-character-sds';dock.setAttribute('aria-label','キャラクター装備');root.append(dock);}
 const ids=['player',...Object.keys(state.chapter.owned).filter(id=>state.chapter.owned[id]&&characterSDAsset(id).sdImage)];
 const key=ids.join(',');if(dock.dataset.characters===key)return;dock.dataset.characters=key;
 dock.innerHTML=ids.map(id=>renderCharacterSD(id,{size:'lobby',showShadow:true,clickable:true})).join('');
}
