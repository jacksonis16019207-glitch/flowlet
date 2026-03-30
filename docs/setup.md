# セットアップメモ

## 前提

- Windows
- Docker Desktop インストール済み
- Java 25 インストール済み
- Node.js インストール済み

## 起動用設定ファイル

最初に [infra/.env.example](/C:/Users/jacks/Documents/flowlet/infra/.env.example) をコピーして、開発用と本番用の env ファイルを作成します。

```powershell
Copy-Item infra/.env.example infra/.env.dev
Copy-Item infra/.env.example infra/.env
```

コピー後に [infra/.env.dev](/C:/Users/jacks/Documents/flowlet/infra/.env.dev) は開発用、[infra/.env](/C:/Users/jacks/Documents/flowlet/infra/.env) は本番用の値に書き換えます。

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

### URL

- frontend: `http://localhost:5173/`
- backend API: `http://localhost:8080/api/accounts`

## 本番構成

### DB と app を Docker で起動

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml up -d --build
```

`flowlet-prod` は `restart: unless-stopped` を設定しているため、Docker Desktop の `Start Docker Desktop when you sign in to your computer` を有効にしておけば、初回起動後は PC 再起動後も自動復帰します。

初回だけは上のコマンドで本番用コンテナを起動してください。以後は明示的に停止しない限り、同じコンテナが再起動対象になります。

### URL

- app: `http://localhost:8081/`
- API: `http://localhost:8081/api/accounts`

### 停止

```powershell
docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml down
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml down
```

`docker compose --env-file infra/.env -f infra/docker-compose.prod.yml down` を実行すると、本番構成のコンテナは削除されるため、次回は再度 `up -d --build` が必要です。

## 補足

- PostgreSQL は `18-alpine` を使用する
- backend は Java 25 前提で構成している
- 開発時は `frontend` と `backend` を別プロセスで起動する
- backend は `FLOWLET_DB_*` を env から受け取る
- 本番構成は Docker image build の中で frontend build を含め、app コンテナだけを公開する
- `m_account` の初期スキーマは Flyway migration で管理する
