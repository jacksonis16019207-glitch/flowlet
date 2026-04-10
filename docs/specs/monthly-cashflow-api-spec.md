# 月次収支 API 仕様

## 概要

- ダッシュボードと収支分析画面で、グローバル設定された月初ルールに基づく 1 か月の収支を取得する
- 表示期間は常に 1 か月固定とし、開始日は `m_app_setting` の設定を使って決定する
- 開始候補日が土日祝に当たる場合は、設定された補正ルールに従って前営業日または翌営業日に補正する

## エンドポイント

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/dashboard/monthly-cashflow` | 対象月に対応する 1 か月収支を取得する |

## クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `targetMonth` | `string` | 必須 | 対象月。形式は `YYYY-MM` |

- `targetMonth` は表示基準月を表す
- 実際の集計期間は `m_app_setting.month_start_day` と `m_app_setting.month_start_adjustment_rule` から計算する

例:

- `GET /api/dashboard/monthly-cashflow?targetMonth=2026-02`

## レスポンス

```json
{
  "targetMonth": "2026-02",
  "periodStartDate": "2026-02-12",
  "periodEndDate": "2026-03-10",
  "income": 100000,
  "expense": 30000,
  "net": 70000
}
```

## レスポンス項目

| 項目 | 型 | 説明 |
| --- | --- | --- |
| `targetMonth` | `string` | 対象月。形式は `YYYY-MM` |
| `periodStartDate` | `string` | 実際に適用された期間開始日。形式は `YYYY-MM-DD` |
| `periodEndDate` | `string` | 実際に適用された期間終了日。形式は `YYYY-MM-DD` |
| `income` | `number` | 期間内の収入合計 |
| `expense` | `number` | 期間内の支出合計 |
| `net` | `number` | `income - expense` |

## 集計ルール

- `Transaction.transactionDate` が `periodStartDate` 以上 `periodEndDate` 以下の取引だけを対象にする
- `transactionType = INCOME` を収入として集計する
- `transactionType = EXPENSE` を支出として集計する
- `TRANSFER_IN` / `TRANSFER_OUT` / `GoalBucketAllocation` は対象外
- `Transaction.cashflowTreatment` を優先して収支集計対象を決める
- `cashflowTreatment = AUTO` の場合:
  - `INCOME` は収入
  - `EXPENSE` は支出
  - `TRANSFER_IN` / `TRANSFER_OUT` は対象外
- `cashflowTreatment = IGNORE` は収支集計対象外
- `cashflowTreatment = INCOME` は `transactionType` に関係なく収入へ加算する
- `cashflowTreatment = EXPENSE` は `transactionType` に関係なく支出へ加算する

## 月初計算ルール

1. `targetMonth` 内で `month_start_day` を候補日にする
2. 月末日より大きい日付は月末日に丸める
3. 候補日が土日祝の場合、`month_start_adjustment_rule` に従って補正する
4. 次月の開始日を同じルールで計算し、その前日を `periodEndDate` とする

## エラー

| ステータス | コード | 条件 |
| --- | --- | --- |
| `400 Bad Request` | `INVALID_MONTH_FORMAT` | `targetMonth` が `YYYY-MM` 形式でない |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | サーバー内部エラー |
## 補足

- `targetMonth` は省略可能
- 省略時は今日の日付を含む期間の `targetMonth` をサーバー側で決定する
