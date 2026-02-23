import os
from dataclasses import dataclass


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str
    app_port: int
    cors_origins: list[str]
    cors_origin_regex: str
    database_url: str
    redis_url: str
    secret_key: str


def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "game-theory-api"),
        app_env=os.getenv("APP_ENV", "development"),
        app_port=int(os.getenv("APP_PORT", "8000")),
        cors_origins=_split_csv(
            os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
        ),
        cors_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"^https://.*\.vercel\.app$"),
        database_url=os.getenv("DATABASE_URL", ""),
        redis_url=os.getenv("REDIS_URL", ""),
        secret_key=os.getenv("SECRET_KEY", "change-me"),
    )
