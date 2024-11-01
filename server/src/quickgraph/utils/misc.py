"""Miscellaneous utilities."""

import logging
from typing import List

from ..resources.schemas import OntologyItem

logger = logging.getLogger(__name__)


def flatten_hierarchical_ontology(ontology: List[OntologyItem]) -> List[OntologyItem]:
    """Flattens hierarhical ontology by popping out children from ontology items."""
    flat_ontology = []
    try:
        for node in ontology:
            flat_ontology.append(node)
            if node.children:
                flat_ontology += flatten_hierarchical_ontology(node.children)
        return flat_ontology
    except Exception as e:
        logger.info(f"Failed to flatten hierarchical ontology - {e}")
