# エルナ 2Dパーツ素材

画像ファイル名は英小文字＋ハイフンで統一します（例：`eye-left-open.png`）。

| フォルダ | 入れる画像 | ファイル名の例 |
| --- | --- | --- |
| `base/` | 全身基準画像、顔や髪を外したベース | `body-base.png` |
| `face/` | 目、眉、口、表情差分 | `eye-left-open.png`、`eye-left-half.png`、`eye-left-closed.png`、`mouth-closed.png`、`mouth-small.png` |
| `hair/` | 前髪、横髪、後ろ髪、編み込み、リボン | `bangs.png`、`side-hair-left.png`、`back-hair-center.png` |
| `body/` | 胴体、腕、手、袖、コート、ポーチ、チャーム | `arm-left-upper.png`、`hand-right.png`、`coat-left.png` |
| `legs/` | 腰、太もも、すね、ブーツ、スカート、下半身衣装 | `thigh-left.png`、`boot-right.png` |

各フォルダの空の `.gitkeep` はGitでフォルダを保持するための管理用ファイルです。
現段階では素材の読み込みやアニメーションは実装しません。

不足補完4枚の最新採用判定は `metadata/four-sheet-review.md` を参照してください。基準デザインとの相違があり、採用PNG数は22枚のままです。

`source/` は原本の無変更コピーです。`base/elna-reference.png` は正面全身の比較用コピーです。
切り出し済み22パーツ（衣装相違の胴体候補1枚を含む）の寸法・出典座標・透明余白は `metadata/parts.json`、最新の不足と注意事項は `metadata/latest-review.md` を参照してください。過去の確認は `metadata/review.md` と `metadata/phase-review.md` に保持しています。
`metadata/extract-parts.py` は標準Pythonのみで原画素を保持して再抽出する管理用ツールです。既存ファイルと内容が異なる場合は上書きせず停止します。
