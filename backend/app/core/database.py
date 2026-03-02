from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URL)
    return _client


def get_database() -> AsyncIOMotorDatabase:
    return get_client()[settings.DATABASE_NAME]


async def create_indexes() -> None:
    db = get_database()

    # Users: unique email per tenant
    await db.users.create_index([("tenant_id", 1), ("email", 1)], unique=True)
    await db.users.create_index([("tenant_id", 1)])

    # Tenants: unique slug
    await db.tenants.create_index("slug", unique=True)

    # Products
    await db.products.create_index([("tenant_id", 1)])
    await db.products.create_index([("tenant_id", 1), ("category_id", 1)])
    await db.products.create_index([("tenant_id", 1), ("is_active", 1)])

    # Categories
    await db.categories.create_index([("tenant_id", 1)])
    await db.categories.create_index([("tenant_id", 1), ("slug", 1)], unique=True)

    # Orders
    await db.orders.create_index([("tenant_id", 1)])
    await db.orders.create_index([("tenant_id", 1), ("user_id", 1)])
    await db.orders.create_index([("tenant_id", 1), ("status", 1)])

    # Cart: one cart per user per tenant
    await db.carts.create_index([("tenant_id", 1), ("user_id", 1)], unique=True)

    # Tenant config
    await db.tenant_configs.create_index("tenant_id", unique=True)


async def close_connection() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
