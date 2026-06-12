# KitchenLedger

Multi-tenant SaaS platform for small food-production businesses to manage ingredient inventory, supplier-based purchase costs, recipe costing, FIFO production consumption and branch-level analytics.

**Stack:** TypeScript · Next.js · NestJS · PostgreSQL

**Live demo:** _Coming soon — URL will be added after Vercel/Railway deployment._

## Overview

### Problem

Small bakeries, cafes and boutique food producers often lack visibility into true product cost. Supplier prices vary, stock is tracked informally, and multi-branch operations make it hard to see where margin is lost.

### Solution

KitchenLedger connects purchasing, inventory, recipe costing and production into one operational system. Purchases create stock batches, recipes estimate branch-specific costs, and production runs consume stock via FIFO with immutable cost snapshots.

### Target Users

- Small bakeries and patisseries
- Cafes with in-house production
- Boutique food producers with multiple branches
- Operators who need ingredient-level cost control without enterprise ERP complexity

## Core Features

- Multi-tenant organization and branch management
- Role-based access control (OWNER, ADMIN, BRANCH_MANAGER, STAFF, VIEWER)
- Team / user management (OWNER and ADMIN can invite users, assign roles and branch access)
- Owner-only audit logs for critical mutations (create, update, status, stock adjustments)
- Ingredient and supplier management with minimum stock levels
- Purchase-based stock batch creation
- Inventory stock summary, movement history and stock adjustments (waste, return, manual)
- Product and recipe management
- Branch-specific recipe cost calculation (weighted average)
- FIFO production consumption
- Production cost snapshots
- Customer orders with branch-scoped tracking and status workflow
- Dashboard analytics (purchases, production, low stock, recent activity)
- Reports and CSV export (purchases, productions, stock movements, orders)
- Demo role users for portfolio and QA scenarios

## Tech Stack

**Frontend**

- Next.js · TypeScript · Tailwind CSS · shadcn/ui
- TanStack Query · React Hook Form · Zod · Recharts

**Backend**

- NestJS · TypeScript · Prisma · PostgreSQL
- JWT auth · bcrypt · REST API

**Tooling**

- Turborepo · pnpm · ESLint · Prettier

## Architecture

```
apps/
  web/     # Next.js dashboard UI
  api/     # NestJS REST API
packages/
  db/      # Prisma schema, migrations, seed
  eslint-config/
  typescript-config/
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module boundaries, multi-tenant model and costing design.

## Main Business Flow

1. Create branches, suppliers and ingredients
2. Record purchases
3. Stock batches and purchase movements are created automatically
4. Create products and recipes
5. Calculate branch-specific recipe cost
6. Record production
7. FIFO stock batches are consumed
8. Production cost snapshot is stored
9. Dashboard and inventory reflect the changes

## Demo Credentials

After seeding, log in at http://localhost:3000/login.  
Password for all accounts: **`Password123!`**

| Role           | Email                       | Password       | Expected access                 |
| -------------- | --------------------------- | -------------- | ------------------------------- |
| Owner          | `owner@kitchenledger.app`   | `Password123!` | Full access (all branches)      |
| Admin          | `admin@kitchenledger.app`   | `Password123!` | Full organization access        |
| Branch Manager | `manager@kitchenledger.app` | `Password123!` | Kadikoy branch scope            |
| Staff          | `staff@kitchenledger.app`   | `Password123!` | Main Kitchen operational access |
| Viewer         | `viewer@kitchenledger.app`  | `Password123!` | Read-only Main Kitchen access   |

Legacy owner alias: `demo@kitchenledger.app` / `Password123!`

Full demo flow and role checklist: [docs/DEMO.md](docs/DEMO.md)

## Local Development

**Prerequisites:** Node.js 20+, pnpm 10+, PostgreSQL

```bash
pnpm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Set DATABASE_URL in apps/api/.env

pnpm db:generate
pnpm db:migrate
pnpm db:seed

pnpm dev
# API: http://localhost:3001
# Web: http://localhost:3000
```

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `pnpm build`      | Build all packages                 |
| `pnpm lint`       | Lint all packages                  |
| `pnpm typecheck`  | Type-check all packages            |
| `pnpm db:migrate` | Apply migrations (local dev)       |
| `pnpm db:deploy`  | Apply migrations (production)      |
| `pnpm db:seed`    | Seed demo data (demo/staging only) |
| `pnpm db:studio`  | Open Prisma Studio                 |

`pnpm db:seed` resets the demo organization — do not run automatically in production.

## Deployment

Deploy web (Vercel) and API (Railway/Render) separately with managed PostgreSQL.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for env variables, build/start commands, cookie/CORS setup and post-deploy checklist.

## Documentation

| Doc                                            | Description                         |
| ---------------------------------------------- | ----------------------------------- |
| [docs/DEMO.md](docs/DEMO.md)                   | Demo users, flows and role testing  |
| [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md)   | Final manual QA checklist (Turkish) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)       | Production deployment guide         |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)   | Technical architecture notes        |
| [docs/PROJECT_STORY.md](docs/PROJECT_STORY.md) | Product story and portfolio summary |
| [docs/API_OVERVIEW.md](docs/API_OVERVIEW.md)   | REST API quick reference            |

## Known MVP Limitations

- No unit conversion; ingredient `baseUnit` must match recipe/purchase units exactly
- No production update/delete; reversal flows can be added later
- No purchase update/delete; stock adjustment/reversal can be added later
- Access token stored in `localStorage`; HttpOnly session pattern can be adopted later
- Advanced DB row locking for high-concurrency stock consumption is not implemented yet

## Screenshots

Screenshots will be added after deployment/demo capture.

| Screen            | Status  |
| ----------------- | ------- |
| Dashboard         | pending |
| Inventory         | pending |
| Purchase creation | pending |
| Recipe costing    | pending |
| Production detail | pending |

Placeholder directory: `assets/screenshots/`
