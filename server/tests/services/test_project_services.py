import bson
import pytest
from bson import ObjectId
from fastapi import HTTPException

import services.dataset as dataset_services
import services.markup as markup_services
import services.notifications as notification_services
import services.projects as project_services
from models.project import (Annotator, AnnotatorRoles, AnnotatorStates,
                            CreateProject, Project)
from tests.settings import settings
from tests.utils import (create_entity_markup, create_entity_project,
                         create_relation_markup, create_relation_project)

USERNAME = settings.TEST_USERNAME
SECONDARY_TEST_USERNAME = settings.SECONDARY_TEST_USERNAME
NUM_ANNOTATORS = 5


@pytest.mark.asyncio
async def test_flatten_ontology(relation_project):
    """Test converting hierarchical ontology into flat format"""
    ontology = relation_project.ontology
    flat_entity_ontology = project_services.flatten_hierarchical_ontology(
        ontology=ontology.entity
    )
    flat_relation_ontology = project_services.flatten_hierarchical_ontology(
        ontology=ontology.relation
    )
    assert len(flat_entity_ontology) == 4
    assert len(flat_relation_ontology) == 4


@pytest.mark.asyncio
async def test_create_entity_project(entity_project):
    """Tests creation of a single entity project without any additional annotators or preannotation"""
    assert entity_project != None, "Entity project not created"
    assert entity_project.tasks.entity, "Expected entity task to be True"
    assert entity_project.tasks.relation == False, "Expected relation tak to be False"


@pytest.mark.asyncio
async def test_create_relation_project(relation_project):
    """Tests creation of a single entity/relation project without any additional annotators or preannotation"""
    assert relation_project != None, "Relation project not created"
    assert relation_project.tasks.relation, "Expected relation task to be True"
    assert relation_project.tasks.entity, "Expected entity task to be True"
    assert set(relation_project.ontology.dict().keys()) == {
        "entity",
        "relation",
    }, "Expected entity and relation types in ontology"


@pytest.mark.asyncio
async def test_create_entity_project_many_annotators(db):
    """Test project creation with many annotators"""

    # Create project with invited annotators
    project = await create_entity_project(db=db, annotators=NUM_ANNOTATORS)

    # Assert annotators on project and have scope, notifications exist
    assert (
        len(project.annotators) == NUM_ANNOTATORS + 1
    ), f"Expected {NUM_ANNOTATORS+1} project annotators"
    assert all(
        [len(a.scope) == 6 for a in project.annotators]
    ), "Expected six dataset items for each annotators scope"
    assert (
        len([a for a in project.annotators if a.state == AnnotatorStates.invited.value])
        == NUM_ANNOTATORS
    ), f"Expected {NUM_ANNOTATORS} to be invited annotators"
    assert (
        len(
            [a for a in project.annotators if a.state == AnnotatorStates.accepted.value]
        )
        == 1
    ), f"Expected 1 annotator to be accepted"
    assert (
        len([a for a in project.annotators if a.role == AnnotatorRoles.annotator.value])
        == NUM_ANNOTATORS
    ), f"Expected {NUM_ANNOTATORS} users to have the role of `annotator`"
    assert (
        len(
            [
                a
                for a in project.annotators
                if a.role == AnnotatorRoles.project_manager.value
            ]
        )
        == 1
    ), f"Expected 1 user to have the role of `project manager`"

    notifications = await notification_services.find_many_project_notifications(
        db=db, project_id=project.id
    )

    print("notifications", notifications)
    assert (
        len(notifications) == NUM_ANNOTATORS
    ), f"Expected {NUM_ANNOTATORS} notifications"


@pytest.mark.asyncio
async def test_create_entity_project_preannotated(db):
    """Test project creation with preannotated a dataset and predefined ontology resource"""

    project = await create_entity_project(db=db, preannotate=True)

    markups = await markup_services.find_many_markups(
        db=db, project_id=project.id, username=USERNAME
    )

    assert len(markups) == 8, "Expected eight entity markups to be created"
    assert all(
        [m["suggested"] for m in markups]
    ), "Expected all entity markup to be suggested"


@pytest.mark.asyncio
async def test_create_entity_project_preannotated_many_annotators(db):
    """Test project creation with many annotators and a preannotated dataset and predefined ontology resource"""

    # Create project with invited annotators
    project = await create_entity_project(
        db=db, annotators=NUM_ANNOTATORS, preannotate=True
    )

    for username in [a.username for a in project.annotators]:
        markups = await markup_services.find_many_markups(
            db=db, project_id=project.id, username=username
        )
        assert len(markups) == 8, "Expected eight entity markups to be created"
        assert all(
            [m["suggested"] for m in markups]
        ), "Expected all entity markup to be suggested"


@pytest.mark.asyncio
async def test_create_relation_project_preannotated(relation_project):
    """Test project creation with a preannotated dataset and predefined ontology resources"""
    pass


@pytest.mark.asyncio
async def test_create_relation_project_preannotated_many_annotators(relation_project):
    """Test project creation with many annotators and a preannotated dataset and predefined ontology resources"""
    pass


@pytest.mark.asyncio
async def test_find_one_project_user_pm(db, entity_project):
    """Test for finding a single project that the user is a PM of."""

    project = await project_services.find_one_project(
        db=db, project_id=entity_project.id, username=USERNAME
    )

    assert project != None, "Project not found"


@pytest.mark.asyncio
async def test_find_one_project_user_is_annotator_not_pm(db, entity_project):
    """Test for finding a single project when user is project annotator not PM."""
    pass


@pytest.mark.asyncio
async def test_find_one_project_user_not_annotator(db, entity_project):
    """Test for finding a single project that the user is not a project annotator of."""
    with pytest.raises(expected_exception=HTTPException):
        await project_services.find_one_project(
            db=db, project_id=entity_project.id, username="random"
        )


@pytest.mark.asyncio
async def test_find_many_projects(db):
    """Tests listing multiple projects created by single user."""
    # Create multiple projects
    await create_entity_project(db=db)
    await create_entity_project(db=db)

    # Add annotators to project
    # TODO: implement - this will ensure that the `annotators` and `saved_items` properties can be properly validated

    # Add save states onto project
    # TODO: implement - this will ensure that the `saved_items` property can be properly validated

    response = await project_services.find_many_projects(db=db, username=USERNAME)

    assert len(response) == 2, "Unexpected number of projects found"


@pytest.mark.asyncio
async def test_find_many_projects_none_exist(db):
    """Test find many projects when no projects created."""

    with pytest.raises(expected_exception=HTTPException):
        await project_services.find_many_projects(db=db, username=USERNAME)


@pytest.mark.asyncio
async def test_delete_one_project_invalid_project_id(db):
    """Test for deleting project where project_id is invalid"""
    random_project_id = bson.objectid.ObjectId()
    with pytest.raises(expected_exception=HTTPException):
        await project_services.delete_one_project(
            db=db, project_id=random_project_id, username=USERNAME
        )


@pytest.mark.asyncio
async def test_delete_one_entity_project(db, entity_project):
    """Test deletion of a single entity project"""

    project_id = entity_project.id

    # Add entity markup to the project
    await create_entity_markup(db=db, entity_project=entity_project, apply_all=True)

    # Delete project
    await project_services.delete_one_project(
        db=db, project_id=project_id, username=USERNAME
    )

    # Assert project and its artifacts do not exist
    with pytest.raises(expected_exception=HTTPException):
        await project_services.find_one_project(
            db=db, project_id=project_id, username=USERNAME
        )

    markups = await markup_services.find_many_markups(
        db=db, project_id=project_id, username=USERNAME
    )

    assert markups == [], "Markup still exists after project deletion"


@pytest.mark.asyncio
async def test_delete_one_relation_project(db, relation_project):
    """Test deletion of a single relation project"""

    project_id = relation_project.id

    # Add relation markup to the project
    await create_relation_markup(
        db=db, relation_project=relation_project, create_entities=True, apply_all=True
    )

    # Delete project
    await project_services.delete_one_project(
        db, project_id=project_id, username=USERNAME
    )

    # Assert project and its artifacts do not exist
    with pytest.raises(expected_exception=HTTPException):
        await project_services.find_one_project(
            db, project_id=project_id, username=USERNAME
        )

    markups = await markup_services.find_many_markups(
        db=db, project_id=project_id, username=USERNAME
    )

    assert markups == [], "Markup still exists after project deletion"


@pytest.mark.asyncio
async def test_save_one_item(db, entity_project):
    """Test for settings the save state of a dataset item - this is staked against a project_id"""

    # Get dataset_item_id to save
    dataset_id = entity_project.dataset_id
    dataset_items = await dataset_services.find_many_dataset_items(
        db=db, dataset_id=dataset_id
    )
    dataset_item = dataset_items[0]

    updated_project = await project_services.save_many_dataset_items(
        db=db,
        project_id=entity_project.id,
        dataset_item_ids=[dataset_item.id],
        state=True,
        username=USERNAME,
    )

    assert (
        len(updated_project.save_states) == 1
    ), "Unexpected number of save states created"


@pytest.mark.asyncio
async def test_save_many_items(db, entity_project):
    """Test for settings the save state of many dataset items"""
    # Get dataset_item_ids to save
    dataset_id = entity_project.dataset_id
    dataset_items = await dataset_services.find_many_dataset_items(
        db=db, dataset_id=dataset_id
    )

    dataset_item_ids = [di.id for di in dataset_items]

    updated_project = await project_services.save_many_dataset_items(
        db=db,
        project_id=entity_project.id,
        dataset_item_ids=dataset_item_ids,
        state=True,
        username=USERNAME,
    )

    assert len(updated_project.save_states) == len(
        dataset_items
    ), "Unexpected number of save states created"


@pytest.mark.asyncio
async def test_unsave_one_item(db, entity_project):
    """Test saving and unsaving a single dataset item"""
    # Save item
    dataset_id = entity_project.dataset_id
    dataset_items = await dataset_services.find_many_dataset_items(
        db=db, dataset_id=dataset_id
    )
    dataset_item = dataset_items[0]

    updated_project = await project_services.save_many_dataset_items(
        db=db,
        project_id=entity_project.id,
        dataset_item_ids=[dataset_item.id],
        state=True,
        username=USERNAME,
    )

    assert (
        len(updated_project.save_states) == 1
    ), "Unexpected number of save states created"

    # Unsave item
    await project_services.save_many_dataset_items(
        db=db,
        project_id=entity_project.id,
        dataset_item_ids=[dataset_item.id],
        state=False,
        username=USERNAME,
    )

    updated_project = await project_services.find_one_project(
        db=db, project_id=entity_project.id, username=USERNAME
    )

    # Check that item doesnt exist
    assert (
        len(updated_project.save_states) == 0
    ), "Save states still exist after deletion"


@pytest.mark.asyncio
async def test_unsave_many_items(db, entity_project):
    """Test saving and unsaving many dataset item"""

    # Get dataset_item_ids to save
    dataset_id = entity_project.dataset_id
    dataset_items = await dataset_services.find_many_dataset_items(
        db=db, dataset_id=dataset_id
    )

    dataset_item_ids = [di.id for di in dataset_items]

    updated_project = await project_services.save_many_dataset_items(
        db=db,
        project_id=entity_project.id,
        dataset_item_ids=dataset_item_ids,
        state=True,
        username=USERNAME,
    )

    assert len(updated_project.save_states) == len(
        dataset_items
    ), "Unexpected number of save states created"

    # Unsave item
    await project_services.save_many_dataset_items(
        db=db,
        project_id=entity_project.id,
        dataset_item_ids=dataset_item_ids,
        state=False,
        username=USERNAME,
    )

    updated_project = await project_services.find_one_project(
        db=db, project_id=entity_project.id, username=USERNAME
    )

    # Check that item doesnt exist
    assert (
        len(updated_project.save_states) == 0
    ), "Save states still exist after deletion"


@pytest.mark.asyncio
async def test_project_annotator_exists_has_annotator(db, entity_project):
    """Test for project annotator existence when annotator does exist"""

    annotator = await project_services.get_project_annotator(
        db=db, project_id=entity_project.id, username=USERNAME
    )

    assert annotator != None, "Expected annotator to exist"
    assert (
        annotator.role == AnnotatorRoles.project_manager.value
    ), "Expected annotator to be PM"


@pytest.mark.asyncio
async def test_project_annotator_exists_no_annotator(db, entity_project):
    """Test for project annotator existence when annotator does not exist"""

    annotator = await project_services.get_project_annotator(
        db=db, project_id=entity_project.id, username=SECONDARY_TEST_USERNAME
    )

    assert annotator == None, "Expected no annotator to exist"


@pytest.mark.asyncio
async def test_invite_single_project_annotator(db, entity_project):
    """Test for inviting a single project annotator to a project"""

    invited_annotator = await project_services.invite_single_project_annotator(
        db=db,
        project_id=entity_project.id,
        invitee_username=SECONDARY_TEST_USERNAME,
        username=USERNAME,
    )

    assert len(invited_annotator.scope) == 6, "Expected scope to have six dataset items"
    assert (
        invited_annotator.role == AnnotatorRoles.annotator.value
    ), "Expected annotator to have `annotator` role"
    assert (
        invited_annotator.state == AnnotatorStates.invited.value
    ), "Expected annotator state to be `invited`"


@pytest.mark.asyncio
async def test_invite_single_project_annotator_not_pm(db, entity_project):
    """Test for inviting an annotator to a project when not a PM."""

    with pytest.raises(expected_exception=HTTPException):
        await project_services.invite_single_project_annotator(
            db=db,
            project_id=entity_project.id,
            invitee_username=SECONDARY_TEST_USERNAME,
            username="dummy",
        )


@pytest.mark.asyncio
async def test_invite_single_project_annotator_already_exists(db, entity_project):
    """Test for inviting a single project anntator who already exists on the specified project"""

    # Invite secondary annotator
    await project_services.invite_single_project_annotator(
        db=db,
        project_id=entity_project.id,
        invitee_username=SECONDARY_TEST_USERNAME,
        username=USERNAME,
    )

    # Invite same annotator
    with pytest.raises(expected_exception=HTTPException):
        await project_services.invite_single_project_annotator(
            db=db,
            project_id=entity_project.id,
            invitee_username=SECONDARY_TEST_USERNAME,
            username=USERNAME,
        )


@pytest.mark.asyncio
async def test_invite_many_project_annotators(db, entity_project):
    """Test for inviting many project annotators to a project"""
    pass


@pytest.mark.asyncio
async def test_delete_single_project_annotator_not_exist(db, entity_project):
    """Test for deleting a single project annotator that does not exist on the respective project"""

    with pytest.raises(expected_exception=HTTPException):
        await project_services.delete_single_project_annotator(
            db=db,
            project_id=entity_project.id,
            annotator_username="random",
            username=USERNAME,
        )


@pytest.mark.asyncio
async def test_delete_single_project_annotator_project_not_exist(db):
    """Test for deleting a single project annotator on a project that does not exist"""

    random_project_id = bson.objectid.ObjectId()

    with pytest.raises(expected_exception=HTTPException):
        await project_services.delete_single_project_annotator(
            db=db,
            project_id=random_project_id,
            annotator_username=SECONDARY_TEST_USERNAME,
            username=USERNAME,
        )


@pytest.mark.asyncio
async def test_delete_single_project_annotator(db, entity_project):
    """Test for deleting/removing single project annotator from a project"""

    project_id = entity_project.id

    # Invite secondary annotator
    await project_services.invite_single_project_annotator(
        db=db,
        project_id=project_id,
        invitee_username=SECONDARY_TEST_USERNAME,
        username=USERNAME,
    )

    # Create markups as secondary annotator
    await create_entity_markup(
        db=db, entity_project=entity_project, username=SECONDARY_TEST_USERNAME
    )

    # Delete secondary annotator
    await project_services.delete_single_project_annotator(
        db=db,
        project_id=project_id,
        annotator_username=SECONDARY_TEST_USERNAME,
        username=USERNAME,
    )

    # Assert annotator, notifications and markup do not exist
    project_annotator = await project_services.get_project_annotator(
        db=db, project_id=project_id, username=SECONDARY_TEST_USERNAME
    )

    assert project_annotator == None, "Expected annotator to be deleted"

    markups = await markup_services.find_many_markups(
        db=db, project_id=project_id, username=SECONDARY_TEST_USERNAME
    )

    assert markups == [], "Expected no markup to exist for deleted annotator"

    notifications = await notification_services.find_many_project_notifications(
        db=db, project_id=project_id, username=SECONDARY_TEST_USERNAME
    )

    assert (
        notifications == []
    ), "Expected no project-specific notifications for deleted annotator to exist"


@pytest.mark.asyncio
async def test_update_single_project_annotator_dataset_item_scope(db, entity_project):
    """Test for updating a single project annotators dataset item scope"""
    pass


#  --------- TODO --------------
# TODO: Test user B cannot modify user A's project

# TODO: add projects and invite other annotators - check whether other annotators can see these projects in their project lists after accepting
# TODO: add projects and disable other annotators - check whether other annotators can see these projects in their project lists (they shouldnt)
