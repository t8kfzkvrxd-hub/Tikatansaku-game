const CHARACTER_GROWTH = {player:{hp:10,atk:2,def:1},elna:{hp:5,atk:2,def:.5}};
function characterLevelCap(){return state.bossFirstKills?.[1000]===true?100:50;}
function characterExpRequired(level){return Math.round(30+12*level+2*level*level+(level>=50?1000+(level-50)*100:0));}
function reachedCharacterLevel(floor){
 const points=[[0,1],[100,10],[300,25],[600,35],[900,45],[1000,48]];
 for(let i=1;i<points.length;i++)if(floor<=points[i][0]){const [a,l]=points[i-1],[b,h]=points[i];return Math.max(1,Math.floor(l+(h-l)*(floor-a)/(b-a)));}
 return 48;
}
function characterGrowthStats(id){
 const p=characterProgress(id),g=CHARACTER_GROWTH[id]||CHARACTER_GROWTH.elna,n=Math.min(characterLevelCap(),p.level)-1;
 return {hp:Math.floor(n*g.hp)+(p.training?.legacyHp||0),atk:Math.floor(n*g.atk)+(p.training?.legacyAtk||0),def:Math.floor(n*g.def)+(p.training?.legacyDef||0)};
}
function migrateCharacterLevels(saved){
 const progress=Math.max(0,state.deepestFloorReached,...Object.keys(state.bossFirstKills||{}).filter(k=>state.bossFirstKills[k]).map(Number));
 const ids=new Set(['player','elna',...Object.keys(state.chapter.characters||{})]);
 if(saved?.characterLevelVersion===1)return;
 const old=saved?.talents||{},lv=k=>Math.max(0,Math.min(k==='keepItemLv'?2:['hpLv','atkLv','defLv','luckLv'].includes(k)?5:1,Number(old[k])||0));
 const refund={hpLv:[70,50],atkLv:[80,60],defLv:[80,60],luckLv:[90,70],keepItemLv:[150,150],fateRerollLv:[120,100],discernEyeLv:[180,150],merchantFriendLv:[140,120]};
 for(const [k,[base,step]]of Object.entries(refund)){const n=lv(k);state.vaultGold+=n*base+n*(n-1)/2*step;}
 for(const id of ids){
  const p=characterProgress(id),previous=p.level,g=CHARACTER_GROWTH[id]||CHARACTER_GROWTH.elna;
  const minimum=id==='player'?1+Math.max(Math.ceil(lv('hpLv')*15/g.hp),Math.ceil(lv('atkLv')*3/g.atk),Math.ceil(lv('defLv')*2/g.def)):1;
  p.level=Math.min(characterLevelCap(),Math.max(previous,saved?reachedCharacterLevel(progress):1,minimum));
  if(previous>p.level){for(const [stat,key]of [['hp','legacyHp'],['atk','legacyAtk'],['def','legacyDef']])p.training[key]=Math.floor((previous-1)*g[stat])-Math.floor((p.level-1)*g[stat]);}
  if(p.level!==previous)p.exp=0;
 }
}
function battleExperience(enemy,floor=state.floor){return Math.round((12+Math.max(1,floor)*.12)*(enemy.isBoss?4:enemy.isElite?1.6:1));}
function recordBattleParticipants(enemy){
 enemy.expParticipants=activeParty().filter(m=>m.unit.hp>0).map(m=>m.id);
 enemy.expFloor=state.floor;
}
function grantCharacterExperience(id,amount,source='story'){
 if(id!=='player'&&!state.chapter.owned[id])return 0;
 const p=characterProgress(id),cap=characterLevelCap();
 if(p.level>=cap||p.level>=50&&source!=='abyss')return 0;
 const limit=source==='abyss'?cap:Math.min(50,cap),before=p.level;
 p.exp+=Math.max(0,Math.floor(Number(amount)||0));
 while(p.level<limit&&p.exp>=characterExpRequired(p.level)){p.exp-=characterExpRequired(p.level);p.level++;}
 if(p.level>=limit)p.exp=0;
 if(p.level>before){addLog(`${id==='player'?'主人公':CHARACTER_DATA[id]?.name||id}がLv.${p.level}に成長！`,'gold');if(typeof showCharacterLevelUp==='function')showCharacterLevelUp(id,before,p.level);}
 return p.level-before;
}
function awardBattleExperience(enemy){
 if(!enemy||enemy.expAwarded)return;
 enemy.expAwarded=true;
 const previousMaxHp=getPlayerStats().maxHp;
 const amount=battleExperience(enemy,enemy.expFloor??state.floor),source=enemy.progressionSource==='abyss'?'abyss':'story';
 const participants=[...new Set(enemy.expParticipants||['player',...(state.chapter?.companion&&state.chapter.owned[state.chapter.companion]?[state.chapter.companion]:[])])];
 for(const id of participants)grantCharacterExperience(id,amount,source);
 addLog(`討伐EXP 各+${amount}（${participants.map(id=>id==='player'?'主人公':CHARACTER_DATA[id]?.name||id).join('・')} / 上限到達者を除く）`,'info');
 state.maxHp+=Math.max(0,getPlayerStats().maxHp-previousMaxHp);
 saveState();
}
function characterLevelHtml(id){
 const p=characterProgress(id),max=p.level>=characterLevelCap(),required=characterExpRequired(p.level);
 return `<div class="character-growth ${p.level>50?'abyss-level':''} ${p.level===100?'max-level':''}"><b>Lv.${p.level}${max?' MAX':''}</b><div>EXP ${max?'MAX':p.exp+' / '+required}</div><progress style="width:100%" max="${required}" value="${max?required:p.exp}"></progress>${!max?'<div>次のLvまで '+Math.max(0,required-p.exp)+' EXP</div>':''}${p.level>=50&&characterLevelCap()===50?'<p>深淵解放後、さらなる成長が可能（1000FストーリークリアでLv100解放）</p>':''}</div>`;
}
function unlockedWarpFloors(){
 const reached=Math.max(0,state.deepestFloorReached||0);
 return [1,...BOSS_FLOORS.filter(f=>f+1<=MAX_DUNGEON_FLOOR&&(reached>=f+1||state.bossFirstKills?.[f])).map(f=>f+1)];
}
function canWarpTo(floor){return Number.isInteger(floor)&&unlockedWarpFloors().includes(floor);}
