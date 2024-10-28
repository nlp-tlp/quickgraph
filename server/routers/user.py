"""User routes."""

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from dependencies import get_current_active_user, get_user_management_access_token
from models.user import User
from settings import settings

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/notifications")
async def get_notifications():
    # `/invitations`
    pass


@router.patch("/invitation")
async def update_invitation():
    # TODO: migrate /accept and /decline endpoints into single endpoint
    pass


@router.get("/")
async def list_users():
    pass


# @router.get("/{username}")
# async def get_user():
#     # TODO: scope be scoped, only valid user can get response. Add dependency.
#     return {"hello": "world"}


@router.get("/profile")
async def get_user_profile(
    current_user: User = Depends(get_current_active_user),
    mgmt_access_token=Depends(get_user_management_access_token),
):
    try:

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://{settings.AUTH0_DOMAIN}/api/v2/users/{current_user.sub}",
                params={
                    "include_fields": True,
                    "fields": ",".join(
                        ["email", "user_metadata", "updated_at", "username"]
                    ),
                },
                headers={
                    "Authorization": f"Bearer {mgmt_access_token}",
                    "Content-Type": "application/json",
                },
            )
        response.raise_for_status()  # raise exception for non-2xx response
        return response.json()
    except Exception as error:
        # logger.error(f"Failed to fetch user profile data - {error}", route="/api/user/profile")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error)
        )


class ProfileUpdateBody(BaseModel):
    color: str = Field(description="The users customization color for their avatar")


@router.patch("/profile")
async def update_user_profile(
    body: ProfileUpdateBody,
    current_user: User = Depends(get_current_active_user),
    mgmt_access_token=Depends(get_user_management_access_token),
):
    try:
        # logger.info("Updating user profile")
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"https://{settings.AUTH0_DOMAIN}/api/v2/users/{current_user.sub}",
                json={
                    "user_metadata": {
                        "color": body.color,
                    },
                },
                headers={
                    "Authorization": f"Bearer {mgmt_access_token}",
                    "Content-Type": "application/json",
                },
            )
        response.raise_for_status()  # raise exception for non-2xx response
        return response.json()
    except Exception as error:
        # logger.error(f"Failed to update user profile - {error}", route="/api/user/profile")
        raise HTTPException(status_code=500, detail=str(error))
