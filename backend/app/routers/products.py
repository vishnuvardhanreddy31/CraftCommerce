from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import get_current_user, require_role
from app.schemas.product import ProductCreate, ProductListResponse, ProductResponse, ProductUpdate
from app.services.product_service import ProductService
from app.utils.exceptions import require_tenant

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/", response_model=ProductListResponse)
async def list_products(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    category_id: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    sort_by: str = Query(default="name"),
    sort_order: int = Query(default=1, description="Sort direction: 1 for ascending, -1 for descending"),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    if sort_order not in (1, -1):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="sort_order must be 1 or -1")
    service = ProductService(db)
    return await service.list_products(
        tenant_id=tenant_id,
        page=page,
        page_size=page_size,
        category_id=category_id,
        search=search,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = ProductService(db)
    return await service.get_product(tenant_id, product_id)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    request: Request,
    current_user: dict = Depends(require_role("admin", "vendor")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = ProductService(db)
    return await service.create_product(tenant_id, data)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    request: Request,
    current_user: dict = Depends(require_role("admin", "vendor")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = ProductService(db)
    return await service.update_product(tenant_id, product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    request: Request,
    current_user: dict = Depends(require_role("admin", "vendor")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = ProductService(db)
    await service.delete_product(tenant_id, product_id)
