from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import get_current_user, require_role
from app.models.order import OrderStatus
from app.schemas.order import OrderListResponse, OrderResponse, OrderStatusUpdate
from app.services.order_service import OrderService
from app.utils.exceptions import require_tenant

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("/", response_model=OrderListResponse)
async def list_orders(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    order_status: Optional[OrderStatus] = Query(default=None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = OrderService(db)

    # Admins see all orders; customers see only their own
    user_id = None if current_user["role"] == "admin" else current_user["id"]
    return await service.list_orders(
        tenant_id=tenant_id,
        user_id=user_id,
        order_status=order_status,
        page=page,
        page_size=page_size,
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = OrderService(db)
    user_id = None if current_user["role"] == "admin" else current_user["id"]
    return await service.get_order(tenant_id, order_id, user_id=user_id)


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    request: Request,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = OrderService(db)
    return await service.update_order_status(tenant_id, order_id, data.status)
