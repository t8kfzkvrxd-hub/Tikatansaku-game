# v0.33.0 装備シナジー

## 監査結果

正式ID 1,531、単品シナジー 1,531、未付与 0、主タグ未所属 0。47タグの既存核効果は再実装せず継続利用する。
変更前の個別数値effects空欄は56件。ただしタグ効果があるため「効果なし56件」ではない。主・副タグとeffectsが一致する既存グループは170組（1,312装備）。同一効果は派生段階や基礎性能まで同一という意味ではない。
全装備のID・名称・部位・レア度・武器種・タグ・effects・親子・覚醒・説明・追加ルールは test_synergy_audit.html からJSON出力可能。空effectsや重複は監査候補であり、自動的な不良判定ではない。

## 実装

- js/data/synergies.js: 47核プロファイル、部位・武器種・名称・既存効果・副タグ・レア度・派生段階による単品補助、25完成ビルド。
- js/systems/synergies.js: 装備定義参照、条件評価・集計上限・対象者解決・再帰しない追撃。
- js/ui/synergyUI.js / synergy-ui.css: 単品説明、完成一覧、不足タグ・部位、詳細。
- 既存攻撃・被弾・回避・吸血・撃破・部位耐久・素材効果集計へ接続。装備ID・基礎性能・レシピ・素材テーブル・セーブ形式は変更しない。
- 定義はitem.keyから参照する。旧所持品の書換えや1,531件のセーブ移行は不要。旧ランダム装備など正式カタログ外の品は従来効果を維持。
- 同タグはSet。完成にはタグ集合に加えて武器／防具／アクセ各1点以上が必要。
- Common/Rareの低HP・高HP・状態数・長期戦条件は厳しめで補助倍率が高い。派生には段階別の条件付き補助を追加。
- Mythic状態装備は主状態の上限を拡張（毒は延長可能な残りターン）。Abyssal吸血系は余剰50%障壁化。既存overhealの100%変換がある場合は重複加算しない。Abyssal状態系は上限付近の主命中で蓄積を消費して追加ダメージ。

## 上限・発動通知

新規補助の合算上限：攻撃35%（次撃込み）、会心20pt、軽減15%、部位耐久補正25%、吸血加算5pt。既存タグ攻撃群との合計は100%上限、吸血25%・1回最大HP8%・ボス半減とターン抑制、反射20ダメージ、障壁最大HP15%を維持。
追加ダメージは主命中からのみ。直接追加と分身はATK35%まで、予約追撃はATK15%まで。これらから再度命中判定は呼ばない。状態追加・消費にも上限と重複制御を適用。
主人公／エルナのslot参照で別々に判定し、表示プレビューは実状態を更新しない。装備変更で保持中の次撃補助を破棄。撃破補助だけ次戦へ持ち越し初撃で消費する（セーブへは保存しない）。戦闘ログはキャラ名・完成名付き、連続通知は制限。

## 完成ビルド25種

血の契約、不落の反攻、腐蝕連鎖、氷葬、解体屋、雷迅連鎖、影軍、絶対無傷、狂血、深層狩人、熾火の舞、呪刻の裁き、慈愛の障壁、鏡盾の報復、一刀断罪、詠唱循環、連戦狩人、黎明の一閃、双相錬成、万象疫禍、帰還の旅団、星鉱の鑑定士、不屈の歩み、風追い、奈落の盟約。

## 100F以内の構成例

Common/Rare/Epic、素材入手階・派生元を遡った製作条件、実際の7枠制約から23種の構成例を確認。必要なGや素材を集め、隠しレシピを発見する過程は必要。不屈の歩み／奈落の盟約は今回の早期条件では対象外。

- bloodPact: weapon=`gear_area_1_enemy_0_weapon` / armor=`kit_armor_lifesteal_0` / accessory=`kit_accessory_lowHp_0`
- bastion: weapon=`gear_area_1_enemy_1_weapon` / legs=`gear_area_1_enemy_1_legs` / accessory2=`kit_accessory_counter_0`
- corrosion: weapon=`gear_area_2_enemy_1_weapon` / legs=`kit_legs_longFight_0` / accessory2=`kit_accessory_statusHunter_0`
- iceTomb: weapon=`gear_area_5_enemy_1_weapon` / legs=`kit_legs_freeze_0` / accessory2=`support_followUp_accessory_2`
- dismantler: weapon=`gear_area_1_enemy_2_weapon` / head=`gear_area_1_enemy_1_head` / accessory2=`support_heavyAttack_accessory_2`
- thunderChain: weapon=`gear_area_1_enemy_1_weapon` / arms=`kit_arms_speed_0` / accessory2=`support_shock_accessory_2`
- shadowArmy: weapon=`iron_sword` / head=`support_followUp_head_0` / accessory2=`support_skillHaste_accessory_2`
- untouched: weapon=`gear_area_1_enemy_0_weapon` / legs=`kit_legs_unhurt_0` / accessory2=`kit_accessory_highHp_0`
- bloodFury: weapon=`forge_1_upper` / armor=`kit_armor_lifesteal_0` / accessory2=`kit_accessory_freeze_0`
- deepHunter: weapon=`gear_area_1_enemy_2_weapon` / legs=`kit_legs_normalAttack_0` / accessory2=`support_deep_accessory_0`
- embers: weapon=`gear_area_3_enemy_2_weapon` / arms=`kit_arms_speed_0` / accessory2=`support_multiHit_accessory_2`
- hexJudge: weapon=`gear_area_3_enemy_0_weapon` / head=`support_defDown_head_0` / accessory2=`kit_accessory_statusHunter_0`
- shelter: weapon=`vamp_dagger` / armor=`kit_armor_shield_0` / accessory2=`kit_accessory_overheal_0`
- avenger: weapon=`gear_area_1_enemy_1_weapon` / armor=`kit_armor_onHurt_0` / accessory2=`support_reflect_accessory_2`
- execution: weapon=`gear_area_2_enemy_0_weapon` / arms=`kit_arms_heavyAttack_0` / accessory2=`support_singleStrike_accessory_2`
- spellCycle: weapon=`iron_sword` / arms=`kit_arms_skillHaste_0` / accessory=`kit_accessory_lifesteal_0`
- chainHunter: weapon=`starter_w` / legs=`kit_legs_dodge_0` / accessory=`support_onKill_accessory_2`
- firstLight: weapon=`gear_area_5_enemy_1_weapon` / legs=`kit_legs_freeze_0` / accessory2=`support_burst_accessory_2`
- alchemist: weapon=`gear_area_1_enemy_1_weapon` / arms=`kit_arms_speed_0` / accessory2=`kit_accessory_conversion_0`
- plague: weapon=`gear_area_3_enemy_0_weapon` / head=`kit_head_farming_1` / accessory2=`kit_accessory_hybrid_0`
- caravan: weapon=`gold_blade` / head=`gear_area_1_enemy_1_head` / accessory=`support_chest_accessory_0`
- prospector: weapon=`gear_area_1_enemy_2_weapon` / head=`gear_area_1_enemy_1_head` / accessory2=`support_rareMaterial_accessory_0`
- endurance: 100F以内の構成は未確認（素材ゲート／部位制約）
- windChase: weapon=`gear_area_1_enemy_0_weapon` / legs=`gear_area_1_enemy_0_legs` / accessory2=`support_speed_accessory_0`
- abyssCovenant: 100F以内の構成は未確認（素材ゲート／部位制約）

## 47タグ分布（主タグ、変更前後同数）

| タグ | 装備数 |
| --- | ---: |
| lifesteal | 45 |
| bleed | 37 |
| poison | 55 |
| fire | 56 |
| freeze | 38 |
| shock | 35 |
| curse | 35 |
| crit | 46 |
| multiHit | 39 |
| singleStrike | 22 |
| lowHp | 59 |
| highHp | 38 |
| shield | 37 |
| guard | 65 |
| justGuard | 38 |
| counter | 36 |
| reflect | 22 |
| dodge | 39 |
| break | 61 |
| boss | 35 |
| mob | 26 |
| status | 27 |
| statusHunter | 24 |
| conversion | 24 |
| hybrid | 24 |
| normalAttack | 37 |
| heavyAttack | 39 |
| skillPower | 69 |
| skillHaste | 25 |
| onKill | 24 |
| longFight | 21 |
| burst | 22 |
| overheal | 23 |
| onHurt | 24 |
| unhurt | 27 |
| pierce | 23 |
| defDown | 23 |
| speed | 33 |
| extraAttack | 25 |
| followUp | 19 |
| summon | 18 |
| farming | 32 |
| rareMaterial | 18 |
| chest | 17 |
| safe | 21 |
| deep | 17 |
| abyssal | 11 |

## 検証

- test_synergies.html: 全定義、47核条件、25完成／解除、主人公・エルナ独立、バフ消費・装備変更、旧所持品保存、5解像度。
- test_synergy_balance.html: 23構成×3敵種×60ターン＝4,140ターンの条件負荷試験。現行80Fの通常HP431/ATK131/DEF41、エリート819/203/58、ボス4313/224/64を使用。プレイヤー側はATK100・最大HP400の検証用条件とし、敵HP・低HPを補充して長期条件を走らせる。実プレイの勝率シミュレーションではない。
- 観測最大：吸血32HP、反射20。各60ターンで敵行動52回以上。有限値・状態蓄積上限・追撃キュー消費を確認。Abyssal余剰障壁は別途実処理で確認。
- test_build_balance.html / test_build_visibility.html / test_game.html: 成功。
- Chromeエミュレーションで740×360・844×390・932×430・1366×768・1920×1080。回転／ホーム往復各3回、再読み込み各2回。本文内部スクロール・固定操作欄を確認。実機iPhone/Androidは未確認。
- 全7枠の全組合せの網羅、実プレイ全階層の勝率・DPS調整は未実施。極端な条件での長期バランスは継続検証が必要。
