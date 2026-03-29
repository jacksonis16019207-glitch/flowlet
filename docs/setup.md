# セットアップメモ

## 前提

- Windows
- Docker Desktop インストール済み
- Java 25 インストール済み
- Node.js インストール済み

## 環境変数ファイル

初回のみ、開発用と本番相当用の env ファイルをそれぞれ作成する。

```powershell
Copy-Item infra/.env.dev.example infra/.env.dev
Copy-Item infra/.env.example infra/.env
```

## 開発コマンド

### 開発DB起動

```powershell
docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml up -d
```

### 本番相当DB起動

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml up -d
```

### DB停止

```powershell
docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml down
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml down
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

### backend 開発起動

```powershell
cd backend\flowlet
$env:SPRING_PROFILES_ACTIVE="dev"
.\gradlew.bat bootRun
```

### backend 本番相当起動

```powershell
cd backend\flowlet
$env:SPRING_PROFILES_ACTIVE="prod"
.\gradlew.bat bootRun
```

### frontend を backend static に配置

本番相当では frontend を build したうえで、backend の `static` 配下へ配置してから backend を起動する。

```powershell
cd frontend
npm.cmd run build
cd ..
powershell -ExecutionPolicy Bypass -File .\infra\scripts\sync-frontend-static.ps1
```

## 現時点の注意

- PostgreSQL は `18-alpine` を使用する
- backend は Java 25 前提で構成している
- 開発時は `frontend` と `backend` を別プロセスで起動する
- backend は `FLOWLET_DB_*` を共通の環境変数名として参照する
- Docker Compose の env ファイルは、開発用が `infra/.env.dev`、本番相当用が `infra/.env`
- 本番相当では frontend build を backend `static` にコピーして配信する
