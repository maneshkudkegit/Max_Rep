from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    tenant_name: str = Field(min_length=2, max_length=120)
    tenant_slug: str | None = Field(default=None, min_length=2, max_length=120)
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    age: int = Field(default=25, ge=14, le=90)
    gender: str = Field(default='male')
    height_cm: float = Field(default=175, gt=100, lt=260)
    weight_kg: float = Field(default=75, gt=30, lt=350)
    activity_level: str = Field(default='moderate')
    goal: str = Field(default='fat_loss')
    current_phase: str = Field(default='beginner')


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
    profile_completion_tips: list[str] = []


class MessageResponse(BaseModel):
    message: str


class ProfileResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    photo_url: str | None = None
    weekday_sleep_hours: float | None = None
    weekend_sleep_hours: float | None = None
    last_login_at: str | None = None
    profile_completion_tips: list[str]


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    age: int | None = Field(default=None, ge=14, le=90)
    height_cm: float | None = Field(default=None, gt=100, lt=260)
    weight_kg: float | None = Field(default=None, gt=30, lt=350)
    photo_url: str | None = Field(default=None, max_length=500)
    weekday_sleep_hours: float | None = Field(default=None, ge=0, le=24)
    weekend_sleep_hours: float | None = Field(default=None, ge=0, le=24)
