const EXPEDITION_PERKS=[
 ['thunder','雷撃','shock','hit','third','extra',12],['blood','血刃','lifesteal','leech','low','leech',5],
 ['giant','巨人殺し','boss','attack','boss','power',25],['fort','鉄壁','guard','incoming','guard','reduction',10],
 ['fang','凍牙','freeze','attack','freeze','crit',12],['ember','火種','fire','hit','third','fire',1],
 ['venom','持続毒','poison','hit','poison','poisonExtend',1],['wound','傷口狙い','bleed','attack','bleed','power',15],
 ['curse','呪防','curse','incoming','curse','reduction',10],['cut','解体の心得','break','part','heavy','partPower',20],
 ['mirror','鏡の護り','reflect','reflect','always','reflect',8],['wind','風返し','dodge','dodge','always','nextPower',20],
 ['blade','鍛錬の刃','normalAttack','attack','normal','power',12],['hammer','破城槌','heavyAttack','attack','heavy','power',15],
 ['chant','詠唱の残響','skillPower','hit','skill','nextPower',20],['chain','影の同行者','summon','hit','fourth','summon',15],
 ['rest','狩人の息継ぎ','onKill','kill','mob','heal',2],['endure','持久の誓い','longFight','attack','long','power',18],
 ['sun','朝の兆し','burst','attack','opening','crit',12],['revenge','反撃の誓い','onHurt','attack','hurt','power',15],
 ['shell','薄明の障壁','shield','incoming','firstIncoming','shield',4],['overflow','慈雨','overheal','heal','full','nextPower',15],
 ['pierce','鎧通し','pierce','attack','armored','pierce',15],['calm','静かな足取り','safe','incoming','always','reduction',4]
].map(([id,name,tag,trigger,condition,stat,value])=>({id,name,tag,rules:[{trigger,condition,stat,value,primary:tag}]}));
let expeditionPerks={active:false,selected:[],offered:[],kills:0,contract:null};
function resetExpeditionPerks(active=false){expeditionPerks={active,selected:[],offered:[],kills:0,contract:null};}
function expeditionSynergyRules(){
 if(!expeditionPerks.active||state.screen==='town')return [];
 return expeditionPerks.selected.flatMap(id=>{const p=EXPEDITION_PERKS.find(p=>p.id===id);return p?p.rules.map(r=>({...r,origin:'expedition',completedName:'探索：'+p.name})):[];});
}
function expeditionHasPerk(id){return expeditionPerks.active&&state.screen!=='town'&&expeditionPerks.selected.includes(id);}
function offerExpeditionPerks(){
 if(!expeditionPerks.active||expeditionPerks.offered.length)return;
 const pool=EXPEDITION_PERKS.filter(p=>!expeditionPerks.selected.includes(p.id));
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 expeditionPerks.offered=pool.slice(0,3).map(p=>p.id);
}
function chooseExpeditionPerk(id){
 if(!expeditionPerks.active||state.screen==='town'||state.currentEnemy?.acting||!expeditionPerks.offered.includes(id))return false;
 expeditionPerks.offered=[];expeditionPerks.selected.push(id);closeGenericModal();render();return true;
}
function openExpeditionPerks(){
 const pending=expeditionPerks.offered,list=pending.length?pending:expeditionPerks.selected;
 showChapterModal(pending.length?'今回の探索強化：1つ選ぶ':'今回の探索強化',`${expeditionPerks.contract?.remaining>0?`<p>道の効果：あと${expeditionPerks.contract.remaining}戦 / 敵ATK ×${expeditionPerks.contract.atk}・獲得G ×${expeditionPerks.contract.gold}。素材率は通常です。</p>`:''}<p>二人へ適用。帰還・敗北・再読み込みで消失。既存の効果上限は共通です。</p>${list.map(id=>{const p=EXPEDITION_PERKS.find(p=>p.id===id);return `<article class="forge-recipe"><h3>${p.name}</h3><p>${p.rules.map(synergyRuleText).join(' / ')}</p>${pending.length?`<button class="btn" onclick="chooseExpeditionPerk('${id}')">これを選ぶ</button>`:''}</article>`;}).join('')||'<p>3戦の撃破ごとに、3候補から1つ選べます。</p>'}`,`<button class="btn btn-sub" onclick="closeGenericModal()">あとで</button>`);
}
function expeditionPerkButton(){return `<button class="expedition-perk-button" aria-label="探索強化と道の効果の詳細・選択" onclick="openExpeditionPerks()">✦ ${expeditionPerks.offered.length?'強化を選ぶ':'強化 '+expeditionPerks.selected.length}${expeditionPerks.contract?.remaining>0?' / 道'+expeditionPerks.contract.remaining+'戦':''}</button>`;}
function prepareExpeditionEncounter(enemy){
 if(!expeditionPerks.active||enemy.expeditionPrepared)return;
 enemy.expeditionPrepared=true;
 const c=expeditionPerks.contract;
 if(c?.remaining>0){enemy.atk=Math.max(1,Math.round(enemy.atk*c.atk));enemy.expeditionGold=c.gold;c.remaining--;}
}
function chooseExpeditionRisk(door){
 if(!expeditionPerks.active||!door.runRisk||expeditionPerks.contract?.remaining>0)return;
 expeditionPerks.contract=door.runRisk==='bold'?{remaining:3,atk:1.3,gold:1.5}:{remaining:1,atk:.85,gold:.75};
}
function decorateExpeditionDoors(doors){
 return !expeditionPerks.active||expeditionPerks.contract?.remaining>0?doors:doors.map(d=>d.type==='battle_normal'?{...d,runRisk:Math.random()<.5?'bold':'safe'}:d);
}
function expeditionKillReward(){
 if(!expeditionPerks.active)return;
 expeditionPerks.kills++;
 if(expeditionPerks.kills===1&&state.chapter.mode!=='skip')addLog('素材はロビーへ持ち帰ると、鍛冶屋のおすすめから装備にできます。','info');
 if(expeditionPerks.kills%3===0){offerExpeditionPerks();if(expeditionPerks.offered.length)addLog('✦ 探索強化を1つ選べます。「強化を選ぶ」から確認。','gold');}
}
