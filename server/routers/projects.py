from typing import List, Union
import itertools
import datetime
import httpx
import json

from pydantic import BaseModel
from fastapi import APIRouter, Depends, status, HTTPException, Body
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from dependencies import (
    get_current_active_user,
    get_db,
    get_user_management_access_token,
)
from models.user import User
from models.project import (
    CreateProject,
    Project,
    Tasks,
    ProjectWithMetrics,
    SaveDatasetItems,
    Annotator,
    AnnotatorRoles,
    AnnotatorStates,
    Summary,
    ProjectDownload,
    ProjectDataset,
    ProjectDatasetItem,
    ProjectSocial,
)
from models.markup import Entity, Relation
from examples import get_examples
import services.projects as project_services
import services.notifications as notification_services
from motor.motor_asyncio import AsyncIOMotorDatabase
from settings import settings

router = APIRouter(prefix="/project", tags=["Project"])


@router.post("/", response_description="Create project", response_model=Project)
async def create_new_project(
    project: CreateProject,
    # = Body(
    #     examples=get_examples("create_project"),
    # ),
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Creates new project including optional preprocessing and preannotation.

    TODO: Adapt for datasets that are preannotated and/or have external ids.
    """

    try:
        return await project_services.create_project(
            db=db, username=current_user.username, project=project
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create project",
        )


@router.get(
    "/",
    response_description="List all projects",
    response_model=List[ProjectWithMetrics],
)
async def list_projects(
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Lists projects for user if they are PM or are an active (accepted) annotator"""

    try:
        return await project_services.find_many_projects(
            db=db, username=current_user.username
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve projects",
        )


# @router.patch(
#     "/{project_id}", response_description="Update project", response_model=Project
# )
# async def update_project(
#     project_id: str,
#     field: str,
#     value: str,
#     current_user: User = Depends(get_current_active_user),
#     db: AsyncIOMotorDatabase = Depends(get_db),
# ):
#     """Updates project after verifying the user is the project manager.

#     TODO: extend to allow multiple key-value pairs for update.
#     """

#     response = await db["projects"].update_one(
#         {"_id": ObjectId(project_id), "created_by": current_user.username},
#         {"$set": {field: value}},
#     )

#     if response.matched_count == 0:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
#         )
#     updated_project = await db["projects"].find_one({"_id": ObjectId(project_id)})
#     return updated_project


class Settings(BaseModel):
    disable_propagation: bool
    disable_discussion: bool
    annotators_per_item: int


class ProjectUpdateBody(BaseModel):
    name: str
    description: str
    settings: Settings


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


@router.patch(
    "/{project_id}", response_description="Update project", response_model=Project
)
async def update_project(
    project_id: str,
    body: ProjectUpdateBody,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Updates project after verifying the user is the project manager."""
    print("UPDATE_PROJECT")
    try:
        # Convert body into flat objet with dot notation for $set mongo operation
        # ref: https://www.mongodb.com/docs/manual/reference/operator/update/set/#set-fields-in-embedded-documents

        body = flatten_dict(
            jsonable_encoder(body)
        )  # Convert from pydantic model to json/dict obj
        print("body", body)

        response = await db["projects"].update_one(
            {"_id": ObjectId(project_id), "created_by": current_user.username},
            {"$set": {**body, "updated_at": datetime.datetime.utcnow()}},
            upsert=True,
        )

        if response.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )
        updated_project = await db["projects"].find_one({"_id": ObjectId(project_id)})
        return updated_project
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.patch("/{project_id}/guidelines", response_model=Project)
async def update_project_guidelines(
    project_id: str,
    body: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Updates project guidelines verifying the user is the project manager."""
    print("UPDATE_PROJECT")
    try:
        response = await db["projects"].update_one(
            {"_id": ObjectId(project_id), "created_by": current_user.username},
            {
                "$set": {
                    "guidelines": {
                        "content": body["content"],
                        "updated_at": datetime.datetime.utcnow(),
                    },
                    "updated_at": datetime.datetime.utcnow(),
                }
            },
            upsert=True,
        )

        print("response", response)

        if response.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )
        updated_project = await db["projects"].find_one({"_id": ObjectId(project_id)})

        print("updated_project", updated_project)

        return updated_project
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.get("/summary", response_model=Summary, response_model_exclude_none=True)
async def get_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Creates a summary of all projects for the "home" page of QuickGraph for a given user"""

    # Must be before "/{project_id}" otherwise will not match.

    username = current_user.username

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

    print(f"summary results {len(results)}")
    # print(f"summary results {results}")

    if len(results) == 0:
        return Summary.parse_obj(
            {
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

    # print('results["activity"]', results["activity"])

    return Summary.parse_obj(
        {
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


@router.patch("/{project_id}/annotators/assignment")
async def update_annotator_assignments(
    project_id: str,
    body: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Updates the scope/assignment of documents for a given annotator.


    Parameters
    ----------
    project_id : str
        The UUID of the project
    body : dict
        {"dataset_item_ids": [str], "username": str}
    current_user : User
        The current user making the request
    db : AsyncIOMotorDatabase
        Asyncronous database instance

    Returns
    -------
    ...

    Notes
    -----
    - Only the project manager can perform this operation.
    - If the project is using an 'annotated' dataset, then the first assignment for invited annotators
    will assign the preannotations in accordance with the projects "suggested_preannotations" setting.
    - Invited annotators will, by default, have nothing in their scope.

    TODO
    ----
    - Refactor this code as it violates DRY with "/services/projects/assign_bp_markup"

    """

    try:
        dataset_item_ids = [ObjectId(di) for di in body["dataset_item_ids"]]
        # Dataset item ids are those that should be set to "true" all others, false.

        project_id = ObjectId(project_id)
        project = await db["projects"].find_one(
            {"_id": project_id},
            {"annotators": 1, "settings": 1, "dataset_id": 1, "tasks": 1},
        )

        annotator_scope = [
            a for a in project["annotators"] if a["username"] == body["username"]
        ][0]["scope"]

        annotator_scope_dataset_item_ids = [
            item["dataset_item_id"] for item in annotator_scope
        ]  # This includes items of any visibility.

        # Create a set of existing dataset_item_ids in annotator_scope
        existing_dataset_item_ids = set(annotator_scope_dataset_item_ids)

        # "out_of_scope" dataset item ids are those that are not in the "scope" array. These will be assigned markup (if applicable).
        out_of_scope_dataset_item_ids = set()

        # Loop through the new dataset_item_ids and add any new ones to the existing set
        for dataset_item_id in dataset_item_ids:
            if dataset_item_id not in existing_dataset_item_ids:
                annotator_scope.append(
                    {"dataset_item_id": ObjectId(dataset_item_id), "visible": True}
                )
                existing_dataset_item_ids.add(dataset_item_id)
                out_of_scope_dataset_item_ids.add(dataset_item_id)

        print(f'"out_of_scope_dataset_item_ids": {out_of_scope_dataset_item_ids}')

        # Update the visibility of existing items
        annotator_scope_updated = [
            {**item, "visible": item["dataset_item_id"] in dataset_item_ids}
            for item in annotator_scope
        ]

        # Update project
        result = await db["projects"].update_one(
            {
                "_id": project_id,
                "created_by": current_user.username,
                "annotators.username": body["username"],
            },
            {"$set": {"annotators.$[annotator].scope": annotator_scope_updated}},
            array_filters=[{"annotator.username": body["username"]}],
            upsert=True,
        )

        if len(out_of_scope_dataset_item_ids) > 0:
            # Assign preannotations (if applicable)
            dataset = await db["datasets"].find_one({"_id": project["dataset_id"]})

            # Check if project dataset is "annotated"
            if dataset["is_annotated"]:
                # Get dataset items that are "out of scope"
                oos_dataset_items = (
                    await db["data"]
                    .find(
                        {
                            "project_id": project_id,
                            "_id": {"$in": list(out_of_scope_dataset_item_ids)},
                        }
                    )
                    .to_list(None)
                )

                print(f"Found {len(oos_dataset_items)} out of scope dataset items")

                # Create mapping between blueprint and project dataset item ids
                dataset_item_id_map_bp2project = {
                    di["blueprint_dataset_item_id"]: di["_id"]
                    for di in oos_dataset_items
                }

                print(
                    f'"dataset_item_id_map_bp2project": {dataset_item_id_map_bp2project}'
                )

                # Get blueprint "_id" of dataset items - these are used to find blueprint markup
                oos_bp_dataset_item_ids = [
                    di["blueprint_dataset_item_id"] for di in oos_dataset_items
                ]

                print(f'"oos_bp_dataset_item_ids": {oos_bp_dataset_item_ids}')

                bp_markup = (
                    await db["markup"]
                    .find(
                        {
                            "dataset_item_id": {
                                "$in": oos_bp_dataset_item_ids,
                            },
                            "is_blueprint": True,
                        }
                    )
                    .to_list(None)
                )

                print(
                    f"Found {len(bp_markup)} blueprint markups that will be associated with this annotator"
                )

                # Assign markups to user for all newly assigned scope items
                # This object holds a mapping between the original bp markup and the created markup; specifically so relation markup can be connected properly.
                bp_entity_markup_id_map = {}

                async def _copy_bp_markup(classification: str, markup):
                    try:
                        copy_markup = dict(markup)
                        copy_markup.pop("_id")

                        # Modify the markup
                        copy_markup["is_blueprint"] = False
                        copy_markup["dataset_item_id"] = dataset_item_id_map_bp2project[
                            copy_markup["dataset_item_id"]
                        ]
                        copy_markup["project_id"] = project_id
                        copy_markup["created_by"] = body["username"]
                        copy_markup["suggested"] = project["settings"][
                            "suggested_preannotations"
                        ]

                        if classification == "relation":
                            copy_markup["source_id"] = bp_entity_markup_id_map[
                                copy_markup["source_id"]
                            ]
                            copy_markup["target_id"] = bp_entity_markup_id_map[
                                copy_markup["target_id"]
                            ]

                        # Insert the modified markup into the database
                        new_markup = await db["markup"].insert_one({**copy_markup})
                        return new_markup.inserted_id
                    except Exception as e:
                        print(f"Failed to copy bp markup: {e}")

                # Process entity markup first
                print("Copying entity markup(s)")
                for markup in [m for m in bp_markup if m["classification"] == "entity"]:
                    old_markup_id = markup["_id"]  # This is the blueprints _id
                    new_markup_id = await _copy_bp_markup(
                        classification="entity", markup=markup
                    )
                    bp_entity_markup_id_map[old_markup_id] = new_markup_id

                print("bp_entity_markup_id_map", bp_entity_markup_id_map)

                # Process relation markup if project requests it
                if project["tasks"]["relation"]:
                    print("Copying relation markup(s)")
                    for markup in [
                        m for m in bp_markup if m["classification"] == "relation"
                    ]:
                        await _copy_bp_markup(classification="relation", markup=markup)

                # Output the completion of the addition of annotated data markup copies
                print("Annotated data markup copies have been added.")

        return JSONResponse(
            status_code=200, content={"detail": {"update_count": result.modified_count}}
        )
    except Exception as e:
        print(e)


@router.get("/{project_id}/annotators")
async def get_project_annotators(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    pipeline = [
        {"$match": {"_id": ObjectId(project_id)}},
        {"$project": {"annotators": 1, "dataset_id": 1}},
        {
            "$addFields": {
                "annotators": {
                    "$map": {
                        "input": "$annotators",
                        "in": {
                            "$mergeObjects": [
                                "$$this",
                                {
                                    "scope_size": {
                                        "$size": {
                                            "$filter": {
                                                "input": "$$this.scope",
                                                "cond": {
                                                    "$eq": ["$$this.visible", True]
                                                },
                                            }
                                        }
                                    }
                                },
                            ]
                        },
                    }
                }
            }
        },
        {
            "$lookup": {
                "from": "data",
                "localField": "dataset_id",
                "foreignField": "dataset_id",
                "as": "items",
            }
        },
        {
            "$project": {
                "items.dataset_id": 0,
                "items.tokens": 0,
                "items.is_blueprint": 0,
                "items.original": 0,
                "items.external_id": 0,
                "items.extra_fields": 0,
                "items.project_id": 0,
                "items.created_by": 0,
                "items.blueprint_dataset_item_id": 0,
                "dataset_id": 0,
            }
        },
    ]

    try:
        result = await db["projects"].aggregate(pipeline).to_list(None)
    except Exception as e:
        print(e)

    result = result[0]
    # print("result", result)

    return {
        "annotators": [
            {
                **a,
                "scope": [
                    str(di["dataset_item_id"]) for di in a["scope"] if di["visible"]
                ],
            }
            for a in result["annotators"]
        ],
        "dataset_items": [{**di, "_id": str(di["_id"])} for di in result["items"]],
    }


@router.get("/{project_id}", response_description="Get project", response_model=Project)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Gets a project after verifying the user is the project manager or an enabled, active, project annotator."""

    return await project_services.find_one_project(
        db, project_id=ObjectId(project_id), username=current_user.username
    )

    # if project:
    #     return project
    # raise HTTPException(
    #     status_code=status.HTTP_404_NOT_FOUND,
    #     detail="Project not found - you may not be the project manager.",
    # )


@router.delete(
    "/{project_id}", response_description="Delete a single project including markups"
)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Cascade deletes project after verifying the user is the project manager. The cascade delete includes associated dataset items and markup. Project deletion will result in all users losing access to the project."""
    try:
        return await project_services.delete_one_project(
            db=db, project_id=ObjectId(project_id), username=current_user.username
        )
    except:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete project",
        )


@router.get("/progress/{project_id}")
async def get_project_progress(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await project_services.get_project_progress(
        db=db, project_id=ObjectId(project_id), username=current_user.username
    )


@router.patch("/save/")
async def save_project_dataset_items(
    body: SaveDatasetItems,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Save one or many dataset items associated with a project"""
    try:
        return await project_services.save_many_dataset_items(
            db=db,
            project_id=ObjectId(body.project_id),
            dataset_item_ids=[ObjectId(di) for di in body.dataset_item_ids],
            username=current_user.username,
        )
    except Exception as e:
        print("error saving dataset items", e)


@router.patch("/resource/{project_id}")
async def update_project_resource(db: AsyncIOMotorDatabase = Depends(get_db)):
    # `/ontology/:projectId`
    pass


class UserInviteBody(BaseModel):
    usernames: list
    distribution_method: str = "all"


async def validate_user_exists(username: str, mgmt_access_token: str):
    """Validates whether a given username is able to be invited to a given project."""

    url = f"https://{settings.AUTH0_DOMAIN}/api/v2/users"

    params = {
        "page": 0,
        "include_fields": True,
        "fields": "username",
        "q": f'username: "{username}"',
    }
    headers = {
        "Authorization": f"Bearer {mgmt_access_token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)

    user_exists = len(response.json()) == 1

    return user_exists


@router.post("/user/validation")
async def validate_users(
    usernames: List[str],
    mgmt_access_token=Depends(get_user_management_access_token),
):
    """Validate a set of users - this is used for inviting users at project creation time."""

    # Check annotators exist and filter those that are invalid (don't exist or already on project/invited)
    return [
        username
        for username in usernames
        if await validate_user_exists(
            username=username, mgmt_access_token=mgmt_access_token
        )
    ]


@router.post("/user/invite/{project_id}")
async def invite_users(
    project_id: str,
    body: UserInviteBody,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    mgmt_access_token=Depends(get_user_management_access_token),
):
    """Invite one or more users to a project after checking existence.

    TODO: add document distribution functionality.
    """

    print("body", body)
    project_id = ObjectId(project_id)
    project = await db["projects"].find_one({"_id": project_id})

    if project == None:
        raise JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # Verify user is the PM of the project
    if project["created_by"] != current_user.username:
        raise JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized to invite users to this project",
        )

    # Check annotators exist and filter those that are invalid (don't exist or already on project/invited but not accepted)
    valid_annotators = [
        username
        for username in body.usernames
        if await validate_user_exists(
            username=username, mgmt_access_token=mgmt_access_token
        )
        and username not in [a["username"] for a in project["annotators"]]
    ]
    print("valid_annotators", valid_annotators)

    if len(valid_annotators) == 0:
        return JSONResponse(
            status_code=200,
            content={"valid": [], "invalid": body.usernames},
        )

    # Create notifications
    notifications = await notification_services.create_many_project_invitations(
        db=db,
        project_id=project_id,
        recipients=valid_annotators,
        username=current_user.username,
    )

    # print("notifications", notifications)

    # Fetch dataset item ids to associate to users
    # dataset_item_ids = (
    #     await db["data"]
    #     .find({"dataset_id": project["dataset_id"]}, {"_id": 1})
    #     .to_list(None)
    # )

    # print("dataset_item_ids", dataset_item_ids)

    # Add users to project
    rich_annotators = [
        Annotator(
            username=username,
            role=AnnotatorRoles.annotator,
            state=AnnotatorStates.invited,
            scope=[],  # Scope is assigned manually by PM -  [di["_id"] for di in dataset_item_ids
        ).dict()
        for username in valid_annotators
    ]

    # print("rich_annotators", rich_annotators)

    await db["projects"].update_one(
        {"_id": project_id}, {"$push": {"annotators": {"$each": rich_annotators}}}
    )

    # TODO: assign preannotation markup to invited annotators...
    # - Check if project blue print is annotated.
    # project_bp_dataset_id = project["blueprint_dataset_id"]
    # bp_dataset = await db["datasets"].find_one({"_id": project_bp_dataset_id})
    # print("bp_dataset", bp_dataset)

    # return await project_services.invite_single_project_annotator(db=db)

    # Return updated project with new annotators on it. The UI can determine which annotators were not added and render this to the user.
    # return annotators

    updated_project = await db["projects"].find_one(
        {"_id": project_id}, {"annotators": 1}
    )

    # print('updated_project["annotators"]', updated_project["annotators"])

    return {
        "valid": [
            {
                "username": a["username"],
                "state": a["state"],
                "role": a["role"],
                "scope_size": len(a["scope"]),
            }
            for a in updated_project["annotators"]
        ],
        "invalid": set(body.usernames) - set(valid_annotators),
    }


@router.delete("/user/")
async def delete_user(
    project_id: str,
    username: str,
    remove_annotations: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Deletes a user from a project unless its the project manager."""
    # TODO: migrate `/user/management/remove` to project scope

    print(project_id, username, remove_annotations)

    project_id = ObjectId(project_id)

    project = await db["projects"].find_one({"_id": project_id})

    # If data items is set to require all annotators, then this must be decremented if an annotator is removed.
    decrementMinAnnotators = (
        len([a for a in project["annotators"] if a["state"] == "accepted"])
        == project["settings"]["annotators_per_item"]
    )

    if not project:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": "Project not found"},
        )

    if username == project["created_by"]:
        return JSONResponse(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            content={"detail": "Cannot remove project manager from project"},
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

    print("result.modified_count", result.modified_count)

    return "hello world"


@router.get("/download/{project_id}")
async def download_project(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Creates a payload for entire project download.
    """

    # TODO: add dependency so that only accepted users can hit this route.

    project_id = ObjectId(project_id)

    # Project
    project = await db["projects"].find_one(
        {"_id": project_id, "created_by": current_user.username}
    )

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

    try:
        output = ProjectDownload(
            project=project,
            dataset=ProjectDataset(**dataset),
            dataset_items=[ProjectDatasetItem(**i) for i in dataset_items],
            markup=[
                Entity(**i) if i["classification"] == "entity" else Relation(**i)
                for i in markup
            ],
            social=[ProjectSocial(**i) for i in social],
        )
    except Exception as e:
        print(f"Exception: {e}")

    return output


@router.get("/suggested-entities/{project_id}/{surface_form}")
async def find_many_suggested_entities(
    project_id: str,
    surface_form: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """ """

    return await project_services.get_suggested_entities(
        db=db,
        project_id=ObjectId(project_id),
        surface_form=surface_form,
        username=current_user.username,
    )
