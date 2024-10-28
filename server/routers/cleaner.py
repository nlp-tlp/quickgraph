import datetime
import itertools
from collections import Counter, defaultdict
from typing import Any, Dict, List, Tuple, Union

import numpy as np
from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse, Response
from motor.motor_asyncio import AsyncIOMotorDatabase

import services.projects as project_services
from dependencies import get_current_active_user, get_db
from models.dataset import QualityFilter, RelationsFilter, SaveStateFilter
from models.project import OntologyItem, ProjectOntology
from models.user import User

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
