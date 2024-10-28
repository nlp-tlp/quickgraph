"""Social models."""

from datetime import datetime
from enum import Enum

from bson import ObjectId
from models.base import PydanticObjectIdAnnotated
from pydantic import BaseModel, ConfigDict, Field


class Context(str, Enum):
    # Contexts allow the comments to be filtered based on where they should be rendered in the front-end
    annotation = "annotation"
    adjudication = "adjudication"


class BaseComment(BaseModel):
    text: str = Field(description="The text content of the comment")
    context: Context = Field(description="The context the comment is created in")
    dataset_item_id: PydanticObjectIdAnnotated = Field(
        description="The UUID of the dataset item associated with the comments"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="The Data/Time the comment was created",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="The Data/Time the comment was last updated",
    )

    model_config = ConfigDict(use_enum_values=True, arbitrary_types_allowed=True)


class CreateComment(BaseComment):
    pass


class Comment(BaseComment):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    created_by: str = Field(
        description="The username of the user who created the comment"
    )
    read_only: bool = Field(default=True)

    model_config = ConfigDict(arbitrary_types_allowed=True)
