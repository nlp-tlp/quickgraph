"""Markup models."""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Union

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field

from models.base import PydanticObjectIdAnnotated


class AnnotationType(Enum):
    entity = "entity"
    relation = "relation"


class Classifications(Enum):
    entity = "entity"
    relation = "relation"


class CreateEntity(BaseModel):
    ontology_item_id: str
    start: int
    end: int
    surface_form: str


class RichCreateEntity(CreateEntity):
    project_id: Union[None, PydanticObjectIdAnnotated] = Field(
        description="Identifier of project associated with markup",
    )
    dataset_item_id: PydanticObjectIdAnnotated = Field(
        description="Identifier of dataset item markup is applied to",
    )  # `text_id`
    ontology_item_id: str = Field(
        description="Identifier of label associated with project ontology"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Date/time markup was created"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Date/time markup was last updated at",
    )
    created_by: str = Field()
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    classification: Classifications = Field(
        description="Classification associated with markup"
    )
    is_blueprint: bool = Field(
        default=False,
        description="Flag indicating whether markup is a blueprint (copiable)",
    )

    model_config = ConfigDict(arbitrary_types_allowed=True, use_enum_values=True)


class BaseMarkup(BaseModel):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    ontology_item_id: str = Field(
        description="Identifier of label associated with project ontology"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field()
    dataset_item_id: PydanticObjectIdAnnotated = Field(
        ...,
        description="Identifier of dataset item markup is applied to",
    )  # `text_id`
    project_id: PydanticObjectIdAnnotated = Field(
        ...,
        description="Identifier of project markup is associated with",
    )

    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)


class Entity(BaseMarkup):
    start: int = Field(..., description="Index of entity span token start", ge=0)
    end: int = Field(..., description="Index of entity span token end", ge=0)
    surface_form: str = Field()  # `entityText`
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    classification: Classifications = Field(
        description="Classification associated with markup"
    )  # instead of `isEntity`

    model_config = ConfigDict(use_enum_values=True)


class EntityMarkup(BaseModel):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    ontology_item_id: str = Field(
        description="Identifier of entity label associated with project ontology"
    )
    start: int = Field(description="Index of entity span token end", ge=0)
    end: int = Field(description="Index of entity span token end", ge=0)
    surface_form: str = Field(
        description="Surface form of entity e.g. its span of text"
    )
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    color: str
    fullname: str
    name: str
    state: str = Field(default="active")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Date/time markup was created"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Date/time markup was last updated"
    )

    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)


class Relation(BaseMarkup):
    source_id: PydanticObjectIdAnnotated = Field(...)
    target_id: PydanticObjectIdAnnotated = Field(...)
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    classification: Classifications = Field(
        description="Classification associated with markup"
    )  # instead of `isEntity`

    model_config = ConfigDict(use_enum_values=True, arbitrary_types_allowed=True)


class RelationMarkup(BaseModel):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    source_id: PydanticObjectIdAnnotated = Field(
        description="Identifier associated with source entity"
    )
    target_id: PydanticObjectIdAnnotated = Field(
        description="Identifier associated with target entity"
    )
    ontology_item_id: PydanticObjectIdAnnotated = Field(
        description="Identifier of entity label associated with project ontology"
    )
    suggested: bool
    fullname: str
    name: str
    state: str = Field(default="active")

    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)


class CreateRelation(BaseModel):
    ontology_item_id: str
    source_id: PydanticObjectIdAnnotated = Field(
        ...,
        description="Identifier of the source entity markup",
    )
    target_id: PydanticObjectIdAnnotated = Field(
        ...,
        description="Identifier of the target entity markup",
    )

    model_config = ConfigDict(arbitrary_types_allowed=True)


class RichCreateRelation(CreateRelation):
    project_id: Union[None, PydanticObjectIdAnnotated] = Field(
        description="Identifier of project associated with markup",
    )
    dataset_item_id: PydanticObjectIdAnnotated = Field(
        description="Identifier of dataset item markup is applied to",
    )
    ontology_item_id: str = Field(
        description="Identifier of label associated with project ontology"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field()
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    classification: Classifications = Field(
        description="Classification associated with markup"
    )  # instead of `isEntity`
    is_blueprint: bool = Field(
        default=False,
        description="Flag indicating whether markup is a blueprint (copiable)",
    )

    model_config = ConfigDict(arbitrary_types_allowed=True, use_enum_values=True)


class CreateMarkupApply(BaseModel):
    project_id: str = Field(description="Identifier of project being annotated")
    dataset_item_id: Union[None, str] = Field(
        description="Identifier of dataset item markup will be applied to"
    )
    extra_dataset_item_ids: Union[None, List[str]] = Field(
        description="Extra set of item identifiers in dataset"
    )
    annotation_type: AnnotationType = Field(
        default=AnnotationType.entity,
        description="Type of annotation markup being applied.",
    )
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    content: Union[CreateEntity, CreateRelation] = Field(...)

    model_config = ConfigDict(use_enum_values=True)


# class AcceptMarkup(BaseModel):
#     markup_id: str = Field()
#     apply_all: bool = Field()


class InMarkupApply(BaseModel):
    dataset_item_id: str = Field(
        description="Identifier of dataset item markup is applied to"
    )  # PyObjectId = Field(
    #     default_factory=PyObjectId,
    #     description="Identifier of dataset item markup is applied to",
    #     # alias="_id",
    # )  # `text_id`
    extra_dataset_item_ids: List[str] = Field(
        description="Extra set of item identifiers in dataset"
    )  # List[PyObjectId] = Field(
    #     default_factory=PyObjectId,
    #     description="Extra set of item identifiers in dataset",
    # )  # TODO: implement this in the future as a background process. This is the page of viewable items that the UI renders.
    annotation_type: AnnotationType = Field(
        description="Type of annotation markup being applied."
    )
    apply_all: bool = Field(
        description="Flag to propagate markup application across all eligible matches"
    )
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    content: Union[EntityMarkup, RelationMarkup] = Field()

    model_config = ConfigDict(use_enum_values=True)


# class ItemOrientedEntityMarkup(BaseModel):
#     __root__: Dict[str, List[EntityMarkup]] = Field(
#         description="Key:value pair where `property` is the item_id associated with markup"
#     )


# class ItemOrientedRelationMarkup(BaseModel):
#     __root__: Dict[str, List[RelationMarkup]] = Field(
#         description="Key:value pair where `property` is the item_id associated with markup"
#     )


class OutMarkupApply(BaseModel):
    """"""

    count: int
    label_name: str
    entities: Union[None, List[EntityMarkup]] = Field(default=None)
    # entities: Union[dict, Dict[str, List[EntityMarkup]]] = Field(
    #     default={},
    #     description="Contains entity information as item_id:entity key:value pair for all entities updated",
    # )
    relations: Union[dict, Dict[str, List[RelationMarkup]]] = Field(
        default={},
        description="Contains relation information as item_id:relation key:value pair for all relations updated",
    )
    annotation_type: AnnotationType = Field(
        description="Type of annotation markup being applied",
    )
    apply_all: bool

    model_config = ConfigDict(use_enum_values=True)


class OutMarkupDelete(BaseModel):
    count: int
    entities: Dict[str, list] = {}
    relations: Dict[str, list] = {}
    annotation_type: AnnotationType = Field(
        description="Type of annotation markup being applied",
    )
    apply_all: bool

    model_config = ConfigDict(use_enum_values=True)
