    function updateHeader() {
      const stats = getPlayerStats();
      const inDungeon = (state.floor > 0);

      document.getElementById('ui-floor-icon').textContent = inDungeon ? '🪜' : '🏕️';
      document.getElementById('ui-floor-name').textContent = inDungeon ? `B${state.floor}F` : '地上 拠点';
      
      const area = inDungeon ? getCurrentArea() : null;
      document.getElementById('ui-area-tag').textContent = inDungeon ? area.tag : '生存者の野営地';

      // HP & Low-HP Danger Visuals (HP < 30% ピンチ演出)
      const hpPct = Math.max(0, Math.min(100, (state.hp / stats.maxHp) * 100));
      const isCriticalHp = inDungeon && (hpPct <= 30);

      // Danger Vignette
      const vignette = document.getElementById('danger-vignette');
      if (vignette) {
        vignette.style.display = isCriticalHp ? 'block' : 'none';
      }

      // HP bar fill
      const hpBar = document.getElementById('ui-hp-bar');
      if (hpBar) {
        hpBar.style.width = hpPct + '%';
        if (isCriticalHp) {
          hpBar.classList.add('hp-critical');
        } else {
          hpBar.classList.remove('hp-critical');
        }
      }

      // HP Text
      const hpText = document.getElementById('ui-hp-text');
      if (hpText) {
        hpText.innerHTML = isCriticalHp
          ? `<span style="color:#ef4444; font-weight:900; animation:glowPulse 0.8s infinite;">⚠ 瀕死！ ${Math.round(state.hp)} / ${stats.maxHp}</span>`
          : `${Math.round(state.hp)} / ${stats.maxHp}`;
      }

      // Goal Nudge (短い目標の常時表示 & 次の安全帰還ポイントまでの階数)
      const nudge = document.getElementById('ui-goal-nudge');
      if (inDungeon) {
        const nextSafe = getNextSafeFloor();
        const remain = nextSafe===null?null:nextSafe-state.floor;
        if(nextSafe===null){nudge.textContent='現在の最深部：次の帰還門はありません';nudge.className='goal-nudge';}
        else if (isCriticalHp) {
          nudge.innerHTML = `🚨 瀕死！ 5F帰還門まで: <b style="color:#fff; font-size:12px;">あと${remain}階</b> 耐え抜け！`;
          nudge.className = 'goal-nudge critical-nudge';
        } else if (isBossFloor(state.floor)) {
          nudge.textContent = `💀 BOSS FLOOR: 決死の戦い！`;
          nudge.className = 'goal-nudge';
        } else if (remain === 0) {
          nudge.textContent = `🏰 帰還転移門 到達！ 完全生還可能！`;
          nudge.className = 'goal-nudge';
        } else {
          nudge.textContent = `🎯 5F安全帰還まで: あと${remain}階`;
          nudge.className = 'goal-nudge';
        }
      } else {
        const growth=characterProgress('player');
        nudge.textContent = `主人公 Lv.${growth.level}${growth.level>=characterLevelCap()?' MAX':` / 次Lvまで ${Math.max(0,characterExpRequired(growth.level)-growth.exp)}EXP`}`;
        nudge.className = 'goal-nudge';
      }

      // Stats
      document.getElementById('ui-atk').textContent = stats.atk;
      document.getElementById('ui-def').textContent = stats.def;
      document.getElementById('ui-crit').textContent = stats.crit + '%';
      document.getElementById('ui-gold').textContent = inDungeon ? state.dungeonGold : state.vaultGold;
      document.getElementById('ui-gold-label').textContent = inDungeon ? '🪙 未保管G' : '🏦 地上保管G';
      document.getElementById('ui-core').textContent = state.abyssCores;

      // Badges
      document.getElementById('ui-bag-count').textContent = state.inventory.length;

      // Codex count
      const totalCodexKnown = Object.keys(state.codex.items).length + Object.keys(state.codex.enemies).length;
      document.getElementById('ui-codex-pct').textContent = `${totalCodexKnown}種`;
    }

    function getLabBossIntelHtml() {
      const nextBossFloor = getNextBossFloor() || MAX_DUNGEON_FLOOR;
      const area = AREAS.find(a => a.max === nextBossFloor) || AREAS[AREAS.length-1];
      const boss = area.boss;
      const gimmicks = {
        heavy_charge: '3ターンごとの溜め強撃',
        shield_barrier: '古代障壁（解除可能）',
        mutate_form: 'HP50%以下で変異・攻撃上昇',
        mother_tree: '守護根・自己再生',
        rising_water: '毎ターン水位上昇（排水可能）',
        three_phase_core: 'HPに応じた三段階変異・行動学習'
        ,history_king:'反復行動を記録し、後半に対策',mirror_warden:'装備能力と構えを一部模倣',forget_librarian:'バフを奪いスキルを封印',boundary_gate:'装甲相と開放相が交互に切り替わる'
      };
      const shown = scaledEnemyStats(boss,area,nextBossFloor,'boss',{labLevel:state.camp.lab,greed:state.greedLevel,enemyAtkMult:state.modifiers.enemyAtkMult});
      return `<div style="font-size:10.5px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.25);padding:6px;width:100%;border-radius:5px;">
        📡 次ボス B${nextBossFloor}F ${boss.name}：HP ${shown.hp} / 攻撃 ${shown.atk} / ${gimmicks[boss.gimmick]}
        <div>次の安全帰還：${getNextSafeFloor(state.floor||state.selectedStartFloor||1)??'なし'}F</div>
        ${state.camp.lab>=5?`<div>🔬 深層危険解析：${area.rule||'敵の予告・状態異常を確認して行動を選ぶ。'} / ${gimmicks[boss.gimmick]}</div>`:''}
        ${state.camp.lab >= 3 ? '<b style="color:#4ade80;">（研究弱体化 -15%適用）</b>' : ''}
        ${state.camp.lab >= 4 && state.rarityProgress.mythicPity >= 100 ? '<div style="color:#f9a8d4;">💠 神話級の気配が強まっている…</div>' : ''}
        ${state.camp.lab >= 4 && state.rarityProgress.abyssalPity >= 800 ? '<div style="color:#67e8f9;">🌌 深淵の鼓動が近い…</div>' : ''}
      </div>`;
    }

    function render() {
      updateHeader();
      const vp = document.getElementById('viewport');

      // VIEW: TOWN / BASE CAMP
      if (state.screen === 'town') {
        const vaultCost = getVaultUpgradeCost(state.camp.vaultLevel);
        const currentPolicy = state.expeditionPolicy || 'normal';

        const policies = [
          { key: 'normal', name: '🧭 通常', desc: '均整型 (標準探索)' },
          { key: 'mining', name: '⛏️ 採掘', desc: '金貨+40% / アイテム微減' },
          { key: 'bounty', name: '⚔️ 討伐', desc: 'エリート+35% / 依頼報酬+50%' },
          { key: 'excavate', name: '📜 発掘', desc: '祭壇謎率+45% / 宝箱レア+15%' }
        ];

        const policyButtons = policies.map(p => `
          <button class="btn ${currentPolicy === p.key ? 'btn-gold' : 'btn-sub'} btn-xs" style="flex:1; padding:6px 2px; font-size:10.5px;" onclick="setExpeditionPolicy('${p.key}')" title="${p.desc}">
            ${p.name}
          </button>
        `).join('');

        const selectedPolicyObj = policies.find(p => p.key === currentPolicy) || policies[0];

        vp.innerHTML = `
          ${townShortcutsHtml()}
          <div id="town-expedition" class="card" style="text-align:center; background: radial-gradient(circle at 50% 20%, #1e293b, #0f172a);">
            <div style="font-size:36px; margin-bottom:4px;">🏕️</div>
            <h2 style="font-size:18px; font-weight:900; color:#fff;">生存者の野営キャンプ</h2>
            <div style="font-size:10px;color:#64748b;margin-bottom:3px;">Version ${GAME_VERSION}</div>
            <div style="font-size:11px;color:#cbd5e1;margin-bottom:7px;">🏆 最高到達 B${state.deepestFloorReached}F / 解放 B${state.maxUnlockedFloor}F　⚔️最多討伐 ${state.runRecords.mostKills}　🔥最高GREED ${state.runRecords.highestGreed}　💰最多未保管G ${state.runRecords.mostGold}</div>
            <p style="font-size:12px; color:#94a3b8; margin-bottom:10px;">深淵から生還した者だけがこの拠点を発展させられる。</p>
            
            <!-- Expedition Policy Selection -->
            <div style="background:rgba(0,0,0,0.4); padding:8px; border-radius:6px; margin-bottom:10px;">
              <div style="font-size:11px; color:#cbd5e1; display:flex; justify-content:space-between; margin-bottom:4px;">
                <span>🧭 探索方針の選択:</span>
                <span style="color:var(--gold); font-weight:bold;">${selectedPolicyObj.desc}</span>
              </div>
              <div style="display:flex; gap:4px;">
                ${policyButtons}
              </div>
            </div>

            <div style="background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;margin-bottom:10px;">
              <div style="font-size:11px;color:#cbd5e1;margin-bottom:5px;">🎒 出撃前支援を1つ選択:</div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;">
                ${[
                  ['potion','🧪 特製薬酒','HP60回復薬'],
                  ['smoke','💨 忍びの煙玉','通常戦闘から逃走'],
                  ['luck','🍀 幸運の護符','宝箱レア率+25%']
                ].map(p => `<button class="btn ${state.starterPerk === p[0] ? 'btn-gold' : 'btn-sub'} btn-xs" onclick="selectStarterPerk('${p[0]}')" title="${p[2]}">${p[1]}</button>`).join('')}
              </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;align-items:center;font-size:10.5px;color:#94a3b8;"><span>開始地点:</span>${unlockedWarpFloors().map(f=>`<button class="btn ${state.selectedStartFloor===f?'btn-gold':'btn-sub'} btn-xs" onclick="selectStartFloor(${f})">B${f}F</button>`).join('')}</div>

            <button class="btn btn-gold" style="font-size:16px; padding:14px; width:100%;" ${state.starterPerk ? '' : 'disabled'} onclick="startDungeonRun()">
              ${state.starterPerk ? '🪜 地下迷宮へ潜る (探索開始)' : '支援を選ぶと探索開始できます'}
            </button>
          </div>

          <!-- Camp Facilities Grid (鍛冶屋, 道具屋, 倉庫, 酒場) -->
          <div class="card">
            <div class="card-title">
              <span>🏛️ 拠点施設・発展</span>
              <span style="font-size:11px; color:var(--muted);">🏦 地上保管G: ${state.vaultGold} / 核: ${state.abyssCores} / 結晶: ${state.deepCrystals}</span>
            </div>
            <div class="town-facilities">
              <!-- Blacksmith -->
              <div id="town-blacksmith" class="item-row" style="flex-direction:column; align-items:flex-start; gap:4px;">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                  <div style="font-size:12px; font-weight:bold; color:#fff;">🔨 鍛冶屋 Lv.${state.camp.blacksmith}</div>
                  <button class="btn btn-sub btn-xs" ${isFacilityUpgradeDisabled('blacksmith') ? 'disabled' : ''} onclick="upgradeCampFacility('blacksmith')">${getFacilityButtonText('blacksmith')}</button>
                </div>
                <div style="font-size:10.5px; color:#94a3b8;">
                  ${state.camp.blacksmith >= 2 ? '装備を鍛え直して基礎威力を強化可能' : 'Lv2で装備の鍛錬・強化が解放'}
                </div>
                <div class="forge-actions"><button class="btn btn-sub btn-xs" onclick="openCrafting('refine')">強化</button><button class="btn btn-gold btn-xs" onclick="openCrafting('create')">作成</button><button class="btn btn-sub btn-xs" onclick="openCrafting('tree')">武器ツリー</button><button class="btn btn-sub btn-xs" onclick="openCrafting('awaken')">覚醒</button></div>
                ${state.camp.blacksmith >= 2 ? `
                  <div style="display:flex; gap:4px; margin-top:2px; width:100%;">
                    ${state.equipped.weapon ? `<button class="btn btn-gold btn-xs" style="flex:1;" ${state.equipped.weapon.refineCount >= 10 ? 'disabled' : ''} onclick="refineEquippedItem('weapon')">⚔️ 武器強化 (${state.equipped.weapon.refineCount >= 10 ? 'MAX +10' : getRefineCost(state.equipped.weapon)+'G'})</button>` : ''}
                    ${state.equipped.armor ? `<button class="btn btn-sub btn-xs" style="flex:1;" ${state.equipped.armor.refineCount >= 10 ? 'disabled' : ''} onclick="refineEquippedItem('armor')">🛡️ 防具強化 (${state.equipped.armor.refineCount >= 10 ? 'MAX +10' : getRefineCost(state.equipped.armor)+'G'})</button>` : ''}
                  </div>
                  ${state.camp.blacksmith >= 3 ? `<div style="display:flex;gap:4px;width:100%;margin-top:3px;">
                    ${state.equipped.weapon && !state.equipped.weapon.affix ? `<button class="btn btn-purple btn-xs" style="flex:1;" onclick="openAffixModal('weapon')">武器に特性付与 (150G)</button>` : ''}
                    ${state.equipped.armor && !state.equipped.armor.affix ? `<button class="btn btn-purple btn-xs" style="flex:1;" onclick="openAffixModal('armor')">防具に特性付与 (150G)</button>` : ''}
                  </div>` : ''}
                  ${state.camp.blacksmith >= 4 && state.equipped.weapon?.affix ? `<button class="btn btn-sub btn-xs" style="width:100%" onclick="rerollEquipmentAffix('weapon')">🎲 武器特性再抽選 120G +結晶1</button>`:''}
                  ${state.camp.blacksmith >= 5 && ['Mythic','Abyssal'].includes(state.equipped.weapon?.rarity) ? `<button class="btn btn-purple btn-xs" style="width:100%" onclick="enhanceHighRarity('weapon')">💠 高位能力強化 400G +結晶3</button>`:''}
                ` : ''}
              </div>

              <!-- Shop -->
              <div id="town-shop" class="item-row" style="flex-direction:column; align-items:flex-start; gap:4px;">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                  <div style="font-size:12px; font-weight:bold; color:#fff;">🏪 道具屋 Lv.${state.camp.shop}</div>
                  <button class="btn btn-sub btn-xs" ${isFacilityUpgradeDisabled('shop') ? 'disabled' : ''} onclick="upgradeCampFacility('shop')">${getFacilityButtonText('shop')}</button>
                </div>
                <div style="font-size:10.5px; color:#94a3b8;">
                  ${state.camp.shop >= 2 ? '潜入前の携行補給品を購入可能' : 'Lv2で探索持込アイテムの購入が解放'}
                </div>
                ${state.camp.shop >= 2 ? `
                  <div style="display:flex; gap:4px; margin-top:2px; width:100%;">
                    <button class="btn btn-sub btn-xs" style="flex:1;" onclick="buyExpeditionSupply('potion')">🧪 傷薬持込 (30G)</button>
                    <button class="btn btn-gold btn-xs" style="flex:1;" onclick="buyExpeditionSupply('charm')">🍀 幸運護符 (45G)</button>
                  </div>
                  ${state.camp.shop >= 4 ? `<div style="display:flex;gap:4px;width:100%;"><button class="btn btn-sub btn-xs" style="flex:1" onclick="buyExpeditionSupply('smoke')">💨 煙玉 60G</button><button class="btn btn-sub btn-xs" style="flex:1" onclick="buyExpeditionSupply('antidote')">💊 解毒薬 40G</button></div>`:''}
                  ${state.camp.shop >= 5 ? `<button class="btn btn-purple btn-xs" style="width:100%" onclick="buyExpeditionSupply('greater')">🧴 上級傷薬 90G</button>`:''}
                ` : ''}
              </div>

              <!-- Vault -->
              <div id="town-vault" class="item-row" style="flex-direction:column; align-items:flex-start; gap:4px;">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                  <div style="font-size:12px; font-weight:bold; color:#fff;">📦 倉庫 Lv.${state.camp.vaultLevel} (${state.camp.vaultSize}枠)</div>
                  <button class="btn btn-sub btn-xs" ${isFacilityUpgradeDisabled('vault') ? 'disabled' : ''} onclick="upgradeVault()">${getFacilityButtonText('vault')}</button>
                </div>
                <div style="font-size:10.5px; color:#94a3b8;">容量+10枠 / 未持ち帰り防止</div>
              </div>

              <!-- Tavern -->
              <div id="town-tavern" class="item-row" style="flex-direction:column; align-items:flex-start; gap:4px;">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                  <div style="font-size:12px; font-weight:bold; color:#fff;">🍺 冒険者の酒場 Lv.${state.camp.tavern}</div>
                  <button class="btn btn-sub btn-xs" ${isFacilityUpgradeDisabled('tavern') ? 'disabled' : ''} onclick="upgradeCampFacility('tavern')">${getFacilityButtonText('tavern')}</button>
                </div>
                <div style="font-size:10.5px; color:#e2e8f0; width:100%;">
                  ${state.camp.tavern < 2 ? `<div style="color:#94a3b8;padding:5px;">🔒 酒場Lv2で討伐依頼を解放</div>` : state.bounty ? `
                    <div style="background:rgba(0,0,0,0.3); padding:4px 6px; border-radius:4px; margin-top:2px;">
                      <div style="display:flex; justify-content:space-between; font-size:10.5px;">
                        <span>📜 討伐依頼: 魔物${state.bounty.targetKills}体</span>
                        <b style="color:var(--gold);">${state.bounty.currentKills}/${state.bounty.targetKills}</b>
                      </div>
                      ${state.bounty.completed ? `
                        <button class="btn btn-gold btn-xs" style="width:100%; margin-top:4px; padding:3px;" onclick="claimTavernBounty()">
                          🎉 達成！ 報酬 +${getTavernReward()}G を受取
                        </button>
                      ` : `
                        <div style="font-size:10px; color:#94a3b8; margin-top:2px;">達成報酬: ${getTavernReward()}G（最大1500G）</div>
                      `}
                      ${state.camp.tavern >= 4 && !state.bounty.completed ? `<div style="display:flex;gap:3px;margin-top:4px;"><button class="btn btn-sub btn-xs" onclick="selectTavernContract('short')">短期</button><button class="btn btn-sub btn-xs" onclick="selectTavernContract('elite')">Elite</button>${state.camp.tavern>=5?`<button class="btn btn-purple btn-xs" onclick="selectTavernContract('boss')">賞金首</button>`:''}</div>`:''}
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Laboratory -->
              <div id="town-lab" class="item-row" style="grid-column:1 / -1;flex-direction:column;align-items:flex-start;gap:4px;">
                <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
                  <div style="font-size:12px;font-weight:bold;color:#fff;">🔬 深淵研究所 Lv.${state.camp.lab}</div>
                  <button class="btn btn-sub btn-xs" ${isFacilityUpgradeDisabled('lab') ? 'disabled' : ''} onclick="upgradeCampFacility('lab')">${getFacilityButtonText('lab')}</button>
                </div>
                <div style="font-size:10.5px;color:#cbd5e1;line-height:1.5;">
                  Lv1 敵図鑑詳細${state.camp.lab >= 2 ? ' / Lv2 次ボス能力解析' : ''}${state.camp.lab >= 3 ? ' / Lv3 ボス最大HP-15%' : ''}${state.camp.lab >= 4 ? ' / Lv4 部屋危険度予測' : ''}
                </div>
                ${state.camp.lab >= 2 ? getLabBossIntelHtml() : '<div style="font-size:10px;color:#64748b;">Lv2で次ボスのHP・攻撃・特殊能力を表示</div>'}
              </div>
            </div>
          </div>

        `;
      }

      // VIEW: SAFE POINT (5階ごとの安全帰還ポイント特別演出画面)
      else if (state.screen === 'safe_point') {
        const area = getCurrentArea();
        const nextBossFloor = getNextBossFloor() || MAX_DUNGEON_FLOOR;
        const bossRemain = nextBossFloor - state.floor;
        const nextAreaIdx = Math.min(AREAS.length-1, Math.floor(state.floor / 10));
        const nextArea = AREAS[nextAreaIdx];

        const lootCount = state.inventory.length;
        const lootGold = state.dungeonGold;
        const valuableItems = state.inventory.filter(i => ['Rare', 'Epic', 'Legendary'].includes(i.rarity));

        vp.innerHTML = `
          <div class="safe-point-banner">
            <div style="font-size:40px; filter:drop-shadow(0 0 16px #fbbf24);">🏰✨</div>
            <div class="safe-point-title">✨ SAFE POINT REACHED ✨</div>
            <div style="font-size:14px; font-weight:900; color:#fff;">【地下 ${state.floor} 階 古代の安全転移門】</div>
            <div style="font-size:12px; color:#cbd5e1; max-width:92%; margin:0 auto; line-height:1.4;">
              この結界空間は深淵の呪力を遮断している。<b style="color:#fbbf24;">全戦利品を完全回収できる安全な帰還地点</b>です。<br>
              ここで生還するか、更なる富と栄光を求めて深淵へ挑むか？
            </div>

            <!-- Current Loot Summary -->
            <div class="safe-point-stat-grid">
              <div class="safe-stat-box">
                <span class="safe-stat-val">🎒 ${lootCount}個</span>
                <span class="safe-stat-lbl">未保管の戦利品</span>
              </div>
              <div class="safe-stat-box">
                <span class="safe-stat-val" style="color:#fbbf24;">🪙 +${lootGold}G</span>
                <span class="safe-stat-lbl">獲得ゴールド</span>
              </div>
              <div class="safe-stat-box">
                <span class="safe-stat-val" style="color:#c084fc;">💎 ${valuableItems.length}個</span>
                <span class="safe-stat-lbl">貴重品 (Rare以上)</span>
              </div>
            </div>

            ${valuableItems.length > 0 ? `
              <div style="background:rgba(0,0,0,0.45); border-radius:6px; padding:6px 10px; font-size:11px; color:#fef08a; display:flex; flex-wrap:wrap; gap:6px; justify-content:center;">
                <span style="font-weight:bold;">所持中の貴重品:</span>
                ${valuableItems.map(v => `<span style="border-bottom:1px solid rgba(254,240,138,0.4);">${v.icon} ${v.name}</span>`).join(', ')}
              </div>
            ` : ''}

            <!-- 2 Huge Decision Buttons -->
            <div style="display:flex; flex-direction:column; gap:10px; width:100%; margin-top:6px;">
              <!-- Choice 1: Return safely -->
              <div class="choice-card-safe" onclick="returnToTown(true)">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:15px; font-weight:900; color:#fff;">🏰 安全に帰還する (確実な勝利)</span>
                  <span style="font-size:11px; background:#10b981; color:#fff; padding:2px 8px; border-radius:4px; font-weight:bold;">全アイテム回収</span>
                </div>
                <div style="font-size:11.5px; color:#a7f3d0; line-height:1.4; margin-top:2px;">
                  未保管の戦利品<b>${lootCount}個</b>と<b>${lootGold}G</b>を全て地上倉庫へ持ち帰り、拠点を恒久強化！
                </div>
              </div>

              <!-- Choice 2: Dive deeper (Temptation) -->
              <div class="choice-card-deep" onclick="diveDeeperFromSafePoint()">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:15px; font-weight:900; color:#fff;">🔻 さらに地下へ潜る (欲望と挑戦)</span>
                  <span style="font-size:11px; background:#f59e0b; color:#111; padding:2px 8px; border-radius:4px; font-weight:900;">深層ボーナス</span>
                </div>
                <div style="font-size:11.5px; color:#fde68a; line-height:1.4; margin-top:2px;">
                  ✨ <b>深層ボーナス:</b> 宝箱の激レア出現率 <b>+15% UP</b> & 獲得ゴールドUP！<br>
                  💀 <b>階層ボスまで:</b> あと<b>${bossRemain}階</b> (深層エリア: ${nextArea.name})<br>
                  <span style="color:#f87171; font-weight:bold;">⚠️ 途中で力尽きると、今ある未保管品は全て失われます。</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // VIEW: DOOR SELECT (毎階2〜3個の扉・部屋の選択肢)
      else if (state.screen === 'door_select') {
        const area = getCurrentArea();
        let doorsHtml = state.currentDoors.map((d, i) => `
          <div class="door-card danger-${d.risk}" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectDoor(${i})}" onclick="selectDoor(${i})">
            <div class="door-icon">${d.icon}</div>
            <div class="door-info">
              <div class="door-sign">
                <span>${d.sign}</span>
                <span class="door-risk risk-${d.risk}">${d.riskText}</span>
              </div>
              <div class="door-desc">${d.desc}</div>
            </div>
            <div style="font-size:18px; color:var(--gold);">❯</div>
          </div>
        `).join('');

        vp.innerHTML = `
          ${getUnclaimedLootBarHtml()}
          <div class="scene-box">
            <div class="scene-art">🚪</div>
            <div class="scene-title">地下 ${state.floor} 階: 通路の分岐</div>
            <div class="scene-text">
              暗闇の先から異なる気配が漂っている。どの通路を進むか選択せよ。<br>
              <b style="color:var(--gold);">※安全帰還は5階ごとの転移門のみ可能です。</b>
            </div>
          </div>
          <div class="door-grid">
            ${doorsHtml}
          </div>
        `;
      }

      // VIEW: BATTLE (戦闘)
      else if (state.screen === 'battle') {
        const e = state.currentEnemy;
        const eHpPct = Math.max(0, Math.min(100, (e.hp / e.maxHp) * 100));
        const skillInfo = getEquippedSkillInfo();
        const smokeCount = state.inventory.filter(i => i.type === 'escape_item').length;
        const statusLabels={poison:'☠️ 毒',bleed:'🩸 出血',paralysis:'⚡ 麻痺',bind:'🕸️ 拘束',curse:'🔮 呪い',weakened:'⬇️ 弱体'};
        const statuses=[...Object.entries(state.statusEffects).filter(([,v])=>v>0).map(([k,v])=>`${statusLabels[k]} ${v}T`),...(state.playerPoisonTurns>0?[`☣️ 呪毒 ${state.playerPoisonTurns}T`]:[]),...(state.effectSeal?.turns>0?[`📖 効果封印 ${state.effectSeal.turns}T`]:[])].join(' / ');
        vp.innerHTML = `
          ${getUnclaimedLootBarHtml()}
          <div class="scene-box">
            <div class="scene-art">${e.icon}</div>
            <div class="scene-title">${e.name}</div>
            <div class="enemy-card ${e.isBoss ? 'boss' : ''}">
              <div class="enemy-header">
                <span>HP: ${e.hp} / ${e.maxHp}</span>
                <span class="enemy-intent-badge">${e.pendingAction || '構え'}</span>
              </div>
              <div class="hp-bar-bg" style="height:10px;">
                <div class="hp-bar-fill" style="width:${eHpPct}%; background:linear-gradient(90deg,#991b1b,#ef4444);"></div>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:11px; color:#cbd5e1; margin-top:2px;">
                <span>攻撃力: ${e.obscured?'記憶が曖昧':e.atk}</span>
                <span>防御力: ${e.gimmick==='shield_barrier'&&state.bossBarrier ? e.def * 3 + ' (障壁)' : e.def}${e.gimmick==='mother_tree'&&state.bossAdds>0?' / 根：最終被ダメ-50%':''}</span>
              </div>
              ${state.camp.lab >= 1 && e.traitName ? `<div style="font-size:10.5px;color:#7dd3fc;margin-top:4px;">🔬 ${e.traitName}：${e.hint}</div>` : ''}
              ${Object.values(state.equipped).some(i => i?.archetype === 'thunder') ? `<div style="font-size:10.5px;color:#facc15;">⚡ 雷チャージ ${state.thunderCharges}/3（3で追加30ダメージ＆スタン）</div>` : ''}
              <div style="font-size:10.5px;color:${state.guardStamina <= 30 ? '#f87171' : '#93c5fd'};">🛡️ GUARD ${state.guardStamina}/100 ${state.guardFatigue >= 2 ? `⚠️ 疲労${state.guardFatigue}` : ''}</div>
              ${statuses ? `<div style="font-size:10.5px;color:#fca5a5;">${statuses}</div>` : ''}
            </div>

            <!-- Combat Actions -->
            <div class="combat-actions" style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; width:100%; margin-top:6px;">
              <button class="btn btn-red" onclick="playerCombatAction('attack')">⚔️ 通常攻撃</button>
              <button class="btn btn-purple" onclick="playerCombatAction('heavy')">💥 強攻撃</button>
              <button class="btn btn-blue" onclick="playerCombatAction('defend')">🛡️ 防御</button>
              <button class="btn btn-gold" ${state.skillCooldown > 0 || state.statusEffects.paralysis > 0 ? 'disabled' : ''} onclick="playerCombatAction('skill')">✨ ${skillInfo.name}${state.statusEffects.paralysis > 0 ? '（麻痺封印）' : state.skillCooldown > 0 ? `（あと${state.skillCooldown}T）` : ''}</button>
              ${e.gimmick==='mother_tree' && state.bossAdds>0 ? `<button class="btn btn-green" style="grid-column:1/-1;" onclick="playerCombatAction('attack_roots')">🌿 守護根を破壊（残り${state.bossAdds}）</button>`:''}
              ${e.gimmick==='rising_water' ? `<button class="btn btn-blue" style="grid-column:1/-1;" onclick="playerCombatAction('drain_water')">🚰 排水する（水位${state.waterLevel}%）${state.waterLevel>=70?' 回避-20% / スキルCT+1':''}</button>`:''}
              ${smokeCount > 0 && !e.isBoss ? `<button class="btn btn-sub" style="grid-column:1 / -1;" onclick="escapeBattleWithSmoke()">💨 煙玉で逃走（残り${smokeCount}）</button>` : ''}
              ${e.isBoss && e.gimmick === 'shield_barrier' && state.bossBarrier ? `
                <button class="btn btn-purple" style="grid-column:1 / -1;" onclick="playerCombatAction('disrupt_barrier')">
                  ⚡ ルーン障壁を解除する (好機!)
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }

      // VIEW: EVENT
      else if (state.screen === 'event') {
        const ev = state.currentEvent;
        prepareEventChoices(ev);
        let choicesHtml = ev.choices.map((c, i) => `
          <button class="btn btn-sub" style="text-align:left; justify-content:flex-start; padding:12px;" onclick="chooseEvent(${ev.inputId},${i})">
            ▶ ${c.text}
          </button>
        `).join('');

        vp.innerHTML = `
          ${getUnclaimedLootBarHtml()}
          <div class="scene-box">
            <div class="scene-art">${ev.icon}</div>
            <div class="scene-title">${ev.title}</div>
            <div class="scene-text">${ev.text}</div>
            <div style="display:flex; flex-direction:column; gap:8px; width:100%; margin-top:8px;">
              ${choicesHtml}
            </div>
          </div>
        `;
      }

      renderSubPanel();
      if(state.chapter){const banner=state.screen==='town'?chapterTownHtml():tutorialBanner();if(banner)vp.insertAdjacentHTML('afterbegin',banner);}
      if(typeof syncLobbyScreen==='function')syncLobbyScreen();
      if(typeof renderCombatReadout==='function')renderCombatReadout();
      syncActionButtons();
    }

    function renderSubPanel() {
      const panel = document.getElementById('sub-panel');
      const stats = getPlayerStats();

      if (state.activeTab === 'equip') {
        // Equipment slots & Synergies
        const slots = EQUIPMENT_SLOTS;

        let synHtml = stats.activeSyn.length > 0
          ? stats.activeSyn.map(s => `<div class="synergy-tag">${s.name}: ${s.desc}</div>`).join('')
          : '<div style="font-size:11px; color:#94a3b8;">発動中のシナジーなし（特定の装備組み合わせで発動）</div>';

        let equipHtml = slots.map(s => {
          const item = state.equipped[s.k];
          return `
            <div class="item-row ${item ? 'r-' + item.rarity : ''}">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:18px;">${item ? item.icon : s.icon}</span>
                <div>
                  <div class="item-name">${s.label}：${item ? item.name : '（未装備）'}</div>
                  ${item ? `<div style="font-size:10px">${effectDescription(item.effects)||item.desc||''}</div><button class="btn btn-sub btn-xs" onclick="unequipItem('${s.k}')">解除</button>${state.screen==='town'&&state.camp.blacksmith>=2?`<button class="btn btn-gold btn-xs" ${item.refineCount>=10?'disabled':''} onclick="refineEquippedItem('${s.k}')">${item.refineCount>=10?'MAX +10':`強化 ${getRefineCost(item)}G`}</button>`:''}`:''}
                  <div class="item-stats">${item ? getItemStatSummary(item) : s.label}</div>
                  ${item && item.isCurse ? `<div class="item-curse-note">⚠️ 呪詛: ${item.desc}</div>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');

        panel.innerHTML = `
          <div style="font-size:12px; font-weight:bold; color:var(--gold); margin-bottom:4px;">発動中装備シナジー:</div>
          <div class="synergy-list">${synHtml}</div>
          <div style="font-size:11px">${equipmentSynergies().join('<br>')}<br>総能力：攻${stats.atk} / 防${stats.def} / HP${stats.maxHp} / 会心${stats.crit}%<br>${effectDescription(equipmentEffects())}</div>
          <div style="font-size:12px; font-weight:bold; color:#fff; margin:8px 0 4px;">現在の装備品:</div>
          <div style="display:flex; flex-direction:column; gap:4px;">${equipHtml}</div>
        `;
      } else if (state.activeTab === 'bag') {
        const isTown = (state.screen === 'town');
        const list = isTown ? state.storage : state.inventory;
        const title = isTown ? `地上倉庫：装備 ${vaultUsed()}/${state.camp.vaultSize}枠 ／ 素材 ${materialKinds()}種類（枠不要）` : `探索バッグ (${list.length}個)`;

        let controlsHtml = '';
        if (isTown) {
          controlsHtml = `
            <div style="background:rgba(0,0,0,0.35); padding:6px; border-radius:6px; margin-bottom:8px; display:flex; flex-direction:column; gap:4px;">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;">
                <span style="color:#cbd5e1; font-weight:bold;">🗂️ 倉庫整理:</span>
                <div style="display:flex; gap:4px;">
                  <button class="btn btn-sub btn-xs" style="padding:2px 6px; font-size:10px;" onclick="sortStorage('rarity')">★ レア順</button>
                  <button class="btn btn-sub btn-xs" style="padding:2px 6px; font-size:10px;" onclick="sortStorage('atk')">⚔️ 威力順</button>
                  <button class="btn btn-sub btn-xs" style="padding:2px 6px; font-size:10px;" onclick="sortStorage('type')">📦 種別順</button>
                </div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; border-top:1px solid rgba(255,255,255,0.06); padding-top:4px;">
                <span style="color:var(--gold); font-weight:bold;">💰 現在の表示条件で一括売却:</span>
                <div style="display:flex; gap:4px;">
                  <button class="btn btn-sub btn-xs" style="padding:2px 6px; font-size:10px;" onclick="bulkSellStorage('Common')">Common一括</button>
                  <button class="btn btn-gold btn-xs" style="padding:2px 6px; font-size:10px;" onclick="bulkSellStorage('Rare')">Rare以下一括</button>
                  <button class="btn btn-gold btn-xs" style="padding:2px 6px; font-size:10px;" onclick="bulkSellStorage('Epic')">Epic以下一括</button>
                </div>
              </div>
            </div>
          `;
        }

        if (isTown) controlsHtml += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">${[['all','装備・道具'],['weapon','武器'],['head','頭'],['armor','胴'],['arms','腕'],['legs','脚'],['accessory','アクセ'],['material','素材'],['consumable','消耗品']].map(([key,label]) => `<button class="btn btn-${storageCategory === key ? 'gold' : 'sub'} btn-xs" onclick="setStorageCategory('${key}')">${label}</button>`).join('')}</div>`;
        if(isTown)controlsHtml+=warehouseControls();
        const baseRows=isTown?getStorageRows(list,storageCategory).filter(r=>storageCategory!=='all'||r.it.type!=='material'):[];
        if(isTown&&storageCategory==='material'&&state.abyssCores>0)baseRows.push({it:{...MATERIALS.abyss_core,key:'abyss_core',type:'material',currency:true},idx:-1,count:state.abyssCores});
        const allRows = isTown ? filteredWarehouseRows(baseRows) : list.map((it,idx) => ({it,idx,count:1}));
        if(isTown){warehouseFilters.page=Math.max(0,Math.min(warehouseFilters.page,Math.ceil(allRows.length/24)-1));controlsHtml+=`<div class="forge-actions"><button class="btn btn-sub btn-xs" ${warehouseFilters.page===0?'disabled':''} onclick="warehouseFilters.page--;renderSubPanel()">前へ</button>${warehouseFilters.page+1}/${Math.max(1,Math.ceil(allRows.length/24))}<button class="btn btn-sub btn-xs" ${(warehouseFilters.page+1)*24>=allRows.length?'disabled':''} onclick="warehouseFilters.page++;renderSubPanel()">次へ</button></div>`;}
        const rows=isTown?allRows.slice(warehouseFilters.page*24,warehouseFilters.page*24+24):allRows;
        let listHtml = rows.length === 0
          ? '<div style="font-size:11px; color:#94a3b8; text-align:center; padding:20px;">アイテムはありません</div>'
          : rows.map(({it, idx, count}) => {
            if(it.currency)return `<div class="item-row"><div>${uiEscape(it.name)} ×${count} [${it.rarity}]${materialSourceHtml(it.key)}</div><button class="btn btn-sub btn-xs" onclick="openMaterialDetail('${it.key}')">入手先・用途</button></div>`;
            const diffs = getEquipComparison(it);
            let diffHtml = '';
            if (diffs.length > 0) {
              diffHtml = `
                <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:2px;">
                  ${diffs.map(d => `
                    <span class="diff-${d.status}" style="font-size:10px; padding:1px 4px; border-radius:3px;">
                      ${d.label} ${d.from}→${d.to} ${d.status === 'up' ? '↑' : (d.status === 'down' ? '↓' : '')}
                    </span>
                  `).join('')}
                </div>
              `;
            }

            const sellPrice = getItemSellPrice(it);

            return `
              <div class="item-row r-${it.rarity}">
                <div style="display:flex; align-items:center; gap:6px;">
                  <button class="btn btn-sub btn-xs" style="padding:3px 5px; font-size:11px;" onclick="toggleLockItem(${idx}, ${isTown})" title="${it.locked ? '保護中 (ロック)' : '未ロック'}">
                    ${it.locked ? '🔒' : '🔓'}
                  </button>
                  <span style="font-size:16px;">${it.icon}</span>
                  <div>
                    <div class="item-name">${it.name}${it.type === 'material' ? ` ×${count}` : ''} <span style="font-size:9px; opacity:0.8;">[${it.rarity}]</span></div>
                    <div class="item-stats">${getItemStatSummary(it)}</div>
                    ${diffHtml}
                    ${isTown&&it.type==='material'?materialSourceHtml(it.key):''}
                    ${isTown&&it.type==='material'&&MATERIALS[it.key]?`<button class="btn btn-sub btn-xs" onclick="openMaterialDetail('${it.key}')">入手先・用途</button>`:''}
                    ${isTown&&['weapon','armor','accessory'].includes(it.type)?`<details><summary>特殊効果も比較</summary>${compareEquipmentHtml(state.equipped[equipmentSlot(it)],it)}</details>`:''}
                  </div>
                </div>
                <div style="display:flex; gap:4px; align-items:center;">
                  ${isTown ? `
                    <button class="btn btn-gold btn-xs" style="padding:3px 6px; font-size:10px;" ${!canSellStoredItem(it) ? 'disabled title="装備中またはロック中"' : ''} onclick="sellItemFromStorage(${idx})">
                      売却 (${sellPrice}G)
                    </button>
                  ` : ''}
                  ${['weapon', 'armor', 'accessory'].includes(it.type) ? `
                    <button class="btn btn-sub btn-xs" onclick="equipItem(${idx}, ${isTown})">装備</button>
                    ${it.type==='accessory'?`<button class="btn btn-sub btn-xs" onclick="equipItem(${idx}, ${isTown}, 'accessory')">アクセ1</button><button class="btn btn-sub btn-xs" onclick="equipItem(${idx}, ${isTown}, 'accessory2')">アクセ2</button>`:''}
                  ` : ''}
                  ${it.type === 'potion' ? `
                    <button class="btn btn-green btn-xs" onclick="usePotion(${idx})">使う</button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('');

        panel.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; font-weight:bold; color:#fff; margin-bottom:6px;">
            <span>${title}</span>
          </div>
          ${controlsHtml}
          <div style="display:flex; flex-direction:column; gap:4px;">${listHtml}</div>
        `;
      } else if (state.activeTab === 'codex') {
        // 図鑑 (Codex)
        const totalItems = Object.keys(UNIQUE_ITEMS).length + 12;
        const knownItems = Object.keys(state.codex.items).length;
        const rarityOrder = ['Common','Rare','Epic','Legendary','Mythic','Abyssal'];
        const rarityNames = { Common:'一般級', Rare:'希少級', Epic:'英雄級', Legendary:'伝説級', Mythic:'神話級', Abyssal:'深淵級' };
        const uniqueValues = Object.values(UNIQUE_ITEMS);
        const rarityCollectionHtml = rarityOrder.map(r => {
          const total = uniqueValues.filter(i => i.rarity === r && !i.bossUnique).length;
          const found = Object.values(state.codex.items).filter(i => i.rarity === r).length;
          return `<div class="item-row r-${r}" style="padding:5px 8px;"><span class="item-name">${rarityNames[r]} ${r}</span><b>${found}/${total || '∞'}</b></div>`;
        }).join('');
        const upperCatalogHtml = uniqueValues.filter(i => ['Mythic','Abyssal'].includes(i.rarity)).map(i => {
          const found = state.codex.items[i.name];
          return `<div class="codex-item ${found ? '' : 'locked'}"><span>${found ? i.icon : '❔'}</span><div><b class="${found ? 'item-name' : ''}">${found ? i.name : '？？？？？？？'}</b><div style="font-size:10px;color:#94a3b8;">${found ? i.desc : `${i.rarity} 未発見`}</div></div></div>`;
        }).join('');
        const upperHistoryHtml = (state.rarityProgress.upperDropHistory || []).map(h => `<div style="font-size:10px;color:#cbd5e1;padding:3px 0;">${h.rarity === 'Abyssal' ? '🌌' : '💠'} ${h.itemName} / B${h.floor}F / ${h.source} / GREED ${h.greed} / ${new Date(h.date).toLocaleString()}</div>`).join('');
        const enemyList = Object.values(state.codex.enemies).map(e => `
          <div class="codex-item"><span>${e.icon}</span><div><b style="color:${e.isBoss ? '#f87171' : '#7dd3fc'};">${e.name}</b>
          <div style="font-size:10px;color:#cbd5e1;">${state.camp.lab >= 1 ? `HP ${e.maxHp || '?'} / 攻 ${e.atk || '?'} / 防 ${e.def || '?'}${e.traitName ? ` / ${e.traitName}: ${e.hint || ''}` : ''}` : '研究所Lv1で詳細解放'}</div></div></div>`).join('');
        const loreList = LORE_RECORDS.map(l => {
          const unlocked = state.codex.lore[l.id];
          return `
            <div class="codex-item ${unlocked ? '' : 'locked'}">
              <span>📜</span>
              <div>
                <b style="color:${unlocked ? '#fbbf24' : '#64748b'};">${unlocked ? l.title : '？？？ (未解読の記録)'}</b>
                <div style="font-size:10px; color:#cbd5e1; margin-top:2px;">${unlocked ? l.text : '深層を探索して発見せよ'}</div>
              </div>
            </div>
          `;
        }).join('');

        panel.innerHTML = `
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold; color:var(--gold); margin-bottom:6px;">
            <span>深淵図鑑 & 記録</span>
            <span>収集率: ${knownItems}種</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;">${rarityCollectionHtml}</div>
          ${materialCodexHtml()}
          <div style="font-size:11px;font-weight:bold;color:#f9a8d4;margin-bottom:4px;">超希少装備コレクション:</div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:160px;overflow:auto;">${upperCatalogHtml}</div>
          ${upperHistoryHtml ? `<details style="margin:7px 0;"><summary style="font-size:11px;color:#67e8f9;">初発見記録</summary>${upperHistoryHtml}</details>` : ''}
          <div style="font-size:11px; font-weight:bold; color:#fff; margin-bottom:4px;">地下の記録 (ロア):</div>
          <div style="display:flex; flex-direction:column; gap:4px; max-height:130px; overflow-y:auto;">
            ${loreList}
          </div>
          <div style="font-size:11px;font-weight:bold;color:#fff;margin:8px 0 4px;">遭遇した敵（研究所解析）:</div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:150px;overflow-y:auto;">${enemyList || '<div style="font-size:10px;color:#64748b;">まだ敵と遭遇していません</div>'}</div>
        `;
      } else if (state.activeTab === 'log') {
        const logHtml = state.logs.map(l => `
          <div style="font-size:11px; padding:2px 0; border-bottom:1px solid rgba(255,255,255,0.04); color:${
            l.type === 'danger' ? '#f87171' : (l.type === 'gold' ? '#fbbf24' : (l.type === 'heal' ? '#4ade80' : '#cbd5e1'))
          };">
            <span style="opacity:0.5;">[${l.time}]</span> ${l.msg}
          </div>
        `).join('');

        panel.innerHTML = `
          <div style="font-size:12px; font-weight:bold; color:#fff; margin-bottom:4px;">冒険の軌跡</div>
          <div style="display:flex; flex-direction:column; gap:2px;">${logHtml || '<div style="font-size:11px; color:#94a3b8;">記録なし</div>'}</div>
        `;
      }
      if(typeof refreshLobbyFacility==='function')refreshLobbyFacility();
    }
