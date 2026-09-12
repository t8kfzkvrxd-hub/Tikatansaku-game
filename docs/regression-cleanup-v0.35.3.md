# v0.35.3 公開前・旧回帰テスト整理

## 範囲

本番コード・画像・台詞・セーブキー・装備/素材/成長/召喚/ドロップ/ビルドの変更なし。テストと検証用文書のみを更新。バージョンは v0.35.3 を維持し、GitHub commit / push は行わない。

## 前回の残存4FAIL

| テスト / 失敗箇所 | 旧期待値 | 実際 | 原因・分類 | 修正対象 |
|---|---|---|---|---|
| `test_depth_rules.html` 万能薬解除 | `usePotion(0)`だけで全状態0・呪毒0 | 対象選択待ちで状態が残る | B：現在は主人公/エルナの対象を選択してから消費。C：負傷・非行動中の前提も必要 | テストのみ。選択前未消費→主人公を選択→解除/1個消費まで検証 |
| `test_exploration.html` effects exist | 演出DOMが固定3個 | 坑道は追加の火の粉を含み4個 | B：エリア別の演出データ拡張に追従していない | テストのみ。エリア定義との一致、非空、時間経過による表示変化を検証 |
| `test_landscape.html` 1920 viewport 使用可能 | 旧`#viewport`/`#sub-panel`がロビーでも高さ30px超 | 旧ルートは非表示 | B：ロビーは`#lobby-screen`へ移行済み | テストのみ。現行ルート、内部スクロール、モーダル、回転、safe-areaを検証 |
| `test_material_routes.html` door tap area 1920 | 旧`.door-card`が44px以上で押せる | 旧カードは非表示・矩形0 | B：探索2.0は`.exploration-route` | テストのみ。現行3択の数・戦闘枠・寸法・実ヒット領域を検証 |

4件の主分類はB。A（実ゲーム不具合）/D（実機能回帰）と断定されるものはなし。万能薬の追加前提はCとしても記録する。本番を旧仕様へ戻していない。

## 同時に更新した古い前提

- 旧章テスト：全/短/スキップで旧1〜9F固定扉、施設Lv購入、旧100F台本/退場の自動再生を要求していた。現在の旧セーブ互換・新台本への移行・通常ボス後進行・REPLAY不変性・階層クリア解禁へ更新。初回ストーリーは既存の専用テストで保持。
- 鍛冶/装備/酒場/研究所：`camp.*=2/5`だけでは解禁されない。実際のクリアフラグをfixtureに明記。正規の未解禁判定は維持。
- 素材：単品必須/常に入手という旧前提を独立抽選・bundleへ更新。確定枠は別に検証。採取成功テストは乱数固定。
- ビルド素材補正：1000等間隔抽選で、素材特化の総数1080→1095、レア補助のEpic80→153（Rareとの順序上限）。宝箱品質10はLegendary5%→5.5%。現在の式への検証更新であり、倍率変更ではない。
- 装備カタログ：旧43基礎武器→現53。全1531と既存ID保護、派生を含む全カタログへの到達を検証。
- ロビー：7施設→召喚込み8施設、260ms選択反応、SDの実タップ到達を検証。広い透明領域の矩形が重なるだけでは不具合扱いにしない。
- 探索遷移：260ms演出を200ms後に判定していたCを修正し350ms待つ。連打20回の検証は残す。
- 戦闘：短い「待機」スキル表示と無効状態を検証。防御疲労単体テストでは敵のランダムなエルナ狙い/回避を除外。深層の敵特性単体テストでは6ターン前に同行攻撃で標的を倒さない前提を明記。
- 音声：Chrome自動再生許可をテスト起動条件に明記し、実ファイルのdecode/play/loopを検証。実機の許可挙動とは区別。
- ランナー：`PASS`＋JSONの完了形式と`pass:false`を認識。未完了を成功にしない。

## 実行方式

`tests/run_html.py` / `tests/fixture.js` / `tests/README.md`を参照。
全58ページについて新規・30F旧セーブ・v0.35完了済み形式の読込preflightを行い、続く部品検証はストーリー完了/同行登録済みへ正規化する。
これは各単体ケースを冒頭モーダル表示中に実行する意味ではない。新規の通し進行は`test_main_story.html`、旧/完了済みの再案内防止・REPLAY中立性は`test_chapter.html`で別に実行する。
個人ブラウザや実プレイヤーの保存領域は使用しない。

## 最終結果

全58本×3保存形式＝174実行、174 PASS / 0 FAIL / 0 timeout。保存形式preflightも174件すべてPASS。
`python3 test_structure.py`：6項目PASS。`git diff --check`：PASS。
新規通し進行65項目、画像/REPLAY/fallback184項目、施設往復20回を含む施設64項目は、各保存形式の実行でもPASS。
原本15枚/出力27枚はmanifestのSHA-256と一致。台本のSHA-256も前回値`7a857e3e2c0a20852ef6809807340dcbe7a9213813c7c02d02559e6bd8aeffc8`と一致。
詳細な実行出力：`/private/tmp/v035-regression-matrix.json`。
指定5解像度（740×360 / 844×390 / 932×430 / 1366×768 / 1920×1080）のChromeエミュレーション確認も完了。
施設45チェック、主人公9表情/STORY/REPLAY/回転・再読込105チェック、ストーリー場面31チェックはすべてPASS。画像の目視でも会話・施設の操作領域と顔位置を確認した。実機iPhone/AndroidのブラウザUI挙動まで保証する結果ではない。

## 公開判断・別件の残課題

今回対象の4FAILと全回帰テストは解消。進行・保存を阻害する回帰は検出されていない。ただし「全ゲーム不具合0」とは判断しない。

画面の追加目視で、倉庫の素材説明に `undefined` が出る既存表示不具合を発見。新規1Fの通常敵から実際に得た `area_1_enemy_0_common` でも再現した。素材は正常に倉庫へ保存されるが、敵素材生成時にdescがなく、`getItemStatSummary()`の未定義値が一覧へ直接挿入される。今回の4FAILとは別件であり、対象外の本番変更を避けて未修正とした。

回帰の公開条件は満たすが、見た目も含めた無条件の公開推奨は保留。この小さな表示不具合を公開前に直すことを推奨する。GitHubへはpushしていない。

## 全58本の確定結果

| HTMLテスト | 新規形式 | 旧形式 | 完了済み形式 |
|---|---|---|---|
| test_awakening_reset.html | PASS | PASS | PASS |
| test_battle2.html | PASS | PASS | PASS |
| test_build_audit.html | PASS | PASS | PASS |
| test_build_balance.html | PASS | PASS | PASS |
| test_build_visibility.html | PASS | PASS | PASS |
| test_catalog_revision.html | PASS | PASS | PASS |
| test_chapter.html | PASS | PASS | PASS |
| test_character_hud.html | PASS | PASS | PASS |
| test_character_levels.html | PASS | PASS | PASS |
| test_character_sd.html | PASS | PASS | PASS |
| test_combat_ui.html | PASS | PASS | PASS |
| test_companion_continuity.html | PASS | PASS | PASS |
| test_crafting.html | PASS | PASS | PASS |
| test_deep_enemies.html | PASS | PASS | PASS |
| test_depth_rules.html | PASS | PASS | PASS |
| test_equipment.html | PASS | PASS | PASS |
| test_expedition_candidates.html | PASS | PASS | PASS |
| test_expedition_redesign.html | PASS | PASS | PASS |
| test_exploration.html | PASS | PASS | PASS |
| test_exploration_100.html | PASS | PASS | PASS |
| test_exploration_routes.html | PASS | PASS | PASS |
| test_extended_200.html | PASS | PASS | PASS |
| test_facility_art.html | PASS | PASS | PASS |
| test_forge_learning.html | PASS | PASS | PASS |
| test_game.html | PASS | PASS | PASS |
| test_home.html | PASS | PASS | PASS |
| test_home_life.html | PASS | PASS | PASS |
| test_input_combat.html | PASS | PASS | PASS |
| test_landscape.html | PASS | PASS | PASS |
| test_lobby.html | PASS | PASS | PASS |
| test_lobby_audio.html | PASS | PASS | PASS |
| test_lobby_presence.html | PASS | PASS | PASS |
| test_main_story.html | PASS | PASS | PASS |
| test_material_builds.html | PASS | PASS | PASS |
| test_material_rates.html | PASS | PASS | PASS |
| test_material_routes.html | PASS | PASS | PASS |
| test_part_break.html | PASS | PASS | PASS |
| test_party_exp.html | PASS | PASS | PASS |
| test_party_status.html | PASS | PASS | PASS |
| test_recipe_favorite.html | PASS | PASS | PASS |
| test_responsive_ui.html | PASS | PASS | PASS |
| test_return_portal.html | PASS | PASS | PASS |
| test_small_fixes.html | PASS | PASS | PASS |
| test_story_assets.html | PASS | PASS | PASS |
| test_summon_growth.html | PASS | PASS | PASS |
| test_summon_mikoto.html | PASS | PASS | PASS |
| test_summons.html | PASS | PASS | PASS |
| test_synergies.html | PASS | PASS | PASS |
| test_synergy_adjustments.html | PASS | PASS | PASS |
| test_synergy_audit.html | PASS | PASS | PASS |
| test_synergy_balance.html | PASS | PASS | PASS |
| test_synergy_three_builds.html | PASS | PASS | PASS |
| test_ui_v034.html | PASS | PASS | PASS |
| test_ui_v034_flows.html | PASS | PASS | PASS |
| test_update_modal.html | PASS | PASS | PASS |
| test_ux_friction.html | PASS | PASS | PASS |
| test_ux_priority.html | PASS | PASS | PASS |
| test_workshop.html | PASS | PASS | PASS |


## テンポは次回のUX候補

- 10F後の酒場→鍛冶場→倉庫→道具屋→装備が連続して長い：公開阻害の機能不具合ではなくUX改善候補。
- 施設案内中の「戻る」から次の案内へ進む：現行導線として機能。操作名の期待との差はv0.35.4以降に検討。
- 今回、台本・進行順・説明文の大幅改稿は行っていない。
