"""Resources models."""

from datetime import datetime
from enum import Enum
from typing import List, Optional, Union

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field

from ..utils.schemas import PydanticObjectIdAnnotated


class ResourceClassifications(str, Enum):
    ontology = "ontology"
    preannotation = "preannotation"
    constraints = "constraints"


class ResourceSubClassification(str, Enum):
    entity = "entity"
    relation = "relation"


class EntityPreannotation(BaseModel):
    surface_form: str = Field(description="Surface form of entity")
    label: str = Field(description="Semantic label of the entity class")


class RichEntityPreannotation(EntityPreannotation):
    ontology_item_id: str = Field(
        description="The UUID associated with the preannotations label."
    )


class RelationPreannotation(BaseModel):
    source: EntityPreannotation
    target: EntityPreannotation
    label: str = Field(description="Semantic label of the relation class")
    offset: int = Field(ge=0, description="Offset between source and entity spans")


class RichRelationPreannotation(RelationPreannotation):
    ontology_item_id: str = Field(
        description="The UUID associated with the preannotations label."
    )


class RelationConstraints(BaseModel):
    domain: List[str] = Field(default_factory=list)
    range: List[str] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UpdateRelationConstraints(RelationConstraints):
    id: str = Field(description="The UUID of the ontology item", alias="_id")

    model_config = ConfigDict(populate_by_name=True)


class OntologyItem(BaseModel):
    id: Optional[str] = Field(default=None, description="The UUID of the ontology item")
    name: str
    fullname: Optional[str] = Field(
        default="",
        description="The fullname of the ontology item, including ancestors separated by forward slashes.",
    )
    description: str = Field(
        default="", description="The description of the ontology item."
    )
    example_terms: Optional[List[str]] = Field(
        default_factory=list,
        description="List of example terms classified by the ontology item.",
    )
    color: Optional[str] = "#000000"
    active: bool = Field(
        default=True, description="Flag indicating if the ontology item is active"
    )
    # https://docs.pydantic.dev/usage/postponed_annotations/#self-referencing-models
    children: List["OntologyItem"] = Field(
        default_factory=list, description="The children of the ontology item"
    )
    path: Optional[List[int]] = Field(
        default=None, description="The path of the ontology item"
    )
    constraints: Optional[RelationConstraints] = Field(
        default=None, description="The constraints of the ontology item"
    )


class BaseOntologyItem(BaseModel):
    name: str = Field(description="The name of the ontology item class")
    children: List["BaseOntologyItem"] = Field(
        default_factory=list, description="The children of the ontology item"
    )
    description: str = Field(
        default="", description="The description of the ontology item."
    )
    example_terms: List[str] = Field(
        default_factory=list,
        description="List of example terms classified by the ontology item.",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="The datetime the ontology item was created",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="The datetime the ontology item was last updated",
    )
    constraints: Optional[RelationConstraints] = Field(
        default=None, description="The constraints of the ontology item"
    )


class BaseResourceModel(BaseModel):
    name: str = Field(description="Name assigned to resource")
    classification: ResourceClassifications = Field(
        description="The classification of the resource"
    )
    sub_classification: ResourceSubClassification = Field(
        description="The sub classification of the resource"
    )
    content: Union[
        None,
        List[BaseOntologyItem],
        List[Union[EntityPreannotation, RelationPreannotation]],
    ] = Field(description="The content of the resource")
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="The datetime the resource was created",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="The datetime the resource was last updated",
    )

    model_config = ConfigDict(use_enum_values=True)


class CreateResourceModel(BaseResourceModel):
    is_blueprint: bool = Field(
        default=True,
        description="Flag indicating whether the resource is a blueprint (copyable)",
    )


class ResourceModel(BaseResourceModel):
    id: PydanticObjectIdAnnotated = Field(
        default_factory=ObjectId,
        alias="_id",
        description="The UUID of the resource",
    )
    created_by: str = Field(
        description="User who created resource and resource is assigned to"
    )

    is_blueprint: bool = Field(
        description="Flag indicating whether the resource is a blueprint (copyable)"
    )
    content: Union[
        None,
        List[OntologyItem],
        List[Union[EntityPreannotation, RelationPreannotation]],
    ] = Field(description="The content of the resource")

    model_config = ConfigDict(
        use_enum_values=True, populate_by_name=True, arbitrary_types_allowed=True
    )


class UpdateResourceModel(BaseModel):
    id: Optional[str] = Field(default=None, description="The UUID of the resource")
    project_id: Optional[str] = Field(
        default=None, description="The UUID of the resources project"
    )
    classification: ResourceClassifications = Field(
        description="The classification of the resource"
    )
    sub_classification: ResourceSubClassification = Field(
        description="The sub classification of the resource"
    )
    content: List[OntologyItem] = Field(description="The content of the resource")
    model_config = ConfigDict(use_enum_values=True)


class CreatePreannotationResource(BaseModel):
    name: str = Field(description="Name assigned to resource")
    classification: ResourceClassifications = Field(
        description="Resource classification type - ontology, pre-annotation, constraints, ..."
    )
    sub_classification: Union[None, str] = Field(
        description="Resource sub classification type - entity, relation, ..."
    )
    preannotations: Union[
        None, List[Union[RichEntityPreannotation, RichRelationPreannotation]]
    ]
    ontology_id: Union[None, str] = Field(
        default=None,
        description="The UUID of the associated ontology (if preannotation resource)",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Date resource was created"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Date resource was created"
    )

    model_config = ConfigDict(use_enum_values=True)


class ResourceModelOut(ResourceModel):
    size: int
    instances: Optional[List[str]] = Field(default=None)


class ResourceModelWithReadStatus(ResourceModel):
    read_only: bool = Field(default=True)


class AggregateOntologyResources(BaseModel):
    entity: List[ResourceModel] = []
    relation: List[ResourceModel] = []


class AggregatePreannotationResources(BaseModel):
    entity: List[EntityPreannotation] = []
    relation: List[RelationPreannotation] = []


class AggregateResourcesModel(BaseModel):
    ontology: AggregateOntologyResources = []
    preannotation: AggregatePreannotationResources = []
