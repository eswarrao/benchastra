from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/benchbridge"
    SECRET_KEY: str = "cf95001114dd347529ea86920a684ef83ffc347bef265fa85af4dce4b406d779"
    ALGORITHM: str = "HS256"
    # CHANGE THESE VALUES:
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days (was 30 minutes)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days (was 7 days)
    
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:5173"
    
    class Config:
        env_file = ".env"

settings = Settings()