# API Overview

Quick REST reference for KitchenLedger. Not a full Swagger spec — intended for portfolio review and codebase navigation.

**Base URL (local):** `http://localhost:3001`

**Headers (protected routes):**

- `Authorization: Bearer <access_token>`
- `x-organization-id: <org-uuid>`

---

## Health

| Method | Endpoint       | Description                   |
| ------ | -------------- | ----------------------------- |
| GET    | `/health`      | Readiness check (includes DB) |
| GET    | `/health/live` | Liveness check (no DB)        |

---

## Auth

| Method | Endpoint         | Description                                                                                                  |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| POST   | `/auth/register` | Register user and organization                                                                               |
| POST   | `/auth/login`    | Login; sets refresh cookie                                                                                   |
| POST   | `/auth/refresh`  | Refresh access token (cookie)                                                                                |
| POST   | `/auth/logout`   | Clear refresh token                                                                                          |
| GET    | `/auth/me`       | Current user and active memberships (includes `membershipId`, `accessibleBranchIds` per org: `null` = all branches for OWNER/ADMIN) |

---

## Audit Logs

OWNER only (`JwtAuthGuard` + `TenantGuard` + `RolesGuard`).

| Method | Endpoint      | Description                                      |
| ------ | ------------- | ------------------------------------------------ |
| GET    | `/audit-logs` | Paginated audit trail with filters and search    |

Query: `page`, `limit`, `action`, `entityType`, `actorUserId`, `branchId`, `from`, `to`, `search`

---

## Team

OWNER and ADMIN only (`JwtAuthGuard` + `TenantGuard` + `RolesGuard`).

| Method | Endpoint              | Description                                                                 |
| ------ | --------------------- | --------------------------------------------------------------------------- |
| GET    | `/team`               | List organization members (role, branches, status, last login)              |
| POST   | `/team`               | Create user and/or add organization membership with role and branch access  |
| PATCH  | `/team/:membershipId` | Update role, branch access and/or deactivate membership (`isActive: false`)   |

**Notes:**

- `OrganizationMember.isActive: false` blocks tenant access via `TenantGuard`
- OWNER can assign any role; ADMIN can assign BRANCH_MANAGER, STAFF, VIEWER only
- BRANCH_MANAGER / STAFF / VIEWER require at least one `branchId`

---

## Branches

| Method | Endpoint        | Description       |
| ------ | --------------- | ----------------- |
| GET    | `/branches`     | List branches     |
| GET    | `/branches/:id` | Get branch        |
| POST   | `/branches`     | Create branch     |
| PATCH  | `/branches/:id` | Update branch     |
| DELETE | `/branches/:id` | Deactivate branch |

---

## Ingredients

| Method | Endpoint           | Description           |
| ------ | ------------------ | --------------------- |
| GET    | `/ingredients`     | List ingredients      |
| GET    | `/ingredients/:id` | Get ingredient        |
| POST   | `/ingredients`     | Create ingredient     |
| PATCH  | `/ingredients/:id` | Update ingredient     |
| DELETE | `/ingredients/:id` | Deactivate ingredient |

---

## Suppliers

| Method | Endpoint         | Description         |
| ------ | ---------------- | ------------------- |
| GET    | `/suppliers`     | List suppliers      |
| GET    | `/suppliers/:id` | Get supplier        |
| POST   | `/suppliers`     | Create supplier     |
| PATCH  | `/suppliers/:id` | Update supplier     |
| DELETE | `/suppliers/:id` | Deactivate supplier |

---

## Purchases

| Method | Endpoint         | Description                             |
| ------ | ---------------- | --------------------------------------- |
| POST   | `/purchases`              | Create purchase (creates stock batches) |
| GET    | `/purchases`              | List purchases                          |
| GET    | `/purchases/:id`          | Get purchase detail                     |
| PATCH  | `/purchases/:id/cancel`   | Cancel purchase (reverses unconsumed stock) |

**List query params:** `page`, `limit`, `q`, `branchId`, `supplierId`, `status`, `from`, `to`, `includeItems`

**Purchase status:** `ACTIVE`, `CANCELLED`

**Cancel rules:** Only when all linked stock batches are fully unconsumed (`remainingQuantity === initialQuantity`). Sets batch `remainingQuantity` to 0, writes `MANUAL_ADJUSTMENT` reversal movement, audit log `STATUS_CHANGE`. No purchase edit endpoint.

---

## Orders

| Method | Endpoint             | Description                             |
| ------ | -------------------- | --------------------------------------- |
| POST   | `/orders`            | Create customer order with line items   |
| GET    | `/orders`            | List orders (branch-scoped, filterable) |
| GET    | `/orders/:id`        | Get order detail                        |
| PATCH  | `/orders/:id`        | Update order (customer, items, due date, notes) |
| PATCH  | `/orders/:id/status` | Update order status                     |

**List query params:** `page`, `limit`, `q`, `branchId`, `status`, `from`, `to`, `includeItems`

**Roles:** Create/edit/status — OWNER, ADMIN, BRANCH_MANAGER, STAFF. VIEWER read-only.

**Edit rules:** `DELIVERED` and `CANCELLED` orders cannot be edited (`400`). Branch and `orderedAt` are not changed on update; items are replaced (delete + recreate) and `totalAmount` is recalculated.

**Order status enum:** `PENDING`, `CONFIRMED`, `IN_PRODUCTION`, `READY`, `DELIVERED`, `CANCELLED`

**MVP notes:**

- Each order creates a new customer record (no separate customer management module).
- Orders do not deduct inventory or create production runs.
- No payment, invoice or shipping integration.

---

## Inventory

| Method | Endpoint                 | Description                                     |
| ------ | ------------------------ | ----------------------------------------------- |
| GET    | `/inventory/stock`       | Stock summary by branch/ingredient              |
| GET    | `/inventory/batches`     | Stock batches                                   |
| GET    | `/inventory/movements`   | Stock movement history                          |
| POST   | `/inventory/adjustments` | Create stock adjustment (waste, return, manual) |

**Adjustment body:** `branchId`, `ingredientId`, `type` (`WASTE` | `RETURN` | `MANUAL_ADJUSTMENT`), `quantity`, `reason`, optional `stockBatchId`, optional `unitCost`, optional `adjustmentDirection` (`INCREASE` | `DECREASE` for manual)

**Roles:** OWNER, ADMIN, BRANCH_MANAGER, STAFF. VIEWER read-only.

**Notes:** Decrease uses FIFO or specific batch; increase creates a new stock batch. `unitCost` required when no weighted average exists.

---

## Products

| Method | Endpoint             | Description                  |
| ------ | -------------------- | ---------------------------- |
| GET    | `/products`          | List products                |
| GET    | `/products/:id`      | Get product                  |
| GET    | `/products/:id/cost` | Branch-specific cost preview |
| POST   | `/products`          | Create product               |
| PATCH  | `/products/:id`      | Update product               |
| DELETE | `/products/:id`      | Deactivate product           |

---

## Recipes

| Method | Endpoint            | Description                    |
| ------ | ------------------- | ------------------------------ |
| GET    | `/recipes`          | List recipes                   |
| GET    | `/recipes/:id`      | Get recipe                     |
| GET    | `/recipes/:id/cost` | Branch-specific cost breakdown |
| POST   | `/recipes`          | Create recipe                  |
| PATCH  | `/recipes/:id`      | Update recipe                  |

---

## Productions

| Method | Endpoint                | Description                      |
| ------ | ----------------------- | -------------------------------- |
| POST   | `/productions`          | Create production (FIFO consume) |
| GET    | `/productions`          | List productions                 |
| GET    | `/productions/:id`      | Get production with consumptions |
| PATCH  | `/productions/:id/cancel` | Cancel production (restore FIFO stock) |

**Production status:** `ACTIVE`, `CANCELLED`

**Cancel rules:** Only `ACTIVE` productions; restores consumed quantities to original batches; creates reversal `MANUAL_ADJUSTMENT` movements; writes audit log. Dashboard/report totals exclude `CANCELLED` productions.

---

## Dashboard

| Method | Endpoint                                  | Description                           |
| ------ | ----------------------------------------- | ------------------------------------- |
| GET    | `/dashboard/summary`                      | Summary metrics                       |
| GET    | `/dashboard/low-stock`                    | Low-stock ingredients                 |
| GET    | `/dashboard/production-trend`             | Production cost over time             |
| GET    | `/dashboard/top-products-by-cost`         | Top products by production cost       |
| GET    | `/dashboard/purchase-summary-by-supplier` | Purchases by supplier                 |
| GET    | `/dashboard/recent-activity`              | Recent production and purchase events |

---

## Reports (frontend)

There is no dedicated `/reports` API module. The web app aggregates existing filtered list endpoints client-side:

| Report tab       | Source endpoint            |
| ---------------- | -------------------------- |
| Satın Almalar    | `GET /purchases`           |
| Üretimler        | `GET /productions`         |
| Stok Hareketleri | `GET /inventory/movements` |
| Siparişler       | `GET /orders`              |

CSV export reuses the same filters with paginated fetches (`limit=100`, up to 1000 rows). Branch scope is enforced by existing list APIs and `useAccessibleBranches` on the UI.

---

## Debug (development only)

Registered when `NODE_ENV !== production`.

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| GET    | `/debug/tenant`           | Returns tenant context  |
| GET    | `/debug/admin-only`       | Role guard test (ADMIN) |
| GET    | `/debug/branch/:branchId` | Branch access test      |
