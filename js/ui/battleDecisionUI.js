function battleIntentAdvice(enemy){
 const map={normal:['中','HPを見て攻撃／防御'],heavy:['高','防御で備える'],critical_smash:['高','防御推奨'],grab_prep:['高','通常攻撃・スキルで中断'],counter_stance:['中','強攻撃を避ける'],falter:['低','強攻撃の好機'],buff:['中','防御で次の大技に備える'],heal_roots:['中','根への専用行動を確認']};
 let [danger,advice]=map[enemy.actionType||'normal']||['要注意','道具・スキルで詳細確認'];
 if(enemy.gimmick==='rising_water'&&state.waterLevel>=70)advice='排水の専用行動を確認';
 return {name:(enemy.pendingAction||'構え').replace(/\([^)]*\)|（[^）]*）/g,'').trim(),danger,advice};
}
function partPurpose(id){const p=PART_TYPES[id];return p?.atk?`破壊でATK −${Math.round((1-p.atk)*100)}%`:p?.def?`破壊でDEF −${Math.round((1-p.def)*100)}%`:'破壊で素材抽選補助';}
function openSelectedPartInfo(){
 const enemy=state.currentEnemy,p=enemy?.parts?.find(p=>p.id===enemy.partTarget);if(!p)return;
 const key=partMaterialKey(enemy,p);showChapterModal(PART_TYPES[p.id].name,`<p>${partPurpose(p.id)}</p><p>耐久 ${p.hp} / ${p.maxHp}${p.broken?' / BROKEN':''}</p><p>対応素材：${key&&materialKnown(key)?uiEscape(MATERIALS[key].name):'？？？'}</p><p>破壊で素材抽選を補助。確定入手ではありません。</p>`,'<button class="btn btn-sub" onclick="closeGenericModal()">戦闘へ戻る</button>');
 document.querySelector('#modal-layer .update-notes-card').classList.add('battle-menu-modal');
}
function explorationDecisionStates(unit){
 if(!expeditionPerks.active||unit.hp<=0)return [];
 const r=expeditionActors.get(unit),base=unit.buildRuntime||{},lines=[];
 if(expeditionHasPerk('thunder'))lines.push(`雷撃 ${(base.hits||0)%3}/3 HIT`);
 if(r?.enemy===state.currentEnemy&&r.signature===JSON.stringify(unit===state?state.equipped:characterEquipment(unit.id))){
  if(r.smash&&expeditionHasPerk('hammer'))lines.push(`破砕：次の強攻撃 +${r.smash}%`);
  if(r.chain&&expeditionHasPerk('endure'))lines.push(`執念 +${Math.min(20,r.chain*4)}%`);
  if(r.blood&&expeditionHasPerk('blood'))lines.push(`血刃 残り${r.blood}行動`);
  for(const [key,id,label]of [['ice','fang','凍牙：次撃強化'],['counter','mirror','反攻：次撃に反撃'],['rain','overflow','慈雨：次撃 +15%'],['wind','wind','風返し：次撃 +20%'],['wound','wound','傷口：次撃 +15%']])if(r[key]&&expeditionHasPerk(id))lines.push(label);
 }
 if(base.synergyNext&&expeditionHasPerk('chant'))lines.push(`次撃補助 ${base.synergyNext}%予約（共通）`);
 return lines;
}
function skillRole(info=getEquippedSkillInfo()){
 if(info.desc.includes('HP吸収'))return '吸収';if(info.desc.includes('HPを代償'))return '代償撃';if(info.desc.includes('連撃'))return '連撃';if(info.desc.includes('防御50%'))return '貫通';if(info.desc.includes('雷撃'))return '雷撃';return '会心準備';
}
function decorateBattleDecision(root,enemy){
 const intent=battleIntentAdvice(enemy);root.querySelector('.battle-intent').innerHTML=`<small>次の行動</small> ${uiEscape(intent.name)}<br><span>危険度：${intent.danger} / 対処：${intent.advice}</span>`;
 root.querySelectorAll('.enemy-parts button').forEach((button,i)=>{const p=enemy.parts?.[i-1];if(p){button.querySelector('small').textContent=partPurpose(p.id);button.title=PART_TYPES[p.id].name+' '+p.hp+'/'+p.maxHp;}});
 if(enemy.parts?.some(p=>p.id===enemy.partTarget))root.querySelector('.battle-parts-disclosure summary').insertAdjacentHTML('afterend','<button class="part-detail-button" onclick="openSelectedPartInfo()" aria-label="選択部位の素材と詳細">素材・詳細</button>');
 const art=root.querySelector('.battle-enemy-art'),placeholder=art.querySelector(':scope > span');
 if(placeholder){placeholder.remove();art.insertAdjacentHTML('afterbegin',`<div class="enemy-silhouette" role="img" aria-label="${uiEscape(enemy.name)}の仮シルエット"><i></i></div>`);}
 const skill=root.querySelector('.combat-actions button:nth-child(4)'),info=getEquippedSkillInfo();if(skill){skill.setAttribute('aria-label',info.name+'：'+info.desc);skill.title=info.name+' / '+info.desc;skill.innerHTML=`<span class="skill-full">${uiEscape(info.name)}</span><span class="skill-role">${skillRole(info)}${skill.disabled?' 待機':''}</span>`;}
 for(const id of ['player','elna']){const unit=id==='player'?state:companionCombatUnit(),card=root.querySelector(`[data-combat-unit="${id}"]`);if(!unit||!card)continue;const lines=explorationDecisionStates(unit);if(lines.length)card.insertAdjacentHTML('beforeend',`<div class="battle-perk-ready" aria-label="次の行動の強化">${lines.slice(0,2).map(s=>`<span>${uiEscape(s)}</span>`).join('')}${lines.length>2?`<small>他${lines.length-2}件：探索強化で確認</small>`:''}</div>`);}
}
