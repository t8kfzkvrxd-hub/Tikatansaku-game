    function getCurrentArea() {
      return AREAS.find(area => state.floor >= area.min && state.floor <= area.max) || AREAS[AREAS.length - 1];
    }

    function generateDoorsForFloor() {
      state.floor=Math.min(MAX_DUNGEON_FLOOR,state.floor);
      const bossFloor = isBossFloor(state.floor);
      const isSafePortalFloor = isSafeReturnFloor(state.floor);
      state.deepestFloorReached = Math.max(state.deepestFloorReached || 0, state.floor);
      state.runRecords.highestGreed = Math.max(state.runRecords.highestGreed || 0, state.greedLevel || 0);
      saveState();

      // Turn effects check (Curse damage)
      const stats = getPlayerStats();
      if (stats.perFloorDrain > 0) {
        state.hp -= stats.perFloorDrain;
        addLog(`呪いの装備が体力を蝕む... HP -${stats.perFloorDrain}`, 'danger');
        if (state.hp <= 0) {
          state.hp = 0;
          returnToTown(false);
          return;
        }
      }

      if (state.modifiers.goldenStairTurns > 0) {
        state.modifiers.goldenStairTurns--;
      }

      // Check Boss Encounter
      if (bossFloor) {
        state.screen = 'battle';
        startBossBattle(getCurrentArea().boss);
        return;
      }

      // If safe portal floor (5, 15, 25)
      if (isSafePortalFloor) {
        state.screen = 'safe_point';
        playSound('safe_point');
        addLog(`【安全帰還門 到達】地下${state.floor}階で安全転移門を発見！`, 'gold');
        updateHeader();
        render();
        return;
      }

      // Normal floors: Generate 2 to 3 distinct room options
      const doorPool = [
        {
          type: 'battle_normal',
          icon: '⚔️',
          sign: '敵の気配',
          desc: '通常の魔物が徘徊している。討伐でゴールドと装備獲得。',
          risk: 'mid', riskText: '中危険'
        },
        {
          type: 'chest_normal',
          icon: '🎁',
          sign: '金色の光',
          desc: '施錠されていない宝箱の気配。レア装備やゴールドの期待。',
          risk: 'low', riskText: '低危険'
        },
        {
          type: 'cursed_chest',
          icon: '👁️',
          sign: '呪われた黒櫃',
          desc: '【呪い宝箱】Epic以上の強力装備確定。代わりに最大HP減少。',
          risk: 'curse', riskText: 'ハイリスク'
        },
        {
          type: 'heal_spring',
          icon: '💧',
          sign: '聖なる滴りの音',
          desc: '澄んだ泉。HPを大幅に回復するか、神秘の力を得る。',
          risk: 'safe', riskText: '安全回復'
        },
        {
          type: 'merchant',
          icon: '🛒',
          sign: '怪しい商人',
          desc: '探索中に拾ったゴールドで回復薬や限定装備を売買できる。',
          risk: 'low', riskText: '取引'
        },
        {
          type: 'golden_stairs',
          icon: '✨',
          sign: '黄金の階段',
          desc: '【欲深き契約】次の敵が大幅強化される代わりに獲得ゴールド3倍。',
          risk: 'high', riskText: '超リターン'
        },
        {
          type: 'elite_battle',
          icon: '💀',
          sign: '重い唸り声 (エリート)',
          desc: '凶悪な強敵が潜む。勝てばレアアイテム確定＆大量ゴールド。',
          risk: 'high', riskText: '超危険'
        },
        {
          type: 'mystery_wanderer',
          icon: '🧙‍♂️',
          sign: '謎の遭遇',
          desc: '傷ついた冒険者や不気味な黒卵など、予期せぬ出来事。',
          risk: 'mid', riskText: '謎'
        }
      ];
      if (state.floor >= 31) {
        const deepSigns = {
          4:['🍄 喋る菌糸','菌糸ネットワークが取引か警告を持ちかける。'],
          5:['🫧 空気の残る部屋','沈没都市に残された空気室と宝物庫。'],
          6:['🫀 脈打つ祭壇','肉壁があなた自身の声で選択を迫る。']
        };
        const deep = deepSigns[getCurrentArea().id] || ['📖 記憶の残響',getCurrentArea().rule];
        doorPool.push({type:'deep_area_event',icon:deep[0].slice(0,2),sign:deep[0],desc:deep[1],risk:'mid',riskText:'深層固有'});
      }

      // Research forecasts and GREED alter actual room composition.
      if (state.camp.lab >= 4) {
        doorPool.forEach(room => {
          room.desc += ` 【研究予測: ${room.riskText}】`;
        });
      }
      if (state.greedLevel >= 2 || (state.modifiers.eliteRateBonus || 0) > 0) {
        doorPool.push({ ...doorPool.find(d => d.type === 'elite_battle') });
      }
      if ((state.modifiers.eventRateBonus || 0) > 0) {
        doorPool.push({ ...doorPool.find(d => d.type === 'mystery_wanderer') });
      }
      if (state.greedLevel >= 3) {
        const healIndex = doorPool.findIndex(d => d.type === 'heal_spring');
        if (healIndex >= 0) doorPool.splice(healIndex, 1);
        doorPool.push({ ...doorPool.find(d => d.type === 'cursed_chest') });
      }

      const ownsAncientKey = state.mystery.keyOwned || state.inventory.some(i => i.key === 'ancient_key');
      if (ownsAncientKey && state.floor >= 11 && state.floor <= 20) {
        doorPool.push({
          type: 'sealed_vault', icon: '🔐', sign: '古代の封印宝物庫',
          desc: '錆びた古代鍵が反応している。鍵を使えば秘宝を回収できる。',
          risk: 'safe', riskText: '鍵で解放'
        });
      }

      // Emergency Portal Generation
      // Emerges at low chance, but jumps to 22% when HP < 25% or carrying Epic/Legendary item
      const isHpCritical = (state.hp / stats.maxHp) <= 0.25;
      const hasEpicOrLeg = state.inventory.some(i => ['Epic', 'Legendary'].includes(i.rarity));
      const emergencyChance = (isHpCritical || hasEpicOrLeg) ? 0.22 : 0.04;

      if (Math.random() < emergencyChance && state.floor > 2) {
        doorPool.push({
          type: 'emergency_portal',
          icon: '🌀',
          sign: '不安定な緊急ポータル',
          desc: '【即時生還】今すぐ生還可能だが、戦利品の半分を失う。(HP危機または高レア保持時に感知出現)',
          risk: 'safe', riskText: '半分ロスト脱出'
        });
      }

      // Pick 3 random distinct doors
      const shuffled = doorPool.sort(() => 0.5 - Math.random());
      const hasObserver = equippedAccessories().some(i=>i.key === 'abyssal_observer');
      state.currentDoors = shuffled.slice(0, hasObserver ? 4 : 3);
      if(state.chapter?.contract&&!state.chapter.read[10]&&state.chapter.mode!=='skip'&&TUTORIAL_STEPS[state.floor]){
        const training=doorPool.find(d=>d.type===TUTORIAL_STEPS[state.floor][2]);
        if(training)state.currentDoors=[{...training,sign:'🌻 '+training.sign}];
      }
      if (hasObserver && state.currentDoors[3]) {
        state.currentDoors[3].sign = `👁️ 隠された道：${state.currentDoors[3].sign}`;
        state.currentDoors[3].desc += ' 【観測済み：表示どおりの危険度と報酬】';
      }

      state.screen = 'door_select';
      updateHeader();
      render();
    }

    function selectDoor(index) {
      if(state.screen!=='door_select'||!state.currentDoors[index]||state.currentDoors.selected||!lockTransition())return;
      state.currentDoors.selected=true;
      document.querySelectorAll('#viewport button,#viewport .door-card').forEach(b=>{b.disabled=true;b.setAttribute('aria-disabled','true');b.style.pointerEvents='none';});
      initAudio();
      playSound('click');
      const door = state.currentDoors[index];
      if (!door) return;

      // Advance lore check (低確率で地下の謎を拾う)
      if (Math.random() < 0.22) {
        discoverLore();
      }

      if (door.type === 'portal_safe') {
        returnToTown(true);
      } else if (door.type === 'emergency_portal') {
        emergencyEscape();
      } else if (door.type === 'door_deeper') {
        addLog('帰還門を背にして、更なる闇へと踏み込んだ！', 'danger');
        state.modifiers.chestRareBonus = (state.modifiers.chestRareBonus || 0) + 15;
        state.floor++;
        generateDoorsForFloor();
      } else if (door.type === 'battle_normal') {
        startNormalBattle(false);
      } else if (door.type === 'elite_battle') {
        startNormalBattle(true);
      } else if (door.type === 'chest_normal') {
        openChestEvent(false);
      } else if (door.type === 'cursed_chest') {
        openChestEvent(true);

      } else if (door.type === 'heal_spring') {
        startHealSpringEvent();
      } else if (door.type === 'merchant') {
        startMerchantEvent();
      } else if (door.type === 'golden_stairs') {
        startGoldenStairsEvent();
      } else if (door.type === 'mystery_wanderer') {
        startMysteryEvent();
      } else if (door.type === 'sealed_vault') {
        openSealedVault();
      } else if (door.type === 'deep_area_event') {
        startDeepAreaEvent();
      }
    }

    function discoverLore() {
      const unread = LORE_RECORDS.filter(l => !state.codex.lore[l.id]);
      if (unread.length > 0) {
        const picked = unread[Math.floor(Math.random() * unread.length)];
        recordCodex('lore', picked);
        addLog(`📜 古代の記録【${picked.title}】を発見した！（図鑑に登録）`, 'gold');
      }
    }

    /* ==========================================================================
       BATTLE ENGINE & INTENT SYSTEM (戦闘行動予測・深化した戦術)
       ========================================================================== */
