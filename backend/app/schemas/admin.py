from pydantic import BaseModel


class AdminMemberResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str
    tier: str
    average_consistency: float


class AdminMetricsResponse(BaseModel):
    total_members: int
    active_today: int
    avg_consistency: float


class TenantResponse(BaseModel):
    id: int
    name: str
    slug: str


class PlatformMetricsResponse(BaseModel):
    tenants: int
    users: int
    subscriptions_active: int
