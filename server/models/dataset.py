"""Dataset models."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field, validator

from models.base import PydanticObjectIdAnnotated
from models.social import Comment

# from models.project import Flag


class BaseItem(BaseModel):
    original: str = Field(
        description="Original content of document before preprocessing operations and tokenization"
    )
    is_blueprint: bool = Field(
        description="Flag indicating whether the dataset is a blueprint (copyable)",
    )
    project_id: Union[None, PydanticObjectIdAnnotated] = Field(
        default=None,
        description="The UUID of the project associated with this dataset_item (if not a blueprint)",
    )

    model_config = ConfigDict(arbitrary_types_allowed=True)


class Entity(BaseModel):
    start: int
    end: int
    label: str
    id: Union[None, str] = Field(description="The id of the entity")


class Relation(BaseModel):
    source_id: str
    target_id: str
    label: str


class JSONBaseItem(BaseModel):
    original: str
    tokens: List[str] = Field(
        description='The tokens of this item. This may not necessarily be aligned with the "original" field.'
    )
    entities: Union[None, List[Entity]]
    relations: Union[None, List[Relation]]
    external_id: Union[str, None] = Field(
        default=None, description="The External ID associated with the item"
    )
    extra_fields: Union[Dict[str, Any], None] = Field(
        default=None,
        description="An object of extra fields supplied with the dataset item.",
    )


class EnrichedItem(BaseItem):
    """Item after preprocessing, tokenization, etc."""

    tokens: List[str] = Field(
        description="Tokenized content after preprocessing operations"
    )
    text: str = Field(
        description="Concatenation of tokenized content after preprocessing operations"
    )
    external_id: Union[str, None] = Field(
        default=None, description="The External ID associated with the item"
    )
    extra_fields: Union[Dict[str, Any], None] = Field(
        default=None,
        description="An object of extra fields supplied with the dataset item.",
    )
    entities: Optional[list] = Field(
        default=[], description="List of entities associated with this dataset item."
    )
    relations: Optional[list] = Field(
        default=[], description="List of relations associated with this dataset item."
    )

    dataset_id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)


class DatasetItem(EnrichedItem):
    """DatasetItem are dataset items that are assigned to a project"""

    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")

    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)


class TokenizerEnum(str, Enum):
    whitespace: str = "whitespace"
    punkt: str = "punkt"


class Preprocessing(BaseModel):
    lowercase: Union[None, bool] = Field(
        default=None, description="Option to remove casing from dataset items"
    )
    remove_duplicates: Union[None, bool] = Field(
        default=None, description="Option to remove duplicate items from dataset"
    )
    remove_chars: Union[None, bool] = Field(
        default=None, description="Option to remove charset from dataset items"
    )
    remove_charset: Union[None, str] = Field(
        default=None, description="Set of characters to remove from dataset items"
    )
    tokenizer: Union[None, TokenizerEnum] = Field(
        default=None,
        description="Tokenizer to apply to dataset items",
    )

    model_config = ConfigDict(use_enum_values=True)


class DatasetType(int, Enum):
    no_annotation = 0
    entity_annotation = 1
    relation_annotation = 2  # + entity


class BaseDataset(BaseModel):
    name: str = Field(description="The name of the dataset")
    description: str = Field(description="The description of the dataset")
    is_blueprint: bool = Field(
        description="Flag indicating whether the dataset is a blueprint (copyable)"
    )
    is_annotated: bool = Field(
        description="Flag indiciating whether the dataset is annotated"
    )
    is_suggested: Optional[bool] = Field(
        description="Flag indicating whether markup associated with this dataset are by default suggested (weak)"
    )
    dataset_type: DatasetType = Field(
        default=DatasetType.no_annotation,
        description="The type of dataset that is to be created",
    )
    entity_ontology_resource_id: Optional[str] = None
    relation_ontology_resource_id: Optional[str] = None
    project_id: Optional[PydanticObjectIdAnnotated] = Field(default=None)

    @validator("entity_ontology_resource_id")
    def validate_entity_ontology_resource_id(cls, v, values):
        if (
            values.get("dataset_type")
            in (DatasetType.entity_annotation, DatasetType.relation_annotation)
            and not v
        ):
            raise ValueError(
                '"entity_ontology_resource_id" is required for entity and relation annotated datasets (data_type is 1 or 2)'
            )
        return v

    @validator("relation_ontology_resource_id")
    def validate_relation_ontology_resource_id(cls, v, values):
        if values.get("dataset_type") == DatasetType.relation_annotation and not v:
            raise ValueError(
                '"relation_ontology_resource_id" is required for relation annotated datasets (data_type is 2)'
            )
        return v

    model_config = ConfigDict(arbitrary_types_allowed=True, use_enum_values=True)


class CreateDataType(str, Enum):
    text = "text"
    json = "json"


class CreateDatasetBody(BaseDataset):
    items: Union[List[str], List[JSONBaseItem]]
    data_type: CreateDataType
    preprocessing: Preprocessing = Field(
        description="Preprocessing operations to apply to dataset"
    )

    class Config:
        use_enum_values = True


class CreateDataset(CreateDatasetBody):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Dataset(BaseDataset):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    created_by: str = Field(description="Username of user who created dataset")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    preprocessing: Preprocessing = Field(
        description="Preprocessing operations to apply to dataset"
    )
    size: Union[None, int] = Field(default=None, description="Size of items in dataset")
    projects: Optional[List[dict]] = Field(description="Set of projects using dataset")
    project: Optional[dict] = Field(
        description='Details of linked project if "project dataset"'
    )
    items: Union[None, List[DatasetItem]] = Field(
        default=None, description="Items dataset contains"
    )
    external_id: Union[str, None] = Field(
        default=None, description="The External ID associated with the item"
    )

    model_config = ConfigDict(arbitrary_types_allowed=True, use_enum_values=True)


class LinkedResource(BaseModel):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    name: str

    model_config = ConfigDict(arbitrary_types_allowed=True)


class RichProjectDataset(Dataset):
    # Add ontologies to this as they are used for validation
    pass


class RichBlueprintDataset(Dataset):
    linked_entity_resource: Union[None, LinkedResource] = None
    linked_relation_resource: Union[None, LinkedResource] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class SaveStateFilter(int, Enum):
    unsaved = 0
    saved = 1
    everything = 2


class QualityFilter(int, Enum):
    suggested = 0
    accepted = 1
    everything = 2


class RelationsFilter(int, Enum):
    no_relations = 0
    has_relations = 1
    everything = 2


class FlagFilter(int, Enum):
    no_flags = 0
    issue = 1
    quality = 2
    uncertain = 3
    everything = 4


class DatasetFilters(BaseModel):
    project_id: str = Field()
    search_term: Union[None, str] = Field(default=None)
    saved: SaveStateFilter = Field(default=SaveStateFilter.everything)
    quality: QualityFilter = Field(default=QualityFilter.everything)
    relations: RelationsFilter = Field(default=RelationsFilter.everything)
    flag: FlagFilter = Field(default=FlagFilter.everything)
    skip: int = Field(default=1, ge=0)
    limit: int = Field(default=10, ge=1, le=20)
    dataset_item_ids: Union[None, str] = Field(default=None)

    model_config = ConfigDict(use_enum_values=True)


class FilteredDataset(BaseModel):
    dataset_items: Dict[str, dict] = Field(default={})
    relations: Dict[str, List[dict]] = Field(default={})
    entities: Dict[str, List[dict]] = Field(default={})
    total_dataset_items: int = Field(default=0, ge=0)
    total_pages: int = Field(default=0, ge=0)
    social: Dict[str, Union[list, List[Comment]]] = Field(default={})
    # flags: Dict[str, Union[list, List[Flag]]] = Field(default={})

    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
