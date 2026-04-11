# Feedback Issue API 仕様

## 概要

- `Settings > General` から送信された要望 / 不具合を GitHub Issue に起票する。
- 初版は匿名送信で、GitHub repository は env で指定した 1 リポジトリに固定する。

## エンドポイント

| Method | Path | 用途 |
| --- | --- | --- |
| `POST` | `/api/feedback-issues` | 要望 / 不具合を GitHub Issue として作成する |

## リクエスト

```json
{
  "kind": "FEATURE_REQUEST",
  "title": "Settings から要望を送りたい",
  "body": "本番環境からそのまま起票したいです。",
  "pagePath": "settings/general"
}
```

## レスポンス

```json
{
  "issueNumber": 321,
  "issueUrl": "https://github.com/jacksonis16019207-glitch/flowlet/issues/321"
}
```

## バリデーション

| 項目 | 型 | 制約 |
| --- | --- | --- |
| `kind` | `string` | `FEATURE_REQUEST` / `BUG_REPORT` |
| `title` | `string` | 必須、120文字以内 |
| `body` | `string` | 必須、4000文字以内 |
| `pagePath` | `string` | 必須、120文字以内 |

## Issue 化ルール

- `kind = FEATURE_REQUEST`
  - title prefix: `[Feedback]`
  - labels: `type:feature`, `from:feedback`
- `kind = BUG_REPORT`
  - title prefix: `[Bug]`
  - labels: `type:bug`, `from:feedback`

issue 本文には以下を固定で入れる。

- 種別
- 発生ページ
- 送信日時
- 本文

## エラー

- GitHub 連携設定が未投入なら `503`
- GitHub API 呼び出し失敗時は `502`
- 入力不正は `400`
