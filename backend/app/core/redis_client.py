from datetime import datetime, timezone

import redis

from app.core.config import settings


_redis = redis.Redis.from_url(settings.redis_url, decode_responses=True)


def is_token_revoked(jti: str) -> bool:
    try:
        return _redis.exists(f'revoked:{jti}') == 1
    except Exception:
        return False


def revoke_token_jti(jti: str, exp: datetime) -> None:
    ttl = int((exp - datetime.now(timezone.utc)).total_seconds())
    if ttl <= 0:
        return
    try:
        _redis.setex(f'revoked:{jti}', ttl, '1')
    except Exception:
        pass
