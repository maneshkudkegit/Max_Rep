from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = 'Max Rep API'
    app_env: str = 'development'
    secret_key: str = 'change-me'
    algorithm: str = 'HS256'

    database_url: str = 'postgresql+psycopg2://maxrep:maxrep@postgres:5432/maxrep'
    redis_url: str = 'redis://redis:6379/0'

    cors_origins: str = 'http://localhost:5173'

    access_token_expires_minutes: int = 15
    refresh_token_expires_days: int = 14

    cookie_secure: bool = False
    cookie_samesite: str = 'lax'
    cookie_domain: str | None = None
    access_cookie_name: str = 'maxrep_access'
    refresh_cookie_name: str = 'maxrep_refresh'
    csrf_cookie_name: str = 'maxrep_csrf'

    stripe_secret_key: str = 'sk_test_replace'
    stripe_webhook_secret: str = 'whsec_replace'
    stripe_price_free: str = 'price_free'
    stripe_price_pro: str = 'price_pro'
    stripe_price_premium: str = 'price_premium'

    resend_api_key: str = 're_replace'
    resend_from_email: str = 'no-reply@maxrep.app'

    reminder_cutoff_hour: int = 19

    superadmin_email: str = 'superadmin@maxrep.app'
    superadmin_password: str = 'SuperAdmin123!'

    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    @property
    def cors_origin_list(self) -> list[str]:
        return [i.strip() for i in self.cors_origins.split(',') if i.strip()]


settings = Settings()
