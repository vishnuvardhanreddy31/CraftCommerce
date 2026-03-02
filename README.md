# CraftCommerce

A production-ready **multi-tenant SaaS eCommerce platform** built with FastAPI, MongoDB, React + Vite, and Docker.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Multi-Tenancy](#multi-tenancy)
- [Seed Data](#seed-data)
- [Demo Credentials](#demo-credentials)

---

## Features

- **Multi-tenant** architecture — each store is fully isolated by `tenant_id`
- **Tenant onboarding** — store name, logo, theme config (colors, fonts), currency, tax config
- **Per-tenant admin dashboard** — Products, Categories, Orders, Store Settings
- **Public storefront** — product listing (pagination, filtering, sorting), product detail, cart, checkout, order history
- **Role-based access** — Admin, Vendor, Customer
- **Mock payment** integration (extensible for Stripe, PayPal, etc.)
- **JWT authentication** with access + refresh tokens
- **Async MongoDB** with Motor — indexed collections for performance
- **Dynamic theming** — CSS variables updated at runtime from tenant config
- **Mobile-first** responsive UI with a soft neutral design system

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI 0.111, Python 3.11+, Pydantic v2 |
| **Database** | MongoDB 7.0 (Motor async driver) |
| **Frontend** | React 18, Vite 5, React Router v6, Axios |
| **Auth** | JWT (python-jose, passlib/bcrypt) |
| **Deployment** | Docker, docker-compose |

---

## Project Structure

```
CraftCommerce/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entrypoint
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings
│   │   │   ├── database.py         # Motor async client + index creation
│   │   │   └── security.py         # JWT, password hashing, auth dependencies
│   │   ├── middleware/
│   │   │   └── tenant.py           # Tenant resolution middleware
│   │   ├── models/                 # Pydantic v2 domain models
│   │   ├── schemas/                # Request / response schemas
│   │   ├── routers/                # REST API endpoints
│   │   ├── services/               # Business logic (async MongoDB ops)
│   │   └── utils/                  # Helpers, exception utilities
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.js           # Axios instance with interceptors
│   │   ├── context/                # Auth, Cart, Theme React contexts
│   │   ├── components/             # Reusable UI + layout components
│   │   ├── pages/                  # Route-level pages
│   │   └── hooks/                  # useAuth, useCart
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.yml
├── seed.py                         # Demo data seed script
└── README.md
```

---

## Quick Start (Docker)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) v2 (bundled with Docker Desktop)

### 1. Clone and configure

```bash
git clone https://github.com/vishnuvardhanreddy31/CraftCommerce.git
cd CraftCommerce
cp .env.example .env
# Edit .env and set a strong SECRET_KEY
```

### 2. Start all services

```bash
docker compose up --build
```

Services will be available at:

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |
| **MongoDB** | mongodb://localhost:27017 |

### 3. Seed demo data (optional)

```bash
# In a separate terminal, after services are running:
docker compose exec backend python -c "
import asyncio, sys
sys.path.insert(0, '.')
" || true

# Or run the seed script directly against the running MongoDB:
pip install motor passlib
MONGODB_URL=mongodb://localhost:27017 python seed.py
```

---

## Local Development

### Backend

```bash
cd backend

# Create and activate virtual environment
python3.11 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and edit env
cp .env.example .env

# Start MongoDB (requires Docker)
docker run -d -p 27017:27017 --name mongo mongo:7.0

# Seed demo data
cd ..
MONGODB_URL=mongodb://localhost:27017 python seed.py
cd backend

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy and edit env
cp .env.example .env

# Start dev server (proxies /api to localhost:8000)
npm run dev
```

The frontend will be available at http://localhost:5173.

---

## Environment Variables

### Root `.env` (docker-compose)

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `changeme-...` | **Change this in production!** JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |

### `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URL` | `mongodb://mongodb:27017` | MongoDB connection string |
| `DATABASE_NAME` | `craftcommerce` | MongoDB database name |
| `SECRET_KEY` | — | JWT signing secret (required) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | — |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | — |
| `CORS_ORIGINS` | `["http://localhost:3000","http://localhost:5173"]` | Allowed CORS origins |

### `frontend/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL |
| `VITE_TENANT_ID` | `default` | Default tenant ID |

---

## API Reference

All endpoints are documented interactively at **http://localhost:8000/docs** (Swagger UI).

### Multi-tenancy header

Every API request must include:

```
X-Tenant-ID: <tenant_id>
```

Or resolve via subdomain (`<slug>.craftcommerce.com`).

### Endpoints summary

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register user | — |
| `POST` | `/api/auth/login` | Login (returns JWT) | — |
| `POST` | `/api/auth/refresh` | Refresh token | — |
| `GET` | `/api/auth/me` | Get current user | ✓ |
| `POST` | `/api/tenants/` | Create tenant (onboarding) | — |
| `GET` | `/api/tenants/{id}` | Get tenant info | — |
| `PUT` | `/api/tenants/{id}` | Update tenant settings | Admin |
| `GET` | `/api/tenants/{id}/config` | Get theme config | — |
| `GET` | `/api/products/` | List products (paginated) | — |
| `GET` | `/api/products/{id}` | Product detail | — |
| `POST` | `/api/products/` | Create product | Admin/Vendor |
| `PUT` | `/api/products/{id}` | Update product | Admin/Vendor |
| `DELETE` | `/api/products/{id}` | Delete product | Admin |
| `GET` | `/api/categories/` | List categories | — |
| `POST` | `/api/categories/` | Create category | Admin |
| `PUT` | `/api/categories/{id}` | Update category | Admin |
| `DELETE` | `/api/categories/{id}` | Delete category | Admin |
| `GET` | `/api/orders/` | List orders | ✓ |
| `GET` | `/api/orders/{id}` | Order detail | ✓ |
| `PUT` | `/api/orders/{id}/status` | Update order status | Admin |
| `GET` | `/api/cart/` | Get cart | ✓ |
| `POST` | `/api/cart/items` | Add item to cart | ✓ |
| `PUT` | `/api/cart/items/{product_id}` | Update quantity | ✓ |
| `DELETE` | `/api/cart/items/{product_id}` | Remove item | ✓ |
| `DELETE` | `/api/cart/` | Clear cart | ✓ |
| `POST` | `/api/checkout/` | Place order from cart | ✓ |
| `GET` | `/api/admin/dashboard` | Admin stats | Admin |
| `GET` | `/health` | Health check | — |

---

## Multi-Tenancy

CraftCommerce uses **header-based tenant resolution**:

1. The client sends `X-Tenant-ID: <tenant_id>` with every request.
2. The `TenantMiddleware` reads this header and attaches the `tenant_id` to `request.state.tenant_id`.
3. Every database query in the services layer is automatically scoped to that `tenant_id`.
4. Subdomain resolution (`artisan-crafts.craftcommerce.com`) is also supported — the middleware extracts the slug from the `Host` header and resolves it to a tenant ID.

### Tenant isolation

- **Users** — `email` is unique per tenant (same email can register on different stores)
- **Products, Categories, Orders, Carts** — all have a `tenant_id` field with compound indexes
- **Theme** — each tenant has independent `theme_config` (colors, fonts, border radius)
- **Tax & Currency** — per-tenant configuration

---

## Seed Data

The `seed.py` script in the project root creates:

- 2 demo tenants
- 5 demo users (admin, vendor, customer per tenant)
- 5 categories (3 for tenant 1, 2 for tenant 2)
- 10 products
- 2 sample orders

```bash
# Run against local MongoDB
MONGODB_URL=mongodb://localhost:27017 python seed.py

# Run against Docker MongoDB
MONGODB_URL=mongodb://localhost:27017 python seed.py
```

> ⚠️ The seed script **drops** existing collections before inserting. Do not run it against production data.

---

## Demo Credentials

### Tenant 1 — Artisan Crafts Co.
**Tenant ID:** `64a0000000000000000000a1`

| Role | Email | Password |
|---|---|---|
| Admin | admin@artisancrafts.com | Admin@1234 |
| Vendor | vendor@artisancrafts.com | Vendor@1234 |
| Customer | customer@example.com | Customer@1234 |

### Tenant 2 — Home Décor Studio
**Tenant ID:** `64a0000000000000000000a2`

| Role | Email | Password |
|---|---|---|
| Admin | admin@homedecorstudio.com | Admin@1234 |
| Customer | customer2@example.com | Customer@1234 |

---

## Production Deployment

1. **Change the `SECRET_KEY`** in `.env` to a long random string.
2. Set `MONGODB_URL` to your managed MongoDB cluster (e.g., MongoDB Atlas).
3. Set `CORS_ORIGINS` to your actual frontend domain.
4. Use a reverse proxy (nginx, Caddy, Traefik) in front of the backend.
5. Enable HTTPS.

```bash
# Generate a strong secret key
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## License

MIT
