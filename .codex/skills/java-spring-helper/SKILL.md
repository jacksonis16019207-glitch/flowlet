---
name: java-spring-helper
description: flowlet の Spring Boot 実装方針を整理するプロジェクト専用 Skill。package 構成、Entity とドメインの分離、Service と ApplicationService の使い分け、Repository、Controller、DTO、例外、バリデーション、トランザクション境界、テスト方針を整理したいときに使う。DDD を意識しつつ、個人開発で回る現実的な構成を取りたいときに使う。
---

# Java Spring Helper

## Overview

この Skill は、`flowlet` の Spring Boot 実装全体を整理するときに使う。
DDD を意識しつつ、過度に重くしない現実的な構成を優先する。
単一ドメイン処理は `Service`、複数ドメイン処理は `ApplicationService` を使う。

## Workflow

1. 対象機能を確認する
- どの機能を追加または変更するかを確認する。
- 先にドメイン責務と API 責務を分ける。

2. package 配置を決める
- 各ドメイン配下には `domain` と `service` を置く。
- `presentation` と `infrastructure` はドメインの外に置く。
- 共通化は、同じ処理が複数機能で本当に重複したときだけ行う。

3. モデル責務を分ける
- `JPA Entity` と `ドメインモデル` を分ける。
- DTO は `presentation/<機能>/dto` に置く。
- API と永続化の都合を、ドメインへ直接持ち込まない。

4. サービス責務を決める
- 単一ドメイン処理は `<domain>.service` に置く。
- 複数ドメイン処理は `application.service` に `ApplicationService` を置く。
- Controller は 1 つの `Service` または `ApplicationService` だけを呼ぶ。
- 複数 `ApplicationService` を必要とする場合は、Controller で束ねず上位の `ApplicationService` を作る。
- 複数ドメイン処理が必要になったら、実装前に構成案をユーザーへ提案する。
- 永続化は Repository interface と実装へ分離する。

5. 例外、検証、トランザクションを整理する
- 例外責務を `Domain`、`Application`、`API応答` に分ける。
- 入力検証と業務検証を分ける。
- `@Transactional` は `Service` または `ApplicationService` に付ける。

6. テスト観点を決める
- `Domain`、`Service`、`ApplicationService`、`Controller` を基本テスト対象にする。
- Repository 実装テストは必要箇所に絞る。

## Project Rules

### 構成方針

- DDD を意識するが、個人開発で維持できる複雑さに抑える。
- ドメイン配下は業務責務を中心にし、`presentation` と `infrastructure` はドメイン外へ出す。
- `controller/service/repository/entity` の横断一括配置は避ける。

### package

基本形は [references/package-example.md](references/package-example.md) を参照する。

- ドメインごとに `domain` と `service` を切る。
- `presentation` はドメイン外に置き、`presentation/<機能>/controller` と `presentation/<機能>/dto` に分ける。
- `infrastructure` はドメイン外に置き、技術実装ごとに分ける。
- 複数ドメインをまたぐ処理は `application/service` に置く。

### モデル分離

- `JPA Entity` と `ドメインモデル` は分ける。
- DTO は `presentation` 層に置く。
- Controller は DTO を扱う。
- Service と ApplicationService の引数、返り値にも `presentation.dto` の DTO を使う。
- API 応答で Entity やドメインモデルを直接返さない。

### Service

- 単一ドメイン処理は `Service` を使う。
- `1ドメイン = 1Service` を基本とする。
- Controller は 1 つの `Service` を呼ぶだけに寄せる。

### ApplicationService

- 複数ドメイン処理は `ApplicationService` を使う。
- `ApplicationService` は `application.service` に置く。
- Controller は 1 つの `ApplicationService` を呼ぶだけに寄せる。
- 複数の `ApplicationService` を必要とする場合は、その上位の `ApplicationService` を新たに作る。

### Repository

- `Repository interface` はドメイン側に置く。
- `JpaRepository` ベースの実装はインフラ側に置く。
- 永続化の詳細をドメイン側へ漏らさない。

### Transaction

- `@Transactional` は `Service` または `ApplicationService` に付ける。
- Controller には付けない。
- ドメインモデルは Spring に依存させない。

### Validation

- API 入力の形式チェックは `Request DTO + Bean Validation` で行う。
- 業務ルールの妥当性チェックは `Application` と `Domain` で行う。
- DB 制約は最後の防波堤として扱う。

### Exception

- `Domain` 例外と `Application` 例外を分ける。
- API 応答への変換は `@RestControllerAdvice` に集約する。
- エラーメッセージは `message.properties` で一括管理する。

### Naming

- 単一ドメイン処理クラスは `Service` で終える。
- 複数ドメイン処理クラスは `ApplicationService` で終える。
- API 入出力は `Request`、`Response` を名前に含める。
- Repository interface は `Repository` で終える。
- Controller は `Controller` で終える。

### Date Time

- 日付は `LocalDate` を使う。
- 日時は `LocalDateTime` を使う。
- `OffsetDateTime` や `Instant` を使う場合は理由を明示する。

### Testing

- 基本テスト対象は `Domain`、`Service`、`ApplicationService`、`Controller` とする。
- Repository 実装テストは、クエリやマッピングの確認が必要な箇所に絞る。
- バグ修正時は、修正前に失敗し修正後に通るテストを追加する。

## Output

出力は原則として次を含める。

- package 構成案
- クラス責務の分担
- Entity、ドメインモデル、DTO の分離方針
- Service と ApplicationService の責務
- Repository interface と実装の責務
- 例外処理方針
- バリデーション方針
- トランザクション境界
- テスト方針
- 設計上の論点や注意点

## Notes

- 方針を追加変更するときは、都度ユーザー確認を取ってから更新する。
- 実装のしやすさよりも、責務のにじみを防ぐことを優先する。

