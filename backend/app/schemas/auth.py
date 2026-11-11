from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    preferred_language: Optional[str] = "en"
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    account_status: str
    preferred_language: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    created_at: Optional[str] = None
