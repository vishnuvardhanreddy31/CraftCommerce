from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel

from app.models.order import OrderItem, OrderStatus, PaymentStatus, ShippingAddress


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: str
    order_number: str
    items: List[OrderItem]
    subtotal: float
    tax_amount: float
    shipping_amount: float
    total: float
    status: OrderStatus
    payment_status: PaymentStatus
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    shipping_address: ShippingAddress
    notes: Optional[str] = None


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
