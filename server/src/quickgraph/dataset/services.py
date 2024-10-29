"""Dataset services."""

# from nltk.tokenize import word_tokenize
# import nltk
import itertools
import json
import logging
import math
import re
import time
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Union

from bson import ObjectId
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..markup.schemas import RichCreateEntity, RichCreateRelation
from ..projects.schemas import FlagState, OntologyItem
from ..settings import settings
from ..social.schemas import Comment
from ..utils.misc import flatten_hierarchical_ontology
from ..utils.services import soft_delete_document
from .schemas import (
    BaseItem,
    CreateDataset,
    CreateDatasetBody,
    Dataset,
    DatasetFilters,
    DatasetItem,
    DatasetType,
    EnrichedItem,
    FilteredDataset,
    FlagFilter,
    JSONBaseItem,
    Preprocessing,
    QualityFilter,
    RelationsFilter,
    RichBlueprintDataset,
    RichProjectDataset,
    SaveStateFilter,
    TokenizerEnum,
)

# import os

# from nltk import downloader as nltk_downloader
# from pathlib import Path

DATASETS_COLLECTION = "datasets"
DATA_COLLECTION = "data"


# # Set NLTK_DATA environment variable to the current directory
# os.environ["NLTK_DATA"] = str(Path(os.getcwd()) / "nltk_data")

# try:
#     # Try to load the 'punkt' module
#     punkt_path = str(Path(os.environ["NLTK_DATA"]) / "punkt")
#     print("punkt_path", punkt_path)
#     nltk.data.find(punkt_path)
# except LookupError:
#     # If the module is not found, download it using the download_shell() function
#     print("Downloading 'punkt' module...")
#     nltk_downloader.download("punkt", download_dir=os.environ["NLTK_DATA"])


def push_keys_to_extra_fields(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a new key 'extra_fields' in the given dictionary 'data' and moves
    all keys that are not 'tokens', "original", "tags", 'external_id' into it. The function also
    removes these keys from the original dictionary.

    Args:
    - data (dict): A dictionary with multiple keys.

    Returns:
    - dict: The updated dictionary with a new key 'extra_fields' that contains
    all keys that were not 'tokens' or 'extra_id', and the original keys removed.

    Example:
    >>> my_dict = {"key1": "value1", "key2": "value2", "tokens": ["token1", "token2"], "external_id": 12345}
    >>> updated_dict = push_keys_to_extra_fields(my_dict)
    >>> print(updated_dict)
    {'extra_fields': {'key1': 'value1', 'key2': 'value2'}, 'tokens': ['token1', 'token2'], 'external_id': 12345}
    """

    print("data", data)

    extra_fields = {}
    for key in data.keys():
        if key not in {"tokens", "tags", "original", "external_id"}:
            print("key", key)
            extra_fields[key] = data[key]
    data["extra_fields"] = extra_fields

    print("extra_fields", extra_fields)

    for key in extra_fields.keys():
        del data[key]
    return data


# Preprocess dataset
def preprocess_and_tokenize_item(text: str, preprocessing: Preprocessing) -> List[str]:
    """ """

    text = text.replace("\t", " ").replace("\r", " ")
    text = (
        text.lower()
        if preprocessing.lowercase is not None and preprocessing.lowercase
        else text
    )

    if preprocessing.remove_charset is not None and preprocessing.remove_charset != "":
        text = re.sub(f"[{re.escape(preprocessing.remove_charset)}]", "", text)
    text = re.sub(" +", " ", text)
    text = text.strip()

    # Tokenizer is enum so have to access via `value` property
    if preprocessing.tokenizer == "whitespace":
        return text.split(" ")
    elif preprocessing.tokenizer == "punkt":
        # Tokenize with NLTK Punkt tokenizer
        raise NotImplementedError("Punkt tokenizer is currently not available")
        # return word_tokenize(text)
    else:
        raise NotImplementedError("Tokenizer not supported")


def create_enriched_item(dataset_item_text, preprocessing: Preprocessing):
    """Returns dict {'tokens': list, 'text': string} where 'text' is the concatenation of tokens."""
    tokens = preprocess_and_tokenize_item(
        text=dataset_item_text, preprocessing=preprocessing
    )

    return {"tokens": tokens, "text": " ".join(tokens)}


async def list_datasets(
    db: AsyncIOMotorDatabase,
    username: str,
    include_dataset_size: bool = False,
    include_system: bool = False,
) -> Union[List[Dataset], list]:
    agg_pipeline_segment = [
        {
            "$lookup": {
                "from": "data",
                "localField": "_id",
                "foreignField": "dataset_id",
                "as": "items",
            }
        },
        {"$addFields": {"size": {"$size": "$items"}}},
        {"$project": {"items": 0}},
    ]

    pipeline = [
        {
            "$match": {
                "created_by": (
                    {"$in": [username, settings.SYSTEM_USERNAME]}
                    if include_system
                    else username
                ),
                "$or": [{"is_deleted": {"$exists": False}}, {"is_deleted": False}],
                # "is_blueprint": True,
            }
        },
        {
            "$lookup": {
                "from": "projects",
                "localField": "_id",
                "foreignField": "dataset_id",
                "as": "projects",
            }
        },
        {
            "$group": {
                "_id": "$_id",
                "name": {"$first": "$name"},
                "description": {"$first": "$description"},
                "created_at": {"$first": "$created_at"},
                "updated_at": {"$first": "$updated_at"},
                "created_by": {"$first": "$created_by"},
                "is_blueprint": {"$first": "$is_blueprint"},
                "is_annotated": {"$first": "$is_annotated"},
                "is_suggested": {"$first": "$is_suggested"},
                "dataset_type": {"$first": "$dataset_type"},
                "entity_ontology_resource_id": {
                    "$first": "$entity_ontology_resource_id"
                },
                "relation_ontology_resource_id": {
                    "$first": "$relation_ontology_resource_id"
                },
                "size": {"$first": "$size"},
                "projects": {"$push": "$projects"},
                "preprocessing": {"$first": "$preprocessing"},
            }
        },
        {"$unwind": {"path": "$projects"}},
        {
            "$project": {
                "_id": 1,
                "name": 1,
                "description": 1,
                "preprocessing": 1,
                "created_by": 1,
                "created_at": 1,
                "updated_at": 1,
                "size": 1,
                "projects._id": 1,
                "projects.name": 1,
                "is_blueprint": 1,
                "is_annotated": 1,
                "is_suggested": 1,
                "dataset_type": 1,
                "entity_ontology_resource_id": 1,
                "relation_ontology_resource_id": 1,
            }
        },
    ] + (agg_pipeline_segment if include_dataset_size else [])

    datasets = await db[DATASETS_COLLECTION].aggregate(pipeline).to_list(None)

    print(f"Datasets found: {len(datasets)}")

    if len(datasets) == 0:
        print("No datasets found")
        return []

    print("datasets", datasets[-1])

    # if include_system:
    #     # Aggregate/group datasets
    #     grouped_datasets = {
    #         creator: [Dataset(**d) for d in list(v)]
    #         for creator, v in itertools.groupby(datasets, key=lambda x: x["created_by"])
    #     }
    #     return grouped_datasets

    # TODO: Make pydantic serialize this
    _datasets = []
    for dataset in datasets:
        if (
            "entity_ontology_resource_id" in dataset
            and dataset["entity_ontology_resource_id"] is not None
        ):
            dataset["entity_ontology_resource_id"] = str(
                dataset["entity_ontology_resource_id"]
            )
        if (
            "relation_ontology_resource_id" in dataset
            and dataset["relation_ontology_resource_id"] is not None
        ):
            dataset["relation_ontology_resource_id"] = str(
                dataset["relation_ontology_resource_id"]
            )
        _datasets.append(dataset)

    return [Dataset(**d) for d in _datasets]


async def find_one_dataset(
    db: AsyncIOMotorDatabase,
    dataset_id: ObjectId,
    username: str,
    include_dataset_size: bool = False,
    include_projects: bool = False,
    include_dataset_items: bool = False,
) -> Union[Dataset, None]:
    """Finds one dataset either created by the system or the current user"""

    # Check if dataset `is_deleted`
    try:
        dataset = await db[DATASETS_COLLECTION].find_one({"_id": dataset_id})
        if dataset is None:
            print("Dataset not found")
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Dataset not found"},
            )

        if dataset.get("is_deleted", False):
            print("Dataset has been deleted")
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Dataset has been deleted"},
            )

        agg_pipeline_segment = [
            {
                "$lookup": {
                    "from": "data",
                    "localField": "_id",
                    "foreignField": "dataset_id",
                    "as": "items",
                }
            },
            {"$unwind": {"path": "$items", "preserveNullAndEmptyArrays": True}},
            {
                "$lookup": {
                    "from": "markup",
                    "localField": "items._id",  # blueprint_dataset_item_id
                    "foreignField": "dataset_item_id",
                    "as": "markup",
                }
            },
            {
                "$addFields": {
                    "items.entities": {
                        "$filter": {
                            "input": "$markup",
                            "as": "m",
                            "cond": {
                                "$eq": ["$$m.classification", "entity"],
                            },
                        },
                    },
                    "items.relations": {
                        "$filter": {
                            "input": "$markup",
                            "as": "m",
                            "cond": {
                                "$eq": ["$$m.classification", "relation"],
                            },
                        },
                    },
                },
            },
            {
                "$project": {
                    "markup": 0,
                    "items.entities.project_id": 0,
                    "items.entities.dataset_item_id": 0,
                    "items.entities.created_at": 0,
                    "items.entities.updated_at": 0,
                    "items.entities.created_by": 0,
                    "items.entities.suggested": 0,
                    "items.entities.classification": 0,
                    "items.entities.is_blueprint": 0,
                    "items.relations.project_id": 0,
                    "items.relations.dataset_item_id": 0,
                    "items.relations.created_at": 0,
                    "items.relations.updated_at": 0,
                    "items.relations.created_by": 0,
                    "items.relations.suggested": 0,
                    "items.relations.classification": 0,
                    "items.relations.is_blueprint": 0,
                }
            },
            {
                "$group": {
                    "_id": "$_id",
                    "items": {
                        "$push": "$items",
                    },
                    "name": {"$first": "$name"},
                    "description": {"$first": "$description"},
                    "preprocessing": {"$first": "$preprocessing"},
                    "created_by": {"$first": "$created_by"},
                    "created_at": {"$first": "$created_at"},
                    "updated_at": {"$first": "$updated_at"},
                    "project_id": {"$first": "$project_id"},
                    "is_annotated": {"$first": "$is_annotated"},
                    "is_blueprint": {"$first": "$is_blueprint"},
                    "dataset_type": {"$first": "$dataset_type"},
                    "projects": {"$first": "$projects"},
                }
            },
            {"$addFields": {"size": {"$size": "$items"}}},
            {
                "$lookup": {
                    "from": "resources",
                    "localField": "entity_ontology_resource_id",
                    "foreignField": "_id",
                    "as": "linked_entity_resource",
                }
            },
            {
                "$lookup": {
                    "from": "resources",
                    "localField": "relation_ontology_resource_id",
                    "foreignField": "_id",
                    "as": "linked_relation_resource",
                }
            },
            {
                "$unwind": {
                    "path": "$linked_entity_resource",
                    "preserveNullAndEmptyArrays": True,
                }
            },
            {
                "$unwind": {
                    "path": "$linked_relation_resource",
                    "preserveNullAndEmptyArrays": True,
                }
            },
        ]

        if include_projects:
            agg_pipeline_segment += [
                {
                    "$lookup": {
                        "from": "projects",
                        "localField": "_id",
                        "foreignField": "dataset_id",
                        "as": "projects",
                    }
                },
            ]

        agg_pipeline_segment += [
            {
                "$project": {
                    **{
                        "_id": 1,
                        "name": 1,
                        "description": 1,
                        "preprocessing": 1,
                        "created_by": 1,
                        "created_at": 1,
                        "updated_at": 1,
                        "is_blueprint": 1,
                        "is_annotated": 1,
                        "dataset_type": 1,
                        "project_id": 1,
                        "size": 1,
                        "items": int(include_dataset_items),
                        # "external_id": 1,
                        "linked_entity_resource._id": 1,
                        "linked_entity_resource.name": 1,
                        "linked_relation_resource._id": 1,
                        "linked_relation_resource.name": 1,
                        "entity_ontology_resource_id": 1,
                        "relation_ontology_resource_id": 1,
                    },
                    **(
                        {
                            "projects.name": 1,
                            "projects._id": 1,
                            "projects.ontology": 1,
                        }
                        if include_projects
                        else {}
                    ),
                }
            },
        ]

        # print("agg_pipeline_segment", agg_pipeline_segment)

        pipeline = [
            {"$match": {"_id": dataset_id, "created_by": {"$in": [username, "system"]}}}
        ] + (agg_pipeline_segment if include_dataset_size else [])

        # print("pipeline\n", pipeline)

        datasets = await db[DATASETS_COLLECTION].aggregate(pipeline).to_list(None)

        # print("RETURNING DATASET\n", datasets[0])
        # print("datasets[0]['preprocessing']", datasets[0]["preprocessing"])

        def check_key_in_nested_dict(nested_dict: dict, key: str) -> bool:
            """
            Recursively searches for the given key in a nested dictionary.

            Args:
                nested_dict (dict): The nested dictionary to search for the key in.
                key (str): The key to search for in the nested dictionary.

            Returns:
                bool: True if the key is found in the nested dictionary, False otherwise.
            """
            for k, v in nested_dict.items():
                if k == key:
                    return True
                elif isinstance(v, dict):
                    if check_key_in_nested_dict(v, key):
                        return True
            return False

        if len(datasets) == 1:
            print("Found one dataset")
            dataset = datasets[0]

            # print("dataset\n", dataset)

            # Check if dataset is a "project" or "blueprint" dataset
            is_project_dataset = (
                dataset["is_blueprint"] == False and dataset["project_id"] != None
            )

            print("is_project_dataset", is_project_dataset)

            if is_project_dataset:
                # Only a single project will be associated with a project dataset as the bp is copied for all projects
                projects = dataset.pop("projects")

                # print('projects', projects)

                dataset["project"] = projects[0]

                # Flatten ontologies if project

                if check_key_in_nested_dict(dataset, "project.ontology.entity"):
                    # flatten
                    dataset["project"]["ontology"][
                        "entity"
                    ] = flatten_hierarchical_ontology(
                        ontology=[
                            OntologyItem.parse_obj(item)
                            for item in dataset["project"]["ontology"]["entity"]
                        ]
                    )
                if check_key_in_nested_dict(dataset, "project.ontology.relation"):
                    # flatten
                    dataset["project"]["ontology"][
                        "relation"
                    ] = flatten_hierarchical_ontology(
                        ontology=[
                            OntologyItem.parse_obj(item)
                            for item in dataset["project"]["ontology"]["relation"]
                        ]
                    )

                if "entity_ontology_resource_id" in dataset:
                    dataset["entity_ontology_resource_id"] = str(
                        dataset["entity_ontology_resource_id"]
                    )

                if "relation_ontology_resource_id" in dataset:
                    dataset["relation_ontology_resource_id"] = str(
                        dataset["relation_ontology_resource_id"]
                    )

                # print("dataset", dataset)

                return RichProjectDataset.parse_obj(dataset)
            else:
                if "entity_ontology_resource_id" in dataset:
                    dataset["entity_ontology_resource_id"] = str(
                        dataset["entity_ontology_resource_id"]
                    )
                if "relation_ontology_resource_id" in dataset:
                    dataset["relation_ontology_resource_id"] = str(
                        dataset["relation_ontology_resource_id"]
                    )

                return RichBlueprintDataset.parse_obj(dataset)
        else:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Dataset not found"},
            )
    except Exception as e:
        print(f"error: {e}")


def create_standard_dataset_items(
    dataset_items: List[str],
    preprocessing: Preprocessing,
    is_blueprint: bool,
    dataset_id: ObjectId,
    project_id: ObjectId = None,
):
    """
    Create standard (new line separated) dataset items.

    This function preprocesses, tokenizes and assigns a "dataset_id" to dataset items in a standard dataset.

    Params
    -----

    Returns
    -------

    Notes
    -----


    """
    return [
        EnrichedItem(
            original=di_text,
            dataset_id=dataset_id,
            **create_enriched_item(
                dataset_item_text=di_text,
                preprocessing=preprocessing,
            ),
            is_blueprint=is_blueprint,
            project_id=project_id,
        )
        for di_text in dataset_items
    ]


def create_rich_dataset_items(
    dataset_items: List[JSONBaseItem],
    is_blueprint: bool,
    dataset_id: ObjectId,
    project_id: ObjectId = None,
):
    """
    Create rich dataset items.

    This function assigns a "dataset_id" to rich dataset items. Rich datasets can have additional fields in contrast to standard "text" datasets.

    Params
    ------

    Returns
    -------

    Notes
    -----


    """
    return [
        EnrichedItem(
            original=di["original"],
            dataset_id=dataset_id,
            tokens=di["tokens"],
            text=" ".join(di["tokens"]),
            external_id=di.get("external_id"),
            is_blueprint=is_blueprint,
            extra_fields=di.get("extra_fields"),
            project_id=project_id,
        )
        for di in dataset_items
    ]


async def get_entity_ontology(db, dataset):
    return await db["resources"].find_one(
        {"_id": ObjectId(dataset["entity_ontology_resource_id"])},
        {"content": 1},
    )


async def get_relation_ontology(db, dataset):
    return await db["resources"].find_one(
        {"_id": ObjectId(dataset["relation_ontology_resource_id"])},
        {"content": 1},
    )


def convert_ontology_to_id_mapping(ontology, flatten_fn):
    """Flatten ontology and convert into {"fullname": "ontology_item_id"}"""
    return {
        i.fullname: i.id
        for i in flatten_fn([OntologyItem(**i) for i in ontology["content"]])
    }


async def insert_dataset_item(
    db, item, dataset, dataset_id, project_id: ObjectId = None
):
    dataset_item_doc = EnrichedItem(
        original=item["original"],
        dataset_id=dataset_id,
        tokens=item["tokens"],
        text=" ".join(item["tokens"]),
        external_id=item.get("external_id"),
        is_blueprint=dataset["is_blueprint"],
        extra_fields=item.get("extra_fields"),
        project_id=project_id,
    )

    dataset_item = await db["data"].insert_one(dataset_item_doc.dict())
    return dataset_item.inserted_id


async def insert_entity(
    db,
    item,
    entity,
    dataset,
    dataset_item_id,
    fullname2id,
    username,
    project_id: ObjectId = None,
):
    new_entity = RichCreateEntity(
        ontology_item_id=fullname2id[entity["label"]],
        start=entity["start"],
        end=entity["end"],
        surface_form=" ".join(item["tokens"][entity["start"] : (entity["end"] + 1)]),
        project_id=project_id,
        dataset_item_id=dataset_item_id,
        created_by=username,
        suggested=dataset["is_suggested"],
        classification="entity",
        is_blueprint=dataset["is_blueprint"],
    ).dict()

    return await db["markup"].insert_one(new_entity)


async def insert_relation(
    db,
    item,
    relation,
    dataset,
    dataset_item_id,
    fullname2id,
    inserted_entities,
    username,
    project_id: ObjectId = None,
):
    new_relation = RichCreateRelation(
        ontology_item_id=fullname2id[relation["label"]],
        source_id=inserted_entities[relation["source_id"]],
        target_id=inserted_entities[relation["target_id"]],
        project_id=project_id,
        dataset_item_id=dataset_item_id,
        created_by=username,
        suggested=dataset["is_suggested"],
        classification="relation",
        is_blueprint=dataset["is_blueprint"],
    ).dict()

    return await db["markup"].insert_one(new_relation)


async def create_annotated_dataset_items(
    db, dataset_items, dataset, dataset_id, username, project_id: ObjectId = None
) -> List[ObjectId]:
    """
    Create annotated dataset items.

    This function assigns a "dataset_id" to dataset items and creates blueprint entity/relation markup.

    Params
    ------

    Returns
    -------

    Notes
    -----


    """
    entity_ontology = await get_entity_ontology(db, dataset)
    print("entity_ontology", entity_ontology)

    entity_fullname2id = convert_ontology_to_id_mapping(
        entity_ontology, flatten_hierarchical_ontology
    )
    print("entity_fullname2id", entity_fullname2id)

    inserted_di_ids = []
    for item in dataset_items:
        dataset_item_id = await insert_dataset_item(
            db, item, dataset, dataset_id, project_id
        )
        print("dataset_item_id", dataset_item_id)
        inserted_di_ids.append(dataset_item_id)

        inserted_entities = {}
        for entity in item["entities"]:
            result = await insert_entity(
                db,
                item,
                entity,
                dataset,
                dataset_item_id,
                entity_fullname2id,
                username,
                project_id,
            )
            if dataset["dataset_type"] == DatasetType.relation_annotation:
                inserted_entities[entity["id"]] = result.inserted_id

        if dataset["dataset_type"] == DatasetType.relation_annotation:
            print(
                "relation_ontology_resource_id",
                dataset["relation_ontology_resource_id"],
            )
            relation_ontology = await get_relation_ontology(db, dataset)
            relation_fullname2id = convert_ontology_to_id_mapping(
                relation_ontology, flatten_hierarchical_ontology
            )

            for relation in item["relations"]:
                await insert_relation(
                    db,
                    item,
                    relation,
                    dataset,
                    dataset_item_id,
                    relation_fullname2id,
                    inserted_entities,
                    username,
                    project_id,
                )
    return inserted_di_ids


async def process_dataset_items(
    db, dataset_items, dataset, dataset_id, username: str, project_id: ObjectId = None
):
    if dataset["is_annotated"]:
        print("Creating annotated dataset")
        await create_annotated_dataset_items(
            db, dataset_items, dataset, dataset_id, username, project_id
        )

    else:
        print("Creating rich dataset items")
        enriched_items = create_rich_dataset_items(
            dataset_items=dataset_items,
            is_blueprint=dataset["is_blueprint"],
            dataset_id=dataset_id,
        )

        print("Inserting dataset items")
        await db[DATA_COLLECTION].insert_many([ei.dict() for ei in enriched_items])


async def create_dataset(
    db: AsyncIOMotorDatabase, dataset: CreateDatasetBody, username: str
) -> Dataset:
    """Creates a new dataset including preprocessing operations"""

    # print("dataset", dataset)

    # Create the base dataset
    dataset = dataset.dict()
    dataset_items = dataset.pop("items")

    dataset["entity_ontology_resource_id"] = (
        ObjectId(dataset["entity_ontology_resource_id"])
        if dataset.get("entity_ontology_resource_id")
        else None
    )

    dataset["relation_ontology_resource_id"] = (
        ObjectId(dataset["relation_ontology_resource_id"])
        if dataset.get("relation_ontology_resource_id")
        else None
    )

    created_dataset = await db[DATASETS_COLLECTION].insert_one(
        {
            **dataset,
            "created_by": username,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
    )

    print("dataset items", dataset_items)

    # Create dataset items - this is dependent on the supplied data_type (either txt or json)
    if dataset["data_type"] == "text":
        try:
            print("Creating dataset items")
            enriched_items = create_standard_dataset_items(
                dataset_items=dataset_items,
                preprocessing=Preprocessing(**dataset["preprocessing"]),
                is_blueprint=dataset["is_blueprint"],
                dataset_id=created_dataset.inserted_id,
            )

            # Create dataset items
            print("Inserting dataset items")
            await db[DATA_COLLECTION].insert_many([ei.dict() for ei in enriched_items])

        except Exception as e:
            print(f'Error creating "text" dataset: {e}')
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='Unable to create "text" dataset',
            )

    if dataset["data_type"] == "json":
        try:
            await process_dataset_items(
                db,
                dataset_items,
                dataset,
                dataset_id=created_dataset.inserted_id,
                username=username,
            )
        except Exception as e:
            print(f'Error creating "JSON" dataset: {e}')
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='Unable to create "JSON" dataset',
            )

    # Find new dataset and return
    new_dataset = await find_one_dataset(
        db=db, dataset_id=created_dataset.inserted_id, username=username
    )

    return new_dataset


async def delete_one_dataset(
    db: AsyncIOMotorDatabase, dataset_id: ObjectId, username: str
):
    result = await soft_delete_document(
        db=db, collection_name=DATASETS_COLLECTION, doc_id=dataset_id, username=username
    )

    if result:
        return {"message": f"Dataset has been deleted"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Could not find dataset"
        )


# async def update_one_dataset(db, dataset_id: ObjectId, username: str):
#     pass


async def find_one_dataset_item(
    db: AsyncIOMotorDatabase, item_id: ObjectId
) -> Union[DatasetItem, None]:
    item = await db[DATA_COLLECTION].find_one({"_id": item_id})

    if item:
        return DatasetItem(**item)


async def add_one_dataset_item(
    db: AsyncIOMotorDatabase,
    item: BaseItem,
    dataset_id: ObjectId,
    preprocessing: Preprocessing,
    username: str,
) -> DatasetItem:
    enriched_item = EnrichedItem(
        **item.dict(),
        dataset_id=dataset_id,
        **create_enriched_item(dataset_item=item, preprocessing=preprocessing),
    )

    created_item = await db[DATA_COLLECTION].insert_one(
        {**enriched_item.dict(), "created_by": username}
    )

    new_item = await db[DATA_COLLECTION].find_one({"_id": created_item.inserted_id})

    return DatasetItem(**new_item)


async def delete_one_dataset_item(db: AsyncIOMotorDatabase, item_id: ObjectId) -> None:
    # TODO: Mark as `is_deleted`
    await db[DATA_COLLECTION].delete_one({"_id": item_id})


async def find_many_dataset_items(
    db: AsyncIOMotorDatabase, dataset_id: ObjectId
) -> List[DatasetItem]:
    """

    TODO: implement sort by rank/weight of documents.

    """

    dataset_items = (
        await db[DATA_COLLECTION].find({"dataset_id": dataset_id}).to_list(None)
    )

    return [DatasetItem(**di) for di in dataset_items]


# async def update_one_item(db):
#     pass


async def filter_dataset(
    db: AsyncIOMotorDatabase,
    filters: DatasetFilters,
    username: str,
):
    """

    TODO:
        - add check for whether user is disabled or hasn't accepted yet...
    """
    project_id = ObjectId(filters.project_id)

    project = await db["projects"].find_one(
        {"_id": project_id},
        {"ontology": 1, "dataset_id": 1, "annotators": 1, "settings": 1},
    )
    print("Loaded project...")

    scope = [
        di["dataset_item_id"]
        for di in [a for a in project["annotators"] if a["username"] == username][0][
            "scope"
        ]
        if di["visible"]
    ]
    # print("SCOPE:", scope[:5])

    if filters.dataset_item_ids:
        logging.info(f"filters.dataset_item_ids :: {filters.dataset_item_ids}")
        di_ids = [ObjectId(di_id) for di_id in filters.dataset_item_ids.split(",")]
        # Limit scope to dataset item(s)
        scope = [di_id for di_id in di_ids if di_id in scope]

        print("scope", len(scope))

    # print("SCOPE v2 ::", scope[:5])

    ontology = project["ontology"]
    # print("Loaded ontology...")

    # Convert ontologies to ontology_item_id:detail key:value pairs
    ontology = {
        ontology_type: {
            i.id: {
                "name": i.name,
                "fullname": i.fullname,
                "color": i.color,
                "active": i.active,
            }
            for i in flatten_hierarchical_ontology(
                [OntologyItem(**i) for i in ontology_items]
            )
        }
        for ontology_type, ontology_items in ontology.items()
    }

    def create_search_regex(search_terms: str) -> re.Pattern:
        """
        Create a regular expression pattern that matches all of the given search terms.

        Args:
            search_terms (str): A comma-separated string of search terms to match.

        Returns:
            re.Pattern: A compiled regular expression pattern that matches all of the search terms, or a
            regex pattern that matches anything if the input string is empty.

        Example:
            >>> create_search_regex("apple, banana, cherry")
            re.compile('(?=.*\\bapple\\b)(?=.*\\bbanana\\b)(?=.*\\bcherry\\b)', re.IGNORECASE)
        """

        if search_terms == None:
            # Defaults to match anything regular expression
            return re.compile(".*")

        search_terms_list = search_terms.split(",")
        search_term_regex_list = []
        for term in search_terms_list:
            search_term_regex_list.append(rf"(?=.*\b{re.escape(term.strip())}\b)")
        search_term_regex = "".join(search_term_regex_list)
        return (
            re.compile(search_term_regex, re.IGNORECASE)
            if search_terms
            else re.compile(".*")
        )

    try:
        search_term_regx = create_search_regex(search_terms=filters.search_term)
        # print("search_term_regx", search_term_regx)
    except Exception as e:
        print(f"Error with search term reg: {e}")

    if filters.saved != SaveStateFilter.everything.value:
        # print("Handling save state on filter: ", filters.saved)

        # unsaved = 0
        # saved = 1
        # everything = 2

        if filters.saved == 0:
            save_states_filter = {
                "$match": {
                    "save_states": {"$not": {"$elemMatch": {"created_by": username}}}
                }
            }
            pass
        if filters.saved == 1:
            save_states_filter = {
                "$match": {"save_states": {"$elemMatch": {"created_by": username}}}
            }

    quality_filter = []
    if filters.quality != QualityFilter.everything.value:
        # print("Handing annotation quality filter")
        quality_filter = [
            {
                "$match": {
                    "markup.created_by": username,
                    "markup.suggested": filters.quality
                    == QualityFilter.suggested.value,
                }
            }
        ]

    relations_filter = []
    if filters.relations != RelationsFilter.everything.value:
        # print("Handling annotation relation filter")

        # TODO: fix - seems to return documents with no annotations as part of the 'has_relations' filter... which is not supposed to happen.

        relations_filter = [
            {
                "$addFields": {
                    "relation_count": {
                        "$size": {
                            "$filter": {
                                "input": "$markup",
                                "as": "markup",
                                "cond": {
                                    "$eq": [
                                        "$$markup.classification",
                                        "relation",
                                    ],
                                },
                            },
                        },
                    },
                }
            },
            {
                "$match": {
                    "relation_count": (
                        {"$gt": 0}
                        if filters.relations == RelationsFilter.has_relations.value
                        else {"$eq": 0}
                    )
                }
            },
        ]

        print("relation pipeline segment", relations_filter)

    # print("flag - ", filters.flag, FlagFilter.everything.value)

    if filters.flag != FlagFilter.everything.value:
        print('Handing annotation "flag" filter')

        # TODO: make handling flags less problematic;
        _flag_map = {idx + 1: state.value for idx, state in enumerate(FlagState)}
        # print("_flag_map", _flag_map)

        if filters.flag in [1, 2, 3]:
            flag_filter = {
                "$match": {
                    "flags": {
                        "$elemMatch": {
                            "state": _flag_map[filters.flag],
                            "created_by": username,
                        }
                    }
                }
            }

        else:
            flag_filter = {
                "$match": {
                    "$or": [
                        {"flags": {"$exists": False}},
                        {"flags": {"$not": {"$elemMatch": {"created_by": username}}}},
                    ]
                }
            }

    # print("FLAG FILTER", filters.flag)

    match_filter = {
        "$match": {
            "_id": {"$in": scope},
            "text": {"$regex": search_term_regx},
        }
    }

    filter_pipeline = (
        [
            {
                "$lookup": {
                    "from": "markup",
                    "localField": "_id",
                    "foreignField": "dataset_item_id",
                    "as": "markup",
                }
            },
        ]
        + relations_filter
        + quality_filter
        + [
            {
                "$lookup": {
                    "from": "social",
                    "localField": "_id",
                    "foreignField": "dataset_item_id",
                    "as": "social",
                }
            },
            {
                "$addFields": {
                    "social": {
                        "$filter": {
                            "input": "$social",
                            "as": "s",
                            "cond": {"$eq": ["$$s.context", "annotation"]},
                        }
                    }
                }
            },
        ]
    )

    # Add Flag filter if condition met; insert this after first $match.
    if "flag_filter" in locals():
        match_filter = {"$match": {**match_filter["$match"], **flag_filter["$match"]}}

        # filter_pipeline.insert(1, flag_filter)

    if "save_states_filter" in locals():
        match_filter = {
            "$match": {**match_filter["$match"], **save_states_filter["$match"]}
        }
        # filter_pipeline.insert(1, save_states_filter)

    pipeline = (
        [match_filter]
        + filter_pipeline
        + [{"$skip": (filters.skip) * filters.limit}, {"$limit": filters.limit}]
    )
    dataset_items = await db["data"].aggregate(pipeline).to_list(None)
    dataset_item_ids = [di["_id"] for di in dataset_items]

    # print(f'dataset_items :: {dataset_items}')
    # print(
    #     f"Dataset Filter Pipeline:\n {json.dumps(pipeline, indent=2, default=str)}"
    # )

    if len(dataset_items) == 0:
        # TODO: make this return 204 No Content response
        return FilteredDataset()

    # Get total count of dataset items (do not skip/limit)
    count_pipeline = [match_filter] + filter_pipeline + [{"$count": "count"}]
    count_result = await db["data"].aggregate(count_pipeline).next()
    total_dataset_items = count_result["count"]

    # Convert dataset_items into hierarchical object
    modified_dataset_items = {
        str(di["_id"]): {
            "tokens": [
                {"value": t, "index": idx, "state": None}
                for idx, t in enumerate(di["tokens"])
            ],
            "saved": len(
                [
                    item
                    for item in di.get("save_states", [])
                    if item["created_by"] == username
                ]
            )
            == 1,
            "external_id": di["external_id"] if "external_id" in di else None,
            "flags": [
                item for item in di.get("flags", []) if item["created_by"] == username
            ],
        }
        for di in dataset_items
    }

    markups = (
        await db["markup"]
        .find(
            {
                "project_id": project_id,
                "created_by": username,
                "dataset_item_id": {"$in": dataset_item_ids},
            }
        )
        .to_list(None)
    )

    # Convert markups into objects where the key is the dataset_item_id and value is markup
    flat_entities = [m for m in markups if m["classification"] == "entity"]

    entities = {}
    for e in flat_entities:
        dataset_item_id = str(e["dataset_item_id"])

        _entity = {
            "id": str(e["_id"]),
            "start": e["start"],
            "end": e["end"],
            "suggested": e["suggested"],
            "surface_form": e["surface_form"],
            "ontology_item_id": e["ontology_item_id"],
            "color": ontology["entity"][e["ontology_item_id"]]["color"],
            "name": ontology["entity"][e["ontology_item_id"]]["name"],
            "fullname": ontology["entity"][e["ontology_item_id"]]["fullname"],
            "state": "active",  # This is expected by the frontend - TODO: remove if not required.
            "created_at": e["created_at"],
            "updated_at": e["updated_at"],
        }

        if dataset_item_id in entities.keys():
            entities[dataset_item_id].append(_entity)
        else:
            entities[dataset_item_id] = [_entity]

    flat_relations = [m for m in markups if m["classification"] == "relation"]

    relations = {}
    for r in flat_relations:
        dataset_item_id = str(r["dataset_item_id"])

        _relation = {
            "id": str(r["_id"]),
            "source_id": str(r["source_id"]),
            "target_id": str(r["target_id"]),
            "suggested": r["suggested"],
            "ontology_item_id": r["ontology_item_id"],
            "name": ontology["relation"][r["ontology_item_id"]]["name"],
            "fullname": ontology["relation"][r["ontology_item_id"]]["fullname"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
        }

        if dataset_item_id in relations.keys():
            relations[dataset_item_id].append(_relation)
        else:
            relations[dataset_item_id] = [_relation]

    # Add placeholders for dataset items that have no entities or relations.
    # TODO: refactor this code; a lot of redundancy.

    dataset_item_ids_with_entities = entities.keys()
    entities = {
        **entities,
        **{
            id: []
            for id in set([str(di) for di in dataset_item_ids])
            - dataset_item_ids_with_entities
        },
    }

    daaset_item_ids_with_relations = relations.keys()
    relations = {
        **relations,
        **{
            id: []
            for id in set([str(di) for di in dataset_item_ids])
            - daaset_item_ids_with_relations
        },
    }

    return FilteredDataset(
        dataset_items=modified_dataset_items,
        entities=entities,
        relations=relations,
        total_dataset_items=total_dataset_items,
        total_pages=math.ceil(total_dataset_items / filters.limit),
        social={
            str(d["_id"]): [
                Comment(**comment, read_only=username != comment["created_by"])
                for comment in d["social"]
                if not project["settings"]["disable_discussion"]
                or comment["created_by"]
                == username  # Filter list to current user if disabled otherwise return everything.
            ]
            for d in dataset_items
        },
    )


async def create_system_datasets(db: AsyncIOMotorDatabase):
    """Prepopulates system with default/preset datasets"""
    print("Creating system datasets")

    # Load JSON
    data = json.load(open(f"{settings.SYSTEM_DEFAULTS_DIR}/datasets.json", "r"))

    print(f"Loaded {len(data)} datasets")

    # Parse datasets
    datasets = [
        CreateDatasetBody.parse_obj(
            {**d, "is_blueprint": True, "is_annotated": False, "is_suggested": False}
        )
        for d in data
    ]

    for dataset in datasets:
        # Check existence of datasets before creating them to ensure UUID is preserved.
        print(f'Processing dataset: "{dataset.name}"')
        existing_dataset = await db["datasets"].find_one(
            {
                "name": dataset.name,
                "created_by": settings.SYSTEM_USERNAME,
            }
        )
        if not existing_dataset:
            print("Creating dataset...")
            await create_dataset(
                db=db, dataset=dataset, username=settings.SYSTEM_USERNAME
            )
