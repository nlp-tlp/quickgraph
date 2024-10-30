"""User models."""

from datetime import datetime
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr

from ..utils.schemas import PydanticObjectIdAnnotated


class BaseDocument(BaseModel):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(arbitrary_types_allowed=True)


class UserDocumentModel(BaseDocument):
    username: str = Field(...)
    hashed_password: str = Field(...)
    email: Optional[EmailStr] = Field(default=None)
    name: Optional[str] = Field(default=None)
    openai_api_key: str = Field(default="")
    api_key: ObjectId
    security_question: str = Field(...)
    hashed_security_answer: str = Field(...)
    color: str = Field(default="#7b1fa2")


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[EmailStr] = Field(default=None)
    name: Optional[str] = Field(default=None)
    security_question: str
    security_answer: str


class UserUpdate(BaseModel):
    openai_api_key: Optional[str] = Field(default=None, min_length=0)
    name: Optional[str] = Field(default=None, min_length=1)
    security_question: Optional[str] = Field(default=None, min_length=10)
    security_answer: Optional[str] = Field(default=None, min_length=1)
    email: Optional[EmailStr] = Field(default=None)
    color: Optional[str] = Field(default=None)


class UserOut(BaseModel):
    id: PydanticObjectIdAnnotated = Field(alias="_id")
    username: str
    email: Optional[EmailStr]
    name: Optional[str]
    openai_api_key: SecretStr
    api_key: Optional[PydanticObjectIdAnnotated]  # TODO: Make SecretStr
    created_at: datetime
    updated_at: datetime
    security_question: str
    color: str

    model_config = ConfigDict(
        populate_by_name=True, arbitrary_types_allowed=True, from_attributes=True
    )


class SecurityQuestionReset(BaseModel):
    username: str
    security_question: str
    security_answer: str
    new_password: str
