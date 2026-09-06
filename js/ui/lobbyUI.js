const LOBBY_FACILITIES=[
 {id:'town-blacksmith',name:'鍛冶場',desc:'装備作成・強化',x:16,y:43,w:27,h:19},
 {id:'warehouse',name:'倉庫',desc:'装備・素材保管',x:16,y:72,w:24,h:23},
 {id:'town-tavern',name:'冒険者の酒場',desc:'依頼・報酬',x:83,y:47,w:27,h:22},
 {id:'town-shop',name:'道具屋',desc:'アイテム購入',x:84,y:76,w:25,h:21},
 {id:'town-lab',name:'研究所',desc:'研究・解析',x:27,y:23,w:22,h:15},
 {id:'archive',name:'記憶の書庫',desc:'物語・記録',x:85,y:23,w:21,h:15},
 {id:'town-expedition',name:'地下迷宮',desc:'探索開始',x:52,y:46,w:19,h:28}
];
const LobbyScreen={observer:null,facility:null};
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
  root.innerHTML=`<div class="lobby-art"><div class="lobby-scene"><img class="lobby-background" src="assets/ac935e06-88d5-4889-9435-5e3a3e410ef6.png" alt="地下拠点の施設マップ"><div class="lobby-fire" aria-hidden="true"></div><div class="lobby-fog" aria-hidden="true"></div><div class="lobby-light" aria-hidden="true"></div>${LOBBY_FACILITIES.map(f=>`<button class="lobby-hotspot" data-facility="${f.id}" style="left:${f.x}%;top:${f.y}%;width:${f.w}%;height:${f.h}%" onclick="openLobbyFacility('${f.id}')"><span><b>${f.name}</b><small>${f.desc}</small></span></button>`).join('')}</div></div><nav class="lobby-menu" aria-label="ロビーメニュー"><button onclick="openLobbyEquipment()">装備</button><button onclick="openLobbyFacility('warehouse')">所持品</button><button onclick="openHomeSettings()">設定</button><button onclick="showHomeScreen()">ホーム</button></nav>`;
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
    const y=Math.max(76,Math.min(art.clientHeight-76,oy+sh*f.y/100));
    button.style.left=(x-ox)+'px';button.style.top=(y-oy)+'px';
   });
  };
  image.addEventListener('load',fitLabels);LobbyScreen.observer=new ResizeObserver(fitLabels);LobbyScreen.observer.observe(art);fitLabels();
 }
 root.hidden=!active;
 if(active)syncLobbySD(root);
 const content=document.getElementById('lobby-facility-content');
 if(content&&!town)closeGenericModal();
 if(town)refreshLobbyFacility();
}
