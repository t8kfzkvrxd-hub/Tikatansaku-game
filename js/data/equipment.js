    const SYNERGIES = [
      {
        id: 'syn_blood',
        name: '🩸 血の誓約',
        setTag: 'blood',
        desc: '2部位: 攻撃時HP+4吸血。3部位: 低HP時に攻撃・吸血がさらに強化！',
        reqLevels: [2, 3]
      },
      {
        id: 'syn_gold',
        name: '👑 黄金王',
        setTag: 'gold',
        desc: '2部位: 獲得ゴールド+100%。3部位: 獲得金貨+250% ＆ 商人全品50%割引！',
        reqLevels: [2, 3]
      },
      {
        id: 'syn_curse',
        name: '👁️ 呪怨の契約',
        setTag: 'curse',
        desc: '2部位: 攻撃力+25、会心+15% (毎階HP-2)。3部位: 攻撃力+60、会心+30%、最大HP-15%。',
        reqLevels: [2, 3]
      },
      {
        id: 'syn_titan',
        name: '🗿 剛力金剛',
        setTag: 'titan',
        desc: '2部位: 防御力+8、HP+40。3部位: パリィ率55%＆防御力/HP強化（JUST GUARD時は確定反撃）',
        reqLevels: [2, 3]
      }
    ];

    // Unique / Archetype Items
    const UNIQUE_ITEMS = {
      // Daggers
      vamp_dagger: {
        key: 'vamp_dagger', name: '吸血の短剣', icon: '🗡️', type: 'weapon', rarity: 'Epic',
        archetype: 'dagger', setTag: 'blood', baseAtk: 14, vamp: 4,
        desc: '【短剣】通常攻撃が2連続攻撃！敵撃破時HP4回復'
      },
      shadow_dagger: {
        key: 'shadow_dagger', name: '千刃の影短剣', icon: '🗡️', type: 'weapon', rarity: 'Legendary',
        archetype: 'dagger', baseAtk: 24, crit: 25,
        desc: '【短剣】通常攻撃2連撃！スキル「影縫い連撃」で敵DEF低下'
      },

      // Greatswords
      execution_greatsword: {
        key: 'execution_greatsword', name: '処刑人の巨断剣', icon: '🗡️', type: 'weapon', rarity: 'Legendary',
        archetype: 'greatsword', setTag: 'titan', baseAtk: 34,
        desc: '【大剣】強攻撃の威力2.4倍！スキルで敵防御50%貫通'
      },
      gold_blade: {
        key: 'gold_blade', name: '黄金の宝剣', icon: '⚔️', type: 'weapon', rarity: 'Epic',
        archetype: 'sword', setTag: 'gold', baseAtk: 18, goldRate: 70,
        desc: '獲得金額+70%'
      },

      // Thunder / Magic / Scythe
      thunder_mace: {
        key: 'thunder_mace', name: '雷神の破滅槌', icon: '🔨', type: 'weapon', rarity: 'Legendary',
        archetype: 'thunder', baseAtk: 26,
        desc: '【雷槌】攻撃時+14固定雷ダメージ！スキル「天雷招来」'
      },
      death_scythe: {
        key: 'death_scythe', name: '死神の契約鎌', icon: '🔪', type: 'weapon', rarity: 'Legendary',
        archetype: 'cursed_staff', setTag: 'curse', isCurse: true, baseAtk: 40, crit: 35, curseHpDrain: 2,
        desc: '【呪杖・鎌】会心+35%。スキルでHP10消費し超魔力撃 (毎階HP-2)'
      },
      
      // Armors & Shields
      gold_mail: {
        key: 'gold_mail', name: '黄金の豪奢鎧', icon: '🥋', type: 'armor', rarity: 'Rare',
        setTag: 'gold', baseDef: 7, goldRate: 50, hp: 25, desc: '獲得金貨+50%'
      },
      abyss_armor: {
        key: 'abyss_armor', name: '深淵の重鋼鎧', icon: '🛡️', type: 'armor', rarity: 'Legendary',
        archetype: 'shield', setTag: 'titan', baseDef: 30, hp: 85, isCurse: true, curseHpDrain: 1,
        desc: '【盾壁】鉄壁の防御力。防御時カウンター反射 (毎階HP-1)'
      },
      blood_garb: {
        key: 'blood_garb', name: '血盟の修道衣', icon: '🥋', type: 'armor', rarity: 'Epic',
        setTag: 'blood', baseDef: 14, hp: 60, vamp: 2, desc: '吸血+2, HP+60'
      },
      
      // Accessories
      blood_ring: {
        key: 'blood_ring', name: '血晶の指輪', icon: '💍', type: 'accessory', rarity: 'Rare',
        setTag: 'blood', vamp: 3, hp: 30, desc: '撃破時HP3回復'
      },
      berserk_ring: {
        key: 'berserk_ring', name: '狂戦士の指輪', icon: '💍', type: 'accessory', rarity: 'Epic',
        isBerserk: true, desc: 'HP50%以下で攻撃力2倍！'
      },
      gold_mask: {
        key: 'gold_mask', name: '呪われし黄金仮面', icon: '🎭', type: 'accessory', rarity: 'Legendary',
        setTag: 'gold', isCurse: true, goldRate: 150, demeritDamageTaken: 25,
        desc: '獲得金貨+150% (被ダメ+25%)'
      },
      giant_bracer: {
        key: 'giant_bracer', name: '巨人の怪力腕輪', icon: '💪', type: 'accessory', rarity: 'Rare',
        setTag: 'titan', baseAtk: 8, hp: 45, desc: '攻撃+8, HP+45'
      },
      luck_key: {
        key: 'luck_key', name: '幸運の合鍵', icon: '🗝️', type: 'accessory', rarity: 'Rare',
        rareRate: 35, desc: '宝箱レア率+35%'
      },

      // Mystery Items (長期的な使い道やストーリーを持つアイテム)
      black_egg: {
        key: 'black_egg', name: '深淵の黒卵', icon: '🥚', type: 'relic', rarity: 'Epic',
        desc: '生還3回で孵化する謎の卵。何かが中で脈動している…'
      },
      broken_crown: {
        key: 'broken_crown', name: '壊れた深淵王の冠', icon: '👑', type: 'relic', rarity: 'Epic',
        desc: '階層ボスを撃破すると真の姿を取り戻す古びた王冠'
      },
      ancient_key: {
        key: 'ancient_key', name: '錆びた古代鍵', icon: '🗝️', type: 'relic', rarity: 'Rare',
        desc: '地下遺跡の封印宝物庫を開錠できる鍵'
      },
      nameless_portrait: {
        key: 'nameless_portrait', name: '名もなき肖像画', icon: '🖼️', type: 'relic', rarity: 'Epic',
        desc: '深淵の記憶が宿る絵画。探索中1度だけ致命傷を耐える加護'
      },

      // Boss 1st-Kill Unique Signature Artifacts
      giant_ram: {
        key: 'giant_ram', name: '巨人の粉砕槌', icon: '🔨', type: 'weapon', rarity: 'Legendary',
        archetype: 'greatsword', setTag: 'titan', baseAtk: 28,
        bossUnique: true, desc: '【大剣・10Fボス秘宝】強撃で敵防御60%貫通 ＆ 渾身打撃で敵スタン'
      },
      guardian_aegis: {
        key: 'guardian_aegis', name: '古代守護者の神盾', icon: '🛡️', type: 'armor', rarity: 'Legendary',
        archetype: 'shield', setTag: 'titan', baseDef: 35, hp: 100,
        bossUnique: true, desc: '【20Fボス秘宝】通常ガード軽減+15%。JUST GUARD時のみ反撃威力×1.5（疲労は無効化しない）'
      },
      mutagen_core: {
        key: 'mutagen_core', name: '変異原核EX', icon: '🧬', type: 'accessory', rarity: 'Legendary',
        isCurse: true, baseAtk: 20, baseDef: 10, hp: 60,
        bossUnique: true, desc: '【30Fボス秘宝】深淵の変異因子。HP50%以下で変異暴走し攻撃力2.5倍！'
      },
      mother_tree_heart: { key:'mother_tree_heart',name:'母樹の心核',icon:'🌱',type:'accessory',rarity:'Legendary',bossUnique:true,hp:55,baseDef:8,turnRegen:2,desc:'【40Fボス秘宝】戦闘中、行動ごとにHP2回復' },
      nereus_crown: { key:'nereus_crown',name:'水底王の冠',icon:'🌊',type:'accessory',rarity:'Legendary',bossUnique:true,hp:45,crit:10,lowHpGuard:true,desc:'【50Fボス秘宝】HP35%以下で通常ガード軽減+10%' },
      living_core_relic: { key:'living_core_relic',name:'胎動核の遺物',icon:'🫀',type:'accessory',rarity:'Legendary',bossUnique:true,baseAtk:12,hp:40,pulsePower:true,desc:'【60Fボス秘宝】異なる行動を続けると攻撃力が探索中上昇' },

      // Build Synergies (Thunder static, Blood covenant)
      thunder_ring: {
        key: 'thunder_ring', name: '雷鳴の環', icon: '💍', type: 'accessory', rarity: 'Rare',
        archetype: 'thunder', baseAtk: 5,
        desc: '【雷帯】攻撃ごとに雷チャージ蓄積。3回で【天雷招来】(+30雷撃＆スタン)'
      },
      thunder_mail: {
        key: 'thunder_mail', name: '雷光の鎖帷子', icon: '🥋', type: 'armor', rarity: 'Epic',
        archetype: 'thunder', baseDef: 16, hp: 55,
        desc: '【雷帯】被弾時にも雷チャージ蓄積。防御力+16 / 最大HP+55'
      },
      blood_scythe: {
        key: 'blood_scythe', name: '血飢の死神鎌', icon: '🔪', type: 'weapon', rarity: 'Legendary',
        archetype: 'cursed_staff', setTag: 'blood', baseAtk: 32, vamp: 8,
        desc: '【血盟】HP減少で攻撃力急上昇！(HP50%以下で+40%、25%以下で+80%＆吸血強化)'
      },
      trophy_abyss1: {
        key: 'trophy_abyss1', name: '深淵第一層踏破の証', icon: '🏆', type: 'relic', rarity: 'Legendary',
        desc: '【30F完全制覇のトロフィー】地上拠点の全施設効率+10%の覇王の威光'
      },

      // Ultra-rare build-changing artifacts (never craftable/upgradable by rarity)
      mythic_thunder_blade: {
        key:'mythic_thunder_blade', name:'神雷剣・天哭', icon:'⚡', type:'weapon', rarity:'Mythic', archetype:'thunder', baseAtk:38, crit:12,
        desc:'【神話級】攻撃で雷印を蓄積。3印で落雷し、武器スキルは印を即時起爆する'
      },
      mythic_blood_scythe: {
        key:'mythic_blood_scythe', name:'原初血王の鎌', icon:'🩸', type:'weapon', rarity:'Mythic', archetype:'cursed_staff', setTag:'blood', baseAtk:44, vamp:12,
        desc:'【神話級】HPを代償に超火力。HP25%以下で血脈解放が強化される'
      },
      mythic_sky_shield: {
        key:'mythic_sky_shield', name:'天城の絶対盾', icon:'🛡️', type:'armor', rarity:'Mythic', archetype:'shield', baseDef:32, hp:70,
        desc:'【神話級】JUST GUARD成功時のみ強力反撃。通常防御連打では力を発揮しない'
      },
      abyssal_devourer: {
        key:'abyssal_devourer', name:'深淵喰らい・終焉', icon:'🌌', type:'weapon', rarity:'Abyssal', archetype:'greatsword', baseAtk:52,
        desc:'【深淵級】敵撃破ごとに探索中の攻撃力+2。GREED中は成長量が増える（帰還でリセット）'
      },
      abyssal_observer: {
        key:'abyssal_observer', name:'深淵観測者の眼', icon:'👁️', type:'accessory', rarity:'Abyssal', crit:18, rareRate:15,
        desc:'【深淵級】扉選択に第4の隠された道を出現させ、危険と報酬を見抜く'
      },
      abyssal_void_cloak: {
        key:'abyssal_void_cloak', name:'虚無王の外套', icon:'🕳️', type:'armor', rarity:'Abyssal', baseDef:26, hp:90,
        desc:'【深淵級】探索中1回だけ致死ダメージを無効化。発動後は最大HPが半減する'
      }
    };

    // Areas & Tactical Enemies
