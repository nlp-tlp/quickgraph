"""User services."""

from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from ..settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


async def authenticate_user(collection, username: str, password: str):
    user = await collection.find_one({"username": username})
    if not user or not verify_password(password, user["hashed_password"]):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta):
    """Create JWT token wth user data embedded."""
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.auth.secret_key.get_secret_value(),
        algorithm=settings.auth.algorithm,
    )
    return encoded_jwt


def verify_security_answer(plain_answer: str, hashed_answer: str) -> bool:
    return pwd_context.verify(plain_answer, hashed_answer)
