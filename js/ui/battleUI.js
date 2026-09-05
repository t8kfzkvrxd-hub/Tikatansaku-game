const BattleUI={enemy:null,notices:[],builds:{},phase:null};
const BATTLE_WEAPON_FX={sword:'slash',greatsword:'slash',dagger:'slash',dual:'slash',greathammer:'impact',mace:'impact',spear:'thrust',bow:'thrust',staff:'magic',tome:'magic'};
function battleNotice(text){BattleUI.notices.push(text);BattleUI.notices=BattleUI.notices.slice(-5);BattleUI.noticeTime=Date.now();}
function battleBackground(area=explorationArea()){
 const bg=area?.battleBackground||getCurrentArea()?.battleBackground||area?.explorationBackground||area?.backgrounds?.[0];
 return typeof bg==='string'?bg:bg?.src||'';
}
function openBattleMenu(){
 const extra=[...document.querySelectorAll('.battle2 .combat-actions button')].slice(4).map(b=>{const clone=b.cloneNode(true);clone.setAttribute('onclick',clone.getAttribute('onclick')+';closeGenericModal()');return clone.outerHTML;}).join('');
 showChapterModal('戦闘メニュー',`<p>${state.currentEnemy?.acting?'行動処理中：次のターンまでお待ちください。':'追加行動'}</p>${extra||'<p>現在使える特殊行動はありません。</p>'}<p>${state.currentEnemy?.isBoss?'煙玉：ボス戦では使用不可':'煙玉：所持している時のみ使用可能'}</p><button class="btn" onclick="openExplorationPanel('bag')">アイテム・所持品</button><button class="btn" onclick="openExplorationPanel('codex')">図鑑</button>`,`<button class="btn" onclick="closeGenericModal()">戦闘へ戻る</button>`);
}
function openBattleLog(){
 const content=document.querySelector('.battle2 .battle-feed ol')?.outerHTML||'';
 showChapterModal('戦闘ログ（最新5件）',content+BattleUI.notices.map(t=>`<p>${uiEscape(t)}</p>`).join(''),'<button class="btn" onclick="closeGenericModal()">戦闘へ戻る</button>');
}
const battleReadoutBase=renderCombatReadout;
renderCombatReadout=function(){
 battleReadoutBase();
 const root=document.querySelector('.battle-readout'),enemy=state.currentEnemy;
 const active=state.screen==='battle'&&!!enemy&&!HomeScreen.active;
 document.body.classList.toggle('at-battle',active);document.documentElement.classList.toggle('at-battle',active);
 if(!root||!active)return;
 if(BattleUI.enemy!==enemy){BattleUI.enemy=enemy;BattleUI.notices=[];BattleUI.builds={};BattleUI.phase=enemy.phase;}
 if(enemy.phase!==BattleUI.phase){if(enemy.phase)battleNotice('PHASE '+enemy.phase);BattleUI.phase=enemy.phase;}
 root.classList.add('battle2');root.setAttribute('aria-label','戦闘');
 const bg=battleBackground();root.style.backgroundImage=`linear-gradient(#07101a55,#07101a88),url(${JSON.stringify(bg)})`;
 const recent=combatFeedback.events.filter(e=>Date.now()-e.time<900),hit=recent.some(e=>e.target==='enemy'&&['damage','part'].includes(e.kind));
 for(const id of ['player','elna']){
  const card=root.querySelector(`[data-combat-unit="${id}"]`);if(!card)continue;
  card.insertAdjacentHTML('afterbegin',characterPortraitHtml(id));
  card.classList.toggle('battle-attack',recent.some(e=>e.actor===id&&e.target==='enemy'&&e.kind==='damage'));
  card.classList.toggle('battle-hurt',recent.some(e=>e.target===id&&e.kind==='hurt'));
  const v=buildView(id),current=new Set(v?[...v.tags].filter(t=>v.conditions[t]&&v.unit.hp>0):[]);
  for(const tag of current)if(!BattleUI.builds[id]?.has(tag))battleNotice(combatName(id)+'：'+BUILD_CATALOG[tag]+' 発動');
  BattleUI.builds[id]=current;
  if(id==='player'&&state.lastPlayerAction==='defend')card.insertAdjacentHTML('beforeend','<span class="battle-guard">🛡 GUARD</span>');
  if(recent.some(e=>e.target===id&&e.kind==='hurt'))card.insertAdjacentHTML('beforeend',`<span class="battle-target">🎯 敵 → ${combatName(id)}</span>`);
  const m=partyMember(id),buff=m?.unit.playerAttackBuff||m?.unit.attackBuff;
  if(buff>1)card.insertAdjacentHTML('beforeend',`<small>ATK強化 ×${buff}</small>`);
 }
 const enemyCard=root.querySelector('[data-combat-unit="enemy"]');
 enemyCard.classList.toggle('boss',!!enemy.isBoss);enemyCard.classList.toggle('elite',!!enemy.isElite);
 enemyCard.insertAdjacentHTML('beforeend',`<div class="battle-intent">B${state.floor}F / ${enemy.isBoss?'BOSS':enemy.isElite?'ELITE':'通常敵'}${enemy.phase?' / PHASE '+enemy.phase:''} / ${enemy.acting?'行動処理中':'入力可能'}<br>次行動：${uiEscape(enemy.pendingAction||'構え')}</div>`);
 const definition=[...getCurrentArea().enemies,getCurrentArea().elite,getCurrentArea().boss].find(e=>e.materialSource===enemy.materialSource);
 const picture=enemy.enemyImage||definition?.enemyImage;
 root.insertAdjacentHTML('beforeend',`<div class="battle-enemy-art ${hit?'impact':''}" aria-label="${uiEscape(enemy.name)}">${picture?`<img src="${uiEscape(picture)}" alt="${uiEscape(enemy.name)}">`:`<span>${enemy.icon||'👹'}</span>`}<small>${uiEscape(enemy.traitName||enemy.hint||'')}</small></div><nav class="battle-toolbar"><button onclick="openBattleMenu()">アイテム・特殊行動</button><button onclick="openBattleLog()">ログ・発動</button></nav><div class="battle-location">B${state.floor}F ${uiEscape(explorationArea()?.name||getCurrentArea().name||'')}</div>`);
 root.querySelectorAll('.enemy-parts button').forEach((b,i)=>{const part=enemy.parts?.[i-1];if(part)b.insertAdjacentHTML('beforeend',`<progress aria-label="${PART_TYPES[part.id].name}耐久" max="${part.maxHp}" value="${part.hp}"></progress>`);});
 const broken=recent.findLast(e=>e.kind==='part'&&e.label.includes('破壊'));
 const announcement=broken?broken.label.replace('を破壊！',' BREAK！'):Date.now()-BattleUI.noticeTime<1200?BattleUI.notices.at(-1):'';
 if(announcement)root.querySelector('.battle-enemy-art').insertAdjacentHTML('beforeend',`<b class="battle-announcement">${uiEscape(announcement)}</b>`);
 const weakened=(enemy.parts||[]).filter(p=>p.broken&&(PART_TYPES[p.id].atk||PART_TYPES[p.id].def)).map(p=>PART_TYPES[p.id].name+'：'+(PART_TYPES[p.id].atk?'ATK↓':'DEF↓'));
 if(weakened.length)root.querySelector('.battle-enemy-art').insertAdjacentHTML('beforeend',`<small>${uiEscape(weakened.join(' / '))}</small>`);
 const actions=root.querySelector('.combat-actions');
 if(actions)for(const b of actions.querySelectorAll('button')){if(enemy.acting)b.setAttribute('aria-description','行動処理中：次のターンまでお待ちください');}
};
const battleFloatingBase=spawnFloatingFx;
spawnFloatingFx=function(text,...args){if(state.screen==='battle'&&/GUARD|ガード/.test(text))battleNotice(text);return battleFloatingBase(text,...args);};
