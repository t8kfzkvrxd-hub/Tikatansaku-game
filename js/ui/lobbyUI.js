const LOBBY_FACILITIES=[
 {id:'town-blacksmith',name:'鍛冶場',desc:'装備作成・強化',x:16,y:43,w:27,h:19},
 {id:'warehouse',name:'倉庫',desc:'装備・素材保管',x:16,y:72,w:24,h:23},
 {id:'town-tavern',name:'冒険者の酒場',desc:'依頼・報酬',x:83,y:47,w:27,h:22},
 {id:'town-shop',name:'道具屋',desc:'アイテム購入',x:84,y:76,w:25,h:21},
 {id:'town-lab',name:'研究所',desc:'研究・解析',x:27,y:23,w:22,h:15},
 {id:'archive',name:'記憶の書庫',desc:'物語・記録',x:85,y:23,w:21,h:15},
 {id:'town-expedition',name:'地下迷宮',desc:'探索開始',x:52,y:46,w:19,h:28}
];
const LobbyScreen={legacy:false,observer:null,facility:null};
function refreshLobbyFacility(){
 const content=document.getElementById('lobby-facility-content');
 if(content&&state.screen==='town'){const target=document.getElementById(LobbyScreen.facility==='warehouse'?'sub-panel':LobbyScreen.facility);if(target)content.innerHTML=target.innerHTML;}
}
function openLobbyFacility(id){
 if(state.screen!=='town')return;
 if(id==='archive'){openMemoryArchive();return;}
 if(id==='warehouse')setTab('bag');
 const target=document.getElementById(id==='warehouse'?'sub-panel':id);if(!target)return;
 LobbyScreen.facility=id;
 showChapterModal(LOBBY_FACILITIES.find(f=>f.id===id)?.name||'所持品',`<div id="lobby-facility-content">${target.innerHTML}</div>`,`<button class="btn btn-sub" onclick="closeGenericModal()">ロビーへ戻る</button>`);
}
function returnToLobby(){LobbyScreen.legacy=false;closeGenericModal();render();}
function openLobbyManagement(){LobbyScreen.legacy=true;syncLobbyScreen();}
function syncLobbyScreen(){
 const town=state.screen==='town'&&!HomeScreen.active;
 const active=town&&!LobbyScreen.legacy;
 document.body.classList.toggle('at-lobby',active);document.documentElement.classList.toggle('at-lobby',active);
 let root=document.getElementById('lobby-screen');
 if(!root){
  root=document.createElement('section');root.id='lobby-screen';root.setAttribute('aria-label','地下拠点');document.body.append(root);
  root.innerHTML=`<div class="lobby-art"><div class="lobby-scene"><img class="lobby-background" src="assets/ac935e06-88d5-4889-9435-5e3a3e410ef6.png" alt="地下拠点の施設マップ"><div class="lobby-fire" aria-hidden="true"></div><div class="lobby-fog" aria-hidden="true"></div><div class="lobby-light" aria-hidden="true"></div>${LOBBY_FACILITIES.map(f=>`<button class="lobby-hotspot" data-facility="${f.id}" style="left:${f.x}%;top:${f.y}%;width:${f.w}%;height:${f.h}%" onclick="openLobbyFacility('${f.id}')"><span><b>${f.name}</b><small>${f.desc}</small></span></button>`).join('')}</div></div><nav class="lobby-menu" aria-label="ロビーメニュー"><button onclick="openCharacterEquipment()">装備</button><button onclick="openLobbyFacility('warehouse')">所持品</button><button onclick="openLobbyManagement()">拠点管理</button><button onclick="openHomeSettings()">設定</button><button onclick="showHomeScreen()">ホーム</button></nav>`;
  const art=root.querySelector('.lobby-art'),scene=root.querySelector('.lobby-scene'),image=root.querySelector('img');
  const fit=()=>{if(!image.naturalWidth||!art.clientWidth)return;const scale=Math.max(art.clientWidth/image.naturalWidth,art.clientHeight/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;Object.assign(scene.style,{width:w+'px',height:h+'px',left:(art.clientWidth-w)/2+'px',top:(art.clientHeight-h)/2+'px'});};
  image.addEventListener('load',fit);LobbyScreen.observer=new ResizeObserver(fit);LobbyScreen.observer.observe(art);fit();
 }
 root.hidden=!active;
 let back=document.getElementById('lobby-return');if(!back){back=document.createElement('button');back.id='lobby-return';back.textContent='拠点マップへ';back.onclick=returnToLobby;document.body.append(back);}back.hidden=!(town&&LobbyScreen.legacy);
 if(!town)LobbyScreen.legacy=false;
 const content=document.getElementById('lobby-facility-content');
 if(content&&!town)closeGenericModal();
 if(town)refreshLobbyFacility();
}
