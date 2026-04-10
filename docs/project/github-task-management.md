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
- UI / UX の再設計、ページ構成見直し、共通部分整理、導線見直しを扱う Issue では、`ui-ux-pro-max` を必須で使う

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
- 現在の `flowlet board` では `Status`, `Priority`, `Area` を使う
- UI / UX の見直しは常に最優先候補として扱い、少なくとも 1 件は `P1` で管理する

## Pull Request 運用

- PR は対応する Issue に紐づける
- PR 本文には `Closes #<issue-number>` を含める
- Issue に書き切れない設計判断は `docs/` に残す

## Branch 保護

- `main` と `prod` に protection rule を設定する
- 原則として PR 経由で変更を入れ、force push と branch 削除は禁止する
- required checks は GitHub Actions 導入後に登録する

## Merge Method

- merge method は `merge commit` のみを使う
- `squash merge` と `rebase merge` は無効化する
- 履歴を見返したときに PR 単位のまとまりを追いやすい状態を優先する

## Required Checks 方針

- GitHub Actions の job 名は required checks 登録を前提に、短く固定した lower-kebab-case にする
- 推奨例:
  - `backend-test`
  - `frontend-test`
  - `frontend-build`
  - `lint`
- Actions を追加したら、`main` と `prod` の protection rule に必要な job を required checks として登録する
- job 名を途中で変える場合は、branch protection 側の required checks も同時に更新する

## History Issue 運用

- 過去の実装履歴は `history` ラベル付き closed issue として残す
- 正本は `docs/` ではなくコミット履歴とする
- `history` issue には可能な限り `area:*` ラベルを付けて検索しやすくする
- 履歴の親 Issue を作り、関連する `history` issue をまとめて見返せるようにする

## 旧 Skill 整理方針

- 旧 Skill は、新 Skill と GitHub 運用で実作業を回しながら段階的に削除する
- 先に消すのではなく、代替 Skill と docs が揃ったことを確認してから削除する
- 削除対象の整理では `task-addition-helper`, `task-delivery-flow`, `java-spring-helper`, `react-typescript-helper`, `db-design-helper`, `db-migration-helper`, `prod-deploy-helper` を優先候補とする
- `article-writing-helper` は独立性が高いため後回しでよい

## docs との関係

- `docs/` は仕様、設計、運用ルールの保管場所として使う
- タスクの一覧管理は GitHub に寄せる
- [execution-task-list.md](/C:/Users/jacks/Documents/flowlet/docs/project/execution-task-list.md) は移行中の参照として扱い、GitHub 運用へ段階的に置き換える
