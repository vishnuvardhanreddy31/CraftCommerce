from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import create_access_token, create_refresh_token, get_password_hash, verify_password, verify_token
from app.models.user import UserRole
from app.schemas.user import TokenResponse, UserRegister, UserResponse
from app.utils.helpers import doc_to_response


class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db

    async def register(self, data: UserRegister, tenant_id: str, role: UserRole = UserRole.customer) -> UserResponse:
        existing = await self.db.users.find_one({"tenant_id": tenant_id, "email": data.email})
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        user_doc = {
            "tenant_id": tenant_id,
            "email": data.email,
            "hashed_password": get_password_hash(data.password),
            "first_name": data.first_name,
            "last_name": data.last_name,
            "role": role.value,
            "is_active": True,
            "phone": data.phone,
            "avatar_url": None,
        }
        result = await self.db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return UserResponse(**doc_to_response(user_doc))

    async def login(self, email: str, password: str, tenant_id: str) -> TokenResponse:
        user = await self.db.users.find_one({"tenant_id": tenant_id, "email": email})
        if not user or not verify_password(password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        if not user.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

        user_id = str(user["_id"])
        token_data = {"sub": user_id, "tenant_id": tenant_id, "role": user["role"]}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user=UserResponse(**doc_to_response(user)),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = verify_token(refresh_token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        from bson import ObjectId

        user = await self.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        tenant_id = str(user["tenant_id"])
        token_data = {"sub": user_id, "tenant_id": tenant_id, "role": user["role"]}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user=UserResponse(**doc_to_response(user)),
        )
