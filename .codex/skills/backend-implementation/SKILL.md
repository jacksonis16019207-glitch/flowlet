---
name: backend-implementation
description: Spring Boot バックエンド実装方針を扱う project-local Skill。domain、service、application service、repository、controller、dto、exception を整理するときに使う。
---

# Backend Implementation

## Overview

この Skill は `flowlet` の Spring Boot 実装方針を扱う。責務分離を重視し、`Entity` とドメイン、`Service` と `ApplicationService`、`Repository`、`Controller`、DTO、例外、バリデーション、トランザクション境界を整理する。

## Use When

- backend の新規実装や修正をするとき
- API やドメイン責務を整理したいとき
- package 構成やテスト観点を見直したいとき

## Do Not Use When

- frontend のみを触るとき
- DB migration 運用だけを扱うとき

## Workflow

1. 既存 package と責務分担を確認する
2. `Entity`、ドメイン、DTO の境界を整理する
3. `Service`、`ApplicationService`、`Repository`、`Controller` の責務を分ける
4. 例外、validation、transaction 境界を決める
5. API 仕様変更があれば `docs/specs/` を更新する
6. 変更規模に応じたテスト観点を整理する

## Output

- 構成方針
- 主要クラス責務
- API / DTO 方針
- テスト観点
