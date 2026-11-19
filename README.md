# Batloung Farm Distribution Management System

Web-based system for Batloung Farm (Maseru, Lesotho) to manage suppliers, fruits, vendors, purchases, sales,
packaging-specific stock (small / medium / large) and vendor payments.
Stack: **Node.js · Express · MySQL (mysql2) · plain HTML dashboard**.

## Run it locally
```bash
npm install
cp .env.example .env        # then put your MySQL user/password in .env
npm run db:setup            # creates database, 10 tables, sample data
npm run db:migrate-locations # adds GPS coordinate columns to an existing database
npm start                   # http://localhost:3100   (dashboard)  |  http://localhost:3100/api/health
npm run test:api            # 45 automatic checks (run right after db:setup, with the server running)
```
You can also run the SQL by hand: `database/schema.sql`, `database/seed.sql`, `database/reports.sql`, `database/transaction_demo.sql`.
Use the **Locations** dashboard tab to save exact addresses and GPS coordinates for suppliers and vendors, preview satellite imagery, and open driving directions. Google Maps receives the selected coordinates when its map or directions are opened; imagery availability and freshness vary by location.
Place suggestions use Photon/OpenStreetMap, and the typed search is sent to Photon. Selected pins and saved addresses are verified against Maseru District, Lesotho; out-of-district locations are not shown on the map or accepted by the API. The included Maseru District boundary is derived from geoBoundaries' Lesotho ADM1 data, sourced from OpenStreetMap/Wambacher under ODbL 1.0 (© OpenStreetMap contributors).
The Purchase tab pre-fills unit costs from the fruit/size price list in `backend/src/utils/constants.js`; changing the box quantity recalculates the purchase total. These defaults can be edited per purchase when a supplier's cost differs.

## Project structure
```
batloung-farm/
├── frontend/                 # Original dashboard files from the original public/ folder
├── backend/                  # Original Node.js application and tests
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   └── tests/
├── database/                 # Original MySQL schema, seed, setup, migration and SQL reports
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── README.md
└── DEPLOYMENT_GUIDE.md
```

## Database (MySQL)
Required 8 tables + `selling_prices` (a different price per fruit and packaging size) + `payments`.
`stock` has one row per **fruit + packaging size** (`UNIQUE(fruit_id, packaging_size)`, `CHECK (available_quantity >= 0)`).
Constraints: PK/FK, NOT NULL, UNIQUE (supplier name/phone, vendor phone, fruit name), CHECK (positive quantity/price, no negative stock, paid <= total).

## API summary (all under `/api`)
| Area | Endpoints |
|---|---|
| Suppliers | `POST /suppliers` · `GET /suppliers` · `GET /suppliers/:id` · `PUT /suppliers/:id` · `DELETE /suppliers/:id` (409 if it has purchases) |
| Fruits | `POST /fruits` (optional `prices`) · `GET /fruits` (`?all=true` incl. inactive) · `GET /fruits/:id` · `PUT /fruits/:id` |
| Stock | `GET /stock` · `GET /stock/fruit/:fruitId` · `GET /stock/low?threshold=10` |
| Vendors | `POST /vendors` · `GET /vendors` · `GET /vendors/search?q=` · `PUT /vendors/:id` · `GET /vendors/:id/balance` · `GET /vendors/outstanding` |
| Purchases | `POST /purchases` · `GET /purchases` · `GET /purchases/:id` · `GET /purchases/unit-costs` |
| Sales | `POST /sales` · `GET /sales` · `GET /sales/:id` · `POST /sales/:id/payments` |
| Reports | `GET /reports/top-fruits` · `/revenue?from=&to=` · `/top-vendor` · `/stock-levels` |

Examples
```json
POST /api/purchases
{ "supplier_id": 2, "items": [ { "fruit_id": 1, "packaging_size": "LARGE", "quantity": 20, "unit_cost": 160 } ] }

POST /api/sales
{ "vendor_id": 1, "payment_method": "MOBILE_MONEY", "amount_paid": 300,
  "items": [ { "fruit_id": 1, "packaging_size": "LARGE", "quantity": 2 }, { "fruit_id": 4, "packaging_size": "MEDIUM", "quantity": 1 } ] }

POST /api/sales/5/payments
{ "amount": 500, "payment_method": "CASH" }
```
Totals are always calculated by the server (selling prices come from `selling_prices`), never typed in.

## Transactions (BEGIN / COMMIT / ROLLBACK)
Purchases and sales run in one transaction (`backend/src/services/`). A sale of 10 large apples with only 6 available returns
`400 "Insufficient stock ... requested 10, available 6. Sale rejected."`, and **nothing** is saved: no sale row, no details,
and other items in the same sale are rolled back. Stock is reduced with a guarded `UPDATE ... WHERE available_quantity >= ?`
so it can never go negative. See `database/transaction_demo.sql` for the same thing in plain SQL.

## Payments
Methods: `CASH`, `MOBILE_MONEY`, `CREDIT` (pay later). Status is computed: `PAID`, `PARTIALLY_PAID`, `UNPAID`.
Outstanding balance per vendor: `GET /vendors/:id/balance`, all debtors: `GET /vendors/outstanding`.

## Error handling
400 invalid input · 404 not found · 409 duplicate / blocked delete · 503 database unreachable · 500 unexpected.
If MySQL is down the server keeps running and returns a clear 503 message instead of crashing.

## Deploying (live link)
1. Push to GitHub (`.env` is git-ignored).
2. Create a MySQL database on a host such as Railway or Aiven; put its host/user/password in `.env` locally and run `npm run db:setup` once (set `DB_SSL=true` if the host requires TLS).
3. Deploy the repo on Render / Railway as a Node web service: build `npm install`, start `npm start`, and add the same variables from `.env.example` in the service settings.
