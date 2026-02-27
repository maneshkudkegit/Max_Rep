from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import require_roles
from app.models.enums import MembershipRole
from app.models.membership import Membership
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.admin import PlatformMetricsResponse, TenantResponse


router = APIRouter(prefix='/superadmin', tags=['superadmin'])


@router.get('/tenants', response_model=list[TenantResponse])
def tenants(db: Session = Depends(get_db), _: Membership = Depends(require_roles(MembershipRole.SUPERADMIN))):
    rows = db.scalars(select(Tenant).order_by(Tenant.created_at.desc())).all()
    return [TenantResponse(id=t.id, name=t.name, slug=t.slug) for t in rows]


@router.get('/platform-metrics', response_model=PlatformMetricsResponse)
def platform_metrics(db: Session = Depends(get_db), _: Membership = Depends(require_roles(MembershipRole.SUPERADMIN))):
    tenants = db.scalar(select(func.count(Tenant.id))) or 0
    users = db.scalar(select(func.count(User.id))) or 0
    active_subs = db.scalar(select(func.count(Subscription.id)).where(Subscription.status == SubscriptionStatus.ACTIVE)) or 0
    return PlatformMetricsResponse(tenants=int(tenants), users=int(users), subscriptions_active=int(active_subs))
