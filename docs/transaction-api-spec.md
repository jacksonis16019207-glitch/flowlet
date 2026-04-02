# 取引系 API 仕様

## 1. 目的

- 対象 API:
  - `Transaction`
  - `Transfer`
  - `GoalBucketAllocation`
  - 取引画面で利用する参照系マスタ取得
- 利用者:
  - flowlet frontend
  - 将来の CSV 取込や集計機能の基盤ロジック
- 解決する課題:
  - 通常取引、振替・振込、目的別口座配分を責務分離したまま実装できるようにする
  - UI 上は 1 回の操作でも、保存時は複数レコードへ展開できるようにする
  - カテゴリ整合、口座整合、GoalBucket 整合を API 層で明確に扱う

## 2. 前提と共通方針

### 2.1 パス方針

- 既存実装に合わせて `/api/...` 配下へ配置する
- 複数形リソース名を使う
- 既存:
  - `GET /api/accounts`
  - `POST /api/accounts`
  - `GET /api/goal-buckets`
  - `POST /api/goal-buckets`
- 今回追加:
  - `GET /api/categories`
  - `GET /api/subcategories`
  - `GET /api/transactions`
  - `POST /api/transactions`
  - `POST /api/transfers`
  - `GET /api/goal-bucket-allocations`
  - `POST /api/goal-bucket-allocations`

### 2.2 データ方針

- `amount` は常に正数で受け取る
- `transactionType` が増減の意味を持つ
- `goalBucketId` は `Transaction` では
  - `INCOME`
  - `EXPENSE`
  - `TRANSFER_OUT`
  でのみ許可する
- `TRANSFER_IN` では `goalBucketId` を受け付けない
- 配分は `GoalBucketAllocation` を独立レコードで保存する
- 複数配分は 1 リクエストで複数レコード作成できるが、親バッチモデルは持たない
- 割合指定は UI 入力方式であり、API には金額へ展開済みの値を送る

### 2.3 エラー形式

共通エラーレスポンスは次の形を想定する。

```json
{
  "code": "validation_error",
  "message": "categoryId is required.",
  "details": [
    {
      "field": "categoryId",
      "reason": "required"
    }
  ]
}
```

## 3. エンドポイント一覧

| Method | Path | 概要 |
| --- | --- | --- |
| `GET` | `/api/accounts` | 口座一覧取得 |
| `GET` | `/api/goal-buckets` | 目的別口座一覧取得 |
| `GET` | `/api/categories` | 大分類一覧取得 |
| `GET` | `/api/subcategories` | 小分類一覧取得 |
| `GET` | `/api/transactions` | 通常取引・振替明細一覧取得 |
| `POST` | `/api/transactions` | 通常取引登録 |
| `POST` | `/api/transfers` | 振替・振込登録 |
| `GET` | `/api/goal-bucket-allocations` | 配分一覧取得 |
| `POST` | `/api/goal-bucket-allocations` | 配分登録 |

## 4. 参照系 API

### 4.1 GET /api/accounts

- 目的:
  - 取引フォーム、振替フォーム、配分フォームの口座候補取得
- Query Params:
  - `activeOnly: boolean` 任意
  - `accountCategory: string` 任意
- 成功時ステータス:
  - `200 OK`
- 成功レスポンス例:

```json
[
  {
    "accountId": 1,
    "accountName": "メイン口座",
    "providerName": "住信SBIネット銀行",
    "accountCategory": "BANK",
    "balanceSide": "ASSET",
    "initialBalance": 120000,
    "active": true,
    "displayOrder": 10,
    "currentBalance": 120000,
    "unallocatedBalance": 120000,
    "createdAt": "2026-04-01T00:00:00Z",
    "updatedAt": "2026-04-01T00:00:00Z"
  }
]
```

### 4.2 GET /api/goal-buckets

- 目的:
  - 口座配下の GoalBucket 候補取得
- Query Params:
  - `accountId: long` 任意
  - `activeOnly: boolean` 任意
- 成功時ステータス:
  - `200 OK`
- 成功レスポンス例:

```json
[
  {
    "goalBucketId": 10,
    "accountId": 2,
    "bucketName": "旅行",
    "active": true,
    "createdAt": "2026-04-01T00:00:00Z",
    "updatedAt": "2026-04-01T00:00:00Z"
  }
]
```

### 4.3 GET /api/categories

- 目的:
  - `transactionType` に応じたカテゴリ候補取得
- Query Params:
  - `categoryType: string` 任意
  - `activeOnly: boolean` 任意
- 成功時ステータス:
  - `200 OK`
- 成功レスポンス例:

```json
[
  {
    "categoryId": 100,
    "categoryName": "食費",
    "categoryType": "EXPENSE",
    "displayOrder": 10,
    "active": true
  }
]
```

### 4.4 GET /api/subcategories

- 目的:
  - 選択済みカテゴリ配下の小分類候補取得
- Query Params:
  - `categoryId: long` 任意
  - `activeOnly: boolean` 任意
- 成功時ステータス:
  - `200 OK`
- 成功レスポンス例:

```json
[
  {
    "subcategoryId": 1001,
    "categoryId": 100,
    "subcategoryName": "外食",
    "displayOrder": 30,
    "active": true
  }
]
```

## 5. Transaction API

### 5.1 GET /api/transactions

- 目的:
  - 通常取引と振替明細の一覧表示
- Query Params:
  - `accountId: long` 任意
  - `transactionType: string` 任意
  - `categoryId: long` 任意
  - `goalBucketId: long` 任意
  - `dateFrom: yyyy-MM-dd` 任意
  - `dateTo: yyyy-MM-dd` 任意
  - `limit: int` 任意
- 並び順:
  - `transactionDate desc`
  - 同日内は `transactionId desc`
- 成功時ステータス:
  - `200 OK`
- 成功レスポンス例:

```json
[
  {
    "transactionId": 10000,
    "accountId": 1,
    "accountName": "メイン口座",
    "goalBucketId": 10,
    "goalBucketName": "旅行",
    "categoryId": 100,
    "categoryName": "食費",
    "subcategoryId": 1001,
    "subcategoryName": "外食",
    "transactionType": "EXPENSE",
    "transactionDate": "2026-04-01",
    "amount": "2800",
    "description": "ホテル朝食",
    "note": "出張最終日",
    "transferGroupId": null,
    "createdAt": "2026-04-01T00:00:00Z",
    "updatedAt": "2026-04-01T00:00:00Z"
  }
]
```

### 5.2 POST /api/transactions

- 目的:
  - 通常取引を 1 件登録する
- 受け付ける `transactionType`:
  - `INCOME`
  - `EXPENSE`
- Request Body:

```json
{
  "accountId": 1,
  "goalBucketId": 10,
  "categoryId": 100,
  "subcategoryId": 1001,
  "transactionType": "EXPENSE",
  "transactionDate": "2026-04-01",
  "amount": "2800",
  "description": "ホテル朝食",
  "note": "出張最終日"
}
```

- 業務ルール:
  - `accountId` は必須
  - `categoryId` は必須
  - `subcategoryId` は任意
  - `amount > 0`
  - `transactionType` は `INCOME` または `EXPENSE`
  - `category.categoryType` は `transactionType` と一致必須
  - `subcategoryId` がある場合、親 `categoryId` と一致必須
  - `goalBucketId` がある場合、`goalBucket.accountId == accountId` 必須
- 成功時ステータス:
  - `201 Created`
- 成功レスポンス例:

```json
{
  "transactionId": 10000,
  "accountId": 1,
  "goalBucketId": 10,
  "categoryId": 100,
  "subcategoryId": 1001,
  "transactionType": "EXPENSE",
  "transactionDate": "2026-04-01",
  "amount": "2800",
  "description": "ホテル朝食",
  "note": "出張最終日",
  "transferGroupId": null,
  "createdAt": "2026-04-01T00:00:00Z",
  "updatedAt": "2026-04-01T00:00:00Z"
}
```

## 6. Transfer API

### 6.1 POST /api/transfers

- 目的:
  - 振替・振込を 1 回の操作で登録し、内部的には 2 件の `Transaction` を作成する
- Request Body:

```json
{
  "fromAccountId": 1,
  "toAccountId": 2,
  "fromGoalBucketId": 10,
  "categoryId": 900,
  "subcategoryId": 9001,
  "transactionDate": "2026-04-01",
  "amount": "50000",
  "description": "旅行用口座へ振替",
  "note": "4月積立"
}
```

- 項目ルール:
  - `fromAccountId` 必須
  - `toAccountId` 必須
  - `fromGoalBucketId` 任意
  - `fromAccountId != toAccountId`
  - `amount > 0`
  - `category.categoryType = TRANSFER` 必須
  - `subcategoryId` がある場合、親 `categoryId` と一致必須
  - `fromGoalBucketId` がある場合、`fromGoalBucket.accountId == fromAccountId` 必須
- 保存結果:
  - 出金側 `TRANSFER_OUT`
  - 入金側 `TRANSFER_IN`
  - 同じ `transferGroupId`
  - 入金側には `goalBucketId` を持たせない
- 成功時ステータス:
  - `201 Created`
- 成功レスポンス例:

```json
{
  "transferGroupId": "550e8400-e29b-41d4-a716-446655440000",
  "transactionDate": "2026-04-01",
  "amount": "50000",
  "outgoingTransaction": {
    "transactionId": 20001,
    "accountId": 1,
    "goalBucketId": 10,
    "categoryId": 900,
    "subcategoryId": 9001,
    "transactionType": "TRANSFER_OUT",
    "transactionDate": "2026-04-01",
    "amount": "50000",
    "description": "旅行用口座へ振替",
    "note": "4月積立",
    "transferGroupId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "incomingTransaction": {
    "transactionId": 20002,
    "accountId": 2,
    "goalBucketId": null,
    "categoryId": 900,
    "subcategoryId": 9001,
    "transactionType": "TRANSFER_IN",
    "transactionDate": "2026-04-01",
    "amount": "50000",
    "description": "旅行用口座へ振替",
    "note": "4月積立",
    "transferGroupId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 6.2 振替と同時配分の扱い

- フロントでは `振替・振込` タブ内に `配分` タブと同等の配分 UI を表示できるようにする
- ただし API は分離する
  - 先に `POST /api/transfers`
  - 次に `POST /api/goal-bucket-allocations`
- `POST /api/transfers` のレスポンス `transferGroupId` を配分 API の `linkedTransferGroupId` に渡す
- これにより UI 上は 1 操作でも、責務分離したバックエンド実装を維持できる

## 7. GoalBucketAllocation API

### 7.1 GET /api/goal-bucket-allocations

- 目的:
  - 配分履歴の一覧表示
- Query Params:
  - `accountId: long` 必須
  - `fromGoalBucketId: long` 任意
  - `toGoalBucketId: long` 任意
  - `dateFrom: yyyy-MM-dd` 任意
  - `dateTo: yyyy-MM-dd` 任意
  - `linkedTransferGroupId: uuid` 任意
- 並び順:
  - `allocationDate desc`
  - 同日内は `allocationId desc`
- 成功時ステータス:
  - `200 OK`
- 成功レスポンス例:

```json
[
  {
    "allocationId": 30001,
    "accountId": 2,
    "fromGoalBucketId": null,
    "toGoalBucketId": 10,
    "allocationDate": "2026-04-01",
    "amount": "30000",
    "description": "4月積立",
    "note": null,
    "linkedTransferGroupId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-04-01T00:00:00Z",
    "updatedAt": "2026-04-01T00:00:00Z"
  }
]
```

### 7.2 POST /api/goal-bucket-allocations

- 目的:
  - 複数配分を 1 回のリクエストで登録する
  - DB には配分先ごとの独立レコードとして保存する
- Request Body:

```json
{
  "accountId": 2,
  "fromGoalBucketId": null,
  "allocationDate": "2026-04-01",
  "description": "4月積立",
  "note": null,
  "linkedTransferGroupId": "550e8400-e29b-41d4-a716-446655440000",
  "allocations": [
    {
      "toGoalBucketId": 10,
      "amount": "30000"
    },
    {
      "toGoalBucketId": 11,
      "amount": "20000"
    }
  ]
}
```

- 業務ルール:
  - `accountId` 必須
  - `allocationDate` 必須
  - `allocations` は 1 件以上必須
  - 各 `amount > 0`
  - `fromGoalBucketId` は任意
  - `fromGoalBucketId` がある場合、`fromGoalBucket.accountId == accountId` 必須
  - 全 `toGoalBucketId` は `accountId` 配下必須
  - 同一リクエスト内で `toGoalBucketId` 重複禁止
  - `fromGoalBucketId` と同じ `toGoalBucketId` は禁止
  - `linkedTransferGroupId` がある場合、対応する `TRANSFER_IN` の `accountId` と一致必須
- 成功時ステータス:
  - `201 Created`
- 成功レスポンス例:

```json
{
  "accountId": 2,
  "fromGoalBucketId": null,
  "allocationDate": "2026-04-01",
  "description": "4月積立",
  "note": null,
  "linkedTransferGroupId": "550e8400-e29b-41d4-a716-446655440000",
  "allocations": [
    {
      "allocationId": 30001,
      "toGoalBucketId": 10,
      "amount": "30000"
    },
    {
      "allocationId": 30002,
      "toGoalBucketId": 11,
      "amount": "20000"
    }
  ]
}
```

## 8. 主要な業務エラー

| ステータス | code | 条件 |
| --- | --- | --- |
| `400 Bad Request` | `validation_error` | 必須不足、形式不正、数値不正 |
| `404 Not Found` | `account_not_found` | 指定口座が存在しない |
| `404 Not Found` | `goal_bucket_not_found` | 指定 GoalBucket が存在しない |
| `404 Not Found` | `category_not_found` | 指定カテゴリが存在しない |
| `404 Not Found` | `subcategory_not_found` | 指定小分類が存在しない |
| `409 Conflict` | `category_type_mismatch` | `transactionType` と `categoryType` が不一致 |
| `409 Conflict` | `subcategory_category_mismatch` | `subcategoryId` の親カテゴリが不一致 |
| `409 Conflict` | `goal_bucket_account_mismatch` | `goalBucketId` が別口座配下 |
| `409 Conflict` | `same_account_transfer` | 振替元口座と振替先口座が同一 |
| `409 Conflict` | `transfer_goal_bucket_not_allowed` | `TRANSFER_IN` に `goalBucketId` を指定した |
| `409 Conflict` | `duplicate_allocation_destination` | 同一配分リクエスト内で配分先が重複 |

## 9. 認証・認可

- 認証方式:
  - MVP 時点では認証なし
- 権限要件:
  - なし
- 将来方針:
  - ユーザー導入時に全 API をユーザー単位で閉じる
  - `accountId` / `goalBucketId` / `transactionId` へのアクセスは所有者チェック必須にする

## 10. 互換性方針

- バージョニング:
  - MVP 時点では URL バージョンなし
  - 破壊的変更が発生した時点で `/api/v1` を導入検討
- 非推奨化手順:
  - ドキュメント先行で告知
  - frontend 側の移行完了後に旧仕様を削除
- 破壊的変更時の移行:
  - DTO を新旧で分ける
  - 旧フィールドは段階的に非推奨化する

## 11. 保留事項

- `GET /api/transactions` にページングを先に入れるか、MVP は `limit` のみで始めるか
- `GET /api/accounts` に `accountCategory=CREDIT_CARD` などの絞り込みをどこまで入れるか
- `GoalBucketAllocation` の合計配分額に対して未配分残高超過を登録時エラーにするか、警告に留めるか
- `TRANSFER_IN` の `goalBucketId` を将来も不許可のままにするか
- ダッシュボード集計 API を取引 API 仕様と分離した別仕様書へ切り出すか
