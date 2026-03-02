from __future__ import annotations

import json
from typing import Any, List, Tuple, Type

from pydantic.fields import FieldInfo
from pydantic_settings import BaseSettings, EnvSettingsSource, SettingsConfigDict
from pydantic_settings.main import PydanticBaseSettingsSource


class _CORSAwareEnvSource(EnvSettingsSource):
    """EnvSettingsSource that accepts a comma-separated string for CORS_ORIGINS."""

    def decode_complex_value(self, field_name: str, field: FieldInfo, value: Any) -> Any:
        if field_name == "CORS_ORIGINS" and isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return [origin.strip() for origin in value.split(",") if origin.strip()]
        return super().decode_complex_value(field_name, field, value)


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
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> Tuple[PydanticBaseSettingsSource, ...]:
        assert isinstance(env_settings, EnvSettingsSource)
        return (
            init_settings,
            _CORSAwareEnvSource(
                settings_cls,
                case_sensitive=env_settings.case_sensitive,
                env_prefix=env_settings.env_prefix,
                env_nested_delimiter=env_settings.env_nested_delimiter,
                env_ignore_empty=env_settings.env_ignore_empty,
                env_parse_none_str=env_settings.env_parse_none_str,
            ),
            dotenv_settings,
            file_secret_settings,
        )


settings = Settings()
