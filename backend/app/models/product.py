from __future__ import annotations

from typing import Annotated, List, Optional

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

PyObjectId = Annotated[str, BeforeValidator(str)]


class Product(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    tenant_id: str
    name: str
    description: str = ""
    price: float = Field(gt=0)
    compare_at_price: Optional[float] = None
    images: List[str] = Field(default_factory=list)
    category_id: Optional[str] = None
    sku: Optional[str] = None
    stock: int = 0
    track_inventory: bool = True
    is_active: bool = True
    tags: List[str] = Field(default_factory=list)
    weight: Optional[float] = None  # grams
    attributes: dict = Field(default_factory=dict)  # e.g. {"color": "red", "size": "M"}
