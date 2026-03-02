from __future__ import annotations

from fastapi import HTTPException, Request, status


def require_tenant(request: Request) -> str:
    """Return the tenant_id from request state or raise 400."""
    tenant_id: str = getattr(request.state, "tenant_id", "")
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID is required. Provide X-Tenant-ID header or use a tenant subdomain.",
        )
    return tenant_id


class TenantNotFoundError(Exception):
    pass


class ProductNotFoundError(Exception):
    pass


class InsufficientStockError(Exception):
    pass
