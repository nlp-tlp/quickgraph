"""User routes."""

import logging
from datetime import datetime, timedelta
from typing import Dict

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from passlib.context import CryptContext

from ..dependencies import get_db, get_user
from ..settings import settings
from .schemas import (
    SecurityQuestionReset,
    UserCreate,
    UserDocumentModel,
    UserOut,
    UserUpdate,
)
from .services import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    verify_security_answer,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@router.post("/register")
async def register_user_endpoint(
    user: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    logger.info(f"Registering user: {user}")

    existing_user = await db.users.find_one({"username": user.username})

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already registered",
        )

    hashed_password = get_password_hash(user.password)
    hashed_security_answer = get_password_hash(user.security_answer)
    db_user = UserDocumentModel(
        username=user.username,
        hashed_password=hashed_password,
        name=user.name,
        email=user.email,
        api_key=ObjectId(),
        security_question=user.security_question,
        hashed_security_answer=hashed_security_answer,
    )

    await db.users.insert_one(db_user.model_dump(by_alias=True, exclude={"id"}))

    return {"detail": "User registered successfully"}


@router.post("/token")
async def get_token_endpoint(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user = await authenticate_user(
        collection=db.users, username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.auth.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/profile", response_model=UserOut)
async def get_user_profile_endpoint(
    user: UserDocumentModel = Depends(get_user),
):
    logger.info(f"Getting user profile: {user}")
    return UserOut(**user.model_dump())


@router.get("/{user_id}", response_model=UserOut)
async def get_user_endpoint(user_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    logger.info(f"Getting user with id: {user_id}")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' not found",
        )
    return UserOut(**user)


@router.delete("/{user_id}")
async def delete_user_endpoint(
    user_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' not found",
        )

    await db.users.delete_one({"_id": ObjectId(user_id)})

    return {"message": f"User with id '{user_id}' deleted successfully"}


@router.put("")
async def update_user_endpoint(
    body: UserUpdate,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    logger.info(f"Updating user with id: {user.id}: {body}")
    update_data: Dict = body.model_dump(exclude_none=True, by_alias=True)

    # Check if email is being updated
    if "email" in update_data and update_data["email"] != user.email:
        # Check if the new email is already in use
        existing_user = await db.users.find_one({"email": update_data["email"]})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already in use",
            )

    if body.security_answer:
        update_data["hashed_security_answer"] = get_password_hash(body.security_answer)
        update_data.pop("security_answer")

    updated_at = datetime.utcnow()
    update_data["updated_at"] = updated_at
    update = await db.users.update_one(
        {"_id": ObjectId(user.id)},
        {
            "$set": update_data,
        },
        upsert=True,
    )

    if update.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not updated",
        )

    return {"detail": "User updated successfully"}


@router.post("/reset-password")
async def reset_password_endpoint(
    reset: SecurityQuestionReset,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user = await db.users.find_one({"username": reset.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user["security_question"] != reset.security_question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect security question",
        )

    if not verify_security_answer(
        reset.security_answer, user["hashed_security_answer"]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect security answer",
        )

    hashed_password = get_password_hash(reset.new_password)
    current_time = datetime.utcnow()
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"hashed_password": hashed_password, "updated_at": current_time}},
    )

    return {"detail": "Password reset successfully"}


# -------------


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
