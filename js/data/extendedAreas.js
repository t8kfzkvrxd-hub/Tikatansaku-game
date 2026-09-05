const EXTENDED_AREA_DATA=[
 ['黒曜石坑道','黒曜鼠','黒曜採掘兵','鉱脈喰らい','黒曜守衛','黒曜の穿孔王','armored','heavy_charge','black-dust,embers,blue','黒い岩陰から音がする','鋭い鉱石の奥に何かいる','この岩、普通じゃないね'],
 ['失われた工房','炉番人形','歯車蜘蛛','鎖の自律兵','暴走炉兵','失われた大炉心','armored','shield_barrier','embers,steam,torch','停止した炉の奥で金属音が響く','壊れた機械の影が動いた','まだ炉が熱い……'],
 ['毒霧湿地','腐根獣','毒沼蛭','発光菌兵','毒霧の捕食者','腐沼の母体','plant','mother_tree','spores,violet,poison-mist','毒霧の向こうに影が見える','水面が不自然に揺れている','この霧、吸い込まない方がよさそう'],
 ['崩壊聖堂','崩像兵','祭壇の亡霊','灰燭騎士','断罪の番人','崩れた祭壇の王','undead','history_king','torch,dust,white-mist','祭壇の奥から足音がする','壊れた像の影で何かが動いた','柱が崩れているね'],
 ['結晶洞窟','晶殻虫','結晶狼','反響結晶体','多面の守衛','紫晶の巨像','armored','shield_barrier','reflection,violet,stars','結晶の反射の中に敵影が混じる','結晶橋の奥で何かが光る','すごい……全部結晶だ'],
 ['亡者の集落','戸口の亡者','墓守犬','消灯兵','集落の死守者','忘れられた村長','undead','history_king','cold,memory,mist','無人の家から物音がする','墓標の陰で足音が止まった','誰もいないはずなのに'],
 ['深層水没区','沈降魚人','水没装甲兵','深水クラゲ','沈都の処刑人','沈都の水門王','biological','rising_water','drops,water,teal-mist','水中で巨大な影が動いた','沈んだ橋から泡が立つ','水際には近づきすぎないで'],
 ['赤月回廊','赤影獣','月蝕騎士','血霧の眼','紅月の追跡者','赤月の鼓動核','biological','three_phase_core','red,blood-mist,bio-particles','赤い霧の向こうから気配が近づく','赤月を背に黒い影が立つ','なんか……嫌な色だね'],
 ['断絶遺跡','断層歩哨','裂け目の獣','浮遊残骸兵','空隙の監視者','断絶の門衛','memory','forget_librarian','rift,violet,stars','裂けた空間から何かが這い出す','切れた橋の先に影が浮かぶ','足場、本当にあるよね？'],
 ['深層前線','前線の影兵','門前装甲獣','深光の観測体','深層の執行者','深層前線の守護機構','armored','boundary_gate','blue,black-dust,red','巨大門の向こうから重い足音が響く','壊れた拠点に敵影が集まる','ここまで来ると、空気まで重いね']
];
const EXTENDED_AREAS=EXTENDED_AREA_DATA.map((d,i)=>{
 const id=11+i,min=101+i*10,max=min+9;
 const enemies=d.slice(1,4).map((name,j)=>({name,icon:['👾','🛡️','🧿'][j],hp:570+i*65-j*20,atk:165+i*10+j*2,def:57+i*3-j*2,partFamily:d[6],trait:i===2?'spore_poison':'',traitName:i===2?'毒胞子':'',hint:i===2?'毒を付与する':''}));
 const elite={...enemies[1],name:d[4],trait:'boundary_watch',traitName:'防御崩し',hint:'防御に対しガード耐久を削り出血を付与する'};
 const boss={name:`【${d[5]}】`,icon:'👑',hp:6200+i*450,atk:200+i*12,def:68+i*4,gimmick:d[7],partFamily:d[6],partIds:['armor','arm','core']};
 const area={id,min,max,name:`${d[0]} (${min}〜${max}F)`,tag:d[0],rule:'深層素材を集め、危険な大技は予告を見て対処する。',enemies,elite,boss};
 [...enemies,elite,boss].forEach((enemy,j)=>{
  const source=`area_${id}_enemy_${j}`;enemy.materialSource=source;
  MONSTER_MATERIALS[source]={boss:j===4,keys:['Common','Rare','Epic','Legendary','Mythic','Abyssal'].map((rarity,k)=>{
   const key=source+'_'+rarity.toLowerCase();MATERIALS[key]={name:enemy.name.replace(/[【】]/g,'')+'の'+['欠片','硬質片','特殊器官','固有核','原初核','深淵結晶'][k],rarity,icon:j===4?'🔮':'💎',source:enemy.name};return key;
  })};
 });
 // Deep materials have actual recipes without changing any existing recipe costs.
 for(const [n,type]of ['weapon','armor'].entries()){
  const materials=Object.fromEntries([...enemies,elite,boss].map((e,j)=>[MONSTER_MATERIALS[e.materialSource].keys[n?Math.min(j,2):Math.min(j,3)],j===4?2:3]));
  const key=`deep_${id}_${type}`,base=type==='weapon'?{weaponType:'sword',archetype:'sword',baseAtk:350+i*18,effects:{breakPower:5}}:{baseDef:70+i*4,hp:85+i*8,effects:{guardHeal:5}};
  CRAFT_RECIPES[key]={name:d[0]+(n?'の防護衣':'の開拓剣'),type,slot:type,icon:n?'🛡️':'⚔️',rarity:n?'Epic':'Legendary',...base,gold:2400+i*200,materials,unlockFloor:100,primaryBuildTag:n?'guard':'break',secondaryBuildTags:[],tags:[n?'guard':'break'],catalogKind:'BASE',desc:n?'ガード成功時HP+5':'部位破壊力と強攻撃時の防御破壊を補助'};
  weaponIdentity(CRAFT_RECIPES[key]);EQUIPMENT_CATALOG[key]=CRAFT_RECIPES[key];
 }
 return area;
});
AREAS.push(...EXTENDED_AREAS);
function startExtendedResourceEvent(){
 const area=getCurrentArea();state.screen='event';state.currentEvent={title:area.tag+'の採取地点',icon:'💎',text:'採取できる素材と、安全に休める足場がある。',choices:[
  {text:'素材を採取する',action:()=>{giveItemToBag(createMaterialReward('gather'));endEvent();}},
  {text:'休憩する',action:()=>{state.hp=Math.min(getPlayerStats().maxHp,state.hp+Math.round(getPlayerStats().maxHp*.2));healCompanionAtRest(.2);endEvent();}},
  {text:'先へ進む',action:()=>endEvent()}
 ]};render();
}
