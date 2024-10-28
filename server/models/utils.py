"""Model utilities."""

from typing import Annotated, Union

from bson import ObjectId
from pydantic.functional_validators import BeforeValidator

PyObjectId = Annotated[Union[ObjectId, str], BeforeValidator(lambda x: str(x))]
