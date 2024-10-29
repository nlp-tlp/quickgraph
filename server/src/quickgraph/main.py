"""Entry point of the QuickGraph server."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ASCENDING

from .dashboard.router import router as dashboard_router
from .database import close_mongo_connection, connect_to_mongo
from .dataset.router import router as dataset_router
from .graph.router import router as graph_router
from .markup.router import router as markup_router
from .notifications.router import router as notifications_router
from .projects.router import router as projects_router
from .resources.router import router as resources_router
from .settings import get_settings, settings
from .social.router import router as social_router
from .user.router import router as user_router

# from .demo.router import router as demo_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# from middlewares import EventTrackingMiddleware

# Set up logging
# logger.add("./events.log", rotation="1 week")

description = """
    QuickGraph API powers the QuickGraph application.
"""

tags_metadata = [
    {
        "name": "users",
        "description": "Operations with users. The **login** and **signup** logic is also here.",
    },
]

origins = [
    "http://localhost:3000",
]


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore
    settings = get_settings()

    print(settings.mongodb.uri)

    connect_to_mongo(uri=settings.mongodb.uri)
    try:
        yield
    finally:
        # Cleanup: close database connection
        close_mongo_connection()
        logger.info("Database connection closed")


app = FastAPI(
    title="QuickGraph API",
    version="1.0.0",
    contact={"name": "Tyler Bikaun", "email": "tyler.bikaun@research.uwa.edu.au"},
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def create_indexes(db):
    """Creates an index if it doesn't exist otherwise will have no effect."""
    await db["markup"].create_index(
        [("dataset_item_id", ASCENDING)]
    )  # Used to speed up $lookup operations.


app.include_router(user_router)
app.include_router(social_router)
app.include_router(resources_router)
app.include_router(notifications_router)
app.include_router(markup_router)
app.include_router(dashboard_router)
app.include_router(graph_router)
app.include_router(dataset_router)
app.include_router(projects_router)


@app.get("/status")
async def status():
    """Checks server status"""
    return {"status": "I am healthy!"}


@app.get("/settings")
def read_settings():
    return settings
