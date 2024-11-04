"""Social Router."""

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..dependencies import get_db, get_user
from ..users.schemas import UserDocumentModel
from .schemas import Comment, Context, CreateComment
from ..settings import settings

router = APIRouter(prefix=f"{settings.api.prefix}/social", tags=["Social"])


@router.post("/{dataset_item_id}")
async def create_one_comment(
    body: CreateComment,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a single comment"""
    comment = await db.social.insert_one(
        {**body.model_dump(), "created_by": user.username}
    )

    new_comment = await db.social.find_one({"_id": comment.inserted_id})

    if new_comment is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create comment",
        )

    return Comment(**new_comment, read_only=False)


# @router.patch("/{comment_id}")
# async def update_one_comment(
#     user: UserDocumentModel = Depends(get_user),
#     db: AsyncIOMotorDatabase = Depends(get_db),
# ):
#     pass


@router.delete("/{comment_id}")
async def delete_one_comment(
    comment_id: str,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Deletes a single comment"""

    comment_id = ObjectId(comment_id)

    # Delete comment
    await db["social"].delete_one({"_id": comment_id, "created_by": user.username})

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
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Gets all comments made against a single dataset item for a given context"""
    comments = await db.social.find(
        {"dataset_item_id": ObjectId(dataset_item_id), "context": context}
    ).to_list(None)

    return [Comment(**c) for c in comments]
