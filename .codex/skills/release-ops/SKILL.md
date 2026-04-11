---
name: release-ops
description: 本番運用を扱う project-local Skill。デプロイ、再起動、状態確認、ログ確認、障害切り分けを進めるときに使う。
---

# Release Ops

## Overview

この Skill は本番 Docker 環境の運用フローを扱う。`infra/.env` と `infra/docker-compose.prod.yml` を基準に、`main -> prod` の release 運用または `hotfix/* -> prod` の緊急修正を前提として、デプロイ、再起動、状態確認、ログ確認、障害切り分けを進める。

## Use When

- 本番デプロイや再起動をするとき
- ログ確認や障害切り分けをするとき
- 破壊的な本番操作の確認手順が必要なとき

## Do Not Use When

- 開発実装だけを行うとき
- GitHub Issue 整理だけを行うとき

## Workflow

1. 対象環境と実施内容を確認する
2. 対象変更が `main -> prod` の release か `hotfix/* -> prod` の緊急修正かを確認する
3. `prod` が本番反映済みの正本であり、開発変更を直接積まない前提を確認する
4. `infra/.env` と `infra/docker-compose.prod.yml` を基準に設定を確認する
5. 起動、停止、状態確認、ログ確認を行う
6. `down -v` などの破壊的操作は確認付きで扱う
7. hotfix 対応後は `prod` の内容を `main` に戻すタスクまたは PR を必ず確認する
8. 実施結果と未解決事項を記録する

## Branch Rules

- 通常リリースは `main -> prod` の PR 後に実施する
- 緊急修正は `prod` から切った `hotfix/*` で対応する
- `prod` への直接 push や feature ブランチの直接マージは行わない
- hotfix を `prod` に反映した後は、差分を `main` に戻し忘れない

## Related Skills

- 日常開発全体の進行: `task-execution`
- GitHub Issue / PR / Project 運用: `github-task-management`

## Output

- 実施内容
- 確認結果
- ログ所見
- 未解決事項
