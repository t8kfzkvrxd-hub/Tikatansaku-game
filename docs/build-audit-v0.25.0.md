# v0.25.0 全47 buildTag 実動作監査

評価は修正後。A＝現行仕様の実処理と代表数値条件を確認、B＝部分実装、C＝タグのみ、D＝不具合。

- A: 46 / B: 1 / C: 0 / D: 0
- 既存BUILD_TIERSのA/B/Cは装備カタログの設計区分で、この監査評価とは別。
- B: abyssal。500F条件の計算テストは成功するが、現行上限200Fのため通常プレイでは発動不可。将来エリアは追加していない。
- すべての装備組合せ・全乱数・全敵を網羅した証明ではない。数値単体テストと既存の実戦処理回帰テストを組み合わせた監査。

## 修正

- 戦闘開始時、主人公／同行者の命中数・被弾数・障壁・反撃準備をリセット。撃破数は探索内で継続。新規探索時は既存処理で初期化。
- statusHunter: 毒だけの敵も条件成立に修正。
- conversion: 炎上がないのに感電を生成していた処理を修正。
- onKill: 生存参加中のエルナにも撃破回復・撃破後強化を一度だけ適用。
- chest: 生存同行者の品質補正を接続。farming: 部位破壊時の追加レア抽選も同行者を評価。
- hybrid: 独立したダメージ種別を表示。summon: 専用ログ・SUMMON数字・影風のプレートを表示。
- 吸血の表示と回復計算をbuildLifestealValuesへ共通化。
- breakの説明を正式な部位耐久・素材・弱体化へ更新。
- safe表示名は「被ダメージ軽減」、chestは「素材報酬品質」。speedは既存「速撃」、pierceは既存「防御貫通」、summonは既存「影の分身」を維持。

## 共通経路

タグ定義: js/data/weaponBuilds.js の BUILD_CATALOG。付与: js/data/catalogRevision.js / buildBalance.js / craftingCatalog.js / extendedAreas.js。
集計: js/systems/weaponBuildSystem.js の buildTags（Set）。別名 blood→lifesteal、desperate→lowHp、skill→skillPower、thunder→shock。
主・副・tags・setTag・一部固有効果由来のタグは同じ固定効果。主／副の内部倍率差なし。
装備effectsは equipment.js の equipmentEffects で加算。同タグ3個でも吸血固定4%、装備2%＋3%は5%加算を確認。
主人公: equipmentAttackStats→buildAttack、equipmentHit→buildHit、enemyTurn→buildIncomingDamage。
エルナ: companionTurn / companionReceiveAttackから同じ共通関数へ、自分のslots・HP・runtimeを渡す。
ターン: equipmentPoisonTick→buildStatusTick。撃破: onEnemyKilled→buildKill・dropMonsterMaterials。
装備・セーブ形式を変更せず、既存アイテムを再保存／置換しない。

## テスト方法

test_build_audit.html: 47件の代表数値・条件境界、等間隔1000乱数値による確率境界確認、固定seed独立抽選1000回、素材／宝箱各1000回比較。
固定seed値は各抽選を再現可能にするためのもの。実プレイヤーの保存領域ではなく隔離ブラウザで実行。
test_build_visibility.html: 実UI操作、エルナJUST後+30%、実被弾判定で回避80/1000、実スキルCT3→2、戦闘間リセット、条件発光、分身演出、閲覧による保存変更なし。
既存 test_build_balance.html / test_input_combat.html / test_part_break.html / test_combat_ui.html が成功。
PC 1366×768・1920×1080、スマホ相当740×360・844×390・932×430。スマホ実機は未確認。

## 47件一覧

| Tag | 表示名 | 評価 |
|---|---|---|
| lowHp | 低HP背水 | A |
| highHp | 高HP維持 | A |
| normalAttack | 通常攻撃特化 | A |
| heavyAttack | 強攻撃特化 | A |
| skillPower | スキル火力 | A |
| singleStrike | 一撃特化 | A |
| boss | ボス特攻 | A |
| mob | 雑魚殲滅 | A |
| statusHunter | 状態異常特攻 | A |
| longFight | 長期戦 | A |
| burst | 短期決戦 | A |
| onHurt | 被弾時強化 | A |
| unhurt | ノーダメージ強化 | A |
| counter | カウンター | A |
| deep | 深層特化 | A |
| abyssal | Abyssal特化 | B |
| pierce | 防御貫通 | A |
| crit | 会心 | A |
| bleed | 出血 | A |
| poison | 毒 | A |
| fire | 炎上 | A |
| freeze | 凍結 | A |
| shock | 感電 | A |
| curse | 呪い | A |
| status | 状態異常蓄積 | A |
| multiHit | 連撃 | A |
| speed | 速撃 | A |
| summon | 影の分身 | A |
| extraAttack | 追加攻撃 | A |
| followUp | 追撃 | A |
| conversion | 属性変換 | A |
| hybrid | 属性複合 | A |
| defDown | 敵DEF低下 | A |
| lifesteal | 吸血 | A |
| overheal | オーバーヒール | A |
| shield | シールド | A |
| safe | 被ダメージ軽減 | A |
| guard | ガード | A |
| reflect | 反射 | A |
| dodge | 回避 | A |
| justGuard | ジャストガード | A |
| skillHaste | スキル回転 | A |
| onKill | 撃破時強化 | A |
| break | 部位破壊 | A |
| farming | 素材ドロップ特化 | A |
| rareMaterial | レア素材特化 | A |
| chest | 素材報酬品質 | A |

## 個別根拠・数値

### lowHp / 低HP背水 — A

- 監査前の説明：HP35%未満で攻撃強化
- 発動条件：HP35%未満
- 実際の効果：ATK補正+20%。別途HP50%未満で吸血率+5pt
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js) / [healFromWeaponDamage](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### highHp / 高HP維持 — A

- 監査前の説明：HP90%以上で攻撃強化
- 発動条件：HP90%以上
- 実際の効果：ATK補正+20%。shield併用かつHP満タンでさらに+15%
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### normalAttack / 通常攻撃特化 — A

- 監査前の説明：通常攻撃を強化
- 発動条件：通常攻撃時のみ
- 実際の効果：ATK補正+30%
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→130 ATK（条件なし→あり）

### heavyAttack / 強攻撃特化 — A

- 監査前の説明：強攻撃を強化
- 発動条件：強攻撃時のみ
- 実際の効果：ATK補正+30%
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→130 ATK（条件なし→あり）

### skillPower / スキル火力 — A

- 監査前の説明：スキル攻撃を強化
- 発動条件：スキル攻撃時のみ
- 実際の効果：ATK補正+20%。装備スキル威力補正は別乗算。summon併用時は分身威力+20%
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js) / [buildHit](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### singleStrike / 一撃特化 — A

- 監査前の説明：強攻撃の周期的な一撃補正
- 発動条件：命中数0,3,6…で強攻撃
- 実際の効果：ATK補正+50%
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→150 ATK（条件なし→あり）

### boss / ボス特攻 — A

- 監査前の説明：ボスへの攻撃補正
- 発動条件：ボスを攻撃
- 実際の効果：ATK補正+20%
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### mob / 雑魚殲滅 — A

- 監査前の説明：ボス以外への攻撃補正
- 発動条件：ボス以外を攻撃
- 実際の効果：ATK補正+20%
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### statusHunter / 状態異常特攻 — A

- 監査前の説明：状態異常中の敵へ攻撃補正
- 発動条件：毒またはタグ状態異常中の敵を攻撃
- 実際の効果：ATK補正+20%。呪い対象は蓄積×5%、最大30%追加
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### longFight / 長期戦 — A

- 監査前の説明：4ターン以降に攻撃補正
- 発動条件：敵の経過ターン数4以上
- 実際の効果：ATK補正+20%。poison併用＋毒対象では経過×4%、最大40%追加
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### burst / 短期決戦 — A

- 監査前の説明：戦闘開始2ターンの攻撃補正
- 発動条件：敵の経過ターン数0〜1
- 実際の効果：ATK補正+20%
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### onHurt / 被弾時強化 — A

- 監査前の説明：被弾後に攻撃補正
- 発動条件：当該戦闘で実HPダメージを受けた後
- 実際の効果：ATK補正+20%
- 参照：[buildIncomingDamage](../js/systems/weaponBuildSystem.js) / [buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### unhurt / ノーダメージ強化 — A

- 監査前の説明：未被弾中に攻撃補正
- 発動条件：当該戦闘で未被弾
- 実際の効果：ATK補正+20%
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### counter / カウンター — A

- 監査前の説明：防御で反撃準備、次撃を強化
- 発動条件：防御で反撃準備後の次の攻撃
- 実際の効果：ATK補正+20%、攻撃すると準備消費
- 参照：[buildIncomingDamage](../js/systems/weaponBuildSystem.js) / [buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### deep / 深層特化 — A

- 監査前の説明：61F以降で攻撃補正
- 発動条件：61F以降の攻撃
- 実際の効果：ATK補正+20%
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### abyssal / Abyssal特化 — B

- 監査前の説明：500F以降で攻撃補正（将来用）
- 発動条件：500F以降の攻撃（現在未解放）
- 実際の効果：ATK補正+20%。現行200F内では発動しない・未完成
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→120 ATK（条件なし→あり）

### pierce / 防御貫通 — A

- 監査前の説明：敵DEFの35%をATKへ加算する貫通補正
- 発動条件：攻撃計算時
- 実際の効果：敵DEF35%（四捨五入）をATKへ加算。完全防御無視ではない
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：DEF100: ATK100→135

### crit / 会心 — A

- 監査前の説明：会心率上昇。凍結対象は追加会心
- 発動条件：攻撃計算時
- 実際の効果：会心率+15pt。凍結対象はさらに+15pt。会心時吸血率×1.2
- 参照：[buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：会心+15pt、等間隔1000抽選150回

### bleed / 出血 — A

- 監査前の説明：命中時に出血蓄積。出血中の敵への装備補助
- 発動条件：命中時30%（status併用55%）
- 実際の効果：出血+1、上限5（装備で増加）。毎ターン最大HP×0.5%×蓄積、上限40ダメージ。蓄積-1
- 参照：[buildHit](../js/systems/weaponBuildSystem.js) / [buildStatusTick](../js/systems/weaponBuildSystem.js)
- 数値テスト：300/1000付与（等間隔乱数）。 / 固定seed独立抽選 295/1000

### poison / 毒 — A

- 監査前の説明：毒付与と毒対象への特攻
- 発動条件：命中時30%（status併用55%）
- 実際の効果：毒3T。毎ターンmax(3,敵最大HP1.5%)。毒特効倍率は装備effects側
- 参照：[buildHit](../js/systems/weaponBuildSystem.js) / [equipmentPoisonTick](../equipment.js)
- 数値テスト：300/1000付与（等間隔乱数）。 / 固定seed独立抽選 295/1000

### fire / 炎上 — A

- 監査前の説明：命中時に炎上蓄積・継続ダメージ
- 発動条件：命中時30%（status併用55%）
- 実際の効果：炎上+1、上限5。継続ダメージ式は出血と同じ
- 参照：[buildHit](../js/systems/weaponBuildSystem.js) / [buildStatusTick](../js/systems/weaponBuildSystem.js)
- 数値テスト：300/1000付与（等間隔乱数）。 / 固定seed独立抽選 295/1000

### freeze / 凍結 — A

- 監査前の説明：凍結蓄積で確率行動阻害。会心と連携
- 発動条件：命中時30%（status併用55%）
- 実際の効果：凍結+1、上限5。継続中、敵行動前25%でスタン（ボス10%）。毎ターン蓄積-1
- 参照：[buildHit](../js/systems/weaponBuildSystem.js) / [buildStatusTick](../js/systems/weaponBuildSystem.js)
- 数値テスト：300/1000付与（等間隔乱数）。 / 固定seed独立抽選 295/1000

### shock / 感電 — A

- 監査前の説明：感電中の敵への攻撃補正・追加攻撃連携
- 発動条件：命中時30%（status併用55%）
- 実際の効果：感電+1。感電対象へ攻撃補正+10%、追加攻撃率25%→45%
- 参照：[buildHit](../js/systems/weaponBuildSystem.js) / [buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：300/1000付与（等間隔乱数）。 / 固定seed独立抽選 295/1000

### curse / 呪い — A

- 監査前の説明：呪い蓄積で敵攻撃を軽減
- 発動条件：命中時30%（status併用55%）
- 実際の効果：呪い+1。敵攻撃ダメージを蓄積×3%、最大15%軽減
- 参照：[buildHit](../js/systems/weaponBuildSystem.js) / [buildIncomingDamage](../js/systems/weaponBuildSystem.js)
- 数値テスト：300/1000付与（等間隔乱数）。 / 固定seed独立抽選 295/1000

### status / 状態異常蓄積 — A

- 監査前の説明：状態異常付与率を上昇
- 発動条件：状態異常付与判定
- 実際の効果：タグ付与率30%→55%。毒も付与。装備の独立した毒抽選とは別
- 参照：[buildHit](../js/systems/weaponBuildSystem.js)
- 数値テスト：550/1000付与（等間隔乱数）。 / 固定seed独立抽選 529/1000

### multiHit / 連撃 — A

- 監査前の説明：3ヒットごとに連撃
- 発動条件：3命中ごと
- 実際の効果：ATK20%の連撃ダメージ
- 参照：[buildHit](../js/systems/weaponBuildSystem.js)
- 数値テスト：3命中目にATK20%=22

### speed / 速撃 — A

- 監査前の説明：2ヒットごとの速撃（行動間隔は変化しない）
- 発動条件：2命中ごと
- 実際の効果：ATK10%の速撃。行動間隔は変わらない
- 参照：[buildHit](../js/systems/weaponBuildSystem.js)
- 数値テスト：2命中目にATK10%=11

### summon / 影の分身 — A

- 監査前の説明：4ヒットごとに影の分身が攻撃
- 発動条件：4命中ごと
- 実際の効果：影の分身がATK35%で攻撃。装備summonPowerとskillPowerタグ20%を合算、倍率補正上限100%
- 参照：[buildHit](../js/systems/weaponBuildSystem.js)
- 数値テスト：4命中目にATK35%=39

### extraAttack / 追加攻撃 — A

- 監査前の説明：同じ命中処理内で確率追加ヒット
- 発動条件：命中時25%（感電対象45%）
- 実際の効果：ATK20%の追加ヒット。装備extraChance加算後65%上限
- 参照：[buildHit](../js/systems/weaponBuildSystem.js)
- 数値テスト：250/1000追加ヒット / 固定seed独立抽選 235/1000

### followUp / 追撃 — A

- 監査前の説明：状態異常中の敵へ敵行動前に追撃
- 発動条件：状態異常中の敵への命中
- 実際の効果：ATK20%を予約し、敵行動前に追撃
- 参照：[buildHit](../js/systems/weaponBuildSystem.js) / [buildStatusTick](../js/systems/weaponBuildSystem.js)
- 数値テスト：予約→敵行動前22ダメージ

### conversion / 属性変換 — A

- 監査前の説明：炎上蓄積を感電へ変換
- 発動条件：炎上蓄積がある敵への命中
- 実際の効果：炎上を同量の感電へ変換（上限5）。炎上なしでは変換しない
- 参照：[buildHit](../js/systems/weaponBuildSystem.js)
- 数値テスト：炎なし0 / 炎3→感電3

### hybrid / 属性複合 — A

- 監査前の説明：状態異常の種類数で複合ダメージ
- 発動条件：命中時
- 実際の効果：ATK×5%×min(3,1＋タグ状態異常種類数)の独立した追加ダメージ
- 参照：[buildHit](../js/systems/weaponBuildSystem.js)
- 数値テスト：異常0種：6ダメージ

### defDown / 敵DEF低下 — A

- 監査前の説明：命中ごとに敵DEFを削る
- 発動条件：命中時
- 実際の効果：敵DEF-1、最低0
- 参照：[buildHit](../js/systems/weaponBuildSystem.js)
- 数値テスト：DEF100→99

### lifesteal / 吸血 — A

- 監査前の説明：有効与ダメージから吸血。出血中の敵は吸血補正
- 発動条件：有効与ダメージ時
- 実際の効果：基本4%。装備値加算→背水HP50%未満+5pt→会心×1.2→出血×1.25＋装備出血吸血→上限25%→ボス半減。回復は最大HP8%まで。ボス経過ターン等で抑制
- 参照：[healFromWeaponDamage](../js/systems/weaponBuildSystem.js)
- 数値テスト：100ダメージ→4HP / 上限・ボス補正は共通計算

### overheal / オーバーヒール — A

- 監査前の説明：吸血の余剰回復を障壁化
- 発動条件：吸血が最大HPを超える時
- 実際の効果：余剰回復を障壁へ。最大HP15%上限
- 参照：[healFromWeaponDamage](../js/systems/weaponBuildSystem.js)
- 数値テスト：HP99→100、回復8の余剰7→障壁

### shield / シールド — A

- 監査前の説明：戦闘中一度だけHP5%の障壁
- 発動条件：戦闘ごとの初回被弾
- 実際の効果：最大HP5%の障壁を付与してダメージ吸収
- 参照：[buildIncomingDamage](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→95ダメージ

### safe / 被ダメージ軽減 — A

- 監査前の説明：被ダメージ5%軽減
- 発動条件：被弾時
- 実際の効果：戦闘ダメージ×0.95。探索イベントの直接HP減少は対象外
- 参照：[buildIncomingDamage](../js/systems/weaponBuildSystem.js)
- 数値テスト：100→95ダメージ

### guard / ガード — A

- 監査前の説明：防御時の追加軽減と回復
- 発動条件：防御中の被弾
- 実際の効果：既存防御後のダメージ×0.9。ガード成功回復+2HP
- 参照：[buildIncomingDamage](../js/systems/weaponBuildSystem.js) / [equipmentEffects](../equipment.js)
- 数値テスト：100→90ダメージ

### reflect / 反射 — A

- 監査前の説明：被ダメージの一部を反射
- 発動条件：被弾時
- 実際の効果：障壁等の処理後ダメージ15%を反射、最大20。敵HPは最低1残る
- 参照：[buildIncomingDamage](../js/systems/weaponBuildSystem.js)
- 数値テスト：被ダメ100→敵へ15反射

### dodge / 回避 — A

- 監査前の説明：回避率補正
- 発動条件：被弾の回避判定
- 実際の効果：回避率+8pt。装備値合算後45%上限
- 参照：[equipmentEffects](../equipment.js) / [enemyTurn](../js/systems/battle.js) / [companionReceiveAttack](../companion-equipment.js)
- 数値テスト：固定回避+8pt（共通集計）

### justGuard / ジャストガード — A

- 監査前の説明：大技を防御して次撃を強化
- 発動条件：大技へのJUST GUARD成功
- 実際の効果：装備集計へ次撃補正+30%。既存JUST判定時に攻撃バフへ反映
- 参照：[equipmentEffects](../equipment.js) / [enemyTurn](../js/systems/battle.js)
- 数値テスト：JUST後次撃補正30%（実被弾接続は既存戦闘回帰テスト）

### skillHaste / スキル回転 — A

- 監査前の説明：スキルCTを短縮
- 発動条件：スキル使用後
- 実際の効果：CT短縮+1T。主人公基礎2T／エルナ基礎3T、最短1T
- 参照：[equipmentEffects](../equipment.js) / [playerCombatAction](../js/systems/battle.js) / [companionTurn](../companion-equipment.js)
- 数値テスト：CT短縮1T（主人公2→1 / エルナ3→2）

### onKill / 撃破時強化 — A

- 監査前の説明：撃破時HP回復と以後の攻撃補正
- 発動条件：生存参加中に敵を撃破
- 実際の効果：最大HP3%回復。探索中1体以上撃破後はATK補正+20%
- 参照：[buildKill](../js/systems/weaponBuildSystem.js) / [buildAttack](../js/systems/weaponBuildSystem.js)
- 数値テスト：HP50→53、撃破数0→1

### break / 部位破壊 — A

- 監査前の説明：強攻撃で敵DEFを削る
- 発動条件：部位を狙って命中
- 実際の効果：部位破壊力×1.3。武器種・強攻撃倍率・装備固定値を別途適用。破壊素材抽選8%→22%、特定部位は敵ATK/DEF低下。強攻撃では敵DEF-3も適用
- 参照：[partBreakPower](../js/systems/partBreak.js) / [hitEnemyPart](../js/systems/partBreak.js) / [partRewardRolls](../js/systems/partBreak.js)
- 数値テスト：耐久ダメージ55→72。部位報酬8%→22%は既存専用テスト

### farming / 素材ドロップ特化 — A

- 監査前の説明：追加素材抽選率を上昇
- 発動条件：敵撃破時
- 実際の効果：追加素材抽選+8pt。生存同行者と装備補正を合算、50%上限。部位破壊＋生存参加者farmingで追加レア抽選+5pt
- 参照：[equipmentEffects](../equipment.js) / [dropMonsterMaterials](../crafting.js)
- 数値テスト：{"baseline":{"count":1000,"epic":50},"farm":{"count":1080,"epic":50}}

### rareMaterial / レア素材特化 — A

- 監査前の説明：追加レア素材抽選率を上昇
- 発動条件：敵撃破時
- 実際の効果：追加レア素材抽選+8pt。生存同行者と装備値合算、25%上限。未解禁レア度は出ない
- 参照：[equipmentEffects](../equipment.js) / [dropMonsterMaterials](../crafting.js)
- 数値テスト：{"baseline":{"count":1000,"epic":50},"rare":{"count":1080,"epic":130}}

### chest / 素材報酬品質 — A

- 監査前の説明：宝箱素材の品質抽選を補助
- 発動条件：素材報酬生成時（enemy以外）
- 実際の効果：品質抽選値-0.10。生存同行者と装備値合算。宝箱以外に採取等も対象。強制レア度は変更しない
- 参照：[createMaterialReward](../js/data/materialProgression.js) / [partyChestQuality](../js/data/materialProgression.js)
- 数値テスト：1000箱 Legendary 50→151

## 残課題

- abyssalは500F以降のプレイ環境が未実装。計算テストのみでAにしない。
- スマホ実機のSafari/Chromeでのフォント・描画性能は未検証。
- 確率試験は個々の抽選と代表的な併用条件。47タグ全組合せは網羅していない。
