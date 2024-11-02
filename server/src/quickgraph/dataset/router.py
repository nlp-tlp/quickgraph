"""Dataset router."""

import logging
from collections import defaultdict
from typing import Any, Dict, List, Union

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..dependencies import (
    get_active_project_user,
    get_db,
    get_user,
    valid_dataset,
    valid_user_for_dataset,
)
from ..users.schemas import UserDocumentModel
from .schemas import (
    CreateDatasetBody,
    CreateDataType,
    Dataset,
    DatasetFilters,
    DatasetItem,
    DeleteDatasetItemsBody,
    DeleteDatasetItemsResponse,
    FilteredDataset,
    FlagFilter,
    Preprocessing,
    QualityFilter,
    RelationsFilter,
    RichBlueprintDataset,
    RichProjectDataset,
    SaveStateFilter,
)
from .services import (
    create_annotated_dataset_items,
    create_dataset,
    create_rich_dataset_items,
    create_standard_dataset_items,
    delete_dataset_items,
    delete_one_dataset,
    filter_dataset,
    find_one_dataset,
    list_datasets,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dataset", tags=["Dataset"])


@router.get(
    "",
    response_description="List datasets",
    response_model=List[Dataset],
)
async def list_datasets_endpoint(
    include_dataset_size: bool = False,
    include_system: bool = False,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    datasets = await list_datasets(
        db=db,
        username=user.username,
        include_dataset_size=include_dataset_size,
        include_system=include_system,
    )
    if len(datasets) == 0:
        return []
    return datasets


@router.get(
    "/{dataset_id}",
    response_description="Get a dataset",
    response_model=Union[RichBlueprintDataset, RichProjectDataset],
)
async def get_dataset_endpoint(
    dataset_id: str,
    include_dataset_size: bool = False,
    include_projects: bool = False,
    include_dataset_items: bool = False,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Find a single dataset."""
    dataset = await find_one_dataset(
        db=db,
        dataset_id=ObjectId(dataset_id),
        username=user.username,
        include_dataset_size=include_dataset_size,
        include_projects=include_projects,
        include_dataset_items=include_dataset_items,
    )
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found",
        )
    return dataset


@router.post("", response_description="Create dataset", response_model=Dataset)
async def create_dataset_endpoint(
    dataset: CreateDatasetBody,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    new_dataset = await create_dataset(db=db, dataset=dataset, username=user.username)
    if new_dataset is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create dataset",
        )
    return new_dataset


# @router.patch("/{dataset_id}")
# async def update_dataset(datset_id: str):
#     pass


@router.post("/delete-items")
async def delete_dataset_items_endpoint(
    body: DeleteDatasetItemsBody,
    user: UserDocumentModel = Depends(valid_user_for_dataset),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Deletes many dataset items."""
    result = await delete_dataset_items(db=db, username=user.username, body=body)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete dataset item(s)",
        )
    return DeleteDatasetItemsResponse(**result, dataset_id=body.dataset_id)


@router.delete("/{dataset_id}", response_description="Delete one dataset")
async def delete_dataset(
    dataset_id: str,
    user: UserDocumentModel = Depends(valid_user_for_dataset),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Deletes one dataset by setting its `is_deleted` attribute"""
    result = await delete_one_dataset(
        db=db, dataset_id=ObjectId(dataset_id), username=user.username
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset could not be deleted",
        )
    if result:
        return {"detail": "Deleted dataset"}


@router.get("/filter/", response_model=FilteredDataset)
async def filter_dataset_endpoint(
    project_id: str,
    search_term: Union[None, str] = Query(default=None),
    saved: int = Query(default=SaveStateFilter.everything),
    quality: int = Query(default=QualityFilter.everything),
    relations: int = Query(default=RelationsFilter.everything),
    flag: int = Query(default=FlagFilter.everything),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=20),
    dataset_item_ids: Union[None, str] = Query(default=None),
    cluster_id: int | None = Query(default=None, ge=-1),
    user: UserDocumentModel = Depends(get_active_project_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Filter dataset items."""
    filters = DatasetFilters(
        project_id=project_id,
        search_term=search_term,
        saved=saved,
        quality=quality,
        relations=relations,
        flag=flag,
        skip=skip,
        limit=limit,
        dataset_item_ids=dataset_item_ids,
        cluster_id=cluster_id,
    )
    data = await filter_dataset(
        db=db,
        filters=filters,
        username=user.username,
    )
    if data is None:
        return JSONResponse(
            status_code=status.HTTP_204_NO_CONTENT,
            content=FilteredDataset(),
        )
    return data


# @router.patch("/item/{item_id}")
# async def update_dataset_item(item_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
#     # TODO: migrate from `/annotation/save`; make general - merge all updates into single endpoint.
#     pass


# @router.post("/item")
# async def add_one_dataset_item(
#     user: User = Depends(get_user),
#     db: AsyncIOMotorDatabase = Depends(get_db),
# ):
#     """Adds a single dataset item to an existing dataset"""
#     # NOTE: New data items will be assigned to the PM only; the PM then needs to assign these to annotators (TODO)

#     is_blueprint = ''
#     project_id = ''

#     BaseItem(original='', is_blueprint='', project_id='')

#     dataset_services.add_one_dataset_item(
#         db=db,
#     )

#     pass


@router.post("/items")
async def add_many_dataset_items(
    dataset_id: str,
    dataset_items: Union[List[str], List[Dict[str, Any]]],  # TODO: add validation...
    data_type: CreateDataType,
    is_annotated: bool,
    preprocessing: Preprocessing,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    dataset: Dataset = Depends(valid_dataset),
):
    """Add many items to an existing dataset.

    This function adds many items to an existing dataset. For "project datasets", items are not automatically added to project annotators - this requires project manager intervention.

    Notes
    -----
    - TODO: Handle uploading "annotated" dataset items

    """
    dataset_id = ObjectId(dataset_id)

    # Check whether dataset is a project dataset e.g. "is_blueprint" is False and "project_id" is not None.
    is_project_dataset = (
        not dataset["is_blueprint"] and dataset["project_id"] is not None
    )
    logger.info(f"is_project_dataset: {is_project_dataset}")

    if data_type == "text":
        # User uploading standard newline separated dataset items
        try:
            # The client will have the datasets preprocessing options preset or defaults will be sent through.
            logger.info(f"Preprocessing: {preprocessing}")
            enriched_items = create_standard_dataset_items(
                dataset_items=dataset_items,
                preprocessing=preprocessing,
                is_blueprint=dataset["is_blueprint"],
                dataset_id=dataset["_id"],
                project_id=dataset.get("project_id"),
            )

            result = await db["data"].insert_many([ei.dict() for ei in enriched_items])

            new_dataset_items = (
                await db["data"]
                .find({"_id": {"$in": result.inserted_ids}})
                .to_list(None)
            )

            return [DatasetItem(**di) for di in new_dataset_items]
        except Exception as e:
            logger.error(f"Failed to new standard dataset items: {e}")
    if data_type == "json":
        # Annotated or rich dataset
        if is_annotated:
            try:
                inserted_di_ids = await create_annotated_dataset_items(
                    db,
                    dataset_items,
                    dataset,
                    dataset_id=dataset["_id"],
                    username=user.username,
                    project_id=dataset.get("project_id"),
                )

                new_dataset_items = (
                    await db["data"]
                    .find({"_id": {"$in": inserted_di_ids}})
                    .to_list(None)
                )

                return [DatasetItem(**di) for di in new_dataset_items]
            except Exception as e:
                logger.error(f"Failed to insert annotated data items: {e}")
        else:
            # Rich "standard" dataset
            enriched_items = create_rich_dataset_items(
                dataset_items=dataset_items,
                is_blueprint=dataset["is_blueprint"],
                dataset_id=dataset["_id"],
                project_id=dataset.get("project_id"),
            )
            result = await db["data"].insert_many([ei.dict() for ei in enriched_items])

            new_dataset_items = (
                await db["data"]
                .find({"_id": {"$in": result.inserted_ids}})
                .to_list(None)
            )

            return [DatasetItem(**di) for di in new_dataset_items]


# @router.delete("/item/{item_id}")
# async def delete_one_dataset_item(
#     item_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
# ):
#     # NOTE: Deleting a data item will remove all associated markup(s)
#     pass


# @router.patch("/item/{item_id}")
# async def update_one_datset_item(item_id: str):
#     # NOTE: Updating a data item must remove all associated markup; the logic to maintain links may be too hectic.
#     pass


@router.get("/{dataset_id}/clusters")
async def get_dataset_clusters_endpoint(
    dataset_id: str,
    user: UserDocumentModel = Depends(valid_user_for_dataset),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get clusters for a dataset."""
    items = await db.data.find({"dataset_id": ObjectId(dataset_id)}).to_list(None)

    clusters = defaultdict()
    for item in items:
        if item["cluster_id"] not in clusters:
            clusters[item["cluster_id"]] = item["cluster_keywords"]

    return sorted(
        [{"value": k, "keywords": v} for k, v in clusters.items()],
        key=lambda x: x["value"],
    )
