---
name: release-ops
description: 本番運用を扱う project-local Skill。デプロイ、再起動、状態確認、ログ確認、障害切り分けを進めるときに使う。
---

# Release Ops

## Overview

この Skill は本番 Docker 環境の運用フローを扱う。`infra/.env` と `infra/docker-compose.prod.yml` を基準に、デプロイ、再起動、状態確認、ログ確認、障害切り分けを進める。

## Use When

- 本番デプロイや再起動をするとき
- ログ確認や障害切り分けをするとき
- 破壊的な本番操作の確認手順が必要なとき

## Do Not Use When

- 開発実装だけを行うとき
- GitHub Issue 整理だけを行うとき

## Workflow

1. 対象環境と実施内容を確認する
2. `infra/.env` と `infra/docker-compose.prod.yml` を基準に設定を確認する
3. 起動、停止、状態確認、ログ確認を行う
4. `down -v` などの破壊的操作は確認付きで扱う
5. 実施結果と未解決事項を記録する

## Output

- 実施内容
- 確認結果
- ログ所見
- 未解決事項
