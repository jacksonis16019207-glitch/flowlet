---
name: db-migration-helper
description: Flyway を使った DB マイグレーション運用ルールを整理し、テーブル変更時の migration 方針、バックアップスキーマ作成、データ移行、seed SQL の置き場を決めたいときに使う project-local Skill。DB 変更を実装するとき、既存 migration を触らずに新規 migration を追加するとき、カラム追加に伴ってテーブル再作成とデータ移行が必要なとき、開発用ダミーデータや固定マスタデータの投入 SQL を `infra/` 配下へ整理したいときに使う。
---

# DB Migration Helper

## Overview

この Skill は、`flowlet` の DB マイグレーション実装と運用ルールを揃えるときに使う。
論理設計そのものは `db-design-helper` で整理し、この Skill では Flyway の切り方、既存データの退避、データ移行、seed SQL の配置を扱う。

## Workflow

1. 変更対象を確認する
- 変更対象テーブル、変更理由、既存データ保持要否、依存テーブルを確認する。
- まず `db-design-helper` の論理設計と矛盾しないかを確認する。

2. 既存 migration を固定する
- コミット済みの Flyway migration SQL は編集しない。
- 変更が必要な場合は、既存ファイルを直さずに新しい version の migration を追加する。

3. テーブル変更方針を決める
- カラム追加は `ALTER TABLE ... ADD COLUMN` ではなく、原則として対象テーブルを再作成する。
- カラム追加以外の変更も、制約、型変更、列順、データ移行負荷を見て、再作成か局所変更かを判断する。
- 判断理由は migration ファイルか `docs/` に残す。

4. バックアップと移行を設計する
- テーブル変更時は、バックアップスキーマを作成して変更対象テーブルをデータごと退避する。
- バックアップスキーマ名は `flowlet_backup_v<version>` を基本とし、migration version と対応を取る。
- 退避後に新テーブルを作成し、バックアップテーブルから新テーブル定義に合わせてデータを移行する。
- 移行時は列マッピング、初期値、欠損時の扱い、不要列の破棄を明示する。
- 移行完了後も、同一 migration 内ではバックアップスキーマを削除しない。削除判断は別 migration か手順書で行う。

5. seed の置き場を分ける
- ダミーデータや固定データを Flyway migration で投入しない。
- 開発環境ダミーデータは `infra/sql/dev-seed/` に置く。
- 個人差がなく本番でも共通利用できる固定マスタデータは `infra/sql/master-data/` に置く。
- seed SQL は 1 テーブル 1 ファイルで分ける。
- seed SQL は手動実行前提とし、適用順が分かるファイル名にする。

6. 運用影響を確認する
- 既存 DB の再作成が必要か、既存データ移行だけで済むかを明示する。
- backend の Flyway 設定、起動手順、`docs/setup.md` の説明を必要に応じて更新する。

## Project Rules

- Flyway はスキーマ定義と構造変更だけに使う。
- コミット済み migration の上書きは禁止する。
- 1 migration 1 関心事を基本にする。
- 連番 version は昇順で追加し、適用順が曖昧にならないようにする。
- カラム追加では対象テーブル再作成とデータ移行を前提に検討する。
- バックアップスキーマ作成、対象テーブルコピー、新テーブル作成、データ移行を migration に含める。
- ダミーデータと固定マスタデータは `infra/sql/` 配下で管理する。
- seed SQL は 1 テーブル 1 ファイルで管理する。
- seed SQL は再実行時の重複や依存順を意識し、必要なら `where not exists` を使う。

## Output

出力は原則として次を含める。

- 変更対象テーブルと変更理由
- 新規 migration 方針
- バックアップスキーマ名
- 退避方法
- 新テーブル定義の反映方法
- データ移行方法
- seed SQL の更新有無
- `docs/` 更新有無

## Notes

- 論理設計の整理だけで止める場合は `db-design-helper` を優先する。
- 実装時は [docs/db-migration-rules.md](/C:/Users/jacks/Documents/flowlet/docs/db-migration-rules.md) を参照し、Skill と実運用をずらさない。
