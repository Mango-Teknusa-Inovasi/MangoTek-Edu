# Deployment and Recovery

## Configuration

Run `npm run setup` or copy `.env.example` to `.env`. Setup refuses to overwrite an existing file. Keep the file private and out of version control.

| Variable | Purpose / default |
| --- | --- |
| `DB_DRIVER` | `sqlite` (default), `postgres`, or `mariadb` |
| `SQLITE_PATH` | SQLite file, default `data/portal.sqlite` |
| `DATABASE_URL` | Optional PostgreSQL/MariaDB connection string; overrides individual connection settings |
| `DB_HOST`, `DB_PORT` | Database server address and port; defaults to loopback and the engine's standard port |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Database and account credentials |
| `APP_ORIGIN` | Exact public origin; default `http://127.0.0.1:3000` |
| `HOST`, `PORT` | Hono listener; defaults to `127.0.0.1:3000` locally |
| `UPLOAD_DIR` | Persistent image directory, default `data/uploads` |
| `TRUST_PROXY_HOPS` | Number of trusted forwarding proxies; default `0` |
| `COMPOSE_PROFILES` | Empty for SQLite, `postgres`, or `mariadb` |

Create the database before migrating a standalone PostgreSQL/MariaDB deployment. The account must be able to apply schema migrations. Compose creates the selected database for a new database volume.

Each installation uses one engine. Changing `DB_DRIVER` does not convert or transfer records. Existing database volumes also retain their original credentials; changing an environment variable does not reset an existing database account.

## Docker Compose

Set matching values in `.env`:

| Engine | `DB_DRIVER` | `COMPOSE_PROFILES` |
| --- | --- | --- |
| SQLite | `sqlite` | empty |
| PostgreSQL | `postgres` | `postgres` |
| MariaDB | `mariadb` | `mariadb` |

For a source build:

```sh
docker compose up -d --build
docker compose exec app npm run db:migrate
docker compose exec app npm run admin:create
```

The migration command retries database connections during initial startup. Health checks become successful once the schema exists. Migrations run explicitly rather than on every application replica startup.

To use a published image, create `compose.image.yaml`:

```yaml
services:
  app:
    image: ghcr.io/mango-teknusa-inovasi/mangotek-edu:0.2.0
```

Then run:

```sh
docker compose -f compose.yaml -f compose.image.yaml pull
docker compose -f compose.yaml -f compose.image.yaml up -d --no-build
docker compose exec app npm run db:migrate
docker compose exec app npm run admin:create
```

If the organization keeps its container package private, authenticate to GHCR with an account granted package access. Public package visibility is controlled separately from repository visibility.

The app runs as a non-root user. The application port is bound to host loopback; database ports are not published. Put a trusted HTTPS reverse proxy in front of the application. Set `APP_ORIGIN` to the public HTTPS origin and configure forwarding headers intentionally. Do not trust arbitrary client-supplied forwarding headers.

The `portal_data` volume stores SQLite and uploaded images. PostgreSQL and MariaDB have separate named data volumes. Do not use `docker compose down -v` during upgrades: it deletes persistent volumes.

## Updates

1. Stop new writes and create a consistent database/media backup.
2. Record the current image digest and application version.
3. Build or pull the new application version.
4. Run migrations once using the new version.
5. Start the application and check `/health`, login, published content, and a controlled consultation submission.

The initial seed does not overwrite edited content on subsequent migrations. Released migrations must not be edited in place.

## Backup and restore

Back up the database **and** uploads together while application writes are stopped. Store copies outside the application host or Docker volume and protect them as private data.

### SQLite

```sh
npm run backup:sqlite -- backups/before-update
```

This uses SQLite's backup API rather than copying an active database/WAL pair. In Docker, run the command inside `app`, then copy the resulting backup directory out of the container or volume.

To restore, stop all application connections, preserve the current files, and copy the backed-up `portal.sqlite` and `uploads` to the configured paths. Remove stale `-wal`/`-shm` files only after every connection is closed. Restore the application version corresponding to the backup and verify health and content.

### PostgreSQL

Use `pg_dump -Fc` to produce a custom-format backup and `pg_restore` to restore into an empty database. Use a password prompt or a protected `.pgpass` file; avoid passwords in command-line arguments. In Compose, the tools are available in the `postgres` service.

### MariaDB

Use `mariadb-dump --single-transaction` and import the SQL into an empty database with the MariaDB client. Use a password prompt or protected client configuration. In Compose, the tools are available in the `mariadb` service.

For either server engine, restore uploads from the same backup window and verify publication snapshots, login, media, and consultation reports. Test recovery regularly. Rollback uses the matching application/database/media backup; destructive reverse migrations are deliberately not provided.

## Operational limits

- Sessions expire after eight hours. `npm run admin:reset` resets an account password and revokes its sessions.
- Consultation submissions are limited to five per hour per client address. Login has per-address and per-account limits. Correct trusted proxy configuration is important when serving multiple clients behind a proxy.
- Uploaded images are limited to 5 MB and 24 megapixels and converted to WebP, at most 2000 × 2000.
- Records use UTC timestamps; report dates are interpreted in Asia/Jakarta.
- `/health` checks database availability and initial portal content. It is not a comprehensive external monitoring service.
- Plan storage for uploads, publication snapshots, audit entries, and backups. This release does not automatically expire consultation records or publication history.
