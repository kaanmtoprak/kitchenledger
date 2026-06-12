# KitchenLedger Demo Guide

This guide explains how to explore KitchenLedger with seeded demo users, role scenarios, and the main MVP flow.

Related docs: [README](../README.md) · [QA_CHECKLIST.md](QA_CHECKLIST.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [API_OVERVIEW.md](API_OVERVIEW.md) · [DEPLOYMENT.md](DEPLOYMENT.md)

## Demo Organization

- **Name:** Demo Bakery
- **Slug:** `demo-bakery`

## Demo Users

All demo users share the password **`Password123!`**.

| Role           | Email                       | Password       | Branch scope           | Expected access                                  |
| -------------- | --------------------------- | -------------- | ---------------------- | ------------------------------------------------ |
| Owner          | `owner@kitchenledger.app`   | `Password123!` | Main Kitchen + Kadikoy | Full access                                      |
| Admin          | `admin@kitchenledger.app`   | `Password123!` | Main Kitchen + Kadikoy | Full organization access                         |
| Branch Manager | `manager@kitchenledger.app` | `Password123!` | Kadikoy only           | Kadikoy branch data and operational actions      |
| Staff          | `staff@kitchenledger.app`   | `Password123!` | Main Kitchen only      | Operational create actions, no branch management |
| Viewer         | `viewer@kitchenledger.app`  | `Password123!` | Main Kitchen only      | Read-only access                                 |

**Legacy owner alias:** `demo@kitchenledger.app` / `Password123!` (also OWNER, both branches)

## Main Demo Flow

1. Login as `owner@kitchenledger.app`
2. Open **Dashboard** and review summary metrics
3. Open **Inventory → Stock** for Main Kitchen stock levels
4. Open **Products** and **Recipes**, then use **View Cost** with a branch selected
5. Create a **Purchase** for Main Kitchen
6. Confirm inventory stock/batches/movements updated
7. Open **Inventory → Stok Düzelt** and record a **Fire/Zayi** (waste) adjustment; verify stock and movements update
8. Record a **İade** (return) or **Manuel Düzeltme** increase; verify a new stock batch appears
9. Open **Orders** and review seeded demo orders (Ayşe Yılmaz / Mert Demir)
10. Create a new **Order** with product line items and verify total amount
11. Update order **status** from the list or detail dialog
12. Create a **Production** for a product with a recipe
13. Confirm FIFO consumption in production detail and inventory movements
14. Return to **Dashboard** and verify updated metrics

## Role Testing Checklist

### Viewer (`viewer@kitchenledger.app`)

- Create / Edit / Deactivate buttons should **not** appear
- Dashboard, Inventory, Products, Recipes, Purchases, Orders, Productions remain readable
- Backend still enforces authorization if a mutation is attempted manually

### Staff (`staff@kitchenledger.app`)

- Can create **Purchases**, **Orders**, and **Productions**
- Can create/edit **Ingredients**, **Suppliers**, **Products**, **Recipes**
- Cannot create/edit/deactivate **Branches**
- Cannot deactivate records (ingredients, suppliers, products)
- Sees **Main Kitchen** branch-scoped data only

### Branch Manager (`manager@kitchenledger.app`)

- Can perform operational mutations within assigned branch scope
- Cannot manage branches or deactivate records
- Sees **Kadikoy Branch** data only in branch-scoped lists and inventory views
- Main Kitchen purchases/productions should not appear in branch-filtered operational data

### Owner / Admin (`owner@` or `admin@`)

- Can see both branches
- Can manage branches and deactivate records
- Full MVP management actions visible in UI

## Branch Scope Notes

Seeded purchases:

| Invoice       | Branch         |
| ------------- | -------------- |
| INV-2026-0001 | Main Kitchen   |
| INV-2026-0002 | Main Kitchen   |
| INV-2026-0003 | Kadikoy Branch |

Use these to validate branch filtering in Purchases, Inventory, Dashboard, and Productions.

Seeded orders:

| Order No      | Branch         | Customer    | Product             |
| ------------- | -------------- | ----------- | ------------------- |
| ORD-2026-0001 | Main Kitchen   | Ayşe Yılmaz | San Sebastian (×2)  |
| ORD-2026-0002 | Kadikoy Branch | Mert Demir  | Chocolate Cake (×1) |

## Branch select scope

Branch filters and create forms show only branches the user can access:

- **OWNER / ADMIN** — all organization branches
- **BRANCH_MANAGER / STAFF / VIEWER** — only `BranchMember` branches (e.g. manager → Kadikoy only, staff/viewer → Main Kitchen only)

Backend guards remain the source of truth; unauthorized branch mutations still return 403.

## Reports Demo Flow (Adım 31)

1. Login as `owner@kitchenledger.app`
2. Open **Raporlar** from the sidebar (Genel)
3. Try each tab: **Satın Almalar**, **Üretimler**, **Stok Hareketleri**, **Siparişler**
4. Apply branch and date filters; confirm summary cards and preview table update
5. Click **CSV İndir** — verify Turkish column headers and UTF-8 characters in Excel
6. Login as `viewer@kitchenledger.app` — reports show Main Kitchen scope only; CSV export allowed for visible data
7. Login as `manager@kitchenledger.app` — branch filter shows Kadikoy only

## Browser QA (Adım 30)

Full walkthrough validated via local dev (`localhost:3000` + `localhost:3001`):

- All dashboard routes load (Panel, Şubeler, Malzemeler, Satın Almalar, Stok, Siparişler, Ürünler, Reçeteler, Üretimler)
- Owner end-to-end: purchase → stock → order → adjustment
- Viewer: no create/adjust/status CTAs; Main Kitchen scope only
- Manager: Kadikoy scope only in branch selects and lists
- Staff: Main Kitchen scope; operational mutations allowed

## Known MVP Limitations

- Orders create a new customer per order; no customer management screen
- Orders do not reduce stock or trigger production
- No payment, invoice or delivery integration for orders
- Return/manual stock increases create new batches; no approval workflow or document upload for adjustments
- No unit conversion; recipe/purchase units must match ingredient `baseUnit`
- No production update/delete; reversals would require future stock adjustment flows
- No purchase update/delete; corrections would require stock adjustment/reversal
- Access token is stored in `localStorage`; production-grade security can be improved later
- High-concurrency stock consumption does not yet use advanced DB row locking

## Environment Setup

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `DATABASE_URL` in `apps/api/.env`, then:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Web: http://localhost:3000  
API: http://localhost:3001
