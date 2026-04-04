# ScheduledPayment API 仕様

## 目的

- 将来の引き落とし予定を CRUD できるようにする
- ダッシュボードから直近期間の不足見込みを確認できるようにする
- `Transaction` と責務分離した予定管理 API を先に固める

## 前提と共通方針

- 初版は認証なし
- 初版は単発予定のみを扱う
- `ScheduledPayment` は `balanceSide = ASSET` の口座にのみ登録できる
- 金額は常に正数で受け取る
- 不足判定の対象は `status = PENDING` のみ

## エンドポイント一覧

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/scheduled-payments` | 引き落とし予定一覧取得 |
| `POST` | `/api/scheduled-payments` | 引き落とし予定登録 |
| `PUT` | `/api/scheduled-payments/{scheduledPaymentId}` | 引き落とし予定更新 |
| `DELETE` | `/api/scheduled-payments/{scheduledPaymentId}` | 引き落とし予定取消 |
| `GET` | `/api/dashboard/payment-forecast` | 引き落とし不足見込み取得 |

## データモデル

### ScheduledPayment

```json
{
  "scheduledPaymentId": 1,
  "accountId": 10,
  "paymentName": "三井住友カード支払い",
  "scheduledDate": "2026-04-27",
  "amount": "58240",
  "status": "PENDING",
  "note": "3月利用分",
  "createdAt": "2026-04-05T10:00:00",
  "updatedAt": "2026-04-05T10:00:00"
}
```

### ScheduledPaymentStatus

- `PENDING`
- `COMPLETED`
- `CANCELED`

## 引き落とし予定 API

### GET /api/scheduled-payments

#### 目的

- 一覧画面表示
- 期間絞り込み
- 口座別確認

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `accountId` | `number` | 任意 | 対象口座で絞り込む |
| `status` | `string` | 任意 | `PENDING` / `COMPLETED` / `CANCELED` |
| `fromDate` | `string` | 任意 | `YYYY-MM-DD`。予定日の開始 |
| `toDate` | `string` | 任意 | `YYYY-MM-DD`。予定日の終了 |

#### 並び順

- `scheduledDate asc`
- 同日内は `scheduledPaymentId asc`

#### 成功レスポンス

```json
[
  {
    "scheduledPaymentId": 1,
    "accountId": 10,
    "paymentName": "家賃",
    "scheduledDate": "2026-04-25",
    "amount": "85000",
    "status": "PENDING",
    "note": null,
    "createdAt": "2026-04-05T10:00:00",
    "updatedAt": "2026-04-05T10:00:00"
  },
  {
    "scheduledPaymentId": 2,
    "accountId": 10,
    "paymentName": "三井住友カード支払い",
    "scheduledDate": "2026-04-27",
    "amount": "58240",
    "status": "PENDING",
    "note": "3月利用分",
    "createdAt": "2026-04-05T10:03:00",
    "updatedAt": "2026-04-05T10:03:00"
  }
]
```

### POST /api/scheduled-payments

#### 目的

- 引き落とし予定を 1 件登録する

#### リクエスト

```json
{
  "accountId": 10,
  "paymentName": "三井住友カード支払い",
  "scheduledDate": "2026-04-27",
  "amount": "58240",
  "status": "PENDING",
  "note": "3月利用分"
}
```

#### バリデーション

- `accountId` は必須
- `paymentName` は必須、100 文字以内
- `scheduledDate` は必須
- `amount > 0`
- `status` は省略時 `PENDING`
- `status` 指定時は `PENDING` / `COMPLETED` / `CANCELED` のいずれか
- 対象口座は存在必須
- 対象口座は `balanceSide = ASSET` 必須

#### 成功レスポンス

- `201 Created`

```json
{
  "scheduledPaymentId": 3,
  "accountId": 10,
  "paymentName": "三井住友カード支払い",
  "scheduledDate": "2026-04-27",
  "amount": "58240",
  "status": "PENDING",
  "note": "3月利用分",
  "createdAt": "2026-04-05T10:03:00",
  "updatedAt": "2026-04-05T10:03:00"
}
```

### PUT /api/scheduled-payments/{scheduledPaymentId}

#### 目的

- 引き落とし予定を更新する
- 完了・取消への状態変更にも使う

#### リクエスト

```json
{
  "accountId": 10,
  "paymentName": "三井住友カード支払い",
  "scheduledDate": "2026-04-27",
  "amount": "58240",
  "status": "COMPLETED",
  "note": "口座引き落とし済み"
}
```

#### バリデーション

- `POST` と同じ
- `scheduledPaymentId` は存在必須

#### 成功レスポンス

- `200 OK`

```json
{
  "scheduledPaymentId": 3,
  "accountId": 10,
  "paymentName": "三井住友カード支払い",
  "scheduledDate": "2026-04-27",
  "amount": "58240",
  "status": "COMPLETED",
  "note": "口座引き落とし済み",
  "createdAt": "2026-04-05T10:03:00",
  "updatedAt": "2026-04-27T09:00:00"
}
```

### DELETE /api/scheduled-payments/{scheduledPaymentId}

#### 目的

- 予定を一覧から外す

#### 初版方針

- API 名は `DELETE` とする
- 内部実装は物理削除ではなく `status = CANCELED` 更新を優先する
- 将来の監査や記事用説明を考え、履歴を残しやすくする

#### 成功レスポンス

- `200 OK`

```json
{
  "scheduledPaymentId": 3,
  "status": "CANCELED"
}
```

## ダッシュボード不足見込み API

### GET /api/dashboard/payment-forecast

#### 目的

- ダッシュボードで直近期間の引き落とし不足見込みを確認する

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `fromDate` | `string` | 必須 | `YYYY-MM-DD` |
| `toDate` | `string` | 必須 | `YYYY-MM-DD` |

#### ルール

- `fromDate <= toDate`
- 初版では最大 31 日まで
- 集計対象は `status = PENDING`

#### レスポンス

```json
{
  "fromDate": "2026-04-05",
  "toDate": "2026-05-05",
  "accounts": [
    {
      "accountId": 10,
      "providerName": "住信SBIネット銀行",
      "accountName": "メイン口座",
      "currentBalance": "120000",
      "scheduledPaymentTotal": "143240",
      "projectedBalance": "-23240",
      "shortageAmount": "23240",
      "hasShortage": true,
      "payments": [
        {
          "scheduledPaymentId": 1,
          "paymentName": "家賃",
          "scheduledDate": "2026-04-25",
          "amount": "85000",
          "status": "PENDING"
        },
        {
          "scheduledPaymentId": 2,
          "paymentName": "三井住友カード支払い",
          "scheduledDate": "2026-04-27",
          "amount": "58240",
          "status": "PENDING"
        }
      ]
    }
  ],
  "totals": {
    "scheduledPaymentTotal": "143240",
    "shortageAccountCount": 1,
    "shortageAmountTotal": "23240"
  }
}
```

#### レスポンス項目

##### accounts

- 口座単位の不足見込み一覧
- `scheduledPaymentTotal` は期間内 `PENDING` 合計
- `projectedBalance = currentBalance - scheduledPaymentTotal`
- `shortageAmount = max(0, scheduledPaymentTotal - currentBalance)`

##### payments

- 対象口座にひも付く期間内 `PENDING` 一覧
- 並び順は `scheduledDate asc`, `scheduledPaymentId asc`

##### totals

- ダッシュボード上部表示向け集計

#### エラー仕様

| ステータス | コード | 条件 |
| --- | --- | --- |
| `400 Bad Request` | `INVALID_DATE_FORMAT` | `fromDate` または `toDate` が不正 |
| `400 Bad Request` | `INVALID_DATE_RANGE` | `fromDate > toDate` |
| `400 Bad Request` | `DATE_RANGE_TOO_LARGE` | 31 日超 |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | 想定外エラー |

## 主要な業務エラー

| ステータス | コード | 条件 |
| --- | --- | --- |
| `400 Bad Request` | `VALIDATION_ERROR` | 必須不足、形式不正、数値不正 |
| `404 Not Found` | `ACCOUNT_NOT_FOUND` | 指定口座が存在しない |
| `404 Not Found` | `SCHEDULED_PAYMENT_NOT_FOUND` | 指定予定が存在しない |
| `409 Conflict` | `ACCOUNT_BALANCE_SIDE_NOT_SUPPORTED` | `balanceSide != ASSET` |

## 認証 / 認可

初版ではなし。

- 既存 API と同様、ローカル単独利用前提を維持する
- 将来 `User` 導入時は `accountId` 所有者チェックを追加する

## 互換性方針

- 初版では URL バージョンなし
- 後方互換を保つ範囲でレスポンス項目を追加する
- 繰り返し予定や自動消込が必要になった場合は、既存 `ScheduledPayment` を壊さず補助項目や別 API で拡張する

## 保留事項

- `DELETE` を完全に `CANCELED` 更新へ固定するか
- ダッシュボードの既存 `/api/dashboard/balance-summary` に統合するか、別 API のままにするか
- クレジットカード口座から `CreditCardProfile` を利用して予定候補を半自動生成するか
