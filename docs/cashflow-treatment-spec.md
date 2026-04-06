# 収支集計設定メモ

## 概要

- `Transaction` に `cashflowTreatment` を追加した
- `Transfer` 作成時は `outgoingCashflowTreatment` と `incomingCashflowTreatment` を別々に指定できる
- これにより、通常取引を収支から除外したり、振替の片側だけを収支へ含めたりできる

## 指定値

- `AUTO`
- `IGNORE`
- `INCOME`
- `EXPENSE`

## 集計ルール

- `AUTO`
  - 通常取引の `INCOME` は収入
  - 通常取引の `EXPENSE` は支出
  - `TRANSFER_IN` / `TRANSFER_OUT` は収支集計対象外
- `IGNORE`
  - 収支集計対象外
- `INCOME`
  - `transactionType` に関係なく収入へ加算
- `EXPENSE`
  - `transactionType` に関係なく支出へ加算

## API 例

### 通常取引

```json
{
  "accountId": 1,
  "goalBucketId": null,
  "categoryId": 100,
  "subcategoryId": 1001,
  "transactionType": "EXPENSE",
  "cashflowTreatment": "IGNORE",
  "transactionDate": "2026-04-01",
  "amount": "2800",
  "description": "ホテル朝食",
  "note": "出張"
}
```

### 振替

```json
{
  "fromAccountId": 1,
  "toAccountId": 2,
  "fromGoalBucketId": null,
  "categoryId": 900,
  "subcategoryId": 9001,
  "transactionDate": "2026-04-02",
  "outgoingCashflowTreatment": "IGNORE",
  "incomingCashflowTreatment": "INCOME",
  "amount": "50000",
  "description": "旅行用口座へ振替",
  "note": "4月積立"
}
```
