import os
from pydantic import BaseSettings


class Settings(BaseSettings):
    TEST_USERNAME: str = "tyler-research"
    SECONDARY_TEST_USERNAME: str = "dummy-user"
    SYSTEM_USERNAME: str = "system"

    MONGO_DB_USERNAME: str = "<ENTER_DB_USERNAME>"
    MONGO_DB_PASSWORD: str = "<ENTER_DB_PASSWORD>"
    MONGO_CLUSTER_NAME: str = "<ENTER_CLUSTER_NAME>"
    MONGO_DB_NAME: str = "<ENTER_DB_NAME>"
    MONGO_URI: str = "<ENTER_URI>"

    AUTH0_DOMAIN: str = "<ENTER_HERE>"
    AUTH0_API_AUDIENCE: str = "<ENTER_HERE>"
    AUTH0_ALGORITHMS: str = "<ENTER_HERE>"
    AUTH0_ISSUER: str = "<ENTER_HERE>"
    AUTH0_MGMT_CLIENT_ID: str = "<ENTER_HERE>"
    AUTH0_MGMT_SECRET: str = "<ENTER_HERE>"

    class Config:
        env_file = os.path.join(
            os.path.dirname(__file__), "test.env"
        )  # TODO: make this conditional using the `mode` variable
        env_file_encoding = "utf-8"


settings = Settings()
