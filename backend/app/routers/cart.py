from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import get_current_user
from app.schemas.cart import AddCartItem, CartResponse, UpdateCartItem
from app.services.cart_service import CartService
from app.utils.exceptions import require_tenant

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.get("/", response_model=CartResponse)
async def get_cart(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = CartService(db)
    return await service.get_cart(tenant_id, current_user["id"])


@router.post("/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_item(
    data: AddCartItem,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = CartService(db)
    return await service.add_item(tenant_id, current_user["id"], data.product_id, data.quantity)


@router.put("/items/{product_id}", response_model=CartResponse)
async def update_item(
    product_id: str,
    data: UpdateCartItem,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = CartService(db)
    return await service.update_item(tenant_id, current_user["id"], product_id, data.quantity)


@router.delete("/items/{product_id}", response_model=CartResponse)
async def remove_item(
    product_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = CartService(db)
    return await service.remove_item(tenant_id, current_user["id"], product_id)


@router.delete("/", response_model=CartResponse)
async def clear_cart(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = CartService(db)
    return await service.clear_cart(tenant_id, current_user["id"])
