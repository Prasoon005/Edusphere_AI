# Deploying EduSphere AI

This guide covers local development, environment configuration, database
migrations, Docker deployment, and production notes.

## 1. Prerequisites

- Node.js 20+
- pnpm 9+ (`corepack enable` gives you this automatically on Node 20+)
- Docker + Docker Compose (for the containerized path)
- A PostgreSQL 14+ instance (Docker Compose provisions one for you)

## 2. Local development (no Docker)

```bash
git clone <your-fork-url> edusphere-ai
cd edusphere-ai
pnpm install                      # uses the committed pnpm-lock.yaml

cp apps/api/.env.example apps/api/.env
# edit apps/api/.env — at minimum set a real DATABASE_URL and change the
# JWT_ACCESS_SECRET / JWT_REFRESH_SECRET values (32+ random characters each)

docker compose up -d postgres     # or point DATABASE_URL at any Postgres you have

pnpm db:migrate                   # creates tables from prisma/schema.prisma
pnpm db:seed                      # loads realistic demo data

pnpm dev                          # runs API (4000) and web (5173) in parallel
```

Web: http://localhost:5173 · API: http://localhost:4000/api/v1 · Swagger:
http://localhost:4000/api/docs

Seeded login (all accounts share this password): `Password@123`
- Super Admin: `admin@edusphere.ai`
- Teacher: `priya.sharma@edusphere.ai`
- Student: `aarav.patel@student.edusphere.ai`

## 3. Environment variables

All variables live in `apps/api/.env` (copy from `.env.example`). The schema
that validates them is `apps/api/src/config/env.ts` — if a required variable
is missing or malformed, the API refuses to boot rather than run
misconfigured, and prints exactly which variable failed.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_ACCESS_SECRET` | Yes | 16+ chars; use a real random secret in production |
| `JWT_REFRESH_SECRET` | Yes | 16+ chars; different from the access secret |
| `JWT_ACCESS_EXPIRY` | No | default `15m` |
| `JWT_REFRESH_EXPIRY` | No | default `7d` |
| `CORS_ORIGIN` | No | comma-separated list of allowed origins |
| `UPLOAD_DIR` | No | default `./uploads` — where assignments, materials, reports, and backups are written |
| `MAX_FILE_SIZE_MB` | No | default `10` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | No | global rate limiter tuning |
| `STORAGE_DRIVER` | No | `local` (default) or `s3` — see §7 |

The web app reads one build-time variable: `VITE_API_URL` (defaults to
`http://localhost:4000/api/v1` in dev via the Vite proxy; set explicitly for
production builds — see §5).

**Generate strong secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Run it twice — once for each of `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

## 4. Database migrations

Prisma migrations are the source of truth for schema changes.

```bash
pnpm db:migrate        # dev: creates a new migration from schema changes + applies it
pnpm --filter api prisma:deploy   # prod: applies existing migrations, no prompts
pnpm db:studio         # visual DB browser
pnpm db:reset          # DANGER: drops and recreates the dev database
```

In production, run `prisma migrate deploy` as a release step (e.g. a
one-off container/job) **before** starting the new API version — never
`migrate dev` against a production database.

## 5. Docker deployment

```bash
cp apps/api/.env.example apps/api/.env   # fill in real secrets
export JWT_ACCESS_SECRET=...
export JWT_REFRESH_SECRET=...
export CORS_ORIGIN=https://your-domain.com
export VITE_API_URL=https://api.your-domain.com/api/v1

docker compose up -d --build
```

This brings up three containers: `postgres`, `api` (port 4000), and `web`
(nginx serving the built SPA on port 80). Run migrations once the `api`
container's dependencies are ready:

```bash
docker compose exec api pnpm prisma migrate deploy
docker compose exec api pnpm prisma:seed   # optional — demo data only, skip in real prod
```

### Reverse proxy notes

Put a reverse proxy (nginx, Caddy, Traefik, or your cloud LB) in front of
both containers with TLS termination. Two routing details matter:

1. **`/uploads` must be reachable from the browser at the API's origin.**
   Assignment submissions, study materials, and generated reports are
   served as static files under `/uploads/*` directly by the API
   (`express.static`), not through the frontend. If your reverse proxy
   maps `api.your-domain.com` → the `api` container, this works
   automatically. If you instead serve everything under one domain with
   path-based routing (e.g. `your-domain.com/api/*` → api,
   `your-domain.com/*` → web), you must **also** route
   `your-domain.com/uploads/*` → the `api` container, or file links in the
   UI will 404.
2. **The refresh-token cookie is scoped to `/api/v1/auth`** and marked
   `secure` in production, so it only travels over HTTPS. Terminate TLS
   before traffic reaches the API, and ensure `NODE_ENV=production` is set
   on the `api` container so the cookie's `secure` flag is honored
   correctly.

### Persisting uploads across deployments

`docker-compose.yml` already mounts a named volume
(`edusphere_uploads`) at `/app/apps/api/uploads` so files survive
container restarts and rebuilds. If you deploy to a platform that doesn't
support named volumes (e.g. many serverless/container-per-request
platforms), switch `STORAGE_DRIVER` to `s3` and provide the `AWS_*`
variables — the upload middleware (`src/middleware/upload.middleware.ts`)
is structured so swapping the storage backend doesn't require touching
any route or controller code, only the middleware's `storageFor()` function
needs an S3-backed implementation (e.g. `multer-s3`).

## 6. Running tests

```bash
pnpm --filter api test     # backend: DB-independent unit tests (grading,
                            # JWT expiry parsing, pagination helpers) run
                            # anywhere; integration tests additionally
                            # need a real DATABASE_URL and a generated
                            # Prisma client (see note below)
pnpm --filter web test     # frontend: component + utility tests (jsdom)
```

**Note on the sandbox this project was built in:** Prisma's engine binaries
are fetched exclusively from `binaries.prisma.sh` — confirmed via direct
testing that there is no npm-registry-distributed fallback
(`@prisma/fetch-engine` only knows that one source) and no GitHub Releases
fallback either (`prisma-engines` doesn't attach binaries to its GitHub
releases). Driver-adapter/WASM mode (tested with `@prisma/adapter-pg`) and
upgrading to Prisma 6.x (tested with 6.19.3) both still require a
network-fetched engine for the `generate`/`migrate` CLI commands
specifically, even though the WASM *runtime* engine ships in the npm
package already. That domain was unreachable from the authoring sandbox,
so integration tests that construct the full Express app (which imports
`@prisma/client`) couldn't execute there — only the pure-logic unit tests
could. A real local PostgreSQL 16 instance was installed and running in
that sandbox to test this; the blocker is specifically and only the engine
binary fetch, not database connectivity. In a normal environment with
unrestricted network access, `pnpm install` triggers `prisma generate`
automatically and the full suite, including the Supertest integration
tests in `apps/api/src/__tests__/auth.test.ts`, will run without any
changes.

## 7. Migrating file storage from local disk to S3

The schema anticipates this (`STORAGE_DRIVER` env var, `AWS_*` variables
already defined in `.env.example`). To complete the migration:

1. `pnpm --filter api add multer-s3 @aws-sdk/client-s3`
2. In `src/middleware/upload.middleware.ts`, branch `storageFor()` on
   `env.STORAGE_DRIVER`: keep the existing `multer.diskStorage` path for
   `"local"`, add a `multer-s3` storage engine for `"s3"`.
3. Update `publicFileUrl()` to return the S3 object URL (or a CloudFront
   URL) instead of the local `/uploads/...` path when `STORAGE_DRIVER=s3`.
4. Existing `fileUrl` values already stored in the database (from local
   uploads made before the migration) will keep pointing at
   `/uploads/...` — either leave the static file route in place
   indefinitely for backward compatibility, or write a one-off script to
   copy existing local files to S3 and update the `fileUrl` columns.

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| API exits immediately on boot, logs "Invalid environment variables" | A required `.env` var is missing/too short — the error message names it |
| `prisma generate` / `prisma migrate` fails with a 403 on `binaries.prisma.sh` | Outbound network to that domain is blocked (proxy/firewall) — allow it, or run the command from a machine that can reach it |
| Login works but every subsequent request 401s | Check `CORS_ORIGIN` matches the web app's actual origin exactly (including protocol and port) — cookies won't be sent cross-origin otherwise |
| File links in the UI 404 in production | See the `/uploads` reverse-proxy note in §5 |
| `pnpm install` resolves an unexpected major version of a dependency | Delete `node_modules` at the root and every `apps/*`, then reinstall from the committed `pnpm-lock.yaml` — don't run `npm install` inside an individual app, it writes a conflicting lockfile |
