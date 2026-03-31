# セットアップメモ

## 前提

- Windows
- Docker Desktop インストール済み
- Java 25 インストール済み
- Node.js インストール済み

## 起動前の設定ファイル

最初に [infra/.env.example](/C:/Users/jacks/Documents/flowlet/infra/.env.example) をコピーして、開発用と本番用の env ファイルを作成します。

```powershell
Copy-Item infra/.env.example infra/.env.dev
Copy-Item infra/.env.example infra/.env
```

コピー後に [infra/.env.dev](/C:/Users/jacks/Documents/flowlet/infra/.env.dev) は開発用、[infra/.env](/C:/Users/jacks/Documents/flowlet/infra/.env) は本番用の値に書き換えます。

## 開発環境

### 開発 DB 起動

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

## 本番確認

### DB と app を Docker で起動

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml up -d --build
```

`flowlet-prod` は `restart: unless-stopped` を設定しているため、Docker Desktop の `Start Docker Desktop when you sign in to your computer` を有効にしておけば、OS 再起動後も自動復帰しやすくなります。停止したい場合だけこのコマンドで本番用コンテナを起動してください。開発中は不要です。

### URL

- app: `http://localhost:8081/`
- API: `http://localhost:8081/api/accounts`

### 停止

```powershell
docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml down
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml down
```

`docker compose --env-file infra/.env -f infra/docker-compose.prod.yml down` を実行すると、本番確認用のコンテナは停止されます。次回起動時は `up -d --build` が必要です。

## 補足

- PostgreSQL は `18-alpine` を使用する
- backend は Java 25 前提で起動している
- 開発時は `frontend` と `backend` を別プロセスで起動する
- backend は `FLOWLET_DB_*` を env から受け取る
- 本番構成では Docker image build の中で frontend build を含め、app コンテナだけを公開する
- `m_account` の初期スキーマは Flyway migration で管理する
- 開発環境では backend を `dev` profile で起動すると、Flyway が `m_account` のダミーデータを投入する
- 本番環境の `m_account` データは自動投入せず、必要な場合だけ `backend/db/local/seed_m_account.personal.sql` を手動適用する
