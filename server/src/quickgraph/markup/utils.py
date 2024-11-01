"""Markup utilities."""

from typing import List

from ..project.schemas import OntologyItem


def get_entity_offset(source_entity: dict, target_entity: dict) -> int:
    return abs(target_entity["start"] - source_entity["end"]) - 1


def find_sub_lists(sl, l):
    """src: https://stackoverflow.com/a/17870684

    Args
        sl : sublist (tokens to match)
        l : list (all candidate tokens)
    """
    results = []
    sll = len(sl)
    for ind in (i for i, e in enumerate(l) if e == sl[0]):
        if l[ind : ind + sll] == sl:
            results.append((ind, ind + sll - 1))

    return results


def find_ontology_item_by_id(
    ontology: List[OntologyItem], ontology_item_id: str
) -> OntologyItem | None:
    for node in ontology:
        if node.id == ontology_item_id:
            return node
        else:
            child = find_ontology_item_by_id(node.children, ontology_item_id)
            if child:
                return child
    return None
