const explorationAreas = ['古い地下坑道','崩れた地下街','湿った水路遺跡','巨大樹根の地下森','古代墓所','生体迷宮','記憶墓地','鏡写しの街','忘却回廊','境界層'].map((name,i)=>({
 id:`area_${String(i+1).padStart(2,'0')}`,floorMin:i*10+1,floorMax:(i+1)*10,name,
 enabled:i===0,backgrounds:[{src:'assets/home-background.png',position:'center',label:'仮背景'}],
 effects:i===5?['mist','red','dust']:i===2?['mist','blue','dust']:['mist','torch','dust'],
 titles:{battle_normal:['足音が坑道に響く','血痕が奥へ続いている','暗がりに動く影'],elite_battle:['巨大な影が動いた']},
 lines:['この先、何かいるね。','ねえ、あそこ光ってない？','足元に気をつけてね。']
}));
const EXPLORATION_ROUTES={
 battle_normal:{kind:'戦闘',reward:'？？？素材',tone:'combat'},elite_battle:{kind:'エリート',reward:'高品質素材の期待',tone:'elite'},
 chest_normal:{kind:'宝箱',reward:'素材・ゴールド',tone:'treasure'},cursed_chest:{kind:'呪い宝箱',reward:'希少素材 / 呪いの代償',tone:'elite'},
 heal_spring:{kind:'休憩',reward:'HP回復',tone:'rest'},merchant:{kind:'商人',reward:'商品を購入',tone:'treasure'},
 mystery_wanderer:{kind:'イベント',reward:'出会い・謎',tone:'event'},deep_area_event:{kind:'イベント',reward:'エリア固有の探索',tone:'event'},
 golden_stairs:{kind:'探索',reward:'特殊な階段',tone:'treasure'},sealed_vault:{kind:'宝物庫',reward:'封印された素材',tone:'treasure'},
 emergency_portal:{kind:'帰還',reward:'戦利品を選んで帰還',tone:'rest'}
};
