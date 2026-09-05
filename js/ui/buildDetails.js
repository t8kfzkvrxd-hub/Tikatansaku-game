const BUILD_AUDIT_RULES={
 lifesteal:['有効与ダメージ時','基本4%。装備値加算→背水HP50%未満+5pt→会心×1.2→出血×1.25＋装備出血吸血→上限25%→ボス半減。回復は最大HP8%まで。ボス経過ターン等で抑制','healFromWeaponDamage'],
 bleed:['命中時30%（status併用55%）','出血+1、上限5（装備で増加）。毎ターン最大HP×0.5%×蓄積、上限40ダメージ。蓄積-1','buildHit / buildStatusTick'],
 poison:['命中時30%（status併用55%）','毒3T。毎ターンmax(3,敵最大HP1.5%)。毒特効倍率は装備effects側','buildHit / equipmentPoisonTick'],
 fire:['命中時30%（status併用55%）','炎上+1、上限5。継続ダメージ式は出血と同じ','buildHit / buildStatusTick'],
 freeze:['命中時30%（status併用55%）','凍結+1、上限5。継続中、敵行動前25%でスタン（ボス10%）。毎ターン蓄積-1','buildHit / buildStatusTick'],
 shock:['命中時30%（status併用55%）','感電+1。感電対象へ攻撃補正+10%、追加攻撃率25%→45%','buildHit / buildAttack'],
 curse:['命中時30%（status併用55%）','呪い+1。敵攻撃ダメージを蓄積×3%、最大15%軽減','buildHit / buildIncomingDamage'],
 crit:['攻撃計算時','会心率+15pt。凍結対象はさらに+15pt。会心時吸血率×1.2','buildAttack'],
 multiHit:['3命中ごと','ATK20%の連撃ダメージ','buildHit'],singleStrike:['命中数0,3,6…で強攻撃','ATK補正+50%','buildAttack'],
 lowHp:['HP35%未満','ATK補正+20%。別途HP50%未満で吸血率+5pt','buildAttack / healFromWeaponDamage'],highHp:['HP90%以上','ATK補正+20%。shield併用かつHP満タンでさらに+15%','buildAttack'],
 shield:['戦闘ごとの初回被弾','最大HP5%の障壁を付与してダメージ吸収','buildIncomingDamage'],guard:['防御中の被弾','既存防御後のダメージ×0.9。ガード成功回復+2HP','buildIncomingDamage / equipmentEffects'],
 justGuard:['大技へのJUST GUARD成功','装備集計へ次撃補正+30%。既存JUST判定時に攻撃バフへ反映','equipmentEffects / enemyTurn'],counter:['防御で反撃準備後の次の攻撃','ATK補正+20%、攻撃すると準備消費','buildIncomingDamage / buildAttack'],
 reflect:['被弾時','障壁等の処理後ダメージ15%を反射、最大20。敵HPは最低1残る','buildIncomingDamage'],dodge:['被弾の回避判定','回避率+8pt。装備値合算後45%上限','equipmentEffects / enemyTurn / companionReceiveAttack'],
 break:['部位を狙って命中','部位破壊力×1.3。武器種・強攻撃倍率・装備固定値を別途適用。統合前の部位素材寄与8%→22%（補正後はレア度順で上限調整）、特定部位は敵ATK/DEF低下。強攻撃では敵DEF-3も適用','partBreakPower / hitEnemyPart / materialDropPlan'],
 boss:['ボスを攻撃','ATK補正+20%','buildAttack'],mob:['ボス以外を攻撃','ATK補正+20%','buildAttack'],status:['状態異常付与判定','タグ付与率30%→55%。毒も付与。装備の独立した毒抽選とは別','buildHit'],statusHunter:['毒またはタグ状態異常中の敵を攻撃','ATK補正+20%。呪い対象は蓄積×5%、最大30%追加','buildAttack'],
 conversion:['炎上蓄積がある敵への命中','炎上を同量の感電へ変換（上限5）。炎上なしでは変換しない','buildHit'],hybrid:['命中時','ATK×5%×min(3,1＋タグ状態異常種類数)の独立した追加ダメージ','buildHit'],
 normalAttack:['通常攻撃時のみ','ATK補正+30%','buildAttack'],heavyAttack:['強攻撃時のみ','ATK補正+30%','buildAttack'],skillPower:['スキル攻撃時のみ','ATK補正+20%。装備スキル威力補正は別乗算。summon併用時は分身威力+20%','buildAttack / buildHit'],skillHaste:['スキル使用後','CT短縮+1T。主人公基礎2T／エルナ基礎3T、最短1T','equipmentEffects / playerCombatAction / companionTurn'],
 onKill:['生存参加中に敵を撃破','最大HP3%回復。探索中1体以上撃破後はATK補正+20%','buildKill / buildAttack'],longFight:['敵の経過ターン数4以上','ATK補正+20%。poison併用＋毒対象では経過×4%、最大40%追加','buildAttack'],burst:['敵の経過ターン数0〜1','ATK補正+20%','buildAttack'],overheal:['吸血が最大HPを超える時','余剰回復を障壁へ。最大HP15%上限','healFromWeaponDamage'],onHurt:['当該戦闘で実HPダメージを受けた後','ATK補正+20%','buildIncomingDamage / buildAttack'],unhurt:['当該戦闘で未被弾','ATK補正+20%','buildAttack'],
 pierce:['攻撃計算時','敵DEF35%（四捨五入）をATKへ加算。完全防御無視ではない','buildAttack'],defDown:['命中時','敵DEF-1、最低0','buildHit'],speed:['2命中ごと','ATK10%の速撃。行動間隔は変わらない','buildHit'],extraAttack:['命中時25%（感電対象45%）','ATK20%の追加ヒット。装備extraChance加算後65%上限','buildHit'],followUp:['状態異常中の敵への命中','ATK20%を予約し、敵行動前に追撃','buildHit / buildStatusTick'],summon:['4命中ごと','影の分身がATK35%で攻撃。装備summonPowerとskillPowerタグ20%を合算、倍率補正上限100%','buildHit'],
 farming:['敵撃破時','統合前の素材確率寄与+8pt。生存同行者と装備補正を合算、寄与50%上限（補正後はレア度順で上限調整）。部位破壊＋生存参加者farmingで統合前のレア素材寄与+5pt','equipmentEffects / dropMonsterMaterials'],rareMaterial:['敵撃破時','統合前のレア素材確率寄与+8pt。生存同行者と装備値合算、寄与25%上限（補正後はレア度順で上限調整）。未解禁レア度は出ない','equipmentEffects / dropMonsterMaterials'],chest:['素材報酬生成時（enemy以外）','Rare以上の基準率を品質値に応じ倍率補正（品質10で1.1倍）。生存同行者と階層補正を合算、最大1.5倍。採取等も対象。最終的にレア度順の上限を適用、確定報酬は変更しない','createMaterialReward / partyChestQuality'],safe:['被弾時','戦闘ダメージ×0.95。探索イベントの直接HP減少は対象外','buildIncomingDamage'],deep:['61F以降の攻撃','ATK補正+20%','buildAttack'],abyssal:['500F以降の攻撃（現在未解放）','ATK補正+20%。現行200F内では発動しない・未完成','buildAttack']
};
const BUILD_OLD_DESCRIPTIONS={...BUILD_RULE_TEXT};
for(const [tag,row]of Object.entries(BUILD_AUDIT_RULES))BUILD_RULE_TEXT[tag]=row[0]+'：'+row[1];
BUILD_CATALOG.safe='被ダメージ軽減';BUILD_CATALOG.chest='素材報酬品質';
function buildItemDetails(item){return `<details class="build-detail"><summary>ビルド効果・発動条件</summary><p>主＝主要用途、副＝シナジー分類。固定効果の倍率差はありません。同タグは1回、装備effectsの数値は加算（各上限あり）。</p>${[...buildTags({item})].map(t=>`<p><b>${BUILD_CATALOG[t]}</b>：${uiEscape(BUILD_RULE_TEXT[t])}</p>`).join('')}</details>`;}
function buildView(id,action='attack'){
 const m=partyMember(id);if(!m)return null;
 const slots=characterEquipment(id),tags=buildTags(slots),runtime=m.unit.buildRuntime||{hits:0,hurt:0,kills:0,charge:0,shield:0},enemy=state.screen==='battle'&&state.currentEnemy?state.currentEnemy:{def:0,turnCount:0};
 return {...m,slots,tags,runtime,enemy,conditions:buildConditions(m.stats,enemy,action,m.unit.hp,runtime)};
}
function openBuildDetails(id='player'){
 const v=buildView(id);if(!v)return;const e=equipmentEffects(v.slots),rate=buildLifestealValues(v.unit,v.stats,v.enemy,v.slots);
 const conditions=v.conditions;
 const preview=['attack','heavy','skill'].map((action,i)=>{const stats={...v.stats};buildAttack(stats,v.enemy,action,v.slots,v.unit.hp,{...v.runtime});return `${['通常','強攻撃','スキル'][i]}：タグ適用ATK ${v.stats.atk}→${stats.atk} / 会心 ${stats.crit}%`;}).join('<br>');
 showChapterModal(`${combatName(id)}：ビルド詳細`,`<p>主・副は用途分類のみ。同じタグは1回、装備effectsは加算。攻撃補正群は合計+100%上限。以下は現在HP・敵に対する通常攻撃条件です（戦闘外は仮の通常敵）。</p><p>${preview}<br>装備固有条件・技倍率・敵DEF・会心上限の適用前です。</p><p>現在HP ${Math.round(v.unit.hp/v.stats.maxHp*100)}% / 経過ターン ${v.enemy.turnCount||0}</p><p>吸血 基本${rate.base}% + 装備${rate.equipment}% → 条件補正後${rate.conditional}% → 上限25%・ボス補正後${rate.rate}% → 抑制後${(rate.rate*rate.resistance).toFixed(2)}%<br>1回の回復は最大HP8%まで。会心時は別途再計算。</p><p>回避 ${Math.min(45,e.dodge||0)}% / CT短縮 ${e.skillHaste||0}T（最短1T）<br>合計装備効果：${uiEscape(effectDescription(e)||'なし')}</p>${[...v.tags].map(t=>`<section class="build-detail"><b>${BUILD_CATALOG[t]}</b> <span class="build-state ${conditions[t]?'active':''}">${t in conditions?(conditions[t]?'条件成立':'未成立'):'条件時に判定'}</span><p>${uiEscape(BUILD_RULE_TEXT[t])}</p></section>`).join('')||'<p>ビルドなし</p>'}`,`<button class="btn btn-sub" onclick="closeGenericModal()">閉じる</button>`);
}
function battleBuildHtml(id){const v=buildView(id);if(!v)return '';return `<button class="build-mini" aria-label="${combatName(id)}のビルド詳細" onclick="event.stopPropagation();openBuildDetails('${id}')">詳細</button><div class="build-chips">${[...v.tags].sort((a,b)=>Number(b in v.conditions)-Number(a in v.conditions)).slice(0,3).map(t=>`<span class="build-state ${v.conditions[t]&&v.unit.hp>0?'active':''}">${v.conditions[t]&&v.unit.hp>0?'✦ ':''}${BUILD_CATALOG[t]}${t in v.conditions?(v.conditions[t]&&v.unit.hp>0?' 発動':' 待機'):' 条件時'}</span>`).join('')}</div>`;}
