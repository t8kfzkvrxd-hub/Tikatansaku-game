const FACILITY_MILESTONES=[0,10,30,50,100];
let pendingFacilityUnlock=null;
function announceFacilityUnlock(floor){
 const messages={10:'装備強化・補給・討伐依頼・ボス解析',20:'召喚・自動周回',30:'特性付与・持込枠増加・ボス弱体化',50:'特性再抽選・追加補給・特殊依頼・部屋予測',100:'高度な施設機能・Legendary素材'};
 if(!messages[floor])return;
 pendingFacilityUnlock={text:messages[floor],summons:floor===20};addLog('解禁：'+messages[floor],'gold');
}
function openFacilityUnlock(){const notice=pendingFacilityUnlock;pendingFacilityUnlock=null;showChapterModal('新しい機能が解禁',`<p>${uiEscape(notice?.text||'解禁済みの機能を施設から利用できます。')}</p>`,`<button class="btn" onclick="${notice?.summons?'openSummons()':'openCrafting()'}">${notice?.summons?'召喚を試す':'鍛冶屋で試す'}</button><button class="btn btn-sub" onclick="closeGenericModal()">あとで</button>`);}
function facilityTier(){return Math.max(1,...FACILITY_MILESTONES.map((f,i)=>clearedMaterialMilestone(f)?i+1:1));}
function facilityAvailable(tier){return tier<=facilityTier();}
function facilityGateText(tier){return `${FACILITY_MILESTONES[tier-1]}Fクリア後に解禁`;}
function syncFacilityCapacity(){
 const cleared=BOSS_FLOORS.filter(f=>state.bossFirstKills[f]).length;
 state.camp.vaultSize=Math.max(20,Number(state.camp.vaultSize)||20,20+cleared*10,vaultUsed());
}
function facilityProgressHtml(){return '<p>施設機能は10・30・50・100Fクリアで順次解禁。施設Lvや施設強化費用はありません。</p>';}
function openForgeServices(){showChapterModal('高度な鍛冶機能',document.getElementById('town-blacksmith').innerHTML,'<button class="btn" onclick="openCrafting()">鍛冶屋へ戻る</button>');}
function facilityPanelsHtml(){
 const button=(tier,text,action)=>`<button class="btn btn-sub" ${facilityAvailable(tier)?'':'disabled'} onclick="${action}">${text}${facilityAvailable(tier)?'':'（'+facilityGateText(tier)+'）'}</button>`;
 return `<div class="town-facilities">
 <section id="town-blacksmith"><h3>鍛冶屋</h3><button class="btn" onclick="selectForgeView('recommended')">次に作る装備</button>${button(2,'強化',"openCrafting('refine')")}${button(3,'武器特性',"openAffixModal('weapon')")}${button(3,'防具特性',"openAffixModal('armor')")}${button(4,'武器特性再抽選',"rerollEquipmentAffix('weapon')")}${button(5,'武器高位能力強化',"enhanceHighRarity('weapon')")}${facilityProgressHtml()}</section>
 <section id="town-shop"><h3>道具屋</h3>${button(2,'傷薬 30G',"buyExpeditionSupply('potion')")}${button(2,'幸運護符 45G',"buyExpeditionSupply('charm')")}${button(4,'煙玉 60G',"buyExpeditionSupply('smoke')")}${button(4,'解毒薬 40G',"buyExpeditionSupply('antidote')")}${button(5,'上級傷薬 90G',"buyExpeditionSupply('greater')")}<p>持込傷薬：${facilityAvailable(3)?5:3}個まで</p></section>
 <section id="town-vault"><h3>倉庫</h3><p>装備 ${vaultUsed()} / ${state.camp.vaultSize}枠。素材は枠不要。ボスクリアで容量が増加します。</p></section>
 <section id="town-tavern"><h3>酒場の依頼</h3>${facilityAvailable(2)&&state.bounty?`<p>討伐 ${state.bounty.currentKills} / ${state.bounty.targetKills} / 報酬 ${getTavernReward()}G</p>${state.bounty.completed?'<button class="btn btn-gold" onclick="claimTavernBounty()">報酬受取</button>':button(4,'短期依頼',"selectTavernContract('short')")+button(4,'エリート依頼',"selectTavernContract('elite')")+button(5,'賞金首',"selectTavernContract('boss')")}`:`<p>${facilityGateText(2)}</p>`}</section>
 <section id="town-lab"><h3>研究・解析</h3>${facilityAvailable(2)?getLabBossIntelHtml():`<p>${facilityGateText(2)}：次ボス解析</p>`}<details><summary>解放機能</summary>${facilityProgressHtml()}<p>初期：図鑑 / 10F：次ボス / 30F：ボスHP−15% / 50F：部屋予測 / 100F：深層解析</p></details></section></div>`;
}
