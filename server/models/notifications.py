"""
Notifications model that will house project invitations, activity information, etc.
"""

from bson import ObjectId
from typing import Union
from pydantic import BaseModel, Field
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime

from models.utils import PyObjectId


class NotificationTextTemplates(Enum):
    project_invitation = ""


class NotificationContext(Enum):
    invitation = "invitation"
    resource = "resource"


class NotificationStates(Enum):
    accepted = "accepted"
    declined = "declined"


class CreateNotification(BaseModel):
    # TODO: implement these fields.
    # link: Union[None, str] = Field(
    #     default=None, description="Link to the relevant item for this notification"
    # )
    # text: str = Field(description="The text of this notification")
    recipient: str = Field(description="The username of the receiving user")
    created_by: str = Field(description="The username of the sending user")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Date/Time project was created"
    )
    context: NotificationContext = Field(description="The context of this notification")
    seen: bool = Field(
        default=False, description="Whether the user has seen this notification"
    )
    content_id: Union[None, PyObjectId] = Field(
        default_factory=PyObjectId,
        description="The UUID associated with notification content",
    )
    status: Union[None, NotificationStates] = Field(
        default=None,
        description="The state associated with the notification (if applicable)",
    )

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        use_enum_values = True


class Notification(CreateNotification):
    id: PyObjectId = Field(
        default_factory=PyObjectId,
        alias="_id",
        description="The UUID of the notification",
    )

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        use_enum_values = True
