from __future__ import annotations

from typing import List

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.utils.helpers import doc_to_response


class CategoryService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db

    async def list_categories(self, tenant_id: str, include_inactive: bool = False) -> List[CategoryResponse]:
        query = {"tenant_id": tenant_id}
        if not include_inactive:
            query["is_active"] = True
        cursor = self.db.categories.find(query).sort("sort_order", 1)
        docs = await cursor.to_list(length=500)
        return [CategoryResponse(**doc_to_response(d)) for d in docs]

    async def get_category(self, tenant_id: str, category_id: str) -> CategoryResponse:
        try:
            oid = ObjectId(category_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

        doc = await self.db.categories.find_one({"_id": oid, "tenant_id": tenant_id})
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return CategoryResponse(**doc_to_response(doc))

    async def create_category(self, tenant_id: str, data: CategoryCreate) -> CategoryResponse:
        existing = await self.db.categories.find_one({"tenant_id": tenant_id, "slug": data.slug})
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category slug already exists")

        doc = data.model_dump()
        doc["tenant_id"] = tenant_id
        result = await self.db.categories.insert_one(doc)
        doc["_id"] = result.inserted_id
        return CategoryResponse(**doc_to_response(doc))

    async def update_category(self, tenant_id: str, category_id: str, data: CategoryUpdate) -> CategoryResponse:
        try:
            oid = ObjectId(category_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return await self.get_category(tenant_id, category_id)

        # Check slug uniqueness if changing slug
        if "slug" in updates:
            conflict = await self.db.categories.find_one(
                {"tenant_id": tenant_id, "slug": updates["slug"], "_id": {"$ne": oid}}
            )
            if conflict:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category slug already exists")

        result = await self.db.categories.find_one_and_update(
            {"_id": oid, "tenant_id": tenant_id},
            {"$set": updates},
            return_document=True,
        )
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return CategoryResponse(**doc_to_response(result))

    async def delete_category(self, tenant_id: str, category_id: str) -> None:
        try:
            oid = ObjectId(category_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

        result = await self.db.categories.delete_one({"_id": oid, "tenant_id": tenant_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
