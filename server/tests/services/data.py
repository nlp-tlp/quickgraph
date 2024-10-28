"""Repository of data for testing"""

from models.resources import (
    OntologyItem,
    CreateResourceModel,
    ResourceClassifications,
    EntityPreannotation,
    RelationPreannotation,
    Constraint,
)
from models.project import (
    TestCreateProject,
    Tasks,
    Settings,
    PreannotationResource,
    BasicEntity,
)
from models.dataset import BaseItem, CreateDataset, Preprocessing, TokenizerEnum

# ------ RESOURCES ------
entity_resource = CreateResourceModel(
    name="test resource",
    classification=ResourceClassifications.ontology,
    sub_classification="entity",
    ontology=[
        OntologyItem(
            name="Person",
            children=[OntologyItem(name="President")],
        ),
        OntologyItem(name="Organisation"),
        OntologyItem(name="Location"),
    ],
)

relation_resource = CreateResourceModel(
    name="test resource",
    classification=ResourceClassifications.ontology,
    sub_classification="relation",
    ontology=[
        OntologyItem(name="relatedTo"),
        OntologyItem(name="locatedAt"),
        OntologyItem(name="worksFor"),
        OntologyItem(name="hasSurname"),
    ],
)

preannotation_resource = CreateResourceModel(
    name="test entity preannotation",
    classification=ResourceClassifications.preannotation,
    sub_classification="entity",
    preannotations=[
        EntityPreannotation(surface_form="Apple", classification="Organisation"),
        EntityPreannotation(surface_form="Microsoft", classification="Organisation"),
        EntityPreannotation(surface_form="John", classification="Person"),
        EntityPreannotation(surface_form="John Smith", classification="Person"),
        EntityPreannotation(surface_form="Dodge Viper", classification="Vehicle"),
    ],
)

# Note: constraints can only be applied to existing ontologies;
# entity constraints enforce entities cannot be nested e.g. Person and Location cannot be the same entity;
# relation constraints enforce that specific entities can only be the src/tgt
# constraints_resource = CreateResourceModel(
#     name='entity constraints',
#     classification=ResourceClassifications.constraints,
#     sub_classification='entity',
#     constraints=[Constraint(domain=[''])]
# )


update_entity_ontology = [
    OntologyItem(
        name="Person",
        children=[OntologyItem(name="President")],
    ),
    OntologyItem(name="Organisation"),
    OntologyItem(name="Location"),
    OntologyItem(name="Miscellaneous"),
]

base_entity_preannotation_resource = PreannotationResource(
    entity=[
        BasicEntity(surface_form="Apple", classification="Organisation"),
        BasicEntity(surface_form="Microsoft", classification="Organisation"),
        BasicEntity(surface_form="John", classification="Person"),
        BasicEntity(surface_form="John Smith", classification="Person"),
        BasicEntity(surface_form="Dodge Viper", classification="Vehicle"),
    ]
)


# ------ PROJECT ------
base_entity_project = TestCreateProject(
    name="test project",
    description="project for testing",
    settings=Settings(annotators_per_item=1, disable_propagation=False),
    annotators=[],
    preannotation_resource=[],
    tasks=Tasks(entity=True, relation=False),
)

base_relation_project = TestCreateProject(
    name="test relation project",
    description="relation project for testing",
    settings=Settings(annotators_per_item=1, disable_propagation=False),
    annotators=[],
    preannotation_resource=[],
    tasks=Tasks(entity=True, relation=True),
)


# ----- DATASET ------
base_preprocessing = Preprocessing(
    lowercase=False,
    remove_duplicates=False,
    chars_removed=False,
    tokenizer=TokenizerEnum.punkt,
)

base_item = BaseItem(
    original="John Smith works for Apple.",
    tokens="John Smith works for Apple.".split(" "),
)

base_dataset = CreateDataset(
    name="test dataset",
    description="dataset to facilitate testing",
    items=[
        BaseItem(
            original="John Smith works for Apple.",
            tokens="John Smith works for Apple.".split(" "),
        ),
        BaseItem(
            original="Jane Smith works for Microsoft.",
            tokens="Jane Smith works for Microsoft.".split(" "),
        ),
        BaseItem(
            original="John Smith worked at Microsoft.",
            tokens="John Smith worked at Microsoft.".split(" "),
        ),
        BaseItem(
            original="Jane Smith worked at Apple.",
            tokens="Jane Smith worked at Apple.".split(" "),
        ),
        BaseItem(
            original="John L Smith has a job. John Smith likes his job.",
            tokens="John L Smith has a job. John Smith likes his job.".split(" "),
        ),
        BaseItem(
            original="Jane Smith has a job. Jane Smith likes her job.",
            tokens="Jane Smith has a job. Jane Smith likes her job.".split(" "),
        ),
    ],
    preprocessing=Preprocessing(
        lowercase=False,
        remove_duplicates=False,
        chars_removed=False,
        tokenizer=TokenizerEnum.punkt,
    ),
)
