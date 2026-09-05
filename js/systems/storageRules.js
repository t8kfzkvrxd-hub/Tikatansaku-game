function usesVaultSlot(item){return !!item&&!['material','potion','escape_item','consumable'].includes(item.type);}
function vaultUsed(items=state.storage){return items.filter(usesVaultSlot).length;}
function vaultFree(){return Math.max(0,state.camp.vaultSize-vaultUsed());}
function canStoreItems(items){return vaultUsed(items)<=vaultFree();}
function materialKinds(){return new Set(state.storage.filter(i=>i.type==='material').map(i=>i.key||i.name)).size+(state.abyssCores>0?1:0);}
const ITEM_SORTS=[['acquired','入手順（保存順）'],['name','名前'],['rarity','レアリティ'],['atk','ATK'],['def','DEF'],['type','武器種'],['build','ビルド']];
function compareItemOrder(a,b,sort){
 const rank={Common:0,Rare:1,Epic:2,Legendary:3,Mythic:4,Abyssal:5};
 if(sort==='rarity')return (rank[b.rarity]||0)-(rank[a.rarity]||0);
 if(sort==='atk'||sort==='def')return (b[sort==='atk'?'baseAtk':'baseDef']||0)-(a[sort==='atk'?'baseAtk':'baseDef']||0);
 const key=sort==='type'?'weaponType':sort==='build'?'primaryBuildTag':'name';
 return sort==='acquired'?0:String(a[key]||'').localeCompare(String(b[key]||''),'ja');
}
