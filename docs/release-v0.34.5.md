# v0.34.5 正式採用・最終回帰

探索強化24種（維持6／調整12／差替6）、最大8枠・交換制を現仕様で正式採用。効果の追加調整なし。v0.34.0〜0.34.5のUI・鍛冶場導線・施設進行解禁・探索強化を含む。

## 最終回帰

以下18ページが成功（失敗修正後の再実行を含む）。

- test_summons.html / test_summon_growth.html / test_summon_mikoto.html
- test_part_break.html / test_input_combat.html / test_party_exp.html
- test_companion_continuity.html / test_responsive_ui.html
- test_expedition_candidates.html / test_expedition_redesign.html
- test_ux_priority.html / test_battle2.html / test_forge_learning.html
- test_ui_v034.html / test_ui_v034_flows.html / test_recipe_favorite.html
- test_awakening_reset.html / test_synergies.html

1531装備・47タグ・25完成ビルド、保存・読込、主人公／エルナ独立、召喚、鍛冶場、探索、戦闘、部位破壊、施設解禁を確認。探索候補200回・交換・依存関係・安全上限の回帰を含む。

740×360、844×390、932×430、1366×768、1920×1080で表示・操作を確認。各サイズ3回の回転／ホーム復帰を実施。隔離Chromeによる確認であり、iPhone Safari／Android実機の検証ではない。ユーザーの実セーブは使用・変更していない。

## リリース前の最小修正

- PCの召喚・召喚結果モーダルのフッターボタン高さ43pxを44pxへ補正。
- レスポンシブ回帰の重なり判定から、閉じたdetails内の非表示部位選択を除外。実際に表示中の要素は引き続き検査。
- git diff --check 成功。

未参照の作業用画像とエルナ制作パーツ位置変更は今回の公開対象外として保持。
