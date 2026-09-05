    function getItemStatSummary(it) {
      if (!it) return '';
      let s = [];
      if (it.baseAtk) s.push(`攻+${it.baseAtk}`);
      if (it.baseDef) s.push(`防+${it.baseDef}`);
      if (it.hp) s.push(`HP+${it.hp}`);
      if (it.crit) s.push(`会心+${it.crit}%`);
      if (it.vamp) s.push(`吸血+${it.vamp}`);
      if (it.goldRate) s.push(`金+${it.goldRate}%`);
      if (it.rareRate) s.push(`幸運+${it.rareRate}%`);
      if (it.heal) s.push(`回復+${it.heal}`);
      if (it.affixName) s.push(`特性:${it.affixName}`);
      if (it.bossUnique) s.push('秘宝 / Boss Unique');
      return s.join(' | ') || it.desc;
    }

