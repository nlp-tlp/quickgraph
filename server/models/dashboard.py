from datetime import datetime
from typing import List

from bson import ObjectId
from pydantic import BaseModel, Field

from models.project import Settings, Tasks, AnnotatorRoles, AnnotatorStates, Guidelines, ProjectOntology

class Annotator(BaseModel):
    username: str = Field(description="Username associated with annotator")
    role: AnnotatorRoles = Field(description="Role assigned to annotator")
    state: AnnotatorStates = Field(description="Current state of annotator")
    scope_size: int

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        use_enum_values = True
        json_encoders = {ObjectId: str}


class DashboardInformation(BaseModel):
    
    user_is_pm: bool = Field(description='Flag indicating whether the current user is the project manager')
    name: str = Field(description='The name of the project')
    description: str = Field(description='The description of the project')
    tasks: Tasks
    annotators: List[Annotator]
    created_at: datetime
    updated_at: datetime
    settings: Settings
    dataset_id: str
    ontology: ProjectOntology
    guidelines: Guidelines

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        # json_encoders = {ObjectId: str}