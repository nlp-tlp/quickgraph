import { useState } from "react";
import { getFontColor, getSpanLabelPosition } from "../../../shared/utils/text";
import { alpha } from "@mui/material/styles";
import { Typography, Popover, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import RelationPopover from "./RelationPopover";
import ContextMenu from "./ContextMenu";

const glow = keyframes`
  0% {
    background-color: attr(color);
  }
  50% {
    background-color: #eeeeee;
  }
  100% {
    background-color: attr(color);
  }
`;

export const SpanComponent = styled(Typography)((props) => ({
  // textTransform: "capitalize",
  padding:
    ["start", "start-single"].includes(props.position) &&
    "0rem 0.5rem 0rem 0.5rem",
  fontSize: "0.75rem",
  userSelect: "none",
  cursor: props.disabled ? "help" : "pointer",
  opacity: props.suggested || props.unrelated ? 0.5 : props.fadeout ? 0.25 : 1,
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: props.labelcolor,
  borderRight: ["start", "middle"].includes(props.position) && "none",
  borderLeft: ["end", "middle"].includes(props.position) && "none",
  color: ["middle", "end"].includes(props.position)
    ? "transparent"
    : getFontColor(props.labelcolor),
  backgroundColor: alpha(props.labelcolor, 0.75),
  animation: props?.source && `${glow} linear 1.5s infinite`,
}));

/**
 * Span component for rendering a single span element
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.state - Application state.
 * @param {Function} props.dispatch - Function to dispatch actions.
 * @param {string} props.textId - The ID of the text containing the spans.
 * @param {Object} props.token - The token object with index and value.
 * @param {Object} props.span - The span object with ID, start, end, name, and other properties.
 * @param {boolean} props.suggested - Whether the span is suggested or not.
 * @returns {React.Element} - The rendered span component.
 */
const Span = ({
  state,
  dispatch,
  textId,
  token,
  span,
  suggested,
  disabled,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const flatRelationOntology = state.flatRelationOntology;

  const handlePopoverOpen = (event, spanIsSource) => {
    if (state.entityAnnotationMode) {
      setAnchorEl(event.currentTarget);
    }
    if (
      state.sourceSpan &&
      !spanIsSource &&
      textId === state.sourceSpan.textId // Ensures that cross document relations are not created.
    ) {
      setAnchorEl(event.currentTarget);
      dispatch({
        type: "SET_VALUE",
        payload: {
          targetSpan: {
            id: span.id,
            start: span.start,
            end: span.end,
            ontologyItemId: span.ontology_item_id,
          },
        },
      });
    }
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleRelationPopoverClose = () => {
    dispatch({ type: "REMOVE_SOURCE_TARGET_RELS" });
    setAnchorEl(null);
  };

  const hasSuggestedRelation =
    state.relations &&
    Object.keys(state.relations).includes(textId) &&
    state.relations[textId].filter((r) => r.suggested).length > 0;

  if (state.entityAnnotationMode) {
    const spanLabelPos = getSpanLabelPosition(span, token.index);
    const labelColor = span.color;

    return (
      <>
        <SpanComponent
          key={token.index}
          suggested={suggested ? 1 : 0}
          position={spanLabelPos}
          labelcolor={labelColor}
          onMouseDown={(e) => !disabled && handlePopoverOpen(e, spanLabelPos)}
          onTouchStart={(e) => !disabled && handlePopoverOpen(e, spanLabelPos)}
          title={
            disabled
              ? "Unsave dataset item to access entity actions"
              : `Click to access entity actions (${span.surface_form})`
          }
          disabled={disabled ? 1 : 0}
          // tokenIndex={token.index}
        >
          {span.name}
        </SpanComponent>
        <ContextMenu
          state={state}
          dispatch={dispatch}
          anchorEl={anchorEl}
          textId={textId}
          setAnchorEl={setAnchorEl}
          token={token}
          span={span}
          suggested={suggested}
        />
      </>
    );
  }

  /*

    relation mode span rendering and logic

    Render span in relation mode. User can click on span to interact.
    Related spans are automatically detected when a source span is clicked on.

    If the span has a suggested relation, it will be rendered.
  */
  if (!state.entityAnnotationMode && (!suggested || hasSuggestedRelation)) {
    const spanLabelPos = getSpanLabelPosition(span, token.index);
    const labelColor = span.color;

    const relationLabelChips = (relations, textId, span) => {
      /* Render full label if only one; else render first character capitalised */
      // Filter for the relations to the current source only otherwise all relations to other non-related spans will be shown.
      if (["start", "start-single"].includes(spanLabelPos)) {
        const relationOntologyItemIds = relations[textId]
          .filter(
            (r) =>
              state.sourceSpan !== null &&
              r.source_id === state.sourceSpan.id &&
              r.target_id === span.id
          )
          .map((r) => r.ontologyItemId);

        return relationOntologyItemIds.map((rId) => {
          const label = flatRelationOntology.filter((r) => r.id === rId)[0];

          if (label === undefined) {
            return null;
          } else {
            return (
              <Chip
                title={`${suggested ? "Suggested" : ""} Relation: ${
                  label.name
                }`}
                label={label.name}
                sx={{
                  fontSize: "0.625rem",
                  height: "0.8rem",
                  bgcolor: suggested ? "orange" : "white",
                  cursor: "pointer",
                  marginRight: "6px",
                }}
              />
            );
          }
        });
      }
    };

    const handleMouseDown = (textId, span) => {
      const event = !state.sourceSpan
        ? "SET_SOURCE"
        : state.sourceSpan.id === span.id
        ? "UNSET_SOURCE"
        : "UNKNOWN_SOURCE";

      switch (event) {
        case "SET_SOURCE":
          // User clicked on source span
          // Get all related spans that share a, or set of, relation(s)
          dispatch({
            type: "SET_SOURCE_SPAN",
            payload: {
              textId: textId,
              span: span,
            },
          });
          break;
        case "UNSET_SOURCE":
          // User clicks on source to unfocus - unsets source, target and related spans
          dispatch({ type: "REMOVE_SOURCE_TARGET_RELS" });
          break;
        default:
          break;
      }
    };

    const hideSpan =
      !state.entityAnnotationMode && state.currentTextSelected !== textId;

    return (
      <>
        <SpanComponent
          key={token.index}
          suggested={suggested ? 1 : 0}
          position={spanLabelPos}
          labelcolor={labelColor}
          onMouseDown={(e) =>
            !disabled && handlePopoverOpen(e, span.state === "source")
          }
          onClick={() => !disabled && handleMouseDown(textId, span)}
          source={span.state && span.state === "source" ? 1 : 0}
          selectingtext={state.selectModeActive ? 1 : 0}
          unrelated={span.state && span.state === "unrelated" ? 1 : 0}
          fadeout={hideSpan ? 1 : 0}
          disabled={disabled ? 1 : 0}
          title={disabled && "Unsave dataset item to access relation actions"}
        >
          {(span.state === "related" || span.state === "target") &&
            relationLabelChips(state.relations, textId, span)}
          {span.name}
        </SpanComponent>
        <Popover
          id="relation-span-mouse-over-popover"
          open={open}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          onClose={handlePopoverClose}
          disableRestoreFocus
          elevation={0}
          PaperProps={{
            sx: {
              border: "1px solid",
              borderColor: alpha(labelColor, 0.6125),
            },
          }}
        >
          <RelationPopover
            textId={textId}
            handleRelationPopoverClose={handleRelationPopoverClose}
          />
        </Popover>
      </>
    );
  } else {
    return null;
  }
};

export default Span;
