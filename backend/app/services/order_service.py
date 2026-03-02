from __future__ import annotations

import math
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.order import OrderStatus
from app.schemas.order import OrderListResponse, OrderResponse
from app.utils.helpers import doc_to_response


class OrderService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db

    async def list_orders(
        self,
        tenant_id: str,
        user_id: Optional[str] = None,
        order_status: Optional[OrderStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> OrderListResponse:
        query = {"tenant_id": tenant_id}
        if user_id:
            query["user_id"] = user_id
        if order_status:
            query["status"] = order_status.value

        total = await self.db.orders.count_documents(query)
        skip = (page - 1) * page_size
        cursor = self.db.orders.find(query).sort("_id", -1).skip(skip).limit(page_size)
        docs = await cursor.to_list(length=page_size)

        return OrderListResponse(
            items=[OrderResponse(**doc_to_response(d)) for d in docs],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        )

    async def get_order(self, tenant_id: str, order_id: str, user_id: Optional[str] = None) -> OrderResponse:
        try:
            oid = ObjectId(order_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        query = {"_id": oid, "tenant_id": tenant_id}
        if user_id:
            query["user_id"] = user_id

        doc = await self.db.orders.find_one(query)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return OrderResponse(**doc_to_response(doc))

    async def update_order_status(self, tenant_id: str, order_id: str, new_status: OrderStatus) -> OrderResponse:
        try:
            oid = ObjectId(order_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        result = await self.db.orders.find_one_and_update(
            {"_id": oid, "tenant_id": tenant_id},
            {"$set": {"status": new_status.value}},
            return_document=True,
        )
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return OrderResponse(**doc_to_response(result))
