"""Project services."""

import itertools
from collections import Counter
from datetime import datetime
from typing import Dict, List, Tuple, Union

from bson import ObjectId
from fastapi import HTTPException, status

# import nltk
# from nltk.tokenize import word_tokenize
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from ..dataset.schemas import DatasetItem
from ..dataset.services import find_one_dataset
from ..markup.schemas import CreateMarkupApply, RichCreateEntity
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
    BasicEntity,
    CreateProject,
    Guidelines,
    OntologyItem,
    PreannotationResource,
    Preprocessing,
    Project,
    ProjectOntology,
    ProjectWithMetrics,
    SaveState,
    Tasks,
)

# import os
# from pathlib import Path
# from nltk import downloader as ntlk_downloader

# Set NLTK_DATA environment variable to the current directory
# os.environ["NLTK_DATA"] = str(Path(os.getcwd()) / "nltk_data")

# try:
#     # Try to load the 'punkt' module
#     punkt_path = str(Path(os.environ["NLTK_DATA"]) / "punkt")
#     print("punkt_path", punkt_path)
#     nltk.data.find(punkt_path)
# except LookupError:
#     # If the module is not found, download it using the download_shell() function
#     print("Downloading 'punkt' module...")
#     ntlk_downloader.download("punkt", download_dir=os.environ["NLTK_DATA"])


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
    print("Running `convert_ontology_dict_to_pydantic()`")
    try:
        for i, item in enumerate(ontology):
            ontology[i] = OntologyItem(**item)
            if item["children"]:
                ontology[i].children = convert_ontology_to_pydantic(item["children"])

        # print(f"Pydantic object: {ontology}")
        return ontology
    except Exception as e:
        print(f"error: {e}")


async def copy_dataset_blueprint(
    db: AsyncIOMotorDatabase,
    blueprint_dataset_id: ObjectId,
    project_id: ObjectId,
    username: str,
):
    """Creates a copy of a dataset and its dataset items and assigns it a project.
    s
        Returns:
            ObjectId of the project dataset
    """

    dataset = await db["datasets"].find_one(
        {"_id": blueprint_dataset_id, "is_blueprint": True}
    )
    print("blueprint dataset", dataset)

    if not dataset:
        raise Exception("Blueprint dataset not found")

    dataset_items = (
        await db["data"]
        .find({"dataset_id": dataset["_id"], "is_blueprint": True})
        .to_list(None)
    )
    print("blueprint dataset_items", dataset_items)

    if not dataset_items:
        raise Exception("Blueprint dataset items not found")

    dataset["is_blueprint"] = False
    dataset["project_id"] = project_id
    dataset["created_by"] = username
    dataset.pop("_id", None)

    project_dataset = await db["datasets"].insert_one(dataset)
    print("Copied dataset")

    dataset_item_copies = []
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

    # await db["data"].insert_many(dataset_item_copies)
    print("Copied dataset items")

    # Update project with new dataset_id
    await db["projects"].update_one(
        {"_id": project_id}, {"$set": {"dataset_id": project_dataset.inserted_id}}
    )

    return project_dataset.inserted_id, dataset_item_id_map_bp2project


async def prepare_project_resources(
    db: AsyncIOMotorDatabase, resource_ids: List[str]
) -> dict:
    """Prepares project resource(s) by finding them via their UUID and associates to the project.
    NOTE:
        - resource_ids can be any classification/sub_classification e.g. ontologies or pre-annotations.
    """
    resources = (
        await db["resources"]
        .find({"_id": {"$in": [ObjectId(id) for id in resource_ids]}})
        .to_list(len(Tasks.__fields__))
    )

    if len(resources) == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create project - resource(s) unavailable.",
        )

    return resources


async def add_project_annotators(
    db: AsyncIOMotorDatabase,
    project_id: ObjectId,
    dataset_id: ObjectId,
    annotators: List[str],
    project_manager: str,
) -> List[Annotator]:
    """Assigns annotator(s) to a project including sending invititation notifications."""
    if len(annotators) > 0:
        await create_many_project_invitations(
            db=db,
            project_id=project_id,
            recipients=annotators,
            username=project_manager,
        )

    # # -- Get dataset item ids for scope assignment - default scope is all dataset items
    dataset_item_ids = await db["data"].find({"dataset_id": dataset_id}).to_list(None)
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
            scope=[{"dataset_item_id": di, "visible": True} for di in dataset_item_ids],
        )
    ]

    # Add annotators to project
    await db["projects"].update_one(
        {"_id": project_id},
        {"$set": {"annotators": [a.dict() for a in annotators]}},
    )

    return annotators


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
                    # print("mention text identified")
                    mention_tokenized = tokenizer(mention_text)

                    # print("mention_tokenized", mention_tokenized)

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

    print(f"Entities identified: {mention_count}")

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
    print("entity_preannotation_resource", entity_preannotation_resource)
    print("annotators", annotators)
    print("entity_ontology", entity_ontology)

    # Filter preannotation items for those that do not match the specified entity ontology
    entity_ontology_fullnames = set(e.fullname for e in entity_ontology)
    print("entity_ontology_fullnames", entity_ontology_fullnames)

    valid_entities = [
        e
        for e in entity_preannotation_resource
        if e["classification"] in entity_ontology_fullnames
    ]
    print(f"valid_entities: {len(valid_entities)}")

    valid_entity_classifications = set([ve["classification"] for ve in valid_entities])

    valid_entity_fullnames_to_ontology_item_ids = {
        i.fullname: i.id
        for i in entity_ontology
        if i.fullname in valid_entity_classifications
    }

    print(
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

        print(f"gazetteer: {gazetteer}")

        # Apply annotations using resource for scope of annotators
        # Note: Annotations are applied with preference to longer spans.
        for annotator in annotators:
            dataset_item_ids = annotator.scope
            print(f"{annotator.username} - dataset_item_ids", dataset_item_ids)

            dataset_items = (
                await db["data"].find({"_id": {"$in": dataset_item_ids}}).to_list(None)
            )

            # Extract entity mentions from dataset items
            dataset_item_entity_mentions = annotate_single_label(
                gazetteer=gazetteer,
                dataset_items=[DatasetItem(**di) for di in dataset_items],
                preprocessing=dataset.preprocessing,
            )
            print("dataset_item_entity_mentions", dataset_item_entity_mentions)

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
):
    """
    Assigns markup to a user.

    Args
        db
        bp_dataset_id (ObjectId) : The UUID of the blueprint (bp) dataset.
        project_id (ObjectId) : The UUID of the project.
        dataset_item_id_map_bp2project (Dict[ObjectId, ObjectId]) : A mapping between the UUID of blueprint dataset items and their project equivalents.
        suggested_preannotations (bool) : Flag indicating whether to set annotations as suggested
        username (str) : The name of the user to assign markup to.

    """
    # Copy datasets blueprint annotations across all project annotators
    print("BLUEPRINT DATASET HAS ANNOTATIONS")

    # Get dataset item ids associated with bp dataset
    bp_dataset_items = (
        await db["data"].find({"dataset_id": bp_dataset_id}, {"_id": 1}).to_list(None)
    )
    bp_dataset_items_ids = [i["_id"] for i in bp_dataset_items]

    print("bp_dataset_items_ids", bp_dataset_items_ids)

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
    print(f"{len(bp_markup)} blueprint markup associated with the dataset were found.")

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
    print("bp_entity_markup_id_map", bp_entity_markup_id_map)

    # Process relation markup if project requests it
    if is_relation_task:
        for markup in [m for m in bp_markup if m["classification"] == "relation"]:
            await _copy_bp_markup(classification="relation", markup=markup)

    # Output the completion of the addition of annotated data markup copies
    print("Annotated data markup copies have been added.")


async def create_project(
    db: AsyncIOMotorDatabase, project: CreateProject, username: str
) -> Project:
    """Creates a project. Optional preannotation will preannotate markup set as suggested."""
    print(f'PROJECT SERVICES: "create_project"')

    project = project.dict()

    # Prepare project resource(s)
    resource_ids = project.pop("blueprint_resource_ids")
    resources = await prepare_project_resources(db=db, resource_ids=resource_ids)

    # TODO: refactor two operations below to be output of `prepare_project_resources`
    # Transform ontology resources into sub_classification:ontology format
    ontology_resources = {
        r["sub_classification"]: r["content"]
        for r in resources
        if r["classification"] == "ontology"
    }
    print(f"ontology_resources {ontology_resources}")

    # Transform preannotation resources into sub_classification:preannotation format
    preannotation_resources = {
        r["sub_classification"]: r
        for r in resources
        if r["classification"] == "preannotation"
    }
    print(f"preannotation_resources {preannotation_resources}")

    # Create base project
    new_project = await db["projects"].insert_one(
        {
            **project,
            "guidelines": Guidelines().dict(),
            "annotators": [],  # Placeholder; `add_project_annotators` will populate this field.
            "created_by": username,
            "ontology": ontology_resources,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "blueprint_resource_ids": resource_ids,
        }
    )

    try:
        print("CREATED BASE PROJECT")

        # Create new project; use resource ids to find and assign ontologies to the project under the `ontology` key.
        created_project = await db["projects"].find_one(
            {"_id": new_project.inserted_id}
        )

        # Create project dataset by cloning blueprint
        (
            project_dataset_id,
            dataset_item_id_map_bp2project,
        ) = await copy_dataset_blueprint(
            db=db,
            blueprint_dataset_id=ObjectId(project["blueprint_dataset_id"]),
            project_id=new_project.inserted_id,
            username=username,
        )

        print("CREATED PROJECT DATASET")
        print("dataset_item_id_map_bp2project", dataset_item_id_map_bp2project)

        # Create annotators and send invitations to the project
        annotators = await add_project_annotators(
            db=db,
            project_id=created_project["_id"],
            dataset_id=project_dataset_id,
            annotators=project["annotators"],
            project_manager=username,
        )
        print("ADDED PROJECT ANNOTATORS")

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
        print(f"Error occurred creating project ({e}): Destroying...")
        await delete_one_project(
            db=db, project_id=new_project.inserted_id, username=username
        )


async def find_one_project(
    db: AsyncIOMotorDatabase, project_id: ObjectId, username: str
) -> Project:
    project = await db["projects"].find_one(
        {
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
        },
    )
    print(f"find_one_project ::")

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
    # print(f"relation_counts :: {dict(relation_counts)}")

    if project:
        return Project(**project, relation_counts=dict(relation_counts))

    # TODO: Exceptions can include - not authorized (if project exists but user is not invited or PM)
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "detail": "Project not found - you may not be the project manager or the project may not exist."
        },
    )


async def find_many_projects(db: AsyncIOMotorDatabase, username: str):
    """Finds many projects and computes project progress information"""

    try:
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

        projects = await db["projects"].aggregate(pipeline).to_list(None)

        if len(projects) == 0:
            return []

        return [ProjectWithMetrics.parse_obj(p) for p in projects]
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch projects",
        )


async def delete_one_project(
    db: AsyncIOMotorDatabase, project_id: ObjectId, username: str
):
    """Cascade delete single project"""
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


async def get_project_progress(
    db: AsyncIOMotorDatabase, project_id: ObjectId, username: str
):
    pipeline = [
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

    return project_progress[0]


async def save_many_dataset_items(
    db: AsyncIOMotorDatabase,
    project_id: ObjectId,
    dataset_item_ids: List[ObjectId],
    username: str,
) -> Project:
    class SaveState(BaseModel):
        created_by: str
        created_at: datetime = Field(default_factory=datetime.utcnow)

        class Config:
            arbitrary_types_allowed = True

    new_save_state = SaveState(created_by=username).dict()

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

        return {"count": result.modified_count}
    else:
        # Update save state of user on dataset item
        result = await db["data"].update_one(
            {"_id": dataset_item_ids[0]},
            [
                {
                    "$set": {
                        "save_states": {
                            "$cond": {
                                "if": {
                                    "$in": [
                                        username,
                                        {"$ifNull": ["$save_states.created_by", []]},
                                    ]
                                },
                                "then": {
                                    "$filter": {
                                        "input": {"$ifNull": ["$save_states", []]},
                                        "as": "state",
                                        "cond": {
                                            "$ne": ["$$state.created_by", username]
                                        },
                                    },
                                },
                                "else": {
                                    "$concatArrays": [
                                        {"$ifNull": ["$save_states", []]},
                                        [new_save_state],
                                    ],
                                },
                            },
                        }
                    }
                }
            ],
            upsert=False,
        )

        try:
            dataset_item = await db["data"].aggregate(markup_pipeline).to_list(None)
            dataset_item = dataset_item[0]

            saved_users = [ss["created_by"] for ss in dataset_item["save_states"]]
            entity_markup = [
                e for e in dataset_item["markup"] if e["classification"] == "entity"
            ]
            relation_markup = [
                r for r in dataset_item["markup"] if r["classification"] == "relation"
            ]

            agreement_calculator = AgreementCalculator(
                entity_data=[
                    {
                        "start": m["start"],
                        "end": m["end"],
                        "label": m["ontology_item_id"],
                        "username": m["created_by"],
                        "doc_id": str(dataset_item["_id"]),
                    }
                    for m in entity_markup
                    if m["created_by"] in saved_users
                ],
                relation_data=[
                    {
                        "label": m["ontology_item_id"],
                        "username": m["created_by"],
                        "source": {
                            "start": m["source"]["start"],
                            "end": m["source"]["end"],
                            "label": m["source"]["ontology_item_id"],
                        },
                        "target": {
                            "start": m["target"]["start"],
                            "end": m["target"]["end"],
                            "label": m["target"]["ontology_item_id"],
                        },
                        "doc_id": str(dataset_item["_id"]),
                    }
                    for m in relation_markup
                    if m["created_by"] in saved_users
                ],
            )

            entity_overall_agreement_score = agreement_calculator.overall_agreement()
            # print("entity_overall_agreement_score", entity_overall_agreement_score)

            relation_overall_agreement_score = agreement_calculator.overall_agreement(
                "relation"
            )

            overall_agreement_score = agreement_calculator.overall_average_agreement()
            # print('overall_agreement_score', overall_agreement_score)

            # Update IAA of dataset item
            await db["data"].update_one(
                {"_id": dataset_item_ids[0]},
                [
                    {
                        "$set": {
                            "iaa": {
                                "overall": overall_agreement_score,
                                "entity": entity_overall_agreement_score,
                                "relation": relation_overall_agreement_score,
                                "last_updated": datetime.utcnow(),
                            }
                        }
                    }
                ],
                upsert=False,
            )

        except Exception as e:
            print(f"Error occurred calculating IAA: {e}")

        return {"count": result.modified_count}


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
