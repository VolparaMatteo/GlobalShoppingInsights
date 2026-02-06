from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./gsi.db"
    SECRET_KEY: str = "change-me-to-a-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = '["http://localhost:5173"]'
    ADMIN_EMAIL: str = "admin@gsi.local"
    ADMIN_PASSWORD: str = "admin123"
    WP_ENCRYPTION_KEY: str = "change-me-to-a-random-key"

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
