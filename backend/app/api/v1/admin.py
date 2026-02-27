from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import require_roles, get_current_auth_payload
from app.models.enums import MembershipRole
from app.models.fitness import DailyTracking
from app.models.membership import Membership
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.admin import AdminMemberResponse, AdminMetricsResponse


router = APIRouter(prefix='/admin', tags=['admin'])


@router.get('/members', response_model=list[AdminMemberResponse])
def members(tier: str | None = None, db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload), _: Membership = Depends(require_roles(MembershipRole.GYM_ADMIN, MembershipRole.SUPERADMIN))):
    memberships = db.scalars(select(Membership).where(Membership.tenant_id == int(auth['tenant_id']))).all()
    result = []
    for m in memberships:
        user = db.get(User, m.user_id)
        sub = db.scalar(select(Subscription).where(Subscription.tenant_id == m.tenant_id).order_by(Subscription.created_at.desc()))
        sub_tier = sub.tier if sub else 'free'
        if tier and sub_tier != tier:
            continue
        avg = db.scalar(select(func.avg(DailyTracking.consistency_score)).where(and_(DailyTracking.user_id == user.id, DailyTracking.tenant_id == m.tenant_id)))
        result.append(AdminMemberResponse(user_id=user.id, full_name=user.full_name, email=user.email, role=m.role, tier=sub_tier, average_consistency=round(float(avg or 0), 2)))
    return result


@router.get('/engagement-metrics', response_model=AdminMetricsResponse)
def metrics(db: Session = Depends(get_db), auth: dict = Depends(get_current_auth_payload), _: Membership = Depends(require_roles(MembershipRole.GYM_ADMIN, MembershipRole.SUPERADMIN))):
    total = db.scalar(select(func.count(Membership.id)).where(Membership.tenant_id == int(auth['tenant_id']))) or 0
    active = db.scalar(select(func.count(DailyTracking.id)).where(and_(DailyTracking.tenant_id == int(auth['tenant_id']), DailyTracking.date == func.current_date()))) or 0
    avg = db.scalar(select(func.avg(DailyTracking.consistency_score)).where(DailyTracking.tenant_id == int(auth['tenant_id']))) or 0
    return AdminMetricsResponse(total_members=int(total), active_today=int(active), avg_consistency=round(float(avg), 2))


@router.post('/plans/templates')
def plans_templates(_: Membership = Depends(require_roles(MembershipRole.GYM_ADMIN, MembershipRole.SUPERADMIN))):
    return {'message': 'Template management endpoint ready'}
