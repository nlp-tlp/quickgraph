"""Markup router."""

import pymongo
from bson import ObjectId
from fastapi import APIRouter, Body, Depends, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from ..dependencies import get_db, get_user
from ..examples import get_examples
from ..projects.schemas import (
    CreateFlag,
    Flag,
    FlagState,
    OntologyItem,
    ProjectOntology,
)
from ..users.schemas import UserDocumentModel
from ..utils.misc import flatten_hierarchical_ontology
from .schemas import (
    CreateMarkupApply,
    EntityMarkup,
    InMarkupApply,
    OutMarkupApply,
    OutMarkupDelete,
)
from .services import accept_annotation, apply_annotation, delete_annotation

router = APIRouter(prefix="/markup", tags=["Markup"])


@router.post(
    "/",
    response_description="Apply markup to one or more data items",
    # response_model=OutMarkupApply,    # TODO: review
)
async def create_markup(
    markup: CreateMarkupApply,
    # = Body(
    #     examples=get_examples(example_type="create_markup")
    # ),
    apply_all: bool = False,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        return await apply_annotation(
            db=db,
            markup=markup,
            apply_all=apply_all,
            username=user.username,
        )
    except Exception as e:
        print(e)


@router.patch(
    "/{markup_id}",
    response_description="Accept one or more markup",
    # response_model=OutMarkupApply,    # TODO: review suitability...
)
async def update_markup(
    markup_id: str,
    apply_all: bool = False,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        return await accept_annotation(
            db=db,
            markup_id=ObjectId(markup_id),
            username=user.username,
            apply_all=apply_all,
        )
    except Exception as e:
        print(e)


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


class MarkupEditBody(BaseModel):
    ontology_item_id: str = Field(
        description="The ID that will be assigned to the markup"
    )


@router.patch("/edit/{markup_id}")
async def edit_existing_markup(
    markup_id: str,
    body: MarkupEditBody,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Modifies the label of an existing entity markup"""
    print("markup_id", markup_id, "ontology_item_id", body.ontology_item_id)

    markup_id = ObjectId(markup_id)

    markup = await db["markup"].find_one({"_id": markup_id})

    if markup is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": "Markup not found"},
        )

    print("Markup found")

    # Check that no markup with the same span and new label exists
    existing_markup = await db["markup"].find_one(
        {
            "project_id": markup["project_id"],
            "dataset_item_id": markup["dataset_item_id"],
            "start": markup["start"],
            "end": markup["end"],
            "ontology_item_id": body.ontology_item_id,
            "created_by": user.username,
        }
    )
    print("existing_markup", existing_markup)

    if existing_markup:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "Markup already exists"},
        )

    project = await db["projects"].find_one(
        {"_id": markup["project_id"]}, {"ontology.entity": 1}
    )

    # Check `ontology_item_id` exists
    flat_ontology = flatten_hierarchical_ontology(
        [OntologyItem.parse_obj(i) for i in project["ontology"]["entity"]]
    )

    ontology_item = [i for i in flat_ontology if i.id == body.ontology_item_id]

    if len(ontology_item) == 0:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": "Ontology item not found"},
        )

    print("ontology item id is valid")

    try:
        result = await db["markup"].update_one(
            {"_id": markup_id}, {"$set": {"ontology_item_id": body.ontology_item_id}}
        )

        if result.modified_count == 1:
            ontology_item_details = ontology_item[0]
            # print("ontology_item_details", ontology_item_details)

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
        else:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Unable to update markup"},
            )

    except pymongo.errors.WriteError as e:
        print(f"Write Error: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Unable to update markup"},
        )
    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Unable to update markup"},
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

    try:
        print('Calling: "create_one_flag')
        dataset_item_id = ObjectId(dataset_item_id)
        dataset_item = await db["data"].find_one({"_id": dataset_item_id})

        if dataset_item is None:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Dataset item not found"},
            )

        new_flag = Flag(state=state, created_by=user.username)

        # Update the document with the new flag item
        result = await db["data"].update_one(
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
            {"$push": {"flags": new_flag.dict()}},
        )

        if result.modified_count > 0:
            # TODO: update this route to use response_model
            return new_flag.dict()
        else:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"details": "Flag already exists on this dataset item"},
            )
    except Exception as e:
        print(f"Error: {e}")


@router.delete("/flag/{dataset_item_id}")
async def delete_one_flag(
    dataset_item_id: str,
    state: FlagState,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Delete a single flag from a dataset item"""

    try:
        dataset_item_id = ObjectId(dataset_item_id)

        # Find the flag to delete
        result = await db["data"].update_one(
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
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Flag item or dataset item not found"},
            )

    except Exception as e:
        print(f"Error: {e}")


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

    try:
        result = await db["markup"].aggregate(pipeline).to_list(None)
        # print("result", result)
    except Exception as e:
        print(e)

    # Get ontology item details to make output human readable
    project = await db["projects"].find_one(
        {"_id": ObjectId(project_id)}, {"ontology": 1}
    )

    project = await db["projects"].find_one(
        {"_id": ObjectId(project_id)}, {"_id": 0, "ontology": 1}
    )
    ontology = ProjectOntology.parse_obj(project["ontology"])

    flat_ontology = flatten_hierarchical_ontology(ontology=ontology.entity)

    # print("flat_ontology", len(flat_ontology))

    ontology_meta_map = {
        i.id: {"color": i.color, "name": i.name, "fullname": i.fullname}
        for i in flat_ontology
    }

    destructured_result = result[0]["result"][0]  # This is not ideal... but whatever.

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
