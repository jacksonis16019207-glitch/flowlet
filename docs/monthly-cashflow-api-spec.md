# 月次収支集計 API 仕様

## 目的

- ダッシュボードで一定期間の月次収支をまとめて確認できるようにする
- 既存の `Transaction` データから、月ごとの収入、支出、差額を読み取り専用で返す
- 将来的なカテゴリ別集計やグラフ表示の土台になる API を先に定義する

## 想定ユースケース

- ダッシュボードで直近数か月の収支推移を確認する
- 振替や配分を除いた実質的な収入、支出を月単位で把握する
- 「今月はどれだけ増えたか、減ったか」を残高集計とあわせて確認する

## エンドポイント

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/dashboard/monthly-cashflow` | 月次収支集計の取得 |

## クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `fromMonth` | `string` | 必須 | 集計開始月。形式は `YYYY-MM` |
| `toMonth` | `string` | 必須 | 集計終了月。形式は `YYYY-MM` |

- `fromMonth <= toMonth` を必須とする
- 初版では集計範囲を最大 12 か月とする
- 初版では月単位固定とし、日単位の絞り込みは追加しない

例:

- `GET /api/dashboard/monthly-cashflow?fromMonth=2026-01&toMonth=2026-04`

## レスポンス

```json
{
  "fromMonth": "2026-01",
  "toMonth": "2026-04",
  "months": [
    {
      "month": "2026-01",
      "income": 280000,
      "expense": 192000,
      "net": 88000
    },
    {
      "month": "2026-02",
      "income": 280000,
      "expense": 205000,
      "net": 75000
    },
    {
      "month": "2026-03",
      "income": 281000,
      "expense": 210500,
      "net": 70500
    },
    {
      "month": "2026-04",
      "income": 0,
      "expense": 68400,
      "net": -68400
    }
  ],
  "totals": {
    "income": 841000,
    "expense": 675900,
    "net": 165100
  }
}
```

## レスポンス項目

### fromMonth / toMonth

- 実際に集計した開始月と終了月
- フロント側で見出しや表示範囲確認に使う

### months

- 月ごとの収支一覧
- `month` 昇順で返す
- 取引が 0 件の月も、指定範囲内であれば `income = 0`、`expense = 0`、`net = 0` で返す

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `month` | `string` | 対象月。形式は `YYYY-MM` |
| `income` | `number` | その月の収入合計 |
| `expense` | `number` | その月の支出合計 |
| `net` | `number` | `income - expense` |

### totals

- 指定期間全体の合計
- ダッシュボード上部の集計カードや補助表示に使う

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `income` | `number` | 指定期間の収入合計 |
| `expense` | `number` | 指定期間の支出合計 |
| `net` | `number` | 指定期間の差額合計 |

## 集計ルール

### 対象データ

- `Transaction` を集計対象とする
- `GoalBucketAllocation` は収支ではなく口座内配分なので対象外とする

### 収入に含めるもの

- `transactionType = INCOME`

### 支出に含めるもの

- `transactionType = EXPENSE`

### 集計から除外するもの

- `transactionType = TRANSFER_OUT`
- `transactionType = TRANSFER_IN`
- `GoalBucketAllocation`

### GoalBucket 付き取引の扱い

- `goalBucketId` 付き `Transaction` でも、`transactionType` が `INCOME` または `EXPENSE` であれば収支に含める
- 理由は、目的別口座へのひも付け有無ではなく、実際の収入・支出であるかを優先して月次収支を見たいから

### 月の判定基準

- `transactionDate` の属する年月で集計する
- タイムゾーン変換は行わず、保存済み `LocalDate` をそのまま使う

## エラー仕様

| ステータス | コード | 条件 |
| --- | --- | --- |
| `400 Bad Request` | `INVALID_MONTH_FORMAT` | `fromMonth` または `toMonth` が `YYYY-MM` 形式でない |
| `400 Bad Request` | `INVALID_MONTH_RANGE` | `fromMonth > toMonth` |
| `400 Bad Request` | `MONTH_RANGE_TOO_LARGE` | 集計範囲が 12 か月を超える |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | 想定外エラー |

初版では、該当取引が 0 件でもエラーにせず `200 OK` を返す。

## 認証/認可

初版ではなし。

- 現在のローカル単独利用前提に合わせ、既存ダッシュボード API と同様に認証・認可は入れない
- 将来 `User` を導入するときは、対象ユーザーの取引だけを集計する

## 互換性方針

- 初版では読み取り専用 API とし、後方互換を保つ範囲でレスポンス項目を追加する
- 将来カテゴリ別内訳や口座別内訳を追加する場合は、既存 `months[*].income/expense/net` は変更しない
- 破壊的変更が必要な場合は別エンドポイントまたはバージョン付きパスを検討する

## 実装方針

- 集計元は既存 `TransactionRepository` を利用する
- 取引種別の解釈は `TransactionType` を基準に統一し、口座の `balanceSide` には依存しない
- ダッシュボード用に専用 DTO を追加し、既存の残高集計 API とは分離する

## 保留事項

- 初版をダッシュボード内カード表示にするか、専用セクションにするか
- カテゴリ別内訳を同 API に含めるか、別 API に分離するか
- 月次収支の比較対象として「前月比」を API で返すか、フロント側計算にするか
