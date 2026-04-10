# ScheduledPayment 設計メモ

## 目的

`ScheduledPayment` を、将来の引き落とし予定を管理する独立モデルとして定義する。
初版では「引き落とし不足の事前確認」を最優先にし、実績取引である `Transaction` とは責務を分離する。

## 方針サマリ

- `ScheduledPayment` は将来の引き落とし予定を表す
- 実績反映済みの明細は `Transaction`、予定は `ScheduledPayment` として分ける
- 初版は単発予定のみを対象にし、繰り返しルールは入れない
- 登録対象口座は `balanceSide = ASSET` の口座に限定する
- 不足判定は「現在残高 - 期間内の未完了予定額合計」で行う
- ダッシュボードでは期間内の予定額合計と不足見込みを参照表示する
- 一覧画面では CRUD を提供し、完了・取消の状態管理をできるようにする

## 背景

既存の `Transaction` は実際に発生した入出金を表すため、将来の口座引き落としをそのまま入れると「実残高」と「予定残高」が混ざる。
不足判定では、今の残高を保ったまま「今後いくら引かれるか」を別軸で見たい。

そのため、次のように責務を分ける。

- `Transaction`
  - 発生済みの実績
  - 現在残高の計算対象
- `ScheduledPayment`
  - 未発生の予定
  - 不足見込みの計算対象

## ユースケース

### 想定する操作

- 銀行口座からの引き落とし予定を登録する
- 予定の金額、日付、名称、メモを更新する
- 不要になった予定を取消する
- 実際に引き落としが終わったら完了にする
- ダッシュボードで直近期間の予定額合計と不足見込みを確認する

### 初版で対象にするもの

- クレジットカード支払い予定の手動登録
- 家賃、通信費、サブスクなどの単発予定登録
- 直近 30 日などの期間内不足判定

### 初版で対象外にするもの

- 毎月自動生成される繰り返し予定
- `CreditCardProfile` からの自動請求生成
- `Transaction` 登録時の自動消込
- 祝日カレンダーを使った支払日補正

## ドメイン責務

### ScheduledPayment

`ScheduledPayment` は「どの口座から」「いつ」「いくら」「何のために」引き落とされる予定かを表す。

保持したい最小情報は次の通り。

- 対象口座
- 予定日
- 予定額
- 表示名
- 状態
- 任意メモ

### ScheduledPaymentStatus

初版の状態は次の 3 つとする。

- `PENDING`
  - 未完了。不足判定の対象
- `COMPLETED`
  - 引き落とし完了。不足判定の対象外
- `CANCELED`
  - 取消済み。不足判定の対象外

状態を持たせる理由は、削除だけでは「予定が消えた」のか「実行済みなのか」を区別できないため。

## DB 論理設計

### テーブル一覧

| 論理名 | 物理名 | 用途 |
| --- | --- | --- |
| 引き落とし予定 | `t_scheduled_payment` | 将来の引き落とし予定を保持する |

### t_scheduled_payment

| カラム名 | 型 | NULL | 用途 |
| --- | --- | --- | --- |
| `scheduled_payment_id` | `bigserial` | No | 主キー |
| `account_id` | `bigint` | No | 引き落とし対象口座 ID |
| `payment_name` | `varchar(100)` | No | 一覧やダッシュボードに出す表示名 |
| `scheduled_date` | `date` | No | 引き落とし予定日 |
| `amount` | `numeric(19, 2)` | No | 引き落とし予定額 |
| `status` | `varchar(20)` | No | `PENDING` / `COMPLETED` / `CANCELED` |
| `note` | `varchar(500)` | Yes | 補足メモ |
| `created_at` | `timestamp` | No | 作成日時 |
| `updated_at` | `timestamp` | No | 更新日時 |

### 制約

- PK
  - `scheduled_payment_id`
- FK
  - `account_id -> m_account.account_id`
- CHECK
  - `amount > 0`
  - `status in ('PENDING', 'COMPLETED', 'CANCELED')`

### テーブルコメント案

- テーブルコメント
  - `引き落とし予定`
- カラムコメント
  - `scheduled_payment_id`: `引き落とし予定ID`
  - `account_id`: `引き落とし対象口座ID`
  - `payment_name`: `引き落とし名`
  - `scheduled_date`: `引き落とし予定日`
  - `amount`: `引き落とし予定額`
  - `status`: `引き落とし予定状態`
  - `note`: `メモ`
  - `created_at`: `作成日時`
  - `updated_at`: `更新日時`

## 業務ルール

### 登録時ルール

- `accountId` は必須
- `paymentName` は必須
- `scheduledDate` は必須
- `amount > 0`
- 初版では `account.balanceSide = ASSET` の口座のみ登録可
- 初版では `status` 未指定時は `PENDING`

### 更新時ルール

- `PENDING` の予定は内容変更可
- `COMPLETED` と `CANCELED` も初版では再編集可とするが、`status` の変更履歴は持たない
- ただし実装時に扱いが複雑なら、初版では完了・取消済みは編集不可に寄せてもよい

### 削除方針

- 初版は物理削除 API を提供する
- ただし通常運用では `status = CANCELED` を推奨し、履歴を残せるようにする
- 画面上は「取消」と「削除」を分けず、まずは削除操作を `CANCELED` 更新に寄せる案を優先する

実装では次のどちらかに統一する。

1. `DELETE` は物理削除
2. `DELETE` は内部的に `CANCELED` 更新

初版では履歴を残せる 2 を優先する。

## 不足判定ルール

### 目的

対象期間内に予定されている引き落とし額合計に対して、現在残高が足りるかを確認する。

### 集計対象

- `status = PENDING`
- `scheduledDate` が指定期間内

### 集計単位

- 口座単位

### 判定式

```text
projectedBalance = currentBalance - pendingScheduledPaymentTotal
shortageAmount = max(0, pendingScheduledPaymentTotal - currentBalance)
hasShortage = projectedBalance < 0
```

### 初版ルール

- 既存 `Account.currentBalance` を起点にする
- `ScheduledPayment` 同士の時系列順序ではなく、期間内合計で判定する
- 同日内の優先順や日次残高推移までは扱わない

### 将来拡張

- 日次推移での不足判定
- `CreditCardProfile.paymentDay` との連携
- 祝日補正を含む予定日の再計算
- `Transaction` 実績との消込

## API / 画面方針

### API

初版では次を用意する。

- `GET /api/scheduled-payments`
- `POST /api/scheduled-payments`
- `PUT /api/scheduled-payments/{scheduledPaymentId}`
- `DELETE /api/scheduled-payments/{scheduledPaymentId}`
- `GET /api/dashboard/payment-forecast`

詳細は [scheduled-payment-api-spec.md](/C:/Users/jacks/Documents/flowlet/docs/specs/scheduled-payment-api-spec.md) に分離する。

### 画面

- 専用ページ
  - `ScheduledPaymentPage`
  - 一覧と登録フォームを同一ページに置く
- ダッシュボード
  - 直近期間の予定額合計
  - 不足口座数
  - 口座ごとの不足見込み一覧

### フロントで必要な最低限の表示

- 予定一覧
  - 予定日
  - 口座名
  - 引き落とし名
  - 金額
  - 状態
- フォーム
  - 口座
  - 引き落とし名
  - 予定日
  - 金額
  - 状態
  - メモ
- ダッシュボード
  - 期間内予定額合計
  - 予測残高
  - 不足有無

## テスト観点

### バックエンド

- `amount <= 0` を弾く
- `balanceSide = LIABILITY` 口座を弾く
- 存在しない `accountId` を弾く
- `PENDING` のみ不足判定に含む
- `COMPLETED` と `CANCELED` を不足判定から除外する
- 期間外予定を除外する
- 口座ごとの予定額合計と予測残高を正しく返す

### フロントエンド

- 一覧取得成功時に状態ごとの予定を表示できる
- 保存失敗時にエラーを表示できる
- ダッシュボードで不足あり口座を視認できる

## 実装順

1. `t_scheduled_payment` の migration を追加する
2. domain / repository / JPA entity を追加する
3. CRUD API を追加する
4. `GET /api/dashboard/payment-forecast` を追加する
5. `ScheduledPaymentPage` を追加する
6. ダッシュボードへ不足見込み表示を追加する
7. テストを追加する

## 論点

### DELETE の扱い

履歴を残したいので、初版でも「削除ボタンは内部的に `CANCELED` 更新」に寄せる方が後続実装しやすい。
実装コストを優先するなら物理削除でもよいが、ダッシュボードの検証や記事化では履歴が残る方が説明しやすい。

### クレジットカード請求との関係

初版では `CreditCardProfile` から自動生成しない。
まずは手動登録でユースケースを成立させ、その後に「カード請求予定の自動起票」を別タスクに切り出す。

### 不足判定の粒度

初版は期間合計で判定する。
日別の残高推移を先に入れると、UI も API も一段複雑になるため後続に回す。

