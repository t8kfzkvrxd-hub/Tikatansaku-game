# 主人公単体表情接続 v0.35.3（ローカル）

| 表情 | 原本 | 保存先 |
|---|---|---|
| serious | assets/playerserious.png | assets/story/characters/player/serious.png |
| angry | assets/playerangry.png | assets/story/characters/player/angry.png |

2枚とも目視識別済みの1024×1536 RGBA PNG。透明画素あり、元alpha範囲0〜254。
縦横比維持で591×887へ縮小し、既存と同じ684×919キャンバスへ中央・下端16px余白で配置。
再描画、色補正、背景除去、3分割なし。元からあるポーズ・衣装の差は改変せず保持。
頭頂と下端を合わせたが、ポーズが違うため肩や顔の完全な画素位置一致ではない。

`storyAssets.js` の主人公unavailable指定だけを解除。読み込み失敗時のnormal→非表示という既存fallbackは維持。
台詞・表情割当・背景・進行・セーブキー・施設処理に変更なし。
元画像全15枚の記録ハッシュ一致。既存立ち絵25枚も更新前後のハッシュ一致。
台本（mainStory.js 3行目以降）SHA-256：
`7a857e3e2c0a20852ef6809807340dcbe7a9213813c7c02d02559e6bd8aeffc8`（変更なし）。

再生成用：`assets/story/build-player-singles.py`（既存25枚に書き込まない）。
全体のbuild-assets.pyからも最後に実行し、再ビルドで2表情が失われないようにした。

## 表示検証

- 740×360、844×390、932×430、1366×768、1920×1080：9表情×STORY/REPLAYの90表示で読み込み・誤fallbackなし・話者強調・画面内・横overflowなし。
- 各サイズ3回の再読み込み・縦横回転後、実際の「崩せる構え」のseriousをREPLAY表示：15回成功。
- スクリーンショットで5サイズの表示を確認。既存枠・CSSは変更していない。
- angryは現台本に割当なし。台詞や割当を追加せず、REPLAY用共通描画へ表情を渡すテストで検証。本編に新しいangry場面を追加したわけではない。
- スマホはChromeエミュレーション。iPhone Safari／Android実機は未確認。
- 回帰：test_story_assets.html 184項目、test_main_story.html 65項目、test_facility_art.html 64項目すべてPASS。実欠損時fallback、旧セーブ、回想、町施設接続を維持。git diff --checkもPASS。

GitHub commit／pushなし。
