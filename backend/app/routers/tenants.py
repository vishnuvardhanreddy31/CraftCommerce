from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import require_role
from app.models.configuration import TenantConfig
from app.schemas.configuration import TenantConfigResponse
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate
from app.services.tenant_service import TenantService
from app.utils.helpers import doc_to_response

router = APIRouter(prefix="/api/tenants", tags=["tenants"])


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    data: TenantCreate,
    _current_user: dict = Depends(require_role("admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = TenantService(db)
    return await service.create_tenant(data)


@router.get("", response_model=list[TenantResponse])
async def list_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    _current_user: dict = Depends(require_role("admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = TenantService(db)
    return await service.list_tenants(skip=skip, limit=limit)


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = TenantService(db)
    return await service.get_tenant(tenant_id)


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    data: TenantUpdate,
    _current_user: dict = Depends(require_role("admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = TenantService(db)
    return await service.update_tenant(tenant_id, data)


@router.delete("/{tenant_id}", response_model=TenantResponse)
async def delete_tenant(
    tenant_id: str,
    _current_user: dict = Depends(require_role("admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = TenantService(db)
    return await service.deactivate_tenant(tenant_id)


@router.get("/{tenant_id}/config", response_model=TenantConfigResponse)
async def get_tenant_config(
    tenant_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = TenantService(db)
    config = await service.get_config(tenant_id)

    if isinstance(config, TenantConfig):
        # Default config returned
        return TenantConfigResponse(
            id="",
            **config.model_dump(exclude={"id"}),
        )

    return TenantConfigResponse(**doc_to_response(config))
