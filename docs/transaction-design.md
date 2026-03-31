# 取引設計メモ

## 目的

`Transaction` 周辺の設計方針を、実装前の整理メモとして残す。
ここでは、口座共通化、クレジットカード対応、カテゴリ設計、通常取引と振替取引の責務分離までを対象にする。

## 方針サマリ

- `Account` は銀行口座だけでなく、資産・負債の管理対象全般を表す共通マスタとして扱う
- クレジットカード固有情報は `m_account` に混ぜず、`m_credit_card_profile` に分離する
- `Transaction` は日々のお金の動きの明細を表す
- 振替は 1 操作で 2 明細を作る
- カテゴリは大分類を必須、小分類を任意とする
- frontend は通常取引と振替取引で責務を分けるが、UI はタブ切り替えで提供する
- `GoalBucket` と `Transaction` の関係は未確定論点として保留する

## Account 共通化

### 考え方

`Account` は銀行口座専用ではなく、資産・負債の管理対象全般を表す。
対象例は次の通り。

- 銀行口座
- クレジットカード
- 現金
- 電子マネー

### m_account

`m_account` は共通マスタに徹し、カード専用情報は持たせない。

| カラム名 | 用途 |
| --- | --- |
| `account_id` | 主キー |
| `account_name` | アプリ内表示名 |
| `provider_name` | 提供元名 |
| `account_category` | 管理対象区分 |
| `balance_side` | 残高区分 |
| `is_active` | 利用中フラグ |
| `display_order` | 表示順 |
| `created_at` | 作成日時 |
| `updated_at` | 更新日時 |

### account_category

初期候補は次の通り。

- `BANK`
- `CREDIT_CARD`
- `CASH`
- `EWALLET`
- `OTHER`

### balance_side

`balance_side` は明示カラムで持つ。

- `ASSET`
- `LIABILITY`

`account_category` は種類、`balance_side` は残高の意味を表す。責務が異なるため分離する。

## クレジットカード固有情報

### 方針

クレジットカード固有情報は `m_credit_card_profile` に切り出す。

### m_credit_card_profile

| カラム名 | 用途 |
| --- | --- |
| `account_id` | カード口座の `account_id` |
| `payment_account_id` | 引き落とし元口座 |
| `closing_day` | 締め日 |
| `payment_day` | 支払日 |
| `payment_date_adjustment_rule` | 支払日補正ルール |
| `created_at` | 作成日時 |
| `updated_at` | 更新日時 |

### 支払日補正ルール

初期候補は次の通り。

- `NONE`
- `NEXT_BUSINESS_DAY`
- `PREVIOUS_BUSINESS_DAY`

祝日カレンダー自体の実装は後続とし、まずは補正ルールを保持できるようにする。

## カテゴリ設計

### 方針

- 大分類は必須
- 小分類は任意
- 迷ったときは大分類だけで登録できる
- 細分化したい時は小分類まで付ける

### m_category

| カラム名 | 用途 |
| --- | --- |
| `category_id` | 主キー |
| `category_name` | 大分類名 |
| `category_type` | 分類種別 |
| `display_order` | 表示順 |
| `is_active` | 利用中フラグ |
| `created_at` | 作成日時 |
| `updated_at` | 更新日時 |

### m_subcategory

| カラム名 | 用途 |
| --- | --- |
| `subcategory_id` | 主キー |
| `category_id` | 親カテゴリ |
| `subcategory_name` | 小分類名 |
| `display_order` | 表示順 |
| `is_active` | 利用中フラグ |
| `created_at` | 作成日時 |
| `updated_at` | 更新日時 |

### category_type

初期候補は次の通り。

- `INCOME`
- `EXPENSE`
- `TRANSFER`

### 運用イメージ

例:

- `食費`
  - `食料品`
  - `コンビニ`
  - `外食`
- `交通費`
  - `電車`
  - `バス`
  - `タクシー`
- `振替`
  - `口座間移動`
  - `カード支払`

## Transaction 設計

### 役割

`Transaction` は、ある管理対象に対して発生した 1 件の明細を表す。
銀行口座の入出金、クレジットカード利用、現金支出などを同じモデルで扱う。

### transaction_type

初期候補は次の通り。

- `INCOME`
- `EXPENSE`
- `TRANSFER_OUT`
- `TRANSFER_IN`

### t_transaction

| カラム名 | 用途 |
| --- | --- |
| `transaction_id` | 主キー |
| `account_id` | 明細が属する管理対象 |
| `goal_bucket_id` | 目的別口座との関連 |
| `category_id` | 大分類 |
| `subcategory_id` | 小分類 |
| `transaction_type` | 取引種別 |
| `transaction_date` | 発生日 |
| `amount` | 金額 |
| `description` | 一覧用の短い内容 |
| `note` | 補足メモ |
| `transfer_group_id` | 振替グループ識別子 |
| `created_at` | 作成日時 |
| `updated_at` | 更新日時 |

### 確定ルール

- `category_id` は必須
- `subcategory_id` は任意
- `subcategory_id` がある場合は `category_id` と整合必須
- `amount` は常に正数
- `description` と `note` は分ける
- `TRANSFER_OUT` / `TRANSFER_IN` は最初から採用する

### category_type との対応

- `INCOME` は `category_type = INCOME` のみ許可
- `EXPENSE` は `category_type = EXPENSE` のみ許可
- `TRANSFER_OUT` は `category_type = TRANSFER` のみ許可
- `TRANSFER_IN` は `category_type = TRANSFER` のみ許可

## balance_side と残高計算

`Transaction` の意味は口座種別ごとに変えず、残高への反映だけを `balance_side` で変える。

### ASSET

- `INCOME` で増える
- `EXPENSE` で減る
- `TRANSFER_IN` で増える
- `TRANSFER_OUT` で減る

### LIABILITY

- `INCOME` で減る
- `EXPENSE` で増える
- `TRANSFER_IN` で減る
- `TRANSFER_OUT` で増える

例:

- 銀行口座での支出は `ASSET + EXPENSE`
- クレジットカード利用は `LIABILITY + EXPENSE`
- カード支払いは銀行口座側が `ASSET + TRANSFER_OUT`、カード側が `LIABILITY + TRANSFER_IN`

## 振替設計

### 基本方針

振替は 1 回の操作で 2 明細を作る。

- 出金側: `TRANSFER_OUT`
- 入金側: `TRANSFER_IN`

2 明細には同じ `transfer_group_id` を入れる。

### transfer_group_id

- 型は `uuid`
- 通常取引では `NULL`
- 振替系の 2 明細に同じ値を入れて 1 イベントとして結び付ける

### 振替入力

振替入力は通常取引と分ける。

入力項目:

- `fromAccountId`
- `toAccountId`
- `categoryId`
- `subcategoryId nullable`
- `transactionDate`
- `amount`
- `description`
- `note nullable`

### 通常取引入力

通常取引入力は実質 `INCOME` / `EXPENSE` 専用とする。

入力項目:

- `accountId`
- `goalBucketId nullable`
- `categoryId`
- `subcategoryId nullable`
- `transactionType`
- `transactionDate`
- `amount`
- `description`
- `note nullable`

### frontend 方針

- 通常取引と振替取引で内部責務は分ける
- UI は同一画面内のタブ切り替えで提供する

## GoalBucket 配分設計

### 背景

`GoalBucket` を目的資金の箱として扱う場合、実口座残高が動かない「口座内配分」を `Transaction` だけで表すのは難しい。
たとえば、未配分残高から旅行用 `GoalBucket` へ資金を移す操作では、`Account` の総残高は変わらず、内訳だけが変わる。

このため、`Transaction` とは別に、`GoalBucket` 配分専用イベントを持つ前提で整理する。

### 方針

- `Transaction` は実口座残高が動く明細を表す
- `GoalBucketAllocation` は同一 `Account` 内の未配分残高と `GoalBucket` 残高の配分変更を表す
- `GoalBucket` 残高は `Transaction` と `GoalBucketAllocation` の両方で増減する
- frontend では複数配分を 1 回で操作できるが、保存は配分先ごとの独立レコードへ展開する

### GoalBucketAllocation

仮名は `GoalBucketAllocation` とする。
1 レコードは 1 つの配分先への配分を表す。

| カラム名 | 用途 |
| --- | --- |
| `allocation_id` | 主キー |
| `account_id` | 配分対象の親口座 |
| `from_goal_bucket_id` | 減らす側の `GoalBucket` |
| `to_goal_bucket_id` | 増やす側の `GoalBucket` |
| `allocation_date` | 配分日 |
| `amount` | 金額 |
| `description` | 一覧用の短い内容 |
| `note` | 補足メモ |
| `linked_transfer_group_id` | 関連する振替グループ識別子 |
| `created_at` | 作成日時 |
| `updated_at` | 更新日時 |

### ルール

- `amount` は常に正数
- `from_goal_bucket_id` と `to_goal_bucket_id` の両方 `NULL` は不可
- `from_goal_bucket_id` と `to_goal_bucket_id` に同じ値は入れない
- `from_goal_bucket_id` がある場合は `account_id` 配下の `GoalBucket` であること
- `to_goal_bucket_id` がある場合は `account_id` 配下の `GoalBucket` であること

### 表現できる操作

- 未配分 → `GoalBucket`
  - `from_goal_bucket_id = NULL`
  - `to_goal_bucket_id = 対象GoalBucket`
- `GoalBucket` → 未配分
  - `from_goal_bucket_id = 対象GoalBucket`
  - `to_goal_bucket_id = NULL`
- `GoalBucket` → `GoalBucket`
  - `from_goal_bucket_id = 元GoalBucket`
  - `to_goal_bucket_id = 先GoalBucket`

### 複数配分

画面上では 1 回の操作で複数の配分先を指定できる。
ただし保存時は、配分先ごとに `GoalBucketAllocation` を複数レコード作成する。

例:

- 未配分から旅行へ 30,000
- 未配分から特別費へ 20,000

は、次の 2 レコードとして保存する。

1.
- `from_goal_bucket_id = NULL`
- `to_goal_bucket_id = 旅行`
- `amount = 30000`

2.
- `from_goal_bucket_id = NULL`
- `to_goal_bucket_id = 特別費`
- `amount = 20000`

### 金額指定と割合指定

配分 UI は次の 2 パターンに対応する。

- 金額指定
- 割合指定

ただし保存時はどちらも確定金額へ展開して `GoalBucketAllocation.amount` に保存する。
割合自体は UI 上の入力方式として扱い、DB の必須保存項目にはしない。

### GoalBucket 残高への反映

`goal_bucket_id` が付いた `Transaction` は次のルールで `GoalBucket` 残高へ反映する。

- `INCOME` で増える
- `EXPENSE` で減る
- `TRANSFER_IN` で増える
- `TRANSFER_OUT` で減る

`GoalBucketAllocation` は次のルールで反映する。

- `to_goal_bucket_id` 側で増える
- `from_goal_bucket_id` 側で減る

### 振替時の GoalBucket ルール

`goal_bucket_id` の許可ルールは次の通り。

- `INCOME`: 許可
- `EXPENSE`: 許可
- `TRANSFER_OUT`: 許可
- `TRANSFER_IN`: 不許可

#### 意味

- `INCOME`
  - その `GoalBucket` に対する収入
- `EXPENSE`
  - その `GoalBucket` に対する支出
- `TRANSFER_OUT`
  - その `GoalBucket` から他口座へ資金を出す
- `TRANSFER_IN`
  - 受け口座への資金移動のみを表す
  - どの `GoalBucket` へ入れるかは `GoalBucketAllocation` で表す

#### 例

貯金口座の旅行用 `GoalBucket` からメイン口座へ 10,000 円戻す場合:

- 貯金口座側
  - `TRANSFER_OUT`
  - `goal_bucket_id = 旅行`
- メイン口座側
  - `TRANSFER_IN`
  - `goal_bucket_id = NULL`

メイン口座から貯金口座へ 30,000 円移し、その後に旅行用 `GoalBucket` へ配分する場合:

1. 口座間振替
- メイン口座側
  - `TRANSFER_OUT`
  - `goal_bucket_id = NULL`
- 貯金口座側
  - `TRANSFER_IN`
  - `goal_bucket_id = NULL`

2. 口座内配分
- `GoalBucketAllocation`
  - 未配分 → 旅行

この方針により、口座間移動と口座内配分の責務を分ける。

### frontend への影響

将来的には次のタブ構成が候補になる。

- 通常取引
- 振替
- 配分

`振替` タブで配分を行う場合は、`配分` タブで使う配分 UI をそのまま表示できる構成を目指す。
ただし、実装順は別途判断する。

## 残高計算と未配分残高

### Account 残高

`Account` 残高は、その `account_id` に属する `Transaction` のみから計算する。

#### ASSET

- `INCOME` で増える
- `EXPENSE` で減る
- `TRANSFER_IN` で増える
- `TRANSFER_OUT` で減る

#### LIABILITY

- `INCOME` で減る
- `EXPENSE` で増える
- `TRANSFER_IN` で減る
- `TRANSFER_OUT` で増える

### GoalBucket 残高

`GoalBucket` 残高は、次の 2 系統を合算して計算する。

- `goal_bucket_id` が付いた `Transaction`
- `GoalBucketAllocation`

`goal_bucket_id` が付いた `Transaction` の反映ルールは次の通り。

- `INCOME` で増える
- `EXPENSE` で減る
- `TRANSFER_IN` で増える
- `TRANSFER_OUT` で減る

`GoalBucketAllocation` の反映ルールは次の通り。

- `to_goal_bucket_id` 側で増える
- `from_goal_bucket_id` 側で減る

### 未配分残高

未配分残高は、口座全体の残高から、同一 `Account` 配下の `GoalBucket` 残高合計を差し引いて求める。

```text
未配分残高 = Account残高 - 配下GoalBucket残高合計
```

### 擬似コード

```text
function calculateAccountBalance(account, transactions):
    balance = 0

    for each transaction in transactions where transaction.accountId == account.accountId:
        delta = calculateAccountDelta(account.balanceSide, transaction.transactionType, transaction.amount)
        balance = balance + delta

    return balance

function calculateAccountDelta(balanceSide, transactionType, amount):
    if balanceSide == ASSET:
        if transactionType == INCOME:
            return +amount
        if transactionType == EXPENSE:
            return -amount
        if transactionType == TRANSFER_IN:
            return +amount
        if transactionType == TRANSFER_OUT:
            return -amount

    if balanceSide == LIABILITY:
        if transactionType == INCOME:
            return -amount
        if transactionType == EXPENSE:
            return +amount
        if transactionType == TRANSFER_IN:
            return -amount
        if transactionType == TRANSFER_OUT:
            return +amount

function calculateGoalBucketBalance(goalBucket, transactions, allocations):
    balance = 0

    for each transaction in transactions where transaction.goalBucketId == goalBucket.goalBucketId:
        delta = calculateGoalBucketTransactionDelta(transaction.transactionType, transaction.amount)
        balance = balance + delta

    for each allocation in allocations where allocation.accountId == goalBucket.accountId:
        if allocation.toGoalBucketId == goalBucket.goalBucketId:
            balance = balance + allocation.amount

        if allocation.fromGoalBucketId == goalBucket.goalBucketId:
            balance = balance - allocation.amount

    return balance

function calculateGoalBucketTransactionDelta(transactionType, amount):
    if transactionType == INCOME:
        return +amount
    if transactionType == EXPENSE:
        return -amount
    if transactionType == TRANSFER_IN:
        return +amount
    if transactionType == TRANSFER_OUT:
        return -amount

function calculateUnallocatedBalance(account, goalBuckets, transactions, allocations):
    accountBalance = calculateAccountBalance(account, transactions)

    allocatedBalance = 0
    for each goalBucket in goalBuckets where goalBucket.accountId == account.accountId:
        allocatedBalance = allocatedBalance + calculateGoalBucketBalance(goalBucket, transactions, allocations)

    return accountBalance - allocatedBalance
```

### 補足

- `GoalBucketAllocation` は `Account` 残高に影響しない
- `GoalBucketAllocation` は `GoalBucket` 残高と未配分残高の内訳だけを動かす
- 未配分残高や `GoalBucket` 残高がマイナスになるケースはありうるため、入力制御や UI 表示で扱いを別途検討する

## 未確定論点

### GoalBucket と Transaction の関係

`GoalBucket` は `Transaction` と `GoalBucketAllocation` の両方に関係する前提を置いた。
ただし次の論点はまだ残っている。

- `TRANSFER_IN` を将来も不許可のままにするか

### 請求確定と不足判定

クレジットカード利用明細は `Transaction` で扱うが、請求確定額と不足判定は別概念として扱う前提を維持する。
将来的には `ScheduledPayment` か別モデルで整理する。
