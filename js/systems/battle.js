    function startNormalBattle(isElite = false) {
      const area = getCurrentArea();
      let enemyTemplate = isElite ? area.elite : area.enemies[Math.floor(Math.random() * area.enemies.length)];
      
      const scaled=scaledEnemyStats(enemyTemplate,area,state.floor,isElite?'elite':'normal',{enemyAtkMult:state.modifiers.enemyAtkMult,greed:state.greedLevel});
      state.currentEnemy = {
        name: enemyTemplate.name,
        icon: enemyTemplate.icon,
        maxHp: scaled.hp,
        hp: scaled.hp,
        atk: scaled.atk,
        def: scaled.def,
        isBoss: false,
        isElite: isElite,
        trait: enemyTemplate.trait,
        materialSource: enemyTemplate.materialSource,
        traitName: enemyTemplate.traitName,
        hint: enemyTemplate.hint,
        turnCount: 0
        ,obscured: area.id===9&&Math.random()<.3
      };

      recordCodex('enemy', state.currentEnemy);
      state.screen = 'battle';
      applyEnemyPulse(state.currentEnemy);
      if(state.chapter?.contract&&!state.chapter.read[10]&&state.floor===7&&state.chapter.mode!=='skip'){state.statusEffects.poison=2;addLog('🌻 エルナ：毒を受けたらバッグの万能解毒薬を使おう。','info');}
      state.playerExposed = false;
      state.playerAttackBuff = 1.0;
      state.guardFatigue = 0; state.guardStamina = 100; state.guardBroken = false;
      decideEnemyIntent();
      addLog(`${state.currentEnemy.name} が立ちはだかった！`, isElite ? 'danger' : 'normal');
      updateHeader();
      render();
    }

    function startBossBattle(bossTemplate) {
      playSound('hit');
      const scaled=scaledEnemyStats(bossTemplate,getCurrentArea(),state.floor,'boss',{enemyAtkMult:state.modifiers.enemyAtkMult,greed:state.greedLevel,labLevel:state.camp.lab});
      state.currentEnemy = {
        name: bossTemplate.name,
        icon: bossTemplate.icon,
        maxHp: scaled.hp,
        hp: scaled.hp,
        atk: scaled.atk,
        def: scaled.def,
        isBoss: true,
        gimmick: bossTemplate.gimmick
        ,materialSource: bossTemplate.materialSource
      };
      state.bossTurnCount = 0;
      state.bossBarrier = ['shield_barrier','mother_tree'].includes(bossTemplate.gimmick);
      state.bossMutated = false;
      state.bossAdds = bossTemplate.gimmick === 'mother_tree' ? 2 : 0;
      state.waterLevel = 0;
      applyEnemyPulse(state.currentEnemy);
      state.playerExposed = false;
      state.playerAttackBuff = 1.0;
      state.guardFatigue = 0; state.guardStamina = 100; state.guardBroken = false;

      recordCodex('enemy', state.currentEnemy);
      state.screen = 'battle';
      decideEnemyIntent();
      addLog(`階層の守護ボス【${state.currentEnemy.name}】が降臨した！`, 'danger');
      updateHeader();
      render();
    }

    function decideEnemyIntent() {
      if (!state.currentEnemy) return;
      const e = state.currentEnemy;
      const stats = getPlayerStats();

      if (e.isBoss) {
        state.bossTurnCount++;
        if (e.gimmick === 'heavy_charge') {
          // 10F 坑道の巨人: 3ターンごとに「地響き大粉砕」
          if (state.bossTurnCount % 3 === 0) {
            e.actionType = 'critical_smash';
            e.pendingAction = '⚠️【地響き大粉砕】溜め強撃！(防御推奨)';
            e.nextMult = 2.4;
          } else {
            e.actionType = 'normal';
            e.pendingAction = '通常打撃の構え';
            e.nextMult = 1.0;
          }
        } else if (e.gimmick === 'shield_barrier') {
          // 20F 古代の守護者: バリア中は防御超UP
          if (state.bossBarrier) {
            e.actionType = 'buff';
            e.pendingAction = '🛡️【古代障壁】防御力3倍＆魔力充填中！';
            e.nextMult = 0.9;
          } else {
            e.actionType = 'normal';
            e.pendingAction = '⚡【雷撃の矢】激しい攻撃！';
            e.nextMult = 1.4;
          }
        } else if (e.gimmick === 'mutate_form') {
          // 30F 失敗作EX-03: HP50%以下で変異
          if (!state.bossMutated && e.hp <= (e.maxHp * 0.5)) {
            state.bossMutated = true;
            e.name = '【暴走被験体EX-03: 完全体】';
            e.atk = Math.round(e.atk * 1.4);
            e.icon = '🐉';
            addLog('EX-03の細胞が激しく変異！完全体へと形態変化した！', 'danger');
          }
          e.actionType = state.bossMutated ? 'critical_smash' : 'normal';
          e.pendingAction = state.bossMutated ? '☣️【変異暴走連撃】苛烈な連続打撃！' : '触手なぎ払い';
          e.nextMult = state.bossMutated ? 1.6 : 1.1;
        } else if (e.gimmick === 'mother_tree') {
          e.actionType = state.bossTurnCount % 3 === 0 ? 'heal_roots' : 'heavy';
          e.pendingAction = state.bossAdds > 0 ? `🌿 根${state.bossAdds}体が本体を防護中` : (e.actionType === 'heal_roots' ? '🌱 根の再生を開始' : '⚠️ 巨根なぎ払い');
          e.nextMult = e.actionType === 'heavy' ? 1.45 : .8;
        } else if (e.gimmick === 'rising_water') {
          e.actionType = state.waterLevel >= 70 ? 'critical_smash' : 'normal';
          e.pendingAction = `🌊 水位 ${state.waterLevel}% ${state.waterLevel >= 70 ? '溺圧大波！排水推奨' : '上昇中'}`;
          e.nextMult = 1 + state.waterLevel / 100;
        } else if (e.gimmick === 'three_phase_core') {
          const ratio=e.hp/e.maxHp; e.phase=ratio>.66?1:(ratio>.33?2:3);
          e.actionType=e.phase===1?'normal':(e.phase===2?'heavy':'critical_smash');
          e.pendingAction=`❤️ Phase ${e.phase}：${e.phase===1?'外殻収縮':e.phase===2?'脈動連撃':'暴走・全器官攻撃'}`;
          e.nextMult=[0,1.0,1.45,1.85][e.phase];
        }
      } else {
        const r = Math.random();
        if (e.trait === 'counter_heavy' && r < 0.55) {
          e.actionType = 'counter_stance';
          e.pendingAction = `⚔️ ${e.traitName} (強攻撃厳禁)`;
          e.nextMult = 0.8;
        } else if (e.trait === 'grab_attack' && r < 0.55) {
          e.actionType = 'grab_prep';
          e.pendingAction = `⚠️ ${e.traitName}の溜め (攻撃・スキルで中断)`;
          e.nextMult = 1.6;
        } else if (e.trait === 'speed' && r < 0.55) {
          e.actionType = 'heavy';
          e.pendingAction = '⚡ 俊敏な連撃 (防御推奨)';
          e.nextMult = 1.35;
        } else if (e.trait === 'exposed_weakpoint' && (e.turnCount || 0) % 3 === 2) {
          e.actionType = 'falter';
          e.pendingAction = '🎯 冷却弱点が露出 (強攻撃の好機)';
          e.nextMult = 0.5;
        } else if (r < 0.35) {
          e.actionType = 'normal';
          e.pendingAction = '通常攻撃の構え';
          e.nextMult = 1.0;
        } else if (r < 0.60) {
          e.actionType = 'heavy';
          e.pendingAction = '⚠️ 渾身の強撃 (防御推奨)';
          e.nextMult = 1.55;
        } else if (r < 0.75) {
          e.actionType = 'counter_stance';
          e.pendingAction = '⚔️ 迎撃の構え (強撃で手痛い反撃！ 通常攻撃か防御が安全)';
          e.nextMult = 0.8;
        } else if (r < 0.88) {
          e.actionType = 'grab_prep';
          e.pendingAction = '⚠️ 拘束突進の溜め (防御無効！ 攻撃やスキルで中断可能)';
          e.nextMult = 1.6;
        } else {
          e.actionType = 'falter';
          e.pendingAction = '💫 体勢を大きく崩している (強撃の絶好の好機！)';
          e.nextMult = 0.5;
        }
      }

      // Calculate Expected Damages for player HUD
      deepEnemyIntent(e);
      if(e.isElite&&(e.turnCount||0)%3===2){e.actionType='heavy';e.nextMult=1.35;e.pendingAction='⚠️ 精鋭の強撃：防御で備えよう';}
      let rawEnemyAtk = e.atk * e.nextMult;
      if (state.playerExposed) rawEnemyAtk *= 1.35; // Player exposed penalty
      e.expectedDmg = Math.max(1, Math.round(rawEnemyAtk - stats.def));
      const defendDef = stats.def * 3.5 + 8;
      e.expectedDefendDmg = Math.max(1, Math.round(rawEnemyAtk - defendDef));
    }

    function getEquippedSkillInfo() {
      const w = state.equipped.weapon;
      const archetype = w?.archetype || 'sword';

      const skills = {
        dagger: { name: '影縫い連撃', cost: 'CD: 2T', desc: '急所を突く3連撃(計2.0倍撃) & 敵防御-4' },
        greatsword: { name: '天輪巨絶断', cost: 'CD: 2T', desc: '防御50%無視の超破壊打撃(2.5倍撃)' },
        cursed_staff: { name: '深淵血脈解放', cost: 'HP10消費', desc: 'HPを代償に3.2倍の暗黒魔術撃' },
        thunder: { name: '天雷招来', cost: 'CD: 2T', desc: '打撃 + 22の固定雷撃放電' },
        blood: { name: '鮮血の飢渇', cost: 'CD: 2T', desc: '1.5倍撃 & 与ダメージの60%をHP吸収' },
        sword: { name: '集中気勢斬り', cost: 'CD: 2T', desc: '1.4倍撃 & 次ターン確定会心' }
      };

      return skills[archetype] || skills.sword;
    }

    function addThunderCharge(enemy, source) {
      const hasThunderGear = Object.values(state.equipped).some(i => i?.archetype === 'thunder');
      if (!hasThunderGear || !enemy) return;
      state.thunderCharges = (state.thunderCharges || 0) + 1;
      addLog(`⚡ ${source}で雷チャージ ${state.thunderCharges}/3`, 'gold');
      if (state.thunderCharges >= 3) {
        state.thunderCharges = 0;
        enemy.hp -= 30;
        enemy.stunned = true;
        spawnFloatingFx('⚡ 天雷招来 -30 & スタン！', 'crit');
        addLog(`⚡ 雷チャージが弾け、${enemy.name}に30固定ダメージ＆スタン！`, 'gold');
      }
    }

    function playerCombatAction(action) {
      if (!state.currentEnemy || state.hp <= 0 || state.screen!=='battle'||state.currentEnemy.acting||state.currentEnemy.rewardClaimed) return;
      if(action==='skill'&&(state.skillCooldown>0||state.statusEffects.paralysis>0))return;
      const actingEnemy=state.currentEnemy;actingEnemy.acting=true;actingEnemy.actionQueued=false;
      const initialHp=actingEnemy.hp;
      syncActionButtons();
      try {
      initAudio();

      const stats = getPlayerStats();
      const enemy = state.currentEnemy;
      const weapon = state.equipped.weapon;
      const enemyHpBeforeAction=enemy.hp;
      const archetype = weapon?.archetype || 'sword';
      equipmentAttackStats(stats,enemy,action);
      recordDepthAction(enemy,action,stats);
      if (weapon?.craftEffect === 'elite_hunter' && enemy.isElite) stats.atk = Math.round(stats.atk * 2.5);
      if (weapon?.craftEffect === 'desperate' && state.hp <= stats.maxHp * 0.35) stats.atk = Math.round(stats.atk * 2);
      if (action === 'skill' && state.statusEffects.paralysis > 0) {
        state.statusEffects.paralysis--;
        addLog('⚡ 麻痺により武器スキルを使用できない！','danger'); render(); return;
      }
      const statusDamage = processPlayerStatuses();
      if (statusDamage && state.hp <= 0) { returnToTown(false); return; }
      if (enemy.trait === 'action_memory' && state.lastPlayerAction === action) {
        const memoryDmg=Math.max(8,Math.round(enemy.atk*.45)); state.hp-=memoryDmg;
        addLog(`🧠 同じ行動「${action}」を読まれ、${memoryDmg}の記憶反撃！`,'danger');
        if(state.hp<=0){returnToTown(false);return;}
      }
      if (equippedAccessories().some(i=>i.key === 'living_core_relic') && state.lastPlayerAction && state.lastPlayerAction !== action) {
        state.abyssGrowth=(state.abyssGrowth||0)+1;
        addLog('🫀 異なる行動の連鎖で攻撃力+1','gold');
      }
      state.lastPlayerAction=action;

      // The hatchling's regeneration is a real once-per-player-turn effect.
      const hasDragon = state.mystery.eggHatched || state.storage.some(i => i.key === 'dragon_hatchling') || state.inventory.some(i => i.key === 'dragon_hatchling');
      if (hasDragon && state.hp < stats.maxHp) {
        const regen = Math.min(3, stats.maxHp - state.hp);
        state.hp += regen;
        combatApplied('player','player',regen,'再生');
        addLog(`🐉 深淵の幼竜の加護でHPが${regen}回復した。`, 'heal');
        spawnFloatingFx(`🐉 +${regen}HP`, 'heal');
      }
      const heartRegen = equippedAccessories().reduce((sum,i)=>sum+(i.turnRegen||0),0);
      if (heartRegen > 0 && state.hp < stats.maxHp) {
        const regen = Math.min(heartRegen, stats.maxHp - state.hp);
        state.hp += regen;
        combatApplied('player','player',regen,'再生');
        addLog(`🌱 母樹の心核がHPを${regen}回復した。`, 'heal');
        spawnFloatingFx(`🌱 +${regen}HP`, 'heal');
      }

      if (action === 'attack' || action === 'heavy' || action === 'skill') {
        state.guardFatigue = 0;
        state.guardStamina = Math.min(100, (state.guardStamina || 0) + 20);
        state.guardBroken = false;
      }

      // Cooldown tick
      if (state.skillCooldown > 0 && action !== 'skill') {
        state.skillCooldown--;
      }

      // Interruption check: Grab prep interrupted by direct attack or skill
      let interruptedGrab = false;
      if (enemy.actionType === 'grab_prep' && (action === 'attack' || action === 'skill')) {
        interruptedGrab = true;
        enemy.actionType = 'falter';
        enemy.pendingAction = '💫 突進を阻止され怯んでいる！';
        enemy.nextMult = 0.5;
        playSound('crit');
        spawnFloatingFx('⚡ 突進中断成功！', 'crit');
        addLog(`痛烈な一撃で ${enemy.name} の拘束突進を打ち砕き、体勢を崩させた！`, 'gold');
      }

      // 1. NORMAL ATTACK
      if (action === 'attack') {
        let isCrit = Math.random() * 100 < stats.crit;
        if (state.guaranteedCrit) { isCrit = true; state.guaranteedCrit = false; }

        let baseDmg = stats.atk * (isCrit ? 1.8 + Math.min(150,equipmentEffects().critDamage||0)/100 : 1.0) * (state.playerAttackBuff || 1.0);
        let targetDef = (enemy.gimmick==='shield_barrier' && state.bossBarrier) ? enemy.def * 3 : enemy.def;
        let dmg = Math.max(1, Math.round(baseDmg - targetDef + (Math.random() * 4 - 2)));

        state.playerAttackBuff = 1.0; // Consumed

        // Dagger Dual Strike archetype check
        if (archetype === 'dagger' || weapon?.name?.includes('短剣') || weapon?.name?.includes('ダガー')) {
          const dmg1 = Math.max(1, Math.round(dmg * 0.65));
          const dmg2 = Math.max(1, Math.round(dmg * 0.65));
          enemy.hp -= (dmg1 + dmg2);
          combatApplied('player','enemy',-dmg1,isCrit?'CRITICAL 1 HIT':'1 HIT');
          combatApplied('player','enemy',-dmg2,isCrit?'CRITICAL 2 HIT':'2 HIT');
          playSound('hit');
          spawnFloatingFx(`🗡️ 2連撃 -${dmg1} -${dmg2}`, isCrit ? 'crit' : 'damage');
          addLog(`ダガーの二刀連撃！ ${enemy.name} に ${dmg1} ＋ ${dmg2} の連続ダメージ！`, 'normal');
        } else {
          enemy.hp -= dmg;
          if (isCrit) {
            playSound('crit');
            spawnFloatingFx(`💥 会心 -${dmg}`, 'crit');
            addLog(`急所を撃ち抜く会心の一撃！ ${enemy.name} に ${dmg} の痛撃！`, 'gold');
          } else {
            playSound('hit');
            spawnFloatingFx(`-${dmg}`, 'damage');
            addLog(`${enemy.name} に ${dmg} のダメージ！`, 'normal');
          }
        }

        // Thunder Bonus
        if (archetype === 'thunder') {
          const shock = 14;
          enemy.hp -= shock;
          playSound('crit');
          spawnFloatingFx(`⚡ 雷撃 -${shock}`, 'crit');
          addLog(`雷光が放電！ ${enemy.name} に ${shock} の追加雷撃！`, 'gold');
        }
        addThunderCharge(enemy, '攻撃');

        // Baby Dragon companion follow-up strike
        const hasDragon = state.mystery.eggHatched || state.storage.some(i => i.key === 'dragon_hatchling') || state.inventory.some(i => i.key === 'dragon_hatchling');
        if (hasDragon) {
          const flame = 8;
          enemy.hp -= flame;
          spawnFloatingFx(`🔥 幼竜の息吹 -${flame}`, 'crit');
          addLog(`幼竜が火炎を吐き、${enemy.name} に ${flame} の追撃！`, 'gold');
        }

        equipmentHit(enemy,action,isCrit);
        applyRootProtection(enemy,enemyHpBeforeAction);
        // Vampirism
        healFromWeaponDamage(state,stats,enemy,Math.max(0,enemyHpBeforeAction-Math.max(0,enemy.hp)),state.equipped,isCrit);

        if (enemy.hp <= 0) {
          enemy.hp = 0;
          onEnemyKilled();
          return;
        }

        queueEnemyTurn(false,250);
      } 
      // 2. STRONG ATTACK (強攻撃: 高威力 / 次ターン被ダメ+35%の隙 / 敵迎撃構え時はカウンター被弾)
      else if (action === 'heavy') {
        // Enemy Counter Stance check
        if (enemy.actionType === 'counter_stance') {
          playSound('player_hurt');
          const counterDmg = Math.max(6, Math.round(enemy.atk * 1.5 - stats.def));
          state.hp -= counterDmg;
          spawnFloatingFx(`💥 迎撃カウンター被弾 -${counterDmg}！`, 'damage');
          addLog(`⚠️ 敵の迎撃構えに大振りを合わせられた！ ${enemy.name} の痛烈なカウンターを受け ${counterDmg} のダメージ！`, 'danger');
          if (state.hp <= 0) {
            state.hp = 0;
            updateHeader();
            setTimeout(() => returnToTown(false), 500);
            return;
          }
          decideEnemyIntent();
          updateHeader();
          render();
          return;
        }

        playSound('heavy_attack');
        let mult = (archetype === 'greatsword') ? 2.5 : 1.9;
        if (enemy.actionType === 'falter') mult *= 1.4; // Falter bonus: +40% more damage!
        let baseDmg = stats.atk * mult * (state.playerAttackBuff || 1.0);
        let targetDef = (enemy.gimmick==='shield_barrier' && state.bossBarrier) ? enemy.def * 3 : enemy.def;
        let dmg = Math.max(1, Math.round(baseDmg - targetDef + (Math.random() * 6 - 3)));
        if (weapon?.affix === 'boss_slayer' && enemy.isBoss) dmg = Math.round(dmg * 1.25);
        if (weapon?.affix === 'elite_slayer' && enemy.isElite) dmg = Math.round(dmg * 1.30);

        state.playerAttackBuff = 1.0;
        state.playerExposed = true; // Demerit: +35% damage next enemy turn!

        enemy.hp -= dmg;
        addThunderCharge(enemy, '強攻撃');
        equipmentHit(enemy,action);
        if (hasDragon) {
          enemy.hp -= 8;
          spawnFloatingFx('🔥 幼竜の息吹 -8', 'crit');
          addLog(`幼竜の火炎追撃！ ${enemy.name}に8ダメージ。`, 'gold');
        }
        spawnFloatingFx(`💥 強撃 -${dmg}！ ${enemy.actionType === 'falter' ? '(隙特効!)' : '(隙あり被ダメ+35%)'}`, 'crit');
        addLog(`渾身の力で武器を叩きつけた！ ${enemy.name} に ${dmg} の強打！`, 'gold');
        applyRootProtection(enemy,enemyHpBeforeAction);

        if (enemy.hp <= 0) {
          enemy.hp = 0;
          onEnemyKilled();
          return;
        }

        queueEnemyTurn(false,250);
      }
      // 3. DEFEND (身を守る: ダメージ激減 & 次ターン攻撃力+35% & 盾反撃)
      else if (action === 'defend') {
        playSound('click');
        state.guardFatigue = (state.guardFatigue || 0) + 1;
        const intentCanJustGuard = ['heavy', 'critical_smash'].includes(enemy.actionType);
        const staminaCost = intentCanJustGuard ? 10 : 30;
        state.guardStamina = Math.max(0, (state.guardStamina || 0) - staminaCost);
        if (state.guardStamina <= 0 || state.guardFatigue >= 4) {
          state.guardBroken = true;
          spawnFloatingFx('⚠️ GUARD BREAK！', 'damage');
          addLog('⚠️ ガード疲労が限界に達し、構えを崩された！', 'danger');
        } else if (state.guardFatigue >= 2) {
          spawnFloatingFx(`⚠️ ガード疲労 ${state.guardFatigue}`, 'info');
          addLog(`⚠️ 連続防御でガード効率が低下している（${state.guardFatigue}連続）`, 'danger');
        }
        state.playerAttackBuff = 1.35; // Next attack buffed
        spawnFloatingFx(intentCanJustGuard && !state.guardBroken ? '✨ JUST GUARD！' : '🛡️ ガード', 'info');
        addLog(intentCanJustGuard && !state.guardBroken ? '✨ 敵の大技を読み切り、JUST GUARDを狙う！' : '盾を構えた。連続使用するとガード疲労が蓄積する。', 'normal');
        queueEnemyTurn(true,250);
      }
      // 4. WEAPON SKILL (装備固有スキル)
      else if (action === 'skill') {
        if (state.skillCooldown > 0) {
          addLog(`スキルはクールダウン中です（あと${state.skillCooldown}ターン）`, 'danger');
          render();
          return;
        }

        playSound('weapon_skill');
        let skillDmg = 0;

        if (archetype === 'dagger') {
          // 影縫い連撃
          skillDmg = Math.max(1, Math.round(stats.atk * 2.0 - enemy.def));
          enemy.def = Math.max(0, enemy.def - 4);
          enemy.hp -= skillDmg;
          spawnFloatingFx(`🗡️ 影縫い連撃 -${skillDmg} (敵DEF-4)`, 'crit');
          addLog(`【影縫い連撃】急所を刺突して ${skillDmg} ダメージ！ 敵の防御力を4削り取った！`, 'gold');
        } else if (archetype === 'greatsword') {
          // 天輪巨絶断
          skillDmg = Math.max(1, Math.round(stats.atk * 2.5 - (enemy.def * 0.5)));
          enemy.hp -= skillDmg;
          spawnFloatingFx(`⚔️ 天輪巨絶断 -${skillDmg} (防50%無視)`, 'crit');
          addLog(`【天輪巨絶断】装甲ごと叩き割る一撃！ ${skillDmg} の大ダメージ！`, 'gold');
        } else if (archetype === 'cursed_staff') {
          // 深淵血脈解放
          if (state.hp <= 10) {
            addLog('体力が足りず血脈解放を行えない！', 'danger');
            return;
          }
          state.hp -= 10;
          const bloodAwakened = weapon?.key === 'mythic_blood_scythe' && state.hp <= stats.maxHp * 0.25;
          skillDmg = Math.max(1, Math.round(stats.atk * (bloodAwakened ? 4.2 : 3.2)));
          enemy.hp -= skillDmg;
          spawnFloatingFx(`🩸 深淵血脈解放 -${skillDmg} (HP-10)`, 'crit');
          addLog(`【深淵血脈解放】HP10を捧げて深淵の黒炎を召喚！ ${skillDmg} の致命打！`, 'gold');
        } else if (archetype === 'thunder') {
          // 天雷招来
          skillDmg = Math.max(1, Math.round(stats.atk * 1.5 - enemy.def)) + 22;
          if (weapon?.key === 'mythic_thunder_blade' && state.thunderCharges > 0) {
            skillDmg += state.thunderCharges * 15;
            addLog(`⚡ 神雷剣が雷印${state.thunderCharges}個を一斉起爆！`, 'gold');
            state.thunderCharges = 0;
          }
          enemy.hp -= skillDmg;
          spawnFloatingFx(`⚡ 天雷招来 -${skillDmg}`, 'crit');
          addLog(`【天雷招来】稲妻が直撃！ ${skillDmg} の雷電ダメージ！`, 'gold');
        } else if (archetype === 'blood') {
          // 鮮血の飢渇
          skillDmg = Math.max(1, Math.round(stats.atk * 1.5 - enemy.def));
          enemy.hp -= skillDmg;
          const drain = Math.round(skillDmg * 0.6);
          const beforeDrain=state.hp;
          state.hp = Math.min(stats.maxHp, state.hp + drain);
          combatApplied('player','player',state.hp-beforeDrain,'LIFESTEAL');
          spawnFloatingFx(`🩸 飢渇 -${skillDmg} / +${drain}HP`, 'heal');
          addLog(`【鮮血の飢渇】生命力を吸い取り ${skillDmg} ダメージ！ HPを ${drain} 回復！`, 'heal');
        } else {
          // Sword Focus
          skillDmg = Math.max(1, Math.round(stats.atk * 1.4 - enemy.def));
          enemy.hp -= skillDmg;
          state.guaranteedCrit = true;
          spawnFloatingFx(`⚔️ 気勢斬り -${skillDmg} (次回会心確定)`, 'crit');
          addLog(`【集中気勢斬り】研ぎ澄まされた刃で ${skillDmg} ダメージ！ 次の攻撃は会心確定！`, 'gold');
        }

        equipmentHit(enemy,action);
        state.skillCooldown = Math.max(1,2-(equipmentEffects().skillHaste||0))+(enemy.gimmick==='rising_water'&&state.waterLevel>=70?1:0);
        addThunderCharge(enemy, '武器スキル');

        if (hasDragon) {
          enemy.hp -= 8;
          spawnFloatingFx('🔥 幼竜の息吹 -8', 'crit');
          addLog(`幼竜の火炎追撃！ ${enemy.name}に8ダメージ。`, 'gold');
        }
        applyRootProtection(enemy,enemyHpBeforeAction);

        if (enemy.hp <= 0) {
          enemy.hp = 0;
          onEnemyKilled();
          return;
        }

        queueEnemyTurn(false,250);
      }
      // 5. DISRUPT BARRIER (20F Ancient Guardian gimmick)
      else if (action === 'disrupt_barrier') {
        if (enemy.isBoss && state.bossBarrier) {
          state.bossBarrier = false;
          playSound('crit');
          spawnFloatingFx('⚡ 障壁解除！好機！', 'crit');
          addLog('ルーン障壁を破壊した！古代の守護者が隙を晒した！', 'gold');
        queueEnemyTurn(false,300);
        }
      } else if (action === 'attack_roots' && enemy.gimmick === 'mother_tree' && state.bossAdds > 0) {
        state.bossAdds--;
        state.bossBarrier = state.bossAdds > 0;
        addLog(`🌿 守護根を破壊！ 残り${state.bossAdds}体`,'gold');
        queueEnemyTurn(false,250);
      } else if (action === 'drain_water' && enemy.gimmick === 'rising_water') {
        state.waterLevel=Math.max(0,state.waterLevel-35);
        addLog(`🚰 排水機構を作動！ 水位を${state.waterLevel}%へ低下`,'gold');
        queueEnemyTurn(false,250);
      }

      updateHeader();
      render();
      } finally {if(['heavy','skill'].includes(action))healFromWeaponDamage(state,getPlayerStats(),actingEnemy,Math.max(0,initialHp-Math.max(0,actingEnemy.hp)),state.equipped);if(!actingEnemy.actionQueued){actingEnemy.acting=false;if(state.screen==='battle'&&state.currentEnemy===actingEnemy&&!actingEnemy.rewardClaimed)render();}syncActionButtons();}
    }

    function enemyTurn(isPlayerDefending = false) {
      const actingEnemy=state.currentEnemy;
      try {
      if (!state.currentEnemy || state.hp <= 0) return;
      const stats = getPlayerStats();
      const enemy = state.currentEnemy;
      if(companionTurn(enemy))return;
      equipmentPoisonTick(enemy);
      if(enemy.hp<=0){onEnemyKilled();return;}
      const gearEffects=equipmentEffects();
      const companion=companionCombatUnit(),targetsCompanion=selectEnemyTarget(enemy)!=='player';
      if(!targetsCompanion&&Math.random()*100<Math.max(0,Math.min(45,gearEffects.dodge||0)-(enemy.gimmick==='rising_water'&&state.waterLevel>=70?20:0))) {
        state.playerAttackBuff=Math.max(state.playerAttackBuff||1,1+Math.min(150,gearEffects.dodgeAttack||0)/100);
        addLog('💨 回避成功！'+(gearEffects.dodgeAttack?' 次の攻撃を強化':''),'gold');decideEnemyIntent();updateHeader();render();return;
      }
      if (enemy.gimmick === 'rising_water') state.waterLevel=Math.min(100,state.waterLevel+15);
      if (enemy.gimmick === 'mother_tree' && enemy.actionType === 'heal_roots') {
        const heal=Math.min(55,enemy.maxHp-enemy.hp); enemy.hp+=heal;
        if (state.bossAdds===0) {state.bossAdds=1;state.bossBarrier=true;}
        addLog(`🌱 母樹がHP${heal}回復し、守護根を再生した！`,'danger');
      }
      if (enemy.stunned) {
        enemy.stunned = false;
        addLog(`💫 ${enemy.name}はスタンして行動できない！`, 'gold');
        decideEnemyIntent(); updateHeader(); render(); return;
      }
      enemy.turnCount = (enemy.turnCount || 0) + 1;
      if(enemy.pulseTurns>0){enemy.pulseTurns--;const heal=Math.min(Math.round(enemy.maxHp*.06),enemy.maxHp-enemy.hp);enemy.hp+=heal;addLog(`🫀 肉塊の残響が敵を${heal}回復（残り${enemy.pulseTurns}T）`,'danger');}
      if(enemy.trait==='captain_phase'&&enemy.turnCount%2===0){enemy.summons=Math.min(2,(enemy.summons||0)+1);addLog(`⚓ 亡霊船員を召喚（${enemy.summons}/2）`,'danger');}

      let enemyAtk = enemy.atk * (enemy.nextMult || 1.0);
      if(targetsCompanion){companionReceiveAttack(enemy,enemyAtk);decideEnemyIntent();updateHeader();render();return;}
      deepEnemyTurn(enemy,isPlayerDefending);
      enemyAtk=enemy.atk*(enemy.nextMult||1);
      if(enemy.inheritTurns>0){enemyAtk+=enemy.inheritedAtk||0;enemy.inheritTurns--;}
      if(enemy.trait==='captain_phase'){enemyAtk*=enemy.hp<enemy.maxHp*.5?1.25:1;enemyAtk+=(enemy.summons||0)*3;}
      if (state.playerExposed) {
        enemyAtk *= 1.35; // Exposed penalty
        state.playerExposed = false; // reset
      }

      // Guard is tactical: big telegraphed attacks can be JUST GUARDED,
      // while repeated guards lose efficiency and grabs pierce it.
      let isGrab = (enemy.actionType === 'grab_prep');
      const isJustGuard = isPlayerDefending && !isGrab && !state.guardBroken && ['heavy', 'critical_smash'].includes(enemy.actionType);
      const baseDmg = Math.max(1, Math.round(enemyAtk - stats.def));
      let dmg = baseDmg;
      if (isPlayerDefending && !isGrab && !state.guardBroken) {
        const fatigueReductions = [0, 0.55, 0.45, 0.30];
        let reduction = isJustGuard ? 0.80 : (fatigueReductions[Math.min(3, state.guardFatigue)] || 0);
        if (state.equipped.armor?.key === 'guardian_aegis') reduction = Math.min(0.85, reduction + 0.15);
        if (equippedAccessories().some(i=>i.lowHpGuard) && state.hp <= stats.maxHp * 0.35) reduction = Math.min(0.90, reduction + 0.10);
        dmg = Math.max(Math.ceil(enemyAtk * (isJustGuard ? 0.10 : 0.18)), Math.round(baseDmg * (1 - reduction)));
      } else if (state.guardBroken) {
        dmg = Math.max(1, Math.round(baseDmg * 1.35));
      }

      // Apply demerit damages (e.g. Gold mask)
      if(enemy.trait==='captain_phase'&&enemy.hp<enemy.maxHp*.5){dmg*=2;addLog('⚓ 船長の二連撃！','danger');}
      if (stats.demeritDamage !== 0) {
        dmg = Math.round(dmg * (1 + stats.demeritDamage / 100));
      }

      dmg=buildIncomingDamage(dmg,enemy,state.equipped,state,stats.maxHp,isPlayerDefending);
      state.hp -= dmg;
      combatApplied('enemy','player',-dmg,'敵 → 主人公');
      if(state.hp>0&&isPlayerDefending&&!isGrab&&!state.guardBroken) {
        if(gearEffects.guardHeal){const heal=Math.max(0,Math.min(stats.maxHp-state.hp,gearEffects.guardHeal));state.hp+=heal;combatApplied('player','player',heal,'ガード回復');addLog(`🛡️ ガード回復 +${heal}HP`,'heal');}
        if(isJustGuard&&gearEffects.justAttack){state.playerAttackBuff=Math.max(state.playerAttackBuff||1,1+Math.min(150,gearEffects.justAttack)/100);addLog('🛡️ JUST GUARD連携：次撃強化','gold');}
      }
      if (state.equipped.armor?.archetype === 'thunder') addThunderCharge(enemy, '被弾');
      playSound('player_hurt');
      triggerShake();

      if (state.guardBroken) {
        spawnFloatingFx(`💥 GUARD BREAK -${dmg}`, 'damage');
        addLog(`⚠️ ガードが崩壊し、${enemy.name}の攻撃が直撃！ ${dmg}ダメージ！`, 'danger');
      } else if (isJustGuard) {
        spawnFloatingFx(`✨ JUST GUARD -${dmg}`, 'info');
        addLog(`✨ JUST GUARD成功！ ${enemy.name}の大技を読み切り、被害を${dmg}に抑えた！`, 'gold');
      } else if (isGrab && isPlayerDefending) {
        spawnFloatingFx(`💥 ガード貫通拘束 -${dmg}`, 'damage');
        addLog(`⚠️ ${enemy.name} の強烈な拘束突進は防御を突き破って直撃した！ ${dmg} の大打撃！`, 'danger');
      } else {
        spawnFloatingFx(isPlayerDefending ? `🛡️ ガード -${dmg}` : `-${dmg}`, 'damage');
        addLog(`${enemy.name} の反撃！ ${dmg} のダメージを受けた！`, 'danger');
      }


      if (enemy.trait === 'curse_poison') {
        state.playerPoisonTurns = 2;
        state.playerPoisonDmg = enemy.isElite ? 6 : 3;
        addLog(`☣️ ${enemy.name}の呪毒を受けた！`, 'danger');
      }
      if (enemy.trait === 'spore_poison') { state.statusEffects.poison=Math.min(6,state.statusEffects.poison+2); addLog('☠️ 胞子毒が蓄積した！','danger'); }
      if (enemy.trait === 'skill_bind') { state.skillCooldown+=1; state.statusEffects.bind=2; addLog('🕸️ 拘束されスキルCD+1','danger'); }
      if (enemy.trait === 'paralysis') { state.statusEffects.paralysis=1; addLog('⚡ 麻痺：次のスキル使用不可','danger'); }
      if (enemy.trait === 'ancient_growth') { enemy.atk=Math.round(enemy.atk*1.07);enemy.def+=2;addLog('🌳 捕食王が成長した','danger'); }
      if (enemy.trait === 'low_hp_frenzy' && enemy.hp<enemy.maxHp*.4) enemy.atk=Math.round(enemy.atk*1.08);
      if (enemy.trait === 'captain_phase' && enemy.hp<enemy.maxHp*.5 && !enemy.captainArmored) {enemy.captainArmored=true;enemy.def+=4;}
      if (enemy.trait === 'copy_buff' && state.playerAttackBuff>1) { enemy.atk=Math.round(enemy.atk*state.playerAttackBuff);addLog('👁️ 攻撃バフを模倣された！','danger'); }
      if (enemy.trait === 'rage_stack') {
        enemy.atk = Math.round(enemy.atk * 1.08);
        addLog(`🔥 ${enemy.name}の攻撃力が上昇した！`, 'danger');
      }
      if (isPlayerDefending && enemy.trait === 'guard_enrage') {
        enemy.atk = Math.round(enemy.atk * 1.15);
        addLog(`💢 ${enemy.name}は防御を見て激昂し、攻撃力を上げた！`, 'danger');
      }
      if (isPlayerDefending && enemy.trait === 'guard_breaker') {
        state.guardStamina = Math.max(0, state.guardStamina - 35);
        state.guardFatigue = Math.max(3, state.guardFatigue);
        addLog(`💥 ${enemy.name}がガードゲージを大きく破壊した！`, 'danger');
      }
      if (enemy.trait === 'regen_cell' && enemy.turnCount % 2 === 0) {
        const heal = Math.min(15, enemy.maxHp - enemy.hp);
        enemy.hp += heal;
        if (heal > 0) addLog(`🧬 ${enemy.name}の再生細胞がHPを${heal}回復！`, 'heal');
      }
      if (state.playerPoisonTurns > 0) {
        state.hp -= state.playerPoisonDmg;
        combatApplied('status','player',-state.playerPoisonDmg,'POISON');
        state.playerPoisonTurns--;
        addLog(`☣️ 呪毒によりHP-${state.playerPoisonDmg}`, 'danger');
      }

      // Shield / Titan counter parry
      const armor = state.equipped.armor;
      const titanActive = stats.synList.some(s => s.id === 'syn_titan' && s.count >= 3);
      const hasShield = armor?.archetype === 'shield' || titanActive;
      const parryChance = isJustGuard ? 1 : (titanActive ? 0.55 : 0.35);
      if (isPlayerDefending && !state.guardBroken && hasShield && Math.random() < parryChance) {
        let counterDmg = Math.max(4, Math.round(stats.atk * 0.5 + enemy.atk * 0.15));
        if (isJustGuard && armor?.key === 'guardian_aegis') counterDmg = Math.round(counterDmg * 1.5);
        enemy.hp -= counterDmg;
        combatApplied('player','enemy',-counterDmg,'COUNTER');
        playSound('parry');
        spawnFloatingFx(`🛡️ パリィ反撃 -${counterDmg}`, 'crit');
        addLog(`大盾で受け流してカウンター！ ${enemy.name} に ${counterDmg} の打撃を跳ね返した！`, 'gold');
        if (enemy.hp <= 0) {
          enemy.hp = 0;
          onEnemyKilled();
          return;
        }
      }
      state.guardStamina = Math.min(100, (state.guardStamina || 0) + 10);

      // Check fatal blow & Second Chance from Nameless Portrait
      if (state.hp <= 0) {
        if (state.equipped.armor?.key === 'abyssal_void_cloak' && !state.usedVoidCloak) {
          state.usedVoidCloak = true;
          state.maxHp = Math.max(1, Math.floor(state.maxHp / 2));
          state.hp = state.maxHp;
          spawnFloatingFx('🕳️ 虚無王の外套：死を無効化', 'crit');
          addLog('🕳️ 虚無が致命傷を呑み込んだ。代償として、この探索中の最大HPが半減！', 'gold');
          decideEnemyIntent(); updateHeader(); render(); return;
        }
        if (state.mystery.hasSecondChance && !state.usedSecondChance) {
          state.usedSecondChance = true;
          state.hp = 1;
          playSound('safe_point');
          spawnFloatingFx('✨ 名もなき肖像画の加護！HP1で耐えた！', 'crit');
          addLog('【奇跡】肖像画の神秘的な加護が致命傷を肩代わりし、HP1で踏みとどまった！', 'gold');
          decideEnemyIntent();
          updateHeader();
          render();
          return;
        }

        state.hp = 0;
        updateHeader();
        setTimeout(() => returnToTown(false), 500);
        return;
      }

      decideEnemyIntent();
      updateHeader();
      render();
      } finally {if(actingEnemy){actingEnemy.acting=false;actingEnemy.actionQueued=false;}if(state.screen==='battle'&&state.currentEnemy===actingEnemy&&!actingEnemy?.rewardClaimed)render();}
    }

    function onEnemyKilled() {
      if(!state.currentEnemy||state.currentEnemy.rewardClaimed)return;
      state.currentEnemy.rewardClaimed=true;
      syncActionButtons();
      const enemy = state.currentEnemy;
      awardBattleExperience(enemy);
      buildKill(state,state.equipped,getPlayerStats().maxHp);
      playSound(enemy.isBoss ? 'boss_kill' : 'kill');
      state.lastDefeatedEnemy={atk:enemy.atk,trait:enemy.trait};
      if(enemy.trait==='death_pulse'){state.pendingEnemyPulse=3;addLog('🫀 肉塊の治癒脈動が次の敵へ伝わった（3T・毎ターン最大HP6%回復）','danger');}
      if(enemy.gearPoison&&equipmentEffects().poisonHeal){const heal=equipmentEffects().poisonHeal;state.hp=Math.min(getPlayerStats().maxHp,state.hp+heal);addLog(`☠️ 毒敵撃破回復 +${heal}HP`,'heal');}
      dropMonsterMaterials(enemy);
      state.runKills++;
      if (state.equipped.weapon?.key === 'abyssal_devourer') {
        const growth = state.greedLevel > 0 ? 2 + state.greedLevel : 2;
        state.abyssGrowth = (state.abyssGrowth || 0) + growth;
        addLog(`🌌 深淵喰らいが成長：探索中攻撃力 +${state.abyssGrowth}`, 'gold');
      }

      if (state.camp.tavern >= 2 && state.bounty && !state.bounty.completed) {
        const killBonus = state.expeditionPolicy === 'bounty' ? 2 : 1;
        state.bounty.currentKills = (state.bounty.currentKills || 0) + killBonus;
        if (state.bounty.currentKills >= state.bounty.targetKills) {
          state.bounty.completed = true;
          addLog(`📜 酒場の討伐依頼【魔物${state.bounty.targetKills}体討伐】を達成！ 拠点帰還後に報酬 ${state.bounty.rewardGold}G を受取可能！`, 'gold');
          spawnFloatingFx('📜 討伐依頼達成！', 'gold');
        }
      }

      const stats = getPlayerStats();
      const baseGold = 12 + state.floor * 6;
      let earnedGold = Math.round(baseGold * (1 + stats.goldRate / 100));
      earnedGold = Math.round(earnedGold * (state.modifiers.goldMult || 1));
      if (state.expeditionPolicy === 'bounty') earnedGold = Math.round(earnedGold * 1.5);
      state.dungeonGold += earnedGold;
      state.runRecords.mostGold=Math.max(state.runRecords.mostGold||0,state.dungeonGold);
      state.runRecords.mostKills=Math.max(state.runRecords.mostKills||0,state.runKills);
      if(state.floor>=31&&Math.random()<0.12){state.deepCrystals++;addLog('🔷 深層結晶を発見！','gold');}

      spawnFloatingFx(`💀 討伐！ +${earnedGold}G`, 'gold');
      addLog(`討伐成功！ ${enemy.name} を撃破！ 金貨 +${earnedGold}G`, 'gold');

      if (enemy.isBoss) {
        state.bossFirstKills = state.bossFirstKills || {};
        const isFirstKill = !state.bossFirstKills[state.floor];

        if (isFirstKill) {
          state.bossFirstKills[state.floor] = true;
          saveState();

          let sigItem = null;
          let extraCores = 2;
          if (state.floor === 10) {
            sigItem = { ...UNIQUE_ITEMS.giant_ram, id: 'boss10_' + Date.now() };
          } else if (state.floor === 20) {
            sigItem = { ...UNIQUE_ITEMS.guardian_aegis, id: 'boss20_' + Date.now() };
          } else if (state.floor === 30) {
            sigItem = { ...UNIQUE_ITEMS.mutagen_core, id: 'boss30_' + Date.now() };
            extraCores = 3;
          } else if (state.floor === 40) {
            sigItem = { ...UNIQUE_ITEMS.mother_tree_heart, id:'boss40_'+Date.now() }; extraCores=3;
          } else if (state.floor === 50) {
            sigItem = { ...UNIQUE_ITEMS.nereus_crown, id:'boss50_'+Date.now() }; extraCores=4;
          } else if (state.floor === 60) {
            sigItem = { ...UNIQUE_ITEMS.living_core_relic, id:'boss60_'+Date.now() }; extraCores=5;
          } else {
            sigItem = generateItem(state.floor, 'Legendary');
          }

          state.abyssCores += extraCores;
          sigItem=createMaterialReward('boss',state.floor,'Legendary');
          giveItemToBag(sigItem);
          playSound('legendary');
          spawnFloatingFx(`👑 ボス初討伐！ 固有素材GET！`, 'crit');
          addLog(`【初回撃破達成】固有素材【${sigItem.name}】と深淵の核×${extraCores}を獲得！`, 'gold');
          state.runRecords.bossesDefeated=Object.keys(state.bossFirstKills).length;
        } else {
          // Repeat bosses use the centralized table (Epic floor, Legendary ~7%).
          state.abyssCores += 1;
          if (Math.random() < 0.10) giveItemToBag(generateItem(state.floor, null, 'boss_repeat'));
          addLog('ボス周回撃破！ 固有素材と深淵の核を獲得！', 'gold');
        }

        // Check Broken Crown awakening
        [...state.inventory, ...state.storage, ...Object.values(state.equipped).filter(Boolean)].forEach(it => {
          if (it.key === 'broken_crown' && !it.awakened) {
            it.awakened = true;
            it.name = '👑 覚醒した深淵覇王冠';
            it.icon = '👑';
            it.rarity = 'Legendary';
            it.baseAtk = 16;
            it.baseDef = 12;
            it.hp = 60;
            it.goldRate = 80;
            it.desc = '【覚醒した王冠】階層ボスの血を吸い真の威光を取り戻した王の証 (攻+16/防+12/HP+60/金+80%)';
            state.mystery.crownAwakened = true;
            playSound('legendary');
            spawnFloatingFx('👑 王冠が覚醒した！', 'crit');
            addLog('👑 階層ボスの魂を吸収し、【壊れた王冠】が【覚醒した深淵覇王冠】へと真の覚醒を果たした！', 'gold');
          }
        });

        afterChapterBoss(state.floor);return;
      } else if (Math.random() < (enemy.isElite ? 0.08 : 0.03)) {
        // Elite or standard drop
        const item = generateItem(state.floor, enemy.isElite ? (Math.random()<0.3?'Epic':'Rare') : (Math.random()<0.2?'Rare':'Common'), 'monster');
        giveItemToBag(item);
      }

      state.currentEnemy = null;
      // Advance to next floor
      state.floor++;
      setTimeout(() => generateDoorsForFloor(), 400);
    }
