# flowlet

flowlet は、実在する銀行口座とアプリ内の目的別口座を分けて管理し、残高の見える化と引き落とし不足判定を行う家計・資産管理アプリです。

## 構成

- `backend/`: Spring Boot API と静的配信用アプリケーション
- `frontend/`: React + Vite フロントエンド
- `docs/`: 要件、設計メモ、タスク整理

## 現在の状態

このコミットでは monorepo の最小土台を作成しています。

- backend の骨組み
- frontend の骨組み
- PostgreSQL 18 用 Docker Compose
- 初期セットアップの説明

## 採用バージョン方針

- Java: 25
- PostgreSQL: 18
- React: 19.1.1
- Vite: 7.1.4
- Spring Boot: 4.0.3

## 開発コマンド

### Docker で PostgreSQL 起動

```powershell
docker compose up -d db
```

### backend 起動

Gradle Wrapper を追加した後に以下を使用します。

```powershell
cd backend
.\gradlew.bat bootRun
```

### frontend 起動

依存関係をインストールした後に以下を使用します。

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

## 次の作業

- backend の Gradle Wrapper 導入
- frontend 依存関係のインストール
- DB migration 導入
- ダッシュボードと口座管理 API の実装
