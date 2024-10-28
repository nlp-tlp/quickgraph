from motor.motor_asyncio import AsyncIOMotorDatabase

import services.dataset as dataset_services
import services.markup as markup_services
import services.projects as project_services
import services.resources as resource_services
from models.markup import (CreateEntity, CreateMarkupApply, CreateRelation,
                           OutMarkupApply)
from models.project import CreateProject, Project
from tests.data import (base_dataset, base_entity_preannotation_resource,
                        base_entity_project, base_relation_project,
                        entity_resource, relation_resource)
from tests.settings import settings

USERNAME = settings.TEST_USERNAME


async def create_entity_project(
    db: AsyncIOMotorDatabase, annotators: int = 0, preannotate: bool = False
) -> Project:
    """Creates a single annotator, blank, entity project without any existing markup

    Args
        annotators : number of annotators to be added to the project
        preannotate : flag indicating whether to apply preannotation to project dataset
    """

    resource = await resource_services.create_one_resource(
        db=db, resource=entity_resource.copy(), username=USERNAME
    )

    dataset = await dataset_services.create_dataset(
        db, dataset=base_dataset.copy(), username=USERNAME
    )

    annotators = [f"dummy-annotator-{idx+1}" for idx in range(annotators)]
    print(f"Inviting annotators: {annotators}")

    project_template = CreateProject(
        **base_entity_project.copy().dict(),
        resource_ids=[str(resource["_id"])],
        dataset_id=str(dataset.id),
    )

    project_template.annotators = annotators

    if preannotate:
        # Create entity preannotation resource and associate `id` with project `resource_ids`
        # NOTE: preannotation must be an ontology associated with it;
        preannotation_resource = await resource_services.create_one_resource(
            db=db, resource=base_entity_preannotation_resource.copy(), username=USERNAME
        )

        # Extend `resource_ids` to include preannotation resource `id`
        project_template.resource_ids += [str(preannotation_resource["_id"])]

    print(f"project_template: {project_template}")

    project = await project_services.create_project(
        db=db,
        username=USERNAME,
        project=project_template,
    )
    return project


async def create_relation_project(db: AsyncIOMotorDatabase) -> Project:
    """Creates a single annotator, blank, entity/relation project without any existing markup"""
    created_entity_resource = await resource_services.create_one_resource(
        db=db, resource=entity_resource.copy(), username=USERNAME
    )

    created_relation_resource = await resource_services.create_one_resource(
        db=db, resource=relation_resource.copy(), username=USERNAME
    )

    # Create dataset
    dataset = await dataset_services.create_dataset(
        db, dataset=base_dataset.copy(), username=USERNAME
    )

    # Create project
    project = await project_services.create_project(
        db=db,
        username=USERNAME,
        project=CreateProject(
            **base_relation_project.copy().dict(),
            resource_ids=[
                str(created_entity_resource["_id"]),
                str(created_relation_resource["_id"]),
            ],
            dataset_id=str(dataset.id),
        ),
    )
    return project


async def create_dataset(db: AsyncIOMotorDatabase):
    created_dataset = await dataset_services.create_dataset(
        db, dataset=base_dataset.copy(), username=settings.TEST_USERNAME
    )
    return created_dataset


async def create_entity_markup(
    db: AsyncIOMotorDatabase,
    entity_project: Project,
    span_start: int = 0,
    span_end: int = 1,
    apply_all: bool = False,
    suggested: bool = False,
    dataset_item_id: str = None,
    username: str = USERNAME,
):
    """Creates deterministic markup on span of tokens on a given dataset_item

    Args
        span_start : start of token span to associated entity with
        span_start : end of token span to associated entity with
    """
    dataset_items = await dataset_services.find_many_dataset_items(
        db=db, dataset_id=entity_project.dataset_id
    )
    dataset_item = dataset_items[0]

    default_entity_markup = {
        "start": span_start,
        "end": span_end,
        "ontology_item_id": entity_project.ontology.entity[0].id,
        "surface_form": " ".join(dataset_item.tokens[span_start : span_end + 1]),
    }

    print(
        f'CREATING ENTITY MARKUP - {default_entity_markup["surface_form"]} ({default_entity_markup["ontology_item_id"]})'
    )

    # Create single markup
    created_markup = await markup_services.apply_annotation(
        db=db,
        project_id=entity_project.id,
        markup=CreateMarkupApply(
            project_id=str(entity_project.id),
            dataset_item_id=dataset_item_id
            if dataset_item_id
            else str(
                dataset_item.id
            ),  # if `many` then this is the `focus` dataset item
            extra_dataset_item_ids=[],
            annotation_type="entity",
            suggested=suggested,
            content=CreateEntity(
                ontology_item_id=default_entity_markup["ontology_item_id"],
                start=default_entity_markup["start"],
                end=default_entity_markup["end"],
                surface_form=default_entity_markup["surface_form"],
            ),
        ),
        apply_all=apply_all,
        username=username,
    )

    return created_markup, default_entity_markup


async def create_relation_markup(
    db: AsyncIOMotorDatabase,
    relation_project: Project,
    dataset_item_id: str = None,
    source_id: str = None,
    target_id: str = None,
    ontology_item_id: str = None,
    create_entities: bool = False,
    apply_all: bool = False,
    username: str = USERNAME,
):
    """Creates deterministic relation markup initiating from existing source and target entity markup. Relation(s) can be either created from a given dataset_item or via creating entities from scratch.

    Args
        dataset_item_id : dataset item identifier - this is the origin of the relation and its src/tgt entities
        source_id : source entity identifier
        target_id : target entity identifier
        ontology_item_id : ontology item id associated for relation
        create_entities : flag for whether entities should be created before relation application
        apply_all : flag indicating to apply relations across all dataset items associated with the relation project
    """

    if create_entities:
        source_entity_markup, _ = await create_entity_markup(
            db=db, entity_project=relation_project, span_start=0, span_end=0
        )
        source_id = get_first_output_entity_markup(source_entity_markup).id

        target_entity_markup, _ = await create_entity_markup(
            db=db, entity_project=relation_project, span_start=1, span_end=1
        )
        target_entity = get_first_output_entity_markup(target_entity_markup)
        target_id = target_entity.id

        dataset_item_id = str(target_entity.dataset_item_id)
    else:
        # If entities not created, ensure that args are supplied
        assert all(filter(lambda x: x != None, [dataset_item_id, source_id, target_id]))

    default_relation_markup = {
        "ontology_item_id": relation_project.ontology.relation[0].id
    }

    created_markup = await markup_services.apply_annotation(
        db=db,
        project_id=relation_project.id,
        markup=CreateMarkupApply(
            project_id=str(relation_project.id),
            dataset_item_id=dataset_item_id,
            extra_dataset_item_ids=[],
            annotation_type="relation",
            suggested=False,  # TODO: make this NoneType optional
            content=CreateRelation(
                ontology_item_id=ontology_item_id
                if ontology_item_id
                else default_relation_markup["ontology_item_id"],
                source_id=source_id,
                target_id=target_id,
            ),
        ),
        apply_all=apply_all,
        username=username,
    )

    return created_markup, default_relation_markup


def get_first_output_entity_markup(markup: OutMarkupApply):
    """Access the output structure of `OutputMarkupApply` to get the first markup element for validation"""
    return markup.entities[list(markup.entities.keys())[0]][0]
