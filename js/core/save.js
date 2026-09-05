    function saveState() {
      try {
        const d = {
          camp: state.camp,
          vaultGold: state.vaultGold,
          abyssCores: state.abyssCores,
          deepCrystals: state.deepCrystals,
          storage: state.storage,
          equipped: state.equipped,
          characterLevelVersion: 1,
          codex: state.codex,
          bounty: state.bounty,
          preparedItems: state.preparedItems || [],
          preparedBuffs: state.preparedBuffs || { chestRareBonus: 0, goldMult: 1.0 },
          expeditionPolicy: state.expeditionPolicy || 'normal',
          bossFirstKills: state.bossFirstKills || {}
          ,mystery: state.mystery
          ,starterPerk: state.starterPerk
          ,rarityProgress: state.rarityProgress
          ,craftProgress: state.craftProgress
          ,chapter: state.chapter
          ,maxUnlockedFloor: state.maxUnlockedFloor
          ,deepestFloorReached: state.deepestFloorReached
          ,runRecords: state.runRecords
          ,selectedStartFloor: state.selectedStartFloor
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(d));
      } catch (e) {}
    }

    function loadState() {
      try {
        const s = localStorage.getItem(SAVE_KEY);
        if (s) {
          const p = JSON.parse(s);
          state.camp = Object.assign(state.camp, p.camp || {});
          // Ensure vaultLevel and vaultSize separation
          if (state.camp.vaultLevel === undefined || isNaN(state.camp.vaultLevel)) {
            state.camp.vaultLevel = Math.max(1, Math.round(((state.camp.vaultSize || 20) - 20) / 10) + 1);
          }
          state.camp.vaultSize = 20 + (state.camp.vaultLevel - 1) * 10;

          state.vaultGold = p.vaultGold || 0;
          state.abyssCores = p.abyssCores || 0;
          state.deepCrystals = Number(p.deepCrystals) || 0;
          state.storage = p.storage || [];
          state.equipped = p.equipped || { weapon: null, armor: null, accessory: null };
          state.codex = Object.assign(state.codex, p.codex || { items: {}, enemies: {}, lore: {} });
          if (p.bounty) state.bounty = Object.assign(state.bounty, p.bounty);
          state.preparedItems = p.preparedItems || [];
          state.preparedBuffs = p.preparedBuffs || { chestRareBonus: 0, goldMult: 1.0 };
          state.expeditionPolicy = p.expeditionPolicy || 'normal';
          state.bossFirstKills = p.bossFirstKills || {};
          state.mystery = Object.assign(state.mystery, p.mystery || {});
          if (!p.mystery) {
            state.mystery.keyOwned = state.storage.some(i => i.key === 'ancient_key');
            state.mystery.eggHatched = state.storage.some(i => i.key === 'dragon_hatchling');
            state.mystery.crownAwakened = state.storage.some(i => i.awakened && String(i.key).includes('crown'));
          }
          state.starterPerk = p.starterPerk || null;
          state.rarityProgress = Object.assign(state.rarityProgress, p.rarityProgress || {});
          state.craftProgress = { materials: {}, recipes: {}, crafted: {}, ...(p.craftProgress || {}) };
          state.maxUnlockedFloor = Math.max(1, Number(p.maxUnlockedFloor) || 1);
          state.deepestFloorReached = Number(p.deepestFloorReached) || 0;
          state.runRecords = Object.assign(state.runRecords, p.runRecords || {});
          state.selectedStartFloor = [1,...BOSS_FLOORS.map(f=>f+1).filter(f=>f<=MAX_DUNGEON_FLOOR)].includes(Number(p.selectedStartFloor)) ? Number(p.selectedStartFloor) : 1;

          // Normalize legacy saves so string/null levels cannot break buttons or MAX checks.
          ['blacksmith','shop','tavern','lab'].forEach(key => {
            state.camp[key] = Math.max(1, Math.min(FACILITY_CONFIG[key].maxLevel, Number(state.camp[key]) || 1));
          });
          state.camp.vaultLevel = Math.max(1, Math.min(FACILITY_CONFIG.vault.maxLevel, Number(state.camp.vaultLevel) || 1));
          state.camp.vaultSize = 20 + (state.camp.vaultLevel - 1) * 10;
        } else {
          initStarterItems();
        }
      } catch (e) {
        initStarterItems();
      }
      migrateEquipment();
      let savedChapter=null;try{savedChapter=JSON.parse(localStorage.getItem(SAVE_KEY)||'null')?.chapter;}catch(e){}
      migrateChapter(savedChapter);
      let savedProgress=null;try{savedProgress=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(e){}
      migrateCharacterLevels(savedProgress);
      state.maxUnlockedFloor=Math.min(MAX_DUNGEON_FLOOR,Math.max(1,state.deepestFloorReached,...Object.keys(state.bossFirstKills).filter(f=>state.bossFirstKills[f]).map(f=>Number(f)+10)));
      if(!canWarpTo(state.selectedStartFloor))state.selectedStartFloor=1;
    }

    function resetGameSave(reloadPage = true) {
      // Never use localStorage.clear(): only keys owned by this game are removed.
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem('ABYSS_TUTORIAL_SEEN');

      state = JSON.parse(JSON.stringify(INITIAL_STATE));
      initStarterItems();
      migrateChapter(null);
      migrateCharacterLevels(null);
      saveState();

      if (reloadPage) {
        window.location.reload();
      } else {
        closeGenericModal();
        updateHeader();
        render();
      }
    }
