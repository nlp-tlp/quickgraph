"""Social Router."""

from typing import Dict, List, Union

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

import services.dataset as dataset_services
from dependencies import get_current_active_user, get_db
from models.social import BaseComment, Comment, Context, CreateComment
from models.user import User

router = APIRouter(prefix="/social", tags=["Social"])


@router.post("/{dataset_item_id}")
async def create_one_comment(
    body: CreateComment,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a single comment"""
    print("body", body)
    print("body.dict()", body.dict())

    try:
        comment = await db["social"].insert_one(
            {**body.dict(), "created_by": current_user.username}
        )

        new_comment = await db["social"].find_one({"_id": comment.inserted_id})

        return Comment(**new_comment, read_only=False)
    except Exception as e:
        print(e)


# @router.patch("/{comment_id}")
# async def update_one_comment(
#     current_user: User = Depends(get_current_active_user),
#     db: AsyncIOMotorDatabase = Depends(get_db),
# ):
#     pass


@router.delete("/{comment_id}")
async def delete_one_comment(
    comment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Deletes a single comment"""

    comment_id = ObjectId(comment_id)

    # Delete comment
    await db["social"].delete_one(
        {"_id": comment_id, "created_by": current_user.username}
    )

    # Make sure it is deleted
    comment = await db["social"].find_one({"_id": comment_id})

    if comment:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete comment",
        )

    return "Succesfully deleted comment"


@router.get(
    "/{dataset_item_id}",
    # response_description="List datasets",
    # response_model=Union[List[Dataset], list],
    # response_model_exclude_none=True,
)
async def list_dataset_item_comments(
    dataset_item_id: str,
    context: Context,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Gets all comments made against a single dataset item for a given context"""

    print("dataset_item_id", dataset_item_id)
    print("context", context)

    comments = (
        await db["social"]
        .find({"dataset_item_id": ObjectId(dataset_item_id), "context": context})
        .to_list(None)
    )

    return [Comment(**c) for c in comments]

    # try:
    #     datasets = await dataset_services.list_datasets(
    #         db=db,
    #         username=current_user.username,
    #         include_dataset_size=include_dataset_size,
    #         include_system=include_system,
    #     )
    # except Exception as e:
    #     print(e)

    # # TODO: investigate why `id` isnt being serialised out, `_id` is.

    # if len(datasets) == 0:
    #     return []

    # return datasets
    pass
