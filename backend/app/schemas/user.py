from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    role: str = "visitor"  # admin, analyst, visitor
    is_superuser: bool = False
    requires_2fa: bool = False
    approval_status: str = "pending"  # pending, approved, rejected
    is_verified: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class UserInDB(User):
    hashed_password: str
