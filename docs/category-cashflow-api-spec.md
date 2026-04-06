# カテゴリ別収支 API 仕様

## 目的

- ダッシュボードと収支分析ページで、対象期間内のカテゴリ別収支をまとめて確認できるようにする
- 既存の `Transaction` データから、収入カテゴリと支出カテゴリごとの合計を読み取り専用で返す
- 「どのカテゴリが増減に効いているか」を月次収支と並べて確認できる状態にする

## 想定ユースケース

- ダッシュボードで直近数か月の主要な収入カテゴリ、支出カテゴリをざっくり確認する
- 収支分析ページで期間を指定し、カテゴリ別の偏りを振り返る
- 将来的なグラフ表示や前月比較の土台にする

## エンドポイント

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/dashboard/category-cashflow` | 期間内のカテゴリ別収支集計を取得する |

## クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `fromMonth` | `string` | 必須 | 集計開始月。形式は `YYYY-MM` |
| `toMonth` | `string` | 必須 | 集計終了月。形式は `YYYY-MM` |

- `fromMonth <= toMonth` を必須とする
- 初版では集計範囲を最大 12 か月とする

例:

- `GET /api/dashboard/category-cashflow?fromMonth=2026-01&toMonth=2026-04`

## レスポンス

```json
{
  "fromMonth": "2026-01",
  "toMonth": "2026-04",
  "incomeCategories": [
    {
      "categoryId": 1,
      "categoryName": "給与",
      "amount": 840000
    },
    {
      "categoryId": 2,
      "categoryName": "賞与",
      "amount": 120000
    }
  ],
  "expenseCategories": [
    {
      "categoryId": 10,
      "categoryName": "住居費",
      "amount": 280000
    },
    {
      "categoryId": 11,
      "categoryName": "食費",
      "amount": 95000
    }
  ],
  "totals": {
    "income": 960000,
    "expense": 375000
  }
}
```

## レスポンス項目

### incomeCategories / expenseCategories

- 指定期間内のカテゴリ別合計
- `amount` 降順で返す
- `incomeCategories` は `transactionType = INCOME` のみを対象にする
- `expenseCategories` は `transactionType = EXPENSE` のみを対象にする

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `categoryId` | `number` | カテゴリ ID |
| `categoryName` | `string` | カテゴリ名 |
| `amount` | `number` | 期間内合計 |

### totals

- 指定期間内のカテゴリ別集計の総和
- ダッシュボード上部カードの補助表示や収支分析ページの概要表示に使う

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `income` | `number` | 収入カテゴリ合計 |
| `expense` | `number` | 支出カテゴリ合計 |

## 集計ルール

### 対象データ

- `Transaction` を集計対象とする
- `GoalBucketAllocation` は収支ではなく口座内配分なので対象外とする

### 含めるもの

- `transactionType = INCOME`
- `transactionType = EXPENSE`

### 除外するもの

- `transactionType = TRANSFER_OUT`
- `transactionType = TRANSFER_IN`
- `GoalBucketAllocation`

### GoalBucket 付き取引の扱い

- `goalBucketId` 付き `Transaction` でも、`transactionType` が `INCOME` または `EXPENSE` であれば集計に含める

## エラー仕様

| ステータス | コード | 条件 |
| --- | --- | --- |
| `400 Bad Request` | `INVALID_MONTH_FORMAT` | `fromMonth` または `toMonth` が `YYYY-MM` 形式でない |
| `400 Bad Request` | `INVALID_MONTH_RANGE` | `fromMonth > toMonth` |
| `400 Bad Request` | `MONTH_RANGE_TOO_LARGE` | 集計範囲が 12 か月を超える |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | 想定外エラー |

## 認証/認可

初版ではなし。

## 実装方針

- 集計元は既存 `TransactionRepository` を利用する
- カテゴリ名解決には既存 `CategoryRepository` を利用する
- 月次収支 API と同じ期間指定ルールを適用する
