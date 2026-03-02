from __future__ import annotations

from typing import Annotated, Any, Dict, Optional

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

PyObjectId = Annotated[str, BeforeValidator(str)]


class TaxConfig(BaseModel):
    enabled: bool = False
    rate: float = 0.0  # percentage, e.g. 8.5 for 8.5%
    inclusive: bool = False  # tax included in price or added on top


class Tenant(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    slug: str  # unique identifier, used as subdomain
    store_name: str
    owner_email: str
    logo: Optional[str] = None
    currency: str = "USD"
    timezone: str = "UTC"
    tax_config: TaxConfig = Field(default_factory=TaxConfig)
    is_active: bool = True
    theme_config: Dict[str, Any] = Field(default_factory=dict)
