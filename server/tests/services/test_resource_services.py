# Note: VSCode has issues activating venv before running pytest
# Third party modules are installed globally
# TODO: Resolve dependency issues...

import pytest
import quickgraph.services.resources as resource_services
from quickgraph.models.resources import ResourceModel

from system_resources import resources as default_system_resources
from tests.data import (entity_resource, preannotation_resource,
                        relation_resource, update_entity_ontology)
from tests.settings import settings

USERNAME = settings.TEST_USERNAME
SYSTEM_USERNAME = settings.SYSTEM_USERNAME


def test_add_hierarchical_names_and_paths():
    data = [
        {
            "name": "Cat",
            "id": "1",
            "color": "red",
            "placeholder": "",
            "description": "",
            "active": True,
            "children": [
                {
                    "name": "BigCat",
                    "id": "1.1",
                    "color": "red",
                    "placeholder": "",
                    "description": "",
                    "active": True,
                    "children": [],
                },
                {
                    "name": "SmallCat",
                    "id": "1.2",
                    "color": "red",
                    "placeholder": "",
                    "description": "",
                    "active": True,
                    "children": [],
                },
            ],
        },
        {
            "name": "Dog",
            "id": "2",
            "color": "black",
            "placeholder": "",
            "description": "",
            "active": True,
            "children": [
                {
                    "name": "BigDog",
                    "id": "2.1",
                    "color": "red",
                    "placeholder": "",
                    "description": "",
                    "active": True,
                    "children": [],
                },
                {
                    "name": "SmallDog",
                    "id": "2.2",
                    "color": "red",
                    "placeholder": "",
                    "description": "",
                    "active": True,
                    "children": [],
                },
            ],
        },
    ]
    modified_data = resource_services.add_hierarchical_names_and_paths(data)
    assert modified_data == [
        {
            "name": "Cat",
            "id": "1",
            "color": "red",
            "placeholder": "",
            "description": "",
            "active": True,
            "children": [
                {
                    "name": "BigCat",
                    "id": "1.1",
                    "color": "red",
                    "placeholder": "",
                    "description": "",
                    "active": True,
                    "children": [],
                    "fullname": "Cat/BigCat",
                    "path": "1/1.1",
                },
                {
                    "name": "SmallCat",
                    "id": "1.2",
                    "color": "red",
                    "placeholder": "",
                    "description": "",
                    "active": True,
                    "children": [],
                    "fullname": "Cat/SmallCat",
                    "path": "1/1.2",
                },
            ],
            "fullname": "Cat",
            "path": "1",
        },
        {
            "name": "Dog",
            "id": "2",
            "color": "black",
            "placeholder": "",
            "description": "",
            "active": True,
            "children": [
                {
                    "name": "BigDog",
                    "id": "2.1",
                    "color": "red",
                    "placeholder": "",
                    "description": "",
                    "active": True,
                    "children": [],
                    "fullname": "Dog/BigDog",
                    "path": "2/2.1",
                },
                {
                    "name": "SmallDog",
                    "id": "2.2",
                    "color": "red",
                    "placeholder": "",
                    "description": "",
                    "active": True,
                    "children": [],
                    "fullname": "Dog/SmallDog",
                    "path": "2/2.2",
                },
            ],
            "fullname": "Dog",
            "path": "2",
        },
    ]


# @pytest_asyncio.fixture()
# async def fx_create_one_resource(db):
#     """Fixture for creates a new resource"""
#   # TODO: write these fixtures...


@pytest.mark.asyncio
async def test_find_one_resource(db):
    # Create resource - NOTE: violating DRY - refactor after tests have been developed.
    created_resource = await resource_services.create_one_resource(
        db=db, resource=entity_resource, username=USERNAME
    )

    resource = await resource_services.find_one_resource(
        db, resource_id=created_resource["_id"], username=USERNAME
    )

    assert resource != None, "Resource not found"


@pytest.mark.asyncio
async def test_find_many_resources(db):
    # Create resources
    await resource_services.create_one_resource(
        db=db, resource=entity_resource, username=USERNAME
    )
    await resource_services.create_one_resource(
        db=db, resource=relation_resource, username=USERNAME
    )
    await resource_services.create_one_resource(
        db=db, resource=preannotation_resource, username=USERNAME
    )
    # await resource_services.create_one_resource(
    #     db=db, resource=relation_resource, username=USERNAME
    # )

    response_agg_false = await resource_services.find_many_resources(
        db=db, username=USERNAME, aggregate=False
    )
    assert isinstance(response_agg_false, list), "Normal data structure is incorrect"
    assert len(response_agg_false) == 3, "Incorrect elements in normal data"

    # Test aggregate=True
    response_agg_true = await resource_services.find_many_resources(
        db=db, username=USERNAME, aggregate=True
    )

    # Agg True
    assert isinstance(response_agg_true, dict), "Aggregated data structure is incorrect"
    assert {"ontology", "preannotation"} == set(
        response_agg_true.keys()
    ), "Aggregated data missing classification keys"
    assert {"entity", "relation"} == set(
        response_agg_true["ontology"].keys()
    ), "Aggregated data missing ontology sub classification keys"


@pytest.mark.asyncio
async def test_create_one_ontology_resource(db):
    """Test to create a single ontology resource"""
    created_resource = await resource_services.create_one_resource(
        db=db, resource=entity_resource, username=USERNAME
    )
    new_resource = await resource_services.find_one_resource(
        db=db, resource_id=created_resource["_id"], username=USERNAME
    )

    # Assert that resource exists in db
    assert new_resource, "Resource was not created"
    # Assert that username was added to resource by service function
    assert new_resource["created_by"] == USERNAME, "Username not assigned to resource"


@pytest.mark.asyncio
async def test_create_one_preannotation_resource(db):
    """Test to create a single preannotation resource"""
    created_resource = await resource_services.create_one_resource(
        db=db, resource=preannotation_resource, username=USERNAME
    )
    new_resource = await resource_services.find_one_resource(
        db=db, resource_id=created_resource["_id"], username=USERNAME
    )

    # Assert that resource exists in db
    assert new_resource, "Resource was not created"
    # Assert that username was added to resource by service function
    assert new_resource["created_by"] == USERNAME, "Username not assigned to resource"


@pytest.mark.asyncio
async def test_delete_resource(db):
    # Create resource - NOTE: violating DRY - refactor after tests have been developed.
    created_resource = await resource_services.create_one_resource(
        db=db, resource=entity_resource, username=USERNAME
    )
    resource_id = created_resource["_id"]

    # Delete resource
    await resource_services.delete_one_resource(
        db=db, resource_id=resource_id, username=USERNAME
    )

    # Test existence of resource after deletion
    response = await resource_services.find_one_resource(
        db=db, resource_id=resource_id, username=USERNAME
    )

    # Assert it does not exist.
    assert response == None, "Resource still exists after deletion"


@pytest.mark.asyncio
async def test_update_ontology_resource(db):
    # Create resource - NOTE: violating DRY - refactor after tests have been developed.
    created_resource = await resource_services.create_one_resource(
        db=db, resource=entity_resource, username=USERNAME
    )
    # print("original resource", created_resource)

    # Update fields of created resource
    created_resource["ontology"] = [i.dict() for i in update_entity_ontology]
    new_resource = ResourceModel(**created_resource)
    # print("new resource", new_resource)

    updated_resource = await resource_services.update_one_resource(
        db=db, resource=new_resource, username=USERNAME
    )
    # print("updated_resource", updated_resource)

    assert updated_resource != None, "Resource was not returned after update"

    assert set([i.name for i in update_entity_ontology]) == set(
        [i["name"] for i in updated_resource["ontology"]]
    ), "Ontology not updated correctly - missing expected names"


@pytest.mark.asyncio
async def test_aggregate_system_and_user_resources(db):
    """"""

    for resource in default_system_resources:
        # Create system resources
        await resource_services.create_one_resource(
            db=db, resource=resource, username=SYSTEM_USERNAME
        )
        # Create user resources
        await resource_services.create_one_resource(
            db=db, resource=resource, username=USERNAME
        )

    aggregated_resources = await resource_services.aggregate_system_and_user_resources(
        db=db, username=USERNAME
    )

    assert set(aggregated_resources.keys()) - {"ontology", "preannotation"} == set()
    assert (
        set(aggregated_resources["ontology"].keys()) - {"entity", "relation"} == set()
    )
    assert (
        set(aggregated_resources["ontology"]["entity"].keys())
        - {SYSTEM_USERNAME, USERNAME}
        == set()
    )
    assert (
        set(aggregated_resources["ontology"]["relation"].keys())
        - {SYSTEM_USERNAME, USERNAME}
        == set()
    )


@pytest.mark.asyncio
async def test_aggregate_system_and_user_preannotation_resources(db):
    pass


@pytest.mark.asyncio
async def test_create_system_resources(db):
    """Tests creation of resources from system presets"""
    await resource_services.create_system_resources(db=db)

    resources = await resource_services.find_many_resources(
        db=db, aggregate=False, username=SYSTEM_USERNAME
    )
    assert len(resources) == len(default_system_resources)


@pytest.mark.asyncio
async def test_create_system_resources_already_exist(db):
    """Tests creation of system resources when they already exist in database"""

    # Create system resources
    await resource_services.create_system_resources(db=db)
    # Try to create system resources again
    await resource_services.create_system_resources(db=db)

    resources = await resource_services.find_many_resources(
        db=db, aggregate=False, username=SYSTEM_USERNAME
    )
    assert len(resources) == len(default_system_resources)
