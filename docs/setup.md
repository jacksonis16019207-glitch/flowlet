# セットアップメモ

## 前提

- Windows
- Docker Desktop インストール済み
- Java 25 インストール済み
- Node.js インストール済み

## 環境変数ファイル

初回のみ、開発用と本番相当用の env ファイルを作成する。

```powershell
Copy-Item infra/.env.dev.example infra/.env.dev
Copy-Item infra/.env.example infra/.env
```

## 開発環境

### 開発DB起動

```powershell
docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml up -d
```

### frontend 起動

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

### backend 起動

```powershell
cd backend\flowlet
$env:SPRING_PROFILES_ACTIVE="dev"
.\gradlew.bat bootRun
```

## 本番相当環境

### DB と app を Docker で起動

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml up -d --build
```

### 停止

```powershell
docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml down
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml down
```

## 現時点の注意

- PostgreSQL は `18-alpine` を使用する
- backend は Java 25 前提で構成している
- 開発時は `frontend` と `backend` を別プロセスで起動する
- backend は `FLOWLET_DB_*` を共通の環境変数名として参照する
- 本番相当は Docker image build 内で frontend build を取り込み、`app` コンテナだけを公開する
