const MATERIALS = { abyss_core: {name:'深淵の核',rarity:'Mythic',icon:'💠',source:'階層ボス',currency:true} };
const MONSTER_MATERIALS = {};
const CRAFT_RECIPES = {
 iron_sword:{name:'鉄の剣',icon:'⚔️',rarity:'Common',type:'weapon',baseAtk:12,gold:35,materials:{},desc:'派生の起点',archetype:'sword'}
};
const CRAFT_THEMES = [
 {prefix:'坑道',normal:'骨刃',rare:'略奪剣',upper:'狂牙剣',boss:'巨人砕き',hidden:'王殺しの略奪剣'},
 {prefix:'古代',normal:'石刃',rare:'機甲剣',upper:'雷光機甲剣',boss:'守護者の雷剣',hidden:'終焉機甲剣'},
 {prefix:'変異',normal:'細胞刃',rare:'血牙剣',upper:'再生血剣',boss:'完全体の血刃',hidden:'禁忌血刃'},
 {prefix:'森林',normal:'根刃',rare:'毒牙剣',upper:'古森の剣',boss:'母樹の霊剣',hidden:'世界樹の牙'},
 {prefix:'水底',normal:'鱗刃',rare:'潮流剣',upper:'深海剣',boss:'ネレウスの王剣',hidden:'海淵の神剣'},
 {prefix:'胎動',normal:'肉骨刃',rare:'神経剣',upper:'脈動剣',boss:'深淵胎動剣',hidden:'終焉の心剣'}
];
AREAS.forEach((area, i) => {
 const theme=area.craftTheme||CRAFT_THEMES[i];
 [...area.enemies,area.elite,area.boss].forEach((enemy,j) => {
  const id=`area_${area.id}_enemy_${j}`;
  enemy.materialSource=id;
  const boss=enemy===area.boss;
  const keys=['common','rare','epic','legendary','mythic'];
  const parts=boss?['欠片','魔核','心臓','固有核','完全魂核']:['牙片','皮膜','特殊器官','完全魔核','原初心臓'];
  MONSTER_MATERIALS[id]={boss,keys:keys.map((tier,k)=>{
   const key=`${id}_${tier}`;
   MATERIALS[key]={name:`${enemy.name.replace(/[【】]/g,'')}の${parts[k]}`,rarity:['Common','Rare','Epic','Legendary','Mythic'][k],icon:boss?'🔮':'🦴',source:enemy.name};
   return key;
  })};
 });
 const common=area.enemies[0].materialSource+'_common', rare=area.enemies[1].materialSource+'_rare', epic=area.elite.materialSource+'_epic', boss=area.boss.materialSource+'_legendary', secret=area.elite.materialSource+'_mythic';
 const stem=`forge_${area.id}`;
 const defs=[
  ['normal',theme.normal,'Common','iron_sword',{[common]:3},18+i*14],
  ['rare',theme.rare,'Rare',stem+'_normal',{[rare]:2},24+i*17],
  ['upper',theme.upper,'Epic',stem+'_rare',{[epic]:2,abyss_core:1},38+i*20],
  ['awaken',theme.boss,'Legendary',stem+'_upper',{[boss]:2,abyss_core:3},62+i*25],
  ['hidden',theme.hidden,'Mythic',stem+'_rare',{[secret]:1,[boss]:1,abyss_core:5},80+i*28]
 ];
 defs.forEach(([stage,name,rarity,parent,materials,baseAtk],n)=>{
  CRAFT_RECIPES[stem+'_'+stage]={name,icon:n>=3?'🔥':'⚔️',rarity,type:'weapon',archetype:n===1?'dagger':'sword',parent,materials,baseAtk,gold:80+(i*80)+(n*100),awakening:n>=3,hiddenMaterial:n===4?secret:null,craftEffect:n===1?'elite_hunter':n===2?'desperate':null,desc:n===1?'Eliteへの攻撃力+150%':n===2?'HP35%以下で攻撃力+100%':n>=3?'ボス素材による最終形態':'鍛錬+10から次の派生へ'};
 });
 CRAFT_RECIPES[stem+'_armor']={name:theme.prefix+'の装甲',icon:'🛡️',rarity:'Rare',type:'armor',baseDef:8+i*5,hp:20+i*10,gold:100+i*80,materials:{[common]:4,[rare]:1},desc:'防御と最大HPを強化'};
});

