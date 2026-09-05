const ELITE_MULTIPLIERS={hp:1.9,atk:1.5,def:1.4};
function scaledEnemyStats(template,area,floor,kind='normal',options={}){
 const scale=1+Math.max(0,floor-area.min)*.015;
 const difficulty=Math.max(.1,Number(options.enemyAtkMult)||1)*[1,1.1,1.25,1.45][Math.max(0,Math.min(3,options.greed||0))];
 const normal=t=>({hp:Math.max(1,Math.round(t.hp*scale)),atk:Math.max(1,Math.round(t.atk*scale*difficulty)),def:Math.max(0,Math.round(t.def*scale))});
 const strongest=Object.fromEntries(['hp','atk','def'].map(k=>[k,Math.max(...area.enemies.map(t=>normal(t)[k]))]));
 const elite=Object.fromEntries(Object.entries(ELITE_MULTIPLIERS).map(([k,m])=>[k,Math.max(strongest[k]+1,Math.ceil(strongest[k]*m))]));
 if(kind==='elite')return elite;
 const result=normal(template);
 if(kind==='boss'){
  result.hp=Math.round(Math.max(result.hp,Math.ceil(elite.hp*1.35/.85))*(options.labLevel>=3?.85:1));
  result.atk=Math.max(result.atk,Math.ceil(elite.atk*1.1));
  result.def=Math.max(result.def,Math.ceil(elite.def*1.1));
 }
 return result;
}
