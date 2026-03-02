from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import get_current_user
from app.models.user import UserRole
from app.schemas.user import RefreshTokenRequest, TokenResponse, UserLogin, UserRegister, UserResponse
from app.services.auth_service import AuthService
from app.utils.exceptions import require_tenant

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegister,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = AuthService(db)
    return await service.register(data, tenant_id)


@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    tenant_id = require_tenant(request)
    service = AuthService(db)
    return await service.login(data.email, data.password, tenant_id)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    data: RefreshTokenRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = AuthService(db)
    return await service.refresh(data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        tenant_id=current_user["tenant_id"],
        email=current_user["email"],
        first_name=current_user["first_name"],
        last_name=current_user["last_name"],
        role=current_user["role"],
        is_active=current_user["is_active"],
        phone=current_user.get("phone"),
        avatar_url=current_user.get("avatar_url"),
    )
