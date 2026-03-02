from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_database
from app.core.security import get_current_user
from app.models.order import ShippingAddress
from app.schemas.order import OrderResponse
from app.services.payment_service import PaymentService
from app.utils.exceptions import require_tenant

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


class CheckoutRequest(BaseModel):
    shipping_address: ShippingAddress
    payment_method: str = "mock"
    notes: Optional[str] = None


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def checkout(
    data: CheckoutRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = PaymentService(db)
    return await service.checkout(
        tenant_id=tenant_id,
        user_id=current_user["id"],
        shipping_address=data.shipping_address,
        payment_method=data.payment_method,
        notes=data.notes,
    )
