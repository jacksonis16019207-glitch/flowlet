# アプリ設定 API 仕様

## 概要

- アプリ全体の表示期間ルールを管理する
- 初版では月の開始日と、開始候補日が土日祝に当たった場合の補正ルールを保持する

## エンドポイント

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/app-settings` | 現在のアプリ設定を取得する |
| `PUT` | `/api/app-settings` | 現在のアプリ設定を更新する |

## GET レスポンス

```json
{
  "monthStartDay": 25,
  "monthStartAdjustmentRule": "PREVIOUS_BUSINESS_DAY",
  "updatedAt": "2026-04-06T21:00:00"
}
```

## PUT リクエスト

```json
{
  "monthStartDay": 25,
  "monthStartAdjustmentRule": "PREVIOUS_BUSINESS_DAY"
}
```

## 項目定義

| 項目 | 型 | 説明 |
| --- | --- | --- |
| `monthStartDay` | `number` | 月の開始候補日。1 から 31 |
| `monthStartAdjustmentRule` | `string` | `NONE` / `PREVIOUS_BUSINESS_DAY` / `NEXT_BUSINESS_DAY` |
| `updatedAt` | `string` | 最終更新日時。形式は ISO-8601 |

## バリデーション

- `monthStartDay` は 1 以上 31 以下
- `monthStartAdjustmentRule` は列挙値のみ

## 備考

- 実データは `flowlet.m_app_setting` に 1 レコードで保持する
- 将来、通貨や週開始日などのグローバル設定を同じ集約に追加する想定
