const EXPLORATION_AREA_THEMES=[
 ['mine',['dust','torch','mist'],['奥から足音が響く','崩れた坑道に影が見える'],'積まれた古い木箱','坑道脇の湧き水','折れた支柱の向こう','足元、気をつけてね'],
 ['ruined-city',['mist','embers','blue'],['瓦礫の陰で何かが動いた','無人の商店から足音がする'],'崩れた店の置き土産','広場に残る泉','廃屋に灯りが見える','昔は賑やかだったのかな'],
 ['waterway',['water','drops','blue-mist'],['水面の下で何かが動いた','奥から水音とは違う音がする'],'水際に流れ着いた箱','澄んだ水が湧いている','水門の奥で光が揺れる','水の中、何かいそう……'],
 ['root-forest',['spores','dust','mist'],['根の隙間で影がうごめく','茂みの奥から唸り声がする'],'根に抱かれた宝箱','光る苔に囲まれた泉','巨根の中に空洞がある','根っこにつまずかないでね'],
 ['tomb',['torch','dust','cold'],['石棺の蓋が軋んでいる','祭壇の前に影が立っている'],'石棺の傍らの奉納箱','静かな祭壇の泉','蝋燭の灯る碑文','ここでは静かに歩こう'],
 ['biological',['red','steam','bio-particles'],['壁が脈打っている','肉壁の奥から何かが這ってくる'],'膜に包まれた収納槽','冷たい液体が湧いている','壁の内側から声がする','ここ……本当に生きてるの？'],
 ['memory-graveyard',['memory','cold','mist'],['墓標の間に人影が立っている','消えた足跡がまた現れる'],'墓前に残された箱','記憶の光が集まる泉','古い墓標が呼んでいる','この場所、なんだか懐かしい……'],
 ['mirror-city',['reflection','shimmer','dust'],['鏡の向こうで何かが見ている','映った影だけが近づいてくる'],'鏡に映る宝箱','波紋のない泉','鏡の店先に灯りがある','映っているのは本当に私たち？'],
 ['oblivion-corridor',['white-mist','black-dust','shimmer'],['名前のない影が近づいてくる','足音だけが記憶に残る'],'名前の消えた収納箱','白い霧の中の泉','文字の消えた道標','今いた道、忘れないようにね'],
 ['boundary',['violet','rift','stars'],['空間の裂け目から敵影が現れる','境界の向こうで何かが動く'],'裂け目に浮かぶ宝箱','星光が溜まる泉','二つの空が交わる場所','ここから先、空気が違うね']
];
const explorationAreas = ['古い地下坑道','崩れた地下街','湿った水路遺跡','巨大樹根の地下森','古代墓所','生体迷宮','記憶墓地','鏡写しの街','忘却回廊','境界層'].map((name,i)=>({
 id:`area_${String(i+1).padStart(2,'0')}`,floorMin:i*10+1,floorMax:(i+1)*10,name,
 enabled:true,backgrounds:[{src:`assets/images/exploration/explore-${String(i+1).padStart(2,'0')}-${EXPLORATION_AREA_THEMES[i][0]}.png`,position:'center',label:'仮背景'}],
 effects:EXPLORATION_AREA_THEMES[i][1],
 titles:{battle_normal:EXPLORATION_AREA_THEMES[i][2],elite_battle:[EXPLORATION_AREA_THEMES[i][2][0]+' ― 強大な気配'],chest_normal:[EXPLORATION_AREA_THEMES[i][3]],cursed_chest:[EXPLORATION_AREA_THEMES[i][3]+' ― 不穏な気配'],heal_spring:[EXPLORATION_AREA_THEMES[i][4]],mystery_wanderer:[EXPLORATION_AREA_THEMES[i][5]],deep_area_event:[EXPLORATION_AREA_THEMES[i][5]]},
 lines:[EXPLORATION_AREA_THEMES[i][6]]
}));
const EXPLORATION_ROUTES={
 battle_normal:{kind:'戦闘',reward:'？？？素材',tone:'combat'},elite_battle:{kind:'エリート',reward:'高品質素材の期待',tone:'elite'},
 chest_normal:{kind:'宝箱',reward:'素材・ゴールド',tone:'treasure'},cursed_chest:{kind:'呪い宝箱',reward:'希少素材 / 呪いの代償',tone:'elite'},
 heal_spring:{kind:'休憩',reward:'HP回復',tone:'rest'},merchant:{kind:'商人',reward:'商品を購入',tone:'treasure'},
 mystery_wanderer:{kind:'イベント',reward:'出会い・謎',tone:'event'},deep_area_event:{kind:'イベント',reward:'エリア固有の探索',tone:'event'},
 golden_stairs:{kind:'探索',reward:'特殊な階段',tone:'treasure'},sealed_vault:{kind:'宝物庫',reward:'封印された素材',tone:'treasure'},
 emergency_portal:{kind:'帰還',reward:'戦利品を選んで帰還',tone:'rest'}
};
