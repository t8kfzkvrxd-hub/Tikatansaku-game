    const AREAS = [
      {
        id: 1, name: '廃坑 (1〜10F)', tag: '廃坑', min: 1, max: 10,
        enemies: [
          { name: '鉱山ネズミ', icon: '🐀', hp: 25, atk: 7, def: 1, trait: 'speed', traitName: '俊敏', hint: '素早い連撃に注意' },
          { name: '坑道スケルトン', icon: '💀', hp: 35, atk: 10, def: 2, trait: 'counter_heavy', traitName: '反撃の構え', hint: '強撃にカウンター！通常攻撃推奨' },
          { name: 'コボルト採掘兵', icon: '⛏️', hp: 42, atk: 13, def: 3, trait: 'grab_attack', traitName: '拘束粉砕', hint: '防御を貫通！攻撃かスキルで阻止せよ' }
        ],
        elite: { name: '狂気のトロッコ怪人', icon: '🧌', hp: 90, atk: 18, def: 6, isElite: true, trait: 'rage_stack', traitName: '狂気激昂', hint: '攻撃を受けるたび攻撃力上昇！速攻推奨' },
        boss: { name: '【坑道の巨人】', icon: '🗿', hp: 260, atk: 22, def: 8, gimmick: 'heavy_charge' }
      },
      {
        id: 2, name: '地下遺跡 (11〜20F)', tag: '地下遺跡', min: 11, max: 20,
        enemies: [
          { name: '遺跡の自律歩哨', icon: '🤖', hp: 65, atk: 20, def: 6, trait: 'grab_attack', traitName: '電磁拘束', hint: '防御貫通スタン攻撃！攻撃で迎撃せよ' },
          { name: '怨嗟のレイス', icon: '👻', hp: 55, atk: 26, def: 3, trait: 'curse_poison', traitName: '呪毒の霧', hint: '攻撃時に毒付与！速やかに討て' },
          { name: '翡翠のガーゴイル', icon: '🦇', hp: 85, atk: 22, def: 10, trait: 'guard_enrage', traitName: '盾喰らい', hint: '防御されると攻撃力が上昇！攻撃を織り交ぜろ' }
        ],
        elite: { name: '古代の処刑執行機', icon: '⚙️', hp: 170, atk: 34, def: 12, isElite: true, trait: 'counter_heavy', traitName: '断頭反撃', hint: '強撃厳禁！防御とスキルで隙を突け' },
        boss: { name: '【古代の守護者】', icon: '🏛️', hp: 520, atk: 36, def: 18, gimmick: 'shield_barrier' }
      },
      {
        id: 3, name: '放棄研究施設 (21〜30F)', tag: '研究施設', min: 21, max: 30,
        enemies: [
          { name: '変異スライム', icon: '🧪', hp: 110, atk: 35, def: 10, trait: 'regen_cell', traitName: '再生細胞', hint: '2ターンごとにHP自動再生！高火力で削れ' },
          { name: '暴走サイボーグ', icon: '🦾', hp: 130, atk: 42, def: 14, trait: 'exposed_weakpoint', traitName: '冷却露出', hint: '3ターン周期で弱点露出(被ダメ2倍)！好機を逃すな' },
          { name: 'キメラハウンド', icon: '🐕‍🦺', hp: 125, atk: 46, def: 8, trait: 'rage_stack', traitName: '捕食本能', hint: '被弾で攻撃力上昇！一撃必殺を狙え' }
        ],
        elite: { name: '被験体第9号', icon: '🧬', hp: 280, atk: 54, def: 16, isElite: true, trait: 'guard_breaker', traitName: '装甲破砕触手', hint: '防御時にガードゲージを大きく破壊する' },
        boss: { name: '【失敗作EX-03】', icon: '👾', hp: 950, atk: 58, def: 22, gimmick: 'mutate_form' }
      },
      {
        id:4, name:'地下森林 (31〜40F)', tag:'地下森林', min:31, max:40,
        enemies:[
          {name:'寄生樹人',icon:'🌿',hp:180,atk:54,def:17,trait:'regen_cell',traitName:'樹液再生',hint:'2ターンごとに再生する'},
          {name:'深淵胞子',icon:'🍄',hp:145,atk:59,def:12,trait:'spore_poison',traitName:'増殖胞子毒',hint:'毒が重なる前に倒せ'},
          {name:'巨大根蜘蛛',icon:'🕷️',hp:165,atk:62,def:15,trait:'skill_bind',traitName:'根糸拘束',hint:'被弾するとスキルCDが延長'}
        ], elite:{name:'古森の捕食王',icon:'🌳',hp:390,atk:68,def:22,isElite:true,trait:'ancient_growth',traitName:'古森成長',hint:'毎ターン攻撃と防御が成長'},
        boss:{name:'【深根の母樹】',icon:'🌲',hp:1350,atk:68,def:25,gimmick:'mother_tree'}
      },
      {
        id:5, name:'水没都市 (41〜50F)', tag:'水没都市', min:41, max:50,
        enemies:[
          {name:'水没騎士',icon:'🌊',hp:220,atk:70,def:30,trait:'counter_heavy',traitName:'潮流受け流し',hint:'強攻撃をJUST GUARDしてくる'},
          {name:'深海クラゲ',icon:'🪼',hp:175,atk:73,def:16,trait:'paralysis',traitName:'麻痺触手',hint:'次ターンのスキルを封印'},
          {name:'沈殿ワニ',icon:'🐊',hp:240,atk:75,def:20,trait:'low_hp_frenzy',traitName:'瀕死暴走',hint:'低HPで攻撃力が急上昇'}
        ], elite:{name:'沈没船の船長',icon:'⚓',hp:480,atk:82,def:28,isElite:true,trait:'captain_phase',traitName:'亡霊船団',hint:'HP低下で連撃と防御強化'},
        boss:{name:'【水底王ネレウス】',icon:'👑',hp:1800,atk:82,def:32,gimmick:'rising_water'}
      },
      {
        id:6, name:'肉壁迷宮 (51〜60F)', tag:'肉壁迷宮', min:51, max:60,
        enemies:[
          {name:'脈動肉塊',icon:'🫀',hp:280,atk:83,def:24,trait:'death_pulse',traitName:'治癒脈動',hint:'撃破後、次の敵が3ターン最大HP6%回復'},
          {name:'観測眼球',icon:'👁️',hp:230,atk:88,def:22,trait:'copy_buff',traitName:'模倣視線',hint:'プレイヤーの攻撃バフをコピー'},
          {name:'血走獣',icon:'🩸',hp:265,atk:90,def:20,trait:'low_hp_frenzy',traitName:'血走暴走',hint:'HPが減るほど危険'}
        ], elite:{name:'神経節の守護者',icon:'🧠',hp:600,atk:98,def:30,isElite:true,trait:'action_memory',traitName:'行動記憶',hint:'同じ行動を連続すると即座に反撃'},
        boss:{name:'【深淵胎動核】',icon:'❤️',hp:2600,atk:100,def:36,gimmick:'three_phase_core'}
      }
    ];

    /* ==========================================================================
       STATE & PERSISTENCE
       ========================================================================== */
