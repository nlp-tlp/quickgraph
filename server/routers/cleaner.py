from typing import List, Union, Dict, Any, Tuple
import datetime
from collections import defaultdict, Counter
import itertools

import numpy as np
from fastapi import APIRouter, Depends, status, HTTPException, Body, Query
from fastapi.responses import JSONResponse, Response
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from dependencies import get_current_active_user, get_db
from models.user import User
from models.dataset import (
    SaveStateFilter,
    QualityFilter,
    RelationsFilter,
)
from models.project import ProjectOntology, OntologyItem
import services.projects as project_services

router = APIRouter(prefix="/cleaner", tags=["Cleaner"])


@router.get("/{dataset_id}")
async def filter_data(
    dataset_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Fetches a high-level project information"""
    # TODO write output PyDantic model

    return "hello world"


@router.get("/{dataset_id}/progress")
async def get_dataset_progress():
    pass


@router.patch("/save/")
async def save_many_dataset_items():
    pass


@router.patch("/tokenizer")
async def tokenize_dataset_item():
    pass


@router.patch("/tokenize/undo")
async def undo_tokenize_dataset_item():
    pass


# add
# delete
# accept
# split
# remove
# search
