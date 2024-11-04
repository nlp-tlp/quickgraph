"""Projects router."""

import datetime
import logging
from collections import defaultdict
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..dependencies import (
    get_active_project_user,
    get_db,
    get_user,
    valid_project_manager,
)
from ..users.schemas import UserDocumentModel
from .schemas import (
    CreateProject,
    Project,
    ProjectProgress,
    ProjectUpdateBody,
    ProjectWithMetrics,
    ProjectWithOntologies,
    SaveDatasetItemsBody,
    SaveResponse,
    Summary,
    UpdateGuidlines,
    UserInviteBody,
    UserInviteResponse,
)
from .services import (
    create_project,
    delete_one_project,
    download_project,
    find_many_projects,
    find_one_project,
    flatten_dict,
    get_project_progress,
    get_suggested_entities,
    get_user_projects_summary,
    invite_users_to_project,
    remove_user_from_project,
    save_many_dataset_items,
)
from ..settings import settings

logger = logging.getLogger(__name__)


router = APIRouter(prefix=f"{settings.api.prefix}/project", tags=["Project"])


@router.post("", response_description="Create project", response_model=Project)
async def create_new_project_endpoint(
    project: CreateProject,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Creates new project including optional preprocessing and preannotation.

    TODO
    ----
    - Adapt for datasets that are preannotated and/or have external ids.
    """
    project = await create_project(db=db, username=user.username, project=project)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create project",
        )
    return project


@router.get(
    "",
    response_description="List all projects",
    response_model=List[ProjectWithMetrics],
)
async def list_projects_endpoint(
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Lists projects for user if they are PM or are an active (accepted) annotator"""
    projects = await find_many_projects(db=db, username=user.username)
    if projects is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve projects",
        )
    return projects


@router.patch("/save", response_model=SaveResponse)
async def save_project_dataset_items_endpoint(
    body: SaveDatasetItemsBody,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Save one or many dataset items associated with a project"""
    result = await save_many_dataset_items(
        db=db,
        dataset_item_ids=[ObjectId(di) for di in body.dataset_item_ids],
        username=user.username,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save dataset items",
        )
    return result


@router.patch(
    "/{project_id}", response_description="Update project", response_model=Project
)
async def update_project_endpoint(
    project_id: str,
    body: ProjectUpdateBody,
    user: UserDocumentModel = Depends(valid_project_manager),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update a project."""
    # Convert body into flat object with dot notation for $set mongo operation
    # ref: https://www.mongodb.com/docs/manual/reference/operator/update/set/#set-fields-in-embedded-documents

    # Convert from pydantic model to json/dict obj
    body = flatten_dict(jsonable_encoder(body))

    response = await db["projects"].update_one(
        {"_id": ObjectId(project_id), "created_by": user.username},
        {"$set": {**body, "updated_at": datetime.datetime.utcnow()}},
        upsert=True,
    )

    if response.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    updated_project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    return updated_project


@router.patch("/{project_id}/guidelines", response_model=Project)
async def update_project_guidelines_endpoint(
    project_id: str,
    body: UpdateGuidlines,
    user: UserDocumentModel = Depends(valid_project_manager),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update a project's annotation guidelines."""
    response = await db["projects"].update_one(
        {"_id": ObjectId(project_id), "created_by": user.username},
        {
            "$set": {
                "guidelines": {
                    "content": body.content,
                    "updated_at": datetime.datetime.utcnow(),
                },
                "updated_at": datetime.datetime.utcnow(),
            }
        },
        upsert=True,
    )
    if response.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    updated_project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    return updated_project


@router.get("/summary", response_model=Summary)
async def get_projects_summary_endpoint(
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get summary of user projects"""
    # Note: Endpoint must be before `/{project_id}`` otherwise will not match.
    return await get_user_projects_summary(db=db, username=user.username)


@router.patch("/{project_id}/annotators/assignment")
async def update_annotator_assignments_endpoint(
    project_id: str,
    body: dict,
    user: UserDocumentModel = Depends(valid_project_manager),
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
    user : User
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

        logger.info(f'"out_of_scope_dataset_item_ids": {out_of_scope_dataset_item_ids}')

        # Update the visibility of existing items
        annotator_scope_updated = [
            {**item, "visible": item["dataset_item_id"] in dataset_item_ids}
            for item in annotator_scope
        ]

        # Update project
        result = await db["projects"].update_one(
            {
                "_id": project_id,
                "created_by": user.username,
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

                logger.info(
                    f"Found {len(oos_dataset_items)} out of scope dataset items"
                )

                # Create mapping between blueprint and project dataset item ids
                dataset_item_id_map_bp2project = {
                    di["blueprint_dataset_item_id"]: di["_id"]
                    for di in oos_dataset_items
                }

                logger.info(
                    f'"dataset_item_id_map_bp2project": {dataset_item_id_map_bp2project}'
                )

                # Get blueprint "_id" of dataset items - these are used to find blueprint markup
                oos_bp_dataset_item_ids = [
                    di["blueprint_dataset_item_id"] for di in oos_dataset_items
                ]

                logger.info(f'"oos_bp_dataset_item_ids": {oos_bp_dataset_item_ids}')

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

                logger.info(
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
                        logger.info(f"Failed to copy bp markup: {e}")

                # Process entity markup first
                logger.info("Copying entity markup(s)")
                for markup in [m for m in bp_markup if m["classification"] == "entity"]:
                    old_markup_id = markup["_id"]  # This is the blueprints _id
                    new_markup_id = await _copy_bp_markup(
                        classification="entity", markup=markup
                    )
                    bp_entity_markup_id_map[old_markup_id] = new_markup_id

                logger.info("bp_entity_markup_id_map", bp_entity_markup_id_map)

                # Process relation markup if project requests it
                if project["tasks"]["relation"]:
                    logger.info("Copying relation markup(s)")
                    for markup in [
                        m for m in bp_markup if m["classification"] == "relation"
                    ]:
                        await _copy_bp_markup(classification="relation", markup=markup)

                # Output the completion of the addition of annotated data markup copies
                logger.info("Annotated data markup copies have been added.")

        return JSONResponse(
            status_code=200, content={"detail": {"update_count": result.modified_count}}
        )
    except Exception as e:
        logger.info(e)


@router.get("/{project_id}/annotators")
async def get_project_annotators_endpoint(
    project_id: str,
    user: UserDocumentModel = Depends(get_active_project_user),
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

    result = await db["projects"].aggregate(pipeline).to_list(None)
    result = result[0]

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


@router.get(
    "/{project_id}",
    response_description="Get project",
    response_model=ProjectWithOntologies,
)
async def get_project_endpoint(
    project_id: str,
    user: UserDocumentModel = Depends(get_active_project_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Find a project.

    Gets a project after verifying the user is the project manager or an enabled, active, project annotator.
    """
    project = await find_one_project(
        db, project_id=ObjectId(project_id), username=user.username
    )
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found - you may not be the project manager or the project may not exist.",
        )
    return project


@router.delete("/user")
async def remove_user_endpoint(
    project_id: str,
    username: str,
    remove_annotations: bool = True,
    user: UserDocumentModel = Depends(valid_project_manager),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Remove a user from a project."""
    return await remove_user_from_project(
        db=db,
        project_id=project_id,
        username=username,
        remove_annotations=remove_annotations,
    )


@router.delete(
    "/{project_id}", response_description="Delete a single project including markups"
)
async def delete_project_endpoint(
    project_id: str,
    user: UserDocumentModel = Depends(valid_project_manager),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Delete a project."""
    project_was_deleted = await delete_one_project(
        db=db, project_id=ObjectId(project_id), username=user.username
    )

    if not project_was_deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete project",
        )

    return {"detail": "Project deleted"}


@router.get("/progress/{project_id}", response_model=ProjectProgress)
async def get_project_progress_endpoint(
    project_id: str,
    user: UserDocumentModel = Depends(get_active_project_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get project progress for a given project for the current user."""
    progress = await get_project_progress(
        db=db, project_id=ObjectId(project_id), username=user.username
    )
    if progress is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to compute project progress",
        )
    return progress


@router.post("/user/invite/{project_id}", response_model=UserInviteResponse)
async def invite_users_endpoint(
    project_id: str,
    body: UserInviteBody,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: UserDocumentModel = Depends(valid_project_manager),
):
    """Invite users to a project."""
    return await invite_users_to_project(
        db=db, sender_username=user.username, project_id=ObjectId(project_id), body=body
    )


@router.get("/download/{project_id}")
async def download_project_endpoint(
    project_id: str,
    user: UserDocumentModel = Depends(valid_project_manager),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Creates a payload for entire project download."""
    return await download_project(db=db, project_id=ObjectId(project_id))


@router.get("/suggested-entities/{project_id}/{surface_form}")
async def find_many_suggested_entities_endpoint(
    project_id: str,
    surface_form: str,
    user: UserDocumentModel = Depends(get_active_project_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Finds suggested entities for a given project and surface form."""
    return await get_suggested_entities(
        db=db,
        project_id=ObjectId(project_id),
        surface_form=surface_form,
        username=user.username,
    )


@router.get("/{project_id}/clusters")
async def get_project_dataset_clusters_endpoint(
    project_id: str,
    current_user: UserDocumentModel = Depends(get_active_project_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get clusters for a projects dataset."""

    project = await db.projects.find_one({"_id": ObjectId(project_id)})

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    dataset_id = ObjectId(project["dataset_id"])

    items = await db.data.find({"dataset_id": ObjectId(dataset_id)}).to_list(None)

    clusters = defaultdict()
    for item in items:
        if item["cluster_id"] not in clusters:
            clusters[item["cluster_id"]] = item["cluster_keywords"]

    return sorted(
        [{"value": k, "keywords": v} for k, v in clusters.items()],
        key=lambda x: x["value"],
    )
