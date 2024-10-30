"""Dependencies."""

import logging
from typing import AsyncGenerator, Optional

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorDatabase

from .database import get_client
from .settings import Settings, get_settings
from .users.schemas import UserDocumentModel

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_db(
    settings: Settings = Depends(get_settings),
) -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """Yield a MongoDB database instance."""
    client = get_client()
    if client is None:
        logger.info("Failed to connect to MongoDB client.")
        raise ConnectionError("Failed to retrieve MongoDB client.")

    db = client[settings.mongodb.database_name]
    # logger.info(f"Connected to database: {db.name}")
    try:
        yield db
    finally:
        if db is not None:
            # logger.info(f"Releasing connection to database: {db.name}")
            pass


async def get_user(
    token: str = Depends(oauth2_scheme),
    settings: Settings = Depends(get_settings),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserDocumentModel:
    """Retrieve a user from the database."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.auth.secret_key_value,
            algorithms=[settings.auth.algorithm],
        )
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception

    return UserDocumentModel(**user)


async def get_active_project_user(
    project_id: str,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserDocumentModel:
    """
    Authenticates the user for a given project.
    Returns the user if they are either the project creator or an active annotator.
    Raises HTTP 401 if unauthorized.
    """

    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    username = user.username

    # Check if user is creator
    if project["created_by"] == username:
        return user

    # Check if user is active annotator
    is_active_annotator = any(
        a["username"] == username and a["state"] == "accepted" and not a["disabled"]
        for a in project["annotators"]
    )

    if not is_active_annotator:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not authorized for this project.",
        )

    return user


async def valid_project_manager(
    project_id: str,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserDocumentModel:
    """
    Authenticates if the user is the project manager (creator).
    Returns the user if they are the project creator.
    Raises HTTP 404 if project not found.
    Raises HTTP 401 if user is not the project manager.
    """
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    username = user.username
    if project["created_by"] == username:
        return user
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Access denied. Only the project manager can perform this action.",
        )
