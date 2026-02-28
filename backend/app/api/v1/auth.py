from datetime import datetime, timezone
import re

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.auth_cookies import clear_auth_cookies, set_auth_cookies
from app.core.config import settings
from app.core.db import get_db
from app.core.deps import get_current_auth_payload
from app.core.rate_limit import limit_auth_request
from app.core.redis_client import revoke_token_jti
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    expires_at_for,
    get_password_hash,
    hash_token,
    random_token,
    verify_password,
)
from app.models.auth_session import AuthSession, RevokedToken
from app.models.enums import MembershipRole
from app.models.membership import Membership
from app.models.subscription import Subscription, SubscriptionStatus, SubscriptionTier
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import AuthUserResponse, LoginRequest, MessageResponse, ProfileResponse, ProfileUpdateRequest, RegisterRequest
from app.services.fitness_engine import (
    ACTIVITY_FACTORS,
    bmi,
    body_fat_us_navy,
    calculate_bmr,
    calorie_target,
    macro_split,
    roadmap_for_phase,
    water_ml_target,
)
from app.models.fitness import FitnessProfile


router = APIRouter(prefix='/auth', tags=['auth'])


def _profile_completion_tips(user: User) -> list[str]:
    tips: list[str] = []
    if not user.photo_url:
        tips.append('Add a profile photo in Settings.')
    if not user.weekday_sleep_hours:
        tips.append('Set your weekday sleep hours in Settings.')
    if not user.weekend_sleep_hours:
        tips.append('Set your weekend sleep hours in Settings.')
    if user.height_cm <= 0 or user.weight_kg <= 0:
        tips.append('Update your current height and weight in Settings.')
    return tips


def _slugify(value: str) -> str:
    base = re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')
    return base or 'max-rep-gym'


def _unique_tenant_slug(db: Session, requested_slug: str | None, tenant_name: str) -> str:
    base = _slugify(requested_slug) if requested_slug else _slugify(tenant_name)
    candidate = base
    suffix = 1
    while db.scalar(select(Tenant).where(Tenant.slug == candidate)):
        candidate = f'{base}-{suffix}'
        suffix += 1
    return candidate


def _issue_session_tokens(user: User, tenant: Tenant, role: str, tier: str, db: Session) -> tuple[str, str, str, AuthSession]:
    sid = random_token(18)
    family_id = random_token(18)
    access, access_jti = create_access_token(user_id=user.id, tenant_id=tenant.id, role=role, tier=tier, sid=sid)
    refresh, refresh_jti = create_refresh_token(user_id=user.id, tenant_id=tenant.id, sid=sid, family_id=family_id)

    session = AuthSession(
        user_id=user.id,
        tenant_id=tenant.id,
        session_id=sid,
        family_id=family_id,
        refresh_token_hash=hash_token(refresh),
        refresh_jti=refresh_jti,
        expires_at=expires_at_for('refresh'),
        revoked=False,
    )
    db.add(session)
    db.flush()

    membership = db.scalar(select(Membership).where(and_(Membership.user_id == user.id, Membership.tenant_id == tenant.id)))
    if membership:
        membership.current_session_id = session.id

    csrf = random_token(16)
    return access, refresh, csrf, session


@router.post('/register', response_model=AuthUserResponse, dependencies=[Depends(limit_auth_request)])
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == payload.email.lower().strip())):
        raise HTTPException(status_code=400, detail='Email already registered')
    tenant_slug = _unique_tenant_slug(db, payload.tenant_slug, payload.tenant_name)

    tenant = Tenant(name=payload.tenant_name, slug=tenant_slug, brand_name='Max Rep')
    db.add(tenant)
    db.flush()

    user = User(
        full_name=payload.full_name,
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        age=payload.age,
        gender=payload.gender,
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        activity_level=payload.activity_level,
        goal=payload.goal,
        current_phase=payload.current_phase,
        last_login_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.flush()

    membership = Membership(user_id=user.id, tenant_id=tenant.id, role=MembershipRole.GYM_ADMIN)
    db.add(membership)
    db.add(Subscription(tenant_id=tenant.id, tier=SubscriptionTier.FREE, status=SubscriptionStatus.ACTIVE, provider='stripe'))

    bmr_value = calculate_bmr(user.weight_kg, user.height_cm, user.age, user.gender)
    tdee = bmr_value * ACTIVITY_FACTORS[user.activity_level]
    target = calorie_target(tdee, user.goal)
    protein, carbs, fats, fiber = macro_split(target, user.weight_kg, user.current_phase)

    db.add(
        FitnessProfile(
            tenant_id=tenant.id,
            user_id=user.id,
            bmr=round(bmr_value, 2),
            tdee=round(tdee, 2),
            calorie_target=round(target, 2),
            protein_g=protein,
            carbs_g=carbs,
            fats_g=fats,
            fiber_g=fiber,
            water_ml=water_ml_target(user.weight_kg),
            roadmap=roadmap_for_phase(user.current_phase),
            workout_schedule='Push/Pull/Legs + active recovery based on phase and activity level.',
            meals_plan='Breakfast: 30%, Lunch: 30%, Dinner: 30%, Snacks: 10% of calorie target.',
        )
    )

    access, refresh, csrf, _ = _issue_session_tokens(user, tenant, MembershipRole.GYM_ADMIN.value, SubscriptionTier.FREE.value, db)
    set_auth_cookies(response, access, refresh, csrf)
    db.commit()

    return AuthUserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        tenant_id=tenant.id,
        tenant_slug=tenant.slug,
        role=MembershipRole.GYM_ADMIN.value,
        tier=SubscriptionTier.FREE.value,
        profile_completion_tips=_profile_completion_tips(user),
    )


@router.post('/login', response_model=AuthUserResponse, dependencies=[Depends(limit_auth_request)])
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower().strip()))
    if not user:
        raise HTTPException(status_code=401, detail='Invalid credentials')
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    user.last_login_at = datetime.now(timezone.utc)

    tenant: Tenant | None = None
    if payload.tenant_slug:
        tenant = db.scalar(select(Tenant).where(Tenant.slug == payload.tenant_slug))
        if not tenant:
            raise HTTPException(status_code=401, detail='Invalid gym slug')
    else:
        memberships = db.scalars(select(Membership).where(Membership.user_id == user.id)).all()
        if len(memberships) == 0:
            raise HTTPException(status_code=403, detail='No gym membership found')
        if len(memberships) > 1:
            raise HTTPException(status_code=400, detail='Multiple gyms found. Please provide gym slug.')
        tenant = db.get(Tenant, memberships[0].tenant_id)

    membership = db.scalar(select(Membership).where(and_(Membership.user_id == user.id, Membership.tenant_id == tenant.id)))
    if not membership:
        raise HTTPException(status_code=403, detail='No tenant membership')

    sub = db.scalar(select(Subscription).where(Subscription.tenant_id == tenant.id).order_by(Subscription.created_at.desc()))
    tier = sub.tier if sub else SubscriptionTier.FREE

    access, refresh, csrf, _ = _issue_session_tokens(user, tenant, membership.role, tier, db)
    set_auth_cookies(response, access, refresh, csrf)
    db.commit()

    return AuthUserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        tenant_id=tenant.id,
        tenant_slug=tenant.slug,
        role=membership.role,
        tier=tier,
        profile_completion_tips=_profile_completion_tips(user),
    )


@router.post('/refresh', response_model=MessageResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db), refresh_cookie: str | None = Cookie(None, alias=settings.refresh_cookie_name)):
    token = refresh_cookie
    if not token:
        raise HTTPException(status_code=401, detail='Missing refresh token')

    payload = decode_token(token)
    if payload.get('type') != 'refresh':
        raise HTTPException(status_code=401, detail='Invalid token type')

    session = db.scalar(select(AuthSession).where(AuthSession.refresh_token_hash == hash_token(token), AuthSession.revoked.is_(False)))
    if not session:
        raise HTTPException(status_code=401, detail='Session revoked')

    user = db.get(User, int(payload['sub']))
    tenant = db.get(Tenant, int(payload['tenant_id']))
    membership = db.scalar(select(Membership).where(and_(Membership.user_id == user.id, Membership.tenant_id == tenant.id)))
    sub = db.scalar(select(Subscription).where(Subscription.tenant_id == tenant.id).order_by(Subscription.created_at.desc()))
    tier = sub.tier if sub else SubscriptionTier.FREE

    session.revoked = True
    access, refresh_new, csrf, _ = _issue_session_tokens(user, tenant, membership.role, tier, db)
    set_auth_cookies(response, access, refresh_new, csrf)
    db.commit()

    return MessageResponse(message='Refreshed')


@router.post('/logout', response_model=MessageResponse)
def logout(response: Response, payload: dict = Depends(get_current_auth_payload), db: Session = Depends(get_db), refresh_cookie: str | None = Cookie(None, alias=settings.refresh_cookie_name)):
    if refresh_cookie:
        session = db.scalar(select(AuthSession).where(AuthSession.refresh_token_hash == hash_token(refresh_cookie), AuthSession.revoked.is_(False)))
        if session:
            session.revoked = True

    exp_dt = datetime.fromtimestamp(payload['exp'], tz=timezone.utc)
    revoke_token_jti(payload['jti'], exp_dt)
    db.add(RevokedToken(jti=payload['jti'], expires_at=exp_dt))
    db.commit()
    clear_auth_cookies(response)
    return MessageResponse(message='Logged out')


@router.post('/logout-all', response_model=MessageResponse)
def logout_all(response: Response, payload: dict = Depends(get_current_auth_payload), db: Session = Depends(get_db)):
    sessions = db.scalars(select(AuthSession).where(and_(AuthSession.user_id == int(payload['sub']), AuthSession.tenant_id == int(payload['tenant_id']), AuthSession.revoked.is_(False)))).all()
    for session in sessions:
        session.revoked = True
    exp_dt = datetime.fromtimestamp(payload['exp'], tz=timezone.utc)
    revoke_token_jti(payload['jti'], exp_dt)
    db.add(RevokedToken(jti=payload['jti'], expires_at=exp_dt))
    db.commit()
    clear_auth_cookies(response)
    return MessageResponse(message='Logged out from all sessions')


@router.get('/me', response_model=AuthUserResponse)
def me(payload: dict = Depends(get_current_auth_payload), db: Session = Depends(get_db)):
    user = db.get(User, int(payload['sub']))
    tenant = db.get(Tenant, int(payload['tenant_id']))
    membership = db.scalar(select(Membership).where(and_(Membership.user_id == user.id, Membership.tenant_id == tenant.id)))
    return AuthUserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        tenant_id=tenant.id,
        tenant_slug=tenant.slug,
        role=membership.role,
        tier=payload.get('tier', 'free'),
        profile_completion_tips=_profile_completion_tips(user),
    )


@router.get('/profile', response_model=ProfileResponse)
def profile(payload: dict = Depends(get_current_auth_payload), db: Session = Depends(get_db)):
    user = db.get(User, int(payload['sub']))
    return ProfileResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        age=user.age,
        gender=user.gender,
        height_cm=user.height_cm,
        weight_kg=user.weight_kg,
        photo_url=user.photo_url,
        weekday_sleep_hours=user.weekday_sleep_hours,
        weekend_sleep_hours=user.weekend_sleep_hours,
        last_login_at=user.last_login_at.isoformat() if user.last_login_at else None,
        profile_completion_tips=_profile_completion_tips(user),
    )


@router.put('/profile', response_model=ProfileResponse)
def update_profile(
    body: ProfileUpdateRequest,
    payload: dict = Depends(get_current_auth_payload),
    db: Session = Depends(get_db),
):
    user = db.get(User, int(payload['sub']))
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.age is not None:
        user.age = body.age
    if body.height_cm is not None:
        user.height_cm = body.height_cm
    if body.weight_kg is not None:
        user.weight_kg = body.weight_kg
    if body.photo_url is not None:
        user.photo_url = body.photo_url.strip() or None
    if body.weekday_sleep_hours is not None:
        user.weekday_sleep_hours = body.weekday_sleep_hours
    if body.weekend_sleep_hours is not None:
        user.weekend_sleep_hours = body.weekend_sleep_hours
    db.commit()
    db.refresh(user)
    return ProfileResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        age=user.age,
        gender=user.gender,
        height_cm=user.height_cm,
        weight_kg=user.weight_kg,
        photo_url=user.photo_url,
        weekday_sleep_hours=user.weekday_sleep_hours,
        weekend_sleep_hours=user.weekend_sleep_hours,
        last_login_at=user.last_login_at.isoformat() if user.last_login_at else None,
        profile_completion_tips=_profile_completion_tips(user),
    )
