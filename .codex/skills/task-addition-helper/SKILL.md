---
name: task-addition-helper
description: flowlet に新しいタスクや改善案を追加するときに使う project-local Skill。思いついた要望を、課題、依存、優先度、完了条件つきの実行可能なタスクへ整理し、`docs/project/execution-task-list.md` や関連ドキュメントへ反映したいときに使う。既存タスクとの優先順位調整、Backlog 判定、P1/P2/P3 の振り分けをしたいときにも使う。
---

# Task Addition Helper

## Overview

この Skill は、`flowlet` の追加タスクを思いつきで増やさず、既存の優先順位に接続しながら整理するときに使う。
`Start.md` と `docs/project/execution-task-list.md` を基準に、追加候補を実行可能な単位へ落とし込む。

## Workflow

1. 前提を確認する
- `Start.md`、`AGENTS.md`、`docs/project/execution-task-list.md` を確認する。
- 必要に応じて `docs/project/requirements.md`、関連設計メモ、現在の未完了タスクを確認する。
- 追加候補が `feature`、`improvement`、`bugfix`、`doc`、`research` のどれかを仮置きする。

2. 追加理由を短く整理する
- 追加候補を 1 文で表現する。
- 次の 4 点を短く整理する。
  - どの課題を解くか
  - どのユースケースに効くか
  - 既存のどの機能や設計に依存するか
  - 実装後に何を確認できるようになるか
- この 4 点が言えない場合は、実装タスクではなく `research` かメモ扱いにする。

3. 優先度を判定する
- まず `Start.md` の目的に直接効くかを確認する。
- 判断に迷ったら次の順で見る。
  1. 目的別残高の見える化に効くか
  2. 現在残高の再現に効くか
  3. 引き落とし不足の事前確認に効くか
  4. 今の実装を進めるための土台になるか
- 優先度は次の基準で置く。
  - `P1`: 主要価値に直結し、直近の実装順へ入る
  - `P2`: 主要価値を支えるが、直近必須ではない
  - `P3`: 価値はあるが後回しでよい
  - `Backlog`: 具体化前の保留案

4. 実行可能な粒度へ分ける
- 大きい案は `design`、`backend`、`frontend`、`test`、`docs` の観点で分ける。
- 1 回で終わらないものは、少なくとも完了条件を言える単位まで分割する。
- 既存タスクへ吸収したほうが自然なら、新しい見出しを増やさず既存タスクの実行項目へ差し込む。

5. 記録先を決める
- すぐ着手するものは [docs/project/execution-task-list.md](/C:/Users/jacks/Documents/flowlet/docs/project/execution-task-list.md) に追加する。
- 仕様や背景の整理が必要なものは、関連する `docs/` 配下の設計メモへ追記する。
- 保留案は `Backlog` として短く残す。
- 仕様変更や運用影響がある場合は、タスクリストだけで終わらせず関連ドキュメント更新も検討する。

6. 反映前に確認する
- 既存優先度を逆転させる必要があるか確認する。
- 追加タスクが一時的な運用か恒久機能かを分ける。
- テスト追加が必要な変更か確認する。
- 記事化候補や Skill 化候補があるか確認する。

## Output

出力は必要に応じて次を簡潔に含める。

- 追加候補の要約
- 種別
- 優先度
- 依存関係
- 実行タスク
- 完了条件
- 追記先ドキュメント
- 補足メモ

## Template

必要なら次の形でまとめる。

```md
### タスク名

種別:
- feature / improvement / bugfix / doc / research

優先度:
- P1 / P2 / P3 / Backlog

目的:
- このタスクで解決したいこと

依存:
- 先に必要な実装や設計

実行タスク:
- 実装や調査の具体項目

完了条件:
- 完了したと言える状態

メモ:
- 保留論点、記事化候補、Skill 化候補など
```

## Notes

- 詳細な運用例や補足は [docs/project/task-addition-workflow.md](/C:/Users/jacks/Documents/flowlet/docs/project/task-addition-workflow.md) を参照する。
- タスク追加の後にそのまま実装へ進む場合は `task-delivery-flow` を併用する。
- 同じ話題が 2 回以上出たものは、単なる思いつきではなく正式タスク候補として扱う。

