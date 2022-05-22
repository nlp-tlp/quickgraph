import { useState, useEffect } from "react";
import { Badge, OverlayTrigger, Tooltip, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { selectProject, selectFlatOntology } from "../projectSlice";

import "./Spans.css";
import {
  selectAnnotationMode,
  selectRelations,
  selectSourceSpan,
  selectTargetSpan,
  setSourceRel,
  setTargetRel,
  unsetTargetRel,
  unsetSourceTargetRels,
  selectEntities,
} from "../../../app/dataSlice";
import { getFontColour } from "../utils"; // project/utils
import { EntityTooltipContent } from "./EntityTooltipContent";
import { OpenRelationTooltipContent } from "./OpenRelationTooltipContent";
import { getSpanLabelPosition } from "./utils";
import { IoClose, IoArrowForward } from "react-icons/io5";

/*
    Component for creating stack of spans from markup
*/
export const OpenSpans = ({ text, token, tokenIndex }) => {
  const entities = useSelector(selectEntities);
  const textHasSpans =
    Object.keys(entities).includes(text._id) && entities[text._id].length > 0;

  if (textHasSpans) {
    const spanComponentsMarkup = entities[text._id]
      .slice()
      .sort((a, b) => b.end - b.start - (a.end - a.start)) // Sorting pushes longer spans to the top
      .filter((span) => span.start <= tokenIndex && tokenIndex <= span.end)
      .map((span) => {
        return (
          <Span
            text={text}
            token={token}
            tokenIndex={tokenIndex}
            span={span}
            suggested={span.suggested}
          />
        );
      });

    // console.log(spanComponentsMarkup);

    return spanComponentsMarkup;
  } else {
    //   Nothing to render if text doesn't have span.
    return <></>;
  }
};

/*
    Component for rendering a single span element
*/
const Span = ({
  text,
  textIndex,
  token,
  tokenIndex,
  span,
  spanLabel,
  suggested,
}) => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const annotationMode = useSelector(selectAnnotationMode);
  const entities = useSelector(selectEntities);
  const flatOntology = useSelector(selectFlatOntology);

  //   States
  const [showTooltip, setShowTooltip] = useState(false);
  const [showRelTooltip, setShowRelTooltip] = useState(true);
  const [tooltipFocusSpan, setTooltipFocusSpan] = useState();
  const sourceSpan = useSelector(selectSourceSpan);
  const targetSpan = useSelector(selectTargetSpan);
  const relations = useSelector(selectRelations);
  const [selectedRelKey, setSelectedRelKey] = useState();
  const [showAddRel, setShowAddRel] = useState(true);
  const [hoveredElement, setHoveredElement] = useState();

  const hasSuggestedRelation =
    relations &&
    Object.keys(relations).includes(text._id) &&
    relations[text._id].filter((r) => r.suggested).length > 0;

  const isSourceForRelation =
    relations &&
    Object.keys(relations).includes(text._id) &&
    relations[text._id].filter((r) => r.suggested && r.source === span._id)
      .length > 0;

  //    Get meta-data for span
  const spanLabelPos = getSpanLabelPosition(span, tokenIndex);
  const labelColour = span.colour;
  const fontColour = getFontColour(labelColour);

  const handleMouseDown = (text, span) => {
    const event = !sourceSpan
      ? "SET_SOURCE"
      : sourceSpan._id !== span._id && !targetSpan
      ? "SET_TARGET"
      : sourceSpan._id != span._id && targetSpan._id != span._id
      ? "SWITCH_TARGET" // TODO: SWITCH DOESN'T WORK.
      : sourceSpan._id === span._id
      ? "UNSET_SOURCE"
      : "UNKNOWN_EVENT";

    // console.log(event);

    switch (event) {
      case "SET_SOURCE":
        // User clicked on source span
        // Get all related spans that share a, or set of, relation(s)
        if (Object.keys(relations).includes(text._id)) {
          dispatch(
            setSourceRel({
              textId: text._id,
              span: span,
              labelId: span.labelId,
            })
          );
        } else {
          dispatch(
            setSourceRel({
              textId: text._id,
              span: span,
              labelId: span.labelId,
            })
          );
        }
        break;
      case "UNSET_SOURCE":
        // User clicks on source to unfocus - unsets source, target and related spans
        setShowRelTooltip(false);
        dispatch(unsetSourceTargetRels());
        break;
      case "SET_TARGET":
        // console.log("SET TARGET", span);
        dispatch(
          setTargetRel({
            span: span,
            labelId: span.labelId,
            textId: sourceSpan.textId,
          })
        );
        setShowRelTooltip(true);
        break;
      case "SWITCH_TARGET":
        dispatch(
          setTargetRel({
            span: span,
            labelId: span.labelId,
            textId: sourceSpan.textId,
          })
        );
        setShowRelTooltip(true);
        break;
      default:
        // console.log("default case for mouse down");
        break;
    }
  };

  const entityTooltip = (props) => {
    const tooltipContentProps = { tooltipFocusSpan, text };
    return (
      <Tooltip
        className="context-tooltip"
        onMouseEnter={() => {
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          setTooltipFocusSpan({}); // Once users mouse leaves tooltip; remove span details.
          setShowTooltip(false);
        }}
        {...props}
      >
        <EntityTooltipContent {...tooltipContentProps} />
      </Tooltip>
    );
  };

  if (annotationMode === "entity") {
    return (
      <OverlayTrigger
        placement="right"
        show={
          showTooltip &&
          span._id === tooltipFocusSpan._id &&
          ["end", "start-single"].includes(spanLabelPos) &&
          Object.keys(tooltipFocusSpan).length > 0
        }
        trigger={["hover", "focus"]}
        overlay={entityTooltip}
      >
        <span
          id="label"
          suggested={suggested ? "true" : "false"}
          label-content={span.name}
          pos={spanLabelPos}
          style={{
            backgroundColor: labelColour,
            color: fontColour && fontColour,
            cursor: "pointer",
          }}
          onMouseEnter={() => {
            setTooltipFocusSpan({
              _id: span._id,
              labelId: span.labelId,
              start: span.start,
              end: span.end,
              pos: spanLabelPos,
              type: suggested ? "suggested" : "accepted",
              entityText: span.entityText,
            });
            setShowTooltip(annotationMode !== "relation" ? true : false);
          }}
          onMouseLeave={() => {
            setShowTooltip(false);
          }}
        >
          {span.name}
        </span>
      </OverlayTrigger>
    );
  }

  /* 
    Open relation mode span rendering and logic
  */
  if (
    annotationMode === "relation" &&
    project.tasks.relationAnnotationType === "open" &&
    (!suggested || hasSuggestedRelation)
  ) {
    const openRelationTooltip = (props) => {
      const tooltipContentProps = { tooltipFocusSpan, text };
      return (
        <Tooltip
          className="context-tooltip"
          onMouseEnter={() => setHoveredElement(true)}
          onMouseLeave={() => setHoveredElement(null)}
          {...props}
        >
          <OpenRelationTooltipContent />
        </Tooltip>
      );
    };

    // const openRelationTooltip = () => {
    //   <>
    //     <Button
    //       size="sm"
    //       variant="success"
    //       // onClick={handleApplySingleOpenRelation}
    //     >
    //       +
    //     </Button>
    //     <Button size="sm" variant="danger">
    //       -
    //     </Button>
    //   </>;
    // };

    const renderSpanRelationLabels = (relations, text, span) => {
      // console.log("renderSpanRelationLabels - relations", relations);

      const matchedRelations = relations[text._id].filter(
        (r) => r.source === sourceSpan._id && r.target === span._id
      );
      return matchedRelations.map((r) => {
        return (
          <Badge
            id="relation-badge"
            variant="light"
            title={`${suggested ? "Suggested" : ""} Relation: ${r.labelText}`}
            suggested={suggested ? "true" : "false"}
          >
            {r.labelText}
          </Badge>
        );
      });
    };

    return (
      <span
        key={tokenIndex}
        id="label"
        label-content={spanLabel}
        pos={spanLabelPos}
        style={{
          backgroundColor: labelColour,
          color: fontColour && fontColour,
          cursor: "pointer",
          opacity:
            sourceSpan &&
            (span.state === "unrelated" ||
              sourceSpan.textId.toString() !== text._id.toString()) &&
            "0.25",
        }}
        source={span.state && span.state === "source" && "true"}
        suggested={suggested ? "true" : "false"}
        colour={span.state && span.state === "source" && labelColour}
        hasSuggestedRelation={suggested && isSourceForRelation && "true"}
        onClick={() => handleMouseDown(text, span, span.name)}
      >
        {(span.state === "related" || span.state === "target") &&
          renderSpanRelationLabels(relations, text, span)}
        {span.name}
      </span>
    );
  } else {
    return <></>;
  }
};
