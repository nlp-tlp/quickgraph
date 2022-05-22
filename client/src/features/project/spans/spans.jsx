import { useState, useEffect } from "react";
import { Badge, OverlayTrigger, Tooltip, Popover } from "react-bootstrap";
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
import { RelationTooltipContent } from "./RelationTooltipContent";
import { getSpanLabelPosition } from "./utils";
import { IoClose, IoArrowForward } from "react-icons/io5";

/*
    Component for creating stack of spans from markup
*/
export const Spans = ({ text, token, tokenIndex }) => {
  const entities = useSelector(selectEntities);
  const textHasSpans =
    Object.keys(entities).includes(text._id) && entities[text._id].length > 0;

  if (textHasSpans) {
    const spanComponentsMarkup = entities[text._id]
      // .filter((span) => span.createdBy === userId) // TODO: confirm that spans are only for current user
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

    return spanComponentsMarkup;
  } else {
    //   Nothing to render if text doesn't have span.
    return <></>;
  }
};

/*
    Component for rendering a single span element
*/
const Span = ({ text, tokenIndex, span, suggested }) => {
  const dispatch = useDispatch();
  const project = useSelector(selectProject);
  const annotationMode = useSelector(selectAnnotationMode);
  const entities = useSelector(selectEntities);
  const flatOntology = useSelector(selectFlatOntology);
  const flatRelationOntology = flatOntology.filter((i) => !i.isEntity);

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

  // console.log(token, hasSuggestedRelation, isSourceForRelation);

  useEffect(() => {
    switch (hoveredElement) {
      case "span":
        // Equivalent to onMouseEnter on span
        if (sourceSpan) {
          const event =
            sourceSpan._id !== span._id && !targetSpan
              ? "SET_TARGET"
              : sourceSpan._id !== span._id && targetSpan._id !== span._id
              ? "SWITCH_TARGET"
              : "UNKNOWN";

          switch (event) {
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
              // console.log("Default case for mouse enter span");
              break;
          }
        }
        break;
      case "popover":
        break;
      default:
        // Equivalent to onMouseLeave on span
        // Unset target span; uses timeout to help user interact with
        // popover e.g. mouse from span -> popover container; otherwise it
        // disappears.
        if (targetSpan) {
          // console.log("unset target");
          const event = targetSpan._id === span._id && "UNSET_TARGET";

          switch (event) {
            case "UNSET_TARGET":
              // Click to remove target while source is selected
              // If target has relations on it; it will remain highlighted though.

              // const targetHasRelations =
              //   sourceSpan.relatedSpanIdLabelMap.filter(
              //     (s) => s.span_id === targetSpan._id
              //   ).length > 0;

              dispatch(
                unsetTargetRel({
                  // tokenIds: text.tokens
                  //   .filter(
                  //     (_, index) => span.start <= index && index <= span.end
                  //   )
                  //   .map((token) => token._id),
                  // hasRelations: targetHasRelations,
                  textId: sourceSpan.textId,
                })
              );
              setShowRelTooltip(false);
              break;
            default:
              // console.log("Default case for mouse leave span label");
              break;
          }
        }
        break;
    }
  }, [hoveredElement]);

  //    Get meta-data for span
  const spanLabelPos = getSpanLabelPosition(span, tokenIndex);
  const labelColour = span.colour;
  const fontColour = getFontColour(labelColour);

  const handleMouseDown = (text, span) => {
    const event = !sourceSpan
      ? "SET_SOURCE"
      : sourceSpan._id === span._id
      ? "UNSET_SOURCE"
      : "UNKNOWN_SOURCE";

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

  const relationTooltip = (props) => {
    const tooltipContentProps = {
      text,
      showAddRel,
      setShowAddRel,
      selectedRelKey,
      setSelectedRelKey,
      setShowRelTooltip,
    };

    // console.log(
    //   "relationTOoltip",
    //   "sourceSpan",
    //   sourceSpan,
    //   "targetSpan",
    //   targetSpan
    // );

    // Note: Only sourceSpan has textId key
    const sourceEntityText =
      sourceSpan &&
      entities[sourceSpan.textId].filter(
        (e) => e._id.toString() === sourceSpan._id.toString()
      )[0].entityText;
    const targetEntityText =
      targetSpan &&
      entities[sourceSpan.textId].filter(
        (e) => e._id.toString() === targetSpan._id.toString()
      )[0].entityText;

    return (
      <Popover
        className="context-tooltip-relation"
        {...props}
        onMouseEnter={() => {
          setHoveredElement("popover");
        }}
        onMouseLeave={() => {
          setHoveredElement(null);
        }}
      >
        <Popover.Title
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "1rem",
            fontWeight: "bold",
          }}
        >
          <span style={{ display: "flex", flexDirection: "column" }}>
            Relations
            {sourceSpan && targetSpan && (
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "normal",
                  width: "150px",
                }}
              >
                {sourceEntityText} <IoArrowForward /> {targetEntityText}
              </span>
            )}
          </span>
          <IoClose
            style={{ cursor: "pointer" }}
            onClick={() => {
              setShowRelTooltip(false);
            }}
          />
        </Popover.Title>
        <Popover.Content style={{ padding: "0rem 0.1rem 0rem 0.1rem" }}>
          <RelationTooltipContent {...tooltipContentProps} />
        </Popover.Content>
      </Popover>
    );
  };

  if (annotationMode === "entity") {
    const showEntityPopover =
      showTooltip &&
      span._id === tooltipFocusSpan._id &&
      ["end", "start-single"].includes(spanLabelPos) &&
      Object.keys(tooltipFocusSpan).length > 0;

    return (
      <OverlayTrigger
        placement="right"
        show={showEntityPopover}
        trigger={["hover", "focus"]}
        overlay={entityTooltip}
      >
        <span
          id="label"
          key={tokenIndex}
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
    
    Closed relation mode span rendering and logic

    Render span in relation mode. User can click on span to interact.
    Related spans are automatically detected when a source span is clicked on.

    If the span has a suggested relation, it will be rendered.
  */
  if (
    annotationMode === "relation" &&
    project.tasks.relationAnnotationType === "closed" &&
    (!suggested || hasSuggestedRelation)
  ) {
    const renderSpanRelationLabels = (relations, text, span) => {
      /* Render full label if only one; else render first character capitalised */
      // Filter for the relations to the current source only otherwise all relations to other non-related spans will be shown.
      const relationLabelIds = relations[text._id]
        .filter((r) => r.source === sourceSpan._id && r.target === span._id)
        .map((r) => r.labelId);

      return relationLabelIds.map((rId) => {
        const label = flatRelationOntology.filter(
          (r) => r._id.toString() === rId
        )[0];

        return (
          <Badge
            id="relation-badge"
            variant="light"
            title={`${suggested ? "Suggested" : ""} Relation: ${label.name}`}
            suggested={suggested ? "true" : "false"}
          >
            {label.name}
          </Badge>
        );
      });
    };

    const showRelationPopover =
      showRelTooltip &&
      sourceSpan &&
      targetSpan &&
      span._id === targetSpan._id &&
      ["start", "start-single"].includes(spanLabelPos) &&
      text._id === sourceSpan.textId;

    return (
      <OverlayTrigger
        placement="left"
        show={showRelationPopover}
        overlay={relationTooltip}
        rootClose
      >
        <span
          key={tokenIndex}
          id="label"
          label-content={span.name}
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
          onMouseEnter={() => setHoveredElement("span")}
          onMouseLeave={() => setHoveredElement(null)}
        >
          {(span.state === "related" || span.state === "target") &&
            renderSpanRelationLabels(relations, text, span)}
          {span.name}
        </span>
      </OverlayTrigger>
    );
  } else {
    return <></>;
  }
};
