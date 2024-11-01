"""Project services."""

import itertools
import logging
import traceback
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

from bson import ObjectId
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..dataset.schemas import DatasetItem
from ..dataset.services import find_one_dataset
from ..markup.schemas import Entity, Relation, RichCreateEntity
from ..notifications.schemas import CreateNotification, NotificationContext
from ..notifications.services import (
    create_many_project_invitations,
    create_notification,
)
from ..utils.agreement import AgreementCalculator
from .schemas import (
    Annotator,
    AnnotatorRoles,
    AnnotatorStates,
    BaseSaveState,
    BasicEntity,
    CreateProject,
    Guidelines,
    OntologyItem,
    Preprocessing,
    Project,
    ProjectDataset,
    ProjectDatasetItem,
    ProjectDownload,
    ProjectProgress,
    ProjectSocial,
    ProjectWithMetrics,
    ProjectWithOntologies,
    SaveResponse,
    Summary,
    Tasks,
    UserInviteBody,
    UserInviteResponse,
)

logger = logging.getLogger(__name__)


def assign_usernames_to_ids(
    ids: List[int], usernames: List[str], min_usernames_per_id: int
) -> dict:
    # Create a dictionary to store the number of times each username has been assigned
    username_counts = {username: 0 for username in usernames}

    # Create a list of IDs with minimum number of usernames assigned to them
    id_assignments = {id_: [] for id_ in ids}
    for id_ in ids:
        while len(id_assignments[id_]) < min_usernames_per_id:
            available_usernames = [
                username
                for username in usernames
                if username_counts[username] < min_usernames_per_id
            ]
            if not available_usernames:
                raise ValueError("Not enough usernames to meet minimum requirement.")
            username = min(available_usernames, key=username_counts.get)
            id_assignments[id_].append(username)
            username_counts[username] += 1

    # Assign additional usernames to the IDs with the fewest usernames assigned
    while True:
        min_assignments = min(
            len(assignments) for assignments in id_assignments.values()
        )
        if min_assignments >= min_usernames_per_id:
            break
        available_ids = [
            id_
            for id_, assignments in id_assignments.items()
            if len(assignments) == min_assignments
        ]
        available_usernames = [
            username
            for username in usernames
            if username_counts[username] < min_usernames_per_id
        ]
        if not available_usernames:
            raise ValueError("Not enough usernames to meet minimum requirement.")
        for id_ in available_ids:
            if len(id_assignments[id_]) < min_usernames_per_id:
                username = min(available_usernames, key=username_counts.get)
                id_assignments[id_].append(username)
                username_counts[username] += 1

    return id_assignments


def convert_ontology_to_pydantic(ontology: dict) -> List[OntologyItem]:
    """
    Convert ontologies into PyDantic structures

    # TODO: remove this in place of [OntologyItem.parse_onj(item) for item in ontology]
    """
    logger.info("Running `convert_ontology_dict_to_pydantic()`")
    try:
        for i, item in enumerate(ontology):
            ontology[i] = OntologyItem(**item)
            if item["children"]:
                ontology[i].children = convert_ontology_to_pydantic(item["children"])

        # logger.info(f"Pydantic object: {ontology}")
        return ontology
    except Exception as e:
        logger.info(f"error: {e}")


async def copy_dataset_blueprint(
    db: AsyncIOMotorDatabase,
    blueprint_dataset_id: ObjectId,
    project_id: ObjectId,
    username: str,
) -> Optional[Tuple[ObjectId, Dict[ObjectId, ObjectId]]]:
    """Creates a copy of a dataset and its dataset items and assigns it a project."""
    dataset = await db["datasets"].find_one(
        {"_id": blueprint_dataset_id, "is_blueprint": True}
    )
    if dataset is None:
        return

    dataset_items = (
        await db["data"]
        .find({"dataset_id": dataset["_id"], "is_blueprint": True})
        .to_list(None)
    )

    if dataset_items is None or len(dataset_items) == 0:
        return None

    dataset["is_blueprint"] = False
    dataset["project_id"] = project_id
    dataset["created_by"] = username
    dataset.pop("_id", None)

    project_dataset = await db["datasets"].insert_one(dataset)
    logger.info("Copied blueprint dataset")

    dataset_item_id_map_bp2project = {}
    for di in dataset_items:
        di["is_blueprint"] = False
        di["dataset_id"] = project_dataset.inserted_id
        bp_di_id = di.pop("_id", None)
        di["created_by"] = username
        di["project_id"] = project_id
        di["blueprint_dataset_item_id"] = bp_di_id

        _new_di = await db["data"].insert_one(di)

        dataset_item_id_map_bp2project[bp_di_id] = _new_di.inserted_id

        # dataset_item_copies.append(di)    # TODO: refactor back into bulk "insert_many"; using single to capture ids; this needs to be preserved.

    # Update project with new dataset_id
    await db["projects"].update_one(
        {"_id": project_id}, {"$set": {"dataset_id": project_dataset.inserted_id}}
    )
    return project_dataset.inserted_id, dataset_item_id_map_bp2project


async def prepare_project_resources(
    db: AsyncIOMotorDatabase, resource_ids: List[str]
) -> Optional[dict]:
    """Prepares project resource(s) by finding them via their UUID and associates to the project.
    NOTE:
        - resource_ids can be any classification/sub_classification e.g. ontologies or pre-annotations.
    """
    resources = (
        await db["resources"]
        .find({"_id": {"$in": [ObjectId(id) for id in resource_ids]}})
        .to_list(None)
    )

    if len(resources) == 0:
        return
    return resources


async def add_project_annotators(
    db: AsyncIOMotorDatabase,
    project_id: ObjectId,
    project_name: str,
    dataset_id: ObjectId,
    annotators: List[str],
    project_manager: str,
) -> Optional[List[Annotator]]:
    """Assigns annotator(s) to a project including sending invititation notifications."""
    try:
        logger.info("Adding project annotators")
        if len(annotators) > 0:
            await create_many_project_invitations(
                db=db,
                project_id=project_id,
                project_name=project_name,
                recipients=annotators,
                username=project_manager,
            )

        # Get dataset item ids for scope assignment - default scope is all dataset items
        dataset_item_ids = (
            await db["data"].find({"dataset_id": dataset_id}).to_list(None)
        )
        dataset_item_ids = [di["_id"] for di in dataset_item_ids]

        annotators = [
            Annotator(
                username=username,
                role=AnnotatorRoles.annotator,
                state=AnnotatorStates.invited,
                scope=[],  # This is assigned after the project is created at the moment.
            )
            for username in annotators
        ]

        annotators = annotators + [
            Annotator(
                username=project_manager,
                role=AnnotatorRoles.project_manager,
                state=AnnotatorStates.accepted,
                scope=[
                    {"dataset_item_id": di, "visible": True} for di in dataset_item_ids
                ],
            )
        ]

        # Add annotators to project
        await db["projects"].update_one(
            {"_id": project_id},
            {"$set": {"annotators": [a.dict() for a in annotators]}},
        )

        return annotators
    except Exception as e:
        logger.info(f"Error: {e}")
        return None


def annotate_single_label(
    gazetteer: Dict[str, List[str]],
    dataset_items: List[DatasetItem],
    preprocessing: Preprocessing,
):
    """
    Creates a single label corpus using a gazetteer of semantically classified phrases.
    Tagging is biased with a length preference, e.g. "Western Australia" will be tagged as "Western Australia" not "Australia".
    """

    if preprocessing.tokenizer == "whitespace":
        tokenizer = lambda x: x.split(" ")
    elif preprocessing.tokenizer == "punkt":
        # Tokenize with NLTK Punkt tokenizer
        raise NotImplementedError("Punkt tokenizer is currently not available")
        # tokenizer = lambda x: word_tokenize(x)
    else:
        raise NotImplementedError("Tokenizer not supported")

    dataset_item_id_with_mentions = {}
    mention_count = 0
    for dataset_item in dataset_items:
        _mentions = []
        di_tokens = dataset_item.tokens

        for mention_type, mention_phrases in gazetteer.items():
            # Sort the phrases in descending order of length
            mention_phrases.sort(key=len, reverse=True)

            for mention_text in mention_phrases:
                if mention_text in dataset_item.text:
                    # logger.info("mention text identified")
                    mention_tokenized = tokenizer(mention_text)

                    # logger.info("mention_tokenized", mention_tokenized)

                    for t_idx in range(len(di_tokens)):
                        if (
                            di_tokens[t_idx : t_idx + len(mention_tokenized)]
                            == mention_tokenized
                        ):
                            mention_start = t_idx
                            mention_end = t_idx + len(mention_tokenized) - 1

                            _mentions.append(
                                {
                                    "classification": mention_type,
                                    "surface_form": mention_text,
                                    "start": mention_start,
                                    "end": mention_end,
                                }
                            )
                            mention_count += 1

                            # Replace the phrase with a placeholder to prevent it from being matched again
                            di_tokens = (
                                di_tokens[:mention_start]
                                + ["[MASK]"] * (mention_end - mention_start)
                                + di_tokens[mention_end:]
                            )

        dataset_item_id_with_mentions[dataset_item.id] = _mentions

    logger.info(f"Entities identified: {mention_count}")

    return dataset_item_id_with_mentions


async def preannotate_entity_project(
    db: AsyncIOMotorDatabase,
    project_id: ObjectId,
    dataset_id: ObjectId,
    entity_preannotation_resource: List[BasicEntity],
    annotators: List[Annotator],
    entity_ontology: List[OntologyItem],
    username: str,
    preference_span_length: bool = True,
):
    """Preannotate entity project with provided entity resource (fullname classification and surface form/phrase). Markups are created for all project annotators (inc. PM).

    Args
        preference_span_length : flag indicating whether to preference span length for entity markup. If `False`, markup will be applied as nested/overlapping regardless of span length.
        preprocessing : project
    """
    logger.info("entity_preannotation_resource", entity_preannotation_resource)
    logger.info("annotators", annotators)
    logger.info("entity_ontology", entity_ontology)

    # Filter preannotation items for those that do not match the specified entity ontology
    entity_ontology_fullnames = set(e.fullname for e in entity_ontology)
    logger.info("entity_ontology_fullnames", entity_ontology_fullnames)

    valid_entities = [
        e
        for e in entity_preannotation_resource
        if e["classification"] in entity_ontology_fullnames
    ]
    logger.info(f"valid_entities: {len(valid_entities)}")

    valid_entity_classifications = set([ve["classification"] for ve in valid_entities])

    valid_entity_fullnames_to_ontology_item_ids = {
        i.fullname: i.id
        for i in entity_ontology
        if i.fullname in valid_entity_classifications
    }

    logger.info(
        "valid_entity_fullnames_to_ontology_item_ids",
        valid_entity_fullnames_to_ontology_item_ids,
    )

    if len(valid_entities) > 0:
        # Get preprocessing configuration from dataset_id associated with project - this is used to
        # ensure entity surface form are treated equivalently
        dataset = await find_one_dataset(
            db=db, dataset_id=dataset_id, username=username
        )

        # Convert entity_map into
        gazetteer = {
            entity_classification: list(
                set([sf["surface_form"] for sf in surface_forms])
            )
            for entity_classification, surface_forms in itertools.groupby(
                valid_entities, key=lambda x: x["classification"]
            )
        }

        logger.info(f"gazetteer: {gazetteer}")

        # Apply annotations using resource for scope of annotators
        # Note: Annotations are applied with preference to longer spans.
        for annotator in annotators:
            dataset_item_ids = annotator.scope
            logger.info(f"{annotator.username} - dataset_item_ids", dataset_item_ids)

            dataset_items = (
                await db["data"].find({"_id": {"$in": dataset_item_ids}}).to_list(None)
            )

            # Extract entity mentions from dataset items
            dataset_item_entity_mentions = annotate_single_label(
                gazetteer=gazetteer,
                dataset_items=[DatasetItem(**di) for di in dataset_items],
                preprocessing=dataset.preprocessing,
            )
            logger.info("dataset_item_entity_mentions", dataset_item_entity_mentions)

            # Create entity markups
            entity_templates = list(
                itertools.chain.from_iterable(
                    [
                        [
                            RichCreateEntity(
                                project_id=project_id,
                                dataset_item_id=dataset_item_id,
                                created_by=annotator.username,
                                suggested=True,
                                classification="entity",
                                ontology_item_id=valid_entity_fullnames_to_ontology_item_ids[
                                    m["classification"]
                                ],
                                start=m["start"],
                                end=m["end"],
                                surface_form=m["surface_form"],
                            ).dict()
                            for m in entity_mentions
                        ]
                        for dataset_item_id, entity_mentions in dataset_item_entity_mentions.items()
                    ]
                )
            )
            await db["markup"].insert_many(entity_templates)


async def assign_bp_markup(
    db: AsyncIOMotorDatabase,
    bp_dataset_id: ObjectId,
    project_id: ObjectId,
    is_relation_task: bool,
    dataset_item_id_map_bp2project: Dict[ObjectId, ObjectId],
    suggested_preannotations: bool,
    username: str,
) -> None:
    """Assigns markup to a user.

    Parameters
    ----------
    db :

    bp_dataset_id :
        The UUID of the blueprint (bp) dataset.
    project_id :
        The UUID of the project.
    dataset_item_id_map_bp2project :
        A mapping between the UUID of blueprint dataset items and their project equivalents.
    suggested_preannotations :
        Flag indicating whether to set annotations as suggested
    username :
        The name of the user to assign markup to.
    """
    # Copy datasets blueprint annotations across all project annotators
    logger.info("Blueprint dataset has annotations. Copying to project.")

    # Get dataset item ids associated with bp dataset
    bp_dataset_items = (
        await db["data"].find({"dataset_id": bp_dataset_id}, {"_id": 1}).to_list(None)
    )
    bp_dataset_items_ids = [i["_id"] for i in bp_dataset_items]

    logger.info("bp_dataset_items_ids", bp_dataset_items_ids)

    # Retrieve associated markup
    bp_markup = (
        await db["markup"]
        .find(
            {
                "dataset_item_id": {"$in": bp_dataset_items_ids},
                "is_blueprint": True,
            }
        )
        .to_list(None)
    )

    # Output the number of blueprint markup found that are associated with the dataset
    logger.info(
        f"{len(bp_markup)} blueprint markup associated with the dataset were found."
    )

    # For each markup, make a copy and assign it to the PM, inviting annotators to apply their annotations
    # TODO: need to update source_id and target_id of all "relation" markup if the project requests it. Otherwise, the original BP markup ids are applied which mean they have erroneous connections.

    bp_entity_markup_id_map = (
        {}
    )  # This object holds a mapping between the original bp markup and the created markup; specifically so relation markup can be connected properly.

    async def _copy_bp_markup(classification: str, markup):
        copy_markup = dict(markup)
        copy_markup.pop("_id")

        # Modify the markup
        copy_markup["is_blueprint"] = False
        copy_markup["dataset_item_id"] = dataset_item_id_map_bp2project[
            copy_markup["dataset_item_id"]
        ]
        copy_markup["project_id"] = project_id
        copy_markup["created_by"] = username
        copy_markup["suggested"] = suggested_preannotations

        if classification == "relation":
            copy_markup["source_id"] = bp_entity_markup_id_map[copy_markup["source_id"]]
            copy_markup["target_id"] = bp_entity_markup_id_map[copy_markup["target_id"]]

        # Insert the modified markup into the database
        new_markup = await db["markup"].insert_one({**copy_markup})
        return new_markup.inserted_id

    # Process entity markup first
    for markup in [m for m in bp_markup if m["classification"] == "entity"]:
        old_markup_id = markup["_id"]
        new_markup_id = await _copy_bp_markup(classification="entity", markup=markup)
        bp_entity_markup_id_map[old_markup_id] = new_markup_id
    logger.info("bp_entity_markup_id_map", bp_entity_markup_id_map)

    # Process relation markup if project requests it
    if is_relation_task:
        for markup in [m for m in bp_markup if m["classification"] == "relation"]:
            await _copy_bp_markup(classification="relation", markup=markup)

    # Output the completion of the addition of annotated data markup copies
    logger.info("Annotated data markup copies have been added.")


async def create_project(
    db: AsyncIOMotorDatabase, project: CreateProject, username: str
) -> Optional[Project]:
    """Creates a project.

    Optional preannotation will preannotate markup set as suggested.
    """
    logger.info("Creating new project.")
    project = project.model_dump()
    # Prepare project resource(s)
    resource_ids = project.pop("blueprint_resource_ids")
    resources = await prepare_project_resources(db=db, resource_ids=resource_ids)
    if resources is None:
        return

    # Create base project
    new_project = await db.projects.insert_one(
        {
            **project,
            "guidelines": Guidelines().model_dump(),
            "annotators": [],  # Placeholder - `add_project_annotators` will populate this field.
            "created_by": username,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "blueprint_resource_ids": resource_ids,
        }
    )
    logger.info(f"Created base project: {new_project.inserted_id}")

    preannotation_resources = {
        r["sub_classification"]: r
        for r in resources
        if r["classification"] == "preannotation"
    }

    _ontology_resources = {
        r["sub_classification"]: r
        for r in resources
        if r["classification"] == "ontology"
    }

    # Create project resources
    _ontology_ids = {"entity_ontology_id": None, "relation_ontology_id": None}
    for _clf, _resource in _ontology_resources.items():
        # Copy blueprint ontology to project
        logger.info(f'Creating project resource for "{_clf}": {_resource}')

        # Remove _id from blueprint
        del _resource["_id"]

        _inserted_resource = await db.resources.insert_one(
            {
                **_resource,
                "is_blueprint": False,
                "project_id": new_project.inserted_id,
                "created_by": username,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )
        logger.info(
            f'Created project resource for "{_clf}": {_inserted_resource.inserted_id}'
        )
        _ontology_ids[f"{_clf}_ontology_id"] = _inserted_resource.inserted_id

    await db.projects.find_one_and_update(
        {"_id": new_project.inserted_id}, {"$set": _ontology_ids}
    )
    logger.info("Created project resources")

    try:
        # Create new project; use resource ids to find and assign ontologies to the project under the `ontology` key.
        created_project = await db.projects.find_one({"_id": new_project.inserted_id})
        logger.info(f'Created project "{created_project}"')

        # Create project dataset by cloning blueprint
        bp_dataset_result = await copy_dataset_blueprint(
            db=db,
            blueprint_dataset_id=ObjectId(project["blueprint_dataset_id"]),
            project_id=new_project.inserted_id,
            username=username,
        )

        if bp_dataset_result is None:
            return
        project_dataset_id, dataset_item_id_map_bp2project = bp_dataset_result
        logger.info("Created project dataset")

        # Create annotators and send invitations to the project
        annotators = await add_project_annotators(
            db=db,
            project_id=created_project["_id"],
            project_name=created_project["name"],
            dataset_id=project_dataset_id,
            annotators=project["annotators"],
            project_manager=username,
        )
        if annotators is None:
            return
        logger.info("Added project annotators")

        bp_dataset_id = ObjectId(project["blueprint_dataset_id"])
        bp_dataset = await db["datasets"].find_one({"_id": bp_dataset_id})

        if bp_dataset["is_annotated"]:
            await assign_bp_markup(
                db=db,
                bp_dataset_id=bp_dataset_id,
                project_id=new_project.inserted_id,
                is_relation_task=project["tasks"]["relation"],
                dataset_item_id_map_bp2project=dataset_item_id_map_bp2project,
                suggested_preannotations=project["settings"][
                    "suggested_preannotations"
                ],
                username=username,
            )
        else:
            # TODO: Review this
            # Preannotate dataset with preannotation resources
            # preannotation_resource = project.pop("preannotation_resource")
            entity_preannotation_resource = preannotation_resources.get("entity")
            relation_preannotation_resource = preannotation_resources.get("relation")

            if entity_preannotation_resource:
                if created_project.tasks.relation:
                    # This will use `relation_preannotation_resource`
                    raise NotImplementedError(
                        "Relation preannotation not currently supported"
                    )
                else:
                    raise NotImplementedError(
                        "Entity preannotation not currently supported"
                    )
                    await preannotate_entity_project(
                        db=db,
                        project_id=created_project.id,
                        dataset_id=created_project.dataset_id,
                        entity_preannotation_resource=entity_preannotation_resource,
                        annotators=annotators,
                        username=username,
                        entity_ontology=created_project.ontology.entity,
                    )

        created_project = await db["projects"].find_one({"_id": created_project["_id"]})
        return Project(**created_project)
    except Exception as e:
        logger.info(f"Error occurred creating project ({e}): Destroying...")
        traceback.print_exc()

        await delete_one_project(
            db=db, project_id=new_project.inserted_id, username=username
        )
        return


async def find_one_project(
    db: AsyncIOMotorDatabase, project_id: ObjectId, username: str
) -> Optional[ProjectWithOntologies]:
    """Finds a single project and computes project progress information"""
    pipeline = [
        {
            "$match": {
                "_id": project_id,
                "$or": [
                    {"created_by": username},
                    {
                        "annotators": {
                            "$elemMatch": {
                                "username": username,
                                "disabled": False,
                                "state": "accepted",
                            },
                        },
                    },
                ],
            }
        },
        {
            "$lookup": {
                "from": "resources",
                "localField": "entity_ontology_id",
                "foreignField": "_id",
                "as": "entity_ontology_all",
            }
        },
        {"$unwind": "$entity_ontology_all"},
        {
            "$addFields": {
                "entity_ontology": {
                    "_id": "$entity_ontology_all._id",
                    "content": "$entity_ontology_all.content",
                }
            }
        },
        {"$project": {"entity_ontology_all": 0}},
        {
            "$lookup": {
                "from": "resources",
                "localField": "relation_ontology_id",
                "foreignField": "_id",
                "as": "relation_ontology_all",
            }
        },
        {
            "$unwind": {
                "path": "$relation_ontology_all",
                "preserveNullAndEmptyArrays": True,
            }
        },
        {
            "$addFields": {
                "relation_ontology": {
                    "_id": "$relation_ontology_all._id",
                    "content": "$relation_ontology_all.content",
                }
            }
        },
        {
            "$addFields": {
                "relation_ontology": {
                    "$cond": {
                        "if": {"$eq": [{}, "$relation_ontology"]},
                        "then": None,
                        "else": "$relation_ontology",
                    }
                }
            }
        },
        {"$project": {"relation_ontology_all": 0}},
    ]

    project = await db.projects.aggregate(pipeline).to_list(None)

    if len(project) == 0:
        return None
    project = project[0]

    # Get relation counts (TODO: make this more elegant)
    relation_counts = (
        await db["markup"]
        .find(
            {
                "project_id": project_id,
                "created_by": username,
                "classification": "relation",
            }
        )
        .to_list(None)
    )
    relation_counts = Counter([r["ontology_item_id"] for r in relation_counts])
    # logger.info(f"relation_counts :: {dict(relation_counts)}")
    return ProjectWithOntologies(**project, relation_counts=dict(relation_counts))


async def find_many_projects(
    db: AsyncIOMotorDatabase, username: str
) -> List[ProjectWithMetrics]:
    """Finds many projects and computes project progress information"""
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"created_by": username},
                    {
                        "annotators": {
                            "$elemMatch": {
                                "username": username,
                                "disabled": False,
                                "state": "accepted",
                            },
                        },
                    },
                ],
            },
        },
        {
            "$lookup": {
                "from": "data",
                "localField": "_id",
                "foreignField": "project_id",
                "as": "dataset_items",
            }
        },
        {
            "$addFields": {
                "total_items": {"$size": "$dataset_items"},
                "saved_items": {
                    "$size": {
                        "$filter": {
                            "input": "$dataset_items.save_states",
                            "cond": {
                                "$gte": [
                                    {"$size": "$$this.created_by"},
                                    "$settings.annotators_per_item",
                                ]
                            },
                        }
                    }
                },
                "active_annotators": {
                    "$filter": {
                        "input": "$annotators",
                        "cond": {"$eq": ["$$this.state", "accepted"]},
                    }
                },
                "user_is_pm": {"$eq": ["$created_by", username]},
            }
        },
        {
            "$project": {
                "tasks": 1,
                "name": 1,
                "description": 1,
                "active_annotators.username": 1,
                "created_at": 1,
                "updated_at": 1,
                "created_by": 1,
                "user_is_pm": 1,
                "saved_items": 1,
                "total_items": 1,
                "created_by": 1,
            }
        },
    ]

    projects = await db.projects.aggregate(pipeline).to_list(None)

    logger.info(f"projects: {projects}")

    if len(projects) == 0:
        return []
    return [ProjectWithMetrics(**p) for p in projects]


async def delete_one_project(
    db: AsyncIOMotorDatabase, project_id: ObjectId, username: str
) -> bool:
    """Cascade delete single project.

    Cascade deletes project after verifying the user is the project manager.
    The cascade delete includes associated dataset items and markup.
    Project deletion will result in all users losing access to the project.
    """
    try:
        project = await db["projects"].find_one(
            {"_id": ObjectId(project_id), "created_by": username}
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found.",
            )

        # Delete project markups
        await db["markup"].delete_many({"project_id": project_id})

        # Delete project notifications
        await db["notifications"].delete_many({"content_id": project_id})

        # Delete project
        await db["projects"].delete_one({"_id": project_id, "created_by": username})

        # Delete project dataset and dataset items
        await db["data"].delete_many({"dataset_id": project["dataset_id"]})
        await db["datasets"].delete_one({"_id": project["dataset_id"]})

        return True
    except Exception as e:
        logger.info(f"Error: {e}")
        return False


async def get_project_progress(
    db: AsyncIOMotorDatabase, project_id: ObjectId, username: str
) -> Optional[ProjectProgress]:
    """Calculates project progress based on dataset items saved by user"""
    try:
        pipeline: List[Dict[str, Any]] = [
            {"$match": {"project_id": project_id}},
            {
                "$group": {
                    "_id": None,
                    "dataset_size": {"$sum": 1},
                    "dataset_items_saved": {
                        "$sum": {
                            "$size": {
                                "$filter": {
                                    "input": {"$ifNull": ["$save_states", []]},
                                    "cond": {"$eq": ["$$this.created_by", username]},
                                }
                            }
                        }
                    },
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "dataset_size": 1,
                    "dataset_items_saved": 1,
                    "value": {
                        "$multiply": [
                            {
                                "$divide": [
                                    "$dataset_items_saved",
                                    {"$ifNull": ["$dataset_size", 1]},
                                ]
                            },
                            100,
                        ]
                    },
                }
            },
        ]

        project_progress = await db["data"].aggregate(pipeline).to_list(1)

        return ProjectProgress(**project_progress[0])
    except Exception as e:
        logger.info(f"Error: {e}")
        return None


async def save_many_dataset_items(
    db: AsyncIOMotorDatabase,
    project_id: ObjectId,
    dataset_item_ids: List[ObjectId],
    username: str,
) -> SaveResponse:
    """Saves many dataset items for a user"""
    new_save_state = BaseSaveState(created_by=username).model_dump()

    markup_pipeline = [
        {"$match": {"_id": {"$in": [ObjectId(oid) for oid in dataset_item_ids]}}},
        {
            "$addFields": {
                "save_states": {
                    "$ifNull": ["$save_states", []],
                },
            },
        },
        {
            "$lookup": {
                "from": "markup",
                "localField": "_id",
                "foreignField": "dataset_item_id",
                "as": "markup",
            }
        },
        {
            "$unwind": {
                "path": "$markup",
                "preserveNullAndEmptyArrays": True,
            },
        },
        {
            "$lookup": {
                "from": "markup",
                "localField": "markup.source_id",
                "foreignField": "_id",
                "as": "source",
            }
        },
        {
            "$lookup": {
                "from": "markup",
                "localField": "markup.target_id",
                "foreignField": "_id",
                "as": "target",
            }
        },
        {"$unwind": {"path": "$source", "preserveNullAndEmptyArrays": True}},
        {"$unwind": {"path": "$target", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "source.project_id": 0,
                "source.dataset_item_id": 0,
                "source.created_at": 0,
                "source.updated_at": 0,
                "target.project_id": 0,
                "target.dataset_item_id": 0,
                "target.created_at": 0,
                "target.updated_at": 0,
                "project_id": 0,
                "target._id": 0,
                "source._id": 0,
                "markup.dataset_item_id": 0,
                "markup.is_blueprint": 0,
                "markup.created_at": 0,
                "markup.project_id": 0,
                "markup._id": 0,
                "markup.source_id": 0,
                "markup.target_id": 0,
                "markup.source.is_blueprint": 0,
                "markup.target.is_blueprint": 0,
            }
        },
        {"$addFields": {"markup.source": "$source", "markup.target": "$target"}},
        {
            "$group": {
                "_id": "$_id",
                "markup": {"$push": "$markup"},
                "save_states": {"$first": "$save_states"},
                "tokens": {"$first": "$tokens"},
                "original": {"$first": "$original"},
            }
        },
    ]

    if len(dataset_item_ids) > 1:
        # Bulk save - only set to saved, doesn't permit unsave

        # Update items that have not been saved yet
        # TODO: create new Save State pydantic model, they don't need 'dataset_item_id' anymore.

        result = await db["data"].update_many(
            {
                "_id": {"$in": dataset_item_ids},
                "save_states.created_by": {"$ne": username},
            },
            {"$push": {"save_states": new_save_state}},
            upsert=True,
        )

        # TODO: Calculate overall IAA for each document and update their states

        # dataset_items = await db['data']

        return SaveResponse(count=result.modified_count)
    else:
        # Update save state of user on dataset item
        di = await db.data.find_one({"_id": dataset_item_ids[0]})
        di_save_states = di.get("save_states", [])
        if username not in [ss["created_by"] for ss in di_save_states]:
            di_save_states.append(new_save_state)
            await db.data.update_one(
                {"_id": dataset_item_ids[0]},
                {"$set": {"save_states": di_save_states}},
                upsert=False,
            )
            return SaveResponse(count=1)
        else:
            # remove save state
            di_save_states = [
                ss for ss in di_save_states if ss["created_by"] != username
            ]
            await db.data.update_one(
                {"_id": dataset_item_ids[0]},
                {"$set": {"save_states": di_save_states}},
                upsert=False,
            )
            return SaveResponse(count=1)

        # result = await db["data"].update_one(
        #     {"_id": dataset_item_ids[0]},
        #     [
        #         {
        #             "$set": {
        #                 "save_states": {
        #                     "$cond": {
        #                         "if": {
        #                             "$in": [
        #                                 username,
        #                                 {"$ifNull": ["$save_states.created_by", []]},
        #                             ]
        #                         },
        #                         "then": {
        #                             "$filter": {
        #                                 "input": {"$ifNull": ["$save_states", []]},
        #                                 "as": "state",
        #                                 "cond": {
        #                                     "$ne": ["$$state.created_by", username]
        #                                 },
        #                             },
        #                         },
        #                         "else": {
        #                             "$concatArrays": [
        #                                 {"$ifNull": ["$save_states", []]},
        #                                 [new_save_state],
        #                             ],
        #                         },
        #                     },
        #                 }
        #             }
        #         }
        #     ],
        #     upsert=False,
        # )

        # try:
        #     dataset_item = await db["data"].aggregate(markup_pipeline).to_list(None)
        #     dataset_item = dataset_item[0]

        #     saved_users = [ss["created_by"] for ss in dataset_item["save_states"]]
        #     entity_markup = [
        #         e for e in dataset_item["markup"] if e["classification"] == "entity"
        #     ]
        #     relation_markup = [
        #         r for r in dataset_item["markup"] if r["classification"] == "relation"
        #     ]

        #     agreement_calculator = AgreementCalculator(
        #         entity_data=[
        #             {
        #                 "start": m["start"],
        #                 "end": m["end"],
        #                 "label": m["ontology_item_id"],
        #                 "username": m["created_by"],
        #                 "doc_id": str(dataset_item["_id"]),
        #             }
        #             for m in entity_markup
        #             if m["created_by"] in saved_users
        #         ],
        #         relation_data=[
        #             {
        #                 "label": m["ontology_item_id"],
        #                 "username": m["created_by"],
        #                 "source": {
        #                     "start": m["source"]["start"],
        #                     "end": m["source"]["end"],
        #                     "label": m["source"]["ontology_item_id"],
        #                 },
        #                 "target": {
        #                     "start": m["target"]["start"],
        #                     "end": m["target"]["end"],
        #                     "label": m["target"]["ontology_item_id"],
        #                 },
        #                 "doc_id": str(dataset_item["_id"]),
        #             }
        #             for m in relation_markup
        #             if m["created_by"] in saved_users
        #         ],
        #     )

        #     entity_overall_agreement_score = agreement_calculator.overall_agreement()
        #     # logger.info("entity_overall_agreement_score", entity_overall_agreement_score)

        #     relation_overall_agreement_score = agreement_calculator.overall_agreement(
        #         "relation"
        #     )

        #     overall_agreement_score = agreement_calculator.overall_average_agreement()
        #     # logger.info('overall_agreement_score', overall_agreement_score)

        #     # Update IAA of dataset item
        #     await db["data"].update_one(
        #         {"_id": dataset_item_ids[0]},
        #         [
        #             {
        #                 "$set": {
        #                     "iaa": {
        #                         "overall": overall_agreement_score,
        #                         "entity": entity_overall_agreement_score,
        #                         "relation": relation_overall_agreement_score,
        #                         "last_updated": datetime.utcnow(),
        #                     }
        #                 }
        #             }
        #         ],
        #         upsert=False,
        #     )

        # except Exception as e:
        #     logger.info(f"Error occurred calculating IAA: {e}")

        # return SaveResponse(count=result.modified_count)


async def get_project_annotator(
    db: AsyncIOMotorDatabase, project_id: ObjectId, username: str
) -> Union[None, Annotator]:
    """Checks existence of a project annotator"""

    try:
        project = Project(
            **await db["projects"].find_one(
                {"_id": project_id, "annotators.username": username}
            )
        )
        if project:
            return [a for a in project.annotators if a.username == username][0]
    except:
        return


async def invite_single_project_annotator(
    db: AsyncIOMotorDatabase, project_id: ObjectId, invitee_username: str, username: str
):
    """Invites a single annotator to a project - annotator state, role and scope are set automatically.

    Args
        invitee_username : username of annotator to be invited to the project
        username : username of user sending invitation
    """

    # Check that user is not already on the project
    project_annotator = await get_project_annotator(
        db=db, project_id=project_id, username=invitee_username
    )

    if project_annotator:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project annotator already exists",
        )

    # Get dataset item scope - NOTE: currently assigns all dataset items
    project = await find_one_project(db=db, project_id=project_id, username=username)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Project does not exist or you lack authorisation",
        )

    dataset_id = project.dataset_id

    # TODO: refactor
    dataset_item_ids = await db["data"].find({"dataset_id": dataset_id}).to_list(None)
    dataset_item_ids = [di["_id"] for di in dataset_item_ids]

    # Add user to project
    await db["projects"].update_one(
        {"_id": project_id},
        {
            "$push": {
                "annotators": Annotator(
                    username=invitee_username,
                    role=AnnotatorRoles.annotator.value,
                    state=AnnotatorStates.invited.value,
                    scope=dataset_item_ids,
                ).dict()
            }
        },
    )

    invited_annotator = await get_project_annotator(
        db=db, project_id=project_id, username=invitee_username
    )

    # Send notification to invited user
    await create_notification(
        db=db,
        notification=CreateNotification(
            recipient=invited_annotator.username,
            created_by=username,
            context=NotificationContext.invitation,
            content_id=project_id,
        ),
    )

    return invited_annotator


async def delete_single_project_annotator(
    db: AsyncIOMotorDatabase,
    project_id: ObjectId,
    annotator_username: str,
    username: str,
):
    """Hard deletes single annotator from existing project.

    NOTE: Future addition will be to convert this to a soft delete where annotator markup is preserved and annotator can eb
    reinstated in the future. This will allow the `preserve_markup` argument.

    Args
        annotator_username : username of annotator to remove/delete
        username : username of user performing deletion
        # preserve_markup : flag indicating whether removed annotators markup should be kept.
    """

    project = await find_one_project(db=db, project_id=project_id, username=username)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project does not exist or you lack authorisation",
        )

    project_annotator = await get_project_annotator(
        db=db, project_id=project_id, username=annotator_username
    )

    if project_annotator:
        # Remove annotator from project annotators
        await db["projects"].update_one(
            {"_id": project_id},
            {"$pull": {"annotators": {"username": annotator_username}}},
        )

        # Remove annotator markup
        await db["markup"].delete_many(
            {"project_id": project_id, "created_by": annotator_username}
        )

        # Remove existing notification(s)
        await db["notifications"].delete_many({"content_id": project_id})

    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project annotator not found"
        )


async def get_suggested_entities(
    db: AsyncIOMotorDatabase, project_id: ObjectId, surface_form: str, username: str
):
    """Gets entity labels for a given surface form on a given project. This is currently limited to the users own markup."""

    pipeline = [
        {
            "$match": {
                "project_id": project_id,
                "created_by": username,
                "surface_form": surface_form,
            }
        },
        {"$group": {"_id": "$ontology_item_id", "count": {"$sum": 1}}},
    ]

    suggested_entities = await db["markup"].aggregate(pipeline).to_list(None)

    return suggested_entities


def flatten_dict(d: dict, parent_key: str = "", sep: str = ".") -> dict:
    """
    Flatten a hierarchical dictionary into a single level dictionary where each key is represented using dot notation.

    Parameters:
    d (dict): The hierarchical dictionary to be flattened.
    parent_key (str, optional): The parent key for the current level of the dictionary. Defaults to an empty string.
    sep (str, optional): The separator to use between keys in the flattened dictionary. Defaults to ".".

    Returns:
    dict: A single level dictionary with keys represented using dot notation.

    Example:
    >>> hierarchical_dict = {
    ...     "a": {
    ...         "b": {
    ...             "c": 1,
    ...             "d": 2
    ...         },
    ...         "e": 3
    ...     },
    ...     "f": 4
    ... }
    >>> flatten_dict(hierarchical_dict)
    {'a.b.c': 1, 'a.b.d': 2, 'a.e': 3, 'f': 4}
    """
    items = []
    for k, v in d.items():
        new_key = parent_key + sep + k if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)


async def get_user_projects_summary(db: AsyncIOMotorDatabase, username: str) -> Summary:
    """Creates a summary of all projects for the "home" page of QuickGraph for a given user"""

    pipeline = [
        {
            "$project": {
                "_id": 1,
                "annotators": 1,
                "settings": 1,
                "created_by": 1,
                "name": 1,
            }
        },
        {
            "$lookup": {
                "from": "data",
                "localField": "_id",
                "foreignField": "project_id",
                "as": "dataset_items",
            }
        },
        {
            "$lookup": {
                "from": "markup",
                "localField": "_id",
                "foreignField": "project_id",
                "as": "markup",
            }
        },
        {
            "$lookup": {
                "from": "social",
                "localField": "dataset_items._id",
                "foreignField": "dataset_item_id",
                "as": "social",
            }
        },
        {
            "$addFields": {
                "total_items": {"$size": "$dataset_items"},
                "group_saved_items": {
                    "$size": {
                        "$filter": {
                            "input": "$dataset_items.save_states",
                            "cond": {
                                "$gte": [
                                    {"$size": "$$this.created_by"},
                                    "$settings.annotators_per_item",
                                ]
                            },
                        }
                    }
                },
                "user_saved_items": {
                    "$size": {
                        "$filter": {
                            "input": "$dataset_items.save_states",
                            "cond": {"$eq": ["$$this.created_by", username]},
                        }
                    }
                },
                "entity_markup": {
                    "$size": {
                        "$filter": {
                            "input": "$markup",
                            "cond": {
                                "$and": [
                                    {"$eq": ["$$this.created_by", username]},
                                    {"$eq": ["$$this.classification", "entity"]},
                                ]
                            },
                        }
                    }
                },
                "relation_markup": {
                    "$size": {
                        "$filter": {
                            "input": "$markup",
                            "cond": {
                                "$and": [
                                    {"$eq": ["$$this.created_by", username]},
                                    {"$eq": ["$$this.classification", "relation"]},
                                ]
                            },
                        }
                    }
                },
                "user_comments": {
                    "$size": {
                        "$filter": {
                            "input": "$social",
                            "cond": {"$eq": ["$$this.created_by", username]},
                        }
                    }
                },
                "active_annotators": {
                    "$size": {
                        "$filter": {
                            "input": "$annotators",
                            "cond": {"$eq": ["$$this.state", "accepted"]},
                        }
                    }
                },
            }
        },
        {
            "$addFields": {
                "group_flags": {
                    "$map": {
                        "input": "$dataset_items",
                        "as": "d",
                        "in": {
                            "$map": {
                                "input": {"$ifNull": ["$$d.flags", []]},
                                "as": "f",
                                "in": {
                                    "$mergeObjects": [
                                        "$$f",
                                        {
                                            "project_id": "$_id",
                                            "dataset_item_id": "$$d._id",
                                            "text": "$$d.text",
                                            "activity_type": "flag",
                                            "project_name": "$name",
                                        },
                                    ]
                                },
                            }
                        },
                    }
                }
            }
        },
        {
            "$addFields": {
                "group_flags": {
                    "$reduce": {
                        "input": "$group_flags",
                        "initialValue": [],
                        "in": {"$concatArrays": ["$$value", "$$this"]},
                    }
                }
            }
        },
        {
            "$addFields": {
                "group_comments": {
                    "$map": {
                        "input": "$social",
                        "as": "s",
                        "in": {
                            "$mergeObjects": [
                                "$$s",
                                {
                                    "activity_type": "comment",
                                    "project_name": "$name",
                                    "project_id": "$_id",
                                },
                            ]
                        },
                    }
                }
            }
        },
        {
            "$match": {
                "$or": [
                    {"created_by": username},
                    {
                        "annotators": {
                            "$elemMatch": {
                                "username": username,
                                "disabled": False,
                                "state": "accepted",
                            },
                        },
                    },
                ],
            },
        },
        {
            "$group": {
                "_id": "$created_by",
                "total_projects": {"$sum": 1},
                "complete_projects": {
                    "$sum": {
                        "$cond": [{"$eq": ["$total_items", "$group_saved_items"]}, 1, 0]
                    }
                },
                "total_user_items_saved": {"$sum": "$user_saved_items"},
                "total_entity_markup": {"$sum": "$entity_markup"},
                "total_relation_markup": {"$sum": "$relation_markup"},
                "total_comments": {"$sum": "$user_comments"},
                "activity": {
                    "$push": {"$concatArrays": ["$group_flags", "$group_comments"]}
                },
            }
        },
        {
            "$addFields": {
                "activity": {
                    "$reduce": {
                        "input": "$activity",
                        "initialValue": [],
                        "in": {"$concatArrays": ["$$value", "$$this"]},
                    }
                }
            }
        },
    ]

    results = await db["projects"].aggregate(pipeline).to_list(None)

    if len(results) == 0:
        return Summary(
            **{
                "summary": [
                    {
                        "index": 0,
                        "name": "Projects",
                        "value": 0,
                    },
                    {
                        "index": 1,
                        "name": "Complete Projects",
                        "value": 0,
                    },
                    {
                        "index": 2,
                        "name": "Dataset Items Saved",
                        "value": 0,
                    },
                    {
                        "index": 3,
                        "name": "Entity Annotations Made",
                        "value": 0,
                    },
                    {
                        "index": 4,
                        "name": "Relation Annotations Made",
                        "value": 0,
                    },
                    {
                        "index": 5,
                        "name": "Comments Made",
                        "value": 0,
                    },
                ],
                "activity": [],
            }
        )

    results = results[0]

    return Summary(
        **{
            "summary": [
                {
                    "index": 0,
                    "name": "Projects",
                    "value": results["total_projects"],
                },
                {
                    "index": 1,
                    "name": "Complete Projects",
                    "value": results["complete_projects"],
                },
                {
                    "index": 2,
                    "name": "Dataset Items Saved",
                    "value": results["total_user_items_saved"],
                },
                {
                    "index": 3,
                    "name": "Entity Annotations Made",
                    "value": results["total_entity_markup"],
                },
                {
                    "index": 4,
                    "name": "Relation Annotations Made",
                    "value": results["total_relation_markup"],
                },
                {
                    "index": 5,
                    "name": "Comments Made",
                    "value": results["total_comments"],
                },
            ],
            "activity": results["activity"],
        }
    )


async def invite_users_to_project(
    db: AsyncIOMotorDatabase,
    sender_username: str,
    project_id: ObjectId,
    body: UserInviteBody,
) -> UserInviteResponse:
    """Invite one or more users to a project after checking existence.

    TODO
    ----
    - add document distribution functionality.
    """
    project_id = ObjectId(project_id)
    project = await db["projects"].find_one({"_id": project_id})

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Verify user is the PM of the project
    if project["created_by"] != sender_username:
        raise JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized to invite users to this project",
        )

    # Check annotators exist and filter those that are invalid (don't exist or already on project/invited but not accepted)
    valid_annotators = [
        username
        for username in body.usernames
        if await db.users.find_one({"username": username})
        and username not in [a["username"] for a in project["annotators"]]
    ]
    logger.info(f"valid_annotators: {valid_annotators}")

    if len(valid_annotators) == 0:
        return UserInviteResponse(valid=[], invalid=body.usernames)

    # Create notifications
    notifications = await create_many_project_invitations(
        db=db,
        project_id=project_id,
        project_name=project["name"],
        recipients=valid_annotators,
        username=sender_username,
    )
    logger.info(f"Created {len(notifications)} notifications")

    # Fetch dataset item ids to associate to users
    # dataset_item_ids = (
    #     await db["data"]
    #     .find({"dataset_id": project["dataset_id"]}, {"_id": 1})
    #     .to_list(None)
    # )

    # Add users to project
    rich_annotators = [
        Annotator(
            username=username,
            role=AnnotatorRoles.annotator,
            state=AnnotatorStates.invited,
            scope=[],  # Scope is assigned manually by PM -  [di["_id"] for di in dataset_item_ids
        ).model_dump()
        for username in valid_annotators
    ]

    await db["projects"].update_one(
        {"_id": project_id}, {"$push": {"annotators": {"$each": rich_annotators}}}
    )

    # TODO: assign preannotation markup to invited annotators...
    # - Check if project blue print is annotated.
    # project_bp_dataset_id = project["blueprint_dataset_id"]
    # bp_dataset = await db["datasets"].find_one({"_id": project_bp_dataset_id})
    # return await invite_single_project_annotator(db=db)

    # Return updated project with new annotators on it. The UI can determine which annotators were not added and render this to the user.
    # return annotators

    updated_project = await db["projects"].find_one(
        {"_id": project_id}, {"annotators": 1}
    )

    return UserInviteResponse(
        valid=[
            {
                "username": a["username"],
                "state": a["state"],
                "role": a["role"],
                "scope_size": len(a["scope"]),
            }
            for a in updated_project["annotators"]
        ],
        invalid=set(body.usernames) - set(valid_annotators),
    )


async def remove_user_from_project(
    db: AsyncIOMotorDatabase, project_id: str, username: str, remove_annotations: bool
) -> Dict[str, str]:
    """Deletes a user from a project unless its the project manager."""
    project_id = ObjectId(project_id)
    project = await db["projects"].find_one({"_id": project_id})
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if username == project["created_by"]:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="Cannot remove project manager from project",
        )

    # If dataset items is set to require all annotators, then this must be decremented if an annotator is removed.
    decrementMinAnnotators = (
        len([a for a in project["annotators"] if a["state"] == "accepted"])
        == project["settings"]["annotators_per_item"]
    )

    if remove_annotations:
        # Remove annotations made by this user
        await db["markup"].delete_many(
            {"project_id": project_id, "created_by": username}
        )

    # Remove user from this project (`annotators` field and `save_states` field)
    result = await db["projects"].update_one(
        {"_id": project_id},
        {
            "$pull": {
                "save_states": {"created_by": username},
                "annotators": {"username": username},
            },
            "$inc": {
                "settings.annotators_per_item": -1 if decrementMinAnnotators else 0
            },
        },
    )

    # Remove any invitations to the project
    await db["notifications"].delete_one(
        {"content_id": project_id, "context": "invitation"}
    )

    logger.info(f"result.modified_count: {result.modified_count}")

    return {"detail": "User removed from project"}


async def download_project(
    db: AsyncIOMotorDatabase, project_id: ObjectId
) -> ProjectDownload:
    """Creates a payload for entire project download."""
    project = await db["projects"].find_one({"_id": project_id})

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # Dataset
    dataset = await db["datasets"].find_one({"_id": project["dataset_id"]})

    # Dataset items
    dataset_items = (
        await db["data"].find({"dataset_id": project["dataset_id"]}).to_list(None)
    )

    # Markup
    markup = await db["markup"].find({"project_id": project_id}).to_list(None)

    # Socials
    social = (
        await db["social"]
        .find({"dataset_item_id": {"$in": [di["_id"] for di in dataset_items]}})
        .to_list(None)
    )

    return ProjectDownload(
        project=project,
        dataset=ProjectDataset(**dataset),
        dataset_items=[ProjectDatasetItem(**i) for i in dataset_items],
        markup=[
            Entity(**i) if i["classification"] == "entity" else Relation(**i)
            for i in markup
        ],
        social=[ProjectSocial(**i) for i in social],
    )
