# GitHub Task Management

## 基本方針

- タスク管理の正本は GitHub Issues と GitHub Project に置く
- 実装単位の進行は Pull Request で管理する
- 長文の仕様、設計、運用手順は `docs/` に残し、Issue からリンクする
- 1 Issue 1目的を基本にする

## Issue 運用

- 新規作業は原則 Issue を作成してから着手する
- 大きい作業は親 Issue と sub-issue に分割する
- Issue には最低限、背景、目的、完了条件を記載する
- 過去タスクを記録する場合は `history` ラベルを付ける

## 推奨ラベル

- `type:feature`
- `type:bug`
- `type:refactor`
- `type:docs`
- `type:research`
- `area:backend`
- `area:frontend`
- `area:db`
- `area:ops`
- `prio:P1`
- `prio:P2`
- `prio:P3`
- `history`
- `blocked`

## Project 運用

- 状態管理は GitHub Project で行う
- `Status` は `Inbox / Todo / In Progress / Review / Done` を基本にする
- `Priority` は `P1 / P2 / P3` を基本にする
- 必要に応じて `Area` と `Iteration` を使う

## Pull Request 運用

- PR は対応する Issue に紐づける
- PR 本文には `Closes #<issue-number>` を含める
- Issue に書き切れない設計判断は `docs/` に残す

## docs との関係

- `docs/` は仕様、設計、運用ルールの保管場所として使う
- タスクの一覧管理は GitHub に寄せる
- [execution-task-list.md](/C:/Users/jacks/Documents/flowlet/docs/project/execution-task-list.md) は移行中の参照として扱い、GitHub 運用へ段階的に置き換える
