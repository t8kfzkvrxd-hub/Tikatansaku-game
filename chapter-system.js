function initialChapterState(){return {mode:null,contract:false,owned:{},companion:null,unlocked:{},read:{},choices:{},tutorialSeen:{},guideStep:0,guideActive:false,pending:null,lastStand:null,complete:false,elnaFate:'alive',checkpoint:null};}
function migrateChapter(saved) {
 state.chapter={...initialChapterState(),...(saved||{})};
 const c=state.chapter;
 if(!saved && (state.deepestFloorReached>=10||Object.keys(state.bossFirstKills).length>0)) {
  c.mode='skip';c.contract=true;c.owned.elna=true;c.companion='elna';
  for(const floor of BOSS_FLOORS.filter(f=>f<100&&f<=Math.max(state.deepestFloorReached,...Object.keys(state.bossFirstKills).map(Number))))c.unlocked[floor]=true;
 }
 for(const floor of BOSS_FLOORS)if(state.bossFirstKills[floor])state.maxUnlockedFloor=Math.max(state.maxUnlockedFloor,Math.min(MAX_DUNGEON_FLOOR,floor+10));
 if(state.deepestFloorReached>=60)state.maxUnlockedFloor=Math.max(state.maxUnlockedFloor,70);
 if(c.pending&&c.checkpoint)Object.assign(state,c.checkpoint);
 migrateCompanionEquipment();
}
function checkpointChapter() {
 const keys=['screen','floor','inventory','dungeonGold','hp','maxHp','currentEnemy','runKills','greedLevel','modifiers','statusEffects','skillCooldown','bossFirstKills','maxUnlockedFloor'];
 state.chapter.checkpoint=Object.fromEntries(keys.map(k=>[k,JSON.parse(JSON.stringify(state[k]??null))]));
 saveState();
}
function showChapterModal(title,body,actions) {
 const m=document.getElementById('modal-layer');m.style.display='flex';m.className='legendary-modal';
 m.innerHTML=`<div class="card update-notes-card" style="max-width:650px"><header class="update-notes-header"><h2 style="font-size:18px;color:#fbbf24">${title}</h2></header><div class="update-notes-body" style="line-height:1.9">${body}</div><footer class="update-notes-actions" style="display:flex;flex-wrap:wrap;gap:6px">${actions}</footer></div>`;
}
function showChapterWelcome() {
 if(state.chapter.pending){resumeChapter();return;}
 if(state.chapter.mode)return;
 showChapterModal('🌻 冒険のはじまり',`<p>幼馴染エルナと、地下1000階を目指す約束。操作説明の量を選んでください。物語はどのモードでも解放され、書庫で読み返せます。</p><p>初期支援・同行登録・装備・素材は全モード共通です。</p>`,[['full','初めて遊ぶ'],['brief','説明だけ省略'],['skip','チュートリアルをスキップ']].map(([id,label])=>`<button class="btn btn-gold btn-xs" onclick="chooseTutorialMode('${id}')">${label}</button>`).join(''));
}
function chooseTutorialMode(mode) {
 if(!['full','brief','skip'].includes(mode))return;
 state.chapter.mode=mode;saveState();showFirstContract();
}
function showFirstContract() {
 if(state.chapter.contract){closeGenericModal();render();return;}
 showChapterModal('初回無料・同行契約登録',`<div style="font-size:42px;text-align:center">🌻</div><p>エルナ「今さら契約とか必要なの？ 昔から一緒なのにね」</p><p>召喚ではなく、二人の冒険を正式に登録します。初回契約はエルナ確定です。</p>`,`<button class="btn btn-gold" onclick="registerFirstContract()">無料で1回登録する</button>`);
}
function registerFirstContract() {
 const c=state.chapter;if(c.contract)return;
 c.contract=true;c.owned.elna=true;c.companion='elna';
 migrateCompanionEquipment();
 state.vaultGold+=200;
 const key=AREAS[0].enemies[0].materialSource+'_common';
 for(let i=0;i<3;i++)state.storage.push({...MATERIALS[key],key,id:crypto.randomUUID(),type:'material'});
 discoverMaterial(key);
 state.preparedItems.push({id:crypto.randomUUID(),name:'エルナの万能解毒薬',icon:'💊',type:'potion',rarity:'Rare',heal:20,cureAll:true,desc:'毒・呪毒・出血・麻痺・拘束・呪い・弱体化を解除（装備の呪詛は除く）'});
 saveState();closeGenericModal();render();addLog('🌻 エルナが正式同行。初期支援200G・素材3個・万能解毒薬を受け取った。','gold');
}
function tutorialBanner() {
 const c=state.chapter,step=TUTORIAL_STEPS[state.floor];
 if(!c.contract||!step||c.mode==='skip'||c.read[10])return '';
 return `<div class="item-row" style="font-size:12px;margin-bottom:8px"><span>🌻 エルナ：${c.mode==='brief'?step[0]:step[1]}</span></div>`;
}
function chapterTownHtml() {
 const c=state.chapter;
 return `<div class="item-row" style="display:block;font-size:12px;margin-bottom:8px"><button class="btn btn-sub btn-xs" onclick="openMemoryArchive()">📖 記憶の書庫</button> <button class="btn btn-sub btn-xs" onclick="openCompanionRegister()">🌻 同行登録</button>${!c.contract?'<button class="btn btn-gold btn-xs" onclick="showChapterWelcome()">冒険の準備</button>':''}${c.complete?'<p>窓際の席だけが空いている。エルナの契約札は、まだ温かい。第1章 完 ― 次の階段は封印されている。</p>':''}${c.guideActive?`<p>🌻 拠点案内：${['鍛冶屋で装備作成','倉庫で素材・装備整理','道具屋で次の支度','酒場でひと休み','記憶の書庫で振り返り'][c.guideStep]||'案内完了'}</p><button class="btn btn-gold btn-xs" onclick="advanceTownGuide()">${c.guideStep<5?'案内を見る':'案内を終える'}</button>`:''}</div>`;
}
function advanceTownGuide(){
 const c=state.chapter,step=c.guideStep++;
 if(step===0)openCrafting('create');
 else if(step===1){setTab('bag');showChapterModal('📦 倉庫','<p>素材はまとめて表示されます。作成に使う素材や装備は、売却前にロックを確認しましょう。</p>','<button class="btn btn-gold" onclick="closeGenericModal()">確認</button>');}
 else if(step===2)showChapterModal('🏪 道具屋','<p>購入品は次の探索へ持ち越されます。まず薬と帰還手段を用意しましょう。</p>','<button class="btn btn-gold" onclick="closeGenericModal()">地上の道具屋を見る</button>');
 else if(step===3)showChapterModal('🍺 いつもの席','<p>エルナ「10階くらいでそんなに疲れてたら1000階なんて無理じゃない？ ……冗談。今日はよく頑張ったね」</p><p>討伐依頼は酒場Lv2から。受けた依頼は帰還後に報酬を受け取れます。</p>','<button class="btn btn-gold" onclick="closeGenericModal()">休憩を終える</button>');
 else if(step===4)openMemoryArchive();
 else c.guideActive=false;
 saveState();render();
}
function openCompanionRegister(){
 const c=state.chapter;
 if(!c.contract){showFirstContract();return;}
 openCharacterEquipment('elna');
}
function openMemoryArchive(){
 const c=state.chapter;
 const rows=BOSS_FLOORS.map(f=>`<button class="btn btn-sub" style="width:100%;text-align:left" ${c.unlocked[f]?'':'disabled'} onclick="startChapterStory(${f},true)">第1章 第${f/10}話「${c.unlocked[f]?CHAPTER_STORIES[f].title:'？？？'}」${c.read[f]?' ✓既読':''}</button>`).join('');
 showChapterModal('📖 記憶の書庫',rows+'<p>キャラストーリー / イベントストーリー / メモリアル：今後解放</p>','<button class="btn btn-gold" onclick="closeGenericModal()">閉じる</button>');
}
function startChapterStory(floor,replay=false){
 const c=state.chapter;if(replay&&!c.unlocked[floor])return;
 c.unlocked[floor]=true;c.pending={kind:'story',floor,page:0,replay};
 if(!replay)state.screen='chapter';
 checkpointChapter();renderChapterStory();
}
function renderChapterStory(){
 const p=state.chapter.pending;if(!p||p.kind!=='story')return;
 const episode=CHAPTER_STORIES[p.floor],line=episode.lines[p.page];
 if(!line){finishChapterStory();return;}
 const actions=line[0]==='選択'?line.slice(2).map((label,i)=>`<button class="btn btn-gold btn-xs" onclick="nextChapterPage(${i})">${label}</button>`).join(''):`<button class="btn btn-gold" onclick="nextChapterPage()">次へ</button>`;
 showChapterModal(`第1章 第${p.floor/10}話「${episode.title}」`, `<div style="font-size:11px;color:#94a3b8">${p.page+1} / ${episode.lines.length}${p.replay?' ― 書庫再生':''}</div><b style="color:#fbbf24">${line[0]}</b><p>${line[1]}</p>`,actions+`<button class="btn btn-sub btn-xs" onclick="finishChapterStory()">物語をスキップ</button>`);
}
function nextChapterPage(choice){
 const p=state.chapter.pending;if(!p||p.kind!=='story')return;
 if(choice!==undefined&&!p.replay)state.chapter.choices[p.floor]=choice;
 p.page++;checkpointChapter();renderChapterStory();
}
function finishChapterStory(){
 const c=state.chapter,p=c.pending;if(!p)return;
 c.read[p.floor]=true;
 if(p.replay){c.pending=null;c.checkpoint=null;saveState();if(p.floor===100)showChapterFarewell(true);else openMemoryArchive();return;}
 if(p.floor===100&&!c.complete){startElnaLastStand();return;}
 c.pending=null;c.checkpoint=null;closeGenericModal();
 if(p.floor===10||p.floor===50){
  if(p.floor===10){c.guideActive=c.mode==='full';c.guideStep=0;}
  state.selectedStartFloor=p.floor+1;c.pending={kind:'return',floor:p.floor};checkpointChapter();returnToTown(true);
 }else {state.floor=p.floor+1;state.currentEnemy=null;generateDoorsForFloor();}
 saveState();
}
function afterChapterBoss(floor) {
 const c=state.chapter;
 state.maxUnlockedFloor=Math.max(state.maxUnlockedFloor,Math.min(MAX_DUNGEON_FLOOR,floor+10));
 state.currentEnemy=null;c.unlocked[floor]=true;
 if(floor===100&&c.complete){saveState();returnToTown(true);return;}
 if(floor<100&&c.read[floor]){state.floor=floor+1;generateDoorsForFloor();return;}
 startChapterStory(floor);
}
function startElnaLastStand(){
 const c=state.chapter;c.pending={kind:'lastStand',floor:100};
 const gear=companionStats('elna');
 c.lastStand={turn:0,hp:gear.maxHp,maxHp:gear.maxHp,gear,weaponName:characterEquipment('elna')?.weapon?.name||'陽光剣',enemyHp:360,enemyMaxHp:360,cooldown:0,reinforcements:0,log:'エルナを操作：退避路の扉を守る。装備の能力を反映した物語戦です。'};
 checkpointChapter();renderElnaLastStand();
}
function renderElnaLastStand(){
 const b=state.chapter.lastStand;
 showChapterModal('🌻 エルナ ― 閉じる扉を守れ',`<p>正体不明の存在「照合に不要な記憶を排除する」</p><p>エルナ HP ${b.hp}/${b.maxHp}　敵 ${b.enemyHp}/${b.enemyMaxHp}</p>${b.gear?`<p>装備：${uiEscape(b.weaponName)} / ATK ${b.gear.atk} / DEF ${b.gear.def}<br>${uiEscape(effectDescription(b.gear.effects))}</p>`:''}<p>退避時間 ${b.turn}/8　修正の影 ${b.reinforcements}/2</p><p>${b.log}</p><p>物語戦：ここでの消耗は装備・素材・Gを失わせません。</p>`,
 `<button class="btn btn-gold btn-xs" onclick="elnaAction('attack')">斬り込む</button><button class="btn btn-blue btn-xs" onclick="elnaAction('defend')">扉を守る</button><button class="btn btn-purple btn-xs" ${b.cooldown?'disabled':''} onclick="elnaAction('skill')">陽光剣 ${b.cooldown?'あと'+b.cooldown+'T':''}</button><button class="btn btn-red btn-xs" ${b.turn<5?'disabled':''} onclick="elnaAction('ultimate')">約束の一閃</button><button class="btn btn-sub btn-xs" onclick="finishElnaLastStand()">物語戦をスキップ</button>`);
}
function elnaAction(action){
 const c=state.chapter,b=c.lastStand;if(c.pending?.kind!=='lastStand'||!b)return;
 if(!['attack','defend','skill','ultimate'].includes(action)||action==='skill'&&b.cooldown>0||action==='ultimate'&&b.turn<5)return;
 const gear=b.gear||{atk:36,def:0,crit:0,effects:{}},effects=gear.effects||{};
 b.turn++;if(action!=='skill')b.cooldown=Math.max(0,b.cooldown-1);else b.cooldown=Math.max(1,2-(effects.skillHaste||0));
 const critical=action!=='defend'&&Math.random()*100<Math.min(75,gear.crit||0);
 const damage=Math.round(({attack:1,defend:8/36,skill:70/36,ultimate:5}[action]*gear.atk)*(action==='skill'?1+Math.min(100,effects.skillPower||0)/100:1)*(critical?1.5+Math.min(150,effects.critDamage||0)/100:1)+(action!=='defend'?(effects.fireDamage||0):0));
 b.enemyHp=Math.max(30,b.enemyHp-damage);
 b.reinforcements=Math.min(2,Math.floor(b.turn/3));
 const incoming=Math.max(3,14+b.turn*4+b.reinforcements*8-Math.round(gear.def*.35));
 const dodged=Math.random()*100<Math.min(50,effects.dodge||0);
 b.hp=Math.max(0,b.hp-(dodged?0:Math.round(incoming*(action==='defend'?.4:1))));
 if(b.hp>0&&action==='defend')b.hp=Math.min(b.maxHp,b.hp+(effects.guardHeal||0));
 if(b.turn>=4)b.enemyHp=Math.min(b.enemyMaxHp,b.enemyHp+35);
 b.log=`${b.weaponName||'陽光剣'}：${action==='defend'?'扉を支え、攻撃を受け流した':action==='ultimate'?'幼い日の約束を込めた光が闇を裂いた':`刃が届いた。${damage}の手応え${critical?'（会心）':''}`}。${dodged?'攻撃を回避。':''}${b.turn>=4?'傷が書き換えられ、影が増える。':''}`;
 if(b.turn>=8||b.hp<=0||action==='ultimate'){finishElnaLastStand();return;}
 checkpointChapter();renderElnaLastStand();
}
function finishElnaLastStand(){
 const c=state.chapter;if(c.pending?.kind!=='lastStand')return;
 c.pending={kind:'farewell',floor:100};checkpointChapter();showChapterFarewell();
}
function showChapterFarewell(replay=false){
 showChapterModal('最後の一閃',`<p>エルナは残った力を剣に集めた。光が存在の胸を貫く。一瞬だけ、あの影が消えたように見えた。</p><p>正体不明の存在「その結末は、採用されない」</p><p>光の跡が塗り直される。けれど、閉じ切った扉の向こうへ影は進めなかった。彼女が稼いだ時間だけは、もう奪えない。</p><p>エルナ「帰ったら、甘いもの食べようって言ったのにな。」</p><p>剣を握る指から力が抜ける。扉の向こうの足音が遠ざかったことを確かめ、彼女は小さく笑った。エルナは、戻らなかった。</p>`,`<button class="btn btn-gold" onclick="${replay?'openMemoryArchive()':'completeChapterOne()'}">${replay?'書庫へ戻る':'地上へ'}</button>`);
}
function completeChapterOne(){
 const c=state.chapter;if(c.pending?.kind!=='farewell')return;
 c.complete=true;c.elnaFate='lost';c.read[100]=true;c.pending={kind:'return',floor:100};c.lastStand=null;
 state.hp=Math.max(1,state.hp);state.currentEnemy=null;
 checkpointChapter();closeGenericModal();returnToTown(true);
}
function resumeChapter(){
 const p=state.chapter.pending;
 if(p?.kind==='story')renderChapterStory();else if(p?.kind==='lastStand')renderElnaLastStand();else if(p?.kind==='farewell')showChapterFarewell();else if(p?.kind==='return')returnToTown(true);
}
