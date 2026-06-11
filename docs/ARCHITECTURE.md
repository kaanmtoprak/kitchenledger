# Architecture Notes

Technical overview of KitchenLedger for portfolio review and engineering interviews.

## Monorepo Structure

| Package       | Role                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| `apps/web`    | Next.js App Router dashboard — auth, organization switcher, permission-aware CRUD UI |
| `apps/api`    | NestJS REST API — auth, tenant guards, business modules                              |
| `packages/db` | Prisma schema, migrations, seed script, shared client export                         |

Shared config packages (`eslint-config`, `typescript-config`) keep lint and TS settings consistent across apps.

## Backend Module Boundaries

| Module                     | Responsibility                                                               |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Auth**                   | Register, login, JWT access tokens, HttpOnly refresh cookie, `/auth/me`      |
| **Tenant / Authorization** | `TenantGuard`, `RolesGuard`, `BranchAccessGuard`, `x-organization-id` header |
| **Reference Data**         | Branches, Ingredients, Suppliers — org-scoped CRUD                           |
| **Purchases**              | Purchase creation with line items; triggers stock batch + movement creation  |
| **Inventory**              | Stock summary, batches, movement audit trail                                 |
| **Products / Recipes**     | Product catalog, recipe definitions, branch-specific cost preview            |
| **Productions**            | Production runs, FIFO consumption, immutable cost snapshots                  |
| **Dashboard**              | Aggregated analytics — summary, low stock, trends, recent activity           |
| **Health**                 | `/health` (DB readiness), `/health/live` (liveness)                          |

Debug endpoints (`/debug/*`) are registered only when `NODE_ENV !== production`.

## Multi-Tenant Data Model

Core tenancy entities:

- **Organization** — top-level tenant; users belong via `OrganizationMember`
- **OrganizationMember** — links `User` to `Organization` with a `Role`
- **Branch** — physical/logical location within an organization
- **BranchMember** — optional branch scope for non-admin roles

Tenant-scoped business models carry `organizationId` (and often `branchId` for operational data). API requests include `x-organization-id` so every query is scoped to the active organization.

```
User ── OrganizationMember ── Organization
                                  ├── Branch ── BranchMember
                                  ├── Ingredient, Supplier, Product, Recipe
                                  ├── Purchase ── StockBatch ── StockMovement
                                  └── Production ── ProductionConsumption
```

## Authorization Model

| Role             | Typical scope                              |
| ---------------- | ------------------------------------------ |
| `OWNER`          | Full organization access, all branches     |
| `ADMIN`          | Full organization access, all branches     |
| `BRANCH_MANAGER` | Assigned branch(es) only                   |
| `STAFF`          | Assigned branch(es), operational mutations |
| `VIEWER`         | Assigned branch(es), read-only             |

Guards applied per route:

- **TenantGuard** — validates `x-organization-id` and resolves tenant context
- **RolesGuard** — enforces `@Roles(...)` decorator when present
- **BranchAccessGuard** — ensures the user can access the requested branch

Frontend mirrors backend permissions via `permissions.ts` so UI actions match API enforcement.

## Inventory and Stock Movement Model

1. **Purchase** creates one or more **StockBatch** records (per line item) with `unitCost` and `remainingQuantity`
2. **StockMovement** records every change (`PURCHASE`, `PRODUCTION_CONSUMPTION`, `MANUAL_ADJUSTMENT`, `WASTE`, `RETURN`) for audit
3. **Stock summary** aggregates `remainingQuantity` per ingredient per branch
4. Batch `remainingQuantity` decreases on production consumption; depleted batches remain for history

## Recipe Costing vs Production Costing

This distinction is central to KitchenLedger’s costing model:

| Aspect  | Recipe cost (preview)                                         | Production cost (actual)                    |
| ------- | ------------------------------------------------------------- | ------------------------------------------- |
| Purpose | Pricing / planning estimate                                   | Recorded operational cost                   |
| Method  | **Branch-specific weighted average** of remaining stock       | **FIFO** — oldest batches first             |
| When    | On demand (`GET /recipes/:id/cost`, `GET /products/:id/cost`) | At production creation                      |
| Mutable | Recalculates as stock changes                                 | **Immutable snapshot** on production record |

**Recipe cost preview** uses weighted average unit costs from current stock batches in the selected branch. It answers: “What would this recipe cost right now?”

**Production cost** uses actual FIFO batch costs at consumption time and stores `unitCostSnapshot`, `totalCostSnapshot` and per-line consumption costs. It answers: “What did this production actually cost?”

**Why snapshots?** Ingredient prices and stock levels change after production. Snapshots preserve historical accuracy for margin analysis, audit and reporting.

## Important Trade-offs

- **No unit conversion in MVP** — `baseUnit` must match across purchases, recipes and production
- **No production update/delete** — corrections require future reversal/adjustment flows
- **No purchase update/delete** — same as above
- **Access token in localStorage** — simpler MVP auth; refresh token remains HttpOnly cookie
- **Concurrency** — stock consumption uses transactions but not pessimistic row locking; sufficient for MVP demo scale, improvable for high-throughput scenarios
