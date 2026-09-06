// Native build kernels remain in weaponBuildSystem; these are additional, capped synergies.
const SYNERGY_CORE={
 lifesteal:['leech','low','leech',2],bleed:['attack','bleed','power',7],poison:['hit','poison','poisonExtend',1],
 fire:['hit','third','fire',1],freeze:['attack','freeze','crit',8],shock:['hit','shock','extra',8],curse:['incoming','curse','reduction',5],
 crit:['hit','critical','nextPower',8],multiHit:['hit','third','extra',8],singleStrike:['attack','heavyThird','power',12],
 lowHp:['attack','low','power',12],highHp:['incoming','high','reduction',5],shield:['incoming','firstIncoming','shield',2],
 guard:['incoming','guard','reduction',6],justGuard:['incoming','just','nextPower',12],counter:['attack','charged','power',10],reflect:['reflect','always','reflect',5],
 dodge:['dodge','always','nextPower',10],break:['part','heavy','partPower',10],boss:['attack','boss','power',8],mob:['kill','mob','heal',1],
 status:['hit','third','statusAdvance',1],statusHunter:['attack','status','power',6],conversion:['hit','shock','fire',1],hybrid:['attack','multipleStatuses','power',8],
 normalAttack:['attack','normal','power',8],heavyAttack:['attack','heavy','power',10],skillPower:['attack','skill','power',10],skillHaste:['hit','skill','nextPower',8],
 onKill:['kill','always','nextPower',10],longFight:['attack','long','power',10],burst:['attack','opening','crit',6],overheal:['heal','full','nextPower',8],
 onHurt:['attack','hurt','power',8],unhurt:['attack','unhurt','crit',6],pierce:['attack','armored','pierce',8],defDown:['hit','third','defDown',1],
 speed:['hit','second','extra',4],extraAttack:['hit','fourth','extra',10],followUp:['hit','status','follow',6],summon:['hit','fourth','summon',12],
 farming:['effects','always','materialChance',2],rareMaterial:['effects','always','rareMaterial',1],chest:['effects','always','chestQuality',3],
 safe:['incoming','always','reduction',2],deep:['attack','deep','power',8],abyssal:['attack','abyssal','power',10]
};
const SYNERGY_CONDITION_TEXT={bleedRecent:'出血中または直前ターンに自身が出血付与',curseRecent:'呪い中または直前ターンに自身が呪い付与',freezeRemembered:'凍結中または自身の凍結付与後の次の1攻撃',shockRemembered:'感電中または自身の感電付与後の次の1命中',always:'条件となる行動時',low:'低HP時',high:'高HP維持中',bleed:'出血蓄積中の敵',poison:'毒状態の敵',freeze:'凍結中の敵',shock:'感電中の敵',curse:'呪い蓄積中の敵',critical:'会心命中時',third:'3命中ごと',second:'2命中ごと',fourth:'4命中ごと',heavyThird:'3命中周期の強攻撃',firstIncoming:'戦闘中最初の被弾',guard:'ガード被弾時',just:'大技へのJUST GUARD時',charged:'ガード後の次攻撃',heavy:'強攻撃時',normal:'通常攻撃時',skill:'スキル命中時',boss:'ボス相手',mob:'通常・エリート相手',status:'状態異常中の敵',multipleStatuses:'複数状態異常中の敵',long:'長期戦',opening:'開幕2ターン',full:'吸血の余剰回復時',hurt:'当該戦闘で被弾後',unhurt:'当該戦闘で未被弾',armored:'敵DEFがATKの25%以上',deep:'61F以降',abyssal:'500F以降',broken:'部位破壊済みの敵',deepBoss:'61F以降のボス',poisonLong:'毒状態かつ長期戦',frozenCrit:'凍結敵へ会心命中',maxStatus:'主状態の蓄積上限付近で3命中ごと'};
const SYNERGY_STAT_TEXT={missingStatus:['未付与状態を1種類付与',''],power:['攻撃補正','%'],crit:['会心率','pt'],pierce:['敵DEFのATK加算','%'],leech:['吸血率','pt'],reduction:['被ダメージ軽減','%'],reflect:['反射率','pt'],partPower:['部位耐久ダメージ','%'],nextPower:['次攻撃補正（非累積）','%'],extra:['直接追加ダメージ（ATK比）','%'],follow:['敵行動前追撃（ATK比）','%'],summon:['分身追加ダメージ（ATK比）','%'],shield:['一度だけ障壁（最大HP比）','%'],heal:['撃破時回復（最大HP比）','%'],overflow:['吸血余剰の障壁変換','%'],poisonExtend:['毒残りターン延長','T'],fire:['炎上蓄積',''],statusAdvance:['主状態蓄積',''],defDown:['敵DEF低下',''],materialChance:['通常素材抽選への寄与','pt'],rareMaterial:['希少素材抽選への寄与','pt'],chestQuality:['素材報酬品質',''],statusCap:['状態蓄積上限','']};
const SYNERGY_LIMITS={iceHeavy:15,dawnHeavy:40,dawnDamage:50,curseDamage:8,dawnPierce:20,curseDefense:10,missingStatus:1,power:35,crit:20,pierce:20,leech:5,reduction:15,reflect:10,partPower:25,nextPower:25,extra:25,follow:15,summon:25,shield:5,heal:3,overflow:50,poisonExtend:1,fire:1,statusAdvance:1,defDown:2,materialChance:6,rareMaterial:3,chestQuality:10,statusCap:2};
Object.assign(SYNERGY_CONDITION_TEXT,{iceCritical:'自身の氷葬マーク消費（通常／スキル）',iceHeavy:'自身の氷葬マーク消費（強攻撃）',iceMarkCrit:'氷葬マーク消費攻撃が会心',curseMark:'自身の呪刻マーク消費・次の直接攻撃1回',curseThree:'呪い3スタック以上',dawnOpening:'戦闘開始から自身の2行動まで',dawnHeavy:'最初の2行動内の初回強攻撃のみ'});
Object.assign(SYNERGY_STAT_TEXT,{iceHeavy:['氷葬・強攻撃最終ダメージ','%'],dawnHeavy:['最終ダメージ','%'],dawnPierce:['敵DEF貫通','%'],dawnDamage:['与ダメージ（最終）','%'],curseDamage:['追加与ダメージ（最終）','%'],curseDefense:['敵DEF低下','%']});
function synergyRule(trigger,condition,stat,value){return {trigger,condition,stat,value};}
const COMPLETED_BUILDS=[
 ['bloodPact','血の契約',['lifesteal','bleed','lowHp'],[['leech','low','leech',3],['attack','bleedRecent','power',10]]],
 ['bastion','不落の反攻',['guard','justGuard','counter'],[['incoming','just','nextPower',20],['incoming','firstIncoming','shield',5]]],
 ['corrosion','腐蝕連鎖',['poison','longFight','statusHunter'],[['attack','poisonLong','power',15],['hit','poison','poisonExtend',1]]],
 ['iceTomb','氷葬',['freeze','crit','followUp'],[['attack','iceCritical','crit',12],['attack','iceHeavy','iceHeavy',15],['hit','iceMarkCrit','follow',15]]],
 ['dismantler','解体屋',['break','heavyAttack','farming'],[['part','heavy','partPower',20],['attack','broken','power',10]]],
 ['thunderChain','雷迅連鎖',['shock','extraAttack','speed'],[['hit','shockRemembered','extra',12],['hit','third','statusAdvance',1]]],
 ['shadowArmy','影軍',['summon','skillPower','followUp'],[['hit','third','summon',20],['hit','skill','follow',10]]],
 ['untouched','絶対無傷',['unhurt','dodge','highHp'],[['attack','unhurt','power',12],['dodge','always','nextPower',15]]],
 ['bloodFury','狂血',['lowHp','lifesteal','crit'],[['attack','low','crit',10],['leech','low','leech',2]]],
 ['deepHunter','深層狩人',['deep','boss','break'],[['part','deepBoss','partPower',20],['attack','deepBoss','power',10]]],
 ['embers','熾火の舞',['fire','multiHit','status'],[['hit','third','fire',1],['attack','status','power',8]]],
 ['hexJudge','呪刻の裁き',['curse','statusHunter','defDown'],[['attack','curseMark','power',12],['attack','curseMark','curseDefense',10],['attack','curseThree','curseDamage',8],['hit','third','defDown',2]]],
 ['shelter','慈愛の障壁',['overheal','shield','lifesteal'],[['heal','full','nextPower',12],['incoming','high','reduction',6],['incoming','firstIncoming','shield',3]]],
 ['avenger','鏡盾の報復',['reflect','guard','onHurt'],[['reflect','always','reflect',8],['attack','hurt','power',10]]],
 ['execution','一刀断罪',['singleStrike','heavyAttack','pierce'],[['attack','heavyThird','power',18],['attack','armored','pierce',10]]],
 ['spellCycle','詠唱循環',['skillPower','skillHaste','normalAttack'],[['hit','skill','nextPower',15],['attack','normal','power',8]]],
 ['chainHunter','連戦狩人',['mob','onKill','normalAttack'],[['kill','mob','heal',2],['kill','always','nextPower',15]]],
 ['firstLight','黎明の一閃',['burst','crit','singleStrike'],[['attack','dawnOpening','crit',20],['attack','dawnOpening','dawnPierce',20],['attack','dawnOpening','dawnDamage',50],['attack','dawnHeavy','dawnHeavy',40],['attack','heavyThird','power',12]]],
 ['alchemist','双相錬成',['conversion','fire','shock'],[['hit','shock','fire',1],['hit','third','extra',8]]],
 ['plague','万象疫禍',['hybrid','status','curse'],[['attack','multipleStatuses','power',12],['hit','third','missingStatus',1]]],
 ['caravan','帰還の旅団',['safe','chest','farming'],[['incoming','always','reduction',4],['effects','always','chestQuality',8]]],
 ['prospector','星鉱の鑑定士',['rareMaterial','farming','break'],[['effects','always','rareMaterial',2],['part','always','partPower',10]]],
 ['endurance','不屈の歩み',['longFight','onHurt','shield'],[['attack','long','power',12],['incoming','firstIncoming','shield',3]]],
 ['windChase','風追い',['dodge','speed','extraAttack'],[['dodge','always','nextPower',18],['hit','second','extra',8]]],
 ['abyssCovenant','奈落の盟約',['abyssal','deep','statusHunter'],[['attack','abyssal','power',15],['attack','multipleStatuses','crit',10]]]
].map(([id,name,requiredTags,rules])=>({id,name,requiredTags,requiredRoles:['weapon','armor','accessory'],unlockFloor:id==='abyssCovenant'?500:0,rules:rules.map(r=>synergyRule(...r))}));
const EQUIPMENT_SYNERGIES={};
const SYNERGY_DEFINITION_INDEX=new WeakMap();
function synergyEquipmentDefinition(item){return item&&(EQUIPMENT_CATALOG[item.key]||EQUIPMENT_CATALOG[item.id]||item);}
function createEquipmentSynergy(id,r){
 const primary=r.primaryBuildTag,slot=equipmentSlot(r),core=SYNERGY_CORE[primary];if(!core)return null;
 const secondary=(r.secondaryBuildTags||[]).filter(t=>t!==primary),effects=r.effects||{},rank=['Common','Rare','Epic','Legendary','Mythic','Abyssal'].indexOf(r.rarity);
 let step=0,p=r.parent,seen=new Set([id]);while(p&&!seen.has(p)){seen.add(p);step++;p=EQUIPMENT_CATALOG[p]?.parent;}
 const sharp=rank<=1,scale=[1.4,1.25,1.1,1,1.1,1.2][Math.max(0,rank)];
 const rules=[{...synergyRule(...core),primary,strict:sharp}];
 if(!['poisonExtend','fire','statusAdvance','defDown','overflow'].includes(core[2]))rules[0].value=Math.round((core[3]*scale+step*.5)*10)/10;
 const stateTag=[primary,...secondary].find(t=>['bleed','poison','fire','freeze','shock','curse'].includes(t));
 const focused=stateTag&&SYNERGY_CONDITION_TEXT[stateTag]?stateTag:effects.poisonBonus?'poison':effects.critDamage?'high':'status';
 const role=slot==='weapon'?(WEAPON_TYPES[r.weaponType]?.build||'normalAttack'):slot;
 const roleRules={head:['attack',focused,'crit',3],armor:['incoming',effects.guardHeal?'guard':'low','reduction',3],arms:['attack',effects.skillPower?'skill':/槌|斧|大剣/.test(r.name)||secondary.includes('heavyAttack')?'heavy':'normal','power',4],legs:['dodge','always','nextPower',5],accessory:['attack',secondary.includes('lowHp')?'low':focused,'power',5]};
 const weaponRules={crit:['attack','status','crit',3],break:['part','heavy','partPower',5],heavyAttack:['attack','heavy','power',4],singleStrike:['attack','heavyThird','power',5],multiHit:['hit','third','extra',3],lifesteal:['leech','low','leech',1],counter:['attack','charged','power',5],guard:['incoming','guard','reduction',2],status:['hit','third','statusAdvance',1]};
 const roleRule=roleRules[slot]||(slot==='weapon'?(weaponRules[role]||['attack',role==='skillPower'?'skill':'normal','power',3]):null);
 if(roleRule)rules.push({...synergyRule(...roleRule),primary,strict:sharp});
 if(step>0)rules.push({...synergyRule('attack',stateTag||(['heavyAttack','singleStrike','break'].includes(primary)?'heavy':'normal'),'power',2+step),primary,strict:sharp});
 if(rank>=4){
  if(stateTag)rules.push({...synergyRule('effects','always','statusCap',1),primary:stateTag});
  else rules.push({...synergyRule('hit','critical','nextPower',6),primary});
 }
 if(rank>=5){
  if(primary==='overheal')rules.push(synergyRule('heal','full','nextPower',12));
  else if(['lifesteal','shield','lowHp'].includes(primary))rules.push(synergyRule('heal','full','overflow',50));
  else if(stateTag)rules.push({...synergyRule('hit','maxStatus','extra',15),primary:stateTag,consumeStatus:true});
  else rules.push(synergyRule('kill','always','heal',1));
 }
 return {id,primary,slot,role,rank,step,rules,coreDescription:BUILD_RULE_TEXT[primary],selection:{name:r.name,weaponType:r.weaponType||null,secondary,effects:Object.keys(r.effects||{}),parent:r.parent||null}};
}
for(const [id,r]of Object.entries(EQUIPMENT_CATALOG)){EQUIPMENT_SYNERGIES[id]=createEquipmentSynergy(id,r);SYNERGY_DEFINITION_INDEX.set(r,EQUIPMENT_SYNERGIES[id]);}
