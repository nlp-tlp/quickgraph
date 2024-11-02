"""Dataset services."""

import json
import logging
import math
import re
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

import hdbscan
import numpy as np
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer

from ..markup.schemas import RichCreateEntity, RichCreateRelation
from ..project.schemas import FlagState, OntologyItem
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
    DeleteDatasetItemsBody,
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

logger = logging.getLogger(__name__)

DATASETS_COLLECTION = "datasets"
DATA_COLLECTION = "data"


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
    extra_fields = {}
    for key in data.keys():
        if key not in {"tokens", "tags", "original", "external_id"}:
            extra_fields[key] = data[key]
    data["extra_fields"] = extra_fields
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
) -> List[Dataset]:
    """List datasets created by the current user or the system."""
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
                    {"$in": [username, settings.api.system_username]}
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

    logger.info(f"Datasets found: {len(datasets)}")

    if len(datasets) == 0:
        logger.info("No datasets found")
        return []

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

        # if not dataset["is_blueprint"]:
        #     # Project dataset
        #     dataset["project"] = dataset["projects"][0]

        _datasets.append(dataset)

    logger.info(f"_datasets: {_datasets}")

    return [Dataset(**d) for d in _datasets]


async def check_dataset_exists(
    db: AsyncIOMotorDatabase, dataset_id: ObjectId, username: str
) -> Optional[Dict]:
    """Verify dataset exists and isn't deleted."""
    dataset = await db.datasets.find_one({"_id": dataset_id, "created_by": username})

    if not dataset:
        return None

    if dataset.get("is_deleted", False):
        return None

    return dataset


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


async def find_one_dataset(
    db: AsyncIOMotorDatabase,
    dataset_id: ObjectId,
    username: str,
    include_dataset_size: bool = False,
    include_projects: bool = False,
    include_dataset_items: bool = False,
) -> Optional[Dataset]:
    """
    Finds one dataset either created by the system or the current user.

    Parameters
    ----------
    db: Database connection
    dataset_id: ObjectId of the dataset
    username: Current username
    include_dataset_size: Whether to include dataset size
    include_projects: Whether to include related projects
    include_dataset_items: Whether to include dataset items

    Returns
    -------
        Dataset object or None if not found
    """
    try:
        logger.info(f"Finding dataset: {dataset_id}")
        dataset = await check_dataset_exists(
            db=db, dataset_id=dataset_id, username=username
        )

        if dataset is None:
            return None

        if include_dataset_size and not include_dataset_items:
            # Only get the count of dataset items linked to the dataset
            dataset_size = await db.data.count_documents({"dataset_id": dataset_id})
            dataset["size"] = dataset_size

        if include_dataset_items:
            # Get the dataset items linked to the dataset
            dataset_items = await db.data.find({"dataset_id": dataset_id}).to_list(None)
            dataset["items"] = dataset_items
            if include_dataset_size:
                dataset["size"] = len(dataset_items)

        if include_projects:
            # Get the projects linked to the dataset
            projects = await db.projects.find(
                {
                    "$or": [
                        {"dataset_id": dataset_id},
                        {"blueprint_dataset_id": dataset_id},
                    ]
                }
            ).to_list(None)
            dataset["projects"] = projects

        is_project_dataset = (
            dataset["is_blueprint"] is False and dataset["project_id"] is not None
        )

        if is_project_dataset:
            # Only a single project will be associated with a project dataset as the bp is copied for all projects

            # Fetch the project linked to the dataset
            project = await db.projects.find_one({"dataset_id": dataset_id})
            dataset["projects"] = [project]
            dataset["project"] = project

            if "entity_ontology_resource_id" in dataset:
                dataset["entity_ontology_resource_id"] = str(
                    dataset["entity_ontology_resource_id"]
                )

            if "relation_ontology_resource_id" in dataset:
                dataset["relation_ontology_resource_id"] = str(
                    dataset["relation_ontology_resource_id"]
                )

            logger.info(f"Returning project dataset: {dataset}")

            return RichProjectDataset.model_validate(dataset)
        else:
            if "entity_ontology_resource_id" in dataset:
                dataset["entity_ontology_resource_id"] = str(
                    dataset["entity_ontology_resource_id"]
                )
            if "relation_ontology_resource_id" in dataset:
                dataset["relation_ontology_resource_id"] = str(
                    dataset["relation_ontology_resource_id"]
                )
            logger.info(f"Returning blueprint dataset: {dataset}")
            return RichBlueprintDataset(**dataset)
    except Exception as e:
        logger.error(f"error: {e}")
        return None


def embed_and_cluster_texts(
    texts: List[str],
) -> Tuple[np.ndarray, Dict[int, List[str]]]:
    """Embed and cluster texts."""
    # Load embedding model
    model = SentenceTransformer("all-distilroberta-v1")

    # Embed dataset item with sentence embedding
    embeddings = model.encode(texts)

    # Cluster items based on their embeddings
    clusterer = hdbscan.HDBSCAN(min_cluster_size=2, min_samples=1, metric="euclidean")
    clusters = clusterer.fit_predict(embeddings)

    logger.info(f"Clusters: {clusters}")
    if all(cluster_id == -1 for cluster_id in clusters):
        logger.warning("No valid clusters were found; all points were marked as noise.")

    # If you have the original texts stored in a list called `texts`
    cluster_texts = defaultdict(list)

    for text, cluster_id in zip(texts, clusters):
        cluster_texts[cluster_id].append(text)

    # Now create a simple TF-IDF vectorizer to extract common words from each cluster
    vectorizer = TfidfVectorizer(stop_words="english")
    cluster_keywords = {}

    for cluster_id, texts in cluster_texts.items():
        if cluster_id == -1:  # Skip noise cluster
            continue
        tfidf_matrix = vectorizer.fit_transform(texts)
        indices = np.argsort(vectorizer.idf_)[::-1]
        top_n = 5  # Top N keywords
        features = vectorizer.get_feature_names_out()
        top_keywords = [features[i] for i in indices[:top_n]]
        cluster_keywords[cluster_id] = top_keywords

    return clusters, cluster_keywords


def create_standard_dataset_items(
    dataset_items: List[str],
    preprocessing: Preprocessing,
    is_blueprint: bool,
    dataset_id: ObjectId,
    project_id: ObjectId = None,
) -> List[EnrichedItem]:
    """Create standard (new line separated) dataset items.

    This function preprocesses, tokenizes and assigns a "dataset_id" to dataset items in a standard dataset.
    """

    clusters, cluster_keywords = embed_and_cluster_texts(texts=dataset_items)

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
            cluster_id=clusters[idx],
            cluster_keywords=cluster_keywords.get(clusters[idx], []),
        )
        for idx, di_text in enumerate(dataset_items)
    ]


def create_rich_dataset_items(
    dataset_items: List[JSONBaseItem],
    is_blueprint: bool,
    dataset_id: ObjectId,
    project_id: ObjectId = None,
):
    """Create rich dataset items.

    This function assigns a "dataset_id" to rich dataset items. Rich datasets can have additional fields in contrast to standard "text" datasets.
    """

    clusters, cluster_keywords = embed_and_cluster_texts(
        texts=[d.original for d in dataset_items]
    )

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
            cluster_id=clusters[idx],
            cluster_keywords=cluster_keywords.get(clusters[idx], []),
        )
        for idx, di in enumerate(dataset_items)
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
    """
    entity_ontology = await get_entity_ontology(db, dataset)

    entity_fullname2id = convert_ontology_to_id_mapping(
        entity_ontology, flatten_hierarchical_ontology
    )

    inserted_di_ids = []
    for item in dataset_items:
        dataset_item_id = await insert_dataset_item(
            db, item, dataset, dataset_id, project_id
        )
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
        await create_annotated_dataset_items(
            db, dataset_items, dataset, dataset_id, username, project_id
        )
    else:
        enriched_items = create_rich_dataset_items(
            dataset_items=dataset_items,
            is_blueprint=dataset["is_blueprint"],
            dataset_id=dataset_id,
        )
        await db[DATA_COLLECTION].insert_many(
            [ei.model_dump() for ei in enriched_items]
        )


async def create_dataset(
    db: AsyncIOMotorDatabase, dataset: CreateDatasetBody, username: str
) -> Optional[Dataset]:
    """Create a new dataset.

    Creation includes preprocessing operations.
    """
    try:
        logger.info(f"dataset: {dataset}")

        # Create the base dataset
        dataset = dataset.model_dump()
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

        # Create dataset items - this is dependent on the supplied data_type (either txt or json)
        if dataset["data_type"] == "text":
            try:
                logger.info("Creating dataset items")
                enriched_items = create_standard_dataset_items(
                    dataset_items=dataset_items,
                    preprocessing=Preprocessing(**dataset["preprocessing"]),
                    is_blueprint=dataset["is_blueprint"],
                    dataset_id=created_dataset.inserted_id,
                )

                # Create dataset items
                logger.info("Inserting dataset items")
                await db[DATA_COLLECTION].insert_many(
                    [ei.model_dump() for ei in enriched_items]
                )

            except Exception as e:
                logger.info(f'Error creating "text" dataset: {e}')
                return None

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
                logger.info(f'Error creating "JSON" dataset: {e}')
                return None

        # Find new dataset and return
        new_dataset = await find_one_dataset(
            db=db, dataset_id=created_dataset.inserted_id, username=username
        )

        return new_dataset
    except Exception as e:
        logger.info(f"Error creating dataset: {e}")
        return None


async def delete_one_dataset(
    db: AsyncIOMotorDatabase, dataset_id: ObjectId, username: str
) -> bool:
    document_deleted = await soft_delete_document(
        db=db, collection_name=DATASETS_COLLECTION, doc_id=dataset_id, username=username
    )
    return document_deleted


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


async def filter_dataset(
    db: AsyncIOMotorDatabase,
    filters: DatasetFilters,
    username: str,
):
    """Filter a dataset.

    TODO:
        - add check for whether user is disabled or hasn't accepted yet...
    """
    project_id = ObjectId(filters.project_id)

    project = await db["projects"].find_one(
        {"_id": project_id},
        {
            "entity_ontology_id": 1,
            "relation_ontology_id": 1,
            "dataset_id": 1,
            "annotators": 1,
            "settings": 1,
        },
    )
    logger.info("Loaded project...")

    scope = [
        di["dataset_item_id"]
        for di in [a for a in project["annotators"] if a["username"] == username][0][
            "scope"
        ]
        if di["visible"]
    ]

    if filters.dataset_item_ids:
        logging.info(f"filters.dataset_item_ids :: {filters.dataset_item_ids}")
        di_ids = [ObjectId(di_id) for di_id in filters.dataset_item_ids.split(",")]
        # Limit scope to dataset item(s)
        scope = [di_id for di_id in di_ids if di_id in scope]

    # Fetch ontologies
    ontologies = await db.resources.find(
        {
            "_id": {
                "$in": [project["entity_ontology_id"], project["relation_ontology_id"]]
            },
            "classification": "ontology",
        },
        {"sub_classification": 1, "content": 1},
    ).to_list(None)

    # logger.info(f"ontologies: {ontologies}")

    ontology = {
        ontology["sub_classification"]: ontology["content"] for ontology in ontologies
    }

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

    try:
        search_term_regx = create_search_regex(search_terms=filters.search_term)
    except Exception as e:
        logger.info(f"Error with search term reg: {e}")

    if filters.saved != SaveStateFilter.everything.value:
        # unsaved = 0, saved = 1, everything = 2

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

    if filters.flag != FlagFilter.everything.value:
        # TODO: make handling flags less problematic;
        _flag_map = {idx + 1: state.value for idx, state in enumerate(FlagState)}
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

    match_filter = {
        "$match": {
            "_id": {"$in": scope},
            "text": {"$regex": search_term_regx},
        }
    }

    if filters.cluster_id is not None:
        logger.info(f"Handling cluster_id filter: {filters.cluster_id}")
        match_filter["$match"]["cluster_id"] = filters.cluster_id

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

    if "save_states_filter" in locals():
        match_filter = {
            "$match": {**match_filter["$match"], **save_states_filter["$match"]}
        }

    pipeline = (
        [match_filter]
        + filter_pipeline
        + [{"$skip": (filters.skip) * filters.limit}, {"$limit": filters.limit}]
    )
    dataset_items = await db["data"].aggregate(pipeline).to_list(None)
    dataset_item_ids = [di["_id"] for di in dataset_items]

    if len(dataset_items) == 0:
        return None

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
            "cluster_id": di.get("cluster_id"),
            "cluster_keywords": di.get("cluster_keywords"),
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
    # Load JSON
    data = json.load(open(f"{settings.SYSTEM_DEFAULTS_DIR}/datasets.json", "r"))
    # Parse datasets
    datasets = [
        CreateDatasetBody(
            {**d, "is_blueprint": True, "is_annotated": False, "is_suggested": False}
        )
        for d in data
    ]

    for dataset in datasets:
        # Check existence of datasets before creating them to ensure UUID is preserved.
        existing_dataset = await db["datasets"].find_one(
            {
                "name": dataset.name,
                "created_by": settings.api.system_username,
            }
        )
        if not existing_dataset:
            await create_dataset(
                db=db, dataset=dataset, username=settings.api.system_username
            )


async def delete_dataset_items(
    db: AsyncIOMotorDatabase, username: str, body: DeleteDatasetItemsBody
) -> Optional[Dict[str, List[str]]]:
    """Delete many item ids associated with a dataset.

    This function permanently deletes dataset items from a dataset. It also removes the items from the scope of annotators if the dataset is a "project dataset".

    TODO
        - Update with soft delete logic

    Notes
        - This route must come before `/dataset/{dataset_id}` otherwise it won't be matched.
        - Handle case where not all items are succesfully deleted.
    """

    dataset_id = ObjectId(body.dataset_id)
    dataset_item_ids = [ObjectId(i) for i in body.dataset_item_ids]

    # assert current user is the creator of the dataset
    dataset = await db["datasets"].find_one({"_id": dataset_id, "created_by": username})

    if dataset is None:
        return

    # Delete dataset items
    response = await db["data"].delete_many({"_id": {"$in": dataset_item_ids}})
    if response.deleted_count > 0:
        is_project_dataset = dataset["project_id"]
        if is_project_dataset:
            # Remove assignments for annotators (if they exist)
            await db["projects"].update_many(
                {"_id": ObjectId(dataset["project_id"])},
                {
                    "$pull": {
                        "annotators.$[].scope": {
                            "dataset_item_id": {"$in": dataset_item_ids}
                        }
                    }
                },
            )
        return {"dataset_item_ids": body.dataset_item_ids, "deleted": True}
    return {"dataset_item_ids": body.dataset_item_ids, "deleted": False}
