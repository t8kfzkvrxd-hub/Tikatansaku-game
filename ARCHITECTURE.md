# 段階整理後の構成

通常の HTML/CSS/classic JavaScript を読み込む。ビルド・npm は不要。
`index.html` の script 順序を維持し、初期化は DOMContentLoaded 後に行う。

| 配置 | 責務 |
| --- | --- |
| `js/core/config.js` | バージョン・更新履歴・階層・施設・神殿の設定、セーブキー |
| `js/core/state.js` | 初期 state と初期化用スナップショット |
| `js/core/save.js` | 既存の保存・読み込み・初期化処理 |
| `js/data/areas.js` | 1〜60Fのエリア・敵・ボスの既存定義 |
| `js/data/equipment.js` | 固定装備・シリーズシナジー |
| `js/data/lore.js` | 既存ロア |
| `js/data/craftingCatalog.js` | エリアからの素材・基本レシピ生成 |
| `js/systems/dungeon.js` | エリア取得、部屋生成・選択 |
| `js/systems/battle.js` | 敵生成・行動・戦闘・討伐報酬 |
| `js/systems/statusEffects.js` | プレイヤー状態異常のターン処理 |
| `js/ui/render.js` | ヘッダー、地上・戦闘・倉庫・図鑑表示 |
| `js/ui/itemPresentation.js` | 実際に使用されていた装備説明関数 |

## 既存ファイルとの関係

- `chapter-data.js` は AREAS に61〜100Fを追加する。その後 `craftingCatalog.js` が全エリアから素材・レシピを生成する。
- `crafting.js` は既存クラフト処理を保持。`equipment.js` は装備計算・移行と追加レシピ生成を保持する。
- `forge-ui.js` は完成したレシピ一覧から検索索引・逆引きを生成する。データ追加はその読み込みより前に行う。
- `chapter-story.js`、`chapter-system.js`、`companion-equipment.js`、`depth-rules.js` は既存の連携を維持する。
- onclick と相互参照がある公開関数は改名・private化していない。名前空間への移行は別段階で行う。

## 保存と互換性

セーブキー、JSON項目、移行手順、初期値は変更しない。
`test_structure.py` は今回抽出した主要コードが整理前の内容と一致することと、読み込み順序を検査する。
開発者向け検査であり、GitHub Pages の実行依存ではない。

## 残りの分離候補

1. index.html内の施設・帰還／戦利品処理と対応モーダル。
2. index.html内の音声・CSS・イベント・初期化。
3. render.js内の倉庫／図鑑と地上／戦闘UI。
4. equipment.js内の追加装備生成と計算、chapter-system.js内の物語進行と表示。

敵・ボスはAREAS内の関連データとして維持する。別レジストリへの二重管理や、内容変更を伴う階層条件の置換は今回行っていない。
