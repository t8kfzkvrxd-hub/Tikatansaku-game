    let state = {
      screen: 'town', // 'town' | 'door_select' | 'battle' | 'event'
      activeTab: 'equip', // 'equip' | 'bag' | 'codex' | 'log'

      // Town / Camp Level & Facilities
      camp: {
        blacksmith: 1,      // 鍛冶屋: Lv1=初期, Lv2=装備強化, Lv3=特性付与
        shop: 1,            // 商店: Lv1=通常, Lv2=傷薬持込, Lv3=出撃前アイテム選択
        lab: 1,             // 研究所: Lv1=図鑑, Lv2=ボス予報, Lv3=ボスHP-15%デバフ, Lv4=フロア予報
        tavern: 1,          // 酒場: Lv1=噂話, Lv2=討伐依頼解放, Lv3=救助冒険者NPC
        vaultLevel: 1,      // 倉庫レベル
        vaultSize: 20,      // 倉庫枠数 (Lv1=20, +10/Lv)
        labDebuffActive: true,
        questKills: 0,
        questTarget: 5,
        rescuedAdventurer: false
      },

      vaultGold: 0,
      abyssCores: 0, // ボス素材「深淵の核」
      deepCrystals: 0,
      storage: [],
      equipped: { weapon: null, armor: null, accessory: null },
      
      // Permanent Upgrades (神殿)
      talents: {
        hpLv: 0,           // 初期HP +15
        atkLv: 0,          // 初期攻撃力 +3
        defLv: 0,          // 初期防御力 +2
        luckLv: 0,         // 宝箱レア率 +6%
        keepItemLv: 0,     // 死亡時アイテム保護 (Lv1=1個, Lv2=2個)
        fateRerollLv: 0,   // 部屋再抽選 (1回/探索)
        discernEyeLv: 0,   // 宝箱鑑定眼 (2択から選択)
        merchantFriendLv: 0 // 商人枠+1 & 20%割引
      },

      // Pre-expedition preparation
      preparedItems: [],
      preparedBuffs: { chestRareBonus: 0, goldMult: 1.0 },
      expeditionPolicy: 'normal', // 'normal' | 'mining' | 'bounty' | 'excavate'
      bossFirstKills: {}, // { 10: true, 20: true, 30: true }
      maxUnlockedFloor: 30,
      selectedStartFloor: 1,
      deepestFloorReached: 0,
      runRecords: { mostKills:0, highestGreed:0, mostGold:0, bossesDefeated:0 },

      // Mystery progression
      mystery: {
        eggReturns: 0,
        eggHatched: false,
        crownAwakened: false,
        keyOwned: false,
        hasSecondChance: false
      },

      // Codex (図鑑登録記録)
      codex: {
        items: {},
        enemies: {},
        lore: {}
      },

      // Dungeon Current Run
      floor: 0,
      hp: 100,
      maxHp: 100,
      dungeonGold: 0,
      inventory: [],
      logs: [],
      greedLevel: 0, // 0: none, 1: x1.4, 2: x2.0, 3: x3.0
      rerollUsed: false,
      playerExposed: false,
      playerAttackBuff: 1.0,
      skillCooldown: 0,
      usedSecondChance: false,
      usedVoidCloak: false,
      starterPerk: null,
      thunderCharges: 0,
      abyssGrowth: 0,
      guardFatigue: 0,
      guardStamina: 100,
      guardBroken: false,
      playerPoisonTurns: 0,
      playerPoisonDmg: 0,
      statusEffects: { poison:0, bleed:0, paralysis:0, bind:0, weakened:0 },
      waterLevel: 0,
      bossAdds: 0,
      lastPlayerAction: null,
      
      // Dungeon Run Modifiers (リスク・リターン契約)
      modifiers: {
        goldMult: 1.0,
        enemyAtkMult: 1.0,
        chestRareBonus: 0,
        nextChestDebuff: 0,
        goldenStairTurns: 0 // 黄金の階段持続
      },

      // Battle / Event State
      currentDoors: [],
      currentEnemy: null,
      bossTurnCount: 0,
      bossBarrier: false,
      bossMutated: false,
      currentEvent: null,

      pendingEmergencySelection: [],

      runKills: 0,
      bounty: {
        targetKills: 5,
        currentKills: 0,
        rewardGold: 150,
        completed: false
      },
      rarityProgress: { mythicPity: 0, abyssalPity: 0, mythicTotalDrops: 0, abyssalTotalDrops: 0, upperDropHistory: [] },
      craftProgress: { materials: {}, recipes: {}, crafted: {} }
    };

    // Immutable baseline used by the save reset flow and development tests.
    const INITIAL_STATE = JSON.parse(JSON.stringify(state));

