# KitchenLedger Project Story

## Problem

Small bakeries, cafes and food-production businesses often struggle to track real ingredient costs, supplier price differences, branch-level stock and actual production cost. Margins are guessed instead of calculated, stock is tracked informally, and multi-branch operations lack a single source of truth.

## Solution

KitchenLedger is a multi-tenant SaaS platform that helps these businesses manage ingredient inventory, supplier purchases, recipe costing, FIFO production consumption and dashboard analytics. Purchases automatically create stock batches; recipes preview branch-specific costs; production runs consume stock via FIFO and store immutable cost snapshots.

## Key Flows

### Purchase to inventory

Record a purchase with line items → stock batches and PURCHASE movements are created → inventory summary updates per branch.

### Recipe to cost calculation

Define a product and recipe → preview branch-specific cost using weighted average stock prices before production.

### Production to FIFO stock consumption

Run production for a branch → oldest stock batches are consumed first → consumption lines store actual batch unit costs and a production cost snapshot.

### Branch-level dashboard analytics

Review purchase totals, production trends, low-stock ingredients and recent activity across branches.

### Customer orders (MVP)

Record branch-scoped customer orders with product line items and status tracking (`PENDING` → `DELIVERED` / `CANCELLED`). Each order creates a customer record; orders do not affect inventory or production.

### Reports and CSV export

Filter operational data (purchases, productions, stock movements, orders) on a single reports page and export to CSV with Turkish headers. Frontend aggregates existing list APIs; no separate analytics backend.

## Technical Highlights

- Multi-tenant architecture with organization context on every API request
- JWT auth with HttpOnly refresh token cookies
- Role-based and branch-based authorization (OWNER, ADMIN, BRANCH_MANAGER, STAFF, VIEWER)
- Prisma / PostgreSQL data model with migrations and seed
- Purchase-created stock batches with unit costs
- FIFO batch consumption for production
- Production cost snapshots (immutable historical economics)
- Branch-specific weighted average recipe costing (preview / estimation)
- Permission-aware frontend UI aligned with backend guards
- Turkish localized interface for end users
- Turborepo monorepo: Next.js web + NestJS API

## Portfolio Summary

Built a multi-tenant SaaS platform for small food-production businesses to manage ingredient inventory, supplier-based purchase costs, recipe costing, customer orders and FIFO production consumption. The system supports branch-level stock tracking, role-based access control, production cost snapshots and dashboard analytics.

**One-liner:** Multi-tenant inventory and costing SaaS for bakeries and cafes — purchases, FIFO production, recipe costing and branch analytics.

**Stack:** Next.js · NestJS · PostgreSQL · Prisma · JWT · Turborepo

## Future Improvements

- Unit conversion (kg ↔ g, L ↔ ml)
- Stock adjustment / reversal flow
- PDF export and scheduled reports
- Subscription plans and billing
- Advanced DB locking for concurrent stock consumption
- Automated tests and CI/CD
