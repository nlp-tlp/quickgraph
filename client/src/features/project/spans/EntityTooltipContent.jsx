import React from "react";
import { IoSearch } from "react-icons/io5";
import {
  MdContentPaste,
  MdDelete,
  MdDeleteSweep,
  MdDone,
  MdDoneAll,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import {
  acceptAnnotation,
  applyAnnotation,
  deleteAnnotation,
} from "../../../app/dataSlice";
import { selectProject } from "../projectSlice";
import "./Tooltip.css";

export const EntityTooltipContent = ({ tooltipFocusSpan, text }) => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const entityOntology = project.entityOntology;
  const labelFullName =
    entityOntology.filter((e) => e._id == tooltipFocusSpan.label_id).length >
      0 &&
    entityOntology.filter((e) => e._id == tooltipFocusSpan.label_id)[0]
      .fullName;

  const handleMarkupAllClick = () => {
    const textId = text._id;
    const tokens = text.tokens.filter(
      (token) =>
        tooltipFocusSpan.start <= token.index &&
        token.index <= tooltipFocusSpan.end
    );

    dispatch(
      applyAnnotation({
        entitySpanStart: tokens[0].index,
        entitySpanEnd:
          tokens.length === 1
            ? tokens[0].index
            : tokens[tokens.length - 1].index,
        entityLabel: tooltipFocusSpan.label,
        entityLabelId: tooltipFocusSpan.label_id,
        textId: textId,
        projectId: project._id,
        applyAll: true,
        suggested: false,
        annotationType: "entity",
      })
    );
  };

  return (
    <div style={{ cursor: "pointer" }} className="icon-container">
      {tooltipFocusSpan && tooltipFocusSpan.type === "accepted" ? (
        <>
          <span
            id="accept-all"
            onClick={handleMarkupAllClick}
            title={`Click to apply across entire corpus (${labelFullName})`}
          >
            <MdContentPaste />
          </span>
          <span
            id="delete-one"
            onClick={() => {
              dispatch(
                deleteAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  relationId: null,
                  entityLabel: tooltipFocusSpan.label,
                  applyAll: false,
                  suggested: false,
                  annotationType: "entity",
                })
              );
            }}
            title={`Click to delete this label (${labelFullName})`}
          >
            <MdDelete />
          </span>
          <span
            id="delete-all"
            onClick={() => {
              dispatch(
                deleteAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  relationId: null,
                  entityLabel: tooltipFocusSpan.label,
                  applyAll: true,
                  suggested: false,
                  annotationType: "entity",
                })
              );
            }}
            title={`Click to delete all matching labels (${labelFullName})`}
          >
            <MdDeleteSweep />
          </span>
          {/* <span style={{ borderRight: "1px solid grey", width: "4px" }}></span> */}
          {/* <span
            id="search"
            title="Click to quick search for documents with this token or phrase"
          >
            <IoSearch />
          </span> */}
        </>
      ) : (
        <>
          <span
            id="accept-one"
            onClick={() => {
              dispatch(
                acceptAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  entityLabel: tooltipFocusSpan.label,
                  entityLabelId: tooltipFocusSpan.label_id,
                  applyAll: false,
                  annotationType: "entity",
                  suggested: false,
                })
              );
            }}
            title={`Click to accept this suggestion (${labelFullName})`}
          >
            <MdDone />
          </span>
          <span
            id="accept-all"
            onClick={() => {
              dispatch(
                acceptAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  entityLabel: tooltipFocusSpan.label,
                  entityLabelId: tooltipFocusSpan.label_id,
                  applyAll: true,
                  annotationType: "entity",
                  suggested: false,
                })
              );
            }}
            title={`Click to accept all suggestions (${labelFullName})`}
          >
            <MdDoneAll />
          </span>
          <span
            id="delete-one"
            onClick={() => {
              dispatch(
                deleteAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  relationId: null,
                  entityLabel: tooltipFocusSpan.label,
                  applyAll: false,
                  suggested: true,
                  annotationType: "entity",
                })
              );
            }}
            title={`Click to decline this suggestion (${labelFullName})`}
          >
            <MdDelete />
          </span>
          <span
            id="delete-all"
            onClick={() => {
              dispatch(
                deleteAnnotation({
                  projectId: project._id,
                  textId: text._id,
                  spanId: tooltipFocusSpan._id,
                  relationId: null,
                  entityLabel: tooltipFocusSpan.label,
                  applyAll: true,
                  suggested: true,
                  annotationType: "entity",
                })
              );
            }}
            title={`Click to decline all suggestions (${labelFullName})`}
          >
            <MdDeleteSweep />
          </span>
          {/* <span style={{ borderRight: "1px solid grey", width: "4px" }}></span> */}
          {/* <span id="search">
            <IoSearch />
          </span> */}
        </>
      )}
    </div>
  );
};
