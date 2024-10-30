"""Resources router."""

import logging
from typing import List, Union

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..dependencies import get_db, get_user
from ..users.schemas import UserDocumentModel
from .schemas import (
    AggregateResourcesModel,
    CreateResourceModel,
    OntologyItem,
    ResourceModel,
    ResourceModelWithReadStatus,
    UpdateResourceModel,
)
from .services import (
    aggregate_system_and_user_resources,
    create_one_resource,
    delete_one_resource,
    find_many_resources,
    find_one_resource,
    update_one_resource,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/resources",
    tags=["Resources"],
)


@router.get(
    "",
    response_description="List all resources",
    response_model=Union[List[ResourceModel], AggregateResourcesModel],
)
async def list_resources_endpoint(
    aggregate: bool = False,
    include_system: bool = False,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Lists resources assigned to a user with optional system resources.

    TODO
    ----
    - Fix issue with response model; seems to fail validation
      unexpectedly when returning aggergate: false, include_system: false
    """
    if include_system:
        output = await aggregate_system_and_user_resources(
            db=db, username=user.username
        )

        return JSONResponse(status_code=status.HTTP_200_OK, content=output)

    resources = await find_many_resources(
        db=db, username=user.username, aggregate=aggregate
    )

    logger.info(f"resources found: {len(resources)}")

    return resources


@router.get(
    "/{resource_id}",
    response_description="Get existing resource",
    # response_model=ResourceModelWithReadStatus,
)
async def find_resource_endpoint(
    resource_id: str,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    resource, read_only = await find_one_resource(
        db, resource_id=ObjectId(resource_id), username=user.username
    )
    if resource:
        return ResourceModelWithReadStatus(**resource, read_only=read_only)
    raise HTTPException(status_code=404, detail="Resource not found")


@router.post(
    "",
    response_description="Add a resource",
    response_model=ResourceModel,
)
async def create_resource_endpoint(
    resource: CreateResourceModel,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a single resource."""
    return await create_one_resource(db=db, resource=resource, username=user.username)


@router.patch(
    "", response_description="Update a resource", response_model=List[OntologyItem]
)
async def update_resource_endpoint(
    resource: UpdateResourceModel,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update a single resource.

    NOTES
    ----
    - This route currently is limited to "ontology" resources.
    """
    if resource.classification != "ontology":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Updating this resource type is currently not supported",
        )
    updated_resource = await update_one_resource(
        db=db, resource=resource, username=user.username
    )
    if updated_resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found"
        )
    return updated_resource


@router.delete("/{resource_id}")
async def delete_resource_endpoint(
    resource_id: str,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    response = await delete_one_resource(
        db=db, resource_id=ObjectId(resource_id), username=user.username
    )

    if response.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found"
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK, content={"detail": "Deleted resource"}
    )
