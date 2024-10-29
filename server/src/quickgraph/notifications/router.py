"""Notifications router."""

from typing import List, Union

from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..dependencies import get_current_active_user, get_db
from ..notifications.schemas import Notification, NotificationStates
from ..user.schemas import User
from .services import find_many_notifications

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# @router.get("", response_model=Union[List, List[Notification]])
@router.get(
    "/",
    # response_model=Union[List, List[Notification]]
)
async def list_notifications(
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    print(f"Fetching notifications for {current_user.username}")

    notifications = await find_many_notifications(db=db, username=current_user.username)

    # print("notifications", notifications)

    # notifications_v2 = [Notification(**n) for n in notifications]
    # print("notifications_v2", notifications_v2)
    # return notifications_v2

    # TODO: refactor this once new notification items are added to the application
    projects = (
        await db["projects"]
        .find({"_id": {"$in": [n["content_id"] for n in notifications]}}, {"name": 1})
        .to_list(None)
    )

    id2project = {str(p["_id"]): {"name": p["name"]} for p in projects}

    # print("projects", projects)

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
    ]  # TODO: figuree out why noticications model doesnt serialize...


@router.post("/")
async def create_notification(
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    pass


@router.patch("/{notification_id}/invite")
async def invite_notification(
    notification_id: str,
    accepted: bool,
    # current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # TODO: update based on conditional invite information; but for now all are project invitations
    # print("hello world")

    notification_id = ObjectId(notification_id)

    # Retrieve the notification from the database using the ID
    notification = await db["notifications"].find_one(
        {"_id": notification_id}
    )  # get_notification_by_id(notification_id)

    # print("notification", notification)

    if accepted:
        # Update the notification to indicate that it was accepted
        try:
            await db["notifications"].update_one(
                {"_id": notification_id},
                {"$set": {"state": NotificationStates.accepted.value, "seen": True}},
            )
            # print("Updated notification")
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
            # print("Updated project")
        except Exception as e:
            print(f"Error occurred: {e}")

    else:
        # Update the notification to indicate that it was declined
        try:
            await db["notifications"].update_one(
                {"_id": notification_id},
                {"$set": {"state": NotificationStates.declined.value, "seen": True}},
            )
            # print("Updated notification")

            await db["projects"].update_one(
                {
                    "_id": notification["content_id"],
                    "annotators.username": notification["recipient"],
                },
                {"$set": {"annotators.$.state": NotificationStates.declined.value}},
            )  # Content id is the project_id if notification is an invitation.
            # print("Updated project")
        except Exception as e:
            print(f"Error occurred: {e}")

    return {"message": f"Notification updated successfully."}
