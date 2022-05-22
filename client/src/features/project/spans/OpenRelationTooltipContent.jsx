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
import { selectProject } from "../projectSlice";

export const OpenRelationTooltipContent = ({
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
  const texts = useSelector(selectTexts);

  const handleRelationInteraction = ({
    relation,
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
    // console.log("relationLabelInfo", relationLabelInfo);

    const relationLabel = relation.name;

    // Get ID of tokens on target span
    const targetTokenIndexes = text.markup
      .filter((s) => s._id === targetSpan._id)
      .flatMap((s) => [...new Set([s.start, s.end])]);
    // console.log("targetTokenIndexes", targetTokenIndexes);

    const targetTokenIds = text.tokens
      .filter((_, index) => targetTokenIndexes.includes(index))
      .map((token) => token._id);
    // console.log("targetTokenIds", targetTokenIds);
    // console.log("relation", relation);

    let relationId;
    switch (action) {
      case "apply":
        dispatch(
          applyAnnotation({
            projectId: project._id,
            textId: text._id,
            sourceEntityId: sourceSpan._id,
            targetEntityId: targetSpan._id,
            // relationLabel: relationLabel,
            relationLabelId: null,
            targetTokenIds: targetTokenIds,
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
        relationId = relations[
          Object.keys(relations).filter((key) => key === text._id)
        ].filter(
          (r) => r.label === relationLabel && r.target === targetSpan._id
        )[0]._id;

        dispatch(
          deleteAnnotation({
            projectId: project._id,
            textId: text._id,
            relationId: relationId,
            sourceEntityId: sourceSpan._id,
            targetEntityId: targetSpan._id,
            relationLabel: relationLabel,
            applyAll: applyAll,
            suggested: suggested,
            annotationType: "relation",
            textIds: Object.keys(texts),//.map((t) => t._id),
          })
        );
        setSelectedRelKey(null);
        break;
      case "accept":
        relationId = relations[
          Object.keys(relations).filter((key) => key === text._id)
        ].filter(
          (r) => r.label === relationLabel && r.target === targetSpan._id
        )[0]._id;

        dispatch(
          acceptAnnotation({
            projectId: project._id,
            textId: text._id,
            sourceEntityId: sourceSpan._id,
            targetEntityId: targetSpan._id,
            relationId: relationId,
            relationLabel: relationLabel,
            targetTokenIds: targetTokenIds,
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

  const findRelatedSpans = (relations, text, sourceSpan, targetSpan) => {
    /* 
      Gets label and _ids of active relations on span.
      Notes: Currently selected span information is contained within the state of targetSpan.
      This needs to be filtered based on the sourceSpan selected as there could be many relations
      between other non-related spans and the targets of the current one.
      */

    // console.log(
    //   relations[text._id].filter((r) => r.target_label === targetSpan.label)
    // );
    const activeRelatedSpans = relations[text._id]
      .filter(
        (r) =>
          r.source === sourceSpan._id &&
          r.target === targetSpan._id &&
          r.target_label === targetSpan.label
      )
      .map((r) => ({ _id: r._id, label: r.label, suggested: r.suggested }));
    // console.log("active relation labels on target span", activeRelatedSpans);

    return activeRelatedSpans;
  };

  // TargetSpan may be removed if user tries to unselect sourceSpan whilst relation
  // popover is active.
  //   const activeRelatedSpans = findRelatedSpans(
  //     relations,
  //     text,
  //     sourceSpan,
  //     targetSpan
  //   );

  // const hasSuggestedRelation = activeRelatedSpans
  // .filter((r) => r.suggested)
  // .map((r) => r.label)
  // .includes(relation.name);

  return (
    <div id="icon-container">
      {/* {hasSuggestedRelation ? (
            <>
              <span
                id="accept-one"
                title="Click to accept suggested relation"
                // onClick={() => {
                //   handleRelationInteraction({
                //     relation: relation,
                //     text: text,
                //     action: "accept",
                //     applyAll: false,
                //     suggested: true,
                //   });
                // }}
                // disabled={!hasRelation && "true"}
              >
                <MdDone />
              </span>
              <span
                id="accept-all"
                title="Click to accept all suggested relations of this type"
                disabled={!hasRelation && "true"}
                onClick={() => {
                  handleRelationInteraction({
                    relation: relation,
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
                    relation: relation,
                    text: text,
                    action: "delete",
                    applyAll: false,
                    suggested: true,
                  });
                }}
                disabled={!hasRelation && "true"}
              >
                <MdDelete />
              </span>
              <span
                id="reject-all"
                title="Click to reject all suggested relations of this type (entities will persist)"
                disabled={!hasRelation && "true"}
                onClick={() => {
                  handleRelationInteraction({
                    relation: relation,
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
          ) : (*/}
      <span
        id="apply-one"
        title="Click to apply single relation"
        // disabled={hasRelation && "true"}
        // onClick={() => {
        //   handleRelationInteraction({
        //     relation: relation,
        //     text: text,
        //     action: "apply",
        //     applyAll: false,
        //     suggested: false,
        //   });
        // }}
      >
        <MdDone />
      </span>
      <span
        id="apply-all"
        title="Click to apply relation across entire corpus"
        // onClick={() => {
        //   handleRelationInteraction({
        //     relation: relation,
        //     text: text,
        //     action: "apply",
        //     applyAll: true,
        //     suggested: false,
        //   });
        // }}
      >
        <MdContentPaste />
      </span>
      {/* {hasRelation && (
                <span
                  id="delete-one"
                  title="Click to delete this relation"
                  onClick={() => {
                    handleRelationInteraction({
                      relation: relation,
                      text: text,
                      action: "delete",
                      applyAll: false,
                      suggested: false,
                    });
                  }}
                  disabled={!hasRelation && "true"}
                >
                  <MdDelete />
                </span>
              )}
              {hasRelation && (
                <span
                  id="delete-all"
                  title="Click to delete this and all matching relations"
                  disabled={!hasRelation && "true"}
                  onClick={() => {
                    handleRelationInteraction({
                      relation: relation,
                      text: text,
                      action: "delete",
                      applyAll: true,
                      suggested: false,
                    });
                  }}
                >
                  <MdDeleteSweep />
                </span>
              )} */}
    </div>
  );
};
