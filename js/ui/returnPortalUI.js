const ReturnPortal={busy:false,confirming:false,floor:null};
function returnPortalActive(){return state.screen==='safe_point'&&isSafeReturnFloor(state.floor)&&!HomeScreen.active;}
function returnPortalConfirmationOpen(){return !!document.getElementById('portal-return-confirm')&&document.getElementById('modal-layer').style.display!=='none';}
function returnPortalLoot(){
 const materials=new Map();let other=0;
 for(const item of state.inventory){if(item.type==='material'){const key=item.key||item.id;const entry=materials.get(key)||{name:item.name||key,count:0};entry.count++;materials.set(key,entry);}else other++;}
 return {materials,kinds:materials.size,total:[...materials.values()].reduce((n,v)=>n+v.count,0),other,gold:state.dungeonGold};
}
function returnPortalSummary(){const l=returnPortalLoot();return `<p>現在階：<b>${state.floor}F</b></p><p>持ち帰れる素材：<br><b>${l.kinds}種類 / 合計${l.total}個</b></p><p>G：${l.gold.toLocaleString()} / その他：${l.other}個</p>`;}
function syncReturnPortal(){
 const active=returnPortalActive();document.body.classList.toggle('at-return-portal',active);document.documentElement.classList.toggle('at-return-portal',active);
 let root=document.getElementById('return-portal-screen');
 if(!active){if(root)root.hidden=true;if(!ReturnPortal.busy){ReturnPortal.floor=null;ReturnPortal.confirming=false;}return;}
 if(!root){root=document.createElement('section');root.id='return-portal-screen';root.setAttribute('aria-label','帰還ポータル');document.body.append(root);}
 root.hidden=false;if(ReturnPortal.busy)return;
 ReturnPortal.floor=state.floor;
 root.innerHTML=`<div class="return-portal-crop"><div class="return-portal-art" aria-hidden="true"><img src="assets/images/exploration/return-portal.png" alt=""><div class="return-portal-glow"></div><div class="return-portal-rune"></div><div class="return-portal-fog"></div><div class="return-portal-lamps"></div><div class="return-portal-particles">${Array.from({length:6},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div></div></div><div class="return-portal-panel"><small>安全なロビーへの帰還門</small><h1>帰還ポータル</h1>${returnPortalSummary()}<button class="portal-detail" onclick="showReturnPortalDetails()">持ち帰り詳細を見る</button><button class="portal-primary" onclick="confirmReturnPortal()">ロビーへ帰還する</button><button onclick="continueReturnPortal()">探索を続ける</button><small>続行：次の階へ / GREED +1</small></div><div class="return-portal-fade" aria-hidden="true"></div>`;
}
function showReturnPortalDetails(){if(!returnPortalActive()||ReturnPortal.busy)return;const l=returnPortalLoot();showChapterModal('持ち帰り対象',returnPortalSummary()+[...l.materials.values()].map(v=>`<p>${uiEscape(v.name)} ×${v.count}</p>`).join(''),'<button class="btn" onclick="closeGenericModal()">ポータルへ戻る</button>');}
function confirmReturnPortal(){
 if(!returnPortalActive()||ReturnPortal.busy||returnPortalConfirmationOpen())return;ReturnPortal.confirming=true;
 showChapterModal('ロビーへ帰還しますか？',`<div id="portal-return-confirm">${returnPortalSummary()}</div>`,'<button class="btn" onclick="commitReturnPortal()">帰還する</button><button class="btn" onclick="cancelReturnPortal()">キャンセル</button>');
}
function cancelReturnPortal(){if(ReturnPortal.busy)return;ReturnPortal.confirming=false;closeGenericModal();}
function lockReturnPortal(){ReturnPortal.busy=true;document.querySelectorAll('#return-portal-screen button,#modal-layer button').forEach(b=>{b.disabled=true;b.style.pointerEvents='none';});}
function commitReturnPortal(){
 if(!returnPortalActive()||ReturnPortal.busy||!returnPortalConfirmationOpen())return;
 const floor=state.floor;lockReturnPortal();closeGenericModal();const root=document.getElementById('return-portal-screen');root.classList.add('departing');
 setTimeout(()=>{try{if(returnPortalActive()&&state.floor===floor)returnToTown(true);}finally{ReturnPortal.busy=false;ReturnPortal.confirming=false;root.classList.remove('departing');syncReturnPortal();}},matchMedia('(prefers-reduced-motion:reduce)').matches?0:700);
}
function continueReturnPortal(){
 if(!returnPortalActive()||ReturnPortal.busy||returnPortalConfirmationOpen()||performance.now()<inputSafety.until)return;
 lockReturnPortal();try{diveDeeperFromSafePoint();}finally{ReturnPortal.busy=false;syncReturnPortal();}
}
syncReturnPortal();
