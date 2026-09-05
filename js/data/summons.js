const SUMMON_CONFIG={rates:[.55,.25,.12,.05,.02,.01],rarities:['Common','Rare','Epic','Legendary','Mythic','Abyssal'],singleCost:5000,tenCost:45000,pity:{2:50,3:100,4:250,5:500},normal:[.2,.3,.4,.5,.6,.7],rare:[.1,.15,.2,.3,.4,.5],boss:[.05,.08,.12,.18,.25,.35],caps:{normal:.7,rare:.5,boss:.35},manualBattlesPerMinute:1,bossMinutes:30,durations:[10,30,60,180,360],maxDispatch:1,unlockBoss:20,specialtyPoints:.1};
const SUMMON_SPECIALTIES={normal:'通常',plant:'植物',ore:'鉱石・石',beast:'獣',fire:'炎',fungus:'菌類',undead:'アンデッド',aquatic:'水棲',bleed:'出血',memory:'記憶・霊体',machine:'機械',poison:'毒',shock:'感電',flying:'飛行',rare:'Rare以上',boss:'ボス',special:'Epic以上の特殊',crystal:'結晶',mirror:'鏡像',abyssal:'Abyssal'};
const SUMMON_SPECIALTY_OVERRIDES={'mine-bat':.2};
const SUMMON_ROWS=[
 ['moss-rat','モスラット',0,'plant','小型','緑灰色','地下ネズミ。背中に小さな発光苔'],
 ['mini-slime','ミニスライム',0,'normal','小型','青透明','小型スライム。内部に小さな光核'],
 ['mine-bat','鉱山コウモリ',0,'ore','小型','黒灰・青','コウモリ。耳と翼に青い鉱石片'],
 ['cave-wolf','洞窟小狼',0,'beast','小型','灰・青灰','小さな狼。青灰色の瞳'],
 ['ember-lizard','灯火トカゲ',0,'fire','小型','黒・橙','トカゲ。尾の先に小さな橙色の火'],
 ['mushroom-sprite','キノコ精',0,'fungus,plant','小型','白・青緑','キノコ精霊。青緑に光る傘'],
 ['bone-cat','骨ネコ',0,'undead','小型','白骨・淡青','猫型アンデッド。淡い青い魂火'],
 ['little-golem','小型ゴーレム',0,'ore','小型','石灰・青','丸い石ゴーレム。胸に小さな結晶'],
 ['jade-wolf','翡翠狼',1,'beast','中型','深緑・翡翠','身体の一部が翡翠結晶化した狼'],
 ['crystal-jellyfish','水晶クラゲ',1,'aquatic','小型','透明青','クラゲ。内部に水晶核'],
 ['red-fang-hound','赤牙ハウンド',1,'beast,bleed','中型','黒赤','猟犬。大きな赤い牙'],
 ['spirit-fox','幽灯狐',1,'memory','小型','白銀・青','狐。尻尾の周囲に青い魂火'],
 ['iron-spider','鉄殻蜘蛛',1,'machine','中型','黒鉄','金属装甲の蜘蛛。脚部に小型歯車'],
 ['poison-moth','毒羽蛾',1,'poison,plant','大型の蛾','紫緑','羽から毒粒子を放つ蛾'],
 ['little-wraith','小型レイス',1,'undead,memory','小型','青白','フード姿の霊体'],
 ['thunder-horn','雷角獣',2,'shock','中型','黒・青','四足獣。額に青い雷角'],
 ['blood-crystal-wolf','血晶狼',2,'beast,bleed','大型','暗赤','狼。身体から赤い結晶'],
 ['azure-gargoyle','蒼翼ガーゴイル',2,'ore,flying','大型','青灰','石像翼獣。翼に青い魔法紋'],
 ['moon-panther','月影豹',2,'rare','大型','黒紺','豹。身体の輪郭に淡い月光'],
 ['spirit-sapling','霊樹の仔',2,'plant','小型','青緑・木色','樹木精霊。枝角と青緑の光'],
 ['furnace-drone','炉心ドローン',2,'machine','中型','金属・橙','古代文明の浮遊機械。中央に橙色の炉心'],
 ['silver-griffin','白銀グリフォン',3,'rare,flying','大型','白銀・青白','グリフォン。翼端に青白い魔法光'],
 ['obsidian-dragon','黒曜竜',3,'ore,boss','中型の竜','黒曜・青','ドラゴン。鱗の亀裂から青い光'],
 ['memory-beast','記憶喰らいの獣',3,'memory,rare','大型','黒・青白','獣。霧を纏い顔の一部が曖昧'],
 ['relic-golem','聖骸ゴーレム',3,'boss,undead','大型','白骨・金','古代騎士の鎧と白骨が融合。胸に金色の核'],
 ['time-fenrir','時喰いフェンリル',4,'rare,boss','巨大','黒銀・青紫','狼。時計のような光輪と青紫の残像'],
 ['star-whale','星喰らい鯨',4,'special,crystal','巨大','星空色','宙を泳ぐ幻想鯨。身体内部に星空'],
 ['mirror-twin','鏡界の双頭獣',4,'memory,mirror,rare','大型','銀・黒','双頭魔獣。片方は実体、片方は半透明の鏡像'],
 ['vol-negra','深淵竜ヴォル＝ネグラ',5,'abyssal,boss','巨大','黒紫・青紫','竜。身体が空間亀裂のように欠け、翼に黒い粒子'],
 ['faceless-observer','無貌の観測獣',5,'abyssal,rare','巨大','黒・青白','顔のない四足異形。頭部中央に観測核、身体から触手状の影']
];
const SUMMONS=Object.fromEntries(SUMMON_ROWS.map(([id,name,tier,specialties,size,colors,features])=>[id,{id,name,tier,rarity:SUMMON_CONFIG.rarities[tier],specialties:specialties.split(','),size,colors,features,appearance:`${size}、${colors}。${features}。背景なし、ゲームUI用立ち絵`,summonImage:null,plannedImage:`assets/summons/${id}.png`}]));
// Explicit source tags: they describe material specialties, not a replacement for enemy visual families.
const SUMMON_SOURCE_TAGS=[
 ['beast','undead','ore','ore','ore'],['machine','undead,memory','ore,flying','machine','machine,shock'],['special','machine','beast,bleed','special','special'],['plant','plant,fungus,poison','plant,poison','plant','plant'],['aquatic','aquatic,shock','beast,aquatic','undead,aquatic','aquatic'],['special','special','beast,bleed','special','special,bleed'],['undead,memory','undead,memory','undead','memory','memory'],['mirror,memory','mirror,memory','mirror,memory','mirror,memory','mirror,memory'],['memory','memory','memory','memory','memory'],['plant,bleed','aquatic','memory','memory','machine,memory'],['beast,ore','ore','ore','ore','ore'],['machine,fire','machine','machine','machine,fire','machine,fire'],['plant,beast,poison','poison,aquatic','fungus,plant','plant,poison','plant,poison'],['ore','undead,memory','undead','undead','undead'],['crystal','crystal,beast','crystal','crystal','crystal'],['undead','undead,beast','undead','undead','undead'],['aquatic','aquatic','aquatic','aquatic','aquatic'],['beast,bleed','bleed','bleed','bleed','bleed'],['memory','beast,memory','memory','memory','memory'],['memory','beast','memory','memory','machine']
];
