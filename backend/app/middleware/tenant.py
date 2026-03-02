from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class TenantMiddleware(BaseHTTPMiddleware):
    """Resolve tenant_id from the X-Tenant-ID header or from the Host subdomain.

    Priority:
    1. ``X-Tenant-ID`` request header
    2. First subdomain of the ``Host`` header (e.g. ``acme.craftcommerce.io`` → ``acme``)
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        tenant_id: str | None = request.headers.get("X-Tenant-ID")

        if not tenant_id:
            host = request.headers.get("host", "")
            # Strip port if present
            hostname = host.split(":")[0]
            parts = hostname.split(".")
            # Only treat as subdomain when there are at least 3 parts (sub.domain.tld)
            if len(parts) >= 3 and parts[0] not in ("www", "api", ""):
                tenant_id = parts[0]

        request.state.tenant_id = tenant_id or ""
        return await call_next(request)
