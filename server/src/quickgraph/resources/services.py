"""Resources services."""

import json
import logging
import random
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Union

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..settings import settings
from ..utils.misc import flatten_hierarchical_ontology
from .schemas import (
    AggregateResourcesModel,
    BaseOntologyItem,
    BaseResourceModel,
    CreatePreannotationResource,
    CreateResourceModel,
    OntologyItem,
    ResourceModel,
    ResourceModelOut,
    UpdateResourceModel,
)

logger = logging.getLogger(__name__)

COLLECTION_NAME = "resources"


def initialize_ontology(
    data: List[Dict[str, any]],
    parent_names: List[str] = [],
    parent_id: str = "",
    parent_color: str = None,
    parent_path: List[int] = [],
) -> List[Dict[str, any]]:
    """Initialize ontology data.

    Recursively adds ids, fullnames, colors, and additional information to
    the dictionary elements in a list. Paths are indexed from 0.

    Parameters
    ----------
    data :
        The list of dictionary elements.
    parent_names :
        The list of parent names. Defaults to an empty list.
    parent_id :
        The id of the parent element. Defaults to an empty string.
    parent_color :
        The color of the parent element. Defaults to None.
    parent_path :
        The list of parent path. Defaults to an empty list.

    Returns:
    - data : The updated list of dictionary elements.
    """
    for i, item in enumerate(data):
        # Create a unique id for the item
        item_id = item.get("id") or str(uuid.uuid4().hex[:8])
        # Create the fullname for the item
        fullname = "/".join(parent_names + [item["name"]])
        # Generate a random color for the item
        color = (
            item.get("color") or parent_color or "#%06x" % random.randint(0, 0xFFFFFF)
        )

        active = item.get("active", True)

        # Add the id, fullname, and color to the item
        item.update(
            {
                "id": item_id,
                "fullname": fullname,
                "color": color,
                "active": active,
                "path": parent_path + [i],
            }
        )

        # If the item has children, recursively add ids, fullnames, and colors to them
        if item.get("children"):
            initialize_ontology(
                item["children"],
                parent_names + [item["name"]],
                item_id,
                color,
                parent_path + [i],
            )

    return data


def add_hierarchical_names_and_paths(data):
    """Adds full names and paths to items in ontology resource

    Equivalent to `addFullNames` in .js
    """

    def add_hierarchy(node, fullname, path):
        node["fullname"] = fullname
        node["path"] = path
        for child in node["children"]:
            add_hierarchy(child, f"{fullname}/{child['name']}", f"{path}/{child['id']}")

        return node

    updated_data = []
    for d in data:
        updated_data.append(add_hierarchy(d, d["name"], d["id"]))

    return updated_data


def initialized_copy(nodes, location=None):
    """
    Equivalent to `initializedCopy.js"""
    nodes_copy = []
    for i, node in enumerate(nodes):
        children = node.get("children")
        name = node["name"]
        color = node["color"]
        placeholder = (
            node["placeholder"] if node["placeholder"] else ""
        )  # TODO: Investigate this field - is it necessary?
        description = node["description"]
        active = node.get("active", True)
        # _id = node.get("_id")s
        has_children = children is not None
        id = f"{location}.{i + 1}" if location else f"i{i + 1}"

        nodes_copy.append(
            {
                "children": initialized_copy(children, id) if has_children else None,
                "id": id,
                "name": name,
                "color": color,
                "placeholder": placeholder,
                "description": description,
                "active": active,
                # "_id": _id,   # TODO:
            }
        )
    return nodes_copy


async def create_one_resource(
    db: AsyncIOMotorDatabase,
    resource: Union[CreateResourceModel, CreatePreannotationResource],
    username: str,
):
    resource = resource.model_dump(exclude_none=True)
    content = resource.pop("content")

    new_resource = await db[COLLECTION_NAME].insert_one(
        {
            **resource,
            "created_by": username,  # Avoids needing to send this key in the frontend body
            **(
                {"content": initialize_ontology(content)}
                if resource["classification"] == "ontology"
                else {"content": content}
            ),
        }
    )
    created_resource = await db[COLLECTION_NAME].find_one(
        {"_id": new_resource.inserted_id}
    )
    return created_resource


async def find_one_resource(
    db: AsyncIOMotorDatabase, resource_id: ObjectId, username: str
):
    result = await db[COLLECTION_NAME].find_one({"_id": resource_id})

    read_only = result["created_by"] != username

    return result, read_only


async def find_many_resources(
    db: AsyncIOMotorDatabase, username: str, include_system: bool = False
) -> Optional[List[ResourceModelOut]]:
    """Find many resources with optional system resources."""
    resources = await db[COLLECTION_NAME].find({"created_by": username}).to_list(None)
    # Find resources created by system and user
    try:
        usernames = [username]
        if include_system:
            usernames.append(settings.api.system_username)

        resources = (
            await db[COLLECTION_NAME]
            .find({"created_by": {"$in": usernames}})
            .to_list(None)
        )
        resources = [ResourceModel(**r) for r in resources]

        if len(resources) == 0:
            logger.info("No resources found")
            return []

        aggregated_resources = []
        for resource in resources:
            if resource.classification == "ontology":
                flat_ontology = flatten_hierarchical_ontology(ontology=resource.content)
            resource = ResourceModelOut(
                **resource.model_dump(),
                size=(
                    len(flat_ontology)
                    if resource.classification == "ontology"
                    else len(resource.content)
                ),
                instances=(
                    [i.fullname for i in flat_ontology]
                    if resource.classification == "ontology"
                    else None
                ),
            )
            aggregated_resources.append(resource)
        return aggregated_resources
    except Exception as e:
        logger.error(f"Failed to aggregate resources:\n{e}")
        return []


async def delete_one_resource(
    db: AsyncIOMotorDatabase, resource_id: ObjectId, username: str
):
    return await db[COLLECTION_NAME].delete_one(
        {"_id": resource_id, "created_by": username}
    )


async def update_one_resource(
    db: AsyncIOMotorDatabase,
    resource_id: ObjectId,
    body: UpdateResourceModel,
    username: str,
) -> Optional[List[OntologyItem]]:
    """Update one resource.

    This function updates the contents of a given resource via its "id". The resource
    can only be updated if the current user is the resources creator. Each update will
    increment the "updated_at" key on the resource.

    Parameters
    ----------
    resource : UpdateResourceModel
        Pydantic "resource" model with only "id" and "content" keys.

    Notes
    -----
    - "Fullnames" are added and/or updated to the ontology here - not on the front end
    """
    logger.info(f"Updating resource: {resource_id} body: {body}")

    resource = await db.resources.find_one({"_id": resource_id, "created_by": username})

    if resource is None:
        logger.info("Resource not found")
        return None

    if resource["classification"] != "ontology":
        logger.info("Incorrect resource classification provided.")
        raise ValueError(
            "Only 'ontology' resources are currently supported for updates.",
        )

    body = body.model_dump(exclude_none=True)
    body["updated_at"] = datetime.utcnow()

    if "content" in body:
        logger.info("Updating ontology content")
        logger.info(f"input content: {body['content']}")
        updated_content = initialize_ontology(data=body["content"])
        logger.info(f"output content: {updated_content}")
        body["content"] = updated_content

    result = await db.resources.update_one({"_id": resource_id}, {"$set": body})

    if result.modified_count == 0:
        logger.info("Resource not updated")
        return None
    updated_resource = await db.resources.find_one({"_id": resource_id})
    return ResourceModel(**updated_resource)


async def create_system_resources(db: AsyncIOMotorDatabase):
    """Prepopulates system with default/preset resources"""

    # Load resources JSON file
    data = json.load(open(f"{settings.SYSTEM_DEFAULTS_DIR}/resources.json", "r"))

    # Parse data and add "is_blueprint" key to ontologies
    ontologies = [
        CreateResourceModel(**{**d, "is_blueprint": True})
        for d in data
        if d["classification"] == "ontology"
    ]
    db_ontologies = {}  # This is used to ground other resources via reference
    for ontology in ontologies:
        try:
            # Check if resource exists (do not want to replace as `_id` is linked to other documents)
            existing_resource = await db[COLLECTION_NAME].find_one(
                {
                    "name": ontology.name,
                    "classification": ontology.classification,
                    "sub_classification": ontology.sub_classification,
                    "created_by": settings.api.system_username,
                }
            )
            if not existing_resource:
                created_resource = await create_one_resource(
                    db=db, resource=ontology, username=settings.api.system_username
                )

                db_ontologies[created_resource["_id"]] = created_resource
            else:
                db_ontologies[existing_resource["_id"]] = existing_resource

        except Exception as e:
            logger.info(f"Failed to process resource:\n{e}")

    # Create preannotation resources

    # Preannotation resources must be linked to an existing ontology resource
    # for ontology_name, resource in default_preannotation_resources.items():
    #     # Check if resource exists (do not want to replace as `_id` is linked to other documents)
    #     try:
    #         ontology_resource = await db[COLLECTION_NAME].find_one(
    #             {
    #                 "name": ontology_name,
    #                 "classification": "ontology",
    #                 "sub_classification": resource.sub_classification,
    #                 "created_by": settings.api.system_username,
    #             }
    #         )
    #         logger.info("ontology_resource", ontology_resource)

    #         # _ontology = ResourceModel(**ontology_resource)
    #         # logger.info("_ontology", _ontology)
    #         # TODO: fix issue with ontology not being ResourceModel and not working with `flatten_hierarchical_ontology`

    #         existing_resource = await db[COLLECTION_NAME].find_one(
    #             {
    #                 "name": resource.name,
    #                 "classification": resource.classification,
    #                 "sub_classification": resource.sub_classification,
    #                 "created_by": settings.api.system_username,
    #                 "ontology_id": ontology_resource["_id"],
    #             }
    #         )

    #         logger.info("preannotation resource exists", existing_resource)

    #         # Add ontology meta-data to the preannotation resource
    #         resource.ontology_id = ontology_resource["_id"]

    #         # Add `ontology_item_ids` to the resource preannotation items
    #         # 1. flatten ontology hierarchy
    #         flat_ontology = flatten_hierarchical_ontology(
    #             ontology=ontology_resource["ontology"]
    #         )
    #         logger.info("flat_ontology", flat_ontology)
    #         # 2. Match on preannotation items based on `fullname` attributes and add `ontology_item_id` to items

    #         if not existing_resource:
    #             await create_one_resource(
    #                 db=db,
    #                 resource=resource,
    #                 username=settings.api.system_username,
    #             )
    #     except Exception as e:
    #         logger.info(f"Failed to handle preannotation resource:\n{e}")


async def get_project_ontology_items(
    db: AsyncIOMotorDatabase, project_id: ObjectId
) -> Tuple[List[OntologyItem], List[OntologyItem], List[OntologyItem]]:
    """
    Get project ontology items.

    Returns:
        tuple: (entity_onto, relation_onto, combined_onto) where relation_onto might be empty
    """
    # Get all ontology items for the project
    entity_onto = await db[COLLECTION_NAME].find_one(
        {
            "classification": "ontology",
            "sub_classification": "entity",
            "project_id": project_id,
        }
    )
    relation_onto = await db[COLLECTION_NAME].find_one(
        {
            "classification": "ontology",
            "sub_classification": "relation",
            "project_id": project_id,
        }
    )

    entity_onto = [OntologyItem(**o) for o in entity_onto["content"]]

    if relation_onto is None:
        relation_onto = []
    else:
        relation_onto = [OntologyItem(**o) for o in relation_onto["content"]]

    # Combine ontologies, even if relation_onto is empty
    combined_onto = entity_onto + relation_onto

    return entity_onto, relation_onto, combined_onto
