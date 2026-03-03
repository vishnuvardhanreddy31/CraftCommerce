from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

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

# ── Static frontend (optional) ───────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index() -> FileResponse:
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        if full_path.startswith("api") or full_path in {"docs", "redoc", "openapi.json", "health"}:
            raise HTTPException(status_code=404)
        return FileResponse(FRONTEND_DIST / "index.html")


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"])
async def health_check() -> Dict[str, Any]:
    return {"status": "healthy", "service": "CraftCommerce API", "version": "1.0.0"}
