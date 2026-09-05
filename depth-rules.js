function getNextSafeFloor(floor=state.floor) { return SAFE_RETURN_FLOORS.find(f=>f>=floor) ?? null; }
function getNextBossFloor(floor=state.floor||state.selectedStartFloor||1) { return BOSS_FLOORS.find(f=>f>=floor) ?? null; }
function clearPlayerStatuses() {
 state.statusEffects={poison:0,bleed:0,paralysis:0,bind:0,curse:0,weakened:0};
 state.playerPoisonTurns=0;state.playerPoisonDmg=0;
}
function applyRootProtection(enemy,beforeHp) {
 if(enemy.gimmick==='mother_tree'&&state.bossAdds>0) {
  const damage=Math.max(0,beforeHp-enemy.hp);
  enemy.hp=beforeHp-Math.max(damage>0?1:0,Math.round(damage*.5));
  if(damage>0)addLog('🌿 守護根が最終ダメージを50%軽減した。','info');
 }
}
function applyEnemyPulse(enemy) {
 if(state.pendingEnemyPulse){enemy.pulseTurns=3;state.pendingEnemyPulse=0;}
 if(enemy.trait==='grave_inherit'&&state.lastDefeatedEnemy){enemy.inheritedAtk=Math.min(25,Math.round(state.lastDefeatedEnemy.atk*.15));enemy.inheritTurns=3;}
 if(enemy.trait==='mirror_stats'||enemy.gimmick==='mirror_warden'){const stats=getPlayerStats();enemy.atk+=Math.min(30,Math.round(stats.atk*.1));enemy.def+=Math.min(12,Math.round(stats.def*.1));}
}
function recordDepthAction(enemy,action,stats) {
 enemy.actionHistory ||= {};enemy.actionHistory[action]=(enemy.actionHistory[action]||0)+1;
 const repeated=enemy.previousAction===action;
 if(enemy.trait==='repeat_resist'&&repeated){const before=enemy.resistance||0;enemy.resistance=Math.min(20,before+3);enemy.def+=enemy.resistance-before;addLog('🕯️ 反復耐性：違う行動を織り交ぜよう','danger');}
 if((enemy.gimmick==='history_king'||enemy.trait==='blank_learn')&&enemy.hp<enemy.maxHp*.5&&enemy.actionHistory[action]>=3){stats.atk=Math.round(stats.atk*.7);addLog('📜 記憶された行動：与ダメージ能力-30%','danger');}
 if(enemy.trait==='echo_action'||enemy.gimmick==='mirror_warden')enemy.copiedAction=action;
 enemy.previousAction=action;
 if(state.effectSeal?.turns>0)state.effectSeal.turns--;
}
function deepEnemyIntent(enemy) {
 const turn=state.bossTurnCount||enemy.turnCount||1;
 if(enemy.copiedAction){enemy.nextMult=enemy.copiedAction==='heavy'?1.5:enemy.copiedAction==='skill'?1.35:1.1;enemy.actionType=enemy.copiedAction==='defend'?'counter_stance':'normal';enemy.pendingAction=`🪞 ${enemy.copiedAction}を模倣`;}
 if(enemy.gimmick==='history_king'){enemy.nextMult=enemy.hp<enemy.maxHp*.5?1.55:1.1;enemy.actionType=turn%3===0?'heavy':'normal';enemy.pendingAction='🪦 '+(enemy.hp<enemy.maxHp*.5?'過去の反復行動を対策':'行動を記録している');}
 if(enemy.gimmick==='forget_librarian'){enemy.actionType=turn%3===0?'heavy':'normal';enemy.nextMult=turn%3===0?1.8:1.15;enemy.pendingAction=turn%3===0?'📖 記憶焼却：大技とスキル封印':'📖 次撃バフの複写';}
 if(enemy.gimmick==='boundary_gate'){enemy.nativeDef??=enemy.def;const closed=turn%4<2;enemy.def=Math.round(enemy.nativeDef*(closed?1.4:.5));enemy.nextMult=closed?1:1.8;enemy.actionType=closed?'normal':'heavy';enemy.pendingAction=closed?'🚪 装甲相：防御増加':'⚠️ 開放相：弱点露出・境界砲';}
}
function deepEnemyTurn(enemy,defending) {
 if(['steal_buff','warped_eye'].includes(enemy.trait)||enemy.gimmick==='forget_librarian'){
  if(state.playerAttackBuff>1){enemy.nextMult=Math.min(2,(enemy.nextMult||1)*state.playerAttackBuff);state.playerAttackBuff=1;addLog('🪞 次撃強化を奪われた','danger');}
 }
 if(['false_friend','warped_eye'].includes(enemy.trait)){state.statusEffects.curse=2;state.statusEffects.weakened=2;}
 if(enemy.trait==='forget_skill'||enemy.gimmick==='forget_librarian'&&state.bossTurnCount%3===0){state.skillCooldown=Math.min(4,state.skillCooldown+1);state.statusEffects.paralysis=1;}
 if(enemy.trait==='seal_effect'&&(enemy.turnCount||0)%3===0){const key=Object.keys(equipmentEffects())[0];if(key){state.effectSeal={key,turns:2};addLog(`📖 装備効果【${EQUIPMENT_EFFECTS[key]?.[0]||key}】を2T封印`,'danger');}}
 if(enemy.trait==='warped_tree'){state.statusEffects.bleed=2;enemy.hp=Math.min(enemy.maxHp,enemy.hp+Math.round(enemy.maxHp*.03));}
 if(enemy.trait==='warped_knight'&&state.lastPlayerAction==='heavy'){state.statusEffects.bind=2;state.skillCooldown=Math.min(4,state.skillCooldown+1);}
 if(enemy.trait==='boundary_watch'&&defending){state.guardStamina=Math.max(0,state.guardStamina-25);state.statusEffects.bleed=2;}
}
