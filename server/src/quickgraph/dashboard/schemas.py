"""Dashboard schemas."""

from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field

from ..projects.schemas import (
    AnnotatorRoles,
    AnnotatorStates,
    Guidelines,
    ProjectOntology,
    Settings,
    Tasks,
)


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
    dataset_id: str
    ontology: ProjectOntology
    guidelines: Guidelines
