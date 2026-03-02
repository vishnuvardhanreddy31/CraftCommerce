from __future__ import annotations

from typing import Annotated, List, Optional

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

PyObjectId = Annotated[str, BeforeValidator(str)]


class CartItem(BaseModel):
    product_id: str
    name: str
    sku: Optional[str] = None
    quantity: int = Field(gt=0)
    unit_price: float
    image_url: Optional[str] = None


class Cart(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    tenant_id: str
    user_id: str
    items: List[CartItem] = Field(default_factory=list)

    @property
    def subtotal(self) -> float:
        return sum(item.unit_price * item.quantity for item in self.items)

    @property
    def item_count(self) -> int:
        return sum(item.quantity for item in self.items)
