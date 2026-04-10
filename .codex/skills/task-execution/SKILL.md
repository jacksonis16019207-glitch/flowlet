---
name: task-execution
description: 日常開発の標準フローを扱う project-local Skill。Issue 確認、実装、検証、コミット、必要時の PR までを一貫して進めるときに使う。
---

# Task Execution

## Overview

この Skill は日常開発の親 Skill として使う。対象範囲の `AGENTS.md`、関連 Issue、既存コード、関連 `docs/` を確認し、最小変更で実装と検証を進める。

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
3. 必要な Skill を選び、最小変更で実装する
4. 仕様変更や運用影響があれば `docs/` を更新する
5. 変更規模に応じて検証し、未実施の検証は理由を明示する
6. コミットし、必要時は push や PR まで進める

## Related Skills

- GitHub 運用や Issue 整理: `github-task-management`
- backend 実装: `backend-implementation`
- frontend 実装: `frontend-implementation`
- DB 変更: `db-change-management`
- 本番運用: `release-ops`

## Output

- 前提
- 実施内容
- 検証結果
- 未実施事項
- コミット / PR 状態
