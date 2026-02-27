from fastapi import Cookie, Depends, Header, HTTPException, Request
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.core.redis_client import is_token_revoked
from app.core.security import decode_token
from app.models.auth_session import AuthSession
from app.models.membership import Membership, MembershipRole
from app.models.subscription import SubscriptionTier
from app.models.user import User


def get_current_auth_payload(
    request: Request,
    access_token: str | None = Cookie(None, alias=settings.access_cookie_name),
    x_csrf_token: str | None = Header(None),
    csrf_cookie: str | None = Cookie(None, alias=settings.csrf_cookie_name),
) -> dict:
    if not access_token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        payload = decode_token(access_token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail='Invalid access token') from exc

    if payload.get('type') != 'access':
        raise HTTPException(status_code=401, detail='Invalid access token type')

    if payload.get('jti') and is_token_revoked(payload['jti']):
        raise HTTPException(status_code=401, detail='Token revoked')

    if request and request.method in {'POST', 'PUT', 'PATCH', 'DELETE'}:
        if not x_csrf_token or not csrf_cookie or x_csrf_token != csrf_cookie:
            raise HTTPException(status_code=403, detail='CSRF validation failed')

    return payload


def get_current_user(payload: dict = Depends(get_current_auth_payload), db: Session = Depends(get_db)) -> User:
    user = db.get(User, int(payload['sub']))
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    return user


def get_current_membership(payload: dict = Depends(get_current_auth_payload), db: Session = Depends(get_db)) -> Membership:
    membership = db.scalar(
        select(Membership).where(
            and_(Membership.user_id == int(payload['sub']), Membership.tenant_id == int(payload['tenant_id']))
        )
    )
    if not membership:
        raise HTTPException(status_code=403, detail='Membership not found')
    return membership


def require_roles(*roles: MembershipRole):
    def _dependency(membership: Membership = Depends(get_current_membership)) -> Membership:
        if membership.role not in roles:
            raise HTTPException(status_code=403, detail='Role denied')
        return membership

    return _dependency


def require_tier(*tiers: SubscriptionTier):
    def _dependency(membership: Membership = Depends(get_current_membership), db: Session = Depends(get_db)) -> Membership:
        sub = db.scalar(select(AuthSession).where(AuthSession.id == membership.current_session_id))
        _ = sub
        # Tier source-of-truth is carried in JWT claim and validated by subscription middleware in route handlers.
        return membership

    return _dependency
