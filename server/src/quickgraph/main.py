"""Entry point of the QuickGraph server."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING

from .dashboard.router import router as dashboard_router
from .dataset.router import router as dataset_router
from .graph.router import router as graph_router
from .markup.router import router as markup_router
from .notifications.router import router as notifications_router
from .projects.router import router as projects_router
from .resources.router import router as resources_router
from .settings import settings
from .social.router import router as social_router
from .user.router import router as user_router

# from quickgraph.dependencies import get_current_active_user


# from .demo.router import router as demo_router

# from utils import mock_authenticate_user


# from loguru import logger

# from middlewares import EventTrackingMiddleware

# Set up logging
# logger.add("./events.log", rotation="1 week")


origins = [
    "http://localhost:3000",
]

app = FastAPI(
    title="QuickGraph API",
    version="1.0.0",
    dependencies=[],
    # root_path='/api/v1' if settings.ENV != 'development' else ''
)


# print(f"Running in {settings.ENV} environment")
# if settings.ENV in ["production", "staging"]:
#     print(f"Using HTTPS redirect malware")
#     # Define the allowed hosts that should use HTTPS
#     app.add_middleware(
#         TrustedHostMiddleware,
#         allowed_hosts=["staging.quickgraph.tech", "quickgraph.tech"],
#         # forwarded_allow_ips=["*"],
#         # https_redirect_status_code=307,  # Use 307 Temporary Redirect for HTTPS redirect
#     )  # TODO: add hosts to .env ?
#     # Use HTTPSRedirectMiddleware to redirect HTTP traffic to HTTPS
#     app.add_middleware(
#         HTTPSRedirectMiddleware
#         # , https_redirect_status_code=307
#     )  # Use 307 Temporary Redirect for HTTPS redirect


# app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.middleware("http")(EventTrackingMiddleware())


# @app.on_event("startup")
# async def validate_db():
#     """Performs valdiation of database to ensure that collections exist"""
#     print("Validating database...")

#     get_db_wrapper = asynccontextmanager(get_db)

#     async with get_db_wrapper() as db:
#         for name in settings.MONGO_COLLECTION_NAMES:
#             print(name)
#             collection = db[name]
#             # _temp_doc = db[name].insert_one({"hello": "world"})
#             # db[name].delete_one({"_id": _temp_doc.inserted_id})


@asynccontextmanager
async def get_startup_db():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    try:
        yield db
    finally:
        client.close()


async def create_indexes(db):
    """Creates an index if it doesn't exist otherwise will have no effect."""
    await db["markup"].create_index(
        [("dataset_item_id", ASCENDING)]
    )  # Used to speed up $lookup operations.


@app.on_event("startup")
async def startup():
    print("Starting server:")
    async with get_startup_db() as db:
        print("\t- Creating indexes")
        await create_indexes(db)


app.include_router(user_router)
app.include_router(social_router)
app.include_router(resources_router)
app.include_router(notifications_router)
app.include_router(markup_router)
app.include_router(dashboard_router)
app.include_router(graph_router)
app.include_router(dataset_router)


@app.get("/status")
async def status():
    """Checks server status"""
    return {"status": "I am healthy!"}
