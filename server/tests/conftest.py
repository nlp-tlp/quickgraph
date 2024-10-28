"""
Test configuration inc. shared fixtures
"""

import pytest_asyncio
import motor.motor_asyncio

from tests.settings import settings
from tests.utils import create_entity_project, create_relation_project

USERNAME = settings.TEST_USERNAME


@pytest_asyncio.fixture(scope="function")
async def db():
    """Create connection to test database and tear down by deleting all created collections"""
    print("Setup")
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    print("Teardown")
    for collection in await db.list_collection_names():
        await db[collection].drop()
        print(f"Dropped collection: {collection}")

    yield db


@pytest_asyncio.fixture()
async def entity_project(db):
    """Create entity project"""
    return await create_entity_project(db)


@pytest_asyncio.fixture()
async def relation_project(db):
    """Create entity/relation project"""
    return await create_relation_project(db)
