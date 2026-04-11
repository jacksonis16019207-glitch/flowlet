# Skill Catalog

`flowlet` で使う project-local Skills の役割と優先順位を整理する。
2026-04-10 に追加した Skill 群を現在の正本として扱う。

## 基本方針

- 1 つの目的に対して、正本 Skill は 1 つに寄せる
- 名前が似た Skill が複数ある場合は、現在運用している正本 Skill を優先する
- 新しい Skill を追加する前に、この一覧へ追記して役割の重複を確認する

## 正本一覧

| 用途 | 正本 Skill | 補足 |
| --- | --- | --- |
| タスク開始から完了までの共通フロー | `task-execution` | 現在の親 Skill |
| バックエンド実装方針 | `backend-implementation` | Spring Boot 実装の標準入口 |
| フロントエンド実装方針 | `frontend-implementation` | React + TypeScript 実装の標準入口 |
| DB 設計と migration 方針 | `db-change-management` | 設計と変更運用を一体で扱う |
| GitHub タスク運用 | `github-task-management` | Issue、Project、ラベル運用 |
| 本番確認環境の運用 | `release-ops` | 本番 Docker 運用の標準入口 |

## 使い分けメモ

- DB 変更は `db-change-management` を入口にして整理する
- backend / frontend の実装相談でも、タスク全体の進め方は `task-execution` を入口にする
- UI / UX の再設計が主目的なら、frontend 系 Skill に加えて global Skill の `ui-ux-pro-max` を併用する
- 記事化候補は実装完了後だけでなく、設計判断や運用ルール整理の段階でも拾ってよい

## 更新ルール

1. 新しい Skill を追加するときは、まずこの一覧のどの用途に属するかを書く
2. 既存 Skill と責務が重なる場合は、新規追加より既存 Skill の拡張を優先する
3. 役割が重複する Skill を増やさない
