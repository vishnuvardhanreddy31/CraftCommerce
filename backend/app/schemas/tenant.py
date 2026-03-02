from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.tenant import TaxConfig


class TenantCreate(BaseModel):
    slug: str = Field(min_length=3, max_length=63, pattern=r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$")
    store_name: str = Field(min_length=2, max_length=200)
    owner_email: EmailStr
    currency: str = "USD"
    timezone: str = "UTC"


class TenantUpdate(BaseModel):
    store_name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    logo: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    tax_config: Optional[TaxConfig] = None
    theme_config: Optional[Dict[str, Any]] = None


class TenantResponse(BaseModel):
    id: str
    slug: str
    store_name: str
    owner_email: str
    logo: Optional[str] = None
    currency: str
    timezone: str
    tax_config: TaxConfig
    is_active: bool
    theme_config: Dict[str, Any]
