#!/usr/bin/env python3
"""
CraftCommerce Seed Data Script
Populates MongoDB with demo tenants, users, categories, products, and orders.

Usage:
    pip install motor passlib[bcrypt] python-dotenv
    python seed.py

Environment variables:
    MONGODB_URL  - defaults to mongodb://localhost:27017
    DATABASE_NAME - defaults to craftcommerce
"""

import asyncio
import os
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "craftcommerce")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def now():
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Seed data definitions
# ---------------------------------------------------------------------------

TENANTS = [
    {
        "_id": ObjectId("64a0000000000000000000a1"),
        "slug": "artisan-crafts",
        "store_name": "Artisan Crafts Co.",
        "owner_email": "admin@artisancrafts.com",
        "logo": "https://placehold.co/120x40/6366f1/white?text=Artisan",
        "currency": "USD",
        "timezone": "America/New_York",
        "tax_config": {"enabled": True, "rate": 8.5, "inclusive": False},
        "is_active": True,
        "theme_config": {
            "primaryColor": "#6366f1",
            "secondaryColor": "#8b5cf6",
            "fontFamily": "Inter, sans-serif",
            "borderRadius": "16px",
        },
    },
    {
        "_id": ObjectId("64a0000000000000000000a2"),
        "slug": "home-decor-studio",
        "store_name": "Home Décor Studio",
        "owner_email": "admin@homedecorstudio.com",
        "logo": "https://placehold.co/120x40/10b981/white?text=HomeDecor",
        "currency": "USD",
        "timezone": "America/Los_Angeles",
        "tax_config": {"enabled": True, "rate": 9.0, "inclusive": False},
        "is_active": True,
        "theme_config": {
            "primaryColor": "#10b981",
            "secondaryColor": "#059669",
            "fontFamily": "Georgia, serif",
            "borderRadius": "12px",
        },
    },
]

TENANT_ID_1 = "64a0000000000000000000a1"
TENANT_ID_2 = "64a0000000000000000000a2"

USERS = [
    # Tenant 1 – admin
    {
        "_id": ObjectId("64b0000000000000000000b1"),
        "tenant_id": TENANT_ID_1,
        "email": "admin@artisancrafts.com",
        "hashed_password": hash_password("Admin@1234"),
        "first_name": "Alice",
        "last_name": "Admin",
        "role": "admin",
        "is_active": True,
        "phone": "+1-555-0101",
    },
    # Tenant 1 – vendor
    {
        "_id": ObjectId("64b0000000000000000000b2"),
        "tenant_id": TENANT_ID_1,
        "email": "vendor@artisancrafts.com",
        "hashed_password": hash_password("Vendor@1234"),
        "first_name": "Victor",
        "last_name": "Vendor",
        "role": "vendor",
        "is_active": True,
        "phone": "+1-555-0102",
    },
    # Tenant 1 – customer
    {
        "_id": ObjectId("64b0000000000000000000b3"),
        "tenant_id": TENANT_ID_1,
        "email": "customer@example.com",
        "hashed_password": hash_password("Customer@1234"),
        "first_name": "Charlie",
        "last_name": "Customer",
        "role": "customer",
        "is_active": True,
        "phone": "+1-555-0103",
    },
    # Tenant 2 – admin
    {
        "_id": ObjectId("64b0000000000000000000b4"),
        "tenant_id": TENANT_ID_2,
        "email": "admin@homedecorstudio.com",
        "hashed_password": hash_password("Admin@1234"),
        "first_name": "Diana",
        "last_name": "Admin",
        "role": "admin",
        "is_active": True,
        "phone": "+1-555-0201",
    },
    # Tenant 2 – customer
    {
        "_id": ObjectId("64b0000000000000000000b5"),
        "tenant_id": TENANT_ID_2,
        "email": "customer2@example.com",
        "hashed_password": hash_password("Customer@1234"),
        "first_name": "Ethan",
        "last_name": "Smith",
        "role": "customer",
        "is_active": True,
        "phone": "+1-555-0202",
    },
]

CATEGORIES = [
    # Tenant 1 categories
    {
        "_id": ObjectId("64c0000000000000000000c1"),
        "tenant_id": TENANT_ID_1,
        "name": "Handmade Jewelry",
        "slug": "handmade-jewelry",
        "description": "Unique artisan jewelry crafted by hand",
        "parent_id": None,
        "sort_order": 1,
        "is_active": True,
    },
    {
        "_id": ObjectId("64c0000000000000000000c2"),
        "tenant_id": TENANT_ID_1,
        "name": "Ceramics & Pottery",
        "slug": "ceramics-pottery",
        "description": "Hand-thrown and hand-painted ceramics",
        "parent_id": None,
        "sort_order": 2,
        "is_active": True,
    },
    {
        "_id": ObjectId("64c0000000000000000000c3"),
        "tenant_id": TENANT_ID_1,
        "name": "Textiles & Weaving",
        "slug": "textiles-weaving",
        "description": "Woven and textile art pieces",
        "parent_id": None,
        "sort_order": 3,
        "is_active": True,
    },
    # Tenant 2 categories
    {
        "_id": ObjectId("64c0000000000000000000c4"),
        "tenant_id": TENANT_ID_2,
        "name": "Wall Art",
        "slug": "wall-art",
        "description": "Curated wall art for every room",
        "parent_id": None,
        "sort_order": 1,
        "is_active": True,
    },
    {
        "_id": ObjectId("64c0000000000000000000c5"),
        "tenant_id": TENANT_ID_2,
        "name": "Cushions & Throws",
        "slug": "cushions-throws",
        "description": "Soft furnishings for a cozy home",
        "parent_id": None,
        "sort_order": 2,
        "is_active": True,
    },
]

PRODUCTS = [
    # Tenant 1 – Jewelry
    {
        "_id": ObjectId("64d0000000000000000000d1"),
        "tenant_id": TENANT_ID_1,
        "name": "Silver Leaf Earrings",
        "description": "Delicate hand-crafted sterling silver earrings with a leaf design.",
        "price": 32.99,
        "compare_at_price": 45.00,
        "images": ["https://placehold.co/600x600/e0e7ff/6366f1?text=Silver+Earrings"],
        "category_id": "64c0000000000000000000c1",
        "sku": "JWL-001",
        "stock": 25,
        "track_inventory": True,
        "is_active": True,
        "tags": ["silver", "earrings", "handmade"],
        "attributes": {"material": "Sterling Silver", "style": "Drop"},
    },
    {
        "_id": ObjectId("64d0000000000000000000d2"),
        "tenant_id": TENANT_ID_1,
        "name": "Copper Bangle Bracelet",
        "description": "Hand-hammered copper bangle with a natural patina finish.",
        "price": 24.50,
        "images": ["https://placehold.co/600x600/fef3c7/d97706?text=Copper+Bangle"],
        "category_id": "64c0000000000000000000c1",
        "sku": "JWL-002",
        "stock": 18,
        "track_inventory": True,
        "is_active": True,
        "tags": ["copper", "bracelet", "handmade"],
        "attributes": {"material": "Copper", "style": "Bangle"},
    },
    {
        "_id": ObjectId("64d0000000000000000000d3"),
        "tenant_id": TENANT_ID_1,
        "name": "Gemstone Pendant Necklace",
        "description": "Natural amethyst gemstone set in recycled gold-fill wire.",
        "price": 58.00,
        "compare_at_price": 75.00,
        "images": ["https://placehold.co/600x600/ede9fe/7c3aed?text=Gemstone+Pendant"],
        "category_id": "64c0000000000000000000c1",
        "sku": "JWL-003",
        "stock": 12,
        "track_inventory": True,
        "is_active": True,
        "tags": ["gemstone", "necklace", "amethyst"],
        "attributes": {"gemstone": "Amethyst", "metal": "Gold-fill"},
    },
    # Tenant 1 – Ceramics
    {
        "_id": ObjectId("64d0000000000000000000d4"),
        "tenant_id": TENANT_ID_1,
        "name": "Hand-thrown Stoneware Mug",
        "description": "Rustic stoneware mug, dishwasher safe, holds 12oz.",
        "price": 28.00,
        "images": ["https://placehold.co/600x600/fef9c3/854d0e?text=Stoneware+Mug"],
        "category_id": "64c0000000000000000000c2",
        "sku": "CER-001",
        "stock": 40,
        "track_inventory": True,
        "is_active": True,
        "tags": ["mug", "stoneware", "handmade"],
        "attributes": {"capacity": "12oz", "finish": "Matte glaze"},
    },
    {
        "_id": ObjectId("64d0000000000000000000d5"),
        "tenant_id": TENANT_ID_1,
        "name": "Artisan Serving Bowl",
        "description": "Large hand-painted ceramic serving bowl, food safe.",
        "price": 64.00,
        "compare_at_price": 80.00,
        "images": ["https://placehold.co/600x600/dcfce7/166534?text=Serving+Bowl"],
        "category_id": "64c0000000000000000000c2",
        "sku": "CER-002",
        "stock": 15,
        "track_inventory": True,
        "is_active": True,
        "tags": ["bowl", "ceramic", "serving"],
        "attributes": {"diameter": "30cm", "finish": "Painted glaze"},
    },
    # Tenant 1 – Textiles
    {
        "_id": ObjectId("64d0000000000000000000d6"),
        "tenant_id": TENANT_ID_1,
        "name": "Hand-woven Wall Tapestry",
        "description": "Boho-style cotton wall tapestry, 60×90cm.",
        "price": 89.00,
        "images": ["https://placehold.co/600x600/fce7f3/9d174d?text=Wall+Tapestry"],
        "category_id": "64c0000000000000000000c3",
        "sku": "TEX-001",
        "stock": 8,
        "track_inventory": True,
        "is_active": True,
        "tags": ["tapestry", "wall art", "woven"],
        "attributes": {"material": "Cotton", "size": "60×90cm"},
    },
    # Tenant 2 – Wall Art
    {
        "_id": ObjectId("64d0000000000000000000d7"),
        "tenant_id": TENANT_ID_2,
        "name": "Abstract Canvas Print",
        "description": "Vibrant abstract art printed on gallery-quality canvas.",
        "price": 120.00,
        "compare_at_price": 150.00,
        "images": ["https://placehold.co/600x600/ecfdf5/065f46?text=Canvas+Print"],
        "category_id": "64c0000000000000000000c4",
        "sku": "WALL-001",
        "stock": 20,
        "track_inventory": True,
        "is_active": True,
        "tags": ["canvas", "abstract", "wall art"],
        "attributes": {"size": "60×80cm", "frame": "Unframed"},
    },
    {
        "_id": ObjectId("64d0000000000000000000d8"),
        "tenant_id": TENANT_ID_2,
        "name": "Botanical Illustration Set",
        "description": "Set of 3 botanical prints, ready to frame.",
        "price": 45.00,
        "images": ["https://placehold.co/600x600/f0fdf4/166534?text=Botanical+Prints"],
        "category_id": "64c0000000000000000000c4",
        "sku": "WALL-002",
        "stock": 35,
        "track_inventory": True,
        "is_active": True,
        "tags": ["botanical", "print", "set"],
        "attributes": {"size": "A4", "quantity": "3 prints"},
    },
    # Tenant 2 – Cushions
    {
        "_id": ObjectId("64d0000000000000000000d9"),
        "tenant_id": TENANT_ID_2,
        "name": "Velvet Cushion Cover",
        "description": "Luxuriously soft velvet cushion cover, 45×45cm.",
        "price": 22.00,
        "images": ["https://placehold.co/600x600/eff6ff/1e40af?text=Velvet+Cushion"],
        "category_id": "64c0000000000000000000c5",
        "sku": "CUSH-001",
        "stock": 50,
        "track_inventory": True,
        "is_active": True,
        "tags": ["cushion", "velvet", "home decor"],
        "attributes": {"material": "Velvet", "size": "45×45cm"},
    },
    {
        "_id": ObjectId("64d0000000000000000000da"),
        "tenant_id": TENANT_ID_2,
        "name": "Chunky Knit Throw",
        "description": "Cozy oversized chunky knit throw blanket, 130×150cm.",
        "price": 75.00,
        "compare_at_price": 99.00,
        "images": ["https://placehold.co/600x600/fef2f2/991b1b?text=Knit+Throw"],
        "category_id": "64c0000000000000000000c5",
        "sku": "CUSH-002",
        "stock": 22,
        "track_inventory": True,
        "is_active": True,
        "tags": ["throw", "knit", "blanket"],
        "attributes": {"material": "Acrylic Yarn", "size": "130×150cm"},
    },
]

ORDERS = [
    {
        "_id": ObjectId("64e0000000000000000000e1"),
        "tenant_id": TENANT_ID_1,
        "user_id": "64b0000000000000000000b3",
        "items": [
            {
                "product_id": "64d0000000000000000000d1",
                "name": "Silver Leaf Earrings",
                "price": 32.99,
                "quantity": 2,
                "image": "https://placehold.co/600x600/e0e7ff/6366f1?text=Silver+Earrings",
            },
            {
                "product_id": "64d0000000000000000000d4",
                "name": "Hand-thrown Stoneware Mug",
                "price": 28.00,
                "quantity": 1,
                "image": "https://placehold.co/600x600/fef9c3/854d0e?text=Stoneware+Mug",
            },
        ],
        "subtotal": 93.98,
        "tax_amount": 7.99,
        "total": 101.97,
        "status": "delivered",
        "payment_status": "paid",
        "payment_method": "mock_card",
        "shipping_address": {
            "first_name": "Charlie",
            "last_name": "Customer",
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zip_code": "10001",
            "country": "US",
        },
        "created_at": datetime(2024, 11, 15, 10, 30, 0, tzinfo=timezone.utc),
        "updated_at": datetime(2024, 11, 20, 14, 0, 0, tzinfo=timezone.utc),
    },
    {
        "_id": ObjectId("64e0000000000000000000e2"),
        "tenant_id": TENANT_ID_1,
        "user_id": "64b0000000000000000000b3",
        "items": [
            {
                "product_id": "64d0000000000000000000d3",
                "name": "Gemstone Pendant Necklace",
                "price": 58.00,
                "quantity": 1,
                "image": "https://placehold.co/600x600/ede9fe/7c3aed?text=Gemstone+Pendant",
            },
        ],
        "subtotal": 58.00,
        "tax_amount": 4.93,
        "total": 62.93,
        "status": "processing",
        "payment_status": "paid",
        "payment_method": "mock_card",
        "shipping_address": {
            "first_name": "Charlie",
            "last_name": "Customer",
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zip_code": "10001",
            "country": "US",
        },
        "created_at": datetime(2024, 12, 1, 9, 0, 0, tzinfo=timezone.utc),
        "updated_at": datetime(2024, 12, 1, 9, 0, 0, tzinfo=timezone.utc),
    },
]


# ---------------------------------------------------------------------------
# Seeding logic
# ---------------------------------------------------------------------------

async def seed():
    print(f"Connecting to MongoDB: {MONGODB_URL}")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    # Drop existing collections for a clean seed
    collections = ["tenants", "users", "categories", "products", "orders", "carts"]
    for col in collections:
        await db[col].drop()
        print(f"  Dropped collection: {col}")

    # Create indexes
    await db.tenants.create_index("slug", unique=True)
    await db.users.create_index([("tenant_id", 1), ("email", 1)], unique=True)
    await db.products.create_index([("tenant_id", 1), ("is_active", 1)])
    await db.categories.create_index([("tenant_id", 1), ("slug", 1)], unique=True)
    await db.orders.create_index([("tenant_id", 1), ("user_id", 1)])
    await db.carts.create_index([("tenant_id", 1), ("user_id", 1)], unique=True)
    print("  Indexes created.")

    # Insert data
    res = await db.tenants.insert_many(TENANTS)
    print(f"  Inserted {len(res.inserted_ids)} tenants.")

    res = await db.users.insert_many(USERS)
    print(f"  Inserted {len(res.inserted_ids)} users.")

    res = await db.categories.insert_many(CATEGORIES)
    print(f"  Inserted {len(res.inserted_ids)} categories.")

    res = await db.products.insert_many(PRODUCTS)
    print(f"  Inserted {len(res.inserted_ids)} products.")

    res = await db.orders.insert_many(ORDERS)
    print(f"  Inserted {len(res.inserted_ids)} orders.")

    client.close()

    print("\nSeed complete!")
    print("\n=== Demo Credentials ===")
    print("Tenant 1 – Artisan Crafts Co. (X-Tenant-ID: 64a0000000000000000000a1)")
    print("  Admin   : admin@artisancrafts.com / Admin@1234")
    print("  Vendor  : vendor@artisancrafts.com / Vendor@1234")
    print("  Customer: customer@example.com / Customer@1234")
    print("\nTenant 2 – Home Décor Studio (X-Tenant-ID: 64a0000000000000000000a2)")
    print("  Admin   : admin@homedecorstudio.com / Admin@1234")
    print("  Customer: customer2@example.com / Customer@1234")


if __name__ == "__main__":
    asyncio.run(seed())
