from __future__ import annotations

from typing import Any, List, Tuple, Type

from pydantic_settings import BaseSettings, EnvSettingsSource, SettingsConfigDict


class _EnvSource(EnvSettingsSource):
    """Custom env source that tolerates plain-string or comma-separated CORS_ORIGINS."""

    def decode_complex_value(self, field_name: str, field_info: Any, value: Any) -> Any:
        if field_name == "CORS_ORIGINS" and isinstance(value, str):
            stripped = value.strip()
            if not stripped.startswith("["):
                return list(filter(None, (o.strip() for o in stripped.split(","))))
        return super().decode_complex_value(field_name, field_info, value)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    MONGODB_URL: str = "mongodb://mongodb:27017"
    DATABASE_NAME: str = "craftcommerce"
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: Type[BaseSettings],
        init_settings: Any,
        env_settings: Any,
        dotenv_settings: Any,
        file_secret_settings: Any,
    ) -> Tuple[Any, ...]:
        custom_env = _EnvSource(
            settings_cls,
            case_sensitive=env_settings.case_sensitive,
            env_prefix=env_settings.env_prefix,
            env_nested_delimiter=env_settings.env_nested_delimiter,
            env_ignore_empty=env_settings.env_ignore_empty,
            env_parse_none_str=env_settings.env_parse_none_str,
        )
        return init_settings, custom_env, dotenv_settings, file_secret_settings


settings = Settings()
