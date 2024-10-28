"""
Markup route services
"""

from datetime import datetime
from typing import List, Optional, Dict
import itertools
import re
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from fastapi import HTTPException, status
from loguru import logger
import pymongo
from pymongo import DeleteOne
import json

from models.markup import (
    Entity,
    OutMarkupApply,
    EntityMarkup,
    CreateEntity,
    CreateMarkupApply,
    RichCreateEntity,
    Classifications,
    OutMarkupDelete,
    RichCreateRelation,
    Relation,
    CreateRelation,
    RelationMarkup,
)
from models.dataset import DatasetItem
from models.project import OntologyItem, ProjectOntology, Project, ProjectOntology
import services.projects as project_services
import services.markup as markup_services
import services.dataset as dataset_services


def get_entity_offset(source_entity: dict, target_entity: dict) -> int:
    return abs(target_entity["start"] - source_entity["end"]) - 1


def find_sub_lists(sl, l):
    """src: https://stackoverflow.com/a/17870684

    Args
        sl : sublist (tokens to match)
        l : list (all candidate tokens)
    """
    results = []
    sll = len(sl)
    for ind in (i for i, e in enumerate(l) if e == sl[0]):
        if l[ind : ind + sll] == sl:
            results.append((ind, ind + sll - 1))

    return results


def find_ontology_item_by_id(
    ontology: List[OntologyItem], ontology_item_id: str
) -> Optional[OntologyItem]:
    for node in ontology:
        if node.id == ontology_item_id:
            return node
        else:
            child = find_ontology_item_by_id(node.children, ontology_item_id)
            if child:
                return child
    return None


async def get_ontology_item(
    db: AsyncIOMotorDatabase,
    classification: str,
    ontology_item_id: str,
    project_id: ObjectId = None,
    ontology=None,
):
    print("calling `get_ontology_item`")

    if ontology is None:
        project = await db["projects"].find_one(
            {"_id": project_id}, {"_id": 0, "ontology": 1}
        )
        ontology = ProjectOntology.parse_obj(project["ontology"])

    ontology_item = find_ontology_item_by_id(
        getattr(ontology, classification), ontology_item_id
    )

    return ontology_item


async def find_many_markups(db, project_id: ObjectId, username: str):
    """Find all markup created by a user for a given project"""

    return (
        await db["markup"]
        .find({"project_id": project_id, "created_by": username})
        .to_list(None)
    )


async def find_one_markup(db, markup_id: ObjectId, username: str):
    return await db["markup"].find_one({"_id": markup_id, "created_by": username})


async def update_one_markup(db, markup_id: ObjectId, field: str, value, username: str):
    print("update_one_markup", markup_id)
    await db["markup"].update_one({"_id": markup_id}, {"$set": {field: value}})
    return await find_one_markup(db=db, markup_id=markup_id, username=username)


async def apply_single_relation_annotation(
    db, markup: CreateMarkupApply, username: str
):
    # MAJOR CHANGE - Converted legacy method into single MongoDB upsert
    filter_criteria = {
        "project_id": ObjectId(markup.project_id),
        "dataset_item_id": ObjectId(markup.dataset_item_id),
        "created_by": username,
        "source_id": ObjectId(markup.content.source_id),
        "target_id": ObjectId(markup.content.target_id),
        "ontology_item_id": markup.content.ontology_item_id,
    }

    new_relation_markup = RichCreateRelation(
        **markup.content.dict(),
        project_id=markup.project_id,
        dataset_item_id=markup.dataset_item_id,
        created_at=datetime.utcnow(),
        created_by=username,
        suggested=markup.suggested,
        classification=markup.annotation_type,
    ).dict()

    result = await db["markup"].update_one(
        filter_criteria, {"$set": new_relation_markup}, upsert=True
    )

    if result.upserted_id is not None:
        # Some reason `result` `id` is different to `inserted_markup.inserted_id` - TODO: review.
        return await db["markup"].find_one({"_id": result.upserted_id})


async def apply_many_relation_annotations(
    db,
    markup: CreateMarkupApply,
    dataset_id: ObjectId,
    username: str,
):
    """Applies relation across entire dataset - apart from the focus relation, matched entities and relations are created as `suggested`"""

    print("markup", markup)
    # Find candidates - these are dataset items that contain the surface form of source/target entities.

    # -- Get the surface form of the source/target entities
    source_entity = await find_one_markup(
        db=db, markup_id=markup.content.source_id, username=username
    )
    target_entity = await find_one_markup(
        db=db, markup_id=markup.content.target_id, username=username
    )

    # print("\nsource_entity", source_entity)
    # print("\ntarget_entity", target_entity)

    source_entity_surface_form = source_entity["surface_form"]
    target_entity_surface_form = target_entity["surface_form"]
    print("source_entity_surface_form", source_entity_surface_form)
    print("target_entity_surface_form", target_entity_surface_form)

    # src_tokens = source_entity["surface_form"].split(" ")
    # tgt_tokens = target_entity["surface_form"].split(" ")

    # print("src_tokens", src_tokens)
    # print("tgt_tokens", tgt_tokens)

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

    # print("pipeline\n", json.dumps(pipeline, indent=2, default=str))

    # result = await db["data"].aggregate(pipeline).to_list(None)
    # print("aggregation result\n", json.dumps(result, indent=2, default=str))

    # ----- OLD CODE ------

    lr_direction = source_entity["end"] <= target_entity["start"]
    print("lr_direction", lr_direction)

    offset = get_entity_offset(source_entity=source_entity, target_entity=target_entity)
    # abs(target_entity["start"] - source_entity["end"]) - 1
    print("OFFSET", offset)

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

    print("candidates found:", len(candidate_dataset_item_ids))

    # -- Get src/tgt token spans in matched dataset items
    #       - Offset of original markup needs to be preserved
    #       - Direction of source and target needs to be preserver; left-right or right-left. TODO: Investigate this. Should this be enforced?
    source_tokens_to_match = source_entity_surface_form.split(" ")
    target_tokens_to_match = target_entity_surface_form.split(" ")

    new_markup = {"entity": {}, "relation": {}}
    for dataset_item in candidate_dataset_item_ids:
        dataset_item_id = str(dataset_item["_id"])

        # Identify matching markup span(s)
        candidate_src_token_spans = find_sub_lists(
            source_tokens_to_match, dataset_item["tokens"]
        )
        # print("candidate_src_token_spans", candidate_src_token_spans)

        candidate_tgt_token_spans = find_sub_lists(
            target_tokens_to_match, dataset_item["tokens"]
        )
        # print("candidate_tgt_token_spans", candidate_tgt_token_spans)

        # Create pairs between src/tgts and filter out src/tgt spans that are offset the same as the focus
        # first tuple item is src, second is tgt
        _pairs = [
            p
            for p in list(
                itertools.product(candidate_src_token_spans, candidate_tgt_token_spans)
            )
            if abs(p[1][0] - p[0][1]) - 1 == offset
        ]

        # print("_pairs", _pairs)

        # Create entities and relation for matched pairs

        for pair in _pairs:
            # print("pair", pair)
            src_span, tgt_span = pair
            # print("src_span, tgt_span", src_span, tgt_span)

            accepted = (
                (dataset_item_id == markup.dataset_item_id)
                and (source_entity["start"] == src_span[0])
                and (source_entity["end"] == src_span[1])
                and (target_entity["start"] == tgt_span[0])
                and (target_entity["end"] == tgt_span[1])
            )
            # print("accepted", accepted)

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
                ),
                username=username,
            )
            print("created_source_markup", created_source_markup)

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
                ),
                username=username,
            )
            print("created_target_markup", created_target_markup)

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
                            source_id=created_source_markup["_id"],
                            target_id=created_target_markup["_id"],
                        ),
                    ),
                    username=username,
                )
                print("created_relation_markup", created_relation_markup)

                # If relation is accepted; set accepted state for its entities
                if not created_relation_markup["suggested"]:
                    print("\n Updating entity suggestion states")
                    await markup_services.update_one_markup(
                        db=db,
                        markup_id=created_source_markup["_id"],
                        field="suggested",
                        value=False,
                        username=username,
                    )

                    created_source_markup = Entity(
                        **await markup_services.find_one_markup(
                            db=db,
                            markup_id=created_source_markup["_id"],
                            username=username,
                        )
                    )

                    await markup_services.update_one_markup(
                        db=db,
                        markup_id=created_target_markup["_id"],
                        field="suggested",
                        value=False,
                        username=username,
                    )

                    created_target_markup = Entity(
                        **await markup_services.find_one_markup(
                            db=db,
                            markup_id=created_target_markup["_id"],
                            username=username,
                        )
                    )

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
                    if dataset_item_id in new_markup["relation"].keys():
                        new_markup["relation"][dataset_item_id].extend(
                            [created_relation_markup]
                        )
                    else:
                        new_markup["relation"][dataset_item_id] = [
                            created_relation_markup
                        ]
                if created_source_markup:
                    if dataset_item_id in new_markup["entity"].keys():
                        new_markup["entity"][dataset_item_id].extend(
                            [created_source_markup]
                        )
                    else:
                        new_markup["entity"][dataset_item_id] = [created_source_markup]
                if created_target_markup:
                    if dataset_item_id in new_markup["entity"].keys():
                        new_markup["entity"][dataset_item_id].extend(
                            [created_target_markup]
                        )
                    else:
                        new_markup["entity"][dataset_item_id] = [created_target_markup]

    print("new_markup", new_markup)

    if len(new_markup.keys()) > 0:
        return new_markup
    return


async def apply_single_entity_annotation(
    db,
    markup: CreateMarkupApply,
    username: str,
) -> Dict[bool, dict]:
    """Applies single annotation to dataset item. If markup already exists as a suggestion, it will be converted to an accepted, silver, markup.

    Returns
        exists (boolean) - flag to indicate whether markup exists already
        markup (dict) - new or existing entity markup
    """

    # MAJOR CHANGE - Converted legacy method into single MongoDB upsert
    filter_criteria = {
        "project_id": ObjectId(markup.project_id),
        "dataset_item_id": ObjectId(markup.dataset_item_id),
        "created_by": username,
        "start": markup.content.start,
        "end": markup.content.end,
        "ontology_item_id": markup.content.ontology_item_id,
    }

    new_markup = RichCreateEntity(
        **markup.content.dict(),
        project_id=markup.project_id,
        dataset_item_id=markup.dataset_item_id,
        created_by=username,
        suggested=markup.suggested,
        classification=markup.annotation_type,
    ).dict()

    result = await db["markup"].update_one(
        filter_criteria, {"$set": new_markup}, upsert=True
    )

    if result.upserted_id is not None:
        # Some reason `result` `id` is different to `inserted_markup.inserted_id` - TODO: review.
        print("Returning created markup")
        return False, await db["markup"].find_one({"_id": result.upserted_id})
    else:
        # Return existing markup
        print("Returning existing matched markup")
        return True, await db["markup"].find_one(filter_criteria)


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
    print("Markup", markup)

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

    print("pipeline:\n", json.dumps(pipeline, indent=2, default=str))

    results = await db["data"].aggregate(pipeline).to_list(None)

    print("results:\n", json.dumps(results, indent=2, default=str))

    if len(results) == 0:
        return []

    # Create entities from results of aggregation - In the future this will be done as part of the aggregation...
    # Each item is given a unique ObjectId.
    inserted_result = await db["markup"].insert_many(
        [{**r, "_id": ObjectId()} for r in results]
    )
    inserted_ids = inserted_result.inserted_ids

    # print("inserted_ids", inserted_ids)

    new_markup = await db["markup"].find({"_id": {"$in": inserted_ids}}).to_list(None)

    return new_markup


async def apply_annotation(
    db, markup: CreateMarkupApply, apply_all: bool, username: str
):
    """Applies markup/annotation to items in dataset either individually or batched (propagation)"""

    print('Calling: "apply_annotation()"')

    project_id = ObjectId(markup.project_id)
    project = await project_services.find_one_project(
        db=db, project_id=project_id, username=username
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # Get ontology item details
    ontology_item = find_ontology_item_by_id(
        getattr(project.ontology, markup.annotation_type),
        markup.content.ontology_item_id,
    )

    # Check that dataset item exists
    if not await dataset_services.find_one_dataset_item(
        db=db, item_id=ObjectId(markup.dataset_item_id)
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Dataset item not found."
        )

    if markup.annotation_type == "entity":
        if apply_all:
            print("Apply many entity markup")
            new_markup = await apply_many_entity_annotations(
                db=db,
                markup=markup,
                dataset_id=ObjectId(project.dataset_id),
                username=username,
            )

            return {
                "count": len(new_markup),
                "label_name": ontology_item.fullname,
                "annotation_type": "entity",
                "apply_all": apply_all,
                "entities": [
                    {
                        "id": str(e["_id"]),
                        "color": ontology_item.color,
                        "fullname": ontology_item.fullname,
                        "name": ontology_item.name,
                        "start": e["start"],
                        "end": e["end"],
                        "surface_form": e["surface_form"],
                        "suggested": e["suggested"],
                        "created_at": e["created_at"],
                        "updated_at": e["updated_at"],
                        "dataset_item_id": str(e["dataset_item_id"]),
                        "ontology_item_id": str(e["ontology_item_id"]),
                        "state": "active",  # TODO: review where this is used...
                    }
                    for e in new_markup
                ]
                if len(new_markup) > 0
                else [],
            }

            # return OutMarkupApply(
            #     count=len(
            #         new_markup
            #     ),  # sum([len(v) for _, v in new_markup.items()]),
            #     label_name=ontology_item.fullname,
            #     entities=[
            #         EntityMarkup(
            #             **e,
            #             color=ontology_item.color,
            #             fullname=ontology_item.fullname,
            #             name=ontology_item.name,
            #         )
            #         for e in new_markup
            #     ],
            #     annotation_type="entity",
            #     apply_all=apply_all,
            # )
        else:
            print("Apply single entity markup")
            exists, new_markup = await apply_single_entity_annotation(
                db=db, markup=markup, username=username
            )

            # print("new_markup", new_markup)

            try:
                new_markup = {
                    "id": str(new_markup["_id"]),
                    "color": ontology_item.color,
                    "fullname": ontology_item.fullname,
                    "name": ontology_item.name,
                    "start": new_markup["start"],
                    "end": new_markup["end"],
                    "surface_form": new_markup["surface_form"],
                    "suggested": new_markup["suggested"],
                    "created_at": new_markup["created_at"],
                    "updated_at": new_markup["updated_at"],
                    "dataset_item_id": str(new_markup["dataset_item_id"]),
                    "ontology_item_id": str(new_markup["ontology_item_id"]),
                    "state": "active",  # TODO: review where this is used...
                    # **EntityMarkup(
                    #     id=new_markup[
                    #         "_id"
                    #     ],  # For some reason, serialization changes the _id...
                    #     **new_markup,
                    #     color=ontology_item.color,
                    #     fullname=ontology_item.fullname,
                    #     name=ontology_item.name,
                    # ).dict(),
                }

                # print("new_markup", new_markup)
            except Exception as e:
                print("exception", e)

            if new_markup:
                return {
                    "count": 0 if exists else 1,
                    "label_name": ontology_item.fullname,
                    "entities": [] if exists else [new_markup],
                    "annotation_type": "entity",
                    "apply_all": apply_all,
                }
                return OutMarkupApply(
                    count=1,
                    label_name=ontology_item.fullname,
                    entities=[
                        EntityMarkup(
                            dataset_item_id=str(markup.dataset_item_id),
                            id=new_markup[
                                "_id"
                            ],  # For some reason, serialization changes the _id...
                            **new_markup,
                            color=ontology_item.color,
                            fullname=ontology_item.fullname,
                            name=ontology_item.name,
                        )
                    ],
                    annotation_type="entity",
                    apply_all=apply_all,
                )

    elif markup.annotation_type == "relation":
        if markup.content.source_id == markup.content.target_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot create relation - source and target entities are identical.",
            )

        if not await find_one_markup(
            db=db, markup_id=ObjectId(markup.content.source_id), username=username
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source entity not found",
            )
        if not await find_one_markup(
            db=db, markup_id=ObjectId(markup.content.target_id), username=username
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target entity not found",
            )

        if apply_all:
            print("Apply all relations".upper())

            new_markup = await apply_many_relation_annotations(
                db=db,
                markup=markup,
                dataset_id=ObjectId(project.dataset_id),
                username=username,
            )

            # print("NEW MANY RELATION", new_markup)
            if new_markup:
                return OutMarkupApply(
                    count=sum([len(v) for _, v in new_markup["relation"].items()]),
                    label_name=ontology_item.fullname,
                    entities=new_markup["entity"],
                    relations=new_markup["relation"],
                    annotation_type="relation",
                    apply_all=apply_all,
                )

        else:
            print("Apply single relation".upper())
            new_markup = await apply_single_relation_annotation(
                db=db, markup=markup, username=username
            )

            try:
                new_markup = {
                    "id": str(new_markup["_id"]),
                    "fullname": ontology_item.fullname,
                    "name": ontology_item.name,
                    "suggested": new_markup["suggested"],
                    "created_at": new_markup["created_at"],
                    "updated_at": new_markup["updated_at"],
                    "dataset_item_id": str(new_markup["dataset_item_id"]),
                    "ontology_item_id": str(new_markup["ontology_item_id"]),
                    "target_id": str(new_markup["target_id"]),
                    "source_id": str(new_markup["source_id"]),
                    "state": "active",  # TODO: review if required.
                }
            except Exception as e:
                print("single relation apply", e)

            if new_markup:
                return {
                    "count": 1,
                    "label_name": ontology_item.fullname,
                    "relations": [new_markup],
                    "annotation_type": "relation",
                    "apply_all": apply_all,
                }

                return OutMarkupApply(
                    count=1,
                    label_name=ontology_item.fullname,
                    relations={
                        markup.dataset_item_id: [
                            RelationMarkup(
                                id=new_markup[
                                    "_id"
                                ],  # For some reason, serialization changes the _id...
                                **new_markup,
                                color=ontology_item.color,
                                fullname=ontology_item.fullname,
                                name=ontology_item.name,
                            )
                        ]
                    },
                    annotation_type="relation",
                    apply_all=apply_all,
                )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Annotation type specified is not supported",
        )


async def accept_single_relation_annotation(db, markup_id: ObjectId, username: str):
    """Updates the suggestion state on a relation and its associated entities"""
    relation = await db["markup"].find_one({"_id": markup_id})

    # Update entities even if they are already accepted...
    updated_source_entity = await update_one_markup(
        db=db,
        markup_id=relation["source_id"],
        field="suggested",
        value=False,
        username=username,
    )
    updated_target_entity = await update_one_markup(
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

    # source_ontology_item = await get_ontology_item(
    #     db=db,
    #     project_id=relation["project_id"],
    #     ontology_item_id=updated_source_entity["ontolog_item_id"],
    # )

    # return {
    #     "entities": {
    #         relation["dataset_item_id"]: [
    #             Entity(**updated_source_entity),
    #             Entity(**updated_target_entity),
    #         ]
    #     },
    #     "relations": {relation["dataset_item_id"]: [Relation(**updated_relation)]},
    # }

    entity_ids = [relation["source_id"], relation["target_id"]]
    relation_ids = [updated_relation["_id"]]
    return entity_ids, relation_ids


async def accept_many_relation_annotation(db, markup_id: ObjectId, username: str):
    """
    Finds all markup similar to `markup_id` and converts their `suggested` type to `False`
    """

    existing_markup = await find_one_markup(
        db=db, markup_id=markup_id, username=username
    )

    # print("existing markup", existing_markup)

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

    # print("candidate_relation_markups", candidate_relation_markups)
    # print(f"Candidate relations: {len(candidate_relation_markups)}")

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

    # print("updated_markups", len(updated_markups))

    # Groupby entites and relations by dataset_item_id
    accepted_markup = {"entities": {}, "relations": {}}
    for m in updated_markups:
        _dataset_item_id = m["dataset_item_id"]

        if m["classification"] == Classifications.entity.value:
            if _dataset_item_id in accepted_markup["entities"]:
                accepted_markup["entities"][_dataset_item_id].extend([Entity(**m)])
            else:
                accepted_markup["entities"][_dataset_item_id] = [Entity(**m)]
        if m["classification"] == Classifications.relation.value:
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

    # print(f"Pipeline:\n{json.dumps(pipeline, indent=2, default=str)}")

    results = await db["markup"].aggregate(pipeline).to_list(None)

    # print(f"Results:\n{json.dumps(results, indent=2, default=str)}")

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
):
    """Accepts suggested annotations by setting the `suggested` key to True"""

    print('"accept_annotation"')

    markup = await find_one_markup(db=db, markup_id=markup_id, username=username)

    if not markup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Markup not found"
        )

    ontology_item = await get_ontology_item(
        db=db,
        classification=markup["classification"],
        project_id=markup["project_id"],
        ontology_item_id=markup["ontology_item_id"],
    )

    print("ontology_item", ontology_item)

    if markup["classification"] == Classifications.entity.value:
        if markup == None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Markup not found"
            )
        if apply_all:
            accepted_markup_ids = await accept_many_entity_annotation(
                db=db, markup_id=markup_id
            )

            # print("accepted_markup_ids", accepted_markup_ids)

            if accepted_markup_ids:
                return {
                    "count": len(accepted_markup_ids),
                    "label_name": ontology_item.fullname,
                    "entity_ids": [str(_id) for _id in accepted_markup_ids],
                    "annotation_type": "entity",
                    "apply_all": apply_all,
                }
                # return OutMarkupApply(
                # )
        else:
            accepted_markup = await accept_single_entity_annotation(
                db=db, markup_id=markup_id, username=username
            )

            # print("accepted_markup", accepted_markup)

            if accepted_markup:
                return {
                    "count": 1,
                    "label_name": ontology_item.fullname,
                    "annotation_type": "entity",
                    "apply_all": apply_all,
                    "entity_ids": [str(markup_id)],
                }
            # return OutMarkupApply(
            #     count=1,
            #     label_name=ontology_item.fullname,
            #     # entities={
            #     #     str(markup["dataset_item_id"]): [
            #     #         EntityMarkup(
            #     #             id=str(markup_id),
            #     #             **accepted_markup,
            #     #             color=ontology_item.color,
            #     #             fullname=ontology_item.fullname,
            #     #             name=ontology_item.name,
            #     #         )
            #     #     ]
            #     # },
            #     annotation_type="entity",
            #     apply_all=apply_all,
            # )

    elif markup["classification"] == Classifications.relation.value:
        if apply_all:
            entity_ids, relation_ids = await accept_many_relation_annotation(
                db=db, markup_id=markup_id, username=username
            )

            print("entity_ids, relation_ids", entity_ids, relation_ids)

            if entity_ids and relation_ids:
                return {
                    "count": len(relation_ids),
                    "label_name": ontology_item.fullname,
                    "annotation_type": "relation",
                    "apply_all": apply_all,
                    "entity_ids": [str(i) for i in entity_ids],
                    "relation_ids": [str(i) for i in relation_ids],
                }

            # return OutMarkupApply(
            #     count=len(accepted_markup["relations"]),
            #     label_name=ontology_item.fullname,
            #     **accepted_markup,
            #     annotation_type="relation",
            #     apply_all=apply_all,
            # )
        else:
            entity_ids, relation_ids = await accept_single_relation_annotation(
                db=db, markup_id=markup_id, username=username
            )

            print("entity_ids, relation_ids", entity_ids, relation_ids)

            if entity_ids and relation_ids:
                return {
                    "count": 1,
                    "label_name": ontology_item.fullname,
                    "annotation_type": "relation",
                    "apply_all": apply_all,
                    "entity_ids": [str(i) for i in entity_ids],
                    "relation_ids": [str(i) for i in relation_ids],
                }

            # return OutMarkupApply(
            #     count=1,
            #     label_name=ontology_item.fullname,
            #     entities=accepted_markup["entities"],
            #     relations=accepted_markup["relations"],
            #     annotation_type="relation",
            #     apply_all=apply_all,
            # )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Markup classification type specified is not supported",
        )


async def delete_single_entity_annotation(db, markup_id: ObjectId, username: str):
    print('"delete_single_entity_annotation"')
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
        print(f"Failed to delete single entity annotation: {e}")


async def delete_many_entity_annotations(db, markup_id: ObjectId, username: str):
    print(f'"delete_many_entity_annotations"')
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

    try:
        result = await db["markup"].aggregate(pipeline).to_list(None)

        result = result[0]

        # print("aggregation result\n", json.dumps(result, indent=2, default=str))

        ids_to_delete = result["entity_ids"] + result["relation_ids"]

        print("ids_to_delete", ids_to_delete)

        delete_result = await db["markup"].delete_many({"_id": {"$in": ids_to_delete}})

        output = (
            delete_result.deleted_count,
            result["entity_ids"],
            result["relation_ids"],
        )

        return output

    except Exception as e:
        print(e)


async def delete_single_relation_annotation(db, markup_id: ObjectId, username: str):
    await db["markup"].delete_one({"_id": markup_id, "created_by": username})


async def delete_many_relations(db, markup_id: ObjectId, username: str):
    """Find all matching relations to markup_id and delete. Matching relations
    must have the same properties including src/tgt entity surface forms and offset...
    """

    markup = await find_one_markup(db=db, markup_id=markup_id, username=username)
    markup_is_suggested = markup["suggested"]

    markup_src_entity = await find_one_markup(
        db=db, markup_id=markup["source_id"], username=username
    )
    markup_tgt_entity = await find_one_markup(
        db=db, markup_id=markup["target_id"], username=username
    )

    print("\nmarkup_src_entity\n", markup_src_entity)
    print("\nmarkup_tgt_entity\n", markup_tgt_entity)

    offset = get_entity_offset(
        source_entity=markup_src_entity, target_entity=markup_tgt_entity
    )
    print(f"Entity offset: {offset}")

    pipeline = [
        {
            "$match": {
                "ontology_item_id": markup["ontology_item_id"],
                "project_id": markup["project_id"],
                "created_by": username,
                "classification": markup["classification"],
                "suggested": True if markup_is_suggested else {"$in": [True, False]},
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
                "source.surface_form": "John",
                "source.ontology_item_id": "i1",
                "target.surface_form": "Smith",
                "target.ontology_item_id": "i1",
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

    matched_relation_markup = await db["markup"].aggregate(pipeline).to_list(None)

    print(f"relation candidates: {len(matched_relation_markup)}")

    relation_ids = [str(r["_id"]) for r in matched_relation_markup]

    await db["markup"].delete_many({"_id": relation_ids})

    # Create output
    deleted_relation_markup = {
        str(k): [str(r["_id"]) for r in list(v)]
        for k, v in itertools.groupby(
            matched_relation_markup, lambda x: x["dataset_item_id"]
        )
    }

    return len(matched_relation_markup), deleted_relation_markup


async def delete_annotation(
    db, markup_id: ObjectId, username: str, apply_all: bool = False
):
    markup = await find_one_markup(db=db, markup_id=markup_id, username=username)
    # print("MARKUP\n", markup)

    if not markup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Markup not found"
        )

    ontology_item = await get_ontology_item(
        db=db,
        project_id=markup["project_id"],
        classification=markup["classification"],
        ontology_item_id=markup["ontology_item_id"],
    )

    # print("ontology_item", ontology_item)

    if markup["classification"] == Classifications.entity.value:
        if apply_all:
            (
                count,
                deleted_entity_markup,
                deleted_relation_markup,
            ) = await delete_many_entity_annotations(
                db=db, markup_id=markup_id, username=username
            )

            return {
                "count": count,
                "label_name": ontology_item.fullname,
                "apply_all": apply_all,
                "annotation_type": "entity",
                "entity_ids": [str(_id) for _id in deleted_entity_markup],
                "relation_ids": [str(_id) for _id in deleted_relation_markup],
            }
        # OutMarkupDelete(
        #         count=count,
        #         label_name=ontology_item.fullname,
        #         entities=deleted_entity_markup,
        #         relations=deleted_relation_markup,
        #         annotation_type="entity",
        #         apply_all=apply_all,
        #     )

        else:
            deleted_relation_ids = await delete_single_entity_annotation(
                db=db, markup_id=markup_id, username=username
            )

            return {
                "count": 1,
                "entity_ids": [str(markup_id)],
                "relation_ids": [str(_id) for _id in deleted_relation_ids],
                "apply_all": apply_all,
                "annotation_type": "entity",
            }

            # return OutMarkupDelete(
            #     count=1,
            #     label_name=ontology_item.fullname,
            #     entities={str(markup["dataset_item_id"]): [str(markup_id)]},
            #     annotation_type="entity",
            #     apply_all=apply_all,
            #     relations={
            #         str(markup["dataset_item_id"]): [
            #             str(r) for r in deleted_relation_ids
            #         ]
            #     }
            #     if len(deleted_relation_ids) > 0
            #     else {},
            # )

    elif markup["classification"] == Classifications.relation.value:
        if apply_all:
            count, deleted_relation_markup = await delete_many_relations(
                db=db, markup_id=markup_id, username=username
            )

            return OutMarkupDelete(
                count=count,
                label_name=ontology_item.fullname,
                relations=deleted_relation_markup,
                annotation_type="relation",
                apply_all=apply_all,
            )

        else:
            await delete_single_relation_annotation(
                db=db, markup_id=markup_id, username=username
            )

            return {
                "count": 1,
                "label_name": ontology_item.fullname,
                "relation_ids": [str(markup_id)],
                "annotation_type": "relation",
                "apply_all": apply_all,
            }

            # return OutMarkupDelete(
            #     count=1,
            #     label_name=ontology_item.fullname,
            #     relations={str(markup["dataset_item_id"]): [str(markup_id)]},
            #     annotation_type="relation",
            #     apply_all=apply_all,
            # )

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Markup classification not found",
        )
