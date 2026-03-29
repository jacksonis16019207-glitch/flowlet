# flowlet

flowlet は、実在する銀行口座とアプリ内の目的別口座を分けて管理し、残高の見える化と引き落とし不足判定を行う家計・資産管理アプリです。

## 解決したい課題

SBIネット銀行の目的別口座を解約し、SBI新生銀行の `ハイパー預金` に資金を集約したことで、目的ごとの残高を把握しづらくなりました。

また、三菱UFJ銀行のメイン口座で各種カードや定期支払いの引き落としに残高が足りているかを、毎回手計算で確認する負担があります。

flowlet は、この 2 つの不便を解消するためのアプリです。

## 目的

- 実在する銀行口座の残高と、アプリ内の目的別残高を分けて管理する
- 目的別の資金配分を崩さずに、現在の残高を見える化する
- 引き落とし予定額に対して、対象口座の残高が足りるかを事前に確認できるようにする
- 開発を通じて React / TypeScript、Spring Boot、DDD、AI コーディング活用を学ぶ

## MVP

- 実口座の管理
- 目的別口座の管理
- 入出金、振替、口座間移動の記録
- 引き落とし予定の手入力と不足判定
- `2025-12-25` 以降の履歴を取り込むための CSV 取込
- ダッシュボードでの残高サマリ表示

## 構成

- `backend/flowlet/`: Spring Boot API と静的配信用アプリケーション
- `frontend/`: React + Vite フロントエンド
- `docs/`: 要件、設計メモ、タスク整理

## 現在の状態

現時点では、monorepo の初期設定が完了しています。

- backend の初期生成と Gradle Wrapper 同梱
- frontend の初期生成
- PostgreSQL 18 用 Docker Compose
- 要件定義と MVP タスク整理
- GitHub 公開用の最小ドキュメント整備

## 採用バージョン方針

- Java: 25
- PostgreSQL: 18
- React: 19 系
- Vite: 8 系
- Spring Boot: 4 系

## 開発コマンド

### Docker で PostgreSQL 起動

```powershell
docker compose up -d db
```

### backend 起動

```powershell
cd backend\flowlet
.\gradlew.bat bootRun
```

### frontend 起動

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

## 次の作業

- README の継続改善
- 記事ネタ管理用ドキュメントの追加
- API 仕様の初版作成
- ドメインモデルの整理
- ダッシュボードと口座管理 API の実装
