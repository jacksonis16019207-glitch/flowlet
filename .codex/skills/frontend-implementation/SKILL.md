---
name: frontend-implementation
description: React + TypeScript 実装方針を扱う project-local Skill。pages、features、shared、API 呼び出し、フォーム、型配置を整理するときに使う。
---

# Frontend Implementation

## Overview

この Skill は `flowlet` の React + TypeScript 実装方針を扱う。`pages / features / shared` を軸に、API 呼び出し、サーバーデータ、フォーム、型配置、テスト観点を整理する。
UI 構造、ページ構成、共通部分、導線、情報設計、視覚表現を見直す場合は、必ず `ui-ux-pro-max` を併用する。

## Use When

- frontend の画面や機能を実装するとき
- 画面構成や型配置を整理したいとき
- フォームや API 呼び出しの方針を揃えたいとき
- UI / UX を 0 から再設計したいとき

## Do Not Use When

- backend のみを触るとき
- GitHub タスク整理だけを行うとき

## Workflow

1. 既存の `pages / features / shared` 構成を確認する
2. UI 構成、ページ分割、共通部分、導線、情報設計を見直すときは、必ず `ui-ux-pro-max` を先に使って設計観点を揃える
3. 画面、機能、共有部品の責務を分ける
4. API 呼び出しは `Axios`、サーバーデータは `TanStack Query` で扱う
5. フォームは `React Hook Form + zod` を基本にする
6. 必要なら `shared/types` や feature 配下の型定義を整理する
7. 画面変更に応じたテスト観点を整理する

## Output

- 構成方針
- コンポーネント分割
- API / 型 / フォーム方針
- テスト観点
