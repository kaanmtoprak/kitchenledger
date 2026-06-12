# Deployment

KitchenLedger is a pnpm monorepo. Web and API deploy separately; the database is managed via Prisma migrations.

Related docs: [README](../README.md) · [QA_CHECKLIST.md](QA_CHECKLIST.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [DEMO.md](DEMO.md)

## Recommended Stack

| Component     | Provider                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| Web (Next.js) | [Vercel](https://vercel.com)                                                                              |
| API (NestJS)  | [Railway](https://railway.app) or [Render](https://render.com)                                            |
| PostgreSQL    | [Neon](https://neon.tech), [Supabase](https://supabase.com) (Postgres only), Railway Postgres, or similar |

**Note:** Supabase is used here only as a managed PostgreSQL host. KitchenLedger does **not** use Supabase Auth, Supabase SDK, or Row Level Security — auth and tenancy are handled by the NestJS API.

## Monorepo Notes

- Install and build from the **repository root** unless your platform supports a custom root directory.
- Railway/Render API service: set the root directory to the repo root (or configure build/start commands with `pnpm --filter`).
- Prisma reads `DATABASE_URL` from the API environment. Local DB scripts load `apps/api/.env` via `dotenv-cli`.
- On hosted platforms, set env vars in the dashboard instead of committing `.env` files.

## Environment Variables

### API (Railway / Render)

| Variable                 | Required   | Description                                                                                                |
| ------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Yes        | PostgreSQL connection string                                                                               |
| `WEB_ORIGIN`             | Yes        | Frontend URL(s). Comma-separated for multiple origins, e.g. `https://app.vercel.app,http://localhost:3000` |
| `JWT_ACCESS_SECRET`      | Yes        | Strong random secret for access tokens                                                                     |
| `JWT_REFRESH_SECRET`     | Yes        | Strong random secret for refresh tokens                                                                    |
| `JWT_ACCESS_EXPIRES_IN`  | No         | Default: `15m`                                                                                             |
| `JWT_REFRESH_EXPIRES_IN` | No         | Default: `7d`                                                                                              |
| `COOKIE_DOMAIN`          | No         | Usually leave empty (see Cookie/CORS notes)                                                                |
| `NODE_ENV`               | Yes (prod) | Set to `production`                                                                                        |
| `PORT`                   | No         | Default: `3001`. Most hosts inject `PORT` automatically                                                    |

Example production values:

```env
DATABASE_URL=postgresql://user:pass@host:5432/kitchenledger?schema=public
WEB_ORIGIN=https://your-app.vercel.app
JWT_ACCESS_SECRET=<long-random-string>
JWT_REFRESH_SECRET=<long-random-string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_DOMAIN=
NODE_ENV=production
PORT=3001
```

### Web (Vercel)

| Variable              | Required | Description                                                 |
| --------------------- | -------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Yes      | Public API base URL, e.g. `https://your-api.up.railway.app` |

Example:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

`WEB_ORIGIN` on the API must match the Vercel frontend URL exactly (scheme + host, no trailing slash mismatch).

## Commands

From the repository root:

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Build all packages
pnpm build
```

### Database

**Local development:**

```bash
pnpm db:migrate   # prisma migrate dev
pnpm db:seed      # demo data (see warning below)
```

**Production:**

```bash
pnpm db:deploy    # prisma migrate deploy
```

Do **not** run `pnpm db:seed` automatically in production. The seed script deletes and recreates the demo organization. Use it only for intentional demo/staging resets.

### API Start (Railway / Render)

Typical release flow:

```bash
pnpm install
pnpm db:generate
pnpm build
pnpm db:deploy
pnpm --filter @kitchenledger/api start:prod
```

**Start command (after build):**

```bash
pnpm --filter @kitchenledger/api start:prod
```

This runs `node dist/main` from `apps/api`. Ensure the build step runs `pnpm build` (or at least `pnpm --filter @kitchenledger/api build` and `pnpm db:generate`) before start.

Some platforms combine migrate + start in a release command:

```bash
pnpm db:deploy && pnpm --filter @kitchenledger/api start:prod
```

### Web Build (Vercel)

Recommended Vercel project settings (monorepo):

| Setting          | Value                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Framework Preset | Next.js                                                                                                                       |
| Root Directory   | `apps/web` (or repo root — see below)                                                                                         |
| Install Command  | `pnpm install` (from repo root)                                                                                               |
| Build Command    | `cd ../.. && pnpm --filter @kitchenledger/web build` if Root = `apps/web`; otherwise `pnpm --filter @kitchenledger/web build` |
| Output Directory | `.next` (default; Vercel auto-detects)                                                                                        |
| Node.js Version  | 20.x                                                                                                                          |

**Environment variable (Vercel):**

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

If the Vercel project root is the **repository root** instead of `apps/web`:

| Setting        | Value                                    |
| -------------- | ---------------------------------------- |
| Root Directory | `.` (default)                            |
| Build Command  | `pnpm --filter @kitchenledger/web build` |

## Cookie / CORS Notes

- `WEB_ORIGIN` must include every frontend origin that calls the API (production URL, optional preview URLs, optional local dev URL).
- CORS is enabled with `credentials: true` so refresh cookies work cross-origin.
- **Production refresh cookie:** `httpOnly`, `secure: true`, `sameSite: "none"` (required for Vercel frontend + separate API domain).
- **Development refresh cookie:** `secure: false`, `sameSite: "lax"`.
- **`COOKIE_DOMAIN`:** leave empty in most deployments. The API sets the cookie on its own domain; setting a wrong domain breaks auth. Cross-site cookies do not require `COOKIE_DOMAIN`.
- **Local production simulation:** running `NODE_ENV=production` over plain `http://localhost` will set `secure: true` cookies that browsers will not send over HTTP. Test refresh auth against HTTPS deployments or keep `NODE_ENV=development` locally.

## Security Notes

- Use long, random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Never commit or expose `DATABASE_URL` publicly.
- Do not auto-run `pnpm db:seed` against production databases.
- Access tokens are stored in `localStorage` in this MVP. For stronger production security, consider HttpOnly session cookies or a BFF pattern.

## Post-Deploy Checklist

1. `GET https://your-api-domain.com/health` → `{ status: "ok", database: "ok", environment: "production" }`
2. `GET https://your-api-domain.com/health/live` → `{ status: "ok", service: "api" }`
3. Register or log in from the Vercel frontend
4. Verify `/auth/refresh` keeps the session (refresh cookie present)
5. Dashboard loads analytics data
6. Create a purchase
7. Create a production run

## Health Endpoints

| Endpoint           | Purpose                                                         |
| ------------------ | --------------------------------------------------------------- |
| `GET /health`      | Readiness — checks DB connection; returns 503 if DB unavailable |
| `GET /health/live` | Liveness — no DB check                                          |

Response shape (success):

```json
{
  "status": "ok",
  "service": "api",
  "database": "ok",
  "environment": "production"
}
```

No secrets or env values are exposed in health responses.
