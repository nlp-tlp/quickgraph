"""Entry point of the QuickGraph server."""

import logging
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase

from .dashboard.router import router as dashboard_router
from .database import close_mongo_connection, connect_to_mongo
from .dataset.router import router as dataset_router
from .dependencies import get_db
from .graph.router import router as graph_router
from .markup.router import router as markup_router
from .notifications.router import router as notifications_router
from .project.router import router as project_router
from .resources.router import router as resources_router
from .settings import Settings, get_settings, settings
from .social.router import router as social_router
from .users.router import router as users_router
from .utils.system import (
    create_indexes,
    create_system_resources,
    create_system_datasets,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

description = """QuickGraph API powers the QuickGraph application."""

tags_metadata = [
    {
        "name": "users",
        "description": "Operations with users. The **login** and **signup** logic is also here.",
    },
]

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://client",
]


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore
    settings = get_settings()
    connect_to_mongo(uri=settings.mongodb.uri)

    # Create system resources
    await create_system_resources()

    # Create system datasets
    await create_system_datasets()

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


app.include_router(users_router)
app.include_router(social_router)
app.include_router(resources_router)
app.include_router(notifications_router)
app.include_router(markup_router)
app.include_router(dashboard_router)
app.include_router(graph_router)
app.include_router(dataset_router)
app.include_router(project_router)


@app.get("/status")
async def status_endpoint() -> Dict[str, str]:
    """Checks server status"""
    return {"status": "I am healthy!"}


@app.get("/settings")
def read_settings_endpoint() -> Settings:
    """Reads the server settings."""
    return settings


@app.get("/health")
async def health_check_endpoint(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Dict[str, str]:
    """Checks the health of the server."""
    try:
        # Check database connection
        await db.command("ping")
        return {
            "status": "healthy",
            "database": "connected",
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unhealthy",
        )
