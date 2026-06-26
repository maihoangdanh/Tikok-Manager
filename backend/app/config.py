from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./dm.db"
    secret_key: str = "dev-secret-key"
    access_token_expire_minutes: int = 480
    refresh_token_expire_days: int = 30
    encryption_key: str = "0" * 64
    tiktok_ads_base_url: str = "https://business-api.tiktok.com/open_api/v1.3"
    tiktok_shop_base_url: str = "https://open-api.tiktok.com"
    admin_email: str = "admin@example.com"
    admin_password: str = "changeme"

    class Config:
        env_file = ".env"

settings = Settings()
