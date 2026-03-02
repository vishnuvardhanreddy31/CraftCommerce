from __future__ import annotations

from typing import Annotated, Any, Dict, List, Optional

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

PyObjectId = Annotated[str, BeforeValidator(str)]


class ThemeColors(BaseModel):
    primary: str = "#6366f1"
    secondary: str = "#8b5cf6"
    accent: str = "#f59e0b"
    background: str = "#ffffff"
    text: str = "#111827"
    muted: str = "#6b7280"


class ThemeFonts(BaseModel):
    heading: str = "Inter"
    body: str = "Inter"


class Theme(BaseModel):
    colors: ThemeColors = Field(default_factory=ThemeColors)
    fonts: ThemeFonts = Field(default_factory=ThemeFonts)
    border_radius: str = "0.5rem"
    dark_mode_enabled: bool = False


class FeatureFlags(BaseModel):
    reviews_enabled: bool = True
    wishlist_enabled: bool = True
    coupons_enabled: bool = False
    multi_currency: bool = False
    live_chat: bool = False
    analytics: bool = True


class TenantConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    tenant_id: str
    theme: Theme = Field(default_factory=Theme)
    feature_flags: FeatureFlags = Field(default_factory=FeatureFlags)
    custom_css: Optional[str] = None
    custom_scripts: List[str] = Field(default_factory=list)
    seo: Dict[str, Any] = Field(default_factory=dict)
    social_links: Dict[str, str] = Field(default_factory=dict)
