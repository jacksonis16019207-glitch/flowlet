---
name: db-change-management
description: DB 設計と migration 運用を扱う project-local Skill。テーブル設計、命名、NULL 可否、migration、seed、データ移行を整理するときに使う。
---

# DB Change Management

## Overview

この Skill は DB 設計と変更運用の標準方針を扱う。テーブル設計、主キー、外部キー、NULL 可否、一意制約、migration、seed、データ移行、バックアップ方針を一体で整理する。

## Use When

- テーブル設計を整理するとき
- migration や seed、データ移行を設計するとき
- backend 実装に合わせて DB 変更方針を固めたいとき

## Do Not Use When

- DB に変更がないとき
- 本番デプロイだけを行うとき

## Workflow

1. 既存スキーマ、関連コード、関連 `docs/` を確認する
2. テーブル設計、キー、NULL 可否、命名を整理する
3. 既存 migration は編集せず、新規 migration を追加する
4. seed と migration を分離する
5. データ保持が必要ならバックアップと移行方針を決める
6. [db-migration-rules.md](/C:/Users/jacks/Documents/flowlet/docs/ops/db-migration-rules.md) と整合を取る

## Output

- 設計方針
- migration 方針
- seed / 移行方針
- docs 更新有無
