"""Graph services."""

from collections import defaultdict
from itertools import groupby
from operator import itemgetter
from typing import Dict, List, Union

from ..project.schemas import OntologyItem
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
    Relationships,
)


def create_relationships(nodes: dict, links: dict) -> Dict[str, Relationships]:
    relationships = {}
    for node in nodes.values():
        node_id = node.id
        node_links = []
        node_nodes = []
        for link in links.values():
            if link.source == node_id or link.target == node_id:
                node_links.append(link.id)
                node_nodes.extend(
                    [link.source if link.target == node_id else link.target]
                )

        relationships[node_id] = Relationships(nodes=node_nodes, links=node_links)
    return relationships


def lighten_hex_color(hex_color: str, percent: float) -> str:
    """
    Lightens a hex color code by a specified percentage while maintaining the opacity.

    Args:
        hex_color: A string representing a hex color code.
        percent: A float representing the percentage by which to lighten the color (must be between 0 and 100).

    Returns:
        A string representing the resulting hex color code.

    Raises:
        ValueError: If the input percent is not between 0 and 100.
    """
    if percent < 0 or percent > 100:
        raise ValueError("Percent must be between 0 and 100")

    # Remove the '#' character from the hex color code
    hex_color = hex_color.lstrip("#")

    # Convert the hex color code to RGB values
    red, green, blue = tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))

    # Calculate the new RGB values by lightening each color channel
    red = min(int(red * (1 + percent / 100)), 255)
    green = min(int(green * (1 + percent / 100)), 255)
    blue = min(int(blue * (1 + percent / 100)), 255)

    # Convert the RGB values back to hex format and return the resulting color code
    return "#{:02x}{:02x}{:02x}".format(red, green, blue)


def get_font_color(hex_color: str) -> str:
    """Determines whether the font color should be white or black based on best practices.

    Args:
        hex_color: A string representing a hex color code.

    Returns:
        A string representing the best font color to use (either "black" or "white").

    """
    # Remove the "#" character from the hex color code
    hex_color = hex_color.lstrip("#")

    # Convert the hex color code to RGB values
    red = int(hex_color[0:2], 16)
    green = int(hex_color[2:4], 16)
    blue = int(hex_color[4:6], 16)

    # Calculate the perceived brightness of the background color using the YIQ formula
    yiq = ((red * 299) + (green * 587) + (blue * 114)) / 1000

    # Determine the best font color based on the perceived brightness
    if yiq >= 128:
        return "black"
    else:
        return "white"


async def get_graph_data(db, project_id: str):
    """
    Args
     aggregate : return graph with aggregated document annotations

    #  TODO: Revise this service when ontology/resources are decoupled.
    """

    print("project_id", project_id)

    project = await db["projects"].find_one({"_id": project_id})

    print(project)


def get_node_neighbors(nodes, links):
    # Check if nodes and links are defined
    if not nodes or not links:
        return {}

    neighbors = {}

    # Initialize the neighbors object with empty lists for each node
    for node_id in nodes.keys():
        neighbors[node_id] = {
            "nodes": [],
            "links": [],
        }

    # Iterate through links and populate the neighbors object with neighboring node ids and corresponding link ids
    for link_id, link in links.items():
        source = link.get("source", link["source"])
        target = link.get("target", link["target"])

        if source in neighbors and target in neighbors:
            neighbors[source]["nodes"].append(target)
            neighbors[source]["links"].append(link_id)
            neighbors[target]["nodes"].append(source)
            neighbors[target]["links"].append(link_id)

    return neighbors


def aggregate_graph(data):
    nodes = data.get("nodes", {})
    links = data.get("links", {})

    if not nodes:
        return {"nodes": {}, "links": {}, "relationships": {}}

    # Aggregate nodes
    sorted_nodes = sorted(
        nodes.values(),
        key=lambda node: (node["label"], node["ontology_item_id"], node["suggested"]),
    )
    aggregated_nodes = {}
    for index, (key, group) in enumerate(
        groupby(sorted_nodes, key=itemgetter("label", "ontology_item_id", "suggested"))
    ):
        group = list(group)
        new_node = group[0].copy()
        new_node["id"] = (
            f"{new_node['label']}-{new_node['ontology_item_id']}-{new_node['suggested']}"
        )
        new_node["value"] = len(group)
        aggregated_nodes[new_node["id"]] = new_node

    # Populate links with src/tgt information
    enriched_links = [
        {
            **link,
            "source": nodes.get(link.get("source", link["source"])),
            "target": nodes.get(link.get("target", link["target"])),
        }
        for link in links.values()
    ]

    # Aggregate links
    sorted_links = sorted(
        enriched_links,
        key=lambda link: (
            link["source"]["label"],
            link["source"]["ontology_item_id"],
            link["target"]["label"],
            link["target"]["ontology_item_id"],
            link["ontology_item_id"],
            link["suggested"],
        ),
    )

    def get_nested_keys(d, keys):
        for key in keys.split("."):
            d = d[key]
        return d

    aggregated_links = {}
    for index, (key, group) in enumerate(
        groupby(
            sorted_links,
            key=lambda x: (
                get_nested_keys(x, "source.label"),
                get_nested_keys(x, "source.ontology_item_id"),
                get_nested_keys(x, "target.label"),
                get_nested_keys(x, "target.ontology_item_id"),
                x["ontology_item_id"],
                x["suggested"],
            ),
        )
    ):
        group = list(group)
        new_link = group[0].copy()
        new_link["value"] = len(group)
        new_link["source"] = (
            f"{new_link['source']['label']}-{new_link['source']['ontology_item_id']}-{new_link['source']['suggested']}"
        )

        new_link["target"] = (
            f"{new_link['target']['label']}-{new_link['target']['ontology_item_id']}-{new_link['target']['suggested']}"
        )
        new_link["id"] = (
            f"{new_link['source']}-{new_link['label']}-{new_link['target']}"
        )

        aggregated_links[new_link["id"]] = new_link

    return {
        "nodes": aggregated_nodes,
        "links": aggregated_links,
        "relationships": get_node_neighbors(aggregated_nodes, aggregated_links),
    }


def add_details_and_create_objects(
    items: dict, ontology_id2details: dict, is_node: bool
):  #  Dict[str, Union[Node, Link]]
    try:
        if is_node:
            return {
                id: Node(
                    classification=ontology_id2details[
                        ("entity", i["ontology_item_id"])
                    ]["name"],
                    color=NodeColor(
                        border=ontology_id2details[("entity", i["ontology_item_id"])][
                            "color"
                        ],
                        background=ontology_id2details[
                            ("entity", i["ontology_item_id"])
                        ]["color"],
                    ),
                    font=NodeFont(
                        color=get_font_color(
                            ontology_id2details[("entity", i["ontology_item_id"])][
                                "color"
                            ],
                        )
                    ),
                    id=str(i["id"]),
                    label=i["surface_form"],
                    title=ontology_id2details[("entity", i["ontology_item_id"])][
                        "fullname"
                    ],
                    value=i["value"],
                    suggested=i["suggested"],
                    ontology_item_id=i["ontology_item_id"],
                )
                for id, i in items.items()
            }
        else:
            return {
                id: Link(
                    id=i["id"],
                    label=ontology_id2details[("relation", i["ontology_item_id"])][
                        "name"
                    ],
                    source=i["source"],
                    target=i["target"],
                    title=ontology_id2details[("relation", i["ontology_item_id"])][
                        "fullname"
                    ],
                    value=i["value"],
                    suggested=i["suggested"],
                    color=ontology_id2details[("relation", i["ontology_item_id"])][
                        "color"
                    ],
                    ontology_item_id=i["ontology_item_id"],
                )
                for id, i in items.items()
            }
    except Exception as e:
        print("Failed to add details - ", e)


def filter_gold_standard(markup):
    """Filters markup for gold standard"""

    class MarkupClassificationError(Exception):
        pass

    def update_source_target_items(item, ontology_id2details):
        for key in ["source", "target"]:
            source_target_item = item[key]
            source_target_item.update(
                {
                    "ontology_item_name": ontology_id2details[
                        ("entity", source_target_item["ontology_item_id"])
                    ]["name"],
                    "ontology_item_fullname": ontology_id2details[
                        ("entity", source_target_item["ontology_item_id"])
                    ]["fullname"],
                    "ontology_item_color": ontology_id2details[
                        ("entity", source_target_item["ontology_item_id"])
                    ]["color"],
                }
            )

        return item

    # Get majority agreement entities and relations only
    _markup_di_annotators = defaultdict(set)
    gold_markup_counts = {
        "entity": defaultdict(lambda: defaultdict(int)),
        "relation": defaultdict(lambda: defaultdict(int)),
    }

    for m in markup:
        clf = m["classification"]
        di_id = str(m["dataset_item_id"])
        creator = m["created_by"]

        _markup_di_annotators[di_id].add(creator)

        if clf == "entity":
            _key = (m["ontology_item_id"], m["start"], m["end"])

            gold_markup_counts["entity"][di_id][_key] += 1
        elif clf == "relation":
            # Relations have their source/target populated.
            print("relation", m)
            _key = (
                m["ontology_item_id"],
                m["source"]["start"],
                m["source"]["end"],
                m["source"]["ontology_item_id"],
                m["target"]["start"],
                m["target"]["end"],
                m["target"]["ontology_item_id"],
            )
            gold_markup_counts["relation"][di_id][_key] += 1
        else:
            raise NotImplementedError()

    converted_gold_markup_counts = {
        key: {inner_key: dict(inner_value) for inner_key, inner_value in value.items()}
        for key, value in gold_markup_counts.items()
    }

    # print("gold_markup_counts", converted_gold_markup_counts)

    _markup_di_annotators_counts = {
        di_id: len(usernames) for di_id, usernames in _markup_di_annotators.items()
    }

    # print("_markup_di_annotators_counts", _markup_di_annotators_counts)

    # Filter counts based on min
    gold_entity_markup = {
        di_id: {
            markup_key
            for markup_key, count in markup_counts.items()
            if count >= _markup_di_annotators_counts.get(di_id)
        }
        for di_id, markup_counts in converted_gold_markup_counts["entity"].items()
    }
    gold_relation_markup = {
        di_id: {
            markup_key
            for markup_key, count in markup_counts.items()
            if count >= _markup_di_annotators_counts.get(di_id)
        }
        for di_id, markup_counts in converted_gold_markup_counts["relation"].items()
    }

    # print("gold_entity_markup", gold_entity_markup)
    # print("gold_relation_markup", gold_relation_markup)

    # Split markup into entities and relations and add human readable attributes to markup
    # try:
    #     markup_by_classification = {"entity": [], "relation": []}
    #     for m in markup:
    #         classification = m["classification"]
    #         di_id = str(m["dataset_item_id"])
    #         if classification in markup_by_classification.keys():
    #             if classification == "relation":

    #                 if (
    #                     m["ontology_item_id"],
    #                     m["source"]["start"],
    #                     m["source"]["end"],
    #                     m["source"]["ontology_item_id"],
    #                     m["target"]["start"],
    #                     m["target"]["end"],
    #                     m["target"]["ontology_item_id"],
    #                 ) in gold_relation_markup[di_id]:

    #                     m = update_source_target_items(
    #                         item=m, ontology_id2details=ontology_id2details
    #                     )
    #                     m.update(
    #                         {
    #                             "ontology_item_name": ontology_id2details[
    #                                 ("relation", m["ontology_item_id"])
    #                             ]["name"],
    #                             "ontology_item_fullname": ontology_id2details[
    #                                 ("relation", m["ontology_item_id"])
    #                             ]["fullname"],
    #                             "ontology_item_color": ontology_id2details[
    #                                 ("relation", m["ontology_item_id"])
    #                             ]["color"],
    #                         }
    #                     )
    #                     markup_by_classification[classification].append(m)
    #             else:
    #                 if (
    #                     m["ontology_item_id"],
    #                     m["start"],
    #                     m["end"],
    #                 ) in gold_entity_markup[di_id]:
    #                     m.update(
    #                         {
    #                             "ontology_item_name": ontology_id2details[
    #                                 ("entity", m["ontology_item_id"])
    #                             ]["name"],
    #                             "ontology_item_fullname": ontology_id2details[
    #                                 ("entity", m["ontology_item_id"])
    #                             ]["fullname"],
    #                             "ontology_item_color": ontology_id2details[
    #                                 ("entity", m["ontology_item_id"])
    #                             ]["color"],
    #                         }
    #                     )
    #                     markup_by_classification[classification].append(m)
    #         else:
    #             raise MarkupClassificationError(
    #                 f"Invalid markup classification: {m['classification']}"
    #             )
    # except Exception as e:
    #     print("exception", e, m, markup_by_classification)


def add_metadata():
    """Adds metadata to nodes/links based on ontologies"""
    pass


def filter_ontology_by_ids(
    ontology: List[OntologyItem], ids: List[str]
) -> List[OntologyItem]:
    """
    Filters the provided ontology to only include the nodes that have an id in the provided list of ids, along with
    their ancestors up to the root of the ontology.

    Args:
        ontology: A list of `OntologyItem` instances representing the ontology.
        ids: A list of string ids to filter the ontology by.

    Returns:
        A new list of `OntologyItem` instances representing the filtered ontology.

    """
    # Filter ontologies for branches that are in the markup

    id_set = set(ids)
    filtered_ontology = []

    def filter_recursive(node):
        if node.id in id_set:
            filtered_children = []
            for child in node.children:
                filtered_child = filter_recursive(child)
                if filtered_child is not None:
                    filtered_children.append(filtered_child)
            return OntologyItem(
                **node.dict(exclude={"children"}), children=filtered_children
            )
        else:
            filtered_children = []
            for child in node.children:
                filtered_child = filter_recursive(child)
                if filtered_child is not None:
                    filtered_children.append(filtered_child)
            if len(filtered_children) > 0:
                return OntologyItem(
                    **node.dict(exclude={"children"}), children=filtered_children
                )
            else:
                return None

    for node in ontology:
        filtered_node = filter_recursive(node)
        if filtered_node is not None:
            filtered_ontology.append(filtered_node)

    return filtered_ontology

    # Filter out dataset items that do not have the minimum number of annotator saves, then lookup associated markup.
    # pipeline_v2 = [
    #     {
    #         "$match": {
    #             "project_id": project_id,
    #             "save_states": {"$exists": True, "$ne": [], "$not": {"$size": 0}},
    #         }
    #     },
    #     {
    #         "$match": {
    #             "$expr": {
    #                 "$gte": [
    #                     {"$size": "$save_states"},
    #                     project["settings"]["annotators_per_item"],
    #                 ]
    #             }
    #         }
    #     },
    #     {"$project": {"_id": 1}},
    #     {
    #         "$lookup": {
    #             "from": "markup",
    #             "localField": "_id",
    #             "foreignField": "dataset_item_id",
    #             "as": "markup",
    #         }
    #     },
    #     {"$unwind": "$markup"},
    #     {"$replaceRoot": {"newRoot": "$markup"}},
    #     {
    #         "$match": {
    #             # "created_by": usernames,
    #             "suggested": (
    #                 {"$in": [True, False]}
    #                 if quality == QualityFilter.everything.value
    #                 else bool(quality)
    #             ),
    #             "ontology_item_id": {"$nin": exclude_ontology_item_ids},
    #         }
    #     },
    #     {
    #         "$lookup": {
    #             "from": "markup",
    #             "let": {"source_id": "$source_id"},
    #             "pipeline": [{"$match": {"$expr": {"$eq": ["$_id", "$$source_id"]}}}],
    #             "as": "source",
    #         }
    #     },
    #     {
    #         "$lookup": {
    #             "from": "markup",
    #             "let": {"target_id": "$target_id"},
    #             "pipeline": [{"$match": {"$expr": {"$eq": ["$_id", "$$target_id"]}}}],
    #             "as": "target",
    #         }
    #     },
    #     {"$unwind": {"path": "$source", "preserveNullAndEmptyArrays": True}},
    #     {"$unwind": {"path": "$target", "preserveNullAndEmptyArrays": True}},
    # ]

    # markup = await db["data"].aggregate(pipeline_v2).to_list(None)
    # print(f"Found {len(markup)} markup")
