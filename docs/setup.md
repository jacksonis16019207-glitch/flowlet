# セットアップメモ

## 前提

- Windows
- Docker Desktop インストール済み
- Java 25 インストール済み
- Node.js インストール済み

## 開発コマンド

### DB 起動

```powershell
docker compose up -d db
```

### DB 停止

```powershell
docker compose down
```

### frontend 依存関係インストール

```powershell
cd frontend
npm.cmd install
```

### frontend 開発サーバー起動

```powershell
cd frontend
npm.cmd run dev
```

### backend 起動

Gradle Wrapper を追加した後に以下を使用する。

```powershell
cd backend
.\gradlew.bat bootRun
```

## 現時点の注意

- PostgreSQL は `18-alpine` を使用する
- backend は Java 25 前提で構成している
- backend は Gradle Wrapper 未追加
- frontend は依存関係未インストール
- CSV 取込、DB migration、業務機能は未実装
