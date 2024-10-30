"""Graph router."""

import logging
from collections import Counter, defaultdict
from typing import Dict, List, Optional, Union

from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..dataset.schemas import QualityFilter
from ..dependencies import get_db, get_user
from ..project.schemas import OntologyItem
from ..users.schemas import UserDocumentModel
from ..utils.misc import flatten_hierarchical_ontology
from .schemas import (
    Graph,
    GraphData,
    GraphFilters,
    Link,
    LinkNode,
    Metrics,
    Node,
    NodeColor,
    NodeFont,
    Ontologies,
)
from .services import (
    aggregate_graph,
    create_relationships,
    filter_ontology_by_ids,
    get_font_color,
    get_graph_data,
    get_node_neighbors,
    lighten_hex_color,
)

router = APIRouter(prefix="/graph", tags=["Graph"])


@router.get(
    "/{project_id}", response_description="Get single graph"
)  # , response_model=Graph
async def get_graph(
    project_id: str,
    username: Optional[str] = Query(default=None),
    search_term: Optional[str] = Query(default=None),
    quality: int = Query(default=QualityFilter.everything),
    aggregate: bool = Query(
        default=True, description="Flag to toggle graph aggregation"
    ),
    show_orphans: bool = Query(
        default=True, description="Flag to toggle visibility of orphaned entities"
    ),
    exclude_ontology_item_ids: str = Query(
        default="",
        description="A comma separated string of ontology item ids to exclude from the graph",
    ),
    node_limit: int = Query(
        gt=0, default=5000, description="The number of nodes to return."
    ),
    # filters: GraphFilters,
    user: UserDocumentModel = Depends(get_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Creates a project graph dataset.

    This function aggregates project markup into a graph dataset. The default graph is built on only agreed upon annotations on dataset items with minimum annotator saves.

    Parameters
    ----------


    Returns
    -------

    Raises
    ------



    Notes
    -----


    """

    if username == "":
        username = None

    project_id = ObjectId(project_id)

    project = await db["projects"].find_one(
        {"_id": project_id}, {"ontology": 1, "settings": 1, "annotators": 1}
    )

    # Project does not exist
    if project is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND, content={"detail": "Graph not found"}
        )

    entity_ontology = [
        OntologyItem.parse_obj(item) for item in project["ontology"]["entity"]
    ]
    relation_ontology = [
        OntologyItem.parse_obj(item) for item in project["ontology"]["relation"]
    ]

    try:
        ontology_id2details = {}
        for ontology_type, ontology_items in [
            ("entity", entity_ontology),
            ("relation", relation_ontology),
        ]:
            flat_ontology = flatten_hierarchical_ontology(ontology=ontology_items)

            # Default to purple color if none exists (relations do not have this attribute)
            for item in flat_ontology:
                ontology_id2details[(ontology_type, item.id)] = {
                    "fullname": item.fullname,
                    "color": (
                        item.color if item and hasattr(item, "color") else "#7b1fa2"
                    ),
                    "name": item.name,
                }
        print("Created ontology_id2details")
    except Exception as e:
        print(f"Error creating ontology_id2details: {e}")

    # Fetch dataset items that have minimum saves if "group" graph otherwise filter for "created_by"
    if username is None:
        dataset_items = (
            await db["data"]
            .find(
                {
                    "$and": [
                        {
                            "project_id": project_id,
                            "save_states": {
                                "$exists": True,
                                "$ne": [],
                                "$not": {"$size": 0},
                            },
                        },
                        {
                            "$expr": {
                                "$gte": [
                                    {"$size": "$save_states"},
                                    project["settings"]["annotators_per_item"],
                                ]
                            }
                        },
                    ]
                },
                {"_id": 1},
            )
            .to_list(None)
        )
        print(f"Loaded: {len(dataset_items)} dataset_items")

    # Fetch markup associated
    markup_query = {
        "project_id": project_id,
        "ontology_item_id": {"$nin": exclude_ontology_item_ids.split(",")},
    }

    if username is None:
        markup_query["dataset_item_id"] = {"$in": [di["_id"] for di in dataset_items]}
    else:
        markup_query["created_by"] = username

    if quality != 2:
        markup_query["suggested"] = True if quality == 0 else False

    # if show_orphans == False:
    #     pass

    # Fetch entities
    entity_match_query = {**markup_query, "classification": "entity"}
    if search_term is not None and search_term != "":
        entity_match_query = {
            **entity_match_query,
            "surface_form": {"$regex": search_term, "$options": "i"},
        }

    entity_markup_pipeline = [
        {"$match": entity_match_query},
        {"$limit": node_limit},
    ]
    entity_markup = await db["markup"].aggregate(entity_markup_pipeline).to_list(None)

    if len(entity_markup) == 0:
        return Graph(
            data=GraphData(nodes={}, links={}, relationships={}),
        )

    entity_markup_ids = [e["_id"] for e in entity_markup]
    print("entity_markup", len(entity_markup))

    # Fetch relations
    relation_markup_pipeline = [
        {
            "$match": {
                **markup_query,
                "classification": "relation",
                "source_id": {"$in": entity_markup_ids},
                "target_id": {"$in": entity_markup_ids},
            }
        },
        {
            "$lookup": {
                "from": "markup",
                "let": {"source_id": "$source_id"},
                "pipeline": [{"$match": {"$expr": {"$eq": ["$_id", "$$source_id"]}}}],
                "as": "source",
            }
        },
        {
            "$lookup": {
                "from": "markup",
                "let": {"target_id": "$target_id"},
                "pipeline": [{"$match": {"$expr": {"$eq": ["$_id", "$$target_id"]}}}],
                "as": "target",
            }
        },
        {"$unwind": {"path": "$source", "preserveNullAndEmptyArrays": True}},
        {"$unwind": {"path": "$target", "preserveNullAndEmptyArrays": True}},
    ]  # This is dependent on entity_markup_pipeline
    relation_markup = (
        await db["markup"].aggregate(relation_markup_pipeline).to_list(None)
    )
    print("relation_markup", len(relation_markup))

    # markup_pipeline = [
    #     {"$match": markup_query},
    #     {"$limit": node_limit},
    #     {
    #         "$project": {
    #             "is_blueprint": 0,
    #             "project_id": 0,
    #             "created_at": 0,
    #             "updated_at": 0,
    #         },
    #     },
    # {
    #     "$lookup": {
    #         "from": "markup",
    #         "let": {"source_id": "$source_id"},
    #         "pipeline": [{"$match": {"$expr": {"$eq": ["$_id", "$$source_id"]}}}],
    #         "as": "source",
    #     }
    # },
    # {
    #     "$lookup": {
    #         "from": "markup",
    #         "let": {"target_id": "$target_id"},
    #         "pipeline": [{"$match": {"$expr": {"$eq": ["$_id", "$$target_id"]}}}],
    #         "as": "target",
    #     }
    # },
    # {"$unwind": {"path": "$source", "preserveNullAndEmptyArrays": True}},
    # {"$unwind": {"path": "$target", "preserveNullAndEmptyArrays": True}},
    # ]

    # markup = await db["markup"].aggregate(markup_pipeline).to_list(None)

    # print(f"Loaded: {len(markup)} markup")

    # Annotator graph - TODO: generalise for group graph.

    nodes = entity_markup
    links = relation_markup

    if show_orphans == False:
        # Remove unconnected entities from markup
        connected_node_ids = {
            node_id
            for r in relation_markup
            for node_id in (r["source_id"], r["target_id"])
        }  # This should be done when fetching entity markup otherwise less than the node limit can be returned.
        nodes = [n for n in nodes if n["_id"] in connected_node_ids]

    try:
        nodes = {
            str(i["_id"]): Node(
                classification=ontology_id2details[("entity", i["ontology_item_id"])][
                    "name"
                ],
                color=NodeColor(
                    border=ontology_id2details[("entity", i["ontology_item_id"])][
                        "color"
                    ],
                    background=ontology_id2details[("entity", i["ontology_item_id"])][
                        "color"
                    ],
                ),
                font=NodeFont(
                    color=get_font_color(
                        ontology_id2details[("entity", i["ontology_item_id"])]["color"],
                    )
                ),
                id=str(i["_id"]),
                label=i["surface_form"],
                title=ontology_id2details[("entity", i["ontology_item_id"])][
                    "fullname"
                ],
                value=1,
                suggested=i["suggested"],
                ontology_item_id=i["ontology_item_id"],
            ).dict()
            for i in nodes
        }
        # print("nodes 1", nodes)
    except Exception as e:
        print(f"issue with nodes: {e}")

    try:
        links = {
            str(i["_id"]): Link(
                id=str(i["_id"]),
                label=ontology_id2details[("relation", i["ontology_item_id"])]["name"],
                source=str(i["source"]["_id"]),
                target=str(i["target"]["_id"]),
                title=ontology_id2details[("relation", i["ontology_item_id"])][
                    "fullname"
                ],
                value=1,
                suggested=i["suggested"],
                color=ontology_id2details[("relation", i["ontology_item_id"])]["color"],
                ontology_item_id=i["ontology_item_id"],
            ).dict()
            for i in links
        }
    except Exception as e:
        print(f"Issue with links: {e}")

    if aggregate:
        try:
            return Graph(
                data=GraphData.parse_obj(
                    aggregate_graph(data={"nodes": nodes, "links": links})
                )
            )
        except Exception as e:
            print("aggregation error", e)
    else:
        # Create relations between node and links
        try:
            relationships = get_node_neighbors(nodes=nodes, links=links)
        except Exception as e:
            print("Failed to create relationships", e)

        return Graph(
            data=GraphData(nodes=nodes, links=links, relationships=relationships)
        )
