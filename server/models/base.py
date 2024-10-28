"""Base models."""

from typing import Annotated

from bson import ObjectId
from pydantic import GetJsonSchemaHandler
from pydantic_core import CoreSchema, core_schema


class PydanticObjectId:
    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        _source_type: type[ObjectId] | None = None,
        _handler: GetJsonSchemaHandler | None = None,
    ) -> CoreSchema:
        """Defines how to validate and serialize ObjectId."""
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema(
                [
                    # Handle ObjectId objects
                    core_schema.is_instance_schema(ObjectId),
                    # Handle string representations of ObjectIds
                    core_schema.no_info_plain_validator_function(cls.validate),
                ]
            ),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x),
                return_schema=core_schema.str_schema(),
                when_used="json",
            ),
        )

    @classmethod
    def validate(cls, value) -> ObjectId:
        if isinstance(value, ObjectId):
            return value
        if isinstance(value, str):
            try:
                return ObjectId(value)
            except Exception as e:
                raise ValueError("Invalid ObjectId format")
        raise ValueError("Invalid ObjectId format")


PydanticObjectIdAnnotated = Annotated[ObjectId, PydanticObjectId]
