const inputSafety={until:0,eventId:0};
function chooseEvent(id,index){const ev=state.currentEvent;if(ev?.inputId===id)ev.choices[index]?.action();}
function lockTransition(){
 if(performance.now()<inputSafety.until)return false;
 inputSafety.until=performance.now()+400;return true;
}
function syncActionButtons(){
 document.querySelectorAll('#viewport button').forEach(b=>{
  const action=b.getAttribute('onclick')||'';
  if((state.currentEnemy?.acting||state.currentEnemy?.rewardClaimed)&&/playerCombatAction|Smoke|smoke/.test(action)||state.currentEvent?.claimed&&action.includes('chooseEvent')){b.disabled=true;b.style.pointerEvents='none';}
 });
}
function prepareEventChoices(ev){
 if(!ev||ev.guarded)return;ev.guarded=true;ev.inputId=++inputSafety.eventId;
 ev.choices.forEach(choice=>{const execute=choice.action;choice.action=()=>{
  if(state.screen!=='event'||state.currentEvent!==ev||ev.claimed)return;
  ev.claimed=true;syncActionButtons();if(execute()===false){ev.claimed=false;render();}
 };});
}
function queueEnemyTurn(defending=false,delay=250){
 const enemy=state.currentEnemy;if(!enemy)return;
 enemy.actionQueued=true;
 setTimeout(()=>{if(state.currentEnemy!==enemy||enemy.rewardClaimed||state.screen!=='battle')return;enemyTurn(defending);},delay);
}
