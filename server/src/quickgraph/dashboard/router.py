"""Dashboard router."""

from collections import defaultdict
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..dataset.schemas import QualityFilter, SaveStateFilter
from ..dependencies import get_db, get_user
from ..projects.schemas import FlagState, OntologyItem
from ..users.schemas import UserDocumentModel
from ..utils.agreement import AgreementCalculator
from ..utils.misc import flatten_hierarchical_ontology
from ..utils.services import create_search_regex
from .services import (
    calculate_project_progress,
    create_overview_plot_data,
    filter_annotations,
    get_dashboard_information,
    group_data_by_key,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/{project_id}")
async def get_dashboard_info(
    project_id: str,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Fetches a high-level project information"""
    return await get_dashboard_information(
        db=db, project_id=ObjectId(project_id), username=user.username
    )


@router.get("/overview/{project_id}")
async def get_overview(
    project_id: str,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Fetches project dashboard overview.

    This function aggregates project data and returns it as high-level measures of progress and data for visualisation.
    Overview measures of progress include:
        - "project progress": This is the progress made to date. It is calculated as: (saved dataset items with minium annotators) / (total dataset items)
        - "overall agreement": This is the mean entity/relation agreement for relation projects, otherwise it is equivalent to 'average entity agreement' for entity only projects.
        - "average entity agreement": This is the mean entity agreement.
        - "average relation agreement": This is the mean relation agreement.
        - "entities created": This is the number of entities with majority annotator agreement.
        - "triples created": This is the number of triplets with majority annotator agreement.

    Visualisations include:
        - "project progress": This is a temporal distribution of save states applied by project annotators.
        - "entities": This is the distribution of applied entities by project annotators - both silver and weak.
        - "relations" This is the distribution of applied relations by project annotators - both silver and weak.
        - "triples": This is the top-n most frequent triplet structures applied by project annotators - both silver and weak.
        - "flags": This is the distribution of flags applied by project annotators.
        - "social": This is the distribution of social interaction across the project dataset items.

    Parameters
    ----------
    project_id : str
        The UUID of the project.

    """

    # Convert "project_id" in bson object
    project_id = ObjectId(project_id)

    # Fetch project details
    project = await db["projects"].find_one({"_id": project_id})
    is_relation_project = project["tasks"]["relation"]

    # Create overview plot data
    plot_data = await create_overview_plot_data(
        db=db,
        project_id=project_id,
        is_relation_project=is_relation_project,
    )

    # Calculate overview metrics
    project_progress_metrics = await calculate_project_progress(project_id, db)

    try:
        dataset_item_pipeline = [
            {"$match": {"project_id": project_id}},
            {
                "$project": {
                    "_id": 1,
                    "save_count": {"$size": {"$ifNull": ["$save_states", []]}},
                }
            },
            {
                "$match": {
                    "save_count": {"$gte": project["settings"]["annotators_per_item"]}
                }
            },
        ]

        dataset_items = await db["data"].aggregate(dataset_item_pipeline).to_list(None)
        dataset_item_ids = [di["_id"] for di in dataset_items]
        print(f"calculating agreement on {len(dataset_items)} dataset items")

    except Exception as e:
        print(e)

    # Get agreement metrics for accepted entities on dataset items that have been saved by majority
    entity_markup = (
        await db["markup"]
        .find(
            {
                "project_id": project_id,
                "classification": "entity",
                "suggested": False,
                "dataset_item_id": {"$in": dataset_item_ids},
            }
        )
        .to_list(None)
    )

    # Relation is accepted only on dataset items that have been saved by majority
    relation_markup = []
    if is_relation_project:
        pipeline = [
            {
                "$match": {
                    "project_id": project_id,
                    "classification": "relation",
                    "suggested": False,
                    "dataset_item_id": {"$in": dataset_item_ids},
                }
            },
            {
                "$lookup": {
                    "from": "markup",
                    "localField": "source_id",
                    "foreignField": "_id",
                    "as": "source",
                }
            },
            {
                "$lookup": {
                    "from": "markup",
                    "localField": "target_id",
                    "foreignField": "_id",
                    "as": "target",
                }
            },
            {"$unwind": {"path": "$source"}},
            {"$unwind": {"path": "$target"}},
            {
                "$project": {
                    "source.project_id": 0,
                    "source.dataset_item_id": 0,
                    "source.created_at": 0,
                    "source.updated_at": 0,
                    "source.created_by": 0,
                    "target.project_id": 0,
                    "target.dataset_item_id": 0,
                    "target.created_at": 0,
                    "target.updated_at": 0,
                    "target.created_by": 0,
                }
            },
        ]

        relation_markup = await db["markup"].aggregate(pipeline).to_list(None)

    try:
        agreement_calculator = AgreementCalculator(
            entity_data=[
                {
                    "start": m["start"],
                    "end": m["end"],
                    "label": m["ontology_item_id"],
                    "username": m["created_by"],
                    "doc_id": str(m["dataset_item_id"]),
                }
                for m in entity_markup
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
                    "doc_id": str(m["dataset_item_id"]),
                }
                for m in relation_markup
            ],
        )

        entity_overall_agreement_score = agreement_calculator.overall_agreement()

        relation_overall_agreement_score = agreement_calculator.overall_agreement(
            "relation"
        )

        overall_agreement_score = agreement_calculator.overall_average_agreement()

        agreed_entity_count = agreement_calculator.count_majority_agreements()

        agreed_relation_count = agreement_calculator.count_majority_agreements(
            "relation"
        )

    except Exception as e:
        print(f"Failed to get agreements: {e}")

    try:
        output = {
            "metrics": [
                {
                    "index": 0,
                    "name": "Project Progress",
                    "title": "Progress made to date (only counts documents saved by the minimum number of annotators)",
                    "value": f"{project_progress_metrics['percentage']:0.0f}%",
                },
                {
                    "index": 2,
                    "name": "Average Entity Agreement",
                    "title": "Average entity inter-annotator agreement",
                    "value": (
                        None
                        if entity_overall_agreement_score is None
                        else f"{entity_overall_agreement_score*100:0.0f}%"
                    ),
                },
                {
                    "index": 4,
                    "name": "Entities Created",
                    "title": "Count of agreed upon entities (silver and weak) created by annotators",
                    "value": agreed_entity_count,
                },
            ],
            "plots": plot_data,
        }

        if project["tasks"]["relation"]:
            output["metrics"] += [
                {
                    "index": 3,
                    "name": "Average Relation Agreement",
                    "title": "Average relation inter-annotator agreement",
                    "value": (
                        None
                        if relation_overall_agreement_score is None
                        else f"{relation_overall_agreement_score*100:0.0f}%"
                    ),
                },
                {
                    "index": 5,
                    "name": "Triples Created",
                    "title": "Count of agreed upon triples (silver and weak) created by annotators",
                    "value": agreed_relation_count,
                },
                {
                    "index": 1,
                    "name": "Overall Agreement",
                    "title": "Weighted average overall inter-annotator agreement",
                    "value": (
                        None
                        if (overall_agreement_score is None)
                        else f"{overall_agreement_score*100:0.0f}%"
                    ),
                },
            ]

        return output
    except Exception as e:
        print("e", e)


@router.get("/adjudication/{project_id}")
async def get_adjudication(
    project_id: str,
    skip: int = Query(default=0, min=0),
    search_term: Optional[str] = Query(
        default=None,
        title="Search Term",
        description="Search term to filter dataset items on.",
    ),
    flags: Optional[str] = Query(
        default=None,
        title="Flags",
        description="Stringified comma separated list of flags to filter dataset items on.",
    ),
    sort: int = Query(
        default=-1,
        ge=-1,
        le=1,
        description="Overall inter-annotator agreement sorting: ascending - high to low (-1), descending - low to high (1), no sorting (0).",
    ),
    min_agreement: int = Query(
        default=0,
        ge=0,
        le=100,
        description="The minimum overall inter-annotator agreement of documents to return.",
    ),
    dataset_item_id: Optional[str] = Query(
        default=None,
        title="Dataset Item Id",
        description="Dataset item id to filter dataset items on.",
    ),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Gets adjudication information for a single dataset item

    TODO:
        - Return metrics: most_common_markup, most_agreed_markup, most_disagreed_markup, average_annotations, user_most_annotations, user_least_annotations, user_highest_agreement, and user_lowest_agreement
    """

    project_id = ObjectId(project_id)

    match_condition = {
        "$match": {
            "project_id": project_id,
            "iaa.overall": {"$gt": min_agreement / 100},
        }
    }

    if dataset_item_id:
        print('Filtering adjudication on "dataset_item_id')
        match_condition["$match"] = {
            **match_condition["$match"],
            "_id": ObjectId(dataset_item_id),
        }

    if search_term:
        print('Filtering adjudication on "search_term"')
        search_term_regex = create_search_regex(
            search_term
        )  # re.compile(rf"\b{re.escape(search_term)}\b", re.IGNORECASE)
        match_condition["$match"] = {
            **match_condition["$match"],
            "text": {"$regex": search_term_regex},
        }

    if flags:
        print(f"Flags :: {flags}")
        # Sanitize flags and ensure they are expected
        flags = [
            f
            for f in (f.strip() for f in flags.split(","))
            if f in list(set(FlagState)) + ["everything", "no_flags"]
        ]
        print(f"Filters for flags :: {flags}")

        if "everything" in flags:
            pass
        elif "no_flags" in flags:
            match_condition["$match"] = {
                **match_condition["$match"],
                "$or": [{"flags": {"$exists": False}}, {"flags": {"$size": 0}}],
            }
        else:
            match_condition["$match"] = {
                **match_condition["$match"],
                "flags": {"$elemMatch": {"state": {"$in": flags}}},
            }

    print(f"match condition: {match_condition}")

    # Get project dataset id
    project = await db["projects"].find_one(
        {"_id": project_id},
        {"dataset_id": 1, "annotators": 1, "tasks": 1, "ontology": 1},
    )
    print("Loaded project...")

    dataset_item_pipeline = [
        match_condition,
        {
            "$sort": {
                "iaa.overall": sort,
                "_id": 1,
            }  # Use "_id" to tie break otherwise same documents may be returned.
        },
        {"$skip": skip},
        {"$limit": 1},
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
                "flags": {"$first": "$flags"},
            }
        },
    ]

    # Get dataset item (only one is returned at a time)
    dataset_item = await db["data"].aggregate(dataset_item_pipeline).to_list(None)

    if len(dataset_item) == 0:
        # No dataset items found
        print("No dataset items found")
        return {
            "save_states": [],
            "agreement": (
                {
                    "overall": None,
                    "relation": None,
                    "entity": None,
                }
                if project["tasks"]["relation"]
                else {
                    "overall": None,
                    "entity": None,
                }
            ),
            "tokens": None,
            "original": None,
            "total_items": 0,
            "_id": None,
            "updated_at": None,
            "annotators": [],
            "flags": [],
            "social": [],
            "entities": {},
            **({"relations": {}} if project["tasks"]["relation"] else {}),
        }

    # print("dataset_item post pipeline\n", dataset_item[0])

    dataset_item = dataset_item[0]

    # Get dataset item socials
    social = (
        await db["social"].find({"dataset_item_id": dataset_item["_id"]}).to_list(None)
    )
    social = [
        {
            "text": s["text"],
            "created_by": s["created_by"],
            "updated_at": s["updated_at"],
            "created_at": s["created_at"],
        }
        for s in social
    ]

    saved_users = [ss["created_by"] for ss in dataset_item["save_states"]]

    print("saved_users\n", saved_users)

    # Get count of dataset items
    print("match condition".upper(), match_condition["$match"])
    total_dataset_items = await db["data"].count_documents(match_condition["$match"])
    print("total_dataset_items\n", total_dataset_items)

    def get_markup(base_markup, classification: str) -> list:
        markup = [m for m in base_markup if m.get("classification") == classification]

        if len(markup) == 0:
            print("No markup found")
            return []

        print("markup", len(markup))

        # Convert ontology_item_ids into their fullnames for human readability
        ontology = project["ontology"][classification]
        # print(ontology)

        ontology = [OntologyItem.parse_obj(item) for item in ontology]

        flat_ontology = flatten_hierarchical_ontology(ontology=ontology)

        # print("flat_ontology", flat_ontology)

        # Default to purple color if none exists (relations do not have this attribute)
        ontology_id2details = {
            item.id: {
                "fullname": item.fullname,
                "color": item.color if item and hasattr(item, "color") else "#7b1fa2",
                "name": item.name,
            }
            for item in flat_ontology
        }

        # print("ontology_id2details", ontology_id2details)

        # add keys on markup
        markup = [
            {
                **m,
                "ontology_item_name": ontology_id2details.get(m["ontology_item_id"])[
                    "name"
                ],
                "ontology_item_fullname": ontology_id2details.get(
                    m["ontology_item_id"]
                )["fullname"],
                "ontology_item_color": ontology_id2details.get(m["ontology_item_id"])[
                    "color"
                ],
            }
            for m in markup
        ]

        # print("enriched markup", markup)

        return markup

    # Aggregate data into expected format
    entity_markup = get_markup(
        base_markup=dataset_item["markup"], classification="entity"
    )

    # print("entity_markup", entity_markup)

    # Get entity agreement score and markup
    relation_markup = []
    if project["tasks"]["relation"]:
        relation_markup = get_markup(
            base_markup=dataset_item["markup"], classification="relation"
        )

    try:
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

        entity_pairwise_agreement_scores = agreement_calculator.calculate_agreements()
        # print("entity_pairwise_agreement_scores", entity_pairwise_agreement_scores)

        relation_overall_agreement_score = agreement_calculator.overall_agreement(
            "relation"
        )
        relation_pairwise_agreement_scores = agreement_calculator.calculate_agreements(
            "relation"
        )

        overall_agreement_score = agreement_calculator.overall_average_agreement()
    except Exception as e:
        print(f"Failed to get agreements: {e}")

    # Find the last updated markup and convert to string for serialization
    try:
        # print("markup", dataset_item["markup"])

        last_updated = (
            max([m["updated_at"] for m in dataset_item["markup"]])
            if dataset_item.get("markup")
            and len([m for m in dataset_item["markup"] if bool(m)]) > 0
            else None
        )
        # print("last updated\n", last_updated)
    except Exception as e:
        print("last updated error", e)

    try:
        output = {
            "save_states": dataset_item["save_states"],
            "agreement": (
                {
                    "overall": overall_agreement_score,
                    "relation": relation_overall_agreement_score,
                    "entity": entity_overall_agreement_score,
                }
                if project["tasks"]["relation"]
                else {
                    "overall": entity_overall_agreement_score,
                    "entity": entity_overall_agreement_score,
                }
            ),
            "pairwise_agreement": (
                {
                    "relation": relation_pairwise_agreement_scores,
                    "entity": entity_pairwise_agreement_scores,
                }
                if project["tasks"]["relation"]
                else {"entity": entity_pairwise_agreement_scores}
            ),
            "tokens": dataset_item["tokens"],
            "original": dataset_item["original"],
            "total_items": total_dataset_items,
            "_id": str(dataset_item["_id"]),
            "updated_at": last_updated,
            "annotators": [
                a["username"] for a in project["annotators"] if a["state"] == "accepted"
            ],
            "flags": dataset_item["flags"],
            "social": social,
            "entities": {
                **group_data_by_key(data=entity_markup, key="created_by"),
            },
            **(
                {
                    "relations": {
                        **group_data_by_key(data=relation_markup, key="created_by")
                    }
                }
                if project["tasks"]["relation"]
                else {}
            ),
        }
        # print("output", output)
    except Exception as e:
        print("output exception", e)

    return output


@router.get("/effort/{project_id}")
async def get_effort(
    project_id: str,
    saved: int = Query(default=SaveStateFilter.everything),
    quality: int = Query(default=QualityFilter.everything),
    min_agreement: int = Query(default=0, ge=0, le=100),
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Fetches a summary of annotation effort on a given project. Effort is used summarise the progress made by each annotator.

    TODO:
        - Implement min_agreement
        - Aggregated annotations ("gold standard")
    """

    return await filter_annotations(
        db=db,
        project_id=ObjectId(project_id),
        saved=saved,
        quality=quality,
        min_agreement=min_agreement,
        download_format=False,
    )


@router.get("/download/{project_id}")
async def get_download(
    project_id: str,
    # saved: int = Query(default=SaveStateFilter.everything),
    # quality: int = Query(default=QualityFilter.everything),
    flags: list = Query(default=None),
    usernames: str = Query(default=None),
    # min_agreement: int = Query(default=0, ge=0, le=100),
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Fetches annotations for download

    Usernames are sent a comma separated string

    TODO:
        -
        - implement gold standard
        - implement min_agreement query param
    """
    print('"get_download"')

    usernames = usernames.split(",")

    project_id = ObjectId(project_id)

    print(f"downloading for users: {usernames} on project {project_id}")

    # Convert ontology_item_ids into their fullnames for human readability
    project = await db["projects"].find_one(
        {"_id": project_id}, {"ontology": 1, "tasks": 1}
    )
    # print("project ontology", project)

    ontology = project["ontology"]["entity"]
    print("created ontology")

    if project["tasks"]["relation"]:
        ontology += project["ontology"]["relation"]

    ontology = [OntologyItem.parse_obj(item) for item in ontology]

    flat_ontology = flatten_hierarchical_ontology(ontology=ontology)

    # print("flat_ontology size:", len(flat_ontology))

    ontology_id2fullname = {item.id: item.fullname for item in flat_ontology}

    # print("ontology_id2fullname", ontology_id2fullname)

    dataset_items = (
        await db["data"]
        .find(
            {"project_id": project_id},
            {
                "tokens": 1,
                "original": 1,
                "text": 1,
                "extra_fields": 1,
                "external_id": 1,
                "save_states": 1,
                "flags": 1,
            },
        )
        .to_list(None)
    )
    print(f"loaded {len(dataset_items)} dataset items")

    markup = await db["markup"].find({"project_id": project_id}).to_list(None)
    print(f"Loaded {len(markup)} markup")

    _map = defaultdict(list)
    for m in markup:
        _map[(str(m["dataset_item_id"]), m["created_by"])].append(m)
    # print("_map", _map)

    # markup2di = {str(di["_id"]): m for m in markup}
    # print(len(markup2di.keys()))

    entity_markup = defaultdict(list)
    relation_markup = defaultdict(list)
    for m in markup:
        di_id = str(m["dataset_item_id"])
        if m["classification"] == "entity":
            entity_markup[di_id].append(m)
        else:
            relation_markup[di_id].append(m)

    output = defaultdict(dict)
    for di in dataset_items:
        di_id = str(di["_id"])

        # print(entity_markup[di_id])

        _entity_markup = [
            {
                "id": str(m["_id"]),
                "start": m["start"],
                "end": m["end"],
                "label": ontology_id2fullname.get(m["ontology_item_id"]),
                "annotator": m["created_by"],
            }
            for m in entity_markup[di_id]
        ]

        output[di_id] = {
            "id": di_id,
            "original": di["original"],
            "text": di["text"],
            "tokens": di["tokens"],
            "extra_fields": di["extra_fields"],
            "external_id": di["external_id"],
            # "saved": saved_by_creator,
            "entities": _entity_markup,
            # "relations": relation_markup[di],
            # "flags": user_flags,
        }

    return output

    output = defaultdict(lambda: defaultdict(dict))
    # for m in markup:
    try:
        for di in dataset_items:
            for username in usernames:
                # print("processing username", username)
                di_id = str(di["_id"])
                _markup = _map.get((di_id, username), [])

                entity_markup = [
                    {
                        "id": str(m["_id"]),
                        "start": m["start"],
                        "end": m["end"],
                        "label": ontology_id2fullname.get(m["ontology_item_id"]),
                        "annotator": username,
                    }
                    for m in _markup
                    if m["classification"] == "entity"
                ]

                # entityId2Index = {
                #     str(e["id"]): idx for idx, e in enumerate(entity_markup)
                # }

                relation_markup = [
                    {
                        "id": str(m["_id"]),
                        "source_id": str(m["source_id"]),
                        "target_id": str(m["target_id"]),
                        # "head": entityId2Index[str(m["source_id"])],
                        # "tail": entityId2Index[str(m["target_id"])],
                        "label": ontology_id2fullname.get(m["ontology_item_id"]),
                        "annotator": username,
                    }
                    for m in _markup
                    if m["classification"] == "relation"
                ]

                # print("entity_markup", entity_markup)
                # print("relation_markup", relation_markup)

                # classification = m["classification"]
                # is_entity = classification == "entity"
                if di_id not in output[username].keys():
                    di_save_states = di.get("save_states", None)
                    # print("matched_di", matched_di)

                    saved_by_creator = (
                        (
                            len(
                                [
                                    ss
                                    for ss in di_save_states
                                    if ss["created_by"] == username
                                ]
                            )
                            == 1
                        )
                        if di_save_states
                        else False
                    )

                    flags = di.get("flags")
                    if flags is not None and isinstance(flags, list):
                        user_flags = [
                            f["state"] for f in flags if f.get("created_by") == username
                        ]
                    else:
                        user_flags = []

                    # print("saved_by_creator", saved_by_creator)
                    output[username][di_id] = {
                        "id": di_id,
                        "original": di["original"],
                        "text": di["text"],
                        "tokens": di["tokens"],
                        "extra_fields": di["extra_fields"],
                        "external_id": di["external_id"],
                        "saved": saved_by_creator,
                        "entities": entity_markup,
                        "relations": relation_markup,
                        "flags": user_flags,
                    }

    except Exception as e:
        print(f"Exception: {e}")

    # Convert output into {"username": list(dataset_item with markup)}
    return {
        username: [
            {"id": di_id, **contents} for di_id, contents in dataset_items.items()
        ]
        for username, dataset_items in output.items()
    }

    # return await filter_annotations(
    #     db=db,
    #     project_id=ObjectId(project_id),
    #     saved=saved,
    #     quality=quality,
    #     min_agreement=min_agreement,
    #     download_format=True,
    # )
