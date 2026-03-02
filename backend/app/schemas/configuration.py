from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from app.models.configuration import FeatureFlags, Theme


class TenantConfigUpdate(BaseModel):
    theme: Optional[Theme] = None
    feature_flags: Optional[FeatureFlags] = None
    custom_css: Optional[str] = None
    custom_scripts: Optional[List[str]] = None
    seo: Optional[Dict[str, Any]] = None
    social_links: Optional[Dict[str, str]] = None


class TenantConfigResponse(BaseModel):
    id: str
    tenant_id: str
    theme: Theme
    feature_flags: FeatureFlags
    custom_css: Optional[str] = None
    custom_scripts: List[str]
    seo: Dict[str, Any]
    social_links: Dict[str, str]
