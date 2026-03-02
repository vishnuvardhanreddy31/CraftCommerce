from __future__ import annotations

from enum import Enum
from typing import Annotated, Any, Optional

from bson import ObjectId
from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field

PyObjectId = Annotated[str, BeforeValidator(str)]


class UserRole(str, Enum):
    admin = "admin"
    vendor = "vendor"
    customer = "customer"


class User(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    tenant_id: str
    email: EmailStr
    hashed_password: str
    first_name: str
    last_name: str
    role: UserRole = UserRole.customer
    is_active: bool = True
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

    def to_response(self) -> dict[str, Any]:
        data = self.model_dump(exclude={"hashed_password"}, by_alias=False)
        return data
