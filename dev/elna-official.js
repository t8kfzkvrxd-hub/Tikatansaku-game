(() => {
 const root='../assets/characters/elna/official/';
 const stage=document.getElementById('stage'),character=document.getElementById('character');
 let config;
 function fit(){
  if(!config)return;
  const {width,height}=stage.getBoundingClientRect();
  const zoom=document.getElementById('zoom').checked;
  const scale=Math.min(width/config.canvas.width,height/(zoom?600:config.canvas.height));
  character.style.transform=`translate(${(width-config.canvas.width*scale)/2}px,${zoom?0:(height-config.canvas.height*scale)/2}px) scale(${scale})`;
 }
 window.addEventListener('resize',fit,{passive:true});new ResizeObserver(fit).observe(stage);
 document.getElementById('checker').onclick=()=>stage.classList.toggle('checker');
 document.getElementById('zoom').onchange=fit;
 fetch(root+'elna-config.json').then(r=>{if(!r.ok)throw Error('設定読込失敗');return r.json()}).then(async data=>{
  config=data;window.elnaOfficialConfig=data;
  character.style.width=data.canvas.width+'px';character.style.height=data.canvas.height+'px';
  const loaded=[];
  for(const p of data.parts){
   const img=document.createElement('img');img.alt='';img.dataset.part=p.file;
   Object.assign(img.style,{left:p.x+'px',top:p.y+'px',width:p.displayWidth+'px',height:p.displayHeight+'px',zIndex:p.zIndex,transformOrigin:`${p.transformOrigin.x*100}% ${p.transformOrigin.y*100}%`});
   loaded.push(new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error(p.file+' 読込失敗'));}));
   img.src=root+p.file;character.append(img);
   const li=document.createElement('li');li.textContent=p.file;document.getElementById('parts').append(li);
  }
  fit();await Promise.all(loaded);document.getElementById('status').textContent=data.parts.length+'パーツ読込済み / '+data.status;window.elnaOfficialReady=true;
 }).catch(e=>{document.getElementById('status').textContent=e.message;window.elnaOfficialError=e.message});
})();
