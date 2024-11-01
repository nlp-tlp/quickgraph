"""Notifications router."""

import logging
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..dependencies import get_db, get_user
from ..notifications.schemas import Notification, NotificationStates
from ..users.schemas import UserDocumentModel
from .services import find_many_notifications

router = APIRouter(prefix="/notifications", tags=["Notifications"])

logger = logging.getLogger(__name__)


@router.get("", response_model=List[Notification])
async def list_notifications(
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    logger.info(f"Fetching notifications for {user.username}")
    notifications = await find_many_notifications(db=db, username=user.username)

    # TODO: refactor this once new notification items are added to the application
    projects = (
        await db["projects"]
        .find({"_id": {"$in": [n["content_id"] for n in notifications]}}, {"name": 1})
        .to_list(None)
    )

    id2project = {str(p["_id"]): {"name": p["name"]} for p in projects}
    return [
        {
            "id": str(n["_id"]),
            "recipient": n["recipient"],
            "created_by": n["created_by"],
            "created_at": n["created_at"],
            "context": n["context"],
            "seen": n["seen"],
            "content_id": str(n["content_id"]),
            "detail": id2project[str(n["content_id"])],
        }
        for n in notifications
    ]


@router.post("/")
async def create_notification(
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    pass


@router.patch("/{notification_id}/invite")
async def invite_notification(
    notification_id: str,
    accepted: bool,
    # user: User = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # TODO: update based on conditional invite information; but for now all are project invitations
    notification_id = ObjectId(notification_id)

    # Retrieve the notification from the database using the ID
    notification = await db["notifications"].find_one(
        {"_id": notification_id}
    )  # get_notification_by_id(notification_id)

    if accepted:
        # Update the notification to indicate that it was accepted
        await db["notifications"].update_one(
            {"_id": notification_id},
            {"$set": {"state": NotificationStates.accepted.value, "seen": True}},
        )
        # Add user to project and icnrement annotators_per_item by one unit (PM can reduce this)
        await db["projects"].update_one(
            {
                "_id": notification["content_id"],
                "annotators.username": notification["recipient"],
            },
            {
                "$set": {"annotators.$.state": NotificationStates.accepted.value},
                "$inc": {"settings.annotators_per_item": 1},
            },
        )  # Content id is the project_id if notification is an invitation.
    else:
        # Update the notification to indicate that it was declined
        await db["notifications"].update_one(
            {"_id": notification_id},
            {"$set": {"state": NotificationStates.declined.value, "seen": True}},
        )
        await db["projects"].update_one(
            {
                "_id": notification["content_id"],
                "annotators.username": notification["recipient"],
            },
            {"$set": {"annotators.$.state": NotificationStates.declined.value}},
        )  # Content id is the project_id if notification is an invitation.
    return {"message": "Notification updated successfully."}
