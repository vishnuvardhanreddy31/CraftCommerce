from __future__ import annotations

from typing import Any, Dict, List

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_database
from app.core.security import require_role
from app.schemas.user import UserResponse, UserRoleUpdate
from app.utils.exceptions import require_tenant
from app.utils.helpers import doc_to_response

router = APIRouter(prefix="/api/admin", tags=["admin"])


class DashboardStats(BaseModel):
    total_orders: int
    total_revenue: float
    total_products: int
    active_products: int
    total_users: int
    active_users: int
    orders_by_status: Dict[str, int]
    recent_revenue: float  # last 30 days (approximated from all orders for mock)


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(
    request: Request,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)

    # Aggregate stats in parallel using asyncio.gather
    import asyncio

    total_orders, total_products, active_products, total_users, active_users = await asyncio.gather(
        db.orders.count_documents({"tenant_id": tenant_id}),
        db.products.count_documents({"tenant_id": tenant_id}),
        db.products.count_documents({"tenant_id": tenant_id, "is_active": True}),
        db.users.count_documents({"tenant_id": tenant_id}),
        db.users.count_documents({"tenant_id": tenant_id, "is_active": True}),
    )

    # Revenue and order breakdown
    revenue_pipeline = [
        {"$match": {"tenant_id": tenant_id, "payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}},
    ]
    rev_cursor = db.orders.aggregate(revenue_pipeline)
    rev_result = await rev_cursor.to_list(length=1)
    total_revenue = rev_result[0]["total"] if rev_result else 0.0

    # Orders by status
    status_pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    status_cursor = db.orders.aggregate(status_pipeline)
    status_docs = await status_cursor.to_list(length=20)
    orders_by_status: Dict[str, int] = {doc["_id"]: doc["count"] for doc in status_docs}

    return DashboardStats(
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        total_products=total_products,
        active_products=active_products,
        total_users=total_users,
        active_users=active_users,
        orders_by_status=orders_by_status,
        recent_revenue=round(total_revenue, 2),
    )


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(require_role("admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """List all users belonging to the current tenant."""
    tenant_id = require_tenant(request)
    cursor = db.users.find({"tenant_id": tenant_id}).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    result = []
    for doc in docs:
        d = doc_to_response(doc)
        d.pop("hashed_password", None)
        result.append(UserResponse(**d))
    return result


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    data: UserRoleUpdate,
    request: Request,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Update the role of a user within the current tenant."""
    tenant_id = require_tenant(request)
    try:
        oid = ObjectId(user_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updated = await db.users.find_one_and_update(
        {"_id": oid, "tenant_id": tenant_id},
        {"$set": {"role": data.role.value}},
        return_document=True,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    d = doc_to_response(updated)
    d.pop("hashed_password", None)
    return UserResponse(**d)
