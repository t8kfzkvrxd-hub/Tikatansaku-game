const EXPEDITION_LIMIT=8;
const EXPEDITION_DESIGNS={
 thunder:['雷撃','3命中ごとに追撃','攻撃'],blood:['血刃','HP半分以下で吸血強化。回復後も3行動持続','防御'],
 giant:['巨人殺し','ボスへの攻撃を強化','攻撃'],fort:['鉄壁','防御で受けるダメージを軽減','防御'],
 fang:['凍牙','4命中で凍結。凍結付与後の次撃を強化','状態'],ember:['火種','3命中で炎上。炎上中なら即時燃焼','状態'],
 venom:['毒の継承','毒を倒した次の敵へ半分引き継ぐ','状態'],wound:['傷口狙い','二人の出血付与後、次の直接攻撃を強化','状態'],
 curse:['呪返し','呪い付与後、次の被弾を軽減して反撃','防御'],cut:['解体の心得','強攻撃の部位破壊力を強化','攻撃'],
 mirror:['鉄壁反攻','防御成功後の次撃にカウンター。JUSTで強化','防御'],wind:['風返し','回避+5pt。回避後の次撃を強化','防御'],
 blade:['連撃狂','通常攻撃に小さな追加の一撃','攻撃','強攻撃のダメージ−25%'],hammer:['破砕衝動','部位破壊後、次の強攻撃+40%','攻撃'],
 chant:['詠唱の残響','スキル命中後、次の攻撃を強化','攻撃'],chain:['影の同行者','4命中ごとに分身が追撃','攻撃'],
 rest:['狩人の息継ぎ','HP80%未満：撃破回復1.5%。以上：素材抽選を少し補助','探索'],endure:['狩人の執念','同じ対象へ攻め続けると強化。防御・対象変更でリセット','攻撃'],
 sun:['朝の兆し','開幕2行動の通常会心・強攻撃・スキルを強化','攻撃'],revenge:['背水','被弾ごとに攻撃+5%、最大25%（戦闘限り）','攻撃','取得中はDEF−15%'],
 shell:['薄明の障壁','初回被弾を障壁で防ぐ。満杯分はその一撃の軽減へ','防御'],overflow:['慈雨','余剰吸血を次撃+15%へ。高HPを維持して攻める','防御'],
 pierce:['鎧通し','硬い敵の防御力の15%分を自分の攻撃力へ加える','攻撃'],calm:['宝探し','宝箱の未確定素材抽選を強化。戦闘性能は変わらない','探索']
};
for(const p of EXPEDITION_PERKS){const [name,description,category,drawback]=EXPEDITION_DESIGNS[p.id];Object.assign(p,{name,description,category,drawback});}
const EXPEDITION_COMBOS=[['雷鎖連撃',['thunder','blade','chain']],['背水血戦',['blood','revenge']],['鉄壁反攻',['fort','mirror']],['毒の継承者',['venom','endure']],['解体収穫',['cut','hammer']],['氷牙連携',['fang','sun']],['詠唱双影',['chant','chain']],['踏破の備え',['shell','rest']],['宝の旅団',['calm','rest']]];
let expeditionActors=new WeakMap(),expeditionRewardScope=null;
function expeditionClearRuntime(){expeditionActors=new WeakMap();expeditionRewardScope=null;}
function expeditionActor(unit,enemy=state.currentEnemy){
 const signature=JSON.stringify(unit===state?state.equipped:characterEquipment(unit.id));
 let r=expeditionActors.get(unit);if(!r||r.enemy!==enemy||r.signature!==signature){r={enemy,signature,actions:0,hits:0,hurt:0,chain:0,blood:0};expeditionActors.set(unit,r);}return r;
}
function expeditionUnits(){const companion=companionCombatUnit();return [state,...(companion?[companion]:[])];}
function expeditionName(){return EXPEDITION_COMBOS.filter(([,ids])=>ids.every(expeditionHasPerk)).map(([name])=>name);}
function expeditionNotify(unit,text){const r=expeditionActor(unit);if(r.noticeAction===r.actions)return;r.noticeAction=r.actions;if(typeof battleNotice==='function')battleNotice((unit===state?'主人公':'エルナ')+'：'+text);}
function expeditionDamage(enemy,unit,n,label){const damage=Math.min(Math.max(0,enemy.hp),Math.max(0,Math.round(n)));if(!damage)return;enemy.hp-=damage;combatApplied(unit===state?'player':unit.id,'enemy',-damage,label);expeditionNotify(unit,label);}
function expeditionMark(tag,enemy){for(const unit of expeditionUnits())if(unit.hp>0){const r=expeditionActor(unit,enemy);if(tag==='freeze')r.ice=true;if(tag==='bleed')r.wound=true;if(tag==='curse')r.curse=true;}}
function expeditionAttack(stats,enemy,action,slots,hp){
 if(!expeditionPerks.active)return;const unit=synergyUnit(slots);if(!unit)return;const r=expeditionActor(unit,enemy);
 const direct=['attack','heavy','skill'].includes(action),target=enemy.partTarget||'body';
 if(!direct||r.target!==target)r.chain=0;r.target=target;
 if(expeditionHasPerk('blood')&&hp<=stats.maxHp*.5)r.blood=3;r.bloodThisAction=r.blood>0;if(hp>stats.maxHp*.5)r.blood=Math.max(0,r.blood-1);
 let bonus=0;
 if(direct){
  if(expeditionHasPerk('endure'))bonus+=Math.min(20,r.chain*4);
  if(expeditionHasPerk('revenge'))bonus+=Math.min(25,r.hurt*5);
  if(expeditionHasPerk('wound')&&r.wound){bonus+=15;r.wound=false;}
  if(expeditionHasPerk('wind')&&r.wind){bonus+=20;r.wind=false;}
  if(expeditionHasPerk('overflow')&&r.rain){bonus+=15;r.rain=false;}
  if(expeditionHasPerk('fang')&&r.ice){if(action==='heavy')r.iceHit=true;else {stats.crit+=12;stats.synergySkillCrit=true;}r.ice=false;}
  if(expeditionHasPerk('sun')&&r.actions<2){if(action==='attack')stats.crit+=12;else bonus+=12;}
  if(expeditionHasPerk('hammer')&&action==='heavy'&&r.smash){bonus+=r.smash;r.smash=0;}
  r.chain++;r.actions++;
  if(bonus)expeditionNotify(unit,'探索連携 +'+Math.min(65,bonus)+'%');
 }else r.actions++;
 stats.expeditionMultiplier=(1+Math.min(65,bonus)/100)*(expeditionHasPerk('blade')&&action==='heavy'?.75:1);
 if(expeditionHasPerk('pierce')&&enemy.def>=stats.atk*.25)stats.atk+=Math.round(enemy.def*.15);
}
function expeditionHitBefore(enemy){return {statuses:{...enemy.buildStatuses},poison:enemy.gearPoison||0,parts:(enemy.parts||[]).filter(p=>p.broken).length};}
function expeditionHitAfter(enemy,action,slots,before){
 if(!expeditionPerks.active||!['attack','heavy','skill'].includes(action))return;const unit=synergyUnit(slots);if(!unit)return;
 const r=expeditionActor(unit,enemy),stats=unit===state?getPlayerStats():companionStats(unit.id);r.hits++;
 enemy.buildStatuses ||= {};
 if((enemy.gearPoison||0)>before.poison)enemy.poisonInherited=false;
 if(expeditionHasPerk('fang')&&r.hits%4===0){enemy.buildStatuses.freeze=Math.max(enemy.buildStatuses.freeze||0,Math.min(5,(enemy.buildStatuses.freeze||0)+1));expeditionMark('freeze',enemy);}
 if(expeditionHasPerk('ember')&&r.hits%3===0){if(enemy.buildStatuses.fire>0)expeditionDamage(enemy,unit,Math.min(40,Math.max(1,enemy.maxHp*.005*enemy.buildStatuses.fire))*.2,'火種・即時燃焼');else enemy.buildStatuses.fire=1;}
 for(const tag of ['freeze','bleed','curse'])if((enemy.buildStatuses[tag]||0)>(before.statuses[tag]||0))expeditionMark(tag,enemy);
 if(expeditionHasPerk('blade')&&action==='attack')expeditionDamage(enemy,unit,stats.atk*.5,'連撃狂・2撃目');
 if(r.iceHit){r.iceHit=false;expeditionDamage(enemy,unit,stats.atk*.15,'凍牙');}
 if(r.counter){const n=r.counter;r.counter=0;expeditionDamage(enemy,unit,stats.atk*n,'鉄壁反攻');}
 if(expeditionHasPerk('hammer')){if((enemy.parts||[]).filter(p=>p.broken).length>before.parts)r.smash=40;else if(!enemy.parts?.length&&r.hits%4===0)r.smash=15;}
}
function expeditionIncoming(damage,enemy,slots,unit,maxHp,guard){
 if(!expeditionPerks.active)return damage;const r=expeditionActor(unit,enemy),stats=unit===state?getPlayerStats():companionStats(unit.id);
 if(expeditionHasPerk('shell')&&!r.shell){r.shell=true;const native=buildRuntime(unit),amount=Math.round(maxHp*.04),room=Math.max(0,Math.round(maxHp*.15)-native.shield),added=Math.min(amount,room);native.shield+=added;damage*=1-Math.min(.04,(amount-added)/Math.max(1,maxHp));}
 if(expeditionHasPerk('curse')&&r.curse){r.curse=false;damage*=.9;expeditionDamage(enemy,unit,Math.min(20,stats.atk*.08,Math.max(0,enemy.hp-1)),'呪返し');}
 if(expeditionHasPerk('mirror')&&guard)r.counter=['heavy','critical_smash'].includes(enemy.actionType)?.3:.2;
 return Math.max(0,Math.round(damage));
}
function expeditionKilled(enemy){
 if(!expeditionPerks.active||!enemy)return;
 const actors=expeditionUnits().filter(u=>u.hp>0),snapshots=actors.map(unit=>({unit,maxHp:(unit===state?getPlayerStats():companionStats(unit.id)).maxHp,hp:unit.hp}));
 enemy.expeditionMaterialBonus=expeditionHasPerk('rest')&&snapshots.some(s=>s.hp>=s.maxHp*.8)?1:0;
 if(expeditionHasPerk('rest'))for(const s of snapshots)if(s.hp<s.maxHp*.8){const n=Math.floor(s.maxHp*.015);s.unit.hp=Math.min(s.maxHp,s.unit.hp+n);combatApplied(s.unit===state?'player':s.unit.id,s.unit===state?'player':s.unit.id,n,'狩人の息継ぎ');}
 expeditionPerks.poisonCarry=expeditionHasPerk('venom')&&!enemy.poisonInherited?Math.min(enemy.isBoss?1:2,Math.floor((enemy.gearPoison||0)*.5)):0;
 expeditionClearRuntime();
}
function expeditionAdjustPlan(plan,amount){
 const after=plan.after.map((p,i)=>p>0&&p<1?Math.min(.999,p+(1-p)*amount):p);
 for(let i=1;i<after.length;i++)if(after[i]>0&&after[i]<1)after[i]=Math.min(after[i],after[i-1]*.85);
 return {...plan,after};
}
const expeditionBasePlan=materialDropPlan;
materialDropPlan=function(options={}){const plan=expeditionBasePlan(options);if(!expeditionPerks.active)return plan;
 const monster=['enemy','elite','boss'].includes(options.source),chest=['chest','rare_chest','cursed_chest','sealed_vault'].includes(options.source||'chest');
 if(monster&&expeditionRewardScope?.expeditionMaterialBonus)return expeditionAdjustPlan(plan,.005);
 if(chest&&expeditionHasPerk('calm'))return expeditionAdjustPlan(plan,.02);return plan;
};
const expeditionBaseDrops=dropMonsterMaterials;
dropMonsterMaterials=function(enemy,...args){const previous=expeditionRewardScope;expeditionRewardScope=enemy;try{return expeditionBaseDrops(enemy,...args);}finally{expeditionRewardScope=previous;}};
const expeditionBaseEffects=equipmentEffects;
equipmentEffects=function(...args){const e=expeditionBaseEffects(...args);return expeditionHasPerk('wind')?{...e,dodge:(e.dodge||0)+5}:e;};
const expeditionBaseDodge=synergyDodge;
synergyDodge=function(slots,unit,stats,enemy){expeditionBaseDodge(slots,unit,stats,enemy);if(expeditionHasPerk('wind'))expeditionActor(unit,enemy).wind=true;};
const expeditionBaseLeech=buildLifestealValues;
buildLifestealValues=function(unit,stats,enemy,slots,crit){const v=expeditionBaseLeech(unit,stats,enemy,slots,crit);if(expeditionHasPerk('blood')&&(unit.hp<=stats.maxHp*.5||expeditionActor(unit,enemy).bloodThisAction)){v.conditional+=5;v.rate=Math.min(25,v.conditional)*(enemy.isBoss?.5:1);}return v;};
const expeditionBaseHeal=healFromWeaponDamage;
healFromWeaponDamage=function(unit,stats,enemy,damage,slots,crit){const before=unit.hp,v=buildLifestealValues(unit,stats,enemy,slots,crit),potential=Math.floor(Math.min(Math.max(0,damage)*v.rate/100,stats.maxHp*.08)*v.resistance),value=expeditionBaseHeal(unit,stats,enemy,damage,slots,crit);if(expeditionHasPerk('overflow')&&potential>Math.max(0,stats.maxHp-before))expeditionActor(unit,enemy).rain=true;return value;};
const expeditionBasePlayerStats=getPlayerStats,expeditionBaseCompanionStats=companionStats;
function expeditionDefence(stats){return expeditionHasPerk('revenge')?{...stats,def:Math.max(0,Math.floor(stats.def*.85))}:stats;}
getPlayerStats=function(...args){return expeditionDefence(expeditionBasePlayerStats(...args));};
companionStats=function(...args){return expeditionDefence(expeditionBaseCompanionStats(...args));};
const expeditionBaseLoad=loadState,expeditionBaseResetBattle=resetBattleBuilds,expeditionBasePotion=applyHealingTarget;
loadState=function(...args){const result=expeditionBaseLoad(...args);resetExpeditionPerks();return result;};
resetBattleBuilds=function(...args){expeditionClearRuntime();return expeditionBaseResetBattle(...args);};
applyHealingTarget=function(...args){const result=expeditionBasePotion(...args);if(result&&expeditionPerks.active)for(const unit of expeditionUnits())expeditionActor(unit).chain=0;return result;};
