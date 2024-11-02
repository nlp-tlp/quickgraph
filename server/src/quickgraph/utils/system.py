"""System utilities."""

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING

from ..database import get_client
from .system_resources import datasets, resources
from ..settings import settings
from ..resources.services import initialize_ontology
from ..dataset.services import create_dataset


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    """Creates database indexes if they does not already exist otherwise will have no effect."""
    await db["markup"].create_index(
        [("dataset_item_id", ASCENDING)]
    )  # Used to speed up $lookup operations.


async def create_system_resources() -> None:
    """Creates system resources if they does not already exist otherwise will have no effect."""

    client = get_client()
    db = client[settings.mongodb.database_name]

    for resource in resources:
        resource_dict = resource.model_dump()
        resource_dict["created_by"] = settings.api.system_username
        content = resource_dict.get("content")
        content_dict = (
            {"content": initialize_ontology(content)}
            if resource.classification == "ontology"
            else {"content": content}
        )
        await db["resources"].update_one(
            {"name": resource.name},
            {"$setOnInsert": {**resource_dict, **content_dict}},
            upsert=True,
        )


async def create_system_datasets():
    """Prepopulates system with default/preset datasets"""

    client = get_client()
    db = client[settings.mongodb.database_name]

    for dataset in datasets:
        # Check existence of datasets before creating them to ensure UUID is preserved.
        existing_dataset = await db.datasets.find_one(
            {
                "name": dataset.name,
                "created_by": settings.api.system_username,
            }
        )
        if existing_dataset is None:
            await create_dataset(
                db=db, dataset=dataset, username=settings.api.system_username
            )
