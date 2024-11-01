"""Markup router."""

import logging

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..dependencies import get_active_project_user, get_db, get_user
from ..project.schemas import CreateFlag, Flag, FlagState, OntologyItem, ProjectOntology
from ..users.schemas import UserDocumentModel
from ..utils.misc import flatten_hierarchical_ontology
from .schemas import (
    CreateMarkupApply,
    EntityMarkup,
    InMarkupApply,
    MarkupEditBody,
    OutMarkupAccept,
    OutMarkupApply,
    OutMarkupDelete,
)
from .services import accept_annotation, apply_annotation, delete_annotation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/markup", tags=["Markup"])


@router.post(
    "/",
    response_description="Apply markup to one or more data items",
    # response_model=OutMarkupApply,    # TODO: review
)
async def create_markup_endpoint(
    markup: CreateMarkupApply,
    apply_all: bool = False,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Apply markup to one or more data items."""
    annotations = await apply_annotation(
        db=db,
        markup=markup,
        apply_all=apply_all,
        username=user.username,
    )
    if annotations is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to apply markup",
        )
    return annotations.model_dump(by_alias=False)


@router.patch(
    "/{markup_id}",
    response_description="Accept one or more markup",
    response_model=OutMarkupAccept,
)
async def update_markup(
    markup_id: str,
    apply_all: bool = False,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    annotations = await accept_annotation(
        db=db,
        markup_id=ObjectId(markup_id),
        username=user.username,
        apply_all=apply_all,
    )
    logger.info(f"annotations: {annotations}")
    if annotations is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to accept markup",
        )
    return annotations


@router.delete(
    "/{markup_id}",
    response_description="Delete one or more markup",
    # response_model=OutMarkupDelete,   # TODO: Needs review for new front end
)
async def delete_markup(
    markup_id: str,
    apply_all: bool = False,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await delete_annotation(
        db=db,
        markup_id=ObjectId(markup_id),
        username=user.username,
        apply_all=apply_all,
    )


@router.patch("/edit/{markup_id}")
async def edit_existing_markup(
    markup_id: str,
    body: MarkupEditBody,
    current_user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Edit the label of an existing entity markup"""

    markup_id = ObjectId(markup_id)
    markup = await db.markup.find_one({"_id": markup_id})

    if markup is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Markup not found",
        )

    # Check that no markup with the same span and new label exists
    existing_markup = await db.markup.find_one(
        {
            "project_id": markup["project_id"],
            "dataset_item_id": markup["dataset_item_id"],
            "start": markup["start"],
            "end": markup["end"],
            "ontology_item_id": body.ontology_item_id,
            "created_by": current_user.username,
        }
    )
    if existing_markup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Markup already exists",
        )

    project = await db.projects.find_one(
        {"_id": markup["project_id"]}, {"entity_ontology_id": 1}
    )

    entity_ontology = await db.resources.find_one(
        {"_id": project["entity_ontology_id"]}
    )

    # Check `ontology_item_id` exists
    flat_ontology = flatten_hierarchical_ontology(
        [OntologyItem(**i) for i in entity_ontology["content"]]
    )

    ontology_item = [i for i in flat_ontology if i.id == body.ontology_item_id]

    if len(ontology_item) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ontology item not found",
        )

    result = await db["markup"].update_one(
        {"_id": markup_id}, {"$set": {"ontology_item_id": body.ontology_item_id}}
    )

    if result.modified_count == 1:
        ontology_item_details = ontology_item[0]
        # logger.info("ontology_item_details", ontology_item_details)

        updated_markup = {
            "annotation_type": "entity",
            "apply_all": False,
            "count": 1,
            "entities": [
                {
                    "id": str(markup_id),
                    "ontology_item_id": body.ontology_item_id,
                    "name": ontology_item_details.name,
                    "fullname": ontology_item_details.fullname,
                    "color": ontology_item_details.color,
                }
            ],
            "label_name": ontology_item_details.name,
        }
        return updated_markup
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unable to update markup",
    )


# Flags
@router.post("/flag/{dataset_item_id}")
async def create_one_flag(
    dataset_item_id: str,
    state: FlagState,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Creates a single flag against a project dataset item"""
    # TODO: update to give flag items an _id?
    dataset_item_id = ObjectId(dataset_item_id)
    dataset_item = await db.data.find_one({"_id": dataset_item_id})

    if dataset_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset item not found",
        )

    new_flag = Flag(state=state, created_by=user.username)

    # Update the document with the new flag item
    result = await db.data.update_one(
        {
            "_id": dataset_item_id,
            "flags": {
                "$not": {
                    "$elemMatch": {
                        "state": new_flag.state,
                        "created_by": new_flag.created_by,
                    }
                }
            },
        },
        {"$push": {"flags": new_flag.model_dump()}},
    )

    if result.modified_count > 0:
        # TODO: update this route to use response_model
        return new_flag.model_dump()
    else:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"details": "Flag already exists on this dataset item"},
        )


@router.delete("/flag/{dataset_item_id}")
async def delete_one_flag(
    dataset_item_id: str,
    state: FlagState,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Delete a single flag from a dataset item"""
    dataset_item_id = ObjectId(dataset_item_id)

    # Find the flag to delete
    result = await db.data.update_one(
        {
            "_id": dataset_item_id,
            "flags.state": state,
            "flags.created_by": user.username,
        },
        {
            "$pull": {
                "flags": {
                    "state": state,
                    "created_by": user.username,
                }
            }
        },
    )

    # Check if the update was successful
    if result.modified_count > 0:
        return "Flag item deleted from dataset item"
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flag item not found",
        )


@router.get("/insights/{project_id}")
async def get_annotation_insights(
    project_id: str,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Currently fetches counts of entity markup surface forms - will be extended in the future.

    TODO: refactor so the output of the aggregation pipeline is friendlier. Investigate doing ontology_item expansion in query.
    """

    pipeline = [
        {
            "$match": {
                "project_id": ObjectId(project_id),
                "created_by": user.username,
                "classification": "entity",
            }
        },
        {
            "$group": {
                "_id": {
                    "ontology_item_id": "$ontology_item_id",
                    "surface_form": "$surface_form",
                },
                "count": {"$sum": 1},
            }
        },
        {
            "$group": {
                "_id": "$_id.ontology_item_id",
                "surface_forms": {
                    "$push": {"surface_form": "$_id.surface_form", "count": "$count"}
                },
            }
        },
        {"$project": {"_id": 0, "ontology_item_id": "$_id", "surface_forms": 1}},
        {
            "$group": {
                "_id": None,
                "result": {
                    "$push": {
                        "k": {"$toString": "$ontology_item_id"},
                        "v": "$surface_forms",
                    }
                },
            }
        },
        {"$project": {"_id": 0, "result": {"$arrayToObject": "$result"}}},
        {"$unwind": "$result"},
        {"$sort": {"result.k": 1}},
        {"$group": {"_id": None, "result": {"$push": "$result"}}},
        {"$project": {"_id": 0, "result": "$result"}},
    ]

    result = await db["markup"].aggregate(pipeline).to_list(None)

    # Get ontology item details to make output human readable
    project = await db["projects"].find_one(
        {"_id": ObjectId(project_id)}, {"ontology": 1}
    )

    project = await db["projects"].find_one(
        {"_id": ObjectId(project_id)}, {"_id": 0, "ontology": 1}
    )
    ontology = ProjectOntology(**project["ontology"])

    flat_ontology = flatten_hierarchical_ontology(ontology=ontology.entity)

    ontology_meta_map = {
        i.id: {"color": i.color, "name": i.name, "fullname": i.fullname}
        for i in flat_ontology
    }

    destructured_result = result[0]["result"][0]

    output = []
    for key, value in destructured_result.items():
        output.append(
            {
                "ontology_item_id": key,
                "instances": value,
                "meta": ontology_meta_map[key],
            }
        )

    return output
