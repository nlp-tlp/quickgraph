"""Markup services."""

import itertools
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..project.schemas import OntologyItem
from ..project.services import find_one_project
from .schemas import (
    AnnotationType,
    CreateEntity,
    CreateMarkupApply,
    CreateRelation,
    Entity,
    EntityOut,
    OutMarkupAccept,
    OutMarkupApply,
    OutMarkupDelete,
    Relation,
    RelationOut,
    RichCreateEntity,
    RichCreateRelation,
)
from .utils import find_ontology_item_by_id, find_sub_lists, get_entity_offset

logger = logging.getLogger(__name__)


async def get_ontology_item(
    db: AsyncIOMotorDatabase,
    classification: str,
    ontology_item_id: str,
    project_id: ObjectId = None,
    ontology=None,
) -> Optional[OntologyItem]:
    if ontology is None:
        ontology = await db.resources.find_one(
            {
                "project_id": project_id,
                "classification": "ontology",
                "sub_classification": classification,
            },
            {"content": 1},
        )
        ontology = [OntologyItem(**o) for o in ontology["content"]]
    return find_ontology_item_by_id(ontology, ontology_item_id)


async def find_many_markups(db, project_id: ObjectId, username: str):
    """Find all markup created by a user for a given project"""

    return await db.markup.find(
        {"project_id": project_id, "created_by": username}
    ).to_list(None)


async def find_one_markup(
    db, markup_id: ObjectId, username: str
) -> Optional[Dict[str, Any]]:
    """Find a single markup by its id"""
    return await db.markup.find_one({"_id": markup_id, "created_by": username})


async def update_one_markup(db, markup_id: ObjectId, field: str, value, username: str):
    logger.info(f"update_one_markup: {markup_id}")
    await db.markup.update_one({"_id": markup_id}, {"$set": {field: value}})
    return await find_one_markup(db=db, markup_id=markup_id, username=username)


async def apply_single_relation_annotation(
    db, markup: CreateMarkupApply, username: str
) -> dict:
    """Apply single relation annotation.

    Applies single relation annotation to dataset item. If markup already exists as a suggestion, it will be converted to an accepted, silver, markup.
    """
    logger.info("applying single relation annotation")

    filter_criteria = {
        "project_id": ObjectId(markup.project_id),
        "dataset_item_id": ObjectId(markup.dataset_item_id),
        "created_by": username,
        "source_id": ObjectId(markup.content.source_id),
        "target_id": ObjectId(markup.content.target_id),
        "ontology_item_id": markup.content.ontology_item_id,
    }

    new_relation_markup = RichCreateRelation(
        ontology_item_id=markup.content.ontology_item_id,
        source_id=ObjectId(markup.content.source_id),
        target_id=ObjectId(markup.content.target_id),
        project_id=ObjectId(markup.project_id),
        dataset_item_id=ObjectId(markup.dataset_item_id),
        created_at=datetime.utcnow(),
        created_by=username,
        suggested=markup.suggested,
        classification=markup.annotation_type,
    ).model_dump()

    result = await db.markup.update_one(
        filter_criteria, {"$set": new_relation_markup}, upsert=True
    )

    if result.upserted_id is not None:
        # Some reason `result` `id` is different to `inserted_markup.inserted_id` - TODO: review.
        return await db.markup.find_one({"_id": result.upserted_id})


async def apply_many_relation_annotations(
    db,
    markup: CreateMarkupApply,
    dataset_id: ObjectId,
    username: str,
):
    """Apply relation annotation across entire dataset.

    Applies relation across entire dataset - apart from the focus relation, matched entities and relations are created as `suggested`
    """

    logger.info('Calling: "apply_many_relation_annotations()"')

    logger.info(f"markup: {markup}")
    # Find candidates - these are dataset items that contain the surface form of source/target entities.

    # -- Get the surface form of the source/target entities
    source_entity = await find_one_markup(
        db=db, markup_id=ObjectId(markup.content.source_id), username=username
    )
    target_entity = await find_one_markup(
        db=db, markup_id=ObjectId(markup.content.target_id), username=username
    )

    # logger.info("\nsource_entity", source_entity)
    # logger.info("\ntarget_entity", target_entity)

    source_entity_surface_form = source_entity["surface_form"]
    target_entity_surface_form = target_entity["surface_form"]
    logger.info("source_entity_surface_form", source_entity_surface_form)
    logger.info("target_entity_surface_form", target_entity_surface_form)

    # src_tokens = source_entity["surface_form"].split(" ")
    # tgt_tokens = target_entity["surface_form"].split(" ")

    # logger.info("src_tokens", src_tokens)
    # logger.info("tgt_tokens", tgt_tokens)

    # # NEW CODE - AGG PIPELINE
    # pipeline = [
    #     {"$match": {"tokens": {"$all": [src_tokens, tgt_tokens]}}},
    #     {
    #         "$project": {
    #             "_id": 1,
    #             "matches": {
    #                 "$reduce": {
    #                     "input": {
    #                         "$range": [0, {"$subtract": [{"$size": "$tokens"}, 1]}]
    #                     },
    #                     "initialValue": [],
    #                     "in": {
    #                         "$concatArrays": [
    #                             "$$value",
    #                             {
    #                                 "$cond": {
    #                                     "if": {
    #                                         "$and": [
    #                                             {
    #                                                 "$eq": [
    #                                                     {
    #                                                         "$slice": [
    #                                                             "$tokens",
    #                                                             "$$this",
    #                                                             2,
    #                                                         ]
    #                                                     },
    #                                                     [src_tokens, tgt_tokens],
    #                                                 ]
    #                                             },
    #                                             {
    #                                                 "$not": {
    #                                                     "$in": [
    #                                                         {
    #                                                             "$concat": [
    #                                                                 {
    #                                                                     "$toString": "$$this"
    #                                                                 },
    #                                                                 "-",
    #                                                                 {
    #                                                                     "$toString": {
    #                                                                         "$add": [
    #                                                                             "$$this",
    #                                                                             1,
    #                                                                         ]
    #                                                                     }
    #                                                                 },
    #                                                             ]
    #                                                         },
    #                                                         {
    #                                                             "$map": {
    #                                                                 "input": "$$value",
    #                                                                 "as": "v",
    #                                                                 "in": {
    #                                                                     "$concat": [
    #                                                                         {
    #                                                                             "$toString": "$$v.source"
    #                                                                         },
    #                                                                         "-",
    #                                                                         {
    #                                                                             "$toString": "$$v.target"
    #                                                                         },
    #                                                                     ]
    #                                                                 },
    #                                                             }
    #                                                         },
    #                                                     ]
    #                                                 }
    #                                             },
    #                                         ]
    #                                     },
    #                                     "then": [
    #                                         {
    #                                             "source": "$$this",
    #                                             "target": {"$add": ["$$this", 1]},
    #                                         }
    #                                     ],
    #                                     "else": [],
    #                                 }
    #                             },
    #                         ]
    #                     },
    #                 }
    #             },
    #         }
    #     },
    #     {"$match": {"matches": {"$ne": []}}},
    #     {
    #         "$project": {
    #             "_id": 1,
    #             "matches": {
    #                 "$reduce": {
    #                     "input": "$matches",
    #                     "initialValue": [],
    #                     "in": {
    #                         "$concatArrays": [
    #                             "$$value",
    #                             [
    #                                 {
    #                                     "source": {
    #                                         "start": "$$this.source",
    #                                         "end": {"$add": ["$$this.source", 1]},
    #                                     },
    #                                     "target": {
    #                                         "start": "$$this.target",
    #                                         "end": {"$add": ["$$this.target", 1]},
    #                                     },
    #                                 }
    #                             ],
    #                         ]
    #                     },
    #                 }
    #             },
    #         }
    #     },
    # ]

    # logger.info("pipeline\n", json.dumps(pipeline, indent=2, default=str))

    # result = await db["data"].aggregate(pipeline).to_list(None)
    # logger.info("aggregation result\n", json.dumps(result, indent=2, default=str))

    # ----- OLD CODE ------

    lr_direction = source_entity["end"] <= target_entity["start"]
    logger.info(f"lr_direction: {lr_direction}")

    offset = get_entity_offset(source_entity=source_entity, target_entity=target_entity)
    # abs(target_entity["start"] - source_entity["end"]) - 1
    logger.info(f"OFFSET: {offset}")

    # -- Find candidate dataset items
    regx = re.compile(
        rf"^(?=.*\b{re.escape(source_entity_surface_form)}\b)(?=.*\b{re.escape(target_entity_surface_form)}\b)",
    )

    # Focus dataset item id is always a candidate regardless of whether it is saved.
    candidate_dataset_item_ids = (
        await db["data"]
        .find(
            {
                "dataset_id": dataset_id,
                # "_id": {"$nin": saved_dataset_item_ids}, # TODO: do this in query ...
                "text": {"$regex": regx},
            }
        )
        .to_list(None)
    )

    logger.info(f"candidates found: {len(candidate_dataset_item_ids)}")

    # -- Get src/tgt token spans in matched dataset items
    #       - Offset of original markup needs to be preserved
    #       - Direction of source and target needs to be preserver; left-right or right-left. TODO: Investigate this. Should this be enforced?
    source_tokens_to_match = source_entity_surface_form.split(" ")
    target_tokens_to_match = target_entity_surface_form.split(" ")

    new_markup = {"entity": [], "relation": []}
    for dataset_item in candidate_dataset_item_ids:
        dataset_item_id = str(dataset_item["_id"])

        # Identify matching markup span(s)
        candidate_src_token_spans = find_sub_lists(
            source_tokens_to_match, dataset_item["tokens"]
        )
        # logger.info("candidate_src_token_spans", candidate_src_token_spans)

        candidate_tgt_token_spans = find_sub_lists(
            target_tokens_to_match, dataset_item["tokens"]
        )
        # logger.info("candidate_tgt_token_spans", candidate_tgt_token_spans)

        # Create pairs between src/tgts and filter out src/tgt spans that are offset the same as the focus
        # first tuple item is src, second is tgt
        _pairs = [
            p
            for p in list(
                itertools.product(candidate_src_token_spans, candidate_tgt_token_spans)
            )
            if abs(p[1][0] - p[0][1]) - 1 == offset
        ]

        # logger.info("_pairs", _pairs)

        # Create entities and relation for matched pairs

        for pair in _pairs:
            # logger.info("pair", pair)
            src_span, tgt_span = pair
            # logger.info("src_span, tgt_span", src_span, tgt_span)

            accepted = (
                (dataset_item_id == markup.dataset_item_id)
                and (source_entity["start"] == src_span[0])
                and (source_entity["end"] == src_span[1])
                and (target_entity["start"] == tgt_span[0])
                and (target_entity["end"] == tgt_span[1])
            )
            # logger.info("accepted", accepted)

            # Create entities
            _, created_source_markup = await apply_single_entity_annotation(
                db=db,
                markup=CreateMarkupApply(
                    project_id=markup.project_id,
                    dataset_item_id=dataset_item_id,
                    annotation_type="entity",
                    suggested=not accepted,
                    content=CreateEntity(
                        ontology_item_id=source_entity["ontology_item_id"],
                        start=src_span[0],
                        end=src_span[1],
                        surface_form=source_entity_surface_form,
                    ),
                    extra_dataset_item_ids=None,
                ),
                username=username,
            )
            logger.info(f"created_source_markup: {created_source_markup}")

            _, created_target_markup = await apply_single_entity_annotation(
                db=db,
                markup=CreateMarkupApply(
                    project_id=markup.project_id,
                    dataset_item_id=dataset_item_id,
                    annotation_type="entity",
                    suggested=not accepted,
                    content=CreateEntity(
                        ontology_item_id=target_entity["ontology_item_id"],
                        start=tgt_span[0],
                        end=tgt_span[1],
                        surface_form=target_entity_surface_form,
                    ),
                    extra_dataset_item_ids=None,
                ),
                username=username,
            )
            logger.info(f"created_target_markup: {created_target_markup}")

            # Create relation between entities
            existing_relation = await db["markup"].find_one(
                {
                    "project_id": ObjectId(markup.project_id),
                    "dataset_item_id": ObjectId(dataset_item_id),
                    "created_by": username,
                    "source_id": created_source_markup["_id"],
                    "target_id": created_target_markup["_id"],
                    "ontology_item_id": markup.content.ontology_item_id,
                }
            )

            if existing_relation and not accepted:
                continue
            else:
                # Create new relation or update state of existing relation
                created_relation_markup = await apply_single_relation_annotation(
                    db=db,
                    markup=CreateMarkupApply(
                        project_id=markup.project_id,
                        dataset_item_id=dataset_item_id,
                        annotation_type="relation",
                        suggested=not accepted,
                        content=CreateRelation(
                            ontology_item_id=markup.content.ontology_item_id,
                            source_id=str(created_source_markup["_id"]),
                            target_id=str(created_target_markup["_id"]),
                        ),
                        extra_dataset_item_ids=None,
                    ),
                    username=username,
                )
                logger.info(f"created_relation_markup: {created_relation_markup}")

                # If relation is accepted; set accepted state for its entities
                if not created_relation_markup["suggested"]:
                    logger.info("\n Updating entity suggestion states")
                    await update_one_markup(
                        db=db,
                        markup_id=created_source_markup["_id"],
                        field="suggested",
                        value=False,
                        username=username,
                    )

                    created_source_markup = Entity(
                        **await find_one_markup(
                            db=db,
                            markup_id=created_source_markup["_id"],
                            username=username,
                        )
                    ).model_dump(by_alias=True)

                    await update_one_markup(
                        db=db,
                        markup_id=created_target_markup["_id"],
                        field="suggested",
                        value=False,
                        username=username,
                    )

                    created_target_markup = Entity(
                        **await find_one_markup(
                            db=db,
                            markup_id=created_target_markup["_id"],
                            username=username,
                        )
                    ).model_dump(by_alias=True)

            if any(
                filter(
                    lambda x: x is not None,
                    [
                        created_source_markup,
                        created_target_markup,
                        created_relation_markup,
                    ],
                )
            ):
                # At least one markup item is created
                if created_relation_markup:
                    new_markup["relation"].append(created_relation_markup)
                if created_source_markup:
                    new_markup["entity"].append(created_source_markup)
                if created_target_markup:
                    new_markup["entity"].append(created_target_markup)

    logger.info(f"new_markup: {new_markup}")
    if len(new_markup["relation"]) > 0:
        return new_markup


async def apply_single_entity_annotation(
    db: AsyncIOMotorDatabase,
    markup: CreateMarkupApply,
    username: str,
) -> Tuple[bool, dict]:
    """Apply a single entity annotation.

    Applies single annotation to dataset item. If markup already exists as a suggestion, it will be converted to an accepted, silver, markup.

    Returns
    -------
    - exists (boolean) :
        flag to indicate whether markup exists already
    - markup (dict) :
        new or existing entity markup
    """
    logger.info("applying single entity annotation")

    # MAJOR CHANGE - Converted legacy method into single MongoDB upsert
    filter_criteria = {
        "project_id": ObjectId(markup.project_id),
        "dataset_item_id": ObjectId(markup.dataset_item_id),
        "created_by": username,
        "start": markup.content.start,
        "end": markup.content.end,
        "ontology_item_id": markup.content.ontology_item_id,
    }
    logger.info(f"filter_criteria: {filter_criteria}")

    new_markup = RichCreateEntity(
        **markup.content.model_dump(),
        project_id=ObjectId(markup.project_id),
        dataset_item_id=ObjectId(markup.dataset_item_id),
        created_by=username,
        suggested=markup.suggested,
        classification=markup.annotation_type,
    ).model_dump()

    result = await db.markup.update_one(
        filter_criteria, {"$set": new_markup}, upsert=True
    )

    if result.upserted_id is not None:
        # Some reason `result` `id` is different to `inserted_markup.inserted_id` - TODO: review.
        logger.info("Returning created markup")
        return False, await db.markup.find_one({"_id": result.upserted_id})
    else:
        # Return existing markup
        logger.info("Returning existing matched markup")
        return True, await db.markup.find_one(filter_criteria)


async def apply_many_entity_annotations(
    db,
    markup: CreateMarkupApply,
    dataset_id: ObjectId,
    username: str,
):
    """Applies entity annotation across entire dataset

    Notes:
        - Entity that apply action is applied to is set as accepted by default; others are suggested.
        - If dataset_item is `saved` then markup will not be created
    """
    logger.info("Markup: {markup}")

    # markup.dataset_item_id

    tokens_to_match = markup.content.surface_form.split(" ")

    # This line of code creates a regular expression pattern for matching the "surface_form" attribute of a markup object, which represents the surface form of a piece of text. The regular expression uses a negative lookbehind assertion to ensure that the pattern is not preceded by a non-whitespace character, and a negative lookahead assertion to ensure that the pattern is not followed by a non-whitespace character. This ensures that the pattern only matches the "surface_form" attribute when it is a standalone word or phrase. The `re.escape` function is used to escape any special characters in the "surface_form" attribute, to prevent them from being interpreted as part of the regular expression syntax.
    surface_form_escaped = (
        r"(?<!\S)" + re.escape(markup.content.surface_form) + r"(?!\S)"
    )

    pipeline = [
        # $or doesn't protect the focus dataset item the action originated from.
        {
            "$match": {
                "text": {"$regex": surface_form_escaped},
                "dataset_id": ObjectId(dataset_id),
                "$or": [
                    {
                        "save_states": {
                            "$not": {"$elemMatch": {"created_by": {"$eq": username}}}
                        }
                    },
                    {"_id": ObjectId(markup.dataset_item_id)},
                ],
                # "$or": [
                #     {
                #         "dataset_item_id": ObjectId(markup.dataset_item_id),
                #         "text": {"$regex": surface_form_escaped},
                #         "dataset_id": ObjectId(dataset_id),
                #     },
                #     {
                #         "dataset_item_id": {"$ne": id},
                #         "text": {"$regex": surface_form_escaped},
                #         "dataset_id": ObjectId(dataset_id),
                #         "save_states.created_by": {"$ne": username},
                #     },
                # ]
            },
        },
        {
            "$project": {
                "_id": 1,
                "tokens": 1,
                "dataset_item_id": 1,
            },
        },
        {
            "$addFields": {
                "spans": {
                    "$reduce": {
                        "input": {
                            "$range": [
                                0,
                                {
                                    "$size": "$tokens",
                                },
                            ],
                        },
                        "initialValue": [],
                        "in": {
                            "$cond": {
                                "if": {
                                    "$eq": [
                                        {
                                            "$slice": [
                                                "$tokens",
                                                "$$this",
                                                len(tokens_to_match),
                                            ],
                                        },
                                        tokens_to_match,
                                    ],
                                },
                                "then": {
                                    "$concatArrays": [
                                        "$$value",
                                        [
                                            {
                                                "start": "$$this",
                                                "end": {
                                                    "$add": [
                                                        "$$this",
                                                        (
                                                            0
                                                            if len(tokens_to_match) == 1
                                                            else len(tokens_to_match)
                                                            - 1
                                                        ),
                                                    ]
                                                },
                                            },
                                        ],
                                    ],
                                },
                                "else": "$$value",
                            },
                        },
                    },
                },
            },
        },
        # Add 'suggested' field - this should be True for the span that initiated the propagation.
        {
            "$addFields": {
                "spans": {
                    "$map": {
                        "input": "$spans",
                        "in": {
                            "$cond": [
                                {
                                    "$and": [
                                        {
                                            "$eq": [
                                                "$$this.start",
                                                markup.content.start,
                                            ],
                                        },
                                        {"$eq": ["$$this.end", markup.content.end]},
                                        {
                                            "$eq": [
                                                "$_id",
                                                ObjectId(markup.dataset_item_id),
                                            ]
                                        },
                                    ],
                                },
                                {
                                    "start": "$$this.start",
                                    "end": "$$this.end",
                                    "suggested": False,
                                },
                                {
                                    "start": "$$this.start",
                                    "end": "$$this.end",
                                    "suggested": True,
                                },
                            ],
                        },
                    },
                },
            },
        },
        {
            "$lookup": {
                "from": "markup",
                "localField": "_id",
                "foreignField": "dataset_item_id",
                "as": "markups",
            },
        },
        {
            "$project": {
                "markups._id": 0,
                "markups.dataset_item_id": 0,
                "markups.project_id": 0,
                "markups.created_at": 0,
                "markups.surface_form": 0,
                "markups.updated_at": 0,
            },
        },
        {
            "$addFields": {
                "markups": {
                    "$map": {
                        "input": {
                            "$filter": {
                                "input": "$markups",
                                "as": "markup",
                                "cond": {
                                    "$and": [
                                        {
                                            "$eq": [
                                                "$$markup.ontology_item_id",
                                                markup.content.ontology_item_id,
                                            ]
                                        },
                                        {"$eq": ["$$markup.created_by", username]},
                                    ]
                                },
                            }
                        },
                        "as": "markup",
                        "in": {"start": "$$markup.start", "end": "$$markup.end"},
                    }
                }
            }
        },
        {
            "$addFields": {
                "candidateSpans": {
                    "$filter": {
                        "input": "$spans",
                        "as": "span",
                        "cond": {
                            "$not": {
                                "$in": [
                                    {"start": "$$span.start", "end": "$$span.end"},
                                    "$markups",
                                ]
                            }
                        },
                    }
                }
            }
        },
        # Create new markup objects before $merge (upsert) into Markup collection
        {
            "$unwind": "$candidateSpans",
        },
        {
            "$addFields": {
                "created_by": username,
                "dataset_item_id": "$_id",
                "end": "$candidateSpans.end",
                "ontology_item_id": markup.content.ontology_item_id,
                "project_id": ObjectId(markup.project_id),  # TODO: handle this.
                "start": "$candidateSpans.start",
                "classification": "entity",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "surface_form": " ".join(tokens_to_match),
                "suggested": "$candidateSpans.suggested",
            },
        },
        {
            "$project": {"_id": 0}
        },  # Remove `dataset_id` otherwise it will be the markup id which is not unique for multiple markups on the same dataset item.
        {
            "$project": {
                "tokens": 0,
                "spans": 0,
                "markups": 0,
                "candidateSpans": 0,
            }
        },
    ]
    results = await db.data.aggregate(pipeline).to_list(None)

    if len(results) == 0:
        return []

    # Create entities from results of aggregation - In the future this will be done as part of the aggregation...
    # Each item is given a unique ObjectId.
    inserted_result = await db["markup"].insert_many(
        [{**r, "_id": ObjectId()} for r in results]
    )
    inserted_ids = inserted_result.inserted_ids

    return await db["markup"].find({"_id": {"$in": inserted_ids}}).to_list(None)


async def get_project(db: AsyncIOMotorDatabase, project_id: str, username: str):
    project = await find_one_project(
        db=db, project_id=ObjectId(project_id), username=username
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    return project


async def get_ontology(
    db: AsyncIOMotorDatabase, project_id: ObjectId, annotation_type: str
) -> List[OntologyItem]:
    ontology_data = await db.resources.find_one(
        {
            "project_id": project_id,
            "classification": "ontology",
            "sub_classification": annotation_type,
        },
        {"content": 1},
    )
    logger.info(f"ontology_data: {ontology_data}")
    return [OntologyItem.parse_obj(o) for o in ontology_data["content"]]


async def apply_annotation(
    db: AsyncIOMotorDatabase, markup: CreateMarkupApply, apply_all: bool, username: str
) -> Optional[OutMarkupApply]:
    """Applies markup/annotation to items in dataset either individually or batched (propagation)"""
    project = await get_project(db=db, project_id=markup.project_id, username=username)
    ontology = await get_ontology(
        db=db,
        project_id=ObjectId(markup.project_id),
        annotation_type=markup.annotation_type,
    )
    ontology_item = find_ontology_item_by_id(ontology, markup.content.ontology_item_id)

    if markup.annotation_type == "entity":
        if apply_all:
            new_markup = await apply_many_entity_annotations(
                db=db,
                markup=markup,
                dataset_id=ObjectId(project.dataset_id),
                username=username,
            )

            # Sanitize new_markup
            out_markup = []
            for nm in new_markup:
                nm["_id"] = str(nm["_id"])
                nm["dataset_item_id"] = str(nm["dataset_item_id"])
                out_markup.append(
                    EntityOut(
                        **nm,
                        color=ontology_item.color,
                        fullname=ontology_item.fullname,
                        name=ontology_item.name,
                    )
                )
            return OutMarkupApply(
                count=len(new_markup),
                label_name=ontology_item.fullname,
                entities=out_markup if len(new_markup) > 0 else [],
                relations=[],
                annotation_type="entity",
                apply_all=apply_all,
            )
        else:
            exists, new_markup = await apply_single_entity_annotation(
                db=db, markup=markup, username=username
            )
            new_markup["_id"] = str(new_markup["_id"])
            new_markup["dataset_item_id"] = str(new_markup["dataset_item_id"])

            out_entity = EntityOut(
                **new_markup,
                color=ontology_item.color,
                fullname=ontology_item.fullname,
                name=ontology_item.name,
            )

            if new_markup:
                return OutMarkupApply(
                    count=0 if exists else 1,
                    label_name=ontology_item.fullname,
                    entities=[] if exists else [out_entity],
                    relations=[],
                    annotation_type="entity",
                    apply_all=apply_all,
                )

    elif markup.annotation_type == "relation":
        if markup.content.source_id == markup.content.target_id:
            return None

        if (
            await find_one_markup(
                db=db, markup_id=ObjectId(markup.content.source_id), username=username
            )
            is None
        ):
            return None
        if (
            await find_one_markup(
                db=db, markup_id=ObjectId(markup.content.target_id), username=username
            )
            is None
        ):
            return None

        if apply_all:
            new_markup = await apply_many_relation_annotations(
                db=db,
                markup=markup,
                dataset_id=ObjectId(project.dataset_id),
                username=username,
            )
            if new_markup:
                entity_ontology = await get_ontology(
                    db=db, project_id=ObjectId(project.id), annotation_type="entity"
                )
                out_entities = []
                for e in new_markup["entity"]:
                    e["_id"] = str(e["_id"])
                    e["dataset_item_id"] = str(e["dataset_item_id"])
                    e_ontology_item = find_ontology_item_by_id(
                        entity_ontology,
                        e["ontology_item_id"],
                    )
                    out_entities.append(
                        EntityOut(
                            **e,
                            color=e_ontology_item.color,
                            fullname=e_ontology_item.fullname,
                            name=e_ontology_item.name,
                        )
                    )
                out_relations = []
                for r in new_markup["relation"]:
                    r["_id"] = str(r["_id"])
                    r["dataset_item_id"] = str(r["dataset_item_id"])
                    r["target_id"] = str(r["target_id"])
                    r["source_id"] = str(r["source_id"])
                    out_relations.append(
                        RelationOut(
                            **r,
                            color=ontology_item.color,
                            fullname=ontology_item.fullname,
                            name=ontology_item.name,
                        )
                    )

                return OutMarkupApply(
                    count=len(out_relations),
                    label_name=ontology_item.fullname,
                    entities=out_entities,
                    relations=out_relations,
                    annotation_type="relation",
                    apply_all=apply_all,
                )

        else:
            new_markup = await apply_single_relation_annotation(
                db=db, markup=markup, username=username
            )
            new_markup["_id"] = str(new_markup["_id"])
            new_markup["dataset_item_id"] = str(new_markup["dataset_item_id"])
            new_markup["source_id"] = str(new_markup["source_id"])
            new_markup["target_id"] = str(new_markup["target_id"])
            out_markup = RelationOut(
                **new_markup, fullname=ontology_item.fullname, name=ontology_item.name
            )
            if new_markup:
                return OutMarkupApply(
                    count=1 if new_markup else 0,
                    label_name=ontology_item.fullname,
                    entities=[],
                    relations=[out_markup] if new_markup else [],
                    annotation_type="relation",
                    apply_all=apply_all,
                )
    return None


async def accept_single_relation_annotation(db, markup_id: ObjectId, username: str):
    """Updates the suggestion state on a relation and its associated entities"""
    relation = await db["markup"].find_one({"_id": markup_id})

    # Update entities even if they are already accepted...
    await update_one_markup(
        db=db,
        markup_id=relation["source_id"],
        field="suggested",
        value=False,
        username=username,
    )
    await update_one_markup(
        db=db,
        markup_id=relation["target_id"],
        field="suggested",
        value=False,
        username=username,
    )
    # Update relation
    updated_relation = await update_one_markup(
        db=db, markup_id=markup_id, field="suggested", value=False, username=username
    )
    entity_ids = [relation["source_id"], relation["target_id"]]
    relation_ids = [updated_relation["_id"]]
    return entity_ids, relation_ids


async def accept_many_relation_annotation(db, markup_id: ObjectId, username: str):
    """Finds all markup similar to `markup_id` and converts their `suggested` type to `False`"""

    existing_markup = await find_one_markup(
        db=db, markup_id=markup_id, username=username
    )

    # logger.info("existing markup", existing_markup)

    # Find all matching candidate relation markups
    candidate_relation_markups = (
        await db["markup"]
        .find(
            {
                "project_id": ObjectId(existing_markup["project_id"]),
                "created_by": username,
                "ontology_item_id": existing_markup["ontology_item_id"],
                "classification": existing_markup["classification"],
                "suggested": True,
            }
        )
        .to_list(None)
    )

    # logger.info("candidate_relation_markups", candidate_relation_markups)
    # logger.info(f"Candidate relations: {len(candidate_relation_markups)}")

    candidate_relation_markup_ids = [r["_id"] for r in candidate_relation_markups]

    # -- Find entities belonging to relation markups
    candidate_entity_markup_ids = list(
        set(
            itertools.chain.from_iterable(
                [[r["source_id"], r["target_id"]] for r in candidate_relation_markups]
            )
        )
    )
    candidate_markup_ids = candidate_relation_markup_ids + candidate_entity_markup_ids

    # Update relations and entities
    await db["markup"].update_many(
        {"_id": {"$in": candidate_markup_ids}},
        {"$set": {"suggested": False}},
    )

    updated_markups = (
        await db["markup"].find({"_id": {"$in": candidate_markup_ids}}).to_list(None)
    )

    # logger.info("updated_markups", len(updated_markups))

    # Groupby entites and relations by dataset_item_id
    accepted_markup = {"entities": {}, "relations": {}}
    for m in updated_markups:
        _dataset_item_id = m["dataset_item_id"]

        if m["classification"] == "entity":
            if _dataset_item_id in accepted_markup["entities"]:
                accepted_markup["entities"][_dataset_item_id].extend([Entity(**m)])
            else:
                accepted_markup["entities"][_dataset_item_id] = [Entity(**m)]
        if m["classification"] == "relation":
            if _dataset_item_id in accepted_markup["relations"]:
                accepted_markup["relations"][_dataset_item_id].extend([Relation(**m)])
            else:
                accepted_markup["relations"][_dataset_item_id] = [Relation(**m)]

    # return accepted_markup

    entity_ids = [m["_id"] for m in updated_markups if m["classification"] == "entity"]
    relation_ids = [
        m["_id"] for m in updated_markups if m["classification"] == "relation"
    ]
    return entity_ids, relation_ids


async def accept_single_entity_annotation(db, markup_id: ObjectId, username: str):
    return await update_one_markup(
        db=db,
        markup_id=markup_id,
        field="suggested",
        value=False,
        username=username,
    )


async def accept_many_entity_annotation(db, markup_id: ObjectId):
    """Finds all markup similar to markup_id and converts their `suggested` state to `False`"""

    # NEW - get matched ids and then update.
    pipeline = [
        {"$match": {"_id": markup_id}},
        {"$addFields": {"selected_document_id": "$_id"}},
        {
            "$lookup": {
                "from": "markup",
                "let": {
                    "ontology_item_id": "$ontology_item_id",
                    "created_by": "$created_by",
                    "project_id": "$project_id",
                    "surface_form": "$surface_form",
                    "classification": "$classification",
                    "suggested": "$suggested",
                },
                "pipeline": [
                    {
                        "$match": {
                            "$and": [
                                {"$expr": {"$eq": ["$surface_form", "$$surface_form"]}},
                                {"$expr": {"$eq": ["$created_by", "$$created_by"]}},
                                {
                                    "$expr": {
                                        "$eq": [
                                            "$ontology_item_id",
                                            "$$ontology_item_id",
                                        ]
                                    }
                                },
                                {"$expr": {"$eq": ["$project_id", "$$project_id"]}},
                                {
                                    "$expr": {
                                        "$eq": ["$classification", "$$classification"]
                                    }
                                },
                                {"$expr": {"$eq": ["$suggested", "$$suggested"]}},
                            ]
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "start": 1,
                            "end": 1,
                            "created_by": 1,
                            "ontology_item_id": 1,
                            "project_id": 1,
                            "surface_form": 1,
                            "suggested": 1,
                        }
                    },
                ],
                "as": "matched_markup",
            }
        },
        {"$project": {"matched_markup": 1, "_id": 0}},
        {"$unwind": {"path": "$matched_markup"}},
        {"$replaceWith": "$matched_markup"},
        {"$project": {"_id": 1}},
    ]

    # logger.info(f"Pipeline:\n{json.dumps(pipeline, indent=2, default=str)}")

    results = await db["markup"].aggregate(pipeline).to_list(None)

    # logger.info(f"Results:\n{json.dumps(results, indent=2, default=str)}")

    ids_to_update = [r["_id"] for r in results]

    await db["markup"].update_many(
        {"_id": {"$in": ids_to_update}}, {"$set": {"suggested": False}}
    )

    return ids_to_update


async def accept_annotation(
    db,
    markup_id: ObjectId,
    username: str,
    apply_all: bool = False,
) -> Optional[OutMarkupAccept]:
    """Accepts suggested annotations by setting the `suggested` key to True

    Parameters
    ----------
    db: Database connection
    markup_id: ID of the markup to accept
    username: Username performing the acceptance
    apply_all: Whether to accept all matching annotations

    Returns
    -------
    OutMarkupAccept object containing acceptance results or None if invalid
    """
    # Validate markup exists and get base info
    markup = await find_one_markup(db=db, markup_id=markup_id, username=username)
    if not markup:
        return None

    # Get ontology information
    ontology_item = await get_ontology_item(
        db=db,
        classification=markup["classification"],
        project_id=markup["project_id"],
        ontology_item_id=markup["ontology_item_id"],
    )

    if markup["classification"] == "entity":
        if apply_all:
            accepted_markup_ids = await accept_many_entity_annotation(
                db=db, markup_id=markup_id
            )
            if accepted_markup_ids:
                return OutMarkupAccept(
                    count=len(accepted_markup_ids),
                    label_name=ontology_item.fullname,
                    annotation_type="entity",
                    apply_all=apply_all,
                    entity_ids=[str(_id) for _id in accepted_markup_ids],
                )
        else:
            accepted_markup = await accept_single_entity_annotation(
                db=db, markup_id=markup_id, username=username
            )
            if accepted_markup:
                return OutMarkupAccept(
                    count=1,
                    label_name=ontology_item.fullname,
                    annotation_type="entity",
                    apply_all=apply_all,
                    entity_ids=[str(markup_id)],
                )
    elif markup["classification"] == "relation":
        if apply_all:
            entity_ids, relation_ids = await accept_many_relation_annotation(
                db=db, markup_id=markup_id, username=username
            )
            if entity_ids and relation_ids:
                return OutMarkupAccept(
                    count=len(relation_ids),
                    label_name=ontology_item.fullname,
                    annotation_type="relation",
                    apply_all=apply_all,
                    entity_ids=[str(i) for i in entity_ids],
                    relation_ids=[str(i) for i in relation_ids],
                )
        else:
            entity_ids, relation_ids = await accept_single_relation_annotation(
                db=db, markup_id=markup_id, username=username
            )

            logger.info("entity_ids, relation_ids", entity_ids, relation_ids)

            if entity_ids and relation_ids:
                return OutMarkupAccept(
                    count=1,
                    label_name=ontology_item.fullname,
                    annotation_type="relation",
                    apply_all=apply_all,
                    entity_ids=[str(i) for i in entity_ids],
                    relation_ids=[str(i) for i in relation_ids],
                )
    return


async def delete_single_entity_annotation(
    db, markup_id: ObjectId, username: str, blocked_dataset_item_ids: List[str] = None
) -> Optional[Dict[str, Any]]:
    """Deletes a single entity annotation"""
    # Check if entity is associated with a relation
    try:
        relations = (
            await db["markup"]
            .find(
                {"$or": [{"source_id": markup_id}, {"target_id": markup_id}]},
                {"_id": 1},
            )
            .to_list(None)
        )

        # Delete relations and markup
        relation_ids = [r["_id"] for r in relations]
        await db["markup"].delete_many(
            {"_id": {"$in": relation_ids + [markup_id]}, "created_by": username}
        )

        return relation_ids
    except Exception as e:
        logger.info(f"Failed to delete single entity annotation: {e}")


async def delete_many_entity_annotations(
    db, markup_id: ObjectId, username: str, blocked_dataset_item_ids: List[ObjectId]
) -> Tuple[int, List[ObjectId], List[ObjectId]]:
    """Deletes all entity annotations that are similar to the markup_id"""
    pipeline = [
        {
            "$match": {
                "_id": markup_id,
                "created_by": username,
                "dataset_item_id": {"$nin": blocked_dataset_item_ids},
            }
        },
        {"$addFields": {"selected_document_id": "$_id"}},
        {
            "$lookup": {
                "from": "markup",
                "let": {
                    "ontology_item_id": "$ontology_item_id",
                    "created_by": "$created_by",
                    "project_id": "$project_id",
                    "surface_form": "$surface_form",
                    "classification": "$classification",
                    "suggested": "$suggested",
                },
                "pipeline": [
                    {
                        "$match": {
                            "$and": [
                                {"$expr": {"$eq": ["$surface_form", "$$surface_form"]}},
                                {"$expr": {"$eq": ["$created_by", "$$created_by"]}},
                                {
                                    "$expr": {
                                        "$eq": [
                                            "$ontology_item_id",
                                            "$$ontology_item_id",
                                        ]
                                    }
                                },
                                {"$expr": {"$eq": ["$project_id", "$$project_id"]}},
                                {
                                    "$expr": {
                                        "$eq": ["$classification", "$$classification"]
                                    }
                                },
                            ]
                        }
                    },
                    {
                        "$match": {
                            "$expr": {
                                "$eq": [
                                    {
                                        "$cond": {
                                            "if": "$$suggested",
                                            "then": "$suggested",
                                            "else": {
                                                "$in": ["$suggested", [True, False]]
                                            },
                                        }
                                    },
                                    True,
                                ]
                            }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "start": 1,
                            "end": 1,
                            "created_by": 1,
                            "ontology_item_id": 1,
                            "project_id": 1,
                            "surface_form": 1,
                        }
                    },
                ],
                "as": "matched_markup",
            }
        },
        {"$project": {"matched_markup": 1, "_id": 0}},
        {"$unwind": {"path": "$matched_markup"}},
        {"$replaceWith": "$matched_markup"},
        {
            "$lookup": {
                "from": "markup",
                "let": {"markup_id": "$_id"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$or": [
                                    {"$eq": ["$source_id", "$$markup_id"]},
                                    {"$eq": ["$target_id", "$$markup_id"]},
                                ]
                            }
                        }
                    },
                    {"$project": {"_id": 1}},
                ],
                "as": "relations",
            }
        },
        {
            "$addFields": {
                "relation_ids": "$relations._id",
            },
        },
        {"$project": {"relations": 0}},
        {
            "$group": {
                "_id": None,
                "entity_ids": {"$push": "$_id"},
                "relation_ids": {"$push": "$relation_ids"},
            }
        },
        {
            "$addFields": {
                "relation_ids": {
                    "$reduce": {
                        "input": "$relation_ids",
                        "initialValue": [],
                        "in": {"$concatArrays": ["$$value", "$$this"]},
                    }
                }
            }
        },
        {"$project": {"_id": 0}},
    ]
    result = await db.markup.aggregate(pipeline).to_list(None)
    result = result[0]
    ids_to_delete = result["entity_ids"] + result["relation_ids"]
    delete_result = await db.markup.delete_many({"_id": {"$in": ids_to_delete}})
    return (
        delete_result.deleted_count,
        result["entity_ids"],
        result["relation_ids"],
    )


async def delete_single_relation_annotation(
    db, markup_id: ObjectId, username: str, blocked_dataset_item_ids: List[str] = None
) -> None:
    """Deletes a single relation annotation"""
    await db["markup"].delete_one({"_id": markup_id, "created_by": username})


async def delete_many_relation_annotations(
    db, markup_id: ObjectId, username: str, blocked_dataset_item_ids: List[ObjectId]
) -> Tuple[int, Dict]:
    """Find all matching relations to markup_id and delete.

    Matching relations must have the same properties including src/tgt entity surface forms and offset.

    Returns
    -------
        Tuple[int, Dict]: Count of deleted items and mapping of dataset_item_id to deleted relation IDs
    """

    markup = await find_one_markup(db=db, markup_id=markup_id, username=username)

    if markup is None:
        return 0, {}

    markup_is_suggested = markup["suggested"]

    markup_src_entity = await find_one_markup(
        db=db, markup_id=markup["source_id"], username=username
    )
    markup_tgt_entity = await find_one_markup(
        db=db, markup_id=markup["target_id"], username=username
    )

    if markup_src_entity is None or markup_tgt_entity is None:
        logger.warning("Source or target entity not found")
        return 0, {}

    offset = get_entity_offset(
        source_entity=markup_src_entity, target_entity=markup_tgt_entity
    )

    # Build the aggregation pipeline
    pipeline = [
        {
            "$match": {
                "ontology_item_id": markup["ontology_item_id"],
                "project_id": markup["project_id"],
                "created_by": username,
                "classification": markup["classification"],
                "suggested": True if markup_is_suggested else {"$in": [True, False]},
                "dataset_item_id": {"$nin": blocked_dataset_item_ids},
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
            "$match": {
                "source.surface_form": markup_src_entity["surface_form"],
                "source.ontology_item_id": markup_src_entity["ontology_item_id"],
                "target.surface_form": markup_tgt_entity["surface_form"],
                "target.ontology_item_id": markup_tgt_entity["ontology_item_id"],
            }
        },
        {
            "$addFields": {
                "offset": {
                    "$abs": {
                        "$subtract": [
                            {
                                "$subtract": [
                                    "$target.start",
                                    "$source.end",
                                ],
                            },
                            1,
                        ],
                    },
                },
            }
        },
        {"$match": {"offset": {"$eq": offset}}},
    ]

    # Get matching relations
    matched_relation_markup = await db.markup.aggregate(pipeline).to_list(None)

    if len(matched_relation_markup) == 0:
        logger.info("No matching relations found")
        return 0, {}

    # Extract IDs for deletion
    relation_ids = [ObjectId(r["_id"]) for r in matched_relation_markup]
    relation_ids_str = [str(r["_id"]) for r in matched_relation_markup]

    # Perform the deletion
    delete_result = await db.markup.delete_many({"_id": {"$in": relation_ids}})

    return delete_result.deleted_count, relation_ids_str


async def delete_annotation(
    db: AsyncIOMotorDatabase,
    markup_id: ObjectId,
    username: str,
    apply_all: bool = False,
) -> Optional[OutMarkupDelete]:
    """Delete annotation(s) based on markup_id and application type.

    Parameters
    ----------
        db: Database connection
        markup_id: ID of the markup to delete
        username: Username performing the deletion
        apply_all: Whether to delete all matching annotations

    Returns
    -------
        OutMarkupDelete object containing deletion results or None if invalid
    """
    # Validate markup exists and get base info
    markup = await find_one_markup(db=db, markup_id=markup_id, username=username)
    if not markup:
        return None

    # Get ontology information
    ontology_item = await get_ontology_item(
        db=db,
        project_id=markup["project_id"],
        classification=markup["classification"],
        ontology_item_id=markup["ontology_item_id"],
    )

    # Define deletion strategies
    deletion_handlers = {
        AnnotationType.entity: {
            True: delete_many_entity_annotations,
            False: delete_single_entity_annotation,
        },
        AnnotationType.relation: {
            True: delete_many_relation_annotations,
            False: delete_single_relation_annotation,
        },
    }

    # Get saved dataset item ids, these cannot be modified and are considered 'blocked'.
    blocked_dataset_item_ids = await db.data.find(
        {"save_states": {"$elemMatch": {"created_by": username}}}
    ).to_list(None)

    try:
        annotation_type = AnnotationType(markup["classification"])
    except ValueError:
        return None

    # Get appropriate deletion handler
    delete_handler = deletion_handlers[annotation_type][apply_all]

    # Execute deletion and format response based on annotation type
    if annotation_type == AnnotationType.entity:
        if apply_all:
            count, deleted_entities, deleted_relations = await delete_handler(
                db=db,
                markup_id=markup_id,
                username=username,
                blocked_dataset_item_ids=blocked_dataset_item_ids,
            )
            return OutMarkupDelete(
                count=count,
                label_name=ontology_item.fullname,
                entity_ids=[str(id) for id in deleted_entities],
                relation_ids=[str(id) for id in deleted_relations],
                annotation_type=annotation_type.value,
                apply_all=apply_all,
            )
        else:
            deleted_relation_ids = await delete_handler(
                db=db, markup_id=markup_id, username=username
            )
            return OutMarkupDelete(
                count=1,
                label_name=ontology_item.fullname,
                entity_ids=[str(markup_id)],
                relation_ids=[str(id) for id in deleted_relation_ids],
                annotation_type=annotation_type.value,
                apply_all=apply_all,
            )
    else:  # relation
        if apply_all:
            count, deleted_ids = await delete_handler(
                db=db,
                markup_id=markup_id,
                username=username,
                blocked_dataset_item_ids=blocked_dataset_item_ids,
            )
            return OutMarkupDelete(
                count=count,
                label_name=ontology_item.fullname,
                relation_ids=deleted_ids,
                annotation_type=annotation_type.value,
                apply_all=apply_all,
            )
        else:
            await delete_handler(db=db, markup_id=markup_id, username=username)
            return OutMarkupDelete(
                count=1,
                label_name=ontology_item.fullname,
                relation_ids=[str(markup_id)],
                annotation_type=annotation_type.value,
                apply_all=apply_all,
            )
