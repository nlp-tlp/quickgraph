"""User models."""

from pydantic import BaseModel, ConfigDict, Field


class User(BaseModel):
    username: str = Field(
        decsription="The users username", alias="https://example.com/username"
    )
    sub: str = Field(description="The users UUID")

    model_config = ConfigDict(populate_by_name=True)
