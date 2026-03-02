from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import close_connection, create_indexes
from app.middleware.tenant import TenantMiddleware
from app.routers import admin, auth, cart, categories, checkout, orders, products, tenants


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_indexes()
    yield
    # Shutdown
    await close_connection()


app = FastAPI(
    title="CraftCommerce API",
    description="Multi-tenant SaaS eCommerce platform API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TenantMiddleware must be added AFTER CORSMiddleware so it runs on actual requests
app.add_middleware(TenantMiddleware)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(tenants.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(orders.router)
app.include_router(cart.router)
app.include_router(checkout.router)
app.include_router(admin.router)


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"])
async def health_check() -> Dict[str, Any]:
    return {"status": "healthy", "service": "CraftCommerce API", "version": "1.0.0"}
