"""
Tests for data services
"""

import numpy as np
import pytest
from bson import ObjectId

import services.dataset as dataset_services
import services.projects as project_services
from models.dataset import (Dataset, DatasetFilters, Preprocessing,
                            QualityFilter, RelationsFilter, SaveStateFilter)
from tests.data import base_dataset, base_item, base_preprocessing
from tests.settings import settings
from tests.utils import create_dataset, create_relation_markup

USERNAME = settings.TEST_USERNAME


def test_preprocess_and_tokenize_item():
    """Test for preprocessing functionality"""
    text = "\tHello World\r"
    assert dataset_services.preprocess_and_tokenize_item(
        text=text, preprocessing=Preprocessing(lowercase=True, tokenizer="whitespace")
    ) == ["hello", "world"], "Failed to process text item"
    assert dataset_services.preprocess_and_tokenize_item(
        text=text, preprocessing=Preprocessing(lowercase=False, tokenizer="whitespace")
    ) == ["Hello", "World"], "Failed to process text item"


@pytest.mark.asyncio
async def test_create_dataset(db):
    created_dataset = await create_dataset(db=db)

    assert created_dataset != None, "Dataset was not created"

    # Check whether dataset items were created
    dataset_items = await dataset_services.find_many_dataset_items(
        db=db, dataset_id=created_dataset.id
    )

    assert len(dataset_items) == len(
        base_dataset.items
    ), "Unexpected number of dataset items created"


@pytest.mark.asyncio
async def test_identify_most_common_annotations():
    annotations = [
        {"type": "entity", "text": "apple", "labels": ["fruit", "food"]},
        {"type": "entity", "text": "banana", "labels": ["fruit"]},
        {"type": "entity", "text": "orange", "labels": ["fruit"]},
        {
            "type": "relation",
            "subject": "apple",
            "object": "banana",
            "label": "has_similar_taste",
        },
        {
            "type": "relation",
            "subject": "apple",
            "object": "orange",
            "label": "has_similar_taste",
        },
        {
            "type": "relation",
            "subject": "banana",
            "object": "orange",
            "label": "has_similar_taste",
        },
        {
            "type": "relation",
            "subject": "apple",
            "object": "banana",
            "label": "is_cheaper_than",
        },
        {
            "type": "relation",
            "subject": "apple",
            "object": "orange",
            "label": "is_cheaper_than",
        },
        {
            "type": "relation",
            "subject": "banana",
            "object": "orange",
            "label": "is_cheaper_than",
        },
    ]
    expected_output = {
        "most_common_entity_text": "apple",
        "most_common_entity_label": "fruit",
        "most_common_relation": ("apple", "banana", "has_similar_taste"),
    }
    assert identify_most_common_annotations(annotations) == expected_output


def test_pairwise_agreement(self):
    # Define some example data.
    data = {
        "doc1": {
            "entities": [
                {
                    "id": 1,
                    "text": "apple",
                    "start": 0,
                    "end": 5,
                    "type": "fruit",
                    "annotator": 1,
                },
                {
                    "id": 2,
                    "text": "orange",
                    "start": 7,
                    "end": 13,
                    "type": "fruit",
                    "annotator": 1,
                },
                {
                    "id": 3,
                    "text": "apple",
                    "start": 0,
                    "end": 5,
                    "type": "fruit",
                    "annotator": 2,
                },
                {
                    "id": 4,
                    "text": "banana",
                    "start": 16,
                    "end": 22,
                    "type": "fruit",
                    "annotator": 2,
                },
                {
                    "id": 5,
                    "text": "orange",
                    "start": 7,
                    "end": 13,
                    "type": "fruit",
                    "annotator": 3,
                },
                {
                    "id": 6,
                    "text": "banana",
                    "start": 16,
                    "end": 22,
                    "type": "fruit",
                    "annotator": 3,
                },
            ],
            "relations": [
                {"id": 1, "type": "next-to", "head": 1, "tail": 2, "annotator": 1},
                {"id": 2, "type": "next-to", "head": 1, "tail": 2, "annotator": 2},
                {"id": 3, "type": "next-to", "head": 1, "tail": 2, "annotator": 3},
                {"id": 4, "type": "next-to", "head": 2, "tail": 4, "annotator": 2},
                {"id": 5, "type": "next-to", "head": 2, "tail": 4, "annotator": 3},
                {"id": 6, "type": "next-to", "head": 3, "tail": 6, "annotator": 1},
                {"id": 7, "type": "next-to", "head": 3, "tail": 6, "annotator": 2},
                {"id": 8, "type": "next-to", "head": 3, "tail": 6, "annotator": 3},
            ],
        }
    }

    # Calculate the expected agreement matrix.
    expected_matrix = np.array(
        [[1.000, 0.444, 0.333], [0.444, 1.000, 0.556], [0.333, 0.556, 1.000]]
    )

    # Calculate the actual agreement matrix.
    actual_matrix = pairwise_agreement(data)

    # Check that the actual and expected matrices are equal.
    np.testing.assert_array_almost_equal(actual_matrix, expected_matrix, decimal=3)


@pytest.mark.asyncio
async def test_entity_agreement():
    pass
