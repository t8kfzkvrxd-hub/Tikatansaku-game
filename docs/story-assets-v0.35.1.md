# ストーリー画像接続（ローカル v0.35.1）

v0.35.0 の台詞・チュートリアル・10F帰還・書庫・セーブ処理を維持し、表示だけ更新。
GitHub push は行っていない。27表情stateを登録、**安全に分離できた25枚を接続、主人公2表情は保留**。

## 元画像と分離結果

すべて `assets/` 直下の原本を保持。キャラシートは1774×887 RGBA PNG、alpha 0〜255。
各表情は下表のディレクトリに `表情名.png` として保存した。
共通保存先は `assets/story/characters/`。

| 原画像 | ディレクトリ | 作成した表情 |
|---|---|---|
| エルナ立ち絵1.png | elna | normal, smile, worried |
| エルナ立ち絵２.png | elna | serious, sad, fear |
| エルナ立ち絵３.png | elna | empty, cry, angry |
| player立ち絵１.png | player | normal, smile, confused |
| player立ち絵２.png | player | shock のみ。serious / angry は保留 |
| player立ち絵３.png | player | sad, fear, empty |
| 酒場主人立ち絵.png | tavern_master | normal, serious, exasperated |
| 鍛冶場立ち絵.png | blacksmith | normal, confident, serious |
| 道具屋立ち絵.png | item_shopkeeper | normal, smile, worried |

単純等分ではなく透明な隙間に沿った境界を使用。alpha 1〜3 のほぼ透明なフリンジは
片側へ割り当て、色・alpha を変更しない。人物の不透明な輪郭は切断しない。
25枚は共通684×919キャンバス、上下左右16px以上の透明余白、元の画素スケールを維持。
切り出した全有色画素のRGBA一致、PNG再読込、透明余白をスクリプトで検証。

原本のSHA-256、サイズ、切り出し矩形、出力ハッシュは `assets/story/manifest.json`。
再現用 `assets/story/build-assets.py`（Pillow / NumPy）。原本13枚は処理前後でハッシュ一致。

## 背景割当

4枚は画像内容を確認し、無加工コピー。`assets/story/backgrounds/` 以下。

| 原画像 | コピー先 | 会話シーン |
|---|---|---|
| 酒場背景.png | tavern.png | 帰還後の酒場・町イベント末尾 |
| 鍛冶場背景.png | forge.png | 鍛冶場・新装備の確認 |
| 倉庫背景.png | warehouse.png | 倉庫案内 |
| 道具屋背景.png | item-shop.png | 道具屋案内 |

探索中は従来の坑道／帰還門、冒頭は従来の拠点背景。
CSS `object-fit:cover`、中央基準。背景読込時0.3秒フェード、reduced-motionでは停止。

## 表情と配置

- 主人公：通常は左、エルナは右。
- NPC会話：左にエルナ（主人公の独白中だけ主人公）、右に実際の話者NPC。
- 発話中brightness(1)、非話者brightness(.6)、切替0.15秒。通常とREPLAYは共通描画。
- 1〜10F：エルナ normal / smile / serious / worried。主人公 normal / smile / confused（serious指定はnormal代替）。fear / empty / cryは序盤で使用していない。
- 町：酒場主人 normal / exasperated / serious、鍛冶屋 normal / confident / serious。
- 道具屋店主3表情は登録・表示テスト済み。ただし現行台本に店主の台詞はない。既存の酒場主人の台詞を店主へ変更せず、ストーリー本編には店主を追加していない。
- 既存のエルナ22発言と戦闘時の発言を維持。台詞、話者、順序の変更0件。

台本部分（`js/data/mainStory.js` 3行目以降）SHA-256は変更前後とも
`7a857e3e2c0a20852ef6809807340dcbe7a9213813c7c02d02559e6bd8aeffc8`。

## フォールバック

- 未登録／未分離表情はnormalを参照（不要な404を発生させない）。
- 表情ファイル実欠損時もnormalへ一度だけ切替。
- normalも欠損した場合は立ち絵を非表示、配置枠は保持。会話操作は継続。
- 背景実欠損時は専用画像を隠し、既存シーン背景を表示。
- 画像読み込みのコールバックは表示だけ変更し、進行・報酬・保存処理を呼ばない。

## テスト結果

| 検査 | 結果 |
|---|---|
| test_story_assets.html | 171項目 PASS：25PNG・4背景・登録27state・全台詞の話者とSTORY/REPLAY表示一致・欠損fallback |
| test_main_story.html | 65項目 PASS：新規1F→10F→町施設→装備→自由行動、旧セーブ、回想、帰還二重報酬防止等 |
| 740×360 / 844×390 / 932×430 | Chromeスマホ相当エミュレーション：顔と本文の非重複、画像読込、44px操作、横スクロールなし |
| 1366×768 / 1920×1080 | Chrome PC：画像・話者・各施設背景・クリック正常 |
| 各サイズの回転／再読み込み | 3回ずつ、合計15セットで矩形一致 |
| ブラウザバー相当の高さ40px減 | 各サイズで操作部が画面内 |
| 6シーン×5解像度 | 30画面の矩形検査PASS、スクリーンショットで主要シーン・全解像度の見た目確認 |
| reduced-motion | 画像フェード停止、操作継続 |
| 原画像 | 13枚ハッシュ不変、25出力の画素一致 |
| git diff --check | PASS |

スマホの確認はエミュレーション。iPhone Safari / Android Chrome実機の回転、実際のブラウザバー挙動、低速回線での初回体感は未確認。

## 残課題（未完了部分）

1. `player/serious.png` と `player/angry.png`：シート下端で手袋と隣の衣装が接触し、透明な境界がない。不透明な人物輪郭を切る必要があるため未作成。現在normal代替。2表情が分離された元画像が必要。
2. 元シートですでに切れている上端の髪・左右端の袖などは復元していない。元画像由来のごく薄い色にじみも改変していない。
3. 道具屋店主を実際に発言させることは台本変更になるため、この画像接続作業では実施していない。
4. 追加アセットは約27MB。全枚先読みはせず表示画像だけ読み込むが、実機・低速回線確認は必要。

## 主な変更ファイル

- `assets/story/`（25立ち絵・4背景・原本/出力manifest・分離スクリプト）
- `js/ui/storyAssets.js`（画像・表情・話者対応、フォールバック）
- `js/data/mainStory.js`（表情登録だけ拡張、台本不変）
- `js/systems/mainStory.js`（renderMainStoryの画像接続だけ）
- `story-ui.css`（専用背景層・フェード・欠損画像枠）
- `index.html`（表示ヘルパー読み込み）
- `js/core/config.js`（開発規則に従い画像更新版v0.35.1と更新案内）
- `test_story_assets.html`
