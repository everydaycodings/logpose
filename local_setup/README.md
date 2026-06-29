# Local development setup

Spins up the backing services (Postgres, Redis, MinIO) so you can develop Jolly
on your host with `npm run dev`. The full app + worker are **not** containerized
here — that's what the root `docker-compose.yml` is for (production-style).

## 1. Start infrastructure

```bash
cd local_setup
docker compose up -d
```

This starts:

| Service  | URL / Port              | Notes                                  |
| -------- | ----------------------- | -------------------------------------- |
| Postgres | `localhost:5432`        | user/pass/db all `jolly`               |
| Redis    | `localhost:6379`        | queue + rate limiting                  |
| MinIO    | `localhost:9000`        | S3 API                                 |
| MinIO UI | `localhost:9001`        | login `minioadmin` / `minioadmin`      |

The `music` bucket is created automatically.

## 2. Configure env

The repo's root `.env` already points at these (`localhost`) services. If you
don't have one yet:

```bash
cp ../.env.example ../.env
```

## 3. Migrate the database (first time)

```bash
cd ..
npm run db:migrate
```

## 4. Run the app + worker

```bash
npm run dev          # terminal 1 — Next.js app on http://localhost:3000
npm run worker:dev   # terminal 2 — processes uploads & YouTube imports
```

Log in with the `APP_PASSWORD` from your `.env` (default `straw-hat`).

## Tear down

```bash
cd local_setup
docker compose down          # keep data
docker compose down -v       # wipe data (Postgres + MinIO volumes)
```
