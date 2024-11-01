"""Dashboard schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

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
