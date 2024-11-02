"""Markup schemas."""

from datetime import datetime
from enum import Enum
from typing import List, Optional, Union

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field

from ..utils.schemas import PydanticObjectIdAnnotated


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
    project_id: PydanticObjectIdAnnotated | None = Field(
        default=None,
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
    created_by: str
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    classification: AnnotationType = "entity"
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
        default_factory=ObjectId,
        description="Identifier of dataset item markup is applied to",
    )  # `text_id`
    project_id: PydanticObjectIdAnnotated = Field(
        default_factory=ObjectId,
        description="Identifier of project markup is associated with",
    )


class Entity(BaseMarkup):
    start: int = Field()
    end: int = Field()
    surface_form: str = Field()  # `entityText`
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    classification: AnnotationType = "entity"

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
    source_id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId)
    target_id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId)
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    classification: AnnotationType = "relation"

    model_config = ConfigDict(arbitrary_types_allowed=True, use_enum_values=True)


class RelationMarkup(BaseModel):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    source_id: PydanticObjectIdAnnotated = Field(
        description="Identifier associated with source entity"
    )
    target_id: PydanticObjectIdAnnotated = Field(
        description="Identifier associated with target entity"
    )
    ontology_item_id: str = Field(
        description="Identifier of entity label associated with project ontology"
    )
    suggested: bool
    fullname: str
    name: str
    state: str = Field(default="active")

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)


class CreateRelation(BaseModel):
    """Model for API request to create a relation markup"""

    ontology_item_id: str
    source_id: str = Field(..., description="Identifier associated with source entity")
    target_id: str = Field(..., description="Identifier associated with source entity")


class RichCreateRelation(CreateRelation):
    """Model for adding document into the database"""

    source_id: PydanticObjectIdAnnotated = Field(
        description="Identifier associated with source entity"
    )
    target_id: PydanticObjectIdAnnotated = Field(
        description="Identifier associated with target entity"
    )
    project_id: PydanticObjectIdAnnotated | None = Field(
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
    classification: AnnotationType = "relation"
    is_blueprint: bool = Field(
        default=False,
        description="Flag indicating whether markup is a blueprint (copiable)",
    )

    model_config = ConfigDict(arbitrary_types_allowed=True, use_enum_values=True)


class EntityOut(BaseModel):
    id: str = Field(alias="_id")
    ontology_item_id: str = Field(
        description="Identifier of entity label associated with project ontology"
    )
    dataset_item_id: str = Field()
    start: int = Field(description="Index of entity span token end", ge=0)
    end: int = Field(description="Index of entity span token end", ge=0)
    surface_form: str = Field(
        description="Surface form of entity e.g. its span of text"
    )
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    color: Optional[str]
    fullname: Optional[str]
    name: Optional[str]
    state: str = Field(default="active")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Date/time markup was created"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Date/time markup was last updated"
    )

    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)


class RelationOut(BaseModel):
    id: str = Field(alias="_id")
    dataset_item_id: str = Field()
    source_id: str = Field(description="Identifier associated with source entity")
    target_id: str = Field(description="Identifier associated with target entity")
    ontology_item_id: str = Field(
        description="Identifier of entity label associated with project ontology"
    )
    suggested: Optional[bool]
    fullname: Optional[str]
    name: Optional[str]
    state: str = Field(default="active")

    model_config = ConfigDict(populate_by_name=True)


class CreateMarkupApply(BaseModel):
    project_id: str = Field(description="Identifier of project being annotated")
    dataset_item_id: Optional[str] = Field(
        description="Identifier of dataset item markup will be applied to"
    )
    extra_dataset_item_ids: list[str] | None = Field(
        description="Extra set of item identifiers in dataset"
    )
    annotation_type: AnnotationType = Field(
        default="entity",
        description="Type of annotation markup being applied.",
    )
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    content: CreateEntity | CreateRelation

    model_config = ConfigDict(arbitrary_types_allowed=True, use_enum_values=True)


# class AcceptMarkup(BaseModel):
#     markup_id: str = Field()
#     apply_all: bool = Field()


class InMarkupApply(BaseModel):
    dataset_item_id: str = Field(
        description="Identifier of dataset item markup is applied to"
    )  # PydanticObjectIdAnnotated = Field(
    #     default_factory=ObjectId,
    #     description="Identifier of dataset item markup is applied to",
    #     # alias="_id",
    # )  # `text_id`
    extra_dataset_item_ids: List[str] = Field(
        description="Extra set of item identifiers in dataset"
    )  # List[PydanticObjectIdAnnotated] = Field(
    #     default_factory=ObjectId,
    #     description="Extra set of item identifiers in dataset",
    # )  # TODO: implement this in the future as a background process. This is the page of viewable items that the UI renders.
    annotation_type: AnnotationType = Field(
        default="entity", description="Type of annotation markup being applied."
    )
    apply_all: bool = Field(
        description="Flag to propagate markup application across all eligible matches"
    )
    suggested: bool = Field(
        description="Flag indicating whether markup is to be suggested (weak) or not (silver)"
    )
    content: Union[EntityMarkup, RelationMarkup] = Field()

    model_config = ConfigDict(
        arbitrary_types_allowed=True, populate_by_name=True, use_enum_values=True
    )


class OutMarkupApply(BaseModel):
    """"""

    count: int
    label_name: str
    entities: List[EntityOut] = Field(default=list)
    relations: List[RelationOut] = Field(default=list)
    annotation_type: AnnotationType = Field(
        description="Type of annotation markup being applied",
    )
    apply_all: bool

    model_config = ConfigDict(use_enum_values=True)


class OutMarkupDelete(BaseModel):
    count: int
    label_name: str
    entity_ids: Optional[List[str]] = Field(default_factory=list)
    relation_ids: List[str] = Field(default_factory=list)
    annotation_type: AnnotationType = Field(
        description="Type of annotation markup being applied",
    )
    apply_all: bool

    model_config = ConfigDict(use_enum_values=True)


class OutMarkupAccept(BaseModel):
    """"""

    count: int
    label_name: str
    entity_ids: List[str] = Field(default_factory=list)
    relation_ids: List[str] = Field(default_factory=list)
    annotation_type: AnnotationType = Field(
        description="Type of annotation markup being accepted",
    )
    apply_all: bool

    model_config = ConfigDict(use_enum_values=True)


class SurfaceForm(BaseModel):
    surface_form: str
    count: int


class OntologyItemMeta(BaseModel):
    color: str
    name: str
    fullname: str


class AnnotationInsight(BaseModel):
    ontology_item_id: str
    instances: List[SurfaceForm]
    meta: OntologyItemMeta


class MarkupEditBody(BaseModel):
    ontology_item_id: str = Field(
        description="The ID that will be assigned to the markup"
    )
