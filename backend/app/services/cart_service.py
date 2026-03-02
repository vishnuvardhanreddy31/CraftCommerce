from __future__ import annotations

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.cart import CartResponse
from app.utils.helpers import doc_to_response


class CartService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db

    async def _get_or_create(self, tenant_id: str, user_id: str) -> dict:
        cart = await self.db.carts.find_one({"tenant_id": tenant_id, "user_id": user_id})
        if not cart:
            doc = {"tenant_id": tenant_id, "user_id": user_id, "items": []}
            result = await self.db.carts.insert_one(doc)
            doc["_id"] = result.inserted_id
            cart = doc
        return cart

    def _cart_response(self, doc: dict) -> CartResponse:
        items = doc.get("items", [])
        subtotal = sum(i["unit_price"] * i["quantity"] for i in items)
        item_count = sum(i["quantity"] for i in items)
        return CartResponse(
            id=str(doc["_id"]),
            tenant_id=doc["tenant_id"],
            user_id=doc["user_id"],
            items=items,
            subtotal=subtotal,
            item_count=item_count,
        )

    async def get_cart(self, tenant_id: str, user_id: str) -> CartResponse:
        cart = await self._get_or_create(tenant_id, user_id)
        return self._cart_response(cart)

    async def add_item(self, tenant_id: str, user_id: str, product_id: str, quantity: int) -> CartResponse:
        # Validate product exists and is active
        try:
            p_oid = ObjectId(product_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        product = await self.db.products.find_one({"_id": p_oid, "tenant_id": tenant_id, "is_active": True})
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or unavailable")

        # Check stock
        if product.get("track_inventory", True) and product.get("stock", 0) < quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")

        cart = await self._get_or_create(tenant_id, user_id)
        items: list = cart.get("items", [])

        # Check if item already in cart
        existing_idx = next((i for i, item in enumerate(items) if item["product_id"] == product_id), None)
        if existing_idx is not None:
            items[existing_idx]["quantity"] += quantity
            # Validate total quantity vs stock
            if product.get("track_inventory", True) and product.get("stock", 0) < items[existing_idx]["quantity"]:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")
        else:
            items.append(
                {
                    "product_id": product_id,
                    "name": product["name"],
                    "sku": product.get("sku"),
                    "quantity": quantity,
                    "unit_price": product["price"],
                    "image_url": product["images"][0] if product.get("images") else None,
                }
            )

        updated = await self.db.carts.find_one_and_update(
            {"tenant_id": tenant_id, "user_id": user_id},
            {"$set": {"items": items}},
            return_document=True,
        )
        return self._cart_response(updated)

    async def update_item(self, tenant_id: str, user_id: str, product_id: str, quantity: int) -> CartResponse:
        cart = await self._get_or_create(tenant_id, user_id)
        items: list = cart.get("items", [])

        idx = next((i for i, item in enumerate(items) if item["product_id"] == product_id), None)
        if idx is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart")

        # Validate stock
        try:
            p_oid = ObjectId(product_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        product = await self.db.products.find_one({"_id": p_oid, "tenant_id": tenant_id})
        if product and product.get("track_inventory", True) and product.get("stock", 0) < quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")

        items[idx]["quantity"] = quantity
        updated = await self.db.carts.find_one_and_update(
            {"tenant_id": tenant_id, "user_id": user_id},
            {"$set": {"items": items}},
            return_document=True,
        )
        return self._cart_response(updated)

    async def remove_item(self, tenant_id: str, user_id: str, product_id: str) -> CartResponse:
        cart = await self._get_or_create(tenant_id, user_id)
        items = [item for item in cart.get("items", []) if item["product_id"] != product_id]
        updated = await self.db.carts.find_one_and_update(
            {"tenant_id": tenant_id, "user_id": user_id},
            {"$set": {"items": items}},
            return_document=True,
        )
        return self._cart_response(updated)

    async def clear_cart(self, tenant_id: str, user_id: str) -> CartResponse:
        updated = await self.db.carts.find_one_and_update(
            {"tenant_id": tenant_id, "user_id": user_id},
            {"$set": {"items": []}},
            return_document=True,
        )
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")
        return self._cart_response(updated)
