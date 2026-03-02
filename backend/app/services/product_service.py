from __future__ import annotations

import math
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.product import ProductCreate, ProductListResponse, ProductResponse, ProductUpdate
from app.utils.helpers import doc_to_response


class ProductService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db

    async def list_products(
        self,
        tenant_id: str,
        page: int = 1,
        page_size: int = 20,
        category_id: Optional[str] = None,
        search: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        is_active: Optional[bool] = True,
        sort_by: str = "name",
        sort_order: int = 1,
    ) -> ProductListResponse:
        query: Dict[str, Any] = {"tenant_id": tenant_id}

        if is_active is not None:
            query["is_active"] = is_active
        if category_id:
            query["category_id"] = category_id
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$in": [search]}},
            ]
        if min_price is not None or max_price is not None:
            price_filter: Dict[str, float] = {}
            if min_price is not None:
                price_filter["$gte"] = min_price
            if max_price is not None:
                price_filter["$lte"] = max_price
            query["price"] = price_filter

        total = await self.db.products.count_documents(query)
        skip = (page - 1) * page_size

        cursor = self.db.products.find(query).sort(sort_by, sort_order).skip(skip).limit(page_size)
        docs = await cursor.to_list(length=page_size)

        return ProductListResponse(
            items=[ProductResponse(**doc_to_response(d)) for d in docs],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        )

    async def get_product(self, tenant_id: str, product_id: str) -> ProductResponse:
        try:
            oid = ObjectId(product_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        doc = await self.db.products.find_one({"_id": oid, "tenant_id": tenant_id})
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return ProductResponse(**doc_to_response(doc))

    async def create_product(self, tenant_id: str, data: ProductCreate) -> ProductResponse:
        product_doc = data.model_dump()
        product_doc["tenant_id"] = tenant_id
        result = await self.db.products.insert_one(product_doc)
        product_doc["_id"] = result.inserted_id
        return ProductResponse(**doc_to_response(product_doc))

    async def update_product(self, tenant_id: str, product_id: str, data: ProductUpdate) -> ProductResponse:
        try:
            oid = ObjectId(product_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return await self.get_product(tenant_id, product_id)

        result = await self.db.products.find_one_and_update(
            {"_id": oid, "tenant_id": tenant_id},
            {"$set": updates},
            return_document=True,
        )
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return ProductResponse(**doc_to_response(result))

    async def delete_product(self, tenant_id: str, product_id: str) -> None:
        try:
            oid = ObjectId(product_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        result = await self.db.products.delete_one({"_id": oid, "tenant_id": tenant_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
