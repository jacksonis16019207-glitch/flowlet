# Repository Guidelines

## Product Goals
`Start.md` は継続的な開発方針として扱い、必要に応じて常に参照してください。特に「Webアプリ開発の目的」は、要件定義、設計、実装順、ドキュメント、記事提案、Skills 提案の判断基準として反映します。

- ポートフォリオとして見せられる構成、品質、説明可能性を意識する
- 開発の区切りごとに記事化しやすい論点を提案する
- React / TypeScript 学習につながる実装順と構成を優先する
- ドメイン駆動設計を段階的に学べるよう、ドメイン整理と責務分離を重視する
- AI コーディングエージェントと Skills の活用余地を都度提案する
- 目的に直接関係しない実装は、AI に任せやすい単位へ分解できる形を意識する

## Skills Policy
このリポジトリでは、実装や設計を進める際に project-local Skills を優先して利用してください。新しい会話でも同じ方針を適用します。

- まず `./.codex/skills/` 配下の Skills を確認し、該当するものがあれば優先して使う
- このリポジトリで優先利用する Skills は `db-design-helper`、`java-spring-helper`、`react-typescript-helper`
- タスク整理や検証観点の補助として `task-breakdown-helper`、`test-design-helper` も使う
- project-local Skills で不足する部分のみ、グローバル Skills や通常の調査で補完する
- Skills を使う場合は、着手時にどの Skill を使うか短く共有する

## Project Structure & Module Organization
このリポジトリは、`flowlet` Web アプリの monorepo を想定します。バックエンドは `backend/`、フロントエンドは `frontend/`、共通ドキュメントは `docs/` に配置してください。DB スキーマ、seed、ローカル構築メモなどの DB 関連は `backend/db/` または `docs/db/` にまとめます。UI 用の静的アセットは `frontend/src/assets/` に置き、コードはファイル種別ではなく機能単位で整理してください。

## Build, Test, and Development Commands
追加コマンドを導入した場合は、必ず `docs/` に追記してください。

- `docker compose up --build`: ローカル開発に必要な全サービスを起動します。
- `./gradlew bootRun` または `gradlew.bat bootRun`: Spring Boot バックエンドを起動します。
- `npm install && npm run dev`: フロントエンド依存をインストールし、Vite 開発サーバーを起動します。
- `./gradlew test` または `gradlew.bat test`: バックエンドのテストを実行します。
- `npm run test`: フロントエンドのテストを実行します。
- `npm run build`: フロントエンドの本番ビルドを作成します。

## Coding Style & Naming Conventions
各モジュールに formatter や linter を導入したら、それを標準としてください。Java は Spring Boot の一般的な規約に従い、インデントは 4 スペース、クラス名は `PascalCase`、フィールド・メソッドは `camelCase`、package 名は小文字に統一します。React / TypeScript は 2 スペースを基本とし、コンポーネントは `PascalCase`、hooks と utility は `camelCase` を使います。無関係な責務を 1 ファイルに混在させないでください。

## Testing Guidelines
バックエンドのテストは `backend/src/test/`、フロントエンドのテストはソース同階層または `frontend/src/__tests__/` に配置します。Java のテスト名は `*Test`、フロントエンドは `*.test.ts` または `*.test.tsx` を使ってください。新しい業務ロジック、API 挙動、重要な UI フローにはテスト追加を基本とします。バグ修正では、修正前に失敗し修正後に通るテストを最低 1 件追加してください。

## Commit & Pull Request Guidelines
コミットメッセージは `feat: タスクリスト取得APIを追加`、`fix: 空の入力時の処理を修正` のように、Conventional Commits 形式を保ちつつ日本語で短く追跡しやすい形式を使ってください。1 コミット 1 関心事を基本とします。Pull Request には目的、主要変更点、テスト結果、関連 Issue、UI 変更時のスクリーンショットを含めてください。スキーマ変更、環境変数追加、破壊的変更は明示してください。

## Security & Configuration Tips
秘密情報、`.env`、ローカル DB 認証情報はコミットしないでください。環境依存の設定値は追跡対象外ファイルで管理し、必要なキーは `docs/` または `.env.example` に記載してください。
