"""Server database utilities."""

import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorClientSession

logger = logging.getLogger(__name__)

client: Optional[AsyncIOMotorClient] = None
session: Optional[AsyncIOMotorClientSession] = None


def get_client() -> Optional[AsyncIOMotorClient]:
    return client


def connect_to_mongo(uri: str) -> None:
    logger.info(f"Connecting to MongoDB at {uri}")
    global client
    if client is None:
        client = AsyncIOMotorClient(uri)
        logger.info("Connected to MongoDB.")


def close_mongo_connection() -> None:
    global client
    if client:
        client.close()
        client = None  # ignore: type[assignment]
