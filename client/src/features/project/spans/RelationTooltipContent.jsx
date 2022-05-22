import React from "react";
import { ListGroup } from "react-bootstrap";
import { IoRadioButtonOff, IoRadioButtonOn } from "react-icons/io5";
import {
  MdContentPaste,
  MdDelete,
  MdDeleteSweep,
  MdDone,
  MdDoneAll,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import {
  applyAnnotation,
  acceptAnnotation,
  deleteAnnotation,
  patchRelation,
  selectRelations,
  selectSourceSpan,
  selectTargetSpan,
  selectTexts,
} from "../../../app/dataSlice";
import { selectProject, selectFlatOntology } from "../projectSlice";

export const RelationTooltipContent = ({
  text,
  showAddRel,
  setShowAddRel,
  selectedRelKey,
  setSelectedRelKey,
  setShowRelTooltip,
}) => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const sourceSpan = useSelector(selectSourceSpan);
  const targetSpan = useSelector(selectTargetSpan);
  const relations = useSelector(selectRelations);
  const flatOntology = useSelector(selectFlatOntology);
  const flatRelationOntology = flatOntology.filter((i) => !i.isEntity);
  const flatEntityOntology = flatOntology.filter((i) => i.isEntity);

  if (targetSpan) {
    /*
      TargetSpan may be removed if user tries to unselect sourceSpan whilst relation
      popover is active.
     */

    // Get label fullnames from source/target entity spans
    const sourceEntityType = flatEntityOntology.filter(
      (r) => r._id === sourceSpan.labelId
    )[0].fullName;
    const targetEntityType = flatEntityOntology.filter(
      (r) => r._id === targetSpan.labelId
    )[0].fullName;

    // Check if ANY relations are bounded by these entities, if so - filter, else - allow all relations.
    let filteredRelationLabels;

    // Filter relations based on source/span entity types
    filteredRelationLabels = flatRelationOntology.filter((relation) => {
      const domain = relation.domain;
      const range = relation.range;

      // console.log(relation, domain, range);

      // console.log(sourceEntityType, targetEntityType);

      const domainHasSourceEntityType =
        domain.filter((entity) => sourceEntityType.includes(entity)).length > 0;

      const rangeHasTargetEntityType =
        range.filter((entity) => targetEntityType.includes(entity)).length > 0;

      // console.log(domainHasSourceEntityType, rangeHasTargetEntityType);

      const domainIsOpen =
        relation.domain.includes("all") || relation.domain.length === 0;
      const rangeIsOpen =
        relation.range.includes("all") || relation.range.length === 0;

      if (domainHasSourceEntityType && rangeHasTargetEntityType) {
        return relation;
      } else if (domainIsOpen && rangeHasTargetEntityType) {
        return relation;
      } else if (domainHasSourceEntityType && rangeIsOpen) {
        return relation;
      }
      else if (domainIsOpen && rangeIsOpen) {
        // Applicable for any entity type
        return relation;
      }
      // else {
      //   return undefined;
      // }
    });

    if (filteredRelationLabels.length === 0) {
      // No relation constraints
      // console.log('No relation constraints');
      filteredRelationLabels = flatRelationOntology;
    }

    // console.log("filteredRelationLabels", filteredRelationLabels);

    return (
      <ListGroup className="tooltip-relation-container">
        {filteredRelationLabels.map((relationLabel, index) => {
          return (
            <ListGroup.Item
              className="tooltip-relation-item-container"
              id={index}
              title={`${relationLabel.fullName}\n${relationLabel.description}`}
            >
              <ListItemContent
                hasRelationLabel={
                  relations[text._id] &&
                  relations[text._id].length > 0 &&
                  relations[text._id].filter(
                    (r) =>
                      r.source === sourceSpan._id &&
                      r.target === targetSpan._id &&
                      r.labelId === relationLabel._id
                  ).length > 0
                }
                hasSuggestedRelationLabel={
                  relations[text._id] &&
                  relations[text._id].length > 0 &&
                  relations[text._id].filter(
                    (r) =>
                      r.suggested &&
                      r.source === sourceSpan._id &&
                      r.target === targetSpan._id &&
                      r.labelId === relationLabel._id
                  ).length > 0
                }
                relationLabel={relationLabel}
                text={text}
                setSelectedRelKey={setSelectedRelKey}
              />
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    );
  } else {
    // No target supplied; return no body. TODO : this is a hacky - fix.
    // Need to handle upstream testing for target span upstream
    return <></>;
  }
};

const ListItemContent = ({
  hasRelationLabel,
  hasSuggestedRelationLabel,
  relationLabel,
  text,
  setSelectedRelKey,
}) => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const sourceSpan = useSelector(selectSourceSpan);
  const targetSpan = useSelector(selectTargetSpan);
  const texts = useSelector(selectTexts);

  const handleRelationInteraction = ({
    relationLabel,
    text,
    action,
    applyAll,
    suggested,
  }) => {
    /*
      Handles interaction with relation popover list. If label is applied, click/touch it will remove it.
      If the label isn't applied, it will be applied on click/touch.

      Note: 
        - Relation application is between source span entity and target span entity.
          This allows label differentitation on multi-label spans. 
    */

    switch (action) {
      case "apply":
        // console.log("Applying relation(s)");

        dispatch(
          applyAnnotation({
            projectId: project._id,
            textId: text._id,
            sourceEntityId: sourceSpan._id,
            targetEntityId: targetSpan._id,
            relationLabelId: relationLabel._id,
            applyAll: applyAll,
            suggested: suggested,
            annotationType: "relation",
            textIds: Object.keys(texts),//.map((t) => t._id),
          })
        );
        setSelectedRelKey(null);
        break;
      case "delete":
        // User wants to remove relation(s)
        dispatch(
          deleteAnnotation({
            projectId: project._id,
            textId: text._id,
            relationLabelId: relationLabel._id,
            sourceEntityId: sourceSpan._id,
            targetEntityId: targetSpan._id,
            applyAll: applyAll,
            suggested: suggested,
            annotationType: "relation",
            textIds: Object.keys(texts),//.map((t) => t._id),
          })
        );
        setSelectedRelKey(null);
        break;
      case "accept":
        dispatch(
          acceptAnnotation({
            projectId: project._id,
            textId: text._id,
            sourceEntityId: sourceSpan._id,
            targetEntityId: targetSpan._id,
            relationLabelId: relationLabel._id,
            applyAll: applyAll,
            suggested: suggested,
            annotationType: "relation",
            textIds: Object.keys(texts),//.map((t) => t._id),
          })
        );
        setSelectedRelKey(null);
        break;
      default:
        // console.log("oops something went wrong...");
        break;
    }
  };

  return (
    <div id="tooltip-relation-item">
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            marginRight: "0.25rem",
            fontSize: "12px",
            color: hasRelationLabel && "#455a64",
          }}
        >
          {hasRelationLabel ? (
            <IoRadioButtonOn
              style={{
                color: hasSuggestedRelationLabel ? "#90a4ae" : "#263238",
              }}
            />
          ) : (
            <IoRadioButtonOff />
          )}
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            textAlign: "left",
          }}
        >
          <span
            style={{
              color: "grey",
              fontWeight: "normal",
              paddingLeft: "0.5rem",
              fontSize: "0.75rem",
            }}
          >
            {relationLabel.fullName.replace(relationLabel.name, "")}
          </span>
          <span id="tooltip-relation-label">{relationLabel.name}</span>
        </div>
      </div>
      <div id="tooltip-relation-icon-tray">
        {hasSuggestedRelationLabel ? (
          <>
            <span
              id="accept-one"
              title="Click to accept suggested relation"
              onClick={() => {
                handleRelationInteraction({
                  relationLabel: relationLabel,
                  text: text,
                  action: "accept",
                  applyAll: false,
                  suggested: true,
                });
              }}
              disabled={!hasRelationLabel && "true"}
            >
              <MdDone />
            </span>
            <span
              id="accept-all"
              title="Click to accept all suggested relations of this type"
              disabled={!hasRelationLabel && "true"}
              onClick={() => {
                handleRelationInteraction({
                  relationLabel: relationLabel,
                  text: text,
                  action: "accept",
                  applyAll: true,
                  suggested: true,
                });
              }}
            >
              <MdDoneAll />
            </span>
            <span
              id="reject-one"
              title="Click to reject this suggested relation (entities will persist)"
              onClick={() => {
                handleRelationInteraction({
                  relationLabel: relationLabel,
                  text: text,
                  action: "delete",
                  applyAll: false,
                  suggested: true,
                });
              }}
              disabled={!hasRelationLabel && "true"}
            >
              <MdDelete />
            </span>
            <span
              id="reject-all"
              title="Click to reject all suggested relations of this type (entities will persist)"
              disabled={!hasRelationLabel && "true"}
              onClick={() => {
                handleRelationInteraction({
                  relationLabel: relationLabel,
                  text: text,
                  action: "delete",
                  applyAll: true,
                  suggested: true,
                });
              }}
            >
              <MdDeleteSweep />
            </span>
          </>
        ) : (
          <>
            <span
              id="apply-one"
              title="Click to apply single relation"
              disabled={hasRelationLabel && "true"}
              onClick={() => {
                handleRelationInteraction({
                  relationLabel: relationLabel,
                  text: text,
                  action: "apply",
                  applyAll: false,
                  suggested: false,
                });
              }}
            >
              <MdDone />
            </span>
            <span
              id="apply-all"
              title="Click to apply relation across entire corpus"
              onClick={() => {
                handleRelationInteraction({
                  relationLabel: relationLabel,
                  text: text,
                  action: "apply",
                  applyAll: true,
                  suggested: false,
                });
              }}
            >
              <MdContentPaste />
            </span>
            {hasRelationLabel && (
              <span
                id="delete-one"
                title="Click to delete this relation"
                onClick={() => {
                  handleRelationInteraction({
                    relationLabel: relationLabel,
                    text: text,
                    action: "delete",
                    applyAll: false,
                    suggested: false,
                  });
                }}
                disabled={!hasRelationLabel && "true"}
              >
                <MdDelete />
              </span>
            )}
            {hasRelationLabel && (
              <span
                id="delete-all"
                title="Click to delete this and all matching relations"
                disabled={!hasRelationLabel && "true"}
                onClick={() => {
                  handleRelationInteraction({
                    relationLabel: relationLabel,
                    text: text,
                    action: "delete",
                    applyAll: true,
                    suggested: false,
                  });
                }}
              >
                <MdDeleteSweep />
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
