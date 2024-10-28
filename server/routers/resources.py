"""Resources router."""

from typing import Any, List, Union

from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from dependencies import get_current_active_user, get_db
from models.resources import (AggregateResourcesModel, CreateResourceModel,
                              ResourceModel, ResourceModelWithReadStatus,
                              UpdateResourceModel)
from models.user import User
# from examples import get_examples
from services.resources import (aggregate_system_and_user_resources,
                                create_one_resource, delete_one_resource,
                                find_many_resources, find_one_resource,
                                update_one_resource)

router = APIRouter(
    prefix="/resources",
    tags=["Resources"],
)


@router.get(
    "/",
    response_description="List all resources",
    # response_model=Union[List, List[ResourceModel], AggregateResourcesModel],
)
async def list_resources(
    aggregate: bool = False,
    include_system: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Lists resources assigned to a user with optional system resources"""

    # TODO: Fix issue with response model; seems to fail validation unexpectedly when returning aggergate: false, include_system: false

    print("GET /resources/")
    if include_system:
        output = await aggregate_system_and_user_resources(
            db=db, username=current_user.username
        )

        return JSONResponse(status_code=status.HTTP_200_OK, content=output)

    resources = await find_many_resources(
        db=db, username=current_user.username, aggregate=aggregate
    )

    print("resources found", len(resources))

    return resources


@router.get(
    "/{resource_id}",
    response_description="Get existing resource",
    # response_model=ResourceModelWithReadStatus,
)
async def find_resource(
    resource_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    resource, read_only = await find_one_resource(
        db, resource_id=ObjectId(resource_id), username=current_user.username
    )
    if resource:
        return ResourceModelWithReadStatus(**resource, read_only=read_only)
    raise HTTPException(status_code=404, detail="Resource not found")


@router.post(
    "/",
    response_description="Add new resource",
    # response_model=ResourceModel,
)
async def create_resource(
    resource: CreateResourceModel,  # = Body(examples=get_examples("create_resource")),
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):

    # print("resource", resource)
    try:
        return await create_one_resource(
            db=db, resource=resource, username=current_user.username
        )
    except Exception as e:
        print(f"error: {e}")


@router.patch(
    "/",
    response_description="Update existing resource",
    #   response_model=ResourceModel
)
async def update_resource(
    resource: UpdateResourceModel,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Route to update a single resource

    This route currently is limited to "ontology" resources.
    """
    try:
        if resource.classification != "ontology":
            return JSONResponse(
                content={
                    "details": "Updating this resource type is currently not supported"
                },
                status_code=200,
            )

        # print("RESOURCE", resource)

        return await update_one_resource(
            db=db, resource=resource, username=current_user.username
        )

    except Exception as e:
        print(f"Failed to updated one resource: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update resource",
        )


@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        response = await delete_one_resource(
            db=db, resource_id=ObjectId(resource_id), username=current_user.username
        )

        if response.deleted_count == 0:
            return JSONResponse(
                status_code=status.HTTP_200_OK, content={"detail": "Resource not found"}
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK, content={"detail": "Deleted resource"}
        )
    except:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete resource",
        )
