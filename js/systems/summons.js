function summonState(){
 const s=state.summonSystem;
 if(!s||typeof s!=='object'||Array.isArray(s))state.summonSystem={owned:{},pity:{2:0,3:0,4:0,5:0},jobs:[],revision:0,lastClock:0,history:[]};
 const d=state.summonSystem;d.owned??={};d.pity??={};d.jobs??=[];d.history??=[];d.revision=Number(d.revision)||0;d.lastClock=Number(d.lastClock)||0;
 for(const k of Object.keys(SUMMON_CONFIG.pity))d.pity[k]=Math.max(0,Math.min(SUMMON_CONFIG.pity[k],Number(d.pity[k])||0));
 return d;
}
function summonsUnlocked(){return clearedMaterialMilestone(SUMMON_CONFIG.unlockBoss);}
function summonTier(rng=Math.random){let r=rng();for(let i=0;i<SUMMON_CONFIG.rates.length;i++){r-=SUMMON_CONFIG.rates[i];if(r<0)return i;}return 5;}
function summonDraw(d,rng=Math.random){
 let tier=summonTier(rng);for(const [k,cap]of Object.entries(SUMMON_CONFIG.pity)){d.pity[k]++;if(d.pity[k]>=cap)tier=Math.max(tier,Number(k));}
 for(const k of Object.keys(SUMMON_CONFIG.pity))if(tier>=Number(k))d.pity[k]=0;
 const pool=Object.values(SUMMONS).filter(s=>s.tier===tier),s=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))],duplicate=!!d.owned[s.id];
 if(duplicate)d.owned[s.id].stones=(Number(d.owned[s.id].stones)||0)+1;else d.owned[s.id]={stones:0,favorite:false};
 return {id:s.id,duplicate};
}
let summonBusy=false,summonLastAction=0;
async function summonTransaction(change){
 if(summonBusy||Date.now()-summonLastAction<350||state.screen!=='town')return false;
 summonBusy=true;summonLastAction=Date.now();
 try{
  const execute=()=>{
   const d=summonState();let stored;try{stored=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(e){throw Error('セーブを読み取れません。再読み込みしてください');}
   if((stored?.summonSystem?.revision||0)!==d.revision)throw Error('別の画面で召喚データが更新されました。再読み込みしてください');
   const backup={summonSystem:JSON.parse(JSON.stringify(d)),vaultGold:state.vaultGold,storage:state.storage.slice(),craftProgress:JSON.parse(JSON.stringify(state.craftProgress))};
   try{const result=change(d);if(result===false)return false;d.revision++;if(!saveState())throw Error('保存できません。空き容量をご確認ください');return result;}
   catch(e){Object.assign(state,backup);throw e;}
  };
  // Web Locks serializes purchases/claims across same-origin tabs without a new save key.
  if(!navigator.locks)throw Error('このブラウザは安全な同時保存に非対応です。最新版の通常ブラウザをご利用ください');
  return await navigator.locks.request('tikatansaku-summons',execute);
 }catch(e){showChapterModal('召喚所',uiEscape(e.message),'<button class="btn" onclick="openSummons()">戻る</button>');return false;}
 finally{summonBusy=false;}
}
function summonSpecialtyPoints(s){return Math.min(.2,SUMMON_SPECIALTY_OVERRIDES[s.id]??SUMMON_CONFIG.specialtyPoints);}
function summonEff(s,kind,tags=[]){const matches=s.specialties.some(t=>tags.includes(t));return Math.min(SUMMON_CONFIG.caps[kind],SUMMON_CONFIG[kind][s.tier]+(matches?summonSpecialtyPoints(s):0));}
function summonRanges(){return AREAS.filter(a=>a.min<=state.deepestFloorReached).map(a=>({id:a.id,min:a.min,max:Math.min(a.max,state.deepestFloorReached),name:a.tag}));}
function summonPlans(s,range,minutes){
 const area=AREAS.find(a=>a.id===range.id),plans=[];
 const normal=materialDropPlan({source:'enemy',floor:range.min}),perEnemy=minutes*SUMMON_CONFIG.manualBattlesPerMinute/area.enemies.length;
 area.enemies.forEach((enemy,j)=>{
  const tags=SUMMON_SOURCE_TAGS[area.id-1]?.[j]?.split(',')||[];
  normal.after.forEach((rate,tier)=>{const key=MONSTER_MATERIALS[enemy.materialSource].keys[tier];if(!key||!rate)return;
   const kind=tier===0?'normal':'rare',all=[...tags,tier===0?'normal':'rare',...(tier>=2?['special']:[]),...(tier===5?['abyssal']:[])];
   plans.push({key,kind,attempts:perEnemy,rate:rate*summonEff(s,kind,all)});
  });
 });
 if(range.max>=area.max&&state.bossFirstKills?.[area.max]){
  const plan=materialDropPlan({source:'boss',floor:area.max}),keys=MONSTER_MATERIALS[area.boss.materialSource].keys,tags=[...(SUMMON_SOURCE_TAGS[area.id-1]?.[4]?.split(',')||[]),'boss'];
  const attempts=minutes/SUMMON_CONFIG.bossMinutes;
  plan.after.forEach((rate,tier)=>{if(rate&&keys[tier])plans.push({key:keys[tier],kind:'boss',attempts,rate:rate*summonEff(s,'boss',[...tags,...(tier===5?['abyssal']:[])])});});
  plan.guaranteed.forEach(tier=>{if(keys[tier])plans.push({key:keys[tier],kind:'boss',attempts,rate:summonEff(s,'boss',tags)});});
 }
 return plans;
}
function rollSummonPlans(plans,rng=Math.random){
 const result={};for(const p of plans){let n=0;for(let i=0;i<Math.floor(p.attempts);i++)if(rng()<p.rate)n++;
  if(rng()<(p.attempts%1)*p.rate)n++;if(n)result[p.key]=(result[p.key]||0)+n;
 }return result;
}
function summonClock(d,now=Date.now()){
 if(!Number.isFinite(now)||now<d.lastClock-60000)throw Error('端末時計が過去に戻っています。時計を戻してから再確認してください');
 d.lastClock=Math.max(d.lastClock,now);return now;
}
async function summonGacha(count){
 const result=await summonTransaction(d=>{if(!summonsUnlocked()||![1,10].includes(count))return false;
  const cost=count===10?SUMMON_CONFIG.tenCost:SUMMON_CONFIG.singleCost;if(state.vaultGold<cost)return false;
  state.vaultGold-=cost;const draws=Array.from({length:count},()=>summonDraw(d));d.history=draws;return draws;
 });if(result)openSummonResults(result,true);
}
async function summonFree(){const ok=await summonTransaction(d=>{if(!summonsUnlocked()||d.freeClaimed)return false;d.freeClaimed=true;if(!d.owned['mini-slime'])d.owned['mini-slime']={stones:0,favorite:false};else d.owned['mini-slime'].stones++;return true;});if(ok)openSummons('dispatch');}
async function summonFavorite(id){const ok=await summonTransaction(d=>{if(!d.owned[id])return false;d.owned[id].favorite=!d.owned[id].favorite;return true;});if(ok)openSummons('codex');}
async function startSummonDispatch(id,rangeId,minutes){
 const ok=await summonTransaction(d=>{
  if(!summonsUnlocked()||!d.owned[id]||!SUMMON_CONFIG.durations.includes(minutes)||d.jobs.length>=SUMMON_CONFIG.maxDispatch)return false;
  const range=summonRanges().find(r=>r.id===rangeId);if(!range)return false;
  const now=summonClock(d),rewards=rollSummonPlans(summonPlans(SUMMONS[id],range,minutes));
  d.jobs.push({id:crypto.randomUUID(),summon:id,range,minutes,start:now,end:now+minutes*60000,rewards});return true;
 });if(ok)openSummons('dispatch');
}
async function claimSummonDispatch(id){
 const result=await summonTransaction(d=>{
  const job=d.jobs.find(j=>j.id===id);if(!job)return false;const now=summonClock(d);
  if(now<job.end||job.end-job.start!==job.minutes*60000||!SUMMON_CONFIG.durations.includes(job.minutes))return false;
  const rewards=Object.entries(job.rewards).filter(([k,n])=>MATERIALS[k]&&Number.isInteger(n)&&n>0&&n<=1000);
  d.jobs=d.jobs.filter(j=>j!==job);for(const [key,n]of rewards){for(let i=0;i<n;i++)state.storage.push(materialInstance(key,'summon'));discoverMaterial(key);}d.lastRewards=Object.fromEntries(rewards);return d.lastRewards;
 });if(result)openSummonRewards(result);
}
