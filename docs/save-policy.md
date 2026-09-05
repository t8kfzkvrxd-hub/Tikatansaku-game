# 保存と起動方針

通常ブラウザでの利用を前提とする。iPhoneではホーム画面への追加時に「Webアプリとして開く」をオフにする（設定が表示される場合）。コードから既存の独立WebアプリをSafariへ強制移行することはしない。別領域のセーブを推測・削除・上書きしない。

## 現状監査

- 本セーブの書き込み・読み込み・初期化は `js/core/save.js` の `saveState` / `loadState` / `resetGameSave` に集約済み。
- キーは `js/core/config.js` の固定値 `ABYSS_ROGUE_SAVED_V2`。URL由来のキーはない。保存形式はJSON、保存先はlocalStorage。IndexedDBは未使用。
- 例外は `js/ui/homeUI.js` の `homeSaveInfo` による存在・妥当性の直接読み取り。初期化確認用の直接読み取りもsave.js内にある。
- チュートリアル既読と更新通知既読は別キーでindex.htmlとhomeUI.jsにも存在する。これらはゲーム進行セーブ本体とは別の端末設定。
- manifestやサーバー同期・ログインは未導入。本変更は案内のみで保存APIを変更しない。

## 将来の段階移行

save.js内へ保存先アダプター（read/write/remove）と保存有無照会APIを追加し、homeSaveInfoもそのAPIへ接続できる。既存のsaveState/loadState呼び出し側は再利用可能。ただしクラウド化は非同期化、認証、保存版番号、競合時の確認・バックアップ、通信失敗処理が別途必要。localStorageの呼び先を置換するだけで同期完成とはしない。

今回はアダプター追加、キー変更、形式移行、データ転送、同期、自動初期化を行わない。
