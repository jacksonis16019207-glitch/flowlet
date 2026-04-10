# ダッシュボード残高集計 API 仕様

## 目的

- ダッシュボードで「実口座残高」「GoalBucket 残高」「未配分残高」を 1 回の API 呼び出しで表示できるようにする
- `Account` 一覧 API と `GoalBucket` 一覧 API に分散している残高情報を、ダッシュボード用途の読み取り専用レスポンスとしてまとめる
- 将来的な `ScheduledPayment` による不足見込み表示を追加しやすい土台にする

## 想定ユースケース

- ダッシュボード初期表示で、全口座の現在状態をまとめて表示する
- 取引、振替、配分の登録後に、残高集計へ反映された結果を確認する
- 将来、口座残高と引き落とし予定額を同じ画面で比較できるようにする

## エンドポイント

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/dashboard/balance-summary` | ダッシュボード用の残高集計取得 |

## クエリパラメータ

初版ではなし。

- MVP ではダッシュボード全体表示を優先し、`accountId` や `activeOnly` などの絞り込みは追加しない
- 必要になった場合は後方互換を保ったまま任意パラメータを追加する

## レスポンス

```json
{
  "accounts": [
    {
      "accountId": 1,
      "providerName": "MUFG",
      "accountName": "メイン口座",
      "accountCategory": "BANK",
      "balanceSide": "ASSET",
      "currentBalance": 120000,
      "unallocatedBalance": 40000
    },
    {
      "accountId": 2,
      "providerName": "MUFG",
      "accountName": "生活防衛資金口座",
      "accountCategory": "BANK",
      "balanceSide": "ASSET",
      "currentBalance": 300000,
      "unallocatedBalance": 0
    }
  ],
  "goalBuckets": [
    {
      "goalBucketId": 10,
      "accountId": 1,
      "bucketName": "旅行",
      "currentBalance": 30000
    },
    {
      "goalBucketId": 11,
      "accountId": 1,
      "bucketName": "特別費",
      "currentBalance": 50000
    }
  ],
  "totals": {
    "accountCurrentBalance": 420000,
    "goalBucketCurrentBalance": 80000,
    "unallocatedBalance": 340000
  }
}
```

## レスポンス項目

### accounts

- ダッシュボードに表示する実口座単位のサマリ
- 並び順は `displayOrder` 昇順、同値なら `createdAt` 降順、さらに `accountId` 降順とする
- 初版では非アクティブ口座も返さず、`active = true` の口座のみを対象にする

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `accountId` | `number` | 口座 ID |
| `providerName` | `string` | 提供元名 |
| `accountName` | `string` | 口座表示名 |
| `accountCategory` | `string` | 口座区分 |
| `balanceSide` | `string` | 残高区分 |
| `currentBalance` | `number` | 現在残高 |
| `unallocatedBalance` | `number` | 未配分残高 |

### goalBuckets

- ダッシュボードに表示する GoalBucket 単位のサマリ
- 初版では非アクティブ GoalBucket は返さず、`active = true` の GoalBucket のみを対象にする
- 並び順は `account` の並び順に従い、その中で `createdAt` 降順、さらに `goalBucketId` 降順とする

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `goalBucketId` | `number` | GoalBucket ID |
| `accountId` | `number` | 親口座 ID |
| `bucketName` | `string` | 目的別口座名 |
| `currentBalance` | `number` | GoalBucket 現在残高 |

### totals

- 画面上部の全体サマリ表示用
- 口座一覧と GoalBucket 一覧から二次計算できるが、フロント側の重複計算を減らすため API で返す

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `accountCurrentBalance` | `number` | 対象口座の現在残高合計 |
| `goalBucketCurrentBalance` | `number` | 対象 GoalBucket 残高合計 |
| `unallocatedBalance` | `number` | 対象口座の未配分残高合計 |

## 集計ルール

### 口座残高

- `currentBalance` は既存 `GET /api/accounts` と同じ計算ルールを使う
- `currentBalance = initialBalance + その口座に属する Transaction の差分合計`
- 差分計算は `balanceSide` と `transactionType` で決める

### GoalBucket 残高

- `currentBalance` は既存 `GET /api/goal-buckets` と同じ計算ルールを使う
- `goalBucketId` を持つ `Transaction` と `GoalBucketAllocation` の入出を合算する

### 未配分残高

- `unallocatedBalance = account currentBalance - 配下 GoalBucket currentBalance 合計`
- 口座単位で算出し、`totals.unallocatedBalance` はその合計とする

## エラー仕様

初版の `GET /api/dashboard/balance-summary` では、通常運用で業務エラーを返す条件は設けない。

- `200 OK`: 集計結果を返す
- `500 Internal Server Error`: 想定外エラー

## 実装方針

- 既存の `BalanceCalculator` を再利用し、計算ロジックは重複実装しない
- `AccountService` と `GoalBucketService` が持っている並び順と集計ルールを踏襲する
- ダッシュボード用に新しい DTO を追加し、既存一覧 API のレスポンスは変更しない

## 将来拡張

- `scheduledPayments` または `paymentForecast` を追加し、引き落とし予定額と不足見込みを同居させる
- `accountId` 絞り込みや `includeInactive` のような任意パラメータを追加する
- カテゴリ別収支や直近の取引サマリをダッシュボード配下の別 API または同 API の拡張として検討する
