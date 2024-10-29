import itertools
import json
import random
import uuid
from datetime import datetime
from typing import Dict, List, Union

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
    ResourceModel,
    UpdateResourceModel,
)

COLLECTION_NAME = "resources"


def initialize_ontology(
    data: List[Dict[str, any]],
    parent_names: List[str] = [],
    parent_id: str = "",
    parent_color: str = None,
    parent_path: List[int] = [],
) -> List[Dict[str, any]]:
    """
    Recursively adds ids, fullnames, colors, and additional information to the dictionary elements in a list. Paths are indexed from 0.

    Args:
    - data (List[Dict[str, any]]): The list of dictionary elements.
    - parent_names (List[str]): The list of parent names. Defaults to an empty list.
    - parent_id (str): The id of the parent element. Defaults to an empty string.
    - parent_color (str): The color of the parent element. Defaults to None.
    - parent_path (List[int]): The list of parent path. Defaults to an empty list.

    Returns:
    - data (List[Dict[str, any]]): The updated list of dictionary elements.
    """
    for i, item in enumerate(data):
        print("item", item)
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
    resource = resource.dict(exclude_none=True)
    content = resource.pop("content")
    # print(f"new resource: {resource}")

    print("content", content)

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


# async def create_many_resources(
#     db: AsyncIOMotorDatabase, resources: List[CreateResourceModel], username: str
# ):

#     await db[COLLECTION_NAME].insert_many(
#         [
#             {
#                 **r.dict(),
#                 "created_by": username,
#                 "ontology": add_hierarchical_names_and_paths(
#                     initialized_copy(r.dict()["ontology"])
#                 ),
#             }
#             for r in resources
#         ]
#     )


async def find_one_resource(
    db: AsyncIOMotorDatabase, resource_id: ObjectId, username: str
):
    result = await db[COLLECTION_NAME].find_one({"_id": resource_id})

    read_only = result["created_by"] != username

    return result, read_only


async def find_many_resources(db: AsyncIOMotorDatabase, aggregate: bool, username: str):
    """
    Args
        aggregate : whether to aggregate resources by their classification
    """
    print("find_many_resources")

    resources = await db[COLLECTION_NAME].find({"created_by": username}).to_list(None)

    print(f"Resources found: {len(resources)}")

    if len(resources) == 0:
        print("User has no resources")
        return []

    if aggregate:
        aggregate_resources = {}
        for resource in resources:
            clf = resource["classification"]
            sub_clf = resource["sub_classification"]

            if clf in aggregate_resources.keys():
                if sub_clf in aggregate_resources[clf].keys():
                    aggregate_resources[clf][sub_clf].append(resource)
                else:
                    aggregate_resources[clf][sub_clf] = [resource]
            else:
                aggregate_resources[clf] = {sub_clf: [resource]}

        # print(f"Aggregated resources:\n{aggregate_resources}")

        return aggregate_resources

    # print("resources", resources)

    return [ResourceModel(**r) for r in resources]


async def delete_one_resource(
    db: AsyncIOMotorDatabase, resource_id: ObjectId, username: str
):
    return await db[COLLECTION_NAME].delete_one(
        {"_id": resource_id, "created_by": username}
    )


async def update_one_resource(
    db: AsyncIOMotorDatabase, resource: UpdateResourceModel, username: str
):
    """
    Updates one resource.

    This function updates the contents of a given resource via its "id". The resource
    can only be updated if the current user is the resources creator. Each update will
    increment the "updated_at" key on the resource.

    Parameters
    ----------
    resource : UpdateResourceModel
        Pydantic "resource" model with only "id" and "content" keys.

    Returns
    -------

    Notes
    -----
    "Fullnames" are added and/or updated to the ontology here - not on the front end

    """

    # Convert Pydantic object to dict
    resource = resource.dict()
    # print("resource\n", resource)

    # Ensure that new resources ontology has correct metadata
    updated_resource = initialize_ontology(data=resource["content"])

    # print("updated_resource\n", updated_resource)

    if resource["id"]:
        # Update blueprint resource
        await db["resources"].update_one(
            {"_id": ObjectId(resource["id"]), "created_by": username},
            {
                "$set": {
                    "content": updated_resource,
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        return await db[COLLECTION_NAME].find_one({"_id": resource["id"]})
    elif resource["project_id"]:
        # Update project resource
        await db["projects"].update_one(
            {"_id": ObjectId(resource["project_id"]), "created_by": username},
            {"$set": {f"ontology.{resource['sub_classification']}": updated_resource}},
        )

        return updated_resource


async def aggregate_system_and_user_resources(db: AsyncIOMotorDatabase, username: str):
    """Services for aggregating resources available by the system and those created by the user together. This is used primarly for project creation to show available resources such as ontologies, preannotation sets, etc."""

    print("aggregate_system_and_user_resources")
    # Find resources created by system and user
    # TODO: create output datamodel to serialize dates, etc.
    try:
        resources = (
            await db[COLLECTION_NAME]
            .find({"created_by": {"$in": [username, settings.SYSTEM_USERNAME]}})
            .to_list(None)
        )

        # print("resources", resources)

        resources = [ResourceModel(**r) for r in resources]

        # print("resources", resources)

        if len(resources) == 0:
            print("User has no resources")
            return []

        aggregated_resources = []

        for resource in resources:
            # print(resource)
            clf = resource.classification
            sub_clf = resource.sub_classification
            username = resource.created_by

            if resource.classification == "ontology":
                flat_ontology = flatten_hierarchical_ontology(ontology=resource.content)
                # print("flat_ontology", flat_ontology)

            resource = {
                "id": str(resource.id),
                "name": resource.name,
                "created_by": resource.created_by,
                "created_at": str(resource.created_at),
                "updated_at": str(resource.updated_at),
                "classification": clf,
                "sub_classification": sub_clf,
                "size": (
                    len(flat_ontology)
                    if resource.classification == "ontology"
                    else len(resource.content)
                ),
                **(
                    {"instances": [i.fullname for i in flat_ontology]}
                    if resource.classification == "ontology"
                    else {}
                ),
            }

            aggregated_resources.append(resource)

        return aggregated_resources
    except Exception as e:
        print(e)


async def create_system_resources(db: AsyncIOMotorDatabase):
    """Prepopulates system with default/preset resources"""

    # Load resources JSON file
    data = json.load(open(f"{settings.SYSTEM_DEFAULTS_DIR}/resources.json", "r"))
    print("Loaded data")
    print("data", data)

    # Parse data and add "is_blueprint" key to ontologies
    ontologies = [
        CreateResourceModel.parse_obj({**d, "is_blueprint": True})
        for d in data
        if d["classification"] == "ontology"
    ]
    print(f"Loaded {len(ontologies)} ontologies")

    db_ontologies = {}  # This is used to ground other resources via reference
    for ontology in ontologies:
        print("ontology", ontology)

        try:
            # Check if resource exists (do not want to replace as `_id` is linked to other documents)
            existing_resource = await db[COLLECTION_NAME].find_one(
                {
                    "name": ontology.name,
                    "classification": ontology.classification,
                    "sub_classification": ontology.sub_classification,
                    "created_by": settings.SYSTEM_USERNAME,
                }
            )
            if not existing_resource:
                created_resource = await create_one_resource(
                    db=db, resource=ontology, username=settings.SYSTEM_USERNAME
                )

                print("created_resource", created_resource["_id"])
                db_ontologies[created_resource["_id"]] = created_resource
            else:
                db_ontologies[existing_resource["_id"]] = existing_resource

        except Exception as e:
            print(f"Failed to process resource:\n{e}")

    print(db_ontologies)

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
    #                 "created_by": settings.SYSTEM_USERNAME,
    #             }
    #         )
    #         print("ontology_resource", ontology_resource)

    #         # _ontology = ResourceModel(**ontology_resource)
    #         # print("_ontology", _ontology)
    #         # TODO: fix issue with ontology not being ResourceModel and not working with `flatten_hierarchical_ontology`

    #         existing_resource = await db[COLLECTION_NAME].find_one(
    #             {
    #                 "name": resource.name,
    #                 "classification": resource.classification,
    #                 "sub_classification": resource.sub_classification,
    #                 "created_by": settings.SYSTEM_USERNAME,
    #                 "ontology_id": ontology_resource["_id"],
    #             }
    #         )

    #         print("preannotation resource exists", existing_resource)

    #         # Add ontology meta-data to the preannotation resource
    #         resource.ontology_id = ontology_resource["_id"]

    #         # Add `ontology_item_ids` to the resource preannotation items
    #         # 1. flatten ontology hierarchy
    #         flat_ontology = flatten_hierarchical_ontology(
    #             ontology=ontology_resource["ontology"]
    #         )
    #         print("flat_ontology", flat_ontology)
    #         # 2. Match on preannotation items based on `fullname` attributes and add `ontology_item_id` to items

    #         if not existing_resource:
    #             await create_one_resource(
    #                 db=db,
    #                 resource=resource,
    #                 username=settings.SYSTEM_USERNAME,
    #             )
    #     except Exception as e:
    #         print(f"Failed to handle preannotation resource:\n{e}")
