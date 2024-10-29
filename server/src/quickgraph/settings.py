from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PORT: int = 8000
    ENV: str = ""
    SYSTEM_USERNAME: str = "system"

    MONGO_DB_USERNAME: str = "<ENTER_DB_USERNAME>"
    MONGO_DB_PASSWORD: str = "<ENTER_DB_PASSWORD>"
    MONGO_CLUSTER_NAME: str = "<ENTER_CLUSTER_NAME>"
    MONGO_DB_NAME: str = "<ENTER_DB_NAME>"
    MONGO_URI: str = "<ENTER_URI>"
    MONGO_COLLECTION_NAMES: list = [
        "data",
        "datasets",
        "notifications",
        "resources",
        "projects",
        "markup",
    ]

    AUTH0_DOMAIN: str = "<ENTER_HERE>"
    AUTH0_API_AUDIENCE: str = "<ENTER_HERE>"
    AUTH0_ALGORITHMS: str = "<ENTER_HERE>"
    AUTH0_ISSUER: str = "<ENTER_HERE>"
    AUTH0_MGMT_CLIENT_ID: str = "<ENTER_HERE>"
    AUTH0_MGMT_SECRET: str = "<ENTER_HERE>"

    EXAMPLE_USERNAME: str = "<ENTER_USERNAME>"

    SYSTEM_DEFAULTS_DIR: str = "./system"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
