# カテゴリ別収支 API 仕様

## 概要

- ダッシュボードと収支分析画面で、対象月に対応する 1 か月期間のカテゴリ別収支を取得する
- 期間計算は `m_app_setting` の月初設定と土日祝補正ルールを使う

## エンドポイント

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/dashboard/category-cashflow` | 対象月に対応するカテゴリ別収支を取得する |

## クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `targetMonth` | `string` | 必須 | 対象月。形式は `YYYY-MM` |

例:

- `GET /api/dashboard/category-cashflow?targetMonth=2026-02`

## レスポンス

```json
{
  "targetMonth": "2026-02",
  "periodStartDate": "2026-02-20",
  "periodEndDate": "2026-03-22",
  "incomeCategories": [
    {
      "categoryId": 1,
      "categoryName": "給与",
      "amount": 280000
    }
  ],
  "expenseCategories": [
    {
      "categoryId": 10,
      "categoryName": "住居費",
      "amount": 72000
    }
  ],
  "totals": {
    "income": 330000,
    "expense": 107000
  }
}
```

## レスポンス項目

| 項目 | 型 | 説明 |
| --- | --- | --- |
| `targetMonth` | `string` | 対象月。形式は `YYYY-MM` |
| `periodStartDate` | `string` | 実際の期間開始日。形式は `YYYY-MM-DD` |
| `periodEndDate` | `string` | 実際の期間終了日。形式は `YYYY-MM-DD` |
| `incomeCategories[]` | `array` | 期間内の収入カテゴリ別合計 |
| `expenseCategories[]` | `array` | 期間内の支出カテゴリ別合計 |
| `totals.income` | `number` | 期間内の収入合計 |
| `totals.expense` | `number` | 期間内の支出合計 |

## 集計ルール

- `Transaction.transactionDate` が `periodStartDate` 以上 `periodEndDate` 以下のものを対象にする
- `transactionType = INCOME` は `incomeCategories` に集計する
- `transactionType = EXPENSE` は `expenseCategories` に集計する
- `TRANSFER_IN` / `TRANSFER_OUT` / `GoalBucketAllocation` は集計対象外
- 金額降順、同額時は `displayOrder` とカテゴリ名で並べる

## エラー

| ステータス | コード | 条件 |
| --- | --- | --- |
| `400 Bad Request` | `INVALID_MONTH_FORMAT` | `targetMonth` が `YYYY-MM` 形式でない |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | サーバー内部エラー |
