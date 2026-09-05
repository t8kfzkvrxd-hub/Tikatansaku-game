    function processPlayerStatuses() {
      let damage=0;
      if (state.statusEffects.poison>0) { damage+=3+state.statusEffects.poison; state.statusEffects.poison--; }
      if (state.statusEffects.bleed>0) { damage+=Math.max(3,Math.round(state.maxHp*.04)); state.statusEffects.bleed--; }
      if (state.statusEffects.bind>0) state.statusEffects.bind--;
      if (state.statusEffects.paralysis>0) state.statusEffects.paralysis--;
      if (state.statusEffects.weakened>0) state.statusEffects.weakened--;
      if(state.statusEffects.curse>0){damage+=4;state.statusEffects.curse--;}
      if (damage>0) { state.hp-=damage;addLog(`状態異常によりHP-${damage}`,'danger');spawnFloatingFx(`-${damage}`,'damage'); }
      return damage;
    }

