---
name: task-delivery-flow
description: flowlet の 1 タスクごとの標準開発フローを進めるための project-local Skill。新機能追加、バグ修正、設計相談、ドキュメント更新を含む作業に着手するときは最初に使い、要件確認、設計確認、ドキュメント更新、実装計画、実装、検証、変更後ドキュメント更新、記事化判断、Skills 改善提案、コミット、必要時のプッシュまでを一貫して進めるときに使う。
---

# Task Delivery Flow

## Overview

この Skill は `flowlet` で 1 タスクを開始してから締めるまでの共通運用を定義する。`Start.md` の開発目的、リポジトリの `AGENTS.md`、project-local Skills、必要に応じた global Skills とサブエージェントを組み合わせ、最小変更で前に進める。

## Workflow

1. 前提を確認する
- `Start.md`、対象ディレクトリに効く `AGENTS.md`、関連する既存実装、未コミット変更の有無を確認する。
- タスクが backend / frontend / DB / docs のどこにかかるかを整理する。
- 関連する Skill を選ぶ。迷ったら project-local Skills を優先し、不足分だけ global Skills で補う。

2. 要件を確認する
- ユーザー要求、現状挙動、期待挙動、制約、完了条件を短く整理する。
- あいまいさがある場合は推測で断定せず、前提として明示する。
- 影響範囲が広いときは MVP と今回スコープを切り分ける。

3. 設計を確認する
- 既存構成、責務分離、命名、依存方向、データフローを確認する。
- 実装前に方針を短くまとめる。必要なら API、DB、UI、テスト観点まで含める。
- backend は `java-spring-helper`、frontend は `react-typescript-helper`、DB 論理設計は `db-design-helper`、DB migration 実装は `db-migration-helper` の利用を優先する。

4. 実装前ドキュメントを作成または更新する
- 仕様や運用影響がある場合は、実装前に `docs/` や関連文書へ前提、設計方針、コマンド変更点を追記する。
- 追加コマンドや新しい運用が出る場合は、その時点で文書化対象を確定する。

5. 実装計画を立てる
- 変更ファイル、追加テスト、検証方法、必要ならコミット単位まで整理する。
- 並列化できる調査や検証がある場合だけサブエージェントを使う。
- サブエージェントには独立した責務を割り当て、書き込み範囲が重ならないようにする。

6. 実装する
- 目的に直結する最小変更を行い、既存の命名・構成・スタイルに合わせる。
- 無関係なファイルや挙動は変更しない。
- 予期しない差分やユーザー変更を見つけた場合、衝突しないなら共存し、衝突するなら方針を確認する。

7. 検証する
- 変更規模に応じて最小限から十分な範囲まで検証する。
- バグ修正では、可能なら修正前に失敗し修正後に通るテストを追加する。
- frontend のフォームやバリデーション修正では、`schema` 単体、フォーム表示、エラーメッセージ、送信可否のどの層で再現するのが最小かを先に決める。
- 実行できなかった検証は理由と不足分を明示する。

8. 実装後ドキュメントを作成または更新する
- 実装結果を受けて、仕様、セットアップ、運用手順、コマンド、制約事項の文書を更新する。
- ユーザー向け仕様や運用手順が変わらない内部修正だけなら、ドキュメント更新は不要と判断してよい。その場合も不要とした理由は短く残す。
- 変更前に作った設計メモが不要になった場合は、最終状態に合わせて整理する。

9. 記事化できるか判断する
- 学習内容、設計判断、バグ修正、環境構築、AI 活用に再利用可能な論点があるか確認する。
- 価値がある場合は `article-writing-helper` を使って候補整理、アウトライン、ドラフトまで進める。

10. Skills 改善案を提案する
- 作業中に繰り返しが出た、判断がぶれた、毎回同じ説明が必要になった場合は、project-local Skill 追加や既存 Skill 修正を提案する。
- 提案だけで十分な場合と、そのまま Skill を更新すべき場合を分けて判断する。

11. 変更を締める
- 変更概要、検証結果、未検証項目、残課題を短く整理する。
- コミットは Conventional Commits 形式の日本語要約で行う。
- プッシュはユーザーの依頼がある場合、またはそのタスクの完了条件に含まれる場合に行う。

## Additional Checks

- Before wrapping up a task, consider whether AGENTS.md should be improved based on repeated instructions or newly clarified operating rules.
- If no AGENTS.md improvement is needed, explicitly skip this step and continue without changes.
- Unless there is a clear reason not to, push after commit as the default behavior.
- If push should be skipped, explain the reason explicitly to the user before finishing the task.

## Skill Selection

- backend 実装や設計: `java-spring-helper`
- frontend 実装や設計: `react-typescript-helper`
- DB 設計: `db-design-helper`
- DB migration 実装: `db-migration-helper`
- タスク分解や実装順整理: `task-breakdown-helper`
- テスト観点整理: `test-design-helper`
- 記事作成: `article-writing-helper`
- API 仕様整理など project-local に不足するもの: global Skills を追加で使う

## Subagent Rules

- サブエージェントは、主スレッドの直近作業を止めずに並列化できるときに使う。
- 例: 影響範囲調査、別モジュールの独立実装、テスト実行、セキュリティ確認、記事候補の整理。
- 単一ファイルの軽微修正、単一フォームの小さなバグ修正、直後の実装判断がその結果待ちになる調査では、まず主スレッドで進める。
- 直近の次アクションがその結果待ちなら、まず主スレッドで進める。
- サブエージェントへの依頼では責務、対象ファイル、期待成果を明示し、ほかの編集を巻き戻さないよう伝える。

## Output

作業の締めでは、必要に応じて次を簡潔に示す。
- 要件と前提
- 設計判断
- 実装内容
- 検証結果
- 更新したドキュメント
- 記事化候補または記事作成結果
- Skills 改善提案
- コミット有無とプッシュ有無

## References

- 出力物の見落としを減らしたいときは [references/deliverables-checklist.md](references/deliverables-checklist.md) を確認する。
