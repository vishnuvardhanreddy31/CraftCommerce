from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=500)
    description: str = ""
    price: float = Field(gt=0)
    compare_at_price: Optional[float] = Field(default=None, gt=0)
    images: List[str] = Field(default_factory=list)
    category_id: Optional[str] = None
    sku: Optional[str] = None
    stock: int = Field(default=0, ge=0)
    track_inventory: bool = True
    is_active: bool = True
    tags: List[str] = Field(default_factory=list)
    weight: Optional[float] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=500)
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    compare_at_price: Optional[float] = Field(default=None, gt=0)
    images: Optional[List[str]] = None
    category_id: Optional[str] = None
    sku: Optional[str] = None
    stock: Optional[int] = Field(default=None, ge=0)
    track_inventory: Optional[bool] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None
    weight: Optional[float] = None
    attributes: Optional[Dict[str, Any]] = None


class ProductResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: str
    price: float
    compare_at_price: Optional[float] = None
    images: List[str]
    category_id: Optional[str] = None
    sku: Optional[str] = None
    stock: int
    track_inventory: bool
    is_active: bool
    tags: List[str]
    weight: Optional[float] = None
    attributes: Dict[str, Any]


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
