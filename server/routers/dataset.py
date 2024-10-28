from typing import Any, Dict, List, Union

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

import services.dataset as dataset_services
from dependencies import get_current_active_user, get_db
from models.dataset import (BaseItem, CreateDataset, CreateDatasetBody,
                            CreateDataType, Dataset, DatasetFilters,
                            DatasetItem, EnrichedItem, FilteredDataset,
                            FlagFilter, Preprocessing, QualityFilter,
                            RelationsFilter, RichBlueprintDataset,
                            RichProjectDataset, SaveStateFilter)
from models.user import User

router = APIRouter(prefix="/dataset", tags=["Dataset"])


@router.get(
    "/",
    response_description="List datasets",
    # response_model=Union[List[Dataset], list],
    # response_model_exclude_none=True,
)
async def list_datasets(
    include_dataset_size: bool = False,
    include_system: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        datasets = await dataset_services.list_datasets(
            db=db,
            username=current_user.username,
            include_dataset_size=include_dataset_size,
            include_system=include_system,
        )
    except Exception as e:
        print(e)

    # TODO: investigate why `id` isnt being serialised out, `_id` is.

    if len(datasets) == 0:
        return []

    return datasets


@router.get(
    "/{dataset_id}",
    response_description="Get one dataset",
    # response_model=Union[RichBlueprintDataset, RichProjectDataset],
    # response_model_exclude_none=True,
)
async def get_dataset(
    dataset_id: str,
    include_dataset_size: bool = False,
    include_projects: bool = False,
    include_dataset_items: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Finds a single dataset provided its ID. Returns 404 if dataset is deleted or not found."""

    return await dataset_services.find_one_dataset(
        db=db,
        dataset_id=ObjectId(dataset_id),
        username=current_user.username,
        include_dataset_size=include_dataset_size,
        include_projects=include_projects,
        include_dataset_items=include_dataset_items,
    )


@router.post(
    "/",
    response_description="Create dataset",
    #   response_model=Dataset
)
async def create_dataset(
    dataset: CreateDatasetBody,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        return await dataset_services.create_dataset(
            db=db, dataset=dataset, username=current_user.username
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create dataset",
        )


# @router.patch("/{dataset_id}")
# async def update_dataset(datset_id: str):
#     pass


class DeleteDatasetItemsBody(BaseModel):
    dataset_id: str
    dataset_item_ids: List[str]


@router.post("/delete-items")
async def delete_many_dataset_items(
    body: DeleteDatasetItemsBody,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Deletes many item ids associated with a dataset.

    This function permanently deletes dataset items from a dataset. It also removes the items from the scope of annotators if the dataset is a "project dataset".

    TODO
        - Update with soft delete logic

    Notes
        - This route must come before `/dataset/{dataset_id}` otherwise it won't be matched.
        - Handle case where not all items are succesfully deleted.
    """

    try:
        dataset_id = ObjectId(body.dataset_id)
        dataset_item_ids = [ObjectId(i) for i in body.dataset_item_ids]

        # assert current user is the creator of the dataset
        dataset = await db["datasets"].find_one(
            {"_id": dataset_id, "created_by": current_user.username}
        )

        if dataset:
            # Delete dataset items
            response = await db["data"].delete_many({"_id": {"$in": dataset_item_ids}})

            if response.deleted_count > 0:
                is_project_dataset = dataset["project_id"]
                if is_project_dataset:
                    # Remove assignments for annotators (if they exist)
                    await db["projects"].update_many(
                        {"_id": ObjectId(dataset["project_id"])},
                        {
                            "$pull": {
                                "annotators.$[].scope": {
                                    "dataset_item_id": {"$in": dataset_item_ids}
                                }
                            }
                        },
                    )

                return {"dataset_item_ids": body.dataset_item_ids}

        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Unable to delete dataset item(s)"},
        )

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete dataset item(s)",
        )


@router.delete("/{dataset_id}", response_description="Delete one dataset")
async def delete_dataset(
    dataset_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Deletes one dataset by setting its `is_deleted` attribute"""
    result = await dataset_services.delete_one_dataset(
        db=db, dataset_id=ObjectId(dataset_id), username=current_user.username
    )

    if result:
        return JSONResponse(
            status_code=status.HTTP_200_OK, content={"detail": "Deleted dataset"}
        )
    else:
        return JSONResponse(
            status_code=status.HTTP_200_OK, content={"detail": "Dataset not found"}
        )


@router.get("/filter/")  # , response_model=FilteredDataset)
async def filter_dataset(
    project_id: str,
    search_term: Union[None, str] = Query(default=None),
    saved: int = Query(default=SaveStateFilter.everything),
    quality: int = Query(default=QualityFilter.everything),
    relations: int = Query(default=RelationsFilter.everything),
    flag: int = Query(default=FlagFilter.everything),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=20),
    dataset_item_ids: Union[None, str] = Query(default=None),
    # filters: DatasetFilters,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """TODO: Add query parameter model depency."""

    # try:
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
    )

    try:
        return await dataset_services.filter_dataset(
            db=db,
            filters=filters,
            username=current_user.username,
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to filter dataset",
        )


# @router.patch("/item/{item_id}")
# async def update_dataset_item(item_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
#     # TODO: migrate from `/annotation/save`; make general - merge all updates into single endpoint.
#     pass


# @router.post("/item")
# async def add_one_dataset_item(
#     current_user: User = Depends(get_current_active_user),
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
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Add many items to an existing dataset.

    This function adds many items to an existing dataset. For "project datasets", items are not automatically added to project annotators - this requires project manager intervention.

    Parameters
    ----------

    Returns
    -------

    Notes
    -----
    - TODO: Handle uploading "annotated" dataset items

    """
    print("dataset_id:\t", dataset_id)
    print("dataset_items:\n", dataset_items)

    dataset_id = ObjectId(dataset_id)

    # Check dataset exists
    dataset = await db["datasets"].find_one({"_id": dataset_id})
    # print("dataset", dataset)

    # Check whether dataset is a project dataset e.g. "is_blueprint" is False and "project_id" is not None.
    is_project_dataset = (
        dataset["is_blueprint"] == False and dataset["project_id"] != None
    )
    print("is_project_dataset", is_project_dataset)

    if not dataset:
        return JSONResponse(
            content={"detail": "Dataset not found"},
            status_code=status.HTTP_204_NO_CONTENT,
        )

    if data_type == "text":
        # User uploading standard newline separated dataset items
        try:
            # The client will have the datasets preprocessing options preset or defaults will be sent through.

            print(f"Preprocessing: {preprocessing}")
            enriched_items = dataset_services.create_standard_dataset_items(
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
            print(f"Failed to new standard dataset items: {e}")
    if data_type == "json":
        # Annotated or rich dataset
        if is_annotated:
            try:
                inserted_di_ids = await dataset_services.create_annotated_dataset_items(
                    db,
                    dataset_items,
                    dataset,
                    dataset_id=dataset["_id"],
                    username=current_user.username,
                    project_id=dataset.get("project_id"),
                )

                new_dataset_items = (
                    await db["data"]
                    .find({"_id": {"$in": inserted_di_ids}})
                    .to_list(None)
                )

                return [DatasetItem(**di) for di in new_dataset_items]
            except Exception as e:
                print(f"Failed to insert annotated data items: {e}")
        else:
            # Rich "standard" dataset
            enriched_items = dataset_services.create_rich_dataset_items(
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
