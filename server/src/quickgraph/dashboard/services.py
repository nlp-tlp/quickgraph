"""Dashboard services."""

import datetime
import itertools
import logging
from collections import Counter, defaultdict
from typing import Any, Dict, List, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..markup.schemas import Classifications as MarkupClassifications
from ..project.schemas import OntologyItem
from ..project.services import find_one_project
from ..utils.misc import flatten_hierarchical_ontology
from .schemas import Annotator, DashboardInformation, DashboardPlot

DATE_FORMAT = "%d/%m/%Y"

logger = logging.getLogger(__name__)


async def get_dashboard_information(
    db: AsyncIOMotorDatabase, project_id: ObjectId, username: str
) -> Optional[DashboardInformation]:
    """Fetches project dashboard information"""
    project = await find_one_project(db, project_id, username)

    if project is None:
        return None

    logger.info(f"Project settings: {project.settings}")

    return DashboardInformation(
        user_is_pm=project.created_by == username,
        name=project.name,
        description=project.description,
        tasks=project.tasks,
        settings=project.settings,
        created_at=project.created_at,
        updated_at=project.updated_at,
        dataset_id=project.dataset_id,
        annotators=[
            Annotator(
                username=a.username,
                state=a.state,
                role=a.role,
                scope_size=len(a.scope),
            )
            for a in project.annotators
        ],
        entity_ontology=project.entity_ontology,
        relation_ontology=project.relation_ontology,
        guidelines=project.guidelines,
    )


# async def prepare_dashboard_summary(db, project_id: ObjectId, username: str):


async def create_progress_plot_data(
    db: AsyncIOMotorDatabase, project_id: ObjectId
) -> DashboardPlot:
    """Creates progress plot.

    This function creates the data required for the dashboard overview progress plot (saved documents per annotator over time)

    Notes
    -----
    - Times are in UTC datetime
    """
    # Filter dataset items for those that have been saved by at least one project annotator
    dataset_items = await db.data.find(
        {
            "project_id": project_id,
            "save_states": {"$exists": True, "$not": {"$size": 0}},
        },
        {"save_states": 1},
    ).to_list(None)

    if len(dataset_items) == 0:
        data = []
    else:
        # Flatten "dataset_items"
        _dataset_items = []
        for di in dataset_items:
            for ss in di["save_states"]:
                _dataset_items.append({"_id": di["_id"], **ss})

        # Create array of dates starting from the first save state creation to the current date - this will form the timeline (x-axis).
        user_save_dates = defaultdict(list)
        for save in _dataset_items:
            username = save["created_by"]
            date = datetime.datetime.strftime(save["created_at"], DATE_FORMAT)
            user_save_dates[date].append(username)

        # Aggregate user dataset item saves
        data = [
            {"x": date, **dict(Counter(saves))}
            for date, saves in user_save_dates.items()
        ]

        # Sort by date (oldest to newest)
        # convert the date strings to datetime objects, sort the data, then convert the dates back to strings
        data = sorted(
            data, key=lambda d: datetime.datetime.strptime(d["x"], "%d/%m/%Y")
        )

    return DashboardPlot(
        title="Overall project progress to date",
        name="Project Progress",
        caption="Overall Progress Made by Annotators",
        no_data_title="No dataset items have been saved by project annotators yet",
        dataset=data,
    )


async def create_markup_plot_data(
    db: AsyncIOMotorDatabase,
    project_id: ObjectId,
    classification: MarkupClassifications,
) -> DashboardPlot:
    """Creates data required for dashboard overview plot.

    Plot is either entities or relations. The x-axis will have the names
    of the labeled entities or relations in the resource that have at
    least one annotation. The y-axis will have the names of the annotators.
    The cells will have the count of accepted entities or relations.

    Format
    ------
    {
      x: "label_A",
      y: "user_1",
      value: 0,
    },
    {
      x: "label_B,
      y: "user_2",
      value: 235,
    }
    """

    # Get markup
    markup = await db.markup.find(
        {"project_id": project_id, "classification": classification}
    ).to_list(None)

    # Get ontology
    ontology = await db.resources.find_one(
        {
            "project_id": project_id,
            "classification": "ontology",
            "sub_classification": classification,
        },
        {"content": 1},
    )
    ontology = [OntologyItem(**item) for item in ontology["content"]]
    flat_ontology = flatten_hierarchical_ontology(ontology=ontology)
    ontology_id2fullname = {item.id: item.fullname for item in flat_ontology}

    # Get counts
    counts = defaultdict(dict)
    for d in markup:
        username = d["created_by"]
        ontology_item_id = d["ontology_item_id"]
        if ontology_item_id in counts and username in counts[ontology_item_id]:
            counts[ontology_item_id][username] += 1
        else:
            counts[ontology_item_id][username] = 1

    dataset = [{"x": ontology_id2fullname[k], **v} for k, v in counts.items()]

    # Sort by the maximum value in each dictionary, excluding the 'x' key.
    dataset = sorted(
        dataset,
        key=lambda d: max(value for key, value in d.items() if key != "x"),
        reverse=True,
    )

    return DashboardPlot(
        dataset=dataset,
        title=f"Number of accepted {classification.replace('y','ie')}s applied by all annotators",
        name=f"{classification.replace('y', 'ie').capitalize()}s",
        caption=f"Distribution of Applied {classification.replace('y','ie').capitalize()}s",
        no_data_title=f"No {classification.replace('y', 'ie')}s have been applied by project annotators yet",
        meta={"label_colors": {item.fullname: item.color for item in flat_ontology}},
    )


async def create_flag_plot(
    db: AsyncIOMotorDatabase, project_id: ObjectId
) -> DashboardPlot:
    """Creates plot of applied flags on dataset item"""
    pipeline = [
        {"$match": {"project_id": project_id}},
        {"$unwind": "$flags"},
        {
            "$group": {
                "_id": {"id": "$_id", "state": "$flags.state"},
                "count": {"$sum": 1},
            }
        },
        {
            "$group": {
                "_id": "$_id.id",
                "states": {"$push": {"k": "$_id.state", "v": "$count"}},
            }
        },
        {"$addFields": {"states": {"$arrayToObject": "$states"}}},
        {"$addFields": {"states.x": "$_id"}},
        {"$replaceRoot": {"newRoot": "$states"}},
    ]

    flags = await db.data.aggregate(pipeline).to_list(None)
    flags = [
        {**f, "x": str(f["x"])} for f in flags
    ]  # Convert 'x' objectid to string for serialization.

    # Sort by the sum of values in each dictionary, excluding the 'x' key.
    flags = sorted(
        flags,
        key=lambda d: sum(value for key, value in d.items() if key != "x"),
        reverse=True,
    )

    return DashboardPlot(
        title="Distribution of applied flags on dataset items",
        name="Flags",
        caption="Distribution of Dataset Item Flags",
        no_data_title="No flags have been applied by project annotators yet",
        dataset=flags,
    )


async def create_social_plot(
    db: AsyncIOMotorDatabase, project_id: ObjectId
) -> DashboardPlot:
    """Creates plot of dataset item discussions."""
    pipeline = [
        {"$match": {"project_id": project_id}},
        {"$project": {"_id": 1}},
        {
            "$lookup": {
                "from": "social",
                "localField": "_id",
                "foreignField": "dataset_item_id",
                "as": "discussion",
            }
        },
        {"$match": {"$expr": {"$gt": [{"$size": "$discussion"}, 0]}}},
        {"$group": {"_id": "$_id", "count": {"$first": {"$size": "$discussion"}}}},
    ]

    socials = await db["data"].aggregate(pipeline).to_list(None)

    socials = [
        {"count": s["count"], "x": str(s["_id"])} for s in socials
    ]  # Convert '_id' objectid to string for serialization.

    # Sort by count
    socials = sorted(socials, key=lambda s: s["count"], reverse=True)

    return DashboardPlot(
        title="Distribution of discussions on dataset items",
        name="Social",
        caption="Distribution of Dataset Item Discussions",
        no_data_title="No discussions have been made by project annotators yet",
        dataset=socials,
    )


async def create_overview_plot_data(
    db: AsyncIOMotorDatabase,
    project_id: ObjectId,
    is_relation_project: bool,
) -> List[Dict[str, Any]]:
    """Creates plot data for project overview"""
    plots = []

    progress_data = await create_progress_plot_data(db=db, project_id=project_id)
    plots.append({"index": 0, **progress_data.model_dump()})

    entity_data = await create_markup_plot_data(
        db=db, project_id=project_id, classification="entity"
    )
    plots.append({"index": 1, **entity_data.model_dump()})

    if is_relation_project:
        relation_data = await create_markup_plot_data(
            db=db, project_id=project_id, classification="relation"
        )
        plots.append({"index": 2, **relation_data.model_dump()})

    flag_data = await create_flag_plot(db=db, project_id=project_id)
    plots.append({"index": 3, **flag_data.model_dump()})

    social_data = await create_social_plot(db=db, project_id=project_id)
    plots.append({"index": 4, **social_data.model_dump()})

    return plots


async def calculate_project_progress(project_id: ObjectId, db: AsyncIOMotorDatabase):
    """
    Calculates the overall progress of a project
    """

    pipeline = [
        {"$match": {"_id": project_id}},
        {"$project": {"dataset_id": 1, "settings": 1}},
        {
            "$lookup": {
                "from": "data",
                "localField": "dataset_id",
                "foreignField": "dataset_id",
                "as": "data",
            }
        },
        {
            "$addFields": {
                "data": {
                    "$map": {
                        "input": "$data",
                        "as": "item",
                        "in": {
                            "$mergeObjects": [
                                "$$item",
                                {
                                    "save_states_count": {
                                        "$size": {"$ifNull": ["$$item.save_states", []]}
                                    }
                                },
                            ]
                        },
                    }
                }
            }
        },
        {
            "$addFields": {
                "data_filtered_count": {
                    "$size": {
                        "$filter": {
                            "input": "$data",
                            "as": "item",
                            "cond": {
                                "$gte": [
                                    "$$item.save_states_count",
                                    "$settings.annotators_per_item",
                                ],
                            },
                        }
                    }
                },
                "data_count": {"$size": "$data"},
            }
        },
        {
            "$addFields": {
                "percentage": {
                    "$cond": [
                        {"$eq": ["$data_count", 0]},
                        0,
                        {
                            "$multiply": [
                                {"$divide": ["$data_filtered_count", "$data_count"]},
                                100,
                            ]
                        },
                    ]
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "data_count": 1,
                "data_filtered_count": 1,
                "percentage": 1,
            }
        },
    ]

    result = await db["projects"].aggregate(pipeline).to_list(None)

    return result[0]


async def filter_annotations(
    db: AsyncIOMotorDatabase,
    project_id: ObjectId,
    saved: int,
    quality: int,
    min_agreement: int,
    download_format: bool = False,
) -> dict:
    """Filters annotations made by project annotators and aggregates to display their efforts prior to download.

    Args
        download_format : Flag indicating whether annotations (markups) should be returned as download format e.g. rich objects. If `False` counts will be returned. This allows the function to be reusuable as an overview and rich download process.
    """

    logger.info(
        f"Filters: saved {saved} - quality {quality} min_agreement {min_agreement}"
    )

    # Fetch save_states of dataset items
    project = await db["projects"].find_one(
        {"_id": project_id}, {"annotators": 1, "tasks": 1}
    )

    # Create markup filters

    # filter_saved = (
    #     {"$nin": saved_dataset_item_ids}
    #     if saved == 0
    #     else {"$in": saved_dataset_item_ids}
    #     if saved == 1
    #     else {"$exists": True}
    # )
    filter_quality = (
        True if quality == 0 else False if quality == 1 else {"$in": [True, False]}
    )

    # Fetch created markup
    # markup = (
    #     await db["markup"]
    #     .find(
    #         {
    #             "project_id": project_id,
    #             # "suggested": filter_quality,
    #             # "dataset_item_id": filter_saved,
    #         }
    #     )
    #     .to_list(None)
    # )
    markup_pipeline = [
        {"$match": {"project_id": project_id, "suggested": filter_quality}},
        {
            "$lookup": {
                "from": "data",
                "localField": "dataset_item_id",
                "foreignField": "_id",
                "as": "dataset_item",
            }
        },
        {"$unwind": {"path": "$dataset_item", "preserveNullAndEmptyArrays": True}},
        {
            "$addFields": {
                "saved": {
                    "$in": [
                        "$created_by",
                        {"$ifNull": ["$dataset_item.save_states.created_by", []]},
                    ]
                }
            }
        },
    ]

    markup = await db["markup"].aggregate(markup_pipeline).to_list(None)

    # Aggregate individual efforts
    output = {}
    for a in project["annotators"]:
        if a["state"] != "accepted":
            # Only accepted (active) annotators will be considered.
            continue
        username = a["username"]

        # Get saved items
        _saved_items = set([str(m["dataset_item_id"]) for m in markup if m["saved"]])

        _entities = [
            m
            for m in markup
            if m["created_by"] == username and m["classification"] == "entity"
        ]

        _entity_dataset_items = set([str(e["dataset_item_id"]) for e in _entities])

        _saved_entity_dataset_items = len(
            _saved_items.intersection(_entity_dataset_items)
        )

        _triples = []
        if project["tasks"]["relation"]:
            _triples = [
                m
                for m in markup
                if m["created_by"] == username and m["classification"] == "relation"
            ]
            logger.info(f"Triples found: {len(_triples)}")

            _triple_dataset_items = set([str(t["dataset_item_id"]) for t in _triples])
            _saved_triple_dataset_items = len(
                _saved_items.intersection(_triple_dataset_items)
            )

        if download_format:
            # Instead of returning counts, return the actual markup objects.

            _x = {
                (str(i["dataset_item_id"]), i["classification"], str(i["_id"])): i
                for i in _entities + _triples
            }

            _dataset_items = {}
            for k, v in _x.items():
                dataset_item_id, classification, _ = k

                if dataset_item_id in _dataset_items.keys():
                    pass
                else:
                    _dataset_items[dataset_item_id] = {
                        "tokens": [],
                        "saved": True,
                        "entities": [],
                        "relations": [],
                    }

            output[username] = "hello world"
        else:
            output[username] = {
                "entities": {
                    "total": len(_entities),
                    "silver": len([e for e in _entities if not e["suggested"]]),
                    "weak": len([e for e in _entities if e["suggested"]]),
                    "saved": _saved_entity_dataset_items,
                }
            }

            if project["tasks"]["relation"]:
                output[username]["triples"] = {
                    "total": len(_triples),
                    "silver": len([t for t in _triples if not t["suggested"]]),
                    "weak": len([t for t in _triples if t["suggested"]]),
                    "saved": _saved_triple_dataset_items,
                }

    return output


def group_data_by_key(
    data: List[Dict[str, any]], key: str
) -> Dict[str, List[Dict[str, any]]]:
    """
    Groups a list of dictionaries by a specified key.

    Args:
        data (List[Dict[str, any]]): The list of dictionaries to group.
        key (str): The key to group by.

    Returns:
        Dict[str, List[Dict[str, any]]]: A dictionary, where each key represents a group of dictionaries
        with the same value for the specified key.

    Example:
        data = [            {"name": "Alice", "age": 25},            {"name": "Bob", "age": 30},            {"name": "Charlie", "age": 25},            {"name": "David", "age": 30},            {"name": "Eve", "age": 25}        ]
        result = group_data_by_key(data, "age")
        print(result)

        Output:
        {
            "25": [{"name": "Alice", "age": 25}, {"name": "Charlie", "age": 25}, {"name": "Eve", "age": 25}],
            "30": [{"name": "Bob", "age": 30}, {"name": "David", "age": 30}]
        }
    """
    grouped_data = itertools.groupby(
        sorted(data, key=lambda x: x[key]), key=lambda x: x[key]
    )
    result = {}
    for k, g in grouped_data:
        result[k] = list(g)
    return result
