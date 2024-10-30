"""Settings."""

from functools import lru_cache
from typing import List

from pydantic import BaseModel, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class SettingsMongoDB(BaseModel):
    database_name: str
    uri: str
    collection_names: List[str] = [
        "data",
        "datasets",
        "notifications",
        "resources",
        "projects",
        "markup",
    ]


class SettingsAPI(BaseModel):
    system_username: str = "system"
    system_default_dir: str = "./system"
    dummy_username: str = "janedoe"


class SettingsAuth0(BaseModel):
    domain: str
    api_audience: str
    algorithms: str
    issuer: str
    mgmt_client_id: str
    mgmt_secret: str


class SettingsAuth(BaseModel):
    secret_key: SecretStr = Field(...)
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=360)

    @property
    def secret_key_value(self) -> str:
        return self.secret_key.get_secret_value()


class Settings(BaseSettings):
    mongodb: SettingsMongoDB
    api: SettingsAPI = SettingsAPI()
    auth0: SettingsAuth0
    auth: SettingsAuth

    model_config = SettingsConfigDict(
        env_file=".env", env_nested_delimiter="__", env_file_encoding="utf-8"
    )


@lru_cache()
def get_settings() -> Settings:
    """Get settings."""
    return Settings()  # type: ignore


settings = get_settings()
