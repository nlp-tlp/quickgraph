import bson
from bson import ObjectId

from models.resources import CreateResourceModel, OntologyItem, ResourceClassifications
from models.markup import InMarkupApply, EntityMarkup, CreateEntity, CreateMarkupApply
from models.project import (
    CreateProject,
    Preprocessing,
    PreannotationResource,
    Settings,
    Tasks,
    # TokenizerEnum,
    DatasetItem,
    BasicEntity,
)

from settings import settings


def get_examples(example_type: str):

    examples = {
        "create_resource": {
            "entity": {
                "summary": "An entity resource example",
                "description": "An entity resource has no domain or range.",
                "value": CreateResourceModel(
                    name="animals",
                    classification=ResourceClassifications.ontology,
                    sub_classification="entity",
                    created_by=settings.EXAMPLE_USERNAME,
                    ontology=[
                        OntologyItem(
                            name="Mammal",
                            color="#32a852",
                            children=[
                                OntologyItem(name="Cat", color="#32a852", children=[])
                            ],
                        )
                    ],
                ).dict(),
            },
            "relation": {
                "summary": "A relation resource example",
                "description": "A relation resource can be constrained.",
                "value": CreateResourceModel(
                    name="animals",
                    classification=ResourceClassifications.ontology,
                    sub_classification="relation",
                    created_by=settings.EXAMPLE_USERNAME,
                    ontology=[
                        OntologyItem(name="hasParent"),
                        OntologyItem(name="hasSibling"),
                    ],
                ),
            },
        },
        # "create_project": {
        #     "entity-project-no-preprocessing": {
        #         "summary": "Basic entity annotation project",
        #         "description": "An entity annotation project with no preprocessing, document ids, preannotation resources, or invited annotators",
        #         "value": CreateProject(
        #             created_by=settings.EXAMPLE_USERNAME,
        #             name="test-project",
        #             description="project for testing api",
        #             preprocessing=Preprocessing(
        #                 lowercase=False,
        #                 remove_duplicates=False,
        #                 chars_removed=False,
        #                 tokenizer=TokenizerEnum.punkt,
        #             ),
        #             resource_ids=["63bb4dc02328eff7baa3e8ad"],
        #             settings=Settings(annotators_per_item=1, disable_propagation=False),
        #             tasks=Tasks(entity=True, relation=False),
        #             dataset=[DatasetItem(content="hello world my name is John Smith.")],
        #             preannotation_resource=PreannotationResource(
        #                 entity=[
        #                     BasicEntity(
        #                         surface_form="John Smith", classification="Person"
        #                     )
        #                 ]
        #             ),
        #             annotators=[],
        #         ),
        #     }
        # },
        "create_markup": {
            "entity-annotation": {
                "summary": "Basic entity annotation",
                "description": "Perform a single silver entity annotation on a dataset item",
                "value": CreateMarkupApply(
                    annotation_type="entity",
                    apply_all=False,
                    project_id="<INSERT_PROJECT_ID>",
                    dataset_item_id="<INSERT_DATASET_ITEM_ID>",
                    extra_dataset_item_ids=[],
                    suggested=False,
                    content=CreateEntity(
                        ontology_item_id="i1",
                        start=0,
                        end=1,
                        surface_form="John Smith",
                    ).dict(),
                ).dict(),
            }
        },
    }

    return examples[example_type]
