# 取引系 実装計画

## 目的

`Transaction`、`Transfer`、`GoalBucketAllocation`、カテゴリ階層、クレジットカード対応を、既存の `Account` / `GoalBucket` 実装へ無理なく積み上げるための実装順を整理する。

関連ドキュメント:

- [requirements.md](./requirements.md)
- [mvp-tasks.md](./mvp-tasks.md)
- [transaction-design.md](./transaction-design.md)
- [transaction-api-spec.md](./transaction-api-spec.md)

## 実装方針

- 既存の `Account` / `GoalBucket` の構成と命名に寄せる
- 先にカテゴリ系を入れて、取引登録時の整合チェックを単純化する
- `Transaction` を先に成立させ、その上に `Transfer` と `GoalBucketAllocation` を積む
- フロントでは `通常取引` / `振替・振込` / `配分` をタブで切り替える
- `振替・振込` タブでは `配分` タブと同じ配分 UI を埋め込める構成にする
- 開発中に画面・API・残高計算の確認ができるよう、早い段階でダミーデータを用意する

## 実装順

### 1. Category / Subcategory を先に入れる

対象:

- DB: `categories`, `subcategories`
- backend: 一覧取得 API
- frontend: 取引フォーム用の候補取得

理由:

- `Transaction` 実装前に `categoryType` と `transactionType` の整合を固定できる
- フォーム側の選択肢とバリデーションを先に揃えられる

完了条件:

- `GET /api/categories`
- `GET /api/subcategories`
- フロントでカテゴリ候補を取得できる

### 2. Transaction の縦スライスを作る

対象:

- DB: `transactions`
- backend:
  - `GET /api/transactions`
  - `POST /api/transactions`
- frontend:
  - `通常取引` タブ
  - 通常取引一覧

重点ルール:

- `transactionType` は `INCOME` / `EXPENSE`
- `categoryId` 必須
- `subcategoryId` 任意
- `goalBucketId` は同一 `accountId` 配下のみ許可
- `description` と `note` を分ける

完了条件:

- 通常取引を登録できる
- 一覧で確認できる
- カテゴリ整合と GoalBucket 整合のエラーが返る

### 3. Transfer を追加する

対象:

- backend:
  - `POST /api/transfers`
- frontend:
  - `振替・振込` タブ

重点ルール:

- 1 回の操作で 2 件の `Transaction` を作成する
- `TRANSFER_OUT` / `TRANSFER_IN` を共通 `transferGroupId` で結ぶ
- `TRANSFER_IN` では `goalBucketId` を持たせない

完了条件:

- 口座間振替を登録できる
- カード支払いも同じ仕組みで表現できる
- 2 明細が一覧へ表示される

### 4. GoalBucketAllocation を追加する

対象:

- DB: `goal_bucket_allocations`
- backend:
  - `GET /api/goal-bucket-allocations`
  - `POST /api/goal-bucket-allocations`
- frontend:
  - `配分` タブ
  - `振替・振込` タブ内の同時配分 UI

重点ルール:

- 配分は 1 レコード 1 配分先で保存する
- API は 1 リクエストで複数配分を受け取り、複数レコードへ展開する
- 割合指定は UI 入力方式とし、API には金額へ展開した値を送る
- `linkedTransferGroupId` で振替とゆるく結び付ける

完了条件:

- 未配分から複数 GoalBucket へ配分できる
- GoalBucket 間で再配分できる
- 振替登録直後に同時配分できる

### 5. 残高計算と表示をつなぐ

対象:

- backend:
  - `Account` 残高計算
  - `GoalBucket` 残高計算
  - 未配分残高計算
- frontend:
  - ダッシュボードまたは取引画面内の補助表示

重点ルール:

- `Account` 残高は `balanceSide` と `transactionType` で解釈する
- `GoalBucket` 残高は `goalBucketId` 付き `Transaction` と `GoalBucketAllocation` から計算する
- 未配分残高は `Account残高 - 配下GoalBucket残高合計`

完了条件:

- 口座残高、GoalBucket 残高、未配分残高が一貫して表示できる

### 6. クレジットカード詳細を追加する

対象:

- DB: `credit_card_profiles`
- backend: 口座登録時の拡張
- frontend: `CREDIT_CARD` 選択時の追加入力

重点ルール:

- `paymentAccountId`
- `closingDay`
- `paymentDay`
- `paymentDateAdjustmentRule`

完了条件:

- クレジットカード口座を登録できる
- 引き落とし元口座と支払日ルールを保持できる

## 開発用ダミーデータ

### 目的

- API と画面の結線確認を早く回す
- 残高計算、未配分残高、配分、振替の挙動を目視確認しやすくする
- 記事化やデモでも使えるベースデータを持つ

### 追加タイミング

おすすめは 2 段階で入れる。

1. `Category / Subcategory` 実装完了直後
2. `Transaction / Transfer / GoalBucketAllocation` 実装完了直後

### 初期ダミーデータ案

口座:

- メイン口座
- 貯金口座
- 楽天カード

GoalBucket:

- 旅行
- 特別費
- 生活防衛

Category / Subcategory:

- 食費
  - 食料品
  - コンビニ
  - 外食
- 交通費
  - 電車
  - バス
- 振替
  - 口座間移動
  - カード支払

取引:

- メイン口座への給与入金
- メイン口座の食費支出
- 楽天カードの利用明細

振替:

- メイン口座 -> 貯金口座
- メイン口座 -> 楽天カード支払い

配分:

- 貯金口座の未配分 -> 旅行 / 特別費
- 旅行 -> 未配分への戻し

### 配置方針

現時点のおすすめ:

- 開発用ダミーデータは `infra/sql/dev-seed/` に置く
- 固定マスタデータは `infra/sql/master-data/` に置く
- ローカル開発で何度でも流し直せる形にする
- 本番投入用データとは分ける
- migration にはダミーデータを含めず、Flyway は構造変更だけに使う

### 完了条件

- ローカルで seed を投入すると、取引画面と配分画面の主要ケースをすぐ試せる
- 未配分残高、GoalBucket 残高、振替後の状態が確認できる

## 最初の実装単位

最初の着手は次がよい。

1. `categories` / `subcategories` の DB と API
2. 開発用カテゴリダミーデータ投入
3. `transactions` の DB と API
4. `通常取引` タブの最小表示

この順なら、フロントとバックエンドの接続確認を早く回せる。

## テスト優先観点

- `categoryType` と `transactionType` の不整合
- `goalBucketId` と `accountId` の不整合
- `TRANSFER_IN` への `goalBucketId` 指定
- 振替 1 回で 2 明細が作られること
- 複数配分が複数レコードへ展開されること
- 未配分残高が計算式どおりになること

## 保留事項

- 取引画面内に残高サマリを先に出すか、ダッシュボードへ分けるか
- クレジットカード請求確定モデルを別タスクでいつ切り出すか
