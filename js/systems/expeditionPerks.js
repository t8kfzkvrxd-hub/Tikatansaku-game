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
let expeditionPerks={active:false,selected:[],offered:[],kills:0,contract:null,pending:0};
function resetExpeditionPerks(active=false){if(typeof expeditionClearRuntime==='function')expeditionClearRuntime();expeditionPerks={active,selected:[],offered:[],kills:0,contract:null,pending:0};}
function expeditionPerksPending(){return expeditionPerks.active&&(expeditionPerks.offered.length>0||expeditionPerks.pending>0);}
let expeditionPerkIntro=false;
let expeditionOfferSerial=0;
function syncExpeditionPerkChoice(){
 if(expeditionPerks.dismissed)return;
 if(!expeditionPerksPending()||!['door_select','safe_point'].includes(state.screen)||HomeScreen.active)return;
 if(document.getElementById('modal-layer').style.display!=='none')return;
 offerExpeditionPerks();if(!expeditionPerks.offered.length||expeditionPerkIntro)return;
 const run=expeditionPerks,toast=document.createElement('div');toast.className='level-up-toast';toast.setAttribute('role','status');toast.textContent='3体撃破！ 探索ボーナス獲得';document.body.append(toast);expeditionPerkIntro=true;
 setTimeout(()=>{toast.remove();expeditionPerkIntro=false;if(run===expeditionPerks&&expeditionPerksPending()&&['door_select','safe_point'].includes(state.screen)&&!HomeScreen.active&&document.getElementById('modal-layer').style.display==='none')openExpeditionPerks();},400);
}
function expeditionSynergyRules(){
 if(!expeditionPerks.active||state.screen==='town')return [];
 return expeditionPerks.selected.filter(id=>['thunder','giant','fort','cut','chant','chain'].includes(id)).flatMap(id=>{const p=EXPEDITION_PERKS.find(p=>p.id===id);return p?p.rules.map(r=>({...r,origin:'expedition',completedName:'探索：'+p.name})):[];});
}
function expeditionHasPerk(id){return expeditionPerks.active&&state.screen!=='town'&&expeditionPerks.selected.includes(id);}
function expeditionCandidateContext(){
 const actors=expeditionUnits().map(unit=>({unit,slots:unit===state?state.equipped:characterEquipment(unit.id),stats:unit===state?getPlayerStats():companionStats(unit.id)}));
 return {actors,tags:new Set(actors.flatMap(a=>[...buildTags(a.slots)]))};
}
function expeditionCandidateWorks(id,selected=expeditionPerks.selected,context=expeditionCandidateContext()){
 const {tags,actors}=context,p=EXPEDITION_PERKS.find(p=>p.id===id);if(!p)return false;
 if(id==='venom')return tags.has('poison')||tags.has('status');
 if(id==='wound')return tags.has('bleed');
 if(id==='curse')return tags.has('curse');
 if(id==='blood')return actors.some(({unit,slots,stats})=>expeditionBaseLeech({...unit,hp:stats.maxHp},stats,{isBoss:false,buildStatuses:{},turnCount:0},slots,false).rate<25);
 if(id==='overflow')return tags.has('lifesteal')||selected.includes('blood')||actors.some(a=>a.stats.vamp>0||a.stats.effects?.lifestealRate>0);
 if(!['thunder','giant','fort','cut','chant','chain'].includes(id))return true;
 const original=expeditionPerks.selected,rule=p.rules[0];
 try{return actors.some(({unit,slots,stats})=>{
  const options={unit,stats,hp:stats.maxHp,maxHp:stats.maxHp,enemy:{hp:10000,maxHp:10000,isBoss:true,turnCount:6,buildStatuses:{}},action:rule.condition==='heavy'?'heavy':rule.condition==='skill'?'skill':'attack',guard:true,preview:true,runtime:{hits:12,hurt:0,kills:0,charge:0,shield:0}};
  expeditionPerks.selected=selected.filter(k=>k!==id);const before=evaluateSynergies(slots,rule.trigger,options).values[rule.stat]||0;
  expeditionPerks.selected=[...selected.filter(k=>k!==id),id];const after=evaluateSynergies(slots,rule.trigger,options).values[rule.stat]||0;
  return after>before;
 });}finally{expeditionPerks.selected=original;}
}
function expeditionValidExchange(id,old){
 const next=[...expeditionPerks.selected.filter(k=>k!==old),id],context=expeditionCandidateContext();
 return expeditionCandidateWorks(id,next,context)&&next.every(k=>k===id||!expeditionCandidateWorks(k,expeditionPerks.selected,context)||expeditionCandidateWorks(k,next,context));
}
function offerExpeditionPerks(){
 if(!expeditionPerks.active||expeditionPerks.offered.length)return;
 const context=expeditionCandidateContext(),{tags}=context;
 const pool=EXPEDITION_PERKS.filter(p=>!expeditionPerks.selected.includes(p.id)&&expeditionCandidateWorks(p.id,expeditionPerks.selected,context)&&(expeditionPerks.selected.length<EXPEDITION_LIMIT||expeditionPerks.selected.some(old=>expeditionValidExchange(p.id,old))));
 if(!pool.length){expeditionPerks.pending=0;return;}
 const chosen=[],pick=list=>{const options=list.filter(p=>!chosen.includes(p));if(options.length)chosen.push(options[Math.floor(Math.random()*options.length)]);};
 pick(pool.filter(p=>tags.has(p.tag)));if(!chosen.length)pick(pool);
 pick(pool.filter(p=>['防御','探索'].includes(p.category)&&p.category!==chosen[0].category));
 pick(pool.filter(p=>!chosen.some(q=>q.category===p.category)));
 while(chosen.length<Math.min(3,pool.length))pick(pool);
 expeditionPerks.offered=chosen.map(p=>p.id);
 expeditionOfferSerial++;
}
function chooseExpeditionPerk(id,replaceId=null){
 if(!expeditionPerks.active||!['door_select','safe_point'].includes(state.screen)||!expeditionPerks.offered.includes(id))return false;
 if(!expeditionCandidateWorks(id)){expeditionPerks.offered=[];offerExpeditionPerks();openExpeditionPerks();return false;}
 if(replaceId&&!expeditionValidExchange(id,replaceId))return false;
 if(expeditionPerks.selected.length>=EXPEDITION_LIMIT){if(!expeditionPerks.selected.includes(replaceId)){openExpeditionReplacement(id);return false;}expeditionPerks.selected=expeditionPerks.selected.filter(k=>k!==replaceId);expeditionClearRuntime();}
 expeditionPerks.offered=[];expeditionPerks.dismissed=false;expeditionPerks.pending=Math.max(0,(expeditionPerks.pending||1)-1);expeditionPerks.selected.push(id);closeGenericModal();render();const names=expeditionName();if(names.length)addLog('探索ビルド形成《'+names.join('・')+'》','gold');return true;
}
function skipExpeditionPerk(serial=expeditionOfferSerial){
 if(serial!==expeditionOfferSerial||!expeditionPerks.active||!['door_select','safe_point'].includes(state.screen)||expeditionPerks.selected.length<EXPEDITION_LIMIT||!expeditionPerks.offered.length)return false;
 expeditionOfferSerial++;expeditionPerks.offered=[];expeditionPerks.pending=Math.max(0,(expeditionPerks.pending||1)-1);expeditionPerks.dismissed=false;closeGenericModal();render();return true;
}
function confirmExpeditionExchange(id,old,serial=expeditionOfferSerial){
 if(serial!==expeditionOfferSerial||!['door_select','safe_point'].includes(state.screen)||!expeditionPerks.offered.includes(id)||!expeditionPerks.selected.includes(old)||!expeditionValidExchange(id,old))return;
 showChapterModal('探索強化を交換',`<div class="perk-comparison"><section><h3>失う強化</h3>${expeditionPerkDescription(old)}</section><section><h3>得る強化</h3>${expeditionPerkDescription(id)}</section></div>`,`<button class="btn btn-gold" onclick="if(expeditionOfferSerial===${serial})chooseExpeditionPerk('${id}','${old}')">交換する</button><button class="btn btn-sub" onclick="openExpeditionReplacement('${id}')">戻る</button>`);
 document.querySelector('#modal-layer .update-notes-card').classList.add('expedition-exchange-modal');
}
function expeditionPerkDescription(id){const p=EXPEDITION_PERKS.find(p=>p.id===id);return p?`<b>${uiEscape(p.name)}</b><p>${uiEscape(p.description)}</p>${p.drawback?`<small class="forge-missing">代償：${uiEscape(p.drawback)}</small>`:''}`:'';}
function openExpeditionReplacement(id){
 if(!expeditionPerks.active||!['door_select','safe_point'].includes(state.screen)||!expeditionPerks.offered.includes(id))return;
 const name=EXPEDITION_PERKS.find(p=>p.id===id).name;
 showChapterModal('8枠：交換する強化を選ぶ',`<p>《${uiEscape(name)}》と交換。次の画面で効果を比較します。</p><div class="expedition-replacement">${expeditionPerks.selected.map(old=>`<button class="btn btn-sub" ${expeditionValidExchange(id,old)?'':'disabled'} onclick="confirmExpeditionExchange('${id}','${old}',${expeditionOfferSerial})">${uiEscape(EXPEDITION_PERKS.find(p=>p.id===old).name)}${expeditionValidExchange(id,old)?'':'（連携維持に必要）'}</button>`).join('')}</div>`,`<button class="btn btn-sub" onclick="openExpeditionPerks()">候補へ戻る</button>`);
 document.querySelector('#modal-layer .update-notes-card')?.classList.add('expedition-exchange-modal');
}
function openExpeditionPerks(){
 if(HomeScreen.active)return;
 expeditionPerks.dismissed=false;
 const pending=state.screen==='battle'?[]:expeditionPerks.offered,list=pending.length?pending:expeditionPerks.selected;
 showChapterModal(pending.length?'3体撃破の報酬：1つ選ぶ':'取得中の探索強化',`${expeditionPerks.contract?.remaining>0?`<p>道の効果：あと${expeditionPerks.contract.remaining}戦 / 敵ATK ×${expeditionPerks.contract.atk}・獲得G ×${expeditionPerks.contract.gold}。素材率は通常です。</p>`:''}<p>今回の探索で二人を強化（${expeditionPerks.selected.length}/8）${expeditionName().map(n=>'《'+n+'》').join('')}${state.screen==='battle'?'／戦闘中は閲覧のみ':''}</p>${list.map(id=>pending.length?`<button class="perk-choice" onclick="chooseExpeditionPerk('${id}')">${expeditionPerkDescription(id)}<span class="perk-acquire">${expeditionPerks.selected.length>=8?'交換を検討':'獲得'}</span></button>`:`<article class="forge-recipe">${expeditionPerkDescription(id)}</article>`).join('')||'<p>3戦の撃破ごとに、3候補から1つ選べます。</p>'}`,pending.length?(expeditionPerks.selected.length>=8?`<button class="btn btn-sub" onclick="skipExpeditionPerk(${expeditionOfferSerial})">今回は見送る（8枠を維持）</button>`:''):'<button class="btn btn-sub" onclick="closeGenericModal()">閉じる</button>');
 document.querySelector('#modal-layer .update-notes-card')?.classList.add('expedition-perk-modal');
 if(state.screen==='battle')document.querySelector('#modal-layer .update-notes-body').insertAdjacentHTML('afterbegin',expeditionUnits().map(unit=>{const lines=explorationDecisionStates(unit);return lines.length?`<section><b>${unit===state?'主人公':'エルナ'}：次の行動</b>${lines.map(s=>`<p>${uiEscape(s)}</p>`).join('')}</section>`:'';}).join(''));
}
function deferExpeditionPerks(){expeditionPerks.dismissed=true;closeGenericModal();}
function expeditionPerkButton(){return `<button class="expedition-perk-button" onclick="openExpeditionPerks()">${state.screen!=='battle'&&expeditionPerksPending()?'探索ボーナス 未選択':'探索強化 '+expeditionPerks.selected.length}${expeditionPerks.contract?.remaining>0?' / 道'+expeditionPerks.contract.remaining+'戦':''}</button>`;}
function prepareExpeditionEncounter(enemy){
 if(!expeditionPerks.active||enemy.expeditionPrepared)return;
 enemy.expeditionPrepared=true;
 if(expeditionHasPerk('venom')&&expeditionPerks.poisonCarry){enemy.gearPoison=Math.min(enemy.isBoss?1:2,expeditionPerks.poisonCarry);enemy.poisonInherited=true;}expeditionPerks.poisonCarry=0;
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
 expeditionKilled(state.currentEnemy);
 expeditionPerks.kills++;
 if(expeditionPerks.kills===1&&state.chapter.mode!=='skip')addLog('素材はロビーへ持ち帰ると、鍛冶屋のおすすめから装備にできます。','info');
 if(expeditionPerks.kills%3===0){expeditionPerks.pending=(expeditionPerks.pending||0)+1;offerExpeditionPerks();if(expeditionPerks.offered.length)addLog('✦ 報酬確認後に探索強化を選びます。','gold');}
}
