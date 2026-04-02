# Prod Deploy Commands

## Standard Deploy

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml up -d --build
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml ps
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml logs app --tail 100
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml logs db --tail 100
```

## Stop

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml down
```

`down` はコンテナ停止のみ。DB volume は残る。

## Reset DB Volume

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml down -v
docker compose --env-file infra/.env -f infra/docker-compose.prod.yml up -d db
```

- `down -v` は DB データを削除する。
- 空 DB のまま保ちたい場合は `db` だけ上げる。
- `app` まで上げると Flyway migration が走る。

## Check DB Connection

```powershell
docker exec flowlet-db-prod sh -lc "PGPASSWORD=flowlet psql -U flowlet -d flowlet_prod -c '\conninfo'"
```

実際のコンテナ名、DB 名、ユーザーは `infra/.env` を優先する。
