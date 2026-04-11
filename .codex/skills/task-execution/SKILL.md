---
name: task-execution
description: 日常開発の標準フローを扱う project-local Skill。Issue 確認、実装、検証、コミット、必要時の PR までを一貫して進めるときに使う。
---

# Task Execution

## Overview

この Skill は日常開発の親 Skill として使う。対象範囲の `AGENTS.md`、関連 Issue、既存コード、関連 `docs/` を確認し、`feature/* -> main -> prod` の運用を崩さずに最小変更で実装と検証を進める。

## Use When

- 既存 Issue に基づいて実装や修正を進めるとき
- どの Skill を併用するか判断したいとき
- 実装から検証、コミットまでを一通り進めるとき

## Do Not Use When

- 新規タスクの起票や分解だけを行うとき
- 本番運用だけを行うとき

## Workflow

1. 対象範囲の `AGENTS.md`、関連 Issue、既存コード、関連 `docs/` を確認する
2. 実施方針を短く共有して承認を得る
3. 関連 Issue の有無、ラベル、完了条件を確認し、不足があれば `github-task-management` を併用する
4. 作業ブランチは原則 `main` から切った `feature/*` を使い、`prod` を開発ブランチとして使わない
5. 必要な Skill を選び、最小変更で実装する
6. UI 構成、ページ分割、共通部分、導線、情報設計、視覚表現を見直す場合は、必ず `ui-ux-pro-max` を併用する
7. 仕様変更や運用影響があれば `docs/` を更新する
8. 変更規模に応じて検証し、未実施の検証は理由を明示する
9. コミットし、必要時は push や PR まで進める
10. PR を作る場合は `feature/* -> main` を基本とし、本文に `Closes #<issue-number>` を含める

## Branch Rules

- 日常開発は `feature/* -> main` の PR で進める
- `main` と `prod` への直接 push は行わない
- `prod` への変更は release の `main -> prod` または緊急時の `hotfix/* -> prod` に限定する
- `prod` に入った hotfix は後続で必ず `main` に戻す

## GitHub Task Rules

- 新規作業は原則 Issue を起点にする
- 1 Issue 1目的を基本にし、必要なら親 Issue / sub-issue に分割する
- PR は対応する Issue に紐づける
- 設計判断や運用判断が長くなる場合は `docs/` に残して Issue / PR から参照する

## Related Skills

- GitHub 運用や Issue 整理: `github-task-management`
- backend 実装: `backend-implementation`
- frontend 実装: `frontend-implementation`
- UI / UX 再設計、構造見直し、体験設計: `ui-ux-pro-max`
- DB 変更: `db-change-management`
- 本番運用: `release-ops`

## Output

- 前提
- 実施内容
- 検証結果
- 未実施事項
- コミット / PR 状態
