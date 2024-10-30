"""Notifications services."""

from typing import List

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from .schemas import CreateNotification, Notification, NotificationContext


async def find_many_notifications(db: AsyncIOMotorDatabase, username: str):
    """Finds all notifications associated with a given user"""
    return await db["notifications"].find({"recipient": username}).to_list(None)


async def find_many_project_notifications(
    db: AsyncIOMotorDatabase, project_id: ObjectId, username: str = None
) -> List[Notification]:
    """Finds notifications related to a specific project"""
    _filter = {
        **{"content_id": project_id},
        **({"recipient": username} if username else {}),
    }
    notifications = await db["notifications"].find(_filter).to_list(None)
    return [Notification(**n) for n in notifications]


async def create_notification(
    db: AsyncIOMotorDatabase, notification: CreateNotification
) -> Notification:
    """Creates a notification."""
    created_notification = await db["notifications"].insert_one(
        notification.model_dump()
    )
    notification = await db["notifications"].find_one(
        {"_id": created_notification.inserted_id}
    )
    return Notification(**notification)


async def create_many_project_invitations(
    db: AsyncIOMotorDatabase,
    project_id: ObjectId,
    project_name: str,
    recipients: List[str],
    username: str,
):
    """Sends project invitations to users."""
    notification_docs = [
        CreateNotification(
            recipient=recipient,
            created_by=username,
            context=NotificationContext.invitation,
            content_id=project_id,
            detail={"name": project_name},
        ).model_dump()
        for recipient in recipients
    ]
    await db["notifications"].insert_many(notification_docs)
    return await find_many_project_notifications(db=db, project_id=project_id)
