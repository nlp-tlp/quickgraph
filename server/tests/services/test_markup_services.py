"""
Tests for markup services
"""

import itertools

import bson
import pytest
from bson import ObjectId
from fastapi import HTTPException

import services.dataset as dataset_services
import services.markup as markup_services
import services.projects as project_services
from tests.settings import settings
from tests.utils import (create_entity_markup, create_relation_markup,
                         get_first_output_entity_markup)

USERNAME = settings.TEST_USERNAME


@pytest.mark.asyncio
async def test_get_human_readable_markup_label(db, relation_project):
    """"""
    entity_label_name = await markup_services.get_human_readable_markup_label(
        db=db,
        project_id=relation_project.id,
        classification="entity",
        ontology_item_id=relation_project.ontology.entity[0].id,
    )

    relation_label_name = await markup_services.get_human_readable_markup_label(
        db=db,
        project_id=relation_project.id,
        classification="relation",
        ontology_item_id=relation_project.ontology.entity[0].id,
    )

    assert (
        entity_label_name == relation_project.ontology.entity[0].name
    ), "Incorrect entity label name returned"
    assert (
        relation_label_name == relation_project.ontology.relation[0].name
    ), "Incorrect relation label name returned"


@pytest.mark.asyncio
async def test_find_one_markup(db, entity_project):
    created_markup, _ = await create_entity_markup(db=db, entity_project=entity_project)
    markup_id = get_first_output_entity_markup(created_markup).id
    markup = await markup_services.find_one_markup(
        db=db, markup_id=markup_id, username=USERNAME
    )
    assert markup != None, "Markup not found"


@pytest.mark.asyncio
async def test_find_many_markups(db, entity_project):
    # Create multiple markup (Need to give different spans as duplicates cannot be created)
    await create_entity_markup(
        db=db, entity_project=entity_project, span_start=0, span_end=1
    )
    await create_entity_markup(
        db=db, entity_project=entity_project, span_start=0, span_end=2
    )

    all_markup = await markup_services.find_many_markups(
        db=db, project_id=entity_project.id, username=USERNAME
    )
    assert len(all_markup) == 2, "Unexpected number of markup returned"


@pytest.mark.asyncio
async def test_update_one_markup(db, entity_project):
    """Updates a field on existing markup document"""
    created_markup, _ = await create_entity_markup(
        db=db, entity_project=entity_project, suggested=True
    )

    updated_markup = await markup_services.update_one_markup(
        db=db,
        markup_id=get_first_output_entity_markup(created_markup).id,
        field="suggested",
        value=False,
        username=USERNAME,
    )

    assert (
        updated_markup["suggested"] == False
    ), "Markup `suggestion` key not updated to False"


@pytest.mark.asyncio
async def test_apply_single_entity_annotation(db, entity_project):
    created_markup, default_entity_markup = await create_entity_markup(
        db=db, entity_project=entity_project
    )

    print("created_markup", created_markup)

    assert created_markup != None, "Markup not created"
    assert created_markup.count == 1, "Single markup not created"
    assert created_markup.relations == {}, "Relations created with entity markup"
    assert (
        get_first_output_entity_markup(created_markup).surface_form
        == default_entity_markup["surface_form"]
    ), "Unexpected markup surface form"


@pytest.mark.asyncio
async def test_apply_annotation_dataset_item_not_valid(db, entity_project):
    random_dataset_item_id = str(bson.objectid.ObjectId())
    with pytest.raises(expected_exception=HTTPException):
        await create_entity_markup(
            db=db, entity_project=entity_project, dataset_item_id=random_dataset_item_id
        )


@pytest.mark.asyncio
async def test_apply_duplicate_single_entity_annotation(db, entity_project):
    """Test for apply the same entity annotation on a span of text. No entity should be created."""
    await create_entity_markup(db, entity_project, suggested=False)
    duplicate_markup, _ = await create_entity_markup(db, entity_project)
    assert duplicate_markup == None, "Unexpected return of markup"


@pytest.mark.asyncio
async def test_apply_single_entity_annotation_to_suggestion(db, entity_project):
    """Test for applying entity annotation to suggested span. This should convert suggestion into accepted form."""

    suggested_markup, _ = await create_entity_markup(db, entity_project, suggested=True)
    assert (
        get_first_output_entity_markup(suggested_markup).suggested == True
    ), "Expected suggested markup to have `suggested` key set to True"

    # Apply second, identical, single annotation as not accepted
    updated_markup, _ = await create_entity_markup(db, entity_project, suggested=False)
    assert (
        get_first_output_entity_markup(updated_markup).suggested == False
    ), "Suggested state did not change after applying accepted markup"

    # TODO: Assert that only one markup exists in the `markup` collection
    all_markup = await markup_services.find_many_markups(
        db=db, project_id=entity_project.id, username=USERNAME
    )

    assert len(all_markup) == 1, "Unexpected number of markup created"


@pytest.mark.asyncio
async def test_apply_annotation_invalid_project_id(db):
    # TODO: implement - currently difficult as need to make a markup item which is done in fixture.
    # with pytest.raises(expected_exception=HTTPException):
    #     await create_entity_markup(
    #         db=db, entity_project=entity_project, dataset_item_id=random_dataset_item_id
    #     )
    pass


@pytest.mark.asyncio
async def test_accept_single_entity_annotation(db, entity_project):

    # Create single suggested markup
    suggested_markup, _ = await create_entity_markup(db, entity_project, suggested=True)

    print("suggested_markup", suggested_markup)

    assert (
        get_first_output_entity_markup(suggested_markup).suggested == True
    ), "Expected suggested markup to have `suggested` key set to True"

    # Accept markup
    accepted_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=ObjectId(get_first_output_entity_markup(suggested_markup).id),
        username=USERNAME,
    )
    print("accepted_markup", accepted_markup)

    # Check that markup has `suggested` state changed to `True`
    assert (
        accepted_markup.suggested == False
    ), "Suggested state did not change after accepting markup"


@pytest.mark.asyncio
async def test_accept_single_entity_annotation_invalid_markup_id(db, entity_project):
    """Tests acccepting a suggested entity when using an invalid/incorrect markup id or the markup does not exist. Service should throw a HTTP exception."""

    random_markup_id = bson.objectid.ObjectId()
    with pytest.raises(expected_exception=HTTPException):
        await markup_services.accept_annotation(
            db=db,
            markup_id=random_markup_id,
            username=USERNAME,
        )


@pytest.mark.asyncio
async def test_delete_single_entity_annotation(db, entity_project):
    created_markup, _ = await create_entity_markup(db=db, entity_project=entity_project)

    markup_id = get_first_output_entity_markup(created_markup).id

    # Delete markup
    deleted_markup = await markup_services.delete_annotation(
        db=db,
        markup_id=markup_id,
        username=USERNAME,
    )

    print("deleted_markup", deleted_markup)
    assert deleted_markup.count == 1, "Expected one markup to be deleted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
            ]
        )
        == 1
    ), "Expected one markup to be deleted"

    assert deleted_markup.relations == {}, "Expected no relation markup to be deleted"

    # Check if it exists
    existing_markup = await markup_services.find_one_markup(
        db=db, markup_id=markup_id, username=USERNAME
    )

    # Assert that markup doesnt exist
    assert existing_markup == None, "Markup not deleted"


@pytest.mark.asyncio
async def test_delete_single_entity_annotation_invalid_markup_id(db):
    random_markup_id = bson.objectid.ObjectId()
    with pytest.raises(expected_exception=HTTPException):
        await markup_services.delete_annotation(
            db=db, markup_id=random_markup_id, username=USERNAME
        )


@pytest.mark.asyncio
async def test_delete_single_entity_annotation_with_accepted_relation(
    db, relation_project
):
    """Deletes an entity that has a accepted relation assigned to it. This deletes the relation."""

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    # Add relation between src/tgt
    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=False,
    )

    assert created_markup.count == 1, "Expected one markup to be created"
    assert created_markup.entities == {}, "Entities should not be created"
    assert (
        len(created_markup.relations[str(dataset_item_id)]) == 1
    ), "Expected one relation to exist"

    # Delete source entity
    deleted_markup = await markup_services.delete_annotation(
        db=db, markup_id=source_id, username=USERNAME
    )

    print("deleted_markup", deleted_markup)

    assert (
        deleted_markup.count == 1
    ), "Expected one markup to be deleted"  # TODO: update counts to be for ALL markup; give more rich information...
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(deleted_markup.entities.values())
                )
            ]
        )
        == 1
    ), "Expected one entity markup to be deleted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(deleted_markup.relations.values())
                )
            ]
        )
        == 1
    ), "Expected one relation markup to be deleted"


@pytest.mark.asyncio
async def test_delete_single_entity_annotation_with_suggested_relation(
    db, relation_project
):
    """Deletes an entity that has an suggested relation assigned to it. This deletes the relation."""
    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    # Add many relations between src/tgt candidates
    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Find entity associated with suggested relation
    suggested_relation = await db["markup"].find_one(
        {
            "project_id": relation_project.id,
            "created_by": USERNAME,
            "classification": "relation",
            "suggested": True,
        }
    )

    # Delete source entity on suggested relation
    deleted_markup = await markup_services.delete_annotation(
        db=db, markup_id=suggested_relation["source_id"], username=USERNAME
    )

    print("deleted_markup", deleted_markup)

    assert (
        deleted_markup.count == 1
    ), "Expected one markup to be deleted"  # TODO: update counts to be for ALL markup; give more rich information...
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(deleted_markup.entities.values())
                )
            ]
        )
        == 1
    ), "Expected one entity markup to be deleted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(deleted_markup.relations.values())
                )
            ]
        )
        == 1
    ), "Expected one relation markup to be deleted"


@pytest.mark.asyncio
async def test_apply_multiple_entity_annotation_no_existing_annotation(
    db, entity_project
):
    """Applies multiple entity markups on a set of dataset items that have no prior entity markup"""
    created_markup, _ = await create_entity_markup(
        db=db, entity_project=entity_project, apply_all=True
    )
    assert created_markup.count == 3, "Unexpected number of markup created"  # 2x1 + 1x1
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 1
    ), "Expected one entity to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 2
    ), "Expected two entities to be suggested"

    created_entity_markups = list(
        itertools.chain.from_iterable(created_markup.entities.values())
    )

    assert (
        len([m for m in created_entity_markups if not m.suggested]) == 1
    ), "Accepted markup was not created"
    assert (
        len([m for m in created_entity_markups if m.suggested])
        == len(created_entity_markups) - 1
    ), "Unexpected number of suggested markups created"


@pytest.mark.asyncio
async def test_apply_multiple_entity_annotation_no_existing_annotation_one_save(
    db, entity_project
):
    """Applies multiple entity markups on a set of dataset items that have no prior entity markup but with one document saved"""

    # Create saved document to test that markup is not being applied (it is being protected)
    dataset_id = entity_project.dataset_id
    dataset_items = await dataset_services.find_many_dataset_items(
        db=db, dataset_id=dataset_id
    )

    dataset_item_id = dataset_items[0].id

    updated_project = await project_services.save_many_dataset_items(
        db=db,
        project_id=entity_project.id,
        dataset_item_ids=[dataset_item_id],
        state=True,
        username=USERNAME,
    )

    print("project after saving dataset item", updated_project)

    created_markup, _ = await create_entity_markup(
        db=db, entity_project=entity_project, apply_all=True
    )

    print("created_markup", created_markup)

    assert (
        created_markup.count == 3
    ), "Expected three entity markups to be created"  # 1x1 + 1x1
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 1
    ), "Expect one entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be suggested"


@pytest.mark.asyncio
async def test_apply_multiple_entity_annotation_no_existing_annotation_all_saved(
    db, entity_project
):
    """Applies multiple entity markups on a set of dataset items that are all saved. This will only
    create a single entity."""

    # Create saved document to test that markup is not being applied (it is being protected)
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
    ), "Expected all items to have save states"
    created_markup, _ = await create_entity_markup(
        db=db, entity_project=entity_project, apply_all=True
    )
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 1
    ), "Expect one entities to be accepted"


@pytest.mark.asyncio
async def test_apply_multiple_entity_annotation_one_accepted_existing(
    db, entity_project
):
    """Applies multiple entity markups on a set of dataset items where one existing accepted markup exists."""
    await create_entity_markup(db=db, entity_project=entity_project, suggested=False)
    created_markup, _ = await create_entity_markup(
        db=db, entity_project=entity_project, apply_all=True
    )
    assert created_markup.count == 2, "Unexpected number of entity markups created"


@pytest.mark.asyncio
async def test_apply_multiple_entity_annotation_all_accepted(db, entity_project):
    """Applies multiple entity markups on a set of dataset items where all items have existing markup."""

    # Apply accepted markups into dataset items
    created_markups, _ = await create_entity_markup(
        db=db, entity_project=entity_project, apply_all=True, suggested=False
    )
    # Accept markups
    # Get markup_id (any will do)
    markup_id = get_first_output_entity_markup(created_markups).id
    await markup_services.accept_annotation(
        db=db,
        markup_id=markup_id,
        username=USERNAME,
        apply_all=True,
    )

    # Try to apply multiple annotations again
    created_markups, _ = await create_entity_markup(
        db=db, entity_project=entity_project, apply_all=True, suggested=False
    )
    assert created_markups == None, "Markup created when none should be"


@pytest.mark.asyncio
async def test_apply_multiple_entity_annotation_one_suggested_existing(
    db, entity_project
):
    """Applies multiple entity markups on a set of dataset items where one existing suggested markup exists."""
    # Create single suggested entity markup
    await create_entity_markup(db=db, entity_project=entity_project, suggested=True)

    # Apply multiple apply; this will kickoff from the same suggested entity markup.
    created_markup, _ = await create_entity_markup(
        db=db, entity_project=entity_project, apply_all=True
    )

    created_entity_markups = list(
        itertools.chain.from_iterable(created_markup.entities.values())
    )

    assert created_markup.count == 3, "Expected three entity markups to be created"
    assert len(
        [m for m in created_entity_markups if not m.suggested]
    ), "Expected one accepted markup to exist"
    assert len(
        [m for m in created_entity_markups if m.suggested]
    ), "Expected three suggested markup to exist"


@pytest.mark.asyncio
async def test_apply_multiple_entity_annotation_all_suggested(db, entity_project):
    """Applies multiple entity markups on a set of dataset items where all items have suggested markup."""

    await create_entity_markup(
        db=db, entity_project=entity_project, suggested=True, apply_all=True
    )
    created_markup, _ = await create_entity_markup(
        db=db, entity_project=entity_project, suggested=False, apply_all=True
    )
    assert (
        created_markup.count == 2
    ), "Expected two entity markups to be created"  # First entity is not suggested, it is set as expected.
    assert all(
        [
            not m.suggested
            for m in list(
                itertools.chain.from_iterable(created_markup.entities.values())
            )
        ]
    ), "Suggested markup still exist"


@pytest.mark.asyncio
async def test_accept_many_entity_annotations(db, entity_project):

    # Create many suggested markups
    created_markups, _ = await create_entity_markup(
        db=db, entity_project=entity_project, suggested=True, apply_all=True
    )

    # Get markup_id (any will do)
    # print("created_markups", created_markups)
    markup_id = get_first_output_entity_markup(created_markups).id

    new_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=markup_id,
        username=USERNAME,
        apply_all=True,
    )

    assert new_markup.count == 2, "Expected two entity markups to be accepted"
    assert all(
        [
            not m.suggested
            for m in list(itertools.chain.from_iterable(new_markup.entities.values()))
        ]
    ), "Suggested markup still exist"


@pytest.mark.asyncio
async def test_accept_many_entity_annotations_all_accepted(db, entity_project):
    """Try to accept markups after they are already accepted"""

    # Create many markups   (first is accepted, remainder are suggested)
    created_markups, _ = await create_entity_markup(
        db=db, entity_project=entity_project, apply_all=True
    )

    # Accept all markups
    markup_id = get_first_output_entity_markup(created_markups).id
    new_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=markup_id,
        username=USERNAME,
        apply_all=True,
    )

    assert new_markup.count == 2, "Expected two entity markups to be accepted"
    assert all(
        [
            not m.suggested
            for m in list(itertools.chain.from_iterable(new_markup.entities.values()))
        ]
    ), "Suggested markup still exist"

    # Try to accept again
    markup_id = get_first_output_entity_markup(created_markups).id
    new_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=markup_id,
        username=USERNAME,
        apply_all=True,
    )

    assert new_markup == None, "Expected no markups to be created"


@pytest.mark.asyncio
async def test_delete_many_suggested_entity_annotations_from_accepted_entity(
    db, entity_project
):
    """
    Delete markups where one is accepted and the rest are suggested. Delete is initiated from accepted entity. Should remove everything.
    """

    # Create all markups
    created_markups, _ = await create_entity_markup(
        db=db, entity_project=entity_project, apply_all=True
    )
    # Accept all markups
    markup_id = get_first_output_entity_markup(created_markups).id
    new_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=markup_id,
        username=USERNAME,
        apply_all=True,
    )

    # Delete markup
    await markup_services.delete_annotation(
        db=db, markup_id=markup_id, username=USERNAME, apply_all=True
    )

    # Check if it exists
    existing_markup = await markup_services.find_one_markup(
        db=db, markup_id=markup_id, username=USERNAME
    )

    # Assert that markup doesnt exist
    assert existing_markup == None, "Markup not deleted"


@pytest.mark.asyncio
async def test_delete_many_suggested_entity_annotations_from_suggested_entity(
    db, entity_project
):
    """
    Delete markups where one is accepted and the rest are suggested. Delete is initiated from suggested entity. Should preserve accepted markup.
    """

    # Create all markups
    created_markups, _ = await create_entity_markup(
        db=db, entity_project=entity_project, apply_all=True
    )

    # print("created_markups", created_markups)

    # Get markup id associated with a suggested markup
    created_markups = await markup_services.find_many_markups(
        db=db, project_id=entity_project.id, username=USERNAME
    )
    suggested_markup = [m for m in created_markups if m["suggested"]][0]
    suggested_markup_id = suggested_markup["_id"]

    # Delete markup
    await markup_services.delete_annotation(
        db=db, markup_id=suggested_markup_id, username=USERNAME, apply_all=True
    )

    # Check if one entity exists
    existing_markup = await markup_services.find_many_markups(
        db=db, project_id=entity_project.id, username=USERNAME
    )

    # print("existing_markup", existing_markup)

    # Assert that markup doesnt exist
    assert len(existing_markup) == 1, "Expected one markup to exist"


# ------ RELATION ------


@pytest.mark.asyncio
async def test_create_single_relation(db, relation_project):
    # Test apply single relation to existing entitiess

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=False,
    )

    assert created_markup.count == 1, "Expected one markup to be created"
    assert created_markup.entities == {}, "Entities should not be created"
    assert (
        len(created_markup.relations[str(dataset_item_id)]) == 1
    ), "Expected one relation to exist"


@pytest.mark.asyncio
async def test_create_duplicate_single_relation(db, relation_project):
    """Apply two exactly the same relations to the same source/target entities"""

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    # Create first relation
    await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=False,
    )
    # Create duplicate relation
    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=False,
    )

    assert created_markup == None, "Expected no markup to be created"


@pytest.mark.asyncio
async def test_create_two_single_relations_different_ontology_item_ids(
    db, relation_project
):
    """Apply two relations to the same src/tgt entities with different ontology item ids for relations"""

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    # Create first relation
    await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=False,
    )

    # Get last ontology item id (first one is selected by default for first relation applied)
    relation_ontology_item_id = relation_project.ontology.relation[-1].id

    # Create different relation
    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=False,
        ontology_item_id=relation_ontology_item_id,
    )

    print("created_markup", created_markup)

    assert created_markup.count == 1, "Expected one markup to be created"
    assert created_markup.entities == {}, "Expected no entities to be created"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"


@pytest.mark.asyncio
async def test_apply_relation_source_target_entity_identical(db, relation_project):
    """Test apply single relation source/target same entity -> Exception"""
    with pytest.raises(expected_exception=HTTPException):
        # Create source and target entities on dataset item
        source_entity_markup, _ = await create_entity_markup(
            db=db, entity_project=relation_project, span_start=0, span_end=1
        )
        source_entity = get_first_output_entity_markup(source_entity_markup)
        source_id = source_entity.id

        dataset_item_id = source_entity.dataset_item_id

        await create_relation_markup(
            db=db,
            relation_project=relation_project,
            dataset_item_id=str(dataset_item_id),
            source_id=ObjectId(source_id),
            target_id=ObjectId(source_id),
            apply_all=False,
        )


@pytest.mark.asyncio
async def test_apply_relation_when_one_entity_does_not_exist(db, relation_project):
    """"""
    random_markup_id = bson.objectid.ObjectId()

    source_target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=1
    )
    source_target_entity = get_first_output_entity_markup(source_target_entity_markup)
    source_target_entity_markup_id = source_target_entity.id

    dataset_item_id = source_target_entity.dataset_item_id

    # Assert exception for source entity
    with pytest.raises(expected_exception=HTTPException):
        # Create source and target entities on dataset item

        await create_relation_markup(
            db=db,
            relation_project=relation_project,
            dataset_item_id=str(dataset_item_id),
            source_id=ObjectId(random_markup_id),
            target_id=ObjectId(source_target_entity_markup_id),
            apply_all=False,
        )

    # Assert exception for target entity
    with pytest.raises(expected_exception=HTTPException):
        # Create source and target entities on dataset item

        await create_relation_markup(
            db=db,
            relation_project=relation_project,
            dataset_item_id=str(dataset_item_id),
            source_id=ObjectId(source_target_entity_markup_id),
            target_id=ObjectId(random_markup_id),
            apply_all=False,
        )


@pytest.mark.asyncio
async def test_apply_many_relations(db, relation_project):
    """Applies many relations originating from existing source/target entities. This should create one accepted relation, `n` suggested entities and `m` suggested relations.

    Test single relation direction left to right [repair](src) [handle](tgt); This is the default langauge direction.
    """

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"


@pytest.mark.asyncio
async def test_apply_many_relations_right_to_left(db, relation_project):
    """Test single relation direction right to left [handle](tgt) [corroded](src); default is left to right"""
    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    print("\ncreated_markup", created_markup)

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"


@pytest.mark.asyncio
async def test_apply_many_relations_overlapping_entities(db, relation_project):
    """Test single source and target overlapping e.g. [centrifugal [pump]] --> [centrifugal pump]-isA-[pump]"""
    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=1
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    print("\ncreated_markup", created_markup)

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"


@pytest.mark.asyncio
async def test_apply_many_relations_source_target_entity_identical(
    db, relation_project
):
    """Applies `many` relations between same source and target entity. This should raise a HTTPException"""

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_entity = get_first_output_entity_markup(source_entity_markup)
    source_id = source_entity.id
    dataset_item_id = source_entity.dataset_item_id

    with pytest.raises(expected_exception=HTTPException):
        await create_relation_markup(
            db=db,
            relation_project=relation_project,
            dataset_item_id=str(dataset_item_id),
            source_id=ObjectId(source_id),
            target_id=ObjectId(source_id),
            apply_all=True,
        )


@pytest.mark.asyncio
async def test_apply_many_relations_one_saved(db, relation_project):
    """Apply many relations where one dataset item is saved"""

    # Create src/tgt entities
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    # Save dataset item
    updated_project = await project_services.save_many_dataset_items(
        db=db,
        project_id=relation_project.id,
        dataset_item_ids=[dataset_item_id],
        state=True,
        username=USERNAME,
    )
    assert (
        len(updated_project.save_states) == 1
    ), "Expected one save state to be created"

    # Apply many relations
    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"

    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"


@pytest.mark.asyncio
async def test_apply_many_relations_all_saved(db, relation_project):
    """Apply many relations where all dataset items are saved. This should only apply a single relation to the focus dataset item between the src/tgt entities."""

    # Create src/tgt entities
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    # Save all dataset items
    dataset_id = relation_project.dataset_id
    dataset_items = await dataset_services.find_many_dataset_items(
        db=db, dataset_id=dataset_id
    )
    dataset_item_ids = [di.id for di in dataset_items]
    updated_project = await project_services.save_many_dataset_items(
        db=db,
        project_id=relation_project.id,
        dataset_item_ids=dataset_item_ids,
        state=True,
        username=USERNAME,
    )
    assert len(updated_project.save_states) == len(
        dataset_items
    ), "Unexpected number of save states created"

    # Apply many relations
    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 1, "Expected no markup to be created"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expected one relations to be accepted"


@pytest.mark.asyncio
async def test_apply_many_relations_suggested_entities(db, relation_project):
    """Applies many relations to dataset items where focus src/tgt are accepted but other entities are suggested."""

    # Create source entity
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    # Apply many source entity
    await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0, apply_all=True
    )

    # Create target entity
    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id
    dataset_item_id = target_entity.dataset_item_id

    # Apply many target entity
    await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1, apply_all=True
    )

    created_entities = await markup_services.find_many_markups(
        db=db, project_id=relation_project.id, username=USERNAME
    )
    assert len(created_entities) == 12, "Expected twelve entities"
    assert (
        len([e for e in created_entities if not e["suggested"]]) == 2
    ), "Expect two entities to be accepted"
    assert (
        len([e for e in created_entities if e["suggested"]]) == 10
    ), "Expect ten entities to be suggested"

    # Apply relations between focus src/tgt
    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    # print("created_markup", created_markup)
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expected one relations to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expected two relations to be suggested"


@pytest.mark.asyncio
async def test_apply_many_relations_to_suggested_relation(db, relation_project):
    """Applies many relation accepted src/tgt entities where relation is suggested. This should convert the suggested relation into an accepted one as its the focus.

    Test apply multiple relations -> Accepted relation between src/tgt but suggested enities/relations for all others.
    """

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    # Apply many relations to accepted src/tgt
    await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    # print("\ncreated_markup", created_markup)

    # Apply many relations to suggested relation on suggested src/tgt entities - this will convert focus triple to accepted but not change other suggested ones.
    suggested_relation = await db["markup"].find_one(
        {
            "project_id": relation_project.id,
            "created_by": USERNAME,
            "classification": "relation",
            "suggested": True,
        }
    )

    print("*" * 150)
    print("suggested_relation", suggested_relation)

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(suggested_relation["dataset_item_id"]),
        source_id=ObjectId(suggested_relation["source_id"]),
        target_id=ObjectId(suggested_relation["target_id"]),
        apply_all=True,
    )

    print("created_markup", created_markup)

    assert created_markup.count == 1, "Expected one relation to be created"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect four entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 0
    ), "Expect no entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 0
    ), "Expect no relations to be suggested"


@pytest.mark.asyncio
async def test_accept_relation_invalid_markup_id(db, relation_project):
    random_markup_id = bson.objectid.ObjectId()
    with pytest.raises(expected_exception=HTTPException):
        await markup_services.accept_annotation(
            db=db,
            markup_id=random_markup_id,
            username=USERNAME,
        )


@pytest.mark.asyncio
async def test_accept_single_suggested_relation_with_suggested_entities(
    db, relation_project
):
    """Accepts a single relation with suggested entities - this will convert the relation and its entities to accepted."""

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Accept single relation
    suggested_relation_markup = await db["markup"].find_one(
        {
            "project_id": relation_project.id,
            "created_by": USERNAME,
            "classification": "relation",
            "suggested": True,
        }
    )

    accepted_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=suggested_relation_markup["_id"],
        username=USERNAME,
    )

    print("accepted_markup".upper(), accepted_markup)

    assert accepted_markup.count == 1, "Expected one relation to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(accepted_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(accepted_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"


@pytest.mark.asyncio
async def test_accept_single_suggested_relation_with_accepted_entities(
    db, relation_project
):
    """Accepts a single relation with accepted entities - this will convert the relation to accepted and do nothing with the entities."""

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Accept all entities
    await markup_services.accept_annotation(
        db=db,
        markup_id=source_id,
        username=USERNAME,
        apply_all=True,
    )
    await markup_services.accept_annotation(
        db=db,
        markup_id=target_id,
        username=USERNAME,
        apply_all=True,
    )

    # Accept single relation
    suggested_relation_markup = await db["markup"].find_one(
        {
            "project_id": relation_project.id,
            "created_by": USERNAME,
            "classification": "relation",
            "suggested": True,
        }
    )

    accepted_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=suggested_relation_markup["_id"],
        username=USERNAME,
    )

    print("accepted_markup".upper(), accepted_markup)

    assert accepted_markup.count == 1, "Expected one relation to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(accepted_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(accepted_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"


@pytest.mark.asyncio
async def test_accept_single_accepted_relation(db, relation_project):
    """Try to accept already accepted relation - returns same response as if not been accepted before...

    TODO: Review whether this functionality can be optimised. Should NoneType be returned?
    """

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Accept single relation
    suggested_relation_markup = await db["markup"].find_one(
        {
            "project_id": relation_project.id,
            "created_by": USERNAME,
            "classification": "relation",
            "suggested": True,
        }
    )

    accepted_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=suggested_relation_markup["_id"],
        username=USERNAME,
    )

    assert accepted_markup.count == 1, "Expected one relation to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(accepted_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(accepted_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"

    # Try to accept the same relation
    accepted_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=suggested_relation_markup["_id"],
        username=USERNAME,
    )

    print("duplicate accept relation response", accepted_markup)


@pytest.mark.asyncio
async def test_accept_many_suggested_relations_with_suggested_entities(
    db, relation_project
):
    """Accepts many suggested relations each having suggested entities"""
    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Accept many relations
    suggested_relation_markup = await db["markup"].find_one(
        {
            "project_id": relation_project.id,
            "created_by": USERNAME,
            "classification": "relation",
            "suggested": True,
        }
    )

    accepted_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=suggested_relation_markup["_id"],
        username=USERNAME,
        apply_all=True,
    )

    print("accepted_markup", accepted_markup)

    assert accepted_markup.count == 2, "Expected two accepted markup"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(accepted_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(accepted_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 0
    ), "Expect no entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(accepted_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(accepted_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 0
    ), "Expect no relations to be suggested"


@pytest.mark.asyncio
async def test_accept_many_suggested_relations_with_accepted_and_suggested_entities(
    db, relation_project
):
    """Accepts many suggested relations where some have suggested entities or accepted entities"""
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0, apply_all=True
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1, apply_all=True
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    # Create many relations
    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect six entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect no entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Accept many relations
    suggested_relation_markup = await db["markup"].find_one(
        {
            "project_id": relation_project.id,
            "created_by": USERNAME,
            "classification": "relation",
            "suggested": True,
        }
    )

    accepted_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=suggested_relation_markup["_id"],
        username=USERNAME,
        apply_all=True,
    )

    print("accepted_markup", accepted_markup)

    assert accepted_markup.count == 2, "Expected two accepted markup"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(accepted_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(accepted_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 0
    ), "Expect no entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(accepted_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(accepted_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 0
    ), "Expect no relations to be suggested"


@pytest.mark.asyncio
async def test_accept_many_suggested_relations_with_accepted_entities(
    db, relation_project
):
    """Accepts many suggested relations each having accepted entities"""
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0, apply_all=True
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1, apply_all=True
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    # Accept all entities from src/tgt
    await markup_services.accept_annotation(
        db=db,
        markup_id=source_id,
        username=USERNAME,
        apply_all=True,
    )
    await markup_services.accept_annotation(
        db=db,
        markup_id=target_id,
        username=USERNAME,
        apply_all=True,
    )

    # Create many relations
    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 6
    ), "Expect six entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 0
    ), "Expect no entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Accept many relations
    suggested_relation_markup = await db["markup"].find_one(
        {
            "project_id": relation_project.id,
            "created_by": USERNAME,
            "classification": "relation",
            "suggested": True,
        }
    )

    accepted_markup = await markup_services.accept_annotation(
        db=db,
        markup_id=suggested_relation_markup["_id"],
        username=USERNAME,
        apply_all=True,
    )

    print("accepted_markup", accepted_markup)

    assert accepted_markup.count == 2, "Expected two accepted markup"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(accepted_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(accepted_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 0
    ), "Expect no entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(accepted_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(accepted_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 0
    ), "Expect no relations to be suggested"


@pytest.mark.asyncio
async def test_delete_single_relation_invalid_markup_id(db):
    """Try delete single relation with invalid markup id"""

    random_markup_id = bson.objectid.ObjectId()
    with pytest.raises(expected_exception=HTTPException):
        await markup_services.delete_annotation(
            db=db, markup_id=random_markup_id, username=USERNAME
        )


@pytest.mark.asyncio
async def test_delete_single_relation_accepted_entities(db, relation_project):
    # Test delete relation accepted entities -> only remove relation; not entities.

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=False,
    )

    assert created_markup.count == 1, "Expected one markup to be created"
    assert created_markup.entities == {}, "Entities should not be created"
    assert (
        len(created_markup.relations[str(dataset_item_id)]) == 1
    ), "Expected one relation to exist"

    # Delete relation
    relation_id = created_markup.relations[str(dataset_item_id)][0].id
    print("relation_id", relation_id)

    deleted_markup = await markup_services.delete_annotation(
        db=db, markup_id=ObjectId(relation_id), username=USERNAME
    )

    print("deleted_markup", deleted_markup)

    assert deleted_markup.count == 1, "Expected one markup to be deleted"
    assert deleted_markup.entities == {}, "Expected no entity markup to be deleted"
    assert (
        len(deleted_markup.relations[str(dataset_item_id)]) == 1
    ), "Expected one relation to be deleted"


@pytest.mark.asyncio
async def test_delete_single_relation_suggested_entities(db, relation_project):
    # Test delete relation suggested entities -> only remove relation; not entities.

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Find entity associated with suggested relation
    suggested_relation = await db["markup"].find_one(
        {
            "project_id": relation_project.id,
            "created_by": USERNAME,
            "classification": "relation",
            "suggested": True,
        }
    )

    # Delete suggested relation
    deleted_markup = await markup_services.delete_annotation(
        db=db, markup_id=suggested_relation["_id"], username=USERNAME
    )

    print("deleted_markup", deleted_markup)

    assert (
        deleted_markup.count == 1
    ), "Expected one markup to be deleted"  # TODO: update counts to be for ALL markup; give more rich information...
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(deleted_markup.entities.values())
                )
            ]
        )
        == 0
    ), "Expected no entity markup to be deleted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(deleted_markup.relations.values())
                )
            ]
        )
        == 1
    ), "Expected one relation markup to be deleted"


@pytest.mark.asyncio
async def test_delete_many_relations_accepted_relation(db, relation_project):
    """Delete many relations from accepted relation as focus --> this should remove all similar suggested/accepted relations"""
    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Get a focus relation id
    accepted_relation = await db["markup"].find_one(
        {
            "project_id": relation_project.id,
            "dataset_item_id": dataset_item_id,
            "classification": "relation",
            "suggested": False,
        }
    )

    print("accepted_relation", accepted_relation)

    accepted_relation_id = accepted_relation["_id"]
    print("accepted_relation_id", accepted_relation_id)

    # Delete all relations
    deleted_markup = await markup_services.delete_annotation(
        db=db, markup_id=accepted_relation_id, username=USERNAME, apply_all=True
    )

    assert deleted_markup.count == 3, "Expected three relation markups to be deleted"
    assert deleted_markup.entities == {}, "Expected no entity markup to be deleted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(deleted_markup.relations.values())
                )
            ]
        )
        == 3
    ), "Expected three relations to be deleted"


@pytest.mark.asyncio
async def test_delete_many_relations_suggested_relation(db, relation_project):
    """Deltes many relations triggered from a suggested relation. This should only delete suggested relations as accepted ones are protected."""
    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Get a focus relation id
    suggested_relation = await db["markup"].find_one(
        {
            "project_id": relation_project.id,
            "classification": "relation",
            "suggested": True,
        }
    )

    print("suggested_relation", suggested_relation)

    suggested_relation_id = suggested_relation["_id"]
    print("suggested_relation_id", suggested_relation_id)

    # Delete all relations
    deleted_markup = await markup_services.delete_annotation(
        db=db, markup_id=suggested_relation_id, username=USERNAME, apply_all=True
    )

    assert deleted_markup.count == 2, "Expected three relation markups to be deleted"
    assert deleted_markup.entities == {}, "Expected no entity markup to be deleted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(deleted_markup.relations.values())
                )
            ]
        )
        == 2
    ), "Expected two relations to be deleted"


@pytest.mark.asyncio
async def test_delete_many_relations_from_accepted_entity(db, relation_project):
    """Deletes many relations via accepted src entity many deletion"""
    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_id = get_first_output_entity_markup(source_entity_markup).id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Delete all entities matching src entity
    deleted_markup = await markup_services.delete_annotation(
        db=db, markup_id=source_id, username=USERNAME, apply_all=True
    )

    assert deleted_markup.count == 3, "Expected three entities markups to be deleted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(deleted_markup.entities.values())
                )
            ]
        )
        == 3
    ), "Expected three entities to be deleted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(deleted_markup.relations.values())
                )
            ]
        )
        == 3
    ), "Expected three relations to be deleted"


@pytest.mark.asyncio
async def test_delete_many_relations_from_suggested_entity(db, relation_project):
    """Deletes many relations via suggested src entity many deletion"""

    # Create source and target entities on dataset item
    source_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=0, span_end=0
    )
    source_entity = get_first_output_entity_markup(source_entity_markup)
    source_id = source_entity.id

    target_entity_markup, _ = await create_entity_markup(
        db=db, entity_project=relation_project, span_start=1, span_end=1
    )
    target_entity = get_first_output_entity_markup(target_entity_markup)
    target_id = target_entity.id

    dataset_item_id = target_entity.dataset_item_id

    created_markup, _ = await create_relation_markup(
        db=db,
        relation_project=relation_project,
        dataset_item_id=str(dataset_item_id),
        source_id=ObjectId(source_id),
        target_id=ObjectId(target_id),
        apply_all=True,
    )

    assert created_markup.count == 3, "Expected three relations to be created"
    assert (
        sum([len(v) for v in created_markup.entities.values()]) == 6
    ), "Expected six entities to exist"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if not e.suggested
            ]
        )
        == 2
    ), "Expect two entities to be accepted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(created_markup.entities.values())
                )
                if e.suggested
            ]
        )
        == 4
    ), "Expect four entities to be suggested"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if not r.suggested
            ]
        )
        == 1
    ), "Expect one relation to be accepted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(created_markup.relations.values())
                )
                if r.suggested
            ]
        )
        == 2
    ), "Expect two relations to be suggested"

    # Get suggested entity
    suggested_entity = await db["markup"].find_one(
        {
            "suggested": True,
            "ontology_item_id": source_entity.ontology_item_id,
            "surface_form": source_entity.surface_form,
        }
    )

    print("suggested_entity".upper(), suggested_entity)

    # Delete all entities matching src entity
    deleted_markup = await markup_services.delete_annotation(
        db=db, markup_id=suggested_entity["_id"], username=USERNAME, apply_all=True
    )

    assert deleted_markup.count == 2, "Expected two entities markups to be deleted"
    assert (
        len(
            [
                e
                for e in list(
                    itertools.chain.from_iterable(deleted_markup.entities.values())
                )
            ]
        )
        == 2
    ), "Expected two entities to be deleted"
    assert (
        len(
            [
                r
                for r in list(
                    itertools.chain.from_iterable(deleted_markup.relations.values())
                )
            ]
        )
        == 2
    ), "Expected two relations to be deleted"


# ------ PERFORMANCE ------
# TODO: Test bulk apply entities (1000)
# TODO: Test bulk apply relations (1000)


# ------ MULTI USER ------
# TODO: multiple annotator tests; ensure no conflicts / users cannot see each others annotations.
# TODO: Test bulk apply entities (1000) with two users simultaneously
