# Branching Strategy

`flowlet` は `feature/* -> main -> prod` の 3 段階でブランチを運用する。

## 目的

- `feature/*`: タスク単位の実装と検証を進める
- `main`: 次にリリースしたい変更を統合する
- `prod`: 本番デプロイ中のソースだけを保持する

この分離により、開発中の変更と本番反映済みの変更を切り分け、デプロイ元を常に `prod` に固定できる。

## Standard Flow

1. `main` から `feature/<task-name>` を作成する
2. `git worktree` で feature ごとに作業ディレクトリを切る
3. feature ブランチで実装、検証、コミットする
4. GitHub で `feature/* -> main` の Pull Request を作成する
5. リリース時に GitHub で `main -> prod` の Pull Request を作成する
6. 本番デプロイは常に `prod` ブランチの HEAD を参照する

## Git Worktree

新しい feature ブランチは、原則として `main` から切る。

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git worktree add ..\flowlet-feature-account-settings -b feature/account-settings main
```

作業完了後に worktree を削除する場合は、対象ブランチが不要になったことを確認してから実行する。

```powershell
git worktree remove ..\flowlet-feature-account-settings
git branch -d feature/account-settings
```

## GitHub Rules

`main` と `prod` は protected branch にする。

- 直接 push を禁止する
- Pull Request を必須にする
- CI の required status checks を設定する
- squash merge か merge commit のどちらかに統一する
- `prod` は `main` からの release PR と緊急時の hotfix PR だけを受ける

推奨設定は次の通り。

- `main`: review 1 件以上、CI 必須、direct push 禁止
- `prod`: review 1 件以上、deploy 前チェック必須、direct push 禁止

## GitHub Branch Protection Settings

GitHub の `Settings > Branches` で、少なくとも `main` と `prod` に branch protection rule を設定する。

### `main` に設定する項目

- Branch name pattern: `main`
- Require a pull request before merging: ON
- Require approvals: `1`
- Dismiss stale pull request approvals when new commits are pushed: ON
- Require review from code owners: OFF
- Require conversation resolution before merging: ON
- Require status checks to pass before merging: ON
- Require branches to be up to date before merging: ON
- Required status checks: CI 導入後に `test`、`build`、`lint` などを追加する
- Require signed commits: OFF
- Require linear history: OFF
- Do not allow bypassing the above settings: ON
- Restrict pushes that create matching branches: OFF
- Allow force pushes: OFF
- Allow deletions: OFF

### `prod` に設定する項目

- Branch name pattern: `prod`
- Require a pull request before merging: ON
- Require approvals: `1`
- Dismiss stale pull request approvals when new commits are pushed: ON
- Require conversation resolution before merging: ON
- Require status checks to pass before merging: ON
- Require branches to be up to date before merging: ON
- Required status checks: deploy 前に必要な `build`、`smoke-test`、`release-check` を追加する
- Require signed commits: OFF
- Require linear history: OFF
- Do not allow bypassing the above settings: ON
- Restrict pushes that create matching branches: OFF
- Allow force pushes: OFF
- Allow deletions: OFF

`prod` は release 用ブランチなので、通常の feature PR のマージ先にしない。

## GitHub Repository Settings

GitHub の repository settings では merge method を絞る。

- Allow merge commits: ON
- Allow squash merging: OFF
- Allow rebase merging: OFF
- Automatically delete head branches: ON

`main -> prod` の release 履歴と `hotfix/* -> prod` の履歴を残しやすくするため、このリポジトリでは merge commit を標準にする。

## Required Checks Policy

現時点では GitHub Actions workflow が未整備のため、required checks の名前は固定しない。Actions を追加したら、次の方針で rule に反映する。

- `main`: `frontend-test`、`backend-test`、`frontend-build` など、通常開発で必須の検証を登録する
- `prod`: `main` と同等以上に加え、デプロイ直前の確認ジョブを登録する

status check 名は workflow 追加後に実際の job 名に合わせて更新する。

## Pull Request Rules

- `feature/*` は `main` 向け PR のみ作成する
- `main` への直接 push は行わない
- `prod` への直接 push は行わない
- release は `main -> prod` の PR で行う
- hotfix は `hotfix/* -> prod` の PR で行い、その後 `prod -> main` を必ず反映する

## Release Flow

通常リリースは `main -> prod` の Pull Request で行う。

1. `main` の CI 通過を確認する
2. GitHub で `main` から `prod` への Pull Request を作成する
3. リリース用の確認を行う
4. `prod` に merge 後、本番デプロイを実行する

`prod` には feature ブランチを直接 merge しない。

## Hotfix Flow

本番障害の緊急修正は `prod` から `hotfix/<task-name>` を切って対応する。

1. `prod` から `hotfix/<task-name>` を作成する
2. 修正、検証、コミットを行う
3. GitHub で `hotfix/* -> prod` の Pull Request を作成する
4. `prod` に反映後、必ず `prod` の内容を `main` に戻す

`prod` に入った修正を `main` に戻し忘れると、次の release で差分が再混入するため禁止とする。

## Branch Ownership

- `feature/*`: 個別タスクの実装
- `main`: 次回リリース候補の統合
- `prod`: 本番反映済みの正本
- `hotfix/*`: 本番緊急修正

## Notes

- 本番デプロイ設定は GitHub またはホスティングサービス上で `prod` ブランチ参照に固定する
- branch 名は意味が追える短い英語にする
- 大きい作業でも `feature/*` は 1 関心事を保つ
