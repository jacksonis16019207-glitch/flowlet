# flowlet

`flowlet` は、実在する銀行口座とアプリ内の目的別口座を分けて管理し、資金の配置状況と引き落とし余力を見える化するための家計・資産管理アプリです。

## 目的

- 実口座の残高と目的別残高を分けて把握できるようにする
- 引き落とし予定に対して残高が足りるかを事前に確認できるようにする
- React / TypeScript、Spring Boot、DDD を段階的に学べる構成で進める

## 現在の実装範囲

- `m_account` の登録・一覧取得 API
- 口座マスタ画面
- `flowlet` スキーマ配下の Flyway migration
- dev / prod の DB 切り分け
- 本番相当の `db + app` Docker 構成

## ディレクトリ構成

- `backend/flowlet/`: Spring Boot アプリケーション
- `frontend/`: React + Vite フロントエンド
- `docs/`: 要件、セットアップ、開発メモ
- `infra/`: Docker Compose、Dockerfile、環境変数ファイル

## セットアップ

詳細は [`docs/setup.md`](/C:/Users/jacks/Documents/flowlet/docs/setup.md) を参照してください。

### 開発環境

```powershell
Copy-Item infra/.env.example infra/.env.dev
docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml up -d

cd frontend
npm.cmd install
npm.cmd run dev

cd ..\backend\flowlet
$env:SPRING_PROFILES_ACTIVE="dev"
.\gradlew.bat bootRun
```

### 本番相当環境

```powershell
Copy-Item infra/.env.example infra/.env
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml up -d --build
```

本番相当のアプリは `http://localhost:8081/` で確認できます。

## 技術スタック

- Java 25
- Spring Boot 4
- PostgreSQL 18
- React 19
- Vite 8
- Docker Compose

## 補足

- `m_account` の初期データは Flyway で投入されます
- 本番相当では frontend build を Docker image build 内で取り込みます
- project-local Skills を優先して実装方針を揃えています
