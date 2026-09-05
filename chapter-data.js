const CHAPTER_AREAS = [
 {id:7,name:'記憶墓地 (61〜70F)',tag:'記憶墓地',min:61,max:70,rule:'同じ行動の反復を記憶し、後半ほど対策する敵が多い。',
  enemies:[{name:'残響騎士',icon:'🕯️',hp:320,atk:104,def:30,trait:'echo_action',traitName:'残響模倣',hint:'直前の攻撃・防御を模倣する'}, {name:'追憶亡者',icon:'👻',hp:300,atk:108,def:26,trait:'repeat_resist',traitName:'反復耐性',hint:'同じ行動を繰り返すと防御が上昇（上限あり）'}, {name:'墓守り',icon:'🪦',hp:370,atk:100,def:34,trait:'grave_inherit',traitName:'死者の継承',hint:'前の戦闘で倒した敵の攻撃力の一部を3T継承'}],
  elite:{name:'忘れられた英雄',icon:'⚰️',hp:740,atk:119,def:34,trait:'action_memory',traitName:'英雄の戦歴',hint:'直前と同じ行動を読む'},
  boss:{name:'【墓碑の王】',icon:'🪦',hp:3200,atk:125,def:42,gimmick:'history_king'},craftTheme:{prefix:'記憶',normal:'残響刃',rare:'追憶剣',upper:'墓守剣',boss:'墓碑王剣',hidden:'忘れられた英雄剣'}},
 {id:8,name:'鏡写しの街 (71〜80F)',tag:'鏡写しの街',min:71,max:80,rule:'装備や強化状態を模倣する敵。自分の力が敵にも利用される。',
  enemies:[{name:'鏡人',icon:'🪞',hp:380,atk:115,def:36,trait:'mirror_stats',traitName:'能力反射',hint:'プレイヤー攻防の一部を複写する'}, {name:'空席の住人',icon:'🪑',hp:340,atk:119,def:30,trait:'steal_buff',traitName:'席の横取り',hint:'次撃強化を盗む'}, {name:'偽りの幼馴染',icon:'🎭',hp:360,atk:112,def:33,trait:'false_friend',traitName:'偽りの声',hint:'呪いと弱体化を与える'}],
  elite:{name:'模造された冒険者',icon:'🧑‍🤝‍🧑',hp:850,atk:132,def:40,trait:'mirror_stats',traitName:'模造装備',hint:'装備の能力を一部複写する'},
  boss:{name:'【鏡界の番人】',icon:'🪞',hp:3800,atk:139,def:47,gimmick:'mirror_warden'},craftTheme:{prefix:'鏡界',normal:'鏡刃',rare:'虚像剣',upper:'反射剣',boss:'鏡界王剣',hidden:'真像の双剣'}},
 {id:9,name:'忘却回廊 (81〜90F)',tag:'忘却回廊',min:81,max:90,rule:'効果封印・スキル封印に注意。名前を隠す敵もいる。',
  enemies:[{name:'記憶喰らい',icon:'🫥',hp:420,atk:126,def:39,trait:'seal_effect',traitName:'記憶封印',hint:'装備の共通特殊効果1種類を2T封印'}, {name:'忘却虫',icon:'🪲',hp:370,atk:123,def:35,trait:'forget_skill',traitName:'技の忘却',hint:'武器スキルを一時封印する'}, {name:'空白の騎士',icon:'♟️',hp:460,atk:128,def:44,trait:'blank_learn',traitName:'空白学習',hint:'HP半分以下で同じ行動に対策'}],
  elite:{name:'名を失った者',icon:'❔',hp:980,atk:145,def:44,trait:'seal_effect',traitName:'名の消去',hint:'共通効果1種類を封印する'},
  boss:{name:'【忘却の司書】',icon:'📖',hp:4500,atk:154,def:52,gimmick:'forget_librarian'},craftTheme:{prefix:'忘却',normal:'白紙刃',rare:'失名剣',upper:'封印剣',boss:'司書の断章剣',hidden:'記憶奪還剣'}},
 {id:10,name:'境界層 (91〜100F)',tag:'境界層',min:91,max:100,rule:'転移門は95Fのみ安定。歪曲個体は元の性質に加え状態異常を持つ。',
  enemies:[{name:'歪曲・寄生樹人',icon:'🌑',hp:500,atk:138,def:46,trait:'warped_tree',traitName:'歪曲樹液',hint:'自己回復と出血付与'}, {name:'歪曲・水没騎士',icon:'🌀',hp:480,atk:144,def:50,trait:'warped_knight',traitName:'断層装甲',hint:'強攻撃の隙を狙い拘束する'}, {name:'歪曲・観測眼球',icon:'🧿',hp:430,atk:141,def:42,trait:'warped_eye',traitName:'境界観測',hint:'バフを盗み呪いを与える'}],
  elite:{name:'境界監視者',icon:'⚖️',hp:1150,atk:162,def:50,trait:'boundary_watch',traitName:'越境監視',hint:'防御の反復を破り、出血を重ねる'},
  boss:{name:'【境界門の守護機構】',icon:'🚪',hp:5400,atk:170,def:58,gimmick:'boundary_gate'},craftTheme:{prefix:'境界',normal:'断層刃',rare:'越境剣',upper:'門衛剣',boss:'境界の鍵剣',hidden:'未踏の黎明剣'}}
];
AREAS.push(...CHAPTER_AREAS);
const CHARACTER_DATA = {
 elna:{id:'elna',name:'エルナ',icon:'🌻',role:'幼馴染・同行者',contractPool:'first_contract',desc:'明るく世話焼きな幼馴染。地下1000階へ一緒に行く約束を交わした。'},
 mina:{id:'mina',name:'ミナ',icon:'🗡️',role:'探索者',desc:'寡黙な実力派。無理な約束はしないが、引き受けたことは必ず守る。'}
};
const TUTORIAL_STEPS = {
 1:['扉を選ぶ','気になる気配を選んでみて。危険度も見てね。一本道で迷ったら、私が笑ってあげる。','battle_normal'],
 2:['攻撃と防御','通常攻撃で削って、敵の大技予告には防御。毎回防御すると疲れるから、交互に使ってみよう。','battle_normal'],
 3:['素材を持ち帰る','ほら、牙が落ちた。完成した剣じゃなくても、地上の鍛冶屋で私たちの武器になるよ。','battle_normal'],
 4:['宝箱とレアリティ','宝箱は完成装備が見つかりやすいよ。色だけで決めないで、効果も読むこと。','chest_normal'],
 5:['安全帰還','ここなら戦利品を全部持ち帰れる。10階はボスだから帰還門じゃない。帰るのも立派な判断！','safe'],
 6:['強攻撃とスキル','強攻撃は大きな隙もできるよ。スキルの残りターンを見て、使い分けよう。','battle_normal'],
 7:['状態異常','毒や弱体の表示に注意。出発前に渡した万能解毒薬はバッグから使えるよ。','battle_normal'],
 8:['初クラフトの準備','素材は帰還して倉庫へ。作成画面に必要数が出るから、欲しい武器を決めて狩るといいね。','battle_normal'],
 9:['装備と連携','武器・頭・胴・腕・脚・アクセ2個。全部を高レアにしなくても、効果が噛み合えば強いよ。','chest_normal'],
 10:['初ボス','溜めの予告が来たら構えて！ 倒せたら一度帰ろう。鍛冶屋も酒場も、案内するから。','boss']
};
