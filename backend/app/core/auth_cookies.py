from fastapi import Response

from app.core.config import settings


def set_auth_cookies(response: Response, access_token: str, refresh_token: str, csrf_token: str) -> None:
    common = {
        'httponly': True,
        'secure': settings.cookie_secure,
        'samesite': settings.cookie_samesite,
        'domain': settings.cookie_domain,
        'path': '/',
    }
    response.set_cookie(settings.access_cookie_name, access_token, max_age=settings.access_token_expires_minutes * 60, **common)
    response.set_cookie(settings.refresh_cookie_name, refresh_token, max_age=settings.refresh_token_expires_days * 86400, **common)
    response.set_cookie(
        settings.csrf_cookie_name,
        csrf_token,
        max_age=settings.refresh_token_expires_days * 86400,
        httponly=False,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
        path='/',
    )


def clear_auth_cookies(response: Response) -> None:
    for cookie_name in [settings.access_cookie_name, settings.refresh_cookie_name, settings.csrf_cookie_name]:
        response.delete_cookie(cookie_name, domain=settings.cookie_domain, path='/')
