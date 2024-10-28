"""Graph models."""

from enum import Enum
from typing import Dict, List

from pydantic import BaseModel, Field

from models.resources import OntologyItem


class NodeFont(BaseModel):
    color: str = "#000000"


class NodeColor(BaseModel):
    border: str = "#000000"
    background: str = "#808080"


class Node(BaseModel):
    id: str
    classification: str
    color: NodeColor
    font: NodeFont
    label: str
    title: str
    value: int
    suggested: bool
    ontology_item_id: str


# TODO: Nodes should be {id: {...details...}}, this way its easier for the links to look up information and match etc. The src/tgt node info can be removed and just be UUIDs. Linsk can also be {id: {...details...}}


class LinkNode(BaseModel):
    id: str
    label: str
    ontology_item_id: str


class Link(BaseModel):
    id: str
    label: str
    source: str
    target: str
    title: str
    value: int
    suggested: bool
    color: str = "#000000"
    ontology_item_id: str


class Relationships(BaseModel):
    nodes: List[str]
    links: List[str]


class Metrics(BaseModel):
    items: int = Field(default=0, ge=0)
    nodes: int = Field(default=0, ge=0)
    links: int = Field(default=0, ge=0)


class GraphData(BaseModel):
    nodes: Dict[str, Node] = {}
    links: Dict[str, Link] = {}
    relationships: Dict[str, Relationships] = Field(default={})


class Ontologies(BaseModel):
    entity: List[OntologyItem] = Field(default=[])
    relation: List[OntologyItem] = Field(default=[])


class Graph(BaseModel):
    data: GraphData
    # metrics: Metrics
    # ontologies: Ontologies


class GraphQualityEnum(str, Enum):
    silver = "silver"
    weak = "weak"


class GraphFilters(BaseModel):
    aggregate: bool = Field(
        default=True, description="Create aggregate graph from document annotations"
    )
    quality: GraphQualityEnum = Field(
        default=GraphQualityEnum.silver, description="Annotation quality"
    )
    search_term: str = Field(
        default="", description="Search term used to filter project documents"
    )
    label_ids: List[str] = Field(default=[], description="List of ontology label ids")
