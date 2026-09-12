// Facility presentation only: reuse story assets; never persist reactions.
const FACILITY_ART={
 forge:{background:'forge',npc:'blacksmith',greeting:'今日は何を打つ？'},
 'town-shop':{background:'item-shop',npc:'item_shopkeeper',greeting:'必要なもの、見ていって'},
 'town-tavern':{background:'tavern',npc:'tavern_master',greeting:'戻ったか'},
 warehouse:{background:'warehouse',npc:null,greeting:''}
};
const FacilityArt={id:null,card:null};
function facilityReaction(expression,text){
 const root=document.getElementById('facility-art'),data=FACILITY_ART[FacilityArt.id];
 if(!root||!data)return;
 const img=root.querySelector('.facility-npc');
 if(img){const path=storyPortraitPath(data.npc,expression);if(img.getAttribute('src')!==path){img.hidden=false;img.onerror=()=>{img.onerror=null;img.hidden=true;};img.src=path;}img.dataset.expression=expression;}
 const caption=root.querySelector('.facility-reaction');if(caption&&caption.textContent!==text)caption.textContent=text;
}
function clearFacilityArt(){
 const m=document.getElementById('modal-layer'),root=document.getElementById('facility-art');
 if(!root&&!FacilityArt.id)return;
 root?.remove();m.classList.remove('facility-art-modal');delete m.dataset.facilityArt;
 FacilityArt.id=null;FacilityArt.card=null;
 if(state.screen==='town'&&!HomeScreen.active&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
  const lobby=document.getElementById('lobby-screen');lobby?.animate([{opacity:.4},{opacity:1}],{duration:250});
 }
}
function decorateFacility(id){
 const data=FACILITY_ART[id],m=document.getElementById('modal-layer'),card=m.querySelector('.update-notes-card');
 if(!data||!card||state.screen!=='town'||HomeScreen.active||MainStory.active||m.style.display==='none')return;
 const entering=FacilityArt.id!==id;
 document.getElementById('facility-art')?.remove();
 FacilityArt.id=id;FacilityArt.card=card;m.classList.add('facility-art-modal');m.dataset.facilityArt=id;
 const art=document.createElement('div');art.id='facility-art';art.className=entering?'facility-enter':'';art.setAttribute('aria-hidden','true');
 art.innerHTML=`<img class="facility-background" alt=""><aside class="facility-person">${data.npc?'<img class="facility-npc" alt="">':''}<p class="facility-reaction"></p></aside>`;
 m.prepend(art);
 const bg=art.querySelector('.facility-background');bg.onerror=()=>{bg.onerror=null;bg.hidden=true;};bg.src=`assets/story/backgrounds/${data.background}.png`;
 facilityReaction('normal',data.greeting);
 if(id==='forge'){
  if(card.classList.contains('forge-recommended')&&card.querySelector('.forge-recommendation'))facilityReaction('confident','この一本から試してみな');
  const recipeId=card.querySelector('.forge-recommendation')?.dataset.recipe||card.querySelector('[data-recipe-favorite]')?.dataset.recipeFavorite;
  const recipe=CRAFT_RECIPES[recipeId];
  if(recipe&&Object.entries(recipe.materials).some(([key,n])=>materialCount(key)<n))facilityReaction('serious','これじゃまだ足りないな');
 }else if(id==='town-shop'&&state.hp<getPlayerStats().maxHp*.4)facilityReaction('worried','無茶しないでね');
 else if(id==='town-tavern'&&state.hp<getPlayerStats().maxHp*.4)facilityReaction('exasperated','無茶するなよ');
 // Common explicit exit wording, retaining the exact existing handler.
 card.querySelectorAll('.update-notes-actions button').forEach(b=>{if(b.getAttribute('onclick')==='closeGenericModal()')b.textContent='ロビーへ戻る';});
}
// Wrap UI renderers only; do not wrap crafting, purchases, rewards or save APIs.
for(const name of ['openCrafting','openRecipeDetail','openWeaponTree','openForgeServices','showCraftSuccess']){
 const original=window[name];if(typeof original!=='function')continue;
 window[name]=function(...args){const result=original.apply(this,args);decorateFacility('forge');
  if(name==='showCraftSuccess')facilityReaction('confident','悪くない仕上がりだ');
  if(name==='openRecipeDetail'&&CRAFT_RECIPES[args[0]]&&forgeBranchState(args[0]).group==='future')facilityReaction('serious','その先は、まだ解禁されていない');
  return result;};
}
const facilityOriginalOpen=openLobbyFacility;
openLobbyFacility=function(id){const result=facilityOriginalOpen.apply(this,arguments);if(FACILITY_ART[id])decorateFacility(id);return result;};
const facilityOriginalMaterial=openMaterialDetail;
openMaterialDetail=function(){const insideForge=FacilityArt.id==='forge';const result=facilityOriginalMaterial.apply(this,arguments);if(insideForge)decorateFacility('forge');return result;};
// Observe modal replacement/closure so art never leaks into combat, settings or story.
new MutationObserver(()=>{
 if(!FacilityArt.id)return;
 const m=document.getElementById('modal-layer');
 if(m.style.display==='none'||MainStory.active||HomeScreen.active||state.screen!=='town'||!FacilityArt.card?.isConnected)clearFacilityArt();
}).observe(document.getElementById('modal-layer'),{childList:true,attributes:true,attributeFilter:['class','style']});
// A single click path, no touch/click double execution; inspect committed UI action results.
document.getElementById('modal-layer').addEventListener('click',event=>{
 const b=event.target.closest('button'),action=b?.getAttribute('onclick')||'',id=FacilityArt.id;
 if(!id||!b||b.disabled)return;
 const gold=state.vaultGold,items=state.preparedItems?.length||0,bounty=state.bounty,cost=Number(b.textContent.match(/(\d+)G/)?.[1]);
 queueMicrotask(()=>{
  if(FacilityArt.id!==id)return;
  if(action.includes('buyExpeditionSupply(')){
   if((state.preparedItems?.length||0)>items||state.vaultGold<gold)facilityReaction('smile',action.includes('potion')?'無茶しないでね':'はい、これで大丈夫');
   else if(Number.isFinite(cost)&&gold<cost)facilityReaction('worried','少し足りないみたい');
  }else if(action.includes('claimTavernBounty(')&&state.vaultGold>gold)facilityReaction('normal','ほら、報酬だ');
  else if(action.includes('selectTavernContract(')&&state.bounty!==bounty)facilityReaction(action.includes('boss')?'serious':'normal',action.includes('boss')?'……無茶するなよ':'生きて帰ってこい');
 });
},true);
