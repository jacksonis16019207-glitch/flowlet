---
name: react-typescript-helper
description: flowlet の React + TypeScript 実装方針を整理するプロジェクト専用 Skill。画面構成、コンポーネント分割、API 呼び出し、サーバーデータ管理、フォーム、型配置、テスト方針を整理したいときに使う。pages、features、shared を軸にした構成で、Axios、TanStack Query、React Hook Form、zod を前提に進めたいときに使う。
---

# React Typescript Helper

## Overview

この Skill は、`flowlet` の React + TypeScript 実装全体を整理するときに使う。
画面、機能、共通部品の責務を分け、状態管理と型配置が散らからない構成を優先する。

## Workflow

1. 対象画面または機能を確認する
- どの画面や機能を作るかを確認する。
- 画面責務と機能責務を分ける。

2. 配置を決める
- `pages`、`features`、`shared` のどこへ置くべきかを先に決める。
- 何でも `components` に集めない。

3. データ取得と更新を整理する
- サーバーデータは `TanStack Query` で扱う。
- HTTP 通信は `Axios` へ寄せる。
- コンポーネントに直接 `fetch` や `axios` 呼び出しを書かない。

4. フォームを整理する
- フォームは `React Hook Form + zod` を使う。
- 複雑なフォームロジックを画面コンポーネントに直書きしない。

5. 型配置を確認する
- API 型、フォーム型、機能型を分ける。
- `shared/types` に何でも集めない。

6. テスト観点を決める
- 重要な画面、フォーム、ユーザーフローをテスト対象にする。

## Project Rules

### 構成方針

- `pages`、`features`、`shared` を基本構成とする。
- 画面固有の責務は `pages` に置く。
- 機能固有の UI、API、型、フォームは `features` に置く。
- 汎用 UI、共通ライブラリ、共通ユーティリティは `shared` に置く。

基本形は [references/structure-example.md](references/structure-example.md) を参照する。

### Components

- 単なる見た目の部品と、機能に結びついた部品を分ける。
- 画面コンポーネントにビジネスロジックや通信処理を詰め込みすぎない。
- 何でも `shared` に上げず、まずは `features` に閉じる。

### API

- HTTP クライアントは `Axios` を使う。
- 共通クライアントは `shared/lib` に置く。
- 機能別 API 呼び出しは `features/*/api` に置く。
- コンポーネント内で直接 `axios` を呼ばない。

### Server State

- サーバーデータ管理は `TanStack Query` を使う。
- 一覧、詳細、集計、更新後の再取得は Query / Mutation で扱う。
- サーバーデータを `useState` へ重複保持しない。

### Local State

- 画面ローカル状態は `useState` を基本にする。
- グローバル状態は最小限にする。
- `Context` の濫用を避ける。

### Forms

- フォームは `React Hook Form` を使う。
- 入力バリデーションは `zod` を使う。
- フォームロジックは `features/*/forms` または `features/*/components` に寄せる。

### Types

- API request / response 型は `features/*/api` 周辺に置く。
- フォーム型は `features/*/forms` 周辺に置く。
- 機能固有型は `features/*/types` に置く。
- 何でも `shared/types` に集めない。

### Naming

- 画面は `Page` で終える。
- フォーム部品は `Form` で終える。
- API 関数は `fetch*`、`create*`、`update*`、`delete*` を使う。
- Query key は機能単位で揃える。

### Testing

- 重要画面の表示テストを行う。
- フォームの入力とバリデーションをテストする。
- 主要ユーザーフローのテストを優先する。
- 細かい実装詳細より、ユーザー操作に近い形で確認する。

## Output

出力は原則として次を含める。

- 画面 / 機能 / 共通部品の配置方針
- コンポーネント責務の分担
- API 呼び出し配置
- TanStack Query の使い分け
- フォーム構成
- 型配置方針
- テスト観点
- 設計上の論点や注意点

## Notes

- 方針を追加変更するときは、都度ユーザー確認を取ってから更新する。
- 実装速度のために責務分離を崩しすぎない。
