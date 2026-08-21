from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, ConfigDict

class UserRoleUpdate(BaseModel):
    role: Literal["admin", "analyst", "viewer"]

class UserStatusUpdate(BaseModel):
    is_active: bool

class UserDetailResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: Literal["admin", "analyst", "viewer"]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
