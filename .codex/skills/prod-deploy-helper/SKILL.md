---
name: prod-deploy-helper
description: flowlet の本番 Docker 環境を安全にデプロイ・再起動・状態確認するときに使う project-local Skill。`infra/.env` と `infra/docker-compose.prod.yml` を前提に、デプロイ前確認、`docker compose --env-file infra/.env -f infra/docker-compose.prod.yml up -d --build` の実行、起動確認、ログ確認、障害切り分けを進めたいときに使う。本番 DB の volume 削除や migration リセットのような破壊的操作を伴う場合の確認順も含む。
---

# Prod Deploy Helper

## Overview

`flowlet` の本番確認環境は `infra/.env` と `infra/docker-compose.prod.yml` を使う Docker Compose 構成で動く。通常デプロイは `up -d --build`、停止は `down`、状態確認は `ps` と `logs` を使う。

詳細コマンドは [references/prod-deploy-commands.md](references/prod-deploy-commands.md) を参照する。まずこの `SKILL.md` の手順で実施内容を絞り、必要な箇所だけ参照ファイルを読む。

## Workflow

1. 対象を確認する
- 本当に「本番確認環境」かを確認する。flowlet では通常 `infra/.env` と `infra/docker-compose.prod.yml` を指す。
- 依頼が通常デプロイか、状態確認か、停止か、DB リセットを含むかを区別する。
- 破壊的操作が入る場合は、実行前に必ずユーザー承認を取る。

2. デプロイ前確認をする
- `infra/.env` の DB 名、ユーザー、ポート、コンテナ名を確認する。
- `infra/docker-compose.prod.yml` の `db` と `app` の依存関係、ポート、`SPRING_PROFILES_ACTIVE=prod` を確認する。
- 必要なら `docs/ops/setup.md` の本番起動手順と停止手順を確認する。

3. 通常デプロイを実行する
- 標準手順は `docker compose --env-file infra/.env -f infra/docker-compose.prod.yml up -d --build`。
- 実行後は `ps` で `db` が healthy、`app` が Up になっているかを見る。
- 必要に応じて `logs app --tail 100` と `logs db --tail 100` で起動失敗を確認する。

4. 状態確認だけを行う
- ユーザーが「デプロイ」ではなく現状確認を求めている場合は、`ps`、`logs`、必要なら DB 接続確認だけに留める。
- 本番 app を触らず DB だけ見たい場合は、既存コンテナ状態を優先して確認する。

5. 停止や再起動を行う
- 停止は `down` を使うが、volume を消さない限り DB データは残る。
- app / db 片方だけの起動が必要なら compose の service 指定を使う。
- `down -v` は DB データ削除になるため、通常停止と混同しない。

6. 破壊的操作を扱う
- `down -v`、DB volume 削除、migration 未実行状態へのリセットは破壊的操作として扱う。
- 実施前に「データが消える」「app を上げると migration が再実行される」点を明示する。
- リセット後に空 DB のまま保持したい場合は `db` サービスだけを起動し、`app` は起動しない。

7. 結果を報告する
- 実行したコマンド種別、対象環境、起動状態、ログ上の異常有無を短くまとめる。
- 実行していない破壊的操作や未確認項目があれば明示する。

## Project Rules

- 本番確認環境の compose は `infra/docker-compose.prod.yml` を使う。
- 環境変数は `infra/.env` を使う。
- 通常デプロイは `up -d --build` を優先する。
- DB を空に戻したいだけなら `app` を起動しない。起動すると Flyway が走る。
- 本番停止の `down` と、DB 削除を含む `down -v` は分けて扱う。

## References

- デプロイ・停止・ログ確認コマンド: [references/prod-deploy-commands.md](references/prod-deploy-commands.md)
- 公式の repo 手順: [docs/ops/setup.md](/C:/Users/jacks/Documents/flowlet/docs/ops/setup.md)

