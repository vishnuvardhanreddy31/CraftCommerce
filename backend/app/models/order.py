from __future__ import annotations

from enum import Enum
from typing import Annotated, List, Optional

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

PyObjectId = Annotated[str, BeforeValidator(str)]


class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"
    refunded = "refunded"


class PaymentStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class ShippingAddress(BaseModel):
    full_name: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str
    phone: Optional[str] = None


class OrderItem(BaseModel):
    product_id: str
    name: str
    sku: Optional[str] = None
    quantity: int = Field(gt=0)
    unit_price: float
    total_price: float
    image_url: Optional[str] = None


class Order(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    tenant_id: str
    user_id: str
    order_number: str
    items: List[OrderItem]
    subtotal: float
    tax_amount: float = 0.0
    shipping_amount: float = 0.0
    total: float
    status: OrderStatus = OrderStatus.pending
    payment_status: PaymentStatus = PaymentStatus.pending
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    shipping_address: ShippingAddress
    notes: Optional[str] = None
