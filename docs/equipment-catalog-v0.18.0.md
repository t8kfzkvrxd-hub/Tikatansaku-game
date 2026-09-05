# v0.18.0 装備カタログ監査

同一IDを1件として集計。所持インスタンス数・強化値違いは数えない。BASEは親レシピなし、DERIVED/ AWAKENEDは親あり。

## 整理前後

| 項目 | 前 | 後 |
| --- | --- | --- |
| 全登録 | 1235 | 1423 |
| 基礎武器（真のルート） | 43 | 43 |
| 武器派生・覚醒 | 1024 | 1024 |
| 基礎片手剣 | 31 | 5 |
| primaryBuildTag未設定 | 168 | 0 |

前回の「基礎103」は、生成派生でない武器の数であり、旧派生60件を含んでいた。片手剣875件の内訳は基礎31、旧派生50、生成派生794。削除せず、モンスター基礎武器30件の型を再配置し、子の武器カテゴリも追従させた。

## 全登録：部位×レアリティ

| 部位 | Common | Rare | Epic | Legendary | Mythic | Abyssal | 合計 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 武器 | 26 | 20 | 18 | 223 | 273 | 507 | 1067 |
| 頭 | 8 | 38 | 6 | 4 | 3 | 3 | 62 |
| 胴 | 8 | 19 | 8 | 16 | 4 | 4 | 59 |
| 腕 | 38 | 8 | 6 | 4 | 3 | 3 | 62 |
| 脚 | 8 | 38 | 6 | 4 | 3 | 3 | 62 |
| アクセサリー | 16 | 48 | 13 | 23 | 6 | 5 | 111 |

| レアリティ | 全装備 |
| --- | --- |
| Common | 104 |
| Rare | 171 |
| Epic | 57 |
| Legendary | 274 |
| Mythic | 292 |
| Abyssal | 525 |

## 基礎武器

| 武器種 | 数 |
| --- | --- |
| 短剣 | 4 |
| 大剣 | 3 |
| 片手剣 | 5 |
| メイス | 3 |
| 大鎌 | 4 |
| 大槌 | 2 |
| 爪 | 2 |
| 斧 | 2 |
| 槍 | 2 |
| 杖 | 2 |
| 魔導書 | 3 |
| 拳 | 1 |
| 双剣 | 2 |
| 長槍 | 1 |
| 大斧 | 2 |
| 弓 | 2 |
| 細剣 | 2 |
| クロスボウ | 1 |

| レアリティ | 基礎武器数 |
| --- | --- |
| Common | 16 |
| Rare | 10 |
| Epic | 8 |
| Legendary | 6 |
| Mythic | 2 |
| Abyssal | 1 |

| 主ビルド | 基礎武器数 |
| --- | --- |
| lifesteal | 3 |
| crit | 1 |
| heavyAttack | 3 |
| farming | 14 |
| shock | 2 |
| curse | 1 |
| skillPower | 2 |
| normalAttack | 6 |
| break | 3 |
| poison | 3 |
| lowHp | 3 |
| fire | 2 |

片手剣は5/43（11.6%）。50%以上のカテゴリはない。既存の武器種の行動方式は残し、再分類武器には当該武器種のビルドタグを追加。例えば槍は防御無視、双剣は連撃、杖はスキル火力、魔導書は呪いの既存戦闘処理につながる。

## 派生・覚醒（武器）

| レアリティ | 件数 |
| --- | --- |
| Common | 10 |
| Rare | 10 |
| Epic | 10 |
| Legendary | 217 |
| Mythic | 271 |
| Abyssal | 506 |

深淵進化（1000F条件）は253件で、Abyssal506件の内数。データ生成派生964件に旧派生60件を加えた1,024件。全登録1,423件のうち、進行条件が現行100F範囲内なのは606件、300F以降の将来解禁用は817件。606件は即時作成可能数ではない（発見・施設・親+10・素材・Gが別途必要）。

## 防具・アクセサリーの主ビルド別

各装備をprimaryBuildTagで一度だけ数える。副ビルドは重複加算しない。

### 頭：62件

| 主ビルドID | 件数 |
| --- | --- |
| dodge | 1 |
| guard | 2 |
| break | 3 |
| poison | 9 |
| lowHp | 3 |
| skillPower | 7 |
| crit | 8 |
| fire | 5 |
| farming | 17 |
| freeze | 3 |
| curse | 2 |
| statusHunter | 2 |

### 胴：59件

| 主ビルドID | 件数 |
| --- | --- |
| guard | 16 |
| curse | 1 |
| lifesteal | 7 |
| shock | 1 |
| shield | 7 |
| boss | 10 |
| highHp | 6 |
| lowHp | 4 |
| onHurt | 3 |
| reflect | 2 |
| unhurt | 2 |

### 腕：62件

| 主ビルドID | 件数 |
| --- | --- |
| dodge | 1 |
| guard | 2 |
| break | 9 |
| poison | 3 |
| lowHp | 3 |
| skillPower | 1 |
| crit | 4 |
| fire | 2 |
| farming | 13 |
| speed | 6 |
| multiHit | 6 |
| justGuard | 4 |
| counter | 3 |
| heavyAttack | 3 |
| skillHaste | 2 |

### 脚：62件

| 主ビルドID | 件数 |
| --- | --- |
| dodge | 7 |
| guard | 2 |
| break | 3 |
| poison | 3 |
| lowHp | 3 |
| skillPower | 1 |
| crit | 2 |
| fire | 2 |
| farming | 16 |
| unhurt | 6 |
| safe | 6 |
| normalAttack | 4 |
| freeze | 3 |
| highHp | 2 |
| longFight | 2 |

### アクセサリー：111件

| 主ビルドID | 件数 |
| --- | --- |
| lifesteal | 7 |
| guard | 7 |
| curse | 2 |
| crit | 4 |
| shock | 1 |
| dodge | 1 |
| break | 6 |
| boss | 10 |
| poison | 9 |
| lowHp | 6 |
| skillPower | 1 |
| fire | 8 |
| farming | 15 |
| bleed | 6 |
| freeze | 5 |
| justGuard | 5 |
| counter | 4 |
| shield | 4 |
| overheal | 3 |
| highHp | 3 |
| statusHunter | 2 |
| conversion | 1 |
| hybrid | 1 |

## 品質・互換性

- 完全重複候補：0組。名前・説明・入手費用を除き、能力・効果・タグ・カテゴリ・同一の派生先ID集合を比較。似た用途は完全重複としない。
- 無所属：0件。旧168件は主タグ未設定でも既存タグ・効果があり、それを主タグへ整理した。
- 旧1,235 IDをすべて保持。旧所持品の名前・レア度・性能・強化・ロック・追加特性は再分類で上書きしない。
- 防具32件×4部位、アクセ60件を追加。低レアの条件付き効果は維持し、レア度ごとに異なる副ビルド条件を組み合わせる。
- 保存キー・セーブ形式は変更なし。通常一覧はBASE、ツリーはルート→子を8件ずつ表示。未発見は？？？、階層条件は明示。
- 検証：test_catalog_revision.html。既存装備・派生・戦闘・UIテストと併用。
