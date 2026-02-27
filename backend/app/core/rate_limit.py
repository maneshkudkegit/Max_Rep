from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Deque

from fastapi import HTTPException, Request


RATE_LIMIT = 20
WINDOW_SECONDS = 60
_buckets: dict[str, Deque[datetime]] = defaultdict(deque)


def limit_auth_request(request: Request) -> None:
    key = request.client.host if request.client else 'unknown'
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=WINDOW_SECONDS)
    bucket = _buckets[key]
    while bucket and bucket[0] < cutoff:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail='Too many requests')
    bucket.append(now)
