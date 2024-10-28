"""Project models."""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Union

from bson import ObjectId
from models.base import PydanticObjectIdAnnotated
from models.dataset import Preprocessing
from models.markup import Entity, Relation
from models.resources import OntologyItem
from pydantic import BaseModel, ConfigDict, Field

# class ResourceConstraints(BaseModel):
#     # Resource constraints are private to projects only.
#     domain: Optional[List[Union[PyObjectId, str]]]
#     range: Optional[List[Union[PyObjectId, str]]]


class SaveState(BaseModel):
    dataset_item_id: PydanticObjectIdAnnotated = Field(
        description="The UUID of the dataset item this save state refers to",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="The datetime the save state was created",
    )
    created_by: str = Field(
        description="The username of the annotator who created the save state"
    )

    model_config = ConfigDict(arbitrary_types_allowed=True)


class Settings(BaseModel):
    annotators_per_item: int = Field(
        default=1, description="Number of users required to annotate each dataset item"
    )
    disable_propagation: bool = Field(
        default=False,
        description="Option to disable annotators from using propagation functionality",
    )
    disable_discussion: bool = Field(
        default=False, description="Option to disable discussions on dataset items"
    )
    suggested_preannotations: Optional[bool] = Field(
        description="Option that specifies whether preannotations are set as suggestions"
    )


class Tasks(BaseModel):
    entity: bool = Field(
        default=True, description="Option to perform entity annotation"
    )
    relation: bool = Field(
        default=False, description="Option to perform relation annotation"
    )  # TODO: make this require entity annotation to be True.


class DatasetItem(BaseModel):
    content: str = Field(description="Content of dataset item")
    id: str = Field(default=None, description="Identifier associated with dataset item")


class BasicEntity(BaseModel):
    surface_form: str = Field(description="Surface form (lexeme) of entity")
    classification: str = Field(description="Semantic classification of entity")


class PreannotationResource(BaseModel):
    entity: List[BasicEntity] = None
    relation: List[dict] = None  # TODO: implement this; create BasicRelation


class ProjectOntology(BaseModel):
    # TODO: Make `entity` nullable when item classification is introduced
    entity: List[OntologyItem]
    relation: Union[List[OntologyItem], None] = None


class AnnotatorRoles(Enum):
    project_manager = "project manager"
    annotator = "annotator"


class AnnotatorStates(Enum):
    accepted = "accepted"
    invited = "invited"
    declined = "declined"
    removed = "removed"


class ScopeItem(BaseModel):
    dataset_item_id: PydanticObjectIdAnnotated = Field(
        ...,
        description="Scope of documents assigned assigned to annotator (item identifiers)",
    )
    visible: bool

    model_config = ConfigDict(arbitrary_types_allowed=True)


class Annotator(BaseModel):
    username: str = Field(description="Username associated with annotator")
    role: AnnotatorRoles = Field(description="Role assigned to annotator")
    disabled: bool = Field(default=False, description="Disable state of annotator")
    state: AnnotatorStates = Field(description="Current state of annotator")
    scope: List[ScopeItem]

    model_config = ConfigDict(use_enum_values=True)


class FlagState(str, Enum):
    issue = "issue"
    quality = "quality"
    uncertain = "uncertain"


class BaseFlag(BaseModel):
    state: FlagState = Field(description="The state of the flag")

    model_config = ConfigDict(use_enum_values=True)


class CreateFlag(BaseFlag):
    pass


class Flag(BaseFlag):
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="The datetime the flag was created"
    )
    created_by: str = Field(
        description="The username of the annotator who created the flag"
    )


class GuidelineExample(BaseModel):
    content: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Guidelines(BaseModel):
    content: str = Field(default="")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    examples: List[GuidelineExample] = Field(default=[])


class BaseProject(BaseModel):
    name: str = Field(description="Name of project")
    description: str = Field(default="", description="Description of project")
    settings: Settings = Field(description="Initial project settings")
    tasks: Tasks = Field(description="Annotation tasks associated with project")
    # save_states: List[SaveState] = Field(
    #     default=[],
    #     description="The save states set by annotations on this projects dataset items",
    # )
    # flags: List[Flag] = Field(
    #     default=[],
    #     description="The flags set by annotators on this projects dataset items",
    # )


class TestCreateProject(BaseProject):
    """Project for testing - does not have resource ids or dataset as these are not available apriori at test time."""

    annotators: List[str] = Field(description="Set of invited annotation collaborators")
    preannotation_resource: PreannotationResource = Field(
        description="Resource for preannotation of initial dataset"
    )


class CreateProject(BaseProject):
    blueprint_resource_ids: List[str] = Field(
        description="The UUID of blueprint resources to assign to this project to facilitate annotation of the selected task(s)"
    )
    annotators: List[str] = Field(description="The usernames of invited collaborators")
    blueprint_dataset_id: PydanticObjectIdAnnotated = Field(
        description="The UUID of the blueprint dataset for this project"
    )


class Project(BaseProject):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    ontology: ProjectOntology = Field(description="Task ontologies assigned to project")
    annotators: List[Annotator] = Field(
        description="Set of invited annotation collaborators"
    )
    created_by: str = Field(
        description="Project manager (defaults to user creating project)"
    )
    # save_states: List[SaveState] = Field(
    #     description="Dataset item save states of annotators"
    # )
    dataset_id: PydanticObjectIdAnnotated = Field(
        description="The UUID of the projects dataset"
    )
    updated_at: datetime = Field(
        description="Date/Time project was last updated",
    )
    guidelines: Guidelines = Field(description="Annotation guidelines for project")
    relation_counts: Optional[Dict[str, int]] = Field(
        description="Relation frequencies applied by the current user."
    )

    model_config = ConfigDict(
        use_enum_values=True, populate_by_name=True, arbitrary_types_allowed=True
    )


class ProjectWithMetrics(BaseModel):
    """
    Base model for listing projects
    """

    id: PydanticObjectIdAnnotated = Field(..., alias="_id")
    # active_annotators: int = Field(description="Count of active project annotators")
    active_annotators: List[dict] = Field(
        description="The set of active annotators on this project"
    )
    created_at: datetime = Field(description="Date/Time project was created")
    updated_at: datetime = Field(
        description="Date/Time project was last updated",
    )
    description: str = Field(description="Description of project")
    name: str = Field(description="Name of project")
    saved_items: int = Field(
        description="Number of items saved with minimum annotators"
    )
    tasks: Tasks = Field(description="Tasks assigned to the project")
    total_items: int = Field(
        description="Total number of items assigned to the project"
    )
    user_is_pm: bool = Field(description="")
    # user_role: str = Field(description="The role of the current user")
    created_by: str = Field(description="The creator of the project")

    model_config = ConfigDict(
        use_enum_values=True, populate_by_name=True, arbitrary_types_allowed=True
    )


class SaveDatasetItems(BaseModel):
    project_id: str
    dataset_item_ids: List[str]


class SummaryItem(BaseModel):
    index: int
    name: str
    value: int


class SummaryActivityItem(BaseModel):
    state: Optional[str] = None
    created_at: datetime
    created_by: str
    dataset_item_id: PydanticObjectIdAnnotated
    project_id: Optional[PydanticObjectIdAnnotated] = None
    text: str
    context: Optional[str] = None
    activity_type: str
    project_name: Optional[str] = None


class Summary(BaseModel):
    summary: List[SummaryItem]
    activity: List[SummaryActivityItem]

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ProjectDataset(BaseModel):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    name: str
    description: Optional[str]
    created_by: str = Field(description="Username of user who created dataset")
    created_at: datetime
    updated_at: datetime
    preprocessing: Preprocessing = Field(
        description="Preprocessing operations to apply to dataset"
    )
    dataset_type: Optional[str]
    is_annotated: bool
    is_suggested: bool


class ProjectDatasetItem(BaseModel):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    original: str
    is_blueprint: bool
    tokens: List[str]
    text: str
    external_id: Optional[str]
    extra_fields: Optional[dict]
    created_at: datetime
    updated_at: datetime
    flags: Optional[List]


class ProjectSocial(BaseModel):
    id: PydanticObjectIdAnnotated = Field(default_factory=ObjectId, alias="_id")
    text: str
    context: str
    dataset_item_id: PydanticObjectIdAnnotated = Field(...)
    created_at: datetime
    updated_at: datetime
    created_by: str

    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)


class ProjectDownload(BaseModel):
    project: Project = {}
    dataset: ProjectDataset = {}
    dataset_items: List[ProjectDatasetItem] = []
    markup: List[Union[Entity, Relation]] = []
    social: List[ProjectSocial] = []
