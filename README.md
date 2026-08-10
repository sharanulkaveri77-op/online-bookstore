# BookNook — Online Bookstore

A full-stack online bookstore web application built as a college capstone project.

**🔗 Live demo:** https://online-bookstore-blond.vercel.app

- **Frontend:** React 18 (hooks, functional components) + Tailwind CSS 4 + React Router 7
- **Backend:** Node.js + Express (REST API)
- **Database:** SQLite via `better-sqlite3` — plain SQL (no ORM), schema written portably for MySQL/PostgreSQL
- **Auth:** JWT (7-day expiry) + bcrypt password hashing, role-based access (customer / admin)
- **Extras:** PDF invoice generation (`pdfkit`), low-stock notification stub (console-logged "emails"), fuzzy typo-tolerant search, co-purchase recommendations

---

## Features

### Customer
- Register / login with JWT auth
- Browse books with filters: category, author, price range, in-stock only
- Search by title / author / ISBN — with a **fuzzy (typo-tolerant) fallback** using Levenshtein distance
- Book detail page: description, price, stock, average rating, verified reviews, sample-PDF preview link
- **"Customers who bought this also bought"** recommendations (SQL JOIN + GROUP BY over real order data)
- Cart: add / update quantity / remove
- Wishlist: add / remove / "move to cart"
- Checkout: apply coupon code → order summary → place order (mock payment)
- Order history with status tracking (pending / shipped / delivered / cancelled)
- **PDF invoice** downloadable for every order
- Verified-purchase reviews (only books you actually bought)

### Admin
- Role-gated routes on both frontend and backend
- CRUD for books (cover image URL, stock quantity), categories, authors, publishers
- Coupon management: create, activate/deactivate, set discount %, expiry dates
- View all orders + update order status
- Dashboard: total revenue, total orders, customers, top 5 best-selling books, **low-stock alerts (< 5 units)**, notification feed, recent orders

---

## Project structure

```
online-bookstore/
├── package.json          # root scripts: install-all, seed, dev
├── README.md
├── backend/
│   ├── server.js         # Express app entry
│   ├── .env              # PORT, JWT_SECRET, DB_PATH (never commit)
│   ├── db/
│   │   ├── database.js   # SQLite connection (plain SQL)
│   │   ├── schema.sql    # full relational schema (10 tables, FKs, indexes)
│   │   └── seed.js       # demo data: 36 books, 12 authors, 8 publishers,
│   │                     # 6 categories, 3 users, coupons, orders, reviews
│   ├── middleware/
│   │   ├── auth.js       # JWT sign/verify, requireRole
│   │   └── validate.js   # declarative body validation
│   ├── routes/           # auth, books, catalog, cart, wishlist, orders, admin
│   └── utils/
│       ├── invoice.js    # pdfkit invoice generator
│       ├── levenshtein.js# fuzzy search engine
│       └── notifier.js   # low-stock alert stub (console)
└── frontend/
    └── src/
        ├── api/client.js # fetch wrapper (JWT header, error handling, PDF download)
        ├── context/      # AuthContext, CartContext
        ├── components/   # Navbar, Footer, BookCard, RatingStars, etc.
        └── pages/        # storefront + admin pages (all responsive)
```

---

## Setup (3 commands)

Requires **Node.js 18+** (tested on Node 24).

```bash
# 1. Install all dependencies (root + backend + frontend)
npm run install-all

# 2. Create the SQLite database with demo data
npm run seed

# 3. Start backend (:5000) and frontend (:5173) together
npm run dev
```

Then open **http://localhost:5173**.

To run each part separately:

```bash
npm run dev:backend    # API only on http://localhost:5000
npm run dev:frontend   # UI only on http://localhost:5173 (proxies /api)
```

> The frontend dev server proxies `/api/*` to the backend, so no CORS setup is needed in development.

---

## Demo accounts (seeded)

| Role     | Email                 | Password      |
| -------- | --------------------- | ------------- |
| Admin    | `admin@bookstore.com` | `Admin@123`   |
| Customer | `john@example.com`    | `Password@123` |
| Customer | `jane@example.com`    | `Password@123` |

Coupons: **WELCOME10** (10% off), **SAVE25** (25% off). `HOLIDAY15` is inactive and `EXPIRED20` is expired — both show validation errors on purpose.

John already has a cart, a wishlist, orders and verified reviews, so every page has data on first load.

---

## Demo walkthrough (5 minutes)

1. **Browse** — on the home page, click "Browse books", then try the search box:
   - type `lighhouse` (a typo) and notice the fuzzy-search banner and correct match.
2. **Filters** — filter by *Technology*, *in-stock only*, price `₹800–₹1,500`.
3. **Book detail** — open *The Last Lighthouse Keeper*: see the rating, stock badge, verified reviews, and the **"Customers who bought this also bought"** row driven by real co-purchases in the orders table.
4. **Cart + coupon** — log in as `john@example.com` (cart is pre-filled). Go to checkout, apply `WELCOME10`, watch the discount, place the order.
5. **Invoice** — open the order from "My Orders" and click *Download invoice (PDF)*.
6. **Review** — on a book you just purchased, leave a rating + review; it is marked **✓ Verified purchase**.
7. **Admin** — log out, log in as `admin@bookstore.com`. On the dashboard see revenue, top 5 sellers, the low-stock panel (7 books below 5 units) and the notification feed. Then manage books/coupons/orders from the sidebar.

---

## API overview (backend)

| Method | Endpoint                          | Access    | Purpose                                  |
| ------ | --------------------------------- | --------- | ---------------------------------------- |
| POST   | `/api/auth/register`              | public    | Create customer account                  |
| POST   | `/api/auth/login`                 | public    | JWT login                                |
| GET    | `/api/auth/me`                    | auth      | Current user                             |
| GET    | `/api/books`                      | public    | List/search/filter/sort books            |
| GET    | `/api/books/:id`                  | public    | Book detail + recommendations            |
| GET    | `/api/books/:id/reviews`          | public    | Reviews for a book                       |
| POST   | `/api/books/:id/reviews`          | auth      | Review (verified-purchase only)          |
| GET    | `/api/catalog/*`                  | public    | Categories / authors / publishers        |
| GET/POST/PUT/DELETE | `/api/cart*`             | auth      | Cart management                          |
| GET/POST/DELETE | `/api/wishlist*`           | auth      | Wishlist + move-to-cart                  |
| POST   | `/api/orders`                     | auth      | Checkout (coupon + stock + low-stock alert) |
| GET    | `/api/orders` / `:id` / `:id/invoice` | auth | Order history, detail, PDF invoice    |
| POST   | `/api/orders/validate-coupon`     | auth      | Coupon preview at checkout               |
| GET    | `/api/admin/stats`                | admin     | Dashboard metrics                        |
| CRUD   | `/api/admin/books`, `/categories`, `/authors`, `/publishers`, `/coupons` | admin | Catalog management |
| GET/PUT| `/api/admin/orders` / `:id/status`| admin     | Order management                         |

Error responses are JSON with meaningful status codes: `400` validation, `401` unauthenticated, `403` wrong role, `404` missing, `409` conflicts.

---

## Standout features (implementation notes)

1. **Recommendation engine** — a single SQL query finds books that co-occur with the current book across all orders, ranks them by co-occurrence frequency:
   ```sql
   SELECT oi2.book_id, COUNT(*) AS freq
   FROM order_items oi1
   JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi2.book_id != oi1.book_id
   WHERE oi1.book_id = ?
   GROUP BY oi2.book_id
   ORDER BY freq DESC LIMIT 6;
   ```
2. **Fuzzy search** — `LIKE '%…%'` search first; if fewer than 5 results, a sliding-window Levenshtein fallback scans titles/authors and appends near-matches (`backend/utils/levenshtein.js`).
3. **PDF invoices** — `pdfkit` generates an itemised A4 invoice (line items, coupon discount, totals) streamed as `application/pdf`.
4. **Low-stock alerts** — checkout decrements stock in a SQL transaction and raises an alert when a book drops below 5 units; alerts are logged (email stub) and surfaced on the admin dashboard.

---

## Database (10 tables)

`users`, `authors`, `publishers`, `categories`, `books`, `cart_items`, `wishlist_items`, `orders`, `order_items`, `reviews`, `coupons` — with foreign keys, CHECK constraints (ratings 1–5, positive prices, stock ≥ 0) and indexes on join columns. Schema lives in `backend/db/schema.sql`; plain SQL is used everywhere so every query is readable/explainable in a viva.

---

## Notes

- `backend/.env` holds the JWT secret — copy `.env.example` and change it for any non-demo deployment.
- `npm run seed` resets the database to the demo state whenever needed.
- Re-running seed is safe: it drops and recreates all tables.
