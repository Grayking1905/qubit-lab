import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Look in backend/.env first, then fall back to a .env one level up
    # (project root) since that's where this repo's .env actually lives.
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    database_url: str = ""
    direct_url: str = ""

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days

    cors_origins: str = "http://localhost:3000"

    groq_api_key: str = ""
    # Groq's model lineup changes over time; verify against
    # https://console.groq.com/docs/models if this stops working.
    groq_model: str = "openai/gpt-oss-120b"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

# Prisma's query engine reads DATABASE_URL/DIRECT_URL directly from the
# process environment, not from this Settings object, so mirror them back.
os.environ.setdefault("DATABASE_URL", settings.database_url)
os.environ.setdefault("DIRECT_URL", settings.direct_url)
