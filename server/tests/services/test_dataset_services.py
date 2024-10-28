"""
Tests for data services
"""

from bson import ObjectId
import pytest

from models.dataset import (
    Dataset,
    Preprocessing,
    DatasetFilters,
    SaveStateFilter,
    QualityFilter,
    RelationsFilter,
)
import services.dataset as dataset_services
import services.projects as project_services
from tests.settings import settings
from tests.data import base_item, base_dataset, base_preprocessing
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
async def test_list_datasets(db):
    # Create two datasets
    await create_dataset(db=db)
    await create_dataset(db=db)

    datasets = await dataset_services.list_datasets(db=db, username=USERNAME)

    assert len(datasets) == 2, "Unexpected number of datasets obtained"


@pytest.mark.asyncio
async def test_find_one_dataset(db):
    created_dataset = await create_dataset(db=db)
    dataset = await dataset_services.find_one_dataset(
        db, dataset_id=created_dataset.id, username=USERNAME
    )

    assert dataset != None, "Dataset not found"


@pytest.mark.asyncio
async def test_delete_one_dataset(db):
    created_dataset = await create_dataset(db)

    dataset_id = created_dataset.id

    # Delete resource
    await dataset_services.delete_one_dataset(
        db=db, dataset_id=dataset_id, username=USERNAME
    )

    # Test existence of resource after deletion
    response = await dataset_services.find_one_dataset(
        db=db, dataset_id=dataset_id, username=USERNAME
    )

    # Assert it does not exist.
    assert response == None, "Dataset still exists after deletion"


# TODO: need to think about structure of body.
# @pytest.mark.asyncio
# async def test_update_one_dataset(db):
#     created_dataset = await dataset_services.create_dataset(
#         db, dataset=base_dataset, username=USERNAME
#     )

#     updated_dataset = await dataset_services.update_one_dataset(
#         db, dataset_id=created_dataset["_id"], username=USERNAME
#     )

# assert


@pytest.mark.asyncio
async def test_create_one_dataset_item(db):
    """Test creating one dataset item"""
    # Create dataset that new dataset item can be associated with
    created_dataset = await create_dataset(db=db)
    dataset_id = created_dataset.id

    created_item = await dataset_services.add_one_dataset_item(
        db,
        item=base_item,
        dataset_id=dataset_id,
        preprocessing=base_preprocessing,
        username=USERNAME,
    )

    assert created_item != None, "Item was not created"


@pytest.mark.asyncio
async def test_find_one_dataset_item(db):
    """Test findng a single item"""

    # Create dataset
    created_dataset = await create_dataset(db=db)
    dataset_id = created_dataset.id

    created_item = await dataset_services.add_one_dataset_item(
        db,
        item=base_item,
        dataset_id=dataset_id,
        preprocessing=base_preprocessing,
        username=USERNAME,
    )

    item = await dataset_services.find_one_dataset_item(db=db, item_id=created_item.id)

    assert item != None, "Item not found"


# @pytest.mark.asyncio
# async def test_find_many_dataset_items(db):
#     # Create two items
#     await dataset_services.add_one_item(
#         db, item=base_item, username=USERNAME
#     )
#     await dataset_services.add_one_item(
#         db, item=base_item, username=USERNAME
#     )

# response = await dataset_services.find_many_dataset_items(db, )


@pytest.mark.asyncio
async def test_delete_one_dataset_item(db):

    # Create dataset
    created_dataset = await create_dataset(db=db)
    dataset_id = created_dataset.id

    created_item = await dataset_services.add_one_dataset_item(
        db,
        item=base_item,
        dataset_id=dataset_id,
        preprocessing=base_preprocessing,
        username=USERNAME,
    )

    assert created_item != None, "Expected item to be created"

    # Delete item
    await dataset_services.delete_one_dataset_item(db=db, item_id=created_item.id)

    # Test if item still exists
    response = await dataset_services.find_one_dataset_item(
        db=db, item_id=created_item.id
    )

    assert response == None, "Item still exists after deletion"


@pytest.mark.asyncio
async def test_filter_dataset_default_filters(db, relation_project):
    """Tests dataset filtering with default filters"""

    # Add relation markup to project
    await create_relation_markup(
        db=db,
        relation_project=relation_project,
        create_entities=True,
        apply_all=True,
        username=USERNAME,
    )

    filtered_dataset = await dataset_services.filter_dataset(
        db=db,
        filters=DatasetFilters(project_id=str(relation_project.id)),
        username=USERNAME,
    )

    print("\n\nfiltered_dataset\n\n", filtered_dataset)

    assert len(filtered_dataset.dataset_items.keys()) == 6
    assert len(filtered_dataset.entities.keys()) == 3
    assert len(filtered_dataset.relations.keys()) == 3
    assert filtered_dataset.total_dataset_items == 6
    assert filtered_dataset.total_pages == 1


@pytest.mark.asyncio
async def test_filter_dataset_varying_limits(db, relation_project):
    """Tests dataset filtering with varying limits"""

    # Add relation markup to project
    await create_relation_markup(
        db=db,
        relation_project=relation_project,
        create_entities=True,
        apply_all=True,
        username=USERNAME,
    )

    filtered_dataset = await dataset_services.filter_dataset(
        db=db,
        filters=DatasetFilters(
            project_id=str(relation_project.id),
            limit=1,
        ),
        username=USERNAME,
    )

    assert len(filtered_dataset.dataset_items.keys()) == 1
    assert len(filtered_dataset.entities.keys()) == 1
    assert len(filtered_dataset.relations.keys()) == 1
    assert filtered_dataset.total_dataset_items == 1
    assert filtered_dataset.total_pages == 1


@pytest.mark.asyncio
async def test_filter_dataset_varying_quality(db, relation_project):
    """Tests dataset filtering with varying markup quality"""

    # Add relation markup to project
    await create_relation_markup(
        db=db,
        relation_project=relation_project,
        create_entities=True,
        apply_all=True,
        username=USERNAME,
    )

    # Filter for accepted markup
    filtered_dataset = await dataset_services.filter_dataset(
        db=db,
        filters=DatasetFilters(
            project_id=str(relation_project.id),
            quality=QualityFilter.accepted,
        ),
        username=USERNAME,
    )

    assert len(filtered_dataset.dataset_items.keys()) == 1
    assert len(filtered_dataset.entities.keys()) == 1
    assert len(filtered_dataset.relations.keys()) == 1
    assert filtered_dataset.total_dataset_items == 1
    assert filtered_dataset.total_pages == 1

    # Filter for suggested markup
    filtered_dataset = await dataset_services.filter_dataset(
        db=db,
        filters=DatasetFilters(
            project_id=str(relation_project.id),
            quality=QualityFilter.suggested,
        ),
        username=USERNAME,
    )

    assert len(filtered_dataset.dataset_items.keys()) == 2
    assert len(filtered_dataset.entities.keys()) == 2
    assert len(filtered_dataset.relations.keys()) == 2
    assert filtered_dataset.total_dataset_items == 2
    assert filtered_dataset.total_pages == 1


@pytest.mark.asyncio
async def test_filter_dataset_varying_save_state(db, relation_project):
    """Tests dataset filtering with varying save state"""

    # Add relation markup to project
    await create_relation_markup(
        db=db,
        relation_project=relation_project,
        create_entities=True,
        apply_all=True,
        username=USERNAME,
    )

    # Save a dataset item
    # - Get random dataset item id
    dataset_item_ids = await dataset_services.find_many_dataset_items(
        db=db, dataset_id=relation_project.dataset_id
    )
    await project_services.save_many_dataset_items(
        db=db,
        project_id=relation_project.id,
        dataset_item_ids=[dataset_item_ids[0].id],
        state=True,
        username=USERNAME,
    )

    # Filter for unsaved dataset items
    filtered_dataset = await dataset_services.filter_dataset(
        db=db,
        filters=DatasetFilters(
            project_id=str(relation_project.id),
            saved=SaveStateFilter.unsaved,
        ),
        username=USERNAME,
    )

    assert len(filtered_dataset.dataset_items.keys()) == 5
    assert len(filtered_dataset.entities.keys()) == 2
    assert len(filtered_dataset.relations.keys()) == 2
    assert filtered_dataset.total_dataset_items == 5
    assert filtered_dataset.total_pages == 1

    # Filter for saved dataset items
    filtered_dataset = await dataset_services.filter_dataset(
        db=db,
        filters=DatasetFilters(
            project_id=str(relation_project.id),
            saved=SaveStateFilter.saved,
        ),
        username=USERNAME,
    )

    assert len(filtered_dataset.dataset_items.keys()) == 1
    assert len(filtered_dataset.entities.keys()) == 1
    assert len(filtered_dataset.relations.keys()) == 1
    assert filtered_dataset.total_dataset_items == 1
    assert filtered_dataset.total_pages == 1


@pytest.mark.asyncio
async def test_filter_dataset_search_term(db, relation_project):
    """Tests dataset filtering with varying search terms"""

    # Add relation markup to project
    await create_relation_markup(
        db=db,
        relation_project=relation_project,
        create_entities=True,
        apply_all=True,
        username=USERNAME,
    )

    # Filter for uncased single word
    filtered_dataset = await dataset_services.filter_dataset(
        db=db,
        filters=DatasetFilters(
            project_id=str(str(relation_project.id)),
            search_term="john",
        ),
        username=USERNAME,
    )

    assert len(filtered_dataset.dataset_items.keys()) == 3
    assert len(filtered_dataset.entities.keys()) == 3
    assert len(filtered_dataset.relations.keys()) == 3
    assert filtered_dataset.total_dataset_items == 3
    assert filtered_dataset.total_pages == 1

    # Filter for cased single word
    filtered_dataset = await dataset_services.filter_dataset(
        db=db,
        filters=DatasetFilters(
            project_id=str(relation_project.id),
            search_term="John",
        ),
        username=USERNAME,
    )

    assert len(filtered_dataset.dataset_items.keys()) == 3
    assert len(filtered_dataset.entities.keys()) == 3
    assert len(filtered_dataset.relations.keys()) == 3
    assert filtered_dataset.total_dataset_items == 3
    assert filtered_dataset.total_pages == 1

    # Filter for phrase
    filtered_dataset = await dataset_services.filter_dataset(
        db=db,
        filters=DatasetFilters(
            project_id=str(relation_project.id),
            search_term="john l smith",
        ),
        username=USERNAME,
    )

    assert len(filtered_dataset.dataset_items.keys()) == 1
    assert len(filtered_dataset.entities.keys()) == 1
    assert len(filtered_dataset.relations.keys()) == 1
    assert filtered_dataset.total_dataset_items == 1
    assert filtered_dataset.total_pages == 1

    # Filter for phrase that doesnt exist
    filtered_dataset = await dataset_services.filter_dataset(
        db=db,
        filters=DatasetFilters(
            project_id=str(relation_project.id),
            search_term="random phrase",
        ),
        username=USERNAME,
    )

    assert filtered_dataset.dataset_items == {}
    assert filtered_dataset.entities == {}
    assert filtered_dataset.relations == {}
    assert filtered_dataset.total_dataset_items == 0
    assert filtered_dataset.total_pages == 0


# TODO: filter with relations
# TODO: filter with bad limit/skip params --> Exception


@pytest.mark.asyncio
async def test_create_system_datasets(db):
    raise NotImplementedError
