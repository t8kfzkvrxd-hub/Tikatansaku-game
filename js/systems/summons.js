function summonState(){
 const s=state.summonSystem;
 if(!s||typeof s!=='object'||Array.isArray(s))state.summonSystem={owned:{},pity:{2:0,3:0,4:0,5:0},jobs:[],revision:0,lastClock:0,history:[]};
 const d=state.summonSystem;d.owned??={};d.pity??={};d.jobs??=[];d.history??=[];d.revision=Number(d.revision)||0;d.lastClock=Number(d.lastClock)||0;
 for(const k of Object.keys(SUMMON_CONFIG.pity))d.pity[k]=Math.max(0,Math.floor(Number(d.pity[k])||0));
 for(const o of Object.values(d.owned))o.contractLevel=Math.max(1,Math.min(5,Number(o.contractLevel)||1));
 d.universalStones=Math.max(0,Number(d.universalStones)||0);
 d.tutorial??=(Object.keys(d.owned).length||d.jobs.length||d.history.length||d.freeClaimed)?'done':'intro';
 return d;
}
function summonsUnlocked(){return clearedMaterialMilestone(SUMMON_CONFIG.unlockBoss);}
function summonTier(rng=Math.random){let r=rng();for(let i=0;i<SUMMON_CONFIG.rates.length;i++){r-=SUMMON_CONFIG.rates[i];if(r<0)return i;}return SUMMON_CONFIG.rates.length-1;}
function summonDraw(d,rng=Math.random){
 let tier=summonTier(rng);d.pity??={};
 for(const k of Object.keys(SUMMON_CONFIG.pity))d.pity[k]=(Number(d.pity[k])||0)+1;
 if(d.pity[6]>=SUMMON_CONFIG.pity[6])tier=6;
 else if(d.pity[5]>=SUMMON_CONFIG.pity[5])tier=5;
 else for(const [k,cap]of Object.entries(SUMMON_CONFIG.pity))if(Number(k)<5&&d.pity[k]>=cap)tier=Math.max(tier,Number(k));
 // Secret pity is independent; a simultaneous Abyssal guarantee remains due for the next pull.
 for(const k of Object.keys(SUMMON_CONFIG.pity))if(tier===6?Number(k)===6:Number(k)<=tier)d.pity[k]=0;
 const pool=Object.values(SUMMONS).filter(s=>s.tier===tier),s=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))],duplicate=!!d.owned[s.id];
 if(duplicate)d.owned[s.id].stones=(Number(d.owned[s.id].stones)||0)+1;else d.owned[s.id]={stones:0,favorite:false,contractLevel:1};
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
function summonContractLevel(id){return summonState().owned[id]?.contractLevel||1;}
function summonTimeFactor(id){if(SUMMONS[id]?.preserveNominalRewards)return 1/Math.min(1.5,Math.max(1,SUMMONS[id].dispatchSpeed));return summonContractLevel(id)>=3?.95:1;}
function summonSpecialtyPoints(s){const level=summonContractLevel(s.id);return (SUMMON_SPECIALTY_OVERRIDES[s.id]??SUMMON_CONFIG.specialtyPoints)+(level>=2?.02:0)+(level>=4?.03:0);}
function summonEff(s,kind,tags=[]){const matches=s.specialties.some(t=>tags.includes(t));return Math.min(SUMMON_CONFIG.caps[kind],SUMMON_CONFIG[kind][s.tier]+(matches?summonSpecialtyPoints(s):0));}
function summonRanges(){return AREAS.filter(a=>a.min<=state.deepestFloorReached).map(a=>({id:a.id,min:a.min,max:Math.min(a.max,state.deepestFloorReached),name:a.tag}));}
function summonPlans(s,range,minutes){
 const area=AREAS.find(a=>a.id===range.id),plans=[];
 const normal=materialDropPlan({source:'enemy',floor:range.min}),factor=s.preserveNominalRewards?1:summonTimeFactor(s.id),focus=summonContractLevel(s.id)>=5?summonState().owned[s.id]?.focus?.[area.id]:null;
 const focused=area.enemies.some(e=>e.materialSource===focus),eff=(kind,tags)=>Math.min(summonEff(s,kind,tags),SUMMON_CONFIG.caps[kind]*factor);
 area.enemies.forEach((enemy,j)=>{
  const perEnemy=minutes*SUMMON_CONFIG.manualBattlesPerMinute*(focused?(enemy.materialSource===focus ? .5 : .5/(area.enemies.length-1)):1/area.enemies.length);
  const tags=SUMMON_SOURCE_TAGS[area.id-1]?.[j]?.split(',')||[];
  normal.after.forEach((rate,tier)=>{const key=MONSTER_MATERIALS[enemy.materialSource].keys[tier];if(!key||!rate)return;
   const kind=tier===0?'normal':'rare',all=[...tags,tier===0?'normal':'rare',...(tier>=2?['special']:[]),...(tier===5?['abyssal']:[])];
   plans.push({key,kind,attempts:perEnemy,rate:rate*eff(kind,all)});
  });
 });
 if(range.max>=area.max&&state.bossFirstKills?.[area.max]){
  const plan=materialDropPlan({source:'boss',floor:area.max}),keys=MONSTER_MATERIALS[area.boss.materialSource].keys,tags=[...(SUMMON_SOURCE_TAGS[area.id-1]?.[4]?.split(',')||[]),'boss'];
  const attempts=minutes/SUMMON_CONFIG.bossMinutes;
  plan.after.forEach((rate,tier)=>{if(rate&&keys[tier])plans.push({key:keys[tier],kind:'boss',attempts,rate:rate*eff('boss',[...tags,...(tier===5?['abyssal']:[])])});});
  plan.guaranteed.forEach(tier=>{if(keys[tier])plans.push({key:keys[tier],kind:'boss',attempts,rate:eff('boss',tags)});});
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
 const result=await summonTransaction(d=>{if(!summonsUnlocked()||d.tutorial!=='done'||![1,10].includes(count))return false;
  const cost=count===10?SUMMON_CONFIG.tenCost:SUMMON_CONFIG.singleCost;if(state.vaultGold<cost)return false;
  state.vaultGold-=cost;const draws=Array.from({length:count},()=>summonDraw(d));d.history=draws;return draws;
 });if(result)openSummonResults(result,true);
}
async function summonFree(){const ok=await summonTransaction(d=>{if(!summonsUnlocked()||d.freeClaimed)return false;d.freeClaimed=true;if(!d.owned['mini-slime'])d.owned['mini-slime']={stones:0,favorite:false,contractLevel:1};else d.owned['mini-slime'].stones++;if(d.tutorial!=='done')d.tutorial='dispatch';return true;});if(ok)openSummons('dispatch');}
async function summonFavorite(id){const ok=await summonTransaction(d=>{if(!d.owned[id])return false;d.owned[id].favorite=!d.owned[id].favorite;return true;});if(ok)openSummons('codex');}
async function startSummonDispatch(id,rangeId,minutes,tutorial=false){
 const ok=await summonTransaction(d=>{
  if(!summonsUnlocked()||!d.owned[id]||!SUMMON_CONFIG.durations.includes(minutes)||d.jobs.length>=SUMMON_CONFIG.maxDispatch)return false;
  if(tutorial&&!(d.tutorial==='dispatch'&&id==='mini-slime'&&minutes===10&&rangeId===1))return false;
  if(!tutorial&&d.tutorial!=='done')return false;
  const range=summonRanges().find(r=>r.id===rangeId);if(!range)return false;
  if(tutorial)range.max=Math.min(range.max,9);
  const fee=SUMMON_CONFIG.dispatchFees[minutes];if(state.vaultGold<fee)throw Error('Gが不足しています');
  const now=summonClock(d),rewards=rollSummonPlans(summonPlans(SUMMONS[id],range,minutes));
  if(tutorial&&!Object.keys(rewards).length)rewards.area_1_enemy_0_common=1;
  const durationMs=Math.round(minutes*60000*summonTimeFactor(id));state.vaultGold-=fee;
  d.jobs.push({id:crypto.randomUUID(),summon:id,range,minutes,start:now,end:now+durationMs,durationMs,fee,tutorial,rewards});if(tutorial)d.tutorial='waiting';return true;
 });if(ok)openSummons('dispatch');
}
async function claimSummonDispatch(id){
 const result=await summonTransaction(d=>{
  const job=d.jobs.find(j=>j.id===id);if(!job)return false;const now=summonClock(d);
  if(now<job.end||job.end-job.start!==(job.durationMs??job.minutes*60000)||!SUMMON_CONFIG.durations.includes(job.minutes))return false;
  const rewards=Object.entries(job.rewards).filter(([k,n])=>MATERIALS[k]&&Number.isInteger(n)&&n>0&&n<=1000);
  d.jobs=d.jobs.filter(j=>j!==job);for(const [key,n]of rewards){for(let i=0;i<n;i++)state.storage.push(materialInstance(key,'summon'));discoverMaterial(key);}d.lastRewards=Object.fromEntries(rewards);d.lastRewardSummon=job.summon;if(job.tutorial)d.tutorial='gachaIntro';return d.lastRewards;
 });if(result)openSummonRewards(result);
}
async function summonTutorialNext(){const ok=await summonTransaction(d=>{if(!summonsUnlocked())return false;if(d.tutorial==='intro')d.tutorial='gift';else if(d.tutorial==='gachaIntro')d.tutorial='done';else return false;return true;});if(ok)openSummons('gacha');}
async function summonUpgrade(id){const ok=await summonTransaction(d=>{const o=d.owned[id];if(!o||o.contractLevel>=5)return false;const cost=SUMMON_CONFIG.contractCosts[o.contractLevel-1],own=Math.min(cost,o.stones||0),universal=(cost-own)*SUMMON_CONFIG.universalPerStone;if(d.universalStones<universal)throw Error('契約石が不足しています');o.stones-=own;d.universalStones-=universal;o.contractLevel++;return true;});if(ok)openSummonContract(id);}
async function summonConvert(id){const ok=await summonTransaction(d=>{const o=d.owned[id];if(!o||o.contractLevel!==5||o.stones<1)return false;o.stones--;d.universalStones++;return true;});if(ok)openSummonContract(id);}
async function summonFocus(id,areaId,source){const ok=await summonTransaction(d=>{const o=d.owned[id],area=AREAS.find(a=>a.id===areaId);if(!o||o.contractLevel<5||!area||source&&!area.enemies.some(e=>e.materialSource===source))return false;(o.focus??={})[areaId]=source;return true;});if(ok)openSummons('dispatch');}
