# Aquarium Shop Business Software

A full-stack business management system for aquarium retailers — inventory (including
livestock-specific care data), point of sale, customers, suppliers, purchasing, and
reporting, all in one app.

## Stack

- **Backend** — Node.js, Express, TypeScript, [Prisma ORM](https://www.prisma.io/) on SQLite
  (swap the `DATABASE_URL` for Postgres/MySQL in production), JWT auth, Zod validation.
- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Recharts.
- **Monorepo** — npm workspaces (`server/`, `client/`).

## Features

- **Auth & roles** — JWT login/registration; `ADMIN` / `MANAGER` / `STAFF` roles gate
  sensitive actions (deleting products, refunds, staff management).
- **Inventory** — SKU-based products across categories (livestock, plants, equipment,
  food, chemicals, decor, supplies). Livestock/plant items carry aquarium-specific data:
  species, scientific name, water type, care level, temperament, tank size, temperature
  and pH ranges, and health status (healthy / quarantine / sick / deceased). Every
  quantity change is logged as a `StockMovement` for a full audit trail. Low-stock alerts
  based on a per-product reorder level.
- **Point of Sale** — Tap-to-add product grid, live cart, discounts, configurable tax
  rate, multiple payment methods, walk-in or registered customers, printable receipt
  modal. Checkout atomically decrements stock and awards loyalty points.
- **Sales history & refunds** — Searchable transaction log with receipt detail and
  one-click refunds that restock items.
- **Customers (CRM)** — Contact info, notes, loyalty points, full purchase history.
- **Suppliers & Purchase Orders** — Draft → Ordered → Received workflow with partial
  receiving; receiving updates stock quantities and cost basis automatically.
- **Dashboard & Reports** — Today/month revenue, 30-day sales trend, low-stock panel,
  inventory value, top-selling products, inventory composition by category.
- **Staff accounts** — Admins can create staff/manager accounts and manage roles.

## Getting started

Requires Node.js 18+.

```bash
# from the repo root
npm install --workspaces

# configure the API (defaults are fine for local dev)
cp server/.env.example server/.env

# create the SQLite database and apply the schema
npm run --workspace server prisma:migrate

# seed demo data (an admin + staff login, categories, products, a sample sale)
npm run seed

# run both apps in separate terminals
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173 (proxies /api to the server)
```

Demo accounts (after seeding):

| Role  | Email                  | Password  |
| ----- | ----------------------- | --------- |
| Admin | admin@aquashop.test     | admin123  |
| Staff | staff@aquashop.test     | staff123  |

## Project layout

```
server/
  prisma/schema.prisma   # data model (products, sales, customers, suppliers, POs...)
  src/routes/            # REST API — auth, products, categories, suppliers,
                          # customers, sales, purchase-orders, dashboard, users
  src/middleware/auth.ts # JWT verification + role guards
  src/scripts/seed.ts    # demo data
client/
  src/pages/             # Dashboard, POS, Inventory, Sales History, Customers,
                          # Suppliers, Purchase Orders, Reports, Staff Accounts
  src/components/        # Layout/sidebar, Modal, Badge, StatCard
  src/lib/                # API client, auth context, formatting helpers
```

## Production notes

- Set a strong `JWT_SECRET` and point `DATABASE_URL` at a managed Postgres/MySQL
  instance for anything beyond local/demo use (Prisma supports both — just change the
  `datasource` provider and re-run migrations).
- Build the client with `npm run build:client` and the server with
  `npm run build:server`; serve the compiled server with `node server/dist/index.js`.
