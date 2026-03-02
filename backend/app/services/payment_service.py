from __future__ import annotations

import random
import string
from typing import Any, Dict, List, Tuple

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.order import OrderStatus, PaymentStatus, ShippingAddress
from app.schemas.order import OrderResponse
from app.utils.helpers import doc_to_response


def _generate_order_number() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"ORD-{suffix}"


class PaymentService:
    """Mock payment service. In production, integrate a real payment gateway."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db

    async def checkout(
        self,
        tenant_id: str,
        user_id: str,
        shipping_address: ShippingAddress,
        payment_method: str = "mock",
        notes: str | None = None,
    ) -> OrderResponse:
        cart = await self.db.carts.find_one({"tenant_id": tenant_id, "user_id": user_id})
        if not cart or not cart.get("items"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

        items = cart["items"]
        order_items: List[Dict[str, Any]] = []
        subtotal = 0.0
        # Track which products had stock atomically reserved so we can roll back on failure
        reserved: List[Tuple[ObjectId, int]] = []

        try:
            for item in items:
                try:
                    p_oid = ObjectId(item["product_id"])
                except Exception:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid product ID: {item['product_id']}",
                    )

                product = await self.db.products.find_one(
                    {"_id": p_oid, "tenant_id": tenant_id, "is_active": True}
                )
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Product '{item['name']}' is no longer available",
                    )

                quantity = item["quantity"]

                # Atomically decrement stock to prevent overselling
                if product.get("track_inventory", True):
                    updated = await self.db.products.find_one_and_update(
                        {
                            "_id": p_oid,
                            "tenant_id": tenant_id,
                            "is_active": True,
                            "stock": {"$gte": quantity},
                        },
                        {"$inc": {"stock": -quantity}},
                        return_document=True,
                    )
                    if not updated:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Insufficient stock for '{product['name']}'",
                        )
                    reserved.append((p_oid, quantity))

                unit_price = product["price"]
                total_price = unit_price * quantity
                subtotal += total_price
                order_items.append(
                    {
                        "product_id": item["product_id"],
                        "name": product["name"],
                        "sku": product.get("sku"),
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "total_price": total_price,
                        "image_url": product["images"][0] if product.get("images") else None,
                    }
                )

        except HTTPException:
            # Roll back any stock that was already reserved in this transaction
            for p_oid, qty in reserved:
                await self.db.products.update_one(
                    {"_id": p_oid, "tenant_id": tenant_id},
                    {"$inc": {"stock": qty}},
                )
            raise

        # Fetch tenant for tax config
        try:
            tenant_oid = ObjectId(tenant_id)
            tenant = await self.db.tenants.find_one({"_id": tenant_oid})
        except Exception:
            tenant = None
        tax_config = (tenant or {}).get("tax_config", {})
        tax_rate = tax_config.get("rate", 0.0) if tax_config.get("enabled") else 0.0
        tax_amount = round(subtotal * tax_rate / 100, 2)
        shipping_amount = 0.0
        total = round(subtotal + tax_amount + shipping_amount, 2)

        # Mock payment always succeeds
        payment_reference = "MOCK-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=12))

        order_doc: Dict[str, Any] = {
            "tenant_id": tenant_id,
            "user_id": user_id,
            "order_number": _generate_order_number(),
            "items": order_items,
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "shipping_amount": shipping_amount,
            "total": total,
            "status": OrderStatus.confirmed.value,
            "payment_status": PaymentStatus.paid.value,
            "payment_method": payment_method,
            "payment_reference": payment_reference,
            "shipping_address": shipping_address.model_dump(),
            "notes": notes,
        }

        result = await self.db.orders.insert_one(order_doc)
        order_doc["_id"] = result.inserted_id

        # Clear the cart
        await self.db.carts.update_one(
            {"tenant_id": tenant_id, "user_id": user_id},
            {"$set": {"items": []}},
        )

        return OrderResponse(**doc_to_response(order_doc))
