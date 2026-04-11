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

`frontend` では Tailwind CSS v4 と `shadcn/ui` を使うため、共通 UI 部品を追加するときは `src/shared/components/ui/` を優先します。クラス結合ユーティリティは `src/shared/lib/utils.ts` の `cn` を使います。

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

### 初回起動または再 build が必要なとき

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml up -d --build
```

frontend または backend の変更を反映したいときだけ `--build` を付けます。Dockerfile では `npm` と `Gradle` の依存キャッシュを使うため、2回目以降の build 時間を短縮しやすくしています。

### 通常起動

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml up -d
```

イメージ変更がない再起動は `--build` を付けずに起動します。`flowlet-prod` は `restart: unless-stopped` を設定しているため、Docker Desktop の `Start Docker Desktop when you sign in to your computer` を有効にしておけば、OS 再起動後も自動復帰しやすくなります。停止したい場合だけこのコマンドで本番用コンテナを起動してください。開発中は不要です。

### URL

- app: `http://localhost:8081/`
- API: `http://localhost:8081/api/accounts`

### 停止

```powershell
docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml down
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml down
```

`docker compose --env-file infra/.env -f infra/docker-compose.prod.yml down` を実行すると、本番確認用のコンテナは停止されます。次回起動時は `up -d --build` が必要です。
`app` のイメージを作り直していない場合は、次回起動を `up -d` にできます。

## 補足

- PostgreSQL は `18-alpine` を使用する
- backend は Java 25 前提で起動している
- 開発時は `frontend` と `backend` を別プロセスで起動する
- backend は `FLOWLET_DB_*` を env から受け取る
- 本番構成では Docker image build の中で frontend build を含め、app コンテナだけを公開する
- 本番再起動でコード変更がない場合は `up -d` を優先し、`up -d --build` は初回起動または変更反映時だけ使う
- `m_account`、`m_credit_card_profile`、`m_goal_bucket`、`m_category`、`m_subcategory`、`t_transaction`、`t_goal_bucket_allocation` の初期スキーマは Flyway migration で管理する
- DB マイグレーション運用ルールは [db-migration-rules.md](/C:/Users/jacks/Documents/flowlet/docs/ops/db-migration-rules.md) を参照する
- 開発用ダミーデータは `infra/sql/dev-seed/`、固定マスタデータは `infra/sql/master-data/` の SQL を手動で投入する
- `infra/sql/master-data/001_insert_m_category.sql` と `infra/sql/master-data/002_insert_m_subcategory.sql` は、本番初期設定でも使えるようにカテゴリ体系を広めに用意している
- `infra/sql/dev-seed/` のデータは [public-demo-data-policy.md](/C:/Users/jacks/Documents/flowlet/docs/ops/public-demo-data-policy.md) に合わせた公開用ダミーデータを使う

```powershell
docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml down -v
docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml up -d
```

### seed SQL の投入例

固定マスタデータを先に投入し、その後で開発用ダミーデータを投入します。

```powershell
docker cp infra/sql/master-data/001_insert_m_category.sql flowlet-db-dev:/tmp/001_insert_m_category.sql
docker exec flowlet-db-dev psql -U flowlet -d flowlet_dev -f /tmp/001_insert_m_category.sql

docker cp infra/sql/master-data/002_insert_m_subcategory.sql flowlet-db-dev:/tmp/002_insert_m_subcategory.sql
docker exec flowlet-db-dev psql -U flowlet -d flowlet_dev -f /tmp/002_insert_m_subcategory.sql

docker cp infra/sql/dev-seed/001_insert_m_account.sql flowlet-db-dev:/tmp/001_insert_m_account.sql
docker exec flowlet-db-dev psql -U flowlet -d flowlet_dev -f /tmp/001_insert_m_account.sql

docker cp infra/sql/dev-seed/002_insert_m_credit_card_profile.sql flowlet-db-dev:/tmp/002_insert_m_credit_card_profile.sql
docker exec flowlet-db-dev psql -U flowlet -d flowlet_dev -f /tmp/002_insert_m_credit_card_profile.sql

docker cp infra/sql/dev-seed/003_insert_m_goal_bucket.sql flowlet-db-dev:/tmp/003_insert_m_goal_bucket.sql
docker exec flowlet-db-dev psql -U flowlet -d flowlet_dev -f /tmp/003_insert_m_goal_bucket.sql

docker cp infra/sql/dev-seed/004_insert_t_transaction.sql flowlet-db-dev:/tmp/004_insert_t_transaction.sql
docker exec flowlet-db-dev psql -U flowlet -d flowlet_dev -f /tmp/004_insert_t_transaction.sql

docker cp infra/sql/dev-seed/005_insert_t_goal_bucket_allocation.sql flowlet-db-dev:/tmp/005_insert_t_goal_bucket_allocation.sql
docker exec flowlet-db-dev psql -U flowlet -d flowlet_dev -f /tmp/005_insert_t_goal_bucket_allocation.sql
```

### この seed で確認できること

- ダッシュボードで実口座残高、GoalBucket 残高、未配分残高を確認できる
- 生活口座から積立口座への振替と、その後の GoalBucket 配分を確認できる
- クレジットカード利用と支払い用口座からの返済の流れを確認できる
- 口座、目的別口座、取引、配分の主要画面を公開用ダミーデータで確認できる

