"""Entry point of the QuickGraph server."""

import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING

from dependencies import get_current_active_user
from routers import (
    dashboard,
    dataset,
    demo,
    graph,
    markup,
    notifications,
    projects,
    resources,
    social,
    user,
)
from settings import settings
from utils import mock_authenticate_user

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


app.include_router(user.router)
app.include_router(dataset.router)
app.include_router(resources.router)
app.include_router(dashboard.router)
app.include_router(graph.router)
app.include_router(projects.router)
app.include_router(markup.router)
app.include_router(notifications.router)
app.include_router(demo.router)
app.include_router(social.router)


bypass_auth = os.environ.get("BYPASS_AUTH", False)
if bypass_auth:
    print(f"Bypassing auth - using username: {settings.EXAMPLE_USERNAME}")
    app.dependency_overrides[get_current_active_user] = mock_authenticate_user


@app.get("/status")
async def status():
    """Checks server status"""
    return {"status": "I am healthy!"}


if __name__ == "__main__":
    # TODO: review "workers" and deployment via gunicorn in production env - see: https://fastapi.tiangolo.com/deployment/server-workers/
    # Uvicorn doesn't allow multiple workers with "reload" = True
    # Note: gunicorn requires fcntl which is not windows based so need to run via wsl or docker.
    # uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=False, workers=4)
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT or 8000, reload=True)
