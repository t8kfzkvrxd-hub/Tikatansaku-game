# 最新追加シート

対象：8f628a48-7268-4610-9f6b-0a3beaebb0ac.png。source内に追加がなく、elna直下の未登録3枚のうち更新日時が最新で説明内容と一致するものを選択。残り2枚は加工していない。

1536×1024、RGBA PNG、alpha 0〜254、完全透明541060画素。既存12原本とSHA-256は重複しない。顔、目口眉、髪、上半身、腕と袖と手の一体素材、腰脚、ブーツ、コート、小物を含む。

追加5枚：face-base、eye-left-half、eye-right-half、eye-left-closed、torso。原本RGBAを保持し16px透明余白追加。PNG再読込で画素一致、透明表示でラベル・枠線混入なしを確認。既存17枚は無変更。既存より高品質と確定できる置換品なし。既存の眉・口・右横髪・手・ブーツ・内スカート・ポーチと用途が重なる素材は増やさない。

torsoは基準画像と衣装が異なるため候補のみ。襟・胸の開き・ベルトなどが異なる。閉じ目／半目はシートの画面左→leftとして仮命名し、既存開眼への位置と左右の整合は未検証。

未採用：右閉じ目・前髪・中央後ろ髪の矩形候補は端に輪郭／隣接画素がかかる。横髪は編み込みやリボンが一体。腕・袖・手、腰・脚も一体化しており、要求された独立部位へ安全に矩形分割できない。残りの衣装も基準デザインと異なるため採用しない。

## 静止復元向けの不足（独立レイヤー方式）

- bangs.png
- side-hair-left.png
- back-hair-left.png
- back-hair-center.png
- back-hair-right.png
- braid.png
- ribbon-main.png
- arm-left-upper.png
- arm-left-lower.png
- arm-right-upper.png
- arm-right-lower.png
- hand-right.png
- pelvis.png
- thigh-left.png
- thigh-right.png
- shin-left.png
- shin-right.png
- skirt-center.png
- coat-front-left.png
- coat-front-right.png
- coat-back-left.png
- coat-back-right.png

腕は袖込み、スカート中央は必要な左右布込みで作れば、静止復元だけなら独立sleeveやskirt-left/rightは必須でない。首はface-baseに含まれる。既存ブーツ・眉・口・右横髪・左手・内スカートは再生成不要だが、縮尺と接合の確認は必要。

基準デザイン厳守の場合はtorso-reference.pngも必要（現torso.pngは比較候補として保持）。eye-right-closed.pngはまばたき用の不足であり、開眼の静止復元には必須でない。隙間補完の要否は静止復元後に判断するため、現段階で大量に作らない。

既存PNGと新規候補合わせて22枚（比較用全身・source除外）。静止復元・アニメーションは実装していない。
