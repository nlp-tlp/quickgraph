import React from "react";
import Span from "./Span";

/**
 * SpanStack component creates a stack of spans from markup.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.state - Application state.
 * @param {Function} props.dispatch - Function to dispatch actions.
 * @param {string} props.textId - The ID of the text containing the spans.
 * @param {Object} props.token - The token object with index and value.
 * @param {Array} props.entitySpans - Array of entity spans.
 * @returns {React.Element} - The rendered span stack.
 */
const SpanStack = ({
  state,
  dispatch,
  textId,
  token,
  entitySpans,
  disabled,
}) => {
  // Sort the entity spans by length (longer spans on top) and filter relevant spans for the token
  const sortedEntitySpans = entitySpans
    .slice()
    .sort((a, b) => b.end - b.start - (a.end - a.start))
    .filter((span) => span.start <= token.index && token.index <= span.end);

  // Map the sorted and filtered entity spans to Span components
  const spanComponents = sortedEntitySpans.map((span) => (
    <Span
      state={state}
      dispatch={dispatch}
      textId={textId}
      token={token}
      span={span}
      suggested={span.suggested}
      key={span.id}
      disabled={disabled}
    />
  ));

  return <>{spanComponents}</>;
};

export default SpanStack;
