from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    tenant_name: str = Field(min_length=2, max_length=120)
    tenant_slug: str | None = Field(default=None, min_length=2, max_length=120)
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    age: int = Field(ge=14, le=90)
    gender: str
    height_cm: float = Field(gt=100, lt=260)
    weight_kg: float = Field(gt=30, lt=350)
    activity_level: str
    goal: str
    current_phase: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_slug: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str | None = None


class AuthUserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    tenant_id: int
    tenant_slug: str
    role: str
    tier: str


class MessageResponse(BaseModel):
    message: str
