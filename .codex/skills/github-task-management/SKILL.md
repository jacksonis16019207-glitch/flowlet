---
name: github-task-management
description: GitHub Issues / Projects を使ったタスク管理を扱う project-local Skill。Issue 起票、分解、ラベル、優先度、過去タスク記録を進めるときに使う。
---

# GitHub Task Management

## Overview

この Skill は GitHub をタスク管理の正本として扱うための運用を定義する。Issue 作成、親子分解、ラベル整理、Project 反映、過去タスクの backfill を扱う。

## Use When

- 新規タスクを Issue 化するとき
- Issue を分解、整理、優先度付けするとき
- GitHub Project の運用ルールに沿って並び替えるとき
- 過去タスクを `history` ラベル付きで記録するとき

## Do Not Use When

- 既存 Issue の実装だけを進めるとき
- 本番デプロイやログ確認だけを行うとき

## Workflow

1. 目的を 1 Issue 1目的 に整理する
2. 必要なら親 Issue と sub-issue に分ける
3. `type:*`、`area:*`、`prio:*` などのラベルを付ける
4. 背景、目的、完了条件を明確化する
5. 必要に応じて Project に載せる
6. 詳細な設計や仕様が必要なら `docs/` へ誘導する

## References

- GitHub 運用ルール: [github-task-management.md](/C:/Users/jacks/Documents/flowlet/docs/project/github-task-management.md)

## Output

- Issue 案
- ラベル
- 優先度
- 分解方針
- 次アクション
