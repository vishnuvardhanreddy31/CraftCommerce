from __future__ import annotations

from typing import Any, Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.constants import DEFAULT_TENANT_LIST_LIMIT
from app.models.configuration import TenantConfig
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate
from app.utils.helpers import doc_to_response


class TenantService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db

    async def create_tenant(self, data: TenantCreate) -> TenantResponse:
        existing = await self.db.tenants.find_one({"slug": data.slug})
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tenant slug already taken")

        tenant_doc = data.model_dump()
        tenant_doc["is_active"] = True
        tenant_doc["logo"] = None
        tenant_doc["theme_config"] = {}
        tenant_doc["tax_config"] = {"enabled": False, "rate": 0.0, "inclusive": False}

        result = await self.db.tenants.insert_one(tenant_doc)
        tenant_doc["_id"] = result.inserted_id

        # Create default config for the tenant
        config_doc = TenantConfig(tenant_id=str(result.inserted_id)).model_dump(exclude={"id"})
        config_doc["tenant_id"] = str(result.inserted_id)
        await self.db.tenant_configs.insert_one(config_doc)

        return TenantResponse(**doc_to_response(tenant_doc))

    async def list_tenants(
        self,
        skip: int = 0,
        limit: int = DEFAULT_TENANT_LIST_LIMIT,
        after_id: Optional[str] = None,
    ) -> list[TenantResponse]:
        """Return tenants with basic skip/limit or cursor pagination."""
        query: dict[str, Any] = {}
        sort = [("store_name", 1)]
        if after_id:
            from bson import ObjectId
            from bson.errors import InvalidId

            try:
                oid = ObjectId(after_id)
            except (InvalidId, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid after_id: must be a valid ObjectId format",
                )
            query["_id"] = {"$gt": oid}
            sort = [("_id", 1)]
            skip = 0

        cursor = self.db.tenants.find(query).sort(sort).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [TenantResponse(**doc_to_response(doc)) for doc in docs]

    async def get_tenant(self, tenant_id: str) -> TenantResponse:
        from bson import ObjectId
        from bson.errors import InvalidId

        try:
            oid = ObjectId(tenant_id)
        except (InvalidId, TypeError):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

        tenant = await self.db.tenants.find_one({"_id": oid})
        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
        return TenantResponse(**doc_to_response(tenant))

    async def get_tenant_by_slug(self, slug: str) -> Optional[dict]:
        return await self.db.tenants.find_one({"slug": slug})

    async def update_tenant(self, tenant_id: str, data: TenantUpdate) -> TenantResponse:
        from bson import ObjectId
        from bson.errors import InvalidId

        try:
            oid = ObjectId(tenant_id)
        except (InvalidId, TypeError):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if "tax_config" in updates:
            updates["tax_config"] = updates["tax_config"].model_dump() if hasattr(updates["tax_config"], "model_dump") else updates["tax_config"]

        result = await self.db.tenants.find_one_and_update(
            {"_id": oid},
            {"$set": updates},
            return_document=True,
        )
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
        return TenantResponse(**doc_to_response(result))

    async def deactivate_tenant(self, tenant_id: str) -> TenantResponse:
        """Soft-deactivate a tenant by setting ``is_active`` to False."""
        from bson import ObjectId
        from bson.errors import InvalidId

        try:
            oid = ObjectId(tenant_id)
        except (InvalidId, TypeError):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

        result = await self.db.tenants.find_one_and_update(
            {"_id": oid},
            {"$set": {"is_active": False}},
            return_document=True,
        )
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
        return TenantResponse(**doc_to_response(result))

    async def get_config(self, tenant_id: str):
        from app.schemas.configuration import TenantConfigResponse

        config = await self.db.tenant_configs.find_one({"tenant_id": tenant_id})
        if not config:
            # Return defaults
            default = TenantConfig(tenant_id=tenant_id)
            return default
        return config
