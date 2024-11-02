"""Dashboard schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from ..markup.schemas import Entity, Relation
from ..project.schemas import (
    AnnotatorRoles,
    AnnotatorStates,
    Guidelines,
    ProjectOntologySimple,
    Settings,
    Tasks,
)
from ..utils.schemas import PydanticObjectIdAnnotated


class Annotator(BaseModel):
    username: str = Field(description="Username associated with annotator")
    role: AnnotatorRoles = Field(description="Role assigned to annotator")
    state: AnnotatorStates = Field(description="Current state of annotator")
    scope_size: int

    model_config = ConfigDict(use_enum_values=True)


class DashboardInformation(BaseModel):
    user_is_pm: bool = Field(
        description="Flag indicating whether the current user is the project manager"
    )
    name: str = Field(description="The name of the project")
    description: str = Field(description="The description of the project")
    tasks: Tasks
    annotators: List[Annotator]
    created_at: datetime
    updated_at: datetime
    settings: Settings
    dataset_id: PydanticObjectIdAnnotated
    entity_ontology: ProjectOntologySimple
    relation_ontology: Optional[ProjectOntologySimple]
    guidelines: Guidelines

    model_config = ConfigDict(arbitrary_types_allowed=True)


class DashboardPlot(BaseModel):
    title: str
    name: str
    caption: str
    no_data_title: str
    dataset: Union[List, Dict]
    meta: Dict[str, Any] = Field(default_factory=dict)


class SaveState(BaseModel):
    created_by: str
    created_at: datetime


class Agreement(BaseModel):
    overall: float
    entity: float
    relation: float


class PairwiseAgreement(BaseModel):
    entity: Dict
    relation: Dict


class Comments(BaseModel):
    text: str
    created_by: str
    created_at: datetime
    updated_at: datetime


class AdjudicationEntity(Entity):
    ontology_item_name: str
    ontology_item_fullname: str
    ontology_item_color: str


class AdjudicationResponse(BaseModel):
    id: PydanticObjectIdAnnotated = Field(alias="_id")
    save_states: List[SaveState]
    agreement: Agreement
    pairwise_agreement: PairwiseAgreement
    tokens: List[str]
    original: str
    total_items: int
    updated_at: datetime
    annotators: List[str]
    flags: List
    social: List[Comments]
    entities: Dict[str, List[AdjudicationEntity]]
    relations: Optional[Dict[str, List[Relation]]] = Field(default=None)
