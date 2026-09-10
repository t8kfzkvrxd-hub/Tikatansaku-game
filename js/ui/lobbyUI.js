const LOBBY_FACILITIES=[
 {id:'town-blacksmith',name:'鍛冶場',desc:'装備作成・強化',x:16,y:43,w:27,h:19},
 {id:'warehouse',name:'倉庫',desc:'装備・素材保管',x:16,y:72,w:24,h:23},
 {id:'town-tavern',name:'冒険者の酒場',desc:'依頼・報酬',x:83,y:47,w:27,h:22},
 {id:'town-shop',name:'道具屋',desc:'アイテム購入',x:84,y:76,w:25,h:21},
 {id:'town-lab',name:'研究所',desc:'研究・解析',x:27,y:23,w:22,h:15},
 {id:'archive',name:'記憶の書庫',desc:'物語・記録',x:85,y:23,w:21,h:15},
 {id:'town-expedition',name:'地下迷宮',desc:'探索開始',x:52,y:43,w:19,h:28},
 {id:'summons',name:'召喚',desc:'召喚・周回',x:52,y:65,w:18,h:13}
];
const LobbyScreen={observer:null,facility:null,selection:null};
function selectLobbyFacility(id){
 const root=document.getElementById('lobby-screen');
 if(LobbyScreen.selection||HomeScreen.active||state.screen!=='town')return;
 LobbyScreen.selection=id;root.classList.add('is-selecting');
 root.querySelector(`[data-facility="${id}"]`)?.classList.add('is-selected');
 setTimeout(()=>{
  const valid=LobbyScreen.selection===id&&!HomeScreen.active&&state.screen==='town';
  LobbyScreen.selection=null;root.classList.remove('is-selecting');root.querySelector('.is-selected')?.classList.remove('is-selected');
  if(!valid)return;
  if(id==='town-expedition'&&!state.chapter.contract){state.chapter.mode?showFirstContract():showChapterWelcome();return;}
  id==='summons'?openSummons():openLobbyFacility(id);
 },matchMedia('(prefers-reduced-motion:reduce)').matches?0:260);
}
function syncLobbyNotices(root){
 const next=BOSS_FLOORS.find(f=>!state.bossFirstKills[f]);
 const notices={'town-expedition':!state.chapter.contract?'同行登録から始めよう':next?`次の目標 ${next}F`:'探索へ',summons:(state.summonSystem?.jobs||[]).some(j=>Date.now()>=j.end)?'派遣完了':'','town-blacksmith':pendingFacilityUnlock?'新しい機能が解禁':forgeRecommendations('player',1).length?'おすすめ装備あり':'','town-tavern':facilityAvailable(2)&&state.bounty?.completed?'依頼報酬あり':''};
 root.querySelectorAll('.lobby-hotspot').forEach(button=>{const badge=button.querySelector('.lobby-notice'),message=notices[button.dataset.facility]||'';badge.textContent=message;badge.hidden=!message;});
}
function lobbyNextHtml(){
 if(!state.chapter.contract)return '<button class="lobby-next" onclick="state.chapter.mode?showFirstContract():showChapterWelcome()"><b>冒険の準備をする</b><small>エルナと同行登録・最初の支援</small></button>';
 if(pendingFacilityUnlock)return `<button class="lobby-next" onclick="openFacilityUnlock()"><b>新しい施設機能が解禁</b><small>タップして確認</small></button>`;
 const finished=(state.summonSystem?.jobs||[]).some(j=>Date.now()>=j.end);
 const next=BOSS_FLOORS.find(f=>!state.bossFirstKills[f]);
 return `<button class="lobby-next" onclick="${finished?"openSummons('dispatch')":"openLobbyNext()"}"><b>${finished?'召喚派遣の報酬を受け取る':next?'次の目標：'+next+'Fボス':'次の目標：装備・ビルドを整える'}</b><small>探索・装備・次のおすすめ</small></button>`;
}
function openLobbyNext(){
 const row=forgeRecommendations('player',1)[0];
 showChapterModal('次のおすすめ',`<button class="btn" onclick="openLobbyFacility('town-expedition')">探索へ行く</button><button class="btn" onclick="openLobbyEquipment()">装備を整える</button>${row?`<p>${uiEscape(row.r.name)}：${uiEscape(row.reason)}</p><button class="btn btn-gold" onclick="selectForgeView('recommended')">おすすめを鍛冶屋で確認</button>`:'<p>素材を持ち帰ると、鍛冶屋で次の装備を推薦します。</p>'}`,'<button class="btn btn-sub" onclick="closeGenericModal()">閉じる</button>');
}
function lobbyFacilityHtml(id){
 const html=target=>document.getElementById(target)?.innerHTML||'';
 const funds=`<p>地上保管G：${state.vaultGold} / 核：${state.abyssCores} / 結晶：${state.deepCrystals}</p>`;
 if(id==='warehouse')return funds+warehouseEquippedSD()+html('town-vault')+html('sub-panel');
 if(id==='codex'||id==='log')return html('sub-panel');
 if(id==='town-lab')return funds+html(id)+`<button class="btn btn-sub" onclick="openLobbyFacility('codex')">図鑑・素材図鑑</button>`;
 return funds+html(id);
}
function openLobbyEquipment(characterId='player'){openCharacterEquipment(characterId);}
function refreshLobbyFacility(){
 const content=document.getElementById('lobby-facility-content');
 if(content&&state.screen==='town')content.innerHTML=lobbyFacilityHtml(LobbyScreen.facility);
}
function openLobbyFacility(id){
 if(state.screen!=='town')return;
 if(id==='town-blacksmith'){selectForgeView('recommended');return;}
 if(id==='archive'){
  showChapterModal('記憶の書庫',`<button class="btn btn-sub" onclick="openMemoryArchive()">ストーリー・回想</button><button class="btn btn-sub" onclick="openLobbyFacility('log')">冒険の軌跡</button><p>最高到達 B${state.deepestFloorReached}F / 解放 B${state.maxUnlockedFloor}F</p>`,`<button class="btn btn-sub" onclick="closeGenericModal()">ロビーへ戻る</button>`);return;
 }
 LobbyScreen.facility=id;
 if(id==='warehouse')setTab('bag');
 if(id==='codex'||id==='log')setTab(id);
 showChapterModal(LOBBY_FACILITIES.find(f=>f.id===id)?.name||{codex:'図鑑',log:'冒険の軌跡'}[id]||'所持品',`<div id="lobby-facility-content">${lobbyFacilityHtml(id)}</div>`,`<button class="btn btn-sub" onclick="closeGenericModal()">ロビーへ戻る</button>`);
}
function syncLobbyScreen(){
 if(typeof syncLobbyAudio==='function')syncLobbyAudio();
 const town=state.screen==='town'&&!HomeScreen.active;
 const active=town;
 document.body.classList.toggle('at-lobby',active);document.documentElement.classList.toggle('at-lobby',active);
 let root=document.getElementById('lobby-screen');
 if(!root){
  root=document.createElement('section');root.id='lobby-screen';root.setAttribute('aria-label','地下拠点');document.body.append(root);
  root.innerHTML=`<div class="lobby-art"><div class="lobby-scene"><img class="lobby-background" src="assets/ac935e06-88d5-4889-9435-5e3a3e410ef6.png" alt="地下拠点の施設マップ"><div class="lobby-fire" aria-hidden="true"></div><div class="lobby-fog" aria-hidden="true"></div><div class="lobby-light" aria-hidden="true"></div><div class="lobby-tavern-glow" aria-hidden="true"></div><div class="lobby-summon-glow" aria-hidden="true"></div><div class="lobby-embers" aria-hidden="true"></div><div class="lobby-magic" aria-hidden="true"></div>${LOBBY_FACILITIES.map(f=>`<button class="lobby-hotspot" aria-label="${f.name}：${f.desc}" data-facility="${f.id}" style="left:${f.x}%;top:${f.y}%;width:${f.w}%;height:${f.h}%" onclick="selectLobbyFacility('${f.id}')"><span><b>${f.name}</b><small class="lobby-notice" hidden></small></span></button>`).join('')}</div></div><nav class="lobby-menu" aria-label="ロビーメニュー"><button onclick="openLobbyEquipment()">装備</button><button onclick="openLobbyFacility('warehouse')">所持品</button><button onclick="openHomeSettings()">設定</button><button onclick="showHomeScreen()">ホーム</button></nav>`;
  const art=root.querySelector('.lobby-art'),scene=root.querySelector('.lobby-scene'),image=root.querySelector('img');
  const fit=()=>{if(!image.naturalWidth||!art.clientWidth)return;const scale=Math.max(art.clientWidth/image.naturalWidth,art.clientHeight/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;Object.assign(scene.style,{width:w+'px',height:h+'px',left:(art.clientWidth-w)/2+'px',top:(art.clientHeight-h)/2+'px'});};
  const fitLabels=()=>{
   fit();
   const compact=matchMedia('(orientation:landscape) and (max-height:540px) and (max-width:1100px)').matches;
   const sw=scene.offsetWidth,sh=scene.offsetHeight,ox=(art.clientWidth-sw)/2,oy=(art.clientHeight-sh)/2;
   root.querySelectorAll('.lobby-hotspot').forEach((button,i)=>{
    const f=LOBBY_FACILITIES[i];
    if(!compact){button.style.left=f.x+'%';button.style.top=f.y+'%';return;}
    const half=button.offsetWidth/2+8;
    const x=Math.max(half,Math.min(art.clientWidth-half,ox+sw*f.x/100));
    const y=Math.max(button.offsetHeight/2+8,Math.min(art.clientHeight-52-button.offsetHeight/2,oy+sh*f.y/100));
    button.style.left=(x-ox)+'px';button.style.top=(y-oy)+'px';
   });
  };
  image.addEventListener('load',fitLabels);LobbyScreen.observer=new ResizeObserver(fitLabels);LobbyScreen.observer.observe(art);fitLabels();
 }
 root.hidden=!active;
 root.querySelector('.lobby-next')?.remove();
 if(active)syncLobbyNotices(root);
 if(!active)LobbyScreen.selection=null;
 if(active)syncLobbySD(root);
 const content=document.getElementById('lobby-facility-content');
 if(content&&!town)closeGenericModal();
 if(town)refreshLobbyFacility();
}
