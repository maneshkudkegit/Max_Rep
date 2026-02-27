from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(schemes=['argon2'], deprecated='auto')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def _create_token(claims: dict, expires_delta: timedelta) -> str:
    payload = claims.copy()
    payload['exp'] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(*, user_id: int, tenant_id: int, role: str, tier: str, sid: str) -> tuple[str, str]:
    jti = secrets.token_urlsafe(24)
    token = _create_token(
        {
            'sub': str(user_id),
            'tenant_id': tenant_id,
            'role': role,
            'tier': tier,
            'sid': sid,
            'jti': jti,
            'type': 'access',
        },
        timedelta(minutes=settings.access_token_expires_minutes),
    )
    return token, jti


def create_refresh_token(*, user_id: int, tenant_id: int, sid: str, family_id: str) -> tuple[str, str]:
    jti = secrets.token_urlsafe(24)
    token = _create_token(
        {
            'sub': str(user_id),
            'tenant_id': tenant_id,
            'sid': sid,
            'family_id': family_id,
            'jti': jti,
            'type': 'refresh',
        },
        timedelta(days=settings.refresh_token_expires_days),
    )
    return token, jti


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def expires_at_for(token_type: str) -> datetime:
    now = datetime.now(timezone.utc)
    if token_type == 'access':
        return now + timedelta(minutes=settings.access_token_expires_minutes)
    return now + timedelta(days=settings.refresh_token_expires_days)


def random_token(size: int = 24) -> str:
    return secrets.token_urlsafe(size)
