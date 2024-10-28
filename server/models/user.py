from pydantic import BaseModel, Field


class User(BaseModel):
    username: str = Field(
        decsription="The users username", alias="https://example.com/username"
    )
    sub: str = Field(description="The users UUID")

    class Config:
        allow_population_by_field_name = True
