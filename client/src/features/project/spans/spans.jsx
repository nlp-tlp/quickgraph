import { useState, useEffect } from "react";
import { Badge, OverlayTrigger, Tooltip, Popover } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { selectProject } from "../projectSlice";
import "./Spans.css";
import {
  selectAnnotationMode,
  selectRelations,
  selectSourceSpan,
  selectTargetSpan,
  setSourceRel,
  setTargetRel,
  unsetSorceRel,
  unsetTargetRel,
  unsetSourceTargetRels,
} from "../../../app/dataSlice";
import { getFontColour } from "../utils"; // project/utils
import { EntityTooltipContent } from "./EntityTooltipContent";
import { RelationTooltipContent } from "./RelationTooltipContent";
import { getSpanLabelPosition } from "./utils";
import { IoClose, IoArrowForward } from "react-icons/io5";
import { selectUserId } from "../../auth/userSlice";

/*
    Component for creating stack of spans from markup
*/
export const Spans = ({ text, textIndex, token, tokenIndex }) => {
  const annotationMode = useSelector(selectAnnotationMode);
  const textHasSpans = text.markup.length > 0;
  const userId = useSelector(selectUserId);

  if (textHasSpans) {
    const spanComponentsMarkup = text.markup
      .filter((span) => span.createdBy === userId)
      .filter((span) => !span.suggested)
      .slice()
      .sort((a, b) => b.end - b.start - (a.end - a.start)) // Sorting pushes longer spans to the top
      .filter((span) => span.start <= tokenIndex && tokenIndex <= span.end)
      .map((span) => {
        return (
          <Span
            text={text}
            textIndex={textIndex}
            token={token}
            tokenIndex={tokenIndex}
            span={span}
            spanLabel={span.label}
            suggested={false}
          />
        );
      });

    const spanComponentsSuggestedMarkup = text.markup
      .filter((span) => span.createdBy === userId)
      .filter((span) => span.suggested)
      .slice()
      .sort((a, b) => b.end - b.start - (a.end - a.start))
      .filter((span) => span.start <= tokenIndex && tokenIndex <= span.end)
      .map((span) => {
        return (
          <Span
            text={text}
            textIndex={textIndex}
            token={token}
            tokenIndex={tokenIndex}
            span={span}
            spanLabel={span.label}
            suggested={true}
          />
        );
      });

    return <>{[...spanComponentsMarkup, ...spanComponentsSuggestedMarkup]}</>;
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
    relations[text._id].filter((r) => r.suggested)[0] !== undefined;
  const isSourceForRelation =
    relations &&
    relations[text._id].filter(
      (r) => r.suggested && r.source === span._id
    )[0] !== undefined;

  // console.log("hasSuggestedRelation", hasSuggestedRelation);

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
              console.log("SET TARGET", span);
              dispatch(
                setTargetRel({
                  tokenIds: text.tokens
                    .filter(
                      (_, index) => span.start <= index && index <= span.end
                    )
                    .map((token) => token._id),
                  span: span,
                  label: spanLabel,
                  labelId: span.label_id,
                  textId: sourceSpan.textId,
                })
              );
              setShowRelTooltip(true);
              break;
            case "SWITCH_TARGET":
              dispatch(
                setTargetRel({
                  tokenIds: text.tokens
                    .filter(
                      (_, index) => span.start <= index && index <= span.end
                    )
                    .map((token) => token._id),
                  span: span,
                  label: spanLabel,
                  labelId: span.label_id,
                  textId: sourceSpan.textId,
                })
              );
              setShowRelTooltip(true);
              break;
            default:
              console.log("Default case for mouse enter span");
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
          console.log("unset target");
          const event = targetSpan._id === span._id && "UNSET_TARGET";

          switch (event) {
            case "UNSET_TARGET":
              // Click to remove target while source is selected
              // If target has relations on it; it will remain highlighted though.
              const targetHasRelations =
                sourceSpan.relatedSpanIdLabelMap.filter(
                  (s) => s.span_id === targetSpan._id
                ).length > 0;
              dispatch(
                unsetTargetRel({
                  tokenIds: text.tokens
                    .filter(
                      (_, index) => span.start <= index && index <= span.end
                    )
                    .map((token) => token._id),
                  hasRelations: targetHasRelations,
                  textId: sourceSpan.textId,
                })
              );
              setShowRelTooltip(false);
              break;
            default:
              console.log("Default case for mouse leave span label");
              break;
          }
        }
        break;
    }
  }, [hoveredElement]);

  //    Get meta-data for span

  const spanLabelPos = getSpanLabelPosition(span, tokenIndex);
  const labelColour = project.entityOntology.filter(
    (l) => l.name.toLowerCase() === spanLabel.toLowerCase()
  )[0].colour;
  const fontColour = getFontColour(labelColour);

  const handleMouseDown = (text, span, spanLabel) => {
    const event = !sourceSpan
      ? "SET_SOURCE"
      : sourceSpan._id === span._id
      ? "UNSET_SOURCE"
      : "UNKWOWN_SOURCE";

    switch (event) {
      case "SET_SOURCE":
        // User clicked on source span
        // Get all related spans that share a, or set of, relation(s)

        const relatedSpans = relations[text._id].filter(
          (s) => s.source === span._id
        );
        const relatedSpanIds = relatedSpans.map((s) => s.target);
        const relatedTokenIndexes = text.markup
          .filter((s) => relatedSpanIds.includes(s._id))
          .flatMap((s) => [...new Set([s.start, s.end])]);
        // console.log("relatedTokenIndexes", relatedTokenIndexes);

        const relatedTokenIds = text.tokens
          .filter((_, index) => relatedTokenIndexes.includes(index))
          .map((token) => token._id);
        // console.log("relatedTokenIds", relatedTokenIds);

        // console.log('relatedSpans', relatedSpans);

        // Save span._id -> label mapping
        const relatedSpanIdLabelMap = relatedSpans.map((s) => ({
          span_id: s.target,
          label: s.target_label,
        }));
        // console.log("relatedSpanIdLabelMap", relatedSpanIdLabelMap);

        // console.log('SPAN', span);

        dispatch(
          setSourceRel({
            textId: text._id,
            tokenIds: text.tokens
              .filter((_, index) => span.start <= index && index <= span.end)
              .map((token) => token._id),
            span: span,
            label: spanLabel,
            labelId: span.label_id,
            relatedTokenIds: relatedTokenIds,
            relatedSpanIdLabelMap: relatedSpanIdLabelMap,
          })
        );
        break;
      case "UNSET_SOURCE":
        // User clicks on source to unfocus - unsets source, target and related spans
        setShowRelTooltip(false);
        dispatch(unsetSourceTargetRels());
        break;
      default:
        console.log("default case for mouse down");
        break;
    }
  };

  const conceptTooltip = (props) => {
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
                {sourceSpan.value} <IoArrowForward /> {targetSpan.value}
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

  if (annotationMode === "concept") {
    return (
      <OverlayTrigger
        placement="right"
        show={
          showTooltip &&
          span._id === tooltipFocusSpan._id &&
          spanLabel === tooltipFocusSpan.label &&
          ["end", "start-single"].includes(spanLabelPos) &&
          Object.keys(tooltipFocusSpan).length > 0
        }
        trigger={["hover", "focus"]}
        overlay={conceptTooltip}
      >
        <span
          id="label"
          key={tokenIndex}
          suggested={suggested ? "true" : "false"}
          label-content={spanLabel}
          pos={spanLabelPos}
          style={{
            backgroundColor: labelColour,
            color: fontColour && fontColour,
            cursor: "pointer",
          }}
          onMouseEnter={() => {
            setTooltipFocusSpan({
              _id: span._id,
              label: spanLabel,
              label_id: span.label_id,
              start: span.start,
              end: span.end,
              pos: spanLabelPos,
              type: suggested ? "suggested" : "accepted",
            });
            setShowTooltip(annotationMode !== "relation" ? true : false);
          }}
          onMouseLeave={() => {
            setShowTooltip(false);
          }}
        >
          {spanLabel}
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
    const handleRelatedState = (
      token,
      span,
      spanLabel,
      spanHasRelatedLabel
    ) => {
      // Determines elements to fade out
      const opacityValue = "0.25";
      if (token.state && token.state === "unrelated") {
        return opacityValue;
      } else if (
        token.state &&
        targetSpan &&
        token.state === "target" &&
        spanLabel !== targetSpan.label
      ) {
        // Target token container can have many labels
        return opacityValue;
      } else if (
        token.state &&
        token.state === "source" &&
        span._id === sourceSpan._id &&
        spanLabel !== sourceSpan.label
      ) {
        // Source token container can have many labels
        return opacityValue;
      } else if (
        token.state &&
        token.state === "related" &&
        !spanHasRelatedLabel
      ) {
        // Token is related, but doesnt have a realted label!
        return opacityValue;
      } else {
        console.log(span);
      }
    };
    // Logic: Check if span_id in idlabelmap; if so, see if the current label is within it. Note: there
    // can be multiple labels per span_id for multi-label span relations.

    // console.log('sourceSpan', sourceSpan);

    const spanRelatedLabels =
      sourceSpan &&
      sourceSpan.relatedSpanIdLabelMap.filter(
        (rsm) => rsm.span_id === span._id && rsm.label === spanLabel
      );
    // console.log('spanRelatedLabels', spanRelatedLabels)

    const spanHasRelatedLabel =
      spanRelatedLabels && spanRelatedLabels.length > 0;
    // console.log("spanHasRelatedLabel", spanHasRelatedLabel);

    const renderSpanRelationLabels = (
      spanHasRelatedLabel,
      relations,
      text,
      spanLabel,
      span
    ) => {
      /* Render full label if only one; else render first character capitalised */
      if (spanHasRelatedLabel) {
        const relationLabels = relations[text._id]
          .filter(
            (r) =>
              r.source === sourceSpan._id && // filter for the relations to the current source only otherwise all relations to other non-related spans will be shown.
              r.target === span._id &&
              r.target_label === spanLabel
          )
          .map((r) => r.label);

        return relationLabels.map((label) => {
          return (
            <Badge
              id="relation-badge"
              variant="light"
              title={`${suggested && "Suggested"} Relation: ${label}`}
              suggested={suggested ? "true" : "false"}
            >
              {relationLabels.length > 2 ? label[0] : label}
            </Badge>
          );
        });
      }
    };

    return (
      <OverlayTrigger
        placement="left"
        show={
          showRelTooltip &&
          sourceSpan &&
          targetSpan &&
          span._id === targetSpan._id &&
          spanLabel === targetSpan.label &&
          ["start", "start-single"].includes(spanLabelPos) &&
          text._id === sourceSpan.textId
        }
        overlay={relationTooltip}
        rootClose
      >
        <span
          key={tokenIndex}
          id="label"
          label-content={spanLabel}
          pos={spanLabelPos}
          style={{
            backgroundColor: labelColour,
            color: fontColour && fontColour,
            cursor: "pointer",
            opacity: handleRelatedState(
              token,
              span,
              spanLabel,
              spanHasRelatedLabel
            ),
          }}
          source={
            token.state &&
            token.state === "source" &&
            span._id === sourceSpan._id &&
            "true"
          }
          suggested={suggested ? "true" : "false"}
          colour={token.state && token.state === "source" && labelColour}
          hasSuggestedRelation={suggested && isSourceForRelation && "true"}
          onClick={() => handleMouseDown(text, span, spanLabel)}
          onMouseEnter={() => setHoveredElement("span")}
          onMouseLeave={() => setHoveredElement(null)}
        >
          {renderSpanRelationLabels(
            spanHasRelatedLabel,
            relations,
            text,
            spanLabel,
            span
          )}
          {spanLabel}
        </span>
      </OverlayTrigger>
    );
  } else {
    return <></>;
  }
};
