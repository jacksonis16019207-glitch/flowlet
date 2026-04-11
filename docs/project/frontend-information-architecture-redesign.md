# Frontend Information Architecture Redesign

最終更新: 2026-04-10

## 目的

- 現在の機能は維持したまま、画面の分け方と導線をゼロベースで整理し直す
- `Dashboard` は把握、`Ledger` は記録、`Accounts` は口座管理、`Settings` は全体設定とマスタ管理に役割を分離する
- `ui-ux-pro-max` の観点で、情報量を減らすのではなく、情報の置き場所と優先順位を整える

## 前提

- 機能は削らない
- トップレベルの主要ページは 4 つに絞る
- `Goal Bucket` は独立トップページにしない
- カテゴリ管理は `Settings` 配下に置く
- `Dashboard` では任意月の月次収支を表示できるようにする

## サイトマップ

1. `Dashboard`
2. `Ledger`
3. `Accounts`
4. `Settings`

`Settings` 配下:
- `General`
- `Categories`

`Accounts` 内の詳細遷移:
- `Bank Account Detail`
- `Goal Bucket Detail`
- `Credit Card Detail`

## 全体ナビゲーション方針

- Desktop は左サイドバー、Mobile は bottom navigation を採用する
- 各ページは `PageHeader` を持ち、ページタイトル、短い説明、主CTAまたは補助アクションを置く
- 画面の骨格は `PageHeader`、`SummaryRow`、`MainContent`、`SecondaryContent` を基本形にそろえる
- 詳細確認は modal を増やしすぎず、Desktop では side panel、Mobile では sheet または詳細画面を優先する

## Dashboard

### 役割

- 現在残高と選択月の収支を最短で把握する
- 詳細分析ではなく、全体の状況確認に集中する

### 構成

1. `Page Header`
2. `Monthly Summary`
3. `Focus Area`
4. `Category Overview`
5. `Recent Activity`

### Page Header

- タイトル: `Dashboard`
- 説明: 現在残高と選択月の収支をまとめて確認する
- 月セレクタ
- 補助アクション: `Ledgerで詳しく見る`

### Monthly Summary

- `現在残高`
- `選択月の収入`
- `選択月の支出`
- `選択月の収支`

補足:
- `現在残高` は常に現在時点の値を表示する
- 月セレクタで切り替わるのは月次系の値だけにする
- `未配分残高の合計` はここには置かない

### Focus Area

- その月の収支が黒字か赤字か
- 主要収入カテゴリのハイライト
- 主要支出カテゴリのハイライト
- 大きな変動があった最近の取引

### Category Overview

- `主要収入カテゴリ`
- `主要支出カテゴリ`

各ブロックでは上位 3 から 5 件を表示する。

### Recent Activity

- 最近の取引を 5 件前後表示する
- 日付、説明、種別、口座、金額を表示する
- 全件確認は `Ledger` に誘導する

### このページでやらないこと

- 取引の新規作成
- 振替や配分の実行
- カテゴリ管理
- 口座マスタ管理

## Ledger

### 役割

- 取引、振替、配分を記録し、あとから確認・修正する

### 構成

1. `Page Header`
2. `Period & Filter Bar`
3. `Mode Switch`
4. `Entry Trigger`
5. `Record List`
6. `Detail Panel`

### Page Header

- タイトル: `Ledger`
- 説明: 取引、振替、配分をまとめて管理する
- 主CTA: `新しく記録する`

### Period & Filter Bar

常時表示:
- 月切替
- 種別フィルタ
- 口座フィルタ
- キーワード検索

詳細条件:
- カテゴリフィルタ
- Goal Bucket フィルタ

モード別の扱い:
- `取引` モードではカテゴリフィルタを有効にする
- `振替` モードでは `TRANSFER` 系のみ、または非表示にする
- `配分` モードではカテゴリフィルタを非表示にする

### Mode Switch

- `取引`
- `振替`
- `配分`

### Entry Trigger

- 主CTA 押下で Desktop は right drawer、Mobile は full-screen sheet を開く

入力内容:
- `取引`: 日付、口座、Goal Bucket 任意、収入/支出、カテゴリ、サブカテゴリ、金額、説明、メモ
- `振替`: 日付、出金元口座、入金先口座、元 Goal Bucket 任意、金額、説明、メモ、cashflow treatment
- `配分`: 日付、対象口座、元 Goal Bucket 任意、配分先 Goal Bucket 複数、金額または比率、説明、メモ

### Record List

`取引` モード:
- 日付
- 説明
- 種別
- 口座
- カテゴリ
- 金額

`振替` モード:
- 日付
- 説明
- 出金元
- 入金先
- 金額

`配分` モード:
- 日付
- 説明
- 元口座
- 配分先件数
- 合計金額

### Detail Panel

- 基本情報
- 編集
- 削除
- 関連する配分や振替のまとまり

### カテゴリ追加の扱い

- 本管理は `Settings > Categories`
- `Ledger` では入力中に不足した場合だけ簡易追加を許可する

## Accounts

### 役割

- 銀行口座とクレジットカードを管理する
- 銀行口座に紐づく Goal Bucket とクレジットカードの関係を見せる
- 口座単位の状態把握をしやすくする

### 構成

1. `Page Header`
2. `Account Summary`
3. `Account Filters`
4. `Account List`
5. `Detail`

### Page Header

- タイトル: `Accounts`
- 説明: 銀行口座、クレジットカード、目的別口座をまとめて管理する
- 主CTA: `口座を追加`

### Account Summary

- `銀行口座数`
- `クレジットカード数`
- `総口座残高`

### Account Filters

- キーワード検索
- 状態: `すべて / 有効 / 無効`
- 表示対象: `すべて / 銀行口座 / クレジットカード`
- 並び順

### Account List

共通表示:
- 名称
- 提供元
- 種別
- 現在残高
- 状態

### Bank Account Detail

銀行口座を選んだときはタブ分けせず、上から順に表示する。

1. `口座概要`
- 口座名
- 提供元
- 現在残高
- 未配分残高
- 状態

2. `口座ごとの月次収支`
- 月セレクタ
- 収入
- 支出
- 収支

3. `目的別口座一覧`
- Goal Bucket 名
- 現在残高
- 状態
- クリックで `Goal Bucket Detail` に移動

4. `紐づくクレジットカード一覧`
- カード名
- 利用残高
- 次回支払日
- クリックで `Credit Card Detail` に移動

5. `最近の取引`
- 日付
- 説明
- 種別
- 金額
- 詳細確認は `Ledger` に誘導

### Goal Bucket Detail

- Header
  - Goal Bucket 名
  - 親の銀行口座に戻る導線
  - 編集
- Current Summary
  - 現在残高
  - 所属銀行口座
  - 状態
- Linked Account
  - 所属銀行口座名
  - 親口座詳細への導線
- Balance Movement
  - 月セレクタ
  - 当月配分額
  - 当月取崩額
  - 当月純増減
- Recent Activity
  - 直近の配分や取崩の明細
  - 詳細確認は `Ledger` に誘導

### Credit Card Detail

1. `Header`
- カード名
- 提供元名
- 支払口座へ移動
- 編集

2. `Current Summary`
- `利用残高`
- `支払口座`

3. `Payment Forecast`
- `次回支払日`
- `次回支払額`
- `次々回支払日`
- `次々回支払額`

4. `Payment Info`
- 締め日
- 支払日
- 支払日調整ルール

5. `Recent Usage`
- 利用日
- 説明
- 金額
- 必要ならカテゴリ
- 詳細確認は `Ledger` に誘導

### 遷移ルール

- 銀行口座詳細内の `目的別口座一覧` をクリックすると `Goal Bucket Detail` に移る
- 銀行口座詳細内の `紐づくクレジットカード一覧` をクリックすると `Credit Card Detail` に移る
- `Credit Card Detail` 内の支払口座をクリックすると `Bank Account Detail` に戻れる

## Settings

### 役割

- アプリ全体の集計ルールとカテゴリマスタを管理する

### 構成

- `General`
- `Categories`

### General

役割:
- 月次集計ルールを管理する

構成:
1. `Page Header`
2. `Current Setting Summary`
3. `General Setting Form`
4. `Setting Notes`

表示内容:
- `月初日`
- `営業日調整ルール`
- `最終更新日時`

編集内容:
- 月初日
- 営業日調整ルール
- 保存ボタン

### Categories

役割:
- 収入、支出、振替に使うカテゴリとサブカテゴリを管理する

構成:
1. `Section Header`
2. `Category Summary`
3. `Category Filters`
4. `Category List`
5. `Subcategory Area`
6. `Edit Flow`

#### Category Summary

- `収入カテゴリ数`
- `支出カテゴリ数`
- `振替カテゴリ数`

#### Category Filters

- 種別: `すべて / 収入 / 支出 / 振替`
- 状態: `すべて / 有効 / 無効`
- キーワード検索

#### Category List

- カテゴリ名
- 種別
- サブカテゴリ数
- 状態
- 表示順

#### Subcategory Area

- 選択中カテゴリ名
- サブカテゴリ一覧
- `サブカテゴリを追加`

#### Edit Flow

カテゴリ入力:
- カテゴリ名
- 種別
- 表示順
- 有効状態

サブカテゴリ入力:
- 親カテゴリ
- サブカテゴリ名
- 表示順
- 有効状態

## 共通コンポーネント方針

- `AppShell`
- `PageHeader`
- `SummaryRow`
- `FilterBar`
- `ListPanel`
- `DetailPanel`
- `SectionBlock`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `FormDrawer`

## 実装順の提案

1. `App.tsx` のナビゲーション構造を 4 トップ構成に寄せる
2. `Dashboard` を先に整理し、月次把握の導線を確定する
3. `Ledger` の責務を `取引 / 振替 / 配分` に整理する
4. `Accounts` を `銀行口座 / クレジットカード / Goal Bucket` の詳細遷移に作り替える
5. `Settings` を `General / Categories` に整理する

## メモ

- `Accounts` は情報量が多いため、一覧と詳細のレイアウト分離が最重要になる
- `Dashboard` は分析ページにしすぎず、把握用の画面として守る
- `Ledger` にはカテゴリ簡易追加を残してよいが、本管理は `Settings > Categories` に寄せる
- 今回の再設計は、情報量削減ではなく責務分離が主眼である
