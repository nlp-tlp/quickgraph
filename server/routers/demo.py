from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from bson import ObjectId

from dependencies import get_db
from models.project import Settings, Tasks, ProjectOntology, OntologyItem
import services.projects as project_services

router = APIRouter(prefix="/demo", tags=["Demo"])


class DemoProject(BaseModel):
    tasks: Tasks
    settings: Settings
    dataset_items: dict
    ontology: ProjectOntology
    entities: dict
    relations: dict


@router.get("/", response_description="Get demo project", response_model=DemoProject)
async def get_demo_project(
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Gets demo project including dataset items"""

    # Get project
    project = await db["projects"].find_one({"created_by": "demo"})

    # Convert ontologies to ontology_item_id:detail key:value pairs
    ontology = {
        ontology_type: {
            i.id: {
                "name": i.name,
                "fullname": i.fullname,
                "color": i.color,
                "active": i.active,
            }
            for i in project_services.flatten_hierarchical_ontology(
                [OntologyItem(**i) for i in ontology_items]
            )
        }
        for ontology_type, ontology_items in project["ontology"].items()
    }

    try:
        # Get dataset items
        dataset_items = (
            await db["data"]
            .find({"dataset_id": ObjectId(project["dataset_id"])})
            .to_list(None)
        )

        modified_dataset_items = {
            str(di["_id"]): {
                "tokens": [
                    {"value": t, "index": idx, "state": None}
                    for idx, t in enumerate(di["tokens"])
                ],
                "saved": False,
                "external_ids": di["external_ids"] if "external_ids" in di else None,
            }
            for di in dataset_items
        }

        # Get markup - TODO: refactor to meet DRY priciple (see services/dataset.py)
        markups = (
            await db["markup"]
            .find(
                {
                    "project_id": ObjectId(project["_id"]),
                    # "dataset_item_id": {"$in": dataset_item_ids},
                }
            )
            .to_list(None)
        )

        # Convert markups into objects where the key is the dataset_item_id and value is markup
        flat_entities = [m for m in markups if m["classification"] == "entity"]

        print(f"Found {len(flat_entities)} entities")

        entities = {}
        for e in flat_entities:
            dataset_item_id = str(e["dataset_item_id"])

            _entity = {
                "id": str(e["_id"]),
                "start": e["start"],
                "end": e["end"],
                "suggested": e["suggested"],
                "surface_form": e["surface_form"],
                "ontology_item_id": e["ontology_item_id"],
                "color": ontology["entity"][e["ontology_item_id"]]["color"],
                "name": ontology["entity"][e["ontology_item_id"]]["name"],
                "fullname": ontology["entity"][e["ontology_item_id"]]["fullname"],
                "state": "active",  # This is expected by the frontend - TODO: remove if not required.
                "created_at": e["created_at"],
                "updated_at": e["updated_at"],
            }

            if dataset_item_id in entities.keys():
                entities[dataset_item_id].append(_entity)
            else:
                entities[dataset_item_id] = [_entity]

        print("entities", entities)

        flat_relations = [m for m in markups if m["classification"] == "relation"]

        relations = {}
        for r in flat_relations:
            dataset_item_id = str(r["dataset_item_id"])

            _relation = {
                "id": str(r["_id"]),
                "source_id": str(r["source_id"]),
                "target_id": str(r["target_id"]),
                "suggested": r["suggested"],
                "ontology_item_id": r["ontology_item_id"],
                "name": ontology["relation"][r["ontology_item_id"]]["name"],
                "fullname": ontology["relation"][r["ontology_item_id"]]["fullname"],
                "created_at": r["created_at"],
                "updated_at": r["updated_at"],
            }

            if dataset_item_id in relations.keys():
                relations[dataset_item_id].append(_relation)
            else:
                relations[dataset_item_id] = [_relation]

    except Exception as e:
        print(e)

    print(f"Found {len(modified_dataset_items)} dataset items")

    if project:
        return DemoProject(
            **project,
            dataset_items=modified_dataset_items,
            entities=entities,
            relations=relations,
        )
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Demo project not found"},
    )
