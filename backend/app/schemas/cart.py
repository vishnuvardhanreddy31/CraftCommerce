from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.cart import CartItem


class AddCartItem(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class UpdateCartItem(BaseModel):
    quantity: int = Field(gt=0)


class CartResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: str
    items: List[CartItem]
    subtotal: float
    item_count: int
