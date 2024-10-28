from typing import List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from bson import ObjectId

from models.utils import PyObjectId


class Context(str, Enum):
    # Contexts allow the comments to be filtered based on where they should be rendered in the front-end
    annotation = "annotation"
    adjudication = "adjudication"


class BaseComment(BaseModel):
    text: str = Field(description="The text content of the comment")
    context: Context = Field(description="The context the comment is created in")
    dataset_item_id: PyObjectId = Field(
        description="The UUID of the dataset item associated with the comments",
        alis="dataset_item_id",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="The Data/Time the comment was created",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="The Data/Time the comment was last updated",
    )

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        use_enum_values = True


class CreateComment(BaseComment):
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        use_enum_values = True


class Comment(BaseComment):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_by: str = Field(
        description="The username of the user who created the comment"
    )
    read_only: bool = Field(default=True)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        use_enum_values = True
